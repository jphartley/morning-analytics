## Why

Black Forest Labs derives deterministic slot seeds from the provider attempt ID, but regeneration currently reuses the permanent analysis ID for every round. Repeated regeneration can therefore submit the same prompt, model, and four seeds, reproducing an earlier set instead of creating four new variations.

## What Changes

- Give every initial-generation and regeneration round a fresh attempt ID.
- Keep the permanent analysis ID unchanged for database ownership, storage paths, and image-path appends.
- Require provider variation inputs to be distinct both within a four-image set and across regeneration rounds.
- Add regression coverage proving two regeneration rounds for the same analysis receive different attempt identities and BFL seeds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-regeneration`: Define a unique generation-round identity so repeated regeneration produces new provider variations while preserving the analysis identity.
- `black-forest-labs-image-generation`: Require deterministic slot seeds to change between separate attempts, including repeated regeneration of one analysis.
- `image-generation-diagnostics`: Distinguish the unique attempt ID reported in diagnostics from the permanent analysis ID used for persistence.

## Impact

- `app/app/actions.ts`: regeneration orchestration and diagnostic recorder identity.
- `app/lib/image-providers/black-forest-labs.ts`: existing seed derivation behavior remains, but receives a correct unique attempt ID.
- Provider/action tests: add coverage for repeated regeneration attempts and cross-round seed variation.
- OpenSpec delta and canonical specifications for regeneration, BFL generation, and diagnostics.
- No dependency, database, storage-path, API-key, or environment-variable changes.
