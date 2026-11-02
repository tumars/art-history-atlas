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
- `image.commons` 填维基共享资源上的文件名（文件页地址 `File:` 后面那部分）。只选公有领域或 CC 授权的文件。
- 作品仍在版权期时，不写 `image`，改写 `"copyright": "某某（XXXX 年去世）的作品仍在版权期"`。
- `timeline: true` 会让它出现在时间全景的“代表作品”行，请克制使用。

**加一件历史大事**：`events.json` 按年份顺序插入，`periods` 写受影响的时期 id。

**加一条背景行**：在 `content/context/` 新建文件（结构参照 `china-dynasties.json`），再把 id 加到体系 `tradition.json` 的 `contextBands`。

改完运行：

```bash
npm run validate
```

## 改代码

- `npm run dev` 本地开发，`npm run build` 会先跑类型检查和内容校验。
- 新的交互图解：在 `src/diagrams/<体系>/` 新建文件，实现 `Diagram` 接口（`html()` 和 `init()`），在该目录的 `index.ts` 注册，再在 `periods.json` 里写 `diagram.id`、`title`、`caption`。
- 颜色一律用 CSS 变量（见 `src/styles/main.css` 开头），保证浅色和深色主题都可读。

## 文档即代码

改动了页面结构、数据格式或交互规则，请同步更新 [docs/design.md](docs/design.md)，并在文末“变更记录”里写一行。

## 内容准确性

- 年代、馆藏等事实请尽量核对可靠来源，在 PR 描述里附上出处。
- 带有观点的整理（例如“理性与激情的钟摆”）请写清楚是整理框架，不要写成定论。
