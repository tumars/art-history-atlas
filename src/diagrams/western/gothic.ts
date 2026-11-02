import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 6 哥特：剖面 */
const diagram: Diagram = {
html(){const glass=(x:number,y:number,w:number,h:number)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:url(#glassG)"/>`;
 return `<div class="dg-wrap"><svg class="dg" id="goth-svg" viewBox="0 0 560 300" role="img" aria-label="罗马式与哥特式教堂横剖面对比">
  <defs><linearGradient id="glassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B5FC4"/><stop offset=".5" stop-color="#A3283C"/><stop offset="1" stop-color="#2B5FC4"/></linearGradient>
  <marker id="gothArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-acc"/></marker></defs>
  <text x="135" y="18" text-anchor="middle" class="t-b t-l">罗马式</text><text x="420" y="18" text-anchor="middle" class="t-b t-l">哥特式</text>
  <line x1="10" y1="262" x2="270" y2="262" class="s-mut"/><line x1="290" y1="262" x2="550" y2="262" class="s-mut"/>
  <rect x="50" y="130" width="36" height="132" class="f-line s-ink"/><rect x="184" y="130" width="36" height="132" class="f-line s-ink"/>
  <path d="M50 130 A85 85 0 0 1 220 130 L184 130 A49 49 0 0 0 86 130 Z" class="f-line s-ink"/>
  ${glass(63,175,10,26)}${glass(197,175,10,26)}
  <text x="135" y="108" text-anchor="middle" class="t-s">圆拱</text><text x="40" y="250" text-anchor="end" class="t-s">厚墙</text><text x="68" y="216" text-anchor="middle" class="t-s t-m">小窗</text>
  <rect x="372" y="88" width="10" height="174" class="f-line s-ink"/><rect x="458" y="88" width="10" height="174" class="f-line s-ink"/>
  ${glass(372,110,10,100)}${glass(458,110,10,100)}
  <path d="M372 88 Q372 30 420 14 Q468 30 468 88 L458 88 Q458 42 420 28 Q382 42 382 88 Z" class="f-line s-ink"/>
  <rect x="318" y="190" width="54" height="6" class="f-line s-mut"/><rect x="468" y="190" width="54" height="6" class="f-line s-mut"/>
  <rect x="300" y="118" width="18" height="144" class="f-line s-ink"/><rect x="522" y="118" width="18" height="144" class="f-line s-ink"/>
  <path d="M318 132 Q338 98 372 96" class="s-ink" stroke-width="7"/><path d="M522 132 Q502 98 468 96" class="s-ink" stroke-width="7"/>
  <text x="420" y="10" text-anchor="middle" class="t-s">尖拱</text><text x="330" y="88" text-anchor="middle" class="t-s">飞扶壁</text><text x="420" y="160" text-anchor="middle" class="t-s">大片彩色玻璃</text><text x="420" y="176" text-anchor="middle" class="t-s t-m">（墙变薄）</text>
  <g class="opt">
   <path d="M90 118 Q72 140 68 180 L68 250" class="s-acc" stroke-width="2.5" marker-end="url(#gothArr)"/><path d="M180 118 Q198 140 202 180 L202 250" class="s-acc" stroke-width="2.5" marker-end="url(#gothArr)"/>
   <text x="135" y="282" text-anchor="middle" class="t-acc t-s t-b">推力全靠厚墙硬扛</text>
   <path d="M378 92 Q340 96 322 126 L309 132 L309 250" class="s-acc" stroke-width="2.5" marker-end="url(#gothArr)"/><path d="M462 92 Q500 96 518 126 L531 132 L531 250" class="s-acc" stroke-width="2.5" marker-end="url(#gothArr)"/>
   <text x="420" y="282" text-anchor="middle" class="t-acc t-s t-b">飞扶壁把推力送到外侧墩子</text>
  </g>
  <text x="135" y="298" text-anchor="middle" class="t-mono t-m">开窗：▮</text><text x="420" y="298" text-anchor="middle" class="t-mono t-m">开窗：▮▮▮▮▮▮</text>
  </svg></div>
  <div class="ctl">${seg("goth-mode",[["off","只看剖面"],["on","显示推力"]],"off")}</div>`},
init(r){bindSeg(r,"goth-mode",v=>q(r,"#goth-svg").classList.toggle("show",v==="on"))}};

export default diagram;
