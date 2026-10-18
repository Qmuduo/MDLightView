# New Document Design

## Goal

Let readers create a local blank Markdown document from the library and begin editing it immediately.

## Approved interaction

- Keep **打开文件** as the library's primary action and add **新建文档** as a secondary action beside it in the same action group.
- Open a native-styled naming dialog with **新建文档.md** prefilled. Selecting the field text makes it quick to replace the default.
- Accept `.md` and `.markdown`; append `.md` when the user enters a name without an extension. Reject empty names, unsupported extensions, path separators, and filename control characters with an inline explanation.
- The confirmation action reads **创建并编辑**. It stores an empty Markdown source through the existing local document repository and opens the existing editor for that record.
- A failed storage operation keeps the dialog available and uses the app's existing error reporting. Cancel, the Android back action, and the dialog close affordance dismiss it without creating a record.
- The created record participates in recent reading and existing draft autosave, restore, reading progress, and save-copy behavior.

## Constraints

- Keep the current repository and private app storage; do not add a new storage format or external file permission.
- Preserve the approved light/dark/system palette and the 44-point minimum action targets.
- Do not change import, share, export, Markdown rendering, or WebView security behavior.
- Do not create placeholder content or add any permanent sample-document entry.

## Validation

Test filename normalization and repository creation with real in-memory storage, including empty content and the recent-record index. Run the full test suite and TypeScript check. If Android tooling and a device are available, verify the dialog, creation, editor, and return-to-library path in the app.
