import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 15 现实：题材等级 */
const diagram: Diagram = {
html(){const tiers=[["历史画","宗教 · 神话 · 历史"],["肖像画","贵族与名人"],["风俗画","普通人的日常"],["风景画","自然"],["静物画","器物与花果"]];
 return `<div class="dg-wrap"><svg class="dg" id="hier-svg" viewBox="0 0 560 280" role="img" aria-label="绘画题材等级金字塔与库尔贝的挑战">
  <defs><marker id="hierArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-acc"/></marker></defs>
  ${tiers.map(([n,d],i)=>{const y=20+i*50,w=90+i*60,x=200-w/2;return `<g class="tier${i===2?" t-genre":""}"><rect x="${x}" y="${y}" width="${w}" height="44" rx="3" class="${i===0?"f-line":"f-wall"} s-mut"/><text x="200" y="${y+20}" text-anchor="middle" class="t-b">${n}</text><text x="200" y="${y+36}" text-anchor="middle" class="t-s t-m">${d}</text></g>`}).join("")}
  <text x="20" y="34" class="t-s t-m">高贵 · 大尺幅</text><text x="20" y="258" class="t-s t-m">低微 · 小尺幅</text>
  <g class="opt">
   <rect x="${200-105}" y="120" width="210" height="44" rx="3" style="fill:none;stroke:var(--accent)" stroke-width="3"/>
   <path d="M310 142 C380 142 380 42 260 42" class="s-acc" stroke-width="3" marker-end="url(#hierArr)"/>
   <text x="395" y="90" class="t-acc t-b">库尔贝《奥尔南的葬礼》</text><text x="395" y="108" class="t-s">题材：普通乡村葬礼（风俗画）</text><text x="395" y="124" class="t-s">尺寸：历史画规格</text><text x="395" y="140" class="t-mono">315 × 668 cm</text>
  </g>
  </svg></div>
  <div class="ctl">${seg("hier-mode",[["off","学院派的座次"],["on","库尔贝的挑战"]],"off")}</div>`},
init(r){bindSeg(r,"hier-mode",v=>q(r,"#hier-svg").classList.toggle("show",v==="on"))}};

export default diagram;
