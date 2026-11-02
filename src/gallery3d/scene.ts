import * as THREE from "three";

/**
 * 三维长廊：作品按年代顺序交替挂在左右两面墙上，镜头沿长廊前进。
 * 只依赖 three 核心；所有文字（铜牌、地面时期名）用 canvas 生成贴图。
 */

export interface GalleryWork {
  id: string;
  title: string;
  yearText: string;
  color: string; // 所属大阶段的颜色（用于铜牌色条）
  thumb: string | null;
  full: string | null;
}

export interface GalleryMarker {
  index: number; // 该时期第一件作品的序号
  name: string;
  sub: string; // 如“1600 年起”
}

export interface GalleryOptions {
  works: GalleryWork[];
  markers: GalleryMarker[];
  onFocus: (index: number) => void;
  onPick: (id: string) => void;
  start?: number;
}

export interface GalleryHandle {
  goTo(index: number): void;
  step(dir: number): void;
  setPlaying(on: boolean): void;
  isPlaying(): boolean;
  dispose(): void;
}

const SP = 3.4; // 相邻作品的间距（沿长廊）
const HALF = 3.3; // 半个走廊宽
const EYE = 1.62;
const BG = new THREE.Color("#07090D");

function textCanvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d")!;
  draw(c);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const SERIF = '"Noto Serif SC","Songti SC","STSong",serif';
const LATIN = '"Cormorant Garamond","Times New Roman",serif';

/** 暖色光斑（加色混合），用来假装射灯照在墙上、地上 */
function glowTexture() {
  return textCanvas(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,226,170,0.55)");
    g.addColorStop(0.45, "rgba(255,210,140,0.18)");
    g.addColorStop(1, "rgba(255,200,120,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  });
}

function placardTexture(w: GalleryWork) {
  return textCanvas(640, 160, (c) => {
    c.fillStyle = "#1A1813";
    c.fillRect(0, 0, 640, 160);
    c.fillStyle = w.color;
    c.fillRect(0, 0, 8, 160);
    c.fillStyle = "#E9DFC6";
    c.font = `700 46px ${SERIF}`;
    let t = `《${w.title}》`;
    while (c.measureText(t).width > 590 && t.length > 4) t = t.slice(0, -3) + "…》";
    c.fillText(t, 30, 72);
    c.fillStyle = "#B49A62";
    c.font = `500 34px ${LATIN}`;
    c.fillText(w.yearText, 32, 124);
  });
}

function markerTexture(m: GalleryMarker) {
  return textCanvas(1024, 300, (c) => {
    c.clearRect(0, 0, 1024, 300);
    c.textAlign = "center";
    c.fillStyle = "rgba(217,182,106,0.85)";
    c.font = `900 120px ${SERIF}`;
    c.fillText(m.name, 512, 150);
    c.fillStyle = "rgba(217,182,106,0.6)";
    c.font = `italic 500 64px ${LATIN}`;
    c.fillText(m.sub, 512, 245);
  });
}

function placeholderTexture(w: GalleryWork) {
  return textCanvas(400, 500, (c) => {
    c.fillStyle = "#1C1B18";
    c.fillRect(0, 0, 400, 500);
    c.strokeStyle = "rgba(217,182,106,.35)";
    c.lineWidth = 4;
    c.strokeRect(24, 24, 352, 452);
    c.fillStyle = "rgba(233,223,198,.75)";
    c.textAlign = "center";
    c.font = `900 150px ${SERIF}`;
    c.fillText(w.title[0], 200, 290);
    c.font = `500 30px ${SERIF}`;
    c.fillText("暂无图片", 200, 380);
  });
}

export function createGallery(host: HTMLElement, opts: GalleryOptions): GalleryHandle {
  const N = opts.works.length;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 7, 30);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);

  // 环境光很弱，靠跟随镜头的暖光和光斑撑起氛围
  scene.add(new THREE.HemisphereLight(0x8a93b0, 0x1a1410, 0.35));
  const lamp = new THREE.PointLight(0xffd9a0, 22, 16, 1.6);
  scene.add(lamp);

  const length = (N - 1) * SP + 20;
  const zMid = -((N - 1) * SP) / 2;
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.42, metalness: 0.2 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, zMid);
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x23252b, roughness: 0.92 });
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, 5.2), wallMat);
    wall.position.set(s * HALF, 2.6, zMid);
    wall.rotation.y = -s * Math.PI / 2;
    scene.add(wall);
    // 踢脚线
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, length), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.6 }));
    base.position.set(s * (HALF - 0.02), 0.06, zMid);
    scene.add(base);
  }

  const glow = glowTexture();
  const glowMat = new THREE.MeshBasicMaterial({ map: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8c6f3a, roughness: 0.45, metalness: 0.75 });
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  type Slot = { group: THREE.Group; art: THREE.Mesh; frame: THREE.Mesh; mat: THREE.MeshBasicMaterial; side: number; z: number; full: boolean; aspect: number };
  const slots: Slot[] = [];
  const pickables: THREE.Object3D[] = [];

  const fit = (s: Slot, aspect: number) => {
    s.aspect = aspect;
    const maxH = 1.95, maxW = 2.5;
    let h = maxH, w = h * aspect;
    if (w > maxW) { w = maxW; h = w / aspect; }
    s.art.scale.set(w, h, 1);
    s.frame.scale.set(w + 0.16, h + 0.16, 1);
  };

  opts.works.forEach((w, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -i * SP;
    const group = new THREE.Group();
    group.position.set(side * (HALF - 0.03), 0, z);
    group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: placeholderTexture(w), fog: true });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    art.position.set(0, 1.85, 0.05);
    art.userData.id = w.id;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.06), frameMat);
    frame.position.set(0, 1.85, 0.02);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), glowMat);
    pool.position.set(0, 2.2, 0.01);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), new THREE.MeshBasicMaterial({ map: placardTexture(w), fog: true }));
    plaque.position.set(0, 0.62, 0.03);
    group.add(pool, frame, art, plaque);
    scene.add(group);
    const slot: Slot = { group, art, frame, mat, side, z, full: false, aspect: 0.8 };
    fit(slot, 0.8);
    slots.push(slot);
    pickables.push(art);
    // 地上的光斑
    const fpool = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), glowMat);
    fpool.rotation.x = -Math.PI / 2;
    fpool.position.set(side * (HALF - 1.1), 0.01, z);
    scene.add(fpool);
    if (w.thumb) {
      loader.load(w.thumb, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const img = tex.image as HTMLImageElement;
        mat.map?.dispose();
        mat.map = tex;
        mat.needsUpdate = true;
        fit(slot, img.width / img.height);
        need = true;
      });
    }
  });

  // 地面刻字：每个时期的入口
  opts.markers.forEach((m) => {
    const tex = markerTexture(m);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.23), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.012, -m.index * SP + 2.2);
    scene.add(mesh);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 0.025), new THREE.MeshBasicMaterial({ color: 0x8c6f3a, fog: true }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.013, -m.index * SP + 3.2);
    scene.add(line);
  });

  /* ---------- 镜头 ---------- */
  let t = opts.start ?? 0; // 当前位置（作品序号，浮点）
  let target = t;
  let playing = true;
  let focus = -1;
  let need = true;
  const SPEED = 0.22; // 自动漫步：每秒前进的作品数
  const look = new THREE.Vector3();

  const place = () => {
    const z = -t * SP + 5.2;
    const i = Math.round(t);
    const side = slots[Math.max(0, Math.min(N - 1, i))]?.side ?? 0;
    camera.position.set(Math.sin(t * 0.7) * 0.15, EYE, z);
    look.set(side * 1.1 * Math.min(1, 1 - Math.abs(t - i) * 1.4), 1.55, z - 6);
    camera.lookAt(look);
    lamp.position.set(0, 3.2, z - 2.6);
    if (i !== focus && i >= 0 && i < N) { focus = i; opts.onFocus(i); upgrade(i); }
  };

  // 靠近时换高清图
  const upgrade = (i: number) => {
    for (let k = Math.max(0, i - 1); k <= Math.min(N - 1, i + 2); k++) {
      const s = slots[k], w = opts.works[k];
      if (s.full || !w.full) continue;
      s.full = true;
      loader.load(w.full, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        s.mat.map?.dispose();
        s.mat.map = tex;
        s.mat.needsUpdate = true;
        need = true;
      });
    }
  };

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 58;
    camera.updateProjectionMatrix();
    need = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /* ---------- 交互：拖动行走、点击画框 ---------- */
  const el = renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0, lastX = 0, dragging = false, moved = false, vel = 0;
  const pick = (cx: number, cy: number) => {
    const r = el.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(pickables, false)[0]?.object;
  };
  el.addEventListener("pointerdown", (e) => {
    dragging = true; moved = false;
    downX = lastX = e.clientX; downY = e.clientY;
    host.classList.add("dragging");
  });
  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (e.target === el) el.style.cursor = pick(e.clientX, e.clientY) ? "pointer" : "";
      return;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(e.clientX - downX) > 5) moved = true;
    if (moved) {
      playing = false;
      const d = -dx / Math.max(260, el.clientWidth * 0.35);
      target = Math.max(0, Math.min(N - 1, target + d));
      vel = d;
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    host.classList.remove("dragging");
    if (!moved && Math.abs(e.clientY - downY) < 6) {
      const hit = pick(e.clientX, e.clientY);
      if (hit) opts.onPick(hit.userData.id);
    } else {
      target = Math.max(0, Math.min(N - 1, target + vel * 8)); // 惯性
    }
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  /* ---------- 渲染循环：只在可见时运行 ---------- */
  let visible = true, raf = 0, last = performance.now();
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }, { threshold: 0.01 });
  io.observe(host);
  const onVis = () => { if (!document.hidden) kick(); };
  document.addEventListener("visibilitychange", onVis);

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing && !dragging) {
      target += SPEED * dt;
      if (target >= N - 1) { target = N - 1; playing = false; }
    }
    const before = t;
    t += (target - t) * Math.min(1, dt * 3.2);
    if (Math.abs(target - t) < 0.0005) t = target;
    if (t !== before || need) { place(); renderer.render(scene, camera); need = false; }
    if (visible && !document.hidden && (playing || dragging || t !== target)) kick();
  }
  function kick() {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  place();
  renderer.render(scene, camera);
  kick();

  return {
    goTo(i) { playing = false; target = Math.max(0, Math.min(N - 1, i)); kick(); },
    step(d) { playing = false; target = Math.max(0, Math.min(N - 1, Math.round(target) + d)); kick(); },
    setPlaying(on) { playing = on; if (on && target >= N - 1) target = t = 0; kick(); },
    isPlaying: () => playing,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { (x as THREE.MeshBasicMaterial).map?.dispose(); x.dispose(); });
      });
      renderer.dispose();
      el.remove();
    },
  };
}
