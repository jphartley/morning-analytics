# Design

## Context

See `proposal.md` for the decision to end the BFL trial. The current registry imports all adapters and treats every known ID as selectable. Dual mode hardcodes BFL followed by Midjourney, although the orchestrator already accepts an ordered provider list. Stored batches use the same known-ID list for parsing. Browser preset restoration excludes disabled Dual mode but cannot exclude a dormant single provider.

`app/.env.local` contains obsolete BFL production-default instructions. The user has removed its BFL keys. We must preserve other local credentials and avoid printing or committing the file. A worktree implementation must handle this original local file explicitly rather than assuming a candidate worktree contains it.

This design is needed because availability changes cross the server resolver, browser preferences, UI visibility, storage compatibility, and deployment configuration.

## Goals / Non-Goals

**Goals:** Enforce dormancy before external calls; keep history independent of availability; let a future adapter use the retained trial flow through one explicit candidate selection.

**Non-Goals:** A provider marketplace, dynamic plugin loading, a third adapter, durable jobs, revised image prompts, Midjourney capture fixes, role/session hardening, or changes to the database schema.

## Decisions

### 1. Separate identity, adapter implementation, and availability

Keep known provider IDs and display metadata usable by batch parsing, diagnostics, and history. Retain BFL adapter code and its isolated mocked tests. Use a lazy adapter wrapper so its module is imported only when that authorized provider is invoked; normal startup, resolution, and historical reads do not load it. This reduces normal module loading, but the retained code remains in the deployment. Add a shared availability policy used by both initial generation and regeneration. BFL is available only when it is the explicit candidate and server override support is true. Midjourney and mock remain available as deployment providers.

The resolver checks availability before adapter configuration or invocation. A disabled BFL deployment default is an actionable error, not a silent Midjourney fallback. A stale explicit BFL/Dual request is rejected before any provider call. Restoring a stale browser preference to the valid deployment default is separate from runtime provider failure; cross-provider fallback remains prohibited.

Alternative: delete BFL from the known-ID list. Rejected because existing batches would fail validation. Alternative: remove its key only. Rejected because it leaves selectable trial controls and relies on missing credentials as the disable mechanism.

### 2. Use one explicit optional candidate and retain existing gates

Add server-only `IMAGE_PROVIDER_TRIAL_CANDIDATE`. Unset or empty means dormant; there is no implicit BFL candidate. A candidate must have a registered adapter and differ from `midjourney` and `mock`. Invalid candidate settings hide client trial controls and produce actionable errors when trial generation is requested; they do not block otherwise valid Midjourney/mock generation.

An active trial requires a valid candidate plus `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=true`. The two server flags remain additional gates. Public visibility is derived from the same configuration; separate public override/Dual settings are removed. No active authorized trial means the provider picker is hidden even if legacy public flags are still true. Existing Test/Debug controls unrelated to image providers remain available. Remove the legacy public default fallback and migrate queue-generated mock environments to `IMAGE_GENERATION_PROVIDER=mock` before release.

Derive safe public candidate metadata in `next.config.ts` from the same server configuration used by the resolver, following the existing configured-default pattern. Do not ask operators to maintain a duplicate public candidate variable. Browser metadata is for display and preference normalization; the server independently enforces availability on every request. Document that changing the candidate requires rebuild/redeploy because its safe metadata enters the client bundle.

During an active trial, choices remain mock, Midjourney, the available candidate, and optionally Dual. Preserve existing administrator and view-mode rules: selection happens in Test/Debug, and an available saved selection can apply in Quiet or Insights. This change adds availability enforcement, not server-verified role enforcement.

Alternative: only flip existing flags. Rejected because Dual still assumes BFL and old flags could reactivate the completed trial. Alternative: add a full provider lifecycle framework. Rejected as unnecessary for one optional candidate.

### 3. Configure the pair at the resolver boundary

Keep `dual` as a generation selection, not a provider ID. Resolve it once into `[candidate, midjourney]`, validating the complete pair before invoking either adapter. Preserve candidate-first order to match historical BFL-first comparisons and avoid unnecessary presentation changes.

Keep sequential execution, the exact shared prompt, independent attempts and diagnostics, four images per provider, eight-image capacity reservation, partial success, and existing upload/storage behavior. Derive displayed labels from actual provider identity. Retain the BFL-specific adapter spec as the contract for the adapter when deliberately enabled; dormancy is enforced above it.

Remove the standalone paid BFL smoke script and its package command; a future authorized live trial uses the adapter-backed application flow. Remove the unused non-role-aware preset readers and use the existing shared provider-label helper for diagnostics.

Alternative: refactor the orchestrator or parallelize comparisons. Rejected because its existing list-based interface already supplies the mechanism needed.

### 4. Normalize preferences without rewriting history

Use available selections when restoring browser presets and deciding active generation mode, progress counts, regeneration capacity, and request overrides. Ignore a saved BFL/Dual selection when unavailable and use the deployment-derived default in every view. Do not delete the stored preference merely because it is dormant, consistent with current role-aware restoration.

Continue parsing old BFL and mixed-provider batches using known identities, independent of available adapters. Preserve their exact prompts, model identifiers, statuses, attempt IDs, ordering, and paths. Regenerating old BFL history uses the currently allowed selection, never the batch's historical provider. Preserve legacy flat-path rendering and the current provider-heading visibility rule. No data migration or cleanup job is needed.

### 5. Keep normal setup short and retain an experiment reference

Create `docs/image-provider-trials.md` with the retained mechanism, future-adapter checklist, safe configuration examples, and the BFL trial outcome as the user's quality assessment. Record it as an ended experiment without inventing benchmark results. Move BFL-specific configuration explanations there; keep architecture and Railway documentation aligned with Midjourney as the chosen production path. Preserve earlier reliability research as historical evidence while clearly updating the current product decision. Leave archived changes unchanged.

Clean the real local `app/.env.local` and committed `app/.env.example`: remove obsolete BFL activation prose and unused BFL settings, replace trial instructions with a short dormant-default explanation and reference link, and leave keys absent. Preserve unrelated values and settings. Consolidate BFL-specific implementation/setup detail in the trial reference and align `docs/current-architecture.md`, `AGENTS.md`, and `CLAUDE.md`. Keep mock defaults in `.env.example` for no-API checks; normal production instructions use Midjourney. Never copy actual environment values into planning, diagnostics, tests, screenshots, or commits.

Review `TechnicalDebt.md`: reword the BFL memory-pressure example as applicable to retained adapters, and mark optional comparison parallelization as deferred until another active trial warrants it. Do not implement those items.

## Risks / Trade-offs

- Stale clients can still submit old choices -> reject on the server before external work; a newly loaded client normalizes preferences.
- Build-time public configuration can lag server settings -> require rebuild/redeploy after all variable changes; server availability remains authoritative.
- Retained BFL code may age -> keep mocked contract coverage; require a fresh provider/API review and an explicitly authorized live application trial before reactivation. Retention is not a claim of future API compatibility.
- Dormancy is not code removal -> adapters remain in the repository, but normal startup and Midjourney/mock generation do not validate BFL credentials or invoke its API.
- Local environment files are not shared across worktrees -> separately report completion of cleanup in the original local file; do not copy the original secrets into candidate artifacts.

## Migration Plan

1. Implement and verify with no BFL credentials and no paid provider calls. Read the repository Node and secret-scan runbooks before applicable runtime instructions or commit/push work.
2. Clean the original local `app/.env.local` by editing only relevant comments and provider/trial settings, preserving unrelated values. Verify changes using comments, variable names, and non-secret state assertions; never print a raw diff of this file.
3. Provide the following Environment / Railway variables handoff for **morning-analytics service > Variables > production**. This plan does not establish the current production values; report new/changed/removed/not-present status during implementation without exposing secrets:

   | Variables | Intended state |
   | --- | --- |
   | `IMAGE_PROVIDER_TRIAL_CANDIDATE` | New optional variable; omit/unset for dormancy |
   | `IMAGE_GENERATION_PROVIDER` | Changed if needed to `midjourney` in production |
   | `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` | Changed if needed to `false` |
   | `IMAGE_PROVIDER_DUAL_MODE_ENABLED` | Changed if needed to `false` |
   | `NEXT_PUBLIC_IMAGE_PROVIDER`, `NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED`, `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED` | Removed; delete if present after setting the canonical default/server flags |
   | `BLACK_FOREST_LABS_API_KEY` | Removed from active setup if present; do not restore the removed local key |
   | `BLACK_FOREST_LABS_MODEL`, `BLACK_FOREST_LABS_API_BASE_URL`, `BLACK_FOREST_LABS_IMAGE_WIDTH`, `BLACK_FOREST_LABS_IMAGE_HEIGHT`, `BLACK_FOREST_LABS_OUTPUT_FORMAT`, `BLACK_FOREST_LABS_POLL_INTERVAL_MS`, `BLACK_FOREST_LABS_TIMEOUT_MS`, `BLACK_FOREST_LABS_MAX_RETRIES` | Remove unused active settings if present; retain explanations in the experiment reference |

4. Ask the user to make required production variable changes directly in Railway, review the staged changes, and deploy them with the code. Railway does not read local environment files. Saving variables is incomplete until deployed. All variable changes require deploy/redeploy; public settings and derived candidate metadata require a rebuild.
5. Verify the deployed app uses Midjourney, has no trial controls, and still loads existing history. Live Midjourney verification uses the normal user flow; do not reactivate BFL or spend BFL credits for this cleanup.
6. Rollback code if necessary without restoring BFL secrets or active trial settings. Keep Midjourney/default flags aligned and redeploy. History needs no rollback because this change does not migrate stored data.
