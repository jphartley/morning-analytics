## Why

The main writing surface has accumulated useful but noisy operational details: model selection, word and reading counts, image prompt plumbing, loading timing, mock-mode indicators, and Midjourney/Discord diagnostics. Users need a calm writing experience most of the time, while still being able to reveal human-facing insight metadata or full testing diagnostics when needed.

## What Changes

- Add a persisted three-mode view-density control with modes `quiet`, `insight`, and `test`.
- Place the control in the top-right area of the main page header as an icon-first three-segment control with hover/focus labels.
- Default first-time users to `insight` and persist subsequent mode changes in localStorage.
- Keep the app name `Morning Analytics` unchanged.
- In `quiet` mode, show the persona picker, writing pane, primary controls, gentle image progress, original historical input, analysis/images, regeneration controls, and all errors/warnings while hiding observability metadata and diagnostics.
- In `insight` mode, add human-useful metadata and controls: model picker, journal word count/readiness, analysis reading metadata, image prompt disclosure/copy, and historical analyzed-by context.
- In `test` mode, add system observability: mock-mode banner, elapsed seconds, image-generation diagnostics disclosures, provider/attempt/timeline details, and diagnostic copy affordances.
- Preserve existing analysis, image generation, auto-analyze, history, regeneration, and error behavior; only the visible UI density changes by mode.

## Capabilities

### New Capabilities
- `view-density-modes`: Defines the three persisted UI-density modes and the visibility contract for quiet, insight, and test views.

### Modified Capabilities
- `app-shell`: Main-page header and result/loading areas must honor the selected view mode while keeping errors visible.
- `model-picker`: The model picker is visible in insight and test modes, but hidden in quiet mode while preserving the selected model.
- `analyst-persona-selection`: The persona picker remains visible even in quiet mode.
- `word-count-indicator`: The journal word count and auto-analyze readiness indicator are visible only in insight and test modes.
- `analysis-reading-time`: Analysis reading metadata is visible only in insight and test modes.
- `loading-feedback`: Duration hints are visible in insight and test modes, while quiet mode uses gentler progress without timing detail.
- `image-prompt-disclosure`: Image prompt disclosure is visible in insight and test modes, but hidden in quiet mode.
- `image-generation-diagnostics`: Diagnostic affordances and detailed image-generation traces are visible only in test mode.
- `image-regeneration`: Regeneration controls and cap/error messaging remain available across modes, with diagnostics limited to test mode.

## Impact

- Affected UI code: `app/app/page.tsx`, `app/components/JournalInput.tsx`, `app/components/AnalysisPanel.tsx`, `app/components/LoadingState.tsx`, `app/components/ImageGenerationDiagnosticsDisclosure.tsx`, `app/components/ImagePromptDisclosure.tsx`, `app/components/ModelPicker.tsx`, `app/components/AnalystPicker.tsx`, and likely a new small view-mode control component.
- Browser storage: add a localStorage key for the selected view-density mode.
- No database schema, API contract, Supabase, or package dependency changes are expected.
- Manual testing should cover first-time default mode, persistence, mode switching, fresh analysis, image generation waiting/completion/failure, and historical analysis views.
