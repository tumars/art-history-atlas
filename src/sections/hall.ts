import { $, esc, clamp, store, wikiSearch } from "../lib/dom";
import { state, actions, worksOf, periodVar, imgSrc, hasImage } from "../state";
import { diagramFor, diagramContext } from "../diagrams";
import type { Work } from "../types";

/* 展厅：时期导航、主线与要点、展签、交互图解、承上启下 */

const KEY = "aha.period";

const imgTag = (w: Work, size: "full" | "thumb") => {
  const src = imgSrc(w, size);
  return src ? `<img src="${src}" alt="《${esc(w.title)}》" loading="lazy" onerror="this.closest('[data-fig]')?.setAttribute('data-broken','')">` : "";
};

/** 图片下方的署名：作者 · 授权（来源） */
export const creditLine = (w: Work) => {
  const c = state.credits[w.id];
  if (!c || w.copyright) return "";
  return `<div class="credit-line">图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">来源</a></div>`;
};

function renderNav() {
  const t = state.t;
  $("#era-nav").innerHTML = t.periods.map((p, i) => {
    const w = worksOf(p.id).find(hasImage);
    const src = w ? imgSrc(w, "thumb") : null;
    return `<li><button class="chip" data-i="${i}" style="--g:${periodVar(p.id)}" ${i === state.cur ? 'aria-current="true"' : ""}>
      <span class="ph">${src ? `<img src="${src}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span><span class="nm"><small>${String(i + 1).padStart(2, "0")}</small>${esc(p.short)}</span></button></li>`;
  }).join("");
}

function renderFeature() {
  const p = state.t.periods[state.cur], works = worksOf(p.id), w = works[state.feat];
  if (!w) { $("#feature").innerHTML = ""; return; }
  const img = hasImage(w);
  const noImg = w.copyright ? `${w.copyright}，本站不放图片。` : "暂无可用的公有领域图片。";
  $("#feature").innerHTML = `<div>
    ${img ? `<button class="zoom" data-w="${w.id}" aria-label="放大查看《${esc(w.title)}》"><figure class="big" data-fig>${imgTag(w, "full")}</figure></button>${creditLine(w)}` : ""}
    <div class="flabel" style="margin-top:${img ? 10 : 0}px">
      <div class="who">${esc(w.artist)}</div><h3>《${esc(w.title)}》</h3>
      <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
      <p class="why">${esc(w.summary)}</p>
      ${img ? "" : `<a class="look" href="${wikiSearch(w.title)}" target="_blank" rel="noopener">${noImg}到维基百科查看 ↗</a>`}
    </div></div>
    <div class="strip" role="group" aria-label="本时期作品">${works.map((x, i) => `<button data-k="${i}" aria-pressed="${i === state.feat}"><span class="ph">${hasImage(x) ? imgTag(x, "thumb") : esc(x.title[0])}</span><span class="cap">${esc(x.title)}</span></button>`).join("")}</div>`;
}

function renderPeriod() {
  const t = state.t, p = t.periods[state.cur];
  const intro = $("#intro");
  intro.style.setProperty("--g", periodVar(p.id));
  const group = t.meta.groups.find((g) => g.id === p.group);
  const hist = t.events.map((v, i) => ({ v, i })).filter(({ v }) => v.periods.includes(p.id));
  intro.innerHTML = `<div class="num">展厅 ${String(state.cur + 1).padStart(2, "0")} / ${t.periods.length} · ${esc(group?.name ?? "")}</div><h2>${esc(p.name)}</h2><div class="en">${esc(p.en)}</div>
    <span class="span">${esc(p.span)}</span><p class="thesis">${esc(p.thesis)}</p><div class="tags">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join("")}</div>
    <ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    ${hist.length ? `<div class="hist"><span class="eyebrow">历史背景 · 点击在时间全景中查看</span><ol>${hist.map(({ v, i }) => `<li><button data-ev="${i}"><span class="y">${esc(v.yearText)}</span><span><b>${esc(v.name)}</b>：${esc(v.art)}</span></button></li>`).join("")}</ol></div>` : ""}`;
  renderFeature();
  const box = $("#diagram"), d = p.diagram ? diagramFor(t.meta.id, p.diagram.id) : undefined;
  box.hidden = !d;
  if (d && p.diagram) {
    const ctx = diagramContext();
    box.innerHTML = `<div class="dhead"><span class="eyebrow">一图看懂</span><h3>${esc(p.diagram.title)}</h3></div><div id="dg-body">${d.html(ctx)}</div><p class="dcap">${esc(p.diagram.caption)}</p>`;
    d.init($("#dg-body"), ctx);
  } else box.innerHTML = "";
  $("#bridge").innerHTML = `<b>承上启下：</b>${esc(p.bridge)}`;
  $<HTMLButtonElement>("#prev").disabled = state.cur === 0;
  $<HTMLButtonElement>("#next").disabled = state.cur === t.periods.length - 1;
}

export function goPeriod(i: number, scroll?: boolean) {
  state.cur = clamp(i, 0, state.t.periods.length - 1);
  state.feat = 0;
  store.set(KEY, state.t.periods[state.cur].id);
  renderNav();
  renderPeriod();
  actions.refreshPendulum();
  // 只横向滚动时期导航，不带动整页
  const nav = $(".era-nav"), chip = nav.querySelector<HTMLElement>(`.chip[data-i="${state.cur}"]`);
  if (chip) nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
  if (scroll) $("#hall").scrollIntoView({ block: "start" });
}

/** 跳到某件作品所在的展厅并把它放到展签上 */
export function showWork(id: string) {
  const w = state.t.works.find((x) => x.id === id);
  if (!w) return;
  const i = state.t.periods.findIndex((p) => p.id === w.period);
  goPeriod(i, true);
  state.feat = worksOf(w.period).findIndex((x) => x.id === id);
  renderFeature();
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
    if (z) { actions.openWork(z.dataset.w!, false); return; }
    const b = (e.target as Element).closest<HTMLButtonElement>(".strip button");
    if (b) { state.feat = +b.dataset.k!; renderFeature(); }
  };
  $("#prev").onclick = () => goPeriod(state.cur - 1);
  $("#next").onclick = () => goPeriod(state.cur + 1);
  goPeriod(state.cur);
}

document.addEventListener("keydown", (e) => {
  if (!$("#lightbox").hidden) return;
  const tag = ((e.target as Element).tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return;
  if (e.key === "ArrowRight") goPeriod(state.cur + 1);
  if (e.key === "ArrowLeft") goPeriod(state.cur - 1);
});

