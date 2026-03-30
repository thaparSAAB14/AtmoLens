import { Jimp } from 'jimp';

export async function processImage(rawBytes: Buffer): Promise<Buffer> {
    const jimpReader = typeof Jimp.read === 'function' ? Jimp.read : (Jimp as any).read;
    const image = await jimpReader(rawBytes);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Bit Depth Colors
    const LAND_R = 220, LAND_G = 236, LAND_B = 203; // #DCECCB
    const WATER_R = 74, WATER_G = 144, WATER_B = 226; // #4A90E2
    const FG_THRESHOLD = 100;

    image.scan(0, 0, width, height, function(x: number, y: number, idx: number) {
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

    const getBuf = typeof image.getBufferAsync === 'function' 
        ? image.getBufferAsync.bind(image) 
        : image.getBuffer.bind(image);
        
    return await getBuf('image/png');
}

export async function convertOriginalToPng(rawBytes: Buffer): Promise<Buffer> {
    const jimpReader = typeof Jimp.read === 'function' ? Jimp.read : (Jimp as any).read;
    const image = await jimpReader(rawBytes);
    
    const getBuf = typeof image.getBufferAsync === 'function' 
        ? image.getBufferAsync.bind(image) 
        : image.getBuffer.bind(image);
        
    return await getBuf('image/png');
}
