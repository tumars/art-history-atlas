/** 从本地原图生成浏览用 WebP；原图和署名保持不变。 */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const creditsPath = resolve(publicDir, 'images/credits.json');
const credits = JSON.parse(await readFile(creditsPath, 'utf8'));
await mkdir(resolve(publicDir, 'images/optimized'), { recursive: true });
let generated = 0;
for (const [id, c] of Object.entries(credits)) {
  const source = await readFile(resolve(publicDir, c.file));
  const hash = createHash('sha256').update(source).update('webp-v1-320-960-q72-82').digest('hex').slice(0, 12);
  const stem = `images/optimized/${id.replace(':', '-')}-${hash}`;
  const thumb = `${stem}.thumb.webp`, display = `${stem}.display.webp`;
  if (c.optimized?.thumb === thumb && c.optimized?.display === display) {
    try { await access(resolve(publicDir, thumb)); await access(resolve(publicDir, display)); continue; } catch { /* 补齐丢失的产物 */ }
  }
  const image = sharp(source).rotate();
  const { data, info } = await image.clone().resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  await image.clone().resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 }).toFile(resolve(publicDir, thumb));
  await writeFile(resolve(publicDir, display), data);
  c.optimized = { thumb, display, width: info.width, height: info.height };
  generated++;
}
await writeFile(creditsPath, JSON.stringify(credits, null, 2) + '\n');
console.log(`图片优化完成：${Object.keys(credits).length} 组，新增或更新 ${generated} 组。`);
