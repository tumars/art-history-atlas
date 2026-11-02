import { $, esc, prefersReducedMotion } from "../lib/dom";
import { fmtYear } from "../lib/format";
import { state, actions, periodOf, imgSrc, hasImage, periodsOrderedWorks } from "../state";
import type { GalleryHandle } from "../gallery3d/scene";
import type { Work } from "../types";

/* 序厅：三维长廊。three.js 按需加载；不支持 WebGL 或减少动态效果时退化为作品带。 */

let handle: GalleryHandle | null = null;
let order: Work[] = [];
let keysBound = false;
let syncPlay = () => {};

const supportsWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

function setNow(i: number) {
  const w = order[i];
  if (!w) return;
  const p = periodOf(w.period);
  $("#now-year").textContent = fmtYear(w.year);
  $("#now-period").textContent = p.name;
  const cur = document.querySelector<HTMLElement>(".ruler .cursor");
  if (cur) cur.style.left = `${(i / Math.max(1, order.length - 1)) * 100}%`;
}

function renderRuler(onJump: (i: number) => void) {
  const N = order.length;
  const marks = state.t.periods
    .map((p) => ({ p, i: order.findIndex((w) => w.period === p.id) }))
    .filter((m) => m.i >= 0);
  $("#hero-ruler").innerHTML = `<div class="ruler"><div class="base"></div>${marks
    .map(({ p, i }) => `<div class="tick" style="left:${(i / Math.max(1, N - 1)) * 100}%"><button data-i="${i}" title="${esc(p.name)}，${fmtYear(p.start)}">${esc(p.short)}</button></div>`)
    .join("")}<div class="cursor" style="left:0"></div></div>`;
  $("#hero-ruler").onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) onJump(+b.dataset.i!);
  };
}

function fallbackStrip() {
  const stage = $("#hero-stage");
  stage.innerHTML = `<div class="hero-strip">${order
    .filter(hasImage)
    .map((w) => `<button data-w="${w.id}" aria-label="《${esc(w.title)}》，${esc(w.yearText)}"><img src="${imgSrc(w, "thumb")}" alt="" loading="lazy"></button>`)
    .join("")}</div>`;
  stage.onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (b) actions.openWork(b.dataset.w!, true, order.map((w) => w.id));
  };
  const strip = stage.querySelector<HTMLElement>(".hero-strip")!;
  strip.addEventListener("scroll", () => {
    const kids = [...strip.children] as HTMLElement[];
    const k = kids.findIndex((c) => c.offsetLeft + c.offsetWidth / 2 > strip.scrollLeft);
    const id = (kids[Math.max(0, k)] as HTMLElement | undefined)?.dataset.w;
    const i = order.findIndex((w) => w.id === id);
    if (i >= 0) setNow(i);
  }, { passive: true });
  $(".hero-controls").hidden = true;
  $("#hero-hint").textContent = "左右滑动浏览，点作品细看。";
}

export async function initHero() {
  handle?.dispose();
  handle = null;
  const s = state.site;
  order = periodsOrderedWorks();
  $("#hero-kicker").textContent = `${s.titleEn} · ${state.t.meta.name}`;
  $("#hero-title").textContent = s.title;
  $("#hero-lead").innerHTML = `${esc(s.tagline)}<br>${esc(s.intro)}`;
  const jump = (i: number) => (handle ? handle.goTo(i) : setNow(i));
  renderRuler(jump);
  setNow(0);
  const stage = $("#hero-stage");
  stage.innerHTML = "";

  if (!supportsWebGL() || prefersReducedMotion()) { fallbackStrip(); return; }

  const { createGallery } = await import("../gallery3d/scene");
  const css = getComputedStyle(document.documentElement);
  handle = createGallery(stage, {
    works: order.map((w) => ({
      id: w.id,
      title: w.title,
      yearText: w.yearText,
      color: css.getPropertyValue(`--g${state.t.meta.groups.findIndex((g) => g.id === periodOf(w.period).group) + 1}`).trim() || "#D9B66A",
      thumb: hasImage(w) ? imgSrc(w, "thumb") : null,
      full: hasImage(w) ? imgSrc(w, "full") : null,
    })),
    markers: state.t.periods
      .map((p) => ({ p, i: order.findIndex((w) => w.period === p.id) }))
      .filter((m) => m.i >= 0)
      .map(({ p, i }) => ({ index: i, name: p.name, sub: `${fmtYear(p.start)} 年起` })),
    onFocus: setNow,
    onPick: (id) => actions.openWork(id, true, order.map((w) => w.id)),
  });

  const play = $("#walk-play");
  const sync = (syncPlay = () => {
    const on = handle!.isPlaying();
    play.textContent = on ? "❚❚" : "▶";
    play.setAttribute("aria-label", on ? "暂停漫步" : "继续漫步");
  });
  play.onclick = () => { handle!.setPlaying(!handle!.isPlaying()); sync(); };
  $("#walk-back").onclick = () => { handle!.step(-1); sync(); };
  $("#walk-fwd").onclick = () => { handle!.step(1); sync(); };
  $("#hero").onpointerdown = () => setTimeout(sync, 50);
  $("#hero").onkeydown = (e) => {
    if (e.key === "ArrowRight") { handle!.step(1); sync(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { handle!.step(-1); sync(); e.preventDefault(); }
  };
  // 页面滚过长廊时，左右键交给展厅；在长廊里时，左右键行走
  if (keysBound) { sync(); return; }
  keysBound = true;
  window.addEventListener("keydown", (e) => {
    if (!handle || !$("#lightbox").hidden) return;
    const r = $("#hero").getBoundingClientRect();
    if (r.bottom < innerHeight * 0.5) return;
    if ((e.target as Element).closest?.("input,select,textarea,#hero")) return;
    if (e.key === "ArrowRight") { handle.step(1); syncPlay(); }
    if (e.key === "ArrowLeft") { handle.step(-1); syncPlay(); }
  });
  sync();
}
