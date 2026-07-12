## MODIFIED Requirements

### Requirement: Enforce per-analysis image cap

The system SHALL enforce a maximum of 20 stored images per analysis and SHALL reserve enough capacity for the selected regeneration mode before invoking an external provider.

#### Scenario: Single-provider round fits

- **WHEN** an analysis has no more than 16 images and a single provider is selected
- **THEN** the "Regenerate Images" button SHALL be enabled for a four-image round

#### Scenario: Dual mode round fits

- **WHEN** an analysis has no more than 12 images and Dual mode is selected
- **THEN** the "Regenerate Images" button SHALL be enabled for an eight-image round

#### Scenario: Selected round would exceed the cap

- **WHEN** the current image count plus four for a single-provider round or eight for a Dual mode round would exceed 20
- **THEN** the system SHALL disable or reject regeneration for that selection
- **AND** the system SHALL make no external image-provider request

#### Scenario: Partial Dual mode round uses only successful capacity

- **WHEN** a permitted Dual mode regeneration produces one successful four-image group and one failed group
- **THEN** only the four successfully stored images SHALL count toward the 20-image cap

## ADDED Requirements

### Requirement: Regenerate with Dual mode
The system SHALL apply the authorized Dual mode orchestration to regeneration using the analysis prompt selected for that round.

#### Scenario: Dual regeneration succeeds
- **WHEN** a user selects Dual mode and enough image capacity remains
- **THEN** the system SHALL request four Black Forest Labs images and four Midjourney images using the exact same prompt
- **AND** it SHALL append successful paths and provider generation batches to the existing analysis
- **AND** existing images SHALL remain visible and unchanged

#### Scenario: Dual regeneration is partially successful
- **WHEN** exactly one provider fails during Dual mode regeneration
- **THEN** the system SHALL append the successful provider's images and both provider attempt batches
- **AND** the system SHALL show the failed provider's outcome without discarding successful images
