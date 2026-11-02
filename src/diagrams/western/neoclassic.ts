import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 13 新古典：构图骨架 */
const diagram: Diagram = {
html(){const bro=(x:number)=>`<g class="s-ink" stroke-width="5" stroke-linecap="round"><line x1="${x-24}" y1="236" x2="${x}" y2="176"/><line x1="${x}" y1="176" x2="${x+30}" y2="236"/><line x1="${x}" y1="176" x2="${x+16}" y2="116"/><line x1="${x+14}" y1="124" x2="${x+112-(x-90)*.6}" y2="112"/></g><circle cx="${x+20}" cy="102" r="11" class="f-panel s-ink" stroke-width="3"/>`;
 return `<div class="dg-wrap"><svg class="dg" id="hor-svg" viewBox="0 0 560 270" role="img" aria-label="荷拉斯兄弟之誓构图示意：直线与曲线">
  ${[[40,200],[220,360],[380,540]].map(([a,b])=>`<path d="M${a} 250 L${a} 80 A${(b-a)/2} ${(b-a)/2} 0 0 1 ${b} 80 L${b} 250" class="s-line" stroke-width="2"/>`).join("")}
  <line x1="20" y1="250" x2="540" y2="250" class="s-mut"/>
  ${bro(90)}${bro(118)}${bro(146)}
  <g class="s-ink" stroke-width="5" stroke-linecap="round"><line x1="290" y1="112" x2="290" y2="196"/><line x1="290" y1="196" x2="276" y2="246"/><line x1="290" y1="196" x2="306" y2="246"/><line x1="290" y1="120" x2="284" y2="96"/></g>
  <circle cx="290" cy="98" r="11" class="f-panel s-ink" stroke-width="3"/>
  <g class="s-ink" stroke-width="2.5"><line x1="284" y1="96" x2="262" y2="56"/><line x1="284" y1="96" x2="284" y2="50"/><line x1="284" y1="96" x2="306" y2="56"/></g>
  <g class="s-ink" stroke-width="5" stroke-linecap="round" fill="none"><path d="M392 246 Q378 200 402 170 Q420 150 414 128"/><path d="M432 246 Q426 206 446 184 Q462 166 452 148"/><path d="M482 246 Q500 210 486 186 Q476 170 492 152"/></g>
  <circle cx="410" cy="120" r="11" class="f-panel s-ink" stroke-width="3"/><circle cx="446" cy="142" r="11" class="f-panel s-ink" stroke-width="3"/><circle cx="498" cy="146" r="11" class="f-panel s-ink" stroke-width="3"/>
  <g class="opt">
   <line x1="40" y1="262" x2="134" y2="136" class="s-acc" stroke-width="3" stroke-dasharray="7 4"/><line x1="96" y1="262" x2="190" y2="136" class="s-acc" stroke-width="3" stroke-dasharray="7 4"/>
   <line x1="80" y1="112" x2="260" y2="112" class="s-acc" stroke-width="3" stroke-dasharray="7 4"/>
   <path d="M380 260 Q366 196 402 160 Q430 132 400 100" style="stroke:var(--g5);fill:none" stroke-width="3" stroke-dasharray="7 4"/><path d="M500 260 Q520 200 492 170" style="stroke:var(--g5);fill:none" stroke-width="3" stroke-dasharray="7 4"/>
   <text x="60" y="34" class="t-acc t-b">直线 = 男性 · 意志 · 国家</text><text x="360" y="34" class="t-b" style="fill:var(--g5)">曲线 = 女性 · 悲伤 · 家庭</text>
  </g>
  <text x="130" y="72" text-anchor="middle" class="t-s t-m">拱门 1</text><text x="290" y="72" text-anchor="middle" class="t-s t-m">拱门 2</text><text x="460" y="72" text-anchor="middle" class="t-s t-m">拱门 3</text>
  </svg></div>
  <div class="ctl">${seg("hor-mode",[["off","只看人物"],["on","显示骨架"]],"off")}</div>`},
init(r){bindSeg(r,"hor-mode",v=>q(r,"#hor-svg").classList.toggle("show",v==="on"))}};

export default diagram;
