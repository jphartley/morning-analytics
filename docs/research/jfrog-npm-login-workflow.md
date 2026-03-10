# JFrog npm Registry Login & Lockfile Workflow

**Last updated**: 2026-03-10

This documents the full workflow for authenticating with Booking's JFrog Artifactory npm registry and keeping `package-lock.json` compatible with both local development and Railway deployments.

---

## When You Need This

You'll hit `E401 Incorrect or missing password` or `ECONNRESET` errors when running `npm install` in the `/app` directory. This means your JFrog auth token has expired.

Typical error:

```
npm error code E401
npm error Incorrect or missing password.
```

---

## Step 1: Log In to JFrog

Run this from any directory:

```bash
npm login --registry=https://jfrog.booking.com:443/artifactory/api/npm/npm/
```

### What happens next (this is the confusing part):

1. **Terminal shows a login URL and "Press ENTER to open in the browser..."**

   ```
   npm notice Log in on https://jfrog.booking.com:443/artifactory/api/npm/npm/
   Login at:
   https://jfrog.booking.com:443/ui/auth-provider/npm?uuid=...
   Press ENTER to open in the browser...
   ```

2. **Press Enter.** A browser tab opens.

3. **The browser shows a confusing page:** "Token generation for user : anonymous is prohibited"

   This looks like an error, but **it is not a failure**. Just close/ignore this browser tab.

4. **Go back to the terminal.** It will look like it's hanging — the cursor changes shape and sits there in a waiting state. **This is normal.** It is waiting for the auth flow to complete server-side.

5. **Wait.** This can take anywhere from 30 seconds to several minutes. Don't Ctrl+C — just leave it. Go grab a coffee.

6. **Eventually the terminal prompts for credentials:**

   ```
   Username: jhartley
   Password:
   ```

   - **Username**: Your unix username (e.g., `jhartley`), NOT your email address. Format is typically first initial + surname (e.g., `jdoe` for Jane Doe).
   - **Password**: Your Booking SSO / LDAP password.

7. **Success:**

   ```
   Logged in on https://jfrog.booking.com:443/artifactory/api/npm/npm/.
   ```

---

## Step 2: Install Packages

Now `npm install` will work:

```bash
cd app
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm tiptap-markdown
```

(Or whatever packages you need.)

---

## Step 3: Fix the Lockfile Before Committing

JFrog URLs leak into `package-lock.json` during local installs. Railway can't reach JFrog, so these must be normalized to public npm before committing.

```bash
cd app

# Check for leaked JFrog URLs
npm run check:lockfile-registry

# If check fails, fix them
npm run fix:lockfile-registry

# Verify the fix
npm run check:lockfile-registry
```

This rewrites all `https://jfrog.booking.com:443/artifactory/api/npm/npm/...` URLs in the lockfile to `https://registry.npmjs.org/...`.

**Always do this before committing any lockfile changes.**

---

## Quick Reference

| Step | Command | Notes |
|------|---------|-------|
| Login | `npm login --registry=https://jfrog.booking.com:443/artifactory/api/npm/npm/` | Browser opens, looks broken, wait for terminal prompt |
| Install | `cd app && npm install <packages>` | Works after login |
| Check lockfile | `cd app && npm run check:lockfile-registry` | Run before every commit with lockfile changes |
| Fix lockfile | `cd app && npm run fix:lockfile-registry` | Normalizes JFrog URLs to public npm |

---

## See Also

- `/docs/research/railway-npm-ci-failure.md` — Original postmortem for why this matters
- `/docs/railway-deployment-plan.md` — Railway deployment guide (Phase 3 and "Local Dev Parity" section)
- `CLAUDE.md` — "Local vs Railway npm Registry Workflow" section
