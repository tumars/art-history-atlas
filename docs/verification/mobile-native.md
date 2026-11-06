# 手机页面化重构验证

后续画海手势与动效专项记录见[选型与实现](../research/mobile-sea-motion.md)。专项脚本为 `scripts/mobile-sea.e2e.mjs`，沿用本页的 `PLAYWRIGHT_MODULE` 与 `BASE_URL` 设置。

2026-11-06，发布前验证记录。入口为站点首页，不是 `docs/prototypes/mobile-native.html`。

## 构建与回归

- `npm run build`：图片优化、TypeScript 共享模块检查、内容校验和 Vite 生产构建通过；487 组图片未发生新增转换。
- `npm test`：18 项既有单元测试通过，覆盖画海几何、渐进图片、桌面导航与正式搜索。
- `scripts/mobile.e2e.mjs`：本机 Chrome，通过 Playwright 触摸与移动视口模拟，在生产构建预览地址执行。脚本包含以下任务链，而非只验证 HTTP 状态。

| 检查 | 范围 |
|---|---|
| 完整画海 | 422 个作品位置；首屏仅设置附近图片来源；CDP 触摸二维拖动后不误开作品 |
| 返回恢复 | 画海 → 作品 → 作者 → 两次返回，镜头坐标保持；筛选 sheet 被浏览器返回关闭 |
| 搜索 | `van gogh` → 作品 → 下一件 → 全图 → 返回查询；刷新保持查询 |
| 收藏 | 添加、刷新、取消、撤销；存储被禁用时提示仅会话保留，收藏页仍可访问 |
| 阅读 | 选择反馈、下一步、退出继续、刷新恢复；五故事和四路线逐步检查 |
| 内容迁移 | 18 展厅、17 图解进入并渲染；年代、地图、派系、钟摆、并置与尺度选择器 |
| 人物图 | 生命线与直接关系图可键盘进入人物，并返回原图 |
| 深链接 | 旧人物 / 展厅 / 故事链接、新作品链接及无效作品兜底 |
| 手机尺寸 | 320×667、375×667、430×932、844×390；无根页面横溢出，画海看作品入口首屏可达 |
| 桌面 | 1440px 保留长卷；手机作品分享链接能打开桌面作品查看器 |

复跑方式：先运行 `npm run build` 和 `npm run preview -- --host 127.0.0.1 --port 4173`；已安装 Chrome 和 Playwright 的环境可执行：

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
BASE_URL=http://127.0.0.1:4173/art-history-atlas/ \
node scripts/mobile.e2e.mjs
```

`PLAYWRIGHT_MODULE` 可省略，此时从标准 Node 模块路径查找 `playwright`。浏览器回归不混入无需浏览器的 `npm test`。

## 完整人物网络（2026-11-06，本地验证）

- 手机复用 PC 图实现，全部范围均为 67 位人物、96 条关系；佛罗伦萨画派为 10 位人物，跨派系开关可扩展范围。
- Chrome 触控模拟验证双指缩放、拖动不误点、缩放按钮与总览；节点选择保留完整图，关系列表可定位人物。
- 生平返回与刷新均恢复人物、派系及镜头；关系开关、320px 无横溢出、深色模式及 PC 筛选回归通过。
- 可复跑：沿用上方环境变量，将命令替换为 `node scripts/mobile-network.e2e.mjs`。
- 截图：[手机完整人物关系图](../screenshots/mobile-people-network.png)。本轮尚未部署，触控模拟不代表真机验收。
- 后续交互优化：关系图占满导航之间的页面，默认以可读比例定位达·芬奇，人物定位和固定底部信息卡取代上下滚动查找。筛选收纳、点击居中、完整总览、镜头边界、390 / 320px 深浅主题已回归；完整节点数量和 PC 筛选保持一致。调研来源见[交互调研](../research/mobile-network-interaction.md)。

## 视觉检查

生产构建截图：[画海](../screenshots/mobile-v2-sea.png)、[作品](../screenshots/mobile-v2-work.png)、[导览](../screenshots/mobile-v2-guide.png)、[关系图](../screenshots/mobile-v2-graph.png)、[地图](../screenshots/mobile-v2-map.png)、[深色](../screenshots/mobile-v2-dark.png)、[横屏](../screenshots/mobile-v2-landscape.png)。

根据截图修正了深色作者链接、当前 tab、次级文字与图片衬底的对比度；地图复用原海岸线与投影，跨大西洋视野包含纽约。

## 尚未实测

- iOS Safari / Android Chrome 真机的边缘返回、地址栏、双指、软键盘、后台恢复及系统分享。
- 200% 系统文本、VoiceOver / TalkBack，以及 3–5 人任务试用。
- 慢网真机性能与手势延迟。生产构建仍有约 507 KB 主 JS 的 Vite 分块提示，主要内容与桌面代码仍共用入口包；本轮未将“构建成功”当作性能改善证据。

用户已授权提交并部署。本版本不新增登录 / 云同步；部署按现有工作流同时发布至 GitHub Pages 与 ferecord，以线上 source-version.txt 核对源码版本。真机验收仍未完成。
