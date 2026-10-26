## 1. Reassess the dependency findings

- [x] 1.1 Run current advisory checks for app, root scripts and validation, recording tool/date, coverage and any scanner or network limitations; verify all three dependency roots are represented in the assessment. On 26 October, browser SSO followed by npm login restored the local mirror after expired authentication. Fresh scans reported app 5 High / 4 Moderate, root 1 High and validation 1 High; counts are package entries.
- [x] 1.2 Map every `ws` advisory to its locked copies, dependency paths and relevant use across all three roots; verify the inventory identifies each copy and whether the advisory applies. At baseline all roots locked 8.19.0; the app uses it through Google GenAI, Supabase Realtime and Discord, root through Supabase Realtime and validation through Discord. Both applicable GitHub-reviewed advisories and the final versions are recorded in docs/security/2026-10-26-dependency-patch.md.
- [x] 1.3 Assess locked copies of `protobufjs`, `source-map-js`, Vite, Vitest/`@vitest/mocker`, `@humanfs/node`, `brace-expansion` and `js-yaml`; verify each is either assigned a compatible remediation or has a documented evidence-based disposition. App versions, advisory sources and use-path assessment are recorded in docs/security/2026-10-26-dependency-patch.md; no copies of these packages were found in root or validation lockfiles.

## 2. Patch applicable dependency copies

- [x] 2.1 Update affected `ws` copies first using compatible parent or direct dependency releases; verify resolved versions in the app, root and validation dependency trees and record any copy that cannot be safely updated. All three lockfiles resolve ws 8.22.0 through existing parent ranges; npm ls --package-lock-only confirms each tree. No override or parent upgrade was needed.
- [x] 2.2 Patch other applicable findings with the narrowest compatible dependency changes, using a scoped override only when needed; verify each targeted resolved copy is outside its affected range and avoid forced upgrades or an ESLint downgrade for the withdrawn `braces` finding. Targeted installed trees confirm all selected patched versions; no overrides or forced upgrades were used.
- [x] 2.3 Review changed manifests and all three lockfiles for scope and public-registry safety; verify the app lockfile registry check passes and no lockfile was removed or broadly regenerated without need. All registry checks and lockfile metadata assertions pass; runtime/framework pins are preserved and the app manifest changes only the Vitest range. Coupled tooling and optional platform metadata changes were reviewed.
- [x] 2.4 Document the operator's verified browser SSO plus npm-virtual login recovery and extend the registry cleanup helper to cover that mirror; verify authenticated metadata/audit/install requests work and legacy/virtual URL fixtures preserve package metadata. The JFrog and Node runbooks are updated; fixture checks cover both endpoints and both port forms.

## 3. Verify and record outcomes

- [x] 3.1 Run checks relevant to changed dependency roots, including app tests, lint and production build when app dependencies change; verify outcomes are recorded and failures or unavailable checks remain explicit. Under Node 22.23.4: clean installs, 269 tests, lint, WebSocket/SDK smoke checks, validation syntax, registry fixtures and Webpack build pass. The 21 configured database tests remain skipped; default Turbopack retains its recorded local port restriction. Chrome signed-out checks pass; the private mock dev server is http://127.0.0.1:3101.
- [x] 3.2 Re-run advisory checks across app, root scripts and validation after updates; verify remaining findings are mapped to resolved versions and any incomplete scan is not reported as clean. All three fresh JFrog lockfile audits complete with exit 0 and zero advisory matches, including development packages.
- [x] 3.3 Update SecurityDebt.md with per-finding remediation or assessment outcomes, verification evidence and remaining work; verify advisory matches are not described as confirmed attacks and development/test servers remain private. SecurityDebt.md, the October progress tracker and the dated SEC-10 evidence record now distinguish local completion from the outstanding production checks.
- [ ] 3.4 Confirm deployed versions for the changed dependency trees and record active deployment evidence; verify SEC-10 is left open for any unresolved finding or deployment version that cannot be confirmed. Pending release: the active Railway app commit and installed versions have not been confirmed for this patch. Root scripts and validation were verified locally and are not separate Railway services.

## Archive note — 26 October 2026

The user reported that the local app appears to work, then explicitly requested
archive, spec sync, commit and push after being told that production verification
remains open. Archived with 10 of 11 tasks complete. Task 3.4 is retained as an
open release check in SecurityDebt.md and docs/security/2026-10-26-dependency-patch.md.
The change declares skip_specs and has no delta specs to synchronize.
