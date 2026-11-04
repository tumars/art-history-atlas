import { esc } from './dom';
import { imgSrc, state } from '../state';
import type { Work } from '../types';

/** 保留原作比例，避免小图升级或图解叠线时布局跳动。 */
export function artImage(w: Work, alt = `《${w.title}》`) {
  const c = state.credits[w.id];
  if (!c) return '';
  const o = c.optimized;
  return `<img class="progressive-image" data-preview="${esc(imgSrc(w, 'thumb'))}" data-full="${esc(imgSrc(w, 'display'))}" ${o ? `width="${o.width}" height="${o.height}"` : ''} alt="${esc(alt)}" decoding="async">`;
}
