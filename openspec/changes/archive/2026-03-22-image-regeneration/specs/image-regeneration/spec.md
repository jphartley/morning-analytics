## ADDED Requirements

### Requirement: Regenerate images for an existing analysis

The system SHALL allow users to regenerate images for any analysis that has a stored image prompt, accumulating new images alongside existing ones.

#### Scenario: Successful regeneration

- **WHEN** user clicks "Regenerate Images" on an analysis with an existing image prompt
- **THEN** system generates 4 new images using the stored image prompt
- **THEN** system uploads new images with indices continuing from the current image count
- **THEN** system appends new storage paths to the analysis's `image_paths` array
- **THEN** new images appear in the image grid alongside existing images

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
- **THEN** no Midjourney API call is made

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
