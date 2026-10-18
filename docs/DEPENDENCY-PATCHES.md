# 依赖修正

expo-sharing 精确固定为 57.0.23。patches/expo-sharing+57.0.23.patch 处理部分文件管理器发送 text/plain、只携带 EXTRA_STREAM（或 ClipData）URI 的情况：原解析器在 text/plain 下只读取 EXTRA_TEXT，因此文件分享会丢失。补丁优先选 EXTRA_STREAM，其次 ClipData URI；均无 URI 时再读取 EXTRA_TEXT。

package.json 的 Expo autolinking 配置要求从源码构建 expo-sharing，使这份 Kotlin 补丁实际进入 APK。只改 node_modules 不足以持久修复；每次安装后由 postinstall / patch-package 应用并检查。

本轮 npm run postinstall 成功应用 expo-sharing@57.0.23.patch。Gradle :expo-sharing:testDebugUnitTest 的 3 项 Kotlin 测试通过，覆盖 EXTRA_STREAM 优先、ClipData 回退和无 URI。Debug APK 从补丁后的源码编译；运行中的应用从系统 Files 接收 text/plain 文件流分享并成功打开。冷启动文件 URI 在 Debug Expo Dev Launcher 下曾因临时授权丢失而失败，但本轮 Release APK 的冷启动 Files 分享已通过，未遇到 `SecurityException`。系统日志没有枚举 Files Intent 的 stream extras / ClipData 组合，因此设备上精确的 EXTRA_STREAM-only 形式仍未单独合成；该 URI 选择逻辑由 Kotlin 单测覆盖。

应用收到 URI 后仍执行本地 URI、文件大小、UTF-8 和文本内容校验，不解析或下载分享的网页。升级 expo-sharing 时重新检查上游代码；若补丁已合入上游则移除，否则按上游变化重做补丁，不要盲目扩大允许版本。
