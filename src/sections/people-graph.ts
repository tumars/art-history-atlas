import { $, esc, store } from "../lib/dom";
import { state, personById, periodVar } from "../state";
import { VW } from "./people-axis";
import { fmtYear } from "../lib/format";

/* 人物关系图：横向按出生年，纵向由排布算法决定；五种关系可逐类开关 */

export type RelKind = "teacher" | "influence" | "rival" | "patron" | "met";
interface Edge { a: string; b: string; kind: RelKind; note?: string }
interface Node { id: string; tx: number; x: number; y: number; vx: number; vy: number }

const H = 640;
const TOP = 40;
const R = 15;
export const KINDS: { kind: RelKind; label: string; verb: string }[] = [
  { kind: "teacher", label: "师承", verb: "教过" },
  { kind: "influence", label: "影响", verb: "影响了" },
  { kind: "rival", label: "对手", verb: "与之较劲" },
  { kind: "patron", label: "赞助", verb: "资助了" },
  { kind: "met", label: "相遇", verb: "见过" },
];
const OFF_KEY = "aha.graphOff";
let off = new Set<RelKind>();
let edges: Edge[] = [];
let nodes = new Map<string, Node>();
let onPick: (id: string) => void = () => {};
let focus: Set<string> | null = null; // 当前突出的人
let focusPair: ((e: Edge) => boolean) | null = null;
let hoverId: string | null = null;
let rankX = (_i: number) => 0;
let ticks: { c: number; i: number }[] = [];

function buildEdges() {
  const t = state.t;
  const out: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: string, b: string, kind: RelKind, note?: string) => {
    const key = kind === "rival" || kind === "met" ? [kind, ...[a, b].sort()].join("|") : `${kind}|${a}|${b}`;
    if (seen.has(key) || a === b) return;
    seen.add(key);
    out.push({ a, b, kind, note });
  };
  for (const p of t.people) {
    p.rel.teachers?.forEach((x) => add(x, p.id, "teacher"));
    p.rel.influences?.forEach((x) => add(x, p.id, "influence"));
    p.rel.rivals?.forEach((x) => add(p.id, x, "rival"));
    p.rel.patrons?.forEach((x) => add(x, p.id, "patron"));
  }
  const linked = new Set(out.map((e) => [e.a, e.b].sort().join("|")));
  for (const e of t.encounters) {
    for (let i = 0; i < e.people.length; i++)
      for (let j = i + 1; j < e.people.length; j++) {
        const pair = [e.people[i], e.people[j]].sort().join("|");
        if (!linked.has(pair)) add(e.people[i], e.people[j], "met", `${e.yearText ?? e.year}，${e.place}：${e.title}`);
      }
  }
  return out;
}

/** 固定初值的简单力导向：x 拉向出生年，y 由连线吸引、节点排斥决定 */
function layout() {
  const t = state.t;
  const list = [...t.people].sort((a, b) => a.born - b.born);
  // 按出生先后等距排开：保持左右顺序，又不让 19 世纪挤成一团
  const L = 40, span = VW - L * 2;
  rankX = (i: number) => L + (i / Math.max(1, list.length - 1)) * span;
  ticks = [];
  for (const c of [-500, 1000, 1300, 1400, 1500, 1600, 1700, 1800, 1900]) {
    const i = list.findIndex((p) => p.born >= c);
    if (i >= 0 && !ticks.some((t) => Math.abs(rankX(t.i) - rankX(i)) < 34)) ticks.push({ c, i });
  }
  nodes = new Map();
  list.forEach((p, i) => {
    const tx = rankX(i);
    nodes.set(p.id, { id: p.id, tx, x: tx, y: TOP + 40 + ((i * 7) % 5) * ((H - TOP - 100) / 4), vx: 0, vy: 0 });
  });
  const arr = [...nodes.values()];
  const links = edges.map((e) => [nodes.get(e.a)!, nodes.get(e.b)!, e.kind === "met" ? 0.003 : 0.008] as const);
  for (let it = 0; it < 520; it++) {
    const cool = 1 - it / 560;
    for (const n of arr) {
      n.vx += (n.tx - n.x) * 0.03;
      n.vy += (H / 2 + 10 - n.y) * 0.0012;
    }
    for (const [a, b, k] of links) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - 95) * k;
      a.vy += (dy / d) * f; b.vy -= (dy / d) * f;
      a.vx += (dx / d) * f * 0.3; b.vx -= (dx / d) * f * 0.3;
    }
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > 200 * 200) continue;
        if (d2 < 1) { dy = 1; d2 = 1; }
        const d = Math.sqrt(d2);
        let f = 1500 / d2;
        if (d < 54) f += (54 - d) * 0.3; // 不重叠（含名字）
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx -= fx * 0.4; b.vx += fx * 0.4;
        a.vy -= fy; b.vy += fy;
      }
    for (const n of arr) {
      n.vx *= 0.55; n.vy *= 0.55;
      n.x += n.vx * cool; n.y += n.vy * cool;
      n.x = Math.min(VW - 24, Math.max(24, n.x));
      n.y = Math.min(H - 30, Math.max(TOP + 18, n.y));
    }
  }
}

const curve = (a: Node, b: Node) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  const bend = Math.min(40, d * 0.18);
  const cx = mx - (dy / d) * bend, cy = my + (dx / d) * bend;
  // 终点停在节点边缘，箭头不被头像挡住
  const ex = b.x - ((b.x - cx) / Math.hypot(b.x - cx, b.y - cy)) * (R + 3);
  const ey = b.y - ((b.y - cy) / Math.hypot(b.x - cx, b.y - cy)) * (R + 3);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
};

/** 节点下的名字：长名取最后一段，重名时用全名 */
function shortName(id: string) {
  const p = personById(id)!;
  const cut = (n: string) => (n.length > 6 ? n.replace(/^.*·/, "") : n);
  const dup = state.t.people.filter((q) => cut(q.name) === cut(p.name)).length > 1;
  return dup ? p.name.replace(/·德·/, "·") : cut(p.name);
}

function draw() {
  const svg = $("#graph-svg");
  svg.setAttribute("viewBox", `0 0 ${VW} ${H}`);
  let s = `<defs>${(["teacher", "influence", "patron"] as RelKind[]).map((k) => `<marker id="ar-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8z" class="ar ar-${k}"/></marker>`).join("")}
    <clipPath id="face-clip"><circle r="${R}"/></clipPath></defs>`;
  for (const { c, i } of ticks) {
    const x = rankX(i) - 8;
    s += `<line x1="${x}" x2="${x}" y1="${TOP - 12}" y2="${H}" class="grid"/><text x="${x + 3}" y="${TOP - 16}" class="t-s t-m">${fmtYear(c)}</text>`;
  }
  s += `<text x="${VW - 4}" y="${TOP - 32}" text-anchor="end" class="t-s t-m">按出生先后从左往右排，刻度是该年以后出生的第一人</text>`;
  s += `<g class="g-edges">${edges.map((e, i) => {
    const a = nodes.get(e.a)!, b = nodes.get(e.b)!;
    const k = KINDS.find((x) => x.kind === e.kind)!;
    const title = e.kind === "met" ? `${personById(e.a)!.name} 与 ${personById(e.b)!.name}：${e.note}` : `${personById(e.a)!.name} ${k.verb} ${personById(e.b)!.name}`;
    const arrow = e.kind === "teacher" || e.kind === "influence" || e.kind === "patron" ? ` marker-end="url(#ar-${e.kind})"` : "";
    return `<path d="${curve(a, b)}" class="ed ed-${e.kind}" data-i="${i}"${arrow}><title>${esc(title)}</title></path>`;
  }).join("")}</g>`;
  s += `<g class="g-nodes">${[...nodes.values()].map((n) => {
    const p = personById(n.id)!;
    const c = state.credits[`person:${p.id}`];
    const face = c
      ? `<image href="${import.meta.env.BASE_URL + (c.thumb || c.file)}" x="${-R}" y="${-R}" width="${R * 2}" height="${R * 2}" preserveAspectRatio="xMidYMin slice" clip-path="url(#face-clip)"/>`
      : `<text class="ini" text-anchor="middle" y="5">${esc(p.name[0])}</text>`;
    return `<g class="nd" data-p="${p.id}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" style="--g:${periodVar(p.period)}" tabindex="0" role="button" aria-label="${esc(p.name)}，${fmtYear(p.born)} 年生">
      <circle r="${R + 2.5}" class="ring"/><circle r="${R}" class="bg"/>${face}
      <text y="${R + 14}" text-anchor="middle" class="nm">${esc(shortName(p.id))}</text></g>`;
  }).join("")}</g>`;
  svg.innerHTML = s;
  applyOff();
  paintGraph();
}

function renderLegend() {
  $("#graph-legend").innerHTML = KINDS.map(({ kind, label }) =>
    `<button data-k="${kind}" aria-pressed="${!off.has(kind)}"><svg width="26" height="10" aria-hidden="true"><path d="M1 5 H25" class="ed ed-${kind}"/></svg>${label}<sup>${edges.filter((e) => e.kind === kind).length}</sup></button>`).join("");
}

function applyOff() {
  document.querySelectorAll<SVGPathElement>("#graph-svg .ed").forEach((el) => {
    const e = edges[+el.dataset.i!];
    el.style.display = off.has(e.kind) ? "none" : "";
  });
}

function paintGraph() {
  const id = hoverId;
  let set = focus, pairOk = focusPair;
  if (id) {
    set = new Set([id]);
    edges.forEach((e) => { if (!off.has(e.kind) && (e.a === id || e.b === id)) { set!.add(e.a); set!.add(e.b); } });
    pairOk = (e) => e.a === id || e.b === id;
  }
  document.querySelectorAll<SVGGElement>("#graph-svg .nd").forEach((g) => {
    const pid = g.dataset.p!;
    g.classList.toggle("dim", !!set && !set.has(pid));
    g.classList.toggle("on", (id ?? (focus && focus.size === 1 ? [...focus][0] : null)) === pid || (!id && !!focusPair && !!set?.has(pid)));
  });
  document.querySelectorAll<SVGPathElement>("#graph-svg .ed").forEach((el) => {
    const e = edges[+el.dataset.i!];
    const hit = !!pairOk && pairOk(e);
    el.classList.toggle("hot", hit);
    el.classList.toggle("dim", !!set && !hit);
  });
}

/** people.ts 调用：选中人或相遇时同步突出 */
export function highlightGraph(sel: { kind: "person"; id: string } | { kind: "enc"; people: string[] }) {
  if (!edges.length) return;
  if (sel.kind === "person") {
    const id = sel.id;
    focus = new Set([id]);
    edges.forEach((e) => { if (!off.has(e.kind) && (e.a === id || e.b === id)) { focus!.add(e.a); focus!.add(e.b); } });
    focusPair = (e) => e.a === id || e.b === id;
  } else {
    const ps = new Set(sel.people);
    focus = ps;
    focusPair = (e) => ps.has(e.a) && ps.has(e.b);
  }
  paintGraph();
}

export function renderGraph(pick: (id: string) => void) {
  onPick = pick;
  off = new Set(store.get<RelKind[]>(OFF_KEY, []));
  edges = buildEdges();
  layout();
  draw();
  renderLegend();
  const svg = $("#graph-svg");
  const nodeOf = (el: EventTarget | null) => (el as Element | null)?.closest?.<SVGGElement>(".nd") ?? null;
  svg.onpointerover = (e) => { const g = nodeOf(e.target); hoverId = g ? g.dataset.p! : null; paintGraph(); };
  svg.onpointerleave = () => { hoverId = null; paintGraph(); };
  if (!svg.dataset.bound) {
    svg.dataset.bound = "1";
    svg.addEventListener("focusin", (e) => { const g = nodeOf(e.target); hoverId = g ? g.dataset.p! : null; paintGraph(); });
    svg.addEventListener("focusout", () => { hoverId = null; paintGraph(); });
  }
  svg.onclick = (e) => { const g = nodeOf(e.target); if (g) onPick(g.dataset.p!); };
  svg.onkeydown = (e) => { const g = nodeOf(e.target); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick(g.dataset.p!); } };
  $("#graph-legend").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button[data-k]");
    if (!b) return;
    const k = b.dataset.k as RelKind;
    off.has(k) ? off.delete(k) : off.add(k);
    store.set(OFF_KEY, [...off]);
    b.setAttribute("aria-pressed", String(!off.has(k)));
    applyOff();
    paintGraph();
  };
}
