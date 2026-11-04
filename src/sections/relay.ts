import { $, clamp, esc } from "../lib/dom";
import { state, actions, periodIndex, periodVar } from "../state";
import land from "../assets/relay-land.svg?raw";

// 海岸线与站点使用同一张等距经纬示意图，不引入在线地图或地图服务。
const project = (lon: number, lat: number) => ({ x: (lon + 100) * 6, y: (70 - lat) * 8 });
let dispose = () => {};

export function initRelay() {
  dispose();
  const root = $("#relay"), stops = state.t.meta.relay;
  if (!stops.length) { root.innerHTML = ""; return; }
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const cities = [...new Map(stops.flatMap(s => s.points).map(p => [p.name, p])).values()];
  const offsets: Record<string, [number, number]> = {
    "佛罗伦萨": [-12, 4], "威尼斯": [12, -10], "罗马": [12, 13],
    "沙特尔": [-12, 15], "巴黎": [12, 2], "布鲁日": [-12, -7],
    "阿姆斯特丹": [12, -9], "阿尔塔米拉": [-12, 6],
  };
  const routes = stops.map((stop, i) => i ? stops[i - 1].points.flatMap(from => stop.points.map(to => {
    const a = project(from.lon, from.lat), b = project(to.lon, to.lat);
    const arc = Math.min(100, Math.max(14, Math.abs(b.x - a.x) * .2));
    return `M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 - arc} ${b.x},${b.y}`;
  })) : []);
  root.innerHTML = `
    <div class="relay-toolbar">
      <p>从地中海到大西洋，创作与赞助的重心不断移动。</p>
      <button class="btn" data-action="play" aria-pressed="false">播放接力</button>
    </div>
    <div class="relay-body">
      <div class="relay-map">
        <svg class="relay-svg" role="group" aria-label="艺术中心接力地图">
          <g class="relay-world">
            <g class="relay-grid" aria-hidden="true">${[-80, -60, -40, -20, 0, 20, 40].map(lon => `<path d="M${project(lon, 75).x},-40V480"/>`).join("")}${[20, 30, 40, 50, 60].map(lat => `<path d="M0,${project(0, lat).y}H1000"/>`).join("")}</g>
            ${land}
            <g class="relay-routes" aria-hidden="true">${routes.map((paths, i) => paths.map(d => `<path data-route="${i}" d="${d}"/>`).join("")).join("")}</g>
            <g class="relay-active-route" aria-hidden="true"></g>
            ${cities.map((city, i) => { const p = project(city.lon, city.lat); return `<g class="relay-pin" data-city="${i}" role="button" tabindex="0" aria-label="${esc(city.name)}" transform="translate(${p.x},${p.y})"><circle class="relay-hit"/><circle class="relay-halo"/><circle class="relay-dot"/><text class="relay-city-label">${esc(city.name)}</text></g>`; }).join("")}
          </g>
        </svg>
        <div class="relay-map-tools" role="group" aria-label="地图视野">
          <button data-action="europe" aria-label="查看欧洲与地中海">欧洲 · 地中海</button>
          <button data-action="atlantic" aria-label="查看跨大西洋全景">大西洋全景</button>
          <span></span><button data-action="out" aria-label="缩小地图">−</button><button data-action="in" aria-label="放大地图">+</button>
        </div>
        <span class="relay-map-credit">海岸线：<a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener">Natural Earth</a> · 地理示意</span>
      </div>
      <div class="relay-detail" aria-live="polite"></div>
    </div>
    <div class="relay-sequence" role="group" aria-label="接力站点">${stops.map((s, i) => `<button data-stop="${i}" aria-pressed="false"><span>${String(i + 1).padStart(2, "0")}</span>${esc(state.t.periods[periodIndex(s.period)].short)}</button>`).join("")}</div>
    <p class="relay-footnote">这是一条艺术史主线的概览。各地常常同时发展，连线不代表唯一中心或直接传播路径。</p>`;
  const svg = $<SVGSVGElement>(".relay-svg", root), world = $<SVGGElement>(".relay-world", root);
  const pins = [...root.querySelectorAll<SVGGElement>(".relay-pin")];
  const play = $<HTMLButtonElement>("[data-action=play]", root);
  let selected = 0, width = 0, height = 0, playing = false, timer = 0;
  let overview = false, camera = { x: 700, y: 220, zoom: 1 };
  let drag: { id: number; x: number; y: number; cx: number; cy: number; touch: boolean } | null = null;
  let dragged = false;
  const fit = () => overview ? Math.min((width - 60) / 870, (height - 70) / 400) : Math.min((width - 58) / 350, (height - 70) / 285);
  function paint() {
    world.style.transform = `translate(${width / 2}px,${height / 2}px) scale(${camera.zoom}) translate(${-camera.x}px,${-camera.y}px)`;
    pins.forEach((pin, i) => {
      $(".relay-hit", pin).setAttribute("r", String(12 / camera.zoom));
      $(".relay-dot", pin).setAttribute("r", String(4 / camera.zoom));
      $(".relay-halo", pin).setAttribute("r", String(10 / camera.zoom));
      const label = $("text", pin), [x, y] = offsets[cities[i].name] ?? [12, 4];
      label.setAttribute("x", String(x / camera.zoom)); label.setAttribute("y", String(y / camera.zoom));
      label.setAttribute("text-anchor", x < 0 ? "end" : "start");
      label.style.fontSize = `${12 / camera.zoom}px`;
    });
    root.querySelectorAll(".relay-traveller").forEach(el => el.setAttribute("r", String(3 / camera.zoom)));
  }
  function setView(all: boolean) {
    overview = all;
    camera = { x: all ? 490 : 700, y: all ? 235 : 220, zoom: fit() };
    root.querySelectorAll<HTMLButtonElement>("[data-action=europe],[data-action=atlantic]").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.action === "atlantic") === all)));
    paint();
  }
  function stopPlayback() {
    playing = false; clearTimeout(timer);
    play.textContent = "播放接力"; play.setAttribute("aria-pressed", "false");
  }
  function schedule() {
    clearTimeout(timer);
    if (playing) timer = window.setTimeout(() => {
      if (selected === stops.length - 1) { stopPlayback(); return; }
      select(selected + 1, true); schedule();
    }, 3200);
  }
  function select(index: number, automatic = false) {
    if (!automatic) stopPlayback();
    selected = clamp(index, 0, stops.length - 1);
    const stop = stops[selected], period = state.t.periods[periodIndex(stop.period)];
    root.style.setProperty("--relay-color", periodVar(stop.period));
    pins.forEach((pin, i) => {
      const active = stop.points.some(p => p.name === cities[i].name);
      pin.classList.toggle("is-current", active); pin.setAttribute("aria-pressed", String(active));
      pin.classList.toggle("is-origin", selected > 0 && stops[selected - 1].points.some(p => p.name === cities[i].name));
    });
    root.querySelectorAll<HTMLButtonElement>("[data-stop]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.stop) === selected)));
    const related = stops.map((s, i) => ({ s, i })).filter(({ s }) => s.points.some(p => stop.points.some(q => q.name === p.name)));
    $(".relay-detail", root).innerHTML = `<span class="relay-number">${String(selected + 1).padStart(2, "0")} <small>/ ${stops.length}</small></span><p class="relay-era">${esc(stop.era)}</p><h3>${stop.place.split("、").map(s => `<span>${esc(s)}</span>`).join("、")}</h3><p class="relay-description">${esc(stop.note)}</p>${related.length > 1 ? `<div class="relay-related" aria-label="此地相关时期">${related.map(({ s, i }) => `<button data-stop="${i}" aria-pressed="${i === selected}">${esc(state.t.periods[periodIndex(s.period)].short)}</button>`).join("")}</div>` : ""}<button class="relay-hall" data-action="hall">${esc(period.short)}展厅 →</button><div class="relay-paging"><button class="btn" data-action="prev" aria-label="上一站" ${selected === 0 ? "disabled" : ""}>←</button><span>${String(selected + 1).padStart(2, "0")} / ${stops.length}</span><button class="btn" data-action="next" aria-label="下一站" ${selected === stops.length - 1 ? "disabled" : ""}>→</button></div>`;
    $(".relay-active-route", root).innerHTML = routes[selected].map(d => `<path class="relay-route-draw" pathLength="1" d="${d}"/><circle class="relay-traveller" style="offset-path:path('${d}')"/>`).join("");
    setView(stop.points.some(p => p.lon < -40));
    const button = $<HTMLButtonElement>(`.relay-sequence [data-stop="${selected}"]`, root);
    const sequence = $(".relay-sequence", root);
    sequence.scrollTo({ left: button.offsetLeft - sequence.offsetLeft - sequence.clientWidth / 2 + button.offsetWidth / 2, behavior: motion.matches ? "instant" : "smooth" });
  }
  const chooseCity = (index: number) => {
    const matches = stops.map((s, i) => s.points.some(p => p.name === cities[index].name) ? i : -1).filter(i => i >= 0);
    select(matches.includes(selected) ? selected : matches[0]);
  };
  root.onclick = e => {
    const target = e.target as Element;
    const pin = target.closest<SVGGElement>("[data-city]");
    if (pin) { if (!dragged) chooseCity(Number(pin.dataset.city)); return; }
    const button = target.closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.dataset.stop !== undefined) { select(Number(button.dataset.stop)); return; }
    switch (button.dataset.action) {
      case "play":
        if (playing) stopPlayback();
        else { if (selected === stops.length - 1) select(0); playing = true; play.textContent = "暂停接力"; play.setAttribute("aria-pressed", "true"); schedule(); }
        break;
      case "prev": select(selected - 1); break;
      case "next": select(selected + 1); break;
      case "hall": actions.goPeriod(periodIndex(stops[selected].period), true); break;
      case "europe": case "atlantic": setView(button.dataset.action === "atlantic"); break;
      case "in": case "out": camera.zoom = clamp(camera.zoom * (button.dataset.action === "in" ? 1.3 : 1 / 1.3), .25, 5); paint(); break;
    }
  };
  svg.onkeydown = e => {
    const pin = (e.target as Element).closest<SVGGElement>("[data-city]");
    if (pin && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); chooseCity(Number(pin.dataset.city)); }
  };
  svg.onpointerdown = e => {
    if (e.button !== 0 || !e.isPrimary) return;
    dragged = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: camera.x, cy: camera.y, touch: e.pointerType === "touch" };
  };
  svg.onpointermove = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragged && Math.hypot(dx, dy) < 5) return;
    if (!dragged && drag.touch && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
    dragged = true; stopPlayback(); root.classList.add("is-dragging"); svg.setPointerCapture(e.pointerId);
    camera.x = clamp(drag.cx - dx / camera.zoom, 0, 1000);
    camera.y = clamp(drag.cy - (drag.touch ? 0 : dy / camera.zoom), -40, 500);
    paint();
  };
  svg.onpointerup = svg.onpointercancel = svg.onlostpointercapture = e => {
    drag = null; root.classList.remove("is-dragging");
    if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
  };
  const resize = new ResizeObserver(() => {
    width = svg.clientWidth; height = svg.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`); setView(overview);
  });
  resize.observe(svg);
  const observer = new IntersectionObserver(([entry]) => {
    root.classList.toggle("is-offscreen", !entry.isIntersecting);
    if (!entry.isIntersecting) stopPlayback();
  });
  observer.observe(root);
  const onVisibility = () => { if (document.hidden) stopPlayback(); root.classList.toggle("is-background", document.hidden); };
  const onMotion = () => { if (motion.matches) stopPlayback(); };
  document.addEventListener("visibilitychange", onVisibility);
  motion.addEventListener("change", onMotion);
  dispose = () => { stopPlayback(); resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onMotion); };
  width = svg.clientWidth; height = svg.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  select(0);
}
