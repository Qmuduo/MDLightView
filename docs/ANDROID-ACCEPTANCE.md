# Android 设备验收清单

验收日期：2026-10-18。设备为 `emulator-5554`，Android 16 / API 36 / x86_64；未连接实体手机。此前基线 Release 设备验收使用 `work/artifacts/app-release-x86_64.apk`。项目默认输出 `android/app/build/outputs/apk/release/app-release.apk` 已恢复为基线 ARM64 APK；UI 重设计版包保存在 `work/artifacts/ui-redesign/`，新建文档版包保存在 `work/artifacts/new-document/`，均含 JavaScript bundle，无需 Metro。模拟器结果不能代替实体 ARM64 手机验收。

## 新建文档功能追加验收

最终 x86_64 Release APK 安装在临时 Android 用户 12 中检查。此用户首次进入首页时显示示例引导；点击“新建文档”显示命名面板，`.md` 默认名称可直接创建，未带扩展名的自定义名称会补为 `.md`。空白文件立即进入源码编辑；输入 `FinalDraftQA` 后自动保留草稿，切换到阅读预览并返回首页后，最近记录显示草稿标记。重开文档后正文恢复。深色主题下的首页与命名面板可读，名称键盘打开时“创建并编辑”操作仍在可见区域。强制停止并重新启动后，首次示例入口隐藏，文档和草稿记录保留。

测试完成后已切回 Android 用户 0 并移除临时用户 12；没有清除或改写用户 0 的应用数据。最终截图位于 `work/artifacts/new-document/device/`。本次增量验收重点覆盖新建、草稿和重启行为；其他文件选择、分享、另存副本等已按上文既有 UI 重设计轮次验收，本次未重复操作。

| 构建 | 结果 |
| --- | --- |
| Android JS 导出 | `work/android-export-new-document-final` 成功，741 modules / 19 assets |
| x86_64 Release APK | 构建及 APK v2 签名检查通过；仅含 x86_64 原生库，安装到 Android 16 模拟器实测 |
| ARM64 Release APK | 构建及 APK v2 签名检查通过；仅含 arm64-v8a 原生库；未连接 ARM64 实体设备 |
| 默认 Android Release 输出 | 已恢复原有 ARM64 APK，SHA-256 `93828A7A1551E66F070C39276844DB1549BAD0F5FD852356D23FB2036188A2E8` |

## UI 重设计版验收

本次模拟器测试安装 `work/artifacts/ui-redesign/app-release-x86_64.apk`；构建环境、哈希、自动检查和历史 APK 恢复情况见 `docs/VERIFICATION.md`。测试使用临时 Android 用户 10，完成后切回用户 0 并移除临时用户；未清除原有应用数据。截图保存在 `work/artifacts/ui-redesign/`。

- [x] 空文档库首次实际进入首页，显示“阅读示例”和简洁空状态；首轮阅读返回首页时仍显示该入口。
- [x] 强制停止后重新启动，示例入口隐藏；最近文档、实际阅读进度和排序正常。
- [x] 打开真实最近文档继续阅读，显示 23% 进度；目录点击跳转，系统返回关闭目录。
- [x] 手工浅色、深色与“跟随系统”均可用；模拟器夜间模式开/关后，跟随系统阅读页随之切换。
- [x] 编辑源码、输入和预览可用；软键盘弹出时下方预览/另存操作仍可见。草稿标记与修改内容在强制停止后恢复。
- [x] “另存副本”打开系统 Documents 目录并保存新 Markdown 副本；再经首页文件选择器选中副本，正文成功导入和渲染。
- [x] 将纯文本通过 Android `ACTION_SEND` 分享到应用，创建“分享的文字.md”并展示内容；在全新临时用户中，首次 ACTION_SEND 冷启动直达阅读页，返回首页时示例仍可见，随后冷启动隐藏。
- [x] 中文标题、长文件名截断、代码块、表格及明暗主题排版可见。

该模拟器的 Android 系统文件选择器在临时用户首次启动时约等待 9 秒扫描 Documents provider，加载完成后保存及导入均成功。ARM64 Release 包已完成构建和签名/ABI 检查，但没有可用的 ARM64 实体手机进行安装验证。

## Debug Development APK

- [x] 安装并启动“轻览 MD”，首页、最近阅读及本地 Metro JS 可用。
- [x] 从应用内系统文件选择器打开 Documents 中的中文 Markdown 文档；中文、表格、代码围栏、重复标题与 Setext 标题均渲染。
- [x] 系统文件管理器对已运行应用执行 ACTION_VIEW；content URI 正常打开。
- [x] Files 分享 `text/plain` 的单个 `.txt` 文件到已运行应用；正文内容显示。
- [x] 冷/热启动纯文本 ACTION_SEND 显示分享正文；冷启动需在 Expo Dev Launcher 连接本地 Metro。
- [x] 重复标题目录跳转、浅/深主题切换、阅读位置与草稿恢复、SAF 另存成功与取消均通过。
- [x] 另存副本读回校验；另存前后源文件 SHA-256 相同。
- [ ] Debug Dev Launcher 冷启动 ACTION_VIEW 与文件 ACTION_SEND：连接 Metro 后读取 `content://` 在 `FileSystemFile.bytes` 遇到 Permission Denial / `SecurityException`。Release 变体已另行复测通过。

## Release APK

- [x] 安装并冷启动本地 Release APK；无需启动 Metro，日志无启动异常。
- [x] 从系统 Files 冷启动 ACTION_VIEW 打开 `.txt` 与 `.md` 文档；content URI 读取成功，无 `SecurityException`。Markdown 验收文档显示中文、表格、代码围栏和脚本字面文本。
- [x] 系统 Files 对已停止的应用分享单个 `text/plain` `.txt` 文件；冷启动后完整文件正文显示。日志没有 URI 权限拒绝。
- [x] 冷启动纯文本 ACTION_SEND；编辑器确认完整文本 `Release cold text share probe`，返回阅读后正文显示。此项通过 adb 合成 `EXTRA_TEXT` Intent 验证。
- [x] 目录包含两项同名标题；点击第二项后滚到“第二处目录跳转目标”。浅色、深色主题可切换。
- [x] 强制结束应用后从最近阅读重开，记录的 4% 阅读位置恢复在第二个重复标题 / Setext 标题 / 表格附近。
- [x] 编辑器插入 `ReleaseDraftMarker` 后 force-stop；首页显示“含编辑草稿”，重新打开后显示“已恢复编辑草稿”。
- [x] SAF 另存成功：Documents 中生成 `分享的文字-1792290360555-7f8e.md`，应用提示“副本已保存”；从设备拉回的 47 字节文件与编辑器内容一致。
- [x] 再次启动另存并取消目录选择：返回编辑器，没有成功提示，目录没有新增副本，草稿仍在。
- [x] 复测 Release 冷启动 ACTION_VIEW：强制停止后通过带读取授权的 `content://` Intent 打开 `.txt`，正文渲染成功。
- [x] 复测 Release 冷启动文件分享：强制停止后从系统 Files 选择 `text/plain` 文件，通过 Android Sharesheet 选择“轻览 MD”，正文渲染成功。

Files 的实际分享路径成功，但系统日志未显示 Intent extra 的具体组合；不能据此声称设备测试覆盖了“只有 `EXTRA_STREAM`、没有 ClipData”的精确 Intent。该选择路径由 expo-sharing Kotlin 单元测试覆盖。直接通过 adb 合成的 MediaStore `ACTION_SEND` 未提供有效 provider 授权并被系统拒绝，不计为系统 Files 分享验收；实际 Sharesheet 分享路径已单独通过。

## ARM64 Release 构建检查

- [x] `:app:assembleRelease` 使用 `-PreactNativeArchitectures=arm64-v8a` 成功。
- [x] APK 检查仅包含 `lib/arm64-v8a/` 原生库，Android APK v2 签名校验通过。
- [ ] 在 ARM64 实体手机安装、启动并运行文件工作流；本轮没有连接 ARM64 设备。

## 尚未实测

- [ ] Release 热启动 ACTION_VIEW / 文件 ACTION_SEND，以及 ACTION_SEND `.md`。
- [ ] 仅 `EXTRA_STREAM` 且不含 ClipData 的设备端合成 Intent；`application/octet-stream` ACTION_VIEW。
- [ ] 文件选择取消、非法扩展名、二进制、非法 UTF-8、超过 2 MiB 文件。
- [ ] 另存写入失败：当前 provider 可写，无法安全复现只读/断开 provider 或存储耗尽；成功和取消路径已验证。
- [ ] 跟随系统主题、页内锚点、外链确认，以及用网络请求记录确认远程图片没有发起请求。本轮只观察到图片替代说明文字，script 以普通文本显示。

应用配置禁止 Android 自动备份；本清单未验证厂商系统的备份实现行为。
