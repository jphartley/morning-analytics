## ADDED Requirements

### Requirement: Provide text input for journal entry

The system SHALL display a large text area where users can paste or write their morning pages.

#### Scenario: Text input available

- **WHEN** user loads the application
- **THEN** system displays a text area for journal entry
- **THEN** text area accepts paste and direct typing

### Requirement: Trigger analysis on user action

The system SHALL provide an "Analyze" button that initiates the analysis pipeline.

#### Scenario: Start analysis

- **WHEN** user clicks "Analyze" with text entered
- **THEN** system initiates the analysis and image generation pipeline

#### Scenario: Disabled during processing

- **WHEN** analysis is in progress
- **THEN** the Analyze button is disabled

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

### Requirement: Handle and display errors

The system SHALL display error messages when analysis or image generation fails, with an option to retry.

#### Scenario: Error with retry

- **WHEN** analysis or image generation fails
- **THEN** system displays an error message
- **THEN** system provides a way to retry
