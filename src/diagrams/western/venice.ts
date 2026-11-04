import type { Diagram } from "../types";
import { q } from "../helpers";

/* 9 威尼斯：素描 vs 色彩 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 240" role="img" aria-label="同一静物的素描画法与色彩画法对比">
  <defs><radialGradient id="apG" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#F06A3C"/><stop offset="1" stop-color="#7A1A0E"/></radialGradient>
  <linearGradient id="jugG" x1="0" x2="1"><stop offset="0" stop-color="#E0A458"/><stop offset=".6" stop-color="#9C5A22"/><stop offset="1" stop-color="#4A2810"/></linearGradient>
  <filter id="softF"><feGaussianBlur stdDeviation="2.2"/></filter>
  <clipPath id="jugClip"><path d="M300 70 L330 70 L326 90 Q370 110 368 160 Q366 205 315 210 Q262 205 262 160 Q260 110 304 90 Z"/></clipPath><clipPath id="apClip"><circle cx="200" cy="180" r="32"/></clipPath></defs>
  <g id="colo">
   <rect x="110" y="40" width="340" height="180" style="fill:#5E3B22;opacity:.35" filter="url(#softF)"/>
   <ellipse cx="320" cy="212" rx="70" ry="8" style="fill:#2A1A10;opacity:.5" filter="url(#softF)"/><ellipse cx="205" cy="212" rx="40" ry="6" style="fill:#2A1A10;opacity:.5" filter="url(#softF)"/>
   <path d="M300 70 L330 70 L326 90 Q370 110 368 160 Q366 205 315 210 Q262 205 262 160 Q260 110 304 90 Z" style="fill:url(#jugG)" filter="url(#softF)"/>
   <path d="M366 120 Q395 125 392 150 Q388 172 362 175" style="fill:none;stroke:#7A4420" stroke-width="8" filter="url(#softF)"/>
   <circle cx="200" cy="180" r="32" style="fill:url(#apG)" filter="url(#softF)"/>
  </g>
  <g id="dise" class="s-ink" stroke-width="2">
   <line x1="110" y1="212" x2="450" y2="212"/>
   <path d="M300 70 L330 70 L326 90 Q370 110 368 160 Q366 205 315 210 Q262 205 262 160 Q260 110 304 90 Z"/><path d="M366 120 Q395 125 392 150 Q388 172 362 175"/>
   <circle cx="200" cy="180" r="32"/><path d="M200 148 q4 -10 10 -12"/>
   <g clip-path="url(#jugClip)" stroke-width="1">${Array.from({length:14},(_,i)=>`<line x1="${330+i*6}" y1="80" x2="${300+i*6}" y2="215"/>`).join("")}</g>
   <g clip-path="url(#apClip)" stroke-width="1">${Array.from({length:8},(_,i)=>`<line x1="${208+i*5}" y1="148" x2="${190+i*5}" y2="215"/>`).join("")}</g>
  </g>
  <text x="20" y="30" class="t-b" id="ven-t"></text>
  </svg></div>
  <div class="ctl"><label for="d-ven">素描（disegno）</label><input type="range" id="d-ven" min="0" max="100" value="0"><label for="d-ven">色彩（colore）</label></div>
  <div class="lineage">
   <div class="row"><b style="color:var(--accent)">重视造型</b><span class="n">佛罗伦萨·罗马：米开朗基罗、拉斐尔</span><span class="a">·</span><span class="n">普桑</span><span class="a">·</span><span class="n">新古典：大卫、安格尔</span></div>
   <div class="row"><b style="color:var(--g5)">重视色彩</b><span class="n">威尼斯：提香</span><span class="a">·</span><span class="n">鲁本斯</span><span class="a">·</span><span class="n">浪漫主义：德拉克洛瓦</span><span class="a">·</span><span class="n">印象派</span></div>
  </div>`},
init(r){const s=q(r,"#d-ven"),c=q(r,"#colo"),d=q(r,"#dise");
  const up=()=>{const v=s.value/100;c.style.opacity=v;d.style.opacity=1-v*.95;q(r,"#ven-t").textContent=v<.35?"轮廓与排线提供体积线索":v<.65?"线与色共同组织形体":"色块的明暗提供体积线索"};s.oninput=up;up();}};

export default diagram;
