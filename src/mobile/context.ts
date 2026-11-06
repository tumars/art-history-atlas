import { state, workById, portraitSrc } from "../state";
import { esc } from "../lib/dom";
import { artImage } from "../lib/art-image";
import { observeImages } from "../lib/image-loading";
import { diagramFor, diagramContext } from "../diagrams";
import { fmtYear } from "../lib/format";
import land from "../assets/relay-land.svg?raw";
import { peopleNetwork } from "./people-network";

const entries = [
  ["chronology", "沿着年代看", "时代与历史对照"],
  ["relay", "艺术中心地图", "艺术为什么在这里发生"],
  ["schools", "派系与关系", "从人物走近流派"],
  ["pendulum", "理性与激情", "看见审美的来回摆动"],
  ["pairs", "并置看画", "同一个问题，两种回答"],
  ["sizes", "画有多大", "与 1.7 米的人比较"],
] as const;
export function contextLinks() {
  return entries
    .map(
      ([id, title, sub]) =>
        `<button class="list-row" data-context="${id}"><span><strong>${title}</strong><small>${sub}</small></span>→</button>`,
    )
    .join("");
}
const choose = (options: [string, string][], value: string) =>
  `<select class="context-select" data-context-value aria-label="选择内容">${options.map(([id, name]) => `<option value="${esc(id)}" ${id === value ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>`;
const workButton = (id: string) => {
  const w = workById(id);
  return w
    ? `<button class="tile" data-work="${w.id}">${artImage(w)}<strong>${esc(w.title)}</strong><small>${esc(w.artist)}</small></button>`
    : "";
};
const personButton = (id: string) => {
  const p = state.t.people.find((p) => p.id === id);
  if (!p) return "";
  const src = portraitSrc(p, "thumb");
  return `<button class="list-row" data-person="${id}">${src ? `<img src="${esc(src)}" alt="" width="44" height="44" loading="lazy" style="width:44px;height:44px;object-fit:cover;border-radius:50%">` : ""}<span><strong>${esc(p.name)}</strong><small>${esc(p.line)}</small></span>→</button>`;
};

export function contextPage(id: string, value: string) {
  const t = state.t;
  let title = entries.find((x) => x[0] === id)?.[1] || "作品图解",
    body = "";
  if (id === "chronology") {
    const p = t.periods.find((p) => p.id === value) || t.periods[0];
    body =
      choose(
        t.periods.map((p) => [p.id, `${p.short} · ${p.span}`]),
        p.id,
      ) +
      `<h3>${esc(p.name)}</h3><p>${esc(p.thesis)}</p><button data-hall="${p.id}" class="primary">进入这一展厅 →</button>`;
    body += t.bands
      .map(
        (b) =>
          `<h3>${esc(b.label)}</h3>${
            b.items
              .filter((x) => x.end >= p.start && x.start <= p.end)
              .map(
                (x) =>
                  `<article class="source"><strong>${esc(x.name)}</strong><p>${fmtYear(x.start)} — ${fmtYear(x.end)}</p>${x.values.map((v, i) => `<p>${esc(b.fields[i])}：${esc(v)}</p>`).join("")}</article>`,
              )
              .join("") || "<p>此时期暂无对应资料。</p>"
          }`,
      )
      .join("");
    body +=
      "<h3>历史与艺术</h3>" +
      t.events
        .filter((e) => e.periods.includes(p.id))
        .map(
          (e) =>
            `<article><strong>${esc(e.yearText)} · ${esc(e.name)}</strong><p>${esc(e.what)}</p><p>${esc(e.art)}</p></article>`,
        )
        .join("");
  } else if (id === "relay") {
    const relay =
      t.meta.relay.find((x) => x.period === value) || t.meta.relay[0];
    const points = t.meta.relay.flatMap((x) =>
      x.points.map((p) => ({ ...p, period: x.period })),
    );
    const x = (lon: number) => (lon + 100) * 6,
      y = (lat: number) => (70 - lat) * 8;
    const bounds = relay.points.some((p) => p.lon < -30)
      ? "0 0 900 440"
      : "520 80 350 300";
    body =
      choose(
        t.meta.relay.map((x) => [x.period, `${x.place} · ${x.era}`]),
        relay.period,
      ) +
      `<svg class="context-map" viewBox="${bounds}" role="img" aria-label="艺术中心位置示意，经纬度定位，不表示国界">${land}<path d="${points.map((p, i) => `${i ? "L" : "M"}${x(p.lon)},${y(p.lat)}`).join(" ")}" fill="none" stroke="#9d9472" stroke-width="1"/>${points.map((p) => `<circle cx="${x(p.lon)}" cy="${y(p.lat)}" r="${p.period === relay.period ? 6 : 2}" fill="${p.period === relay.period ? "#a75237" : "#7b806e"}"/>`).join("")}${relay.points.map((p) => `<text x="${x(p.lon) + 8}" y="${y(p.lat) - 8}">${esc(p.name)}</text>`).join("")}</svg><p class="lede">海岸线：<a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener">Natural Earth</a>。连线仅为主线概览，不代表唯一中心或直接传播路径。</p><h3>${esc(relay.place)}</h3><p>${esc(relay.note)}</p><button class="primary" data-hall="${relay.period}">进入相关展厅 →</button>`;
  } else if (id === "schools") {
    const school = t.schools.find((x) => x.id === value) || t.schools[0];
    body =
      choose(
        t.schools.map((x) => [x.id, x.name]),
        school.id,
      ) +
      `<h3>${esc(school.name)}</h3><p class="lede">${esc(school.en)} · ${esc(school.span)}</p><p>${esc(school.summary)}</p>` +
      school.members.map(personButton).join("") +
      (school.related || [])
        .map((x) => `<p>${esc(x.role)}</p>${personButton(x.person)}`)
        .join("");
    body +=
      '<div class="links"><button data-context="people-life">查看人物生命线 →</button><button data-context="people-graph">查看人物关系图 →</button></div>';
    body +=
      "<h3>相遇与交汇</h3>" +
      t.encounters
        .filter((x) => x.people.some((id) => school.members.includes(id)))
        .map(
          (x) =>
            `<details class="source"><summary>${esc(x.yearText || fmtYear(x.year))} · ${esc(x.title)}</summary><p>${esc(x.text)}</p>${x.people.map(personButton).join("")}</details>`,
        )
        .join("");
    if (t.movements)
      body +=
        "<h3>流派延续</h3>" +
        t.movements.movements
          .map(
            (x) =>
              `<details class="source"><summary>${esc(x.name)} · ${fmtYear(x.start)} — ${fmtYear(x.end)}</summary><p>${esc(x.note)}</p></details>`,
          )
          .join("");
  } else if (id === "people-life") {
    title = "人物生命线";
    const school = t.schools.find((x) => x.id === value) || t.schools[0];
    const list = t.people
      .filter((p) => school.members.includes(p.id))
      .sort((a, b) => a.born - b.born);
    const start = Math.min(...list.map((p) => p.born)),
      end = Math.max(...list.map((p) => p.died));
    const x = (year: number) =>
      20 + ((year - start) / Math.max(1, end - start)) * 280;
    body =
      choose(
        t.schools.map((x) => [x.id, x.name]),
        school.id,
      ) +
      `<p class="lede">同一派系内按实际年份线性排列。点姓名认识人物；虚线表示约数。</p><svg viewBox="0 0 320 ${list.length * 70 + 40}" role="group" aria-label="${esc(school.name)}人物生命线"><text x="20" y="18" font-size="12" fill="currentColor">${fmtYear(start)}</text><text x="300" y="18" text-anchor="end" font-size="12" fill="currentColor">${fmtYear(end)}</text>${list.map((p, i) => `<g role="button" tabindex="0" data-person="${p.id}" aria-label="${esc(p.name)}，${fmtYear(p.born)}至${esc(p.diedText || fmtYear(p.died))}"><rect x="0" y="${i * 70 + 25}" width="320" height="65" fill="transparent"/><text x="20" y="${i * 70 + 45}" font-size="14" fill="currentColor">${esc(p.name)}</text><line x1="${x(p.born)}" y1="${i * 70 + 62}" x2="${x(p.died)}" y2="${i * 70 + 62}" stroke="#a9864f" stroke-width="4" ${p.approx ? 'stroke-dasharray="5 3"' : ""}/></g>`).join("")}</svg>` +
      list.map((p) => personButton(p.id)).join("");
  } else if (id === "people-graph") {
    return peopleNetwork();
  } else if (id === "pendulum") {
    body =
      `<p>${esc(t.meta.pendulum?.note || "示意艺术倾向，不是对艺术价值的评分。")}</p><p>← 理性 / 秩序　　情感 / 激情 →</p>` +
      t.periods
        .map(
          (p) =>
            `<button class="list-row" data-hall="${p.id}"><span><strong>${esc(p.short)}</strong><small>${esc(p.thesis)}</small><span style="display:block;position:relative;width:100%;height:16px;border-bottom:1px solid #999"><i style="position:absolute;left:${((p.mood + 2) / 4) * 94}%;color:#aa663c">●</i></span></span></button>`,
        )
        .join("");
  } else if (id === "pairs") {
    const pair = t.comparisons.find((x) => x.id === value) || t.comparisons[0];
    body =
      choose(
        t.comparisons.map((x) => [x.id, x.tab]),
        pair.id,
      ) +
      `<div class="grid">${workButton(pair.a)}${workButton(pair.b)}</div><p>${esc(pair.summary)}</p>` +
      pair.rows
        .map(
          ([label, a, b]) =>
            `<h3>${esc(label)}</h3><div class="grid"><p>${esc(a)}</p><p>${esc(b)}</p></div>`,
        )
        .join("");
  } else if (id === "sizes") {
    const size = t.sizes.find((x) => x.work === value) || t.sizes[0],
      w = workById(size.work)!;
    const factor = Math.min(
      1.1,
      195 / Math.max(size.heightCm, 170),
      230 / size.widthCm,
    );
    body =
      choose(
        t.sizes.map((x) => [x.work, workById(x.work)!.title]),
        size.work,
      ) +
      `<div class="scale-row"><figure><div style="height:${170 * factor}px;width:${40 * factor}px;background:#818777;clip-path:polygon(35% 0,65% 0,70% 12%,60% 18%,90% 22%,100% 60%,75% 60%,65% 100%,52% 100%,50% 65%,48% 100%,35% 100%,25% 60%,0 60%,10% 22%,40% 18%,30% 12%)"></div><figcaption>1.7 m</figcaption></figure><figure><div style="width:${size.widthCm * factor}px;height:${size.heightCm * factor}px;background:#a5905d44;border:1px solid #8a7748"></div></figure></div><p>${esc(w.title)}：高 ${size.heightCm} × 宽 ${size.widthCm} cm</p><p class="lede">矩形代表作品实体尺寸；人与作品使用相同尺度。</p>${workButton(w.id)}`;
  } else if (id.startsWith("diagram:")) {
    const p = t.periods.find((p) => p.id === id.slice(8)),
      d = p?.diagram;
    if (d) {
      title = d.title;
      body = `<p>${esc(d.observe)}</p><div class="diagram-host">${diagramFor(t.meta.id, d.id)?.html(diagramContext()) || ""}</div><p>${esc(d.caption)}</p><div class="grid">${d.works.map((x) => workButton(x.work)).join("")}</div>${(d.sources || []).map((x) => `<p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a></p>`).join("")}`;
    }
  } else body = "<p>未找到该内容，请返回探索。</p>";
  return `<div class="pad"><h2>${esc(title)}</h2>${body}</div>`;
}
export function mountContext(root: HTMLElement, id: string, _value: string) {
  if (id.startsWith("diagram:")) {
    const p = state.t.periods.find((p) => p.id === id.slice(8));
    if (p?.diagram)
      diagramFor(state.t.meta.id, p.diagram.id)?.init(
        root.querySelector(".diagram-host")!,
        diagramContext(),
      );
  }
  observeImages(root);
}
