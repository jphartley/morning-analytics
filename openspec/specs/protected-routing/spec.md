## ADDED Requirements

### Requirement: Unauthenticated users redirected to signin
The system SHALL prevent unauthenticated users from accessing the main app and redirect them to the signin page.

#### Scenario: Unauthenticated user visits app
- **WHEN** user without a valid session visits `/`
- **THEN** user is redirected to `/signin`

#### Scenario: Session expires during navigation
- **WHEN** user's session expires while navigating within the app
- **THEN** user is redirected to `/signin` on next page load or action

#### Scenario: Direct URL access without session
- **WHEN** unauthenticated user attempts to access `/` or other protected routes
- **THEN** AuthSessionProvider detects missing session and redirects to `/signin`

### Requirement: Auth pages accessible without authentication
The system SHALL allow unauthenticated users to access signup and signin pages without requiring a session.

#### Scenario: Unauthenticated user accesses signup
- **WHEN** user without session visits `/signup`
- **THEN** signup page loads successfully

#### Scenario: Unauthenticated user accesses signin
- **WHEN** user without session visits `/signin`
- **THEN** signin page loads successfully

#### Scenario: Authenticated user redirected away from auth pages
- **WHEN** authenticated user visits `/signin` or `/signup`
- **THEN** user is redirected to `/` (main app) via onAuthStateChange SIGNED_IN event

### Requirement: Client-side route protection via AuthSessionProvider
The system SHALL use a client-side AuthSessionProvider context to check session state and protect routes.

Note: Server-side middleware was evaluated but removed because Supabase JS stores auth tokens in localStorage (not cookies), making server-side cookie checks impossible without `@supabase/ssr`. See TechnicalDebt.md for the planned production upgrade.

#### Scenario: AuthSessionProvider checks session on mount
- **WHEN** any page in the app loads
- **THEN** AuthSessionProvider checks for valid session before rendering content

#### Scenario: AuthSessionProvider redirects unauthenticated users
- **WHEN** AuthSessionProvider detects missing session on a protected path
- **THEN** user is redirected to `/signin`

#### Scenario: AuthSessionProvider allows public path access
- **WHEN** unauthenticated request targets `/signin` or `/signup`
- **THEN** AuthSessionProvider allows the page to render without redirect

#### Scenario: Auth state listener handles sign-in/sign-out events
- **WHEN** auth state changes (SIGNED_IN or SIGNED_OUT)
- **THEN** AuthSessionProvider updates user state and redirects accordingly
