# Railway Deployment Plan: Morning Analytics

**Domain:** `morning-analytics.ink` (purchased on Namecheap)

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
NEXT_PUBLIC_IMAGE_PROVIDER
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Note: `PORT` is not needed — Railway injects its own.

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
| Build fails after Node pin change | App and lockfile engine metadata out of sync | Keep `app/.nvmrc`, `app/package.json`, and lockfile root `engines.node` aligned |
| App loads but analysis fails | Missing `GEMINI_API_KEY` | Check Variables tab |
| Images don't generate | Missing Discord env vars | Check all `DISCORD_*` vars |
| Images 403 Forbidden | Supabase bucket not public | Enable public read on `analysis-images` bucket |
| Custom domain not resolving | Missing/mismatched Railway verification record | Ensure both app routing record and `_railway-verify` TXT record match Railway exactly |
| HTTPS not working | SSL not provisioned yet | Railway does this automatically, wait a few minutes |

---

## Local Dev Parity (Node + Lockfile Hygiene)

1. Use Node 22 for local work in this repo:
   - repo root: `nvm use`
   - app dir: `cd app && nvm use`
2. If your work laptop/global npm config points to a private registry, lockfile entries can leak that host.
3. Before pushing lockfile changes, verify:
   - `rg 'jfrog\\.booking\\.com' app/package-lock.json`
4. If matches are found, normalize lockfile URLs back to public npm before commit:
   - `perl -pi -e 's#https://jfrog\\.booking\\.com:443/artifactory/api/npm/npm/#https://registry.npmjs.org/#g' app/package-lock.json`
5. Re-check:
   - `rg 'jfrog\\.booking\\.com' app/package-lock.json` should return no matches.

---

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
