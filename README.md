# Dsh-scriptForGin

面向 **DeepSeek Harness (DSH)** 的图形化 Web GUI 插件：为 **60 岁以上老年观众**创作和优化**直播间连麦剧本**。

给不熟悉 AI agent 的人用：填好表单、点一下按钮，剩下的交给 AI。

## 功能

- **写新剧本**：输入主题、角色设定、商品/活动信息，一键生成完整剧本
- **优化已有剧本**：粘贴原稿、填写优化要求，一键按规范重写
- **发送目标**：默认新建会话，也可发送到已有会话
- **自动跳转**：提交成功后自动切到对话面板查看 AI 产出

## 剧本规范（内置在配套 Skill 中）

- 线下主播 + 线上连麦（一麦、二麦），一切互动靠台词，不写动作描写
- 单段台词不少于 200 字，一个核心意思说完再交接
- 话轮交接必须显式：点名 / 称呼 / 复述对方观点 / 直接接话
- 主题聚焦孝道、家庭伦理；语言通俗直白，关键信息换说法重复

## 目录结构

```
.
├── package.json          # Bundle 清单（dsh.bundle + dsh.client）
├── cordis.patch.yml      # Loader 补丁：插入 elderly-script 插件行
├── index.js              # Host 端（本插件逻辑全在 Client 端）
├── client.js             # Web GUI 面板：表单 + 提交 + 会话路由
├── icon.svg              # 侧边栏图标
├── locale/
│   ├── en.json           # 插件展示元数据（英文）
│   └── zh.json           # 插件展示元数据（中文）
└── skills/
    └── elderly-livestream-script/
        └── SKILL.md      # 配套创作规范 Skill（复制到 DSH skills 目录）
```

## 安装

### 1. 安装插件 Bundle

在 DSH 的 Agent 会话中执行：

```text
plugin_manager(action: install_bundle, target: <本仓库本地路径>)
```

或使用 DSH Web GUI 的「插件」页面手动安装本目录。

### 2. 安装配套 Skill

把 `skills/elderly-livestream-script` 整个目录复制到 DSH 的 skills 目录：

- Windows 默认位置：`C:\Users\<用户名>\.dsh\skills\elderly-livestream-script\`

或直接在会话中说：

```text
创建一个名为 elderly-livestream-script 的 skill，内容见 skills/elderly-livestream-script/SKILL.md
```

## 使用

1. 打开 DSH Web GUI
2. 点击左侧栏「老年剧本」图标
3. 选择「写新剧本」或「优化已有剧本」，填写表单
4. 点「生成剧本」/「开始优化」
5. 自动跳到对话面板查看结果

## v1.1 短视频工作台

侧边栏入口现为「剧本工作台」，提供四种模式：直播创作、直播优化、短视频扒片、高保真改编。

短视频模式内置完整参考规则：证据状态、结构指纹、人物功能位、冲突与证据阶梯、八段式拍摄稿、逐场 11 字段、空间连续性、时长预算、剪辑发布与验收。随包附带完整 references、assets 和两个 Python 工具，见 `skills/duanshipin-jiaoben/`。来源记录见 `UPSTREAM.md`。

扒片时填写运行 DSH 的电脑可访问的视频路径；引用已有附件时必须选中附件所在会话。当前表单不直接上传视频。媒体理解取决于当前模型与工具；读不到音轨时应提示补充字幕或转写，不能仅靠静帧声称理解完整视听内容。

改编时粘贴完整母版，并填写人物关系、场景、预算、时长等要求。任务要求保留结构机制、列出对照、递增保存改编版本。校验脚本只能验证结构与部分连续性，不能代替对视频事实和表演质量的审阅。

插件提交后打开对应会话查看产出。AI 生成质量及文件校验需以该次任务实际执行结果为准。

## 检查更新与发布

面板打开时自动检查 GitHub 最新正式版，保持打开时每 30 分钟重查，离开面板后停止。有新版时，顶部显示更新提醒、可展开的更新说明和「查看并下载更新」入口；用户可选择「稍后再说」，继续创作。底部保留当前版本和手动「检查更新」。自动检查失败会在底部提示原因，并在下一周期重试。所有下载安装由用户主动决定。

面板底部显示当前版本，点击「检查更新」会查询本仓库最新 GitHub 正式 Release，显示新版本、更新说明和下载入口。请求超时或受 GitHub 限流时可重试，不会将失败误报为已是最新版。下载 ZIP 后解压，通过 DSH 插件管理安装解压目录并刷新页面；该按钮不会自动替换插件文件。

每次版本更新都同步到 GitHub：修改 package.json 版本并填写 RELEASE_NOTES.md 后运行 `node scripts/release.mjs`，自动同步界面版本、运行检查、提交代码、推送 main 与版本标签，并上传 ZIP 到 GitHub Release。需要本机 Git、已登录的 gh CLI 和可用的 GitHub 网络连接。仅检查使用 `node scripts/release.mjs --check`。

## 兼容性

- DSH（DeepSeek Harness）Web 平台
- React 18（由 DSH 浏览器模块表提供）
- 主题 token：`--dsw-alias-*`
