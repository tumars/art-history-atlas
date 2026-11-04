import type { Diagram } from "../types";
import { q, seg, bindSeg } from "../helpers";

/* 2 埃及：正面律 */
const diagram: Diagram = {
html(){
  const lab=(x1:number,y1:number,x2:number,y2:number,t:string)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="s-mut"/><circle cx="${x1}" cy="${y1}" r="2.5" class="f-acc"/><text x="${x2+4}" y="${y2+4}" class="t-b">${t}</text>`;
  const legs=`<g style="stroke:#B5683A" stroke-width="9" stroke-linecap="round"><line x1="132" y1="178" x2="120" y2="238"/><line x1="152" y1="178" x2="170" y2="238"/></g>
    <path d="M112 236 L136 236 L136 246 L112 246 Z M162 236 L190 236 L190 246 L162 246 Z" style="fill:#B5683A"/>`;
  const head=`<circle cx="140" cy="50" r="18" style="fill:#B5683A"/><path d="M156 47 L166 54 L156 58 Z" style="fill:#B5683A"/><path d="M122 54 Q118 26 146 30 Q132 34 134 66 Z" style="fill:#1F1B18"/>`;
  return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 270" role="img" aria-label="埃及正面律人像拆解">
  <g id="eg-known">${head}
    <path d="M139 47 Q145 41 152 47 Q145 52 139 47 Z" style="fill:#F2EFE6;stroke:#1F1B18" stroke-width="1.2"/><circle cx="145.5" cy="47" r="2.3" style="fill:#1F1B18"/>
    <rect x="134" y="66" width="12" height="10" style="fill:#B5683A"/>
    <path d="M106 76 L174 76 L166 94 L114 94 Z" style="fill:#B5683A"/>
    <path d="M114 94 L166 94 L156 150 L126 150 Z" style="fill:#B5683A"/>
    <g style="stroke:#B5683A" stroke-width="8" stroke-linecap="round"><line x1="110" y1="82" x2="104" y2="150"/><line x1="170" y1="82" x2="176" y2="150"/></g>
    <path d="M122 150 L160 150 L166 180 L118 180 Z" style="fill:#F2EFE6;stroke:#C9C3B4"/>${legs}
    ${lab(160,40,210,26,"头：侧面")}${lab(152,47,210,58,"眼睛：正面")}${lab(172,80,210,90,"肩膀：正面")}${lab(148,170,210,170,"腰胯：侧转")}${lab(188,241,210,240,"脚：侧面")}
  </g>
  <g id="eg-seen" style="display:none">${head}
    <path d="M147 44 L154 47 L147 50 Z" style="fill:#1F1B18"/>
    <rect x="134" y="66" width="12" height="10" style="fill:#B5683A"/>
    <path d="M128 76 L156 76 L154 94 L130 94 Z" style="fill:#B5683A"/>
    <path d="M130 94 L154 94 L152 150 L132 150 Z" style="fill:#B5683A"/>
    <line x1="144" y1="82" x2="150" y2="150" style="stroke:#B5683A" stroke-width="8" stroke-linecap="round"/>
    <path d="M128 150 L158 150 L162 180 L124 180 Z" style="fill:#F2EFE6;stroke:#C9C3B4"/>${legs}
    <text x="210" y="70" class="t-b">单一侧视角的示意：</text><text x="210" y="90" class="t-m">肩膀变窄，</text><text x="210" y="108" class="t-m">只见一侧的手臂。</text><text x="210" y="134" class="t-m">部分特征被遮住。</text>
  </g>
  <line x1="330" y1="20" x2="330" y2="250" class="s-line" stroke-dasharray="3 4"/>
  <text x="350" y="30" class="t-b">等级比例：按地位定大小</text>
  ${([["法老",385,150],["官员",455,100],["仆人",515,62]] as [string,number,number][]).map(([n,x,h])=>`<g style="fill:var(--g1)"><circle cx="${x}" cy="${240-h-h*.13}" r="${h*.12}"/><rect x="${x-h*.15}" y="${240-h}" width="${h*.3}" height="${h}" rx="${h*.08}"/></g><text x="${x}" y="262" text-anchor="middle" class="t-s">${n}</text>`).join("")}
  <line x1="350" y1="240" x2="545" y2="240" class="s-mut"/>
  </svg></div>
  <div class="ctl">${seg("eg-mode",[["known","组合视角"],["seen","单一侧视角"]],"known")}</div>`},
init(r){bindSeg(r,"eg-mode",v=>{q(r,"#eg-known").style.display=v==="known"?"":"none";q(r,"#eg-seen").style.display=v==="seen"?"":"none"})}};

export default diagram;
