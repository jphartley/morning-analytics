# Spec Delta

## MODIFIED Requirements

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
- **WHEN** an authorized Dual mode request attempts the configured trial candidate and Midjourney
- **THEN** the analysis SHALL store one batch per provider attempt in trial-candidate then Midjourney order

## ADDED Requirements

### Requirement: Preserve provenance for disabled image providers
The system SHALL retain and read valid generation batches for known historical providers independently of their availability for new generation. Disabling a provider SHALL NOT delete or relabel its images, prompts, model identifiers, outcomes, timestamps, or attempt identities.

#### Scenario: Historical trial is dormant
- **WHEN** an analysis containing BFL or mixed-provider batches is loaded after the trial is disabled
- **THEN** all valid batches SHALL remain readable with their original attribution and order
- **AND** no provider credential or generation call SHALL be required to parse those batches

#### Scenario: New images are appended after dormancy
- **WHEN** Midjourney regeneration succeeds on an analysis containing historical BFL batches
- **THEN** new Midjourney paths and batches SHALL be appended using the existing storage contract
- **AND** all prior paths and batches SHALL remain intact

#### Scenario: Legacy flat history has no attribution
- **WHEN** an analysis has flat image paths without batches after the trial is disabled
- **THEN** its images SHALL remain readable
- **AND** the system SHALL NOT infer provider attribution
