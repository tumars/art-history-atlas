export { $$, esc, clamp, lerp, svgPt, dragOn, seg, bindSeg } from "../lib/dom";
export { mixHex, mulHex, keyColor, hex2rgb, rgb2hex } from "../lib/color";

/** 图解里频繁按 id 取元素并直接改属性，这里统一返回宽松类型，避免满屏的非空断言 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const q = (root: ParentNode, sel: string): any => root.querySelector(sel);
