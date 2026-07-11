## Context

Morning Analytics currently implements image generation directly inside `app/app/actions.ts`. The action resolves either `mock` or Midjourney, where any non-mock `NEXT_PUBLIC_IMAGE_PROVIDER` value silently selects Midjourney. The Midjourney path triggers `/imagine` through Discord, observes or recovers a completed grid through a bot client, splits the grid into four data URLs, and uploads those images to Supabase. Initial generation and regeneration duplicate much of that provider-specific orchestration.

Black Forest Labs exposes a supported asynchronous API with a different lifecycle: submit an image request, retain its request ID and returned polling URL, poll to a terminal state, then immediately download a short-lived signed result. One BFL request produces one image, while the app contract expects four images per generation round.

This change is a compatibility and evaluation layer. Midjourney must remain operational, BFL must be testable in the full app, and switching must not require code changes. The future durable job/worker architecture remains desirable but is intentionally not a prerequisite for evaluating FLUX image quality and reliability.

## Goals / Non-Goals

**Goals:**

- Define one provider contract that preserves the app's four-image generation and regeneration behavior.
- Keep `mock`, Midjourney/Discord, and Black Forest Labs independently selectable.
- Make the deployment default a strict server-side setting and support a separately gated test-mode override.
- Reuse existing Supabase storage, history, image-cap, and user-facing result behavior.
- Preserve the existing Midjourney implementation behind an adapter rather than rewriting or deleting it.
- Implement BFL submission, polling, URL validation, immediate download, bounded retry, and error classification without a new SDK dependency.
- Make diagnostics understandable and safe for either provider.
- Keep the implementation reusable when generation later moves into durable jobs.

**Non-Goals:**

- Removing or repairing the known Midjourney/Discord visibility limitations.
- Automatically failing over from one paid provider to another.
- Introducing `image_generation_jobs`, a queue worker, Realtime updates, or per-slot durable retries.
- Persisting provider/model attribution for historical image rounds.
- Allowing ordinary production users to select providers outside an explicitly enabled test capability.
- Supporting BFL image editing, reference images, webhooks, arbitrary models, resolutions, aspect ratios, or output formats in the first integration.

## Decisions

### 1. Resolve providers through a registry and common contract

Create a provider boundary under `app/lib/image-providers/` with provider IDs, a result/error contract, a strict resolver, and one adapter per provider. The initial result contract will return four ordered image data URLs plus provider metadata because `uploadImagesToStorage()` already accepts that shape.

Conceptually:

```ts
type ImageProviderId = "mock" | "midjourney" | "black-forest-labs";

interface GenerateImageSetRequest {
  attemptId: string;
  prompt: string;
  count: 4;
  diagnostics: ImageGenerationDiagnosticsRecorder;
  signal?: AbortSignal;
}

interface GeneratedImageSet {
  provider: ImageProviderId;
  model?: string;
  imageDataUrls: string[];
  providerRequestIds?: string[];
}

interface ImageProvider {
  id: ImageProviderId;
  generateImageSet(request: GenerateImageSetRequest): Promise<GeneratedImageSet>;
}
```

`actions.ts` remains responsible for authentication checks, analysis IDs, image-cap checks, provider resolution, shared uploads, response construction, and database updates. Provider adapters own only generation and retrieval.

The mock adapter moves or wraps the existing fixture loader. The Midjourney adapter calls the existing Discord trigger/listener and image splitter without changing those modules. The BFL adapter implements its own submit/poll/download flow.

**Alternative considered:** Add a direct BFL branch to both server actions. This touches less code initially but continues duplication and makes every future provider another action-level conditional. The registry costs a small refactor now and directly satisfies reversible switching.

### 2. Use a server-only canonical default with backward compatibility

Add `IMAGE_GENERATION_PROVIDER` as the canonical deployment setting. Supported values are exactly `mock`, `midjourney`, and `black-forest-labs`. Unsupported values fail explicitly before external work begins.

During migration, the resolver falls back to the existing `NEXT_PUBLIC_IMAGE_PROVIDER` only when the canonical variable is absent. This keeps existing local and Railway deployments functional. `.env.example` documents the new setting and marks the old variable as a compatibility alias rather than the long-term source of truth.

Provider adapters validate their own configuration only when selected. Missing BFL credentials do not block Midjourney, and missing Discord credentials do not block BFL.

**Alternative considered:** Continue using only `NEXT_PUBLIC_IMAGE_PROVIDER`. The provider choice is server behavior and does not need to be bundled into browser code; retaining it as canonical would unnecessarily expose deployment configuration and preserve unsafe fallback behavior.

### 3. Add a separately gated test-mode override

Initial generation and regeneration accept an optional provider override. The server honors it only when `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=true`, the request is authenticated, the provider ID is registered, and the client indicates test-mode use. Server-side gating is authoritative; client view mode alone is not a security boundary.

A compact provider menu appears only in test mode when a public UI visibility flag is enabled. Its default option is "Configured default," which sends no override. The choice is session-local and is not silently persisted across visits, reducing accidental paid-provider use.

The server records the resolved provider in attempt diagnostics. The provider is immutable for that attempt even if configuration or the client selection changes while work is running.

**Alternative considered:** Require an environment edit and server restart for every comparison. This is sufficient for production rollout but cumbersome for repeated side-by-side quality tests and regeneration comparisons.

### 4. Do not implement automatic cross-provider fallback

A failed attempt reports the selected provider's error. Retrying with another provider requires a new explicit user action or test selection.

Midjourney may generate and charge for an image that the app cannot observe. Automatically invoking BFL after a capture failure would create duplicate cost and an ambiguous result. The same principle applies in reverse.

### 5. Generate one BFL request per output slot

The BFL adapter uses the pinned `flux-2-pro` endpoint by default, a configurable EU API base URL, 1024 by 1024 output, JPEG format, default prompt upsampling, and four distinct seeds. It submits four requests concurrently, which remains below BFL's documented active-task limit for normal endpoints.

Each accepted response must contain a request ID and `polling_url`. Polling occurs at a bounded interval with an overall provider timeout. The adapter follows the returned polling URL rather than constructing a result URL. It handles `Ready`, pending states, moderation states, and terminal errors explicitly.

The initial compatibility contract is all-or-nothing: after bounded retries, all four slots must download successfully before shared upload begins. This matches existing Midjourney behavior and avoids changing the current UI, image cap, and storage semantics. Per-slot persistence and partial completion belong in the future durable-job design.

**Alternative considered:** Use the changing `flux-2-pro-preview` endpoint. A preview is useful for later quality experiments, but a pinned model gives repeatable acceptance tests and a stable first integration.

### 6. Validate and immediately consume provider-returned URLs

Before polling or downloading, parse each returned URL and require HTTPS plus an allowed BFL API or delivery hostname. Reject unexpected schemes or hosts without making a request. Polling URLs are limited to documented BFL API hosts; result downloads are limited to documented BFL delivery hosts.

Ready images are downloaded server-side immediately, checked for a supported image content type and non-empty body, converted to the existing data-URL representation, and passed to shared Supabase upload. Polling and signed delivery URLs are never returned to the browser or saved as analysis image paths.

This is required because BFL result URLs expire quickly and do not support direct browser CORS. It also keeps Supabase as the stable asset boundary for both providers.

### 7. Normalize provider errors and diagnostics

Define provider-neutral diagnostic stages such as `provider-selection`, `provider-submit`, `provider-wait`, `provider-result`, `provider-download`, `image-transform`, and `upload`. Midjourney may continue adding Discord-specific events, and BFL adds per-slot submission, polling, moderation, retry, cost, and download events.

Normalize provider failures into configuration, authentication, insufficient credits, rate limited, moderated, timeout, unavailable/transport, invalid response, download failed, and incomplete set categories. Retry only transient transport and rate-limit failures with a small bounded exponential backoff, respecting `Retry-After` when available. Authentication, credit, moderation, and validation failures are non-retryable.

Extend diagnostic sanitization beyond Discord-specific URL checks. Full polling URLs, delivery URLs, signed URLs, webhook secrets, API keys, and any credential-bearing URL are fully replaced rather than truncated. Safe metadata includes provider/model names, redacted request-ID suffixes, counts, slot numbers, statuses, elapsed time, byte counts, prompt hashes/snippets, and provider-reported cost.

### 8. Preserve existing persistence and defer provider attribution

Both providers continue uploading to `${analysisId}/${index}.jpg` and storing paths in `analyses.image_paths`. No migration is required, and history loading remains unchanged.

This means provider/model attribution is available in live diagnostics but is not recoverable from historical image paths after reload. That limitation is acceptable for the compatibility test and should be resolved by the future `image_generation_jobs` or generation-run model rather than adding temporary columns that cannot represent mixed-provider regeneration rounds.

### 9. Verify the provider in layers

Validation has four layers:

1. A BFL credential/one-image smoke script verifies authentication, request acceptance, returned polling URL handling, and result download without Supabase.
2. Focused mocked protocol checks cover strict provider resolution, BFL pending/ready/moderated/error responses, URL rejection, rate limits, timeout, and incomplete sets without spending provider credits.
3. App static verification runs registry checks, lint, lockfile-registry validation, and production build.
4. Manual app verification uses the test-mode selector to run initial generation and regeneration with BFL, perform at least three consecutive rounds, verify Supabase persistence/history reload, then switch back to Midjourney and mock without code changes.

When implementation reaches the test gate, the candidate dev server remains running and the handoff includes its clickable local URL.

## Risks / Trade-offs

- **[BFL polling keeps the current server action open]** → Use bounded polling and cancellation now; move the unchanged adapter behind durable jobs in the later architecture change.
- **[Four concurrent BFL requests multiply cost and partial-failure exposure]** → Fix output at 1 MP, use a pinned model, record provider-reported cost, retry only transient failures, and enforce a project spending limit outside the app.
- **[All-or-nothing handling discards successful slots when another slot fails]** → Accept this for compatibility; durable output slots are explicitly deferred.
- **[Data URLs add memory overhead]** → Reuse the existing representation for a narrow change; switch to buffer-native upload when the worker/job architecture is introduced.
- **[Returned URLs could be abused as server-side request targets]** → Require HTTPS and strict BFL host allowlists before polling or download.
- **[A client may attempt an unauthorized provider override]** → Validate the override server-side and require an explicit deployment gate.
- **[The legacy public provider variable can diverge from the canonical server setting]** → Give the server-only variable precedence, document the compatibility fallback, and remove the alias in a later cleanup after deployment variables are migrated.
- **[Midjourney remains unreliable and policy-sensitive]** → Preserve it only as an explicit adapter; do not treat coexistence as resolution of its known limitations.
- **[Historical images lack durable provider attribution]** → State this limitation in the test handoff and capture attribution in the future generation-job model.

## Migration Plan

1. Add provider types, registry, strict resolver, and adapters while keeping the existing Midjourney modules unchanged.
2. Route initial generation and regeneration through the provider contract and shared upload handling.
3. Add BFL configuration, protocol implementation, diagnostics, URL validation, and smoke validation.
4. Add the gated test-mode provider menu and provider-neutral user-facing status text.
5. Keep the deployment default on the existing provider while mock and BFL verification runs locally.
6. Start the candidate dev server and manually verify BFL initial generation, consecutive runs, regeneration, storage, history reload, failures, and switching back to Midjourney/mock.
7. Change the deployment default to BFL only after explicit test approval. Rollback requires changing `IMAGE_GENERATION_PROVIDER` back to `midjourney` or `mock` and restarting/redeploying; no data or code rollback is required.

## Open Questions

- Should a later change expose provider choice to ordinary users, or should it remain a deployment/test concern?
- Should BFL prompt upsampling remain enabled after visual comparison with the application's already detailed prompts?
- Which future durable model should own provider attribution: `image_generation_jobs`, a separate generation-run table, or per-image metadata?
