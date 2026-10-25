## Purpose

Define authentication session state, Supabase client boundaries, timeout behavior, and logout behavior.

## Requirements

### Requirement: Session state tracking
The system SHALL maintain a cookie-backed authentication session usable by both browser and server. The server SHALL verify identity independently before protected work and SHALL NOT accept the browser's reported identity as proof of authentication.

#### Scenario: Session created on signin
- **WHEN** a user successfully signs in
- **THEN** a session is established that subsequent browser and server requests can use
- **AND** credentials SHALL NOT appear in URLs, application diagnostics, or serialized page data

#### Scenario: Session available to server actions
- **WHEN** a protected server action executes
- **THEN** it SHALL verify the request's session and derive the actor's user ID independently of action arguments

#### Scenario: Session available to client components
- **WHEN** client components display signed-in user information or read history
- **THEN** they SHALL use the same account's session as server requests

### Requirement: Session timeout
The system SHALL expire sessions after 14 days of inactivity.

#### Scenario: Session expires after 14 days
- **WHEN** 14 days pass since the user's last activity
- **THEN** session is invalidated and user is logged out on next request

#### Scenario: Activity extends session
- **WHEN** user is actively using the app
- **THEN** session timeout is refreshed with each request (sliding window)

### Requirement: Logout functionality
The system SHALL let users sign out, clear the current browser's usable session state, and return to `/signin`. Subsequent requests from that signed-out browser SHALL require authentication again. The system SHALL NOT promise immediate invalidation of previously copied access tokens beyond the authentication provider's documented revocation behavior.

#### Scenario: User signs out
- **WHEN** the user clicks Sign out
- **THEN** the current browser's session cookies and obsolete application auth storage SHALL be cleared
- **AND** the user SHALL be redirected to `/signin`
- **AND** protected page requests and actions without fresh authentication SHALL fail

### Requirement: Separate authenticated and privileged Supabase access
The system SHALL separate browser, request-scoped authenticated server, and necessary privileged server access. Routine server database operations SHALL obey the authenticated user's row-level policies. Privileged credentials SHALL remain unavailable to browser modules and SHALL NOT be the default for user operations.

#### Scenario: Server request respects user isolation
- **WHEN** a server operation accesses journals or memories
- **THEN** its ordinary database access SHALL run under the verified user's session and RLS

#### Scenario: Client instance respects RLS
- **WHEN** the browser fetches data using the public Supabase key and its session
- **THEN** only data authorized by RLS SHALL be returned

#### Scenario: User ID auto-populated in saves
- **WHEN** a server action saves a new analysis
- **THEN** its owner SHALL be the server-verified user and SHALL NOT be overridden by the request body

#### Scenario: Concurrent users make requests
- **WHEN** separate accounts access the server concurrently
- **THEN** authenticated clients, credentials, and cached authorization state SHALL NOT be reused across accounts

### Requirement: Refresh sessions without sharing private responses
The system SHALL coordinate session refresh between browser and server, preserve refreshed cookies on responses and redirects, and prevent shared caching of authenticated content or responses that set session cookies.

#### Scenario: Access credential expires while refresh remains valid
- **WHEN** a request can legitimately refresh its session
- **THEN** subsequent browser and server requests SHALL use the refreshed session without a redirect loop

#### Scenario: Refresh is invalid
- **WHEN** the session cannot be refreshed
- **THEN** the application SHALL require sign-in without granting access from stale browser state

#### Scenario: Two accounts request the same page
- **WHEN** accounts A and B request a protected page or session-refresh response
- **THEN** B SHALL NOT receive A's content or session cookies through shared caching

### Requirement: Permit reauthentication during the cookie-session rollout
The system SHALL preserve existing accounts and stored data during rollout, but SHALL NOT require seamless conversion of old local-storage sessions.

#### Scenario: Existing user has only an old browser session
- **WHEN** that user opens the updated application without a valid cookie session
- **THEN** the application SHALL request sign-in again
- **AND** successful sign-in SHALL restore access to the same account's existing data and role
