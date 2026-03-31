import { Jimp } from "jimp";

type JimpImage = {
  bitmap: { width: number; height: number; data: Buffer };
  getBufferAsync?: (mime: string) => Promise<Buffer>;
  getBuffer: (
    mime: string,
    cb?: (err: unknown, buffer: Buffer) => void
  ) => Promise<Buffer> | Buffer | void;
};

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

export async function processImage(rawBytes: Buffer): Promise<Buffer> {
    const read = getJimpRead();
    const image = await read(rawBytes);
    
    // Bit Depth Colors
    const LAND_R = 220, LAND_G = 236, LAND_B = 203; // #DCECCB
    const WATER_R = 74, WATER_G = 144, WATER_B = 226; // #4A90E2
    const FG_THRESHOLD = 100;

    const data = image.bitmap.data;
    for (let idx = 0; idx < data.length; idx += 4) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const gray = (r + g + b) / 3;

        if (gray < FG_THRESHOLD) {
            continue;
        }

        if (gray < 240) {
            data[idx] = LAND_R;
            data[idx + 1] = LAND_G;
            data[idx + 2] = LAND_B;
        } else {
            data[idx] = WATER_R;
            data[idx + 1] = WATER_G;
            data[idx + 2] = WATER_B;
        }
    }

    return await getBuffer(image, "image/png");
}

export async function convertOriginalToPng(rawBytes: Buffer): Promise<Buffer> {
    const read = getJimpRead();
    const image = await read(rawBytes);
    return await getBuffer(image, "image/png");
}
