import { $, esc } from "../lib/dom";
import { state, workById, periodVar } from "../state";

/* 画有多大：同一比例尺下与 1.7 米的人并排 */
let on: boolean[] = [];

function render() {
  const sizes = state.t.sizes;
  $("#size-chips").innerHTML = sizes.map((s, i) => {
    const w = workById(s.work)!;
    return `<button data-i="${i}" aria-pressed="${on[i]}" style="--g:${periodVar(w.period)}"><i></i>${esc(w.title)}</button>`;
  }).join("");
  const gy = 300, x0 = 90, k = (600 - x0) / 8.8; // 像素/米
  let s = `<line x1="10" y1="${gy}" x2="610" y2="${gy}" class="s-mut"/>`;
  for (let m = 0; m <= 8; m++) s += `<line x1="${x0 + m * k}" y1="${gy}" x2="${x0 + m * k}" y2="${gy + 6}" class="s-mut"/><text x="${x0 + m * k}" y="${gy + 20}" text-anchor="middle" class="t-mono t-m">${m}m</text>`;
  sizes.map((x, i) => ({ x, i })).filter(({ i }) => on[i])
    .sort((a, b) => b.x.heightCm * b.x.widthCm - a.x.heightCm * a.x.widthCm)
    .forEach(({ x }, i) => {
      const work = workById(x.work)!, w = (x.widthCm / 100) * k, h = (x.heightCm / 100) * k, c = periodVar(work.period), big = w > 60;
      s += `<rect x="${x0}" y="${gy - h}" width="${w}" height="${h}" style="fill:${c};fill-opacity:.12;stroke:${c}" stroke-width="2"/>`;
      s += big
        ? `<text x="${x0 + w - 6}" y="${gy - h + 16}" text-anchor="end" class="t-s t-b" style="fill:${c}">${esc(work.title)}</text><text x="${x0 + w - 6}" y="${gy - h + 30}" text-anchor="end" class="t-mono" style="fill:${c}">${(x.heightCm / 100).toFixed(2)}×${(x.widthCm / 100).toFixed(2)} m</text>`
        : `<line x1="${x0 + w}" y1="${gy - h}" x2="${x0 + w + 14}" y2="${gy - h - 10 - i * 14}" style="stroke:${c}"/><text x="${x0 + w + 16}" y="${gy - h - 6 - i * 14}" class="t-s" style="fill:${c}">${esc(work.title)} ${x.heightCm}×${x.widthCm} cm</text>`;
    });
  const ph = 1.7 * k, px = 46;
  s += `<g class="f-ink"><circle cx="${px}" cy="${gy - ph + ph * 0.07}" r="${ph * 0.07}"/><path d="M${px - ph * 0.12} ${gy - ph * 0.82} Q${px} ${gy - ph * 0.86} ${px + ph * 0.12} ${gy - ph * 0.82} L${px + ph * 0.1} ${gy - ph * 0.45} L${px + ph * 0.06} ${gy} L${px + ph * 0.01} ${gy} L${px} ${gy - ph * 0.4} L${px - ph * 0.01} ${gy} L${px - ph * 0.06} ${gy} L${px - ph * 0.1} ${gy - ph * 0.45} Z"/></g><text x="${px}" y="${gy - ph - 6}" text-anchor="middle" class="t-s t-b">1.7 m</text>`;
  $("#size-svg").innerHTML = s;
}

export function initSizes() {
  on = state.t.sizes.map((s) => s.default);
  $("#sizes").hidden = state.t.sizes.length === 0;
  $("#size-chips").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) { on[+b.dataset.i!] = !on[+b.dataset.i!]; render(); }
  };
  render();
}
