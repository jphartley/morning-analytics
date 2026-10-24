## 1. Confirm the implementation baseline

- [x] 1.1 Recheck primary framework, React, Sharp, Node and Undici advisories for superseding fixes; record selected compatible versions and source dates in docs/security-remediation-2026-10.md.
- [x] 1.2 Inspect all three lockfiles and Discord's exact Undici dependency chains; record the parent-update or scoped-override decision with its verification and removal condition.

## 2. Require the patched Node runtime

- [x] 2.1 Align both .nvmrc selectors at 22, and app engines.node and app lockfile root metadata with the >=22.23.4 <23 floor; verify each declaration and the active shell version agree.
- [x] 2.2 Update existing runtime readiness/selection helpers to reject below-floor Node 22 and preserve compatible fallback selection; verify focused tests cover 22.23.3 rejection, 22.23.4 acceptance, a newer 22.x, a different major, and selected child-process versions without creating queue state.
- [x] 2.3 Update the Node runtime runbook and relevant deployment guidance to describe the patched minimum and actual production version checks; verify instructions match the declarations and helper behaviour.

## 3. Update the targeted dependencies

- [x] 3.1 Upgrade Next.js and eslint-config-next together, plus a compatible patched React/React DOM pair; verify the installed and locked graph contains patched framework versions and matching React versions without peer conflicts.
- [x] 3.2 Upgrade direct Sharp to at least 0.35.5 and inspect framework resolution; verify no vulnerable Sharp copy remains in the application graph and existing grid splitting still produces four valid images.
- [x] 3.3 Resolve app and validation Undici copies to compatible patched versions through the selected parent update or scoped override; verify each lockfile and npm dependency tree resolves every relevant copy at or above 6.29.1 on 6.x.
- [x] 3.4 Inspect manifest and lockfile changes for scope and registry safety; verify npm run check:lockfile-registry passes in app/ and all changed lockfiles use public npm registry URLs.

## 4. Verify local readiness and document remaining exposure

- [x] 4.1 Run app tests, lint and production build under the patched runtime; record command outcomes and distinguish build-only placeholder configuration from actual auth/backend readiness.
- [x] 4.2 Run the relevant mock smoke test for journal analysis, rendering, four-image generation and history UI; record outcomes and separately list sign-in, storage, real-provider and deletion checks requiring the operator's live environment.
- [x] 4.3 Assess the native image stack on the Linux deployment build or a matching environment; record actual Sharp/native library versions and image-processing results, or explicitly leave Linux verification pending.
- [x] 4.4 Attempt advisory checks for app, root and validation dependency trees including development dependencies; record tool/date, coverage and network failures, and triage remaining findings without representing incomplete scans as clean.
- [x] 4.5 Update the October tracker with local evidence and unresolved authorization/editor/tooling findings; provide a clickable running local dev-server URL for user testing, or explicitly explain server readiness limits and the action needed to obtain one.

## 5. Verify production and close the scoped patch

- [x] 5.1 After release review, follow the gitleaks and delivery runbooks for any commit/push and deployment; verify the published change contains only scoped artifacts and changes, and record Environment / Railway variables as none new, changed or removed unless implementation establishes otherwise.
- [x] 5.2 Record the active production commit, build/runtime Node versions, framework/React versions, Sharp/native libraries and installed Undici versions; verify the targeted fixes are running rather than merely present in local manifests.
- [x] 5.3 Have the operator verify production sign-in, analysis, Midjourney images, save/load and deletion; record outcomes and mark only completed remediation items in the tracker, preserving unresolved scan or separate-change work.

Closure evidence, 24 October: operator supplied source commit
1ad2218064f5f06168eebce3a9cb60166b8396e4 and PID 1/Next.js versions 22.23.4,
then confirmed NO_CACHE removal and continued 22.23.4 operation. Package/native
versions and the build-log evidence limits are recorded in
[the remediation tracker](../../../docs/security-remediation-2026-10.md).
All scoped tasks are complete; separate security findings remain open. Main
runtime specs are synchronized; this change remains unarchived.
