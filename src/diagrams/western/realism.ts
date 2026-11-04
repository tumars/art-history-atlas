import type { Diagram } from '../types';
import { q, seg, bindSeg, esc } from '../helpers';
import { imgSrc, workById } from '../../state';

const diagram: Diagram = {
  html(){const tiers=[['历史画','宗教、神话与历史叙事'],['肖像画','人物形象'],['风俗画','日常生活'],['风景画','自然与环境'],['静物画','器物与花果']];const src=imgSrc(workById('burial-at-ornans')!,'display');
    return `<div class="dg-wrap"><svg class="dg" id="hier-svg" viewBox="0 0 560 300" role="img" aria-label="学院题材等级与奥尔南的葬礼尺寸比较">
    <text x="120" y="18" text-anchor="middle" class="t-b">学院传统中的题材次序</text>
    ${tiers.map(([n,d],i)=>`<rect x="20" y="${32+i*49}" width="205" height="43" class="${i===2?'f-panel':'f-wall'} s-mut"/><text x="32" y="${50+i*49}" class="t-b">${i+1}. ${n}</text><text x="32" y="${66+i*49}" class="t-s t-m">${d}</text>`).join('')}
    <g class="opt"><rect x="18" y="128" width="209" height="47" class="s-acc" stroke-width="3"/>
    <text x="399" y="35" text-anchor="middle" class="t-b">普通村民，接近真人尺度</text>
    ${src?`<image data-image-src="${esc(src)}" x="270" y="60" width="245" height="116" preserveAspectRatio="xMidYMid meet"/>`:''}
    <rect x="270" y="60" width="245" height="116" class="s-mut"/>
    <line x1="270" y1="190" x2="515" y2="190" class="s-acc"/><text x="392" y="211" text-anchor="middle" class="t-mono">6.68 米 × 3.15 米</text>
    <circle cx="539" cy="120" r="5" class="f-mut"/><path d="M539 125 L539 154 M530 136 L548 136 M539 154 L531 176 M539 154 L547 176" class="s-mut" stroke-width="3"/>
    <text x="400" y="240" text-anchor="middle" class="t-s">旁边的人形约 1.7 米，与画框同一比例</text>
    <text x="400" y="264" text-anchor="middle" class="t-s t-m">题材的地位 ≠ 画布尺寸的规定</text></g>
    </svg></div><div class="ctl">${seg('hier-mode',[['off','先看题材次序'],['on','库尔贝怎样挑战它']],'off')}</div><p class="info-box" id="hier-note" aria-live="polite">这是法国学院传统的概括排序，不是跨时代通用的艺术价值排名。</p>`;},
  init(r){bindSeg(r,'hier-mode',v=>{q(r,'#hier-svg').classList.toggle('show',v==='on');q(r,'#hier-note').textContent=v==='on'?'改变并不是把风俗画改名成历史画，而是让普通人的葬礼获得巨幅、庄严而不理想化的呈现。':'先留意风俗画的位置：它低于历史画和肖像画，却不是最底层。';});}
};
export default diagram;
