import Jimp from 'jimp';

async function run() {
    try {
        console.time("Fetch");
        const res = await fetch("https://weather.gc.ca/data/analysis/jac00_100.gif");
        const arr = await res.arrayBuffer();
        const buf = Buffer.from(arr);
        console.timeEnd("Fetch");

        console.time("Jimp Read");
        // jimp compat
        const jimpReader = typeof Jimp.read === 'function' ? Jimp.read : Jimp.default.read;
        const image = await jimpReader(buf);
        console.timeEnd("Jimp Read");

        console.time("Jimp Scan");
        image.scan(0,0, image.bitmap.width, image.bitmap.height, function(x,y,idx) {
            this.bitmap.data[idx] = 0;
        });
        console.timeEnd("Jimp Scan");
    } catch (e) {
        console.error("Test Failed:", e);
    }
}
run();
