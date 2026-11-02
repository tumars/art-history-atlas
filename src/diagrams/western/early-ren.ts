import type { Diagram } from "../types";
import { q, clamp, dragOn } from "../helpers";

/* 7 早期文艺复兴：线性透视 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" id="pv-svg" viewBox="0 0 560 300" role="img" aria-label="可拖动消失点的线性透视演示"><g id="pv-g"></g></svg></div>`},
init(r){const svg=q(r,"#pv-svg"),g=q(r,"#pv-g");let vp=[280,120];const B=300;
  const P=(x:number,z:number,h=0)=>[vp[0]+(x-vp[0])/(1+z),vp[1]+(B-vp[1])/(1+z)-(h||0)/(1+z)];
  const box=(x0:number,x1:number,z0:number,z1:number,h:number,cls:string)=>{const f=[P(x0,z0),P(x1,z0),P(x1,z0,h),P(x0,z0,h)],b=[P(x0,z1),P(x1,z1),P(x1,z1,h),P(x0,z1,h)];
    const poly=(pts:number[][],c:string)=>`<polygon points="${pts.map(p=>p.join(",")).join(" ")}" class="${c}" stroke-width="1.5"/>`;let s="";
    s+=poly([f[3],f[2],b[2],b[3]],"f-panel s-ink");
    if(vp[0]<x0)s+=poly([f[0],f[3],b[3],b[0]],"f-line s-ink");if(vp[0]>x1)s+=poly([f[1],f[2],b[2],b[1]],"f-line s-ink");
    s+=poly(f,cls+" s-ink");return s};
  const draw=()=>{let s=`<rect width="560" height="300" class="f-panel"/><rect y="${vp[1]}" width="560" height="${B-vp[1]}" class="f-wall"/>`;
    for(let x=-560;x<=1120;x+=56)s+=`<line x1="${x}" y1="${B}" x2="${vp[0]}" y2="${vp[1]}" class="s-line"/>`;
    [0,.25,.6,1.05,1.7,2.6,4,6.5,11].forEach(z=>{const y=vp[1]+(B-vp[1])/(1+z);s+=`<line x1="0" y1="${y}" x2="560" y2="${y}" class="s-line"/>`});
    s+=`<line x1="0" y1="${vp[1]}" x2="560" y2="${vp[1]}" class="s-mut" stroke-dasharray="5 4"/><text x="8" y="${vp[1]-6}" class="t-s t-m">视平线</text>`;
    s+=box(120,230,.5,1.3,150,"f-acc-soft")+box(360,450,1.4,2.2,90,"f-acc-soft");
    [[60,B],[500,B]].forEach(p=>{s+=`<line x1="${p[0]}" y1="${p[1]}" x2="${vp[0]}" y2="${vp[1]}" style="stroke:var(--bad)" stroke-width="1.5" stroke-dasharray="4 3"/>`});
    s+=`<text x="40" y="292" class="t-s" style="fill:var(--bad)">正交线</text>`;
    s+=`<circle cx="${vp[0]}" cy="${vp[1]}" r="9" style="fill:var(--bad);stroke:var(--panel)" stroke-width="3"/><text x="${vp[0]+14}" y="${vp[1]-10}" class="t-b">消失点</text>`;
    g.innerHTML=s.replace(/f-acc-soft/g,"f-panel");};
  dragOn(svg,p=>{vp=[clamp(p.x,30,530),clamp(p.y,50,230)];draw()});draw();}};

export default diagram;
