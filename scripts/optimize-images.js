const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

async function convert(inputPath, outputPath, options = {}) {
  const { width, quality = 80 } = options;
  const transform = sharp(inputPath).webp({ quality });
  if (width) transform.resize(width, null, { withoutEnlargement: true });
  await transform.toFile(outputPath);
  const inSize = fs.statSync(inputPath).size;
  const outSize = fs.statSync(outputPath).size;
  console.log(`${path.basename(inputPath)} → ${path.basename(outputPath)}: ${(inSize/1024).toFixed(0)}KB → ${(outSize/1024).toFixed(0)}KB (${Math.round((1 - outSize/inSize)*100)}% 감소)`);
}

async function convertPngToWebP(inputPath, quality = 80) {
  const outputPath = inputPath.replace(/\.png$/i, '.webp');
  await convert(inputPath, outputPath, { quality });
}

async function main() {
  // 1. 로고 이미지 (헤더 표시용 — 최대 너비 400px로 충분)
  await convert(
    path.join(PUBLIC, 'Araon_logo.png'),
    path.join(PUBLIC, 'Araon_logo.webp'),
    { width: 400, quality: 85 }
  );
  await convert(
    path.join(PUBLIC, 'Araon_logo_W.png'),
    path.join(PUBLIC, 'Araon_logo_W.webp'),
    { width: 400, quality: 85 }
  );

  // 2. raon 캐릭터 이미지들
  const raonDir = path.join(PUBLIC, 'raon');
  const raonFiles = fs.readdirSync(raonDir).filter(f => f.endsWith('.png'));
  for (const file of raonFiles) {
    await convertPngToWebP(path.join(raonDir, file), 80);
  }

  // 3. raon_B.png (알림 아이콘 — 96x96이면 충분)
  await convert(
    path.join(PUBLIC, 'raon_B.png'),
    path.join(PUBLIC, 'raon_B.webp'),
    { width: 192, quality: 85 }
  );

  // 4. 앱 아이콘 (logo_v2_512.png → WebP, apple-touch-icon은 PNG 유지)
  await convert(
    path.join(PUBLIC, 'logo_v2_512.png'),
    path.join(PUBLIC, 'logo_v2_512.webp'),
    { quality: 85 }
  );

  console.log('\n✅ 변환 완료');
}

main().catch(console.error);
