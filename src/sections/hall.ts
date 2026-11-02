import { $, esc, clamp, store, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { fmtYear, roman } from "../lib/format";
import { state, actions, worksOf, periodVar, imgSrc, hasImage } from "../state";
import { diagramFor, diagramContext } from "../diagrams";
import type { Work } from "../types";

/* II 展厅：展厅索引、主线与要点、展墙与说明牌、交互图解、承上启下。地址 #p-<时期id> 可直达。 */

const KEY = "aha.period";
const HASH = /^#p-([\w-]+)$/;

/** 图片下方的署名：作者 · 协议 · 来源 */
export const creditLine = (w: Work) => {
  const c = state.credits[w.id];
  if (!c || w.copyright) return "";
  return `<div class="credit-line">图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">维基共享资源</a></div>`;
};

function renderNav() {
  const t = state.t;
  $("#era-nav").innerHTML = t.periods.map((p, i) =>
    `<li><button class="chip" data-i="${i}" style="--g:${periodVar(p.id)}" ${i === state.cur ? 'aria-current="true"' : ""} title="${esc(p.name)}"><i></i><small>${String(i + 1).padStart(2, "0")}</small><b>${esc(p.short)}</b><em>${fmtYear(p.start)}</em></button></li>`
  ).join("");
}

function renderFeature() {
  const p = state.t.periods[state.cur], works = worksOf(p.id), w = works[state.feat];
  if (!w) { $("#feature").innerHTML = ""; return; }
  const img = hasImage(w);
  const noImg = w.copyright ? `${w.copyright}，本站不放图片。` : "暂无可用的公有领域图片。";
  $("#feature").innerHTML = `
    ${img ? `<button class="zoom" data-w="${w.id}" aria-label="放大查看《${esc(w.title)}》"><figure class="big"><img src="${imgSrc(w, "full")}" alt="《${esc(w.title)}》" decoding="async"></figure></button>` : ""}
    <div class="placard">
      <div class="who">${esc(w.artist)}</div>
      <h3>《${esc(w.title)}》</h3>
      <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
      <p class="why">${esc(w.summary)}</p>
      ${img ? creditLine(w) : `<a class="look" href="${wikiSearch(w.title)}" target="_blank" rel="noopener">${noImg}到维基百科看图 ↗</a>`}
    </div>
    <div class="strip" role="group" aria-label="本厅作品">${works.map((x, i) =>
      `<button data-k="${i}" aria-pressed="${i === state.feat}" title="${esc(x.title)}" aria-label="${esc(x.title)}">${hasImage(x) ? `<img src="${imgSrc(x, "thumb")}" alt="" loading="lazy">` : esc(x.title[0])}</button>`).join("")}</div>`;
}

function renderPeriod() {
  const t = state.t, p = t.periods[state.cur];
  const intro = $("#intro");
  intro.style.setProperty("--g", periodVar(p.id));
  const group = t.meta.groups.find((g) => g.id === p.group);
  const hist = t.events.map((v, i) => ({ v, i })).filter(({ v }) => v.periods.includes(p.id));
  intro.innerHTML = `<div class="num"><em>${roman(state.cur + 1)}</em><span>第 ${state.cur + 1} / ${t.periods.length} 间 · ${esc(group?.name ?? "")}</span></div>
    <h2>${esc(p.name)}</h2><div class="en">${esc(p.en)}</div>
    <span class="span">${esc(p.span)}</span>
    <p class="thesis">${esc(p.thesis)}</p>
    <div class="tags">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join("")}</div>
    <ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    ${hist.length ? `<div class="hist"><span class="label-sm">历史背景 · 点击在年表中查看</span><ol>${hist.map(({ v, i }) => `<li><button data-ev="${i}"><span class="y">${esc(v.yearText)}</span><span><b>${esc(v.name)}</b>：${esc(v.art)}</span></button></li>`).join("")}</ol></div>` : ""}`;
  renderFeature();
  const box = $("#diagram"), d = p.diagram ? diagramFor(t.meta.id, p.diagram.id) : undefined;
  box.hidden = !d;
  if (d && p.diagram) {
    const ctx = diagramContext();
    box.innerHTML = `<div class="dhead"><span class="label-sm">一图看懂</span><h3>${esc(p.diagram.title)}</h3></div><div id="dg-body">${d.html(ctx)}</div><p class="dcap">${esc(p.diagram.caption)}</p>`;
    d.init($("#dg-body"), ctx);
  } else box.innerHTML = "";
  const next = t.periods[state.cur + 1];
  $("#bridge").innerHTML = `${esc(p.bridge)}${next ? ` <b>下一间：${esc(next.name)}。</b>` : ""}`;
  $<HTMLButtonElement>("#prev").disabled = state.cur === 0;
  $<HTMLButtonElement>("#next").disabled = state.cur === t.periods.length - 1;
}

function animateIn() {
  if (prefersReducedMotion()) return;
  const b = $("#hall-body");
  b.classList.remove("enter");
  void b.offsetWidth;
  b.classList.add("enter");
}

export function goPeriod(i: number, scroll?: boolean, opts: { silent?: boolean } = {}) {
  const changed = clamp(i, 0, state.t.periods.length - 1) !== state.cur;
  state.cur = clamp(i, 0, state.t.periods.length - 1);
  state.feat = 0;
  const id = state.t.periods[state.cur].id;
  store.set(KEY, id);
  renderNav();
  renderPeriod();
  if (changed) animateIn();
  actions.refreshPendulum();
  if (!opts.silent) history.replaceState(null, "", `#p-${id}`);
  // 只横向滚动展厅索引，不带动整页
  const nav = $(".era-nav"), chip = nav.querySelector<HTMLElement>(`.chip[data-i="${state.cur}"]`);
  if (chip) nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  if (scroll) $("#hall").scrollIntoView({ block: "start" });
}

/** 跳到某件作品所在的展厅并把它挂到展墙上 */
export function showWork(id: string) {
  const w = state.t.works.find((x) => x.id === id);
  if (!w) return;
  goPeriod(state.t.periods.findIndex((p) => p.id === w.period), true);
  state.feat = worksOf(w.period).findIndex((x) => x.id === id);
  renderFeature();
}

function fromHash(scroll: boolean) {
  const m = HASH.exec(location.hash);
  if (!m) return false;
  const i = state.t.periods.findIndex((p) => p.id === m[1]);
  if (i < 0) return false;
  goPeriod(i, scroll, { silent: true });
  return true;
}

export function initHall() {
  const saved = store.get<string>(KEY, "");
  state.cur = Math.max(0, state.t.periods.findIndex((p) => p.id === saved));
  $("#intro").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("[data-ev]");
    if (b) actions.selectEvent(+b.dataset.ev!, true);
  };
  $("#era-nav").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".chip");
    if (b) goPeriod(+b.dataset.i!);
  };
  $("#feature").onclick = (e) => {
    const z = (e.target as Element).closest<HTMLButtonElement>(".zoom");
    if (z) { actions.openWork(z.dataset.w!, false, worksOf(state.t.periods[state.cur].id).map((w) => w.id)); return; }
    const b = (e.target as Element).closest<HTMLButtonElement>(".strip button");
    if (b) { state.feat = +b.dataset.k!; renderFeature(); }
  };
  $("#prev").onclick = () => goPeriod(state.cur - 1);
  $("#next").onclick = () => goPeriod(state.cur + 1);
  if (!fromHash(true)) goPeriod(state.cur, false, { silent: true });
}

window.addEventListener("hashchange", () => fromHash(true));

document.addEventListener("keydown", (e) => {
  if (!$("#lightbox").hidden || e.altKey || e.metaKey || e.ctrlKey) return;
  const el = e.target as Element;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea" || el.closest?.("#hero")) return;
  // 只在展厅区域可见时响应，避免在别处误触
  const r = $("#hall").getBoundingClientRect();
  if (r.bottom < 80 || r.top > innerHeight - 80) return;
  if (e.key === "ArrowRight") goPeriod(state.cur + 1);
  if (e.key === "ArrowLeft") goPeriod(state.cur - 1);
});
