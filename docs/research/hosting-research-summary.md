# Next.js App Hosting Research - Final Recommendations

**Date:** February 13, 2026
**Project:** Next.js web app with Postgres database and authentication
**Scale:** 2–50 users initially, 50–100 requests/day
**Budget:** As close to \$0 as possible, max \$10–20/month
**Context:** Hobbyist project, limited DevOps experience, have 1 year free Railway Hobby plan

***

## Executive Summary

**RECOMMENDED SOLUTION: Railway (Next.js hosting) + Supabase (Postgres + Auth)**

- **Cost:** \$0/month (within free tiers for both platforms)
- **Complexity:** Low – minimal DevOps required
- **Maintenance:** Fully managed database with automatic backups
- **Infrastructure-as-Code:** Both platforms support config files

***

## Key Decision Factors

### Why NOT Railway for Everything?

Railway Postgres is **unmanaged**, meaning:

- No automatic backups by default (you must configure them yourself)
- Manual database updates/patches are your responsibility
- You are responsible for monitoring and basic maintenance
- Backup storage costs extra (around \$0.20/GB/month)[^1][^2]

Given your limited DevOps experience and hobbyist context, this is too risky for your primary database.

### Why Railway + Supabase Hybrid?

- Railway handles: **Next.js hosting and deployment** (excellent DX, uses your free Hobby year)[^3][^4]
- Supabase handles: **Postgres database + authentication** (fully managed with built‑in auth)[^5][^6][^7]
- Both free: Railway credit covers hosting, Supabase free tier covers your expected usage
- Low maintenance: Automatic backups, security patches, and performance handled by Supabase
- Built-in auth: No need to implement NextAuth.js yourself

***

## Final Architecture

```text
┌─────────────────────────────────────────┐
│           Your Next.js App             │
│                                        │
│  - API routes for Gemini AI calls      │
│  - API routes for Discord integration  │
│  - Frontend UI                         │
│                                        │
│         Hosted on: Railway             │
└─────────────────┬──────────────────────┘
                  │
                  │ DATABASE_URL (env var)
                  │
                  ▼
┌─────────────────────────────────────────┐
│               Supabase                 │
│                                        │
│  - Postgres Database (managed)         │
│  - Authentication (built-in)           │
│  - Automatic daily backups             │
│  - Connection pooling                  │
│                                        │
└─────────────────────────────────────────┘
```


***

## Platform Comparison Summary

| Platform | Role | Cost | Pros | Cons |
| :-- | :-- | :-- | :-- | :-- |
| Railway | Next.js hosting | \$0 (free Hobby year) | Easy deploys, good DX, unified hosting | DB is unmanaged |
| Supabase | DB + Auth | \$0 (free tier) | Fully managed Postgres, built‑in auth, backups | Separate platform to manage |
| Vercel | Alternative host | \$0 (free tier) | Best Next.js integration, great DX | Free tier limits, no DB/auth |
| AWS/GCP | Full cloud stack | Typically \$10–30+/mo | Maximum flexibility | Overkill, higher complexity |

[^6][^8][^9][^10][^11][^12][^13]

***

## What You Get with This Setup

### Railway (Free Year)

- Hosting for your Next.js app with simple Git‑based or CLI deployments[^4][^3]
- Hobby plan includes monthly usage credit (around \$5) that typically covers low‑volume apps
- Good dashboard, logs, and environment variable management
- One‑command deploy workflow via `railway up`


### Supabase (Free Tier – Ongoing)

- Postgres database with around 500 MB storage on free tier[^7][^6]
- Built‑in authentication (email/password and OAuth providers)
- Daily automated backups with basic retention on managed Postgres[^5]
- SQL editor, table view, and database management UI
- Connection pooling for efficient serverless access

***

## Infrastructure-as-Code Setup

Both platforms support configuration that Claude Code can generate.

### Railway

- Config via `railway.json` or `railway.toml`:
    - Build command (e.g., `npm run build`)
    - Start command (e.g., `npm start`)
    - Health checks and restart policies[^3]


### Supabase

- `supabase/config.toml` and `supabase/migrations/*.sql`:
    - Database schema and migrations as SQL files
    - Auth and RLS policies managed as code[^7][^5]

This lets you keep hosting, schema, and auth rules in version control and have Claude Code generate or update them.

***

## Next Steps

1. **Create a Supabase project**
    - Use free plan, choose an EU region (e.g., Frankfurt or London).
2. **Configure Supabase auth**
    - Enable email/password and any OAuth providers you want.
3. **Wire Supabase into your Next.js app**
    - Add Supabase client and use it for auth and database queries.
4. **Create a Railway project for the Next.js app**
    - Connect GitHub repo or use CLI; set environment variables (Supabase URL, keys, DB URL, API keys).
5. **Deploy to Railway**
    - Use Git pushes or `railway up` to deploy.

***

## Alternative Considered (Not Recommended as Primary)

### Railway Only (Next.js + Railway Postgres)

- Pros:
    - Everything on one platform
    - Simple mental model and a single dashboard[^14][^15]
- Cons:
    - Postgres is **unmanaged**: you must configure backups, handle upgrades and maintenance yourself[^2][^16][^1]
    - No built‑in auth; you must add NextAuth.js or roll your own
- Conclusion: Acceptable only if you’re willing to take on extra DevOps work; not aligned with your “minimal DevOps” goal.

***

## Cost Projection

### Year 1 (with Railway Hobby free year)

- Railway: \$0 (usage covered by monthly credit)
- Supabase: \$0 (within free tier limits)
- **Total:** ~\$0/month for your expected usage


### After Year 1

- Option A – Stay on Railway for hosting:
    - Likely around \$5–8/month for low‑traffic Next.js app
- Option B – Migrate hosting to Vercel:
    - Still \$0/month on free tier for your scale[^10]
- Option C – Upgrade Supabase (if needed):
    - Pro plan around \$25/month, with more storage and advanced features[^6]

***

## Risk Mitigation

### Data Loss

- Supabase managed Postgres includes automated backups on paid tiers and basic backup/restore on free tier; much safer than running your own unmanaged DB.[^5][^6]
- You can export data and schema via Supabase tools at any time.


### Vendor Lock‑in

- Both Railway and Supabase use standard Postgres, so you can migrate DB elsewhere if needed.[^11][^17]
- Next.js is portable across many hosts (Vercel, Railway, AWS Amplify, etc.).[^8][^12]


### Scaling

- Supabase free tier supports up to tens of thousands of MAUs, which is far above your initial 2–100 users.[^7]
- Railway’s Hobby plan resources are more than enough for low‑volume traffic.[^4][^3]

***

## Questions Answered During Research

- **Can everything be hosted on a single platform?**
Yes, Railway can host both app and Postgres, but the DB is unmanaged and requires you to handle backups and maintenance.[^1][^2]
- **Is Railway Postgres “fully managed”?**
No. Railway provides the runtime and storage, but not turnkey backups, automatic upgrades, or full DB administration; you need to set these up yourself.[^16][^1]
- **What’s the easiest way to get auth + Postgres?**
Supabase, which combines managed Postgres and built‑in auth (email/OAuth) on a generous free tier.[^6][^5][^7]
- **Does this support Infrastructure‑as‑Code?**
Yes – Railway and Supabase both allow configuration via files and SQL migrations that you can keep in Git and generate with Claude Code.[^2][^3][^5]
- **Can I work locally and then deploy easily?**
Yes – Next.js runs via `npm run dev`, Supabase has a local dev environment via its CLI, and Railway supports smooth CI/CD from GitHub.[^18][^19]

***

## Conclusion

The **Railway (hosting) + Supabase (Postgres + Auth)** architecture:

- Meets your budget target (effectively \$0/month at your scale in Year 1).
- Minimizes DevOps, especially around Postgres backups, security, and upgrades.
- Gives you production‑ready authentication without building it yourself.
- Fits well with Infrastructure‑as‑Code and Claude Code support.
- Leaves you with a clean migration path later (e.g., to Vercel or upgraded Supabase/Railway plans).

For a low‑volume, hobbyist Next.js project with limited appetite for DevOps, this is the most balanced and future‑proof choice.

***

You can now copy this into a `hosting-research-summary.md` file in your repo.

<div align="center">⁂</div>

[^1]: https://docs.railway.com/databases/postgresql

[^2]: https://docs.railway.com/databases

[^3]: https://docs.railway.com/reference/pricing/plans

[^4]: https://railway.com/pricing

[^5]: https://hackceleration.com/supabase-review/

[^6]: https://uibakery.io/blog/supabase-pricing

[^7]: https://freetier.co/directory/products/supabase

[^8]: https://dev.to/joodi/free-nextjs-hosting-providers-in-2025-pros-and-cons-2a0e

[^9]: https://www.thisdot.co/blog/keeping-costs-in-check-when-hosting-next-js-on-vercel

[^10]: https://freerdps.com/blog/is-vercel-hosting-free/

[^11]: https://www.koyeb.com/blog/top-postgresql-database-free-tiers-in-2026

[^12]: https://aws.amazon.com/amplify/pricing/

[^13]: https://aws.amazon.com/pm/amplify/

[^14]: https://uibakery.io/blog/railway-vs-supabase

[^15]: https://getdeploying.com/railway-vs-supabase

[^16]: https://docs.railway.com/volumes/backups

[^17]: https://seenode.com/blog/top-managed-postgresql-services-compared/

[^18]: https://docs.amplify.aws/gen1/nextjs/start/project-setup/prerequisites/

[^19]: https://docs.railway.app/guides/databases

