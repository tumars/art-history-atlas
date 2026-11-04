import { $, esc, prefersReducedMotion } from "../lib/dom";
import { state, actions, workById, imgSrc, whoHtml } from "../state";
import { creditLine } from "./hall";
import type { Reading } from "../types";

let active: Reading | undefined;
let step = 0;
let origin: HTMLElement | null = null;
let bound = false;
// 每次阅读保留已经看过的解释与选择；切换到另一篇时重置。
let notes = new Map<number, { revealed: boolean; choice?: number }>();

export function readingLinks(list: Reading[], label = "跟着作品看") {
  if (!list.length) return "";
  return `<div class="reading-links"><span class="label-sm">${esc(label)}</span>${list.map(r => `<button data-reading="${r.id}"><span>${esc(r.title)}</span><small>${r.minutes} 分钟 ↗</small></button>`).join("")}</div>`;
}

export const readingsForWork = (id: string) => state.t.readings.filter(r => r.steps.some(s => s.works.includes(id)));
export const readingsForPerson = (id: string) => state.t.readings.filter(r => r.people.includes(id));
export const readingForRelation = (a: string, b: string) => state.t.readings.find(r => r.relations?.some(pair => pair.includes(a) && pair.includes(b)));

function renderShelf() {
  const stories = state.t.readings.filter(r => r.kind === "story");
  const shelf = $("#reading-shelf");
  shelf.hidden = !stories.length;
  shelf.innerHTML = `<div class="reading-invitation"><span class="label-sm">从一个问题开始</span><h3>留三分钟，读懂一处细节。</h3><p>先看，再试着找一找。带着自己的发现走进展厅。</p></div><div class="reading-menu">${stories.map((r, i) => `<button data-reading="${r.id}"><span class="reading-no">${String(i + 1).padStart(2, "0")}</span><span><b>${esc(r.title)}</b><small>${esc(r.deck)}</small></span><span class="reading-time">${r.minutes}′ ↗</span></button>`).join("")}</div>`;
}

export function renderHallReadings(period: string) {
  const list = state.t.readings.filter(r => r.periods.includes(period));
  $("#hall-readings").innerHTML = readingLinks(list, period === "modern" ? "现代艺术的四条路 · 可以从任意一条开始" : "本厅的看画故事");
}

function imageFigure(id: string, index: number) {
  const w = workById(id)!;
  const src = imgSrc(w, "full");
  const details = active!.steps[step].details?.filter(d => d.work === id) ?? [];
  return `<figure class="reading-work">
    <div class="reading-image" data-image="${id}">${src ? `<img src="${src}" alt="${esc(w.artist)}《${esc(w.title)}》" decoding="async">` : `<p>暂无图像，请阅读作品资料。</p>`}
      ${src ? details.map((d, i) => `<button class="reading-spot" data-detail="${active!.steps[step].details!.indexOf(d)}" style="left:${d.x}%;top:${d.y}%" aria-label="放大观察：${esc(d.label)}">${i + 1}</button>`).join("") : ""}
    </div>
    <figcaption><span class="label-sm">${active!.steps[step].works.length > 1 ? `${index + 1} / ` : ""}${esc(w.yearText)}</span><h4>《${esc(w.title)}》</h4><div>${whoHtml(w)}</div>
      <div class="reading-image-tools">${src ? `<button class="btn" data-reading-work="${id}">查看大图</button>` : ""}<button class="btn reading-reset" data-reset="${id}" hidden>回到全图</button></div>
      ${creditLine(w)}
    </figcaption></figure>`;
}

function renderStep(focus = false) {
  if (!active) return;
  const r = active, s = r.steps[step], n = notes.get(step) ?? { revealed: false };
  const last = step === r.steps.length - 1;
  const root = $("#reading");
  root.hidden = false;
  root.innerHTML = `<header class="reading-head"><div><span class="label-sm">${r.kind === "route" ? "主题路线" : "三分钟看画"} · ${r.minutes} 分钟</span><h3>${esc(r.title)}</h3></div><button class="btn" data-close-reading>收起阅读 ×</button></header>
    <nav class="reading-steps" aria-label="阅读步骤">${r.steps.map((s, i) => `<button data-step="${i}" aria-current="${i === step ? "step" : "false"}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.title)}</button>`).join("")}</nav>
    <div class="reading-body"><div class="reading-pictures ${s.works.length > 1 ? "is-pair" : ""}">${s.works.map(imageFigure).join("")}</div>
      <div class="reading-copy"><span class="label-sm">${step + 1} / ${r.steps.length} · 观察一下</span><h4 id="reading-step-title" tabindex="-1">${esc(s.title)}</h4><p class="reading-prompt">${esc(s.prompt)}</p>
      ${s.details?.length ? `<div class="reading-detail-list" role="group" aria-label="选择一个局部">${s.details.map((d, i) => `<button class="btn" data-detail="${i}" aria-pressed="false">${esc(d.label)}</button>`).join("")}</div><p class="reading-detail-note" aria-live="polite"></p>` : ""}
      ${s.choices?.length ? `<fieldset class="reading-choices"><legend>你的第一感觉是？没有标准答案。</legend>${s.choices.map((c, i) => `<button data-choice="${i}" aria-pressed="${n.choice === i}">${esc(c.label)}</button>`).join("")}</fieldset><p class="reading-response" aria-live="polite">${n.choice !== undefined ? esc(s.choices[n.choice].response) : ""}</p>` : ""}
      <button class="btn reading-reveal" data-reveal aria-expanded="${n.revealed}" aria-controls="reading-context">${n.revealed ? "收起解读" : "看看解读与背景"}</button>
      <div id="reading-context" class="reading-context" ${n.revealed ? "" : "hidden"}><span class="label-sm">再看一眼</span><p>${esc(s.context)}</p></div>
      <p class="reading-skip">可以直接继续，也可以随时回看。</p>
      </div></div>
    <footer class="reading-footer"><div class="reading-navigation"><button class="btn" data-prev-step ${step === 0 ? "disabled" : ""}>← 上一步</button><span>${step + 1} / ${r.steps.length}</span>${last ? `<button class="btn" data-step="0">重新看一遍 ↺</button>` : `<button class="btn" data-next-step>继续看 →</button>`}</div>
      ${last ? `<div class="reading-next"><span class="label-sm">带着这个问题，去看下一件</span>${r.next.map(n => `<button data-next-work="${n.work}">${esc(n.label)} →</button>`).join("")}</div>` : ""}
      <details class="reading-sources"><summary>资料出处 · ${r.sources.length} 项</summary><ul>${r.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join("")}</ul><p>画面观察与比较由本站整理；有争议的解释不作为唯一答案。</p></details></footer>`;
  if (focus) {
    $("#reading-step-title").focus({ preventScroll: true });
    root.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

export function openReading(id: string) {
  const r = state.t.readings.find(r => r.id === id);
  if (!r) return;
  if (!$("#lightbox").hidden) $("#lb-close").click();
  if (!$("#reading").contains(document.activeElement)) origin = document.activeElement as HTMLElement;
  active = r; step = 0; notes = new Map();
  history.replaceState(null, "", `#story-${r.id}`);
  renderStep(true);
}

export function initReadings() {
  renderShelf();
  if (active) {
    active = state.t.readings.find(r => r.id === active!.id);
    if (active) renderStep(); else $("#reading").hidden = true;
  }
  if (bound) return;
  bound = true;
  document.addEventListener("click", e => {
    const b = (e.target as Element).closest<HTMLElement>("[data-reading]");
    if (b) openReading(b.dataset.reading!);
  });
  $("#reading").onclick = e => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button");
    if (!b || !active) return;
    const s = active.steps[step];
    if (b.hasAttribute("data-close-reading")) {
      $("#reading").hidden = true; active = undefined;
      history.replaceState(null, "", "#readings");
      if (origin?.isConnected) origin.focus();
      return;
    }
    if (b.dataset.step !== undefined || b.hasAttribute("data-next-step") || b.hasAttribute("data-prev-step")) {
      step = b.dataset.step !== undefined ? +b.dataset.step : step + (b.hasAttribute("data-next-step") ? 1 : -1);
      renderStep(true); return;
    }
    if (b.dataset.readingWork) return actions.openWork(b.dataset.readingWork, true, s.works);
    if (b.dataset.nextWork) return actions.showWork(b.dataset.nextWork);
    if (b.dataset.detail !== undefined) {
      const d = s.details![+b.dataset.detail];
      document.querySelectorAll<HTMLElement>("#reading .reading-image").forEach(el => {
        const hit = el.dataset.image === d.work;
        el.classList.toggle("is-detail", hit);
        const img = el.querySelector("img");
        if (img) { img.style.transformOrigin = `${d.x}% ${d.y}%`; img.style.transform = hit ? "scale(2)" : ""; }
      });
      document.querySelectorAll<HTMLElement>("#reading [data-reset]").forEach(el => el.hidden = el.dataset.reset !== d.work);
      document.querySelectorAll<HTMLElement>("#reading .reading-detail-list button").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.detail === b.dataset.detail)));
      $("#reading .reading-detail-note").textContent = d.note;
      document.querySelector<HTMLElement>(`#reading [data-image="${d.work}"]`)!.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      return;
    }
    if (b.dataset.reset) {
      const el = document.querySelector<HTMLElement>(`#reading [data-image="${b.dataset.reset}"]`)!;
      el.classList.remove("is-detail"); el.querySelector("img")!.style.transform = "";
      b.hidden = true;
      document.querySelectorAll("#reading .reading-detail-list button").forEach(el => el.setAttribute("aria-pressed", "false"));
      $("#reading .reading-detail-note").textContent = "回到全图，再看看局部与整体的关系。";
      $("#reading-step-title").focus({ preventScroll: true });
      return;
    }
    const n = notes.get(step) ?? { revealed: false };
    if (b.dataset.choice !== undefined) {
      n.choice = +b.dataset.choice;
      document.querySelectorAll<HTMLElement>("#reading [data-choice]").forEach(el => el.setAttribute("aria-pressed", String(el === b)));
      $("#reading .reading-response").textContent = s.choices![n.choice].response;
    }
    if (b.hasAttribute("data-reveal")) {
      n.revealed = !n.revealed;
      $("#reading-context").hidden = !n.revealed;
      b.setAttribute("aria-expanded", String(n.revealed));
      b.textContent = n.revealed ? "收起解读" : "看看解读与背景";
    }
    notes.set(step, n);
  };
  const fromHash = () => {
    const m = location.hash.match(/^#story-([\w-]+)$/);
    if (m) openReading(m[1]);
  };
  addEventListener("hashchange", fromHash);
  fromHash();
}
