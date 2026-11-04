import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 3 希腊：姿态演变 */
const GK:Record<string,number[]>[]=[ // 古风, 古典, 希腊化
 {head:[200,40],neck:[200,62],Ls:[176,74],Rs:[224,74],Le:[170,116],Re:[230,116],Lh:[170,152],Rh:[230,152],Lp:[187,150],Rp:[213,150],Lk:[186,206],Rk:[216,206],Lf:[184,262],Rf:[218,262]},
 {head:[196,40],neck:[199,62],Ls:[176,79],Rs:[224,69],Le:[169,121],Re:[233,112],Lh:[168,156],Rh:[240,146],Lp:[187,144],Rp:[213,156],Lk:[190,203],Rk:[224,207],Lf:[192,262],Rf:[236,254]},
 {head:[220,48],neck:[210,68],Ls:[183,86],Rs:[233,66],Le:[160,112],Re:[258,40],Lh:[148,142],Rh:[272,12],Lp:[186,150],Rp:[216,160],Lk:[160,202],Rk:[242,202],Lf:[148,256],Rf:[266,252]}];
const GK_TXT=[['古风姿态','正面的躯干和较对称的姿态强调稳定；它与埃及雕像传统有关，也有自身的用途与形式。'],['古典姿态','一腿承重、一腿放松，肩线和胯线反向倾斜，使站姿形成对立式平衡。'],['希腊化姿态','身体扭转，四肢向外伸展，加强动作与情绪。这是常见探索之一，并非当时所有雕像的共同姿势。']];
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 290" role="img" aria-label="希腊雕像姿态从古风到希腊化的演变">
  <g id="gk-fig"></g>
  <text x="340" y="60" class="t-b t-l" id="gk-stage"></text>
  <text x="340" y="96" class="t-s" style="fill:var(--accent)">━ 肩线</text><text x="400" y="96" class="t-s" style="fill:var(--g5)">━ 胯线</text>
  <g id="gk-tilt"></g>
  </svg></div>
  <div class="ctl">${seg("gk-mode",[["0","古风姿态"],["1","古典姿态"],["2","希腊化姿态"]],"1")}</div>
  <div class="info-box" id="gk-cap"></div>`},
init(r){const fig=q(r,"#gk-fig");
  const ext=(a:number[],b:number[],e:number)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return[a[0]-dx/l*e,a[1]-dy/l*e,b[0]+dx/l*e,b[1]+dy/l*e]};
  const up=(k:number)=>{const P=GK[k];
    const pl=(...ks:string[])=>ks.map(k=>P[k].join(",")).join(" ");
    const sh=ext(P.Ls,P.Rs,30),hp=ext(P.Lp,P.Rp,34);
    const mid=[(P.Lp[0]+P.Rp[0])/2,(P.Lp[1]+P.Rp[1])/2];
    fig.innerHTML=`<polygon points="${pl("Ls","Rs","Rp","Lp")}" class="f-wall s-mut" stroke-width="1.5"/>
      <g class="s-ink" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pl("Ls","Le","Lh")}"/><polyline points="${pl("Rs","Re","Rh")}"/><polyline points="${pl("Lp","Lk","Lf")}"/><polyline points="${pl("Rp","Rk","Rf")}"/><line x1="${P.neck[0]}" y1="${P.neck[1]}" x2="${mid[0]}" y2="${mid[1]-8}" stroke-width="3"/></g>
      <circle cx="${P.head[0]}" cy="${P.head[1]}" r="16" class="f-panel s-ink" stroke-width="3"/>
      <line x1="${sh[0]}" y1="${sh[1]}" x2="${sh[2]}" y2="${sh[3]}" style="stroke:var(--accent)" stroke-width="3" stroke-dasharray="6 4"/>
      <line x1="${hp[0]}" y1="${hp[1]}" x2="${hp[2]}" y2="${hp[3]}" style="stroke:var(--g5)" stroke-width="3" stroke-dasharray="6 4"/>`;
    q(r,"#gk-stage").textContent=GK_TXT[k][0];q(r,"#gk-cap").textContent=GK_TXT[k][1];
    const ang=(a:string[])=>Math.round(Math.atan2(P[a[1]][1]-P[a[0]][1],P[a[1]][0]-P[a[0]][0])*180/Math.PI);
    q(r,"#gk-tilt").innerHTML=`<text x="340" y="130" class="t-mono t-m">肩线倾角 ${ang(["Ls","Rs"])}°</text><text x="340" y="150" class="t-mono t-m">胯线倾角 ${ang(["Lp","Rp"])}°</text>`;
  };bindSeg(r,"gk-mode",v=>up(+v));up(1);}};

export default diagram;
