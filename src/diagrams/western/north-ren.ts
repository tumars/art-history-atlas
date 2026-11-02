import type { Diagram } from "../types";
import { q, mixHex } from "../helpers";

/* 10 北方：油画罩染 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 240" role="img" aria-label="油画罩染层与光线反射示意"><g id="gl-g"></g></svg></div>
  <div class="ctl"><label for="d-gl">罩染层数</label><input type="range" id="d-gl" min="0" max="6" step="1" value="3"><span class="val" id="gl-val"></span></div>
  <div class="duo"><div><h4>蛋彩</h4><dl><dt>干燥</dt><dd>几分钟，很快</dd><dt>质感</dt><dd>不透明，偏哑光</dd><dt>过渡</dt><dd>只能用细线排出明暗</dd></dl></div>
  <div><h4>油彩</h4><dl><dt>干燥</dt><dd>很慢，可反复修改</dd><dt>质感</dt><dd>可透明，层层罩染</dd><dt>过渡</dt><dd>能做出极细腻的渐变和光泽</dd></dl></div></div>`},
init(r){const s=q(r,"#d-gl"),g=q(r,"#gl-g");
  const up=()=>{const n=+s.value;let a=`<defs><marker id="glArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" style="fill:#E0A82E"/></marker></defs>`;
    a+=`<rect x="40" y="196" width="240" height="18" style="fill:#F6F6F2;stroke:#B9B9B0"/><text x="290" y="210" class="t-s">白色底层</text><rect x="40" y="214" width="240" height="12" style="fill:#8A6A44"/><text x="290" y="226" class="t-s t-m">木板</text>`;
    for(let i=0;i<n;i++)a+=`<rect x="40" y="${182-i*14}" width="240" height="14" style="fill:#1F3FA8;opacity:.32;stroke:#1F3FA8;stroke-opacity:.5"/>`;
    if(n)a+=`<text x="290" y="${196-n*7}" class="t-s">${n} 层透明颜色</text>`;
    const top=196-n*14;a+=`<line x1="70" y1="20" x2="130" y2="194" style="stroke:#E0A82E" stroke-width="3" marker-end="url(#glArr)"/><line x1="134" y1="194" x2="200" y2="${Math.max(20,top-60)}" style="stroke:${mixHex("#E0A82E","#1F3FA8",Math.min(1,n/6))}" stroke-width="3" marker-end="url(#glArr)"/>`;
    a+=`<text x="40" y="16" class="t-s t-m">光进来</text><text x="200" y="${Math.max(14,top-66)}" class="t-s t-m">穿过颜色、被白底反射回来</text>`;
    let col="#F6F6F2";for(let i=0;i<n;i++)col=mixHex(col,"#1F3FA8",.32);
    a+=`<rect x="400" y="40" width="130" height="150" rx="4" style="fill:${col};stroke:var(--line)"/><text x="465" y="208" text-anchor="middle" class="t-s">看到的颜色</text>`;
    if(n>=3)a+=`<ellipse cx="440" cy="80" rx="18" ry="10" style="fill:#FFFFFF;opacity:${.12+n*.04}"/>`;
    g.innerHTML=a;q(r,"#gl-val").textContent=n+" 层";};s.oninput=up;up();}};

export default diagram;
