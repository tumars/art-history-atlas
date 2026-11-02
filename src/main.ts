import "./styles/main.css";
import { $, esc, store } from "./lib/dom";
import { SITE, loadTradition, loadCredits } from "./content";
import { state, actions } from "./state";
import { initTimeline, selectEvent } from "./sections/timeline";
import { initHall, goPeriod, showWork } from "./sections/hall";
import { initPendulum, renderPendulum } from "./sections/pendulum";
import { initComparisons } from "./sections/comparisons";
import { initSizes } from "./sections/sizes";
import { initWall } from "./sections/wall";
import { initLightbox, openWork } from "./sections/lightbox";

const TRAD_KEY = "aha.tradition";

/** 把体系里各大阶段的颜色写成 --g1…--gN，浅色与深色主题各一套 */
function applyGroupColors() {
  const g = state.t.meta.groups;
  const light = g.map((x, i) => `--g${i + 1}:${x.light}`).join(";");
  const dark = g.map((x, i) => `--g${i + 1}:${x.dark}`).join(";");
  let el = document.getElementById("group-colors");
  if (!el) {
    el = document.createElement("style");
    el.id = "group-colors";
    document.head.appendChild(el);
  }
  el.textContent = `:root{${light}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}:root[data-theme="dark"]{${dark}}`;
}

function renderChrome() {
  const t = state.t;
  document.title = `${SITE.title} · ${t.meta.name}`;
  $("#site-eyebrow").textContent = `${SITE.title} · ${SITE.titleEn} · ${t.meta.name}`;
  $("#site-tagline").textContent = SITE.tagline;
  $("#site-intro").textContent = `${t.meta.description}${SITE.intro}`;
  const sw = $<HTMLSelectElement>("#trad-switch");
  sw.hidden = SITE.traditions.length < 2;
  sw.innerHTML = SITE.traditions.map((id) => `<option value="${id}" ${id === t.meta.id ? "selected" : ""}>${esc(loadTradition(id).meta.name)}</option>`).join("");
  const reading = SITE.recommendedReading.map((b) => `${esc(b.title)}（${esc(b.author)}）`).join("、");
  const missing = t.works.filter((w) => !w.copyright && !state.credits[w.id]).length;
  $("#footer").innerHTML = `<p>内容按通行的艺术史知识整理，年代多为约数；图解均为示意图，不是原作画面。</p>
    <p>作品图片来自维基共享资源，按各自的授权协议使用，点开大图可看作者与协议。仍在版权期的作品不放图片，只给维基百科链接。${missing ? `目前还有 ${missing} 件作品尚未取到图片。` : ""}</p>
    <p>推荐延伸阅读：${reading}。</p>
    <p>代码 MIT，文字内容 CC BY-SA 4.0。<a href="https://github.com/tumars/art-history-atlas" target="_blank" rel="noopener">在 GitHub 上查看源码、提出修改</a>。</p>`;
}

function boot(traditionId: string) {
  state.t = loadTradition(traditionId);
  applyGroupColors();
  renderChrome();
  initTimeline();
  initHall();
  initPendulum();
  initComparisons();
  initSizes();
  initWall();
}

async function main() {
  actions.goPeriod = goPeriod;
  actions.showWork = showWork;
  actions.selectEvent = selectEvent;
  actions.openWork = openWork;
  actions.refreshPendulum = renderPendulum;
  state.site = SITE;
  initLightbox();
  const saved = store.get<string>(TRAD_KEY, SITE.defaultTradition);
  const id = SITE.traditions.includes(saved) ? saved : SITE.defaultTradition;
  boot(id);
  // 署名清单异步加载，到了再重绘一次带图的版本
  state.credits = await loadCredits();
  boot(id);
  $<HTMLSelectElement>("#trad-switch").onchange = (e) => {
    const v = (e.target as HTMLSelectElement).value;
    store.set(TRAD_KEY, v);
    boot(v);
  };
}

main();
