import type { Diagram, DiagramContext } from "./types";
import { westernDiagrams } from "./western";
import { state, groupVar } from "../state";

/** 各体系的图解注册表：体系 id → 图解 id → 实现 */
const registry: Record<string, Record<string, Diagram>> = {
  western: westernDiagrams,
};

export const diagramFor = (tradition: string, id: string): Diagram | undefined => registry[tradition]?.[id];

export const diagramContext = (): DiagramContext => ({ tradition: state.t, groupVar });
