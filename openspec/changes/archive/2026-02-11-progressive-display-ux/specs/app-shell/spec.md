## MODIFIED Requirements

### Requirement: Display loading state

The system SHALL show appropriate loading indicators for each phase of the analysis pipeline.

#### Scenario: Initial analysis loading

- **WHEN** user clicks Analyze
- **THEN** system displays a loading indicator for text analysis

#### Scenario: Image generation loading

- **WHEN** text analysis completes and images are being generated
- **THEN** system displays a loading placeholder in the images section
- **THEN** user can read the analysis while waiting for images

### Requirement: Display analysis results

The system SHALL display the analysis text as soon as Gemini responds, without waiting for images.

#### Scenario: Show analysis immediately

- **WHEN** text analysis completes
- **THEN** system displays the analysis text immediately
- **THEN** system begins image generation in background

### Requirement: Display generated images

The system SHALL display 4 separate images in a grid layout, each clickable to view larger.

#### Scenario: Show image grid

- **WHEN** image generation completes successfully
- **THEN** system displays 4 separate images in a grid
- **THEN** each image is displayed at a larger size than the original grid

#### Scenario: Images are clickable

- **WHEN** images are displayed
- **THEN** each image can be clicked to open in lightbox
