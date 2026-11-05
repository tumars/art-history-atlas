/** 保存站内阅读上下文；只在用户进入另一处内容时增加历史项。 */
type Snapshot = { restore: (() => void)[]; x: number; y: number; focus: HTMLElement | null };
const readers = new Map<string, () => () => void>();
const snapshots = new Map<number, Snapshot>();
let current = 0, serial = 0, busy = false, ready = false, restoring = false;
export const navigationActive = () => busy || !ready;
export const restoringNavigation = () => restoring;
export const registerNavigation = (name: string, capture: () => () => void) => readers.set(name, capture);
const capture = (): Snapshot => ({ restore: [...readers.entries()].sort(([a], [b]) => Number(a === "lightbox") - Number(b === "lightbox")).map(([, fn]) => fn()), x: scrollX, y: scrollY, focus: document.activeElement as HTMLElement });

export function navigate(action: () => void) {
  if (navigationActive()) { action(); return; }
  snapshots.set(current, capture());
  const previousUrl = location.href;
  busy = true;
  try { action(); } finally { busy = false; }
  const nextUrl = location.href;
  history.replaceState({ atlas: current }, "", previousUrl);
  current = ++serial;
  history.pushState({ atlas: current }, "", nextUrl);
  snapshots.set(current, capture());
}

/** 深链接首次进入没有站内前项，关闭时直接回到所属页面。 */
export function returnToOrigin(fallback: () => void) {
  if (ready && !busy && current > 0 && snapshots.has(current - 1)) history.back();
  else fallback();
}

export function initNavigation() {
  ready = true;
  history.replaceState({ atlas: current }, "");
  history.scrollRestoration = "manual";
  addEventListener("popstate", e => {
    const saved = snapshots.get(e.state?.atlas);
    if (!saved) return;
    snapshots.set(current, capture());
    current = e.state.atlas;
    busy = true;
    restoring = true;
    // 先收起模态，再按快照顺序恢复，避免旧顶层窗口挡住新内容。
    document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach(d => d.close());
    saved.restore.forEach(fn => fn());
    document.body.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
    requestAnimationFrame(() => {
      saved.focus?.isConnected && saved.focus.focus({ preventScroll: true });
      window.scrollTo({ left: saved.x, top: saved.y, behavior: "instant" });
      setTimeout(() => { busy = false; restoring = false; }, 0);
    });
  });
}
