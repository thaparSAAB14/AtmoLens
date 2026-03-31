import { Jimp } from "jimp";

type JimpImage = {
  bitmap: { width: number; height: number; data: Buffer };
  scan: (
    x: number,
    y: number,
    width: number,
    height: number,
    cb: (x: number, y: number, idx: number) => void
  ) => void;
  getBufferAsync?: (mime: string) => Promise<Buffer>;
  getBuffer: (mime: string, cb: (err: unknown, buffer: Buffer) => void) => void;
};

function getJimpRead(): (rawBytes: Buffer) => Promise<JimpImage> {
  const read = (Jimp as unknown as { read?: unknown }).read;
  if (typeof read !== "function") {
    throw new Error("Jimp.read is unavailable");
  }
  return read as (rawBytes: Buffer) => Promise<JimpImage>;
}

async function getBuffer(image: JimpImage, mime: string): Promise<Buffer> {
  if (typeof image.getBufferAsync === "function") {
    return image.getBufferAsync(mime);
  }
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
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Bit Depth Colors
    const LAND_R = 220, LAND_G = 236, LAND_B = 203; // #DCECCB
    const WATER_R = 74, WATER_G = 144, WATER_B = 226; // #4A90E2
    const FG_THRESHOLD = 100;

    image.scan(0, 0, width, height, function (x: number, y: number, idx: number) {
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const gray = (r + g + b) / 3;

        if (gray < FG_THRESHOLD) {
            return;
        }

        if (gray < 240) {
            image.bitmap.data[idx] = LAND_R;
            image.bitmap.data[idx + 1] = LAND_G;
            image.bitmap.data[idx + 2] = LAND_B;
        } else {
            image.bitmap.data[idx] = WATER_R;
            image.bitmap.data[idx + 1] = WATER_G;
            image.bitmap.data[idx + 2] = WATER_B;
        }
    });

    return await getBuffer(image, "image/png");
}

export async function convertOriginalToPng(rawBytes: Buffer): Promise<Buffer> {
    const read = getJimpRead();
    const image = await read(rawBytes);
    return await getBuffer(image, "image/png");
}
