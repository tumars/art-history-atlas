import { artImage } from "../lib/art-image";
import { observeImages } from "../lib/image-loading";
import { $, esc, wikiSearch } from "../lib/dom";
import { state, actions, workById, imgSrc, hasImage } from "../state";
import type { Work } from "../types";
import { readingLinks } from "./readings";

/* 对照组：两件作品并排 + 差异表 */
let cur = 0;

function side(w: Work) {
  const src = hasImage(w) ? imgSrc(w, "full") : null;
  return `<div class="side"><button class="zoom" data-w="${w.id}" aria-label="放大查看《${esc(w.title)}》"><figure>${src ? `${artImage(w)}` : `<a class="look" href="${wikiSearch(w.title)}" target="_blank" rel="noopener">暂无配图 ↗</a>`}</figure></button>
    <div class="nm">《${esc(w.title)}》</div><div class="sub">${esc(w.artist)} · ${esc(w.yearText)}</div></div>`;
}

function render() {
  const list = state.t.comparisons;
  $("#pair-tabs").innerHTML = list.map((p, i) => `<button data-i="${i}" aria-pressed="${i === cur}">${esc(p.tab)}</button>`).join("");
  const p = list[cur], A = workById(p.a), B = workById(p.b);
  if (!A || !B) { $("#pair-body").innerHTML = ""; return; }
  $("#pair-body").innerHTML = `<div class="pair-imgs">${side(A)}<div class="vs">vs</div>${side(B)}</div>
    <div class="cmp-wrap"><table class="cmp"><tbody>${p.rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table></div>
    <p class="pair-sum">${esc(p.summary)}</p>${readingLinks(state.t.readings.filter(r => r.steps.some(s => s.works.includes(p.a) && s.works.includes(p.b))), "带着一个问题，再看这组作品")}`;
  observeImages($("#pair-body"));
}

export function initComparisons() {
  cur = 0;
  $("#pairs").hidden = state.t.comparisons.length === 0;
  if (!state.t.comparisons.length) return;
  $("#pair-tabs").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) { cur = +b.dataset.i!; render(); }
  };
  $("#pair-body").onclick = (e) => {
    const z = (e.target as Element).closest<HTMLButtonElement>(".zoom");
    if (z) actions.openWork(z.dataset.w!, true, [state.t.comparisons[cur].a, state.t.comparisons[cur].b]);
  };
  render();
}
