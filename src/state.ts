import type { Credit, Period, Site, Tradition, Work } from "./types";

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
  showWork: (_workId: string) => {},
  selectEvent: (_i: number, _scroll?: boolean) => {},
  openWork: (_workId: string, _canGo: boolean) => {},
  refreshPendulum: () => {},
};

export const periodIndex = (id: string) => state.t.periods.findIndex((p) => p.id === id);
export const periodOf = (id: string): Period => state.t.periods[periodIndex(id)];
export const workById = (id: string): Work | undefined => state.t.works.find((w) => w.id === id);
export const worksOf = (periodId: string) => state.t.works.filter((w) => w.period === periodId);

/** 作品按时期顺序、再按年份排列 */
export const allWorksOrdered = () =>
  state.t.periods.flatMap((p) => worksOf(p.id));

const groupIndex = (groupId: string) => state.t.meta.groups.findIndex((g) => g.id === groupId);
/** 大阶段的颜色变量：--g1 … --gN，由 applyGroupColors 写入 */
export const groupVar = (groupId: string) => `var(--g${groupIndex(groupId) + 1})`;
export const periodVar = (periodId: string) => groupVar(periodOf(periodId).group);

export const hasImage = (w: Work) => !w.copyright && !!state.credits[w.id];
export const imgSrc = (w: Work, size: "full" | "thumb") => {
  const c = state.credits[w.id];
  if (!c || w.copyright) return null;
  return import.meta.env.BASE_URL + (size === "thumb" ? c.thumb : c.file);
};
