## Context

The app already stores the generated image prompt in client state for fresh analyses (`currentImagePrompt`) and history views (`historyViewData.imagePrompt`). Generated images are rendered through `ImageGrid`, while regeneration controls are rendered separately below the grid. The new prompt disclosure should sit in the same post-grid area and use existing state rather than fetching or persisting new data.

## Goals / Non-Goals

**Goals:**
- Add a collapsed-by-default image prompt disclosure below generated images.
- Reuse the same UI for fresh analysis results and history views.
- Display the prompt in a styled, readable block using existing Tailwind design tokens.
- Provide a copy action when clipboard support is available.

**Non-Goals:**
- Editing image prompts before regeneration.
- Changing Gemini prompt parsing, Midjourney generation, storage schema, or history loading.
- Showing prompts when no image prompt is available.

## Decisions

- Create a small `ImagePromptDisclosure` component instead of embedding disclosure markup twice in `page.tsx`.
  - Rationale: fresh and history views share identical behavior, and a component keeps default collapsed state isolated per rendered prompt.
  - Alternative considered: inline JSX in both page sections. This is simpler initially but duplicates toggle, prompt block, and copy logic.
- Render the disclosure adjacent to existing post-grid controls rather than inside `ImageGrid`.
  - Rationale: `ImageGrid` currently only owns image display and click behavior. The prompt is analysis metadata, and keeping it outside avoids widening the grid component contract.
  - Alternative considered: pass `imagePrompt` into `ImageGrid`. That would make the grid responsible for non-image metadata and complicate reuse.
- Use client-side state for open/closed and copied feedback.
  - Rationale: the disclosure is presentational and does not need persistence across navigation or reloads.
- Use `navigator.clipboard.writeText` for copy when available.
  - Rationale: this avoids extra dependencies and keeps the enhancement browser-native. If clipboard writes fail, the prompt remains visible and usable.

## Risks / Trade-offs

- [Risk] The prompt disclosure could visually compete with the regeneration button below the grid. -> Mitigation: keep the disclosure compact, token-styled, and stacked with existing spacing.
- [Risk] Very long prompts may overflow or make the page hard to scan. -> Mitigation: use wrapping text in a bounded code/quote-style block.
- [Risk] Clipboard support varies by browser context. -> Mitigation: make copy additive; the reveal/hide requirement does not depend on copy success.

## Migration Plan

No data migration is required. The change can be deployed and rolled back as a frontend-only component/page update.

## Open Questions

None.
