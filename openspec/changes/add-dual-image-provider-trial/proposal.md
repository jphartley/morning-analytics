## Why

The application needs a temporary, explicitly gated way to compare Black Forest Labs and Midjourney outputs for the same analysis prompt. Provider attribution and prompt provenance must survive history reloads so the trial produces trustworthy comparisons and establishes an extensible foundation for future provider and prompt experiments.

## What Changes

- Add a separately feature-flagged `Dual mode` option to the existing Test-view image provider picker.
- In Dual mode, submit the same generated image prompt to Black Forest Labs and Midjourney, initially one provider after the other, and attempt both even if one fails.
- Return and render provider-labelled image groups, with Black Forest Labs first and Midjourney second.
- Treat one-provider success as a partial success: retain and display the successful group while showing a provider-specific error for the failed group.
- Persist each generation batch with its provider, model when available, exact prompt, attempt identity, timestamp, and image paths so attribution is preserved in history and can later support different prompts for repeated generations with the same provider.
- Apply Dual mode to regeneration, where a successful dual round adds eight images, while retaining the existing 20-image per-analysis cap.
- Return separate provider-aware diagnostics for the two attempts in a dual generation request.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-provider-selection`: Add a separately gated Dual mode selection that orchestrates both real providers without treating Dual mode as a provider implementation.
- `image-generation`: Generate, return, and display independently labelled Black Forest Labs and Midjourney result groups with partial-success behavior.
- `image-regeneration`: Support eight-image Dual mode regeneration rounds while enforcing the existing 20-image cap.
- `analysis-storage`: Persist extensible generation-batch provenance, including provider, model, exact prompt, attempt identity, timestamp, and image paths.
- `image-generation-diagnostics`: Represent and return one diagnostic attempt per provider within a Dual mode request.

## Impact

- Affects the Test-view provider picker, page generation and regeneration state, image result components, server actions, provider orchestration, diagnostics response types, Supabase storage access, and history loading.
- Requires a Supabase migration and backward-compatible handling for analyses that only contain the existing `image_paths` array.
- Adds `IMAGE_PROVIDER_DUAL_MODE_ENABLED` and `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED`; both must be configured for the Railway `morning-analytics` production environment and followed by a redeploy before Dual mode is available.
- Does not change the deployment-default provider, provider credentials, or behavior outside the explicitly gated Test view.
