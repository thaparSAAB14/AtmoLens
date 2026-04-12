import * as JimpOriginal from "jimp";
const Jimp = JimpOriginal.Jimp || JimpOriginal.default || JimpOriginal;
import path from "path";
import fs from "fs";
import https from "https";

// We'll copy some logic from processor.ts to test
function toGray(data) {
  const gray = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = ((data[i] + data[i + 1] + data[i + 2]) / 3) | 0;
  }
  return gray;
}

function computeOtsuThreshold(gray) {
  const histogram = new Array(256).fill(0);
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

function buildForegroundMask(gray, threshold) {
  const mask = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i += 1) {
    mask[i] = gray[i] <= threshold ? 1 : 0;
  }
  return mask;
}

function refineForegroundMask(mask, width, height) {
  const refined = new Uint8Array(mask);
  const neighborOffsets = [
    -width - 1, -width, -width + 1,
    -1, 1,
    width - 1, width, width + 1,
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

const FOREGROUND_INK = { r: 23, g: 27, b: 35 };

async function test() {
    console.log("Fetching sample map...");
    const sampleUrl = "https://weather.gc.ca/data/analysis/jac00_100.gif";
    
    const rawBytes = await new Promise((resolve, reject) => {
        https.get(sampleUrl, (res) => {
            const data = [];
            res.on("data", (chunk) => data.push(chunk));
            res.on("end", () => resolve(Buffer.concat(data)));
        }).on("error", reject);
    });

    const image = await Jimp.read(rawBytes);
    const { width, height, data } = image.bitmap;
    
    console.log("Reading overlay...");
    const overlayPath = path.join(process.cwd(), "src", "assets", "overlay.png");
    const overlay = await Jimp.read(overlayPath);
    overlay.resize({ w: width, h: height });

    console.log("Processing mask...");
    const gray = toGray(data);
    const threshold = computeOtsuThreshold(gray);
    const initialForeground = buildForegroundMask(gray, threshold);
    const foregroundMask = refineForegroundMask(initialForeground, width, height);

    console.log("Painting...");
    const totalPixels = width * height;
    for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
        const offset = pixelIndex * 4;
        if (foregroundMask[pixelIndex] === 1) {
            data[offset] = FOREGROUND_INK.r;
            data[offset + 1] = FOREGROUND_INK.g;
            data[offset + 2] = FOREGROUND_INK.b;
            data[offset + 3] = 255;
        } else {
            // Background -> Read from overlay
            data[offset] = overlay.bitmap.data[offset];
            data[offset+1] = overlay.bitmap.data[offset+1];
            data[offset+2] = overlay.bitmap.data[offset+2];
            data[offset+3] = overlay.bitmap.data[offset+3] === 0 ? 255 : overlay.bitmap.data[offset+3];
        }
    }

    const outPath = path.join(process.cwd(), "test-output-mask-overlay.png");
    
    // Check if Jimp.getBufferAsync is available
    if (typeof image.getBufferAsync === "function") {
         const outBuffer = await image.getBufferAsync("image/png");
         fs.writeFileSync(outPath, outBuffer);
    } else {
         const outBuffer = await new Promise((resolve, reject) => {
             image.getBuffer("image/png", (err, buf) => {
                 if(err) reject(err); else resolve(buf);
             });
         });
         fs.writeFileSync(outPath, outBuffer);
    }
    
    console.log("Done! saved to:", outPath);
}

test().catch(console.error);
