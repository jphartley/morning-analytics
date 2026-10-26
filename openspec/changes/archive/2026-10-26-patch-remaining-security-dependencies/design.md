## Context

See proposal.md for motivation and scope. The app, repository scripts and validation directory have separate manifests and lockfiles. The 25 October scan is a dated snapshot; advisory applicability and locked copies need a fresh review before choosing versions. The preceding October dependency change already patched the framework, image libraries, Undici and Node runtime, so this work should begin with remaining findings and include those packages only if fresh evidence shows a relevant issue.

## Goals / Non-Goals

**Goals:**

- Produce a reviewed inventory that maps each in-scope advisory to affected locked copies, dependency paths and relevant use or exposure.
- Prefer compatible targeted updates and preserve reproducible lockfiles across the three dependency roots.
- Keep evidence clear about local resolution, production deployment and any finding that remains unresolved.

**Non-Goals:**

- Broad dependency modernization, forced major upgrades, application feature changes, or a claim that all security risks are resolved.
- Fixing the withdrawn `braces` advisory through an ESLint downgrade.

## Decisions

### Reassess each dependency tree independently

Inspect app, root scripts and validation manifests and lockfiles, beginning with every `ws` copy as SEC-10 directs. Then assess `protobufjs`, `source-map-js`, Vite, Vitest/`@vitest/mocker`, `@humanfs/node`, `brace-expansion` and `js-yaml`. Use current advisory sources and the resolved dependency paths; an aggregate audit count alone does not establish the affected package, distinct issue or reachable feature. Record tool, date, coverage and any network or scanner limitations.

### Prefer the narrowest compatible remediation

For each applicable copy, first check for a compatible direct or parent dependency update that resolves the vulnerable range. Use a narrowly scoped override only when ordinary compatible updates cannot resolve it, and record its compatibility basis and removal condition. Do not use `npm audit fix --force`; do not downgrade ESLint for the withdrawn `braces` report. Where updating is not justified or possible, record the evidence, impact and follow-up rather than silently treating the finding as fixed.

### Verify lockfiles, behavior and deployment separately

Inspect the resolved dependency trees after changes and run the checks relevant to changed dependency roots, including the app's build/lint and registry-safe lockfile check where applicable. Keep development and test servers private. Update SecurityDebt.md with per-finding outcomes and remaining work. A local patched lockfile is not production evidence: record deployed versions and the active deployment evidence separately, and leave deployment status open when it cannot be confirmed.

### Keep mirror recovery local and deliver public lockfile URLs

During apply, the operator requested documenting the recovery that restored access: browser SSO at JFrog followed by npm login against the npm-virtual endpoint. Keep registry selection per command and credential values outside the repository. The existing cleanup helper must normalize both legacy npm and npm-virtual mirror paths, including explicit port 443. Local operations may temporarily use the full mirror prefix when npm's host-only URL replacement drops the Artifactory path; restore public URLs after the operation, including failures.

Compatible parent ranges resolved the dependency patches without overrides. Vitest's parent update selects its exactly coupled 4.1.12 packages and Vite 8.3.5 within its existing supported range. npm 10's peer resolver crashed during that operation; use the isolated compatible npm 11.21.0 resolver for it, without changing global npm, and verify the resulting lockfile with a clean npm 10 installation under Node 22.23.4.

## Risks / Trade-offs

- A package advisory may not apply to the way a dependency is used → record resolved paths and exposure evidence, and distinguish advisory matches from demonstrated attacks.
- A parent update may alter tool behavior or peer compatibility → choose compatible releases, inspect the resolved graph and run the checks relevant to that dependency tree.
- A scanner may be unavailable or incomplete → record the limitation and keep the affected assessment open rather than claiming a clean scan.
- A production deployment may lag local remediation → retain deployment verification as a separate closure item until deployed versions are evidenced.

## Migration Plan

1. Recheck current advisories and inventory affected versions in all three dependency roots.
2. Apply the smallest compatible manifest and lockfile changes, prioritizing `ws`, and document any individually assessed finding left unchanged.
3. Verify the changed dependency graphs and relevant project checks; review lockfile registry safety.
4. Record local outcomes and unresolved evidence in SecurityDebt.md, then confirm deployed versions before marking SEC-10 complete. If production evidence is unavailable, leave the deployment check open.
