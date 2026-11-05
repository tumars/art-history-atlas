import type { Credit, Period, Person, Site, Tradition, Work } from "./types";
import { esc } from "./lib/dom";

/**
 * 全局状态与跨模块的动作。各分区在启动时把自己的动作挂到 actions 上，
 * 避免模块之间互相 import 形成环。
 */
export const state = {
  site: undefined as unknown as Site,
  t: undefined as unknown as Tradition,
  credits: {} as Record<string, Credit>,
  /** 当前展厅（时期下标）与展签作品下标 */
  cur: 0,
  feat: 0,
};

export const actions = {
  goPeriod: (_i: number, _scroll?: boolean) => {},
  /** 打开大图；ids 为可前后切换的作品列表 */
  showWork: (_workId: string) => {},
  selectEvent: (_i: number, _scroll?: boolean) => {},
  openWork: (_workId: string, _canGo: boolean, _ids?: string[]) => {},
  refreshPendulum: () => {},
  /** 打开人物卡片并滚到人物区 */
  showPerson: (_id: string, _scroll?: boolean) => {},
  openReading: (_id: string) => {},
  /** 跨区进入正文时收起目录与图表，保留进入前的历史快照。 */
  dismissPanels: () => {},
};

/** 作品顺序：按时期顺序，同一时期内按年份 */
export const periodsOrderedWorks = () =>
  state.t.periods.flatMap((p) => state.t.works.filter((w) => w.period === p.id).sort((a, b) => a.year - b.year));

export const periodIndex = (id: string) => state.t.periods.findIndex((p) => p.id === id);
export const periodOf = (id: string): Period => state.t.periods[periodIndex(id)];
export const workById = (id: string): Work | undefined => state.t.works.find((w) => w.id === id);
export const worksOf = (periodId: string) => state.t.works.filter((w) => w.period === periodId);

/** 作品按时期顺序、再按年份排列 */
export const allWorksOrdered = () =>
  periodsOrderedWorks();

const groupIndex = (groupId: string) => state.t.meta.groups.findIndex((g) => g.id === groupId);
/** 大阶段的颜色变量：--g1 … --gN，由 applyGroupColors 写入 */
export const groupVar = (groupId: string) => `var(--g${groupIndex(groupId) + 1})`;
export const periodVar = (periodId: string) => groupVar(periodOf(periodId).group);

export const hasImage = (w: Work) => !!state.credits[w.id];
export const imgSrc = (w: Work, size: "full" | "thumb" | "display") => {
  const c = state.credits[w.id];
  if (!c) return null;
  return import.meta.env.BASE_URL + (size === "thumb" ? c.optimized?.thumb ?? c.thumb : size === "display" ? c.optimized?.display ?? c.file : c.file);
};

export const personById = (id: string): Person | undefined => state.t.people.find((p) => p.id === id);
export const worksBy = (personId: string) => allWorksOrdered().filter((w) => w.by?.includes(personId));
export const portraitSrc = (p: Person, size: "thumb" | "display" = "display") => {
  const c = state.credits[`person:${p.id}`];
  return c ? import.meta.env.BASE_URL + (c.optimized?.[size] ?? (size === "thumb" ? c.thumb : c.file)) : null;
};
/** 作者名：挂了人物的作品显示为可点的链接，点了打开人物卡片 */
export const whoHtml = (w: Work) => {
  const id = w.by?.[0];
  return id && personById(id)
    ? `<button class="who-link" data-person="${id}" title="看${esc(personById(id)!.name)}的人物卡片">${esc(w.artist)}</button>`
    : esc(w.artist);
};
