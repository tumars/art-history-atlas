import { artImage } from "../lib/art-image";
import { observeImages } from "../lib/image-loading";
import { $, esc, clamp, store, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { fmtYear, roman } from "../lib/format";
import { whoHtml } from "../state";
import { state, actions, worksOf, periodVar, imgSrc, hasImage } from "../state";
import { diagramFor, diagramContext } from "../diagrams";
import type { Work } from "../types";
import { navigate, navigationActive, registerNavigation } from "../lib/navigation";
import { readingLinks, readingsForWork, renderHallReadings } from "./readings";

/* II 展厅：展厅索引、主线与要点、展墙与说明牌、交互图解、承上启下。地址 #p-<时期id> 可直达。 */

const KEY = "aha.period";
const HASH = /^#p-([\w-]+)$/;

/** 图片下方的署名：作者 · 协议 · 来源 */
export const creditLine = (w: Work) => {
  const c = state.credits[w.id];
  if (!c) return "";
  return `<div class="credit-line">${w.imageNote ? `${esc(w.imageNote)}<br>` : ""}图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">图片来源</a></div>`;
};

export const workSources = (w: Work) => w.sources?.length
  ? `<div class="credit-line">作品研究：${w.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join(" · ")}</div>` : "";

function renderNav() {
  const t = state.t;
  $("#era-nav").innerHTML = t.periods.map((p, i) =>
    `<li><button class="chip" data-i="${i}" style="--g:${periodVar(p.id)}" ${i === state.cur ? 'aria-current="true"' : ""} title="${esc(p.name)}"><i></i><small>${String(i + 1).padStart(2, "0")}</small><b>${esc(p.short)}</b><em>${fmtYear(p.start)}</em></button></li>`
  ).join("");
  const select = document.querySelector<HTMLSelectElement>("#hall-select");
  if (select) {
    select.innerHTML = t.meta.groups.map(g => `<optgroup label="${esc(g.name)}">${t.periods.map((p, i) => p.group === g.id ? `<option value="${i}" ${i === state.cur ? "selected" : ""}>${String(i + 1).padStart(2, "0")} · ${esc(p.name)}</option>` : "").join("")}</optgroup>`).join("");
    select.onchange = () => goPeriod(+select.value, true);
  }
}

function renderFeature() {
  const p = state.t.periods[state.cur], works = worksOf(p.id), w = works[state.feat];
  if (!w) { $("#feature").innerHTML = ""; return; }
  const img = hasImage(w);
  const noImg = w.noImageReason ?? "暂无对应图片。";
  $("#feature").innerHTML = `
    ${img ? `<button class="zoom" data-w="${w.id}" aria-label="放大查看《${esc(w.title)}》"><figure class="big">${artImage(w)}</figure></button>` : ""}
    <div class="placard">
      <div class="who">${whoHtml(w)}</div>
      <h3>《${esc(w.title)}》</h3>
      <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
      <p class="why">${esc(w.summary)}</p>
      <div class="work-paging"><button class="btn" data-work-step="-1" aria-label="上一件作品">← 上一件</button><span>${state.feat + 1} / ${works.length}</span><button class="btn" data-work-step="1" aria-label="下一件作品">下一件 →</button></div>
      <details class="mobile-fold work-info" ${matchMedia("(max-width:700px)").matches ? "" : "open"}><summary>作品资料与来源</summary><div>
      ${readingLinks(readingsForWork(w.id), "从这件作品出发")}
      ${w.source ? `<a class="look" href="${esc(w.source)}" target="_blank" rel="noopener">作品资料 ↗</a>` : ""}
      ${workSources(w)}
      ${img ? creditLine(w) : `<a class="look" href="${wikiSearch(w.title)}" target="_blank" rel="noopener">${esc(noImg)} 中文维基百科 ↗</a>`}
      </div></details>
    </div>
    <div class="strip" role="group" aria-label="本厅作品">${works.map((x, i) =>
      `<button data-k="${i}" aria-pressed="${i === state.feat}" title="${esc(x.title)}" aria-label="${esc(x.title)}">${hasImage(x) ? `<img src="${imgSrc(x, "thumb")}" alt="" loading="lazy">` : esc(x.title[0])}</button>`).join("")}</div>`;
  observeImages($("#feature"));
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
    ${p.question ? `<p class="hall-question"><span class="label-sm">这一间，带着问题看</span>${esc(p.question)}</p>` : ""}
    `;
  $("#hall-background-content").innerHTML = `<p class="thesis">${esc(p.thesis)}</p>
    <div class="tags">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join("")}</div>
    <ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    ${hist.length ? `<div class="hist"><span class="label-sm">历史背景</span><ol>${hist.map(({ v, i }) => `<li><button data-ev="${i}"><span class="y">${esc(v.yearText)}</span><span><b>${esc(v.name)}</b>：${esc(v.art)}</span></button></li>`).join("")}</ol></div>` : ""}`;
  $<HTMLDetailsElement>("#hall-background").open = !matchMedia("(max-width:700px)").matches;
  renderFeature();
  renderHallReadings(p.id);
  const box = $("#diagram"), d = p.diagram ? diagramFor(t.meta.id, p.diagram.id) : undefined;
  box.hidden = !d;
  if (d && p.diagram) {
    const ctx = diagramContext();
    box.innerHTML = `<details class="mobile-fold" ${matchMedia("(max-width:700px)").matches ? "" : "open"}><summary>动手看懂：${esc(p.diagram.title)}</summary><div><div class="dhead"><span class="label-sm">图解</span><h3>${esc(p.diagram.title)}</h3></div><p class="diagram-observe">${esc(p.diagram.observe)}</p><div id="dg-body">${d.html(ctx)}</div><div class="diagram-conclusion"><span class="label-sm">从图中理解</span><p class="dcap">${esc(p.diagram.caption)}</p></div><div class="diagram-works"><span class="label-sm">回到作品</span>${p.diagram.works.map(w => `<button class="btn" data-diagram-work="${w.work}">${esc(w.label)} ↗</button>`).join("")}</div>${p.diagram.sources?.length ? `<details class="diagram-sources"><summary>资料出处</summary><ul>${p.diagram.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join("")}</ul></details>` : ""}</div></details>`;
    d.init($("#dg-body"), ctx);
    observeImages(box);
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
  if (!opts.silent && !navigationActive()) return navigate(() => goPeriod(i, scroll, opts));
  if (!opts.silent) actions.dismissPanels();
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
  if (scroll) {
    const target = matchMedia("(max-width:700px)").matches ? $(".hall-picker") : $("#hall");
    target.scrollIntoView({ block: "start" });
    $("#intro h2").tabIndex = -1;
    $("#intro h2").focus({ preventScroll: true });
  }
}

/** 跳到某件作品所在的展厅并把它挂到展墙上 */
export function showWork(id: string) {
  if (!navigationActive()) return navigate(() => showWork(id));
  const w = state.t.works.find((x) => x.id === id);
  if (!w) return;
  goPeriod(state.t.periods.findIndex((p) => p.id === w.period), false);
  state.feat = worksOf(w.period).findIndex((x) => x.id === id);
  renderFeature();
  $("#feature").scrollIntoView({ block: "start" });
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
  if (!$("#hall-background")) {
    $(".hall").insertAdjacentHTML("beforeend", '<details id="hall-background" class="hall-background mobile-fold" open><summary>认识这个时代</summary><div id="hall-background-content"></div></details>');
    $(".era-nav").insertAdjacentHTML("beforebegin", '<label class="hall-picker mobile-only">选择展厅<select id="hall-select" aria-label="选择展厅"></select></label>');
  }
  registerNavigation("hall", () => {
    const period = state.cur, feat = state.feat, expanded = $<HTMLDetailsElement>("#hall-background").open;
    return () => { goPeriod(period, false, { silent: true }); state.feat = feat; renderFeature(); $<HTMLDetailsElement>("#hall-background").open = expanded || !matchMedia("(max-width:700px)").matches; };
  });
  const saved = store.get<string>(KEY, "");
  state.cur = Math.max(0, state.t.periods.findIndex((p) => p.id === saved));
  $("#hall-background-content").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("[data-ev]");
    if (b) actions.selectEvent(+b.dataset.ev!, true);
  };
  $("#era-nav").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".chip");
    if (b) goPeriod(+b.dataset.i!);
  };
  $("#feature").onclick = (e) => {
    const step = (e.target as Element).closest<HTMLElement>("[data-work-step]");
    if (step) {
      const n = worksOf(state.t.periods[state.cur].id).length;
      state.feat = (state.feat + Number(step.dataset.workStep) + n) % n;
      const direction = step.dataset.workStep;
      renderFeature();
      $<HTMLElement>(`[data-work-step="${direction}"]`).focus({ preventScroll: true });
      return;
    }
    const z = (e.target as Element).closest<HTMLButtonElement>(".zoom");
    if (z) { actions.openWork(z.dataset.w!, false, worksOf(state.t.periods[state.cur].id).map((w) => w.id)); return; }
    const b = (e.target as Element).closest<HTMLButtonElement>(".strip button");
    if (b) { state.feat = +b.dataset.k!; renderFeature(); }
  };
  $("#prev").onclick = () => goPeriod(state.cur - 1, matchMedia("(max-width:700px)").matches);
  $("#diagram").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-diagram-work]");
    if (b) actions.openWork(b.dataset.diagramWork!, true, state.t.periods[state.cur].diagram!.works.map(w => w.work));
  };
  $("#next").onclick = () => goPeriod(state.cur + 1, matchMedia("(max-width:700px)").matches);
  if (!fromHash(true)) goPeriod(state.cur, false, { silent: true });
}

window.addEventListener("hashchange", () => { if (!navigationActive()) fromHash(true); });

document.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const hall = document.getElementById("hall");
  if (!hall) return; // 独立手机页层没有桌面展厅节点。
  if (document.querySelector("dialog[open]") || e.altKey || e.metaKey || e.ctrlKey) return;
  const el = e.target as Element;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea" || el.closest?.("#hero,#reading,#diagram")) return;
  // 只在展厅区域可见时响应，避免在别处误触
  const r = hall.getBoundingClientRect();
  if (r.bottom < 80 || r.top > innerHeight - 80) return;
  if (e.key === "ArrowRight") goPeriod(state.cur + 1);
  if (e.key === "ArrowLeft") goPeriod(state.cur - 1);
});
