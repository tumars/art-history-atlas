import { $, esc } from "../lib/dom";
import { state, actions, imgSrc } from "../state";
import { navigate, registerNavigation, returnToOrigin } from "../lib/navigation";
import { fmtYear } from "../lib/format";

const narrow = matchMedia("(max-width:700px)");
const desktopOrder = ["chronology", "hall", "people", "pendulum", "pairs", "readings", "sizes", "collection"];
const mobileOrder = ["hall", "readings", "chronology", "people", "pendulum", "pairs", "sizes", "collection"];
let chart: { node: HTMLElement; parent: Node; next: Node | null; title: string } | undefined;

function closeChart() {
  if (chart) { chart.parent.insertBefore(chart.node, chart.next); chart = undefined; }
  $<HTMLDialogElement>("#chart-dialog").close();
  document.body.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
}
function showChart(node: HTMLElement, title: string) {
  closeChart();
  chart = { node, parent: node.parentNode!, next: node.nextSibling, title };
  $("#chart-title").textContent = title;
  $("#chart-content").append(node);
  $<HTMLDialogElement>("#chart-dialog").showModal();
  document.body.style.overflow = "hidden";
}

export function initMobile() {
  document.body.insertAdjacentHTML("beforeend", `<dialog class="site-menu" id="site-menu" aria-labelledby="menu-title"><div class="dialog-head"><h2 id="menu-title">长廊目录</h2><button class="btn" data-close-panel>关闭 ×</button></div><nav class="menu-links" aria-label="长廊目录"></nav><div class="menu-settings"></div></dialog>
    <dialog class="hero-options" id="hero-options" aria-labelledby="hero-options-title"><div class="dialog-head"><h2 id="hero-options-title">画海选项</h2><button class="btn" data-close-panel>关闭 ×</button></div><div id="hero-option-controls"></div></dialog>
    <dialog class="chart-dialog" id="chart-dialog" aria-labelledby="chart-title"><div class="dialog-head"><h2 id="chart-title"></h2><button class="btn" id="chart-close">返回 ×</button></div><p>横向滑动查看全貌，也可使用下方的文字入口。</p><div id="chart-content"></div></dialog>`);
  const placements = ["theme-btn", "repo-link", "sky-play"].map(id => { const node = $("#" + id); return { node, parent: node.parentNode!, next: node.nextSibling }; });
  const heroParts = [$(".hero-depth"), $(".hero-controls"), $("#hero-periods")];
  const timelineTools = $("#chronology .block-tools"), timelineHead = timelineTools.parentElement!;
  const position = () => {
    closeChart();
    (narrow.matches ? mobileOrder : desktopOrder).forEach(id => $("main>.wrap").append($("#" + id)));
    $("#hall-body").insertBefore($("#hall-readings"), narrow.matches ? $("#diagram") : $(".hall"));
    for (const { node, parent, next } of placements) {
      if (narrow.matches) (node.id === "sky-play" ? $("#hero") : $(".menu-settings")).append(node);
      else parent.insertBefore(node, next?.parentNode === parent ? next : null);
    }
    heroParts.forEach(node => (narrow.matches ? $("#hero-option-controls") : $("#hero")).append(node));
    if (narrow.matches) $("#chronology>.panel").prepend(timelineTools);
    else timelineHead.append(timelineTools);
    document.querySelectorAll<HTMLDetailsElement>(".mobile-fold,.lb-details").forEach(d => d.open = !narrow.matches);
    document.querySelectorAll<HTMLDialogElement>("#site-menu,#hero-options").forEach(d => d.close());
    document.body.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
    if (!narrow.matches) $("#theme-btn").textContent = $("#theme-btn").getAttribute("aria-label")?.includes("浅色") ? "☀" : $("#theme-btn").getAttribute("aria-label")?.includes("深色") ? "☾" : "◐";
  };
  narrow.addEventListener("change", position);
  position();
  for (const [trigger, id] of [["menu-open", "site-menu"], ["hero-options-open", "hero-options"]]) {
    const dialog = $<HTMLDialogElement>("#" + id);
    const close = () => { dialog.close(); document.body.style.overflow = ""; $("#" + trigger).focus({ preventScroll: true }); };
    $("#" + trigger).onclick = () => navigate(() => { dialog.showModal(); document.body.style.overflow = "hidden"; });
    dialog.querySelector<HTMLButtonElement>("[data-close-panel]")!.onclick = () => returnToOrigin(close);
    dialog.oncancel = e => { e.preventDefault(); returnToOrigin(close); };
    registerNavigation(id, () => { const open = dialog.open; return () => { if (open) dialog.showModal(); else dialog.close(); }; });
  }
  $("#chart-close").onclick = () => returnToOrigin(closeChart);
  $<HTMLDialogElement>("#chart-dialog").oncancel = e => { e.preventDefault(); returnToOrigin(closeChart); };
  registerNavigation("chart", () => { const saved = chart; return () => { closeChart(); if (saved) showChart(saved.node, saved.title); }; });
  actions.dismissPanels = () => {
    closeChart();
    document.querySelectorAll<HTMLDialogElement>("#site-menu,#hero-options,#search-dialog").forEach(d => d.close());
    document.body.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };
  const graphContent = document.createElement("div"); graphContent.id = "graph-content";
  while ($("#pv-graph-box").firstChild) graphContent.append($("#pv-graph-box").firstChild!);
  $("#pv-graph-box").append(graphContent);
  const chartTargets: [string, string][] = [["#chronology>.panel", "完整年表与艺术中心地图"], ["#pv-life-box .dg-wrap", "人物生命线"], ["#graph-content", "人物关系图"], ["#pendulum .chart-scroll", "理性与激情全貌"]];
  for (const [selector, title] of chartTargets) {
    const node = $(selector);
    node.classList.add("chart-full");
    const button = document.createElement("button"); button.className = "btn mobile-only mobile-chart-open"; button.textContent = `查看${title} ↗`;
    node.before(button); button.onclick = () => navigate(() => showChart(node, title));
  }
  $("#chronology .block-head").insertAdjacentHTML("afterend", '<div class="mobile-timeline mobile-only" id="mobile-timeline"></div>');
  $("#chronology .block-head").after($("#chronology>.mobile-chart-open"));
  $("#mobile-timeline").insertAdjacentHTML("beforebegin", '<details class="mobile-only mobile-relay"><summary>艺术中心的接力</summary><div id="mobile-relay"></div></details>');
  $("#pendulum .panel").insertAdjacentHTML("afterbegin", '<div class="mobile-only" id="mobile-moods"></div>');
  $("#pv-life-box").insertAdjacentHTML("afterbegin", '<div class="mobile-only" id="mobile-lives"></div>');
  $("#pv-graph-box").insertAdjacentHTML("afterbegin", '<div class="mobile-only" id="mobile-relations"></div>');
  document.addEventListener("click", e => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('.menu-links a,.hero-enter,#index a,.mark,.skip');
    if (!link) return;
    e.preventDefault();
    const id = link.hash.slice(1);
    navigate(() => {
      $<HTMLDialogElement>("#site-menu").close(); document.body.style.overflow = "";
      history.replaceState(null, "", link.hash);
      const target = $("#" + id); target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ block: "start" });
    });
  });
}

export function renderMobile() {
  const relay = $("#mobile-relay");
  relay.innerHTML = `<label class="mobile-person-picker">选择站点<select>${state.t.meta.relay.map((s, i) => `<option value="${i}">${i + 1} · ${esc(s.place)} · ${esc(s.era)}</option>`).join("")}</select></label><p></p><div class="work-paging"><button class="btn" data-relay-step="-1">← 上一站</button><button class="btn" data-relay-step="1">下一站 →</button></div>`;
  const station = relay.querySelector<HTMLSelectElement>("select")!;
  const updateStation = () => {
    const i = +station.value;
    relay.querySelector("p")!.textContent = state.t.meta.relay[i].note;
    relay.querySelector<HTMLButtonElement>('[data-relay-step="-1"]')!.disabled = i === 0;
    relay.querySelector<HTMLButtonElement>('[data-relay-step="1"]')!.disabled = i === state.t.meta.relay.length - 1;
    document.querySelector<HTMLButtonElement>(`#relay .relay-sequence [data-stop="${i}"]`)?.click();
  };
  station.onchange = updateStation;
  relay.onclick = e => { const b = (e.target as Element).closest<HTMLElement>("[data-relay-step]"); if (b) { station.value = String(+station.value + Number(b.dataset.relayStep)); updateStation(); } };
  updateStation();
  for (const [id, label] of [["mobile-lives", "查看人物生平"], ["mobile-relations", "查看人物关系"]]) {
    const root = $("#" + id);
    root.innerHTML = `<label class="mobile-person-picker">${label}<select aria-label="${label}">${state.t.people.map(p => `<option value="${p.id}">${esc(p.name)} · ${p.approx ? "约" : ""}${fmtYear(p.born)}–${esc(p.diedText ?? fmtYear(p.died))}</option>`).join("")}</select></label><div class="mobile-person-summary"></div><button class="btn">打开人物资料 →</button>`;
    const select = root.querySelector<HTMLSelectElement>("select")!;
    const describe = () => {
      const p = state.t.people.find(p => p.id === select.value)!;
      root.querySelector(".mobile-person-summary")!.innerHTML = id === "mobile-lives" ? `<p>${esc(p.line)}</p><ul>${(p.life ?? []).slice(0, 3).map(e => `<li>${esc(e.yearText ?? fmtYear(e.year))} · ${esc(e.text)}</li>`).join("")}</ul>` : ([ ["师承", p.rel.teachers], ["受到影响", p.rel.influences], ["对手", p.rel.rivals], ["赞助人", p.rel.patrons] ] as [string, string[] | undefined][]).map(([label, ids]) => ids?.length ? `<p>${label}：${ids.map(id => { const other = state.t.people.find(x => x.id === id); return other ? `<button class="who-link" data-person="${id}">${esc(other.name)}</button>` : ""; }).join("、")}</p>` : "").join("") || "<p>暂无收录的直接师承、影响、对手或赞助关系；可在人物资料中查看相遇与其他关联。</p>";
    };
    select.onchange = describe; describe();
    root.querySelector<HTMLButtonElement>("button.btn")!.onclick = () => actions.showPerson(select.value);
  }
  $(".menu-links").innerHTML = '<a href="#hero">序厅 · 浮空画海</a>' + mobileOrder.map(id => `<a href="#${id}" data-sec="${id}">${esc(state.site.sections[id as keyof typeof state.site.sections].title)}</a>`).join("");
  $("#mobile-timeline").innerHTML = state.t.periods.map((p, i) => {
    const works = state.t.works.filter(w => w.period === p.id && w.timeline);
    const w = works[0] ?? state.t.works.find(w => w.period === p.id);
    const src = w && imgSrc(w, "thumb");
    const events = state.t.events.filter(e => e.periods.includes(p.id));
    return `<article><span class="meta">${esc(p.span)}</span><h3>${esc(p.name)}</h3><p>${esc(p.thesis)}</p>${w ? `<button class="timeline-work" data-mobile-work="${w.id}">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}<span>${esc(w.title)}<br><small>${esc(w.artist)}</small></span></button>` : ""}<details><summary>历史大事与同时期背景</summary><ul>${events.map(e => `<li><b>${esc(e.yearText)} · ${esc(e.name)}</b><br>${esc(e.art)}</li>`).join("")}</ul>${state.t.bands.map(b => `<p><b>${esc(b.label)}</b>：${esc(b.items.filter(x => x.start < p.end && x.end > p.start).map(x => x.name).join("、") || "暂无对应记录")}</p>`).join("")}</details><button class="btn" data-mobile-period="${i}">进入${esc(p.short)}展厅 →</button></article>`;
  }).join("");
  $("#mobile-timeline").onclick = e => {
    const el = (e.target as Element).closest<HTMLElement>("[data-mobile-work],[data-mobile-period]");
    if (el?.dataset.mobileWork) actions.openWork(el.dataset.mobileWork, true);
    else if (el?.dataset.mobilePeriod) actions.goPeriod(+el.dataset.mobilePeriod, true);
  };
  $("#mobile-moods").innerHTML = `<label>选择时期 <select id="mood-period">${state.t.periods.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join("")}</select></label><p id="mood-summary"></p>`;
  const mood = $<HTMLSelectElement>("#mood-period");
  const update = () => { const p = state.t.periods[+mood.value]; $("#mood-summary").textContent = `${p.mood > 0 ? "偏向激情与表达" : p.mood < 0 ? "偏向理性与秩序" : "理性与激情并置"}。${p.thesis}`; };
  mood.onchange = update; update();
}
