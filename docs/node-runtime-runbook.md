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
