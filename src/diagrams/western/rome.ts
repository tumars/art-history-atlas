import type { Diagram } from '../types';
import { q, seg, bindSeg } from '../helpers';

const diagram: Diagram = {
  html(){return `<div class="dg-wrap"><svg class="dg" id="rome-svg" viewBox="0 0 560 285" role="img" aria-label="梁的弯曲与拱的压力传递，比较拱的侧向支承条件">
    <defs><marker id="romeArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-acc"/></marker></defs>
    <text x="140" y="20" text-anchor="middle" class="t-b t-l">梁：弯曲与拉压</text><text x="420" y="20" text-anchor="middle" class="t-b t-l">拱：压力与侧推</text>
    <path d="M50 120 L50 235 M230 120 L230 235" class="s-mut" stroke-width="20"/>
    <rect x="35" y="102" width="210" height="18" class="f-line s-ink"/>
    <path d="M140 50 L140 94" class="s-acc" stroke-width="3" marker-end="url(#romeArr)"/>
    <path d="M65 100 Q140 111 215 100 M65 122 Q140 133 215 122" class="s-acc" stroke-width="2" stroke-dasharray="5 3"/>
    <text x="140" y="165" text-anchor="middle" class="t-b">上部受压 · 下部受拉</text>
    <text x="140" y="187" text-anchor="middle" class="t-s t-m">虚线夸张显示弯曲趋势</text>
    <g id="rome-arch"></g>
    <line x1="15" y1="238" x2="545" y2="238" class="s-mut"/>
    <text x="280" y="268" text-anchor="middle" class="t-s t-m">示意荷载路径，不表示承载极限或工程计算</text>
    </svg></div><div class="ctl">${seg('rome-support',[['firm','拱脚有可靠支承'],['weak','拱脚支承不足']],'firm')}</div><p class="info-box" id="rome-note" aria-live="polite"></p>`;},
  init(r){const g=q(r,'#rome-arch');const draw=(weak:boolean)=>{
    let s='';const cx=420,cy=168,ri=65,ro=85;
    for(let i=0;i<9;i++){const a=Math.PI-i*Math.PI/9,b=Math.PI-(i+1)*Math.PI/9;const p=(rad:number,ang:number)=>[cx+rad*Math.cos(ang),cy-rad*Math.sin(ang)].join(',');s+=`<polygon points="${p(ri,a)} ${p(ro,a)} ${p(ro,b)} ${p(ri,b)}" class="${i===4?'f-acc':'f-line'} s-ink" stroke-width="1"/>`;}
    s+=`<rect x="${weak?320:335}" y="168" width="20" height="70" class="f-line s-mut"/><rect x="${weak?500:485}" y="168" width="20" height="70" class="f-line s-mut"/>
      <path d="M420 42 L420 76 M400 107 Q355 119 345 163 M440 107 Q485 119 495 163 M345 178 L${weak?309:322} 178 M495 178 L${weak?531:518} 178" class="s-acc" stroke-width="2.5" marker-end="url(#romeArr)"/>
      <text x="420" y="204" text-anchor="middle" class="${weak?'t-bad':'t-ok'} t-b">${weak?'支承外移，稳定条件被破坏':'两侧支承抵住外推'}</text>`;
    g.innerHTML=s;q(r,'#rome-note').textContent=weak?'拱脚若向外移动，砌块之间可能失去原有的受压接触，拱会变形甚至坍塌。这里显示条件变化，不模拟坍塌过程。':'拱的优势在于让砌块主要受压；可靠的墩墙与地基同时约束两端。梁与拱都有各自适用的材料、跨度和支承条件。';
  };bindSeg(r,'rome-support',v=>draw(v==='weak'));draw(false);}
};
export default diagram;
