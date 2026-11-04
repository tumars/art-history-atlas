import type { Diagram } from "../types";
import d1 from "./egypt";
import d2 from "./greece";
import d3 from "./rome";
import d4 from "./byzantine";
import d5 from "./gothic";
import d6 from "./early-ren";
import d7 from "./high-ren";
import d8 from "./venice";
import d9 from "./north-ren";
import d10 from "./baroque";
import d11 from "./rococo";
import d12 from "./neoclassic";
import d13 from "./romantic";
import d14 from "./realism";
import d15 from "./impression";
import d16 from "./post-impression";
import d17 from "./modern";

/** 西方艺术史的可选交互图解，键是 periods.json 里 diagram.id */
export const westernDiagrams: Record<string, Diagram> = {
  "egypt": d1,
  "greece": d2,
  "rome": d3,
  "byzantine": d4,
  "gothic": d5,
  "early-ren": d6,
  "high-ren": d7,
  "venice": d8,
  "north-ren": d9,
  "baroque": d10,
  "rococo": d11,
  "neoclassic": d12,
  "romantic": d13,
  "realism": d14,
  "impression": d15,
  "post-impression": d16,
  "modern": d17,
};
