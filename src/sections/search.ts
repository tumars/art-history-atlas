import { $, esc } from "../lib/dom";
import { searchCatalog, type SearchKind } from "../lib/search";
import { actions, imgSrc, portraitSrc, state } from "../state";
import "../styles/search.css";
import { navigate, navigationActive, registerNavigation, returnToOrigin } from "../lib/navigation";

export function initSearch() {
  document.body.insertAdjacentHTML("beforeend", `<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title">
    <div class="search-head"><h2 id="search-title">找一幅作品，认识一个人</h2><button class="icon-btn" id="search-close" aria-label="关闭搜索">×</button></div>
    <label class="search-label" for="catalog-query">作品名、作者或人物中英文名</label>
    <input id="catalog-query" class="catalog-query" type="search" placeholder="试试：星月夜、梵高、Monet" autocomplete="off" autofocus>
    <div class="seg search-filters" role="group" aria-label="搜索类型">
      <button data-kind="all" aria-pressed="true">全部</button><button data-kind="work" aria-pressed="false">作品</button><button data-kind="person" aria-pressed="false">人物</button>
    </div>
    <p id="search-status" class="search-status" role="status" aria-live="polite"></p>
    <div id="search-results" class="search-results"></div>
  </dialog>`);
  const dialog = $<HTMLDialogElement>("#search-dialog");
  const input = $<HTMLInputElement>("#catalog-query");
  const results = $("#search-results");
  let kind: SearchKind = "all";
  let workIds: string[] = [];
  let previousOverflow = "";
  const render = () => {
    const matches = searchCatalog(state.t, input.value, kind);
    workIds = matches.filter(r => r.kind === "work").map(r => r.id);
    $("#search-status").textContent = !input.value.trim() ? "输入名称，检索本站收录的作品与人物。" : matches.length ? `找到 ${matches.length} 条结果` : "没有找到匹配结果，试试更短的名称或作者名。";
    results.innerHTML = matches.map(r => {
      const src = r.kind === "work" ? imgSrc(state.t.works.find(w => w.id === r.id)!, "thumb") : portraitSrc(state.t.people.find(p => p.id === r.id)!, "thumb");
      return `<button class="search-result" data-result="${esc(r.id)}" data-type="${r.kind}"><span class="search-thumb ${r.kind}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">` : `<span>${esc(r.title[0])}</span>`}</span><span class="search-copy"><strong>${esc(r.title)}</strong><small>${esc(r.detail)}</small></span><span class="search-type">${r.kind === "work" ? "作品" : "人物"}</span></button>`;
    }).join("");
    results.scrollTop = 0;
  };
  const close = () => {
    dialog.close();
    document.body.style.overflow = previousOverflow;
    $("#search-open").focus();
  };
  const open = () => {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    input.focus();
  };
  registerNavigation("search", () => {
    const visible = dialog.open, query = input.value, filter = kind, top = results.scrollTop;
    const focused = (document.activeElement as HTMLElement)?.closest<HTMLElement>("[data-result]")?.dataset.result;
    return () => {
      input.value = query; kind = filter; render();
      dialog.querySelectorAll<HTMLElement>("[data-kind]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
      if (visible) open(); else dialog.close();
      if (visible && focused) results.querySelector<HTMLElement>(`[data-result="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
      results.scrollTop = top;
    };
  });
  render();
  $("#search-open").onclick = () => navigate(open);
  $("#search-close").onclick = () => returnToOrigin(close);
  dialog.oncancel = e => { e.preventDefault(); returnToOrigin(close); };
  // 阻止输入框方向键触发底层藏品浏览；Tab / Esc 仍由原生 dialog 处理。
  dialog.onkeydown = e => e.stopPropagation();
  input.oninput = render;
  $(".search-filters").onclick = e => {
    const button = (e.target as Element).closest<HTMLButtonElement>("[data-kind]");
    if (!button) return;
    kind = button.dataset.kind as SearchKind;
    dialog.querySelectorAll<HTMLElement>("[data-kind]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    render();
  };
  results.onclick = e => {
    const button = (e.target as Element).closest<HTMLElement>("[data-result]");
    if (!button) return;
    if (button.dataset.type === "work") actions.openWork(button.dataset.result!, true, workIds);
    else {
      if (!navigationActive()) { navigate(() => button.click()); return; }
      close();
      actions.showPerson(button.dataset.result!);
      const card = $("#who-card");
      card.tabIndex = -1;
      card.focus({ preventScroll: true });
    }
  };
}
