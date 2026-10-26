# JFrog npm login and lockfile runbook

Updated: 26 October 2026.

Use this for local npm registry authentication and lockfile cleanup. Select the
repository's patched Node 22 runtime first; see the
[Node runbook](../node-runtime-runbook.md).

## Recover an expired JFrog login

An `E401`, HTTP 401, or `Token failed verification: expired` response from
Artifactory means the local npm login needs attention. A public npm DNS failure
is a separate connectivity problem; logging into JFrog does not repair public
DNS.

The following sequence was verified on 26 October 2026. The operator completed
browser SSO and then refreshed npm login; subsequent dependency audits through
the mirror succeeded for app, root scripts and validation.

1. Open [JFrog](https://jfrog.booking.com) in your browser and complete company SSO.
2. In your own Terminal, run:

   ```zsh
   npm login --registry=https://jfrog.booking.com/artifactory/api/npm/npm-virtual/
   ```

3. Complete the browser/Terminal flow until npm reports a successful login.
   If the browser reports that anonymous token generation is prohibited, first
   establish the signed-in browser session and retry the login. That page alone
   is not evidence of success.
4. Verify an authenticated metadata request:

   ```zsh
   npm view ws version --registry=https://jfrog.booking.com/artifactory/api/npm/npm-virtual/
   ```

Keep passwords and generated tokens in the approved local authentication flow.
Do not copy them into chat, repository files or Railway.

The verified registry is `npm-virtual`. Older notes used the separate `/npm/`
endpoint; use the same registry URL for the current login and package commands.
Pass `--registry` per command when needed; this workflow does not require changing
global npm configuration.

## Audit or install through the local mirror

From the dependency root being assessed (`app/`, repository root or
`validation/`), a lockfile audit is:

```zsh
npm audit --package-lock-only --json --registry=https://jfrog.booking.com/artifactory/api/npm/npm-virtual/
```

A JSON report containing vulnerabilities is a successful audit response even
when npm exits with status 1. An authentication or network error is not a scan.
Do not use `npm audit fix --force` as a login or installation recovery step.

Use the same `--registry` argument for local package installations and targeted
updates. Always review manifest and lockfile changes before delivery.

### If a tarball URL loses the Artifactory path

npm 10.9.9 was observed replacing the public registry host with only
`https://jfrog.booking.com`, omitting `/artifactory/api/npm/npm-virtual/`. The
resulting tarball request returned 404 despite working authentication. This is
separate from an expired login.

When public npm is inaccessible, temporarily use the full mirror prefix in the
local lockfile and disable npm's host-only replacement for the operation. From
the relevant dependency root:

```zsh
node --input-type=module <<'NODE'
import fs from "node:fs";
const file = "package-lock.json";
const contents = fs.readFileSync(file, "utf8");
fs.writeFileSync(file, contents.replaceAll(
  "https://registry.npmjs.org/",
  "https://jfrog.booking.com/artifactory/api/npm/npm-virtual/"
));
NODE
npm ci --replace-registry-host=never --registry=https://jfrog.booking.com/artifactory/api/npm/npm-virtual/
```

Normalize and check the lockfile below after the operation, including after a
failed install. Temporary mirror URLs must not be committed. The same approach
can be used in a temporary directory containing copies of the manifest and
lockfile when resolving a targeted dependency update.

## Restore public lockfile URLs before delivery

Railway uses public npm and cannot rely on the local JFrog login. The cleanup
helper supports both `/npm/` and `/npm-virtual/`, with or without explicit port
443. From `app/`:

```zsh
npm run fix:lockfile-registry
npm run check:lockfile-registry
```

For a changed root or validation lockfile, run the same helpers from that
dependency root, using their repository-relative paths:

```zsh
# Repository root
node app/scripts/fix-lockfile-registry.mjs
node app/scripts/check-lockfile-registry.mjs

# validation/
node ../app/scripts/fix-lockfile-registry.mjs
node ../app/scripts/check-lockfile-registry.mjs
```

Review the diff to ensure resolved URLs use `https://registry.npmjs.org/` and
package versions, integrity hashes and dependency changes are intentional.

## See also

- [Node runtime runbook](../node-runtime-runbook.md)
- [Railway npm installation investigation](railway-npm-ci-failure.md)
- [Railway deployment plan](../railway-deployment-plan.md)
