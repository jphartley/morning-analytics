## Context

See proposal.md for motivation and the October tracker for advisory sources.
The runtime contract is defined in specs/node-version-pinning/spec.md.

Railway builds from app/, using its committed lockfile and runtime declarations.
The root scripts and validation directory have independent dependency trees.
Local Node is already 22.23.4, but both .nvmrc files contain only 22 and the app
engine constraint is 22.x. The existing queue runtime helper extracts only the
major from app/.nvmrc and considers any matching Node 22 runtime ready.

The app calls fetch() directly and also consumes Discord REST's separate pinned
Undici dependency. Updating Node's bundled HTTP client does not update that npm
package. Sharp is a direct external server package used in the grid splitter as
well as in framework image processing. Its current ^0.34.5 range excludes 0.35.5.

The operator has completed the Railway credential response. Do not reopen or
repeat that work without new evidence. Application authorization remains urgent
and independently tracked; this patch must not be presented as resolving it.

## Goals / Non-Goals

**Goals:**

- Produce a reproducible patched framework/image/HTTP dependency graph with a
  compatible patched Node 22 runtime.
- Preserve existing app behaviour, provider selection and saved data formats.
- Record what was verified locally, what still needs live credentials or Linux,
  and which versions actually run after deployment.

**Non-Goals:**

- Session/authentication redesign, RLS or database schema changes, editor feature
  work, image-provider architecture changes, or broad dependency modernisation.
- A Node 24 migration, queue scheduling, feature branches or worktrees. Follow
  the repository's default main-checkout workflow; create no queue state.
- Treating npm audit success alone as security clearance, or treating a failed
  scan as a clean result.

## Decisions

### 1. Select supported patched versions and retain lockfiles

Recheck primary advisories before installation. The reviewed minimums are Next.js
16.4.1, Sharp 0.35.5, Node 22.23.4 and Undici 6.29.1 on 6.x. Prefer a compatible
patched release on these lines; record the actual selections. Align
eslint-config-next with Next.js. Update React and React DOM together; prefer
19.2.9 on the existing line if the selected framework supports it, otherwise
record the compatible patched pair and why it was required. Do not add direct
react-server-dom packages to replace Next.js's bundled implementation.

Regenerate lockfiles with a public registry and inspect the resulting graph.
Do not delete lockfiles or use audit fix --force. Those approaches make unrelated
upgrades harder to review. Only change the root dependency graph if inspection
finds an applicable required fix or metadata alignment calls for it.

### 2. Fix npm-installed Undici at the package that requires it

Inspect the application and validation Discord dependency chains separately.
Prefer a compatible parent release resolving a patched 6.x Undici. If no such
release is available, use an override scoped to the affected parent and fixed
compatible version, recording its reason and later removal condition. Do not
force Undici 7 or 8 into a dependency expecting 6.x. Verify the resolved graph,
normal Discord request behaviour and image orchestration after the change.

### 3. Make the runtime floor effective in existing entrypoints

Use 22 in both .nvmrc files so fresh installs/builds can select the latest
available stable 22.x release, as requested by the operator during apply. Declare
>=22.23.4 <23 in the app engine constraint and its lockfile root metadata. Use
the same runtime for validation and root admin scripts; align any other existing
engine declarations without introducing unrelated dependencies.

Update existing runtime-selection/readiness logic that currently checks only the
major. A runtime below the floor must not be reported as ready. Preserve fallback
selection through the existing toolchain and report actionable setup guidance if
no compatible runtime exists. Record the selected child-process version rather
than assuming that the launcher and PATH executables agree. Read the explicit
minimum from the app engine constraint, separately from the major-only selector.
Add focused boundary
tests for below-floor 22.x, the minimum, a newer 22.x, and a different major, plus
fallback selection. Tests must not create queue items or use real worktrees.

Update the Node runbook's major-only verification wording and document the actual
Railway build/runtime check. Engine declarations and local success alone do not
prove an existing production deployment has been rebuilt with the patched runtime.

The production rebuild on 24 October identified Railpack 0.43.0. Its generated
Mise settings impose a 14-day release-age delay: even with cache disabled, the
builder planned 22.23.4 but installed 22.23.3. Add app/mise.toml with the
Node-only minimum_release_age_excludes setting so newly released Node security
fixes are eligible immediately. Retain the rolling 22 selectors and engine
minimum. Other tools retain Railpack's release-age policy. This trades Node's
release-age quarantine for timely security updates and must be verified against
the actual build and application executables. No new Railway variable is needed
for the correction; the diagnostic NO_CACHE setting can be removed after verification.

### 4. Verify the image stack on its deployment platform

The app already has provider and orchestration tests. Run those as part of the
app suite and smoke-test grid splitting and image display. Inspect the selected
Linux Sharp/libvips build as well as the local Mac installation. Check the active
Linux deployment's native library versions where available; do not infer Linux
safety from macOS binaries. Do not run exploit payloads against production.

### 5. Separate local readiness from deployed remediation

Run the app tests, lint, lockfile registry check and production build under the
patched runtime. Build-only placeholder credentials cannot establish readiness
for sign-in, real storage or provider tests. Use mocks for the first functional
pass and identify credential-dependent checks explicitly. Live provider checks
can spend money; use the agreed operator smoke test rather than repeatedly
calling the integrations.

Attempt advisory checks for all three dependency trees, including development
dependencies, and record the tool/date, coverage and failures. Map findings to
actual locked versions and used features. Older editor/tooling findings stay
open for their separate changes; the targeted framework/image/HTTP issues must
be resolved before this patch is considered complete. A blocked scan does not
prevent documenting verified targeted fixes, but complete assessment stays open.

## Risks / Trade-offs

- Sharp 0.35 is outside the current allowed range and contains native changes ->
  validate decoding and the actual Linux dependency bundle.
- Next.js minor updates may expose compatibility regressions -> use production
  builds and sign-in, analysis, image, persistence and deletion smoke checks.
- Discord's exact Undici pin may require an override -> scope it narrowly,
  verify runtime behaviour and document the removal condition.
- Strengthening the runtime floor affects existing optional queue helpers ->
  test version-selection boundaries without opting into the queue workflow.
- Local changes may never reach the running deployment -> retain separate local
  and production checklist items and require actual version evidence.
- Authorization remains vulnerable after dependencies are patched -> keep that
  urgent follow-up visible in the tracker and the release handoff.

## Migration Plan

1. Review this plan, inspect fresh primary advisories and choose exact versions.
2. Apply scoped manifest/lockfile, runtime-helper and runbook changes on the
   existing checkout. Keep unrelated user changes out of delivery.
3. Verify the resolved versions, run the required checks and report outstanding
   live-provider/Linux/scan checks honestly.
4. Provide a running local test URL for user testing when implementation is
   ready. Keep mock verification separate from real Supabase/provider results.
5. Before any commit or push, follow the gitleaks runbook and run the applicable
   redacted secret scan. Stage only the named change artifacts and implementation.
6. Deploy using the existing Railway workflow after release review. No new,
   changed or removed environment variables are planned and no migration is
   required. Any newly discovered variable change must be named, updated in the
   production environment, reviewed as staged changes and deployed. Public
   variables require a rebuild.
7. Record the active commit, build/runtime Node versions, Next.js, React pair,
   Sharp/native libraries and installed Undici versions. Perform the relevant
   production smoke test and update the tracker with evidence.

If a regression occurs, prefer a targeted compatibility correction while retaining
the security fixes. A rollback to the previous dependency graph reopens known
vulnerabilities and must be an explicit operator decision with exposure controls
and a prompt corrective release. Do not silently label such a rollback secure.
