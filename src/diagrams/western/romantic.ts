import type { Diagram } from '../types';
import { q, seg, bindSeg } from '../helpers';
import { artworkOverlay } from '../artwork';

const diagram: Diagram = {
  html() {
    return `${artworkOverlay('raft-of-the-medusa', `
      <g data-overlay="rise" hidden><path d="M20 85 L39 69 L52 53 L67 33 L72 16"/><circle cx="72" cy="16" r="4"/></g>
      <g data-overlay="structures" hidden><path d="M34 2 L19 67 L66 64 Z M72 9 L34 85 L92 87 Z"/></g>`)}
      <div class="ctl">${seg('raft-mode', [['off','完整原画'],['rise','人物的上升节奏'],['structures','两组斜向结构']], 'off')}</div>
      <p class="info-box" id="raft-note" aria-live="polite">前景的人物、右上的挥布者与远处的船，并不处在相同的情绪之中。</p>`;
  },
  init(r) {
    const notes:Record<string,string>={off:'关掉辅助线，再看暗海、前景身体与很小的远船：希望并没有消除危险。',rise:'倒卧、抬起、站起的人物构成上升节奏，把视线带向挥布者。这是一条可能的观看路径，不是唯一顺序。',structures:'桅杆、绳索与人体各自形成斜向轮廓。两组近似三角形互相牵引，使画面既聚拢，又不平静。'};
    bindSeg(r,'raft-mode',v=>{r.querySelectorAll<SVGElement>('[data-overlay]').forEach(g=>g.toggleAttribute('hidden', g.dataset.overlay !== v));q(r,'#raft-note').textContent=notes[v];});
  }
};
export default diagram;
