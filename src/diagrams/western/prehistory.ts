import type { Diagram } from "../types";
import { q, $$, clamp } from "../helpers";

/* 1 史前：火光下的洞窟 */
const diagram: Diagram = {
html(){
  const quad=(x:number,y:number,k:string,l:string)=>{let head="",extra="";
    if(k==="bison"){head=`<ellipse cx="-27" cy="4" rx="8" ry="7"/><ellipse cx="-10" cy="-10" rx="13" ry="9"/>`;extra=`<path d="M-31 -2 q-6 -6 0 -11" stroke-width="2.5"/>`}
    else if(k==="horse"){head=`<ellipse cx="-33" cy="-10" rx="10" ry="5" transform="rotate(-35 -33 -10)"/><path d="M-26 -4 L-18 -9 L-17 6 Z"/>`;extra=`<path d="M-31 -17 q8 2 15 10" stroke-width="3"/>`}
    else{head=`<ellipse cx="-27" cy="-9" rx="7" ry="4.5" transform="rotate(-25 -27 -9)"/>`;extra=`<path d="M-25 -13 l-4 -16 m2 8 l-7 -5 m9 -3 l4 -10 m-2 6 l6 -4" stroke-width="2"/>`}
    return `<g class="anim" data-x="${x}" transform="translate(${x} ${y})" style="fill:#C4622D;stroke:#C4622D;opacity:.03" stroke-linecap="round"><ellipse rx="${k==="deer"?20:24}" ry="${k==="deer"?10:12}"/>${head}<g style="fill:none" stroke-width="3"><path d="M-14 8 L-16 27 M-6 9 L-6 27 M12 9 L13 27 M18 7 L22 26"/>${extra}</g><text y="46" text-anchor="middle" style="fill:#F3D9B0;stroke:none">${l}</text></g>`};
  const cave="M0 40 C120 20 240 30 330 45 S 500 40 560 55 L560 195 C 470 210 380 205 300 197 S 120 210 0 200 Z";
  return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 230" role="img" aria-label="洞窟剖面：动物壁画只在洞穴深处">
  <defs><clipPath id="caveClip"><path d="${cave}"/></clipPath>
  <radialGradient id="torchG"><stop offset="0" stop-color="#FFC66B" stop-opacity=".7"/><stop offset="1" stop-color="#FFC66B" stop-opacity="0"/></radialGradient>
  <linearGradient id="dayG" x1="0" x2="1"><stop offset="0" stop-color="#F3E3C0" stop-opacity=".85"/><stop offset="1" stop-color="#F3E3C0" stop-opacity="0"/></linearGradient></defs>
  <path d="${cave}" style="fill:#211B17"/>
  <g clip-path="url(#caveClip)"><rect width="170" height="230" fill="url(#dayG)"/><circle id="torch" cx="60" cy="118" r="100" fill="url(#torchG)"/>
  ${quad(235,100,"bison","野牛")}${quad(330,125,"horse","野马")}${quad(420,95,"deer","鹿")}${quad(505,128,"bison","野牛")}</g>
  <circle id="flame" cx="60" cy="118" r="5" style="fill:#FFB347"/>
  <text x="8" y="16" class="t-m t-s">洞口 · 有日光</text><text x="552" y="16" text-anchor="end" class="t-m t-s">深处 · 只能靠火光</text>
  <line x1="40" y1="222" x2="520" y2="222" class="s-mut" marker-end="url(#caveArr)"/><defs><marker id="caveArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-mut"/></marker></defs>
  </svg></div>
  <div class="ctl"><label for="d-torch">火把位置</label><input type="range" id="d-torch" min="0" max="100" value="4"></div>`},
init(r){const s=q(r,"#d-torch"),t=q(r,"#torch"),f=q(r,"#flame"),an=$$(".anim",r);
  const up=()=>{const x=30+s.value*5.1;t.setAttribute("cx",x);f.setAttribute("cx",x);an.forEach(a=>{a.style.opacity=String(clamp(1-Math.abs(+(a.dataset.x??0)-x)/115,.03,1))})};s.oninput=up;up();}};

export default diagram;
