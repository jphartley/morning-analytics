## ADDED Requirements

### Requirement: Persist user-scoped contextual memory
The system SHALL persist consolidated memories and their supporting journal evidence with explicit user ownership and database privacy policies.

#### Scenario: Memory record is stored
- **WHEN** validated memory inference creates or updates a memory
- **THEN** the record SHALL include `user_id`, compact summary, retrieval metadata, confidence, significance, temporal state, version, and observation timestamps

#### Scenario: Supporting evidence is stored
- **WHEN** a grounded journal excerpt supports, revises, or conflicts with a memory
- **THEN** the evidence SHALL retain the owning user, memory identifier, source analysis when available, source entry date, excerpt, and effect

#### Scenario: RLS protects memory data
- **WHEN** an authenticated browser client reads memory or evidence tables
- **THEN** database policies SHALL return only rows where `user_id = auth.uid()`

### Requirement: Persist the memory context used by an analysis
The system SHALL store an immutable JSON-compatible snapshot of the memory context supplied to each saved analysis.

#### Scenario: Analysis uses memory
- **WHEN** an analysis enriched with contextual memory is saved
- **THEN** its storage record SHALL include each used memory ID, version, and exact compact summary

#### Scenario: Analysis does not use memory
- **WHEN** an analysis runs without contextual memory
- **THEN** its memory-context field SHALL be empty or null

#### Scenario: Memory later changes or is reset
- **WHEN** a used memory is revised or removed from the current experimental store
- **THEN** the saved analysis memory-context snapshot SHALL continue to represent what that analysis received

### Requirement: Reset memory without deleting analysis history
The system SHALL scope full-store reset to contextual memories and evidence owned by the requesting user.

#### Scenario: Memory reset completes
- **WHEN** an authenticated user confirms a full memory reset
- **THEN** the system SHALL remove that user's current memory and evidence rows
- **AND** it SHALL leave `analyses` rows, images, and stored memory-context snapshots intact
