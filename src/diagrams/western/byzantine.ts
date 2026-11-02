import type { Diagram } from "../types";
import { q, clamp } from "../helpers";

/* 5 拜占庭：金色马赛克 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><canvas id="mosaic" width="560" height="240" style="width:100%;min-width:480px;display:block;border-radius:4px" role="img" aria-label="金色马赛克随烛光闪烁的模拟"></canvas></div>
  <div class="ctl"><label for="d-candle">烛光位置</label><input type="range" id="d-candle" min="0" max="100" value="30"></div>`},
init(r){const cv=q(r,"#mosaic"),ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1;cv.width=560*dpr;cv.height=240*dpr;ctx.scale(dpr,dpr);
  let seed=7;const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const tiles:{x:number;y:number;cx:number;cy:number;k:string;nx:number;ny:number}[]=[];for(let y=0;y<240;y+=10)for(let x=0;x<560;x+=10){const cx=x+5,cy=y+5,d=Math.hypot(cx-280,cy-62);let k="gold";
    if(d<22)k="face";else if(d>=30&&d<40)k="halo";else if(cy>90&&Math.abs(cx-280)<28+(cy-90)*.45)k="robe";
    tiles.push({x,y,cx,cy,k,nx:(rnd()-.5)*.9,ny:(rnd()-.5)*.9})}
  const draw=(v:number)=>{const lx=v*5.6,ly=-30;ctx.fillStyle="#17120E";ctx.fillRect(0,0,560,240);
    for(const t of tiles){const nl=Math.hypot(t.nx,t.ny,1),N=[t.nx/nl,t.ny/nl,1/nl];let L=[lx-t.cx,ly-t.cy,170];const ll=Math.hypot(...L);L=L.map(q=>q/ll);
      let H=[L[0],L[1],L[2]+1];const hl=Math.hypot(...H);H=H.map(q=>q/hl);const dif=Math.max(0,N[0]*L[0]+N[1]*L[1]+N[2]*L[2]),spec=Math.pow(Math.max(0,N[0]*H[0]+N[1]*H[1]+N[2]*H[2]),36);
      let c;if(t.k==="gold")c=`hsl(42,72%,${16+dif*30+spec*48}%)`;else if(t.k==="halo")c=`hsl(46,85%,${26+dif*30+spec*40}%)`;else if(t.k==="face")c=`hsl(26,40%,${38+dif*24}%)`;else c=`hsl(285,42%,${14+dif*18+spec*24}%)`;
      ctx.fillStyle=c;ctx.fillRect(t.x+1,t.y+1,8.4,8.4)}
    ctx.fillStyle="rgba(255,200,110,.9)";ctx.beginPath();ctx.arc(clamp(lx,6,554),8,5,0,7);ctx.fill();};
  const s=q(r,"#d-candle");s.oninput=()=>draw(+s.value);draw(+s.value);}};

export default diagram;
