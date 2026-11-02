import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 14 浪漫：梅杜萨之筏构图 + 线与色之争 */
const diagram: Diagram = {
html(){const bodies=[[110,212,30,8,-5],[160,206,28,8,8],[200,198,26,9,-12],[248,188,24,9,-25],[288,170,22,10,-40],[328,150,20,10,-55],[366,128,18,10,-65]];
 return `<div class="dg-wrap"><svg class="dg" id="raft-svg" viewBox="0 0 560 260" role="img" aria-label="梅杜萨之筏双金字塔构图示意">
  <rect width="560" height="260" class="f-wall"/>
  <path d="M0 214 Q40 204 80 214 T160 214 T240 214 T320 214 T400 214 T480 214 T560 214 L560 260 L0 260 Z" style="fill:#3A5560;opacity:.55"/>
  <polygon points="70,214 440,206 460,226 60,232" style="fill:#6B4E2E;stroke:#3A2A18" stroke-width="2"/>
  <line x1="170" y1="212" x2="200" y2="48" class="s-ink" stroke-width="5"/><polygon points="200,52 240,70 210,170" style="fill:#C9B48A;stroke:#7A6440"/>
  ${bodies.map(([x,y,rx,ry,rot])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" style="fill:#B8936A;stroke:#5E4128"/>`).join("")}
  <line x1="384" y1="118" x2="394" y2="70" class="s-ink" stroke-width="5" stroke-linecap="round"/><circle cx="397" cy="60" r="9" style="fill:#B8936A;stroke:#5E4128"/>
  <line x1="392" y1="80" x2="414" y2="42" class="s-ink" stroke-width="4" stroke-linecap="round"/><path d="M414 42 q12 -4 16 6 q-10 2 -16 10 Z" style="fill:#A3283C"/>
  <path d="M520 200 l14 0 l-3 5 l-9 0 Z M527 200 l0 -10" class="s-ink" stroke-width="1.5"/><text x="527" y="186" text-anchor="middle" class="t-s t-m">远处的船</text>
  <g class="opt">
   <polygon points="200,40 120,232 250,232" class="s-acc" stroke-width="2.5" stroke-dasharray="6 4"/>
   <polygon points="414,36 250,232 470,232" style="stroke:var(--g5);fill:none" stroke-width="2.5" stroke-dasharray="6 4"/>
   <path d="M90 244 L400 54" class="s-ink" stroke-width="2" marker-end="url(#raftArr)"/>
   <text x="70" y="252" class="t-b">绝望</text><text x="430" y="30" class="t-b">希望</text>
  </g>
  <defs><marker id="raftArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" class="f-ink"/></marker></defs>
  </svg></div>
  <div class="ctl">${seg("raft-mode",[["off","只看画面"],["on","显示构图"]],"off")}</div>
  <div class="duo"><div><h4>安格尔 · 新古典</h4><dl><dt>信条</dt><dd>线条至上，素描是艺术的诚实</dd><dt>偶像</dt><dd>拉斐尔</dd><dt>代表作</dt><dd>《大宫女》</dd></dl></div>
  <div><h4>德拉克洛瓦 · 浪漫</h4><dl><dt>信条</dt><dd>色彩至上，激情比轮廓重要</dd><dt>偶像</dt><dd>鲁本斯</dd><dt>代表作</dt><dd>《自由引导人民》</dd></dl></div></div>`},
init(r){bindSeg(r,"raft-mode",v=>q(r,"#raft-svg").classList.toggle("show",v==="on"))}};

export default diagram;
