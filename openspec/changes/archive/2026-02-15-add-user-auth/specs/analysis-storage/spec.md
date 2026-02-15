## ADDED Requirements

### Requirement: analyses table has user_id field
The system SHALL add a `user_id` UUID column to the `analyses` table with a NOT NULL constraint.

#### Scenario: user_id column exists
- **WHEN** table schema is inspected
- **THEN** `analyses` table has a `user_id` UUID column that is NOT NULL

#### Scenario: Every analysis has a user_id
- **WHEN** new analysis is saved
- **THEN** `user_id` is set from the authenticated userId parameter passed from the client's useAuth() hook

### Requirement: Analyses are stored with privacy isolation
The system SHALL store analyses in the `analyses` table with user context, enabling privacy enforcement.

#### Scenario: Analysis persisted with user context
- **WHEN** saveAnalysis() server action completes
- **THEN** analysis is stored with `user_id`, `input_text`, `analysis_text`, `image_prompt`, `model_id`, `analyst_persona`, `image_paths`, and `created_at`

#### Scenario: Service role bypasses RLS for writes
- **WHEN** server action uses Supabase service role key
- **THEN** analysis can be inserted without RLS policy blocking (trusted context)

### Requirement: RLS policies enforce privacy on analyses table
The system SHALL enforce four RLS policies (SELECT, INSERT, UPDATE, DELETE) to prevent cross-user data access.

#### Scenario: SELECT policy returns only user's data
- **WHEN** anon client queries `SELECT * FROM analyses`
- **THEN** only rows where `user_id = auth.uid()` are returned

#### Scenario: INSERT policy prevents unauthorized writes
- **WHEN** anon client attempts INSERT with mismatched user_id
- **THEN** policy blocks insert (only allows `user_id = auth.uid()`)

#### Scenario: UPDATE policy prevents cross-user modification
- **WHEN** anon client attempts UPDATE on row with different user_id
- **THEN** policy blocks update

#### Scenario: DELETE policy prevents cross-user deletion
- **WHEN** anon client attempts DELETE on row with different user_id
- **THEN** policy blocks delete

### Requirement: Image paths reference user's analyses
The system SHALL store image paths in the `image_paths` JSONB column, organized by analysis ID (which now includes user context via RLS).

#### Scenario: Image paths stored per analysis
- **WHEN** images are uploaded for an analysis
- **THEN** `image_paths` contains array of paths: `["analysisId/0.jpg", "analysisId/1.jpg", ...]` associated with authenticated user's analysis

#### Scenario: Image URLs respect user isolation
- **WHEN** client fetches image URLs from `image_paths`
- **THEN** images can only be retrieved if user owns the analysis (via RLS on analyses table)

### Requirement: Existing shared analyses are deleted
The system SHALL delete all pre-authentication analyses as a breaking change during deployment.

#### Scenario: Pre-auth data cleanup
- **WHEN** user-auth change is deployed
- **THEN** all existing analyses (created before auth system) are permanently deleted

#### Scenario: Users start with empty history
- **WHEN** new user completes signup
- **THEN** their analysis history is empty (no inherited data from pre-auth era)
