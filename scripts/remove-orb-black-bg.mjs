import sharp from "sharp";

const INPUT  = "public/brand/original-milano-seal-orb-v2.black-bg.png";
const OUTPUT = "public/brand/milano-seal-orb-v2.png";

const { data, info } = await sharp(INPUT)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  // How "gold" is this pixel: gold has high R, medium-high G, low B
  const goldness = (r - b) + Math.max(0, g - b) * 0.5;
  // How bright overall
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  // Is it a warm/amber tone vs cold grey
  const warmth = (r + g * 0.5) - b * 1.5;

  if (goldness > 35 || warmth > 40 || brightness > 90) {
    // Gold, warm, or bright pixel — keep fully opaque
    // pixels[i+3] unchanged
  } else if (brightness > 55 && goldness > 15) {
    // Mid-bright gold-ish — keep
  } else if (brightness < 75) {
    // Dark or neutral/grey — make transparent with feather
    const alpha = Math.round(Math.max(0, (brightness - 30) / 45) * 160);
    pixels[i + 3] = Math.min(pixels[i + 3], alpha);
  }
}

await sharp(pixels, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

const verify = await sharp(OUTPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const vd = new Uint8Array(verify.data);
const w4 = width * 4;

console.log("ORB_ALPHA_CHECK:");
console.log(`topLeftAlpha: ${vd[3]}`);
console.log(`topRightAlpha: ${vd[(width-1)*4+3]}`);
console.log(`bottomLeftAlpha: ${vd[(height-1)*w4+3]}`);
console.log(`bottomRightAlpha: ${vd[(height-1)*w4+(width-1)*4+3]}`);
// Sample centre pixel (should be bright gold, opaque)
const cx = Math.floor(width/2)*4;
const cy = Math.floor(height/2)*w4;
console.log(`centerAlpha: ${vd[cy+cx+3]}`);
console.log(`size: ${width}x${height}`);
console.log("DONE");
