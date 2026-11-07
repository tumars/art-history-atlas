import type { Work } from "../types";

export type PlaceKind = "museum" | "church" | "palace" | "site";
export interface City { id: string; name: string; country: string; lat: number; lon: number }
export interface Place {
  id: string;
  name: string;
  original?: string;
  city: string;
  /** 城市里更具体的位置，例如“梵蒂冈”“巴黎近郊” */
  area?: string;
  kind: PlaceKind;
  url?: string;
  /** 所属机构，例如西斯廷礼拜堂属于梵蒂冈博物馆的参观路线 */
  parent?: string;
  note?: string;
  /** 与 works.json 里 location 完全相同的收藏文字 */
  match?: string[];
  /** 直接指定的作品，优先于 match（例如建筑本身，或同一写法分属两馆） */
  works?: string[];
}
export interface PlacesData {
  cities: City[];
  places: Place[];
  unplaced: Record<string, { label: string; match: string[] }>;
}
export interface PlaceIndex {
  city: Map<string, City>;
  place: Map<string, Place>;
  /** 作品 id → 所在地点（多数一处，分藏两地时多处） */
  placesOf: Map<string, Place[]>;
  /** 地点 id → 作品，按年份排列 */
  worksAt: Map<string, Work[]>;
  /** 城市 id → 地点，按作品数从多到少 */
  placesIn: Map<string, Place[]>;
  /** 不在某个地点的作品，按原因分组 */
  unplaced: Map<string, Work[]>;
  /** 没能归类的收藏文字，供校验报错 */
  unknown: Work[];
}

export const PLACE_KIND: Record<PlaceKind, string> = { museum: "博物馆", church: "教堂", palace: "宫殿与府邸", site: "遗址与建筑" };

export function indexPlaces(data: PlacesData, works: Work[]): PlaceIndex {
  const city = new Map(data.cities.map(c => [c.id, c]));
  const place = new Map(data.places.map(p => [p.id, p]));
  const byWork = new Map<string, Place[]>(), byText = new Map<string, Place[]>();
  const add = (m: Map<string, Place[]>, k: string, p: Place) => m.set(k, [...(m.get(k) ?? []), p]);
  for (const p of data.places) {
    p.works?.forEach(id => add(byWork, id, p));
    p.match?.forEach(t => add(byText, t, p));
  }
  const unplacedText = new Map(Object.entries(data.unplaced).flatMap(([k, u]) => u.match.map(t => [t, k] as const)));
  const placesOf = new Map<string, Place[]>(), worksAt = new Map<string, Work[]>(), unplaced = new Map<string, Work[]>(), unknown: Work[] = [];
  for (const w of [...works].sort((a, b) => a.year - b.year)) {
    const ps = byWork.get(w.id) ?? byText.get(w.location);
    if (ps) {
      placesOf.set(w.id, ps);
      ps.forEach(p => worksAt.set(p.id, [...(worksAt.get(p.id) ?? []), w]));
    } else if (unplacedText.has(w.location)) {
      const k = unplacedText.get(w.location)!;
      unplaced.set(k, [...(unplaced.get(k) ?? []), w]);
    } else unknown.push(w);
  }
  const placesIn = new Map<string, Place[]>();
  for (const p of data.places) if (worksAt.has(p.id)) placesIn.set(p.city, [...(placesIn.get(p.city) ?? []), p]);
  placesIn.forEach(ps => ps.sort((a, b) => worksAt.get(b.id)!.length - worksAt.get(a.id)!.length));
  return { city, place, placesOf, worksAt, placesIn, unplaced, unknown };
}
