import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
];

async function generateIcons() {
  console.log('Generating PWA icons from SVG...\n');

  // Read the base SVG (using icon-512.svg as template)
  const svgPath = join(process.cwd(), 'public', 'icon-512.svg');
  let svgContent = readFileSync(svgPath, 'utf-8');

  for (const { size, filename } of sizes) {
    try {
      // Update SVG size
      const updatedSvg = svgContent
        .replace(/width="\d+"/, `width="${size}"`)
        .replace(/height="\d+"/, `height="${size}"`)
        .replace(/font-size="\d+"/, `font-size="${Math.round(size * 0.375)}"`);

      // Convert SVG to PNG with solid background
      const pngBuffer = await sharp(Buffer.from(updatedSvg))
        .resize(size, size)
        .png()
        .toBuffer();

      const outputPath = join(process.cwd(), 'public', filename);
      writeFileSync(outputPath, pngBuffer);

      console.log(`✅ Created ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error creating ${filename}:`, error);
    }
  }

  console.log('\n✨ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
