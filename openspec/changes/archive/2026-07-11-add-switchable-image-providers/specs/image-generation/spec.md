## ADDED Requirements

### Requirement: Normalize provider image output before storage
The system SHALL normalize output from every registered image provider into the same four-image application contract before shared storage and response handling.

#### Scenario: Provider returns a successful image set
- **WHEN** the selected provider returns exactly four supported images
- **THEN** the system SHALL upload the four images through the shared Supabase storage path
- **AND** the system SHALL return four displayable images and their storage paths

#### Scenario: Provider returns an invalid image set
- **WHEN** the selected provider returns an unsupported content type, empty image data, or an unexpected image count
- **THEN** the system SHALL reject the image set before reporting success
- **AND** diagnostics SHALL identify output normalization as the failure stage

## REMOVED Requirements

### Requirement: Trigger Midjourney image generation
**Reason**: Initial image generation is no longer required to use Midjourney for every attempt; the provider resolver may select Midjourney, Black Forest Labs, or mock generation.

**Migration**: Use the new `Generate images with the selected provider` requirement. Existing Midjourney trigger, capture, recovery, and splitting requirements continue to apply whenever Midjourney is selected.

## ADDED Requirements

### Requirement: Generate images with the selected provider
The system SHALL send an image prompt to the provider resolved for the current attempt and SHALL return the generated images without changing the selected provider during that attempt.

#### Scenario: Midjourney generation succeeds
- **WHEN** Midjourney is selected and its Discord workflow captures a completed grid
- **THEN** the system SHALL split the grid and return four normalized images according to the existing Midjourney requirements

#### Scenario: Black Forest Labs generation succeeds
- **WHEN** Black Forest Labs is selected and its four image slots complete successfully
- **THEN** the system SHALL return four normalized images without invoking Discord or grid splitting

#### Scenario: Mock generation succeeds
- **WHEN** mock is selected
- **THEN** the system SHALL return four local fixture images without invoking an external image provider

#### Scenario: Selected provider fails
- **WHEN** the selected provider returns a terminal failure or timeout
- **THEN** the system SHALL return an error attributed to that provider
- **AND** the system SHALL NOT automatically invoke another provider

