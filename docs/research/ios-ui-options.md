# 画间 iOS 设计语言与组件选型

2026-11-07 · 待 review，未决定技术迁移。本文只记录调研，不改变当前产品行为。

## 结论

优先 review Apple 官方设计资源、Framework7 iOS demo、Konsta UI demo。设计语言与实现技术需要分别选择：采用 Apple 的界面规范，不等于必须使用 SwiftUI；使用 Web 的 iOS 主题，也不等于得到系统原生控件。

- 主推荐：Apple HIG + SwiftUI 外壳（TabView、NavigationStack、sheet、searchable 用系统控件），画海、人物关系图、地图先放在 WKWebView 中复用现有实现，之后逐页换成原生。
- 如果 iOS 原生体验优先且愿意整体重写，推荐 Apple HIG + SwiftUI 全原生。
- 如果复用当前网页与尽快落地优先，推荐 Framework7 Core + Capacitor 做验证。
- 如果愿意重写界面、希望继续用 TypeScript 并兼顾 Android，考虑 Expo / React Native + Expo UI。

可视化评审页（三个方向的手机样稿、六条路线对比、选择表单）：<https://claude.ai/artifact/2HqrL5R1zgZMhh57ysncxM>（私有链接）。按推荐组合做的可操作原型见 [移动端第三轮](mobile-ios-redesign.md)。

## 当前项目与问题

检查了 `package.json`、`src/mobile/app.js`、`src/mobile/mobile.css` 和现行设计文档。项目使用 Vite、TypeScript、原生 DOM 与 CSS，没有 React / Vue。手机端已有四个 tab、各自页面栈与状态恢复，不能再把问题简单归因为“只有网页长卷”。

当前标题、导航标题普遍使用宋体 / 衬线字体，整体米色与绿色、手绘 SVG 图标、自定义顶栏、底栏及 sheet 形成独立视觉体系。我的判断是：它更像有移动导航的艺术网站，尚未形成一致的 iOS 控件语言。字体只是其中一项，返回转场、搜索键盘、滚动与弹层行为同样影响应用感。

本轮以官方资料和现有源码为依据，没有在 iPhone 上安装各框架样例；以下迁移成本和适合度属于项目判断，非性能测试结果。

## 候选对照

| 候选 | 类型与原生程度 | 适合画间的部分 | 相对当前代码的成本与局限 | Review 入口 |
|---|---|---|---|---|
| SwiftUI 外壳 + WKWebView 内容 | 系统导航、tab、sheet、搜索；页面内容仍为 Web | 让“像 App”的部分立刻原生；画海本就是自绘画布，留在 Web 中成本最低，可逐页原生化 | 中：需写 Swift，并在 Web 与原生之间传递路由、收藏状态。[Hotwire Native](https://native.hotwired.dev/)（iOS 1.3.1）是同类成熟方案，但依赖 Turbo，不适合直接套用静态 Vite 站 | [TabView](https://developer.apple.com/documentation/swiftui/tabview)、[WebKit](https://developer.apple.com/documentation/webkit) |
| Apple HIG + SwiftUI | 官方设计语言 + 系统原生 UI 框架 | 导航、tab、搜索、sheet、动态字体、系统图标；作品内容可以保持自身气质 | 高：页面与 DOM 动画需要重写；内容与图片可复用。若保留局部 WebView，需验证手势与状态桥接 | [官方 UI Kit](https://developer.apple.com/design/resources/)、[SwiftUI](https://developer.apple.com/swiftui/) |
| Framework7 Core | Web 移动应用框架，模拟 iOS 外观与交互 | 页面导航、列表、分段、底栏、弹层；能接现有 JavaScript | 中：无需先迁 React，但要替换已有页面栈与组件组织；不能同时保留两个导航所有者 | [iOS 可操作 demo](https://framework7.io/kitchen-sink/core/?theme=ios)、[官网](https://framework7.io/) |
| Konsta UI | Tailwind CSS 的移动组件库，Web 模拟 | 很适合比较 iOS 控件样式、浅深主题、导航栏与列表 | 中高：当前没有 React / Vue / Svelte 或 Tailwind；它不负责完整导航栈，官方建议搭配父框架 | [可操作 demo](https://konstaui.com/kitchen-sink/react/dist/)、[官网](https://konstaui.com/) |
| Ionic + Capacitor | Web Components + 原生运行容器，主要界面仍是 Web | iOS mode、搜索、列表、分段与 sheet；也支持原生 JavaScript | 中：要接入页面生命周期和导航；仅开启 ios mode 不保证与当前系统外观完全同步 | [平台样式](https://ionicframework.com/docs/theming/platform-styles)、[sheet / modal demo](https://ionicframework.com/docs/api/modal) |
| Expo / React Native + Expo UI | React Native 应用；Expo UI 提供 SwiftUI / Compose 原生基础组件 | 保持 React / TypeScript 开发方式，导航与控件可使用系统实现 | 高：当前 HTML / CSS 不能直接搬过去，画海和图谱需重做或局部 WebView；不是安装一个样式包 | [Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/)、[原生 tab](https://docs.expo.dev/router/advanced/native-tabs/) |

npm 本轮（2026-11-07）显示 framework7 9.3.0、konsta 5.5.0、@ionic/core 9.0.10、@capacitor/core 8.6.0、expo 58.0.23、@expo/ui 58.0.27。Framework7 与 Konsta UI 均为 MIT，均明确宣传 iOS 26 风格。Apple 设计资源页已提供 iOS 27 UI Kit。因此不把第三方库宣传的“iOS 风格”等同于与最新系统完全一致；应以实际 demo 和目标系统真机为准。

Expo 当前原生 tab 文档区分 SDK 版本：SDK 58 起使用 `expo-router/native-tabs`，54–57 使用 `unstable-native-tabs`。采用时需要锁定 SDK 并检查组件支持范围，不能照搬旧教程的实验状态结论。

[Capacitor](https://capacitorjs.com/docs) 是运行容器与原生能力桥接，不是 UI 设计语言；它能承载 Web 界面，但不会自动把自定义底栏、弹层变成 SwiftUI。这里不把打包上架本身作为“原生感”的解决方案。

## 建议 review 的三个视觉方向

以下是针对画间的设计提案，不是三套官方命名的主题。三种方向都可以先用 Apple 官方 UI Kit 表达，再决定实现框架。

### A. 系统相册式：优先推荐

以 Apple Photos 的内容优先思路作为参考：中性背景、系统无衬线导航、作品占主要面积；工具轻量浮在内容之上，全图观看采用暗场。画海保留独特空间，但搜索、筛选、收藏、返回遵循系统语言。

优点是作品自然成为视觉中心，最符合“看起来就是 iPhone App”。艺术气质由画作、节奏和内容承载，无需每个控件都做复古装饰。

### B. 阅读馆藏式：系统界面 + 温和编辑排版

参考 Apple Books 的阅读思路：导航与表单用系统字体，作品标题与故事正文可保留少量衬线字；阅读区可使用温暖纸色，搜索与操作区使用明确的系统层级。

适合重视导览、艺术史故事的画间。要避免把纸色和衬线字体扩散到所有 tab、按钮和 sheet，否则容易回到现在的网页气质。

### C. 沉浸展厅式：暗色画海 + 克制的 Liquid Glass

保留夜色画海，将主要导航与少量工具设计为独立的玻璃层，普通作品资料仍用安静、可读的内容底色。玻璃效果不覆盖作品说明、所有卡片与正文。

Apple 将 [Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) 用作跨平台界面的动态材料；[采用指南](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)说明标准框架控件会随平台获得新外观。Web 模拟需要另行验证视觉、性能和可读性，不能把背景模糊视为原生效果等价物。

我的偏好：以 A 为整体结构，借 B 的故事阅读排版；C 只用于画海上的少数导航控件。

## Review 顺序与判断标准

1. 看 Apple 官方 UI Kit：先确定对系统字体、导航栏、底栏、sheet 的接受度。
2. 在手机上打开 Framework7 iOS demo：重点试 Navbar、Tabs、List、Searchbar、Sheet Modal 与页面返回。
3. 打开 Konsta demo 并切到 iOS：比较控件外观与浅深主题；不要把 demo 的导航能力全部归到组件库本身。
4. 对照 Ionic modal 页的交互样例，判断是否接受 Web 模拟的弹层手感。

后续若做画间原型，只需先验证三个真实场景：画海 → 作品详情 → 返回恢复；探索 → 搜索 → 结果 → 返回；筛选 sheet → 选择 → 收起。用相同作品和文案比较，避免素材差异干扰选型。

验收重点是边缘返回、捏合看画、键盘出现与收起、tab 状态恢复、文字放大与减少动态效果。当前没有证据证明任何候选已在画间内容量与交互负载下通过这些测试。

本轮不引入依赖、不更换 UI、不确定最低 iOS 版本。纯玻璃 CSS 特效库缺少导航与交互体系，不列为主选；Material 风格优先的库也不作为 iOS 原生感的第一选择。
