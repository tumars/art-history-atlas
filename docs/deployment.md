# 部署

项目同时发布到 [ferecord](https://www.ferecord.com/art-history-atlas/) 与 [GitHub Pages](https://tumars.github.io/art-history-atlas/)。`main` 上的源码、内容或构建配置更新会触发自动构建与发布；仅修改 README 或设计文档不会触发。

[发布工作流](../.github/workflows/deploy.yml)先完成类型检查、内容校验与构建，再将同一份产物发布到 GitHub Pages，并同步至 `tumars/ferecord` 仓库的 `sites/main/public/art-history-atlas/`，由主站的 EdgeOne Makers Git 集成发布。

- **GitHub Pages**：首次配置时，在 **Settings → Pages → Source** 选择 **GitHub Actions**。
- **主站同步**：本仓库需配置 Actions secret `FERECORD_DEPLOY_KEY`，对应 ferecord 仓库的专用可写 deploy key。工作流只同步图谱目录，但密钥权限覆盖整个目标仓库，应只在受信任的 `main` 工作流中使用。
- **版本核对**：产物中的 `source-version.txt` 记录源码提交。
- **失败重试**：构建失败不会发布或同步；可在 Actions 手动重跑 `deploy.yml`。手动运行不受 push 路径过滤影响，主站同步仅在 `main` 执行。
- **图片更新**：取图工作流也通过发布工作流同步图片。
