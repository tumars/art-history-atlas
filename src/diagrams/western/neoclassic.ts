import type { Diagram } from '../types';
import { q, seg, bindSeg } from '../helpers';
import { artworkOverlay } from '../artwork';

const diagram: Diagram = {
  html() {
    return `${artworkOverlay('oath-of-the-horatii', `
      <g data-overlay="hands" hidden><path d="M25 49 L44 41 M29 48 L44 43 M53 49 L46 40"/><circle cx="46" cy="39" r="4"/></g>
      <g data-overlay="postures" hidden><path d="M9 92 L21 63 L37 93 M25 48 L44 41 M87 59 Q82 71 72 75 Q67 80 63 89 M91 62 Q97 68 94 80 L94 93"/></g>`)}
      <div class="ctl">${seg('hor-mode', [['off','完整原画'],['hands','手与剑的汇聚'],['postures','挺直与垂落']], 'off')}</div>
      <p class="info-box" id="hor-note" aria-live="polite">先看原画：你第一眼落在父亲手里的剑，还是前伸的手臂？</p>`;
  },
  init(r) {
    const notes: Record<string,string> = {off:'回到原画，看看辅助线没有覆盖的光、衣褶与人物目光。',hands:'兄弟们的手臂与父亲举剑的动作把注意集中在誓言上，亮出的手与剑也加强了这个焦点。',postures:'左侧分开的双腿与前伸的手臂形成紧张的支撑；右侧低头、弯身的人物把节奏压低，呈现另一种情绪。'};
    bindSeg(r,'hor-mode',v=>{r.querySelectorAll<SVGElement>('[data-overlay]').forEach(g=>g.toggleAttribute('hidden', g.dataset.overlay !== v));q(r,'#hor-note').textContent=notes[v];});
  }
};
export default diagram;
