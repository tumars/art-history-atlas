import { artImage } from "../lib/art-image";
import { esc } from './helpers';
import { imgSrc, state, workById } from '../state';

/** 辅助线按原图百分比定位，图像保持完整比例；署名与原图共用同一条记录。 */
export function artworkOverlay(id: string, overlay: string) {
  const work = workById(id)!;
  const src = imgSrc(work, 'full'), credit = state.credits[id];
  if (!src || !credit) return '<p>正在载入作品图像。</p>';
  return `<figure class="diagram-original"><div class="diagram-artwork">${artImage(work, `${work.artist}《${work.title}》`)}<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${overlay}</svg></div><figcaption>《${esc(work.title)}》 · ${esc(work.artist)}<small>图上辅助线为本站分析标注 · ${esc(credit.author)} · ${esc(credit.license)} · <a href="${esc(credit.source)}" target="_blank" rel="noopener">图片来源</a></small></figcaption></figure>`;
}
