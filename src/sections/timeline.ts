import { $, esc, clamp, lerp, prefersReducedMotion } from "../lib/dom";
import { state, actions, periodIndex, periodVar, imgSrc } from "../state";
import type { ContextBand, Year } from "../types";
import { initRelay } from "./relay";

/* 时间全景：背景行（欧洲分期、中国朝代、教会历史……）、历史大事、代表作品、艺术时期，共用一条时间轴 */

let mode: "exp" | "real" = "exp";
let tReal = 0; // 0 = 展开比例，1 = 真实比例（动画插值）
let evSel = -1;
/** 选中的背景行条目：band 下标 + 条目下标；item = -2 表示该行的导读卡 */
let bandSel: { band: number; item: number } | null = null;

const fmtY = (y: Year) => (y < 0 ? "前" + -y : String(y));
const fmtR = (a: Year, b: Year) => `${fmtY(a)}–${fmtY(b)}`;

function fExp(y: Year) {
  for (const [a, b, u, v] of state.site.axis.segments) if (y <= b) return u + ((y - a) / (b - a)) * (v - u);
  return 1;
}
function fLin(y: Year) {
  const { start, end } = state.site.axis;
  return (y - start) / (end - start);
}

const bandTheme = (b: ContextBand) => {
  if (b.theme === "neutral") return { a: "var(--wall)", b: "var(--line)", ink: "var(--ink)" };
  return { a: `var(--band-${b.theme}-a)`, b: `var(--band-${b.theme}-b)`, ink: `var(--band-${b.theme}-ink)` };
};

const overlapPeriods = (a: Year, b: Year) =>
  state.t.periods.map((p, i) => ({ p, i })).filter(({ p }) => p.start < b && p.end > a);
const periodButtons = (list: { p: { id: string; short: string }; i: number }[]) =>
  list.map(({ p, i }) => `<button class="to" data-i="${i}" style="--g:${periodVar(p.id)}">${esc(p.short)} →</button>`).join("");
const itemAt = (band: ContextBand, y: Year) => band.items.find((it) => y >= it.start && y < it.end) ?? null;

export function renderTimeline() {
  const t = state.t;
  const W = 1000, L = 70, R = 16;
  const svg = $<SVGSVGElement>("#tl-svg");
  const pos = (y: Year) => L + (W - L - R) * lerp(fExp(y), fLin(y), tReal);
  const ev = t.events[evSel];
  const hit = new Set(ev ? ev.periods : []);
  const bandH = 22, bandGap = 4, bandY0 = 8;
  const bands = t.bands;
  const bandY = (i: number) => bandY0 + i * (bandH + bandGap);
  const evTop = bandY(bands.length) + 18;
  let s = "";

  // 历史大事：圆点排行，避免重叠
  const rowsEnd: number[] = [], MAXR = 4;
  const evs = t.events.map((e, i) => {
    const x = pos(e.year);
    let r = rowsEnd.findIndex((end) => end < x - 19);
    if (r < 0) {
      if (rowsEnd.length < MAXR) { r = rowsEnd.length; rowsEnd.push(0); }
      else r = rowsEnd.indexOf(Math.min(...rowsEnd));
    }
    rowsEnd[r] = x;
    return { e, i, x, r };
  });
  const evRow = 21, evH = Math.max(1, rowsEnd.length) * evRow;

  // 代表作品：缩略图排行
  const TS = 26, wkEnd: number[] = [], MAXW = 4;
  const wks = t.works.filter((w) => w.timeline).sort((a, b) => a.year - b.year).map((w, k) => {
    const x = pos(w.year);
    let r = wkEnd.findIndex((end) => end < x - TS / 2 - 3);
    if (r < 0) {
      if (wkEnd.length < MAXW) { r = wkEnd.length; wkEnd.push(-1e9); }
      else r = wkEnd.indexOf(Math.min(...wkEnd));
    }
    wkEnd[r] = x + TS / 2;
    return { w, x, r, k };
  });
  const wkTop = evTop + evH + 14, wkRow = TS + 6, wkH = Math.max(1, wkEnd.length) * wkRow;

  // 艺术时期：色条分道
  const items = t.periods.map((p, i) => ({ p, i, x0: pos(p.start), x1: pos(p.end), lane: 0 })).sort((a, b) => a.x0 - b.x0);
  const lanes: number[] = [], MAXL = 6;
  items.forEach((it) => {
    const need = Math.max(it.x1, it.x0 + it.p.short.length * 13 + 10);
    let l = lanes.findIndex((end) => end <= it.x0 - 2);
    if (l < 0) {
      if (lanes.length < MAXL) { l = lanes.length; lanes.push(0); }
      else l = lanes.indexOf(Math.min(...lanes));
    }
    lanes[l] = need;
    it.lane = l;
  });
  const top = wkTop + wkH + 18, lh = 36, H = top + lanes.length * lh + 34;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const ticks = tReal < 0.5
    ? [-30000, -3000, -1000, 0, 500, 1000, 1400, 1500, 1600, 1700, 1800, 1900]
    : [-30000, -25000, -20000, -15000, -10000, -5000, 0];
  ticks.forEach((y) => {
    const x = pos(y);
    s += `<line x1="${x}" y1="${bandY0}" x2="${x}" y2="${H - 26}" class="s-line"/><text x="${x}" y="${H - 10}" text-anchor="middle" class="t-mono t-m">${fmtY(y)}</text>`;
  });

  // 行标题
  bands.forEach((b, bi) => {
    const th = bandTheme(b), y = bandY(bi) + 15;
    s += b.intro
      ? `<g class="band-intro" data-b="${bi}" tabindex="0" role="button" aria-label="${esc(b.label)}导读"><title>${esc(b.intro.title)}</title><text x="4" y="${y}" class="t-s t-b" style="fill:${th.ink};text-decoration:underline dotted">${esc(b.label)}</text></g>`
      : `<text x="4" y="${y}" class="t-s t-b" style="fill:${th.ink}">${esc(b.label)}</text>`;
  });
  s += `<text x="4" y="${evTop + 4}" class="t-s t-b">历史大事</text><text x="4" y="${wkTop + TS / 2 + 4}" class="t-s t-b">代表作品</text><text x="4" y="${top + 9}" class="t-s t-b">艺术时期</text>`;

  // 背景行
  bands.forEach((b, bi) => {
    const th = bandTheme(b), y0 = bandY(bi);
    b.items.forEach((it, i) => {
      const x0 = pos(it.start), x1 = pos(it.end), w = x1 - x0;
      const on = bandSel?.band === bi && bandSel.item === i;
      const lab = w > it.name.length * 12 + 8 ? it.name : w > it.short.length * 12 + 6 ? it.short : "";
      s += `<g class="band" data-b="${bi}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(b.label)} ${esc(it.name)} ${fmtR(it.start, it.end)}" style="--bi:${th.ink}"><title>${esc(it.name)}（${fmtR(it.start, it.end)}）</title><rect x="${x0}" y="${y0}" width="${Math.max(1, w - 1)}" height="${bandH}" style="fill:${i % 2 ? th.b : th.a}${on ? `;stroke:${th.ink};stroke-width:2` : ""}"/>${lab ? `<text x="${x0 + w / 2}" y="${y0 + 15}" text-anchor="middle" class="t-s" style="fill:${th.ink}${on ? ";font-weight:700" : ""}">${esc(lab)}</text>` : ""}</g>`;
    });
    if (b.emptyBefore) {
      const x0 = pos(state.site.axis.start), x1 = pos(b.emptyBefore.until);
      if (x1 - x0 > 110) s += `<text x="${(x0 + x1) / 2}" y="${y0 + 15}" text-anchor="middle" class="t-s t-m">${esc(b.emptyBefore.label)}</text>`;
    }
  });

  if (ev) {
    const x = pos(ev.year);
    s += `<line x1="${x}" y1="${bandY0}" x2="${x}" y2="${H - 26}" class="s-acc" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  items.forEach((it) => {
    const y = top + it.lane * lh, w = Math.max(3, it.x1 - it.x0), dim = ev && !hit.has(it.p.id);
    s += `<g class="bar" data-i="${it.i}" tabindex="0" role="button" aria-label="${esc(it.p.name)}" style="opacity:${dim ? 0.28 : 1}"><rect x="${it.x0}" y="${y}" width="${w}" height="10" rx="2" style="fill:${periodVar(it.p.id)}"/><text x="${it.x0}" y="${y + 25}" class="t-s t-b">${esc(it.p.short)}</text></g>`;
  });

  wks.forEach(({ w, x, r, k }) => {
    const yy = wkTop + r * wkRow, x0 = x - TS / 2, dim = ev && !hit.has(w.period), c = periodVar(w.period);
    const src = imgSrc(w, "thumb");
    s += `<g class="wk" data-w="${w.id}" tabindex="0" role="button" aria-label="${esc(w.title)}，${fmtY(w.year)}" style="opacity:${dim ? 0.25 : 1}"><title>《${esc(w.title)}》${esc(w.yearText)}</title>
      <clipPath id="wkc${k}"><rect x="${x0}" y="${yy}" width="${TS}" height="${TS}" rx="3"/></clipPath>
      ${src ? `<image href="${src}" x="${x0}" y="${yy}" width="${TS}" height="${TS}" clip-path="url(#wkc${k})" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${x0}" y="${yy}" width="${TS}" height="${TS}" rx="3" class="f-wall"/><text x="${x}" y="${yy + TS / 2 + 4}" text-anchor="middle" class="t-s t-m">${esc(w.title[0])}</text>`}
      <rect x="${x0}" y="${yy}" width="${TS}" height="${TS}" rx="3" style="fill:none;stroke:${c}" stroke-width="2"/></g>`;
  });

  evs.forEach(({ e, i, x, r }) => {
    const y = evTop + r * evRow, on = i === evSel;
    s += `<g class="ev" data-e="${i}" tabindex="0" role="button" aria-label="${esc(e.yearText)} ${esc(e.name)}"><circle cx="${x}" cy="${y}" r="${on ? 10 : 8.5}" class="${on ? "f-acc s-acc" : "f-panel s-ink"}" stroke-width="1.5"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" style="font-size:${i >= 9 ? 9 : 10}px;font-family:var(--f-mono);font-weight:700;fill:${on ? "var(--panel)" : "var(--ink)"}">${i + 1}</text></g>`;
  });

  svg.innerHTML = s;
  renderEventCard();
  renderBandNote();
  const first = t.periods[0];
  const pre = Math.round(((first.end - first.start) / (state.site.axis.end - state.site.axis.start)) * 100);
  $("#tl-note").textContent = mode === "real"
    ? `按真实比例，${first.name}就占了整条时间线的约 ${pre}%，其余时期和几乎所有历史大事都挤在最右边的一小段里。`
    : "越往后，时间刻度放得越大。";
}

function renderEventCard() {
  const t = state.t, e = t.events[evSel], card = $("#ev-card");
  const prev = $<HTMLButtonElement>("#ev-prev"), next = $<HTMLButtonElement>("#ev-next");
  prev.disabled = evSel <= 0;
  next.disabled = evSel === t.events.length - 1;
  if (!e) {
    $("#ev-count").textContent = `共 ${t.events.length} 件历史大事`;
    next.textContent = "从第一件看起 →";
    card.hidden = true;
    card.innerHTML = "";
    return;
  }
  card.hidden = false;
  next.textContent = "下一件 →";
  $("#ev-count").textContent = `历史大事 ${evSel + 1} / ${t.events.length}`;
  const parallel = t.bands
    .filter((b) => b.theme !== "neutral")
    .map((b) => ({ b, it: itemAt(b, e.year) }))
    .filter((x) => x.it)
    .map(({ b, it }) => `<div><span class="lb">同时期的${esc(b.label.replace(/朝代|历史/, ""))}</span>${esc(it!.name)}（${fmtR(it!.start, it!.end)}）</div>`)
    .join("");
  card.innerHTML = `<div class="ev-yr">${evSel + 1}. ${esc(e.yearText)}<b>${esc(e.name)}</b></div>
    <div class="ev-body"><div><span class="lb">发生了什么</span>${esc(e.what)}</div><div><span class="lb">对艺术的影响</span>${esc(e.art)}</div>${parallel}
    <div class="ev-foot"><span class="lb">影响到的展厅</span>${periodButtons(e.periods.map((id) => ({ p: state.t.periods[periodIndex(id)], i: periodIndex(id) })))}</div></div>`;
}

function renderBandNote() {
  const box = $("#band-note");
  if (!bandSel) { box.hidden = true; return; }
  const band = state.t.bands[bandSel.band], th = bandTheme(band);
  box.hidden = false;
  box.style.borderLeftColor = th.ink;
  if (bandSel.item === -2 && band.intro) {
    box.innerHTML = `<div class="ev-yr" style="color:${th.ink}">${esc(band.label)} · 导读<b>${esc(band.intro.heading)}</b></div><div class="ev-body">${band.intro.sections.map(([k, v]) => `<div><span class="lb">${esc(k)}</span>${esc(v)}</div>`).join("")}</div>`;
    return;
  }
  const it = band.items[bandSel.item];
  const fields = band.fields.map((f, i) => `<div><span class="lb">${esc(f)}</span>${esc(it.values[i] ?? "")}</div>`).join("");
  const others = state.t.bands
    .filter((b) => b !== band)
    .map((b) => {
      const names = b.items.filter((x) => x.start < it.end && x.end > it.start).map((x) => x.name);
      return names.length ? `<div><span class="lb">同时期的${esc(b.label)}</span>${esc(names.join("、"))}</div>` : "";
    })
    .join("");
  const ps = overlapPeriods(it.start, it.end);
  box.innerHTML = `<div class="ev-yr" style="color:${th.ink}">${esc(band.label)} · ${fmtR(it.start, it.end)}<b>${esc(it.name)}</b></div><div class="ev-body">${fields}${others}
    <div class="ev-foot"><span class="lb">同时期的艺术</span>${ps.length ? periodButtons(ps) : "—"}</div></div>`;
}

function pickBand(band: number, item: number) {
  bandSel = bandSel && bandSel.band === band && bandSel.item === item ? null : { band, item };
  renderTimeline();
}

export function selectEvent(i: number, scroll?: boolean) {
  evSel = clamp(i, -1, state.t.events.length - 1);
  renderTimeline();
  if (scroll) $("#chronology").scrollIntoView({ block: "start" });
}

function animateTo(to: number) {
  const from = tReal, t0 = performance.now(), D = prefersReducedMotion() ? 0 : 650;
  const step = (n: number) => {
    const k = D ? clamp((n - t0) / D, 0, 1) : 1;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    tReal = lerp(from, to, e);
    renderTimeline();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function handle(target: Element): boolean {
  const bi = target.closest<SVGGElement>(".band-intro");
  if (bi) { pickBand(+bi.dataset.b!, -2); return true; }
  const b = target.closest<SVGGElement>(".band");
  if (b) { pickBand(+b.dataset.b!, +b.dataset.i!); return true; }
  const k = target.closest<SVGGElement>(".wk");
  if (k) { actions.openWork(k.dataset.w!, true, state.t.works.filter((w) => w.timeline).sort((a, b) => a.year - b.year).map((w) => w.id)); return true; }
  const v = target.closest<SVGGElement>(".ev");
  if (v) { selectEvent(+v.dataset.e! === evSel ? -1 : +v.dataset.e!); return true; }
  const bar = target.closest<SVGGElement>(".bar");
  if (bar) { actions.goPeriod(+bar.dataset.i!, true); return true; }
  return false;
}

export function initTimeline() {
  evSel = -1;
  bandSel = null;
  const exp = $("#tl-exp"), real = $("#tl-real");
  exp.onclick = () => { mode = "exp"; exp.setAttribute("aria-pressed", "true"); real.setAttribute("aria-pressed", "false"); animateTo(0); };
  real.onclick = () => { mode = "real"; real.setAttribute("aria-pressed", "true"); exp.setAttribute("aria-pressed", "false"); animateTo(1); };
  const svg = $("#tl-svg");
  svg.onclick = (e) => handle(e.target as Element);
  svg.onkeydown = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (handle(e.target as Element)) e.preventDefault();
  };
  $("#ev-prev").onclick = () => selectEvent(evSel - 1);
  $("#ev-next").onclick = () => selectEvent(evSel + 1);
  const toPeriod = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".to");
    if (b) actions.goPeriod(+b.dataset.i!, true);
  };
  $("#ev-card").onclick = toPeriod;
  $("#band-note").onclick = toPeriod;

  initRelay();
  renderTimeline();
}

