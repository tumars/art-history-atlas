import { animate, type AnimationPlaybackControls } from "motion";
import {
  arrangeWorks,
  skyLoop,
  projectWork,
  focusCamera,
  focalLength,
  DEFAULT_DISTANCE,
  MIN_DISTANCE,
  MAX_DISTANCE,
  type SkyCamera,
} from "../sections/hero-space";
import { periodsOrderedWorks, hasImage, imgSrc } from "../state";
import { esc } from "../lib/dom";

// 页面离开后只保留镜头，不保留元素、监听器或动画。
let camera: SkyCamera | undefined;
export interface SeaController {
  select(id: string, reveal?: boolean): void;
  pause(value: boolean): void;
  zoom(direction: number): void;
  destroy(): void;
}

export function mountSea(
  root: HTMLElement,
  selected: string,
  paused: boolean,
  choose: (id: string) => void,
): SeaController {
  const works = periodsOrderedWorks().filter(hasImage);
  const space = arrangeWorks(works),
    loop = skyLoop(works.length);
  const view = { width: root.clientWidth, height: root.clientHeight };
  const first = space.find((x) => x.work.id === selected) || space[0];
  if (!first) {
    root.innerHTML = '<p class="pad">图片暂未加载，可从探索浏览作品资料。</p>';
    return { select() {}, pause() {}, zoom() {}, destroy() {} };
  }
  camera ??= focusCamera(first, DEFAULT_DISTANCE, view);
  let current = selected,
    stopped = paused,
    disposed = false,
    frame = 0;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let animations: AnimationPlaybackControls[] = [];
  // 固定种子的独立采样：避免横纵坐标线性关联形成斜排，返回时星空也不跳变。
  let starSeed = 7319;
  const starRandom = () => {
    starSeed = (Math.imul(starSeed, 1664525) + 1013904223) >>> 0;
    return starSeed / 4294967296;
  };
  root.innerHTML =
    '<div class="sea-world">' +
    [0.1, 0.25, 0.45].map((depth) =>
      `<div class="sea-star-layer" data-depth="${depth}" aria-hidden="true">${Array.from({length:24},()=>{
        return `<span class="sky-dot" style="left:${starRandom()*100}%;top:${starRandom()*100}%;--star-size:${1.1+starRandom()*.8}px;--star-duration:${6+starRandom()*9}s;--star-delay:-${starRandom()*20}s;--star-peak:${.5+starRandom()*.25}"><i></i></span>`;
      }).join('')}</div>`
    ).join('') +
    space
      .map(
        (x) =>
          '<button class="art" data-select="' +
          x.work.id +
          '" aria-label="选择' +
          esc(x.work.title) +
          '" aria-pressed="' +
          (x.work.id === selected) +
          '" hidden><span class="art-frame"><img data-src="' +
          esc(imgSrc(x.work, "thumb")) +
          '" alt="' +
          esc(x.work.title) +
          '" draggable="false" decoding="async"></span></button>',
      )
      .join("") +
    "</div>";
  const world = root.querySelector<HTMLElement>(".sea-world")!;
  const nodes = [...root.querySelectorAll<HTMLButtonElement>(".art")];
  const images = nodes.map((n) => n.querySelector("img")!);
  const stars = [...root.querySelectorAll<HTMLElement>(".sea-star-layer")];
  const origin = { ...camera };
  const paint = () => {
    frame = 0;
    if (disposed) return;
    space.forEach((item, i) => {
      const p = projectWork(item, camera!, view, loop),
        size = item.size * p.scale;
      const visible =
        p.x + size > -50 &&
        p.x - size < view.width + 50 &&
        p.y + size > -50 &&
        p.y - size < view.height + 50;
      const node = nodes[i];
      node.hidden = !visible;
      if (!visible) return;
      // 固定布局尺寸，只更新合成变换；每个动画帧最多绘制一次。
      node.style.width = item.size + "px";
      node.style.transform =
        "translate3d(" +
        p.x +
        "px," +
        p.y +
        "px,0) scale(" +
        p.scale +
        ") translate(-50%,-50%)";
      // 显示空间中的轻景深：远景退后，选中作品始终清晰，不影响详情原图。
      const depth = Math.max(0, Math.min(1, (item.depth - 380) / 830));
      const active = item.work.id === current;
      const blur = active ? 0 : depth * depth * .4;
      node.style.opacity = String(active ? 1 : 1 - depth * .42);
      node.style.filter = active ? 'none' : `blur(${Math.min(6, blur / p.scale)}px) brightness(${1 - depth * .23}) saturate(${1 - depth * .16})`;
      node.dataset.depth = depth.toFixed(2);
      node.style.zIndex = String(Math.round(p.scale * 100));
      if (!images[i].getAttribute("src"))
        images[i].src = images[i].dataset.src!;
    });
    for (const star of stars) {
      const depth = Number(star.dataset.depth);
      star.style.transform =
        "translate3d(" +
        Math.sin((camera!.x - origin.x) / 1800) * 35 * depth +
        "px," +
        Math.sin((camera!.y - origin.y) / 1800) * 35 * depth +
        "px,0)";
    }
  };
  const requestPaint = () => {
    if (!frame && !disposed) frame = requestAnimationFrame(paint);
  };
  const stop = () => {
    animations.forEach((a) => a.stop());
    animations = [];
  };
  const moveTo = (target: SkyCamera) => {
    stop();
    if (motion.matches) {
      Object.assign(camera!, target);
      paint();
      return;
    }
    const from = { ...camera! };
    animations = [
      animate(0, 1, {
        type: "spring",
        stiffness: 170,
        damping: 29,
        restDelta: 0.001,
        onUpdate: (t) => {
          camera!.x = from.x + (target.x - from.x) * t;
          camera!.y = from.y + (target.y - from.y) * t;
          camera!.distance =
            from.distance + (target.distance - from.distance) * t;
          requestPaint();
        },
      }),
    ];
  };
  const select = (id: string, reveal = false) => {
    const item = space.find((x) => x.work.id === id);
    if (!item) return;
    current = id;
    nodes.forEach((n) =>
      n.setAttribute("aria-pressed", String(n.dataset.select === id)),
    );
    requestPaint();
    if (reveal) moveTo(focusCamera(item, camera!.distance, view, loop, camera));
  };
  let gesture:
    | {
        id: number;
        x: number;
        y: number;
        cx: number;
        cy: number;
        ratio: number;
        time: number;
        lastX: number;
        lastY: number;
        vx: number;
        vy: number;
      }
    | undefined;
  let dragged = false,
    suppressClick = false;
  const pointers = new Set<number>();
  const pause = (value: boolean) => {
    stopped = value;
    world.classList.toggle("paused", value);
    if (value) stop();
  };
  const cancelGesture = () => {
    gesture = undefined;
    dragged = false;
    world.classList.remove("dragging");
  };
  root.onpointerdown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const braking = animations.some((a) => a.state === "running");
    pointers.add(e.pointerId);
    stop();
    if (pointers.size > 1 || !e.isPrimary) {
      suppressClick = true;
      cancelGesture();
      return;
    }
    // 滑行中轻触只负责刹车，不把同一次触摸解释为打开作品。
    suppressClick = braking;
    const rect = root.getBoundingClientRect();
    if (e.clientX - rect.left < 24 || rect.right - e.clientX < 24) return;
    const hit = (e.target as Element).closest<HTMLElement>("[data-select]");
    const item =
      space.find((x) => x.work.id === (hit?.dataset.select || current)) ||
      first;
    const ratio = (item.depth + camera!.distance) / focalLength(view);
    gesture = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      cx: camera!.x,
      cy: camera!.y,
      ratio,
      time: e.timeStamp,
      lastX: e.clientX,
      lastY: e.clientY,
      vx: 0,
      vy: 0,
    };
    dragged = false;
  };
  root.onpointermove = (e) => {
    const g = gesture;
    if (!g || e.pointerId !== g.id || pointers.size !== 1) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (!dragged && Math.hypot(dx, dy) < 7) return;
    dragged = true;
    suppressClick = true;
    world.classList.add("dragging");
    root.setPointerCapture(e.pointerId);
    const elapsed = Math.max(1, e.timeStamp - g.time),
      weight = 1 - Math.exp(-elapsed / 35);
    g.vx +=
      (Math.max(
        -2500,
        Math.min(2500, ((e.clientX - g.lastX) / elapsed) * 1000),
      ) -
        g.vx) *
      weight;
    g.vy +=
      (Math.max(
        -2500,
        Math.min(2500, ((e.clientY - g.lastY) / elapsed) * 1000),
      ) -
        g.vy) *
      weight;
    g.lastX = e.clientX;
    g.lastY = e.clientY;
    g.time = e.timeStamp;
    camera!.x = g.cx - dx * g.ratio;
    camera!.y = g.cy - dy * g.ratio;
    requestPaint();
  };
  root.onpointerup = (e) => {
    pointers.delete(e.pointerId);
    const g = gesture;
    if (!g || e.pointerId !== g.id) return;
    const shouldCoast =
      dragged && !stopped && !motion.matches && e.timeStamp - g.time < 100;
    cancelGesture();
    if (shouldCoast) {
      animations = (["x", "y"] as const).map((axis) => {
        const velocity = -(axis === "x" ? g.vx : g.vy) * g.ratio;
        // 非相同 keyframe，避免动画引擎将静态端点提前完成。
        return animate(camera![axis], camera![axis] + velocity * 0.18, {
          type: "inertia",
          velocity,
          power: 0.18,
          timeConstant: 240,
          restDelta: 0.4,
          onUpdate: (v) => {
            camera![axis] = v;
            requestPaint();
          },
        });
      });
    }
  };
  root.onpointercancel = (e) => {
    pointers.delete(e.pointerId);
    suppressClick = true;
    cancelGesture();
    stop();
  };
  root.onclick = (e) => {
    e.stopPropagation();
    if (suppressClick && e.detail !== 0) {
      suppressClick = false;
      return;
    }
    const b = (e.target as Element).closest<HTMLElement>("[data-select]");
    if (b) {
      stop();
      select(b.dataset.select!);
      choose(b.dataset.select!);
    }
  };
  const visibility = () => {
    world.classList.toggle("sea-suspended", document.hidden);
    if (document.hidden) {
      stop();
      cancelGesture();
      pointers.clear();
    }
  };
  const preference = () => {
    stop();
    cancelGesture();
    paint();
  };
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", preference);
  const resize = new ResizeObserver(() => {
    view.width = root.clientWidth;
    view.height = root.clientHeight;
    requestPaint();
  });
  resize.observe(root);
  pause(paused);
  paint();
  return {
    select,
    pause,
    zoom(direction) {
      const item = space.find((x) => x.work.id === current) || first;
      const distance = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, camera!.distance + direction * 180),
      );
      moveTo(focusCamera(item, distance, view, loop, camera));
    },
    destroy() {
      disposed = true;
      stop();
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", preference);
      root.onpointerdown =
        root.onpointermove =
        root.onpointerup =
        root.onpointercancel =
        root.onclick =
          null;
    },
  };
}
