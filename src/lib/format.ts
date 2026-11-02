/** 年份：负数显示为“前 N” */
export const fmtYear = (y: number) => (y < 0 ? "前" + -y : String(y));

/** 罗马数字（1–3999） */
export function roman(n: number) {
  const map: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

/** 中文数字（0–99），如 18 → 十八 */
export function cnNum(n: number) {
  const d = "零一二三四五六七八九";
  if (n < 10) return d[n];
  if (n < 20) return "十" + (n % 10 ? d[n % 10] : "");
  return d[Math.floor(n / 10)] + "十" + (n % 10 ? d[n % 10] : "");
}
