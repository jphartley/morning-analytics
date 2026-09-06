## ADDED Requirements

### Requirement: Persist image generation batch provenance
The system SHALL persist an ordered `image_generation_batches` collection for image generation attempts associated with an analysis.

#### Scenario: Successful generation batch is stored
- **WHEN** a provider returns and uploads a valid image set
- **THEN** the analysis SHALL store a batch containing schema version, attempt ID, provider, model when available, exact submitted prompt, success status, creation timestamp, and the four image paths

#### Scenario: Failed generation batch is stored
- **WHEN** a provider attempt fails during a Dual mode request
- **THEN** the analysis SHALL store a batch containing schema version, attempt ID, provider, model when available, exact submitted prompt, failed status, creation timestamp, no image paths, and an optional normalized error code
- **AND** the batch SHALL NOT contain raw provider errors, credentials, signed URLs, or diagnostic timelines

#### Scenario: Same provider uses different prompts over time
- **WHEN** separate generation rounds use the same provider with different prompts
- **THEN** each batch SHALL retain its own exact submitted prompt and attempt identity
- **AND** historical attribution SHALL NOT depend on the analysis-level image prompt

#### Scenario: Dual mode batches are stored independently
- **WHEN** a Dual mode request attempts Black Forest Labs and Midjourney
- **THEN** the analysis SHALL store one batch per provider attempt in Black Forest Labs then Midjourney order

### Requirement: Keep flat paths and generation batches consistent
The system SHALL retain `image_paths` for backward compatibility while using generation batches as the provider-provenance source of truth.

#### Scenario: Initial analysis is saved
- **WHEN** initial image generation completes with one or more successful provider groups
- **THEN** the system SHALL save all successful paths in `image_paths`
- **AND** it SHALL save all successful and failed attempt records in `image_generation_batches`

#### Scenario: Regeneration updates an analysis
- **WHEN** regeneration uploads new images
- **THEN** the system SHALL append the new flat paths and attempted generation batches in the same analysis-row update

#### Scenario: Legacy analysis is loaded
- **WHEN** an existing analysis has `image_paths` and no generation batches
- **THEN** the analysis SHALL remain readable
- **AND** the system SHALL NOT backfill or infer provider, model, prompt, or attempt attribution

### Requirement: Protect persisted prompt provenance
The system SHALL protect batch prompts with the same ownership and privacy controls as their parent analysis.

#### Scenario: User reads generation batches
- **WHEN** an authenticated user loads an analysis through the client
- **THEN** existing analysis RLS SHALL restrict generation-batch data to analyses owned by that user

#### Scenario: Generation batch is logged or diagnosed
- **WHEN** application logs or test-mode diagnostics describe a persisted batch
- **THEN** they SHALL NOT expose the batch's full prompt
