import type { Diagram, DiagramContext } from "../types";
import { q, $$, esc } from "../helpers";

/* 18 现代：流派时间表。流派数据来自 content/traditions/western/movements.json */
const X = (y: number) => 130 + ((y - 1890) / 80) * 410;
const RH = 26, TOP = 34;

const data = (ctx: DiagramContext) => ctx.tradition.movements ?? { roots: [], movements: [] };
const rootOf = (ctx: DiagramContext, id: string) => data(ctx).roots.find((r) => r.id === id);

const diagram: Diagram = {
  html(ctx) {
    const { roots, movements } = data(ctx);
    const n = movements.length;
    return `<div class="dg-wrap"><svg class="dg" id="mod-svg" viewBox="0 0 560 ${TOP + n * RH + 24}" role="img" aria-label="1890 到 1970 年现代艺术流派时间表">
  ${[1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970].map((y) => `<line x1="${X(y)}" y1="${TOP - 6}" x2="${X(y)}" y2="${TOP + n * RH}" class="s-line"/><text x="${X(y)}" y="${TOP - 12}" text-anchor="middle" class="t-mono t-m">${y}</text>`).join("")}
  ${movements.map((m, i) => {
    const y = TOP + i * RH, root = rootOf(ctx, m.root);
    return `<g class="mrow" data-i="${i}" style="cursor:pointer"><rect x="0" y="${y}" width="560" height="${RH}" class="f-panel" style="opacity:0"/><text x="122" y="${y + 17}" text-anchor="end" class="t-b t-s">${esc(m.name)}</text><rect x="${X(m.start)}" y="${y + 5}" width="${Math.max(6, X(m.end) - X(m.start))}" height="${RH - 10}" rx="3" style="fill:${root ? ctx.groupVar(root.group) : "var(--muted)"}" class="mbar"/></g>`;
  }).join("")}
  <path d="M${X(1893)} ${TOP + 4} l5 9 l-10 0 Z" class="f-acc"/><text x="${X(1893) + 8}" y="${TOP + 14}" class="t-s t-acc">《呐喊》1893</text>
  <g transform="translate(130 ${TOP + n * RH + 18})">${roots.map((r, i) => `<rect x="${i * 90}" y="-9" width="12" height="10" rx="2" style="fill:${ctx.groupVar(r.group)}"/><text x="${i * 90 + 16}" y="0" class="t-s">${esc(r.name)}</text>`).join("")}</g>
  </svg></div>
  <div class="info-box" id="mod-info"></div>`;
  },
  init(r, ctx) {
    const { movements } = data(ctx);
    const show = (i: number) => {
      const m = movements[i];
      if (!m) return;
      q(r, "#mod-info").innerHTML = `<b>${esc(m.name)}</b>（${m.start}–${m.end}，根：${esc(rootOf(ctx, m.root)?.name ?? "")}）${esc(m.note)}`;
      $$(".mrow", r).forEach((g) => (q(g, ".mbar").style.opacity = +g.dataset.i! === i ? 1 : 0.45));
    };
    $$(".mrow", r).forEach((g) => {
      g.addEventListener("click", () => show(+g.dataset.i!));
      g.addEventListener("pointerenter", () => show(+g.dataset.i!));
    });
    show(0);
  },
};

export default diagram;
