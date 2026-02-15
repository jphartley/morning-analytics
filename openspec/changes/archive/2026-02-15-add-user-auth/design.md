## Context

Morning Analytics is currently a shared demo application where all users see each other's analyses. There is no authentication layer, no user isolation, and the app was never designed for multi-user data privacy. To launch this as a production service, we need:

- User authentication (signup/signin with email/password)
- Data isolation (each user only sees their own analyses)
- Access control (unauthenticated users cannot access the app)
- Compliance with privacy expectations (personal journaling data)

Current state: All data is stored in a single `analyses` table with no `user_id` field. All analyses are visible to all clients via the anon Supabase client. There is no authentication middleware or protected routes.

## Goals / Non-Goals

**Goals:**
- Require email/password authentication before accessing the application
- Isolate analysis data per user (RLS policies enforce read/write permissions)
- Support user signup, signin, and session management
- Maintain existing analysis and image generation workflows with user context
- Enable future deployment to Railway or other cloud platforms

**Non-Goals:**
- Social login (OAuth, Google, GitHub)—email/password only for MVP
- Multi-factor authentication (2FA, phone verification)
- Team collaboration or shared analyses
- Federated authentication (SAML, OIDC)
- Admin user roles or permissions beyond basic auth

## Decisions

### 1. Use Supabase Auth for Authentication
**Decision**: Leverage Supabase Auth (built into the project) instead of a separate auth service.

**Rationale**:
- Already available; no additional cost or setup
- Integrates seamlessly with Supabase's RLS system
- Provides JWT tokens and session management out of the box
- Supports email/password flows natively

**Alternatives considered**:
- Roll-in-house auth → Complexity, security risk, reinventing the wheel
- Auth0, Firebase Auth → Additional cost and external dependency
- JWT with custom backend → Requires building auth infrastructure from scratch

### 2. Separate Server & Client Supabase Instances
**Decision**: Maintain two Supabase client instances: one with service role key (server, bypasses RLS) and one with anon key (client, respects RLS).

**Rationale**:
- Server actions (analyze, save) use service role to write/read all data
- Client-side reads (history sidebar, image URLs) use anon client with RLS
- RLS policies ensure anon client can only see user's own data
- Follows Supabase architecture best practices

**Why service role for writes?**
- `saveAnalysis()` happens server-side; auto-populating `user_id` from session requires trusted context
- If we used anon client + RLS for writes, we'd need an `INSERT` policy that sets `user_id = auth.uid()` automatically (Supabase supports this, but service role is simpler and more explicit)

### 3. Session Management via Next.js Layout
**Decision**: Check auth session in root layout (`/app/app/layout.tsx`) and redirect unauthenticated users.

**Rationale**:
- Root layout runs on every page load (client + server side)
- Supabase client can check `session()` synchronously after app loads
- Redirect to `/auth/signin` if no session exists
- Simple, centralized auth check

**Alternative considered**:
- Middleware-only auth → Middleware runs before layout, but layout is cleaner for redirect logic

### 4. Route Protection with Client-Side AuthSessionProvider
**Decision**: Use a client-side `AuthSessionProvider` React context to check session state and redirect unauthenticated users to `/signin`.

**Rationale**:
- Supabase JS client stores auth tokens in browser localStorage (not cookies)
- Next.js middleware runs server-side and cannot access localStorage
- Without `@supabase/ssr` (cookie-based sessions), server-side middleware cannot verify auth state
- Client-side AuthSessionProvider checks session on mount and listens for auth state changes

**Original plan**: Server-side middleware was initially implemented but removed after discovering the localStorage limitation. See TechnicalDebt.md for the planned production upgrade using `@supabase/ssr` with cookie-based sessions.

**Trade-off**: Brief flash of loading spinner while client checks session (vs instant server-side redirect with middleware). Acceptable for MVP.

### 5. New Auth Route Group: `/(auth)/*`
**Decision**: Create a new route group for signup/signin pages that don't require authentication.

**Rationale**:
- Route groups with parentheses `(auth)` don't appear in URL paths
- URLs will be `/signup` and `/signin` (not `/auth/signup`)
- Keeps auth pages separate from main app routes
- Auth pages bypass the root layout's session check (only authenticated users enter the app)

### 6. RLS Policies for Data Isolation
**Decision**: Add four RLS policies to the `analyses` table:
- **SELECT**: User can only read their own analyses
- **INSERT**: User can only insert analyses with their own `user_id`
- **UPDATE**: User can only update their own analyses
- **DELETE**: User can only delete their own analyses

**Rationale**:
- Enforces privacy at the database layer (cannot be bypassed from client code)
- Server actions can write with service role (trusted context)
- Client-side reads enforce permission checks automatically
- Follows principle of least privilege

**Policy structure**:
```sql
SELECT: WHERE analyses.user_id = auth.uid()
INSERT: ONLY for (user_id = auth.uid())
UPDATE: WHERE analyses.user_id = auth.uid()
DELETE: WHERE analyses.user_id = auth.uid()
```

### 7. Pass userId from Client Session to Server Actions (Option B)
**Decision**: Server actions receive `userId` as a parameter from the client's `useAuth()` hook, rather than independently verifying the session server-side.

**Rationale**:
- Supabase JS stores auth tokens in localStorage, not cookies
- Server actions cannot access browser localStorage to verify sessions independently
- The client obtains `userId` from Supabase Auth's JWT-validated session (secure on the client side)
- All reads are still protected by RLS at the database level regardless

**Trade-off**: A sophisticated attacker with an account could theoretically modify client JavaScript to pass a different userId to write operations (specifically `saveAnalysis`). However, they cannot read, modify, or delete existing data (RLS protects those). The "reward" is limited to inserting junk into another user's history. See TechnicalDebt.md for detailed security analysis.

**Production fix**: Implement `@supabase/ssr` with cookie-based sessions so server actions can independently verify `auth.uid()` from HTTP-only cookies.

### 8. Data Migration: Delete Pre-Auth Analyses
**Decision**: Delete all existing analyses before launching authentication.

**Rationale**:
- Existing data has no `user_id` (schema change required)
- ~20 pre-auth analyses are test/demo data, not valuable
- Data loss is acceptable; this is a breaking change clearly communicated
- Simplifies migration (no need to backfill user IDs)

**Timing**: Delete during database migration, before app deploys to production.

### 9. User Signup Flow
**Decision**: Email/password signup → Confirmation email → Auto-signin → Empty history.

**Rationale**:
- Supabase Auth sends confirmation email automatically (config-based)
- On successful confirmation, user is auto-logged in
- New users start with empty analysis history
- Follows common SaaS signup patterns

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Data loss**: Existing 20 analyses deleted | This is a known, documented breaking change. No recovery needed for demo data. |
| **Email confirmation delay**: User must click confirmation link | Acceptable for MVP; if needed, can configure Supabase to auto-confirm (less secure). |
| **Session cookie security**: JWT stored in browser | Supabase handles secure token storage; uses HttpOnly cookies if available. |
| **RLS policy errors**: Misconfigured policies could expose/hide data | Covered by tests; run through spec/design before implementation. |
| **Auth state sync**: Client and server auth states briefly out of sync | Rare; handled by page refresh or session listener. |
| **User deletes account mid-analysis**: Session ends, orphans in-flight requests | Acceptable edge case; user sees error, can re-auth and retry. |

## Migration Plan

### Phase 1: Database Schema (Before Auth Code)
1. Create migration: Add `user_id` UUID column to `analyses` table
2. Set `user_id NOT NULL` constraint
3. Delete all existing analyses (no data to backfill)
4. Create RLS policies (4 total: SELECT, INSERT, UPDATE, DELETE)
5. Enable RLS on `analyses` table
6. Run migration locally first, then push to Supabase

### Phase 2: Code Implementation
1. Update `lib/supabase.ts`: Create separate server/client auth clients
2. Create `/app/(auth)/signup/page.tsx` and `/app/(auth)/signin/page.tsx`
3. Create `AuthSessionProvider` for client-side route protection (middleware removed — see Decision #4)
4. Update `/app/app/layout.tsx` to wrap with AuthSessionProvider
5. Modify `app/app/actions.ts` → all server actions accept `userId` parameter (see Decision #7)
6. Update `page.tsx` to pass `user.id` from `useAuth()` to server actions
7. Test locally: signup, signin, verify analyses are isolated per user

### Phase 3: Testing
1. Manual: Signup user A, create analysis, verify in sidebar
2. Manual: Signup user B in incognito window, verify cannot see user A's data
3. Manual: Try direct Supabase query with user B's session, verify RLS blocks user A's data
4. Integration tests (if available)

### Phase 4: Deployment to Railway (Future)
1. Set environment variables in Railway (same as localhost)
2. Deploy app
3. Run database migration via Railway
4. Verify signup/signin workflow
5. Monitor logs for auth errors

### Rollback Strategy
- If critical issues discovered post-deploy:
  1. Disable RLS policies (allows any user to see all data)
  2. Roll back `user_id` column (drop constraint, allow NULL, set all existing to system default)
  3. Revert app code (removes auth checks)
  4. Issue security notice if user data was exposed

## Implementation Notes

1. **Email confirmation timing**: For MVP testing purposes, allow signin before email confirmation. This lets us quickly test different personas with dummy accounts. Email confirmation enforcement will be addressed in future versions (see TechnicalDebt.md).

2. **Session timeout**: Sessions expire after 14 days of inactivity. This balances security with user convenience.

3. **Deferred features**: Password reset, account deletion, and analytics/monitoring are tracked as technical debt for v2 (see TechnicalDebt.md at project root).
