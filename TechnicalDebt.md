# Technical Debt

This document tracks technical decisions deferred from MVP and features planned for future versions.

## Authentication (v2+)

- [ ] **Email confirmation enforcement**: MVP allows signin before email confirmation for easier testing. Future versions should enforce email confirmation before granting access. See `openspec/changes/add-user-auth/design.md` for context.
- [ ] **Password reset flow**: MVP does not include password reset. Users who forget passwords will need manual support. Add in v2.
- [ ] **Account deletion**: MVP does not allow users to delete their accounts or analyses. Add deletion flow in v2, including Supabase storage cleanup.
- [ ] **Server-side route protection (middleware)**: MVP uses client-side auth checking only (AuthSessionProvider). For production, implement `@supabase/ssr` with cookie-based sessions and Next.js middleware for server-side route protection. Benefits: no flash of loading state, faster redirects, defense in depth. Removed during add-user-auth because default Supabase JS client stores tokens in localStorage (not cookies), making middleware cookie checks fail.

- [ ] **Server-side session verification for writes (critical for production)**:

  **Current state (MVP):** Server actions (`analyzeText`, `generateImages`, `saveAnalysis`) receive `userId` as a parameter from the client. The client gets this from the Supabase Auth session (JWT-validated), then passes it to server actions. The server trusts this value without independent verification.

  **What's protected regardless:**
  - All **reads** are protected by RLS policies at the database level (`WHERE user_id = auth.uid()`). No client-side code can bypass this. Even with a known email or UUID, one user cannot read another user's analyses or images.
  - All **deletes** and **updates** are protected by RLS for the same reason.

  **What's vulnerable:**
  - **Write operations** (specifically `saveAnalysis`) use the service role key (bypasses RLS) and trust the client-provided `userId`. A technically sophisticated attacker who (a) has an account, (b) discovers another user's UUID, and (c) modifies client JavaScript could **insert fake analyses into another user's history**. They cannot read, modify, or delete existing data.

  **Risk assessment:** Low for MVP/localhost. UUIDs are random and not exposed in the UI. Attack requires authenticated access plus DevTools modification. The "reward" is limited to junk insertion.

  **Fix for production:** Implement `@supabase/ssr` with cookie-based sessions so that server actions can independently verify the authenticated user via `supabase.auth.getSession()` reading from HTTP-only cookies. This eliminates trust in client-provided userId entirely. This item and the middleware item above should be implemented together as they share the same underlying infrastructure (`@supabase/ssr` cookie-based sessions).

## Deployment & Infrastructure

- [ ] **Next.js standalone output mode**: Currently using default Next.js output. For leaner Railway deployments, switch to `output: "standalone"` in `next.config.ts`. This produces a self-contained `.next/standalone/` directory with only the files needed to run. Requires ensuring non-code assets (e.g., prompt files in `/app/prompts/`) are copied into the standalone output via `outputFileTracingIncludes`. Deferred during Railway prep to keep initial deployment simple.

## OpenSpec Delivery Queue

- [ ] **Parallel worktree stress test**: The `parallel-openspec-delivery-queue` change validated the single-change `/opsx:start` path and finalization flow through real use (`add-view-density-modes`), including archive, squash merge, push, and cleanup. A deliberate two-worktree stress test with unique ports and conflict detection was deferred because parallel execution is not needed immediately. Before relying on parallel queue execution, create two harmless queued changes and verify unique port allocation, low-risk overlap handling, and high-risk conflict sequencing.

## Analytics & Monitoring

- [ ] **Auth metrics**: Track signup rate, signin failures, auth errors, session timeout events. Useful for debugging production issues and understanding user behavior.

## Image Provider Compatibility Phase

- [ ] **Remove the legacy public provider fallback**: `NEXT_PUBLIC_IMAGE_PROVIDER` is still accepted when `IMAGE_GENERATION_PROVIDER` is unset so existing deployments continue to work. Remove the fallback after every environment has migrated to the server-only setting. Origin: `add-switchable-image-providers`; small effort after deployment audit.
- [ ] **Replace in-memory data URLs with streamed or staged files**: All providers currently normalize images to data URLs before the shared Supabase upload. Four 1024x1024 BFL images can create avoidable server memory pressure. The durable-job phase should stream downloads to storage or stage files with bounded memory. Origin: `add-switchable-image-providers`; medium effort because the shared upload contract changes.
- [ ] **Persist provider attribution with analyses**: Provider and model are present in attempt diagnostics but are not stored on historical analysis rows. Add provider/model attribution when the durable image-job schema is introduced. Origin: `add-switchable-image-providers`; small schema/UI effort, best combined with the job migration.

## Design & Palette System (from design-palette-tokens)

**Resolved:** Flash of default palette on page load — stored palette is applied before first paint; removed from open debt.

- [ ] **Palette preference not synced to database**: Palette selection is localStorage-only. Resets if user clears browser data or uses a different device. Consider syncing to user profile in Supabase if cross-device persistence is desired.
- [ ] **No system-preference dark mode**: The Midnight palette provides one dark option, but there's no `prefers-color-scheme` media query integration. Full system-preference dark mode support can be added later.
- [ ] **Error state colors not tokenized**: `ErrorState.tsx` and save-error toast use hardcoded `bg-red-*` / `text-red-*` classes. These are semantic error colors independent of the palette, but could be tokenized (e.g., `--error`, `--error-soft`) for full palette theming.

## Notes

- Each item should include context: where it originated (change/commit), why it was deferred, and rough effort estimate if known.
- Before archiving a change that introduces technical debt, update this file with the new items.
