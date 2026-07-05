## Context

The current main app UI always exposes a mix of writing controls, human-facing metadata, and low-level testing diagnostics. That is useful during development, but it makes the normal writing flow feel instrumented. The app already persists some personal UI preferences in localStorage, such as selected Gemini model and palette, so a local persisted view-density preference fits the existing client-side pattern.

The affected UI is concentrated in the client page and presentational components: the page header control area, journal input, analysis panel, image loading area, image prompt disclosure, diagnostics disclosure, and historical analysis view.

## Goals / Non-Goals

**Goals:**
- Add three view-density modes: quiet, insight, and test.
- Default first-time users to insight and persist the selected mode in localStorage.
- Keep the control subtle by using a top-right, icon-first three-segment control with hover/focus labels.
- Make each existing observability surface mode-aware without changing the underlying analysis, image-generation, history, or regeneration flows.
- Keep errors and warnings visible in every mode, with deeper diagnostic detail only in test mode.

**Non-Goals:**
- Rename Morning Analytics or change the app brand.
- Change the model, persona, prompt, image-generation, Supabase, or history persistence contracts.
- Add server-side user preference storage.
- Add new dependencies unless the existing icon stack already provides a suitable icon library.
- Redesign the full page layout beyond the visibility rules needed for the three modes.

## Decisions

### Use a single client-side view mode value

The main page should own a `viewMode` value with the union `quiet | insight | test`, initialize it from localStorage, and pass booleans or the mode itself to child components. This keeps the behavior inspectable and avoids a new global state abstraction for a page-local preference.

Alternative considered: create a React context. That would reduce prop passing, but the affected tree is shallow and a context would be heavier than needed for this scoped UI change.

### Persist mode in localStorage with `insight` default

The mode should be stored under a dedicated localStorage key and gracefully fall back to `insight` when storage is unavailable or contains an unsupported value. `insight` is the default because it preserves the app's useful current metadata while making quiet mode one click away.

Alternative considered: default to quiet. That optimizes for the calmest first impression, but it hides useful existing controls immediately and makes this change feel more disruptive.

### Treat the modes as visibility layers

Quiet mode is the writing-first layer: persona picker, writing pane, primary actions, gentle progress, original historical input, core results, images, regeneration controls, and errors/warnings. Insight mode adds human-facing metadata and creative affordances: model picker, word/readiness metadata, reading metadata, image prompt disclosure, and historical persona context. Test mode adds system observability: mock mode, elapsed seconds, provider/attempt/timeline diagnostics, and diagnostic copy controls.

Alternative considered: make each surface independently configurable. That would be more flexible but too fiddly for the problem; the user's stated need is one simple control.

### Keep errors and warnings mode-independent

Failure summaries, save errors, history load errors, image generation failure summaries, and cap-reached messages must remain visible in all modes. Only supporting technical detail should be hidden outside test mode.

Alternative considered: hide all status surfaces in quiet mode. That would make quiet more immersive, but it risks making failed or pending work look broken.

### Implement the control as icon-first segmented buttons

The top-right page header should show all three mode options as compact icon buttons with `aria-label`, `title`, and active styling. This supports direct switching without adding visible text labels.

Alternative considered: a single cycling button. It is visually smaller, but less discoverable and slower when moving directly between quiet and test.

## Risks / Trade-offs

- Mode names or icons may be unclear without visible text -> Use accessible labels, `title`, active state, and a compact tooltip/title affordance.
- Hiding model picker in quiet mode could obscure which model is in use -> Preserve the selected model internally and make insight mode the default.
- Quiet mode could look stalled during image generation -> Keep gentle image progress visible while hiding timing and diagnostics.
- Existing specs currently say some metadata always displays -> Update the affected spec deltas so the visibility contract is explicit.
- Historical views could feel inconsistent with fresh analyses -> Apply the same mode rules to history, while always keeping original input visible for context.
