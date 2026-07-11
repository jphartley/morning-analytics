## ADDED Requirements

### Requirement: Use the selected provider for regeneration
The system SHALL resolve regeneration through the same provider-selection contract used for initial image generation.

#### Scenario: Regeneration uses deployment default
- **WHEN** a user requests regeneration without an allowed provider override
- **THEN** the system SHALL generate four new images with the configured deployment-default provider
- **AND** the system SHALL use the stored image prompt from the analysis

#### Scenario: Regeneration uses test override
- **WHEN** an authenticated user in test mode supplies an allowed provider override
- **AND** server-side provider override support is enabled
- **THEN** the system SHALL generate the new image round with the selected provider
- **AND** existing images SHALL remain visible and unchanged

## MODIFIED Requirements

### Requirement: Enforce per-analysis image cap

The system SHALL enforce a maximum of 20 images per analysis (5 regeneration rounds).

#### Scenario: Cap not yet reached

- **WHEN** analysis has fewer than 17 images (room for at least one more round of 4)
- **THEN** the "Regenerate Images" button is enabled

#### Scenario: Cap reached

- **WHEN** analysis has 20 or more images
- **THEN** the "Regenerate Images" button is disabled
- **THEN** a message indicates the maximum has been reached

#### Scenario: Cap would be exceeded

- **WHEN** user triggers regeneration but current image count + 4 would exceed 20
- **THEN** system returns an error before triggering image generation
- **THEN** no external image-provider request is made

