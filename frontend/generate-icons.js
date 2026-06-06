const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src/app/(public)/logo.png');
const publicDir = path.join(__dirname, 'public');
const brandDir = path.join(publicDir, 'brand');

async function generateIcons() {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir);

  // Copy original logo
  fs.copyFileSync(inputPath, path.join(brandDir, 'logo.png'));

  // 1. Favicons
  await sharp(inputPath).resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(inputPath).resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(path.join(publicDir, 'favicon-32x32.png'));
  // Save a 32x32 png as .ico
  await sharp(inputPath).resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(path.join(publicDir, 'favicon.ico'));

  // 2. Apple Touch Icon
  await sharp(inputPath)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }) // Apple icons are usually opaque
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. Android Chrome Icons
  await sharp(inputPath).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  await sharp(inputPath).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(path.join(publicDir, 'android-chrome-512x512.png'));

  // 4. Open Graph Image (1200x630)
  // We place the logo in the center of a 1200x630 canvas
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for OG
    }
  })
  .composite([
    {
      input: await sharp(inputPath).resize(600, 600, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer(),
      gravity: 'center'
    }
  ])
  .toFile(path.join(publicDir, 'og-image.png'));

  // 5. Manifest.json
  const manifest = {
    "name": "جمعية الصداقة والتعاون",
    "short_name": "Sadaqah",
    "description": "منصة احترافية لدعم التعاون والصداقة اليمنية التركية، المبادرات المجتمعية، الحملات، والمشاريع الإنسانية.",
    "icons": [
      {
        "src": "/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "theme_color": "#4f46e5",
    "background_color": "#ffffff",
    "display": "standalone"
  };

  fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log("All icons and manifest generated successfully!");
}

generateIcons().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
