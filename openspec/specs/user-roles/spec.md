# User roles Specification

## Purpose
Define the persisted user/admin role model used to select the appropriate Morning Analytics experience without granting administrators access to other users' journals.

## Requirements

### Requirement: Persist an application role for each authenticated account
The system SHALL maintain exactly one application profile for each authenticated account with a constrained role of `user` or `admin`. It SHALL create new profiles with the `user` role and SHALL backfill missing profiles for existing accounts as `user` without overwriting an existing role.

#### Scenario: New account receives the normal-user role
- **WHEN** an account is created through the existing signup flow
- **THEN** the account receives a persisted `user` role before it uses the main application

#### Scenario: Existing account has no profile during migration
- **WHEN** the role schema is introduced for an existing authenticated account
- **THEN** the account SHALL receive the `user` role until an operator promotes it

#### Scenario: Existing account already has a profile during migration
- **WHEN** the role migration encounters an authenticated account with an existing valid profile
- **THEN** the migration SHALL retain the existing role
- **AND** it SHALL not create a duplicate profile

#### Scenario: Authenticated user reads their role
- **WHEN** an authenticated browser requests its own application profile
- **THEN** row-level access SHALL permit the account to read its own role
- **AND** it SHALL not permit the account to read another user's profile through that policy

#### Scenario: Browser attempts to change a role
- **WHEN** an authenticated browser attempts to insert, update, or delete its application role
- **THEN** the database policy SHALL reject the mutation
- **AND** role changes SHALL remain restricted to the authorized operator procedure

### Requirement: Resolve role before restoring capability-sensitive preferences
The system SHALL resolve the signed-in account's profile role before restoring Test/Debug, model, provider, or memory-related browser preferences. Missing, unreadable, or invalid role data SHALL fail closed to the normal-user capability set and SHALL never expose administrator controls by default.

#### Scenario: Valid role loads after session restoration
- **WHEN** the browser restores an authenticated session
- **THEN** the application SHALL keep capability-sensitive UI in a loading state until the account profile has been resolved
- **AND** it SHALL restore preferences only after applying the resolved role's capabilities

#### Scenario: Profile lookup fails
- **WHEN** the application cannot load the signed-in account's profile
- **THEN** it SHALL expose only the normal-user capability set
- **AND** it SHALL present a recoverable role-loading error
- **AND** it SHALL not restore Test/Debug or other administrator-only controls

#### Scenario: Profile contains an invalid role
- **WHEN** the application receives a role value other than `user` or `admin`
- **THEN** it SHALL treat the role as `user` for capability resolution
- **AND** it SHALL not expose administrator-only controls

### Requirement: Role determines product capabilities, not journal ownership
The system SHALL use the persisted role to choose product controls without broadening journal-data ownership. Through supported application navigation and authenticated row-level data access, both roles SHALL remain limited to their own analyses, images, memories, and evidence; the `admin` role SHALL grant experimentation capabilities rather than cross-user content access.

#### Scenario: Administrator uses the application
- **WHEN** an administrator signs in
- **THEN** the administrator SHALL receive administrator-only experimentation controls for their own account
- **AND** the administrator SHALL NOT receive an application view of another user's journal data

#### Scenario: Normal user uses the application
- **WHEN** a user-role account signs in
- **THEN** the account SHALL receive only normal-user controls and its own journal data

#### Scenario: Administrator requests journal data through the application
- **WHEN** an administrator loads history, analyses, images, memories, or evidence through the supported application flow
- **THEN** the system SHALL return only records owned by that administrator
- **AND** it SHALL not provide an administrator user-browser, journal-browser, or cross-user search surface

#### Scenario: Role is promoted from user to admin
- **WHEN** an authorized operator promotes an account to `admin`
- **THEN** the account SHALL gain administrator experimentation capabilities
- **AND** the promotion SHALL not broaden the account's journal-data ownership policies

### Requirement: First-release role assignment is operator managed
The system SHALL not provide in-app role promotion or revocation in this release.

#### Scenario: Owner needs to promote a friend
- **WHEN** the owner identifies an account that should be an administrator
- **THEN** the account role SHALL be changed through an authorized Supabase operational procedure
- **AND** the account email SHALL NOT be committed to application source or OpenSpec artifacts

#### Scenario: Promotion list is not yet available
- **WHEN** this change is implemented before the owner supplies the administrator email addresses
- **THEN** the implementation SHALL ship without a committed email allowlist
- **AND** accounts SHALL remain `user` until individually promoted by the authorized operator procedure

### Requirement: Treat the first-release role as a product boundary
For the trusted-friends release, the system SHALL use the browser-resolved database role as a product and UI capability boundary. This change SHALL NOT claim to add server-verified session identity, server-enforced role authorization, `@supabase/ssr`, middleware authorization, or tamper-proof protection against crafted direct requests; those controls SHALL remain scoped to the documented follow-up security-hardening change.

#### Scenario: Normal user does not receive administrator UI
- **WHEN** a user-role account uses the supported application interface
- **THEN** the client SHALL not render or submit administrator-only experimental controls and selections
- **AND** documentation SHALL describe this as UI capability restriction rather than server authorization

#### Scenario: User crafts a direct request
- **WHEN** a person bypasses the supported interface and manually crafts a request to an existing server action
- **THEN** this change SHALL rely on the existing server feature gates and data-access behavior
- **AND** it SHALL not represent the client-derived role as proof that the server rejected the request based on role

#### Scenario: Server-role hardening is planned
- **WHEN** the trusted trial is expanded or stronger authorization is required
- **THEN** a separate change SHALL replace browser-supplied identity and role assumptions with server-verified session context and server-enforced capability checks

### Requirement: Recognize privileged Supabase access as an operational trust boundary
Application roles and user-facing row-level policies SHALL not be represented as protection from people or systems holding privileged Supabase project, database-owner, or service-role access. Such access is an operationally trusted capability outside the Morning Analytics `user` and `admin` product roles.

#### Scenario: Application administrator lacks Supabase operator access
- **WHEN** an application administrator uses only the Morning Analytics interface and ordinary authenticated database access
- **THEN** the administrator SHALL remain limited to their own journal data

#### Scenario: Privileged Supabase operator accesses data
- **WHEN** a trusted operator uses Supabase project, database-owner, or service-role privileges
- **THEN** that operator MAY access data beyond application row-level restrictions
- **AND** the application SHALL document this as an operational privacy and credential-management boundary
