# 本轮验证记录

日期：2026-10-18  
项目：G:\code_file\ai_project\MDLightView（Windows 本地磁盘目录）

## 检查范围与环境

本轮开始时重新读取 README、MVP 设计、实施计划、验证记录、依赖补丁说明和 Android 验收清单；项目内容并非空目录，已有实现均保留。未发现适用的 AGENTS.md。此目录没有 .git 元数据，因此无法提供 Git status 或提交差异；没有自动提交、推送或发布。

| 项目 | 本轮实测 |
| --- | --- |
| Node / npm | v24.19.0 / 11.17.0 |
| Java | JDK 21.0.12 运行 Gradle；JDK 17.0.12 提供 RN 工具链 |
| Gradle | Wrapper 9.3.1，发行包已成功下载到项目内缓存 |
| Android SDK | 项目内 work/android-sdk：Platform 36、Build Tools 36.0.0 |
| Android native 工具 | 项目内 NDK 27.1.12297006、CMake 3.22.1 |
| 设备 | emulator-5554，Android 16 / API 36 / x86_64；未连接实体手机 |

没有修改项目外 SDK 或系统配置。Android SDK、Gradle 缓存、CMake staging、APK 和临时日志都在项目 work/ 或生成的 android/ 目录。

## 本轮代码与配置调整

- package.json：让 Expo autolinking 从源码构建 expo-sharing，确保 Android 使用本地补丁，而不是未含补丁的预编译 AAR。
- patches/expo-sharing+57.0.23.patch：补上 EXTRA_STREAM / ClipData URI 选择器、解析器接入和 3 项 Kotlin 回归测试；expo-sharing 固定版本仍为 57.0.23。
- tsconfig.json：排除 work/，避免 TypeScript 把项目内 NDK 工具包自带的 JavaScript 文件纳入检查。
- README.md、docs/DEPENDENCY-PATCHES.md、docs/ANDROID-ACCEPTANCE.md、docs/VERIFICATION.md：记录本轮实际构建、设备结果和边界。
- work/short-cxx.init.gradle：本地 Gradle init 脚本把 Android 与 expo-modules-core 的 CMake staging 放到短路径，修复 Windows 长路径导致的 Ninja 依赖文件路径问题。该文件位于忽略的 work/，不属于便携源码配置。
- work/artifacts/app-release-x86_64.apk：保存先前通过 x86_64 模拟器验收的 Release APK，避免 ARM64 重建覆盖模拟器产物。

DraftWriter 串行保存、application/octet-stream 的 VIEW MIME、WebView 自定义导航确认等已有修正均保留。

## 自动检查和原生构建

| 检查 | 结果 |
| --- | --- |
| npm test | 3 个测试文件、12 项通过 |
| npm run typecheck | 通过 |
| npm run check:deps | Dependencies are up to date |
| npm run postinstall | patch-package 显示 expo-sharing@57.0.23 已成功应用 |
| expo-sharing Kotlin 单元测试 | 3 项通过，0 失败、0 错误；报告位于 node_modules/expo-sharing/android/build/test-results/testDebugUnitTest/ |
| Android Debug 构建 | :expo-sharing:testDebugUnitTest 与 :app:assembleDebug 成功，Gradle BUILD SUCCESSFUL |
| APK 安装与签名 | adb install -r 成功；apksigner v2 校验通过 |
| 既有检查（上一轮） | Expo Doctor 21/21、Android bundle 导出 662 modules；本轮未重复执行 |

本轮 Android 调试 APK：

- 绝对路径：G:\code_file\ai_project\MDLightView\android\app\build\outputs\apk\debug\app-debug.apk
- 大小：65,408,327 bytes
- SHA-256：9F1C4FCC5D0A774B261EFBDB711CB983C58CC57C1CD1D7A0C5BF1F68B0EF753C
- applicationId / version：com.mdlightview.app / 0.1.0
- minSdk / targetSdk：24 / 36
- 原生 ABI：仅 x86_64
- 签名：本地 debug key，APK Signature Scheme v2

这是可安装的本地开发 APK，不是发布签名包；实体 ARM 手机需要重新构建对应 ABI。安装方式见 README。

### Release 变体与 ARM64 APK

本地 Release 首次构建失败的直接原因是项目内 `work/local-maven` 已有 RN 模块元数据和 debug AAR，却缺少 `react-android-0.86.3-release.aar`；Gradle 选中该模块后不会跨仓库补齐分类 AAR。确认 Maven 镜像可访问后，将同版本 168,043,847 字节 release AAR 下载到项目自己的 `work/local-maven` 对应坐标；文件 SHA-1 与 Maven 镜像公布值一致。未修改 Expo、React Native 或 Gradle 版本，再次构建成功。

| 检查 | 结果 |
| --- | --- |
| x86_64 Release 模拟器验收 | `:app:assembleRelease` 成功；安装、签名和冷启动通过，JS bundle 已嵌入 APK |
| ARM64 Release 构建 | `-PreactNativeArchitectures=arm64-v8a :app:assembleRelease` 成功，Gradle `BUILD SUCCESSFUL in 4m 16s`；JS bundle 为 662 modules |
| ARM64 APK ABI 与签名 | APK 内仅有 `lib/arm64-v8a/` 原生库；`apksigner verify --verbose --print-certs` 的 v2 签名校验通过 |
| ARM64 设备运行 | 未连接 ARM64 设备，未安装实测；当前连接的 Android 16 模拟器为 x86_64 |

当前 Android ARM64 Release APK：

- 绝对路径：G:\code_file\ai_project\MDLightView\android\app\build\outputs\apk\release\app-release.apk
- 大小：27,054,508 bytes
- SHA-256：93828A7A1551E66F070C39276844DB1549BAD0F5FD852356D23FB2036188A2E8
- applicationId / version：com.mdlightview.app / 0.1.0
- minSdk / targetSdk：24 / 36
- 原生 ABI：仅 arm64-v8a
- 签名：本机默认 debug certificate，可安装测试，不是发布签名包

x86_64 模拟器验收包单独保存在 `work/artifacts/app-release-x86_64.apk`，大小 27,483,223 bytes，SHA-256 `CC12D9EF386C466A425B7527F03A1F75D9F27062995BC5784DDFA5E2D187B170`；原有模拟器验收结果对应这个 x86_64 APK。

## 模拟器验收摘要

完整清单见 docs/ANDROID-ACCEPTANCE.md。模拟器行为验收使用保存的 x86_64 Release APK。Debug Dev Launcher 冷启动 ACTION_VIEW 和文件 ACTION_SEND 曾遇到 content URI `SecurityException`。Release APK 随后通过系统 Files 实际复测：冷启动 ACTION_VIEW 的 `.md` / `.txt` 文件均打开并渲染，冷启动 Files 分享 `text/plain` `.txt` 文件也显示了正文。当前轮再次强制停止后复测 ACTION_VIEW 和真实 Sharesheet 文件分享，两条路径均通过。直接通过 adb 合成、没有有效 provider 授权的 MediaStore `ACTION_SEND` 不用于判断系统 Files 分享流程。

Release 另验证冷启动纯文本 ACTION_SEND、源码编辑与草稿恢复、SAF 另存成功和取消、重复目录标题跳转、明暗主题、强制结束后的阅读位置恢复。共享文本副本从 Documents 拉回核对为 47 字节，内容与编辑器一致。具体设备步骤与范围见验收清单。

## 尚未实测或阻塞

- 没有只读/断开的 Android 文档 provider 或可控存储耗尽环境，无法在设备上安全复现写入失败；成功和取消路径已实际验证。
- 未实测 ACTION_SEND `.md`、`application/octet-stream` ACTION_VIEW、超限/二进制/非法 UTF-8 文件、文件选择取消、跟随系统主题、外链确认和远程图片网络请求捕获。
- Files 分享成功说明当前系统路径的文件 Intent 可读，但系统日志未枚举 `EXTRA_STREAM` 与 ClipData 的具体组合。EXTRA_STREAM-only / ClipData URI 优先级由 expo-sharing 的 3 项 Kotlin 单元测试覆盖，尚未在设备上单独合成仅带 EXTRA_STREAM 的 Intent。
- Debug Dev Launcher 的冷启动文件 URI 权限问题仍存在；当前 release 变体未复现。若继续支持 debug 外部冷启，需单独设计并验证原生授权生命周期修复。

