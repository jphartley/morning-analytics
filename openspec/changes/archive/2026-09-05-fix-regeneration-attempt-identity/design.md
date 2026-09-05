## Context

Image generation currently uses one identifier for two different concepts. The analysis ID is the permanent database and storage identity, while the provider attempt ID identifies one external generation round. Initial generation creates a new analysis ID, so the conflation is harmless there. Regeneration reuses the existing analysis ID, and the BFL adapter deterministically hashes `attemptId` plus slot number into four seeds. Reusing the analysis ID therefore reuses the same four seeds for every regeneration round.

The provider contract, diagnostic recorder, and storage orchestration already accept identifiers independently enough to separate these concepts without a schema or API migration.

## Goals / Non-Goals

**Goals:**

- Give every image-generation invocation a fresh attempt ID.
- Pass the same fresh attempt ID to diagnostics and the selected provider for that invocation.
- Continue using the permanent analysis ID for storage paths, database lookup, ownership, and image-path appends.
- Prove repeated BFL regeneration rounds receive different deterministic seeds.

**Non-Goals:**

- Changing how BFL derives deterministic per-slot seeds.
- Changing analysis IDs, storage paths, image caps, provider selection, or database schemas.
- Making mock fixtures non-deterministic or changing Midjourney behavior.
- Addressing the separately identified authentication and storage-privacy findings.

## Decisions

### Generate a fresh orchestration attempt ID per server-action invocation

`generateImages()` and `regenerateImages()` will create a UUID dedicated to the generation round. That UUID will initialize the diagnostic recorder and populate `GenerateImageSetRequest.attemptId`. The existing analysis ID remains the only identifier used by Supabase persistence.

This explicit separation is preferred over adding the current image count to BFL's seed input because attempt identity is provider-neutral, remains unique across retries and future storage changes, and makes diagnostic traces unambiguous.

### Keep BFL seed derivation deterministic within an attempt

The BFL adapter will continue hashing `attemptId:slot`. Slots remain stable and ordered within one attempt, which preserves reproducibility for debugging. A fresh attempt ID changes all four seeds on the next regeneration round.

Randomizing seeds inside the provider was rejected because it would weaken reproducibility and hide the orchestration bug instead of correcting the identity contract.

### Test both orchestration and provider behavior

A server-action test will regenerate the same analysis twice and assert that the provider receives different attempt IDs while persistence continues to use the same analysis ID. A provider test will assert that separate attempt IDs produce disjoint four-seed sets.

## Risks / Trade-offs

- **[Existing diagnostic attempt IDs no longer equal analysis IDs]** → Treat this as the intended contract and specify both identities explicitly; no persisted consumer currently depends on equality.
- **[A retry of the entire server action creates another attempt ID]** → This is desirable because it is a new paid generation round; internal provider retries continue using the same attempt ID.
- **[Mock output remains identical across attempts]** → Mock fixtures are intentionally fixed and are outside the provider-variation requirement.
