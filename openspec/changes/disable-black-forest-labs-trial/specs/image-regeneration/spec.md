# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Historical BFL analysis is regenerated with no active trial
- **WHEN** a user regenerates an analysis containing old BFL images with no active trial and Midjourney as the deployment default
- **THEN** the system SHALL request four Midjourney images using the stored analysis prompt
- **AND** the previous BFL images and batches SHALL remain intact
- **AND** historical attribution SHALL NOT select BFL for the new round

#### Scenario: Disabled provider is requested for regeneration
- **WHEN** a regeneration request explicitly selects BFL or Dual without an authorized trial candidate
- **THEN** the server SHALL reject that selection before invoking either provider
- **AND** existing images and batches SHALL remain unchanged


### Requirement: Regenerate with Dual mode
The system SHALL apply the authorized Dual mode orchestration to regeneration using the analysis prompt selected for that round.

#### Scenario: Dual regeneration succeeds
- **WHEN** an administrator selects authorized Dual mode with an available trial candidate and enough image capacity remains
- **THEN** the system SHALL request four trial-candidate images and four Midjourney images using the exact same prompt
- **AND** it SHALL append successful paths and provider generation batches to the existing analysis
- **AND** existing images SHALL remain visible and unchanged

#### Scenario: Dual regeneration is partially successful
- **WHEN** exactly one provider fails during Dual mode regeneration
- **THEN** the system SHALL append the successful provider's images and both provider attempt batches
- **AND** the system SHALL show the failed provider's outcome without discarding successful images
