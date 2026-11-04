import type { Diagram } from "../types";
import { seg, bindSeg } from "../helpers";

/* 12 洛可可：风格指纹 */
const diagram: Diagram = {
html(){const box=(name:string,sw:string[],motif:string,rows:[string,string][])=>`<div><h4>${name}</h4><div class="swatches">${sw.map(c=>`<span style="background:${c}"></span>`).join("")}</div>
  <svg class="dg" viewBox="0 0 240 70" style="min-width:0" role="img" aria-label="${name}的典型线条">${motif}</svg><dl class="roc-context" hidden>${rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl></div>`;
 return `<div class="duo" style="margin-top:0">${box("巴洛克（约1600–1750）",["#3B1F14","#7A1E1E","#B8862B","#1E1A17","#D9C29A"],
   `<path d="M10 60 L70 12 L120 58 L180 10 L230 55" class="s-ink" stroke-width="5" stroke-linejoin="round"/><path d="M10 40 L230 40" class="s-mut" stroke-dasharray="3 4"/>`,
   [["线条","斜向组织与动态曲线"],["光","常强调明暗与焦点"],["场所","教堂、宫廷，也有私人收藏"],["尺幅","从小画到大型整体装饰"],["情绪","震撼、神圣、权力"],["代表","卡拉瓦乔、贝尼尼、鲁本斯"]])}
  ${box("洛可可（约1720–1780）",["#F2C6C2","#BFD8E6","#CFE3C8","#F5E6B8","#E9D6E8"],
   `<path d="M10 45 C40 5 70 65 100 30 S 150 0 170 35 S 205 60 222 30 C230 18 220 8 210 14 C202 20 210 30 218 26" class="s-ink" stroke-width="2.5"/><path d="M40 62 q10 -14 20 0 q10 -14 20 0 q10 -14 20 0" class="s-mut" stroke-width="1.5"/>`,
   [["线条","常见S形、贝壳与不对称纹样"],["光","常见浅色与柔和光色"],["场所","沙龙、宫殿，也见于教堂"],["尺幅","室内陈设到大型装饰"],["情绪","轻快、调情、享乐"],["代表","华托、布歇、弗拉戈纳尔"]])}</div><div class="ctl">${seg("roc-mode",[["look","先看色彩与线条"],["context","再看用途与语境"]],"look")}</div><p class="info-box">色板与线条是比较提示，不是给所有作品分类的检测表。</p>`},
init(r){bindSeg(r,"roc-mode",v=>r.querySelectorAll<HTMLElement>(".roc-context").forEach(el=>el.hidden=v!=="context"))}};

export default diagram;
