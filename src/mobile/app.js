import "./mobile.css";
import { state, portraitSrc } from "../state";
import { esc } from "../lib/dom";
import { artImage } from "../lib/art-image";
import { observeImages, clearProgressiveImage } from "../lib/image-loading";
import { searchCatalog } from "../lib/search";
import { mountSea } from "./sea";
import { contextLinks, contextPage, mountContext } from "./context";

export function initMobileApp() {
  const app = document.querySelector("#mobile-app");
  const base = new URL(import.meta.env.BASE_URL, location.origin);
  function readLocal(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }
  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  const paths = {
    sea: "M3 6l5-2 8 2 5-2v15l-5 2-8-2-5 2V6 M8 4v15 M16 6v15",
    guide: "M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4 M12 6v15",
    explore: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M17 17l5 5",
    saved: "M6 3h12v18l-6-4-6 4V3",
    back: "M15 5l-7 7 7 7",
    expand: "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5",
    next: "M9 5l7 7-7 7",
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.next}"/></svg>`;
  const tabs = [
    ["sea", "画海"],
    ["guide", "导览"],
    ["explore", "探索"],
    ["saved", "收藏"],
  ];
  const { works, periods, people, readings } = state.t;
  const credits = state.credits;
  let selected = "mona-lisa",
    paused = false;
  let disposePage = () => {};
  let seaController = null;
  let undoId = "";
  let originalCleanup = () => {};

  let favoriteIds = [];
  try {
    favoriteIds = JSON.parse(localStorage.getItem("aha.favorites.v1") || "[]");
    if (!Array.isArray(favoriteIds)) favoriteIds = [];
  } catch {}
  let model = {
    tab: "sea",
    stacks: Object.fromEntries(
      tabs.map(([id]) => [
        id,
        [{ kind: "root", scroll: 0, category: "works", query: "" }],
      ]),
    ),
  };
  let timer;
  const savedProgress = readLocal("aha.reading.v1", []);
  const readingProgress = new Map(
    Array.isArray(savedProgress)
      ? savedProgress.filter(
          (x) =>
            Array.isArray(x) &&
            readings.some((r) => r.id === x[0]) &&
            Number.isInteger(x[1]?.step) &&
            x[1].step >= 0 &&
            x[1].step < readings.find((r) => r.id === x[0]).steps.length,
        )
      : [],
  );
  function rememberReading() {
    if (route().kind === "reader") {
      readingProgress.set(route().id, structuredClone(route()));
      writeLocal("aha.reading.v1", [...readingProgress]);
    }
  }
  const stack = () => model.stacks[model.tab];
  const route = () => stack().at(-1);
  const work = (id) => works.find((w) => w.id === id);
  const img = (id, full = false) =>
    credits[id]
      ? new URL(
          full
            ? credits[id].optimized?.display || credits[id].file
            : credits[id].optimized?.thumb || credits[id].thumb,
          base,
        ).href
      : "";
  const image = (w, full = false) =>
    !w
      ? ""
      : credits[w.id]
        ? full
          ? artImage(w)
          : `<img src="${esc(img(w.id))}" alt="${esc(w.title)}" loading="lazy" decoding="async" draggable="false">`
        : `<span class="no-image">${esc(w.noImageReason || "暂无配图")}</span>`;
  const period = (id) => periods.find((p) => p.id === id);
  const portrait = (person, large = false) => {
    const src = portraitSrc(person, large ? "display" : "thumb");
    return src
      ? `<img class="${large ? "portrait-large" : "portrait"}" src="${esc(src)}" alt="${esc(person.name)}" loading="lazy" decoding="async">`
      : "";
  };
  const saveView = () => {
    const screen = app.querySelector(".screen");
    if (screen) route().scroll = screen.scrollTop;
    const active = document.activeElement;
    if (active instanceof HTMLElement && app.contains(active)) {
      const attr = [...active.attributes].find((a) =>
        a.name.startsWith("data-"),
      );
      if (attr) route().focus = `[${attr.name}="${CSS.escape(attr.value)}"]`;
    }
  };
  function checkpoint() {
    rememberReading();
    saveView();
    history.replaceState(
      { ...history.state, mobile: structuredClone(model) },
      "",
      routeUrl(),
    );
  }
  function push(next) {
    checkpoint();
    const parent = { tab: model.tab, depth: stack().length };
    stack().push({ ...next, scroll: 0 });
    history.pushState(
      { mobile: structuredClone(model), parent },
      "",
      routeUrl(),
    );
    render(true);
  }
  function replace() {
    rememberReading();
    history.replaceState(
      { ...history.state, mobile: structuredClone(model) },
      "",
      routeUrl(),
    );
    render();
  }
  function back() {
    rememberReading();
    const parent = history.state?.parent;
    if (parent?.tab === model.tab && parent.depth === stack().length - 1) {
      history.back();
      return;
    }
    if (stack().length > 1) stack().pop();
    replace();
  }
  function switchTab(id) {
    checkpoint();
    const old = model.tab;
    model.tab = id;
    if (old === id) model.stacks[id] = [model.stacks[id][0]];
    history.pushState({ mobile: structuredClone(model) }, "", routeUrl());
    render(true);
  }
  function toast(message) {
    app.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    app.append(node);
    clearTimeout(timer);
    if (undoId) {
      const b = document.createElement("button");
      b.dataset.undo = "";
      b.textContent = "撤销";
      node.append(b);
    }
    timer = setTimeout(() => {
      node.remove();
      undoId = "";
    }, 5000);
  }
  function toggleFavorite(id) {
    const has = favoriteIds.includes(id);
    favoriteIds = has
      ? favoriteIds.filter((x) => x !== id)
      : [id, ...favoriteIds];
    let persisted = true;
    try {
      localStorage.setItem("aha.favorites.v1", JSON.stringify(favoriteIds));
    } catch {
      persisted = false;
    }
    saveView();
    if (seaController) updateSeaLabel();
    else render();
    undoId = has ? id : "";
    toast(
      persisted
        ? has
          ? "已取消收藏"
          : "已加入收藏"
        : "仅在本次会话保留，浏览器未允许保存",
    );
  }
  function openWork(id, ids = [id], scope = "作品") {
    push({ kind: "work", id, ids, scope });
  }
  function tiles(list, scope) {
    return `<div class="grid">${list.map((w) => `<button class="tile" data-work="${w.id}" data-scope="${scope}">${image(w)}<strong>${esc(w.title)}</strong><small>${esc(w.artist)}</small></button>`).join("")}</div>`;
  }
  function rootSea() {
    const w = work(selected) || works[0];
    return `<section class="sea-page"><div class="sea-heading"><h2>在画里，遇见世界。</h2><p>${works.filter((w) => credits[w.id]).length} 件作品 · 三万年的回声</p></div><div class="sea-tools"><button data-pause aria-label="${paused ? "继续漂浮" : "暂停漂浮"}" aria-pressed="${paused}">${paused ? "▷" : "Ⅱ"}</button><button data-sea-prev aria-label="发现上一件作品">←</button><button data-sea-next aria-label="发现下一件作品">→</button></div><div class="sea-canvas" aria-label="拖动画海选择作品"></div><div class="sea-depth" role="group" aria-label="画海视野"><button data-sea-zoom="1" aria-label="拉远画海">−</button><button data-sea-locate aria-label="回到选中作品">◎</button><button data-sea-zoom="-1" aria-label="拉近画海">＋</button><button class="sea-period" data-period aria-haspopup="dialog" aria-label="选择艺术时期，当前${esc(period(w.period).name)}">时期 · ${esc(period(w.period).short)} ▾</button></div><div class="sea-note"><button class="sea-caption" data-work="${w.id}" data-scope="画海"><span aria-live="polite"><strong>${esc(w.title)}</strong><p>${esc(w.artist)} · ${esc(w.yearText)}</p></span></button><button data-save="${w.id}" aria-label="${favoriteIds.includes(w.id) ? "取消收藏" : "收藏作品"}" aria-pressed="${favoriteIds.includes(w.id)}">${icon("saved")}</button><button class="go" data-work="${w.id}" data-scope="画海" aria-label="查看《${esc(w.title)}》">${icon("next")}</button></div></section>`;
  }

  function rootGuide() {
    return `<div class="pad"><div class="eyebrow">跟着一个问题，走近作品</div><h2>今天，慢慢看。</h2><p class="lede">从三分钟开始，也可以走进一整个时代。</p>${readings.map((r) => `<button class="guide" data-story="${r.id}">${image(work(r.steps[0].works[0]), true)}<div style="padding-top:13px"><span class="pill">${r.minutes} 分钟 · ${r.steps.length} 步</span><h3>${esc(r.title)}</h3><p>${esc(r.deck)}</p></div></button>`).join("")}<div class="section-label"><h3>十八间展厅</h3><small>从史前走到现代</small></div>${periods.map((p, i) => `<button class="list-row" data-hall="${p.id}"><b class="num">${String(i + 1).padStart(2, "0")}</b><span><strong>${esc(p.short)}</strong><small>${esc(p.span)}</small></span>${icon("next")}</button>`).join("")}</div>`;
  }
  function rootExplore() {
    const r = route();
    return `<div class="pad"><h2>找到你的好奇。</h2><p class="lede">作品、人物，和它们之间的联系。</p><button data-about>关于与设置 →</button><button class="search-field" data-search style="text-align:left;color:#75806e">搜索作品或艺术家</button><div class="segments">${[
      ["works", "作品"],
      ["people", "人物"],
      ["context", "脉络"],
    ]
      .map(
        ([id, label]) =>
          `<button data-category="${id}" aria-pressed="${r.category === id}">${label}</button>`,
      )
      .join(
        "",
      )}</div>${r.category === "people" ? people.map((p) => `<button class="list-row" data-person="${p.id}">${portrait(p)}<span><strong>${esc(p.name)}</strong><small>${esc(p.en)}</small></span>${icon("next")}</button>`).join("") : r.category === "context" ? `<div class="eyebrow">沿着时代看</div>${contextLinks()}` : `<button data-filter class="lede" style="margin-bottom:14px;padding:0">${esc(r.period ? period(r.period)?.short : "全部时期")} ▾</button>${r.period ? "<button data-clear-filter>清除筛选 ×</button>" : ""}${tiles(filteredWorks().slice(0, r.limit || 24), "探索")}${(r.limit || 24) < filteredWorks().length ? '<button class="primary" data-more>继续浏览作品</button>' : '<p class="lede">已看到全部作品</p>'}`}</div>`;
  }
  function filteredWorks() {
    const r = route();
    return works.filter(
      (w) =>
        (!r.period || w.period === r.period) &&
        (!r.query ||
          `${w.title} ${w.artist}`
            .toLocaleLowerCase()
            .includes(r.query.toLocaleLowerCase())),
    );
  }
  function rootSaved() {
    const list = favoriteIds.map(work).filter(Boolean);
    return list.length
      ? `<div class="pad"><h2>还想再看一眼。</h2><p class="lede">${list.length} 件收藏 · 保存在本机</p>${tiles(list, "收藏")}</div>`
      : `<div class="empty">${icon("saved")}<h2>留住让你停下的作品。</h2><p>在画海或作品页点收藏，<br>下次就能从这里继续看。</p><button class="primary" data-tab="sea">去画海看看</button></div>`;
  }
  function workPage(r) {
    const w = work(r.id),
      p = period(w.period),
      index = r.ids.indexOf(w.id);
    return `<button class="work-figure" data-full="${w.id}" aria-label="全屏看${esc(w.title)}">${image(w, true)}</button><div class="work-copy"><button class="author" ${w.by?.[0] ? `data-person="${w.by[0]}"` : "disabled"}>${esc(w.artist)}</button><h2>${esc(w.title)}</h2><div class="meta">${esc(w.yearText)} · ${esc(p.short)}</div><p>${esc(w.summary)}</p><div class="action-strip"><button data-share>分享</button><button data-full="${w.id}">${icon("expand")}看全图</button><button data-save="${w.id}" aria-pressed="${favoriteIds.includes(w.id)}">${icon("saved")}${favoriteIds.includes(w.id) ? "已收藏" : "收藏"}</button></div><div class="collection-context"><button data-work-step="-1" ${index <= 0 ? "disabled" : ""}>← 上一件</button><span>${esc(r.scope)} · ${index + 1} / ${r.ids.length}</span><button data-work-step="1" ${index >= r.ids.length - 1 ? "disabled" : ""}>下一件 →</button></div><div class="links"><button data-hall="${p.id}">走进${esc(p.short)} ${icon("next")}</button>${readings
      .filter((x) => x.steps.some((s) => s.works.includes(w.id)))
      .slice(0, 2)
      .map(
        (x) =>
          `<button data-story="${x.id}">三分钟看画 · ${esc(x.title)}</button>`,
      )
      .join(
        "",
      )}</div><details class="source"><summary>作品资料与图片来源</summary><p>${esc(w.medium)} · ${esc(w.location)}</p>${w.imageNote ? `<p>${esc(w.imageNote)}</p>` : ""}${credits[w.id] ? `<p>${esc(credits[w.id].author)} · ${esc(credits[w.id].license)}</p><a href="${esc(credits[w.id].source)}" target="_blank" rel="noopener">图片原始来源 ↗</a>` : `<p>${esc(w.noImageReason || "暂无配图")}</p>`}${(w.sources || []).map((x) => `<p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a></p>`).join("")}${w.source ? `<p><a href="${esc(w.source)}" target="_blank" rel="noopener">作品资料 ↗</a></p>` : ""}</details></div>`;
  }
  function personPage(r) {
    const p = people.find((p) => p.id === r.id);
    const list = works.filter((w) => w.by?.includes(p.id));
    return `<div class="pad"><div class="person-hero">${portrait(p, true)}<div class="eyebrow">认识一位艺术家</div><h2>${esc(p.name)}</h2><p>${esc(p.en)}</p><p>${esc(p.line)}</p></div>${p.points.map((x) => `<p>${esc(x)}</p>`).join("")}${p.quote ? `<blockquote>${esc(p.quote.text)}<small> — ${esc(p.quote.by)}</small></blockquote>` : ""}<div class="section-label"><h3>从作品认识这位艺术家</h3><small>${list.length} 件</small></div>${tiles(list, "人物作品")}<div class="section-label"><h3>人生片段</h3></div><div class="timeline">${(p.life || []).map((e) => `<article><time>${esc(e.yearText || e.year)}</time><p>${esc(e.text)}</p></article>`).join("")}</div>${p.legacy ? `<h3>后世评价</h3><p>${esc(p.legacy)}</p>` : ""}${(p.sources || []).map((x) => `<p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a></p>`).join("")}<div class="section-label"><h3>相关人物</h3></div>${Object.entries(
      p.rel || {},
    )
      .flatMap(([key, ids]) =>
        ids.map((id) => {
          const other = people.find((p) => p.id === id);
          return other
            ? `<button class="list-row" data-person="${id}"><span><strong>${esc(other.name)}</strong><small>${{ teachers: "老师", influences: "影响来源", rivals: "对手", patrons: "赞助人" }[key] || key}</small></span>${icon("next")}</button>`
            : "";
        }),
      )
      .join("")}</div>`;
  }
  function hallPage(r) {
    const p = period(r.id),
      list = works.filter((w) => w.period === p.id);
    return `<div class="pad"><div class="eyebrow">${String(periods.indexOf(p) + 1).padStart(2, "0")} / 18 · ${esc(p.span)}</div><h2>${esc(p.name)}</h2><p class="lede">${esc(p.question || p.thesis)}</p><button class="primary" data-work="${list[0].id}" data-scope="本厅">从第一件看 →</button><div class="section-label"><h3>本厅作品</h3><small>${list.length} 件</small></div>${tiles(list, "本厅")}<details class="source"><summary>认识这个时代</summary><p>${esc(p.thesis)}</p>${p.diagram ? `<button class="primary" data-context="diagram:${p.id}">${esc(p.diagram.title)} →</button>` : ""}${p.points.map((x) => `<p>${esc(x)}</p>`).join("")}</details></div>`;
  }
  function storyPage(r) {
    const story = readings.find((x) => x.id === r.id);
    return `<div class="pad"><div class="eyebrow">${story.minutes} 分钟 · ${story.steps.length} 步</div><h2>${esc(story.title)}</h2><p class="lede">${esc(story.deck)}</p><div class="work-figure">${image(work(story.steps[0].works[0]), true)}</div><p class="lede" style="margin-top:20px">先看作品，做一次观察，再按需展开故事。</p><button class="primary" data-read="${story.id}">${readingProgress.has(story.id) ? "继续看" : "开始看"} →</button><details class="source"><summary>阅读来源</summary>${story.sources.map((x) => `<p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a></p>`).join("")}</details><div class="links">${story.next.map((x) => `<button data-work="${x.work}">${esc(x.label)} →</button>`).join("")}</div><div class="timeline">${story.steps.map((s, i) => `<article><time>0${i + 1}</time><p>${esc(s.title)}</p></article>`).join("")}</div></div>`;
  }
  function readerPage(r) {
    const story = readings.find((x) => x.id === r.id),
      s = story.steps[r.step],
      note = r.notes[r.step] || {};
    return `<article class="reader"><div class="step">${r.step + 1} / ${story.steps.length} · ${story.minutes} 分钟看画</div><h2>${esc(s.title)}</h2><div class="reader-images">${s.works.map((id) => `<button data-full="${id}" aria-label="全屏看${esc(work(id).title)}">${image(work(id), true)}</button>`).join("")}</div><p>${esc(s.prompt)}</p>${(s.details || []).map((d) => `<details><summary>${esc(d.label)}</summary><p>${esc(d.note)}</p><button data-full="${d.work}">放大观察 →</button></details>`).join("")}${(s.choices || []).map((c, i) => `<button class="choice" data-choice="${i}" aria-pressed="${note.choice === i}">${esc(c.label)}</button>`).join("")}${note.choice !== undefined ? `<p role="status">${esc(s.choices[note.choice].response)}</p>` : ""}<details data-reading-detail ${note.open ? "open" : ""}><summary>看看解读与背景</summary><p>${esc(s.context)}</p></details></article>`;
  }
  function searchResults() {
    const q = (route().query || "").trim().toLocaleLowerCase();
    if (!q)
      return '<p class="lede">试试「梵高」「蒙娜丽莎」或艺术家的英文名。</p>';
    const results = searchCatalog(state.t, q, route().searchKind || "all");
    const list = results
      .filter((x) => x.kind === "work")
      .map((x) => work(x.id));
    const ps = results
      .filter((x) => x.kind === "person")
      .map((x) => people.find((p) => p.id === x.id));
    return `<p class="lede">${list.length + ps.length} 条结果 · 全部内容</p>${ps.map((p) => `<button class="list-row" data-person="${p.id}">${portrait(p)}<span><strong>${esc(p.name)}</strong><small>人物 · ${esc(p.en)}</small></span>${icon("next")}</button>`).join("")}${tiles(list, "搜索结果")}${!list.length && !ps.length ? "<p>没有找到，试试更短的名称。</p>" : ""}`;
  }
  function render(focus = false) {
    const active = document.activeElement;
    const attribute =
      active instanceof HTMLElement && app.contains(active)
        ? [...active.attributes].find((a) => a.name.startsWith("data-"))
        : null;
    const previousFocus = attribute
      ? `[${attribute.name}="${CSS.escape(attribute.value)}"]`
      : null;
    const keyboard = app.classList.contains("keyboard");
    originalCleanup();
    disposePage();
    app.querySelectorAll("img").forEach(clearProgressiveImage);
    const r = route(),
      immersive = ["viewer", "reader"].includes(r.kind),
      dark = r.kind === "viewer" || (r.kind === "root" && model.tab === "sea");
    app.className = dark ? "mobile-app dark" : "mobile-app";
    app.classList.toggle("keyboard", keyboard);
    let title =
      r.kind === "root"
        ? tabs.find(([id]) => id === model.tab)[1]
        : {
            work: "作品",
            person: "人物",
            hall: "展厅",
            story: "导览",
            reader: "看画",
            viewer: "全图",
            search: "搜索",
            context: "脉络",
            about: "关于与设置",
            missing: "未找到",
          }[r.kind];
    const header = `<header class="bar">${r.kind === "root" ? '<span class="title root-title">三万年长廊</span>' : `<button data-back aria-label="${immersive ? "退出全屏" : "返回上一页"}">${immersive ? "完成" : icon("back")}</button><span class="title">${title}</span>`}${r.kind === "viewer" ? `<button data-original>原图</button><button data-zoom>${r.zoom ? "复位" : "放大"}</button>` : r.kind === "root" && model.tab === "sea" ? `<button data-search aria-label="搜索">${icon("explore")}</button>` : r.kind === "search" ? "<button data-back>取消</button>" : r.kind === "reader" ? '<span style="width:44px"></span>' : `<button data-search aria-label="搜索">${icon("explore")}</button>`}</header>`;
    let content = "";
    if (r.kind === "root")
      content = {
        sea: rootSea,
        guide: rootGuide,
        explore: rootExplore,
        saved: rootSaved,
      }[model.tab]();
    else if (r.kind === "context") content = contextPage(r.id, r.value || "");
    else if (r.kind === "about") content = aboutPage();
    else if (r.kind === "missing")
      content =
        '<div class="empty"><h2>没有找到这项内容</h2><button data-tab="explore" class="primary">回到探索</button></div>';
    else if (r.kind === "work") content = workPage(r);
    else if (r.kind === "person") content = personPage(r);
    else if (r.kind === "hall") content = hallPage(r);
    else if (r.kind === "story") content = storyPage(r);
    else if (r.kind === "reader") content = readerPage(r);
    else if (r.kind === "viewer")
      content = `<div class="full ${r.zoom ? "zoom" : ""}">${image(work(r.id), true)}</div>`;
    else if (r.kind === "search")
      content = `<div class="pad"><input class="search-field" id="query" type="search" aria-label="搜索全部作品与人物" placeholder="作品、艺术家、中英文名" value="${esc(r.query)}"><div class="segments">${[
        ["all", "全部"],
        ["work", "作品"],
        ["person", "人物"],
      ]
        .map(
          ([id, label]) =>
            `<button data-search-kind="${id}" aria-pressed="${(r.searchKind || "all") === id}">${label}</button>`,
        )
        .join("")}</div><div id="results">${searchResults()}</div></div>`;
    const footer =
      r.kind === "viewer"
        ? `<footer class="viewer-footer"><button data-work-step="-1" ${r.ids.indexOf(r.id) <= 0 ? "disabled" : ""}>← 上一件</button><span>${r.ids.indexOf(r.id) + 1} / ${r.ids.length}</span><button data-work-step="1" ${r.ids.indexOf(r.id) >= r.ids.length - 1 ? "disabled" : ""}>下一件 →</button></footer>`
        : r.kind === "reader"
          ? `<footer class="reader-footer"><button class="primary" data-reader-next>${r.step === readings.find((x) => x.id === r.id).steps.length - 1 ? "完成这一篇" : "下一步 →"}</button>${r.step ? '<button class="prev" data-reader-prev>← 上一步</button>' : ""}</footer>`
          : `<nav class="tabbar" aria-label="主要区域">${tabs.map(([id, label]) => `<button data-tab="${id}" aria-current="${model.tab === id ? "page" : "false"}">${icon(id)}<span>${label}</span></button>`).join("")}</nav>`;
    app.innerHTML =
      header + `<main class="screen" tabindex="-1">${content}</main>` + footer;
    app.querySelector(".screen").scrollTop = r.scroll || 0;
    if (focus) {
      const target = r.focus ? app.querySelector(r.focus) : null;
      (target || app.querySelector(".screen")).focus({ preventScroll: true });
    } else if (previousFocus)
      app.querySelector(previousFocus)?.focus({ preventScroll: true });
    observeImages(app);
    if (r.kind === "context") mountContext(app, r.id, r.value || "");
    if (r.kind === "root" && model.tab === "sea") bindSea();
    if (r.kind === "viewer") {
      const full = app.querySelector(".full");
      full.ondblclick = () => {
        r.zoom = !r.zoom;
        replace();
      };
      let start;
      full.onpointerdown = (e) => {
        if (e.isPrimary) start = { x: e.clientX, y: e.clientY };
        else start = null;
      };
      full.onpointercancel = () => (start = null);
      full.onpointerup = (e) => {
        if (!start || r.zoom) return;
        const dx = e.clientX - start.x,
          dy = e.clientY - start.y;
        start = null;
        if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 2) {
          const index = r.ids.indexOf(r.id) + (dx < 0 ? 1 : -1);
          if (index >= 0 && index < r.ids.length) {
            r.id = r.ids[index];
            replace();
          }
        }
      };
    }
    if (r.kind === "about")
      app.querySelector("[data-theme-select]").value = readLocal(
        "aha.theme",
        "system",
      );
    if (r.kind === "search") {
      app.querySelector("#query").oninput = (e) => {
        r.query = e.target.value;
        history.replaceState(
          { ...history.state, mobile: structuredClone(model) },
          "",
          routeUrl(),
        );
        app.querySelector("#results").innerHTML = searchResults();
      };
    }
    if (r.kind === "reader")
      app.querySelector("[data-reading-detail]").ontoggle = (e) => {
        r.notes[r.step] = { ...r.notes[r.step], open: e.target.open };
        rememberReading();
      };
  }
  let afterSheet = null;
  function sheet(kind, addHistory = true) {
    if (addHistory) {
      checkpoint();
      history.pushState(
        { mobile: structuredClone(model), sheet: kind },
        "",
        routeUrl(),
      );
    }
    const root = document.createElement("div");
    root.className = "sheet";
    root.innerHTML = `<section role="dialog" aria-modal="true" aria-label="选择时期"><div class="handle"></div><div class="sheet-head"><h2>选择时期</h2><button data-close-sheet>完成</button></div>${kind === "filter" ? '<button class="option" data-pick-period="">全部时期</button>' : ""}${periods.map((p) => `<button class="option" data-pick-period="${p.id}" aria-pressed="${p.id === (kind === "sea" ? work(selected)?.period : route().period)}">${esc(p.name)}</button>`).join("")}</section>`;
    root.dataset.kind = kind;
    app
      .querySelectorAll(".bar,.screen,.tabbar")
      .forEach((n) => (n.inert = true));
    app.append(root);
    root.querySelector("button").focus();
    root.onclick = (e) => {
      if (e.target === root || e.target.closest("[data-close-sheet]"))
        closeSheet();
    };
    root.onkeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
      }
      if (e.key === "Tab") {
        const items = [...root.querySelectorAll("button")];
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
  }
  function closeSheet(after = null) {
    afterSheet =
      after ||
      (() => app.querySelector("[data-period],[data-filter]")?.focus());
    history.back();
  }
  function bindSea() {
    seaController = mountSea(
      app.querySelector(".sea-canvas"),
      selected,
      paused,
      (id) => {
        if (selected === id)
          openWork(
            id,
            works.filter((w) => credits[w.id]).map((w) => w.id),
            "画海",
          );
        else {
          selected = id;
          updateSeaLabel();
        }
      },
    );
    disposePage = () => {
      seaController?.destroy();
      seaController = null;
    };
  }
  function updateSeaLabel() {
    const w = work(selected);
    if (!w) return;
    const note = app.querySelector(".sea-note");
    note.querySelector("strong").textContent = w.title;
    note.querySelector("p").textContent = `${w.artist} · ${w.yearText}`;
    note.querySelector(".go").dataset.work = w.id;
    note.querySelector('.go').setAttribute('aria-label',`查看《${w.title}》`);
    note.querySelector('.sea-caption').dataset.work = w.id;
    const picker = app.querySelector('.sea-period');
    picker.textContent = `时期 · ${period(w.period).short} ▾`;
    picker.setAttribute('aria-label',`选择艺术时期，当前${period(w.period).name}`);
    const save = note.querySelector("[data-save]");
    save.dataset.save = w.id;
    save.setAttribute("aria-pressed", String(favoriteIds.includes(w.id)));
    save.setAttribute(
      "aria-label",
      favoriteIds.includes(w.id) ? "取消收藏" : "收藏作品",
    );
  }
  app.addEventListener("click", (e) => {
    const b = e.target.closest("button,[role=button]");
    if (!b || b.disabled) return;
    b.focus({ preventScroll: true });
    const d = b.dataset,
      r = route();
    if (d.diagramWork) {
      const diagram = periods.find((p) => r.id === "diagram:" + p.id)?.diagram;
      return openWork(
        d.diagramWork,
        diagram?.works.map((x) => x.work) || [d.diagramWork],
        "图解作品",
      );
    }
    if (d.tab) return switchTab(d.tab);
    if ("back" in d) return back();
    if ("search" in d) {
      push({ kind: "search", query: "" });
      app.querySelector("#query").focus();
      return;
    }
    if (d.select) {
      if (selected === d.select) return openWork(selected, [selected], "画海");
      selected = d.select;
      return render();
    }
    if (d.work) {
      let ids =
        d.scope === "收藏"
          ? favoriteIds
          : d.scope === "本厅"
            ? works.filter((w) => w.period === r.id).map((w) => w.id)
            : d.scope === "搜索结果"
              ? searchCatalog(state.t, r.query || "", "work").map((w) => w.id)
              : d.scope === "人物作品"
                ? works.filter((w) => w.by?.includes(r.id)).map((w) => w.id)
                : d.scope === "探索"
                  ? filteredWorks().map((w) => w.id)
                  : d.scope === "画海"
                    ? works.filter((w) => credits[w.id]).map((w) => w.id)
                    : [d.work];
      return openWork(d.work, ids, d.scope);
    }
    if ("share" in d) {
      navigator.clipboard
        ?.writeText(location.href)
        .then(() => toast("作品链接已复制"))
        .catch(() => toast("可复制浏览器地址分享作品"));
      return;
    }
    if ("about" in d) return push({ kind: "about" });
    if (d.context) return push({ kind: "context", id: d.context, value: "" });
    if (d.person) return push({ kind: "person", id: d.person });
    if (d.hall) return push({ kind: "hall", id: d.hall });
    if (d.story) return push({ kind: "story", id: d.story });
    if (d.read)
      return push(
        readingProgress.get(d.read)
          ? structuredClone(readingProgress.get(d.read))
          : { kind: "reader", id: d.read, step: 0, notes: {} },
      );
    if (d.full)
      return push({
        kind: "viewer",
        id: d.full,
        zoom: false,
        ids: r.ids || [d.full],
        scope: r.scope || "作品",
      });
    if ("undo" in d) {
      if (undoId) {
        favoriteIds = [undoId, ...favoriteIds.filter((id) => id !== undoId)];
        writeLocal("aha.favorites.v1", favoriteIds);
        undoId = "";
        render();
      }
      return;
    }
    if (d.save) return toggleFavorite(d.save);
    if ("original" in d) {
      const target = app.querySelector(".full img");
      if (!target) return;
      const large = new Image();
      let active = true;
      originalCleanup = () => {
        active = false;
        large.onload = null;
        large.onerror = null;
      };
      large.onload = async () => {
        try {
          await large.decode();
        } catch {
          return;
        }
        if (active && target.isConnected) {
          clearProgressiveImage(target);
          target.src = large.src;
          toast("原图已加载");
        }
      };
      large.onerror = () => toast("原图暂时无法加载，保留当前图片");
      large.src = new URL(credits[r.id].file, base).href;
      toast("正在加载原图…");
      return;
    }
    if ("zoom" in d) {
      r.zoom = !r.zoom;
      return replace();
    }
    if (d.searchKind) {
      r.searchKind = d.searchKind;
      return replace();
    }
    if (d.category) {
      r.category = d.category;
      r.scroll = 0;
      return replace();
    }
    if ("clearFilter" in d) {
      r.period = "";
      r.limit = 24;
      r.scroll = 0;
      return replace();
    }
    if ("more" in d) {
      saveView();
      r.limit = (r.limit || 24) + 24;
      return replace();
    }
    if ("workStep" in d) {
      r.id = r.ids[r.ids.indexOf(r.id) + Number(d.workStep)];
      r.zoom = false;
      r.scroll = 0;
      return replace();
    }
    if ("readerNext" in d) {
      if (r.step === readings.find((x) => x.id === r.id).steps.length - 1) {
        rememberReading();
        back();
        setTimeout(() => toast("已完成这一篇，可以继续看相关作品"), 100);
        return;
      }
      r.step++;
      r.scroll = 0;
      return replace();
    }
    if ("readerPrev" in d) {
      r.step--;
      r.scroll = 0;
      return replace();
    }
    if ("choice" in d) {
      r.notes[r.step] = { ...r.notes[r.step], choice: Number(d.choice) };
      saveView();
      return replace();
    }
    if ("pause" in d) {
      paused = !paused;
      seaController?.pause(paused);
      b.textContent = paused ? "▷" : "Ⅱ";
      b.setAttribute("aria-label", paused ? "继续漂浮" : "暂停漂浮");
      b.setAttribute("aria-pressed", String(paused));
      return;
    }
    if ("seaZoom" in d) return seaController?.zoom(Number(d.seaZoom));
    if ("seaLocate" in d) return seaController?.select(selected, true);
    if ("seaNext" in d || "seaPrev" in d) {
      const ids = works.filter((w) => credits[w.id]).map((w) => w.id);
      selected =
        ids[
          (ids.indexOf(selected) + ("seaPrev" in d ? -1 : 1) + ids.length) %
            ids.length
        ];
      seaController?.select(selected, true);
      return updateSeaLabel();
    }
    if ("period" in d) return sheet("sea");
    if ("filter" in d) return sheet("filter");
    if ("pickPeriod" in d) {
      const kind = app.querySelector(".sheet").dataset.kind;
      closeSheet(() => {
        if (kind === "filter") {
          route().period = d.pickPeriod;
          route().scroll = 0;
          route().limit = 24;
          replace();
        } else {
          selected =
            works.find((w) => w.period === d.pickPeriod && credits[w.id])?.id ||
            selected;
          seaController?.select(selected, true);
          updateSeaLabel();
          toast("已来到" + period(d.pickPeriod).short);
        }
      });
    }
  });
  addEventListener("popstate", (e) => {
    if (e.state?.mobile) {
      rememberReading();
      model = e.state.mobile;
      render(true);
      if (e.state.sheet) sheet(e.state.sheet, false);
      const after = afterSheet;
      afterSheet = null;
      after?.();
    }
  });

  function routeUrl() {
    const r = route();
    return (
      "#m/" +
      model.tab +
      "/" +
      r.kind +
      (r.id ? "/" + encodeURIComponent(r.id) : "")
    );
  }
  function fromHash() {
    let hash;
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch {
      hash = "invalid";
    }
    let tab = "sea",
      r = { kind: "root", scroll: 0, category: "works", query: "" };
    if (hash.startsWith("m/")) {
      const parts = hash.split("/");
      tab = parts[1];
      r = { ...r, kind: parts[2], id: parts.slice(3).join("/") };
    } else if (hash.startsWith("p-")) {
      tab = "guide";
      r = { ...r, kind: "hall", id: hash.slice(2) };
    } else if (hash.startsWith("who-")) {
      tab = "explore";
      r = { ...r, kind: "person", id: hash.slice(4) };
    } else if (hash.startsWith("story-")) {
      tab = "guide";
      r = { ...r, kind: "story", id: hash.slice(6) };
    } else if (hash.startsWith("work-")) {
      tab = "explore";
      r = { ...r, kind: "work", id: hash.slice(5) };
    } else if (["hall", "readings"].includes(hash)) tab = "guide";
    else if (["people", "collection"].includes(hash)) tab = "explore";
    else if (
      ["chronology", "pendulum", "pairs", "sizes", "relay"].includes(hash)
    ) {
      tab = "explore";
      r = { ...r, kind: "context", id: hash };
    } else if (hash && hash !== "top" && hash !== "hero") r.kind = "missing";
    if (!tabs.some(([id]) => id === tab)) tab = "explore";
    const valid = {
      work: works,
      viewer: works,
      person: people,
      hall: periods,
      story: readings,
      reader: readings,
    };
    if (valid[r.kind] && !valid[r.kind].some((x) => x.id === r.id))
      r.kind = "missing";
    if (
      ![
        "root",
        "work",
        "viewer",
        "person",
        "hall",
        "story",
        "reader",
        "context",
        "about",
        "search",
        "missing",
      ].includes(r.kind)
    )
      r.kind = "missing";
    if (["work", "viewer"].includes(r.kind)) {
      r.ids = [r.id];
      r.scope = "分享作品";
    }
    if (r.kind === "reader") {
      r.step = 0;
      r.notes = {};
    }
    model.tab = tab;
    if (r.kind !== "root") model.stacks[tab].push(r);
  }
  function aboutPage() {
    return `<div class="pad"><h2>三万年长廊</h2><p class="lede">${esc(state.t.meta.description)}</p><label>阅读主题 <select data-theme-select><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label><h3>图片与来源</h3><p>图片来自维基共享资源、维基百科与馆藏网站。每件作品的资料区保留作者、来源与权利说明。</p><h3>延伸阅读</h3>${state.site.recommendedReading.map((x) => `<p>${esc(x.title)} · ${esc(x.author)}</p>`).join("")}<p><a href="${esc(state.site.repo)}" target="_blank" rel="noopener">开源代码 ↗</a> · MIT / 文字 CC BY-SA 4.0</p><p>作者 · <a href="https://x.com/Tumars" target="_blank" rel="noopener">X @Tumars</a></p><p>收藏保存在此浏览器；清除浏览器数据会删除收藏。</p></div>`;
  }
  app.addEventListener("change", (e) => {
    if (e.target.matches("[data-theme-select]")) {
      const value = e.target.value;
      writeLocal("aha.theme", value);
      if (value === "system") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = value;
    }
    if (e.target.matches("[data-context-value]")) {
      route().value = e.target.value;
      route().scroll = 0;
      replace();
    }
  });
  app.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("svg [role=button]")
    ) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    if (
      e.key === "Escape" &&
      !app.querySelector(".sheet") &&
      route().kind !== "root"
    ) {
      e.preventDefault();
      back();
    }
  });
  if (history.state?.mobile && location.hash.startsWith("#m/"))
    model = history.state.mobile;
  else fromHash();
  favoriteIds = favoriteIds.filter((id) => works.some((w) => w.id === id));
  history.scrollRestoration = "manual";
  history.replaceState({ mobile: structuredClone(model) }, "", routeUrl());
  render();
  addEventListener("hashchange", () => {
    if (location.hash !== routeUrl()) {
      model = {
        tab: "sea",
        stacks: Object.fromEntries(
          tabs.map(([id]) => [
            id,
            [{ kind: "root", scroll: 0, category: "works", query: "" }],
          ]),
        ),
      };
      fromHash();
      replace();
    }
  });
  addEventListener("pagehide", () => {
    rememberReading();
    checkpoint();
    disposePage();
    originalCleanup();
  });
  addEventListener("pageshow", (e) => {
    if (e.persisted) render();
  });
  const viewport = window.visualViewport;
  const resizeViewport = () => {
    if (viewport && viewport.scale === 1) {
      app.style.height = viewport.height + "px";
      app.classList.toggle("keyboard", innerHeight - viewport.height > 120);
    }
  };
  viewport?.addEventListener("resize", resizeViewport);
  resizeViewport();
}
