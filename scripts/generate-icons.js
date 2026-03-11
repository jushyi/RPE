/**
 * Generate app icon PNGs for RPE app.
 * Design: Bold geometric dumbbell (magenta #ec4899) on dark (#0a0a0a) background.
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');

const MAGENTA = '#ec4899';
const DARK = '#0a0a0a';
const WHITE = '#ffffff';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');

/**
 * Create SVG of a geometric dumbbell.
 * Design: two circles connected by a thick bar, centered in viewBox.
 */
function dumbbellSvg({ size, color, bgColor, bgOpacity = 1, padding = 0.2 }) {
  const vb = size;
  const pad = vb * padding;
  const usable = vb - pad * 2;

  // Dumbbell geometry: two end plates (circles) + connecting bar
  const cy = vb / 2;
  const plateRadius = usable * 0.18;
  const barHalfLen = usable * 0.35;
  const barThickness = plateRadius * 0.55;

  const leftCx = vb / 2 - barHalfLen;
  const rightCx = vb / 2 + barHalfLen;

  const bgRect = bgOpacity > 0
    ? `<rect width="${vb}" height="${vb}" fill="${bgColor}" opacity="${bgOpacity}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vb}" height="${vb}" viewBox="0 0 ${vb} ${vb}">
  ${bgRect}
  <!-- Bar -->
  <rect x="${leftCx}" y="${cy - barThickness / 2}" width="${rightCx - leftCx}" height="${barThickness}" rx="${barThickness / 4}" fill="${color}"/>
  <!-- Left plate outer -->
  <circle cx="${leftCx}" cy="${cy}" r="${plateRadius}" fill="${color}"/>
  <!-- Left plate inner -->
  <circle cx="${leftCx}" cy="${cy}" r="${plateRadius * 0.45}" fill="${bgOpacity > 0 ? bgColor : 'black'}" opacity="${bgOpacity > 0 ? 1 : 0.3}"/>
  <!-- Right plate outer -->
  <circle cx="${rightCx}" cy="${cy}" r="${plateRadius}" fill="${color}"/>
  <!-- Right plate inner -->
  <circle cx="${rightCx}" cy="${cy}" r="${plateRadius * 0.45}" fill="${bgOpacity > 0 ? bgColor : 'black'}" opacity="${bgOpacity > 0 ? 1 : 0.3}"/>
</svg>`;
}

async function generate() {
  // 1. icon.png - iOS (1024x1024, no transparency)
  await sharp(Buffer.from(dumbbellSvg({ size: 1024, color: MAGENTA, bgColor: DARK })))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // 2. android-icon-foreground.png (432x432, transparent bg, dumbbell in 72dp safe zone)
  // Safe zone is 66% of total (72/108), so padding ~17% each side
  await sharp(Buffer.from(dumbbellSvg({ size: 432, color: MAGENTA, bgColor: 'transparent', bgOpacity: 0, padding: 0.22 })))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-foreground.png'));
  console.log('Generated android-icon-foreground.png (432x432)');

  // 3. android-icon-background.png (432x432, solid dark)
  await sharp({
    create: { width: 432, height: 432, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } }
  })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-background.png'));
  console.log('Generated android-icon-background.png (432x432)');

  // 4. android-icon-monochrome.png (432x432, white dumbbell, transparent bg)
  await sharp(Buffer.from(dumbbellSvg({ size: 432, color: WHITE, bgColor: 'transparent', bgOpacity: 0, padding: 0.22 })))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-monochrome.png'));
  console.log('Generated android-icon-monochrome.png (432x432)');

  // 5. splash-icon.png (200x200, magenta dumbbell on transparent)
  await sharp(Buffer.from(dumbbellSvg({ size: 200, color: MAGENTA, bgColor: 'transparent', bgOpacity: 0, padding: 0.15 })))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'splash-icon.png'));
  console.log('Generated splash-icon.png (200x200)');

  // 6. favicon.png (48x48)
  await sharp(Buffer.from(dumbbellSvg({ size: 512, color: MAGENTA, bgColor: DARK, padding: 0.15 })))
    .resize(48, 48)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');

  console.log('\nAll icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
