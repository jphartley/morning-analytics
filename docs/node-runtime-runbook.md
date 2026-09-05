# Node 22 local-runtime runbook

Use this runbook when setting up a new Mac or verifying that this repository is
running under its pinned Node.js runtime. The application is currently pinned to
Node 22.x. The pin must remain aligned in `app/.nvmrc`, `app/package.json`, and
the root package metadata in `app/package-lock.json`.

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

The `.nvmrc` file is inside `app/`, not the repository root. From the app
directory, install and activate the declared version:

```zsh
cd /Users/jhartley/code/morning-analytics/app
nvm install
nvm use
node --version
```

The version must start with `v22`. On later terminal sessions, run `nvm use`
from `app/` before installing dependencies, testing, building, or starting the
development server. `nvm` does not switch automatically on `cd` by default.

Install a clean dependency tree after selecting Node 22:

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
successful baseline on this project is a Node `v22.x.x` version, passing tests,
passing lint, and a successful production build.

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

Railway uses the committed project runtime pin; local `nvm` configuration and
`app/.env.local` are not deployed. Before changing the Node pin, update all
three pin locations together, run the full local verification above, and verify
the Railway deployment. Follow the registry and deployment guidance in
`docs/railway-deployment-plan.md`.
