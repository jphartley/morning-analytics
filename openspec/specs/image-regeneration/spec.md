## Purpose

Enable users to regenerate images for an existing analysis while preserving prior images and enforcing per-analysis limits.
## Requirements
### Requirement: Regenerate images for an existing analysis

The system SHALL allow users to regenerate images for any analysis that has a stored image prompt, accumulating a new provider generation round alongside existing images.

#### Scenario: Successful regeneration

- **WHEN** user clicks "Regenerate Images" on an analysis with an existing image prompt
- **THEN** system generates 4 new provider variations using the stored image prompt
- **AND** system assigns the regeneration round a fresh attempt ID that was not used by an earlier round for that analysis
- **AND** system preserves the permanent analysis ID for persistence
- **AND** system uploads new images with indices continuing from the current image count
- **AND** system appends new storage paths to the analysis's `image_paths` array
- **AND** new images appear in the image grid alongside existing images

#### Scenario: Repeated regeneration of one analysis

- **WHEN** a user completes more than one regeneration round for the same analysis
- **THEN** each round SHALL use a distinct attempt ID for provider generation and diagnostics
- **AND** each round SHALL continue using the same analysis ID for database and storage operations

#### Scenario: Regeneration from history view

- **WHEN** user views a historical analysis and clicks "Regenerate Images"
- **THEN** system regenerates images using the stored image prompt
- **THEN** the history view updates to show all images including newly generated ones

#### Scenario: Regeneration while previous images remain visible

- **WHEN** regeneration is in progress
- **THEN** existing images remain visible in the grid
- **THEN** a loading indicator appears below existing images

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

### Requirement: Regenerate button visibility

The system SHALL show the "Regenerate Images" button only when regeneration is possible.

#### Scenario: Analysis has image prompt

- **WHEN** analysis has a non-null `image_prompt`
- **THEN** "Regenerate Images" button is visible

#### Scenario: Analysis has no image prompt

- **WHEN** analysis has a null `image_prompt`
- **THEN** "Regenerate Images" button is not rendered

#### Scenario: Image generation failed on initial attempt

- **WHEN** analysis completed text analysis but image generation failed (no images, but image_prompt exists)
- **THEN** "Regenerate Images" button is visible to allow retry

### Requirement: Prevent concurrent regeneration

The system SHALL prevent multiple simultaneous regeneration requests for the same analysis.

#### Scenario: Regeneration already in progress

- **WHEN** user clicks "Regenerate Images" while a regeneration is already running
- **THEN** the button is disabled until the current regeneration completes

#### Scenario: Regeneration completes or fails

- **WHEN** regeneration finishes (success or failure)
- **THEN** the button re-enables (subject to cap check)

### Requirement: Preserve regeneration access across view modes
The system SHALL keep image regeneration controls available across quiet, insight, and test modes whenever regeneration is possible.

#### Scenario: Regeneration is available in quiet mode
- **WHEN** an analysis has an image prompt and regeneration is possible in `quiet` mode
- **THEN** the system SHALL show the "Regenerate Images" button

#### Scenario: Cap warning remains visible
- **WHEN** an analysis reaches the maximum image count in any view-density mode
- **THEN** the system SHALL disable the regeneration control
- **AND** the system SHALL show the maximum-image warning message

#### Scenario: Regeneration diagnostics are mode-limited
- **WHEN** regeneration returns diagnostic context outside `test` mode
- **THEN** the system SHALL hide diagnostic detail
- **AND** the system SHALL keep any user-facing error or warning visible
