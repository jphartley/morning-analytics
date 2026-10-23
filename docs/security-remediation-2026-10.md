# October 2026 security remediation

Last updated: 23 October 2026 (Europe/Amsterdam).

This is the working checklist for the security review started on 23 October.
Keep completed incident response separate from dependency patching and application
authorization. Tick an item only when its evidence is recorded. Never put secret
values, access tokens, raw environment exports, or unredacted logs in this file.

## Current status

| Work | Status | Evidence |
| --- | --- | --- |
| Railway credential response | Complete, confirmed by the operator | In this chat on 23 October, the operator confirmed revocation in Google, Discord and Supabase, replacement values in Railway, redeployment, and review of Railway, Google and Supabase logs with nothing suspicious found. |
| Dependency remediation | Locally implemented; operator smoke test passed; release in progress | [OpenSpec change](../openspec/changes/patch-october-2026-security-dependencies/proposal.md). 14 of 17 tasks complete; the 3 production release/verification tasks remain open. |
| Server-side authorization | Open; urgent | Code inspection found browser-supplied identity used with service-role database access. No production exploit was attempted. |
| Editor and development tools | Open | Affected Markdown-it, Tiptap, Vite and Vitest dependency versions remain locked. |
| Automated lockfile assessment | Completed through local registry mirror; findings remain open | All three lockfiles assessed on 23 October, including development dependencies. App: 14 High / 4 Moderate dependency-package findings; root and validation: 1 High each. These are not independent CVE counts. See triage below. |

No evidence of misuse was reported in the reviewed logs. That does not prove that
no misuse occurred. Production package versions and the database patch level were
not independently inspected in this review. The operator's confirmation above
supersedes the earlier, provisional incident status in the chat.

## 1. Completed Railway response

- [x] Revoke/reset the old credentials at Google, Discord and Supabase.
- [x] Put the replacement credentials in Railway service variables.
- [x] Redeploy after updating the variables.
- [x] Review Railway, Google and Supabase logs; operator reported nothing suspicious.

These items record the operator's confirmation, not an independent inspection of
their provider accounts. Do not repeat credential rotation solely because the
dependency work below remains open. Review any later provider notice or new
evidence separately.

Railway reported possible access to stored environment variables on 21 October
and recommended credential rotation and service-log review:
[Railway disclosure](https://blog.railway.com/p/security-disclosure-wednesday-october-21st).
Variable edits require deployment:
[Railway variable documentation](https://docs.railway.com/variables).

## 2. Repository inventory

Baseline inspected before the patch on 23 October; these are not confirmed
production versions. The implemented versions are recorded in the local
verification table below.

| Component | Local version | Scope |
| --- | --- | --- |
| Next.js | 16.2.6 | App Router and Server Actions |
| React / React DOM | 19.2.6 / 19.2.6 | App |
| Sharp | 0.34.5 | Next.js image processing and direct grid-image splitting |
| Node.js | 22.23.4 in the current shell | Already patched locally; repository declarations allow 22.x; Railway runtime unverified |
| Undici | 6.24.1 | App dependency through Discord REST |
| Undici | 6.21.3 | Validation dependency through Discord REST |
| Markdown-it | 14.1.1 | Editor dependency |
| Tiptap core | 3.20.1 | Editor dependency family |
| Vitest / Vite | 4.1.10 / 8.1.4 | App development/test dependencies |
| Supabase JS | 2.98.0 app; 2.95.3 root scripts | Managed Auth, database and storage integration |

Inventory sources: `app/package-lock.json`, `validation/package-lock.json`,
`package-lock.json`, `app/package.json`, and the current shell's Node version.
Recheck before implementation and record the selected versions after updating.

## 3. Findings and minimum fixes

The review covers disclosures available through 23 October 2026, with emphasis on
14-23 October. The minimum versions below come from the reviewed advisories;
they are not a claim about the latest release. Check for superseding advisories
before choosing the implementation versions. Advisory severity and practical
application exposure are different assessments.

| Finding | Exposure assessment | Minimum fix / source |
| --- | --- | --- |
| Next.js Server Actions denial of service, High, published 14 October; GHSA-p3m5-59mp-jv5r | Version and features match this checkout: App Router with Server Actions. Crafted requests can exhaust CPU. | Next.js 16.4.1. [Advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r). |
| Next.js SVG image-processing RCE, Critical, published 14 October; CVE-2026-96889 / GHSA-2464-fhr4-w9xw | Next.js and Sharp versions are affected. RCE depends on glibc Linux and malicious image content reaching decoding. Production OS and attacker control of image bytes are unverified. Sharp's own advisory was published 30 September. | Next.js 16.4.1 and explicit direct Sharp upgrade to at least 0.35.5. [Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w). |
| Next.js cached typed-array RCE, Critical, published 14 October; GHSA-673q-mjm6-r5xr | Version affected; no Cache Components configuration or use-cache functions found in the inspected checkout. Documented trigger not found. Vendor still recommends upgrading. | Next.js 16.4.1. [Advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr). |
| React Server Components RCE and Server Functions denial of service, published 14 October | Upstream issues underlying the Next.js advisories above; do not count them as independent exposures or assume updating React alone patches Next.js. | RSC packages 19.2.9 on the 19.2 line; update Next.js and select a compatible React/React DOM pair together. [RCE](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3), [DoS](https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453). |
| Undici response-content-encoding process crash, High, 15 October; CVE-2026-109869 | App copy 6.24.1 is in range; validation copy 6.21.3 predates the affected 6.x range. Trigger requires the affected fetch path and a malicious upstream response; Discord REST uses request(), so package presence alone does not establish that trigger. | Undici 6.29.1 on 6.x. [Advisory](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c). |
| Undici TLS renegotiation process crash, High, 15 October; CVE-2026-87018 | Both locked copies affected; requires a malicious or compromised HTTPS peer using TLS 1.2 renegotiation. | Undici 6.29.1 on 6.x. [Advisory](https://github.com/nodejs/undici/security/advisories/GHSA-qrxm-fqhp-jwvm). |
| Undici dropped custom TLS verification, High, 15 October; CVE-2026-109383 | Both copies in range; no application-defined custom TLS verification callback found. Trigger unconfirmed. | Undici 6.29.1 on 6.x. [Advisory](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx). |
| Node.js Brotli RCE, DNS truncation and TLS hostname bypass, High, 21 October; CVE-2026-111497, CVE-2026-105482, CVE-2026-106069 | Node 22 affected before the security release. Current local shell already patched; Railway unknown. Runtime updates also carry bundled dependency and certificate-store fixes. | Node 22.23.4 on 22.x. [Release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). |
| Markdown-it reference parsing denial of service, High, 16 October; CVE-2026-111758 / GHSA-gfr2-rv44-r23c | 14.1.1 affected with default options. Inspected path is the browser journal editor; primarily a tab-freezing risk there. HTML-disabled mode does not fix this issue. | Markdown-it 14.3.3 on 14.x. [Advisory](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-gfr2-rv44-r23c). |
| Vite file-access bypass, Moderate, 6 October; GHSA-rq7h-c2jc-7f22 | 8.1.4 in range. Development-server exposure requires separate assessment; the application production server is Next.js. | Vite 8.1.6 on 8.1.x. [Advisory](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22). |
| Vitest mock-registration code injection, Moderate, 16 October; GHSA-qxg6-89mg-rqv8 | @vitest/mocker 4.1.10 in range; exploit requires an exposed interceptor server. The configured test command is vitest run, without an HTTP server. | Vitest/@vitest/mocker 4.1.12 on 4.x. [Advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8). |

Additional triage:

- Undici's October release fixes EventSource and WebSocket memory exhaustion;
  review usage while updating. October cache-redirect and HTTP/2 WebSocket
  handshake advisories affect newer Undici major lines, not these 6.x copies.
  [6.29.1 release](https://github.com/nodejs/undici/releases/tag/v6.29.1),
  [cache issue](https://github.com/nodejs/undici/security/advisories/GHSA-4w7w-5xrc-9h26),
  [HTTP/2 issue](https://github.com/nodejs/undici/security/advisories/GHSA-qq8j-7v2v-3rwp).
- The separate October Markdown-it HTML parsing issue requires HTML enabled;
  the inspected editor explicitly disables it. The same version update covers it.
  [Advisory](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-vfgh-jcmw-g37q).
- The October Vitest 5 secret-file disclosure is outside our installed 4.x
  version range; do not label this checkout affected by that report.
  [Advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-p458-7748-mcp3).
- Older backlog: Tiptap 3.20.1 predates the attribute-merging XSS fix in 3.30.4.
  Exploitation needs an untrusted attribute object reaching the helper, which
  has not been demonstrated here. Sharp also misses older libvips/libheif fixes.
  [Tiptap advisory](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-cp6q-959q-f8rh),
  [Sharp advisories](https://github.com/lovell/sharp/security/advisories).
- The reviewed Gemini SDK, Discord.js and Supabase JS maintainer pages had no
  published advisories. This does not clear their transitive dependencies.
  [Gemini SDK](https://github.com/googleapis/js-genai/security/advisories),
  [Discord.js](https://github.com/discordjs/discord.js/security/advisories),
  [Supabase JS](https://github.com/supabase/supabase-js/security/advisories).

## 4. Remediation checklist

### A. Urgent dependency patch

- [x] Prepare an OpenSpec change for the urgent dependency patch: [proposal](../openspec/changes/patch-october-2026-security-dependencies/proposal.md), [design](../openspec/changes/patch-october-2026-security-dependencies/design.md), [runtime spec](../openspec/changes/patch-october-2026-security-dependencies/specs/node-version-pinning/spec.md), [tasks](../openspec/changes/patch-october-2026-security-dependencies/tasks.md).
- [x] Review the dependency patch proposal and request implementation: operator invoked openspec-apply-change in this chat on 23 October.
- [ ] Recheck superseding maintainer advisories and select explicit compatible versions.
- [x] Update Next.js to at least 16.4.1 and align eslint-config-next.
- [x] Update React and React DOM together to a compatible patched pair.
- [x] Update the direct Sharp dependency to at least 0.35.5; ^0.34.5 cannot select it.
- [x] Resolve both application and validation Undici copies to patched compatible versions. Prefer parent updates; document and test any override needed for Discord's exact dependency pin.
- [x] Align Node declarations and establish a patched Node 22 floor; check app and root declarations as well as lockfile metadata.
- [x] Inspect all three lockfiles and keep npm registry URLs public.
- [x] Run app tests, lint, lockfile registry check and a production build; record results and build-mode limitations below.
- [ ] Verify image decoding with the deployment's Linux/native dependency build, not only macOS.
- [ ] Smoke-test sign-in, analysis rendering, image generation, history save/load and deletion.
- [ ] Deploy and record the active production commit, Node version and resolved dependency versions.
- [ ] Repeat the relevant production smoke checks and record outcomes.

Do not use npm audit fix --force. A Node update patches its bundled Undici,
while npm-installed Undici copies need their own dependency update.

### B. Urgent server-side authorization

Code evidence: `app/app/actions.ts` accepts userId arguments and checks only for
nonempty values in multiple actions. `getMemoryStore` and `resetMemory` call
`app/lib/memory-storage.ts`, which uses the service-role client created by
`app/lib/supabase.ts`. That client bypasses database row security. Analysis
deletion also compares ownership against a caller-supplied userId.

This is an application finding, not a newly disclosed third-party CVE. It could
allow cross-user memory reads/resets or other unauthorized work if an attacker
can invoke actions with another user's ID. No production exploit was attempted.

- [ ] Prepare a separate OpenSpec authorization change, keeping it urgent rather than waiting for routine editor maintenance.
- [ ] Inventory every Server Action, data operation, paid provider call and privileged role check.
- [ ] Derive identity from a server-verified session/token and enforce ownership and roles server-side.
- [ ] Use user-scoped database/storage access where possible; constrain remaining service-role operations.
- [ ] Verify missing, expired and forged credentials are rejected before data access or provider calls.
- [ ] Test cross-user memory reads, resets, rebuilds, saves, image operations and analysis deletion.
- [ ] Test role restrictions for administrator experimentation and paid operations.
- [ ] Correct TechnicalDebt.md: its claims that all reads/deletes are protected and its getSession-based server verification advice are outdated.

Supabase recommends verified getClaims() identity or getUser(); getSession()
alone is not an authorization check:
[server-side auth guidance](https://supabase.com/docs/guides/auth/server-side/nextjs).

### C. Editor and development tools

- [ ] Update Markdown-it to at least 14.3.3 on the compatible 14.x line.
- [ ] Update the Tiptap dependency family together to a compatible release containing the 3.30.5 fixes; verify tiptap-markdown compatibility and include the ProseMirror paste-XSS and linkify findings from the complete scan.
- [ ] Update Vitest and its coupled packages to at least 4.1.12 on 4.x.
- [ ] Update Vite to a compatible patched version, at least 8.1.6 on 8.1.x, and check all installed copies.
- [ ] Verify paste, Markdown formatting, copy, journal reload and bounded handling of unusually large input.
- [ ] Review image origin/redirect restrictions, accepted formats, download size, pixel limits and timeouts as a separately scoped hardening follow-up.
- [ ] Keep development/test HTTP servers off public interfaces unless deliberately secured.

### D. Assessment and closure

- [x] Complete advisory scans for app, root scripts and validation dependencies when the advisory service is reachable; record scan date, tool and coverage.
- [x] Triage every remaining High/Critical result by version, feature usage and runtime/development scope. Record unresolved follow-up work rather than treating scan failure as zero findings.
- [ ] Confirm the managed Supabase PostgreSQL version and patch status against provider guidance and [PostgreSQL security releases](https://www.postgresql.org/support/security/).
- [ ] Record relevant provider notices and any required compatibility checks.
- [ ] Add a scoped process for dependency alerts and periodic review.

## 5. Environment / Railway variables

The incident credential replacements are complete according to the operator.
Do not record values. Relevant names include GEMINI_API_KEY, DISCORD_BOT_TOKEN,
DISCORD_USER_TOKEN and SUPABASE_SERVICE_ROLE_KEY. Unused BLACK_FOREST_LABS_API_KEY
credentials, if still present, should be assessed under the existing provider
dormancy guidance; their current presence was not verified here.

Dependency patch outcome: no environment or Railway variables were added, changed
or removed. No database migration is required.
If implementation reveals a necessary variable change, record the name and
whether it is new, changed or removed. Apply it in the morning-analytics service's
production environment, review staged changes and deploy/redeploy. NEXT_PUBLIC_*
changes require a rebuild because those values enter the browser bundle.

Follow [the Node runbook](node-runtime-runbook.md) for local runtime work and
[the Railway plan](railway-deployment-plan.md) for deployment. Any schema work in
the separate authorization change must first follow
[the Supabase CLI runbook](supabase-cli-runbook.md).

## 6. Evidence to add as work progresses

For each completed patch, record the OpenSpec change, selected versions, local
checks, any exceptions, and production confirmation. Keep local implementation
and deployed remediation as separate checklist items. This file is the durable
tracking record; OpenSpec artifacts describe the scope and acceptance criteria
for each implementation change.

### Implementation baseline, 23 October 2026

- Rechecked the primary Next.js and React advisory indexes, Sharp advisory index,
  Node October security release and Undici October advisories on 23 October.
  No superseding security minimum was identified in the reviewed sources.
- Selected Next.js/eslint-config-next 16.4.1, React/React DOM 19.2.9,
  Sharp 0.35.5, and Node 22.x with minimum 22.23.4. Registry metadata confirms Next.js accepts
  the selected React pair and requests Sharp ^0.35.5.
- Inspected all three lockfiles. The app and validation trees contain Discord's
  exact older Undici pins; root admin scripts have no installed Undici package.
- Selected Discord.js 14.27.0 for app and validation. Unlike the previous
  releases, its Undici range is ^6.27.0 and its REST requirement is ^2.6.2;
  REST 2.6.3 also permits ^6.27.0. These ranges accept patched 6.29.1.
  Prefer this compatible parent update; no override is planned. Verify the
  actual installed graph before marking the Undici work complete.
- Direct public npm access returns ECONNRESET. The repository-documented local
  registry mirror successfully supplied package metadata. Use it locally and
  normalize resulting lockfile URLs to public npm before handoff.
- Operator decision during apply: retain both .nvmrc selectors at 22 and enforce
  >=22.23.4 <23 through the engine metadata and readiness checks. Fresh installs
  and builds can select newer stable 22.x releases; an existing running process
  does not update automatically. A Node 26 migration remains separate work.

### Local implementation and verification, 23 October 2026

| Check | Result |
| --- | --- |
| Installed and locked Next.js / eslint-config-next | 16.4.1 / 16.4.1 |
| Installed and locked React / React DOM | 19.2.9 / 19.2.9 |
| Installed and locked Sharp | 0.35.5; shared by Next.js and the direct app dependency |
| Discord.js / Discord REST / Undici, app and validation | 14.27.0 / 2.6.3 / 6.29.1; no override required |
| Node declarations | Both .nvmrc files select 22; app manifest and lockfile engine both >=22.23.4 <23 |
| Runtime boundary tests | 6 passed under Node 22.23.4; no queue state or worktrees created |
| App suite | 33 files / 193 tests passed under explicitly selected Node 22.23.4 |
| Chrome smoke test | Passed against the isolated local fixture: synthetic sign-in, journal submission, mock analysis rendering, four uploaded/displayed images, persistence and history reload after browser refresh; no browser errors |
| Operator local review | On 23 October the operator confirmed: "the smoke test works". This confirms local review; it does not close the production checks. |
| Native image regression | A downloaded synthetic grid decodes into four correctly ordered 64x64 JPEG quadrants with the expected pixel colours |
| Lint | Passed under Node 22 after a small asynchronous-effect compatibility correction for the newer React lint rule |
| Production webpack build | Passed under Node 22.23.4, including TypeScript, prerendering and build tracing; command: npm run build -- --webpack |
| Default Turbopack production build | Not verified: first font requests failed; network-enabled retry reached an internal process/port-binding EPERM restriction in this environment. Default build/deployment remains a production verification item. |
| Lockfile registry check | Passed; all three lockfiles use public npm URLs. Root lockfile changed only to normalize pre-existing private registry URLs; its dependency graph is unchanged. |
| Secret scanning | Redacted Gitleaks scans passed for the tracked diff, each named new file/change-artifact directory, full existing history (187 commits), and the exact staged patch. The configured pre-commit hook repeats the staged scan when committing. |
| Local Sharp native libraries | libvips 8.18.7, librsvg 2.63.2, libheif 1.23.5 on macOS |
| Linux native image verification | Pending: no local Docker/Linux runtime available. macOS success is not evidence for Linux. Confirm native versions and image processing on the Railway build/runtime. |
| Production deployment and smoke checks | Pending; the earlier credential redeploy does not deploy this new local patch |

One initial shell-based app install/test command selected the machine's Node 26
instead of the project runtime. Installation and the full test/lint/build checks
were subsequently run using the explicit Node 22 executable and PATH. Only the
Node 22 results are used for this change's required-runtime verification.

The lint correction fetches drawer data asynchronously and ignores a result after
the drawer closes or user changes. It does not add authentication or resolve the
separate server-side authorization finding.

Local review URL: [http://127.0.0.1:3100](http://127.0.0.1:3100). This instance
uses mock AI/image providers and a local in-memory service at 127.0.0.1:54329;
it does not use real Supabase data or paid providers. For this fixture only, use
the synthetic email smoke@example.test and the placeholder password
local-fixture-only. It is not a real user account or credential. Fixture data is
temporary and disappears when the fixture process stops. Real production
sign-in, database/storage, Midjourney and deletion checks remain open.

The temporary fixture and browser scripts are under /tmp/morning-security-browser/;
they are verification aids outside the repository, not product changes. Their
browser test blocked external requests. Next.js automatically generated an
app/AGENTS.md during the development-server run; that generated file was removed
from this scoped change. No existing repository instruction file was edited.

### Remaining advisory findings after the targeted patch

Ran npm audit --package-lock-only --json against app/, repository root and
validation/ through the working local npm mirror on 23 October. Coverage includes
runtime and development dependencies. Direct public npm remains inaccessible.
Temporary machine-readable responses are in /tmp/morning-security-audit/ and may
not survive cleanup; the following summary is the durable record.

Counts refer to vulnerable dependency-package entries, including propagated
parent labels, not distinct vulnerabilities: app 18 (14 High, 4 Moderate), root
1 High, validation 1 High. No Critical package entries were reported. These are
not clean scan results and no risk exceptions have been accepted.

| Area | Locked packages and scope | Disposition |
| --- | --- | --- |
| Editor and Markdown | @tiptap/core 3.20.1; Markdown-it 14.1.1; linkify-it 5.0.0; prosemirror-view 1.41.6; runtime/browser code | Remain open in the editor follow-up. The scan adds Tiptap attribute-parsing ReDoS, linkify parsing DoS and ProseMirror paste XSS to the original findings. Tiptap's combined reviewed floor now needs at least 3.30.5, Markdown-it 14.3.3, and prosemirror-view 1.42.3; verify current compatible releases when implementing. |
| WebSocket client | ws 8.19.0 in app, root scripts and validation | Open transport follow-up: memory exhaustion and uninitialized-memory disclosure; reviewed fix floor 8.21.0. Parent ranges and actual use must be inspected across all three trees. No root dependency version upgrade was applied. |
| Other runtime/shared libraries | protobufjs 7.6.4 and source-map-js 1.2.1 | Open follow-up: parser/source-map denial-of-service findings; assess the app's actual parsing paths before selecting compatible updates. |
| Development tooling | @humanfs/node 0.16.7, brace-expansion 1.1.14 and 5.0.6, braces 3.0.3, js-yaml 4.1.1, Vite 8.1.4, Vitest/@vitest/mocker 4.1.10 | Open tooling follow-up. Preserve the existing no-public-development-server boundary. The braces finding propagates through micromatch, fast-glob and the Next ESLint packages; npm suggests downgrading eslint-config-next to 14.2.35, which is not an approved or suitable fix for this Next 16 patch. |

The targeted React/Next server advisories were checked against the installed
versions as well as the scan; dependency scanning alone may miss bundled code.
The remaining Next ESLint package labels above are transitive tooling findings,
not proof that the newly patched Next runtime remains affected by the October
RSC or image-processing advisories.

Additional source records from the scan:

- [Tiptap Markdown attributes ReDoS](https://github.com/advisories/GHSA-j95f-988m-3j2f).
- [ProseMirror paste XSS](https://github.com/advisories/GHSA-c8x8-7fp4-3x9w).
- [linkify-it scan complexity](https://github.com/advisories/GHSA-22p9-wv53-3rq4) and [mailto complexity](https://github.com/advisories/GHSA-v245-v573-v5vm).
- [ws memory exhaustion](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) and [memory disclosure](https://github.com/advisories/GHSA-58qx-3vcg-4xpx).
- [protobufjs parser loop](https://github.com/advisories/GHSA-j3f2-48v5-ccww).
- [source-map-js denial of service](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- [braces recursion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [brace-expansion recursion](https://github.com/advisories/GHSA-qhr7-859c-m2p7), and [brace-expansion rewrite complexity](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).
- [js-yaml merge-key limit bypass](https://github.com/advisories/GHSA-2883-xcg3-v3hh).
