# 作品详情页的灯光：调研与方案

2026-11-07 · 已按第 5 节的建议在手机版实现（浅色白天展厅、深色夜场，画面不加光，进入时开灯，滚动视差，不用陀螺仪），现状见 [设计文档 2.1 节](../design.md)。可操作原型：[`docs/prototypes/work-lighting.html`](../prototypes/work-lighting.html)（`npm run dev` 后打开 `/art-history-atlas/docs/prototypes/work-lighting.html`，可切换作品、方案、浅深色，以及画面上是否加光）。

## 1. 想要什么

作品页现在是：浅色或深色底，顶部一层取自作品颜色的淡色晕，作品带一点投影。信息清楚，但像在看一张图片，不像站在一幅画前。目标是在不改变作品本身观感的前提下，让顶部主图区像展厅里一面被射灯照亮的墙：作品挂在墙上，有画框、有光、有影子。

## 2. 调研

**展厅怎么打光。** 博物馆和画廊照明的常见做法（多为照明厂商与设计资料，不是标准文件，作为经验值看）：

- 光从上方约 30° 打到画面中心；更陡会在画框下留出长影，更平容易反光（[atmosferamag](https://www.atmosferamag.it/how-to-light-paintings-at-home/)、[MOMAA](https://momaa.org/lighting-science-for-art-display-professional-techniques-for-home-collectors/)、[Coohom](https://www.coohom.com/article/how-art-galleries-and-museums-light-paintings-on-walls)）。
- 暖白光，约 2700–3000K，显色指数 90 以上；避免眩光比提高亮度更重要（[Nelson-Atkins 相关文章](https://www.nelson-atkins.org/?p=21474)、[Perfect Picture Lights](https://perfectpicturelights.com/blog/top-questions-about-art-lighting)、[vocal.media](https://vocal.media/art/illuminate-your-art-expert-tips-on-gallery-lighting-for-paintings)）。
- 由此得到画面上可用的几个要素：一束从上方来的暖光、画周围一圈亮墙、四周偏暗、画框下方偏下的投影。

**数字产品怎么做现场感。** Google Arts & Culture 的 Pocket Gallery 用 AR 搭出整座虚拟展厅，可以走进去看画（[Getty](https://www.getty.edu/news/use-augmented-reality-to-explore-a-virtual-museum-gallery-from-home/)、[Google 博客](https://blog.google/outreach-initiatives/arts-culture/explore-impossible-exhibitions-3d/)）。这种做法沉浸感强，但很重，也不是作品详情页的任务：详情页要的是看清这一件，再读看点。

**手机倾斜。** 用陀螺仪让光泽和影子随手机转动，现场感最强；但 iOS Safari 必须在用户点按后调用 `DeviceOrientationEvent.requestPermission()` 并弹窗授权，有人遇到直接返回拒绝、不弹窗的情况（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static)、[Defold 论坛](https://forum.defold.com/t/how-to-force-safari-browser-to-allow-deviceorientation-permission-solved/75641)）。为了一个氛围效果让用户授权传感器，不划算。

## 3. 约束

1. **不改作品的颜色。** 画间是看画的地方，作品的颜色要尽量是原样。光主要打在墙、画框和影子上；画面上至多一层很淡的上亮下暗，“看全图”始终是原图。
2. **墙要露出来。** 原型里发现：宽幅作品铺满屏宽时，四周没有墙，光无处可落，效果几乎看不出。需要给作品四周留出一圈墙（原型里左右各约 44px，主图高度上限 300px），作品会比现在小一些。
3. **与画海一致。** 浅色画海已经是展厅墙（灰泥颗粒、天光、射灯、投影、淡金细框），深色是夜空和金边。作品页沿用同一套：浅色是白天的展厅，深色是夜场。
4. **轻。** 只用静态渐变和阴影，不逐帧计算；“减少动态效果”时不播开灯动画。
5. **顶部按钮可读。** 墙四周压暗后，浅色模式下玻璃按钮要保持对比。

## 4. 三个方案（原型里都可以切换）

| | A 现状 | B 射灯 | C 射灯 + 倾斜 |
|---|---|---|---|
| 背景 | 取色淡晕 | 展厅墙（与画海同一张灰泥颗粒），四周压暗 | 同 B |
| 光 | 无 | 顶部一束 30° 暖光，画后一圈亮墙 | 同 B，光斑随倾斜轻移 |
| 作品 | 小投影 | 淡金细框，画框下方投影 | 同 B，投影随倾斜偏移，画面上有一点移动的光泽，画本身转 2° |
| 进入页面 | 无 | 灯光在 1 秒内亮起，画先暗后亮 | 同 B |
| 代价 | — | 作品略小 | 要传感器授权；不授权时只能用手指拖动 |

## 5. 建议

做 **B**，并把 C 里不需要授权的部分借过来：

- 浅色是白天的展厅墙，深色是夜场；深色效果最明显，浅色要克制，靠四周压暗和画框下的影子，而不是更亮的光。
- 画面上默认不加光（原型里可以对比），只在墙、框和影子上做。
- 开灯只在从画海或列表进入作品页时播一次；左右滑动切换作品时，光斑跟着滑过去，不重播。
- 不用陀螺仪。现场感改由已有的手势带出：往上滚动时，墙和光斑比作品移动得慢一点（主图已有视差变量），左右滑换作品时影子随滑动方向偏移。
- 作品四周留墙：竖幅作品基本不变，宽幅作品左右各让出约 44px。主图区高度可以从 56vh 提到 60vh，补回一部分尺寸。

## 6. 待确认

- 接受作品在主图区里变小一些吗？还是只在深色模式下做灯光（深色时墙和画的对比本来就够）。
- 画面上那层很淡的上亮下暗要不要（会让画面有一点“被照亮”的感觉，但颜色不再完全是原图）。
- 开灯动画每次进入都播，还是只在第一次打开作品页时播。
