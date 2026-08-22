// One-off script, not part of the build — regenerates the favicon set from
// the logo source. Run manually if the logo ever changes:
//   node scripts/generate-favicons.mjs
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFile } from 'node:fs/promises';

const source = 'public/images/logo/icon.png';

const sizes = {
  'public/favicon-16x16.png': 16,
  'public/favicon-32x32.png': 32,
  'public/apple-touch-icon.png': 180,
};

for (const [out, size] of Object.entries(sizes)) {
  await sharp(source).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}

const icoBuffer = await pngToIco(['public/favicon-16x16.png', 'public/favicon-32x32.png']);
await writeFile('public/favicon.ico', icoBuffer);
console.log('wrote public/favicon.ico');
