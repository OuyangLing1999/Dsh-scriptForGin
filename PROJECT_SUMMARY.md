# 剧本工作台项目总结

## 定位与版本

- 产品：DSH Web GUI 插件「剧本工具」，面板「剧本工作台」。
- 用户：有基础的编导；AI 辅助选题、结构、对白、改编、审稿和返修，采用稿与事实由编导确认。
- 内容：面向60岁以上观众的连麦直播稿、家庭伦理短视频拍摄稿。
- 工作区版本：2.9.0。本次本地构建未创建 commit、tag 或 GitHub Release。
- 技术：纯 JavaScript、宿主 React、esbuild、Zod；客户端使用宿主模块加载器。

## 工作区

| 入口 | 用途 |
|---|---|
| 创作简报 | 直接选择模式与产出、输入原稿、维护约束与素材，无强制两步确认 |
| 稿件工作区 | 浏览候选稿、采用稿、编辑、选文 / 按话轮场次返修、润色、审稿、对照、导出 |
| 人物与样稿 | 主播人设、人物卡、提取草稿确认、样稿与标签 |
| 审稿记录 | 独立保存审稿和人物提取原文，按来源稿继续返修 |

宽屏正文与指令双栏、窄屏单栏；字号统一缩放，支持专注阅读。稿件支持全文搜索、命中高亮与角色台词统计；任务完成后展示主要下一步。维护操作收在「工作台设置」。

首次打开提供「带稿工作 / 从零创作 / 先看一个示例项目」三选一，可跳过、可重开；示例项目用于理解四个分区与版本 / 审稿关系。候选稿、已采用稿与来源版本在对应位置有悬浮说明。

## 主要源码

| 文件 | 职责 |
|---|---|
| client-ui.js | 界面与宿主交互、所有运行项目的结果订阅、任务输入快照、导入预览 |
| workbench.css | 宿主主题适配、响应式布局、统一字号与阅读视图 |
| workbench-model.js | 内容类型、旧数据规范化、稿件选择、结果归档、项目副本、最终请求 |
| workbench-analysis.js | 角色台词统计、全文搜索匹配、示例项目数据 |
| workbench-core.js | 项目校验、备份、持久化、阶段提示词、剧本检查、差异比较 |
| result-projection.js | 只认真实用户消息的任务绑定，忽略运行环境消息，收集正文与完成状态 |
| host-source.js | 注册 scriptWorkbench 投影，stateVersion 为 2，宿主打包内置 Zod |
| io-core.js | TXT / DOCX 正文导入导出 |
| humanize-core.js | 润色确定性自检，已接入界面 |
| update-core.js / update-install.js | 版本发现、明确安装方式及已安装版本核验 |
| scripts/build-client.mjs | 嵌入纯逻辑、样式与规则，构建 client.js 和 index.js |

## 数据与任务约定

项目 schemaVersion 保持1，以可选字段兼容既有备份。

- versions 仅保存稿件。artifactKind 为 idea / outline / script，phase 记录产生稿件的操作。
- currentVersionId 表示已采用稿。生成新稿后界面浏览新稿，已有采用稿不变。
- reports 保存审稿及人物提取记录，sourceVersionId 指向来源稿。
- personaDraft 与 characterDraft 是待确认资料，不直接改变已确认人设或人物卡。
- materials 保存独立文字素材，需主动追加到原稿后参与任务。
- pending.request 保存实际提交文本、文件收据及来源元数据；失败后按原请求重试。
- 导入备份与冲突副本保留内容，清空 pending / retry / sessionId，避免跨项目复用运行任务。
- watchSessions 同时订阅当前项目与后台 pending 项目，结果按 taskId 回写。

保存使用浏览器 localStorage，350ms 防抖，并在 pagehide / 切后台时保存。冲突保留双方副本；额度或写入失败显示状态并保留内存内容供备份。

## 规则隔离

最终任务文本由 buildTaskText 统一组装。只有 full / revision 加载完整剧本技能；思路、大纲、人设、审稿、人物提取和润色使用对应阶段规则。润色思路 / 大纲时保持其类型。直播采用生活细节、信息和情绪递进；短视频按场次冲突、证据和转折组织。

## 验证

```bash
npm run build
npm test
node --check client.js
node scripts/browser-check.mjs
node scripts/workbench-browser-check.mjs
```

纯逻辑测试覆盖旧数据迁移、稿件与报告隔离、连续优化、最终请求阶段隔离、宿主环境消息、长稿首中尾插删、近似比较标记、存档校验、安装核验与DOCX。

浏览器检查分两类：真实GUI可达性 / 认证状态，以及真实构建客户端与宿主React的独立模拟会话测试。独立测试不代替真实宿主连接与真实模型结果质量验证，证据位于 artifacts/browser-check/。

## 安装与限制

安装本目录或安装包解压目录后重新加载插件并刷新页面。当前 ZIP 发布形式需手动解压安装；本地旧来源不会被重装后误报为升级成功。新浏览器访问受认证保护的真实 GUI 时，检查报告记录认证阻碍。

视频理解取决于当前模型与工具，原始资料缺失时保留待复核项。超大差异中段采用有界近似比较并在界面标注。所有项目数据仍保存在当前浏览器，迁移浏览器或清理网站数据前需导出备份。
