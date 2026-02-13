# Storage Options for Analytics Archiving

Analysis of storage approaches for persisting morning analytics history.

## Requirements

- ~50 users max, ~1 analysis/day each
- Data per analysis:
  - Input text (morning pages) - few KB
  - Analysis text - few KB
  - 4 images (~500KB-2MB total)
  - Model used, timestamp
- Monthly growth: ~50 users × 30 days × 1.5MB = ~2.25GB/month of images
- Chronological browsing only (no search needed)
- Hobby project, simplicity preferred

---

## Option 1: Supabase (Recommended)

Postgres database + S3-compatible blob storage + auth, all in one service.

### Pricing

| Tier | Database | Storage | Bandwidth |
|------|----------|---------|-----------|
| Free | 500MB | 1GB | 2GB/month |
| Pro ($25/mo) | 8GB | 8GB | 250GB/month |

Free tier covers ~500+ analyses before upgrade needed.

### Pros

- One service handles everything (DB, files, future auth)
- Same code works locally and in production
- Good Next.js/JS SDK
- Auth built-in when needed for multi-user
- S3-compatible storage (easy migration if needed)
- Generous free tier

### Cons

- External service dependency
- Slight latency for non-US regions

### When to Choose

Best "simplicity now, flexibility later" balance. Recommended for this project.

---

## Option 2: Vercel Postgres + Vercel Blob

Vercel's native storage solutions - tightest integration with Vercel hosting.

### Pricing

| Tier | Database | Blob Storage | Blob Egress |
|------|----------|--------------|-------------|
| Free | 256MB | 1GB | Included |
| Paid | $0.30/GB | $0.15/GB | $0.05/GB |

### Pros

- Native Vercel integration, zero external services
- Simplest setup if already on Vercel
- Good DX with Next.js

### Cons

- Tighter free tier than Supabase
- Costs grow faster with image-heavy workloads
- No built-in auth

### When to Choose

If definitely deploying to Vercel and want zero external services.

---

## Option 3: Local-first (SQLite + Files)

Store everything on disk during development, migrate when deploying.

### Pricing

$0 - no external services.

### Pros

- Zero cost
- Zero dependencies
- Works offline
- Fastest iteration during dev

### Cons

- Doesn't work for multi-user on hosted platforms
- Requires storage layer rewrite for production
- No concurrent writes (SQLite limitation)

### When to Choose

If deferring the hosting decision and might never actually deploy, or want to prototype quickly before committing to a service.

---

## Recommendation

**Supabase** is recommended for this project because:

1. One service handles DB, file storage, and future auth
2. Free tier likely covers months of usage at this scale
3. Same code works in dev and production (no migration)
4. When multi-user is needed, auth is already integrated
5. Standard technologies (Postgres, S3-compatible) mean easy migration if needed

The extra 30 minutes of setup vs local files saves a full storage layer rewrite later.

---

## Decision

TBD - awaiting confirmation to proceed with Supabase approach.
