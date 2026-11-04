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
  /** 各分区的编号、标题与导语 */
  sections: Record<SectionId, { numeral: string; title: string; deck: string }>;
  repo: string;
}

export type SectionId = "chronology" | "hall" | "people" | "pendulum" | "pairs" | "readings" | "sizes" | "collection";

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
  /** 艺术中心接力：主线站点及同时发展的地点，经纬度仅定位，不表示当时边界。 */
  relay: { period: string; place: string; era: string; note: string; points: { name: string; lon: number; lat: number }[] }[];
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
  question?: string;
  keywords: string[];
  points: string[];
  bridge: string;
  /** 交互图解：id 对应 src/diagrams 里注册的实现 */
  diagram?: { id: string; title: string; observe: string; caption: string; works: { work: string; label: string }[]; sources?: { label: string; url: string }[] };
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
  /** 图片来源：Commons / 英文维基的文件名，或已核对的馆藏图片地址及署名。百科阅读链接另存于 source。 */
  image?: { commons: string } | { wikipedia: string } | { url: string; thumb?: string; source: string; author: string; license: string };
  /** 来源页的版权说明，不作为阻止显示图片的开关。 */
  copyright?: string;
  /** 非版权原因的缺图说明，例如原作失传。 */
  noImageReason?: string;
  /** 复制品、系列代表图、建筑视角等配图说明。 */
  imageNote?: string;
  /** 可核查的作品资料链接。 */
  source?: string;
  /** 馆藏、研究等核查来源；百科入口仍使用中文。 */
  sources?: { label: string; url: string }[];
  /** 人物扩展作品：进入人物、展厅与藏品，有图时也进入画海。 */
  supplementary?: boolean;
  /** 是否出现在时间全景的“代表作品”行 */
  timeline?: boolean;
  /** 作者（人物 id）；佚名或团队作品可不填 */
  by?: string[];
}

export interface Person {
  id: string;
  name: string;
  en: string;
  born: Year;
  died: Year;
  /** 生卒年为约数 */
  approx?: boolean;
  /** 卒年有下界等情况；died 仅供时间轴定位。 */
  diedText?: string;
  roles: string[];
  period: string;
  cities: string[];
  line: string;
  points: string[];
  rel: { teachers?: string[]; influences?: string[]; rivals?: string[]; patrons?: string[] };
  /** 流派、画派或圈子 */
  movement?: string[];
  /** 生平节点，按年份排序 */
  life?: { year: Year; yearText?: string; text: string }[];
  /** 创作、委托或收藏的相关作品；work 指向本站作品 id，作者由 Work.by 表示。 */
  works?: { title: string; year: string; where?: string; work: string }[];
  /** 评价：同代人与后世怎么看他 */
  legacy?: string;
  /** 有可靠出处的名言 */
  quote?: { text: string; by: string; source?: string };
  /** 英文维基百科条目名，取肖像用 */
  wiki: string;
  portrait?: false;
  sources?: { label: string; url: string }[];
}

export interface Encounter {
  year: Year;
  yearText?: string;
  place: string;
  people: string[];
  title: string;
  text: string;
  sources?: { label: string; url: string }[];
}

/** 短篇看画与主题路线；局部坐标相对于完整图片，感受题没有分数。 */
export interface Reading {
  id: string;
  kind: "story" | "route";
  title: string;
  deck: string;
  minutes: number;
  periods: string[];
  people: string[];
  relations?: [string, string][];
  steps: {
    title: string;
    prompt: string;
    works: string[];
    details?: { work: string; label: string; x: number; y: number; note: string }[];
    choices?: { label: string; response: string }[];
    context: string;
  }[];
  next: { work: string; label: string }[];
  sources: { label: string; url: string }[];
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
  people: Person[];
  schools: ArtSchool[];
  encounters: Encounter[];
  readings: Reading[];
  bands: ContextBand[];
}

/** 人物的画派、艺术运动或历史传统；赞助、先声等关系不等同于成员身份。 */
export interface ArtSchool {
  id: string;
  name: string;
  en: string;
  group: string;
  span: string;
  summary: string;
  members: string[];
  related?: { person: string; role: string }[];
}

/** 取图脚本生成的署名信息，public/images/credits.json */
export interface Credit {
  optimized?: { thumb: string; display: string; width: number; height: number };
  file: string;
  thumb: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
}
