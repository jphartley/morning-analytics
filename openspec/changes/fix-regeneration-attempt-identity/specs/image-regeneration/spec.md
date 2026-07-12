## MODIFIED Requirements

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
