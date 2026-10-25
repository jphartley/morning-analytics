## Purpose

Define privacy isolation for stored analyses using Supabase Row-Level Security and trusted server actions.

## Requirements

### Requirement: Row-Level Security (RLS) policies on analyses table
The system SHALL enforce data privacy using Supabase RLS policies so each user can only access their own analyses.

#### Scenario: RLS SELECT policy enforces isolation
- **WHEN** user queries the `analyses` table with anon client
- **THEN** only rows where `user_id = auth.uid()` are returned

#### Scenario: RLS INSERT policy prevents cross-user writes
- **WHEN** user attempts to INSERT an analysis with a different user_id
- **THEN** INSERT fails (policy only allows `user_id = auth.uid()`)

#### Scenario: RLS UPDATE policy prevents cross-user updates
- **WHEN** user attempts to UPDATE an analysis belonging to another user
- **THEN** UPDATE fails (policy enforces `user_id = auth.uid()`)

#### Scenario: RLS DELETE policy prevents cross-user deletes
- **WHEN** user attempts to DELETE an analysis belonging to another user
- **THEN** DELETE fails (policy enforces `user_id = auth.uid()`)

### Requirement: User can only view their own analyses
The system SHALL ensure users can only retrieve their own analysis history, not other users' data.

#### Scenario: History sidebar shows only user's analyses
- **WHEN** user views history sidebar
- **THEN** only their own analyses are displayed

#### Scenario: Direct query for other user's data fails
- **WHEN** user attempts to fetch analysis by ID belonging to another user (via client)
- **THEN** RLS policy blocks the query (zero rows returned)

#### Scenario: User cannot guess another user's analysis ID
- **WHEN** user manually constructs query with another user's analysis UUID
- **THEN** RLS policy prevents data access even with valid UUID

### Requirement: Preserve verified analysis ownership during authorization rollout
The system SHALL associate each new analysis with its server-verified creator and SHALL prevent reassignment to another owner. This authorization rollout SHALL preserve existing analyses and their ownership.

#### Scenario: user_id field is required and immutable
- **WHEN** an analysis is created or updated through an action or direct authenticated database access
- **THEN** its owner SHALL match the authenticated identity on creation
- **AND** an update SHALL NOT transfer ownership to another account

#### Scenario: Existing analyses survive authorization rollout
- **WHEN** the authorization migration is deployed
- **THEN** existing analyses SHALL retain their IDs, owner IDs, text, metadata, and image references
- **AND** the migration SHALL NOT repeat the historical pre-auth analysis deletion

### Requirement: Apply user isolation to server and browser data access
Routine journal and memory database access SHALL use authenticated row-level policies regardless of whether the request originates from the browser or application server. Necessary privileged operations SHALL have explicit ownership constraints and SHALL NOT accept client metadata as authorization.

#### Scenario: Server accesses another account's records
- **WHEN** account A's authenticated server database client queries or mutates B's records
- **THEN** row-level policies SHALL prevent the foreign access

#### Scenario: Browser calls the database directly
- **WHEN** an authenticated browser bypasses application actions
- **THEN** database grants and policies SHALL still enforce journal ownership, memory eligibility, and the prohibition on self-assigned application roles

#### Scenario: Privileged storage helper is used
- **WHEN** an authorized operation needs privileged image storage access
- **THEN** the helper SHALL operate only on resources bound to the verified actor or an owned persisted analysis
- **AND** it SHALL NOT grant general cross-user database access to the calling action

### Requirement: Allocate analysis resource identities under server authority
The system SHALL bind each new analysis resource ID to its verified creator before accepting a saved analysis or generating images for that ID. Ordinary clients SHALL NOT be able to mint or transfer these ownership bindings. Existing analyses SHALL receive equivalent bindings without changing their IDs or owners.

#### Scenario: Direct database insert claims a foreign pending ID
- **WHEN** account A directly inserts or updates an analysis using account B's pending resource ID
- **THEN** the database SHALL reject the request regardless of client-supplied paths or metadata

#### Scenario: Direct database insert has no allocated resource
- **WHEN** an authenticated client attempts to create an analysis with an unallocated ID
- **THEN** the database SHALL reject it
- **AND** the supported server save flow SHALL allocate an owned ID for a text-only analysis

#### Scenario: Client attempts to rename an existing resource
- **WHEN** an authenticated client attempts to change a saved analysis ID
- **THEN** the database SHALL reject the change

#### Scenario: Deletion leaves objects after partial failure
- **WHEN** an analysis deletion or cleanup leaves associated objects behind
- **THEN** another account SHALL NOT acquire the former resource's identity or authorization to mutate those objects
