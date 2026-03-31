import { Jimp } from "jimp";

type JimpImage = {
  bitmap: { width: number; height: number; data: Buffer };
  getBufferAsync?: (mime: string) => Promise<Buffer>;
  getBuffer: (
    mime: string,
    cb?: (err: unknown, buffer: Buffer) => void
  ) => Promise<Buffer> | Buffer | void;
};

type RGB = { r: number; g: number; b: number };

const FOREGROUND_THRESHOLD = 95;
const SURFACE_LAND: RGB = { r: 220, g: 236, b: 203 }; // #DCECCB
const SURFACE_WATER: RGB = { r: 74, g: 144, b: 226 }; // #4A90E2
const UPPER_LAND: RGB = { r: 232, g: 238, b: 228 }; // soft neutral
const UPPER_WATER: RGB = { r: 165, g: 204, b: 236 }; // softer blue for upper-air maps

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

function getJimpRead(): (rawBytes: Buffer) => Promise<JimpImage> {
  const read = (Jimp as unknown as { read?: (rawBytes: Buffer) => Promise<JimpImage> })
    .read;
  if (typeof read !== "function") {
    throw new Error("Jimp.read is unavailable");
  }
  // Jimp.read relies on `this` (e.g. `this.fromBuffer`) so we must preserve context.
  return (rawBytes: Buffer) => read.call(Jimp, rawBytes);
}

async function getBuffer(image: JimpImage, mime: string): Promise<Buffer> {
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

function isForeground(data: Buffer, offset: number): boolean {
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const gray = (r + g + b) / 3;
  return gray < FOREGROUND_THRESHOLD;
}

function buildWaterMask(data: Buffer, width: number, height: number): { mask: Uint8Array; coverage: number } {
  const totalPixels = width * height;
  const mask = new Uint8Array(totalPixels);
  const seen = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);

  const isFillable = (pixelIndex: number): boolean => {
    const offset = pixelIndex * 4;
    return !isForeground(data, offset);
  };

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

function selectPalette(mapType?: string): { land: RGB; water: RGB } {
  if (mapType?.startsWith("upper_")) {
    return { land: UPPER_LAND, water: UPPER_WATER };
  }
  return { land: SURFACE_LAND, water: SURFACE_WATER };
}

export async function processImage(rawBytes: Buffer, mapType?: string): Promise<Buffer> {
    const read = getJimpRead();
    const image = await read(rawBytes);
    const { width, height, data } = image.bitmap;
    const palette = selectPalette(mapType);
    const { mask: waterMask, coverage } = buildWaterMask(data, width, height);
    const useWaterMask = coverage >= 0.03 && coverage <= 0.9;

    for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
        const idx = pixelIndex * 4;
        if (isForeground(data, idx)) {
            continue;
        }

        const isWater = useWaterMask && waterMask[pixelIndex] === 1;
        if (isWater) {
            data[idx] = palette.water.r;
            data[idx + 1] = palette.water.g;
            data[idx + 2] = palette.water.b;
        } else {
            data[idx] = palette.land.r;
            data[idx + 1] = palette.land.g;
            data[idx + 2] = palette.land.b;
        }
    }

    return await getBuffer(image, "image/png");
}

export async function convertOriginalToPng(rawBytes: Buffer): Promise<Buffer> {
    const read = getJimpRead();
    const image = await read(rawBytes);
    return await getBuffer(image, "image/png");
}
