import type { Diagram } from "../types";
import { q } from "../helpers";

/* 8 盛期：晕涂法 */
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 270" role="img" aria-label="晕涂法：轮廓逐渐模糊的示意">
  <defs><filter id="sfu" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur id="sfu-b" stdDeviation="0"/></filter>
  <radialGradient id="faceG" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#E8C9A0"/><stop offset=".7" stop-color="#B98A5C"/><stop offset="1" stop-color="#5E4128"/></radialGradient></defs>
  <rect x="150" y="10" width="260" height="250" style="fill:#3C3A2A" rx="4"/>
  <g filter="url(#sfu)">
   <ellipse cx="280" cy="135" rx="78" ry="100" style="fill:url(#faceG);stroke:#2A1C10" stroke-width="2"/>
   <path d="M228 112 Q246 102 262 112 Q246 118 228 112 Z M298 112 Q314 102 332 112 Q314 118 298 112 Z" style="fill:#3A2616"/>
   <path d="M280 120 L272 160 Q280 166 288 160" style="fill:none;stroke:#6E4A2C" stroke-width="2"/>
   <path d="M252 186 Q280 198 308 186" style="fill:none;stroke:#5A2E20" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="opt"><circle cx="252" cy="186" r="13" class="s-acc" stroke-dasharray="3 3" stroke-width="1.5"/><circle cx="308" cy="186" r="13" class="s-acc" stroke-dasharray="3 3" stroke-width="1.5"/><circle cx="229" cy="112" r="11" class="s-acc" stroke-dasharray="3 3" stroke-width="1.5"/>
   <text x="430" y="190" class="t-acc t-b">嘴角、眼角</text><text x="430" y="208" class="t-acc t-s">最模糊的地方</text><text x="430" y="224" class="t-acc t-s">表情因此“说不清”</text></g>
  <text x="20" y="40" class="t-b" id="sfu-t1"></text><text x="20" y="60" class="t-s t-m" id="sfu-t2"></text>
  </svg></div>
  <div class="ctl"><label for="d-sfu">清晰轮廓</label><input type="range" id="d-sfu" min="0" max="100" value="0"><label for="d-sfu">晕涂法</label></div>`},
init(r){const s=q(r,"#d-sfu"),b=q(r,"#sfu-b"),svg=q(r,"svg");
  const up=()=>{const v=+s.value;b.setAttribute("stdDeviation",(v/100*5).toFixed(2));svg.classList.toggle("show",v>45);
    q(r,"#sfu-t1").textContent=v<30?"清晰轮廓":v<70?"边缘开始化开":"晕涂法";q(r,"#sfu-t2").textContent=v<30?"如 15 世纪的蛋彩画":v<70?"明暗之间没有硬边":"达·芬奇的“烟雾”"};s.oninput=up;up();}};

export default diagram;
