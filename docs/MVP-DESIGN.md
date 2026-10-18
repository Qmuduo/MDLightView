# 轻览 MD / MDLightView — MVP 设计

日期：2026-10-17。目标目录在首次检查时存在且为空，无已有项目或 AGENTS.md。全部项目操作在本目录完成，不创建外部工作树。用户已授权搭建，此文档记录本轮采用的默认设计。

## 产品边界

Android、本地、阅读优先。打开即进入阅读；源码编辑为次级操作。无账号、同步、广告、遥测或后台上传。首页提供打开文件、示例与最近阅读。阅读页提供目录、主题和编辑入口。

## 技术取舍

采用 Expo SDK 57 + React Native + TypeScript；使用官方 blank TypeScript 模板的依赖组合，package-lock 锁定。SDK 57 是本轮选用的稳定基线，不追随刚发布的 SDK 58。

采用 markdown-it + react-native-webview：共享一次 token 解析生成 HTML 与目录，支持标题、段落、列表、代码、表格、引用。相较原生 Markdown 组件，便于保持目录与排版一致；相较原生 Android，保留 Expo 开发体验。暂不引入导航库、全局状态库、富文本编辑器。

## 模块与数据流

- `src/features/documents`：导入校验、持久化副本、最近阅读、草稿与安全导出。
- `src/features/reader`：Markdown 解析、WebView 文档、标题目录、滚动比例恢复。
- `src/features/library`：首页、最近阅读与示例。
- `src/theme`：浅色、深色、跟随系统与统一颜色。
- `src/App.tsx`：界面状态和入口协调，不把文件 IO 放入渲染组件。

系统文件选择器（copyToCacheDirectory）、ACTION_VIEW 的 content/file URI、ACTION_SEND 的文件或文本 → 校验 UTF-8 文本及大小（2 MiB）→ 应用私有副本 → 阅读。接收分享使用 expo-sharing 的原始 payload，避免 URL 自动解析触发网络访问；只接受单文件或文本，不下载远程网址。系统 URI 权限不可持久依赖，最近阅读从私有副本恢复。

正文禁用原始 HTML、脚本、外部图片和其他网络资源；WebView 使用 CSP，只执行应用自己的滚动桥脚本。链接点击由原生确认后仅打开 HTTP(S)/mailto，目录锚点在页内跳转。图片显示替代文本，目录权限与相对图片后续另做。

## 阅读与编辑

主题偏好持久化；每篇保存滚动比例并在内容布局完成后恢复。Markdown token 生成唯一标题 ID；目录与正文共用该 ID。源码使用多行等宽 TextInput；预览编辑内容，不自动覆盖原文。

编辑先持久化草稿；切换文件、返回、系统返回键须先保留草稿。另存副本通过 Android Storage Access Framework 选择目录并创建新文件（唯一文件名），写入后读回校验；失败时保留草稿，不声称保存成功。不直接覆盖来源文件，不把跨 provider 写入描述为原子事务。应用内记录采用不可变新文件 + 索引切换，失败不删除旧版本。

## 第一阶段验收

能打开本地 .md/.markdown/.txt 和共享文本；显示完整中文、表格和代码；目录跳转；主题切换；关闭后恢复最近阅读与位置；编辑草稿可恢复；另存失败不丢失草稿。系统打开/分享及 SAF 的最终验收须在 Android 开发构建实测。

自动检查覆盖恶意 Markdown、目录与代码围栏、导入限制、写失败与索引失败恢复；运行 TypeScript、Expo 依赖检查、Android bundle 导出。没有设备时明确记录未验证项，不声称真机通过。

## 后续范围

相对图片目录授权、大文件分块、语法高亮、原文件回写和冲突检测、搜索、字体设置、多文件标签、PDF 导出均不纳入基础版本。

## 官方资料

- https://docs.expo.dev/versions/v57.0.0/sdk/sharing/
- https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/
- https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
- https://docs.expo.dev/versions/v57.0.0/sdk/filesystem-legacy/
