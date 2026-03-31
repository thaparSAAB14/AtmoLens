import { processImage } from './frontend/src/lib/processor.js';
// We need to compile or run against processor directly. Just testing raw fetch time.
async function test() {
    const start = Date.now();
    const res = await fetch("https://weather.gc.ca/data/analysis/jac00_100.gif");
    const arr = await res.arrayBuffer();
    const buf = Buffer.from(arr);
    console.log(`Fetch: ${Date.now() - start}ms`);
}
test();
