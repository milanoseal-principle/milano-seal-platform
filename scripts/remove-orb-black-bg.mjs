import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const INPUT  = "public/brand/milano-seal-orb-v2.png";
const OUTPUT = "public/brand/milano-seal-orb-v2.png";

const { data, info } = await sharp(INPUT)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info; // channels = 4 (RGBA)
const pixels = new Uint8Array(data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  // Luminance-weighted brightness — gold channels weight more
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  // "Goldness" — how much amber/gold vs flat grey/black
  const goldness = (r - b) + (g - b) * 0.5;

  if (brightness < 18 && goldness < 8) {
    // Pure black — fully transparent
    pixels[i + 3] = 0;
  } else if (brightness < 40 && goldness < 16) {
    // Near-black — feather alpha
    const alpha = Math.round(((brightness - 18) / 22) * 180);
    pixels[i + 3] = Math.max(0, alpha);
  } else if (brightness < 65 && goldness < 20) {
    // Dark background fringe — partial alpha for smooth edge
    const alpha = Math.round(((brightness - 40) / 25) * 220 + 35);
    pixels[i + 3] = Math.min(255, alpha);
  }
  // Everything brighter / more gold: leave alpha at 255 (fully opaque)
}

await sharp(pixels, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

// Verify corner pixels
const verify = await sharp(OUTPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const vd = new Uint8Array(verify.data);
const w4 = width * 4;
const tlA = vd[3];
const trA = vd[(width - 1) * 4 + 3];
const blA = vd[(height - 1) * w4 + 3];
const brA = vd[(height - 1) * w4 + (width - 1) * 4 + 3];

const { hasAlpha } = await sharp(OUTPUT).metadata().then(m => m);

console.log("ORB_ALPHA_CHECK:");
console.log(`hasAlpha: ${hasAlpha ?? true}`);
console.log(`topLeftAlpha: ${tlA}`);
console.log(`topRightAlpha: ${trA}`);
console.log(`bottomLeftAlpha: ${blA}`);
console.log(`bottomRightAlpha: ${brA}`);
console.log(`size: ${width}x${height}`);
console.log("DONE");
