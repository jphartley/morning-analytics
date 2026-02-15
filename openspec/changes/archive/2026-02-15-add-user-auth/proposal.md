## Why

Morning Analytics is currently a shared demo with no user isolation—all analyses are visible to everyone. To make this production-ready and publicly available, we need to add user-based authentication and enforce data privacy. This enables us to offer a real service with personal, confidential analysis histories.

## What Changes

- Add email/password signup and signin flows (Supabase Auth)
- Require all users to authenticate before accessing the app
- Enforce data privacy via RLS (Row-Level Security) policies on the analyses table
- Add protected routes and middleware to redirect unauthenticated users to login
- Auto-save all analyses with the authenticated user's ID
- Archive or delete existing shared analyses (breaking change—all users start fresh)
- **BREAKING**: The app no longer allows anonymous/unauthenticated access

## Capabilities

### New Capabilities
- `user-auth`: Email/password signup and signin (Supabase Auth integration)
- `session-management`: Session handling, auth state tracking, client/server auth clients
- `protected-routing`: Next.js middleware and layout-level auth checks
- `data-privacy`: RLS policies to enforce each user only sees their own analyses

### Modified Capabilities
- `analysis-storage`: The `analyses` table now requires `user_id` field and enforces RLS policies for privacy

## Impact

**Code changes**:
- `/app/lib/supabase.ts` — Add separate server and client Supabase instances
- `/app/app/layout.tsx` — Session check in root layout
- `/middleware.ts` — Protect routes, redirect unauthenticated users
- `/app/(auth)/*` — New auth pages (signup, signin, email confirmation)
- `/app/app/actions.ts` — `saveAnalysis()` auto-sets `user_id` from session

**Database**:
- `analyses` table — Add `user_id` field (NOT NULL), enable RLS, add four policies (SELECT, INSERT, UPDATE, DELETE)

**API & Dependencies**:
- Supabase Auth already available (no new services needed)
- No new npm dependencies (using existing `@supabase/supabase-js`)

**Testing & Development**:
- Current: All testing done on localhost with Supabase backend for data storage and all layers
- Future: Deploy to Railway with same environment variables

**Environment Variables** (localhost & future Railway):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Supabase Configuration**:
- Enable auth, add email confirmation, configure RLS policies

**Existing data**:
- All ~20 pre-auth analyses will be deleted or archived (non-recoverable)
- Users start with empty history after signup
