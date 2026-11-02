import { $, esc } from "../lib/dom";
import { state, actions, periodVar } from "../state";

/* 理性与激情的钟摆：每个时期一个点，纵轴为 mood（-2 理性 … +2 激情） */
export function renderPendulum() {
  const t = state.t, cfg = t.meta.pendulum;
  if (!cfg) { $("#pendulum").hidden = true; return; }
  const W = 900, H = 250, L = 60, R = 20, T = 24, B = 50, n = t.periods.length;
  const step = (W - L - R) / Math.max(1, n - 1);
  const y = (m: number) => T + (H - T - B) / 2 - (m / 2) * ((H - T - B) / 2);
  const pts = t.periods.map((p, i) => [L + i * step, y(p.mood)]);
  let s = `<rect x="${L - 10}" y="${T - 6}" width="${W - L - R + 20}" height="${(H - T - B) / 2 + 6}" class="f-wall" opacity=".5"/>`;
  s += `<line x1="${L - 10}" x2="${W - R + 10}" y1="${y(0)}" y2="${y(0)}" class="s-mut" stroke-dasharray="3 4"/>`;
  s += `<text x="4" y="${y(1.5)}" class="t-s t-b">${esc(cfg.high[0])}</text><text x="4" y="${y(1.5) + 15}" class="t-s t-m">${esc(cfg.high[1])}</text><text x="4" y="${y(-1.5)}" class="t-s t-b">${esc(cfg.low[0])}</text><text x="4" y="${y(-1.5) + 15}" class="t-s t-m">${esc(cfg.low[1])}</text>`;
  s += `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" class="s-mut" stroke-width="2" stroke-linejoin="round"/>`;
  pts.forEach((p, i) => {
    const per = t.periods[i], c = periodVar(per.id), on = i === state.cur;
    s += `<circle class="dot" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="${on ? 9 : 6}" style="fill:${on ? c : "var(--panel)"};stroke:${c}" stroke-width="3" tabindex="0" role="button" aria-label="${esc(per.name)}"/>`;
    s += `<text x="${p[0]}" y="${H - B + 26}" text-anchor="middle" class="t-s ${on ? "t-b" : "t-m"}">${esc(per.short)}</text>`;
  });
  $("#pend").innerHTML = s;
}

export function initPendulum() {
  const cfg = state.t.meta.pendulum;
  $("#pendulum").hidden = !cfg;
  if (cfg) {
    $("#pend-title").textContent = cfg.title;
    $("#pend-note").textContent = cfg.note + " 点圆点跳到对应展厅。";
  }
  const svg = $("#pend");
  svg.onclick = (e) => {
    const d = (e.target as Element).closest<SVGCircleElement>(".dot");
    if (d) actions.goPeriod(+d.dataset.i!, true);
  };
  svg.onkeydown = (e) => {
    const d = (e.target as Element).closest<SVGCircleElement>(".dot");
    if (d && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); actions.goPeriod(+d.dataset.i!, true); }
  };
  renderPendulum();
}
