# Image provider trials

Midjourney/Discord is the chosen production image provider. The Black Forest Labs
trial ended because its image quality did not meet the user's expectations
compared with Midjourney. This is a product assessment, not a benchmark score.

The BFL adapter and mocked tests are retained, but the trial is dormant. Its
module loads only when an authorized BFL adapter is invoked; it remains part of
the deployment, but normal requests do not load it. No BFL credentials are needed for startup, Midjourney generation, mock generation, or
history. Removing a key is not the disable mechanism: the server rejects BFL and
Dual requests unless an explicit candidate is configured and authorized.

## Normal setup

Use `IMAGE_GENERATION_PROVIDER=midjourney` with existing Discord configuration.
For local no-API checks use `USE_AI_MOCKS=true` and
`IMAGE_GENERATION_PROVIDER=mock`; the text and image mock switches are separate.
`IMAGE_GENERATION_PROVIDER` is the only deployment-default setting and defaults
to Midjourney when omitted. The legacy public default is no longer read.

Leave `IMAGE_PROVIDER_TRIAL_CANDIDATE` unset and keep these flags false:

```text
IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=false
IMAGE_PROVIDER_DUAL_MODE_ENABLED=false
```

There is no provider picker or comparison choice, including in administrator
Test/Debug. Other Test/Debug controls keep their existing behavior. Old BFL/Dual
browser preferences are ignored without being deleted. Initial generation and
regeneration use the deployment default. A disabled BFL deployment default or an
explicit disabled BFL/Dual request produces a configuration error before any
provider call; the app does not silently substitute another provider.

## Retained trial mechanism

An active trial uses one explicit candidate and Midjourney as the comparison
baseline. Adding a new provider still requires an adapter and registration; this
configuration does not load arbitrary providers dynamically.

To deliberately reactivate BFL for a new evaluation, review its current API
contract and provide fresh credentials directly in the deployment environment.
Then configure:

```text
IMAGE_GENERATION_PROVIDER=midjourney
IMAGE_PROVIDER_TRIAL_CANDIDATE=black-forest-labs
IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=true
# Optional comparison of both providers:
IMAGE_PROVIDER_DUAL_MODE_ENABLED=true
```

All enabled providers require their own credentials when invoked. A candidate
must be registered and differ from mock and Midjourney. Old public flags are
ignored. Server flags alone never enable a candidate. Unknown candidates hide trial controls and fail trial
requests without preventing valid Midjourney/mock defaults.

The browser receives candidate availability and the Dual setting derived from
the server configuration. No separately configured public override/Dual flags
are needed. The picker appears only for an administrator in enabled Test/Debug.
During an active authorized trial, an available saved selection also applies in Quiet and
Insights. Normal users send no override. Server-side availability is enforced
independently of browser metadata; server-verified role enforcement remains a
separate hardening task.

Dual sends the exact same prompt to the candidate, then Midjourney, sequentially.
Each provider produces four images with its own attempt identity, diagnostics,
and batch attribution. Either provider can fail without discarding the other's
successful images. Regeneration reserves eight slots for Dual or four for a
single provider within the existing 20-image limit. No implicit cross-provider
fallback is performed.

Existing BFL, mixed-provider, and legacy histories remain readable. Disabling a
trial does not delete images or rewrite batch prompts, identities, models,
statuses, timestamps, or order. Provider headings follow the existing picker
visibility rule. Regenerating old BFL history uses the current allowed selection,
not its historical provider.

## BFL adapter reference

`app/lib/image-providers/black-forest-labs.ts` retains the four-slot adapter.
`BLACK_FOREST_LABS_API_KEY` is required only when that adapter is deliberately
enabled and invoked. Never restore revoked keys or put credentials in this file.

| Optional variable | Adapter default |
| --- | --- |
| `BLACK_FOREST_LABS_MODEL` | `flux-2-pro` |
| `BLACK_FOREST_LABS_API_BASE_URL` | `https://api.eu.bfl.ai/v1` |
| `BLACK_FOREST_LABS_IMAGE_WIDTH` | `1024` |
| `BLACK_FOREST_LABS_IMAGE_HEIGHT` | `1024` |
| `BLACK_FOREST_LABS_OUTPUT_FORMAT` | `jpeg` |
| `BLACK_FOREST_LABS_POLL_INTERVAL_MS` | `1000` |
| `BLACK_FOREST_LABS_TIMEOUT_MS` | `90000` |
| `BLACK_FOREST_LABS_MAX_RETRIES` | `3` |

These defaults describe the retained implementation, not a promise of future API
compatibility. It polls provider jobs with bounded retries, downloads temporary
results immediately, validates allowed hosts and content, and returns a complete
four-image set to shared storage. See `openspec/specs/black-forest-labs-image-generation/spec.md`.

`cd app && npm run test:image-providers` runs mocked checks without provider
credits, including lazy-loading checks. The standalone BFL smoke script has been
removed to avoid maintaining a duplicate provider client. Future live evaluation
uses the adapter-backed application flow after explicit approval for paid calls.

## Adding a future candidate

1. Implement its four-image adapter and register a stable ID and display label.
   Keep known historical IDs valid independently of runtime availability.
2. Add mocked contract tests for normalized output, errors, credential isolation,
   and diagnostics redaction. Check the provider's current API documentation.
3. Explicitly select the new candidate and enable the applicable gates. The
   shared resolver, comparison loop, result groups, storage, and history can then
   be reused without hardcoding the pair in the orchestrator.
4. Agree on the paid evaluation and quality criteria before making live calls.
5. End a trial by unsetting the candidate, disabling the flags, removing unused
   credentials/settings, and deploying. Keep the outcome and history.

## Environment / Railway variables

Railway does not read local `.env.local`. Make changes in **morning-analytics
service > Variables > production**, review staged changes, and deploy. A saved
variable is not active until deployed. Deploy/redeploy after every variable
change; `NEXT_PUBLIC_*` values require a rebuild. The safe candidate metadata is
also compiled from the server configuration, so changing the server-only
candidate requires a rebuild. Do not configure a separate public candidate
variable manually.

For this cleanup, `IMAGE_PROVIDER_TRIAL_CANDIDATE` is new and optional: leave it
unset. Change the canonical default to Midjourney and the two server flags to
false if needed. Remove the retired public default and public override/Dual
settings if present.
Remove unused `BLACK_FOREST_LABS_*` settings, including the API key, if still
present. Enter any future secrets directly in Railway. No database migration is
required, and this documentation does not establish current remote values.
