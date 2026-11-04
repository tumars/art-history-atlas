import type { ContextBand, Credit, Encounter, Person, Site, Tradition, TraditionMeta } from "./types";
import siteJson from "../content/site.json";

/**
 * 内容加载。content/traditions/<体系>/ 下的 JSON 在构建时打包；
 * 新增一个体系只需建同名目录并在 site.json 的 traditions 里登记。
 */
const traditionFiles = import.meta.glob("../content/traditions/*/*.json", { eager: true, import: "default" });
const contextFiles = import.meta.glob("../content/context/*.json", { eager: true, import: "default" });

export const SITE = siteJson as Site;

function file<T>(tradition: string, name: string, optional = false): T {
  const v = traditionFiles[`../content/traditions/${tradition}/${name}.json`];
  if (v === undefined && !optional) throw new Error(`缺少内容文件 content/traditions/${tradition}/${name}.json`);
  return v as T;
}

export function loadTradition(id: string): Tradition {
  const meta = file<TraditionMeta>(id, "tradition");
  const bands = meta.contextBands.map((b) => {
    const v = contextFiles[`../content/context/${b}.json`];
    if (!v) throw new Error(`缺少背景行 content/context/${b}.json`);
    return v as ContextBand;
  });
  return {
    meta,
    periods: file(id, "periods"),
    works: file(id, "works"),
    events: file(id, "events", true) ?? [],
    comparisons: file(id, "comparisons", true) ?? [],
    sizes: file(id, "sizes", true) ?? [],
    movements: file(id, "movements", true),
    people: file<{ people: Person[] } | undefined>(id, "people", true)?.people ?? [],
    schools: file(id, "schools", true) ?? [],
    encounters: file<{ encounters: Encounter[] } | undefined>(id, "people", true)?.encounters ?? [],
    readings: file(id, "readings", true) ?? [],
    bands,
  };
}

/** 图片署名清单由 scripts/fetch-images.mjs 生成；还没取图时为空，页面显示占位 */
export async function loadCredits(): Promise<Record<string, Credit>> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}images/credits.json`, { cache: "no-cache" });
    if (!r.ok) return {};
    return (await r.json()) as Record<string, Credit>;
  } catch {
    return {};
  }
}
