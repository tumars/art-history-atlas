export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T =>
  root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  [...root.querySelectorAll<T>(sel)];

export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** localStorage 读写，隐私模式等场景下失败也不影响页面 */
export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* 忽略 */
    }
  },
};

export const wikiSearch = (t: string) => "https://zh.wikipedia.org/w/index.php?search=" + encodeURIComponent(t) + "&variant=zh-cn";

export function svgPt(svg: SVGSVGElement, ev: { clientX: number; clientY: number }) {
  const p = svg.createSVGPoint();
  p.x = ev.clientX;
  p.y = ev.clientY;
  return p.matrixTransform(svg.getScreenCTM()!.inverse());
}

/** 在 SVG 上按下并拖动，持续回调指针位置（SVG 坐标） */
export function dragOn(svg: SVGSVGElement, fn: (p: DOMPoint) => void) {
  svg.classList.add("drag");
  svg.addEventListener("pointerdown", (e) => {
    svg.setPointerCapture(e.pointerId);
    fn(svgPt(svg, e));
    const mv = (ev: PointerEvent) => fn(svgPt(svg, ev));
    const up = () => {
      svg.removeEventListener("pointermove", mv);
      svg.removeEventListener("pointerup", up);
      svg.removeEventListener("pointercancel", up);
    };
    svg.addEventListener("pointermove", mv);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
  });
}

/** 分段按钮 */
export const seg = (id: string, opts: [string, string][], cur: string) =>
  `<div class="seg" role="group" id="${id}">${opts
    .map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === cur}">${l}</button>`)
    .join("")}</div>`;

export function bindSeg(root: ParentNode, id: string, fn: (v: string) => void) {
  const g = root.querySelector<HTMLElement>("#" + id)!;
  g.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (!b) return;
    $$("button", g).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    fn(b.dataset.v!);
  });
}

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
