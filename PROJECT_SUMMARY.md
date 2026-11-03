# 「剧本工具」插件项目总结（供审核）

## 1. 项目概览

- **产品名**：剧本工具（侧边栏入口显示名）
- **插件包名**：`@local/elderly-script`
- **定位**：DeepSeek Harness（DSH）Web GUI 插件，面向不熟悉 AI 的用户，为 60 岁以上老年观众创作与优化**直播间连麦剧本**，并支持**家庭伦理短视频拍摄稿**的扒片与高保真改编。
- **当前版本**：`2.7.0`
- **GitHub 仓库**：https://github.com/OuyangLing1999/Dsh-scriptForGin
- **当前 Commit / Tag**：`8ffa13b` / `v2.7.0`
- **本地开发目录**：`D:\HarnessWork\elderly-script-plugin`

## 2. 技术栈

- **纯 JavaScript**，无业务框架依赖；React 由 DSH 浏览器模块表提供。
- **Host 端**：注册 `sessionProjections` 会话投影（用 `zod` 校验状态），把生成任务的结果正文与完成状态投射给 Client。
- **Client 端**：`window.__ModuleLoader__.load({ id, factory })` 动态模块，React 函数组件渲染面板。
- **构建**：`esbuild` 打包 Host（`host-source.js` → 自包含 `index.js`，内置 zod）；`build-client.mjs` 用字符串拼接把核心与规则嵌入 `client.js`。
- **更新**：GitHub Releases 检查 + 语义化版本比较 + 插件内调用 DSH `pluginManager` 远程接口安装。

## 3. 目录与模块

| 文件/目录 | 作用 |
|---|---|
| `package.json` | 版本、脚本、`dsh.bundle`/`dsh.client` 声明、发布文件清单 |
| `cordis.patch.yml` | Loader 补丁，插入 `elderly-script` 插件行 |
| `client-ui.js` | Client UI 源码（面板组件） |
| `client.js` | 构建后的 Client 产物（含嵌入核心与规则） |
| `host-source.js` | Host 源码（sessionProjections 注册） |
| `index.js` | 构建后的 Host 产物（内置 zod） |
| `workbench-core.js` | 项目结构、校验、提示词构建、剧本检查、逐行差异 |
| `io-core.js` | TXT/DOCX 导入导出（含自实现 DOCX 打包/解包） |
| `update-core.js` | 更新检查、版本比较、自动检查调度 |
| `humanize-rules.js` / `humanize-core.js` | 文字润色规则与确定性自检 |
| `result-projection.js` | 会话投影纯函数（任务结果折叠） |
| `scripts/build-client.mjs` | 构建 Client/Host、嵌入规则与技能 |
| `scripts/release.mjs` | 构建+测试+提交+推送+打标签+发布 ZIP |
| `scripts/browser-check.mjs` | 无头浏览器检查入口 |
| `skills/elderly-livestream-script/` | 直播剧本创作规范 |
| `skills/duanshipin-jiaoben/` | 短视频扒片/改编规范、references、assets、Python 校验脚本 |
| `tests/` | Node 测试（见第 8 节） |

## 4. 功能清单

### 4.1 创作
- 四种模式：直播创作、直播优化、视频扒片、短视频改编。
- 三档产出：**只想要思路**、**要大纲**、**要完整剧本**。
- 两步创作向导：第 1 步填资料 → 第 2 步确认要点。
- 创作确认卡：关系、冲突、目标、结尾、锁定事实、保护台词。
- 人物卡、优秀样稿库（含标签筛选）、主播人设。

### 4.2 阶段（`phase`）
`idea`、`idea-opt`、`outline`、`outline-opt`、`full`、`revision`、`audit`、`persona`、`polish`

- 思路：方向建议（卖点/冲突/诉求/转折/结尾钩子/延展选题）。
- 大纲：结构骨架（直播按话轮提纲、短视频按场次骨架）。
- 全文：严格输出规范。
- 修订：按修改要求返修。
- 审稿：AI 审校，不代写全文。
- 人设：输出/优化主播人设。
- 润色：去 AI 味，保留事实与语气。

### 4.3 结果与版本
- 面板内查看任务进度（等待秒数）与最终成稿。
- 版本列表、切换、按行高亮对照、面板内编辑保存新版本。
- 程序检查：直播稿 200 字长对白/显式交接/动作提示/重复段；短视频稿八段/11 字段/时长/人物/空间路径。
- 定向返修（按话轮/按场次）、AI 审稿、文字润色。
- 逐级扩展：思路 → 大纲 → 剧本；思路/大纲可单独优化。
- 导出 Markdown / TXT / 真实 DOCX；导入 TXT / MD / 字幕 / DOCX / 视频（上传到会话）。

### 4.4 项目与数据
- 多项目、自动保存（带冲突保护与恢复副本）、备份导入导出、删除。
- 本机浏览器 localStorage 持久化。

### 4.5 更新
- 打开面板自动检查 GitHub 最新正式版，每 30 分钟重查。
- 「在插件内更新」：直接调用 `pluginManager.installBundle`；不可用时回退「下载安装包」。
- 大字号模式、首次使用引导（可随时重开）。

## 5. 数据模型

**项目（Project）关键字段**
```js
{
  schemaVersion: 1,
  id, title,
  mode: 'live' | 'live-opt' | 'duan-ba' | 'duan-adapt',
  deliverable: 'idea' | 'outline' | 'script',   // 默认 script
  topic, notes, draft, videoPath, videoEvidence, fingerprint, outline,
  persona, personaDraft,
  brief: { relationship, conflict, goals, ending, lockedFacts, protectedLines },
  intensity: 'light' | 'structure' | 'deep',
  characters: [{ id, name, relationship, goal, knowledge, voice, state }],
  samples: [{ id, title, text, notes, mode, tags }],
  selectedSampleIds: [],
  versions: [{ id, text, phase, mode, createdAt, taskId }],
  pending: { taskId, phase, repairCount, submittedAt, mode, instruction } | null,
  retry: { phase, instruction, repairCount, reason } | null,
  autoRepair: boolean,
  editBuffers: { [versionId]: string }
}
```

**会话结果投影（scriptWorkbench）**
```js
{ taskId, text, done, error, seq, turn, phase }
```
- 任务标记：`[DSH_SCRIPT_TASK:<id>]`、`[DSH_SCRIPT_PHASE:<phase>]`。
- 只采集任务所属 turn 的 `assistant/message` 正文；忽略 reasoning/tool 内容；无关后续用户消息解绑。

## 6. 关键流程

1. **创作向导**：填资料（必填就地校验）→ 确认要点 → 生成。
2. **任务提交**：新建/复用会话 → 可选上传文件 → 拼接规则与提示词（带任务/阶段标记）→ `session.prompt` → 记录 `pending`。
3. **结果回写**：Host 投影完成后，Client 按 `taskId` 定位项目，写回版本、清理 pending。
4. **自动返修**：成稿程序检查发现问题且 `autoRepair` 且未返修过，独立队列触发一次 `revision`。
5. **润色/人设**：作为特殊阶段，润色存为版本；人设存 `personaDraft`，用户确认后写入 `persona`。
6. **更新**：检查 GitHub → 有新版 → 调 `pluginManager.installBundle(installTarget.spec)` 或下载安装包。

## 7. 输出规范（内置规则）

- **直播稿**：纯对白，只写【角色名】；每段正式台词 ≥200 汉字；显式话轮交接；通俗口语；主题聚焦孝道家庭伦理。
- **短视频稿**：八段式拍摄稿协议、逐场 11 字段、空间连续性、时长核算、证据状态、结构指纹、高保真改编。
- **思路/大纲**：只给方向或骨架，不套用完整剧本协议。
- **证据规则**：区分“明确/合理概括/不确定”，不虚构事实、数据、来源、人物经历；“可能≠确定”“计划≠已经”。

## 8. 测试

- 运行方式：`node --test tests/*.test.mjs`（或 `release.mjs --check`）。
- 当前 **38/38 通过**，覆盖：
  - 项目备份/校验/持久化恢复
  - 提示词模式与阶段隔离（含思路/大纲/优化/润色）
  - 直播/短视频校验
  - 逐行差异
  - 会话投影（任务绑定、正文权威、结束原因、无关轮次隔离）
  - 自动更新（版本比较、下载地址、调度）
  - DOCX 导入导出与损坏校验
  - 文字润色自检

## 9. 发布流程（AGENTS.md 约定）

- 每次改动必须提交 Git commit 并更新测试，交付前测试全过。
- 每次版本更新推送到 GitHub：更新 `package.json` 版本 + `RELEASE_NOTES.md` → `node scripts/release.mjs`（构建同步、测试、commit、push main、push tag、发布带 ZIP 的 GitHub Release）。
- `node scripts/release.mjs --check` 仅发布前检查。
- 更新检查逻辑在 `update-core.js`，构建时嵌入 Client；勿手改 `client.js` 生成块。

## 10. 已知限制与风险（供审核重点）

1. **“在插件内更新”对远程用户**：`pluginManager.installBundle` 用的是当前安装来源（`installTarget.spec`）。若用户从旧 ZIP 解压目录安装，重装不会拿到新版本，只能「下载安装包」覆盖后重装；真正的远程自动更新尚未实现（需 Host 下载 ZIP + 解压 + 安装）。
2. **浏览器验证受限**：DSH Web 有访问令牌，无法用无头浏览器自动点开面板截图验证渲染；目前通过 `Slots.listSubTree` 确认入口注册在线，实际渲染靠用户刷新确认。
3. **润色自检未在面板展示**：`checkHumanize` 只在测试层覆盖，面板未显示“润色后仍命中 N 处”。
4. **多标签页合并**：冲突时是“保留双方项目副本”，未做按项目细粒度合并。
5. **人设/人物卡提取依赖模型 JSON 输出**：解析失败会提示手动填写，不自动写入。
6. **视频理解依赖模型与工具**：读不到音轨需补字幕/转写，不能仅靠静帧声称理解。

## 11. 建议审核方向

- `client-ui.js` 的 `submitTask` 阶段路由与源文本选择是否正确（重点 `editPhases` 与 `chosen`）。
- `workbench-core.js` 的 `buildPrompt` 阶段隔离（`strict` 判定）与 `validateScript` 边界。
- `result-projection.js` 的任务绑定/解绑逻辑与 `turn` 语义。
- `scripts/release.mjs` 的发布幂等性与失败恢复。
- 更新流程的 `pluginManager` 调用与回退路径。
