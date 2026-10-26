# SEC-10 dependency patch — 26 October 2026

Status: patched and verified locally. Production release and installed-version
confirmation remain open. This record covers the app, repository scripts and
validation lockfiles, including development dependencies.

## Advisory results

All checks used npm's lockfile audit through the authenticated local JFrog
`npm-virtual` mirror. Counts are dependency-package entries, including propagated
parent labels, rather than distinct vulnerabilities or confirmed attacks.

| Dependency root | Before patch | After patch |
| --- | --- | --- |
| App | 5 High, 4 Moderate | 0 advisory matches; audit exit 0 |
| Repository scripts | 1 High | 0 advisory matches; audit exit 0 |
| Validation | 1 High | 0 advisory matches; audit exit 0 |

The scans initially failed because public npm DNS was unavailable and the local
mirror's authentication had expired. The operator signed into JFrog in the
browser through SSO, then ran `npm login` for the `npm-virtual` registry. Subsequent
metadata, audit and package-install requests succeeded. The verified recovery
sequence is now in the [JFrog runbook](../research/jfrog-npm-login-workflow.md).
No passwords or tokens were read or recorded by this work.

## Resolved versions and exposure review

| Package | Before | After | Dependency path and assessment |
| --- | --- | --- | --- |
| `ws` | 8.19.0 in all three roots | 8.22.0 in all three roots | App: Google GenAI, Supabase Realtime and Discord; root: Supabase Realtime; validation: Discord. Client dependencies were identified; no inbound application WebSocket server was found. Both reported advisories were patched. |
| `protobufjs` | 7.6.4 | 7.6.6 | Google GenAI dependency. No application import or public `.proto` parsing endpoint was found; patched within the parent's 7.x range. |
| `source-map-js` | 1.2.1 | 1.2.2 | PostCSS/Tailwind and jsdom/css-tree paths. No public source-map parsing endpoint was found; all locked copies were patched. |
| Vite | 8.1.4 | 8.3.5 | Vitest development dependency. The app uses Next.js; the test command is `vitest run`. Development servers remain private. |
| Vitest / `@vitest/mocker` | 4.1.10 / 4.1.10 | 4.1.12 / 4.1.12 | Updated the parent and all exactly coupled Vitest packages together. No standalone mocker/interceptor server configuration was found. |
| `@humanfs/node` | 0.16.7 | 0.16.8 | ESLint dependency; no application copy/copyAll entry point was found. The compatible update also resolves core 0.19.2 and types 0.15.0. |
| `brace-expansion` | 1.1.14 and 5.0.6 | 1.1.21 and 5.0.12 | ESLint/minimatch and TypeScript ESLint/minimatch paths. Each copy stays on its existing compatible major line. |
| `js-yaml` | 4.1.1 | 4.3.2 | ESLint configuration dependency; no application YAML parsing endpoint was found. Retained 4.x. |

No overrides or forced upgrades were required. Root and validation manifests
are unchanged. The app's Vitest range now starts at `^4.1.12`; its parent update
also selected Vite 8.3.5 within the existing allowed 8.x range and refreshed
coupled bundler/test packages. npm added optional Tailwind WASI metadata during
resolution. Framework, React, Sharp, Discord, ESLint and Node pins are unchanged.
The withdrawn `braces` finding did not trigger an ESLint downgrade.

Primary advisory records reviewed:

- `ws`: [memory exhaustion](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) and [memory disclosure](https://github.com/advisories/GHSA-58qx-3vcg-4xpx).
- `protobufjs`: [option parser loop](https://github.com/advisories/GHSA-j3f2-48v5-ccww).
- `source-map-js`: [indexed source-map offsets](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- Vite: [file access](https://github.com/advisories/GHSA-rq7h-c2jc-7f22), [custom middleware](https://github.com/advisories/GHSA-9jrq-w75r-8gcw), and bundled launch-editor [escaping](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [CLI flags](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [Windows path handling](https://github.com/advisories/GHSA-587h-7wmj-h5pm).
- Vitest: [redirect mock file access](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) and [manual mock code injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8).
- humanfs: [symlinked copy traversal](https://github.com/advisories/GHSA-p498-v437-472g).
- brace-expansion: [maintainer advisory list](https://github.com/juliangruber/brace-expansion/security/advisories), including [rewrite complexity](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).
- js-yaml: [empty merge-source CPU exhaustion](https://github.com/advisories/GHSA-2883-xcg3-v3hh).

## Local verification

Final checks used Node 22.23.4. Clean installs used npm 10.9.9. npm 10 crashed in
its peer resolver while updating Vitest (`edgesOut` on a null value); an isolated
npm 11.21.0 resolver completed that update under the same Node 22 runtime. Global
npm was not upgraded. All delivered lockfile URLs point to public npm; temporary
mirror URL substitutions were restored after local installations.

| Check | Result |
| --- | --- |
| Clean `npm ci --ignore-scripts --no-audit` through the local mirror | Passed in app, root and validation. Native Sharp 0.35.5 loads on the local Mac. |
| Targeted installed dependency graphs and full `npm ls --all` | Exit 0 in all three roots; selected versions match the table. npm 10 labels the existing optional Sharp WASM copy and its nested runtime extraneous on macOS; those lock entries are unchanged and the native Sharp path works. |
| `npm run test` | 269 passed across 38 files; 21 separately configured Supabase integration tests skipped. Covers analysis/actions, rendering, mock image orchestration, image splitting and persistence using test doubles. |
| `npm run lint` | Passed. |
| Public registry checks | Passed for all three lockfiles. Root names and app engine metadata were preserved. |
| Registry cleanup helper fixtures | Passed for legacy `/npm/` and `/npm-virtual/`, with/without `:443`, scoped tarballs, preserved integrity metadata and repeated execution. |
| WebSocket/SDK smoke checks | Text/binary echo and clean close passed against each installed `ws` copy on loopback. Supabase, Google SDK and Discord initialization checks made no external provider requests. Validation script syntax checks passed. |
| Default `npm run build` | Blocked by the previously recorded local Turbopack CSS-worker port restriction (`Operation not permitted`), including the escalated attempt. |
| `npm run build -- --webpack` | Passed compilation, TypeScript, prerender and trace collection with non-secret build-only Supabase placeholders and mock providers. |
| Chrome smoke check | Sign-in and sign-up forms rendered; signed-out root redirected to sign-in; no page errors. No account was created or provider request submitted. |
| User local feedback | On 26 October, the user reported “It seems to work” after the local test handoff. |

Vite emits a warning about a future major version's native config loader. The
current loader works and the test suite passes; changing module configuration is
outside this dependency patch.

The private local test server is at <http://127.0.0.1:3101>, restarted under Node
22.23.4 with `USE_AI_MOCKS=true` and `IMAGE_GENERATION_PROVIDER=mock`. The existing
local environment file was not edited. The build placeholders do not establish
real Supabase or paid-provider smoke-test results.

## Release checks still open

- [ ] Release the reviewed patch and record the active Railway app commit.
- [ ] Confirm installed application package versions in the active deployment,
  including `ws` 8.22.0 and `protobufjs` 7.6.6; identify build-only dependencies
  separately if the deployed image prunes development packages.
- [ ] Confirm production sign-in, analysis, image generation and history save/load
  after that deployment. No production change was made during local apply.

Railway builds from `app/`. Root scripts and validation are independent local
utility trees; their verified local versions do not imply separate deployed
services. SEC-10 stays open until production evidence is recorded. Zero npm
advisory matches do not complete the other security-backlog items or an audit of
bundled/native/container components.

## Environment / Railway variables

No new, changed or removed required variables. Mock settings above are temporary
local process overrides. No Railway variable update or database migration is
required by this patch.

## Archive status

Archived at the user's request on 26 October after local test feedback, with
10 of 11 tasks complete and production verification retained in the release
checklist above. There were no delta specs because the change declares
`skip_specs: true`.

[Archived OpenSpec change](../../openspec/changes/archive/2026-10-26-patch-remaining-security-dependencies/proposal.md).
