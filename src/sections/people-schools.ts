import { $, esc, wikiSearch } from "../lib/dom";
import { fmtYear } from "../lib/format";
import { state, groupVar, personById, portraitSrc } from "../state";
import type { ArtSchool } from "../types";

let selected = "", currentPerson = "";
let refresh = () => {};
let clearSearch = () => {};
export const selectedSchool = () => selected;

export const schoolsFor = (id: string) => state.t.schools.flatMap(s => {
  if (s.members.includes(id)) return [{ school: s, role: "" }];
  const relation = s.related?.find(r => r.person === id);
  return relation ? [{ school: s, role: relation.role }] : [];
});

export function highlightSchools(id: string, keepSchool = false) {
  currentPerson = id;
  const affiliations = schoolsFor(id);
  if (!keepSchool && !affiliations.some(a => a.school.id === selected)) selected = affiliations[0]?.school.id ?? "";
  refresh();
}

export function openSchool(id: string) {
  selected = id;
  clearSearch();
  refresh();
}

export function initSchools(onPerson: (id: string) => void, onGraph: (id: string) => void) {
  const root = $("#pv-schools-box"), schools = state.t.schools;
  let query = "";
  root.innerHTML = `<div class="school-top">
      <div><span class="label-sm">画派与艺术运动</span><p>${state.t.people.length} 位人物 · ${schools.length} 个派系与传统</p></div>
      <label class="school-search"><span>查找人物或派系</span><input type="search" id="school-search" placeholder="姓名、画派或艺术运动" autocomplete="off"></label>
    </div>
    <label class="school-mobile-select">艺术派系<select id="school-select" aria-label="选择艺术派系"></select></label>
    <div class="school-browser"><nav class="school-index" aria-label="艺术派系索引"></nav><div class="school-stage" role="region" aria-label="派系人物"></div></div>
    <p class="school-footnote">地域画派、风格运动与历史传统并列呈现；同一人可以跨越多个分类，赞助、同路人与风格先声另列。</p>`;
  const search = $<HTMLInputElement>("#school-search", root);
  const select = $<HTMLSelectElement>("#school-select", root);
  const index = $(".school-index", root), stage = $(".school-stage", root);
  const normalized = (text: string) => text.toLocaleLowerCase();
  const personMatches = (id: string) => {
    const p = personById(id)!;
    return normalized(`${p.name} ${p.en}`).includes(query);
  };
  const matches = (s: ArtSchool) => normalized(`${s.name} ${s.en}`).includes(query)
    || [...s.members, ...(s.related ?? []).map(r => r.person)].some(personMatches);
  const personTile = (id: string, school: ArtSchool, role = "") => {
    const p = personById(id)!, portrait = portraitSrc(p, "thumb");
    const other = schoolsFor(id).filter(a => a.school.id !== school.id);
    return `<li class="school-person${id === currentPerson ? " is-current" : ""}${query && personMatches(id) ? " is-match" : ""}" data-school-member="${id}">
      <button class="school-person-main" data-school-person="${id}" aria-label="查看${esc(p.name)}的人物资料" aria-pressed="${id === currentPerson}">
        <span class="school-portrait">${portrait ? `<img src="${portrait}" alt="" loading="lazy" decoding="async">` : esc(p.name[0])}</span>
        <span><strong>${esc(p.name)}</strong><small>${role ? esc(role) : `${fmtYear(p.born)}–${esc(p.diedText ?? fmtYear(p.died))}`}</small></span>
      </button>
      ${other.length ? `<div class="school-affiliations">${other.map(a => `<button data-school="${a.school.id}">${esc(a.school.name)}${a.role ? ` · ${esc(a.role)}` : ""}</button>`).join("")}</div>` : ""}
    </li>`;
  };
  function render() {
    const focusedSchool = (document.activeElement as HTMLElement | null)?.closest(".school-index")
      ? (document.activeElement as HTMLElement).dataset.school : undefined;
    const found = schools.filter(matches);
    if (found.length && !found.some(s => s.id === selected)) selected = found[0].id;
    const groups = state.t.meta.groups.map(g => ({ group: g, items: found.filter(s => s.group === g.id) })).filter(g => g.items.length);
    index.innerHTML = groups.map(({ group, items }) => `<section><h4>${esc(group.name)}</h4>${items.map(s => `<button data-school="${s.id}" style="--g:${groupVar(s.group)}" aria-pressed="${s.id === selected}"><span>${esc(s.name)}</span><small>${s.members.length + (s.related?.length ?? 0)}</small></button>`).join("")}</section>`).join("");
    select.innerHTML = groups.map(({ group, items }) => `<optgroup label="${esc(group.name)}">${items.map(s => `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>${esc(s.name)} · ${s.members.length + (s.related?.length ?? 0)} 人</option>`).join("")}</optgroup>`).join("");
    const school = found.find(s => s.id === selected);
    if (!school) {
      index.innerHTML = "";
      stage.innerHTML = `<p class="school-empty" role="status">没有匹配的人物或派系。</p>`;
      select.disabled = true;
      return;
    }
    select.disabled = false;
    stage.style.setProperty("--g", groupVar(school.group));
    const related = school.related ?? [];
    stage.innerHTML = `<header class="school-heading"><div><span class="school-span">${esc(school.span)}</span><h3>${esc(school.name)}</h3><em>${esc(school.en)}</em></div><span class="school-count">${school.members.length ? `${school.members.length}<small>位艺术家</small>` : `${related.length}<small>位相关人物</small>`}</span></header>
      <p class="school-summary">${esc(school.summary)}</p>
      <button class="school-graph-link" data-school-graph="${school.id}">在关系图中查看 ${esc(school.name)} →</button>
      <div class="school-members-heading"><span class="label-sm">${school.members.length ? "本站收录的代表人物" : "了解这一艺术传统"}</span><a href="${wikiSearch(school.name)}" target="_blank" rel="noopener">中文维基百科 ↗</a></div>
      ${school.members.length ? `<ul class="school-members">${school.members.map(id => personTile(id, school)).join("")}</ul>` : ""}
      ${related.length ? `<div class="school-related"><span class="label-sm">赞助、同路人与影响关系</span><ul class="school-members">${related.map(r => personTile(r.person, school, r.role)).join("")}</ul></div>` : ""}`;
    if (focusedSchool) $<HTMLButtonElement>(`[data-school="${focusedSchool}"]`, index)?.focus({ preventScroll: true });
    const active = $<HTMLButtonElement>(`[data-school="${selected}"]`, index);
    if (active && index.clientHeight && (active.offsetTop < index.scrollTop || active.offsetTop + active.offsetHeight > index.scrollTop + index.clientHeight)) {
      index.scrollTo({ top: active.offsetTop - index.clientHeight / 2, behavior: "instant" });
    }
  }
  clearSearch = () => { query = ""; search.value = ""; };
  refresh = render;
  search.oninput = () => { query = normalized(search.value.trim()); render(); };
  select.onchange = () => { selected = select.value; render(); };
  root.onclick = e => {
    const graph = (e.target as Element).closest<HTMLElement>("[data-school-graph]");
    if (graph) { onGraph(graph.dataset.schoolGraph!); return; }
    const school = (e.target as Element).closest<HTMLElement>("[data-school]");
    if (school) {
      if (school.closest(".school-affiliations")) openSchool(school.dataset.school!);
      else { selected = school.dataset.school!; render(); }
      return;
    }
    const person = (e.target as Element).closest<HTMLElement>("[data-school-person]");
    if (person) onPerson(person.dataset.schoolPerson!);
  };
  render();
}
