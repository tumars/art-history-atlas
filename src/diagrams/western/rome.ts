import type { Diagram } from "../types";
import { q } from "../helpers";

/* 4 罗马：梁柱 vs 拱券 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 260" role="img" aria-label="跨度增大时石梁断裂而拱券稳定">
  <defs><marker id="romeArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-acc"/></marker></defs>
  <text x="140" y="20" text-anchor="middle" class="t-b t-l">希腊：梁柱</text><text x="420" y="20" text-anchor="middle" class="t-b t-l">罗马：拱券</text>
  <line x1="10" y1="222" x2="270" y2="222" class="s-mut"/><line x1="290" y1="222" x2="550" y2="222" class="s-mut"/>
  <g id="rome-g"></g></svg></div>
  <div class="ctl"><label for="d-span">跨度</label><input type="range" id="d-span" min="2" max="8" step=".1" value="3"><span class="val" id="span-val"></span></div>`},
init(r){const s=q(r,"#d-span"),g=q(r,"#rome-g");
  const up=()=>{const v=+s.value,h=v*13,c1=140,c2=420;let a="";
    a+=`<rect x="${c1-h-14}" y="102" width="14" height="120" class="f-line s-mut"/><rect x="${c1+h}" y="102" width="14" height="120" class="f-line s-mut"/>`;
    if(v<=4.6){a+=`<rect x="${c1-h-20}" y="88" width="${2*h+40}" height="14" class="f-line s-ink" stroke-width="1.5"/><text x="${c1}" y="72" text-anchor="middle" class="t-ok t-s">跨度小，石梁撑得住</text>`}
    else{const sag=(v-4.6)*7;a+=`<path d="M${c1-h-20} 88 L${c1-3} ${88+sag} L${c1-3} ${102+sag} L${c1-h-20} 102 Z" class="f-line s-ink" stroke-width="1.5"/><path d="M${c1+3} ${88+sag} L${c1+h+20} 88 L${c1+h+20} 102 L${c1+3} ${102+sag} Z" class="f-line s-ink" stroke-width="1.5"/><path d="M${c1-6} ${84+sag} l6 6 l-5 5 l6 6 l-5 5" class="s-bad" stroke-width="2.5"/><text x="${c1}" y="72" text-anchor="middle" class="t-bad t-s t-b">跨度太大，石梁从中间断裂</text>`}
    const R=h+7,ri=h-7,cy=150;a+=`<rect x="${c2-h-14}" y="${cy}" width="14" height="${222-cy}" class="f-line s-mut"/><rect x="${c2+h}" y="${cy}" width="14" height="${222-cy}" class="f-line s-mut"/>`;
    const n=9;for(let i=0;i<n;i++){const a0=Math.PI-i*Math.PI/n,a1=Math.PI-(i+1)*Math.PI/n;const P=(rad:number,ang:number)=>[c2+rad*Math.cos(ang),cy-rad*Math.sin(ang)];
      const p=[P(ri+0,a0),P(R+7,a0),P(R+7,a1),P(ri,a1)];a+=`<polygon points="${p.map(q=>q.join(",")).join(" ")}" class="${i===4?"f-acc":"f-line"} s-ink" stroke-width="1"/>`}
    a+=`<path d="M${c2-30} ${cy-R-26} Q ${c2-R+4} ${cy-R+4} ${c2-h-7} ${cy+40}" class="s-acc" stroke-width="2" marker-end="url(#romeArr)"/><path d="M${c2+30} ${cy-R-26} Q ${c2+R-4} ${cy-R+4} ${c2+h+7} ${cy+40}" class="s-acc" stroke-width="2" marker-end="url(#romeArr)"/>`;
    a+=`<text x="${c2}" y="${Math.min(cy-R-34,60)}" text-anchor="middle" class="t-ok t-s">压力沿拱传到两侧，跨度大也稳</text><text x="${c2}" y="${cy-R-2}" text-anchor="middle" class="t-s t-acc">拱心石</text>`;
    g.innerHTML=a;q(r,"#span-val").textContent="相对跨度 "+v.toFixed(1);};s.oninput=up;up();}};

export default diagram;
