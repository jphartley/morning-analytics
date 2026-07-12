## 1. Data Model and Shared Contracts

- [x] 1.1 Add a Supabase migration for `analyses.image_generation_batches` as JSONB with an empty-array default and no guessed legacy backfill.
- [x] 1.2 Add versioned generation-batch, provider-result-group, generation-selection, and multi-attempt diagnostics TypeScript contracts, including runtime validation for database JSON.
- [x] 1.3 Extend analysis storage types and initial-save handling to write flat paths and provider generation batches while preserving compatibility with existing callers.
- [x] 1.4 Replace regeneration's path-only update with one analysis-row update that atomically appends successful flat paths and all attempted generation batches.
- [x] 1.5 Add storage tests for successful, failed, dual, repeated same-provider/different-prompt, regeneration, malformed JSON, and legacy no-batch records.

## 2. Dual Selection and Orchestration

- [x] 2.1 Add a server-authoritative generation-selection resolver that keeps `dual` outside the provider registry and requires Test mode plus the existing override flag and `IMAGE_PROVIDER_DUAL_MODE_ENABLED`.
- [x] 2.2 Implement reusable single-provider attempt execution that produces one normalized result group with a fresh attempt ID, exact prompt, provider/model attribution, safe outcome, images, paths, and diagnostics.
- [x] 2.3 Implement sequential Dual mode orchestration in Black Forest Labs then Midjourney order, always attempting both and deriving success, partial-success, or failure from their independent outcomes.
- [x] 2.4 Update initial generation and regeneration actions to return result groups and diagnostics per attempt, upload successful groups, persist all batches, and retain single-provider behavior through the same contracts.
- [x] 2.5 Enforce four-slot single-provider and eight-slot Dual mode regeneration capacity on the server before making external requests.
- [x] 2.6 Add resolver and server-action tests covering flag authorization, identical prompts, stable ordering, distinct attempt IDs, both-success, each partial-success direction, both-failed, no implicit fallback, uploads, persistence, and cap rejection.

## 3. Provider-Labelled User Experience

- [x] 3.1 Extend the Test-view picker with `Dual mode` only when `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED` and the existing client override flag are enabled.
- [x] 3.2 Replace flat fresh-result state with provider result groups and render titled Black Forest Labs and Midjourney blocks, including provider-specific partial failure states.
- [x] 3.3 Reconstruct attributed result groups from history batches, render legacy image paths under a neutral label, and never infer a provider from path order.
- [x] 3.4 Preserve grouped rendering across regeneration while flattening URLs only for lightbox navigation and global image-count calculations.
- [x] 3.5 Make regeneration capacity and messaging selection-aware so Dual mode reserves eight slots and single-provider mode reserves four.
- [x] 3.6 Update Test-view progress and diagnostics UI to display and copy separate provider attempts without merging their timelines.
- [x] 3.7 Add component/page tests for picker visibility, ordered headings, partial failure, history attribution, legacy fallback, lightbox indexing, regeneration grouping, and cap messaging.

## 4. Configuration and Documentation

- [x] 4.1 Add both Dual mode flags with safe false defaults and explanatory comments to `app/.env.example` and expose only the public flag through Next.js configuration where required.
- [x] 4.2 Update Railway deployment documentation with the two production variable names, staged-variable review/deploy requirement, and mandatory redeploy for the `NEXT_PUBLIC_*` flag.
- [x] 4.3 Update `TechnicalDebt.md` to mark provider-attribution persistence resolved and record only genuinely deferred follow-ups such as optional parallel orchestration or durable jobs.

## 5. Verification and Trial Handoff

- [x] 5.1 Run image-provider, action, storage, and UI tests plus `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/`.
- [x] 5.2 Exercise mock/single-provider paths and the Dual mode success, each partial-success direction, both-failed, regeneration, history reload, and legacy-history scenarios without exposing secrets.
- [x] 5.3 Capture screenshots of full and partial provider-labelled results for review and include exact local verification results in the handoff.
- [x] 5.4 Include an `Environment / Railway variables` handoff and PR section listing `IMAGE_PROVIDER_DUAL_MODE_ENABLED` and `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED` as new, with migration order and redeploy instructions.
