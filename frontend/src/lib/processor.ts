import { Jimp } from "jimp";
import path from "path";
import fs from "fs";

type JimpImage = {
  bitmap: { width: number; height: number; data: Buffer };
  resize: (options: { w: number; h: number }) => void;
  getBufferAsync?: (mime: "image/png") => Promise<Buffer>;
  getBuffer: (
    mime: "image/png",
    cb?: (err: unknown, buffer: Buffer) => void
  ) => Promise<Buffer> | Buffer | void;
};

type RGB = { r: number; g: number; b: number };

const SURFACE_LAND: RGB = { r: 220, g: 236, b: 203 }; // #DCECCB
const SURFACE_WATER: RGB = { r: 74, g: 144, b: 226 }; // #4A90E2
const UPPER_LAND: RGB = { r: 232, g: 238, b: 228 }; // soft neutral
const UPPER_WATER: RGB = { r: 165, g: 204, b: 236 }; // softer blue for upper-air maps
const FOREGROUND_INK: RGB = { r: 23, g: 27, b: 35 };

const OCEAN_SEED_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0.08, 0.62], // Pacific
  [0.16, 0.28], // North Pacific / Arctic edge
  [0.30, 0.80], // South Pacific edge
  [0.52, 0.42], // Hudson Bay
  [0.74, 0.56], // Atlantic
  [0.84, 0.32], // North Atlantic
  [0.90, 0.72], // Atlantic lower edge
  [0.55, 0.12], // Arctic Ocean
];

async function getBuffer(image: JimpImage, mime: "image/png"): Promise<Buffer> {
  if (typeof image.getBufferAsync === "function") {
    return image.getBufferAsync(mime);
  }

  // Jimp v1.x `getBuffer()` returns a Promise<Buffer>.
  const direct = image.getBuffer(mime);
  if (Buffer.isBuffer(direct)) return direct;
  if (direct && typeof (direct as Promise<Buffer>).then === "function") {
    return await (direct as Promise<Buffer>);
  }

  // Fallback for callback-style implementations.
  return await new Promise<Buffer>((resolve, reject) => {
    image.getBuffer(mime, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

function toGray(data: Buffer): Uint8Array {
  const gray = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = ((data[i] + data[i + 1] + data[i + 2]) / 3) | 0;
  }
  return gray;
}

function computeOtsuThreshold(gray: Uint8Array): number {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < gray.length; i += 1) histogram[gray[i]] += 1;

  const total = gray.length;
  let weightedSum = 0;
  for (let i = 0; i < 256; i += 1) weightedSum += i * histogram[i];

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let maxVariance = -1;
  let threshold = 96;

  for (let i = 0; i < 256; i += 1) {
    backgroundWeight += histogram[i];
    if (backgroundWeight === 0) continue;
    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += i * histogram[i];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (weightedSum - backgroundSum) / foregroundWeight;
    const betweenClassVariance =
      backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) * (backgroundMean - foregroundMean);

    if (betweenClassVariance > maxVariance) {
      maxVariance = betweenClassVariance;
      threshold = i;
    }
  }

  return Math.max(70, Math.min(140, threshold));
}

function buildForegroundMask(gray: Uint8Array, threshold: number): Uint8Array {
  const mask = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i += 1) {
    mask[i] = gray[i] <= threshold ? 1 : 0;
  }
  return mask;
}

function refineForegroundMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const refined = new Uint8Array(mask);
  const neighborOffsets = [
    -width - 1,
    -width,
    -width + 1,
    -1,
    1,
    width - 1,
    width,
    width + 1,
  ];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      let darkNeighbors = 0;
      for (const offset of neighborOffsets) {
        darkNeighbors += mask[idx + offset];
      }

      if (mask[idx] === 1 && darkNeighbors <= 1) {
        refined[idx] = 0;
      } else if (mask[idx] === 0 && darkNeighbors >= 6) {
        refined[idx] = 1;
      }
    }
  }
  return refined;
}

function buildWaterMask(foregroundMask: Uint8Array, width: number, height: number): { mask: Uint8Array; coverage: number } {
  const totalPixels = width * height;
  const mask = new Uint8Array(totalPixels);
  const seen = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);

  const isFillable = (pixelIndex: number): boolean => foregroundMask[pixelIndex] === 0;

  let head = 0;
  let tail = 0;

  for (const [rx, ry] of OCEAN_SEED_POINTS) {
    const x = Math.max(0, Math.min(width - 1, Math.round(rx * (width - 1))));
    const y = Math.max(0, Math.min(height - 1, Math.round(ry * (height - 1))));
    const pixelIndex = y * width + x;
    if (!seen[pixelIndex] && isFillable(pixelIndex)) {
      seen[pixelIndex] = 1;
      queue[tail++] = pixelIndex;
    }
  }

  while (head < tail) {
    const pixelIndex = queue[head++];
    mask[pixelIndex] = 1;

    const y = (pixelIndex / width) | 0;
    const x = pixelIndex - y * width;
    const left = pixelIndex - 1;
    const right = pixelIndex + 1;
    const up = pixelIndex - width;
    const down = pixelIndex + width;

    if (x > 0 && !seen[left] && isFillable(left)) {
      seen[left] = 1;
      queue[tail++] = left;
    }
    if (x < width - 1 && !seen[right] && isFillable(right)) {
      seen[right] = 1;
      queue[tail++] = right;
    }
    if (y > 0 && !seen[up] && isFillable(up)) {
      seen[up] = 1;
      queue[tail++] = up;
    }
    if (y < height - 1 && !seen[down] && isFillable(down)) {
      seen[down] = 1;
      queue[tail++] = down;
    }
  }

  let waterPixels = 0;
  for (let i = 0; i < totalPixels; i += 1) {
    if (mask[i]) waterPixels += 1;
  }
  return { mask, coverage: waterPixels / totalPixels };
}

function hasForegroundNeighbor(foregroundMask: Uint8Array, width: number, height: number, pixelIndex: number): boolean {
  const y = (pixelIndex / width) | 0;
  const x = pixelIndex - y * width;
  if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) return false;

  const neighbors = [
    pixelIndex - width - 1,
    pixelIndex - width,
    pixelIndex - width + 1,
    pixelIndex - 1,
    pixelIndex + 1,
    pixelIndex + width - 1,
    pixelIndex + width,
    pixelIndex + width + 1,
  ];
  for (const n of neighbors) {
    if (foregroundMask[n] === 1) return true;
  }
  return false;
}

function selectPalette(mapType?: string): { land: RGB; water: RGB } {
  if (mapType?.startsWith("upper_")) {
    return { land: UPPER_LAND, water: UPPER_WATER };
  }
  return { land: SURFACE_LAND, water: SURFACE_WATER };
}

function applyTone(pixelData: Buffer, offset: number, tone: RGB, darken: boolean): void {
  const multiplier = darken ? 0.9 : 1;
  pixelData[offset] = Math.round(tone.r * multiplier);
  pixelData[offset + 1] = Math.round(tone.g * multiplier);
  pixelData[offset + 2] = Math.round(tone.b * multiplier);
  pixelData[offset + 3] = 255; // Fix opacity channel explicitly
}

// ── Overlay cache: avoid reading PNGs from disk on every invocation ──────────
const overlayCache = new Map<string, JimpImage>();

async function loadOverlay(fileName: string, targetW: number, targetH: number): Promise<JimpImage | null> {
  const cacheKey = `${fileName}:${targetW}x${targetH}`;
  const cached = overlayCache.get(cacheKey);
  if (cached) return cached;

  const overlayPath = path.join(process.cwd(), "src", "assets", fileName);
  if (!fs.existsSync(overlayPath)) return null;

  const overlay = await Jimp.read(overlayPath) as unknown as JimpImage;
  if (overlay.bitmap.width !== targetW || overlay.bitmap.height !== targetH) {
    overlay.resize({ w: targetW, h: targetH });
  }
  overlayCache.set(cacheKey, overlay);
  return overlay;
}

// ── Foreground density classification ────────────────────────────────────────
// Classifies each foreground pixel by local density to distinguish:
//   3 = dense cluster (text labels, H/L markers)
//   2 = medium-density line (isobars, fronts)
//   1 = thin/isolated line
function classifyForeground(
  foregroundMask: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const classification = new Uint8Array(foregroundMask.length);
  const neighborOffsets = [
    -width - 1, -width, -width + 1,
    -1, 1,
    width - 1, width, width + 1,
  ];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      if (foregroundMask[idx] !== 1) continue;

      let neighbors = 0;
      for (const off of neighborOffsets) {
        neighbors += foregroundMask[idx + off];
      }

      if (neighbors >= 5) {
        classification[idx] = 3; // dense cluster
      } else if (neighbors >= 3) {
        classification[idx] = 2; // medium line
      } else {
        classification[idx] = 1; // thin line
      }
    }
  }
  return classification;
}

// ── Pressure system (H/L) detection via connected component labeling ─────────
// Finds compact foreground clusters characteristic of H and L markers.
// Returns a map: pixelIndex → 'H' | 'L' | null
function detectPressureSystems(
  foregroundMask: Uint8Array,
  classification: Uint8Array,
  width: number,
  height: number
): Map<number, "H" | "L"> {
  const result = new Map<number, "H" | "L">();
  const visited = new Uint8Array(foregroundMask.length);
  const totalPixels = width * height;
  const mapCenterY = height * 0.5;

  for (let idx = 0; idx < totalPixels; idx += 1) {
    if (foregroundMask[idx] !== 1 || visited[idx] || classification[idx] < 3) continue;

    // BFS to find connected dense cluster
    const component: number[] = [];
    const bfsQueue: number[] = [idx];
    visited[idx] = 1;
    let sumX = 0, sumY = 0;

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!;
      component.push(current);
      const cy = (current / width) | 0;
      const cx = current - cy * width;
      sumX += cx;
      sumY += cy;

      // Check 4-connected neighbors
      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const n of neighbors) {
        if (n >= 0 && n < totalPixels && !visited[n] && foregroundMask[n] === 1 && classification[n] >= 2) {
          visited[n] = 1;
          bfsQueue.push(n);
        }
      }

      // Limit cluster scan to prevent runaway on huge connected regions
      if (component.length > 150) break;
    }

    // H/L markers are typically compact clusters of ~10-120 foreground pixels
    const size = component.length;
    if (size < 8 || size > 120) continue;

    // Check compactness: bounding box should be roughly square-ish
    const centroidY = sumY / size;
    const avgX = sumX / size;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (const p of component) {
      const py = (p / width) | 0;
      const px = p - py * width;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    const bboxW = maxX - minX + 1;
    const bboxH = maxY - minY + 1;
    const aspect = Math.max(bboxW, bboxH) / Math.max(1, Math.min(bboxW, bboxH));

    // H/L markers are compact (aspect < 2.5) and small (bbox < 30px)
    if (aspect > 2.5 || bboxW > 35 || bboxH > 35) continue;

    // Check density within bounding box — H/L chars are dense
    const bboxArea = bboxW * bboxH;
    const fillRatio = size / bboxArea;
    if (fillRatio < 0.25) continue;

    // Classify as H (high pressure) or L (low pressure) based on position heuristics.
    // In ECCC charts, H and L are distributed across the map. We use a simple heuristic:
    // the char shape itself doesn't tell us which letter it is from pixel data alone,
    // so we alternate based on whether the cluster is in a higher or lower pressure zone.
    // Clusters in the upper half of the map tend to be in Arctic highs.
    const isUpper = centroidY < mapCenterY;
    // Edge-of-map clusters are more likely H (high pressure ridges at edges)
    const isEdge = avgX < width * 0.15 || avgX > width * 0.85;
    const label: "H" | "L" = (isUpper || isEdge) ? "H" : "L";

    for (const p of component) {
      result.set(p, label);
    }
  }

  return result;
}

// ── Ink palette for multi-tone foreground ────────────────────────────────────
const INK_DENSE: RGB = { r: 40, g: 44, b: 52 };         // slightly lighter for label text
const INK_MEDIUM: RGB = { r: 23, g: 27, b: 35 };        // crisp dark for isobars
const INK_THIN: RGB = { r: 50, g: 55, b: 65 };           // softer for thin lines
const INK_HIGH_PRESSURE: RGB = { r: 192, g: 57, b: 43 }; // red for H markers
const INK_LOW_PRESSURE: RGB = { r: 41, g: 128, b: 185 }; // blue for L markers

export async function processImage(rawBytes: Buffer, mapType?: string): Promise<Buffer> {
  const image = await Jimp.read(rawBytes);
  const { width, height, data } = image.bitmap;
  const palette = selectPalette(mapType);

  // Step 1: derive adaptive foreground threshold from luminance distribution.
  const gray = toGray(data);
  const threshold = computeOtsuThreshold(gray);

  // Step 2: isolate and stabilize meteorological linework.
  const initialForeground = buildForegroundMask(gray, threshold);
  const foregroundMask = refineForegroundMask(initialForeground, width, height);

  // Step 3: classify foreground by density and detect pressure systems.
  const fgClassification = classifyForeground(foregroundMask, width, height);
  const pressureSystems = detectPressureSystems(foregroundMask, fgClassification, width, height);

  // Step 4: Check if surface or upper-air map, prep overlay buffer (cached)
  let overlay: JimpImage | null = null;
  const isSurfaceCanada = mapType?.startsWith("surface_") && !mapType?.startsWith("surface_hem_");
  const isSurfaceHem = mapType?.startsWith("surface_hem_");
  const isUpperOverlayTarget = ["upper_250hpa", "upper_500hpa", "upper_700hpa", "upper_850hpa"].includes(mapType || "");
  
  if (isSurfaceCanada) {
      overlay = await loadOverlay("overlay.png", width, height);
  } else if (isSurfaceHem) {
      overlay = await loadOverlay("northamerica_covergae.png", width, height);
  } else if (mapType === "upper_850hpa") {
      overlay = await loadOverlay("850_overlay.png", width, height);
  } else if (isUpperOverlayTarget) {
      overlay = await loadOverlay("upper_overlay_scaled.png", width, height);

      // Fallback to non-scaled version if scaled is missing
      if (!overlay) {
          overlay = await loadOverlay("upper_overlay.png", width, height);
      }
  }

  // Step 5: infer ocean regions using seeded flood fill on non-foreground pixels (only needed if NOT using overlay).
  let waterMask: Uint8Array | null = null;
  let useWaterMask = false;
  if (!overlay) {
    const { mask, coverage } = buildWaterMask(foregroundMask, width, height);
    waterMask = mask;
    useWaterMask = coverage >= 0.03 && coverage <= 0.9;
  }

  // Step 6: apply palette or overlay with multi-tone foreground styling.
  const totalPixels = width * height;
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const offset = pixelIndex * 4;
    
    // ── Foreground ink: multi-tone rendering ──────────────────────────────
    if (foregroundMask[pixelIndex] === 1) {
      // Check for pressure system markers first
      const pressureLabel = pressureSystems.get(pixelIndex);
      let ink: RGB;
      if (pressureLabel === "H") {
        ink = INK_HIGH_PRESSURE;
      } else if (pressureLabel === "L") {
        ink = INK_LOW_PRESSURE;
      } else {
        // Classify by density
        const cls = fgClassification[pixelIndex];
        ink = cls === 3 ? INK_DENSE : cls === 2 ? INK_MEDIUM : INK_THIN;
      }

      data[offset] = ink.r;
      data[offset + 1] = ink.g;
      data[offset + 2] = ink.b;
      data[offset + 3] = 255;
      continue;
    }

    // ── Background rendering ─────────────────────────────────────────────
    if (overlay) {
        // Pixel replacement from overlay — respect overlay alpha channel
        const alpha = overlay.bitmap.data[offset + 3];
        if (alpha > 0) {
            data[offset] = overlay.bitmap.data[offset];
            data[offset + 1] = overlay.bitmap.data[offset + 1];
            data[offset + 2] = overlay.bitmap.data[offset + 2];
            data[offset + 3] = alpha;
        }
        // If overlay pixel is fully transparent, keep the original source pixel
    } else {
        // Procedural coloration for fallback
        const nearLine = hasForegroundNeighbor(foregroundMask, width, height, pixelIndex);
        const isWater = useWaterMask && waterMask !== null && waterMask[pixelIndex] === 1;
        applyTone(data, offset, isWater ? palette.water : palette.land, nearLine);
    }
  }

  return await getBuffer(image, "image/png");
}
