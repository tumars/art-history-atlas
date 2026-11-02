import { $, esc, wikiSearch } from "../lib/dom";
import { state, actions, workById, periodOf, imgSrc, hasImage } from "../state";
import type { Work } from "../types";

/* 大图：图片、展签、署名；可跳到所在展厅 */
let current: Work | null = null;

export function openWork(id: string, canGo: boolean) {
  const w = workById(id);
  if (!w) return;
  current = w;
  const img = $<HTMLImageElement>("#lb-img"), none = $("#lb-none");
  const ok = hasImage(w);
  img.hidden = !ok;
  none.hidden = ok;
  if (ok) {
    img.src = imgSrc(w, "full")!;
    img.alt = `《${w.title}》`;
    img.onerror = () => (img.hidden = true);
  } else {
    const why = w.copyright ? `${w.copyright}，本站不放图片。` : "暂时没有可用的公有领域图片。";
    none.innerHTML = `<b>${esc(w.title[0])}</b><span>${esc(why)}</span><a href="${wikiSearch(w.title)}" target="_blank" rel="noopener">到维基百科看图 ↗</a>`;
  }
  const c = state.credits[w.id];
  const credit = ok && c ? `<span class="lb-credit">图片：${esc(c.author)} · ${c.licenseUrl ? `<a href="${c.licenseUrl}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)} · <a href="${c.source}" target="_blank" rel="noopener">维基共享资源</a></span>` : "";
  $("#lb-cap").innerHTML = `<b>《${esc(w.title)}》</b>${esc(w.artist)} · ${esc(w.yearText)} · ${esc(w.location)}<br>${esc(w.summary)}${credit}`;
  const go = $("#lb-go");
  go.hidden = !canGo;
  go.textContent = `去「${periodOf(w.period).short}」展厅`;
  $("#lightbox").hidden = false;
  $("#lb-close").focus();
}

function close() {
  $("#lightbox").hidden = true;
  $("#lb-img").removeAttribute("src");
}

export function initLightbox() {
  $("#lb-close").onclick = close;
  $("#lightbox").onclick = (e) => {
    const id = (e.target as Element).id;
    if (id === "lightbox" || id === "lb-img") close();
  };
  $("#lb-go").onclick = () => {
    const w = current;
    close();
    if (w) actions.showWork(w.id);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#lightbox").hidden) close();
  });
}
