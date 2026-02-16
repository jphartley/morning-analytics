# Railway Build Failure Postmortem: `npm ci` "Exit handler never called!"

**Date opened**: 2026-02-15  
**Date resolved**: 2026-02-16  
**Status**: Resolved  
**Affected service**: Morning Analytics (`/app` directory deployed to Railway)  
**Builder**: Railpack v0.17.2

---

## Incident Summary

On February 15, 2026, Railway builds failed during `npm ci` with:

```txt
npm error Exit handler never called!
npm error This is an error with npm itself. Please report this error at:
npm error   <https://github.com/npm/cli/issues>
```

Because install failed, `npm run build` then failed with `next: not found`.

Initial debugging focused on npm/Node instability, memory pressure, and package manager migration.  
The actual issue was later confirmed to be lockfile registry pinning.

---

## Verified Root Cause

`app/package-lock.json` contained `resolved` URLs pinned to a private corporate registry host:

- `https://jfrog.booking.com:443/artifactory/api/npm/npm/...`

Railway was building without credentials or routing for that private registry.  
This caused dependency installation failure. The npm "Exit handler never called!" message was a misleading terminal symptom, not the primary root cause in this incident.

Additional evidence:

- `app/package-lock.json` had hundreds of `jfrog.booking.com` `resolved` entries.
- Local global npm config was pointed at JFrog (`~/.npmrc`), which likely produced the pinned lockfile during local installs.
- Railway had no npm registry/token override variables configured.
- Once lockfile URLs were normalized to public npm, Railway installs succeeded.

---

## What Was Tried Before Root Cause Confirmation

These attempts did not resolve the build failure:

1. `3fd9df9` - Increase Node heap size in Docker build.
2. `74ec2a6` - Use Bun in Dockerfile to bypass npm.
3. `b316c63` - Remove Dockerfile, return to Railpack.
4. `68eaf6a` - Add throttling/retry `.npmrc`.
5. `46d80b3` - Downgrade app runtime pin from Node 22 to Node 20.

These were reasonable hypotheses, but they did not address the lockfile's private-registry `resolved` URLs.

---

## Final Remediation (Two-Deploy Sequence)

### Deploy A (stabilize install path first)

**Commit**: `5e57311` (2026-02-16)  
**Changes**:

- Rewrote `app/package-lock.json` `resolved` URLs from JFrog to `https://registry.npmjs.org/...`
- Kept npm as package manager
- Temporarily aligned app lockfile engine metadata to Node 20 for an isolated test

**Result**: Railway deployment succeeded.

### Deploy B (restore preferred runtime pin)

**Commit**: `d4041d8` (2026-02-16)  
**Changes**:

- `app/.nvmrc` -> `22`
- `app/package.json` -> `"engines": { "node": "22.x" }`
- `app/package-lock.json` root engine metadata -> `22.x`

**Result**: Railway deployment succeeded again.

---

## Current State (as of 2026-02-16)

| File | Current State |
|------|---------------|
| `/app/.nvmrc` | `22` |
| `/app/package.json` | `"engines": { "node": "22.x" }` |
| `/app/package-lock.json` | `resolved` URLs normalized to `registry.npmjs.org` |
| Dockerfile | Not used (Railpack path) |

The app is deployable on Railway with npm + Node 22 after lockfile normalization.

---

## Notes on Log Warnings

Runtime logs still show:

```txt
npm warn config production Use `--omit=dev` instead.
```

This warning did not block startup or runtime and is not the failure cause.

---

## Prevention

1. Before committing lockfiles, check for private registry leakage:
   - `rg 'jfrog\\.booking\\.com' app/package-lock.json`
2. Keep deployment root set to `app` in Railway service settings.
3. Treat `npm error Exit handler never called!` as a symptom; inspect registry/auth/network and lockfile `resolved` sources first.
4. If local environment must use a private registry, ensure CI/deployment lockfiles are still compatible with public resolution behavior.

---

## References

- [npm/cli#7639 — Exit handler never called (original)](https://github.com/npm/cli/issues/7639)
- [npm/cli#8974 — Exit handler never called in Docker Alpine](https://github.com/npm/cli/issues/8974)
- [npm docs: registry config](https://docs.npmjs.com/cli/v11/using-npm/registry/)
