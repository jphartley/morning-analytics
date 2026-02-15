## ADDED Requirements

### Requirement: Session state tracking
The system SHALL track and maintain authentication session state on both client and server.

#### Scenario: Session created on signin
- **WHEN** user successfully signs in
- **THEN** a session is created containing user ID, email, and session token

#### Scenario: Session available to server actions
- **WHEN** a server action (analyzeText, generateImages, saveAnalysis) executes
- **THEN** server actions receive the authenticated userId as a parameter from the client's useAuth() hook

#### Scenario: Session available to client components
- **WHEN** client components need to display user information
- **THEN** user session is accessible via Supabase client and React context

### Requirement: Separate server and client Supabase instances
The system SHALL maintain two Supabase client instances: one for server-side operations (with service role key) and one for client-side operations (with anon key).

#### Scenario: Server instance has full access
- **WHEN** server actions execute with service role key
- **THEN** they can read/write all data regardless of RLS policies

#### Scenario: Client instance respects RLS
- **WHEN** client fetches data with anon key
- **THEN** only data authorized by RLS policies is returned

#### Scenario: User ID auto-populated in saves
- **WHEN** server action saveAnalysis() executes with a userId parameter
- **THEN** the user_id is set from the client-provided userId (sourced from the authenticated Supabase session via useAuth() hook)

Note: MVP uses client-provided userId (Option B) rather than server-side session verification. The client obtains userId from Supabase Auth JWT validation. See TechnicalDebt.md for the planned production upgrade to server-side verification via `@supabase/ssr`.

### Requirement: Session timeout
The system SHALL expire sessions after 14 days of inactivity.

#### Scenario: Session expires after 14 days
- **WHEN** 14 days pass since the user's last activity
- **THEN** session is invalidated and user is logged out on next request

#### Scenario: Activity extends session
- **WHEN** user is actively using the app
- **THEN** session timeout is refreshed with each request (sliding window)

### Requirement: Logout functionality
The system SHALL allow authenticated users to sign out and terminate their session.

#### Scenario: User signs out
- **WHEN** user clicks "Sign out" button
- **THEN** session is terminated, session token is cleared, and user is redirected to `/signin`
