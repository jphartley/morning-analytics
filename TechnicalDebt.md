# Technical Debt

This document tracks technical decisions deferred from MVP and features planned for future versions.

## Authentication (v2+)

- [ ] **Email confirmation enforcement**: MVP allows signin before email confirmation for easier testing. Future versions should enforce email confirmation before granting access. See `openspec/changes/add-user-auth/design.md` for context.
- [ ] **Password reset flow**: MVP does not include password reset. Users who forget passwords will need manual support. Add in v2.
- [ ] **Account deletion**: Account self-deletion remains deferred. Analysis deletion already exists, including image cleanup, and was included in the operator's production smoke confirmation; the separate server-authorization finding below still applies.
- [ ] **Server-side route protection (middleware)**: MVP uses client-side auth checking only (AuthSessionProvider). For production, implement `@supabase/ssr` with cookie-based sessions and Next.js middleware for server-side route protection. Benefits: no flash of loading state, faster redirects, defense in depth. Removed during add-user-auth because default Supabase JS client stores tokens in localStorage (not cookies), making middleware cookie checks fail.

- [ ] **Server-side session verification for writes (critical for production)**:

  **Current evidence, 24 October 2026:** Multiple Server Actions trust a browser-supplied userId without independently verifying the caller. getMemoryStore and resetMemory use service-role storage helpers, and analysis deletion compares ownership with the caller-supplied userId. The service-role client bypasses RLS; blanket claims that all reads, updates and deletes are protected are incorrect. Browser authentication and a nonempty userId check do not establish server authorization.

  **Risk and scope:** Urgent production authorization work remains open. Exposure is not limited to inserting unwanted analyses: inspected paths include cross-user memory reads/resets, deletion and paid provider operations. No production exploit was attempted, and this review does not establish that every data path is exploitable. The October dependency/Node patch does not resolve this issue.

  **Fix for production:** Derive identity from a server-verified session/token, use getUser() or verified getClaims() as appropriate, and enforce ownership and roles before each data operation or provider call. getSession() alone is not a server authorization check. Prefer user-scoped clients/RLS and constrain necessary service-role operations. See [Supabase's server-side guidance](https://supabase.com/docs/guides/auth/server-side/nextjs) and the [October authorization checklist](docs/security-remediation-2026-10.md#b-urgent-server-side-authorization). This is a separate implementation change requiring cross-user and missing/forged-credential tests; documentation correction does not complete it.

  **Role-aware UI note:** `add-admin-user-modes` adds a browser-resolved `user`/`admin` product boundary for the trusted-friends release. It deliberately does not enforce that role in server actions; complete this hardening before relying on roles for sensitive server-side authorization.

## Deployment & Infrastructure

**October 2026 security patch:** Framework, Sharp and Undici updates are deployed.
The Node release-age correction is verified in production at 22.23.4; the operator
also confirmed temporary NO_CACHE removal and continued 22.23.4 operation.
Keep the permanent Node-only app/mise.toml policy. See the
[Node runbook](docs/node-runtime-runbook.md) and
[remediation tracker](docs/security-remediation-2026-10.md) for evidence and the
remaining authorization/editor/tooling findings. This patch is not a clean bill
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
