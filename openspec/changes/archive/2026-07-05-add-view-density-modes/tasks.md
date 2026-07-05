## 1. View Mode Foundation

- [x] 1.1 Add a `quiet | insight | test` view-mode type and localStorage helpers with `insight` as the default fallback.
- [x] 1.2 Add an icon-first three-segment view-density control in the top-right main page header with accessible labels, hover/title labels, and active-mode styling.
- [x] 1.3 Wire the selected mode through the main page so child components can render quiet, insight, or test surfaces.

## 2. Header And Writing Surfaces

- [x] 2.1 Keep the analyst persona picker visible in all modes.
- [x] 2.2 Show the model picker only in insight and test modes while preserving the selected model for analysis in quiet mode.
- [x] 2.3 Update JournalInput so word count and auto-analyze readiness text are visible only in insight and test modes while auto-analyze behavior still works in quiet mode.
- [x] 2.4 Show the mock-mode banner only in test mode.

## 3. Loading And Result Surfaces

- [x] 3.1 Update LoadingState usage so quiet mode shows gentle progress without duration hints and insight/test modes retain duration hints.
- [x] 3.2 Update AnalysisPanel so reading-time and word-count metadata are visible only in insight and test modes.
- [x] 3.3 Keep user-facing errors and warnings visible in all modes.

## 4. Image Prompt, Diagnostics, And Regeneration

- [x] 4.1 Show image prompt disclosure/copy only in insight and test modes.
- [x] 4.2 Show image-generation diagnostics, elapsed seconds, provider/attempt/timeline details, and diagnostic copy affordances only in test mode.
- [x] 4.3 Preserve gentle image-generation progress in quiet mode and keep image-generation failure summaries visible in all modes.
- [x] 4.4 Keep regeneration controls and maximum-image warnings available across all modes while limiting regeneration diagnostics to test mode.

## 5. Historical Analysis Views

- [x] 5.1 Keep original historical input visible in all modes.
- [x] 5.2 Show historical analyzed-by context only in insight and test modes.
- [x] 5.3 Apply the same reading metadata, image prompt, diagnostics, regeneration, and warning visibility rules to historical analyses.

## 6. Verification

- [x] 6.1 Verify first-load default mode is insight and supported saved modes persist across reloads.
- [x] 6.2 Verify quiet, insight, and test visibility rules on the idle writing screen.
- [x] 6.3 Verify quiet, insight, and test visibility rules during analysis loading, image-generation pending, complete result, image-generation failure, and regeneration flows.
- [x] 6.4 Verify historical analysis views follow the selected mode rules.
- [x] 6.5 Run the repo-required frontend checks from `app/`, including lint and build when feasible.
