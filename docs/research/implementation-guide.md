<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# next .md file

Here is the full content of `implementation-guide.md`:

***

# Implementation Guide: Railway + Supabase Setup

**Target:** Next.js app with Postgres database and authentication
**Stack:** Railway (hosting) + Supabase (database + auth)
**Developer:** Claude Code assisted development

***

## Overview

This guide provides step-by-step instructions and configuration files for deploying a Next.js application using Railway for hosting and Supabase for database and authentication.

***

## Prerequisites

- Node.js and npm installed locally
- Git repository for your Next.js project
- GitHub account (for Railway deployment)
- Railway account with free Hobby year activated[^1][^2]
- Supabase account (free tier)[^3][^4][^5]

***

## Phase 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to `https://supabase.com/dashboard`.
2. Click “New Project”.
3. Choose organization.
4. Set project details:
    - Name: `your-project-name`
    - Database Password: Generate strong password (save this).
    - Region: Choose closest to Amsterdam (e.g., Frankfurt or London).
    - Pricing Plan: Free (includes 500 MB DB, 50,000 MAUs).[^4][^5]

### Step 2: Get Database Connection String

1. In Supabase dashboard, go to **Settings → Database**.
2. Find “Connection string” section.
3. Copy the **URI** format (not individual parameters).
4. Replace `[YOUR-PASSWORD]` with your actual database password.
5. Save this as `DATABASE_URL` – used by your app.

Format:

```text
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```


### Step 3: Configure Authentication

1. In Supabase dashboard, go to **Authentication → Providers**.
2. Enable the auth methods you want:
    - Email/password (recommended for MVP).
    - Optional: Google, GitHub, etc.
3. For each OAuth provider:
    - Create an app in the provider’s developer console.
    - Add client ID/secret in Supabase.
    - Configure redirect URLs pointing to your app.

### Step 4: Set Up Local Development (Optional but Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Start local Supabase (runs in Docker)
supabase start

# This gives you a local DATABASE_URL for development
```


***

## Phase 2: Next.js Application Setup

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```


### Step 2: Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```


### Step 3: Set Up Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# API Keys (for AI services)
GEMINI_API_KEY=your-gemini-key
DISCORD_BOT_TOKEN=your-discord-token
```

To find keys:

- Supabase dashboard → **Settings → API**:
    - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
    - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`[^6][^4]


### Step 4: Example Auth Components

`components/SignUp.tsx`:

```typescript
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for confirmation link!')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

`middleware.ts` for protecting routes:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```


***

## Phase 3: Railway Setup

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli

# Login to Railway
railway login
```


### Step 2: Initialize Railway Project

```bash
# From your project directory
railway init
# Choose “Empty Project” or link existing project
# Name your project
```


### Step 3: Link GitHub Repository (Recommended)

**Option A – via Dashboard:**

1. Go to `https://railway.app/dashboard`.
2. “New Project” → “Deploy from GitHub repo”.
3. Authorize GitHub.
4. Select your Next.js repo.
5. Railway auto-detects Next.js and builds it.[^2][^1]

**Option B – via CLI:**

```bash
railway link
railway up
```


### Step 4: Configure Environment Variables in Railway

In Railway dashboard:

1. Open your project → service.
2. Go to **Variables**.
3. Add:
```text
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
GEMINI_API_KEY=your-gemini-key
DISCORD_BOT_TOKEN=your-discord-token
NODE_ENV=production
```

Or via CLI:

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
railway variables set DATABASE_URL="postgresql://postgres:[PASSWORD]@..."
```


### Step 5: Railway Config File

`railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Or `railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
healthcheckPath = "/"
healthcheckTimeout = 100
```


***

## Phase 4: Database Schema Setup

### Option A: Supabase Dashboard

1. Supabase → **SQL Editor**.
2. Example `profiles` table:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```


### Option B: Supabase Migrations

Create `supabase/migrations/20260213000000_initial_schema.sql`:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

Apply:

```bash
# Local
supabase db push

# Production
supabase db push --db-url postgresql://postgres:[PASSWORD]@...
```


***

## Phase 5: Deployment Workflow

### Local Development

```bash
# Optional: local Supabase
supabase start

# Next.js dev
npm run dev
```


### Deploy to Production

```bash
# If GitHub is connected
git add .
git commit -m "Deploy"
git push origin main
# Railway auto-deploys

# Or manual
railway up
```

Get URL:

```bash
railway open
```


***

## Phase 6: Testing Checklist

- Local `npm run dev` works.
- Can sign up and sign in using Supabase auth.
- Protected routes redirect correctly.
- Gemini and Discord API calls work.
- Railway deploy completes successfully.
- Production app reachable at Railway URL.
- Environment variables correctly set in Railway.
- DB queries work in production.

***

## Common Issues \& Fixes

- **Invalid API key in prod**
Check Railway env vars; ensure no extra quotes.
- **CORS errors from Supabase**
Add Railway domain to Supabase allowed URLs (Authentication → URL Configuration).[^6]
- **DB connection fails**
Verify `DATABASE_URL`; consider using pooled URL:
`postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres`.[^7]
- **Build fails on Railway**
Ensure `package.json` has `build` and `start` scripts; check logs.
- **Env vars not loading**
Use `NEXT_PUBLIC_` for client vars; restart service after changes.

***

## Monitoring \& Maintenance

- **Railway:** dashboard metrics, logs, usage vs credit.[^1][^2]
- **Supabase:** DB size, MAUs, API usage via dashboard.[^5][^4]
- Export SQL backups if you want extra safety.

***

## Backup Strategy

Supabase (managed Postgres):

- Free tier includes basic backups and 7‑day inactivity pause behavior; projects can be resumed from the dashboard.[^8][^4]
- Paid plans add more robust backup/restore and retention.[^5][^7]

Manual backups:

```bash
supabase db dump --schema-only > schema.sql
supabase db dump --data-only > data.sql
```


***

## Scaling Path

Upgrade Supabase Pro (\$25/month) when:

- DB exceeds 500 MB, or
- You need more performance / point‑in‑time recovery.[^4][^5]

Upgrade Railway plan when:

- Free Hobby credit no longer covers your monthly usage.[^2][^1]

***

## Security Best Practices

- Never commit `.env.local`.
- Use different secrets for dev and prod.
- Enable RLS on all custom tables in Supabase.
- Do not expose `service_role` key on the client.

***

## After Deployment

- Optional: add custom domain via Railway (automatic HTTPS).
- Consider basic monitoring (Sentry, UptimeRobot).
- Use Supabase migrations for schema changes.
- Add CI (GitHub Actions) if you want tests before deploy.

***

## Summary

This guide implements the agreed architecture:

- Railway for **Next.js hosting**.
- Supabase for **managed Postgres + auth**.
- Zero cost at your expected scale.
- Minimal DevOps, clean upgrade/migration paths.

You can paste this into `implementation-guide.md` in your repo.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^9]</span>

<div align="center">⁂</div>

[^1]: https://railway.com/pricing

[^2]: https://docs.railway.com/reference/pricing/plans

[^3]: https://supabase.com/pricing

[^4]: https://uibakery.io/blog/supabase-pricing

[^5]: https://checkthat.ai/brands/supabase/pricing

[^6]: https://hackceleration.com/supabase-review/

[^7]: https://supabase.com/docs/guides/platform/billing-on-supabase

[^8]: https://www.supadex.app/blog/supabase-pricing-what-you-really-need-to-know

[^9]: https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance

[^10]: https://www.iamexpat.nl/expat-info/dutch-news/train-tickets-netherlands-cost-65-percent-more-2026

[^11]: https://makerkit.dev/blog/tutorials/best-hosting-nextjs

[^12]: https://www.timeout.com/uk/news/rail-fares-in-england-will-be-frozen-in-2026-112425

[^13]: https://vercel.com/docs/frameworks/full-stack/nextjs

[^14]: https://www.withorb.com/blog/supabase-pricing

[^15]: https://www.dutchnews.nl/2025/11/dutch-train-journeys-to-rise-in-price-by-6-5-next-year/

[^16]: https://www.reddit.com/r/nextjs/comments/17j4kaq/so_really_what_features_are_not_supported_or_very/

