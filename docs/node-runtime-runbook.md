# Node 22 local-runtime runbook

Use this runbook when setting up a new Mac or verifying that this repository is
running under its pinned Node.js runtime. The application is currently pinned to
the latest available stable Node 22.x release, with a security minimum of
22.23.4. Both root and app `.nvmrc` files select `22`; `app/package.json` and
the root package metadata in `app/package-lock.json` declare `>=22.23.4 <23`.
This allows newer 22.x patches while excluding older vulnerable releases and
unreviewed major upgrades.

## Install `nvm` on macOS

`nvm` (Node Version Manager) keeps multiple Node versions on one machine and
selects one for the current shell. Homebrew installation is supported by the
Homebrew formula. The upstream project asks users to reproduce problems with
its standard installer before requesting upstream support.

Install it with Homebrew:

```zsh
brew install nvm
mkdir -p ~/.nvm
```

Add the following to `~/.zshrc` once. `~/.nvm` is deliberately outside
Homebrew's installation directory, so installed Node versions survive Homebrew
upgrades:

```zsh
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
```

Open a new terminal, or load the configuration in the current shell:

```zsh
source ~/.zshrc
command -v nvm
```

The verification command must print `nvm`. `nvm` is a shell function, so use
`command -v nvm`, not `which nvm`.

Do not manage the project runtime with `brew install node`; let `nvm` manage
the Node versions used for this repository.

## Set up this repository

Matching `.nvmrc` files exist in the repository root and `app/`. From the app
directory, install the latest available release in the declared line and activate it:

```zsh
cd /Users/jhartley/code/morning-analytics/app
nvm install
nvm use
node --version
```

The version must be 22.23.4 or later within 22.x. An older Node 22 release does
not meet the security minimum. On later terminal sessions, run `nvm use`
from `app/` before installing dependencies, testing, building, or starting the
development server. `nvm` does not switch automatically on `cd` by default.

`nvm use` selects an installed runtime; it does not download a newer release.
Run `nvm install 22` when refreshing the local runtime. Existing running Railway
services also require a fresh build/deployment to adopt a newer runtime.

Install a clean dependency tree after selecting the patched Node 22 runtime:

```zsh
npm ci
```

If the local registry returns 401, follow the
[JFrog npm login runbook](research/jfrog-npm-login-workflow.md): sign into JFrog
through browser SSO before refreshing the `npm-virtual` login in Terminal.
That runbook also covers local mirror URLs and restoring public lockfile URLs.

`npm ci` may report dependency deprecations or audit findings. Do not run
`npm audit fix --force` as setup: it can make unreviewed breaking dependency
changes. Address dependency security work in a dedicated reviewed change.

## Verify the local runtime and application

With real local environment variables restored in `app/.env.local`, run:

```zsh
node --version
npm run test
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000` and perform the relevant manual smoke test. A
successful baseline on this project is a stable Node 22 version at or above
22.23.4, passing tests, passing lint, and a successful production build.

From the repository root, verify the runtime-selection boundary tests without
creating queue state:

```zsh
node --test scripts/node-runtime.test.mjs
```

Runtime readiness checks the actual child-command version against the engine
minimum. If PATH is unsuitable, the existing helper tries `fnm` for the 22 line
and checks that selected version too.

`npm run build` validates required Supabase configuration while prerendering.
If it fails with a missing `NEXT_PUBLIC_SUPABASE_URL` (or another required
variable), restore the local `app/.env.local` file from the secure source or
copy `app/.env.example` and enter real values directly. Never commit, paste,
or document the values from `.env.local`; it is gitignored.

For a credentials-free build-only check, safe non-secret placeholder values may
be supplied only for the build command:

```zsh
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key \
npm run build
```

Those placeholders are not suitable for sign-in, history, storage, or other
real Supabase-backed manual tests.

## Railway relationship

Railway uses the committed project runtime declarations; local `nvm` configuration
and `app/.env.local` are not deployed. Keep both `.nvmrc` selectors and the app
manifest/lockfile engine metadata aligned. After changing these declarations,
run local verification and verify the Railway deployment. Follow the registry
and deployment guidance in `docs/railway-deployment-plan.md`.

Record the actual Node version used during the build and in the running service
after redeployment. Both must be stable 22.x releases at or above 22.23.4.
Declarations and a successful local build alone do not establish the runtime of
an existing production deployment. Use the same patched runtime for validation
commands and repository-root admin scripts.

### Railway Node security releases and Mise

Verify the actual installed executable rather than relying on a build-summary
label. npm engine warnings alone do not enforce the required runtime floor.

Railpack generates a system Mise configuration with minimum_release_age = "14d".
During installation, that policy excluded the newly released Node security patch
from the rolling 22 selection. The correction is committed in
[`app/mise.toml`](../app/mise.toml), inside Railway's app build root:

```toml
[settings]
minimum_release_age_excludes = ["node"]
```

This makes fresh Node releases eligible immediately. Both .nvmrc files still
select 22, and the app manifest/lockfile still declare >=22.23.4 <23. Other
Mise-managed tools retain the builder's release-age delay. This deliberately
trades Node's waiting period for timely security patches; it does not disable
the delay globally or change the project's npm dependency lockfiles. Local nvm
setup is unchanged.

### Verify the deployed Node executable

In Railway, select production, open the morning-analytics service, then open the
Active deployment and its Build Logs. Inspect the actual Mise installation
version and npm engine warnings, as well as the summary. Then open a fresh
service Console after the new deployment becomes Active and run:

```sh
node --version
node -p 'process.env.RAILWAY_GIT_COMMIT_SHA || "Commit unavailable"'
for p in /proc/[0-9]*; do
  exe=$(readlink "$p/exe" 2>/dev/null) || continue
  case "$exe" in
    */node|*/nodejs)
      printf '%s [%s]: ' "$p" "$(cat "$p/comm")"
      "$p/exe" --version
      ;;
  esac
done
```

These commands run inside the Railway Linux container and print only the commit,
process names and versions. The npm/Next.js application processes and any Node
selected by the Console must use stable 22.x at or above 22.23.4. A successful
build, Active
status or dashboard version label does not replace this check. Reconnect the
Console after a deployment so the evidence comes from the new container.

If the Console reports `node: command not found`, it may lack the service's Mise
directories on PATH. Verify PID 1 with `/proc/1/exe --version`. This proves PID 1's Node
version; it does not prove the Next.js child's version or identify the source
commit. The process loop above does not depend on node being on PATH.

Once /proc/1/exe --version has confirmed that PID 1 is Node, use that executable
directly for the remaining read-only Node commands:

```sh
/proc/1/exe -p 'process.env.RAILWAY_GIT_COMMIT_SHA || "Commit unavailable"'
/proc/1/exe -p 'JSON.stringify(require("sharp").versions, null, 2)'
```

Do not change Railway's PATH variable solely to repair the interactive Console.
For a command such as npm that also needs Node on PATH, use the verified Node
directory for that command only:

```sh
PATH="$(dirname "$(readlink -f /proc/1/exe)"):$PATH" npm ls next react react-dom sharp undici --all
```

This command-specific PATH does not change Railway Variables or the running
application's environment. If PID 1 is not Node in a future deployment, use the
verified Node executable found by the process loop instead of assuming PID 1.

If the mismatch recurs, inspect just these non-secret Mise settings:

```sh
mise settings get minimum_release_age
mise settings get minimum_release_age_excludes
```

For the observed builder, the expected values are 14d and a list containing node.
Record deployment-specific versions, commits and verification results in the
private operations record described by the [publication policy](publication-policy.md).

References: [Railpack Mise configuration](https://railpack.com/config/mise) and
[Mise Node-only release-age exclusion](https://mise.jdx.dev/configuration/settings.html#minimum_release_age_excludes).
