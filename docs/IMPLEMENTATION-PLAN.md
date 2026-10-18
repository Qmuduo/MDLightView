# MDLightView 基础项目实施计划

目标：在用户指定的空目录搭建可继续开发的 Android MVP。当前会话直接实施，不创建外部工作树，不自动提交或发布。

架构与约束见 MVP-DESIGN.md；导入、渲染、存储和 UI 各自独立。技术栈 Expo SDK 57 / React Native / TypeScript / markdown-it / WebView。

- [x] 从 Expo SDK 57 官方 blank TypeScript 模板引入根配置，安装 SDK 匹配的 document-picker、file-system、sharing、WebView、AsyncStorage、safe-area-context、dev-client。
- [x] 先写核心行为测试：禁用脚本和网络图片；标题 ID 与目录一致；校验扩展名、大小和 URI；存储写失败时保留旧索引；草稿优先恢复。运行并确认缺少实现导致失败。
- [x] 实现 renderMarkdown(source) 返回 `{ html, headings }`；buildReaderPage(source, theme, progress) 返回离线页面；用统一 token 生成目录 ID。
- [x] 实现 DocumentRepository，注入 `{ readText, writeNew, getIndex, setIndex }` 存储端口，提供 importDocument / list / open / saveDraft / saveProgress。内容先写新文件，再切换索引；草稿和进度更新串行执行。
- [x] 实现 Expo 文件与 AsyncStorage 适配；DocumentPicker、Linking ACTION_VIEW 和 expo-sharing 原始 payload 接入；实现 SAF 新文件导出与读回验证。
- [x] 实现首页、阅读 WebView、目录、主题和源码编辑。处理忙碌状态、取消、恢复草稿和文件切换；添加中文示例与无障碍标签。
- [x] 运行测试、tsc、expo install --check、expo-doctor、Android bundle 导出；检查 prebuild 生成的 VIEW/SEND manifest。未连接设备，原生验收单独记录。
- [x] 复核代码，修复实质问题；记录实际检查结果、文件清单、运行方式与未验证项。

测试使用 Vitest，关注真实行为，不为模板生成文件编写镜像测试。Android provider 行为以设备验收清单补足。
