## 1. Storage and server deletion

- [x] 1.1 Add an ownership-checked helper that resolves analysis-scoped storage paths, removes images, and deletes the analysis row in retry-safe order.
- [x] 1.2 Add a guarded server action with support-safe failure responses.
- [x] 1.3 Unit-test path scoping, ownership rejection, partial failures, and successful cleanup.

## 2. User experience

- [x] 2.1 Add an accessible confirmation dialog with focus trapping and fallback focus restoration.
- [x] 2.2 Add guarded delete entry points to history entries and the selected-analysis view.
- [x] 2.3 Centralize delete orchestration, optimistic history removal, accessible success feedback, and retry errors in the page.
- [x] 2.4 Add deterministic neighbor selection and unit tests.

## 3. Verification and specification import

- [x] 3.1 Validate TypeScript, lint, Vitest, build, and the documented manual scenarios during the Temper delivery.
- [x] 3.2 Translate the completed Temper behavior into an archive-ready OpenSpec capability.
