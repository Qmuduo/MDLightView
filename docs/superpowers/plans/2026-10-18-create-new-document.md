# New Document Implementation Plan

> **For agentic workers:** Execute this plan inline in the current task. Keep each behavior change covered by a focused test and verify before completion.

**Goal:** Add a named, blank local Markdown document from the library and open it in the existing editor.

**Architecture:** Normalize new filenames in the existing document validation module, then create the blank record through `DocumentRepository`. Add a focused naming dialog to the library flow and reuse App activation, local draft persistence, and the current editor; leave import/export and storage formats unchanged.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript, AsyncStorage-backed `DocumentRepository`, Vitest, Android Gradle.

## Global Constraints

- Keep **打开文件** as the primary library action and add **新建文档** as a secondary action.
- Create only blank `.md` or `.markdown` documents and open the existing editor immediately.
- Keep files and drafts in the existing app-private local storage.
- Preserve the existing Markdown/WebView safety restrictions and import/share/export behavior.
- Keep light, dark, and system themes and accessible touch targets.

---

### Task 1: Filename rules and repository creation

**Files:**
- Modify: `src/features/documents/validation.ts`
- Modify: `src/features/documents/repository.ts`
- Test: `tests/documents.test.ts`

**Interfaces:**
- `normalizeNewDocumentName(value: string): string` trims a user-entered title, ensures an `.md`/`.markdown` extension, and throws a localized validation error for invalid names.
- `DocumentRepository.createDocument(name: string): Promise<DocumentRecord>` normalizes the name and stores an empty source in the existing repository.

- [x] Add tests for extension handling, invalid names, and persisted blank-document creation.
- [x] Run those tests and confirm they fail because the API is not implemented.
- [x] Implement the normalizer and repository method using the existing serialized import path.
- [x] Run the focused tests and confirm they pass.

### Task 2: Naming dialog and library action

**Files:**
- Create: `src/features/library/NewDocumentDialog.tsx`
- Modify: `src/features/library/Library.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `NewDocumentDialog` receives `{ visible, colors, busy, onClose, onCreate }`; it validates input, shows inline name errors, and calls `onCreate` with the normalized filename.
- `Library` receives `onCreateDocument` and `onCreateDocumentPress` callbacks; the dialog remains dismissible by close control and Android back.
- `activate(document, editing = false)` keeps existing opens in reader mode and permits creation to enter editor mode without an intermediate reader render.

- [x] Add the secondary library action and accessible, themed filename dialog with a default filename.
- [x] Wire successful creation to existing activation and set editing mode before mounting Reader.
- [x] Keep the dialog open when repository creation fails and dismiss it on successful creation.
- [x] Run focused tests and TypeScript checking after the integration.

### Task 3: Verify behavior and Android output

**Files:**
- Modify: `docs/VERIFICATION.md` only if this feature's checks add relevant evidence.
- Create: `work/artifacts/create-document-home.png` and `work/artifacts/create-document-editor.png` only if screenshots can be captured on an available device.

- [x] Run `npm test` and `npm run typecheck`.
- [x] Run the project's Android JS export and available Android build checks without overwriting existing artifacts.
- [x] If a device is available, create a named document, edit it, return to the library, reopen it, and verify the draft.
- [x] Report any build or device limitation explicitly.
