# Railway Deployment Plan: Morning Analytics

**Domain:** `morning-analytics.ink` (purchased on Namecheap)

---

## Phase 1: Railway Project Setup

1. Go to [railway.com](https://railway.com) → Dashboard → **"New Project"**
2. Select **"Deploy from GitHub Repo"**
3. Connect your GitHub account (if not already connected)
4. Select the `morning-openspec` repo
5. **Set the root directory to `app`** in the service Settings tab
   - The Next.js app lives in `/app`, not the repo root
   - Railway needs to know this so Nixpacks finds `package.json` and `next.config.ts`

---

## Phase 2: Environment Variables

In Railway → your service → **Variables** tab, add all of these:

```
GEMINI_API_KEY=...
DISCORD_BOT_TOKEN=...
DISCORD_USER_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_CHANNEL_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_IMAGE_PROVIDER=midjourney
PORT=3000
```

Copy values from your local `/app/.env.local`.

---

## Phase 3: Deploy & Verify

1. Railway will auto-build once variables are saved (Nixpacks detects Next.js)
2. Watch the **build logs** for errors — common issues:
   - Sharp compilation failure → check Node version is 22
   - Missing env vars → check all are set
   - Wrong root directory → should be `app`
3. Once deployed, Railway gives you a `*.railway.app` URL
4. Quick test at the Railway URL:
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
3. Railway gives you a CNAME value (something like `xyz.railway.app`)

### Namecheap side
1. Go to [namecheap.com](https://namecheap.com) → **Domain List** → `morning-analytics.ink` → **Manage**
2. Go to **"Advanced DNS"** tab
3. Delete any default parking records
4. Add a **CNAME record**:
   - Host: `@`
   - Value: *(the CNAME value Railway gave you)*
   - TTL: Automatic
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
| Build fails | Wrong root directory | Set to `app` in Settings |
| Build fails on Sharp | Node version wrong | Check `.nvmrc` has `22` |
| App loads but analysis fails | Missing `GEMINI_API_KEY` | Check Variables tab |
| Images don't generate | Missing Discord env vars | Check all `DISCORD_*` vars |
| Images 403 Forbidden | Supabase bucket not public | Enable public read on `analysis-images` bucket |
| Custom domain not resolving | DNS not propagated yet | Wait 15-30 min, check CNAME is correct |
| HTTPS not working | SSL not provisioned yet | Railway does this automatically, wait a few minutes |

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
