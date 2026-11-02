import { $, esc, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { fmtYear } from "../lib/format";
import { state, actions, personById, worksBy, portraitSrc, periodVar, periodOf, periodIndex, imgSrc, hasImage } from "../state";
import type { Encounter, Person, Year } from "../types";

/* III 人物：生命线图 + 扫描线 + 相遇点 + 人物卡片 */

const VW = 1000; // viewBox 宽
const PAD = 12;
const ROW = 28;
const TOP = 34;
// 人物几乎都在 1250 年以后，古代压缩在左侧
const SEGS: [Year, Year, number, number][] = [[-500, 1250, 0, 0.12], [1250, 1990, 0.12, 1]];
const pos = (y: Year) => {
  for (const [a, b, p, q] of SEGS) if (y <= b) return p + ((Math.max(y, a) - a) / (b - a)) * (q - p);
  return 1;
};
const X = (y: Year) => PAD + pos(y) * (VW - PAD * 2);
const unX = (x: number): Year => {
  const p = (x - PAD) / (VW - PAD * 2);
  for (const [a, b, s, e] of SEGS) if (p <= e) return Math.round(a + ((Math.max(p, s) - s) / (e - s)) * (b - a));
  return 1990;
};

let lane = new Map<string, number>();
let sel: { kind: "person"; id: string } | { kind: "enc"; i: number } = { kind: "person", id: "michelangelo" };
let svgH = 0;

const nameW = (p: Person) => p.name.length * 12.5 + 6;
const laneY = (id: string) => TOP + (lane.get(id) ?? 0) * ROW;
const ageText = (p: Person) => `${p.approx ? "约" : ""}${p.died - p.born} 岁`;
const lifeText = (p: Person) => `${p.approx ? "约" : ""}${fmtYear(p.born)} – ${fmtYear(p.died)}`;

/** 按出生年排，名字和生命线都不重叠时共用一行 */
function pack(people: Person[]) {
  const ends: number[] = [];
  lane = new Map();
  [...people].sort((a, b) => a.born - b.born).forEach((p) => {
    const x0 = X(p.born), x1 = Math.max(X(p.died), x0 + nameW(p)) + 10;
    let k = ends.findIndex((e) => e <= x0);
    if (k < 0) { k = ends.length; ends.push(0); }
    ends[k] = x1;
    lane.set(p.id, k);
  });
  return ends.length;
}

function render() {
  const t = state.t;
  const lanes = pack(t.people);
  svgH = TOP + lanes * ROW + 8;
  const svg = $("#life-svg");
  svg.setAttribute("viewBox", `0 0 ${VW} ${svgH}`);
  let s = "";
  // 刻度
  const ticks = [-500, 500, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
  for (const y of ticks) {
    const x = X(y);
    s += `<line x1="${x}" x2="${x}" y1="${TOP - 12}" y2="${svgH}" class="grid"/><text x="${x + 3}" y="${TOP - 16}" class="t-s t-m">${fmtYear(y)}</text>`;
  }
  const bx = X(1250);
  s += `<text x="${bx}" y="${TOP - 16}" class="t-s t-m" text-anchor="middle">≈</text>`;
  // 生命线
  for (const p of t.people) {
    const y = laneY(p.id), x0 = X(p.born), x1 = X(p.died), c = periodVar(p.period);
    const yy = y + 17;
    const line = p.approx && x1 - x0 > 20
      ? `<line x1="${x0}" x2="${x0 + 8}" y1="${yy}" y2="${yy}" class="bar fz"/><line x1="${x0 + 8}" x2="${x1 - 8}" y1="${yy}" y2="${yy}" class="bar"/><line x1="${x1 - 8}" x2="${x1}" y1="${yy}" y2="${yy}" class="bar fz"/>`
      : `<line x1="${x0}" x2="${Math.max(x1, x0 + 3)}" y1="${yy}" y2="${yy}" class="bar"/>`;
    s += `<g class="life-p" data-p="${p.id}" style="--g:${c}" tabindex="0" role="button" aria-label="${esc(p.name)}，${lifeText(p)}">
      <rect x="${x0 - 2}" y="${y}" width="${Math.max(x1 - x0, nameW(p)) + 4}" height="${ROW - 2}" fill="transparent"/>
      <text x="${x0}" y="${y + 10}" class="nm">${esc(p.name)}</text>${line}</g>`;
  }
  // 相遇：连线 + 菱形
  t.encounters.forEach((e, i) => {
    const x = X(e.year);
    const ys = e.people.map((id) => laneY(id) + 17);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    s += `<g class="enc" data-e="${i}" tabindex="0" role="button" aria-label="${esc(e.yearText ?? String(e.year))}，${esc(e.place)}：${esc(e.title)}">
      <line x1="${x}" x2="${x}" y1="${y0}" y2="${y1}" class="enc-l"/>
      ${ys.map((y) => `<circle cx="${x}" cy="${y}" r="2.6" class="enc-d"/>`).join("")}
      <path d="M${x} ${y0 - 11} l5 5 l-5 5 l-5 -5z" class="enc-m"/>
      <rect x="${x - 7}" y="${y0 - 13}" width="14" height="${y1 - y0 + 18}" fill="transparent"/></g>`;
  });
  s += `<g class="scrub" id="scrub" visibility="hidden"><line y1="${TOP - 12}" y2="${svgH}" class="scrub-l"/><text y="${TOP - 3}" class="scrub-t"></text></g>`;
  svg.innerHTML = s;
}

/** 生命线高亮：选中的人和与他有关系的人 */
function related(id: string) {
  const t = state.t, me = personById(id)!;
  const set = new Set<string>([id]);
  Object.values(me.rel).forEach((v) => v?.forEach((x) => set.add(x)));
  t.people.forEach((p) => Object.values(p.rel).forEach((v) => v?.includes(id) && set.add(p.id)));
  return set;
}

function paint(alive?: (p: Person) => boolean) {
  const t = state.t;
  const rel = sel.kind === "person" ? related(sel.id) : new Set(t.encounters[sel.i].people);
  document.querySelectorAll<SVGGElement>("#life-svg .life-p").forEach((g) => {
    const p = personById(g.dataset.p!)!;
    g.classList.toggle("on", sel.kind === "person" ? p.id === sel.id : rel.has(p.id));
    g.classList.toggle("dim", alive ? !alive(p) : !rel.has(p.id));
  });
  document.querySelectorAll<SVGGElement>("#life-svg .enc").forEach((g) => g.classList.toggle("on", sel.kind === "enc" && +g.dataset.e! === sel.i));
}

function scrubTo(year: Year | null) {
  const g = $("#scrub") as unknown as SVGGElement;
  const note = $("#life-note");
  if (year === null) {
    g.setAttribute("visibility", "hidden");
    note.textContent = "";
    paint();
    return;
  }
  const x = X(year);
  g.setAttribute("visibility", "visible");
  g.querySelector("line")!.setAttribute("x1", String(x));
  g.querySelector("line")!.setAttribute("x2", String(x));
  const tx = g.querySelector("text")!;
  tx.setAttribute("x", String(x + 4));
  tx.textContent = fmtYear(year);
  const alive = (p: Person) => p.born <= year && year <= p.died;
  const names = state.t.people.filter(alive).map((p) => p.name);
  note.textContent = names.length ? `${fmtYear(year)} 年在世：${names.join("、")}` : `${fmtYear(year)} 年，这里收录的人都不在世。`;
  paint(alive);
}

function relRow(label: string, ids: string[]) {
  if (!ids.length) return "";
  return `<div class="wr-row"><span class="lb">${label}</span><span>${ids.map((id) => {
    const p = personById(id)!;
    return `<button class="pchip" data-person="${id}" style="--g:${periodVar(p.period)}"><i></i>${esc(p.name)}</button>`;
  }).join("")}</span></div>`;
}

function personCard(p: Person) {
  const t = state.t;
  const inv = (k: keyof Person["rel"]) => t.people.filter((q) => q.rel[k]?.includes(p.id)).map((q) => q.id);
  const src = portraitSrc(p);
  const c = state.credits[`person:${p.id}`];
  const ws = worksBy(p.id);
  const encs = t.encounters.map((e, i) => ({ e, i })).filter(({ e }) => e.people.includes(p.id));
  const per = periodOf(p.period);
  const from = [...(p.rel.teachers ?? []), ...(p.rel.influences ?? [])];
  const to = [...inv("teachers"), ...inv("influences")];
  return `<div class="wc" style="--g:${periodVar(p.period)}">
    <div class="wc-main">
      <div class="wc-head">
        <div class="wc-face">${src ? `<img src="${src}" alt="${esc(p.name)}的肖像" decoding="async">` : `<span>${esc(p.name[0])}</span>`}</div>
        <div>
          <div class="wc-roles">${p.roles.map(esc).join(" · ")}</div>
          <h3>${esc(p.name)}</h3>
          <div class="wc-en">${esc(p.en)}</div>
          <div class="wc-meta"><span>${lifeText(p)}</span><span>${ageText(p)}</span><span>${p.cities.map(esc).join("、")}</span></div>
        </div>
      </div>
      <p class="wc-line">${esc(p.line)}</p>
      <ul class="wc-points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      ${ws.length ? `<div class="wc-works">${ws.map((w) => `<button data-w="${w.id}" title="${esc(w.title)}" aria-label="《${esc(w.title)}》">${hasImage(w) ? `<img src="${imgSrc(w, "thumb")}" alt="" loading="lazy">` : `<span>${esc(w.title[0])}</span>`}<small>${esc(w.title)}</small></button>`).join("")}</div>` : ""}
      ${c ? `<div class="credit-line">肖像：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">维基共享资源</a></div>` : ""}
    </div>
    <div class="wc-side">
      <div class="wc-chain">
        <div class="ch-col">${from.length ? relRow("师承与来源", from) : `<div class="wr-row"><span class="lb">师承与来源</span><span class="none">—</span></div>`}</div>
        <div class="ch-me"><span>${esc(p.name)}</span></div>
        <div class="ch-col">${to.length ? relRow("学生与后来者", to) : `<div class="wr-row"><span class="lb">学生与后来者</span><span class="none">—</span></div>`}</div>
      </div>
      ${relRow("对手", p.rel.rivals ?? [])}
      ${relRow("赞助人", p.rel.patrons ?? [])}
      ${relRow("资助过", inv("patrons"))}
      ${encs.length ? `<div class="wc-enc"><span class="lb">相遇</span><ol>${encs.map(({ e, i }) => `<li><button data-e="${i}"><span class="y">${esc(e.yearText ?? String(e.year))}</span>${esc(e.title)}</button></li>`).join("")}</ol></div>` : ""}
      <div class="wc-act">
        <button class="btn" data-go="${per.id}">去${esc(per.short)}展厅</button>
        <a class="btn" href="${wikiSearch(p.name)}" target="_blank" rel="noopener">维基百科 ↗</a>
      </div>
    </div>
  </div>`;
}

function encCard(e: Encounter) {
  return `<div class="ec">
    <div class="ec-when"><b>${esc(e.yearText ?? String(e.year))}</b><span>${esc(e.place)}</span></div>
    <div>
      <h3>${esc(e.title)}</h3>
      <p>${esc(e.text)}</p>
      ${relRow("在场的人", e.people)}
    </div>
  </div>`;
}

function showCard() {
  const box = $("#who-card");
  const t = state.t;
  box.innerHTML = sel.kind === "person" ? personCard(personById(sel.id)!) : encCard(t.encounters[sel.i]);
  if (!prefersReducedMotion()) { box.classList.remove("enter"); void box.offsetWidth; box.classList.add("enter"); }
  paint();
  // 窄屏上图表横向滚动：把选中的人或相遇滚到可见范围中间
  const wrap = $("#life-svg").parentElement!;
  if (wrap.scrollWidth > wrap.clientWidth) {
    const yr = sel.kind === "person" ? (personById(sel.id)!.born + personById(sel.id)!.died) / 2 : t.encounters[sel.i].year;
    const px = (X(yr) / VW) * $("#life-svg").clientWidth;
    wrap.scrollTo({ left: px - wrap.clientWidth / 2, behavior: "auto" });
  }
}

export function showPerson(id: string, scroll = true) {
  if (!personById(id)) return;
  sel = { kind: "person", id };
  showCard();
  history.replaceState(null, "", `#who-${id}`);
  if (scroll) $("#people").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

function showEncounter(i: number) {
  sel = { kind: "enc", i };
  showCard();
}

let bound = false;
export function initPeople() {
  const t = state.t;
  $("#people").hidden = !t.people.length;
  if (!t.people.length) return;
  if (!personById(sel.kind === "person" ? sel.id : "")) sel = { kind: "person", id: t.people[0].id };
  render();
  const svg = $("#life-svg") as unknown as SVGSVGElement;
  const yearAt = (e: PointerEvent) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return unX(p.x);
  };
  svg.onpointermove = (e) => scrubTo(yearAt(e));
  svg.onpointerdown = (e) => scrubTo(yearAt(e));
  svg.onpointerleave = () => scrubTo(null);
  const pick = (el: Element) => {
    const g = el.closest<SVGGElement>(".life-p,.enc");
    if (!g) return false;
    if (g.classList.contains("enc")) showEncounter(+g.dataset.e!);
    else showPerson(g.dataset.p!, false);
    return true;
  };
  svg.onclick = (e) => pick(e.target as Element);
  svg.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && pick(e.target as Element)) e.preventDefault(); };
  $("#who-card").onclick = (e) => {
    const el = e.target as Element;
    const w = el.closest<HTMLElement>("[data-w]");
    if (w && sel.kind === "person") return actions.openWork(w.dataset.w!, true, worksBy(sel.id).map((x) => x.id));
    const en = el.closest<HTMLElement>("[data-e]");
    if (en) return showEncounter(+en.dataset.e!);
    const go = el.closest<HTMLElement>("[data-go]");
    if (go) return actions.goPeriod(periodIndex(go.dataset.go!), true);
  };
  if (!bound) {
    bound = true;
    // 页面任意位置的人名链接（展签、大图、卡片里的关系人）
    document.addEventListener("click", (e) => {
      const b = (e.target as Element).closest<HTMLElement>("[data-person]");
      if (!b) return;
      e.preventDefault();
      const inLightbox = !!b.closest("#lightbox");
      if (inLightbox) $("#lb-close").click();
      showPerson(b.dataset.person!, !b.closest("#people"));
    });
    const fromHash = () => {
      const m = location.hash.match(/^#who-(.+)$/);
      if (m && personById(m[1])) showPerson(m[1]);
    };
    addEventListener("hashchange", fromHash);
    setTimeout(fromHash, 0);
  }
  showCard();
}
