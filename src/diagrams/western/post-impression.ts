import type { Diagram } from "../types";
import { q, $$ } from "../helpers";

/* 17 后印象派：四条出路 + 点彩 */
const diagram: Diagram = {
html(){const mid=([["cezanne","塞尚","找回结构 · 圆柱体、球体、圆锥体",50],["seurat","修拉","色彩科学 · 点彩",120],["vangogh","梵高","表达情感 · 笔触即情绪",190],["gauguin","高更","象征与原始 · 平涂色块",260]] as [string,string,string,number][]);
 const out=([["cezanne","立体主义",50],["seurat","色彩理论 → 抽象",120],["vangogh","表现主义",190],["gauguin","野兽派 · 原始主义",260]] as [string,string,number][]);
 return `<div class="dg-wrap"><svg class="dg" id="pi-svg" viewBox="0 0 560 300" role="img" aria-label="后印象派四位画家分别通向的现代流派">
  <rect x="10" y="130" width="96" height="40" rx="20" class="f-wall s-mut"/><text x="58" y="155" text-anchor="middle" class="t-b">印象派</text>
  ${mid.map(([k,n,d,y])=>`<g class="pi" data-k="${k}" style="cursor:pointer"><path d="M106 150 C150 150 150 ${y} 190 ${y}" class="s-line pi-l" stroke-width="2.5"/><rect x="190" y="${y-22}" width="170" height="44" rx="4" class="f-panel s-mut pi-b"/><text x="200" y="${y-3}" class="t-b">${n}</text><text x="200" y="${y+14}" class="t-s t-m">${d}</text>
   <path d="M360 ${y} L420 ${y}" class="s-line pi-l" stroke-width="2.5"/></g>`).join("")}
  ${out.map(([k,n,y])=>`<g class="pi-o" data-k="${k}"><rect x="420" y="${y-16}" width="132" height="32" rx="16" style="fill:var(--g7);opacity:.14"/><text x="486" y="${y+5}" text-anchor="middle" class="t-b t-s">${n}</text></g>`).join("")}
  <text x="250" y="295" text-anchor="middle" class="t-s t-m">1886 – 1905</text><text x="486" y="295" text-anchor="middle" class="t-s t-m">20 世纪</text>
  </svg></div>
  <div class="dg-wrap" style="margin-top:12px"><canvas id="dots" width="560" height="170" style="width:100%;max-width:640px;min-width:480px;display:block;border-radius:4px" role="img" aria-label="点彩视觉混色演示"></canvas></div>
  <div class="ctl"><label for="d-dot">点的大小</label><input type="range" id="d-dot" min="1" max="9" step=".5" value="6"><span class="val" id="dot-val"></span></div>`},
init(r){const svg=q(r,"#pi-svg");
  const hl=(k:string)=>{$$(".pi",svg).forEach(g=>{const on=g.dataset.k===k;$$(".pi-l",g).forEach(l=>{l.style.stroke=on?"var(--accent)":"";l.style.strokeWidth=on?"4":""});q(g,".pi-b").style.stroke=on?"var(--accent)":""});
    $$(".pi-o",svg).forEach(g=>q(g,"rect").style.opacity=g.dataset.k===k?.45:.14)};
  $$(".pi",svg).forEach(g=>{g.addEventListener("pointerenter",()=>hl(g.dataset.k!));g.addEventListener("click",()=>hl(g.dataset.k!))});hl("cezanne");
  const cv=q(r,"#dots"),ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1;cv.width=560*dpr;cv.height=170*dpr;ctx.scale(dpr,dpr);
  let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const draw=(sz:number)=>{seed=3;ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,560,170);const st=sz*1.6;
    for(let y=0;y<170;y+=st)for(let x=0;x<560;x+=st){const jx=x+(rnd()-.5)*st*.5,jy=y+(rnd()-.5)*st*.5,rr=rnd();let c;
      const sun=Math.hypot(jx-450,jy-40)<26;
      if(sun)c=rr<.5?"#E8341C":"#FFD21F";else if(jy<92)c=rr<.6?"#3E6FD8":"#FFFFFF";else c=rr<.5?"#2C55C8":"#F2D21E";
      ctx.fillStyle=c;ctx.beginPath();ctx.arc(jx,jy,sz*.85,0,7);ctx.fill();}
    ctx.fillStyle="rgba(0,0,0,.6)";ctx.font="12px sans-serif";ctx.fillText(sz>4?"草地＝蓝点＋黄点":"离远看：混成了绿色",12,160);};
  const s=q(r,"#d-dot");const up=()=>{draw(+s.value);q(r,"#dot-val").textContent=(+s.value).toFixed(1)+" px"};s.oninput=up;up();}};

export default diagram;
