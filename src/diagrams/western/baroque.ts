import type { Diagram } from "../types";
import { q, clamp, svgPt, seg, bindSeg } from "../helpers";

/* 11 巴洛克：明暗对比 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" id="bq-svg" viewBox="0 0 330 260" role="img" aria-label="光源方向与背景亮度如何影响球体的明暗对比">
  <defs><radialGradient id="sphG" cx=".5" cy=".5" r=".72" fx=".3" fy=".3"><stop offset="0" stop-color="#FFE9C4"/><stop offset=".35" stop-color="#C98B4A"/><stop offset=".8" stop-color="#3A2414"/><stop offset="1" stop-color="#0E0D0C"/></radialGradient>
  <radialGradient id="beamG"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".22"/><stop offset="1" stop-color="#FFE3A0" stop-opacity="0"/></radialGradient></defs>
  <rect id="bq-bg" width="330" height="260" style="fill:#0E0D0C" rx="4"/>
  <circle id="bq-beam" cx="60" cy="40" r="170" fill="url(#beamG)"/>
  <ellipse id="bq-sh" cx="200" cy="222" rx="64" ry="10" style="fill:#000;opacity:.7"/>
  <circle id="bq-sph" cx="170" cy="150" r="62" fill="url(#sphG)"/>
  <circle id="bq-light" cx="60" cy="40" r="9" style="fill:#FFD166;stroke:#FFF3D0" stroke-width="2"/>
  </svg></div><div class="ctl"><label for="bq-x">光源左右位置</label><input type="range" id="bq-x" min="10" max="320" value="60"></div><div class="ctl"><label for="bq-y">光源高度</label><input type="range" id="bq-y" min="10" max="250" value="220">${seg("bq-background",[["dark","暗背景"],["light","亮背景"]],"dark")}</div><p class="info-box" id="bq-note" aria-live="polite"></p>`},
init(r){const svg=q(r,"#bq-svg"),G=q(r,"#sphG"),L=q(r,"#bq-light"),beam=q(r,"#bq-beam"),sh=q(r,"#bq-sh");
  const set=(p:{x:number;y:number})=>{const x=clamp(p.x,10,320),y=clamp(p.y,10,250);L.setAttribute("cx",x);L.setAttribute("cy",y);beam.setAttribute("cx",x);beam.setAttribute("cy",y);
    const dx=clamp((x-170)/150,-1,1),dy=clamp((y-150)/150,-1,1);G.setAttribute("fx",(.5+dx*.35).toFixed(3));G.setAttribute("fy",(.5+dy*.35).toFixed(3));
    sh.setAttribute("cx",170-dx*70);sh.style.opacity=.35+.4*Math.max(0,-dy);q(r,"#bq-x").value=x;q(r,"#bq-y").value=260-y;q(r,"#bq-note").textContent=`光在${x<170?"左":"右"}${y<150?"上":"下"}方，亮部随之移动。比较受光边缘与背景的反差，投影大致朝向相反的一侧。`};
  svg.classList.add("drag");svg.addEventListener("pointerdown",(e:PointerEvent)=>{const p=svgPt(svg,e);if(p.x>330)return;svg.setPointerCapture(e.pointerId);set(p);
    const mv=(ev:PointerEvent)=>set(svgPt(svg,ev)),up=()=>{svg.removeEventListener("pointermove",mv);svg.removeEventListener("pointerup",up);svg.removeEventListener("pointercancel",up)};svg.addEventListener("pointermove",mv);svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up)});
  q(r,"#bq-x").oninput=()=>set({x:+q(r,"#bq-x").value,y:260-q(r,"#bq-y").value});q(r,"#bq-y").oninput=()=>set({x:+q(r,"#bq-x").value,y:260-q(r,"#bq-y").value});bindSeg(r,"bq-background",v=>q(r,"#bq-bg").style.fill=v==="dark"?"#0E0D0C":"#D2C4AD");
  set({x:60,y:40});}};

export default diagram;
