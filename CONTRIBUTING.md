# 参与贡献

欢迎修正错误、补充作品和历史事件，或者为新的艺术史体系搭框架。

## 改内容（不需要写代码）

内容都在 `content/` 下，字段说明见 [docs/design.md](docs/design.md) 第 3 节和 `src/types.ts`。

**加一件作品**：在 `content/traditions/western/works.json` 里加一项：

```json
{
  "id": "the-kiss",
  "title": "吻",
  "artist": "古斯塔夫·克里姆特",
  "yearText": "1907–1908年",
  "year": 1907,
  "medium": "油彩、金箔、画布",
  "location": "维也纳美景宫",
  "summary": "一句话看点。",
  "period": "modern",
  "image": { "commons": "The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg" },
  "timeline": true
}
```

- `id` 只用小写字母、数字和连字符，全站唯一。
- `image.commons` 填维基共享资源上的文件名；`image.wikipedia` 填英文维基百科文件页的文件名（不含 `File:`）。也可用 `image.url` 和可选 `image.thumb` 指定核对过的馆藏图片，同时填写 `source`、`author`、`license`。三种来源选一种，保留原始署名和权利说明，不按版权标签阻止作品显示。
- `timeline: true` 会让它出现在时间全景的“代表作品”行，请克制使用。
- 人物作品清单中的每一条都必须用 `work` 指向完整作品记录；新增的人物扩展作品设 `supplementary: true`，有图后同样进入画海。赞助和收藏关系放在人物清单中，`by` 只写真实创作者。
- 为作品补充 `summary` 与可核查的中文维基百科 `source`，没有对应中文条目时链接中文搜索。失传等缺图情况写 `noImageReason`；古代摹本、历史复原图、系列代表图或局部图写明 `imageNote`，不把它们当成原作照片，也不要以同名作品替代原作。
- 新图片取回并生成署名后运行 `npm run optimize-images`，提交 `public/images/optimized/` 和更新后的署名清单；`npm run fetch-images` 与构建会自动生成。不要用原图副本充当浏览用小图。
- 新图片取回并生成署名后再运行校验；校验会检查图片和缩略图是否实际存在。

**加一件历史大事**：`events.json` 按年份顺序插入，`periods` 写受影响的时期 id。

**加一条背景行**：在 `content/context/` 新建文件（结构参照 `china-dynasties.json`），再把 id 加到体系 `tradition.json` 的 `contextBands`。

改完运行：

```bash
npm run validate
```

## 加一篇看画故事或路线

在 `content/traditions/western/readings.json` 参照现有记录增加一项，字段见设计文档与 `src/types.ts`。

- 用一个具体的观察问题串起两三件作品，每步只展示一至两件；先给观察机会，再按需展开背景，允许跳过，不计分。
- `details` 的 `x/y` 是原图上的百分比坐标。核对实际图片与作品版本，桌沿、手势等提示必须落在对应局部，并在手机验证放大与返回全图。
- 主观选择用 `choices` 给有区别的回应；史实与解读区分，争议不能做唯一答案题。文字原创整理，不复制普及书段落。
- `sources` 写馆藏、研究或可靠机构资料；新增人物、作品及相遇同样可附来源。百科入口仍用中文维基百科。
- `relations` 只能引用已有师承、影响等关系或同一次相遇；主题相似不等于历史影响。`next` 给两个可继续观察的作品。
- 运行 `npm run check`；在浏览器检查各步图像、来源、下一站、键盘操作及手机排版。涉及新增作品时先完成取图和署名。

## 改代码

- `npm run dev` 本地开发，`npm run build` 会先跑类型检查和内容校验。
- 图解可选，不要求每个时期都有；若交互只能展示与艺术理解无关的常识，应省略该时期的 `diagram`，不放占位。
- 新的交互图解：在 `src/diagrams/<体系>/` 新建文件，实现 `Diagram` 接口（`html()` 和 `init()`），在该目录的 `index.ts` 注册，再在 `periods.json` 里写 `diagram.id`、`title`、`observe`、`caption`、`works`，必要时附 `sources`。
- 图解标题必须能由实际操作与结论回答；观察提示说明比较什么，反馈说明发生了什么。每张至少关联一件可核对的作品。区分事实、解释与演示假设，避免用假物理、单线传承或绝对化口号替代解释。原作辅助线必须核对图像位置，并能关闭。
- 检查控件两端和切换前后、作品入口、键盘与手机显示；同步维护 [图解复查记录](docs/research/diagram-review.md)。
- 颜色一律用 CSS 变量（见 `src/styles/main.css` 开头），保证浅色和深色主题都可读。

## 文档即代码

改动了页面结构、数据格式或交互规则，请同步更新 [docs/design.md](docs/design.md)，并在文末“变更记录”里写一行。

## 内容准确性

- 年代、馆藏等事实请尽量核对可靠来源，在 PR 描述里附上出处。
- 带有观点的整理（例如“理性与激情的钟摆”）请写清楚是整理框架，不要写成定论。
