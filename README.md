# 艺术史图谱 · Art History Atlas

一部可以动手玩的艺术史。先在**时间全景**里看艺术时期、历史大事、代表作品和几条背景历史如何对齐，再进入每个时期的**展厅**，用一张交互图解看懂这个时期最核心的一个概念。

**在线访问**：https://tumars.github.io/art-history-atlas/

## 有什么

- **时间全景**：欧洲分期、中国朝代、教会历史、30 件历史大事、44 件代表作和 18 个艺术时期画在同一条时间轴上，可在“展开比例 / 真实比例”间切换。选中一件大事，受它影响的时期和作品会高亮，其余变淡。
- **18 个展厅**：从史前洞窟到 20 世纪现代艺术。每个展厅有一句话主线、要点、历史背景、代表作展签，以及一张交互图解：举着火把走进洞窟、拖动消失点看线性透视、移动烛光看金色马赛克闪烁、拖动时间看干草堆变色……
- **理性与激情的钟摆**、**对照组**、**画有多大**、**作品墙**。
- 浅色 / 深色主题，手机可用。

## 本地运行

```bash
npm install
npm run dev          # 开发服务器
npm run build        # 类型检查 + 内容校验 + 构建到 dist/
npm run validate     # 只做内容校验
npm run fetch-images # 从维基共享资源下载作品图片（需要能访问 Wikimedia）
```

需要 Node.js 18 及以上。

## 内容与代码分离

所有内容都在 [`content/`](content/) 下的 JSON 里，改数据就能增删内容，不用碰代码：

```
content/
├── site.json                 站点信息、时间轴分段、推荐阅读
├── context/                  背景行：欧洲分期、中国朝代、教会历史……
└── traditions/western/       西方艺术史：时期、作品、历史大事、对照组……
```

“体系”（tradition）是一级概念，目前只有西方艺术史，结构上可以加入中国艺术史等其他体系。数据结构、交互规则和扩展方法见[设计文档](docs/design.md)，贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 图片

作品图片全部来自[维基共享资源](https://commons.wikimedia.org/)，只使用公有领域、CC0、CC BY、CC BY-SA 授权的文件，逐张记录作者与协议（见 [CREDITS.md](CREDITS.md)，页面上点开大图也能看到）。仍在版权期的作品不放图片，只给维基百科链接。

图片由 GitHub Actions 的“从维基共享资源取图”工作流下载并提交：在仓库的 **Actions** 页面选中这个工作流，点 **Run workflow** 即可。

## 部署

推送到 `main` 后，“构建并部署到 GitHub Pages”工作流会自动发布。首次使用需在仓库 **Settings → Pages** 里把 **Source** 设为 **GitHub Actions**。

## 推荐阅读

- 贡布里希《艺术的故事》
- 意公子《大话西方艺术史》（本项目最初是这本书的读书复盘页）

## 许可

- 代码：[MIT](LICENSE)
- 文字内容（`content/` 与 `docs/`）：[CC BY-SA 4.0](CONTENT_LICENSE.md)
- 作品图片：按各自在维基共享资源上的协议，见 [CREDITS.md](CREDITS.md)

内容按通行的艺术史知识整理，年代多为约数；交互图解是示意图，不是原作画面。发现错误欢迎提 Issue 或 PR。
