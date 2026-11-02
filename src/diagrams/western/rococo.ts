import type { Diagram } from "../types";
import {  } from "../helpers";

/* 12 洛可可：风格指纹 */
const diagram: Diagram = {
html(){const box=(name:string,sw:string[],motif:string,rows:[string,string][])=>`<div><h4>${name}</h4><div class="swatches">${sw.map(c=>`<span style="background:${c}"></span>`).join("")}</div>
  <svg class="dg" viewBox="0 0 240 70" style="min-width:0" role="img" aria-label="${name}的典型线条">${motif}</svg><dl>${rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl></div>`;
 return `<div class="duo" style="margin-top:0">${box("巴洛克（约1600–1750）",["#3B1F14","#7A1E1E","#B8862B","#1E1A17","#D9C29A"],
   `<path d="M10 60 L70 12 L120 58 L180 10 L230 55" class="s-ink" stroke-width="5" stroke-linejoin="round"/><path d="M10 40 L230 40" class="s-mut" stroke-dasharray="3 4"/>`,
   [["线条","粗重、强对角线"],["光","强烈明暗对比"],["场所","教堂、宫殿"],["尺幅","巨大"],["情绪","震撼、神圣、权力"],["代表","卡拉瓦乔、贝尼尼、鲁本斯"]])}
  ${box("洛可可（约1720–1780）",["#F2C6C2","#BFD8E6","#CFE3C8","#F5E6B8","#E9D6E8"],
   `<path d="M10 45 C40 5 70 65 100 30 S 150 0 170 35 S 205 60 222 30 C230 18 220 8 210 14 C202 20 210 30 218 26" class="s-ink" stroke-width="2.5"/><path d="M40 62 q10 -14 20 0 q10 -14 20 0 q10 -14 20 0" class="s-mut" stroke-width="1.5"/>`,
   [["线条","纤细、S 形和贝壳曲线"],["光","明亮、柔和"],["场所","贵族沙龙、闺房"],["尺幅","小巧"],["情绪","轻快、调情、享乐"],["代表","华托、布歇、弗拉戈纳尔"]])}</div>`},
init(){}};

export default diagram;
