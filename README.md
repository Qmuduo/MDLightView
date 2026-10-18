# 轻览 MD / MDLightView

阅读优先、编辑次要的 Android 本地 Markdown 阅读器。采用 React Native、Expo SDK 57、TypeScript、markdown-it 和 WebView。

## Windows 本地 Android 开发

此前 Android 基线轮次已在 Windows 本地构建并安装 x86_64 Debug APK，并构建 ARM64 Release APK。基线 x86_64 Release 模拟器验收包保存在 `work/artifacts/app-release-x86_64.apk`。本次 UI 重设计版 APK 位于 `work/artifacts/ui-redesign/`。Android SDK、Gradle 缓存和 CMake 中间文件都位于项目 work/ 目录；没有修改全局 SDK 配置。

当前检查机工具链：Node v24.19.0、JDK 21（Gradle）、JDK 17（Android/RN 工具链）、Gradle 9.3.1、Android API 36、Build Tools 36.0.0、NDK 27.1.12297006、CMake 3.22.1。模拟器为 Android 16 / API 36 / x86_64。

在本机重新生成原生目录或构建调试 APK：

    Set-Location 'G:\code_file\ai_project\MDLightView'
    npm install
    npx expo prebuild --platform android --no-install
    $env:EXPO_NO_TELEMETRY = '1'
    $env:ANDROID_HOME = (Resolve-Path '.\work\android-sdk').Path
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    $env:GRADLE_USER_HOME = (Join-Path $PWD 'work\gh')
    $env:JAVA_HOME = 'F:\Environment\java\jdk-21.0.12.8-hotspot'
    $jdk17 = 'F:\Environment\java\jdk-17.0.12_windows-x64_bin\jdk-17.0.12'
    Push-Location .\android
    .\gradlew.bat --init-script ..\work\local-maven.init.gradle --init-script ..\work\short-cxx.init.gradle "-Dorg.gradle.java.installations.paths=$jdk17" "-Dorg.gradle.java.installations.auto-download=false" "-PreactNativeArchitectures=x86_64" :expo-sharing:testDebugUnitTest :app:assembleDebug
    Pop-Location
    adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk

构建并安装本地 ARM64 Release 变体（JavaScript 已打包进 APK，不依赖 Metro；安装命令需连接 ARM64 Android 手机）：

    Push-Location .\android
    .\gradlew.bat --init-script ..\work\local-maven.init.gradle --init-script ..\work\short-cxx.init.gradle "-Dorg.gradle.java.installations.paths=$jdk17" "-Dorg.gradle.java.installations.auto-download=false" "-PreactNativeArchitectures=arm64-v8a" :app:assembleRelease
    Pop-Location
    adb install -r .\android\app\build\outputs\apk\release\app-release.apk

Release 命令生成面向 ARM64 手机的 APK。`app-release.apk` 只包含 `arm64-v8a` 原生库；本机 x86_64 模拟器验收使用保留包 `work/artifacts/app-release-x86_64.apk`，可在项目根目录执行 `adb install -r .\work\artifacts\app-release-x86_64.apk`。如需重新构建模拟器包，将上述 Release 命令中的 ABI 改为 `x86_64`。work/local-maven.init.gradle 和 work/short-cxx.init.gradle 是本机忽略文件：前者使用项目内已有的依赖镜像（含 RN debug/release AAR），后者把 CMake staging 放在较短的项目内路径以避开 Windows 长路径问题。路径不同的 Windows 机器需要按本机 SDK、JDK 和本地镜像位置调整。Expo autolinking 会从源码构建打过补丁的 expo-sharing。

Debug APK 只包含 x86_64 原生库，适用于本机模拟器；Release APK 只包含 ARM64 原生库，适用于 ARM64 手机。本轮没有连接 ARM64 实体设备，因此 ARM64 包尚未安装实测。Debug APK 是 Expo Development Build，运行时需先启动本地 Metro：

    $env:EXPO_OFFLINE = '1'
    npm run start -- --offline --port 8081
    adb reverse tcp:8081 tcp:8081

在 Development Launcher 中选择本机的 MDLightView 服务。debug Dev Launcher 冷启动 ACTION_VIEW 或文件 ACTION_SEND 会丢失 content:// 临时读取授权；本轮用 x86_64 Release 包在 Android 16 模拟器通过冷启动文件打开和系统 Files 文件分享复测。Release APK 使用默认 debug 证书，仅供本机安装与测试，不是发布签名包。详见 docs/ANDROID-ACCEPTANCE.md。

常用源码检查：

    npm test
    npm run typecheck
    npm run check:deps
    npm run export:android

## 当前范围

- 首页：系统文件选择器、新建空白 Markdown 并直接进入编辑、示例、最近阅读。
- 阅读：Markdown 标题、表格、列表、引用、代码，标题目录，浅色/深色/跟随系统，阅读位置。
- 入口：本地文件 URI 与单个文件/文本分享；导入后复制到应用私有目录，历史记录不依赖临时 URI 权限。
- 编辑：基础源码编辑、草稿保留、阅读预览；另存为新的 Markdown 文件并读回校验，保留原文件。
- 正文不执行文档内 HTML/脚本，不加载远程图片；外部链接经确认后打开。

只接受 UTF-8 文本（含 BOM），单文件不超过 2 MiB；GBK 等编码需先转换。图片暂以说明文字显示；相对图片、公式、Mermaid、语法高亮、全局搜索、文件回写与同步不在本轮范围。

草稿采用新文件写入再更新索引，旧版本不会在失败时删除。当前基础版尚未做历史版本和导入缓存的空间回收。没有密码保护或应用层加密；数据位于 Android 应用私有空间。Android 文件 provider 无法保证跨应用事务，失败时可能留下未完成的新副本，可从所选目录清理。

## 文档与检查

- MVP 架构与范围：docs/MVP-DESIGN.md
- 实施步骤：docs/IMPLEMENTATION-PLAN.md
- 设备验收清单：docs/ANDROID-ACCEPTANCE.md
- 本轮验证记录：docs/VERIFICATION.md
- 分享依赖补丁说明：docs/DEPENDENCY-PATCHES.md

源码集中在 src/：features/documents 负责存储与导入，features/reader 负责渲染与目录，features/library 负责首页，theme 负责颜色。

## 2026-10-18 UI 重设计交付

已将批准的预览实现到应用中：首页使用真实本地记录并突出打开文件与继续阅读；阅读页合并顶部栏并提供目录、进度、主题和源码编辑入口；新增首次首页示例引导状态，只在首次使用的当前进程会话显示。示例不会被删除，既有文件、草稿和阅读记录仍保留。

- 新版截图与 APK：`work/artifacts/ui-redesign/`（索引见该目录 README）。
- x86_64 Release 模拟器包：`work/artifacts/ui-redesign/app-release-x86_64.apk`。
- ARM64 Release 手机包：`work/artifacts/ui-redesign/app-release-arm64-v8a.apk`。
- 自动检查：Vitest 23 项通过、TypeScript 检查通过、Expo 依赖检查通过、Android 导出 740 modules / 19 assets。
- 新版包已在 Android 16 / API 36 / x86_64 模拟器检查首次引导、读者、目录、主题、键盘、草稿、另存副本、文件选择及文本分享。ARM64 APK 已构建并检查 ABI/签名，未连接 ARM64 实体手机。

详细设备范围与 SHA-256 见 `docs/ANDROID-ACCEPTANCE.md` 和 `docs/VERIFICATION.md`。Release 包使用本机 debug 证书，不是上架签名包。

## 2026-10-18 新建文档

首页新增“新建文档”入口。输入文件名后创建本机空白 Markdown，并立即进入源码编辑；草稿、阅读记录和另存副本继续使用现有本地流程。命名校验支持 `.md` 与 `.markdown`，不填写扩展名时自动添加 `.md`。本次验收截图和独立 APK 位于 `work/artifacts/new-document/`。

## 2026-10-18 品牌标识更新

首页品牌栏改用折页标记，应用桌面图标、Android 自适应与单色图标、网页 favicon 已统一更新。设计来源和资源说明见 `assets/brand-v4/`。

- ARM64 Android 手机安装包：`work/artifacts/branding-v4/app-release-arm64-v8a.apk`。
- x86_64 Android 模拟器安装包：`work/artifacts/branding-v4/app-release-x86_64.apk`。
- 两个 APK 均已构建并核对应用包名与处理器架构；ARM64 包尚未连接实体手机实装。
