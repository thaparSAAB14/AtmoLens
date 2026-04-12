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

  // Step 3: Check if surface map, prep overlay buffer
  let overlay: JimpImage | null = null;
  const isSurface = mapType?.startsWith("surface_");
  
  if (isSurface) {
      const overlayPath = path.join(process.cwd(), "src", "assets", "overlay.png");
      if (fs.existsSync(overlayPath)) {
          overlay = await Jimp.read(overlayPath);
          if (overlay.bitmap.width !== width || overlay.bitmap.height !== height) {
              overlay.resize({ w: width, h: height });
          }
      }
  }

  // Step 4: infer ocean regions using seeded flood fill on non-foreground pixels (only needed if NOT using overlay).
  const { mask: waterMask, coverage } = buildWaterMask(foregroundMask, width, height);
  const useWaterMask = !overlay && coverage >= 0.03 && coverage <= 0.9;

  // Step 5: apply palette or overlay while preserving foreground readability.
  const totalPixels = width * height;
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const offset = pixelIndex * 4;
    
    // Always preserve exact foreground linework
    if (foregroundMask[pixelIndex] === 1) {
      data[offset] = FOREGROUND_INK.r;
      data[offset + 1] = FOREGROUND_INK.g;
      data[offset + 2] = FOREGROUND_INK.b;
      data[offset + 3] = 255;
      continue;
    }

    if (overlay) {
        // Pixel replacement from overlay
        data[offset] = overlay.bitmap.data[offset];
        data[offset + 1] = overlay.bitmap.data[offset + 1];
        data[offset + 2] = overlay.bitmap.data[offset + 2];
        const alpha = overlay.bitmap.data[offset + 3];
        data[offset + 3] = alpha === 0 ? 255 : alpha; // ensure opacity
    } else {
        // Procedural coloration for upper-air maps or fallback
        const nearLine = hasForegroundNeighbor(foregroundMask, width, height, pixelIndex);
        const isWater = useWaterMask && waterMask[pixelIndex] === 1;
        applyTone(data, offset, isWater ? palette.water : palette.land, nearLine);
    }
  }

  return await getBuffer(image, "image/png");
}

export async function convertOriginalToPng(rawBytes: Buffer): Promise<Buffer> {
    const image = await Jimp.read(rawBytes);
    return await getBuffer(image, "image/png");
}
