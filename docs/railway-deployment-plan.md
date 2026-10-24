# Railway Deployment Plan: Morning Analytics

**Domain:** `morning-analytics.ink` (purchased on Namecheap)

To recreate this GitHub → Railway → custom domain path in another repository, use [`github-railway-custom-domain.md`](github-railway-custom-domain.md). This file stays the Morning Analytics checklist.

---

## Phase 1: Railway Project Setup ✅ DONE

1. ~~Go to railway.com → Dashboard → "New Project"~~
2. ~~Select "Deploy from GitHub Repo"~~
3. ~~Connect GitHub account~~
4. ~~Select the `morning-openspec` repo~~
5. ~~Set the root directory to `app` in service Settings~~

---

## Phase 2: Environment Variables ✅ DONE

All variables set in Railway → service → Variables tab:

```
GEMINI_API_KEY
GEMINI_MODEL
DISCORD_BOT_TOKEN
DISCORD_USER_TOKEN
DISCORD_GUILD_ID
DISCORD_CHANNEL_ID
MIDJOURNEY_APP_ID
MIDJOURNEY_IMAGINE_COMMAND_ID
USE_AI_MOCKS
IMAGE_GENERATION_PROVIDER
IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED
IMAGE_PROVIDER_DUAL_MODE_ENABLED
NEXT_PUBLIC_TEST_VIEW_ENABLED
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Note: `PORT` is not needed — Railway injects its own.

### Dormant image provider trials

Midjourney/Discord is the chosen production provider. Set
`IMAGE_GENERATION_PROVIDER=midjourney`, leave the new optional
`IMAGE_PROVIDER_TRIAL_CANDIDATE` unset, and keep the two server flags
`IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` and `IMAGE_PROVIDER_DUAL_MODE_ENABLED`
`false`. Remove the retired `NEXT_PUBLIC_IMAGE_PROVIDER`,
`NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED`, and
`NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED` settings if present. Browser
metadata is derived automatically from server configuration.
Remove unused `BLACK_FOREST_LABS_*` variables, including its API key, if present.
The adapter remains available for an explicitly configured future experiment.

Make these changes in **morning-analytics service > Variables > production**.
Railway does not read local environment files. Review staged changes and click
**Deploy**; saving alone does not activate variables. Deploy/redeploy after any
variable change. Public values require a rebuild, as does changing the
server-only trial candidate because safe candidate metadata enters the browser
bundle. No database migration is required for dormancy.

For exact BFL variable names and deliberate trial activation, see
[Image provider trials](image-provider-trials.md). Old flags alone no longer
activate BFL or Dual mode. This checklist does not verify current remote values.

### Contextual memory and Test view

Deploy the Supabase migration adding `memories`, `memory_evidence`, and
`analyses.memory_context` before deploying the contextual-memory application
release. Set the following in the `morning-analytics` service's **production**
environment:

```text
NEXT_PUBLIC_TEST_VIEW_ENABLED=true
```

Use `false` to hide Test view and its memory diagnostics. Contextual-memory
selection and update continue in Quiet and Insight views. Railway variable edits
are staged: review them, click **Deploy**, and redeploy after every change because
this public value is compiled into the client bundle.

### Role-aware friends trial

Apply `supabase/migrations/20260905090000_add_profiles_roles.sql` before the
compatible application release. It creates one `profiles` row per authenticated
account, defaults every account to `user`, and adds an owner-only profile read
policy. Promote designated existing accounts using the operator procedure in
[`docs/admin-user-modes.md`](admin-user-modes.md); this Supabase data change does
not itself need an app deployment.

For the `morning-analytics` service's **production** environment, review this
existing variable and set its value for the normal-user release:

```text
IMAGE_GENERATION_PROVIDER=midjourney
```

Do not enable the optional provider-override flags unless administrator
Test/Debug experimentation is intended. Railway does not read local `.env`
files. Review the staged production variable changes and deploy/redeploy after
any variable change. This is required even for server-only values; every
`NEXT_PUBLIC_*` value is compiled into the Next.js browser bundle and therefore
specifically needs a rebuild/redeploy.

For future production schema changes, use the reviewed CLI workflow in
[`supabase-cli-runbook.md`](supabase-cli-runbook.md). It includes the required
dry-run review and the VPN/pooler troubleshooting that applies to this project.

---

## Phase 3: Build & Deploy ✅ BUILD FIXED

**Issue encountered:** `npm ci` crashed with "Exit handler never called."
**Verified root cause:** `app/package-lock.json` had `resolved` entries pinned to `jfrog.booking.com`, which Railway could not use.
**Fix applied:** normalize lockfile `resolved` URLs to `registry.npmjs.org`, then deploy with Node 22.

### Verify deployment
1. Check build logs show green "Deployed" status
2. Railway provides a `*.railway.app` URL
3. Quick test at the Railway URL:
   - [ ] App loads (sign-in page appears)
   - [ ] Can sign up / sign in
   - [ ] Analysis works (~2s for text)
   - [ ] Images generate (~60-90s)
   - [ ] History sidebar loads past analyses

---

## Phase 4: Custom Domain

### Railway side
1. In Railway → service → **Settings** → **"Custom Domain"**
2. Add: `morning-analytics.ink`
3. Railway shows the exact DNS records required for verification/routing.

### Namecheap side
1. Go to [namecheap.com](https://namecheap.com) → **Domain List** → `morning-analytics.ink` → **Manage**
2. Go to **"Advanced DNS"** tab
3. Delete any default parking records
4. Add the records Railway requests (do not assume a fixed record type).  
   Example that worked for this deployment:
   - `CNAME` record: `@` → `2si4e0ms.up.railway.app.` (TTL Automatic)
   - `TXT` record: `_railway-verify` → `railway-verify=<token>` (TTL Automatic)
5. If you also want `www.morning-analytics.ink`:
   - Add another CNAME record with Host: `www` and the same value

### Verify
- Wait ~15 minutes for DNS propagation
- Railway auto-provisions SSL (free, via Let's Encrypt)
- Visit `https://morning-analytics.ink` — should load the app

---

## Phase 5: Smoke Test

Full end-to-end test on the live domain:

- [ ] `https://morning-analytics.ink` loads
- [ ] Sign up with a new account
- [ ] Sign in works
- [ ] Submit morning pages text
- [ ] Analysis returns (~2s)
- [ ] Images generate (~60-90s)
- [ ] Images display in 2×2 grid
- [ ] Lightbox works (click an image)
- [ ] History sidebar shows the analysis
- [ ] Click a history item to reload it
- [ ] Sign out works
- [ ] Sign back in, history persists

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Build fails on `npm ci` | Lockfile pinned to private registry | Ensure `app/package-lock.json` does not contain `jfrog.booking.com`; use `registry.npmjs.org` entries |
| Build fails | Wrong root directory | Set to `app` in Settings |
| Build fails after Node pin change | App and lockfile engine metadata out of sync | Keep root/app `.nvmrc` selectors at `22`; app manifest and lockfile root engines must agree on `>=22.23.4 <23` |
| App loads but analysis fails | Missing `GEMINI_API_KEY` | Check Variables tab |
| Images don't generate | Missing Discord env vars | Check all `DISCORD_*` vars |
| Dual mode is missing | No authorized trial candidate is configured, the server Dual gate is off, or derived browser metadata needs a rebuild | Check production Variables, deploy staged changes, and redeploy |
| Test view is missing | `NEXT_PUBLIC_TEST_VIEW_ENABLED=false` was compiled into the client | Set the intended production value, review staged changes, and redeploy |
| Memory diagnostics fail | Contextual-memory migration is missing or Supabase policies are not deployed | Apply the migration before the compatible app release |
| Images 403 Forbidden | Supabase bucket not public | Enable public read on `analysis-images` bucket |
| Custom domain not resolving | Missing/mismatched Railway verification record | Ensure both app routing record and `_railway-verify` TXT record match Railway exactly |
| HTTPS not working | SSL not provisioned yet | Railway does this automatically, wait a few minutes |

---

## Local Dev Parity (Node + Lockfile Hygiene)

For new-Mac setup and the exact Node 22 verification procedure, read
[`node-runtime-runbook.md`](node-runtime-runbook.md). The app's `.nvmrc` lives
in `app/`, so run `cd app && nvm use` before local dependency installation,
testing, builds, or development-server commands.

1. Use the latest available stable Node 22 release, at least 22.23.4, for local work in this repo. `nvm install 22` refreshes the installed runtime; `nvm use` selects an installed version.
2. If your work laptop/global npm config points to a private registry, lockfile entries can leak that host.
3. Before pushing lockfile changes, verify:
   - `rg 'jfrog\\.booking\\.com' app/package-lock.json`
4. If matches are found, normalize lockfile URLs back to public npm before commit:
   - `perl -pi -e 's#https://jfrog\\.booking\\.com:443/artifactory/api/npm/npm/#https://registry.npmjs.org/#g' app/package-lock.json`
5. Re-check:
   - `rg 'jfrog\\.booking\\.com' app/package-lock.json` should return no matches.

---

## Verify deployed runtime and dependency versions

After a security patch deploy, record the active commit and actual Node versions
from the build and running service. Require Node 22.23.4 or later within 22.x;
an existing deployment does not update itself when a newer 22.x patch is released.
Verify the installed Next.js, React pair, Sharp/native libraries and Undici
versions against the reviewed dependency graph. Keep local test success and
production verification as separate entries in
[`security-remediation-2026-10.md`](security-remediation-2026-10.md).

Railpack's generated Mise configuration delays new tool releases for 14 days.
The committed app/mise.toml excludes only Node from that delay so urgent security
patches can be adopted while retaining latest 22.x selection. Other tools retain
the builder's policy. Verify the actual Node installation output and running
executable: a package-summary label can disagree with the installed version.

If NO_CACHE=1 was added for the October diagnostic rebuild, it is temporary.
After the corrected deployment's versions are verified, remove NO_CACHE from the
morning-analytics production service, review and deploy the staged removal, and
verify the resulting deployment. No permanent new Railway variable is required
for the Node release-age correction.

## Fallback: railway.toml

If the root directory setting doesn't work via the dashboard, add this file to the repo root:

```toml
# railway.toml
[build]
  watchPatterns = ["app/**"]

[deploy]
  startCommand = "npm start"
```

Then set root directory to `app` in the dashboard and redeploy.

---

## Post-Deployment: Rotate Credentials

Credentials were exposed in chat history during deployment. Rotate these:

- [ ] **Gemini API Key** — Google Cloud console → API & Services → Credentials → regenerate
- [ ] **Discord Bot Token** — Discord Developer Portal → Bot → Reset Token
- [ ] **Discord User Token** — Change Discord account password (invalidates old user token)
- [ ] **Supabase Service Role Key** — Supabase Dashboard → Settings → API → regenerate
- [ ] Update the new values in Railway Variables tab
- [ ] Update `/app/.env.local` with the new values
