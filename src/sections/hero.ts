import { $, clamp, esc } from "../lib/dom";
import { fmtYear } from "../lib/format";
import { state, actions, periodOf, imgSrc, hasImage, periodsOrderedWorks } from "../state";
import { arrangeWorks, skyLoop, loopWork, wrapOffset, DEFAULT_DISTANCE, MIN_DISTANCE, MAX_DISTANCE, focusCamera, projectWork, focalLength } from "./hero-space";

/* 首尾相接的作品空间，DOM 图片按视距投影；仅在拖动、滑行、定位或调视距时逐帧更新。 */
const FAVORITES = [
  "venus-of-willendorf", "giza-pyramids", "discobolus", "colosseum", "justinian-mosaic", "chartres",
  "birth-of-venus", "mona-lisa", "venus-of-urbino", "arnolfini-portrait", "night-watch", "the-swing",
  "death-of-marat", "wanderer-above-the-sea-of-fog", "the-gleaners", "impression-sunrise", "starry-night", "the-scream",
];

let dispose = () => {};

export function initHero() {
  dispose();
  const hero = $("#hero"), stage = $("#hero-stage"), nav = $("#hero-periods");
  const order = periodsOrderedWorks().filter(hasImage);
  const space = arrangeWorks(order);
  const loop = skyLoop(order.length);
  const featured = new Map(state.t.periods.map((p) => {
    const candidates = order.filter((w) => w.period === p.id);
    const favorite = FAVORITES.find((id) => candidates.some((w) => w.id === id));
    return [p.id, order.indexOf(candidates.find((w) => w.id === favorite) ?? candidates[0])];
  }));
  $("#hero-kicker").textContent = `${state.site.titleEn} · ${state.t.meta.name}`;
  $("#hero-title").textContent = state.site.title;
  $("#hero-lead").innerHTML = `${esc(state.site.tagline)}<span class="hero-extra"><br>${esc(state.site.intro)}</span>`;
  $("#sky-total").textContent = `${order.length} 件作品`;
  // 三层星尘复用镜头位移变量；漂移与明灭交给 CSS，不增加逐帧计算。
  $("#hero-stars").innerHTML = [ .4, 1, 1.8 ].map((depth, layer) =>
    `<div class="sky-star-layer">${Array.from({ length: 24 }, (_, i) => {
      const seed = i + layer * 24;
      const x = (seed * 61.8034 + 13) % 96 + 2;
      const y = (seed * 43.1789 + 29) % 90 + 5;
      return `<span class="sky-spark" data-x="${x / 100}" data-y="${y / 100}" data-depth="${depth}"><i class="sky-star${seed % 13 === 0 ? " is-bright" : ""}" style="--size:${.8 + layer * .45 + i % 3 * .2}px;--duration:${16 + seed % 19}s;--delay:-${seed * 1.73}s;--drift:${i % 2 ? 12 : -12}px"></i></span>`;
    }).join("")}</div>`
  ).join("");
  const sparks = [...hero.querySelectorAll<HTMLElement>(".sky-spark")].map(node => ({ node, x: Number(node.dataset.x), y: Number(node.dataset.y), depth: Number(node.dataset.depth) }));
  stage.innerHTML = `<div class="sky-field">${space.map(({ work: w, size }, i) =>
    `<button class="sky-art" data-i="${i}" hidden style="width:${size}px;--drift:${i % 2 ? 9 : -9}px;--duration:${19 + i % 7 * 2}s;--delay:-${i * 2.7}s" aria-label="查看《${esc(w.title)}》，${esc(w.artist)}，${esc(w.yearText)}">
      <span class="sky-lantern"><img data-src="${imgSrc(w, "thumb")}" alt="" decoding="async" draggable="false" width="320" height="320"></span>
    </button>`
  ).join("")}</div>`;
  const nodes = [...stage.querySelectorAll<HTMLButtonElement>(".sky-art")];
  const images = nodes.map((n) => n.querySelector<HTMLImageElement>("img")!);
  nav.innerHTML = state.t.periods.filter((p) => featured.get(p.id)! >= 0).map((p) =>
    `<button data-period="${p.id}" aria-pressed="false">${esc(p.short)}</button>`
  ).join("");
  if (!space.length) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const view = { width: stage.clientWidth, height: stage.clientHeight };
  let current = Math.max(0, order.findIndex((w) => w.id === "mona-lisa"));
  let camera = space.length ? focusCamera(space[current], DEFAULT_DISTANCE, view) : { x: 0, y: 0, distance: DEFAULT_DISTANCE };
  let target = { ...camera };
  let dragging = false, suppressClick = false, moving = false, chooseAfterMove = false;
  let paused = false, inView = false, frame = 0, previousTime = 0;
  let leanX = 0, leanY = 0;
  const select = (i: number, reveal = false) => {
    const item = space[i];
    if (!item) return;
    nodes[current]?.classList.remove("is-current");
    current = i;
    nodes[i].classList.add("is-current");
    const w = item.work;
    $("#now-year").textContent = fmtYear(w.year);
    $("#now-work").textContent = w.title;
    $("#now-period").textContent = `${w.artist} · ${periodOf(w.period).short}`;
    nav.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.period === w.period));
      if (reveal && b.dataset.period === w.period) nav.scrollTo({ left: b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2, behavior: motion.matches ? "instant" : "smooth" });
    });
    if (reveal) {
      target = focusCamera(item, target.distance, view, loop, target);
      chooseAfterMove = false;
      requestRender();
    }
  };

  const paint = () => {
    let nearest = current, nearestScore = Infinity;
    space.forEach((item, i) => {
      const p = projectWork(item, camera, view, loop);
      const halfSize = item.size * p.scale / 2;
      const offscreen = p.x + halfSize < -180 || p.x - halfSize > view.width + 180 || p.y + halfSize < -180 || p.y - halfSize > view.height + 180;
      const node = nodes[i];
      node.hidden = offscreen;
      if (offscreen) return;
      if (!images[i].getAttribute("src")) {
        images[i].fetchPriority = i === current ? "high" : "low";
        images[i].src = images[i].dataset.src!;
      }
      node.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%) perspective(900px) rotateX(${leanY * p.scale}deg) rotateY(${leanX * p.scale}deg) rotateZ(${item.angle + leanX * .1}deg) scale(${p.scale})`;
      node.style.zIndex = String(Math.round(10000 - item.depth));
      node.style.opacity = String(p.opacity);
      node.style.setProperty("--light", String(p.light));
      const score = (p.x - view.width * .68) ** 2 + (p.y - view.height * .54) ** 2;
      if (p.x > 0 && p.x < view.width && p.y > 0 && p.y < view.height && score < nearestScore) { nearest = i; nearestScore = score; }
    });
    // 星尘也在视口外接回，连续拖很多圈后背景仍有星光，且不会在作品接缝处跳动。
    const starWidth = hero.clientWidth + 160, starHeight = hero.clientHeight + 160;
    sparks.forEach(({ node, x, y, depth }) => {
      const sx = wrapOffset(x * starWidth - camera.x * .025 * depth, starWidth) + starWidth / 2 - 80;
      const sy = wrapOffset(y * starHeight - camera.y * .025 * depth, starHeight) + starHeight / 2 - 80;
      node.style.transform = `translate3d(${sx}px,${sy}px,0)`;
    });
    $("#sky-depth-value").textContent = `${((380 + DEFAULT_DISTANCE) / (380 + camera.distance)).toFixed(1)}×`;
    $("#sky-nearer").toggleAttribute("disabled", target.distance <= MIN_DISTANCE);
    $("#sky-farther").toggleAttribute("disabled", target.distance >= MAX_DISTANCE);
    if (!moving && chooseAfterMove) { chooseAfterMove = false; select(nearest); }
  };
  function render(time: number) {
    frame = 0;
    const elapsed = previousTime ? Math.min(40, time - previousTime) : 16.7;
    previousTime = time;
    const ease = motion.matches ? 1 : 1 - (1 - (dragging ? .26 : .12)) ** (elapsed / 16.7);
    const dx = (target.x - camera.x) * ease, dy = (target.y - camera.y) * ease;
    camera.x += dx; camera.y += dy; camera.distance += (target.distance - camera.distance) * ease;
    leanX += ((motion.matches ? 0 : clamp(-dx * .28, -12, 12)) - leanX) * .22;
    leanY += ((motion.matches ? 0 : clamp(dy * .28, -10, 10)) - leanY) * .22;
    moving = Math.abs(target.x - camera.x) + Math.abs(target.y - camera.y) + Math.abs(target.distance - camera.distance) > .15 || Math.abs(leanX) + Math.abs(leanY) > .04;
    if (!moving) { camera = { ...target }; leanX = leanY = 0; }
    paint();
    if (moving) requestRender();
    else previousTime = 0;
  }
  function requestRender() {
    if (!frame && inView && !document.hidden) frame = requestAnimationFrame(render);
  }
  images.forEach((image, i) => {
    image.onload = () => {
      const aspect = image.naturalWidth / image.naturalHeight;
      nodes[i].style.width = `${space[i].size * Math.min(1, aspect)}px`;
      nodes[i].classList.add("is-loaded");
      requestRender();
    };
  });

  const pick = (t: EventTarget | null) => (t as Element | null)?.closest<HTMLElement>(".sky-art");
  let drag: { id: number; x: number; y: number; cameraX: number; cameraY: number; touch: boolean; lastX: number; lastY: number; time: number; vx: number; vy: number } | null = null;
  stage.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    suppressClick = false;
    target.x = camera.x; target.y = camera.y;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cameraX: camera.x, cameraY: camera.y, touch: e.pointerType === "touch", lastX: e.clientX, lastY: e.clientY, time: performance.now(), vx: 0, vy: 0 };
  };
  stage.onpointermove = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      if (drag.touch && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      dragging = suppressClick = true;
      hero.classList.add("is-dragging");
      stage.setPointerCapture(e.pointerId);
    }
    const now = performance.now(), elapsed = Math.max(8, now - drag.time);
    drag.vx = clamp((e.clientX - drag.lastX) * 16.7 / elapsed, -30, 30);
    drag.vy = drag.touch ? 0 : clamp((e.clientY - drag.lastY) * 16.7 / elapsed, -30, 30);
    drag.lastX = e.clientX; drag.lastY = e.clientY; drag.time = now;
    target.x = drag.cameraX - dx / .8;
    target.y = drag.cameraY - (drag.touch ? 0 : dy / .8);
    chooseAfterMove = true;
    requestRender();
  };
  const finishDrag = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return;
    if (dragging && e.type === "pointerup" && !motion.matches && performance.now() - drag.time < 90) {
      target.x -= drag.vx * 10; target.y -= drag.vy * 10;
    }
    drag = null; dragging = false;
    hero.classList.remove("is-dragging");
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    requestRender();
  };
  stage.onpointerup = stage.onpointercancel = stage.onlostpointercapture = finishDrag;
  stage.onpointerover = (e) => { const b = pick(e.target); if (b && !dragging && !moving) select(Number(b.dataset.i)); };
  const onFocus = (e: FocusEvent) => { const b = pick(e.target); if (b) select(Number(b.dataset.i)); };
  stage.addEventListener("focusin", onFocus);
  stage.onclick = (e) => {
    if (suppressClick && e.detail !== 0) { suppressClick = false; e.preventDefault(); return; }
    const b = pick(e.target);
    if (b) { const i = Number(b.dataset.i); select(i); actions.openWork(order[i].id, true, order.map((w) => w.id)); }
  };
  nav.onclick = (e) => { const b = (e.target as Element).closest<HTMLElement>("[data-period]"); if (b) select(featured.get(b.dataset.period!)!, true); };

  const changeDistance = (delta: number) => {
    const item = loopWork(space[current], target, loop);
    if (!item) return;
    const p = projectWork(item, target, view);
    target.distance = clamp(target.distance + delta, MIN_DISTANCE, MAX_DISTANCE);
    const perspective = focalLength(view) / (item.depth + target.distance);
    target.x = item.x - (p.x - view.width / 2) / perspective;
    target.y = item.y - (p.y - view.height / 2) / perspective;
    requestRender();
  };
  $("#sky-nearer").onclick = () => changeDistance(-180);
  $("#sky-farther").onclick = () => changeDistance(180);
  const play = $<HTMLButtonElement>("#sky-play");
  const syncMotion = () => {
    hero.classList.toggle("is-paused", paused || motion.matches || !inView || document.hidden);
    play.disabled = motion.matches;
    play.textContent = paused || motion.matches ? "▶" : "Ⅱ";
    play.setAttribute("aria-pressed", String(paused || motion.matches));
    play.setAttribute("aria-label", motion.matches ? "已按系统设置停止漂浮" : paused ? "继续漂浮" : "暂停漂浮");
    if (!inView || document.hidden) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else requestRender();
  };
  play.onclick = () => { paused = !paused; syncMotion(); };
  const step = (d: number) => select((current + d + order.length) % order.length, true);
  $("#sky-prev").onclick = () => step(-1);
  $("#sky-next").onclick = () => step(1);
  hero.onkeydown = (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); stage.focus({ preventScroll: true });
    } else if (["+", "=", "-"].includes(e.key)) {
      e.preventDefault(); changeDistance(e.key === "-" ? 180 : -180);
    } else if (e.key === "Enter" && e.target === stage && order[current]) actions.openWork(order[current].id, true, order.map((w) => w.id));
  };
  const resize = new ResizeObserver(() => {
    if (view.width === stage.clientWidth && view.height === stage.clientHeight) return;
    view.width = stage.clientWidth; view.height = stage.clientHeight;
    target = focusCamera(space[current], target.distance, view, loop, target);
    requestRender();
  });
  resize.observe(stage);
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncMotion(); });
  observer.observe(stage);
  document.addEventListener("visibilitychange", syncMotion);
  motion.addEventListener("change", syncMotion);
  dispose = () => {
    cancelAnimationFrame(frame);
    observer.disconnect(); resize.disconnect();
    stage.removeEventListener("focusin", onFocus);
    document.removeEventListener("visibilitychange", syncMotion);
    motion.removeEventListener("change", syncMotion);
  };
  select(current);
  syncMotion();
}
