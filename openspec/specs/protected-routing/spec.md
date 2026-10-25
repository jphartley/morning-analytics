## Purpose

Define route access rules that protect the main app while allowing public authentication pages.

## Requirements

### Requirement: Unauthenticated users redirected to signin
The system SHALL check authentication on the server before returning protected page content and SHALL redirect unauthenticated page requests to `/signin`.

#### Scenario: Unauthenticated user visits app
- **WHEN** a user without a valid session visits `/`
- **THEN** the server SHALL redirect to `/signin` before returning protected content

#### Scenario: Session expires during navigation
- **WHEN** a session expires and cannot be refreshed
- **THEN** the next protected page request SHALL redirect to sign-in
- **AND** protected actions SHALL reject the request independently of page routing

#### Scenario: Direct URL access without session
- **WHEN** an unauthenticated request directly targets a protected route without browser JavaScript
- **THEN** the server SHALL deny protected page content and redirect to `/signin`

### Requirement: Auth pages accessible without authentication
The system SHALL allow unauthenticated access to `/signup` and `/signin`, and SHALL redirect users with verified sessions from those pages to `/` without redirect loops.

#### Scenario: Unauthenticated user accesses signup
- **WHEN** a user without a session visits `/signup`
- **THEN** the signup page SHALL load

#### Scenario: Unauthenticated user accesses signin
- **WHEN** a user without a session visits `/signin`
- **THEN** the signin page SHALL load

#### Scenario: Authenticated user redirected away from auth pages
- **WHEN** a user with a verified session visits `/signin` or `/signup`
- **THEN** the server SHALL redirect to `/` while preserving any refreshed session cookies

### Requirement: Page protection does not substitute for action authorization
The system SHALL authorize protected actions even when a caller bypasses navigation and submits a request directly.

#### Scenario: Direct action request bypasses page checks
- **WHEN** an unauthenticated caller invokes a protected action directly
- **THEN** the action SHALL reject the request before protected side effects regardless of the page guard
