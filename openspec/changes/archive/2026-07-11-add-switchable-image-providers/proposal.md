## Why

The current image-generation path is tightly coupled to Midjourney through Discord, making it difficult to evaluate a supported direct API without replacing or destabilizing the existing integration. Morning Analytics needs a reversible provider boundary so Black Forest Labs can be tested in the real application while Midjourney and mock generation remain available.

## What Changes

- Introduce a shared image-provider contract and strict provider registry for `mock`, `midjourney`, and `black-forest-labs`.
- Select a deployment-default provider through server-side configuration, with an explicitly gated test-mode override for controlled comparisons.
- Add a Black Forest Labs FLUX.2 provider that creates four image requests, follows provider-returned polling URLs, downloads completed images before signed URLs expire, and returns the same four-image result shape expected by the app.
- Preserve the existing Discord trigger, listener, recovery, and grid-splitting behavior behind the Midjourney provider adapter.
- Route both initial generation and regeneration through the same provider resolver and shared Supabase upload flow.
- Make image-generation diagnostics provider-neutral while retaining provider-specific, redacted metadata and human-readable explanations in test mode.
- Add focused validation for provider selection, Black Forest Labs polling/download behavior, error normalization, and manual switching through the application.
- Do not add automatic cross-provider fallback, remove Midjourney, or introduce the durable background-job architecture in this change.

## Capabilities

### New Capabilities

- `image-provider-selection`: Defines the supported provider registry, deployment default, gated test override, immutable per-attempt selection, provider configuration isolation, and prohibition on implicit fallback.
- `black-forest-labs-image-generation`: Defines FLUX.2 submission, polling, four-image generation, signed-result download, timeout, moderation, credit, rate-limit, and partial-failure behavior.

### Modified Capabilities

- `image-generation`: Generalize initial image generation from a Midjourney-only workflow to the selected provider while preserving the four-image application contract and existing Midjourney behavior.
- `image-regeneration`: Resolve regeneration through the selected provider while preserving the stored prompt, existing images, index offsets, and image cap.
- `image-generation-diagnostics`: Generalize diagnostic stages and redaction requirements across providers, including Black Forest Labs request identifiers and sensitive polling or delivery URLs.

## Impact

- Affects `app/app/actions.ts`, the current Discord integration modules, image splitting and upload orchestration, image-generation diagnostics, test-mode controls, and environment configuration.
- Adds a server-side Black Forest Labs integration using the existing Node `fetch` runtime; no new SDK dependency is required.
- Keeps current Supabase image paths and history behavior unchanged and introduces no database migration in this compatibility change.
- Requires a Black Forest Labs API key and model/base-URL configuration only when that provider is selected.
- Adds external requests to Black Forest Labs generation, polling, and signed delivery endpoints; returned URLs must be validated, redacted, downloaded server-side, and never served directly to the browser.
