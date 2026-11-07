// 画间手机版：iOS 原生结构（悬浮 tab、导航栈、sheet、缩放转场、长按菜单）与安静的视觉语言。
// 方案与取舍见 docs/research/mobile-ios-redesign.md；可操作原型在 docs/prototypes/mobile-ios.*。
import "./mobile.css";
import { state } from "../state";
import { searchCatalog } from "../lib/search";
import { arrangeWorks, skyLoop } from "../sections/hero-space";
import { contextPage, mountContext } from "./context";

const app = document.querySelector('#mobile-app');
// ?still 关闭动效，便于截图检查静态布局
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('still');
if (reduced) document.documentElement.classList.add('still');
const EASE = 'cubic-bezier(.32,.72,0,1)';
const SPRING = 'cubic-bezier(.34,1.36,.64,1)';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// 中文标题按分句断行：每个分句是一个 inline-block，放得下时只在标点后换行，避免“为/什么”这种拆词
const cl = v => esc(v).split(/(?<=[，、：；？！。,:;?!])/).map(x => `<span class="cl">${x}</span>`).join('');

const P = {
  sea: 'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z M4 15l4.5-4.5 4 4 2.5-2.5 5 5 M15.5 9.5h.01',
  guide: 'M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5z M12 6.5v13',
  saved: 'M6.5 3.5h11v17L12 16.2l-5.5 4.3z',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.5 15.5L20 20',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  chev: 'M9 4.5l7.5 7.5L9 19.5',
  close: 'M6 6l12 12 M18 6L6 18',
  share: 'M12 3.5v11 M8 7.5l4-4 4 4 M7.5 10.5H6v10h12v-10h-1.5',
  expand: 'M14 4h6v6 M10 20H4v-6 M20 4l-7 7 M4 20l7-7',
  hall: 'M3 9.5L12 4l9 5.5 M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 20h18',
  shuffle: 'M3 7h4l10 10h4 M3 17h4l3-3 M14 10l3-3h4 M18 4l3 3-3 3 M18 14l3 3-3 3',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  down: 'M6 9.5l6 6 6-6',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  play: 'M8 5.5v13l10.5-6.5z',
  link: 'M14 4h6v6 M20 4l-9 9 M18 14v5H5V6h5',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5 M15.5 4.6a3.2 3.2 0 0 1 0 6.2 M18 14.6c1.9.7 3 2.6 3.5 5.4',
  chain: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2',
  spark: 'M12 4v4 M12 16v4 M4 12h4 M16 12h4 M6.5 6.5l2.5 2.5 M15 15l2.5 2.5 M17.5 6.5L15 9 M9 15l-2.5 2.5',
};
const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

// ───── 数据 ─────
let D;
const base = new URL(import.meta.env.BASE_URL, location.href);
const readLS = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

function load() {
  const t = state.t;
  D = { works: t.works, periods: t.periods, people: t.people, encounters: t.encounters || [], readings: t.readings || [], groups: t.meta.groups, events: t.events, bands: t.bands, credits: state.credits };
}

const byId = new Map(), periodById = new Map(), personById = new Map();
const work = id => byId.get(id);
const period = id => periodById.get(id);
const person = id => personById.get(id);
const hasImg = w => !!(w && D.credits[w.id]);
const fileUrl = p => p ? new URL(p, base).href : '';
const thumb = id => fileUrl(D.credits[id]?.optimized?.thumb || D.credits[id]?.thumb);
const display = id => fileUrl(D.credits[id]?.optimized?.display || D.credits[id]?.file);
const ratio = id => { const o = D.credits[id]?.optimized; return o?.width && o?.height ? o.height / o.width : 1.25; };
const worksOf = pid => D.works.filter(w => w.period === pid).sort((a, b) => a.year - b.year);
const worksByPerson = pid => D.works.filter(w => w.by?.includes(pid) && hasImg(w)).sort((a, b) => a.year - b.year);
const storiesOf = id => D.readings.filter(r => r.steps.some(s => s.works.includes(id)));
const storyWorks = rid => [...new Set(D.readings.find(r => r.id === rid).steps.flatMap(s => s.works))].filter(id => hasImg(work(id)));
const groupOf = p => D.groups.find(g => g.id === p?.group);
const yr = (y, approx) => y == null ? '' : (approx ? '约 ' : '') + (y < 0 ? `前 ${-y}` : y);
const lifespan = p => `${yr(p.born, p.approx)}–${p.diedText || yr(p.died)}`;
const portrait = id => thumb('person:' + id);
const shortName = n => n.length > 5 && n.includes('·') ? n.replace(/^.*·/, '') : n;
const avatar = o => portrait(o.id) ? `<img class="avatar" src="${portrait(o.id)}" alt="" loading="lazy">` : `<span class="avatar">${esc(o.name[0])}</span>`;
// 分组色：浅色与深色模式各取一套，由 .gc 类在 CSS 里切换
const gc = g => g ? `--cl:${g.light};--cd:${g.dark}` : '';
const gcPerson = p => gc(groupOf(period(p.period)));
const firstImg = pid => worksOf(pid).find(hasImg)?.id;
const imgsOf = (pid, n) => worksOf(pid).filter(hasImg).slice(0, n).map(w => w.id);

// 人物关系：自己记录的、别人指向自己的（反向称呼），以及一同出现在“相遇”里的人
const KIND = { teach: ['师承', 'var(--k-teach)'], infl: ['影响', 'var(--k-infl)'], rival: ['对手', 'var(--k-rival)'], patron: ['赞助', 'var(--k-patron)'], met: ['相遇', 'var(--k-met)'] };
const relCache = new Map();
function relationsOf(id) {
  if (relCache.has(id)) return relCache.get(id);
  const out = new Map(), add = (pid, label, kind, note) => { if (pid !== id && person(pid) && !out.has(pid)) out.set(pid, { id: pid, label, kind, note }); };
  const own = { teachers: ['老师', 'teach'], influences: ['影响来源', 'infl'], rivals: ['对手', 'rival'], patrons: ['赞助人', 'patron'] };
  const back = { teachers: ['学生', 'teach'], influences: ['受其影响', 'infl'], rivals: ['对手', 'rival'], patrons: ['受其赞助', 'patron'] };
  Object.entries(person(id).rel || {}).forEach(([k, ids]) => ids.forEach(x => add(x, ...(own[k] || [k, 'met']))));
  D.people.forEach(o => Object.entries(o.rel || {}).forEach(([k, ids]) => { if (ids.includes(id)) add(o.id, ...(back[k] || [k, 'met'])); }));
  D.encounters.forEach(e => { if (e.people.includes(id)) e.people.forEach(x => add(x, '相遇', 'met', `${e.yearText || yr(e.year)} · ${e.title}`)); });
  relCache.set(id, [...out.values()]);
  return relCache.get(id);
}
let hubList;
const hubs = () => hubList ??= [...D.people].sort((a, b) => relationsOf(b.id).length - relationsOf(a.id).length).slice(0, 14);

// ───── 状态 ─────
const TABS = [['sea', '画海', 'sea'], ['guide', '导览', 'guide'], ['people', '人物', 'people'], ['saved', '收藏', 'saved']];
const S = { tab: 'sea', prevTab: 'sea', query: '', recent: [], viewed: [], results: [] };
// 收藏只存作品 id（与上一版共用键名）；阅读进度按故事保存；阅读外观单独保存
let saved = readLS('aha.favorites.v1', []);
if (!Array.isArray(saved)) saved = [];
const progress = loadProgress();
const prefs = readLS('aha.reader.v1', { fs: 18, theme: 'paper' });
function loadProgress() {
  const now = readLS('aha.reading.v2', null);
  if (now && typeof now === 'object' && !Array.isArray(now)) return now;
  // 上一版存的是 [故事 id, 路由] 列表，迁移步骤、选择与展开状态
  const old = readLS('aha.reading.v1', []), out = {};
  if (Array.isArray(old)) old.forEach(x => {
    if (!Array.isArray(x) || !Number.isInteger(x[1]?.step)) return;
    const notes = x[1].notes || {}, choice = {}, open = {};
    Object.entries(notes).forEach(([k, n]) => { if (Number.isInteger(n?.choice)) choice[k] = n.choice; if (n?.open) open[k] = true; });
    out[x[0]] = { step: x[1].step, choice, open, t: Date.now() };
  });
  return out;
}
let busy = false, viewer = null, sheet = null, ctx = null, hudTimer = 0, suppressClick = false;
const isSaved = id => saved.includes(id);
const rootRoute = t => ({
  sea: { kind: 'sea', mode: 'sea', period: '', sel: 'mona-lisa' },
  guide: { kind: 'guide', seg: 'chrono', band: 'china-dynasties', year: 1504, real: false, list: false },
  people: { kind: 'people', seg: 'time', year: 1504, focus: 'michelangelo', cf: '', trail: [] },
  saved: { kind: 'saved' },
  search: { kind: 'search' },
})[t];

// ───── 外壳 ─────
let tabbar, qInput, safeTop = 0;
function shell() {
  app.innerHTML = `<i class="probe"></i><div class="app-body">${['sea', 'guide', 'people', 'saved', 'search'].map(t => `<div class="stack" data-stack="${t}" hidden></div>`).join('')}</div>
  <nav class="tabbar" aria-label="主要区域"><div class="cap glass"><span class="pill"></span>${TABS.map(([id, label, ic]) => `<button data-act="tab" data-v="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</div>
  <label class="srch glass" data-act="openSearch">${icon('search')}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="作品、艺术家、时期" aria-label="搜索全部内容"><button class="clear" data-act="clearQ" aria-label="清除">${icon('close')}</button></label></nav>
  <div class="hud glass" role="status" aria-live="polite"></div>`;
  tabbar = app.querySelector('.tabbar');
  qInput = app.querySelector('#q');
  safeTop = app.querySelector('.probe').offsetHeight;
  qInput.addEventListener('input', onQuery);
  qInput.addEventListener('keydown', e => { if (e.key === 'Enter') { remember(qInput.value); qInput.blur(); } });
  if (window.visualViewport) visualViewport.addEventListener('resize', () => {
    const kb = Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop);
    tabbar.style.translate = kb > 60 ? `0 ${-kb}px` : '';
  });
}

const stackEl = t => app.querySelector(`[data-stack="${t}"]`);
const pages = (t = S.tab) => [...stackEl(t).children];
const topPage = () => pages().at(-1);
const pageOf = n => n.closest('.page');
const rel = n => { const a = app.getBoundingClientRect(), b = n.getBoundingClientRect(); return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height }; };
function anim(node, frames, dur, easing = EASE) {
  if (!node) return Promise.resolve();
  // 减少动态效果时直接落到终点，不依赖动画回调
  if (reduced) { Object.entries(frames.at(-1)).forEach(([k, v]) => { node.style[k] = v; }); return Promise.resolve(); }
  const a = node.animate(frames, { duration: reduced ? 1 : dur, easing, fill: 'forwards' });
  return a.finished.then(() => { try { a.commitStyles(); } catch {} a.cancel(); }, () => {});
}

const themeMeta = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
function chrome() {
  const top = topPage(), k = top?.route.kind;
  tabbar.classList.toggle('hide', k === 'reader');
  tabbar.classList.toggle('searching', S.tab === 'search');
  tabbar.querySelectorAll('.cap button').forEach(b => {
    b.setAttribute('aria-current', b.dataset.v === S.tab ? 'page' : 'false');
    b.classList.toggle('ret', S.tab === 'search' && b.dataset.v === S.prevTab);
  });
  const cur = tabbar.querySelector(`.cap [data-v="${S.tab}"]`), pill = tabbar.querySelector('.pill');
  if (cur) Object.assign(pill.style, { left: cur.offsetLeft + 'px', width: cur.offsetWidth + 'px' });
  tabbar.classList.toggle('on-sea', k === 'sea');
  // 状态栏颜色跟着页面：画海夜空、全图和夜间阅读用深色
  const dark = !!viewer || (k === 'sea' && isDark()) || (k === 'reader' && prefs.theme === 'night');
  themeMeta.content = dark ? '#0b1520' : getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#f4f4f1';
  saveHistory();
}

function hud(text, ic = 'check') {
  const h = app.querySelector('.hud');
  h.innerHTML = icon(ic) + esc(text);
  h.classList.add('show');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => h.classList.remove('show'), 1700);
}

// 从画作或肖像取一个柔和的主色，用作页面顶部的光晕
const tintCache = new Map();
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function applyTint(el, key, url) {
  if (!url) return;
  const set = v => { if (!v) return; el.classList.add('tinted'); el.style.setProperty('--art-l', v[0]); el.style.setProperty('--art-d', v[1]); };
  if (tintCache.has(key)) return set(tintCache.get(key));
  const im = new Image();
  im.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 10;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 10, 10);
      const d = x.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const w = 1 + Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]); r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w; }
      const [h, s] = rgbToHsl(r / n, g / n, b / n), sat = Math.round(Math.min(.62, s * 1.5 + .12) * 100);
      const v = [`hsla(${Math.round(h)},${Math.round(sat * .7)}%,80%,.34)`, `hsla(${Math.round(h)},${Math.round(sat * .6)}%,30%,.3)`];
      tintCache.set(key, v);
      set(v);
    } catch {}
  };
  im.src = url;
}

// ───── 页面 ─────
function makePage(route) {
  const el = document.createElement('section');
  el.className = 'page';
  el.route = route;
  return el;
}
function draw(el, keepScroll = true, enter = false) {
  const top = el.querySelector('.scroll')?.scrollTop || 0;
  el.cleanup?.();
  el.cleanup = null;
  el.stale = false;
  const v = VIEWS[el.route.kind](el.route);
  const keepTint = el.classList.contains('tinted');
  el.className = 'page ' + (v.cls || '') + (keepTint ? ' tinted' : '');
  el.innerHTML = v.html + '<div class="shade"></div>';
  const sc = el.querySelector('.scroll');
  if (sc && enter && !reduced) {
    [...sc.children].forEach((c, i) => { c.classList.add('rise'); c.style.setProperty('--i', Math.min(i, 9)); });
    sc.querySelectorAll('.rail > *, .grid2 > *, .pgrid > *, .browse > *').forEach((c, i) => { c.classList.add('rise'); c.style.setProperty('--i', Math.min(3 + i * .5, 12)); });
    el.classList.add('enter');
    setTimeout(() => el.classList.remove('enter'), 1600);
  }
  v.mount?.(el);
  if (sc && keepScroll) sc.scrollTop = top;
  bindScroll(el);
  mountSeg(el);
}
function bindScroll(el) {
  const sc = el.querySelector('.scroll'), nv = el.querySelector('.nav');
  if (!sc || !nv) return;
  const hero = el.querySelector('.whero,.story-top');
  const f = () => {
    const th = hero ? hero.offsetHeight + (hero.classList.contains('whero') ? 0 : 40) - nv.offsetHeight : nv.classList.contains('bare') ? 4 : 34;
    nv.classList.toggle('solid', sc.scrollTop > th);
    if (hero && !reduced) hero.style.setProperty('--py', Math.max(0, sc.scrollTop * .35) + 'px');
  };
  sc.addEventListener('scroll', f, { passive: true });
  f();
}
function mountSeg(el, from) {
  el.querySelectorAll('.segc').forEach(s => {
    const on = s.querySelector('[aria-pressed="true"]'), th = s.querySelector('.thumb-s');
    if (!on || !th) return;
    if (from && s.querySelector(`[data-key="${from.key}"]`)) {
      th.style.transition = 'none';
      Object.assign(th.style, { left: from.l + 'px', width: from.w + 'px' });
      th.offsetWidth;
      th.style.transition = '';
    }
    Object.assign(th.style, { left: on.offsetLeft + 'px', width: on.offsetWidth + 'px' });
  });
}

const nav = ({ title = '', back = true, right = '' }) =>
  `<header class="nav"><div class="l">${back ? `<button class="circle glass" data-act="back" aria-label="返回">${icon('back')}</button>` : ''}</div><div class="t">${esc(title)}</div><div class="r">${right}</div></header>`;
// tab 根页面不放标题（底栏已经标明在哪一页），只留一条状态栏背后的玻璃条
const bare = `<header class="nav bare"></header>`;
const seg = (key, opts, cur) =>
  `<div class="segc" role="group"><span class="thumb-s"></span>${opts.map(([v, l]) => `<button data-act="seg" data-key="${key}" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
const sec = (title, right = '') => `<div class="sec"><h2>${esc(title)}</h2>${right}</div>`;
const tile = (id, list) =>
  `<button class="tile" data-act="work" data-v="${id}" data-list="${list}" data-zoom="${id}" data-ctx="${id}" aria-label="${esc(work(id).title)}"><img src="${thumb(id)}" alt="" loading="lazy" decoding="async"></button>`;
const wcard = (id, list) => {
  const w = work(id);
  return `<button class="wcard" data-act="work" data-v="${id}" data-list="${list}" data-zoom="${id}" data-ctx="${id}"><div class="im"><img src="${thumb(id)}" alt="" loading="lazy"></div><b>${esc(w.title)}</b><small>${esc(w.artist)}</small></button>`;
};
const chev = icon('chev', 'chev');
const aboutRow = `<div class="block card rows" style="margin-top:20px"><button class="lrow" data-act="about"><div class="main"><b>关于画间与设置</b><small>外观、图片来源、延伸阅读</small></div>${icon('chev', 'chev')}</button></div>`;
const CONTEXTS = [['relay', '艺术中心地图', '艺术为什么在这里发生'], ['pendulum', '理性与激情', '审美的来回摆动'], ['pairs', '并置看画', '同一个问题，两种回答'], ['sizes', '画有多大', '与 1.7 米的人比较']];
const saveIcon = id => icon('saved', isSaved(id) ? 'fill saved-on' : '');
const storyCard = r => `<button class="card scard press" data-act="story" data-v="${r.id}"><img src="${thumb(r.steps[0].works[0])}" alt=""><div><b>${esc(r.title)}</b><small>${r.minutes} 分钟 · ${r.steps.length} 步</small></div>${icon('chev')}</button>`;
const personRow = (o, small, act = 'person') => `<button class="lrow" style="--sep-left:68px" data-act="${act}" data-v="${o.id}">${avatar(o)}<div class="main"><b>${esc(o.name)}</b><small>${esc(small)}</small></div>${chev}</button>`;

const VIEWS = {
  // 画海：漂浮画作（浅色是晨光，深色是夜色）或按时期分组的网格
  sea(r) {
    const p = period(r.period);
    // 顶栏：左边站名与副标题，右边随机和网格；时期选择在画海里放到底部展签上方，网格里留在顶栏
    const periodBtn = cls => `<button class="capsule glass ${cls}" data-act="seaPeriod" aria-label="选择时期">${esc(p ? p.name : '全部时期')}${icon('down')}</button>`;
    const top = `<div class="sea-head"><div class="sea-brand"><h1>${esc(state.site.title)}</h1>${r.mode === 'sea' ? `<p>${p ? `${esc(p.name)} · ${esc(p.span)}` : esc(state.site.tagline.replace(/。$/, ''))}</p>` : ''}</div>
      <div style="display:flex;gap:8px">${r.mode === 'sea' ? `<button class="circle glass" data-act="seaShuffle" aria-label="随机一件">${icon('shuffle')}</button>` : periodBtn('')}<button class="circle glass" data-act="seaMode" aria-label="${r.mode === 'sea' ? '以网格浏览' : '回到画海'}">${icon(r.mode === 'sea' ? 'grid' : 'sparkle')}</button></div></div>`;
    if (r.mode === 'grid') {
      const ps = p ? [p] : D.periods;
      return { cls: 'sea sea-grid', html: top + `<div class="scroll">${ps.map(pp => { const ws = worksOf(pp.id).filter(hasImg); return ws.length ? `<div class="grid-h"><span>${esc(pp.name)}</span><small>${esc(pp.span)}</small></div><div class="tiles">${ws.map(w => tile(w.id, 'period:' + pp.id)).join('')}</div>` : ''; }).join('')}</div>` };
    }
    return {
      cls: 'sea',
      html: `<div class="sea-view" aria-label="画海，拖动浏览"><div class="sea-world"></div></div>${top}
        ${periodBtn('sea-period')}
        <div class="sea-card glass"></div>`,
      mount: mountSea,
    };
  },

  guide(r) {
    let body = '';
    let mount = null;
    if (r.seg === 'chrono' && r.list) body = `<div class="sec" style="padding-top:12px"><button class="btn-soft" data-act="cbList">${icon('back')}回到时光带</button></div>` + chronoHtml(r);
    else if (r.seg === 'chrono') { body = cbHtml(r); mount = mountChrono; }
    else if (r.seg === 'hall') {
      body = D.groups.map(g => {
        const ps = D.periods.filter(p => p.group === g.id);
        return `<div class="gl">${esc(g.name)}</div><div class="grid2">${ps.map(p => `<button class="card hcard pastel gc press" style="${gc(g)}" data-act="hall" data-v="${p.id}"><span class="n">${String(D.periods.indexOf(p) + 1).padStart(2, '0')}</span><div class="im">${imgsOf(p.id, 2).map(id => `<img src="${thumb(id)}" alt="" loading="lazy">`).join('')}</div><div><b>${esc(p.short)}</b><small>${esc(p.span)}</small></div></button>`).join('')}</div>`;
      }).join('');
    } else {
      const stories = D.readings.filter(x => x.kind === 'story'), routes = D.readings.filter(x => x.kind === 'route');
      const last = Object.entries(progress).sort((a, b) => b[1].t - a[1].t)[0];
      const lr = last && D.readings.find(x => x.id === last[0]);
      const feat = stories.find(x => x.id !== lr?.id) || stories[0];
      body = (lr ? sec('继续看') + `<div class="block"><button class="card resume press" data-act="read" data-v="${lr.id}"><img src="${thumb(lr.steps[0].works[0])}" alt=""><div><small>第 ${last[1].step + 1} 步 · 共 ${lr.steps.length} 步</small><b>${cl(lr.title)}</b><div class="bar"><i style="width:${Math.round((last[1].step + 1) / lr.steps.length * 100)}%"></i></div></div><span class="go">${icon('play', 'fill')}</span></button></div>` : '')
        + sec('今天看这个') + `<div class="block"><button class="featcard" data-act="story" data-v="${feat.id}"><img src="${display(feat.steps[0].works[0])}" alt=""><div class="cap"><span class="k">${feat.minutes} 分钟 · ${feat.steps.length} 步</span><h3>${cl(feat.title)}</h3><p>${esc(feat.deck)}</p></div></button></div>`
        + sec('看画故事', `<small>${stories.length} 篇</small>`) + `<div class="rail">${stories.filter(x => x !== feat).map(x => `<button class="card scard2 press" data-act="story" data-v="${x.id}"><div class="im"><img src="${display(x.steps[0].works[0])}" alt="" loading="lazy"></div><div class="tx"><b>${cl(x.title)}</b><small>${x.minutes} 分钟 · ${esc(x.deck)}</small></div></button>`).join('')}</div>`
        + sec('现代艺术专题') + `<div class="block card rows">${routes.map(x => `<button class="lrow" style="--sep-left:72px" data-act="story" data-v="${x.id}"><img class="thumb" src="${thumb(x.steps[0].works[0])}" alt=""><div class="main"><b>${esc(x.title)}</b><small>${esc(x.deck)}</small></div>${chev}</button>`).join('')}</div>`;
    }
    return { cls: 'root', html: bare + `<div class="scroll">${seg('seg', [['chrono', '年表'], ['hall', '展厅'], ['story', '故事']], r.seg)}${body}</div>`, mount };
  },

  // 人物：时光（时间带 + 此时在世的人）、关系链、名录
  people(r) {
    let body = '', mount = null;
    if (r.seg === 'chain') { body = chainHtml(r); mount = mountChain; }
    else if (r.seg === 'all') body = rosterHtml();
    else { body = timeHtml(r); mount = mountTime; }
    return { cls: 'root', html: bare + `<div class="scroll">${seg('seg', [['time', '时光'], ['chain', '关系'], ['all', '名录']], r.seg)}<div class="pbody">${body}</div></div>`, mount };
  },

  saved() {
    const list = saved.filter(id => hasImg(work(id)));
    if (!list.length) return { cls: 'root', html: bare + `<div class="scroll"><div class="block card empty-state"><span class="orb">${icon('saved')}</span><h2>还没有收藏</h2><p>在画海或作品页点书签，<br>下次就能从这里继续看。</p><button class="btn-soft" data-act="tab" data-v="sea">去画海看看</button></div>${aboutRow}</div>` };
    return { cls: 'root', html: bare + `<div class="scroll"><div class="masonry">${list.map(id => { const w = work(id); return `<button class="card mcard press" data-act="work" data-v="${id}" data-list="saved" data-zoom="${id}" data-ctx="${id}"><img src="${thumb(id)}" alt="" loading="lazy" style="aspect-ratio:${(1 / ratio(id)).toFixed(3)}"><b>${esc(w.title)}</b><small>${esc(w.artist)}</small></button>`; }).join('')}</div><p class="foot" style="text-align:center">${list.length} 件作品，保存在这台设备 · 长按可以取消收藏</p>${aboutRow}</div>` };
  },

  search() {
    return { cls: 'root', html: bare + `<div class="scroll"><div class="results">${searchBody()}</div></div>` };
  },

  work(r) {
    const w = work(r.id), idx = r.ids.indexOf(r.id);
    return {
      html: nav({ title: w.title, right: `<button class="circle glass" data-act="save" data-v="${w.id}" aria-label="收藏">${saveIcon(w.id)}</button><button class="circle glass" data-act="share" aria-label="分享">${icon('share')}</button>` })
        + `<div class="scroll"><div class="whero"><div class="track" style="transform:translateX(${-idx * 100}%)">${r.ids.map((id, i) => `<div class="slide${i === idx ? ' cur' : ''}" data-act="full" data-v="${id}" data-i="${i}">${Math.abs(i - idx) <= 1 ? slideImg(id) : ''}</div>`).join('')}</div>${r.ids.length > 1 ? `<span class="count glass">${idx + 1} / ${r.ids.length}</span>` : ''}</div><div class="sheetcard"><div class="work-info">${workInfo(r)}</div></div></div>`,
      mount: el => { mountHero(el); applyTint(el, r.id, thumb(r.id)); },
    };
  },

  person(r) {
    const p = person(r.id), ws = worksByPerson(p.id), por = portrait(p.id), rels = relationsOf(p.id);
    const mid = Math.round((p.born + p.died) / 2);
    return {
      html: nav({ title: p.name }) + `<div class="scroll"><div class="ptop">${por ? `<img class="portrait" src="${por}" alt="">` : `<div class="portrait">${esc(p.name[0])}</div>`}<h1>${esc(p.name)}</h1><span class="en">${esc(p.en)} · ${esc(lifespan(p))}</span><p>${cl(p.line)}</p><span class="ptags">${esc([(p.roles || []).join(' · '), (p.cities || []).slice(0, 2).join(' · ')].filter(Boolean).join('　|　'))}</span>
          <div class="btns"><button class="btn-soft" data-act="timeFocus" data-v="${p.id}">${icon('clock')}在时光里看</button>${rels.length ? `<button class="btn-soft" data-act="chainFocus" data-v="${p.id}">${icon('chain')}关系链</button>` : ''}</div></div>`
        + (ws.length ? sec('作品', `<small>${ws.length} 件</small>`) + `<div class="rail">${ws.map(w => wcard(w.id, 'by:' + p.id)).join('')}</div>` : '')
        + (p.quote ? `<figure class="block card quote"><blockquote>${esc(p.quote.text)}</blockquote><figcaption>— ${esc(p.quote.by)}${p.quote.source ? `<small>${esc(p.quote.source)}</small>` : ''}</figcaption></figure>` : '')
        + (p.points?.length ? sec(`认识${p.name}`) + `<ol class="block card facts">${p.points.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '')
        + (p.life?.length ? sec('生平', `<small>${p.life.length} 件事</small>`) + `<div class="block card lifecard">${p.life.map(e => `<article><i></i><div><time>${esc(e.yearText || yr(e.year))}${e.year > p.born && e.year < p.died ? `<span>${e.year - p.born} 岁</span>` : ''}</time><p>${esc(e.text)}</p></div></article>`).join('')}</div>` : '')
        + (p.legacy ? sec('评价与影响') + `<div class="block card pad prose"><p>${esc(p.legacy)}</p></div>` : '')
        + (rels.length ? sec('相关的人', `<small>${rels.length} 位</small>`) + `<div class="block card rows">${rels.map(x => personRow(person(x.id), x.note || x.label)).join('')}</div>` : '')
        + `</div>`,
      mount: el => applyTint(el, 'person:' + p.id, por),
    };
  },

  hall(r) {
    const p = period(r.id), ws = worksOf(p.id).filter(hasImg), i = D.periods.indexOf(p), next = D.periods[i + 1], g = groupOf(p);
    return {
      html: nav({ title: p.name }) + `<div class="scroll"><div class="card hall-top pastel gc" style="${gc(g)}"><span class="k">第 ${i + 1} 间 · ${esc(p.span)}</span><h1>${esc(p.name)}</h1><q>${cl(p.question || p.thesis)}</q><div class="chips">${(p.keywords || []).map(k => `<span class="pchip">${esc(k)}</span>`).join('')}</div></div>
        <div style="padding:16px 16px 0">${ws[0] ? `<button class="pbtn" data-act="work" data-v="${ws[0].id}" data-list="period:${p.id}">${icon('play', 'fill')}从第一件看 · ${ws.length} 件</button>` : ''}</div>
        ${sec('本厅作品')}<div class="tiles">${ws.map(w => tile(w.id, 'period:' + p.id)).join('')}</div>
        ${sec('更多')}<div class="block card rows"><button class="lrow" data-act="era" data-v="${p.id}"><div class="main"><b>认识这个时代</b><small>${esc(p.thesis.slice(0, 34))}…</small></div>${chev}</button>${p.diagram ? `<button class="lrow" data-act="ctx" data-v="diagram:${p.id}"><div class="main"><b>互动图解</b><small>${esc(p.diagram.title)}</small></div>${chev}</button>` : ''}${next ? `<button class="lrow" data-act="hall" data-v="${next.id}"><div class="main"><b>下一间 · ${esc(next.name)}</b><small>${esc(p.bridge || next.span)}</small></div>${chev}</button>` : ''}</div></div>`,
      mount: el => ws[0] && applyTint(el, ws[0].id, thumb(ws[0].id)),
    };
  },

  story(r) {
    const s = D.readings.find(x => x.id === r.id), p = progress[s.id];
    const ppl = (s.people || []).map(person).filter(Boolean);
    return {
      html: nav({ title: s.title }) + `<div class="scroll"><div class="story-top"><img src="${display(s.steps[0].works[0])}" alt="" style="translate:0 var(--py,0);scale:1.08"><div class="cap"><span class="k">${s.kind === 'route' ? '专题' : '看画故事'} · ${s.minutes} 分钟 · ${s.steps.length} 步</span><h1>${cl(s.title)}</h1></div></div>
        <div class="prose" style="padding-top:20px"><p class="lead">${esc(s.deck)}</p></div>
        <div style="padding:16px"><button class="pbtn" data-act="read" data-v="${s.id}">${icon('play', 'fill')}${p ? `继续看 · 第 ${p.step + 1} 步` : '开始看'}</button></div>
        ${sec(`${s.steps.length} 步`)}<div class="block card steps">${s.steps.map((x, i) => `<div class="lrow static"><span class="num">${i + 1}</span><div class="main"><b>${esc(x.title)}</b></div></div>`).join('')}</div>
        ${sec('会看到的作品')}<div class="rail">${storyWorks(s.id).map(id => wcard(id, 'story:' + s.id)).join('')}</div>
        ${ppl.length ? sec('人物') + `<div class="block card rows">${ppl.map(o => personRow(o, o.line)).join('')}</div>` : ''}</div>`,
      mount: el => applyTint(el, s.steps[0].works[0], thumb(s.steps[0].works[0])),
    };
  },

  reader(r) {
    const s = D.readings.find(x => x.id === r.id), st = s.steps[r.step], last = r.step === s.steps.length - 1;
    const ch = r.choice[r.step], open = r.open[r.step], hot = r.hot[r.step];
    const details = st.details || [];
    const hotNote = hot != null && details[hot] ? `<div class="hot-note"><b>${esc(details[hot].label)}</b>${esc(details[hot].note)}</div>` : '';
    return {
      cls: `reader no-tabbar ${prefs.theme === 'white' ? 't-white' : prefs.theme === 'night' ? 't-night' : ''}`,
      html: `<header class="nav"><div class="l"><button class="circle glass" data-act="back" aria-label="关闭">${icon('close')}</button></div><div class="rprog" aria-label="第 ${r.step + 1} 步，共 ${s.steps.length} 步">${s.steps.map((_, i) => `<i class="${i <= r.step ? 'done' : ''}"></i>`).join('')}</div><div class="r"><button class="capsule glass" data-act="aa" aria-label="阅读外观">Aa</button></div></header>
        <div class="scroll"><article class="read" style="--fs:${prefs.fs}px"><span class="k">第 ${r.step + 1} 步 · ${esc(s.title)}</span><h1>${cl(st.title)}</h1>
        <div class="figs${st.works.some(id => ratio(id) < .9) ? ' vert' : ''}">${st.works.map(id => `<figure><span class="fwrap"><img src="${display(id)}" alt="${esc(work(id).title)}" data-act="full" data-v="${id}">${details.map((d, k) => d.work === id ? `<button class="hot${hot === k ? ' on' : ''}" data-act="hot" data-v="${k}" style="left:${d.x}%;top:${d.y}%" aria-label="${esc(d.label)}">${k + 1}</button>` : '').join('')}</span><figcaption>${esc(work(id).artist)}《${esc(work(id).title)}》</figcaption></figure>`).join('')}</div>
        ${hotNote}<p>${esc(st.prompt)}</p>
        ${(st.choices || []).map((c, k) => `<button class="choice" data-act="choice" data-v="${k}" aria-pressed="${ch === k}"><span class="ring">${ch === k ? icon('check') : ''}</span>${esc(c.label)}</button>`).join('')}
        ${ch != null ? `<div class="response">${esc(st.choices[ch].response)}</div>` : ''}
        <div><button class="disclose" data-act="disclose" aria-expanded="${!!open}">看看解读与背景${icon('chev')}</button>${open ? `<p>${esc(st.context)}</p>` : ''}</div>
        </article></div>
        <div class="reader-foot">${r.step ? `<button class="circle glass" style="width:52px;height:52px" data-act="rprev" aria-label="上一步">${icon('back')}</button>` : ''}<button class="pbtn" data-act="rnext">${last ? '看完了' : '下一步'}</button></div>`,
    };
  },

  // 脉络：艺术中心地图、派系、理性与激情、并置、尺度、展厅图解；内容和图解实现与上一版共用
  context(r) {
    const titles = { relay: '艺术中心地图', schools: '派系与关系', 'people-life': '派系生命线', pendulum: '理性与激情', pairs: '并置看画', sizes: '画有多大', chronology: '沿着年代看' };
    const title = r.id.startsWith('diagram:') ? period(r.id.slice(8))?.diagram?.title || '图解' : titles[r.id] || '脉络';
    return {
      // 大标题按分句断行（图解标题常是一个问句）
      html: nav({ title }) + `<div class="scroll"><div class="ctxpage">${contextPage(r.id, r.value || '').replace(/<h2>([^<]*)<\/h2>/, (m, t) => `<h2>${t.split(/(?<=[，、：；？！。,:;?!])/).map(x => `<span class="cl">${x}</span>`).join('')}</h2>`)}</div></div>`,
      mount: el => mountContext(el, r.id, r.value || ''),
    };
  },

  about() {
    const theme = readLS('aha.theme', 'system');
    return {
      html: nav({ title: '关于画间' }) + `<div class="scroll"><div class="about-top"><h1>${esc(state.site.title)}</h1><p>${esc(state.site.tagline)}</p></div>
        <div class="prose" style="padding-top:4px"><p>${esc(state.t.meta.description)}</p></div>
        ${sec('外观')}<div style="padding:0 0 4px">${seg('theme', [['system', '跟随系统'], ['light', '浅色'], ['dark', '深色']], theme)}</div>
        ${sec('图片与来源')}<div class="block card pad prose"><p>图片来自维基共享资源、维基百科与馆藏网站。每件作品的“资料”里保留作者、来源与权利说明。</p></div>
        ${sec('延伸阅读')}<div class="block card rows">${state.site.recommendedReading.map(x => `<div class="lrow static"><div class="main"><b>${esc(x.title)}</b><small>${esc(x.author)}</small></div></div>`).join('')}</div>
        ${sec('开源')}<div class="block card rows"><a class="lrow" href="${esc(state.site.repo)}" target="_blank" rel="noopener"><div class="main"><b class="link">源代码</b><small>代码 MIT · 文字 CC BY-SA 4.0</small></div>${icon('link', 'chev')}</a><a class="lrow" href="https://x.com/Tumars" target="_blank" rel="noopener"><div class="main"><b class="link">作者 · X @Tumars</b></div>${icon('link', 'chev')}</a></div>
        <p class="foot">收藏和阅读进度保存在这个浏览器里，清除浏览器数据会一并删除。</p></div>`,
    };
  },

  missing() {
    return { html: nav({ title: '未找到' }) + `<div class="scroll"><div class="block card empty-state" style="margin-top:12px"><span class="orb">${icon('search')}</span><h2>没有找到这项内容</h2><p>链接可能已经过期，可以从画海重新开始。</p><button class="btn-soft" data-act="tab" data-v="sea">回到画海</button></div></div>` };
  },
};

function workInfo(r) {
  const w = work(r.id), p = period(w.period), by = w.by?.[0] && person(w.by[0]);
  const look = `<div class="prose" style="padding-top:20px"><p class="lead">${esc(w.summary)}</p></div>`
    + (storiesOf(w.id).length ? sec('在故事里') + `<div class="stackv">${storiesOf(w.id).map(storyCard).join('')}</div>` : '')
    + (by && worksByPerson(by.id).length > 1 ? sec(`${by.name}的作品`, `<button class="more" data-act="person" data-v="${by.id}">全部</button>`) + `<div class="rail">${worksByPerson(by.id).filter(x => x.id !== w.id).slice(0, 12).map(x => wcard(x.id, 'by:' + by.id)).join('')}</div>` : '')
    + sec('同一展厅', `<button class="more" data-act="hall" data-v="${p.id}">${esc(p.short)}</button>`) + `<div class="rail">${worksOf(p.id).filter(x => hasImg(x) && x.id !== w.id).slice(0, 14).map(x => wcard(x.id, 'period:' + p.id)).join('')}</div>`;
  const c = D.credits[w.id] || {};
  const info = sec('作品') + `<div class="block card rows">
      <div class="lrow static"><div class="main"><b>年代</b></div><span class="val">${esc(w.yearText)}</span></div>
      <div class="lrow static"><div class="main"><b>材质</b></div><span class="val">${esc(w.medium)}</span></div>
      <div class="lrow static"><div class="main"><b>收藏</b></div><span class="val">${esc(w.location)}</span></div>
      <button class="lrow" data-act="hall" data-v="${p.id}"><div class="main"><b>展厅</b></div><span class="val">${esc(p.name)}</span>${chev}</button></div>
    ${w.imageNote ? `<p class="foot">${esc(w.imageNote)}</p>` : ''}
    ${sec('图片')}<div class="block card rows">
      <div class="lrow static"><div class="main"><b>作者</b></div><span class="val">${esc(c.author || '—')}</span></div>
      <div class="lrow static"><div class="main"><b>许可</b></div><span class="val">${esc(c.license || '—')}</span></div>
      ${c.source ? `<a class="lrow" href="${esc(c.source)}" target="_blank" rel="noopener"><div class="main"><b class="link">图片原始来源</b></div>${icon('link', 'chev')}</a>` : ''}
      ${w.source ? `<a class="lrow" href="${esc(w.source)}" target="_blank" rel="noopener"><div class="main"><b class="link">作品资料</b></div>${icon('link', 'chev')}</a>` : ''}</div>`;
  return `<div class="work-head"><h1>${esc(w.title)}</h1>${by ? `<button class="artist" data-act="person" data-v="${by.id}">${esc(w.artist)}${icon('chev')}</button>` : `<span class="mt" style="color:var(--ink);font-size:16px">${esc(w.artist)}</span>`}<span class="mt">${esc(w.yearText)} · ${esc(p.name)}</span></div>
    <div class="acts"><button class="card press" data-act="full" data-v="${w.id}">${icon('expand')}看全图</button><button class="card press" data-act="save" data-v="${w.id}">${icon('saved', isSaved(w.id) ? 'fill' : '')}${isSaved(w.id) ? '已收藏' : '收藏'}</button><button class="card press" data-act="hall" data-v="${p.id}">${icon('hall')}${esc(p.short)}</button><button class="card press" data-act="share">${icon('share')}分享</button></div>
    ${seg('tab', [['look', '看点'], ['info', '资料']], r.tab || 'look')}${r.tab === 'info' ? info : look}`;
}

// ───── 年表 ─────
function chronoHtml(r) {
  const band = D.bands.find(b => b.id === r.band) || D.bands[0];
  return `<div class="sec" style="padding-top:18px"><small>${D.periods.length} 个时期 · ${D.events.length} 件大事</small><button class="btn-soft" data-act="bandPick">对照 · ${esc(band.label)}${icon('down')}</button></div>`
    + D.periods.map(p => {
      const g = groupOf(p), evs = D.events.filter(e => e.periods?.includes(p.id)).sort((a, b) => a.year - b.year);
      const same = band.items.filter(x => x.start < p.end && x.end > p.start);
      return `<section class="card era pastel gc" style="${gc(g)}"><button class="era-h" data-act="hall" data-v="${p.id}"><img src="${thumb(firstImg(p.id))}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><small>${esc(p.span)}</small></div>${icon('chev')}</button>
        ${evs.map(e => `<button class="ev" data-act="event" data-v="${D.events.indexOf(e)}"><time>${esc(e.yearText || yr(e.year))}</time><div><b>${esc(e.name)}</b><small>${esc(e.what)}</small></div></button>`).join('')}
        <div class="same"><span>${esc(band.label)}</span>${same.length ? same.map(x => `<span class="pchip">${esc(x.short || x.name)}</span>`).join('') : `<span class="pchip">${esc(band.emptyBefore?.label || '—')}</span>`}</div></section>`;
    }).join('');
}

// ───── 导览 · 年表时光带 ─────
// 与 PC 版年表同一组行：欧洲分期、中国朝代、教会历史、历史大事、代表作品、艺术时期，共用一条可拖的时间轴。
// 刻度沿用 site.json 的展开比例（越往后放得越大），可切到真实比例；具体文字放在下方“此刻”面板里读。
const CB = { W: 3400, start: -30000, end: 1970, segs: [[-30000, -3000, 0, .13], [-3000, 500, .13, .36], [500, 1400, .36, .5], [1400, 1970, .5, 1]] };
const CX = (y, real) => {
  if (real) return (Math.max(CB.start, Math.min(CB.end, y)) - CB.start) / (CB.end - CB.start) * CB.W;
  for (const [a, b, p, q] of CB.segs) if (y <= b) return (p + (Math.max(y, a) - a) / (b - a) * (q - p)) * CB.W;
  return CB.W;
};
const CYear = (x, real) => {
  const f = Math.max(0, Math.min(1, x / CB.W));
  if (real) return Math.round(CB.start + f * (CB.end - CB.start));
  for (const [a, b, p, q] of CB.segs) if (f <= q) return Math.round(a + (f - p) / (q - p) * (b - a));
  return CB.end;
};
// 年表和人物时光共用当前年份
let sharedYear = null;
const BAND_K = { neutral: '#8b8b86', cinnabar: '#c4553a', violet: '#7a5cc0' };
const cbWorks = () => D.works.filter(w => w.timeline && hasImg(w)).sort((a, b) => a.year - b.year);
function packLanes(items, x0, x1, max) {
  const ends = [];
  const lanes = items.map(it => {
    const a = x0(it);
    let k = ends.findIndex(e => e <= a);
    if (k < 0) { if (ends.length < max) { k = ends.length; ends.push(-1e9); } else k = ends.indexOf(Math.min(...ends)); }
    ends[k] = x1(it);
    return k;
  });
  return { lanes, n: Math.max(1, ends.length) };
}
function cbLayout(real) {
  const BH = 20, BG = 3, EV = 13, TS = 22, WR = 25, PH = 22;
  const evL = packLanes(D.events, e => CX(e.year, real) - 6, e => CX(e.year, real) + 6, 3);
  // 作品缩略图最多三行、彼此留 3px，挤不下时才叠
  const ws = cbWorks(), wkL = packLanes(ws, w => CX(w.year, real) - TS / 2 - 3, w => CX(w.year, real) + TS / 2, 3);
  const ps = [...D.periods].sort((a, b) => a.start - b.start);
  const pL = packLanes(ps, p => CX(p.start, real), p => Math.max(CX(p.end, real), CX(p.start, real) + p.short.length * 11 + 12) + 2, 5);
  const evTop = D.bands.length * (BH + BG) + 10, wkTop = evTop + evL.n * EV + 8, pTop = wkTop + wkL.n * WR + 4, tickTop = pTop + pL.n * PH + 10;
  return { BH, BG, EV, TS, WR, PH, evL, ws, wkL, ps, pL, evTop, wkTop, pTop, tickTop };
}
function cbHtml(r) {
  const real = !!r.real, L = cbLayout(real), at = y => `left:calc(var(--h) + ${CX(y, real).toFixed(1)}px)`;
  const span = (a, b) => `left:calc(var(--h) + ${CX(a, real).toFixed(1)}px);width:${Math.max(2, CX(b, real) - CX(a, real) - 1).toFixed(1)}px`;
  const rows = D.bands.map((b, bi) => b.items.map((it, ii) => {
    const w = CX(it.end, real) - CX(it.start, real), lab = w > it.name.length * 11 + 14 ? it.name : w > it.short.length * 11 + 12 ? it.short : '';
    return `<button class="cb-it${ii % 2 ? ' alt' : ''}" data-act="cbGo" data-v="b:${bi}:${ii}" data-s="${it.start}" data-e="${it.end}" style="--k:${BAND_K[b.theme] || BAND_K.neutral};${span(it.start, it.end)};top:${bi * (L.BH + L.BG)}px;height:${L.BH}px" aria-label="${esc(b.label)} ${esc(it.name)}">${lab ? `<span>${esc(lab)}</span>` : ''}</button>`;
  }).join('')).join('');
  const evs = D.events.map((e, i) => `<button class="cb-ev" data-act="cbGo" data-v="ev:${i}" data-i="${i}" style="${at(e.year)};top:${L.evTop + L.evL.lanes[i] * L.EV}px" aria-label="${esc(e.yearText || yr(e.year))} ${esc(e.name)}"></button>`).join('');
  const wks = L.ws.map((w, i) => `<button class="cb-wk gc" data-act="cbGo" data-v="wk:${w.id}" style="${gc(groupOf(period(w.period)))};${at(w.year)};top:${L.wkTop + L.wkL.lanes[i] * L.WR}px;width:${L.TS}px;height:${L.TS}px" aria-label="${esc(w.title)}"><img src="${thumb(w.id)}" alt=""></button>`).join('');
  const pers = L.ps.map((p, i) => `<button class="cb-p gc" data-act="cbGo" data-v="p:${p.id}" data-s="${p.start}" data-e="${p.end}" style="${gc(groupOf(p))};${span(p.start, p.end)};top:${L.pTop + L.pL.lanes[i] * L.PH}px" aria-label="${esc(p.name)}"><i></i><span>${esc(p.short)}</span></button>`).join('');
  const ticks = (real ? [-30000, -25000, -20000, -15000, -10000, -5000, 0] : [-30000, -3000, -1000, 0, 500, 1000, 1400, 1500, 1600, 1700, 1800, 1900])
    .map(y => `<span class="tb-tick" style="${at(y)};top:${L.tickTop}px;bottom:auto">${yr(y)}</span>`).join('');
  const labs = [...D.bands.map((b, bi) => [b.label.replace(/分期|朝代|历史/, ''), bi * (L.BH + L.BG) + 3]), ['大事', L.evTop - 2], ['作品', L.wkTop + 5], ['时期', L.pTop + 3]]
    .map(([t, y]) => `<span style="top:${y}px">${t}</span>`).join('');
  const pre = Math.round((-3000 - CB.start) / (CB.end - CB.start) * 100);
  return `<div class="card tband cb">
      <div class="now"><b class="tb-year">${yr(r.year)}</b><span class="tb-era"></span></div>
      <div class="cb-wrap"><div class="tb-scroll" aria-label="年表时光带，左右拖动选择年份"><div class="tb-in" style="width:calc(${CB.W}px + 100%);height:${L.tickTop + 18}px">${rows}${evs}${wks}${pers}${ticks}</div></div><div class="cb-labs">${labs}</div></div>
      <div class="tb-handle" style="top:62px;bottom:auto;height:${L.tickTop - 4}px"></div>
      <div class="cb-foot"><span>${real ? `按真实比例，史前约占整条时间线的 ${pre}%` : '左右拖动 · 点任何一项跳过去'}</span><button class="pchip${real ? ' tint' : ''}" data-act="cbReal" aria-pressed="${real}">真实比例</button></div>
    </div>
    <div class="cb-now"></div>
    ${sec('更多脉络')}<div class="block card rows">${CONTEXTS.map(([id, t, sub]) => `<button class="lrow" data-act="ctx" data-v="${id}"><div class="main"><b>${t}</b><small>${sub}</small></div>${chev}</button>`).join('')}</div>
    <div class="block card rows" style="margin-top:12px"><button class="lrow" data-act="cbList"><div class="main"><b>按时期列表浏览</b><small>${D.periods.length} 个时期，每个时期的大事和同时期的历史</small></div>${chev}</button></div>`;
}
function cbNowHtml(year, ei) {
  const arts = D.periods.filter(p => p.start <= year && year <= p.end).sort((a, b) => b.start - a.start);
  const ctx = D.bands.map((b, bi) => { const ii = b.items.findIndex(it => it.start <= year && year < it.end); return ii < 0 ? '' : `<button class="lrow" data-act="cbBand" data-v="${bi}:${ii}"><span class="cb-k" style="--k:${BAND_K[b.theme] || BAND_K.neutral}">${esc(b.label.replace(/分期|朝代|历史/, ''))}</span><div class="main"><b>${esc(b.items[ii].name)}</b><small>${yr(b.items[ii].start)} – ${yr(b.items[ii].end)}</small></div>${chev}</button>`; }).join('');
  const e = D.events[ei];
  const ws = cbWorks().map(w => [w, Math.abs(w.year - year)]).sort((a, b) => a[1] - b[1]).slice(0, 10).map(x => x[0]).sort((a, b) => a.year - b.year);
  const art = arts[0], also = arts.slice(1).map(p => p.short).join('、');
  return sec('同一时刻')
    + `<div class="block card rows">${art ? `<button class="lrow gc" style="${gc(groupOf(art))}" data-act="hall" data-v="${art.id}"><span class="cb-k art">艺术</span><div class="main"><b>${esc(art.name)}</b><small>${esc(art.span)}${also ? ` · 同时还有${esc(also)}` : ''}</small></div>${chev}</button>` : ''}${ctx}</div>`
    + (e ? sec('历史大事', `<small>${ei + 1} / ${D.events.length}</small>`) + `<div class="block card cb-event"><button class="cb-ev-body" data-act="event" data-v="${ei}"><span class="mt">${esc(e.yearText || yr(e.year))}</span><b>${esc(e.name)}</b><p>${esc(e.what)}</p></button>
        <div class="cb-ev-nav"><button class="btn-soft" data-act="cbStep" data-v="-1"${ei ? '' : ' disabled'}>${icon('back')}上一件</button><button class="btn-soft" data-act="event" data-v="${ei}">对艺术的影响</button><button class="btn-soft" data-act="cbStep" data-v="1"${ei < D.events.length - 1 ? '' : ' disabled'}>下一件${icon('chev')}</button></div></div>` : '')
    + (ws.length ? sec('那些年的作品') + `<div class="rail">${ws.map(w => wcard(w.id, 'chrono')).join('')}</div>` : '');
}
function mountChrono(el) {
  const r = el.route, real = !!r.real, sc = el.querySelector('.tb-scroll'), inn = el.querySelector('.tb-in'), now = el.querySelector('.cb-now');
  if (sharedYear != null) r.year = sharedYear;
  const its = [...inn.querySelectorAll('.cb-it, .cb-p')], evs = [...inn.querySelectorAll('.cb-ev')];
  let lastKey = '', pin = r.year;
  const settled = settleBand(sc, inn, () => CX(r.year, real), () => read());
  const read = () => {
    if (!settled()) return;
    const x = sc.scrollLeft;
    // 跳到某件大事或作品时，读数用它的准确年份，而不是像素换算出的近似值
    if (pin != null && Math.abs(CX(pin, real) - x) > 2) pin = null;
    const year = pin ?? CYear(x, real);
    r.year = sharedYear = year;
    its.forEach(b => b.classList.toggle('on', +b.dataset.s <= year && year < +b.dataset.e));
    let ei = 0, bd = 1e9;
    D.events.forEach((e, i) => { const d = Math.abs(CX(e.year, real) - x); if (d < bd) { bd = d; ei = i; } });
    evs.forEach(b => b.classList.toggle('on', +b.dataset.i === ei));
    el.querySelector('.tb-year').textContent = yr(year);
    el.querySelector('.tb-era').textContent = eraAt(year)?.short || '';
    r.ei = ei;
    const key = `${eraAt(year)?.id}|${D.bands.map(b => b.items.findIndex(it => it.start <= year && year < it.end)).join()}|${ei}|${Math.round(x / 40)}`;
    if (key !== lastKey) { lastKey = key; now.innerHTML = cbNowHtml(year, ei); }
  };
  sc.addEventListener('scroll', read, { passive: true });
  // 滑到某个位置；滑完再做后续（打开大事或时期的弹层）
  el.cbTo = (x, then, year = null) => {
    const target = Math.max(0, Math.min(CB.W, x));
    pin = year;
    if (Math.abs(sc.scrollLeft - target) < 2 || reduced) { sc.scrollLeft = target; read(); then?.(); return; }
    sc.scrollTo({ left: target, behavior: 'smooth' });
    if (then) setTimeout(then, 480);
  };
  // 从人物时光切回来时，跟上那边的年份
  el.syncYear = () => { if (sharedYear != null && sharedYear !== r.year) { pin = sharedYear; sc.scrollLeft = CX(sharedYear, real); read(); } };
}
// 时光带首次定位：容器量出宽度、滚动位置落到目标之后才开始读年份，
// 否则还没排版时读到的 0 会把年份改成最早一年（并带到另一条时光带）。
function settleBand(sc, inn, target, done) {
  let ok = false, tries = 0;
  const place = () => {
    if (!sc.isConnected) return;
    const w = sc.clientWidth;
    if (w) inn.style.setProperty('--h', w / 2 + 'px');
    sc.scrollLeft = target();
    ok = w > 0 && Math.abs(sc.scrollLeft - target()) < 2;
    if (!ok && tries++ < 20) return setTimeout(place, 50);
    ok = true;
    // 留到本轮代码执行完再读：调用方的 read 可能还没定义
    Promise.resolve().then(done);
  };
  place();
  return () => ok && sc.isConnected;
}

// ───── 人物 · 时光 ─────
// 桌面版的横向生命线保留横向，但只当作一条可拖的“时光带”：拖动它，中间的读数针读出年份，
// 下方卡片列出那一年在世的人；左右滑卡片，时光带上对应的生命线和关系人亮起。
const TB = { W: 2600, LH: 21, segs: [[-500, 1250, 0, .06], [1250, 1990, .06, 1]] };
const TX = y => { for (const [a, b, p, q] of TB.segs) if (y <= b) return (p + (Math.max(y, a) - a) / (b - a) * (q - p)) * TB.W; return TB.W; };
const TYear = x => { const f = Math.max(0, Math.min(1, x / TB.W)); for (const [a, b, p, q] of TB.segs) if (f <= q) return Math.round(a + (Math.max(f, p) - p) / (q - p) * (b - a)); return 1990; };
let tbLanes;
function tbPack() {
  if (tbLanes) return tbLanes;
  const lane = new Map(), ends = [];
  [...D.people].sort((a, b) => a.born - b.born).forEach(p => {
    // 名字要放得下：短命或古代的人，名字会伸出生命线，所以按“头像 + 名字”的宽度占位
    const x0 = TX(p.born), x1 = Math.max(TX(p.died), x0 + 26 + shortName(p.name).length * 11.5) + 8;
    let k = ends.findIndex(e => e <= x0);
    if (k < 0) { k = ends.length; ends.push(0); }
    ends[k] = x1;
    lane.set(p.id, k);
  });
  return tbLanes = { lane, n: ends.length };
}
// 同一年可能落在几个相邻时期里，取开始得最晚的那个
const eraAt = y => D.periods.filter(p => p.start <= y && y <= p.end).sort((a, b) => b.start - a.start)[0];
function timeHtml(r) {
  const { lane, n } = tbPack(), H = n * TB.LH;
  const face = p => portrait(p.id) ? `<img src="${portrait(p.id)}" alt="">` : `<i>${esc(p.name[0])}</i>`;
  const ticks = [-500, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
  return `<div class="card tband">
      <div class="now"><b class="tb-year">${r.year}</b><span class="tb-era"></span></div>
      <div class="tb-scroll" aria-label="时光带，左右拖动选择年份"><div class="tb-in" style="width:calc(${TB.W}px + 100%);height:${H + 44}px">
        ${D.people.map(p => `<button class="tb-bar gc" data-act="tbPick" data-v="${p.id}" style="${gcPerson(p)};left:calc(var(--h) + ${TX(p.born).toFixed(1)}px);top:${lane.get(p.id) * TB.LH + 2}px;width:${Math.max(6, TX(p.died) - TX(p.born)).toFixed(1)}px" aria-label="${esc(p.name)}，${esc(lifespan(p))}"><span class="tb-lab">${face(p)}<b>${esc(shortName(p.name))}</b></span></button>`).join('')}
        ${D.encounters.map((e, i) => `<button class="tb-enc" data-act="encounter" data-v="${i}" style="left:calc(var(--h) + ${TX(e.year).toFixed(1)}px);top:${H + 8}px" aria-label="${esc(e.title)}"></button>`).join('')}
        ${ticks.map(y => `<span class="tb-tick" style="left:calc(var(--h) + ${TX(y).toFixed(1)}px)">${yr(y)}</span>`).join('')}
        ${Array.from({ length: 14 }, (_, i) => 1250 + i * 50).filter(y => y % 100).map(y => `<span class="tb-tick minor" style="left:calc(var(--h) + ${TX(y).toFixed(1)}px)">${y}</span>`).join('')}
      </div></div>
      <div class="tb-handle"></div>
      <p class="tb-hint">左右拖动时光带 · 点名字跳到那个人 · ◆ 是相遇</p>
    </div>
    <div class="enc-slot"></div>
    <div class="sec"><h2>此时在世</h2><small class="tb-count"></small></div>
    <div class="pc-rail"></div>`;
}
function pcard(p, year) {
  const rels = relationsOf(p.id), age = year - p.born, pct = Math.max(0, Math.min(100, (year - p.born) / Math.max(1, p.died - p.born) * 100));
  return `<button class="card pcard gc" style="${gcPerson(p)}" data-act="person" data-v="${p.id}"><div class="ph">${portrait(p.id) ? `<img src="${portrait(p.id)}" alt="" loading="lazy">` : `<span class="ini">${esc(p.name[0])}</span>`}</div><span class="age glass">此时${p.approx ? '约 ' : ' '}${age} 岁</span>
    <div class="tx"><b>${esc(p.name)}</b><small>${esc((p.roles || []).slice(0, 2).join('、'))} · ${esc(lifespan(p))}</small><div class="lifebar"><u style="width:${pct.toFixed(0)}%"></u><i style="left:${pct.toFixed(0)}%"></i></div>
    <div class="faces">${rels.slice(0, 4).map(x => avatar(person(x.id))).join('')}<span>${rels.length ? `${rels.length} 位相关的人` : '暂无关系记录'}</span></div></div></button>`;
}
function mountTime(el) {
  const r = el.route, sc = el.querySelector('.tb-scroll'), inn = el.querySelector('.tb-in'), rail = el.querySelector('.pc-rail');
  if (sharedYear != null && sharedYear >= -500 && sharedYear <= 1990) r.year = sharedYear;
  const bars = [...inn.querySelectorAll('.tb-bar')];
  let lastKey = '', timer = 0, railTimer = 0;
  const renderCards = (alive, year) => {
    if (!alive.some(p => p.id === r.focus)) r.focus = (alive.find(p => relationsOf(p.id).length >= 4) || alive[0])?.id || '';
    rail.innerHTML = alive.length ? alive.map(p => pcard(p, year)).join('') : `<div class="card empty-state" style="width:100%;margin:0 16px"><p>这一年没有收录在世的人物，<br>继续拖动时光带看看。</p></div>`;
    const cur = rail.querySelector(`[data-v="${CSS.escape(r.focus)}"]`);
    if (cur) rail.scrollLeft = cur.offsetLeft - (rail.clientWidth - cur.offsetWidth) / 2;
    if (!reduced) rail.querySelectorAll('.pcard').forEach((c, i) => c.animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration: 520, delay: Math.min(i, 6) * 40, easing: SPRING, fill: 'backwards' }));
    shapeRail();
  };
  const paintBand = () => {
    const near = new Set(r.focus ? relationsOf(r.focus).map(x => x.id) : []);
    bars.forEach(b => { b.classList.toggle('focus', b.dataset.v === r.focus); b.classList.toggle('rel', near.has(b.dataset.v)); });
  };
  const read = () => {
    if (!settled()) return;
    const year = TYear(sc.scrollLeft);
    r.year = sharedYear = year;
    const alive = D.people.filter(p => p.born <= year && year <= p.died).sort((a, b) => a.born - b.born);
    bars.forEach(b => { const p = person(b.dataset.v); b.classList.toggle('alive', p.born <= year && year <= p.died); });
    el.querySelector('.tb-year').textContent = yr(year);
    el.querySelector('.tb-era').textContent = `${eraAt(year)?.short || ''} · 在世 ${alive.length} 人`;
    el.querySelector('.tb-count').textContent = alive.length ? `${alive.length} 人 · 左右滑动` : '';
    const enc = D.encounters.filter(e => Math.abs(e.year - year) <= 8).sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0];
    const slot = el.querySelector('.enc-slot'), key0 = enc ? D.encounters.indexOf(enc) : -1;
    if (slot.dataset.k !== String(key0)) {
      slot.dataset.k = key0;
      slot.innerHTML = enc ? `<button class="card enc-chip press" data-act="encounter" data-v="${key0}"><span class="dia">${icon('spark')}</span><div><b>${esc(enc.title)}</b><small>${esc(enc.yearText || yr(enc.year))} · ${esc(enc.place)} · ${enc.people.map(id => person(id)?.name).filter(Boolean).join('、')}</small></div>${icon('chev')}</button>` : '';
      if (enc && !reduced) slot.firstElementChild.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING });
    }
    const key = alive.map(p => p.id).join();
    if (key !== lastKey) { lastKey = key; clearTimeout(timer); timer = setTimeout(() => { renderCards(alive, year); paintBand(); }, lastKey ? 90 : 0); }
    else rail.querySelectorAll('.pcard').forEach(c => { const p = person(c.dataset.v), pct = Math.max(0, Math.min(100, (year - p.born) / Math.max(1, p.died - p.born) * 100)); c.querySelector('.age').textContent = `此时${p.approx ? '约 ' : ' '}${year - p.born} 岁`; c.querySelector('.lifebar u').style.width = pct + '%'; c.querySelector('.lifebar i').style.left = pct + '%'; });
  };
  // 卡片离中心越远越小越淡；停下时把居中的人设为焦点
  const shapeRail = () => {
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    let best = null, bd = 1e9;
    rail.querySelectorAll('.pcard').forEach(c => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) / c.offsetWidth;
      c.style.transform = `scale(${1 - Math.min(d, 1) * .08})`;
      c.style.opacity = String(1 - Math.min(d, 1) * .35);
      if (d < bd) { bd = d; best = c; }
    });
    if (best && best.dataset.v !== r.focus) { r.focus = best.dataset.v; paintBand(); }
  };
  sc.addEventListener('scroll', read, { passive: true });
  rail.addEventListener('scroll', () => { cancelAnimationFrame(railTimer); railTimer = requestAnimationFrame(shapeRail); }, { passive: true });
  el.tbJump = id => {
    const p = person(id);
    r.focus = id;
    const target = TX(Math.round(p.born + (p.died - p.born) * .45));
    if (Math.abs(sc.scrollLeft - target) < 2) { const c = rail.querySelector(`[data-v="${CSS.escape(id)}"]`); c && rail.scrollTo({ left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }); paintBand(); return; }
    sc.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
  };
  el.syncYear = () => { if (sharedYear != null && sharedYear >= -500 && sharedYear <= 1990 && sharedYear !== r.year) sc.scrollLeft = TX(sharedYear); };
  const settled = settleBand(sc, inn, () => TX(r.year), () => read());
  renderCards(D.people.filter(p => p.born <= r.year && r.year <= p.died).sort((a, b) => a.born - b.born), r.year);
  lastKey = D.people.filter(p => p.born <= r.year && r.year <= p.died).sort((a, b) => a.born - b.born).map(p => p.id).join();
  paintBand();
  el.cleanup = () => clearTimeout(timer);
}

// ───── 人物 · 关系链 ─────
// 一次只看一个人和其直接关系；点周围的人，它会移到中心，新的关系从中心长出来。上方的足迹可以原路返回。
function egoHtml(id) {
  const c = person(id), rels = relationsOf(id), shown = rels.slice(0, 8), n = shown.length, CY = 46;
  const nodes = shown.map((x, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(n, 1); return { ...x, x: 50 + 35 * Math.cos(a), y: CY + 32 * Math.sin(a) }; });
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${nodes.map(d => { const mx = (50 + d.x) / 2 + (d.y - CY) * .12, my = (CY + d.y) / 2 - (d.x - 50) * .12; return `<path d="M50 ${CY}Q${mx.toFixed(2)} ${my.toFixed(2)} ${d.x.toFixed(2)} ${d.y.toFixed(2)}" pathLength="1" style="stroke:${KIND[d.kind][1]}" vector-effect="non-scaling-stroke"/>`; }).join('')}</svg>
    ${nodes.map(d => `<button class="en" data-act="chainGo" data-v="${d.id}" style="left:${d.x.toFixed(2)}%;top:${d.y.toFixed(2)}%;--k:${KIND[d.kind][1]}">${avatar(person(d.id))}<span>${esc(shortName(person(d.id).name))}</span><em>${esc(d.label)}</em></button>`).join('')}
    <button class="en center" data-act="person" data-v="${c.id}" style="left:50%;top:${CY}%" aria-label="打开${esc(c.name)}">${avatar(c)}<span>${esc(c.name)}</span></button>
    ${rels.length > n ? `<span class="more-n">另有 ${rels.length - n} 位见下方</span>` : ''}`;
}
function chainHtml(r) {
  r.cf ||= hubs()[0].id;
  if (!r.trail.length) r.trail = [r.cf];
  const rels = relationsOf(r.cf), groups = Object.keys(KIND).map(k => [k, rels.filter(x => x.kind === k)]).filter(([, xs]) => xs.length);
  // 只有一个人时没有“足迹”可言，等走出第二步再显示
  return `<div class="trail" aria-label="足迹"${r.trail.length < 2 ? ' hidden' : ''}>${r.trail.map((id, i) => `${i ? icon('chev') : ''}<button data-act="chainGo" data-v="${id}" aria-current="${id === r.cf}">${esc(person(id).name)}</button>`).join('')}</div>
    <div class="card ego">${egoHtml(r.cf)}</div>
    <div class="legend">${groups.map(([k]) => `<span style="--k:${KIND[k][1]}"><i></i>${KIND[k][0]}</span>`).join('')}</div>
    ${groups.map(([k, xs]) => `<div class="block card kgroup" style="--k:${KIND[k][1]};margin-top:12px"><div class="kh"><i></i>${KIND[k][0]} · ${xs.length}</div>${xs.map(x => personRow(person(x.id), x.note || x.label, 'chainGo')).join('')}</div>`).join('')}
    ${!rels.length ? `<div class="block card empty-state"><p>暂无记录的关系。</p></div>` : ''}
    ${sec('从这些人出发')}<div class="rail">${hubs().map(o => `<button class="card pg-card gc press" style="${gcPerson(o)};width:96px" data-act="chainGo" data-v="${o.id}">${avatar(o)}<b>${esc(o.name)}</b><small>${relationsOf(o.id).length} 位</small></button>`).join('')}</div>`;
}
function mountChain(el, from) {
  if (reduced) return;
  const ego = el.querySelector('.ego'), center = ego.querySelector('.en.center .avatar');
  if (from) {
    const to = rel(center);
    center.animate([{ transform: `translate(${from.x - to.x}px,${from.y - to.y}px) scale(${from.w / to.w})` }, { transform: 'none' }], { duration: 640, easing: SPRING });
  }
  const c = rel(center);
  ego.querySelectorAll('.en:not(.center)').forEach((n, i) => {
    const b = rel(n);
    n.animate([{ opacity: 0, translate: `${c.x + c.w / 2 - b.x - b.w / 2}px ${c.y + c.h / 2 - b.y - b.h / 2}px`, scale: .3 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 620, delay: 120 + i * 35, easing: SPRING, fill: 'backwards' });
  });
  ego.querySelectorAll('path').forEach((p, i) => p.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }], { duration: 560, delay: 160 + i * 35, easing: EASE, fill: 'backwards' }));
}

// ───── 人物 · 名录 ─────
function rosterHtml() {
  const groupId = o => period(o.period)?.group;
  const lists = D.groups.map(g => [g.name, D.people.filter(o => groupId(o) === g.id)]).concat([['其他', D.people.filter(o => !D.groups.some(g => g.id === groupId(o)))]]);
  return sec('派系') + `<div class="block card rows"><button class="lrow" data-act="ctx" data-v="schools"><div class="main"><b>派系与关系</b><small>${state.t.schools.length} 个画派、运动与传统</small></div>${chev}</button><button class="lrow" data-act="ctx" data-v="people-life"><div class="main"><b>派系生命线</b><small>同一派系的人按真实年份排开</small></div>${chev}</button></div>`
    + sec(`${D.encounters.length} 次相遇`, `<small>按年份</small>`) + `<div class="rail">${[...D.encounters].sort((a, b) => a.year - b.year).map(e => `<button class="card mcard-e press" data-act="encounter" data-v="${D.encounters.indexOf(e)}"><span class="k">${esc(e.yearText || yr(e.year))} · ${esc(e.place)}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="faces">${e.people.map(person).filter(Boolean).map(avatar).join('')}</div></button>`).join('')}</div>`
    + lists.filter(([, ps]) => ps.length).map(([name, ps]) => `<div class="gl">${esc(name)} · ${ps.length}</div><div class="pgrid">${[...ps].sort((a, b) => a.born - b.born).map(o => `<button class="card pg-card gc press" style="${gcPerson(o)}" data-act="person" data-v="${o.id}">${avatar(o)}<b>${esc(o.name)}</b><small>${esc(yr(o.born, o.approx))}–${esc(o.diedText || yr(o.died))}</small></button>`).join('')}</div>`).join('');
}

// ───── 搜索 ─────
function searchBody() {
  const q = S.query.trim().toLocaleLowerCase();
  if (!q) {
    const sugg = S.recent.length ? S.recent : ['达·芬奇', '星空', '印象', '伦勃朗', '雕塑'];
    return sec(S.recent.length ? '最近搜索' : '试试') + `<div class="recent">${sugg.map(x => `<button class="card press" data-act="q" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
      + (S.viewed.length ? sec('最近看过') + `<div class="rail">${S.viewed.map(id => wcard(id, 'viewed')).join('')}</div>` : '')
      + sec('按时期浏览') + `<div class="browse">${D.periods.map(p => `<button class="pastel gc press" style="${gc(groupOf(p))}" data-act="hall" data-v="${p.id}"><span>${esc(p.short)}</span><img src="${thumb(firstImg(p.id))}" alt="" loading="lazy"></button>`).join('')}</div>`;
  }
  const has = (...xs) => xs.some(x => String(x || '').toLocaleLowerCase().includes(q));
  const found = searchCatalog(state.t, S.query);
  const ppl = found.filter(x => x.kind === 'person').map(x => person(x.id)).filter(Boolean);
  const ps = D.periods.filter(p => has(p.name, p.short, p.en, ...(p.keywords || [])));
  const ws = found.filter(x => x.kind === 'work').map(x => work(x.id)).filter(Boolean);
  S.results = ws.map(w => w.id);
  if (!ppl.length && !ps.length && !ws.length) return `<div class="block card empty-state" style="margin-top:12px"><span class="orb">${icon('search')}</span><h2>没有“${esc(S.query)}”的结果</h2><p>换个更短的名称，或试试艺术家的英文名。</p></div>`;
  return (ppl.length ? sec('人物') + `<div class="block card rows">${ppl.slice(0, 8).map(o => personRow(o, o.en)).join('')}</div>` : '')
    + (ps.length ? sec('时期') + `<div class="block card rows">${ps.map(p => `<button class="lrow gc" style="${gc(groupOf(p))}" data-act="hall" data-v="${p.id}"><span class="dot" style="background:var(--c)"></span><div class="main"><b>${esc(p.name)}</b><small>${esc(p.span)}</small></div>${chev}</button>`).join('')}</div>` : '')
    + (ws.length ? sec('作品', `<small>${ws.length} 件</small>`) + `<div class="block card rows">${ws.slice(0, 40).map(w => `<button class="lrow" style="--sep-left:74px" data-act="work" data-v="${w.id}" data-list="search" data-zoom="${w.id}" data-ctx="${w.id}">${hasImg(w) ? `<img class="thumb" src="${thumb(w.id)}" alt="" loading="lazy">` : `<span class="thumb noimg">${esc(w.title[0])}</span>`}<div class="main"><b>${esc(w.title)}</b><small>${esc(w.artist)} · ${esc(w.yearText)}</small></div>${chev}</button>`).join('')}</div>${ws.length > 40 ? `<p class="foot">还有 ${ws.length - 40} 件，输入更具体的名称可以缩小范围。</p>` : ''}` : '');
}
function onQuery() {
  S.query = qInput.value;
  qInput.parentElement.classList.toggle('has-text', !!S.query);
  if (S.tab !== 'search') return;
  const st = stackEl('search');
  while (st.children.length > 1) { st.lastElementChild.cleanup?.(); st.lastElementChild.remove(); }
  const root = st.firstElementChild;
  Object.assign(root.style, { visibility: '', transform: '' });
  root.querySelector('.results').innerHTML = searchBody();
  root.querySelector('.scroll').scrollTop = 0;
  chrome();
}
function remember(q) {
  q = q.trim();
  if (q) S.recent = [q, ...S.recent.filter(x => x !== q)].slice(0, 6);
}

// ───── 导航 ─────
function push(route, opt = {}) {
  if (busy) return;
  const prev = topPage(), el = makePage(route);
  route.anim = opt.anim || (opt.from ? 'zoom' : 'slide');
  stackEl(S.tab).append(el);
  draw(el, false, route.anim !== 'zoom');
  if (route.kind === 'work') S.viewed = [route.id, ...S.viewed.filter(x => x !== route.id)].slice(0, 12);
  chrome();
  pushHistory();
  busy = true;
  const done = () => { busy = false; prev.style.visibility = 'hidden'; };
  if (route.anim === 'zoom') zoomIn(el, opt.from).then(done);
  else if (route.anim === 'cover') anim(el, [{ transform: 'translateY(100%)' }, { transform: 'none' }], 560).then(done);
  else {
    const w = app.clientWidth;
    anim(prev, [{ transform: 'none' }, { transform: `translateX(${-w * .3}px)` }], 500);
    anim(prev.querySelector(':scope > .shade'), [{ opacity: 0 }, { opacity: .1 }], 500);
    anim(el, [{ transform: `translateX(${w}px)` }, { transform: 'none' }], 500).then(done);
  }
}
function reveal(prev) {
  prev.style.visibility = '';
  if (prev.stale) draw(prev);
}
function pop() {
  const ps = pages();
  if (ps.length < 2 || busy) return;
  const el = ps.at(-1), prev = ps.at(-2);
  busy = true;
  reveal(prev);
  let p = null;
  if (el.route.anim === 'cover') p = anim(el, [{ transform: 'none' }, { transform: 'translateY(100%)' }], 460);
  else if (el.route.anim === 'zoom') p = zoomOut(el, prev);
  p ??= slideOut(el, prev, 0);
  p.then(() => finishPop(el, prev));
}
function slideOut(el, prev, x) {
  const w = app.clientWidth, dur = 380 * (1 - x / w) + 140;
  if (el.route.anim === 'slide') {
    anim(prev, [{ transform: `translateX(${-w * .3 + x * .3}px)` }, { transform: 'none' }], dur);
    anim(prev.querySelector(':scope > .shade'), [{ opacity: .1 * (1 - x / w) }, { opacity: 0 }], dur);
  }
  return anim(el, [{ transform: `translateX(${x}px)` }, { transform: `translateX(${w}px)` }], dur);
}
function finishPop(el, prev) {
  el.cleanup?.();
  el.remove();
  prev.style.transform = '';
  const sh = prev.querySelector(':scope > .shade');
  if (sh) sh.style.opacity = '';
  busy = false;
  chrome();
}
function popToRoot() {
  const ps = pages();
  if (ps.length < 2) return;
  ps.slice(1, -1).forEach(p => { p.cleanup?.(); p.remove(); });
  pop();
}
function switchTab(t) {
  if (busy) return;
  if (t === S.tab) {
    if (pages().length > 1) popToRoot();
    else topPage().querySelector('.scroll')?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    return;
  }
  if (t === 'search') S.prevTab = S.tab;
  if (S.tab === 'search') qInput.blur();
  stackEl(S.tab).hidden = true;
  S.tab = t;
  const st = stackEl(t);
  st.hidden = false;
  if (!st.children.length) { const el = makePage(rootRoute(t)); st.append(el); draw(el, false, true); }
  else if (topPage().stale) draw(topPage());
  else { mountSeg(topPage()); topPage().syncYear?.(); }
  chrome();
  if (t === 'search') qInput.focus({ preventScroll: true });
}

// 缩放转场：缩略图放大成作品页主图
function heroImg(el) { return el.querySelector('.whero .slide.cur img'); }
function flyBox(r, url, radius) {
  const f = document.createElement('div');
  f.className = 'fly';
  Object.assign(f.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: radius + 'px' });
  f.innerHTML = `<img src="${url}" alt="">`;
  app.append(f);
  return f;
}
const flyTo = (f, a, b, r0, r1, dur = 560) => anim(f, [
  { left: a.x + 'px', top: a.y + 'px', width: a.w + 'px', height: a.h + 'px', borderRadius: r0 + 'px' },
  { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px', borderRadius: r1 + 'px' }], dur);
async function zoomIn(el, from) {
  const src = from.querySelector('img') || from, target = heroImg(el);
  if (!target || reduced) return;
  const a = rel(src), b = rel(target), f = flyBox(a, src.currentSrc || src.src, 14);
  target.style.visibility = 'hidden';
  src.style.opacity = '0';
  el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  el.querySelector('.sheetcard')?.animate([{ transform: 'translateY(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 640, delay: 80, easing: SPRING, fill: 'backwards' });
  await flyTo(f, a, b, 14, 6);
  target.style.visibility = '';
  src.style.opacity = '';
  f.remove();
}
function zoomOut(el, prev) {
  const id = el.route.id, img = heroImg(el);
  const tgt = [...prev.querySelectorAll(`[data-zoom="${CSS.escape(id)}"]`)].map(n => n.querySelector('img') || n).find(n => { const r = rel(n); return r.w > 0 && r.y + r.h > 0 && r.y < app.clientHeight; });
  if (!tgt || !img || reduced) return null;
  const a = rel(img);
  if (a.y + a.h < 0) return null;
  const f = flyBox(a, img.currentSrc || img.src, 6);
  img.style.visibility = 'hidden';
  tgt.style.opacity = '0';
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' });
  return flyTo(f, a, rel(tgt), 6, 14, 480).then(() => { tgt.style.opacity = ''; f.remove(); });
}

// ───── 画海 ─────
function seaList(r) {
  let list;
  if (r.period) list = worksOf(r.period).filter(hasImg);
  // 全部有图作品（含人物补充作品），按时期、年份排列
  else list = D.periods.flatMap(p => worksOf(p.id).filter(hasImg));
  if (!list.some(w => w.id === r.sel)) {
    if (!r.period && hasImg(work(r.sel))) list.unshift(work(r.sel));
    else r.sel = list[0]?.id;
  }
  return list;
}
function seaCard(r) {
  const w = work(r.sel);
  return `<button class="t" data-act="seaOpen"><img src="${thumb(w.id)}" alt=""><div style="min-width:0"><b>${esc(w.title)}</b><small>${esc(w.artist)} · ${esc(w.yearText)}</small></div></button><button class="circle" data-act="save" data-v="${w.id}" aria-label="${isSaved(w.id) ? '取消收藏' : '收藏'}">${saveIcon(w.id)}</button><button class="circle" data-act="seaOpen" aria-label="打开作品">${icon('chev')}</button>`;
}
// 画海像 PC 版的孔明灯：作品散在远、中、近三层，越近越大、越亮、移动越多（视差）；每件有一点固定倾斜，
// 以底部为轴轻轻摇晃；拖动时整片画随速度微微侧倾。背景的色块取自当前选中作品的颜色，换作品时慢慢换色。
const SEA_DEPTH = [1, .74, .52];
const seaNoise = (i, salt) => { const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return n - Math.floor(n); };
const paletteCache = new Map();
function paletteOf(id, done) {
  if (paletteCache.has(id)) return done(paletteCache.get(id));
  const im = new Image();
  im.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 12;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 12, 12);
      const d = x.getImageData(0, 0, 12, 12).data;
      // 上、中、下三条各取一个偏饱和的平均色
      const pal = [0, 4, 8].map(r0 => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = r0; y < r0 + 4; y++) for (let k = 0; k < 12; k++) { const o = (y * 12 + k) * 4, w = 1 + Math.max(d[o], d[o + 1], d[o + 2]) - Math.min(d[o], d[o + 1], d[o + 2]); r += d[o] * w; g += d[o + 1] * w; b += d[o + 2] * w; n += w; }
        const [h, sat] = rgbToHsl(r / n, g / n, b / n);
        return [Math.round(h), Math.min(.78, sat * 1.6 + .15)];
      });
      paletteCache.set(id, pal); done(pal);
    } catch {}
  };
  im.src = thumb(id);
}
function mountSea(el) {
  const r = el.route, view = el.querySelector('.sea-view'), world = el.querySelector('.sea-world');
  const list = seaList(r);
  r.list = list.map(w => w.id);
  // 与 PC 版同一套布局：按年代沿折返的行排开，横纵首尾相接，可以一直拖下去
  const loop = skyLoop(list.length), LW = Math.max(loop.width * .62, 1600), LH = Math.max(loop.height * .62, 2400);
  const pos = {};
  const layers = SEA_DEPTH.map((f, k) => `<div class="sea-layer d${k}" data-f="${f}"></div>`);
  world.innerHTML = layers.join('');
  const layerEls = [...world.children];
  const html = [[], [], []];
  arrangeWorks(list).forEach((s, i) => {
    const w = s.work, x = s.x * LW / loop.width, y = s.y * LH / loop.height;
    const k = s.depth < 600 ? 0 : s.depth < 950 ? 1 : 2, f = SEA_DEPTH[k];
    const size = (84 + seaNoise(i, 4) * 46) * (k ? f + .12 : 1), rr = Math.min(1.5, Math.max(.6, ratio(w.id)));
    const ww = size / Math.sqrt(rr), hh = ww * rr, tilt = s.angle.toFixed(1);
    pos[w.id] = { x, y, wx: x, wy: y, w: ww, h: hh, k, f };
    html[k].push(`<button class="sea-art${w.id === r.sel ? ' on' : ''}" data-act="seaPick" data-v="${w.id}" data-list="sea" data-zoom="${w.id}" data-ctx="${w.id}" aria-label="${esc(w.title)}" style="--x:${(x * f).toFixed(0)};--y:${(y * f).toFixed(0)};--a:${tilt}deg;--dr:${i % 2 ? 7 : -7}px;left:${(x * f).toFixed(1)}px;top:${(y * f).toFixed(1)}px;width:${ww.toFixed(0)}px;height:${hh.toFixed(0)}px;animation-duration:${(13 + (i % 7) * 2)}s;animation-delay:-${(i * 2.7) % 19}s"><img src="${thumb(w.id)}" alt="" loading="${i < 16 ? 'eager' : 'lazy'}" decoding="async"></button>`);
  });
  layerEls.forEach((l, k) => { l.innerHTML = html[k].join(''); });
  // 每件作品只画一份，放在离镜头最近的那一圈；换圈发生在屏幕外。离屏的先不渲染（也不加载图片），每隔几帧重新挑一次
  const artEls = [...world.querySelectorAll('.sea-art')].map(a => ({ a, p: pos[a.dataset.v] }));
  const cull = (ax, ay) => {
    const W = view.clientWidth, H = view.clientHeight;
    if (!W) return;
    for (const { a, p } of artEls) {
      const wx = p.x + Math.round((-ax - p.x) / LW) * LW, wy = p.y + Math.round((-ay - p.y) / LH) * LH;
      if (wx !== p.wx || wy !== p.wy) {
        p.wx = wx; p.wy = wy;
        Object.assign(a.style, { left: (wx * p.f).toFixed(1) + 'px', top: (wy * p.f).toFixed(1) + 'px' });
        a.style.setProperty('--x', (wx * p.f).toFixed(0));
        a.style.setProperty('--y', (wy * p.f).toFixed(0));
        if (a.dataset.v === r.sel) light(r.sel);
      }
      const dx = p.f * (wx + ax), dy = p.f * (wy + ay) + H * .46 - H / 2;
      const off = Math.abs(dx) > W / 2 + p.w + 160 || Math.abs(dy) > H / 2 + p.h + 200;
      if (a.hidden !== off) a.hidden = off;
    }
  };
  // 夜空：两层星点做成可平铺的背景，按图块大小取余平移，拖多远都接得上
  let seed = 7319;
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const TILE = 400;
  const skies = [.12, .3].map(d => {
    const sky = document.createElement('div');
    sky.className = 'sea-sky'; sky.dataset.d = d;
    sky.style.backgroundImage = Array.from({ length: 24 }, () => { const s = (.6 + rnd() * (d > .2 ? .5 : .3)).toFixed(2); return `radial-gradient(${s}px ${s}px at ${(rnd() * TILE).toFixed(0)}px ${(rnd() * TILE).toFixed(0)}px, rgba(213, 223, 230, ${(.35 + rnd() * .45).toFixed(2)}), transparent)`; }).join(',');
    view.insertBefore(sky, world);
    return sky;
  });
  // 浅色的展厅墙不随拖动移动；色块在固定范围内缓慢跟随，不会被拖出画面
  const wall = document.createElement('div');
  wall.className = 'sea-wall';
  view.insertBefore(wall, world);
  // 色块：三块柔边的颜色，取自选中作品，比最远的画还远；浅色时像水彩一样“染”在墙上（multiply）
  const blobs = document.createElement('div');
  blobs.className = 'sea-blobs';
  blobs.innerHTML = '<i></i><i></i><i></i>';
  view.insertBefore(blobs, world);
  const recolor = id => paletteOf(id, pal => pal.forEach(([h, sat], i) => {
    const b = blobs.children[i];
    b.style.setProperty('--h', h); b.style.setProperty('--sat', Math.round(sat * 100) + '%');
  }));
  recolor(r.sel);
  // 射灯在选中作品所在的那一层里
  const spot = document.createElement('i');
  spot.className = 'sea-spot';
  const light = id => {
    const p = pos[id]; if (!p) return;
    const layer = layerEls[p.k];
    if (spot.parentElement !== layer) layer.prepend(spot);
    Object.assign(spot.style, { left: p.wx * p.f + 'px', top: p.wy * p.f + 'px', width: p.w * 2.4 + 60 + 'px', height: p.h * 2 + 60 + 'px' });
  };
  el.querySelector('.sea-card').innerHTML = seaCard(r);
  // 第一次进入（或换了时期）时，让选中的作品停在画面中央
  if (r.ax == null || r.ay == null) { r.ax = -pos[r.sel].x; r.ay = -pos[r.sel].y; }
  let raf = 0, drag = null, vx = 0, vy = 0, tween = null, lx = 0, ly = 0, llx = 0, lly = 0, frame = 0;
  cull(r.ax, r.ay);
  light(r.sel);
  // 镜头走到某件作品时，去离当前位置最近的那一圈
  const nearest = (p, a, span, key) => -(p[key] + Math.round((-a - p[key]) / span) * span);
  const tick = now => {
    raf = requestAnimationFrame(tick);
    if (el.style.visibility === 'hidden' || el.parentElement?.hidden) return;
    if (tween) {
      const k = Math.min(1, (now - tween.t) / tween.d), e = 1 - Math.pow(1 - k, 3);
      r.ax = tween.fx + (tween.tx - tween.fx) * e;
      r.ay = tween.fy + (tween.ty - tween.fy) * e;
      if (k >= 1) tween = null;
    } else if (!drag && (Math.abs(vx) > .05 || Math.abs(vy) > .05)) {
      r.ax += vx; r.ay += vy; vx *= .93; vy *= .93;
    }
    const ox = reduced ? 0 : Math.sin(now / 5200) * 16, oy = reduced ? 0 : Math.cos(now / 6100) * 12;
    const ax = r.ax + ox, ay = r.ay + oy;
    for (const l of layerEls) {
      const f = +l.dataset.f;
      l.style.transform = `translate(${(ax * f).toFixed(1)}px,${(ay * f).toFixed(1)}px)`;
      // 投影方向只在移动超过几像素时更新，避免每帧重算全部作品的样式
      if (Math.abs(ax * f - (l.sx ?? 1e9)) >= 4 || Math.abs(ay * f - (l.sy ?? 1e9)) >= 4) {
        l.sx = ax * f; l.sy = ay * f;
        l.style.setProperty('--ax', l.sx.toFixed(0));
        l.style.setProperty('--ay', l.sy.toFixed(0));
      }
    }
    if (++frame % 8 === 0) cull(ax, ay);
    // 侧倾跟着拖动速度，松手后慢慢回正
    const tvx = drag?.on ? drag.vx : vx, tvy = drag?.on ? drag.vy : vy;
    lx += (Math.max(-9, Math.min(9, tvx * .9)) - lx) * .12;
    ly += (Math.max(-9, Math.min(9, -tvy * .9)) - ly) * .12;
    if (!reduced && (Math.abs(lx - llx) > .05 || Math.abs(ly - lly) > .05)) { llx = lx; lly = ly; world.style.setProperty('--lx', lx.toFixed(2) + 'deg'); world.style.setProperty('--ly', ly.toFixed(2) + 'deg'); }
    const mod = v => ((v % TILE) + TILE) % TILE - TILE;
    for (const sky of skies) sky.style.transform = `translate(${mod(r.ax * sky.dataset.d).toFixed(1)}px,${mod(r.ay * sky.dataset.d).toFixed(1)}px)`;
    blobs.style.transform = `translate(${(90 * Math.sin(r.ax / 900)).toFixed(1)}px,${(90 * Math.sin(r.ay / 900)).toFixed(1)}px)`;
  };
  raf = requestAnimationFrame(tick);
  view.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    drag = { x: e.clientX, y: e.clientY, ax: r.ax, ay: r.ay, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, on: false, vx: 0, vy: 0 };
    vx = vy = 0; tween = null; el.dragged = false;
  });
  view.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on && Math.hypot(dx, dy) > 6) { drag.on = true; el.dragged = true; view.setPointerCapture(e.pointerId); cancelLP(); }
    if (!drag.on) return;
    r.ax = drag.ax + dx; r.ay = drag.ay + dy;
    const dt = Math.max(1, e.timeStamp - drag.lt);
    vx = drag.vx = (e.clientX - drag.lx) / dt * 16; vy = drag.vy = (e.clientY - drag.ly) / dt * 16;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = e.timeStamp;
  });
  const end = () => { if (drag && !drag.on) vx = vy = 0; drag = null; };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  view.addEventListener('click', e => { if (el.dragged) { e.stopPropagation(); el.dragged = false; } }, true);
  el.seaSelect = id => {
    r.sel = id;
    light(id);
    recolor(id);
    world.querySelectorAll('.sea-art').forEach(a => a.classList.toggle('on', a.dataset.v === id));
    tween = { t: performance.now(), d: 700, fx: r.ax, fy: r.ay, tx: nearest(pos[id], r.ax, LW, 'x'), ty: nearest(pos[id], r.ay, LH, 'y') };
    const card = el.querySelector('.sea-card');
    card.classList.add('swap');
    setTimeout(() => { card.innerHTML = seaCard(r); card.classList.remove('swap'); }, 160);
  };
  el.cleanup = () => cancelAnimationFrame(raf);
}

// ───── 作品页主图：左右滑动切换同组作品 ─────
function sizeTo(img, box) {
  const cs = getComputedStyle(box), rr = ratio(img.dataset.id);
  const bw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const bh = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let w = bw, h = bw * rr;
  if (h > bh) { h = bh; w = bh / rr; }
  Object.assign(img.style, { width: w + 'px', height: h + 'px' });
}
// 作品页主图：没有配图的作品写出缺图原因
const slideImg = id => hasImg(work(id)) ? `<img src="${display(id)}" data-id="${id}" alt="${esc(work(id).title)}">` : `<div class="noimg-hero"><b>${esc(work(id).title[0])}</b><p>${esc(work(id).noImageReason || '暂无配图')}</p></div>`;
function mountHero(el) {
  const r = el.route, hero = el.querySelector('.whero'), track = hero.querySelector('.track');
  const fill = () => hero.querySelectorAll('.slide').forEach(s => {
    const i = +s.dataset.i, idx = r.ids.indexOf(r.id);
    if (Math.abs(i - idx) <= 1 && !s.firstElementChild) s.innerHTML = slideImg(r.ids[i]);
    const img = s.querySelector('img');
    if (img) { sizeTo(img, s); img.style.translate = '0 var(--py, 0)'; }
  });
  fill();
  if (r.ids.length < 2) return;
  let d = null;
  hero.addEventListener('pointerdown', e => { if (e.isPrimary) d = { x: e.clientX, y: e.clientY, t: e.timeStamp, on: false }; el.dragged = false; });
  hero.addEventListener('pointermove', e => {
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { d.on = true; el.dragged = true; hero.setPointerCapture(e.pointerId); track.style.transition = 'none'; cancelLP(); }
      else if (Math.abs(dy) > 8) d = null;
      return;
    }
    const idx = r.ids.indexOf(r.id), edge = (idx === 0 && dx > 0) || (idx === r.ids.length - 1 && dx < 0);
    track.style.transform = `translateX(calc(${-idx * 100}% + ${edge ? dx / 3 : dx}px))`;
  });
  const end = e => {
    if (!d?.on) { d = null; return; }
    const dx = e.clientX - d.x, v = dx / Math.max(1, e.timeStamp - d.t), idx = r.ids.indexOf(r.id);
    let n = idx;
    if ((dx < -hero.clientWidth * .2 || v < -.45) && idx < r.ids.length - 1) n++;
    if ((dx > hero.clientWidth * .2 || v > .45) && idx > 0) n--;
    track.style.transition = '';
    track.style.transform = `translateX(${-n * 100}%)`;
    d = null;
    if (n === idx) return;
    r.id = r.ids[n];
    S.viewed = [r.id, ...S.viewed.filter(x => x !== r.id)].slice(0, 12);
    hero.querySelectorAll('.slide').forEach(s => s.classList.toggle('cur', +s.dataset.i === n));
    fill();
    const count = hero.querySelector('.count');
    if (count) count.textContent = `${n + 1} / ${r.ids.length}`;
    el.querySelector('.nav .t').textContent = work(r.id).title;
    el.querySelector('.nav [data-act="save"]').outerHTML = `<button class="circle glass" data-act="save" data-v="${r.id}" aria-label="收藏">${saveIcon(r.id)}</button>`;
    const info = el.querySelector('.work-info');
    info.innerHTML = workInfo(r);
    if (!reduced) info.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING });
    mountSeg(el);
    applyTint(el, r.id, thumb(r.id));
  };
  hero.addEventListener('pointerup', end);
  hero.addEventListener('pointercancel', () => { d = null; track.style.transition = ''; track.style.transform = `translateX(${-r.ids.indexOf(r.id) * 100}%)`; });
  hero.addEventListener('click', e => { if (el.dragged) { e.stopPropagation(); el.dragged = false; } }, true);
}

// ───── 全屏看画：双指缩放、双击放大、向下拖动关闭 ─────
function openViewer(id, from) {
  const w = work(id), v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = `<div class="bg"></div><div class="stagei"><img src="${display(id)}" data-id="${id}" alt="${esc(w.title)}" draggable="false"></div>
    <div class="chrome"><button class="circle glass dark" data-act="vclose" aria-label="关闭">${icon('close')}</button><button class="capsule glass dark" data-act="vorig">原图</button></div>
    <div class="vcap glass dark"><b>${esc(w.title)}</b><small>${esc(w.artist)} · ${esc(w.yearText)}</small></div>`;
  app.append(v);
  pushOverlay();
  const img = v.querySelector('img'), stage = v.querySelector('.stagei'), bg = v.querySelector('.bg');
  sizeTo(img, stage);
  const fit = rel(img);
  const st = { s: 1, x: 0, y: 0 };
  viewer = { v, img, fit, st, id, from };
  chrome();
  const apply = () => { img.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; };
  if (from && !reduced) {
    const a = rel(from);
    img.animate([{ transform: `translate(${a.x - fit.x}px,${a.y - fit.y}px) scale(${a.w / fit.w})` }, { transform: 'none' }], { duration: 520, easing: EASE });
    bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320 });
  }
  const pts = new Map();
  let g = null, lastTap = 0, tapTimer = 0;
  const clampTo = () => {
    const W = app.clientWidth, H = app.clientHeight, cw = fit.w * st.s, chh = fit.h * st.s;
    const cx = cw <= W ? (W - cw) / 2 - fit.x : Math.min(-fit.x, Math.max(W - cw - fit.x, st.x));
    const cy = chh <= H ? (H - chh) / 2 - fit.y : Math.min(-fit.y, Math.max(H - chh - fit.y, st.y));
    return { x: cx, y: cy };
  };
  const settle = () => {
    if (st.s < 1) st.s = 1;
    const c = clampTo(), from0 = img.style.transform;
    st.x = c.x; st.y = c.y;
    img.animate([{ transform: from0 }, { transform: `translate(${st.x}px,${st.y}px) scale(${st.s})` }], { duration: 360, easing: EASE });
    apply();
  };
  const zoomAt = (px, py, s) => {
    const ix = (px - fit.x - st.x) / st.s, iy = (py - fit.y - st.y) / st.s;
    st.s = s; st.x = px - fit.x - ix * s; st.y = py - fit.y - iy * s;
    if (s === 1) { st.x = 0; st.y = 0; }
    settle();
  };
  v.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    v.setPointerCapture(e.pointerId);
    const a = app.getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - a.left, y: e.clientY - a.top });
    const ps = [...pts.values()];
    if (ps.length === 2) {
      const mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      g = { pinch: true, d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), s0: st.s, ix: (mid.x - fit.x - st.x) / st.s, iy: (mid.y - fit.y - st.y) / st.s };
    } else if (ps.length === 1) g = { x: ps[0].x, y: ps[0].y, x0: st.x, y0: st.y, t: e.timeStamp, moved: 0 };
  });
  v.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g) return;
    const a = app.getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - a.left, y: e.clientY - a.top });
    const ps = [...pts.values()];
    if (g.pinch && ps.length === 2) {
      const mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      st.s = Math.max(.7, Math.min(6, g.s0 * Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) / g.d));
      st.x = mid.x - fit.x - g.ix * st.s; st.y = mid.y - fit.y - g.iy * st.s;
      apply();
    } else if (!g.pinch) {
      const dx = ps[0].x - g.x, dy = ps[0].y - g.y;
      g.moved = Math.max(g.moved, Math.hypot(dx, dy));
      if (st.s > 1.01) { st.x = g.x0 + dx; st.y = g.y0 + dy; apply(); }
      else if (g.moved > 6) {
        g.dismiss = true;
        const k = Math.max(0, dy);
        img.style.transform = `translate(${dx * .5}px,${dy}px) scale(${1 - Math.min(k, 400) / 1400})`;
        bg.style.opacity = String(1 - Math.min(k, 360) / 420);
        v.classList.add('bare');
      }
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (!g) return;
    if (g.pinch) { if (pts.size === 0) { g = null; settle(); } return; }
    const a = app.getBoundingClientRect(), x = e.clientX - a.left, y = e.clientY - a.top;
    if (g.dismiss) {
      const dy = y - g.y, vel = dy / Math.max(1, e.timeStamp - g.t);
      g = null;
      if (dy > 110 || vel > .7) return closeViewer();
      v.classList.remove('bare');
      img.animate([{ transform: img.style.transform }, { transform: 'none' }], { duration: 360, easing: SPRING });
      bg.animate([{ opacity: bg.style.opacity }, { opacity: 1 }], { duration: 320 });
      img.style.transform = ''; bg.style.opacity = '';
      return;
    }
    if (g.moved < 8 && e.timeStamp - g.t < 300) {
      if (e.timeStamp - lastTap < 300) { clearTimeout(tapTimer); lastTap = 0; zoomAt(x, y, st.s > 1.01 ? 1 : 2.6); }
      else { lastTap = e.timeStamp; tapTimer = setTimeout(() => v.classList.toggle('bare'), 300); }
    } else if (st.s > 1.01) settle();
    g = null;
  };
  v.addEventListener('pointerup', up);
  v.addEventListener('pointercancel', up);
}
function closeViewer(fromPop) {
  if (!viewer) return;
  if (!fromPop) dropOverlay();
  const { v, img, fit, id } = viewer;
  const top = topPage();
  let to = top.route.kind === 'work' && top.route.id === id ? heroImg(top) : (viewer.from?.isConnected ? viewer.from : null);
  const r = to && rel(to);
  if (r && (r.y + r.h < 0 || r.y > app.clientHeight)) to = null;
  viewer = null;
  chrome();
  v.querySelector('.bg').animate([{ opacity: getComputedStyle(v.querySelector('.bg')).opacity }, { opacity: 0 }], { duration: 340, fill: 'forwards' });
  v.classList.add('bare');
  const done = () => v.remove();
  if (to && !reduced) {
    img.animate([{ transform: getComputedStyle(img).transform }, { transform: `translate(${r.x - fit.x}px,${r.y - fit.y}px) scale(${r.w / fit.w})` }], { duration: 460, easing: EASE, fill: 'forwards' }).finished.then(done);
  } else if (reduced) done();
  else v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).finished.then(done);
}

// ───── sheet：贴合内容 / 中 / 大三档，可拖动收起 ─────
function openSheet({ title, html, detents = ['medium', 'large'], mount }) {
  closeSheet(true, 'keep');
  pushOverlay();
  const layer = document.createElement('div');
  layer.className = 'sheet-layer';
  layer.innerHTML = `<div class="scrim" data-act="sheetClose"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"><i></i></div><div class="sheet-head"><span></span><h2>${esc(title)}</h2><div class="r"><button class="circle glass" style="width:36px;height:36px" data-act="sheetClose" aria-label="关闭">${icon('close')}</button></div></div><div class="sheet-body">${html}<div style="height:16px"></div></div></section>`;
  app.append(layer);
  const sh = layer.querySelector('.sheet'), H = app.clientHeight, largeH = H - safeTop - 10, medH = Math.min(Math.max(H * .52, 380), largeH);
  sh.style.height = largeH + 'px';
  mount?.(sh);
  const fitH = Math.min(medH, sh.querySelector('.grab').offsetHeight + sh.querySelector('.sheet-head').offsetHeight + sh.querySelector('.sheet-body').scrollHeight + 16);
  const pos = { fit: largeH - fitH, medium: largeH - medH, large: 0 };
  sheet = { layer, sh, pos, detents, cur: detents[0], largeH };
  sh.offsetWidth;
  layer.classList.add('open');
  setDetent(detents[0]);
  let d = null;
  const start = e => {
    if (e.target.closest('button')) return;
    d = { y: e.clientY, base: pos[sheet.cur], ly: e.clientY, lt: e.timeStamp, v: 0 };
    sh.setPointerCapture(e.pointerId);
    sh.style.transition = 'none';
  };
  sh.querySelector('.grab').addEventListener('pointerdown', start);
  sh.querySelector('.sheet-head').addEventListener('pointerdown', start);
  sh.addEventListener('pointermove', e => {
    if (!d) return;
    let y = d.base + e.clientY - d.y;
    if (y < 0) y = -Math.sqrt(-y) * 3;
    sh.style.transform = `translateY(${y}px)`;
    d.v = (e.clientY - d.ly) / Math.max(1, e.timeStamp - d.lt); d.ly = e.clientY; d.lt = e.timeStamp;
  });
  const end = e => {
    if (!d) return;
    sh.style.transition = '';
    const y = d.base + e.clientY - d.y, proj = y + d.v * 180;
    d = null;
    const lowest = Math.max(...detents.map(k => pos[k]));
    if (proj > lowest + (largeH - lowest) * .3) return closeSheet();
    setDetent(detents.reduce((a, k) => Math.abs(pos[k] - proj) < Math.abs(pos[a] - proj) ? k : a, detents[0]));
  };
  sh.addEventListener('pointerup', end);
  sh.addEventListener('pointercancel', end);
}
function setDetent(k) {
  const s = sheet;
  s.cur = k;
  s.sh.style.transform = `translateY(${s.pos[k]}px)`;
  s.sh.querySelector('.sheet-body').style.paddingBottom = `calc(${s.pos[k]}px + var(--safe-bottom) + 12px)`;
  s.sh.classList.toggle('large', k === 'large');
  app.querySelector('.app-body').classList.toggle('receded', k === 'large');
}
// hist：drop 退回 sheet 占的那条历史；keep 留给接下来打开的页面替换；pop 由浏览器返回触发
function closeSheet(now, hist = 'drop') {
  if (!sheet) return;
  const { layer, sh, largeH } = sheet;
  sheet = null;
  if (hist === 'drop') dropOverlay();
  app.querySelector('.app-body').classList.remove('receded');
  if (now) return layer.remove();
  layer.classList.remove('open');
  sh.style.transform = `translateY(${largeH + 40}px)`;
  setTimeout(() => layer.remove(), 480);
}

// ───── 长按菜单 ─────
let lp = null;
function cancelLP() { if (lp) { clearTimeout(lp.timer); lp = null; } }
function openCtx(node) {
  const id = node.dataset.ctx, w = work(id), p = period(w.period), by = w.by?.[0] && person(w.by[0]);
  const src = rel(node.querySelector('img') || node), W = app.clientWidth, H = app.clientHeight, rr = ratio(id);
  let pw = Math.min(W - 90, 240), ph = pw * rr;
  if (ph > H * .4) { ph = H * .4; pw = ph / rr; }
  const items = [[isSaved(id) ? '取消收藏' : '收藏', 'saved', 'ctxSave'], ['打开作品', 'eye', 'ctxOpen'], by && [`作者 · ${by.name}`, 'person', 'ctxPerson'], [`走进${p.short}`, 'hall', 'ctxHall'], ['分享', 'share', 'share']].filter(Boolean);
  const menuH = items.length * 50, top = Math.max(safeTop + 16, Math.min(src.y, H - ph - menuH - 48)), left = (W - pw) / 2;
  const c = document.createElement('div');
  c.className = 'ctx';
  c.innerHTML = `<div class="blur" data-act="ctxClose"></div><button class="preview" data-act="ctxOpen" aria-label="打开${esc(w.title)}" style="left:${src.x}px;top:${src.y}px;width:${src.w}px;height:${src.h}px"><img src="${thumb(id)}" alt=""></button><div class="menu" role="menu" style="left:${Math.max(16, left)}px;top:${top + ph + 14}px">${items.map(([l, ic, act]) => `<button role="menuitem" data-act="${act}"><span>${esc(l)}</span>${icon(ic)}</button>`).join('')}</div>`;
  app.append(c);
  ctx = { c, node, id };
  navigator.vibrate?.(10);
  requestAnimationFrame(() => {
    c.classList.add('open');
    Object.assign(c.querySelector('.preview').style, { left: left + 'px', top: top + 'px', width: pw + 'px', height: ph + 'px' });
    const im = c.querySelector('.preview img'), hi = new Image();
    hi.onload = () => { im.src = hi.src; };
    hi.src = display(id);
  });
}
function closeCtx(then) {
  if (!ctx) return then?.();
  const { c } = ctx;
  ctx = null;
  c.classList.remove('open');
  if (reduced) c.remove();
  else c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished.then(() => c.remove());
  then?.();
}

// ───── 动作 ─────
function listIds(key = '') {
  const [k, v] = key.split(':');
  if (k === 'period') return worksOf(v).filter(hasImg).map(w => w.id);
  if (k === 'by') return worksByPerson(v).map(w => w.id);
  if (k === 'saved') return saved.filter(id => hasImg(work(id)));
  if (k === 'story') return storyWorks(v);
  if (k === 'search') return S.results;
  if (k === 'viewed') return [...S.viewed];
  if (k === 'chrono') return cbWorks().map(w => w.id);
  if (k === 'sea') return stackEl('sea').firstElementChild?.route.list;
  return null;
}
function openWork(id, list, from) {
  let ids = listIds(list) || [id];
  if (!ids.includes(id)) ids = [id];
  push({ kind: 'work', id, ids: [...ids] }, { from: from && from.isConnected && (from.querySelector('img') || from.tagName === 'IMG') ? from : null });
}
function toggleSave(id) {
  const had = isSaved(id);
  saved = had ? saved.filter(x => x !== id) : [id, ...saved];
  const kept = writeLS('aha.favorites.v1', saved);
  hud(!kept ? '仅在本次浏览保留，浏览器未允许保存' : had ? '已取消收藏' : '已加入收藏', had ? 'saved' : 'check');
  const top = topPage();
  app.querySelectorAll('.page').forEach(p => { if (p !== top) p.stale = true; });
  if (top.route.kind === 'sea') {
    const card = top.querySelector('.sea-card');
    if (card) card.innerHTML = seaCard(top.route);
    else draw(top);
  } else if (top.route.kind === 'work') {
    top.querySelector('.nav [data-act="save"]').innerHTML = saveIcon(top.route.id);
    top.querySelector('.work-info').innerHTML = workInfo(top.route);
    mountSeg(top);
  } else draw(top);
}
function saveProgress(r) {
  progress[r.id] = { step: r.step, choice: r.choice, open: r.open, t: Date.now() };
  writeLS('aha.reading.v2', progress);
  app.querySelectorAll('.page').forEach(p => { if (p !== topPage()) p.stale = true; });
}
// 回到人物 tab 的根页，切到某个视图并改它的状态
function goPeople(patch, after) {
  const st = stackEl('people');
  if (!st.children.length) st.append(makePage(rootRoute('people')));
  const root = st.firstElementChild;
  Object.assign(root.route, patch);
  root.stale = true;
  if (S.tab === 'people') { if (topPage() === root) draw(root, false, true); else popToRoot(); }
  else {
    [...st.children].slice(1).forEach(p => { p.cleanup?.(); p.remove(); });
    Object.assign(root.style, { visibility: '', transform: '' });
    switchTab('people');
  }
  after?.(root);
}
const periodSheetHtml = cur => `<div class="card rows" style="margin-top:4px"><button class="lrow" data-act="seaSetPeriod" data-v=""><div class="main"><b>全部时期</b><small>每个时期选几件代表作</small></div>${cur ? '' : icon('check', 'check')}</button></div>`
  + D.groups.map(g => `<div class="gl">${esc(g.name)}</div><div class="card rows">${D.periods.filter(p => p.group === g.id).map(p => `<button class="lrow gc" style="${gc(g)}" data-act="seaSetPeriod" data-v="${p.id}"><span class="dot" style="background:var(--c)"></span><div class="main"><b>${esc(p.name)}</b><small>${esc(p.span)}</small></div>${cur === p.id ? icon('check', 'check') : ''}</button>`).join('')}</div>`).join('');

const ACT = {
  tab: v => switchTab(v),
  openSearch: (v, b, e) => { if (S.tab !== 'search' && !e.target.closest('[data-act="clearQ"]')) switchTab('search'); },
  clearQ: (v, b, e) => { e.preventDefault(); qInput.value = ''; onQuery(); qInput.focus(); },
  q: v => { qInput.value = v; remember(v); onQuery(); },
  back: () => goBack(),
  work: (v, b) => { if (S.query && S.tab === 'search') remember(S.query); openWork(v, b.dataset.list, b.hasAttribute('data-zoom') ? b : null); },
  person: v => push({ kind: 'person', id: v }),
  hall: v => push({ kind: 'hall', id: v }),
  story: v => push({ kind: 'story', id: v }),
  read: v => { const p = progress[v]; push({ kind: 'reader', id: v, step: p?.step || 0, choice: p?.choice || {}, open: p?.open || {}, hot: {} }, { anim: 'cover' }); },
  full: (v, b) => !hasImg(work(v)) ? hud('这件作品暂无配图', 'eye') : openViewer(v, b.tagName === 'IMG' ? b : b.querySelector('img') || heroImg(pageOf(b))),
  save: v => toggleSave(v),
  share: () => {
    const id = ctx?.id, top = topPage().route;
    closeCtx();
    const url = location.origin + location.pathname + (id ? `#m/sea/work/${encodeURIComponent(id)}` : routeUrl(top));
    const title = id ? work(id).title : top.kind === 'work' ? work(top.id).title : state.site.title;
    if (navigator.share) navigator.share({ title, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => hud('链接已复制', 'link'), () => hud('可以复制地址栏分享', 'share')) ?? hud('可以复制地址栏分享', 'share');
  },
  ctx: v => push({ kind: 'context', id: v, value: '' }),
  about: () => push({ kind: 'about' }),
  seg: (v, b) => {
    const el = pageOf(b), th = b.closest('.segc').querySelector('.thumb-s'), from = { key: b.dataset.key, l: th.offsetLeft, w: th.offsetWidth };
    el.route[b.dataset.key] = v;
    if (b.dataset.key === 'theme') {
      writeLS('aha.theme', v);
      if (v === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
      b.closest('.segc').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      mountSeg(el, from); chrome(); return;
    }
    if (el.route.kind === 'work') {
      const info = el.querySelector('.work-info');
      info.innerHTML = workInfo(el.route);
      if (!reduced) [...info.children].slice(3).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: i * 40, easing: SPRING, fill: 'backwards' }));
    } else { const top = el.querySelector('.scroll').scrollTop; draw(el, false, true); el.querySelector('.scroll').scrollTop = Math.min(top, 120); }
    mountSeg(el, from);
  },
  seaPick: v => { const el = topPage(); if (el.route.sel === v) ACT.seaOpen(); else el.seaSelect?.(v); },
  seaOpen: () => { const el = topPage(); openWork(el.route.sel, 'sea', el.querySelector(`.sea-art[data-v="${CSS.escape(el.route.sel)}"]`)); },
  seaShuffle: () => { const el = topPage(), l = el.route.list.filter(x => x !== el.route.sel); el.seaSelect?.(l[Math.floor(Math.random() * l.length)]); },
  seaMode: () => { const el = topPage(); el.route.mode = el.route.mode === 'sea' ? 'grid' : 'sea'; draw(el, false, true); chrome(); },
  seaPeriod: () => openSheet({ title: '选择时期', html: periodSheetHtml(topPage().route.period) }),
  seaSetPeriod: v => { const el = stackEl('sea').firstElementChild; el.route.period = v; el.route.ax = el.route.ay = undefined; el.route.sel = v ? worksOf(v).find(hasImg)?.id : 'mona-lisa'; closeSheet(); draw(el, false); chrome(); },
  era: v => { const p = period(v); openSheet({ title: p.name, html: `<div class="prose"><p class="mt">${esc(p.span)}</p><p class="lead">${esc(p.thesis)}</p>${p.points.map(x => `<p>${esc(x)}</p>`).join('')}${p.bridge ? `<p class="next"><b>下一站</b>${esc(p.bridge)}</p>` : ''}</div>` }); },
  aa: () => openSheet({
    title: '外观', detents: ['fit'],
    html: `<div class="aa"><div class="card sizes"><span style="font-size:14px">A</span><input id="fs" type="range" min="15" max="24" step="1" value="${prefs.fs}" aria-label="字号"><span style="font-size:24px">A</span></div><div class="themes">${[['paper', '#f8f4ec', '#2b251c', '纸色'], ['white', '#ffffff', '#111', '白色'], ['night', '#121214', '#e8e3d8', '夜间']].map(([k, bg, fg, l]) => `<button data-act="theme" data-v="${k}" aria-pressed="${prefs.theme === k}" aria-label="${l}" style="background:${bg};color:${fg}">文</button>`).join('')}</div><p class="foot" style="text-align:center;padding:0">纸色和宋体只用在阅读页</p></div>`,
    mount: sh => sh.querySelector('#fs').addEventListener('input', e => { prefs.fs = +e.target.value; writeLS('aha.reader.v1', prefs); topPage().querySelector('.read')?.style.setProperty('--fs', prefs.fs + 'px'); }),
  }),
  theme: (v, b) => { prefs.theme = v; writeLS('aha.reader.v1', prefs); b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); const el = topPage(); el.classList.toggle('t-white', v === 'white'); el.classList.toggle('t-night', v === 'night'); chrome(); },
  choice: (v, b) => { const el = pageOf(b); el.route.choice[el.route.step] = +v; saveProgress(el.route); draw(el); },
  disclose: (v, b) => { const el = pageOf(b); el.route.open[el.route.step] = !el.route.open[el.route.step]; saveProgress(el.route); draw(el); },
  hot: (v, b) => { const el = pageOf(b), h = el.route.hot; h[el.route.step] = h[el.route.step] === +v ? null : +v; draw(el); },
  rnext: (v, b) => {
    const el = pageOf(b), r = el.route, s = D.readings.find(x => x.id === r.id);
    if (r.step === s.steps.length - 1) { delete progress[r.id]; writeLS('aha.reading.v2', progress); app.querySelectorAll('.page').forEach(p => { if (p !== el) p.stale = true; }); goBack(); hud('看完了这一篇'); return; }
    r.step++; saveProgress(r); draw(el, false);
    el.querySelector('.scroll').animate([{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING });
  },
  rprev: (v, b) => { const el = pageOf(b); el.route.step--; saveProgress(el.route); draw(el, false); el.querySelector('.scroll').animate([{ opacity: 0, transform: 'translateX(-28px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING }); },
  vclose: () => closeViewer(),
  vorig: (v, b) => {
    const c = D.credits[viewer?.id], img = viewer?.img;
    if (!c?.file) return;
    b.disabled = true; b.textContent = '加载中…';
    const hi = new Image();
    hi.onload = () => { if (img.isConnected) { img.src = hi.src; b.textContent = '原图'; } };
    hi.onerror = () => { b.disabled = false; b.textContent = '原图'; hud('原图暂时无法加载', 'expand'); };
    hi.src = fileUrl(c.file);
  },
  sheetClose: () => closeSheet(),
  ctxClose: () => closeCtx(),
  ctxOpen: () => { const { node, id } = ctx; closeCtx(); openWork(id, node.dataset.list, node.isConnected ? node : null); },
  ctxSave: () => { const { id } = ctx; closeCtx(); toggleSave(id); },
  ctxPerson: () => { const w = work(ctx.id); closeCtx(); push({ kind: 'person', id: w.by[0] }); },
  ctxHall: () => { const w = work(ctx.id); closeCtx(); push({ kind: 'hall', id: w.period }); },
  cbGo: (v, b) => {
    const el = pageOf(b), real = !!el.route.real, [k, a, c] = v.split(':');
    if (k === 'ev') return el.cbTo(CX(D.events[+a].year, real), () => ACT.event(a), D.events[+a].year);
    if (k === 'wk') return el.cbTo(CX(work(a).year, real), () => openWork(a, 'chrono'), work(a).year);
    const s = +b.dataset.s, e = +b.dataset.e, mid = (Math.max(CX(s, real), 0) + CX(e, real)) / 2;
    el.cbTo(mid, k === 'p' ? () => ACT.era(a) : null);
  },
  cbStep: (v, b) => { const el = pageOf(b), i = Math.max(0, Math.min(D.events.length - 1, (el.route.ei || 0) + +v)); el.cbTo(CX(D.events[i].year, !!el.route.real), null, D.events[i].year); },
  cbReal: (v, b) => { const el = pageOf(b); el.route.real = !el.route.real; draw(el); },
  cbList: (v, b) => { const el = pageOf(b); el.route.list = !el.route.list; draw(el, false); },
  cbBand: v => {
    const [bi, ii] = v.split(':').map(Number), band = D.bands[bi], it = band.items[ii];
    openSheet({ title: it.name, detents: ['fit', 'large'], html: `<div class="prose"><p class="mt">${esc(band.label)} · ${yr(it.start)} – ${yr(it.end)}</p>${(band.fields || []).map((f, i) => it.values?.[i] ? `${i ? `<h3>${esc(f)}</h3>` : ''}<p${i ? '' : ' class="lead"'}>${esc(it.values[i])}</p>` : '').join('')}</div>` });
  },
  bandPick: () => {
    const cur = stackEl('guide').firstElementChild.route.band;
    openSheet({ title: '对照历史', detents: ['fit'], html: `<div class="card rows">${D.bands.map(b => `<button class="lrow" data-act="bandSet" data-v="${b.id}"><div class="main"><b>${esc(b.label)}</b><small>${esc((b.fields || []).join(' · '))}</small></div>${b.id === cur ? icon('check', 'check') : ''}</button>`).join('')}</div><p class="foot">每个时期下方显示同一时间段的对照内容</p>` });
  },
  bandSet: v => { const el = stackEl('guide').firstElementChild; el.route.band = v; closeSheet(); draw(el); },
  event: v => {
    const e = D.events[+v], ps = (e.periods || []).map(period).filter(Boolean);
    openSheet({ title: e.name, detents: ['fit', 'large'], html: `<div class="prose"><p class="mt">${esc(e.yearText || yr(e.year))}</p><p class="lead">${esc(e.what)}</p><h3>对艺术的影响</h3><p>${esc(e.art)}</p></div>${ps.length ? `<div class="gl">相关展厅</div><div class="card rows">${ps.map(p => `<button class="lrow" style="--sep-left:74px" data-act="sheetGo" data-v="hall:${p.id}"><img class="thumb" src="${thumb(firstImg(p.id))}" alt=""><div class="main"><b>${esc(p.name)}</b><small>${esc(p.span)}</small></div>${chev}</button>`).join('')}</div>` : ''}` });
  },
  encounter: v => {
    const e = D.encounters[+v], ps = e.people.map(person).filter(Boolean);
    openSheet({ title: e.title, detents: ['fit', 'large'], html: `<div class="prose"><p class="mt">${esc(e.yearText || yr(e.year))} · ${esc(e.place)}</p><p>${esc(e.text)}</p></div><div class="gl">在场的人</div><div class="card rows">${ps.map(o => `<button class="lrow" style="--sep-left:68px" data-act="sheetGo" data-v="person:${o.id}">${avatar(o)}<div class="main"><b>${esc(o.name)}</b><small>${esc(lifespan(o))}</small></div>${chev}</button>`).join('')}</div>` });
  },
  sheetGo: v => { const [k, id] = v.split(':'); closeSheet(false, 'keep'); push({ kind: k, id }); },
  tbPick: (v, b) => pageOf(b).tbJump?.(v),
  timeFocus: v => { const p = person(v); goPeople({ seg: 'time', focus: v, year: Math.round(p.born + (p.died - p.born) * .45) }); },
  chainFocus: v => goPeople({ seg: 'chain', cf: v, trail: [v] }),
  chainGo: (v, b) => {
    const el = pageOf(b), r = el.route, av = b.querySelector('.avatar');
    const from = av && b.closest('.ego') ? rel(av) : null;
    if (v === r.cf) return;
    r.cf = v;
    const i = r.trail.indexOf(v);
    r.trail = i >= 0 ? r.trail.slice(0, i + 1) : [...r.trail, v].slice(-8);
    const sc = el.querySelector('.scroll'), egoTop = el.querySelector('.ego').offsetTop - 80;
    draw(el);
    if (sc && !b.closest('.ego')) el.querySelector('.scroll').scrollTo({ top: Math.max(0, egoTop), behavior: reduced ? 'auto' : 'smooth' });
    mountChain(el, from);
    const tr = el.querySelector('.trail');
    tr.scrollLeft = tr.scrollWidth;
  },
};

// ───── 全局手势与事件 ─────
app.addEventListener('click', e => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled || !app.contains(b)) return;
  if (e.target.closest('a')) return;
  ACT[b.dataset.act]?.(b.dataset.v, b, e);
});
// 脉络页沿用上一版的 data-* 链接与选择器
app.addEventListener('click', e => {
  const b = e.target.closest('.ctxpage [data-hall], .ctxpage [data-person], .ctxpage [data-work], .ctxpage [data-context], .ctxpage [data-chain]');
  if (!b || e.target.closest('a,[data-act]')) return;
  const d = b.dataset;
  if (d.work) openWork(d.work, null, b);
  else if (d.person) push({ kind: 'person', id: d.person });
  else if (d.hall) push({ kind: 'hall', id: d.hall });
  else if (d.chain) ACT.chainFocus(d.chain);
  else if (d.context) push({ kind: 'context', id: d.context, value: pageOf(b).route.value || '' });
});
app.addEventListener('change', e => {
  const sel = e.target.closest('[data-context-value]');
  if (!sel) return;
  const el = pageOf(sel);
  el.route.value = sel.value;
  draw(el, false);
  saveHistory();
});
app.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('svg [role=button]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});
app.addEventListener('contextmenu', e => { if (e.target.closest('[data-ctx]')) e.preventDefault(); });

// 返回手势：在页面任意位置向右滑（iOS 26 起支持全屏返回）
let sw = null;
app.addEventListener('pointerdown', e => {
  suppressClick = false;
  const t = e.target.closest('[data-ctx]');
  if (t && e.isPrimary && !viewer && !sheet && !ctx) lp = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { lp = null; sw = null; suppressClick = true; openCtx(t); }, 480) };
  if (!e.isPrimary || busy || viewer || sheet || ctx) return;
  const ps = pages(), el = ps.at(-1);
  if (ps.length < 2 || !el.contains(e.target) || el.route.anim === 'cover') return;
  if (e.target.closest('.whero,.rail,.pc-rail,.tb-scroll,.trail,.sea-view,input')) return;
  sw = { x: e.clientX, y: e.clientY, el, prev: ps.at(-2), on: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
});
app.addEventListener('pointermove', e => {
  if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) cancelLP();
  if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (!sw.on) {
    if (dx > 10 && dx > Math.abs(dy) * 1.3) { sw.on = true; app.setPointerCapture(e.pointerId); sw.prev.style.visibility = ''; if (sw.prev.stale) draw(sw.prev); cancelLP(); }
    else if (Math.abs(dy) > 10 || dx < -10) sw = null;
    return;
  }
  const w = app.clientWidth, x = Math.max(0, dx);
  sw.el.style.transform = `translateX(${x}px)`;
  if (sw.el.route.anim === 'slide') {
    sw.prev.style.transform = `translateX(${-w * .3 + x * .3}px)`;
    const sh = sw.prev.querySelector(':scope > .shade');
    if (sh) sh.style.opacity = String(.1 * (1 - x / w));
  }
  sw.v = (e.clientX - sw.lx) / Math.max(1, e.timeStamp - sw.lt); sw.lx = e.clientX; sw.lt = e.timeStamp;
});
const swEnd = e => {
  cancelLP();
  if (!sw) return;
  const s = sw;
  sw = null;
  if (!s.on) return;
  const w = app.clientWidth, x = Math.max(0, e.clientX - s.x);
  if (x > w * .35 || s.v > .5) { busy = true; slideOut(s.el, s.prev, x).then(() => { finishPop(s.el, s.prev); historyAfterPop(); }); return; }
  anim(s.el, [{ transform: `translateX(${x}px)` }, { transform: 'none' }], 320, SPRING);
  if (s.el.route.anim === 'slide') {
    anim(s.prev, [{ transform: `translateX(${-w * .3 + x * .3}px)` }, { transform: `translateX(${-w * .3}px)` }], 320).then(() => { s.prev.style.visibility = 'hidden'; });
    anim(s.prev.querySelector(':scope > .shade'), [{ opacity: .1 * (1 - x / w) }, { opacity: .1 }], 320);
  } else setTimeout(() => { s.prev.style.visibility = 'hidden'; }, 320);
};
app.addEventListener('pointerup', swEnd);
app.addEventListener('pointercancel', swEnd);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ctx) closeCtx(); else if (sheet) closeSheet(); else if (viewer) closeViewer(); else goBack();
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-theme-set]');
  if (!b) return;
  if (b.dataset.themeSet) document.documentElement.dataset.theme = b.dataset.themeSet;
  else delete document.documentElement.dataset.theme;
  document.querySelectorAll('[data-theme-set]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  if (tabbar) chrome();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (tabbar) chrome(); });
addEventListener('resize', () => { safeTop = app.querySelector('.probe')?.offsetHeight || 0; if (tabbar) chrome(); });

// ───── 历史与深链接 ─────
// 每条历史保存可序列化的页面栈：子页压栈，tab 切换和页内状态只替换当前项；sheet 与全图各占一条，返回时先关闭它们。
// 地址为 #m/<tab>/<kind>/<id>，兼容上一版的“探索”tab 和 #p-*、#who-*、#story-*、#work-* 链接。
const TAB_IDS = ['sea', 'guide', 'people', 'saved', 'search'];
const CONTEXT_IDS = ['relay', 'schools', 'people-life', 'pendulum', 'pairs', 'sizes', 'chronology'];
let histN = 0, skipPop = false, restoring = false, saveTimer = 0;
const routeData = r => { const { list, ...x } = r; return JSON.parse(JSON.stringify(x)); };
const snapshot = () => ({ tab: S.tab, stacks: Object.fromEntries(TAB_IDS.map(t => [t, pages(t).map(p => routeData(p.route))])) });
function routeUrl(r = topPage()?.route) {
  if (!r || TAB_IDS.includes(r.kind)) return `#m/${S.tab}/root`;
  return `#m/${S.tab}/${r.kind}${r.id ? '/' + encodeURIComponent(r.id) : ''}`;
}
function saveHistory(now) {
  if (restoring || !tabbar) return;
  clearTimeout(saveTimer);
  const write = () => { try { history.replaceState({ ...history.state, mobile: snapshot(), n: histN }, '', routeUrl()); } catch {} };
  if (now) write(); else saveTimer = setTimeout(write, 150);
}
function pushHistory() {
  if (restoring) return;
  clearTimeout(saveTimer);
  // 从 sheet 里打开新页时，新页替换 sheet 占的那条历史
  if (history.state?.ov) history.replaceState({ mobile: snapshot(), n: histN }, '', routeUrl());
  else history.pushState({ mobile: snapshot(), n: ++histN }, '', routeUrl());
}
function pushOverlay() { if (!restoring && !history.state?.ov) history.pushState({ mobile: snapshot(), n: ++histN, ov: 1 }, '', routeUrl()); }
function dropOverlay() { if (history.state?.ov) { skipPop = true; history.back(); } }
function goBack() {
  if (pages().length < 2 || busy) return;
  // 站内打开的子页有自己的历史项，交给浏览器返回（popstate 里做动画）；直接从深链接进入的子页就地返回
  if (histN > 0 && history.state?.mobile) history.back();
  else { pop(); saveHistory(); }
}
function historyAfterPop() {
  if (histN > 0 && history.state?.mobile) { skipPop = true; history.back(); }
  else saveHistory(true);
}
const validRoute = r => {
  const id = r.id || '';
  return ({
    sea: 1, guide: 1, people: 1, saved: 1, search: 1, about: 1, missing: 1,
    work: work(id), person: person(id), hall: period(id), story: D.readings.find(x => x.id === id), reader: D.readings.find(x => x.id === id),
    context: CONTEXT_IDS.includes(id) || (id.startsWith('diagram:') && period(id.slice(8))?.diagram),
  })[r.kind];
};
function rebuild(t, routes, active) {
  const st = stackEl(t), ok = [];
  for (const r of routes) { if (!validRoute(r)) break; ok.push(r); }
  if (!ok.length || ok[0].kind !== t) ok.unshift(rootRoute(t));
  [...st.children].forEach(p => { p.cleanup?.(); p.remove(); });
  ok.forEach((r, i) => {
    if (r.kind === 'work') r.ids = (r.ids || [r.id]).filter(id => work(id));
    const el = makePage(r);
    st.append(el);
    if (active && i === ok.length - 1) draw(el, false);
    else { el.stale = true; if (i < ok.length - 1) el.style.visibility = 'hidden'; }
  });
}
function restore(snap) {
  restoring = true;
  busy = false;
  const t = TAB_IDS.includes(snap.tab) ? snap.tab : 'sea', want = snap.stacks?.[t] || [];
  if (t !== S.tab) switchTab(t);
  const have = pages(t), same = (a, b) => a.kind === b.kind && (a.id || '') === (b.id || '');
  if (want.length && have.length === want.length + 1 && want.every((r, i) => same(r, have[i].route))) pop();
  else if (want.length && !(have.length === want.length && want.every((r, i) => same(r, have[i].route)))) { rebuild(t, want, true); chrome(); }
  restoring = false;
}
let pendingViewer = '';
function fromHash() {
  let hash = '';
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = '?'; }
  let tab = 'sea', r = null;
  const m = hash.match(/^m\/([^/]+)\/([^/]+)(?:\/(.+))?$/);
  if (m) { tab = m[1]; if (m[2] !== 'root') r = { kind: m[2], id: m[3] || '' }; }
  else if (hash.startsWith('p-')) { tab = 'guide'; r = { kind: 'hall', id: hash.slice(2) }; }
  else if (hash.startsWith('who-')) { tab = 'people'; r = { kind: 'person', id: hash.slice(4) }; }
  else if (hash.startsWith('story-')) { tab = 'guide'; r = { kind: 'story', id: hash.slice(6) }; }
  else if (hash.startsWith('work-')) r = { kind: 'work', id: hash.slice(5) };
  else if (['hall', 'readings', 'chronology'].includes(hash)) tab = 'guide';
  else if (hash === 'people') tab = 'people';
  else if (['pendulum', 'pairs', 'sizes', 'relay'].includes(hash)) { tab = 'guide'; r = { kind: 'context', id: hash }; }
  else if (hash && !['top', 'hero', 'collection'].includes(hash)) r = { kind: 'missing' };
  if (tab === 'explore') tab = r?.kind === 'person' || r?.id === 'schools' ? 'people' : r?.kind === 'context' ? 'guide' : r?.kind === 'about' ? 'saved' : 'sea';
  if (r?.kind === 'search' || r?.kind === 'root') r = r.kind === 'search' ? (tab = 'search', null) : null;
  if (!TAB_IDS.includes(tab)) tab = 'sea';
  if (r?.kind === 'viewer') { r.kind = 'work'; pendingViewer = r.id; }
  if (r && !validRoute(r)) r = { kind: 'missing' };
  if (r?.kind === 'work') r.ids = [r.id];
  if (r?.kind === 'context') r.value = '';
  if (r?.kind === 'reader') { const p = progress[r.id]; Object.assign(r, { step: p?.step || 0, choice: p?.choice || {}, open: p?.open || {}, hot: {}, anim: 'cover' }); }
  return { tab, stacks: { [tab]: [rootRoute(tab), ...(r ? [r] : [])] } };
}
function boot(snap) {
  restoring = true;
  S.tab = TAB_IDS.includes(snap.tab) ? snap.tab : 'sea';
  // 先显示当前 tab 再绘制：隐藏的容器量不出宽度，时光带会读错年份
  stackEl(S.tab).hidden = false;
  TAB_IDS.forEach(t => { if (snap.stacks?.[t]?.length) rebuild(t, snap.stacks[t], t === S.tab); });
  if (!stackEl(S.tab).children.length) { const el = makePage(rootRoute(S.tab)); stackEl(S.tab).append(el); draw(el, false); }
  stackEl(S.tab).hidden = false;
  restoring = false;
}

addEventListener('popstate', e => {
  histN = e.state?.n || 0;
  if (skipPop) { skipPop = false; return; }
  if (ctx) closeCtx();
  if (viewer) return closeViewer(true);
  if (sheet) return closeSheet(false, 'pop');
  if (e.state?.mobile) restore(e.state.mobile);
});
addEventListener('hashchange', () => {
  if (location.hash === routeUrl()) return;
  const snap = fromHash();
  restoring = true;
  if (snap.tab !== S.tab) switchTab(snap.tab);
  rebuild(snap.tab, snap.stacks[snap.tab], true);
  restoring = false;
  chrome();
  saveHistory(true);
});
addEventListener('pagehide', () => saveHistory(true));

export function initMobileApp() {
  load();
  D.works.forEach(w => byId.set(w.id, w));
  D.periods.forEach(p => periodById.set(p.id, p));
  D.people.forEach(p => personById.set(p.id, p));
  const theme = readLS('aha.theme', 'system');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  shell();
  history.scrollRestoration = 'manual';
  const prev = history.state;
  if (prev?.mobile && location.hash.startsWith('#m/')) { histN = prev.n || 0; boot(prev.mobile); }
  else boot(fromHash());
  saved = saved.filter(id => work(id));
  saveHistory(true);
  requestAnimationFrame(() => {
    chrome();
    const top = topPage();
    if (pendingViewer && top.route.kind === 'work') openViewer(pendingViewer, heroImg(top));
    pendingViewer = '';
    hideSplash(top);
  });
}
// 启动画面（写在 index.html 里）：等首屏图片解码完再淡出，避免先看到空画框；最多等 1.2 秒
function hideSplash(top) {
  const splash = document.querySelector('.boot-splash');
  if (!splash) return;
  const imgs = [...top.querySelectorAll('img')].filter(im => !im.closest('[hidden]')).slice(0, 12);
  const ready = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : null));
  Promise.race([ready, new Promise(r => setTimeout(r, 1200))]).then(() => {
    splash.classList.add('done');
    setTimeout(() => splash.remove(), 700);
  });
}
