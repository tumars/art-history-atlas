import "./styles/main.css";
import "./styles/readings.css";
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
import { initHero } from "./sections/hero";
import { initPeople, showPerson } from "./sections/people";
import { cnNum } from "./lib/format";
import type { SectionId } from "./types";
import { initReadings, openReading } from "./sections/readings";
import { initSearch } from "./sections/search";
import { initMobile, renderMobile } from "./sections/mobile";
import { initNavigation } from "./lib/navigation";
import "./styles/mobile.css";

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

const SECTION_IDS: SectionId[] = ["chronology", "hall", "people", "pendulum", "pairs", "readings", "sizes", "collection"];

function renderChrome() {
  const t = state.t;
  document.title = `${SITE.title} · ${SITE.tagline}`;
  $("#mark-zh").textContent = SITE.title;
  $("#mark-en").textContent = SITE.titleEn;
  $<HTMLAnchorElement>("#repo-link").href = SITE.repo;
  $("#index").innerHTML = SECTION_IDS.map((id) => `<a href="#${id}" data-sec="${id}"><i>${SITE.sections[id].numeral}</i><span>${esc(SITE.sections[id].title)}</span></a>`).join("");
  for (const id of SECTION_IDS) {
    const head = document.querySelector<HTMLElement>(`.block-head[data-section="${id}"]`);
    if (!head) continue;
    const sec = SITE.sections[id];
    const title = id === "hall" ? `${cnNum(t.periods.length)}间展厅` : sec.title;
    head.querySelectorAll(".num,.bh-t").forEach((n) => n.remove());
    head.insertAdjacentHTML("afterbegin", `<span class="num">${sec.numeral}</span><div class="bh-t"><h2>${esc(title)}</h2><p class="deck">${esc(sec.deck)}</p></div>`);
  }
  const sw = $<HTMLSelectElement>("#trad-switch");
  sw.hidden = SITE.traditions.length < 2;
  sw.innerHTML = SITE.traditions.map((id) => `<option value="${id}" ${id === t.meta.id ? "selected" : ""}>${esc(loadTradition(id).meta.name)}</option>`).join("");
  const reading = SITE.recommendedReading.map((b) => `${esc(b.title)}（${esc(b.author)}）`).join("、");
  const missing = t.works.filter((w) => !state.credits[w.id]).length;
  $("#footer").innerHTML = `<div class="foot-in">
    <div><div class="foot-brand">${esc(SITE.title)}<em>${esc(SITE.titleEn)}</em></div>
      <p style="margin-top:12px">${esc(t.meta.description)}</p>
      <p>年代多为约数。图解含原理示意与原作分析标注。</p>
      <p>作者 · <a href="https://x.com/Tumars" target="_blank" rel="noopener">X @Tumars</a></p></div>
    <div><h4>关于图片</h4>
      <p>图片来自维基共享资源、维基百科与馆藏网站，作者、来源及权利说明写在作品下方。${missing ? `仍有 ${missing} 件暂无对应图像，具体原因见作品说明。` : ""}</p></div>
    <div><h4>开源</h4>
      <p>代码 MIT，文字 CC BY-SA 4.0。有错误或想补一间展厅，<a href="${SITE.repo}" target="_blank" rel="noopener">来 GitHub</a>。</p>
      <h4 style="margin-top:14px">延伸阅读</h4><p>${reading}</p></div>
  </div>`;
}

/** 主题：跟随系统 → 浅色 → 深色 */
const THEME_KEY = "aha.theme";
const THEMES = ["system", "light", "dark"] as const;
const THEME_ICON = { system: "◐", light: "☀", dark: "☾" };
const THEME_LABEL = { system: "主题：跟随系统", light: "主题：浅色", dark: "主题：深色" };
function initTheme() {
  const btn = $("#theme-btn");
  let cur = store.get<(typeof THEMES)[number]>(THEME_KEY, "system");
  const apply = () => {
    if (cur === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = cur;
    btn.textContent = THEME_ICON[cur];
    btn.setAttribute("aria-label", THEME_LABEL[cur]);
    btn.title = THEME_LABEL[cur];
  };
  btn.onclick = () => {
    cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    store.set(THEME_KEY, cur);
    apply();
  };
  apply();
}

/** 顶栏：阅读进度 + 当前分区高亮 */
function initScrollChrome() {
  const bar = $("#progress");
  const top = $("#topbar");
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      top.classList.toggle("solid", scrollY > innerHeight * 0.6);
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const io = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      document.querySelectorAll("#index a,.menu-links a").forEach((a) => a.setAttribute("aria-current", String((a as HTMLElement).dataset.sec === e.target.id)));
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["hero", ...SECTION_IDS].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
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
  initPeople();
  initReadings();
  initHero();
  renderMobile();
}

async function main() {
  // 启动时确定页面组织；手机旋转不切回长卷。窄桌面窗口也可使用手机布局。
  const mobile = matchMedia('(max-width: 700px)').matches ||
    (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 700);
  // 启动画面写在 index.html 里，手机版就绪后由页层淡出；桌面版直接移除
  const splash = document.querySelector<HTMLElement>(".boot-splash");
  if (mobile) {
    state.site = SITE;
    state.t = loadTradition(SITE.defaultTradition);
    applyGroupColors();
    const app = document.createElement("div");
    app.id = "mobile-app";
    app.className = "mobile-app";
    document.documentElement.classList.add("m-boot");
    document.body.replaceChildren(app, ...(splash ? [splash] : []));
    document.body.classList.add('mobile-shell');
    try {
      state.credits = await loadCredits();
      const { initMobileApp } = await import('./mobile/app.js');
      initMobileApp();
    } catch (err) {
      console.error(err);
      if (splash) {
        splash.classList.add("failed");
        splash.querySelector("span")!.textContent = "没能打开画间，请检查网络后刷新";
      }
    }
    return;
  }
  splash?.remove();
  actions.goPeriod = goPeriod;
  actions.showWork = showWork;
  actions.selectEvent = selectEvent;
  actions.openWork = openWork;
  actions.showPerson = showPerson;
  actions.openReading = openReading;
  actions.refreshPendulum = renderPendulum;
  state.site = SITE;
  initLightbox();
  initTheme();
  initMobile();
  initScrollChrome();
  const saved = store.get<string>(TRAD_KEY, SITE.defaultTradition);
  const id = SITE.traditions.includes(saved) ? saved : SITE.defaultTradition;
  boot(id);
  initSearch();
  // 署名清单异步加载，到了再重绘一次带图的版本
  state.credits = await loadCredits();
  boot(id);
  initNavigation();
  // 手机分享链接在桌面也能进入对应内容。
  const openMobileLink = () => {
    const match = location.hash.match(/^#m\/[^/]+\/([^/]+)(?:\/(.+))?$/);
    const workLink = location.hash.match(/^#work-(.+)$/);
    if (!match && !workLink) return;
    let contentId: string;
    try { contentId = decodeURIComponent(match?.[2] || workLink?.[1] || ''); } catch { return; }
    const kind = match?.[1] || 'work';
    if (['work', 'viewer'].includes(kind) && state.t.works.some(w => w.id === contentId)) openWork(contentId, true, [contentId]);
    else if (kind === 'person') showPerson(contentId);
    else if (kind === 'story' || kind === 'reader') openReading(contentId);
    else if (kind === 'hall') {
      const index = state.t.periods.findIndex(p => p.id === contentId);
      if (index >= 0) goPeriod(index);
    } else if (kind === 'context') {
      const section = ({ relay: 'chronology', schools: 'people' } as Record<string,string>)[contentId] || contentId;
      if (SECTION_IDS.includes(section as SectionId)) document.getElementById(section)?.scrollIntoView();
    }
  };
  openMobileLink();
  addEventListener('hashchange', openMobileLink);
  $<HTMLSelectElement>("#trad-switch").onchange = (e) => {
    const v = (e.target as HTMLSelectElement).value;
    store.set(TRAD_KEY, v);
    boot(v);
  };
}

main();
