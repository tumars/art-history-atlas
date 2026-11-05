import { artImage } from "../lib/art-image";
import { observeImages } from "../lib/image-loading";
import { $, esc, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { fmtYear } from "../lib/format";
import { whoHtml } from "../state";
import { state, actions, allWorksOrdered, periodVar, periodOf, periodIndex, imgSrc, hasImage } from "../state";
import { creditLine, workSources } from "./hall";
import { readingLinks, readingsForWork } from "./readings";
import type { Work } from "../types";
import { registerNavigation } from "../lib/navigation";

/* VI 藏品 · 看片台：上方一件大图 + 说明牌，下方一条按时期分段的缩略图带 */
let list: Work[] = [];
let cur = 0;

function renderReel() {
  const t = state.t;
  // 概览条：每个时期一段，宽度按作品数
  $("#lt-map").innerHTML = t.periods
    .map((p) => ({ p, n: list.filter((w) => w.period === p.id).length }))
    .filter((x) => x.n)
    .map(({ p, n }) => `<button data-p="${p.id}" style="flex:${n};--g:${periodVar(p.id)}" title="${esc(p.name)} · ${n} 件"><span>${esc(p.short)}</span></button>`)
    .join("");
  $("#lt-reel").innerHTML = t.periods
    .map((p) => {
      const ws = list.map((w, i) => ({ w, i })).filter(({ w }) => w.period === p.id);
      if (!ws.length) return "";
      return `<div class="lt-grp" style="--g:${periodVar(p.id)}"><div class="lt-gname"><b>${esc(p.short)}</b><small>${fmtYear(p.start)}</small></div><div class="lt-thumbs">${ws
        .map(({ w, i }) => `<button data-i="${i}" aria-label="《${esc(w.title)}》，${esc(w.yearText)}" title="${esc(w.title)}">${hasImage(w) ? `<img src="${imgSrc(w, "thumb")}" alt="" loading="lazy" decoding="async">` : `<span>${esc(w.title[0])}</span>`}</button>`)
        .join("")}</div></div>`;
    })
    .join("");
}

function show(i: number, scrollReel = true) {
  cur = (i + list.length) % list.length;
  const w = list[cur], p = periodOf(w.period), ok = hasImage(w);
  if ($("#collection-select")) $<HTMLSelectElement>("#collection-select").value = p.id;
  const view = $("#lt-view");
  view.style.setProperty("--g", periodVar(w.period));
  view.innerHTML = `<figure class="lt-fig">${ok
      ? `<button class="lt-img" aria-label="放大查看《${esc(w.title)}》">${artImage(w)}</button>`
      : `<div class="lt-none"><b>${esc(w.title[0])}</b><span>${esc(w.noImageReason ?? "暂无对应图片。")}</span><a href="${wikiSearch(w.title)}" target="_blank" rel="noopener">中文维基百科 ↗</a></div>`}</figure>
    <div class="lt-card">
      <button class="lt-period" data-p="${p.id}"><i></i>${esc(p.name)} · ${fmtYear(p.start)} 起</button>
      <div class="who">${whoHtml(w)}</div>
      <h3>《${esc(w.title)}》</h3>
      <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
      <p class="why">${esc(w.summary)}</p>
      ${readingLinks(readingsForWork(w.id), "从这件作品出发")}
      ${w.source ? `<a class="look" href="${esc(w.source)}" target="_blank" rel="noopener">作品资料 ↗</a>` : ""}
      ${creditLine(w)}
      ${workSources(w)}
      <div class="lt-nav">
        <button class="btn" data-step="-1" aria-label="上一件">←</button>
        <span class="lt-count">${cur + 1} / ${list.length}</span>
        <button class="btn" data-step="1" aria-label="下一件">→</button>
        <button class="btn lt-go" data-p="${p.id}">去${esc(p.short)}展厅</button>
      </div>
    </div>`;
  if (!prefersReducedMotion()) { view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); }
  // 缩略图带：高亮当前，并只滚动缩略图带本身
  const reel = $("#lt-reel");
  reel.querySelectorAll("button[aria-current]").forEach((b) => b.removeAttribute("aria-current"));
  const b = reel.querySelector<HTMLElement>(`button[data-i="${cur}"]`);
  if (b) {
    b.setAttribute("aria-current", "true");
    if (scrollReel) {
      const left = b.offsetLeft - reel.clientWidth / 2 + b.offsetWidth / 2;
      reel.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }
  const pi = periodIndex(w.period);
  document.querySelectorAll<HTMLElement>("#lt-map button").forEach((m) => m.toggleAttribute("aria-current", m.dataset.p === state.t.periods[pi].id));
  observeImages(view);
}

let keysBound = false;
export function initWall() {
  list = allWorksOrdered();
  if (!$("#collection-select")) $(".lt").insertAdjacentHTML("beforebegin", '<label class="collection-picker mobile-only">按时期浏览<select id="collection-select" aria-label="藏品时期"></select></label>');
  $("#collection-select").innerHTML = state.t.periods.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  $<HTMLSelectElement>("#collection-select").onchange = e => show(list.findIndex(w => w.period === (e.target as HTMLSelectElement).value));
  registerNavigation("collection", () => { const index = cur, left = $("#lt-reel").scrollLeft; return () => { show(index, false); $("#lt-reel").scrollLeft = left; }; });
  renderReel();
  $("#lt-map").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) show(list.findIndex((w) => w.period === b.dataset.p));
  };
  $("#lt-reel").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button[data-i]");
    if (b) show(+b.dataset.i!, false);
  };
  const view = $("#lt-view");
  view.onclick = (e) => {
    const el = e.target as Element;
    const step = el.closest<HTMLElement>("[data-step]");
    if (step) return show(cur + +step.dataset.step!);
    if (el.closest(".lt-img")) return actions.openWork(list[cur].id, true, list.map((w) => w.id));
    const go = el.closest<HTMLElement>(".lt-go,.lt-period");
    if (go) actions.goPeriod(periodIndex(go.dataset.p!), true);
  };
  // 手机上在大图上左右滑动换一件
  let x0 = 0, y0 = 0, swipe = false, swiped = false;
  // 捕获在切换后的合成 click，避免一次横滑又打开大图。
  view.onclick = ((original) => (e: PointerEvent) => { if (swiped) { e.preventDefault(); swiped = false; return; } original?.call(view, e); })(view.onclick);
  view.ontouchstart = (e) => { swipe = e.touches.length === 1 && !!(e.target as Element).closest(".lt-fig"); swiped = false; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
  view.ontouchmove = e => { if (e.touches.length > 1) swipe = false; };
  view.ontouchend = (e) => {
    if (!swipe) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; show(cur + (dx < 0 ? 1 : -1)); }
  };
  if (!keysBound) {
    keysBound = true;
    document.addEventListener("keydown", (e) => {
      if (document.querySelector("dialog[open]") || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = ((e.target as Element).tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      const r = $("#collection").getBoundingClientRect();
      if (r.top > innerHeight * 0.5 || r.bottom < innerHeight * 0.5) return;
      show(cur + (e.key === "ArrowRight" ? 1 : -1));
      e.preventDefault();
    });
  }
  show(Math.min(cur, list.length - 1), false);
}
