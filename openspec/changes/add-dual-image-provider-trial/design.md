## Context

Image generation currently resolves exactly one registered provider per server action, normalizes that provider to four images, uploads a flat ordered `image_paths` array, and returns one diagnostic trace. The Test view can override the deployment default when paired client/server flags are enabled. History cannot recover provider or model attribution because analyses persist only the overall image prompt and flat paths.

Dual mode must remain a removable experiment while producing durable, trustworthy comparison data. It crosses picker state, server authorization, two external providers, partial failure handling, storage, history, regeneration, diagnostics, and the Supabase schema. Existing analyses must remain readable.

## Goals / Non-Goals

**Goals:**

- Offer Dual mode only in the explicitly enabled Test-view provider picker.
- Generate comparable Black Forest Labs and Midjourney sets from the exact same prompt.
- Preserve successful output if either provider fails and identify each group clearly.
- Persist provider, model, exact prompt, attempt identity, timestamp, status, and paths per generation batch.
- Use one batch shape for single-provider and Dual mode requests so later experiments can use different prompts with the same provider.
- Preserve existing analyses and the 20-image cap.

**Non-Goals:**

- Making Dual mode a production default or a registered provider adapter.
- Automatically falling back between providers outside an explicit Dual mode request.
- Adding prompt editing or assigning different prompts to providers in this change.
- Persisting full diagnostic event timelines or sensitive provider errors.
- Parallelizing the two top-level providers in the first implementation.
- Changing provider credentials, provider-specific retry behavior, or the four-image provider contract.

## Decisions

### Represent Dual mode as an orchestration selection

Introduce a generation selection type that accepts registered provider IDs plus `dual`. Keep the provider registry limited to `mock`, `midjourney`, and `black-forest-labs`. A server-side selection resolver authorizes `dual` only when the request is in Test mode, normal provider overrides are enabled, and `IMAGE_PROVIDER_DUAL_MODE_ENABLED=true`.

The picker exposes Dual mode only when the existing public override flag and `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED=true` are both compiled into the client. The server remains authoritative if a client submits `dual` directly.

Alternative considered: register a composite provider. Rejected because a provider adapter promises one provider identity and one four-image set, while Dual mode has two identities, up to eight images, and partial success.

### Normalize all responses into provider result groups

Server actions return an ordered collection of provider result groups for both single and dual selections. Each group contains provider, model when available, exact prompt, attempt ID, status, image URLs, image paths, diagnostics, and a safe provider-specific error when applicable. Dual results are ordered Black Forest Labs first and Midjourney second, independent of completion timing.

The UI renders one titled block per group. Lightbox navigation can use a flattened URL list, but group boundaries and labels remain the rendering source of truth.

Alternative considered: return eight flat images and infer provider from position. Rejected because partial failures, regeneration, and history make positional attribution unreliable.

### Execute provider attempts sequentially and independently

Dual orchestration invokes Black Forest Labs and then Midjourney with the identical prompt. Each provider receives its own fresh attempt ID and diagnostics recorder. Failure of the first attempt is captured and does not prevent the second attempt. The orchestration reports success when both succeed, warning/partial success when one succeeds, and failure when neither succeeds.

The orchestration boundary can later switch to settled parallel execution without changing response or persistence contracts. Sequential execution is chosen initially to reduce pressure on a long-running server action and keep Discord observation behavior straightforward.

### Persist extensible generation batches alongside flat paths

Add an `image_generation_batches` JSONB column to `analyses`, defaulting to an empty array. Each batch uses a versionable object shape:

```ts
interface ImageGenerationBatch {
  version: 1;
  attemptId: string;
  provider: ImageProviderId;
  model: string | null;
  prompt: string;
  status: "success" | "failed";
  imagePaths: string[];
  createdAt: string;
  errorCode?: string;
}
```

Successful batches contain exactly four paths. Failed batches contain no paths and may retain only a normalized, non-sensitive error code; detailed diagnostics remain transient. Persisting the exact prompt on every batch deliberately duplicates the current analysis-level prompt so future rounds can use different prompts without a schema redesign.

Keep `image_paths` as the compatibility index used by existing code and cleanup tools. Initial save writes both fields. Regeneration appends new flat paths and all attempted batch records in the same database update after uploads finish. Historical rendering prefers batches; rows with no batches fall back to one unlabelled legacy image group and never guess a provider.

Alternative considered: encode providers in storage paths. Rejected because paths alone cannot reliably retain prompt, model, failed attempts, or future provenance fields.

### Reserve capacity for the selected round before external calls

A single-provider round requires four available image slots; a Dual mode round requires eight. The UI and server calculate required capacity from the selected generation mode. A Dual request is rejected before either external provider is called when eight slots are unavailable. This keeps the existing maximum of 20 stored images and makes behavior deterministic even if only one provider would ultimately succeed.

If one Dual provider fails after capacity is reserved, only the four successful images count toward the cap. A later single-provider round may use remaining capacity.

### Keep diagnostics per provider attempt

Dual responses expose two diagnostic traces rather than merging events into a synthetic provider. Test-mode diagnostics render and copy each attempt separately. Each trace retains its own provider and attempt identity, and existing redaction rules remain in force. Generation batch persistence stores attempt identity and normalized outcome, not the detailed trace.

## Risks / Trade-offs

- [Sequential Dual mode can take roughly the sum of both provider durations] → Show provider-aware pending progress and keep the response contract ready for future parallel execution.
- [A long-running request may hit hosting timeouts] → Validate both real-provider paths in Railway-like conditions; parallelization or durable jobs remain a follow-up if required.
- [JSONB provenance and flat paths can diverge] → Update both in one Supabase row update and test initial save, regeneration, and partial success consistency.
- [Failed attempts add persistent metadata without images] → Store only bounded, normalized fields and no diagnostic timeline or raw provider message.
- [Exact prompts are duplicated and may contain personal content] → Keep them inside the existing user-owned analysis row under current RLS and never include them in logs or diagnostics.
- [Legacy analyses have no provider attribution] → Render a neutral legacy label and never infer a provider from path order.
- [Two provider calls increase cost] → Restrict Dual mode behind separate client/server flags and retain the 20-image cap.

## Migration Plan

1. Add the nullable-compatible `image_generation_batches` JSONB column with an empty-array default; do not backfill guessed attribution.
2. Deploy code that reads legacy rows and writes both flat paths and generation batches.
3. Add `IMAGE_PROVIDER_DUAL_MODE_ENABLED=false` and `NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED=false` to `.env.example` and the Railway `morning-analytics` production Variables.
4. Run provider, action, storage, history, regeneration, lint, build, and lockfile-registry checks.
5. Review and deploy the staged Railway variable changes, then redeploy the application. A redeploy is required because the public flag is compiled into the Next.js bundle.
6. Enable both Dual mode flags and redeploy when the trial is ready.

Rollback disables both flags and redeploys. The additive database column may remain; the previous application ignores it and existing `image_paths` continue to work.

## Open Questions

None. Parallel top-level execution and provider-specific prompts are intentional future extensions supported by the contracts above.
