## 1. Provider Foundation

- [x] 1.1 Add shared image-provider IDs, request/result types, normalized error categories, and provider interface under `app/lib/image-providers/`.
- [x] 1.2 Add a strict provider registry and resolver for `mock`, `midjourney`, and `black-forest-labs`, including immutable per-attempt resolution and explicit rejection of unknown values.
- [x] 1.3 Add the server-only `IMAGE_GENERATION_PROVIDER` default with precedence over the legacy `NEXT_PUBLIC_IMAGE_PROVIDER` compatibility fallback.
- [x] 1.4 Move or wrap the existing mock fixture loader as a provider adapter without changing its four-image behavior.
- [x] 1.5 Wrap the existing Discord trigger, listener, recovery, and grid splitter as the Midjourney adapter without removing or behaviorally rewriting those modules.
- [x] 1.6 Document provider defaults, compatibility behavior, BFL settings, and override gates in `app/.env.example` without adding secrets.

## 2. Black Forest Labs Provider

- [x] 2.1 Add BFL configuration validation for `BLACK_FOREST_LABS_API_KEY`, pinned model, API base URL, image dimensions, output format, polling interval, and timeout defaults.
- [x] 2.2 Implement strict HTTPS allowlist validation for provider-returned BFL polling and delivery URLs, rejecting unexpected hosts before any request is made.
- [x] 2.3 Implement four concurrent FLUX.2 submissions with deterministic slot ordering, distinct recorded seeds, redacted request IDs, and response-shape validation.
- [x] 2.4 Implement bounded polling of each returned `polling_url`, including pending, ready, moderated, provider-error, timeout, and cancellation handling.
- [x] 2.5 Implement bounded retry and normalized handling for transport errors, `429` rate limits, authentication failures, insufficient credits, moderation, and invalid responses.
- [x] 2.6 Download ready images immediately on the server, verify supported content type and non-empty bytes, convert them to the existing data-URL shape, and never return signed BFL URLs to the browser.
- [x] 2.7 Enforce the all-or-nothing four-image contract and report redacted per-slot success, retry, moderation, timeout, and failure counts when the set is incomplete.

## 3. Shared Generation Orchestration

- [x] 3.1 Refactor initial image generation to resolve one provider, call its `generateImageSet`, validate exactly four normalized images, and use the existing shared Supabase upload/result flow.
- [x] 3.2 Refactor regeneration through the same provider resolver while preserving stored prompts, existing-image visibility, upload index offsets, database append behavior, and the 20-image cap.
- [x] 3.3 Add optional provider-override parameters to initial generation and regeneration, validating the registered value and server-side override gate before external work begins.
- [x] 3.4 Ensure provider configuration is validated only for the resolved adapter and add checks proving missing BFL settings do not block Midjourney and vice versa.
- [x] 3.5 Ensure provider failure returns the selected provider's error and diagnostics without implicitly invoking another provider.

## 4. Test-Mode Controls and Diagnostics

- [x] 4.1 Extend image-generation diagnostic types and recorder behavior to support all registered provider IDs and provider-neutral stages.
- [x] 4.2 Generalize diagnostic explanations and user-facing generation/regeneration status copy so BFL and mock attempts are not described as Midjourney/Discord work.
- [x] 4.3 Extend sanitization to fully redact BFL polling URLs, signed delivery URLs, credential-bearing URLs, API keys, webhook secrets, and unknown signed URLs rather than truncating them.
- [x] 4.4 Add a compact provider menu in test mode with `Configured default`, `Mock`, `Midjourney`, and `Black Forest Labs` options, shown only when the public UI visibility gate is enabled.
- [x] 4.5 Keep the test selection session-local, pass it to both initial generation and regeneration, and keep provider controls hidden in quiet and insight modes.
- [x] 4.6 Verify the server rejects or ignores client override attempts whenever the authoritative server-side override gate is disabled.

## 5. Validation and Documentation

- [x] 5.1 Add mocked protocol checks for strict provider resolution, BFL URL allowlisting, pending-to-ready polling, moderation, rate limits, timeout, malformed responses, downloads, incomplete sets, and no-fallback behavior.
- [x] 5.2 Add a credit-conscious BFL smoke script that can validate credentials and generate/download one image without Supabase, plus a documented validation command.
- [x] 5.3 Run `npm run lint`, `npm run check:lockfile-registry`, and `npm run build` from `app/`, resolving regressions without unrelated refactors.
- [x] 5.4 Update image-generation architecture and current-architecture documentation to describe provider coexistence, the strict switch, BFL polling/download behavior, and the deferred durable-job boundary.
- [x] 5.5 Review `TechnicalDebt.md` and record only concrete debt introduced by this compatibility phase, especially legacy env fallback, data-URL memory use, and missing historical provider attribution.
- [x] 5.6 Start the candidate dev server and provide its clickable URL for manual testing.
- [x] 5.7 Manually verify mock mode, BFL initial generation, Supabase upload, history reload, BFL regeneration, at least three consecutive BFL rounds, test-mode diagnostics/copy redaction, and switching back to Midjourney without code changes.
  - Evidence: BFL initial attempts `bf16c82b-ca96-4c61-a9ce-fd5598b4da13` and `ff279783-f9e9-4faa-a621-1e6efe8a92c1` each returned and uploaded four ordered images with redacted diagnostics.
  - Evidence: Midjourney attempts `5ff5f2d5-1bc8-4f94-8acd-f226ec10204c` and `4894e164-f47e-4e7f-9875-45a024188b7f` completed after provider switching; the latter correctly resolved from `deployment-default`.
  - Verified by user: mock mode, history reload, BFL regeneration, and the additional consecutive BFL round.
- [x] 5.8 Exercise invalid BFL key, insufficient-credit or simulated `402`, rate-limit or simulated `429`, moderation, timeout, invalid URL, and partial-set failures, confirming clear errors and no cross-provider fallback.
