async function testFetch() {
  const url = "https://weather.gc.ca/data/analysis/jac00_100.gif";
  console.log("Fetching: " + url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AtmoLens/3.x (+https://vercel.com)",
      }
    });
    console.log("Status: " + res.status);
    console.log("Content-Type: " + res.headers.get("content-type"));
    const arrayBuffer = await res.arrayBuffer();
    console.log("Size: " + arrayBuffer.byteLength);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
testFetch();
