## ADDED Requirements

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

### Requirement: Server actions bypass RLS with service role key
The system SHALL use service role key for server-side writes, allowing trusted server code to write data without RLS restrictions.

#### Scenario: saveAnalysis() uses service role
- **WHEN** server action saveAnalysis() inserts row into `analyses` table
- **THEN** service role key is used (bypasses RLS) but user_id is always set from auth.uid()

#### Scenario: analyzeText() and generateImages() use service role
- **WHEN** server actions analyzeText() or generateImages() read/write metadata
- **THEN** service role key allows access regardless of RLS (trusted context)

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

### Requirement: Analysis metadata contains user context
The system SHALL automatically associate each analysis with the authenticated user who created it.

#### Scenario: user_id field is required and immutable
- **WHEN** an analysis is created
- **THEN** `user_id` is set to `auth.uid()` from session (cannot be overridden by client)

#### Scenario: Pre-auth analyses deleted
- **WHEN** user-auth change is deployed
- **THEN** all existing analyses (which have no user_id) are deleted (breaking change)
