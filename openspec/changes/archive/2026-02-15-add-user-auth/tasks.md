## 1. Database Schema Preparation

- [x] 1.1 Create migration file: `supabase/migrations/{timestamp}_add_user_id_and_rls.sql`
- [x] 1.2 Add `user_id` UUID column to `analyses` table with NOT NULL constraint
- [x] 1.3 Delete all existing analyses from the table (breaking change, ~20 records)
- [x] 1.4 Create SELECT RLS policy: `WHERE analyses.user_id = auth.uid()`
- [x] 1.5 Create INSERT RLS policy: `ONLY for (user_id = auth.uid())`
- [x] 1.6 Create UPDATE RLS policy: `WHERE analyses.user_id = auth.uid()`
- [x] 1.7 Create DELETE RLS policy: `WHERE analyses.user_id = auth.uid()`
- [x] 1.8 Enable RLS on `analyses` table
- [x] 1.9 Test migration locally: Applied via Supabase dashboard SQL editor, verified working

## 2. Supabase Auth Configuration

- [x] 2.1 Enable Supabase Auth in project settings
- [x] 2.2 Configure email provider (confirm email functionality enabled)
- [x] 2.3 Create auth redirect URLs: `http://localhost:3000/app` for local testing
- [x] 2.4 Note: Email confirmation is optional for MVP (see TechnicalDebt.md for future enforcement)

## 3. Supabase Client Infrastructure

- [x] 3.1 Update `lib/supabase.ts` to export separate server and client instances
- [x] 3.2 Create server instance with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- [x] 3.3 Create client instance with `NEXT_PUBLIC_SUPABASE_ANON_KEY` (respects RLS)
- [x] 3.4 Add helper function to read current user session on server
- [x] 3.5 Add helper function to read current user session on client

## 4. Auth Pages & Components

- [x] 4.1 Create route group: `/app/(auth)/` directory structure
- [x] 4.2 Create `/app/(auth)/signup/page.tsx` with email/password signup form
- [x] 4.3 Add signup form validation (email format, password length ≥8 chars)
- [x] 4.4 Add error handling for duplicate email, weak password
- [x] 4.5 Create `/app/(auth)/signin/page.tsx` with email/password signin form
- [x] 4.6 Add signin form validation and error handling
- [x] 4.7 Create reusable auth error component for consistent UX
- [x] 4.8 Add redirect to app home after successful signin

## 5. Route Protection (Client-Side)

Note: Server-side middleware was removed — Supabase JS stores tokens in localStorage, not cookies, making server-side checks impossible without `@supabase/ssr`. See TechnicalDebt.md. Client-side protection via AuthSessionProvider is used instead.

- [x] 5.1 Create AuthSessionProvider for client-side route protection (replaces middleware)
- [x] 5.2 AuthSessionProvider: Check for valid session on mount
- [x] 5.3 AuthSessionProvider: Redirect unauthenticated users to `/signin`
- [x] 5.4 AuthSessionProvider: Allow unauthenticated access to `/signup` and `/signin`
- [x] 5.5 AuthSessionProvider: Allow unauthenticated access to public assets
- [x] 5.6 Update `/app/app/layout.tsx` to wrap with AuthSessionProvider
- [x] 5.7 AuthSessionProvider: Redirect to `/signin` if no session found
- [x] 5.8 AppHeader: Display user email in header with sign out button

## 6. Auth State Management

- [x] 6.1 Create auth context or hook to track user session state globally
- [x] 6.2 Add auth state listener to sync session on app load
- [x] 6.3 Add logout functionality: Sign out button in nav/header
- [x] 6.4 Add session expiry handling: Redirect to signin if session expires
- [x] 6.5 Auth state persists across page refreshes (verified via testing)

## 7. Server Actions Updates

Note: Server actions use Option B — userId passed from client session rather than server-side verification. See TechnicalDebt.md for security tradeoff documentation.

- [x] 7.1 Update `analyzeText()` server action to accept userId parameter
- [x] 7.2 Update `generateImages()` server action to accept userId parameter
- [x] 7.3 Update `saveAnalysis()` server action to accept userId parameter
- [x] 7.4 Add userId validation in all server actions (fail if no userId)
- [x] 7.5 Pass userId from client useAuth() hook to all server action calls in page.tsx
- [x] 7.6 `listAnalyses()` already uses anon client (getBrowserSupabase) — RLS filters per user automatically

## 8. History & UI Updates

- [x] 8.1 HistorySidebar already fetches via anon client (getBrowserSupabase) — RLS filters per user
- [x] 8.2 History sidebar shows only current user's analyses (verified with two accounts)
- [x] 8.3 Image URL generation works with user-scoped paths (no path changes needed)
- [x] 8.4 "New Analysis" button already clears history context (handleNewAnalysis in page.tsx)

## 9. Testing & Verification

- [x] 9.1 Manual test: Signup new user with valid email and password
- [x] 9.2 Manual test: Signin immediately (without email confirmation) — confirmed working
- [x] 9.3 Manual test: Create analysis, verify in history sidebar
- [x] 9.4 Manual test: Signup second user in separate browser (Brave)
- [x] 9.5 Manual test: Second user cannot see first user's analyses — confirmed
- [x] 9.6 Manual test: Data isolation verified (two accounts tested side by side)
- [x] 9.7 Manual test: Logout and redirect to signin works
- [x] 9.8 Manual test: Unauthenticated access redirects to /signin (via AuthSessionProvider)
- [x] 9.9 Manual test: /signup and /signin accessible without authentication

## 10. Pre-Auth Data Cleanup

- [x] 10.1 All pre-auth analyses deleted during migration (DELETE FROM analyses in migration SQL)
- [x] 10.2 Breaking change documented in migration file and TechnicalDebt.md
- [x] 10.3 New users start with empty history (verified with test accounts)

## 11. Environment Variables & Deployment Prep

- [x] 11.1 Verify `.env.local` includes `NEXT_PUBLIC_SUPABASE_URL` (pre-existing, required)
- [x] 11.2 Verify `.env.local` includes `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pre-existing, required)
- [x] 11.3 Verify `.env.local` includes `SUPABASE_SERVICE_ROLE_KEY` (pre-existing, required)
- [x] 11.4 Auth environment variables documented in CLAUDE.md (no new env vars needed — auth uses existing Supabase keys)
- [x] 11.5 Railway deployment uses same env var structure (no changes needed)

## 12. Documentation & Technical Debt

- [x] 12.1 TechnicalDebt.md updated with: middleware removal, server-side session verification tradeoff (Option B), email confirmation, password reset, account deletion
- [x] 12.2 Email confirmation enforcement documented as v2 task in TechnicalDebt.md
- [x] 12.3 CLAUDE.md updated with auth workflow, directory structure, server action signatures, RLS status, auth flow documentation
- [x] 12.4 TechnicalDebt.md contains design references and links to relevant specs
