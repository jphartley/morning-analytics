# GitHub and Railway: update a public URL on every push to main

This file is a portable playbook. It records how Morning Analytics keeps `https://morning-analytics.ink` current, and how to recreate that path in another repository.

Project-specific status for this app (which variables are already set, the smoke test, the lockfile incident) stays in [`railway-deployment-plan.md`](railway-deployment-plan.md). Use this file when the job is "do the same thing for a different repo."

## How to use this in another repository

1. Copy this file into the other repository, for example as `docs/github-railway-custom-domain.md`.
2. Tell the agent: "Follow this playbook and set up the same GitHub → Railway → custom domain path for this project."
3. Adapt the app root, branch, environment variable names, Railway service name, and domain. The Morning Analytics names below are the reference implementation.

The agent cannot finish this alone. Creating the Railway project, authorizing GitHub, entering production secrets, and publishing DNS records all happen in the owner's Railway and domain accounts. The agent prepares the repository, lists the exact variable names, and writes the remaining owner steps. The owner types secret values into Railway. Never copy secret values into the repository, documentation, commits, or chat.

## What this setup is

A push to `main` on GitHub is the production deploy. Railway builds that commit and serves it on the custom domain.

| Piece | Morning Analytics |
| --- | --- |
| GitHub repository | `jphartley/morning-analytics` (`https://github.com/jphartley/morning-analytics`) |
| Production branch | `main` |
| Host | Railway service `morning-analytics`, production environment |
| How Railway is connected | Dashboard flow: New Project → Deploy from GitHub Repo |
| Deploy workflow in git | None. This repo has no `.github/workflows` deploy workflow, no `railway.toml`, no `railway.json`, and no Dockerfile |
| Directory Railway builds | `app/`, set as the service Root Directory. Docs and other repo folders are not the Next.js app |
| Builder | Railway Railpack. It installs from the lockfile in that root, runs `npm run build`, then `npm start` |
| Scripts | `app/package.json`: `"build": "next build"`, `"start": "next start"` |
| Node.js | Latest stable 22.x, minimum 22.23.4; root/app `.nvmrc` select `22`, while app manifest and lockfile root engines declare `>=22.23.4 <23`. `app/mise.toml` exempts only Node from Railpack's release-age delay. |
| Public URL | `https://morning-analytics.ink` |
| Registrar | Namecheap. Railway issues the HTTPS certificate |

Railway does not read `.env`, `.env.local`, or `.env.example`. Production values live in the Railway service's **production** environment. Variables are environment-scoped, so a value saved on another Railway environment does not affect the public site.

Saving a variable only stages it. The running deployment keeps the previous values until that staged change is reviewed and deployed. For a Next.js app, `NEXT_PUBLIC_*` values are compiled into the browser bundle, so browsers keep the old values until that rebuild. Redeploy after every variable change, including server-only variables. Railway injects `PORT`; do not set it.

## What the agent inspects first

Before proposing Railway settings, read the target repository and fill in this list. Do not reuse the Morning Analytics column unless the new app really matches it.

- App root: the directory that contains the `package.json` Railway should build. Here that is `app/`, because the repository root is not the Next.js app.
- Production branch. Here it is `main`.
- `build` and `start` scripts. Here they are `next build` and `next start`.
- Node.js pin, and whether `.nvmrc`, `package.json` `engines.node`, and the lockfile root engine agree.
- Every environment variable the app reads, taken from `.env.example` and the code. Names only.
- Domain and registrar the owner already controls.
- Whether `package-lock.json` `resolved` URLs point at `https://registry.npmjs.org/`. A private registry host will make Railway's `npm ci` fail.

## Owner steps

Do these in order. Wait for each deploy to finish before treating the site as updated.

### 1. Connect the GitHub repository

1. Open [railway.com](https://railway.com) → New Project → Deploy from GitHub Repo.
2. Authorize the GitHub account that owns the repository.
3. Select that repository.
4. Leave the production branch as `main` unless the repository uses a different production branch.
5. In the service Settings, set Root Directory to the app root (`app` for Morning Analytics).

Railway then deploys on every push to that branch. A later `git push origin main` is the deploy.

### 2. Set production variables

In the service → Variables, select the **production** environment.

- Add each name the app requires. The owner pastes the values in the dashboard.
- On any service built from a lockfile that might have been installed through a private npm registry, also set:
  - `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`
  - `NPM_CONFIG_REPLACE_REGISTRY_HOST=always`
- Review the staged changes and deploy them. A saved variable is not live until that deploy finishes.

### 3. Confirm the Railway hostname

Open the deployment logs and the generated `*.railway.app` URL. The app should boot there before any custom domain is attached. Fix build or variable failures against that hostname first.

### 4. Attach the custom domain

1. Service → Settings → Custom Domain.
2. Add the hostname, for example `morning-analytics.ink`.
3. Copy the DNS records Railway shows for that service. Each service gets its own target and verification token. Use those values. The records that worked for Morning Analytics are an example of shape only:
   - `CNAME` host `@` → the service's `*.up.railway.app` target
   - `TXT` host `_railway-verify` → the `railway-verify=...` token Railway displays
4. Add `www` only if that hostname should work too, as a second record pointing at the same Railway target.

### 5. Publish DNS at the registrar

For Namecheap: Domain List → the domain → Manage → Advanced DNS. Remove parking records that would conflict, then add the records from the Railway screen. TTL can stay Automatic.

Wait for DNS to propagate and for Railway to mark the domain as verified. Railway provisions HTTPS. The public check is `https://<your-domain>`, not the `*.railway.app` URL.

If the app uses Supabase Auth, add the public origin to that Supabase project's Site URL and redirect allow list. Confirm the current Supabase settings in the dashboard; this playbook does not store them.

## Agent steps in the repository

Make a clean build possible from the app root, on a machine that only has the public npm registry:

```bash
cd <app-root>
npm ci
npm run build
```

`npm start` is what Railway runs after a successful build. It should listen on `PORT`.

Keep the Node.js pin aligned in the app root:

- `.nvmrc`
- `package.json` `engines.node`
- lockfile root `engines.node`

For Morning Analytics, the selector is `22` and the engine minimum is
`>=22.23.4 <23`. Preserve app/mise.toml's Node-only release-age exception:
Railpack's 14-day delay previously installed 22.23.3 despite a 22.23.4 summary.
Disabling caching did not fix that mismatch. Follow the
[Node runtime runbook](node-runtime-runbook.md) for the correction, actual-process
verification and the Console fallback when node is not on PATH. Other projects
must choose their own supported runtime/security floor rather than copy this
dated minimum without review.

Before committing a lockfile, confirm every `resolved` URL uses `https://registry.npmjs.org/`. In this repository the checks are `cd app && npm run check:lockfile-registry` and, when that fails, `npm run fix:lockfile-registry`. Another repository needs the same outcome even if it does not have those scripts. Morning Analytics hit a production build failure because `app/package-lock.json` had been rewritten to a private registry host (`jfrog.booking.com`). Railway could not authenticate there, `npm ci` failed, and the visible npm error (`Exit handler never called`) hid that cause. Details are in [`research/railway-npm-ci-failure.md`](research/railway-npm-ci-failure.md).

Do not add `railway.toml` or a Dockerfile unless the dashboard Root Directory setting is not enough. This repository deploys without either file. A fallback `railway.toml` is sketched at the bottom of [`railway-deployment-plan.md`](railway-deployment-plan.md) and was not required for the working setup.

When the app gains, removes, or renames an environment variable, tell the owner the names and whether each is new, changed, or removed. Remind them to update the Railway **production** environment and deploy the staged change. Call out any `NEXT_PUBLIC_*` name, because it is compiled into the client bundle.

## After it is live

- Push to `main` and confirm a new Railway deployment starts from that commit.
- Open `https://<your-domain>` and exercise the app's real entry path (for this app: sign-in, an analysis, and history).
- On later variable edits, deploy the staged Railway change in the production environment before checking the public site.

## Troubleshooting that transferred from this repository

| What you see | What it usually means | What to do |
| --- | --- | --- |
| `npm ci` fails, sometimes as `Exit handler never called` | Lockfile `resolved` URLs point at a private registry | Point them at `https://registry.npmjs.org/`, set the two `NPM_CONFIG_*` variables above, and redeploy |
| Build cannot find the app | Root Directory is the repository root while the app lives in a subdirectory | Set Root Directory to the folder that contains the app `package.json` |
| Node version on Railway disagrees with local | `.nvmrc`, `package.json`, and the lockfile root engine disagree | Make all three the same, then redeploy |
| App boots, a feature fails | A required variable is missing in production, or a change is still staged | Check the production environment and deploy the staged change |
| Browser still shows old public config | `NEXT_PUBLIC_*` was changed without a rebuild | Redeploy after the variable change |
| Custom domain does not verify | DNS does not match the records Railway is showing now | Update both the routing record and the `_railway-verify` TXT record from the current Railway screen |
| HTTPS is not ready yet | Certificate provisioning is still running | Wait, then reload `https://<your-domain>` |

## Prompt to paste in the other repository

```text
Follow docs/github-railway-custom-domain.md and set up the same path for this repository: GitHub is the source, a push to the production branch auto-deploys on Railway, and a custom domain serves the site over HTTPS.

Inspect this repo before changing anything. Find the app root, the production branch, the build and start scripts, the Node.js pin, and every environment variable the app reads. Adapt those. Do not copy Morning Analytics service names, secret values, or DNS targets.

Prepare the repo so a clean npm ci and npm run build succeed from the app root, with lockfile URLs on https://registry.npmjs.org/ and one Node.js pin across .nvmrc, package.json, and the lockfile. Leave Railway config files out unless the dashboard Root Directory setting cannot see the app.

Then list the owner steps still required: Railway GitHub connection, root directory, production variable names with no values, the generated Railway URL check, custom domain, and registrar DNS. I will enter secrets and DNS myself.
```
