import { $, esc, wikiSearch, prefersReducedMotion } from "../lib/dom";
import { whoHtml } from "../state";
import { state, actions, workById, periodOf, imgSrc, hasImage } from "../state";

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
  stage.scrollTo(0, 0);
  const ok = hasImage(w);
  img.hidden = !ok;
  none.hidden = ok;
  if (ok) {
    img.src = imgSrc(w, "full")!;
    img.alt = `《${w.title}》`;
    img.onerror = () => (img.hidden = true);
  } else {
    img.removeAttribute("src");
    const why = w.copyright ? `${w.copyright}，本站不放图片。` : "暂时没有可用的公有领域图片。";
    none.innerHTML = `<b>${esc(w.title[0])}</b><span>${esc(why)}</span><a href="${wikiSearch(w.title)}" target="_blank" rel="noopener">到维基百科看图 ↗</a>`;
  }
  const c = state.credits[w.id];
  const credit = ok && c ? `<span class="lb-credit">图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">维基共享资源</a></span>` : "";
  $("#lb-cap").innerHTML = `<div class="who">${whoHtml(w)}</div><h3>《${esc(w.title)}》</h3>
    <div class="meta"><span>${esc(w.yearText)}</span><span>${esc(w.medium)}</span><span>${esc(w.location)}</span></div>
    <p>${esc(w.summary)}</p>${credit}`;
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
  list = ids && ids.includes(id) ? ids : [id];
  idx = list.indexOf(id);
  canGo = go;
  lastFocus = document.activeElement;
  $("#lightbox").hidden = false;
  document.body.style.overflow = "hidden";
  show();
  $("#lb-close").focus();
}

function close() {
  $("#lightbox").hidden = true;
  $("#lb-img").removeAttribute("src");
  document.body.style.overflow = "";
  (lastFocus as HTMLElement | null)?.focus?.();
}

const step = (d: number) => { if (list.length > 1) { idx = (idx + d + list.length) % list.length; show(); } };

export function initLightbox() {
  $("#lb-close").onclick = close;
  $("#lb-prev").onclick = () => step(-1);
  $("#lb-next").onclick = () => step(1);
  $("#lb-stage").onclick = (e) => {
    const t = e.target as Element;
    if (t.id === "lb-img") $("#lb-stage").classList.toggle("zoomed");
    else if (t.id === "lb-stage") close();
  };
  $("#lb-go").onclick = () => {
    const id = list[idx];
    close();
    actions.showWork(id);
  };
  document.addEventListener("keydown", (e) => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });
}
