# Tasks

## 1. Provider availability and trial configuration

- [x] 1.1 Separate known provider identities from runtime availability in the shared provider-selection policy; retain BFL adapter code and mocked tests. Verify resolver tests reject disabled BFL defaults and explicit requests before adapter invocation, including with old override flags still enabled and no BFL key.
- [x] 1.2 Add optional `IMAGE_PROVIDER_TRIAL_CANDIDATE` with no implicit candidate, validate candidate identities, and retain existing override/Dual gates. Verify tests cover absent/empty/unknown candidates, disallowed Midjourney/mock candidates, explicitly enabled BFL, and uninterrupted Midjourney/mock default resolution with missing BFL configuration.
- [x] 1.3 Resolve Dual into candidate then Midjourney once per round and use the existing sequential orchestrator. Verify mocked tests cover exact shared prompts, provider order, independent attempt IDs, full success, partial success, both failures, and zero provider calls for an unauthorized pair; no paid requests.
- [x] 1.4 Create `docs/image-provider-trials.md` documenting explicit activation, the retained BFL contract and assessed quality outcome, and the steps to add a future candidate. Align the current architecture decision and technical-debt descriptions with dormant trials; verify normal guidance no longer presents BFL as the preferred production path and archived sources remain untouched.

## 2. Browser controls and saved preferences

- [x] 2.1 Derive safe public trial metadata from server configuration and update provider options/visibility to require an authorized available trial. Verify configuration and UI tests cover no trial despite old flags, active BFL, server-derived browser gates, administrator Test/Debug visibility, and unaffected unrelated Test/Debug controls.
- [x] 2.2 Normalize unavailable saved BFL/Dual selections to the deployment default for all views, request overrides, status counts, and regeneration capacity. Verify preset/role tests cover Quiet, Insights, Test/Debug, localStorage failure, role changes, and dormant versus active candidate transitions without deleting stored preferences.
- [x] 2.3 Update the experiment reference with browser visibility, view-mode persistence, and rebuild requirements. Verify the documented activation and dormancy combinations agree with the configuration/visibility tests.

## 3. History and regeneration compatibility

- [x] 3.1 Keep batch parsing and historical labels independent of runtime availability. Verify tests load successful/failed BFL batches, mixed-provider batches, and legacy flat paths with no BFL key; assert exact prompts, attribution, order, paths, and existing heading rules are preserved.
- [x] 3.2 Apply availability enforcement through both initial generation and regeneration, preserving storage and capacity semantics. Verify action/orchestration tests append Midjourney batches to BFL history without altering old batches, reject disabled BFL/Dual requests without generation side effects, and retain four/eight-image capacity checks for available selections.
- [x] 3.3 Document that disabling a trial leaves stored analyses and images intact and that historical provider attribution does not choose the next regeneration provider; verify the experiment reference matches the compatibility scenarios.

## 4. Local environment and deployment guidance

- [x] 4.1 Clean obsolete BFL comments and unused BFL settings from committed `app/.env.example`; retain no-API mock defaults and short dormant-trial guidance. Verify it contains no active BFL key assignment or default-enabled trial and accurately links to the experiment reference.
- [x] 4.2 Clean `/Users/jhartley/code/morning-analytics/app/.env.local` explicitly, even when implementation uses a candidate worktree: remove obsolete BFL activation prose and unused BFL assignments, keep keys absent, use Midjourney for normal local real-provider operation, disable trial flags, and preserve unrelated values and mock settings. Verify targeted state assertions and unrelated-value equality without printing values or a raw diff; confirm the file remains untracked/ignored and excluded from staging. Report this local-only edit separately.
- [x] 4.3 Update Railway/setup guidance and prepare a names-only Environment / Railway variables handoff listing each new, changed, removed, or already-absent variable from the design's migration table. Verify it identifies the production environment, direct secret entry, staged-change review, and deploy/rebuild requirements; do not claim remote variables were changed without evidence.

## 5. Integration verification and review handoff

- [x] 5.1 Read `docs/node-runtime-runbook.md` and run the applicable existing provider/action/UI tests, lint, build, and lockfile registry check. Verify dormant builds work without BFL credentials and record results; do not execute paid smoke-test commands. Read `docs/gitleaks-runbook.md` and run the applicable redacted secret scan before any later commit/push.
- [x] 5.2 Verify the app in the browser using no-API mocks or stubbed integrations: analyze text, render analysis and images, save/load history, and regenerate while retaining old images. Check dormant admin and normal-user views plus saved BFL/Dual preferences; capture UI evidence without secrets. Report any real Supabase/Midjourney checks that remain manual rather than claiming mocked checks prove production behavior.
- [x] 5.3 Validate the OpenSpec change, provide a clickable running local test URL and focused manual checks, and include the local environment-cleanup result and production Railway handoff. Keep finalization subject to the repository's explicit test approval gate; do not deploy, archive, merge, or push as part of proposal creation.

## 6. Minimize retained provider surface

- [x] 6.1 Remove the legacy public default fallback and independently configured public override/Dual flags; derive browser metadata from server configuration. Verify tests ignore retired settings even when they disagree with server values.
- [x] 6.2 Migrate queue mock-environment generation and detection to IMAGE_GENERATION_PROVIDER; update the delivery-queue spec and verify candidate bootstrap behavior without creating real queue state.
- [x] 6.3 Lazy-load BFL on authorized adapter invocation only. Verify module-load tests cover dormant resolution/generation, disabled requests, and authorized invocation; retain adapter contract tests and history parsing.
- [x] 6.4 Delete the standalone BFL smoke script/package command and unused preset aggregator, centralize diagnostic provider labels, and update affected tests. Verify there are no remaining executable or documentation references to deleted entry points.
- [x] 6.5 Consolidate trial documentation and update current architecture, AGENTS.md, CLAUDE.md, technical debt, environment examples, local environment, and Railway handoff. Verify unrelated local values remain identical and list all retired settings without exposing values.
- [x] 6.6 Run affected tests, lint, production build, registry checks, strict spec validation, and isolated browser checks for dormant and active server-derived trial controls. Update verification evidence and leave a working local test URL; do not finalize or deploy.
