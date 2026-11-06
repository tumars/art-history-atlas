import { renderGraph, highlightGraph, clearGraphHighlight, buildEdges, KINDS } from "../sections/people-graph";
import { state, portraitSrc } from "../state";
import { esc } from "../lib/dom";

export interface NetworkView {
  school?: string;
  outside?: boolean;
  selected?: string;
  x?: number;
  y?: number;
  scale?: number;
}

export function peopleNetwork() {
  return `<section class="mobile-network" aria-label="完整人物关系网络">
    <div class="network-controls"><label class="network-locate"><span>定位人物</span><select data-network-locate aria-label="定位人物"></select></label>
    <details class="network-settings"><summary>筛选</summary><div class="network-settings-body">
      <div class="graph-filters"><label>派系 <select id="graph-school" aria-label="关系图派系"></select></label>
      <label class="graph-outside"><input type="checkbox" id="graph-outside">显示跨派系关系</label></div>
      <div id="graph-context" class="graph-context"></div>
      <div id="graph-legend" class="graph-legend" aria-label="显示的关系类型"></div>
      <button data-network-done>完成筛选</button>
    </div></details></div>
    <div class="network-toolbar"><span data-network-status>拖动浏览 · 双指缩放</span><div><button data-graph-zoom="selected" aria-label="定位选中人物">定位</button><button data-graph-zoom="out" aria-label="缩小关系图">−</button><button data-graph-zoom="in" aria-label="放大关系图">＋</button><button data-graph-zoom="fit">总览</button></div></div>
    <div class="network-viewport" tabindex="0" role="group" aria-label="人物关系画布，方向键平移，加减键缩放"><svg id="graph-svg" class="graph" role="group" aria-label="完整人物关系图"></svg></div>
    <div class="network-detail" aria-live="polite"></div>
  </section>`;
}

export function mountNetwork(root: HTMLElement, saved: NetworkView, save: (view: NetworkView) => void) {
  const host = root.querySelector<HTMLElement>(".mobile-network");
  if (!host) return () => {};
  const viewport = host.querySelector<HTMLElement>(".network-viewport")!;
  const svg = host.querySelector<SVGSVGElement>("#graph-svg")!;
  const detail = host.querySelector<HTMLElement>(".network-detail")!;
  const locate = host.querySelector<HTMLSelectElement>("[data-network-locate]")!;
  const settings = host.querySelector<HTMLDetailsElement>(".network-settings")!;
  const view = { ...saved };
  const allEdges = buildEdges();
  let x = 0, y = 0, scale = 1, minScale = .2, width = 1000, height = 640;
  const persist = () => save({ ...view, x, y, scale });
  const paint = () => {
    x = width * scale <= viewport.clientWidth ? (viewport.clientWidth-width*scale)/2 : Math.max(viewport.clientWidth-width*scale-32,Math.min(32,x));
    y = height * scale <= viewport.clientHeight ? (viewport.clientHeight-height*scale)/2 : Math.max(viewport.clientHeight-height*scale-32,Math.min(32,y));
    svg.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    host.classList.toggle("network-overview", scale < .8);
    host.querySelector<HTMLElement>("[data-network-status]")!.textContent = scale < .8 ? "总览 · 点人物放大" : "拖动浏览 · 双指缩放";
  };
  const fit = () => {
    scale = minScale;
    x = (viewport.clientWidth - width * scale) / 2;
    y = (viewport.clientHeight - height * scale) / 2;
    paint();
  };
  const size = () => {
    width = svg.viewBox.baseVal.width;
    height = svg.viewBox.baseVal.height;
    svg.style.width = `${width}px`; svg.style.height = `${height}px`;
    svg.style.minWidth = "0"; svg.style.maxWidth = "none";
    minScale = Math.min(viewport.clientWidth / width, viewport.clientHeight / height);
    // The desktop story edges use the mobile story route here.
    svg.querySelectorAll<SVGElement>("[data-reading]").forEach(el => { el.dataset.story = el.dataset.reading; });
  };
  const center = (id: string) => {
    const node = svg.querySelector<SVGGElement>(`[data-p="${CSS.escape(id)}"]`);
    if (!node) return;
    const pos = node.transform.baseVal.getItem(0).matrix;
    scale = Math.max(scale,1.6);
    x = viewport.clientWidth/2-pos.e*scale;
    y = viewport.clientHeight/2-pos.f*scale;
    paint();
  };
  const hint = () => {
    detail.innerHTML = '<h3>完整网络，自由探索</h3><p>从上方定位人物，或点图中头像放大。<br>全部人物和关系始终保留，可随时回到总览。</p>';
  };
  const updateLocate = () => {
    locate.innerHTML = '<option value="">选择人物…</option>' + [...svg.querySelectorAll<SVGGElement>(".nd")].map(el => {
      const p = state.t.people.find(p => p.id === el.dataset.p)!;
      return `<option value="${p.id}">${esc(p.name)}</option>`;
    }).join("");
    locate.value = view.selected || "";
  };
  const pick = (id: string, move = true) => {
    const p = state.t.people.find(p => p.id === id)!;
    view.selected = id;
    locate.value = id;
    highlightGraph({ kind:"person", id });
    const visible = new Set([...svg.querySelectorAll<SVGGElement>(".nd")].map(el => el.dataset.p));
    const enabled = new Set([...host.querySelectorAll<HTMLElement>("#graph-legend [aria-pressed=true]")].map(el => el.dataset.k));
    const related = allEdges.filter(e => (e.a === id || e.b === id) && visible.has(e.a) && visible.has(e.b) && enabled.has(e.kind));
    const src = portraitSrc(p, "thumb");
    detail.innerHTML = `<div class="network-person">${src ? `<img src="${esc(src)}" alt="">` : ""}<div><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p></div><button data-person="${p.id}">生平 →</button></div><div class="network-relations">${related.map(e => {
      const other = state.t.people.find(p => p.id === (e.a === id ? e.b : e.a))!;
      const a = state.t.people.find(p => p.id === e.a)!;
      const b = state.t.people.find(p => p.id === e.b)!;
      return `<button data-graph-person="${other.id}"><span>${esc(a.name)} ${KINDS.find(k => k.kind === e.kind)!.verb} ${esc(b.name)}</span>${e.note ? `<small>${esc(e.note)}</small>` : ""}</button>`;
    }).join("") || "<p>当前范围和筛选下暂无已收录关系。</p>"}</div>`;
    if (move) center(id);
    persist();
  };
  renderGraph(pick, school => {
    view.school = school;
    view.outside = host.querySelector<HTMLInputElement>("#graph-outside")!.checked;
    view.selected = undefined;
    hint();
    size(); updateLocate(); fit(); persist();
  }, {root:host, school:view.school, outside:view.outside});
  // Touch hover must not override the selected person's highlight.
  svg.onpointerover = null;
  svg.onpointerleave = null;
  size(); updateLocate(); hint();
  if (saved.scale) { scale = Math.max(minScale, Math.min(3, saved.scale)); x = saved.x ?? 0; y = saved.y ?? 0; paint(); }
  else fit();
  if (view.selected && svg.querySelector(`[data-p="${CSS.escape(view.selected)}"]`)) pick(view.selected, false);
  else if (!saved.scale) pick("leonardo");
  const zoom = (factor: number, cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2) => {
    const next = Math.max(minScale, Math.min(3, scale * factor));
    x = cx - (cx - x) * next / scale;
    y = cy - (cy - y) * next / scale;
    scale = next; paint();
  };
  const points = new Map<number, {x:number; y:number}>();
  let moved = false;
  let travel = 0;
  let previous = {x:0,y:0,d:0};
  const gesture = () => {
    const p = [...points.values()];
    return p.length > 1 ? {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)} : {...p[0],d:0};
  };
  viewport.onpointerdown = e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!points.size) { moved = false; travel = 0; }
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    previous = gesture();
    if (points.size > 1) moved = true;
  };
  viewport.onpointermove = e => {
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const now = gesture();
    const dx = now.x - previous.x, dy = now.y - previous.y;
    travel += Math.hypot(dx,dy);
    if (travel > 6 || points.size > 1) {
      moved = true;
      viewport.setPointerCapture(e.pointerId);
      const rect = viewport.getBoundingClientRect();
      if (previous.d && now.d) zoom(now.d/previous.d,previous.x-rect.left,previous.y-rect.top);
      x += dx; y += dy; paint();
    }
    previous = now;
  };
  const release = (e: PointerEvent) => {
    points.delete(e.pointerId);
    if (points.size) previous = gesture();
    else persist();
  };
  viewport.onpointerup = release;
  viewport.onpointercancel = release;
  viewport.onlostpointercapture = e => {
    // Implicit touch capture moves from a node to the viewport during a drag.
    if (e.target === viewport && points.has(e.pointerId)) release(e);
  };
  const preventDragClick = (e: MouseEvent) => {
    if (moved && e.detail !== 0) { e.preventDefault(); e.stopImmediatePropagation(); }
  };
  viewport.addEventListener("click",preventDragClick,true);
  locate.onchange = () => { if (locate.value) pick(locate.value); };
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest("[data-network-done]")) {
      settings.open = false;
      settings.querySelector("summary")!.focus();
      return;
    }
    const button = (e.target as Element).closest<HTMLElement>("[data-graph-zoom],[data-graph-person]");
    if (!button) {
      if ((e.target as Element).closest("#graph-legend") && view.selected) pick(view.selected, false);
      return;
    }
    if (button.dataset.graphPerson) {
      pick(button.dataset.graphPerson);
    } else {
      if (button.dataset.graphZoom === "fit") {
        view.selected = undefined; locate.value = ""; clearGraphHighlight(); hint(); fit();
      } else if (button.dataset.graphZoom === "selected") {
        if (view.selected) center(view.selected); else pick(svg.querySelector<SVGGElement>('[data-p="leonardo"]') ? "leonardo" : svg.querySelector<SVGGElement>(".nd")!.dataset.p!);
      }
      else zoom(button.dataset.graphZoom === "in" ? 1.5 : 1/1.5);
      persist();
    }
  };
  host.addEventListener("click",onClick);
  viewport.onkeydown = e => {
    if ((e.target as Element).closest("[data-reading]")) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); (e.target as SVGElement).dispatchEvent(new MouseEvent("click",{bubbles:true})); }
      return;
    }
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","-","="].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "+" || e.key === "=") zoom(1.5);
    else if (e.key === "-") zoom(1/1.5);
    else { x += e.key === "ArrowLeft" ? 50 : e.key === "ArrowRight" ? -50 : 0; y += e.key === "ArrowUp" ? 50 : e.key === "ArrowDown" ? -50 : 0; paint(); }
    persist();
  };
  // Avoid the desktop key handler opening a hidden desktop story reader.
  svg.onkeydown = e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).dispatchEvent(new MouseEvent("click",{bubbles:true}));
  };
  let previousWidth = viewport.clientWidth, previousHeight = viewport.clientHeight;
  const resize = new ResizeObserver(() => {
    const changed = previousWidth !== viewport.clientWidth || previousHeight !== viewport.clientHeight;
    previousWidth = viewport.clientWidth; previousHeight = viewport.clientHeight;
    size(); scale = Math.max(minScale,scale);
    if (changed && view.selected) center(view.selected); else paint();
    persist();
  });
  resize.observe(viewport);
  return () => { resize.disconnect(); host.removeEventListener("click",onClick); viewport.removeEventListener("click",preventDragClick,true); };
}
