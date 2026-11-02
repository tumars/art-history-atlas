import { $, esc } from "../lib/dom";
import { state, actions, allWorksOrdered, periodVar, periodOf, imgSrc, hasImage } from "../state";

/* 作品墙：全部作品按时期排列 */
const pretty = (t: string) => (t.length > 9 ? t.slice(0, 8) + "…" : t);

export function initWall() {
  const t = state.t;
  $("#wall-legend").innerHTML = t.meta.groups.map((g, i) => `<span style="--g:var(--g${i + 1})"><i></i>${esc(g.name)}</span>`).join("");
  $("#wall-grid").innerHTML = allWorksOrdered().map((w) => {
    const src = hasImage(w) ? imgSrc(w, "thumb") : null;
    return `<button data-w="${w.id}" style="--g:${periodVar(w.period)}"><span class="ph">${src ? `<img src="${src}" alt="《${esc(w.title)}》" loading="lazy">` : esc(w.title[0])}</span><span class="cap">${esc(pretty(w.title))}<small>${esc(periodOf(w.period).short)} · ${esc(w.yearText.replace("约", ""))}</small></span></button>`;
  }).join("");
  $("#wall-grid").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) actions.openWork(b.dataset.w!, true);
  };
}
