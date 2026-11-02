import { clamp, lerp } from "./dom";

export const hex2rgb = (h: string) => {
  h = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const rgb2hex = (a: number[]) =>
  "#" + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
export const mixHex = (a: string, b: string, t: number) => {
  const x = hex2rgb(a), y = hex2rgb(b);
  return rgb2hex(x.map((v, i) => lerp(v, y[i], t)));
};
export const mulHex = (a: string, b: string) => {
  const x = hex2rgb(a), y = hex2rgb(b);
  return rgb2hex(x.map((v, i) => (v * y[i]) / 255));
};
/** 关键帧插值：keys 为 [位置, 颜色] 列表 */
export function keyColor(keys: [number, string][], t: number) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [a, ca] = keys[i - 1], [b, cb] = keys[i];
      return mixHex(ca, cb, (t - a) / (b - a));
    }
  }
  return keys[keys.length - 1][1];
}
