/** 内容数据的类型定义。content/ 下的 JSON 必须符合这里的结构（scripts/validate-content.mjs 会检查引用关系）。 */

/** 年份：负数为公元前。 */
export type Year = number;

export interface Site {
  title: string;
  titleEn: string;
  tagline: string;
  intro: string;
  /** 时间轴“展开比例”的分段：[起年, 止年, 起点位置 0–1, 止点位置 0–1] */
  axis: { start: Year; end: Year; segments: [Year, Year, number, number][] };
  traditions: string[];
  defaultTradition: string;
  recommendedReading: { title: string; author: string }[];
}

/** 大阶段（如“文艺复兴”），决定时期和作品的颜色 */
export interface Group {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export interface TraditionMeta {
  id: string;
  name: string;
  description: string;
  groups: Group[];
  /** 艺术中心接力：时期 id + 地点 */
  relay: { period: string; place: string }[];
  /** 时间全景里显示的背景行，对应 content/context/<id>.json */
  contextBands: string[];
  pendulum?: { title: string; low: [string, string]; high: [string, string]; note: string };
}

export interface Period {
  id: string;
  name: string;
  short: string;
  en: string;
  span: string;
  start: Year;
  end: Year;
  group: string;
  /** -2（理性/秩序）到 +2（情感/激情），用于钟摆图 */
  mood: number;
  thesis: string;
  keywords: string[];
  points: string[];
  bridge: string;
  /** 交互图解：id 对应 src/diagrams 里注册的实现 */
  diagram?: { id: string; title: string; caption: string };
}

export interface Work {
  id: string;
  title: string;
  artist: string;
  yearText: string;
  /** 用于在时间轴上定位的代表年份 */
  year: Year;
  medium: string;
  location: string;
  summary: string;
  period: string;
  /** 维基共享资源上的文件名，取图脚本据此下载并记录授权 */
  image?: { commons: string };
  /** 作品仍在版权期时写明原因，页面不放图 */
  copyright?: string;
  /** 是否出现在时间全景的“代表作品”行 */
  timeline?: boolean;
}

export interface HistoryEvent {
  year: Year;
  yearText: string;
  name: string;
  what: string;
  art: string;
  /** 受影响的时期 id */
  periods: string[];
}

export interface Comparison {
  id: string;
  tab: string;
  a: string;
  b: string;
  rows: [string, string, string][];
  summary: string;
}

export interface SizeEntry {
  work: string;
  heightCm: number;
  widthCm: number;
  default: boolean;
}

export interface Movements {
  roots: { id: string; name: string; group: string }[];
  movements: { name: string; start: Year; end: Year; root: string; note: string }[];
}

export interface BandItem {
  start: Year;
  end: Year;
  name: string;
  short: string;
  /** 与 ContextBand.fields 一一对应 */
  values: string[];
}

/** 时间全景里的背景行，如欧洲分期、中国朝代、教会历史 */
export interface ContextBand {
  id: string;
  label: string;
  theme: "neutral" | "cinnabar" | "violet";
  fields: string[];
  intro?: { title: string; heading: string; sections: [string, string][] };
  emptyBefore?: { until: Year; label: string };
  items: BandItem[];
}

export interface Tradition {
  meta: TraditionMeta;
  periods: Period[];
  works: Work[];
  events: HistoryEvent[];
  comparisons: Comparison[];
  sizes: SizeEntry[];
  movements?: Movements;
  bands: ContextBand[];
}

/** 取图脚本生成的署名信息，public/images/credits.json */
export interface Credit {
  file: string;
  thumb: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
}
