import { $, esc } from "../lib/dom";
import { state, actions, allWorksOrdered, periodVar, periodOf, imgSrc, hasImage } from "../state";

/* VI 藏品：按大阶段筛选，瀑布流，点开大图（列表为当前筛选结果） */
let filter = "all";

function visible() {
  return allWorksOrdered().filter((w) => filter === "all" || periodOf(w.period).group === filter);
}

function render() {
  const t = state.t, all = allWorksOrdered();
  const count = (g: string) => all.filter((w) => periodOf(w.period).group === g).length;
  $("#wall-filters").innerHTML =
    `<button data-g="all" aria-pressed="${filter === "all"}">全部<sup>${all.length}</sup></button>` +
    t.meta.groups.map((g, i) => `<button data-g="${g.id}" aria-pressed="${filter === g.id}" style="--g:var(--g${i + 1})"><i></i>${esc(g.name)}<sup>${count(g.id)}</sup></button>`).join("");
  $("#wall-grid").innerHTML = visible().map((w) => {
    const ok = hasImage(w);
    const img = ok
      ? `<img src="${imgSrc(w, "thumb")}" srcset="${imgSrc(w, "thumb")} 320w, ${imgSrc(w, "full")} 1280w" sizes="(max-width:600px) 46vw, 280px" alt="《${esc(w.title)}》" loading="lazy" decoding="async">`
      : `<span class="ph">${esc(w.title[0])}</span>`;
    return `<button class="item" data-w="${w.id}" style="--g:${periodVar(w.period)}">${img}<span class="cap"><b>${esc(w.title)}</b><small>${esc(w.artist)} · ${esc(w.yearText.replace(/^约/, ""))}</small></span></button>`;
  }).join("");
}

export function initWall() {
  filter = "all";
  $("#wall-filters").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) { filter = b.dataset.g!; render(); }
  };
  $("#wall-grid").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".item");
    if (b) actions.openWork(b.dataset.w!, true, visible().map((w) => w.id));
  };
  render();
}
