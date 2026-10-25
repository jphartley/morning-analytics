# Technical Debt

This document tracks technical decisions deferred from MVP and features planned for future versions.

## Authentication (v2+)

- [ ] **Email confirmation enforcement**: MVP allows signin before email confirmation for easier testing. Future versions should enforce email confirmation before granting access. See `openspec/changes/archive/2026-02-15-add-user-auth/design.md` for context.
- [ ] **Password reset flow**: MVP does not include password reset. Users who forget passwords will need manual support. Add in v2.
- [ ] **Account deletion**: Account self-deletion remains deferred. Analysis deletion already exists, including image cleanup, and passed the operator's production smoke check on 25 October 2026.
- [x] **Server-side route protection**: Deployed on 25 October 2026 in `5f3073c`. Cookie-backed sessions, the Next.js proxy and a protected server page entry now check authentication before returning the app. Browser session context continues to support the UI.

- [x] **Server-side session verification and ownership**:

  **Completed, 25 October 2026:** All 12 protected Server Actions verify the session, resolve the persisted role and enforce resource ownership. Routine database work uses the authenticated user's client and RLS; necessary privileged image operations are confined to a server-only adapter and server-managed resource allocations.

  **Verification:** 239 unit tests and 21 isolated Supabase integration tests passed. The production migration, ownership constraints and restrictive policies were checked; the operator verified sign-out/sign-in and analysis creation, reading and deletion. Railway runtime output identifies `5f3073ce8d9cad8c6d8952f54207267684ae6dd8` on Node 22.23.4. Cross-account and role denial tests ran locally against isolated real Supabase services, not other people's production data.

  See the [October authorization checklist](docs/security-remediation-2026-10.md#b-server-side-authorization) for the completion record. Detailed assessment evidence remains local and ignored. Independent security findings remain separate work.

  **Role-aware UI note:** Administrator-only operations now enforce the persisted role on the server as well as in the UI. Administrator status does not grant access to another account's content.

## Deployment & Infrastructure

**October 2026 security patch:** Framework, Sharp and Undici updates are deployed.
The Node release-age correction is verified in production at 22.23.4; the operator
also confirmed temporary NO_CACHE removal and continued 22.23.4 operation.
Keep the permanent Node-only app/mise.toml policy. See the
[Node runbook](docs/node-runtime-runbook.md) and
[remediation tracker](docs/security-remediation-2026-10.md) for evidence and the
remaining editor/tooling and other security findings. This patch is not a clean bill
of health for the whole dependency tree.

- [ ] **Next.js standalone output mode**: Currently using default Next.js output. For leaner Railway deployments, switch to `output: "standalone"` in `next.config.ts`. This produces a self-contained `.next/standalone/` directory with only the files needed to run. Requires ensuring non-code assets (e.g., prompt files in `/app/prompts/`) are copied into the standalone output via `outputFileTracingIncludes`. Deferred during Railway prep to keep initial deployment simple.

## OpenSpec Delivery Queue

- [ ] **Parallel worktree stress test**: The `parallel-openspec-delivery-queue` change validated the single-change `/opsx:start` path and finalization flow through real use (`add-view-density-modes`), including archive, squash merge, push, and cleanup. A deliberate two-worktree stress test with unique ports and conflict detection was deferred because parallel execution is not needed immediately. Before relying on parallel queue execution, create two harmless queued changes and verify unique port allocation, low-risk overlap handling, and high-risk conflict sequencing.

## Analytics & Monitoring

- [ ] **Auth metrics**: Track signup rate, signin failures, auth errors, session timeout events. Useful for debugging production issues and understanding user behavior.

## Contextual Memory

- [ ] **Add scalable memory pre-filtering when measured catalog growth warrants it**: `add-contextual-memory` deliberately sends the compact consolidated catalog directly to the AI relevance selector for the initial single-user experiment. If observed catalog size causes latency, cost, or selection-quality problems, add lexical/entity recall and/or vector similarity before AI reranking. Medium effort because it adds indexing, backfill, and retrieval evaluation.
- [ ] **Move rebuild to durable work if request limits become a problem**: The Test-view rebuild deliberately processes the newest bounded entry window sequentially in one server action. If real rebuilds approach hosting request limits, move replay to a resumable job with progress polling. Deferred because rebuild is an occasional personal experiment control. Medium effort.

## Image Provider Compatibility Phase

- [ ] **Replace in-memory data URLs with streamed or staged files**: All providers currently normalize images to data URLs before the shared Supabase upload. Four 1024x1024 images from a direct-provider adapter can create avoidable server memory pressure; BFL is currently dormant. The durable-job phase should stream downloads to storage or stage files with bounded memory. Origin: `add-switchable-image-providers`; medium effort because the shared upload contract changes.
- [x] **Persist provider attribution with analyses**: Resolved by `add-dual-image-provider-trial`. Versioned generation batches preserve provider, model, exact per-attempt prompt, attempt identity, outcome, timestamp, and image paths while legacy flat paths remain readable.
- [ ] **Optionally parallelize Dual mode orchestration when another trial is active**: Comparisons deliberately run the configured candidate and Midjourney sequentially for simpler failure isolation and Discord observation. If Railway request-duration measurements show enough benefit and headroom, switch the stable grouped-result contract to settled parallel execution. Origin: `add-dual-image-provider-trial`; small orchestration change plus production timing validation.

## Design & Palette System (from design-palette-tokens)

**Resolved:** Flash of default palette on page load — stored palette is applied before first paint; removed from open debt.

- [ ] **Palette preference not synced to database**: Palette selection is localStorage-only. Resets if user clears browser data or uses a different device. Consider syncing to user profile in Supabase if cross-device persistence is desired.
- [ ] **No system-preference dark mode**: The Midnight palette provides one dark option, but there's no `prefers-color-scheme` media query integration. Full system-preference dark mode support can be added later.
- [ ] **Error state colors not tokenized**: `ErrorState.tsx` and save-error toast use hardcoded `bg-red-*` / `text-red-*` classes. These are semantic error colors independent of the palette, but could be tokenized (e.g., `--error`, `--error-soft`) for full palette theming.

## Notes

- Each item should include context: where it originated (change/commit), why it was deferred, and rough effort estimate if known.
- Before archiving a change that introduces technical debt, update this file with the new items.
