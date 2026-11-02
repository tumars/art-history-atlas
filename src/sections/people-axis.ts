import type { Year } from "../types";

/** 人物分区的时间轴：人物几乎都在 1250 年以后，古代压缩在左侧 */
export const VW = 1000; // viewBox 宽
export const PAD = 12;
const SEGS: [Year, Year, number, number][] = [[-500, 1250, 0, 0.12], [1250, 1990, 0.12, 1]];
const pos = (y: Year) => {
  for (const [a, b, p, q] of SEGS) if (y <= b) return p + ((Math.max(y, a) - a) / (b - a)) * (q - p);
  return 1;
};
export const X = (y: Year) => PAD + pos(y) * (VW - PAD * 2);
export const unX = (x: number): Year => {
  const p = (x - PAD) / (VW - PAD * 2);
  for (const [a, b, s, e] of SEGS) if (p <= e) return Math.round(a + ((Math.max(p, s) - s) / (e - s)) * (b - a));
  return 1990;
};
export const AXIS_TICKS = [-500, 500, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
