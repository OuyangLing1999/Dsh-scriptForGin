# 注意事项

每次改动完成后，都必须创建一个对应的Gitcommit，以便后续追踪和回滚。

每次改动后，都必须编写或更新相关测试，并在交付给用户前，确保所有测试和验证全部通过。

# 发布约定

用户已明确要求：本插件每次版本更新都提交并推送到 GitHub 仓库 OuyangLing1999/Dsh-scriptForGin。

完成功能修改后：更新 package.json 版本和 RELEASE_NOTES.md，运行 `node scripts/release.mjs`。此脚本执行构建同步、测试、git commit、push main、push 版本 tag、发布带 ZIP 的 GitHub Release。失败时检查实际远程状态，再继续未完成步骤；不以本地提交代替发布成功。

`node scripts/release.mjs --check` 仅运行发布前检查，不提交、不推送。

检查更新逻辑由 update-core.js 提供，scripts/build-client.mjs 将其和包版本嵌入 Client bundle；勿手动修改 client.js 中 UPDATE_CORE_START/END 之间的生成内容。
