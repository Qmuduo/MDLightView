# MDLightView UI Redesign Implementation Plan

> **For agentic workers:** Execute this plan inline in the current task. Keep each behavior change covered by a focused test and verify before completion.

**Goal:** Implement the approved native reading-first redesign and show the sample guide only on the first home visit, preserving existing file, draft, sharing, navigation, and security behavior.

**Architecture:** Keep `DocumentRepository`, import/export, markdown-it, and the WebView security boundary intact. Add a small session-aware first-home guide around AsyncStorage, centralize the approved light/dark palette and reusable native controls, then adapt Library, Reader, and App routing to real records and the one-time guide.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript, AsyncStorage, Vitest, Android Gradle.

## Global Constraints

- Use the approved preview palette: `#2E59A7`, `#5AA4AE`, `#5B7A8C`, `#F6BEC8`, and `#ED6D46` with its specified light and dark surfaces.
- Keep the existing local-only document repository and Markdown/WebView safety restrictions.
- Never render the home screen before first-use state and the initial external route have been resolved.
- Keep the user-visible sample guide out of later launches, including launches with an empty library.
- Do not treat app background/foreground as a new session.

---

### Task 1: First-home guide state

**Files:**
- Create: `src/features/onboarding/firstHomeGuide.ts`
- Create: `tests/firstHomeGuide.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- `FirstHomeGuide` receives `{ readSeen: () => Promise<boolean>; markSeen: () => Promise<void> }`.
- `hydrate(existingRecordCount: number): Promise<void>` resolves persisted state and marks legacy users with existing records as seen.
- `enterHome(): Promise<boolean>` returns whether the sample entry is visible for the current process session.

- [x] Write focused tests for first visit, later launch, same-session return, upgrade with existing records, and delayed AsyncStorage hydration.
- [x] Run the new tests and confirm they fail because the guide state module is missing.
- [x] Implement the minimal session-aware guide state and prove the tests pass.
- [x] Gate initial home rendering on both initial storage hydration and initial file/share route resolution.
- [x] Verify an incoming document opened before the first home visit does not consume the guide opportunity.

### Task 2: Shared design tokens and controls

**Files:**
- Modify: `src/theme/colors.ts`
- Modify: `src/components/Action.tsx`
- Create: `src/components/Icon.tsx` if the installed Expo icon package is available without adding an unnecessary dependency.

**Interfaces:**
- `Palette` describes all color roles used by Library, Reader, editor, and sheets.
- Shared actions expose accessible labels, a 44-point minimum touch target, primary/secondary/quiet variants, and disabled/loading states.

- [x] Replace legacy palette values with the exact approved light/dark roles.
- [x] Use one consistent line-icon implementation for folder, document, theme, back, contents, edit, and save actions.
- [x] Keep controls legible in light, dark, and system-selected themes.

### Task 3: Reading-first library

**Files:**
- Modify: `src/features/library/Library.tsx`
- Modify: `src/App.tsx`

- [x] Remove promotional copy and make “我的文档” the page heading.
- [x] Keep “打开文件” as the primary action and show the sample entry only when the first-home guide allows it.
- [x] Show a continue-reading card only when records exist, using the latest persisted record and its actual progress.
- [x] Render compact, accessible recent-document rows with safe truncation, progress/date metadata, and a small draft label.
- [x] Show a concise empty state without fake document counts, dates, or progress.

### Task 4: Reader, table of contents, and editing surfaces

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/reader/Reader.tsx`
- Modify: `src/features/reader/markdown.ts`

- [x] Fold the return action, filename, and read/edit status into one compact document header with a discoverable theme control.
- [x] Give the WebView more room and align its page, body, code, table, quote, and link colors with the native palette.
- [x] Keep progress updates outside the WebView source so they cannot reload or reset scroll position.
- [x] Put directory and edit actions in a compact bottom bar, with actual reading progress and 44-point touch targets.
- [x] Use a coordinated bottom-sheet directory with heading indentation, scrolling, close and back dismissal, and a no-heading explanation.
- [x] Show draft and save status in the editor, preserve source preview and save-copy actions, and keep actions usable above the Android keyboard.

### Task 5: Verification and delivery artifacts

**Files:**
- Modify: `docs/VERIFICATION.md`
- Modify: `docs/ANDROID-ACCEPTANCE.md`
- Create: `work/artifacts/ui-redesign-home.png`
- Create: `work/artifacts/ui-redesign-reader.png`
- Create: `work/artifacts/ui-redesign-editor.png`

- [x] Run the complete existing Vitest suite and TypeScript check.
- [x] Run dependency validation and Android JS export.
- [x] Write the JavaScript export to `work/ui-redesign-android-export` so the pre-existing `work/android-export` stays intact.
- [x] Build installable x86_64 and ARM64 Android APKs with the repository's cached SDK/JDK/Gradle setup.
- [x] Install on the connected Android emulator and inspect empty home, populated home, reader, table of contents, editor, theme, and back navigation.
- [x] Capture readable screenshots and update verification notes with exact tested paths and any device/environment limits.
