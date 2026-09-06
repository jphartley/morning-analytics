## 1. First-use composition and canonical copy

- [x] 1.1 Define the first-use guide's canonical text and fully bold introductory sentence exactly as specified, and verify every rendered string, capitalization, punctuation, order, and emphasis matches `specs/first-use-experience/spec.md`.
- [x] 1.2 Keep the centered subtitle and remove the large in-page `Morning Analytics` heading from new-analysis, loading, and completed-result states; render the journal editor and primary action before the `How it works` guide only when history is empty.
- [x] 1.3 Show `Write or paste your morning pages here` and `Reflect on My Pages` for every new analysis without changing rich-text editing, empty-input disabling, auto-analyze-on-paste, or normal submission behavior; verify those existing journal-input behaviors still work.

## 2. First-use-only navigation and controls

- [x] 2.1 Update the empty-history sidebar to show `Your reflections will appear here.` and omit `+ New Analysis` only during first use; verify the normal history list and new-analysis action return after a reflection is saved.
- [x] 2.2 Keep the analyst-persona selector and detail-view controls visible under existing role/capability rules before and after the first reflection; verify the toolbar does not change solely because history becomes non-empty.
- [x] 2.3 Preserve the account controls and palette picker without adding new privacy or persistence copy; verify both remain available in the first-use layout.

## 3. Regression coverage and first-use verification

- [x] 3.1 Add or update component/UI tests for empty-history and non-empty-history states, including exact canonical strings, full-sentence bold emphasis, punctuation, guide-only layout difference, stable editor affordances, and stable top-control visibility; verify the relevant app test command passes.
- [x] 3.2 Run `cd app && npm run lint` and verify it passes.
- [x] 3.3 Manually test with an authenticated account that has no analyses: verify the first-use composition and all locked wording; complete one reflection and verify analysis rendering, image generation, history persistence, and restoration of normal controls.

## 4. Provider-heading visibility

- [x] 4.1 Render image-provider headings only while the admin image-provider picker is available, for both fresh and historical image results; verify standard users see image grids directly without a heading or reserved heading space.
- [x] 4.2 Add regression tests for provider-heading visibility with and without the picker, including fresh and historical groups; verify the relevant app test command passes.
- [x] 4.3 Remove the generic pending-generation heading and verify the loading panel renders without `Generated Images` or reserved heading space.
