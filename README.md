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

## 兼容性

- DSH（DeepSeek Harness）Web 平台
- React 18（由 DSH 浏览器模块表提供）
- 主题 token：`--dsw-alias-*`
