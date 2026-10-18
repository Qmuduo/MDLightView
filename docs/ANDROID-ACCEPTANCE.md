# Android 设备验收清单

验收日期：2026-10-18。设备为 `emulator-5554`，Android 16 / API 36 / x86_64；未连接实体手机。Release 设备验收使用 `work/artifacts/app-release-x86_64.apk`；当前标准构建产物 `android/app/build/outputs/apk/release/app-release.apk` 是新构建的 ARM64 包，含 JavaScript bundle，无需 Metro。模拟器结果不能代替实体 ARM64 手机验收。

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
