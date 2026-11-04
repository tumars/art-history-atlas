import type { Tradition } from "../types";

export type SearchKind = "all" | "work" | "person";
export interface SearchResult { kind: "work" | "person"; id: string; title: string; detail: string }

// 忽略大小写、重音和姓名中的间隔符，也允许用空格组合关键词。
const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, "");

export function searchCatalog(t: Tradition, query: string, kind: SearchKind = "all"): SearchResult[] {
  const terms = query.trim().split(/\s+/).map(normalize).filter(Boolean);
  if (!terms.length) return [];
  const people = new Map(t.people.map(p => [p.id, p]));
  const candidates = [
    ...t.people.map(p => ({ kind: "person" as const, id: p.id, title: p.name, detail: p.en, fields: [p.name, p.en] })),
    ...t.works.map(w => ({ kind: "work" as const, id: w.id, title: w.title, detail: `${w.artist} · ${w.yearText}`, fields: [w.title, w.artist, ...(w.by ?? []).flatMap(id => {
      const p = people.get(id);
      return p ? [p.name, p.en] : [];
    })] })),
  ];
  const exact = normalize(query);
  return candidates.filter(item => (kind === "all" || item.kind === kind) && terms.every(term => normalize(item.fields.join(" ")).includes(term)))
    .sort((a, b) => Number(normalize(b.title) === exact) - Number(normalize(a.title) === exact))
    .map(({ fields: _fields, ...item }) => item);
}
