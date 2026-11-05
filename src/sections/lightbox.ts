import { loadProgressiveImage, clearProgressiveImage } from "../lib/image-loading";
import { $, esc, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { whoHtml } from "../state";
import { state, actions, workById, periodOf, imgSrc, hasImage } from "../state";
import { readingLinks, readingsForWork } from "./readings";
import { workSources } from "./hall";
import { navigate, navigationActive, registerNavigation, returnToOrigin } from "../lib/navigation";

/* 大图：左图右文；在当前列表里前后切换；点图在“适应屏幕 / 原始大小”之间切换 */
let list: string[] = [];
let idx = 0;
let canGo = true;
let lastFocus: Element | null = null;

function show() {
  const w = workById(list[idx]);
  if (!w) return;
  const stage = $("#lb-stage"), img = $<HTMLImageElement>("#lb-img"), none = $("#lb-none");
  stage.classList.remove("zoomed");
  $("#lb-zoom").textContent = "放大";
  $("#lb-zoom").setAttribute("aria-pressed", "false");
  stage.scrollTo(0, 0);
  const ok = hasImage(w);
  img.hidden = !ok;
  none.hidden = ok;
  if (ok) {
    const size = state.credits[w.id].optimized;
    if (size) { img.width = size.width; img.height = size.height; }
    else { img.removeAttribute("width"); img.removeAttribute("height"); }
    loadProgressiveImage(img, imgSrc(w, "thumb")!, imgSrc(w, "full")!);
    img.alt = `《${w.title}》`;
  } else {
    clearProgressiveImage(img);
    const why = w.noImageReason ?? "暂时没有对应图片。";
    none.innerHTML = `<b>${esc(w.title[0])}</b><span>${esc(why)}</span><a href="${wikiSearch(w.title)}" target="_blank" rel="noopener">中文维基百科 ↗</a>`;
  }
  const c = state.credits[w.id];
  const credit = ok && c ? `<span class="lb-credit">图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">图片来源</a></span>` : "";
  $("#lb-cap").innerHTML = `<div class="who">${whoHtml(w)}</div><h3>《${esc(w.title)}》</h3>
    <details class="lb-details" ${matchMedia("(max-width:700px)").matches ? "" : "open"}><summary>作品介绍与来源</summary>
    <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
    <p>${esc(w.summary)}</p>
    ${readingLinks(readingsForWork(w.id), "跟着作品看")}
    ${ok && w.imageNote ? `<p class="credit-line">${esc(w.imageNote)}</p>` : ""}
      ${w.source ? `<p><a href="${esc(w.source)}" target="_blank" rel="noopener">作品资料 ↗</a></p>` : ""}${workSources(w)}${credit}</details>`;
  const multi = list.length > 1;
  $("#lb-prev").hidden = $("#lb-next").hidden = $("#lb-count").hidden = !multi;
  $("#lb-count").textContent = `${idx + 1} / ${list.length}`;
  const go = $("#lb-go");
  go.hidden = !canGo;
  go.textContent = `去「${periodOf(w.period).short}」展厅`;
  const box = $("#lightbox");
  if (!prefersReducedMotion()) { box.classList.remove("enter"); void box.offsetWidth; box.classList.add("enter"); }
}

export function openWork(id: string, go: boolean, ids?: string[]) {
  if (!workById(id)) return;
  if (!navigationActive()) return navigate(() => openWork(id, go, ids));
  list = ids && ids.includes(id) ? ids : [id];
  idx = list.indexOf(id);
  canGo = go;
  lastFocus = document.activeElement;
  $("#lightbox").hidden = false;
  if (!$<HTMLDialogElement>("#lightbox").open) $<HTMLDialogElement>("#lightbox").showModal();
  document.body.style.overflow = "hidden";
  show();
  $("#lb-close").focus();
}

export function dismissWork() {
  $("#lightbox").hidden = true;
  $<HTMLDialogElement>("#lightbox").close();
  clearProgressiveImage($<HTMLImageElement>("#lb-img"));
  document.body.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  (lastFocus as HTMLElement | null)?.focus?.({ preventScroll: true });
}

const step = (d: number) => { if (list.length > 1) { idx = (idx + d + list.length) % list.length; show(); } };

export function initLightbox() {
  registerNavigation("lightbox", () => {
    const visible = !$("#lightbox").hidden, ids = [...list], index = idx, go = canGo;
    const zoomed = $("#lb-stage").classList.contains("zoomed");
    return () => {
      if (visible) { openWork(ids[index], go, ids); if (zoomed) $("#lb-zoom").click(); }
      else dismissWork();
    };
  });
  const close = () => returnToOrigin(dismissWork);
  $("#lb-close").onclick = close;
  $<HTMLDialogElement>("#lightbox").oncancel = e => { e.preventDefault(); close(); };
  const zoom = () => {
    const on = $("#lb-stage").classList.toggle("zoomed");
    $("#lb-zoom").textContent = on ? "适应屏幕" : "放大";
    $("#lb-zoom").setAttribute("aria-pressed", String(on));
  };
  $("#lb-zoom").onclick = zoom;
  $("#lb-prev").onclick = () => step(-1);
  $("#lb-next").onclick = () => step(1);
  $("#lb-stage").onclick = (e) => {
    const t = e.target as Element;
    if (t.id === "lb-img") zoom();
  };
  $("#lb-go").onclick = () => {
    const id = list[idx];
    navigate(() => { dismissWork(); document.querySelector<HTMLDialogElement>("#search-dialog")?.close(); actions.showWork(id); document.body.style.overflow = ""; });
  };
  $("#lightbox").addEventListener("keydown", (e) => {
    e.stopPropagation();
    if ($("#lightbox").hidden) return;
    if (e.key === "Tab") {
      const stops = [...$("#lightbox").querySelectorAll<HTMLElement>('button:not([disabled]),a[href],summary,[tabindex="0"]')].filter(el => el.getClientRects().length > 0);
      const first = stops[0], last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });
}
