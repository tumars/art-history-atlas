import type { Diagram } from "../types";
import { q, clamp, svgPt } from "../helpers";

/* 11 巴洛克：明暗对比 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" id="bq-svg" viewBox="0 0 560 260" role="img" aria-label="可拖动光源的明暗对比演示，以及三角形与对角线构图对比">
  <defs><radialGradient id="sphG" cx=".5" cy=".5" r=".72" fx=".3" fy=".3"><stop offset="0" stop-color="#FFE9C4"/><stop offset=".35" stop-color="#C98B4A"/><stop offset=".8" stop-color="#3A2414"/><stop offset="1" stop-color="#0E0D0C"/></radialGradient>
  <radialGradient id="beamG"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".22"/><stop offset="1" stop-color="#FFE3A0" stop-opacity="0"/></radialGradient></defs>
  <rect width="330" height="260" style="fill:#0E0D0C" rx="4"/>
  <circle id="bq-beam" cx="60" cy="40" r="170" fill="url(#beamG)"/>
  <ellipse id="bq-sh" cx="200" cy="222" rx="64" ry="10" style="fill:#000;opacity:.7"/>
  <circle id="bq-sph" cx="170" cy="150" r="62" fill="url(#sphG)"/>
  <circle id="bq-light" cx="60" cy="40" r="9" style="fill:#FFD166;stroke:#FFF3D0" stroke-width="2"/>
  <text x="12" y="250" class="t-s" style="fill:#B9A98E">拖动光源</text>
  <rect x="350" y="0" width="210" height="122" class="f-wall" rx="4"/><rect x="350" y="138" width="210" height="122" class="f-wall" rx="4"/>
  <path d="M455 22 L395 104 L515 104 Z" class="s-acc" stroke-width="2"/>${[[455,40],[420,92],[455,88],[490,92]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="9" class="f-mut"/>`).join("")}
  <text x="360" y="18" class="t-s t-b">文艺复兴：三角形，稳</text>
  <line x1="372" y1="244" x2="540" y2="156" class="s-acc" stroke-width="2" stroke-dasharray="6 4"/>${[[390,232],[430,214],[470,190],[512,170]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="9" class="f-mut"/>`).join("")}
  <text x="360" y="156" class="t-s t-b">巴洛克：对角线，动</text>
  </svg></div>`},
init(r){const svg=q(r,"#bq-svg"),G=q(r,"#sphG"),L=q(r,"#bq-light"),beam=q(r,"#bq-beam"),sh=q(r,"#bq-sh");
  const set=(p:{x:number;y:number})=>{const x=clamp(p.x,10,320),y=clamp(p.y,10,250);L.setAttribute("cx",x);L.setAttribute("cy",y);beam.setAttribute("cx",x);beam.setAttribute("cy",y);
    const dx=clamp((x-170)/150,-1,1),dy=clamp((y-150)/150,-1,1);G.setAttribute("fx",(.5+dx*.35).toFixed(3));G.setAttribute("fy",(.5+dy*.35).toFixed(3));
    sh.setAttribute("cx",170-dx*70);sh.style.opacity=.35+.4*Math.max(0,-dy)};
  svg.classList.add("drag");svg.addEventListener("pointerdown",(e:PointerEvent)=>{const p=svgPt(svg,e);if(p.x>330)return;svg.setPointerCapture(e.pointerId);set(p);
    const mv=(ev:PointerEvent)=>set(svgPt(svg,ev)),up=()=>{svg.removeEventListener("pointermove",mv);svg.removeEventListener("pointerup",up)};svg.addEventListener("pointermove",mv);svg.addEventListener("pointerup",up)});
  set({x:60,y:40});}};

export default diagram;
