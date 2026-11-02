import type { Tradition } from "../types";

export interface DiagramContext {
  tradition: Tradition;
  /** 大阶段 id → CSS 颜色变量，如 var(--g3) */
  groupVar: (groupId: string) => string;
}

/** 一个交互图解：html() 返回静态标记，init() 绑定交互。标题和说明写在内容数据里。 */
export interface Diagram {
  html(ctx: DiagramContext): string;
  init(root: HTMLElement, ctx: DiagramContext): void;
}
