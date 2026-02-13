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

The system SHALL show a clear loading indicator while analysis and image generation are in progress.

#### Scenario: Loading feedback

- **WHEN** analysis is in progress
- **THEN** system displays a loading indicator
- **THEN** user understands the system is working

### Requirement: Display analysis results

The system SHALL display the analysis text returned from Gemini.

#### Scenario: Show analysis

- **WHEN** analysis completes successfully
- **THEN** system displays the analysis text in a readable format

### Requirement: Display generated images

The system SHALL display the 4 images returned from Midjourney in a grid layout.

#### Scenario: Show image grid

- **WHEN** image generation completes successfully
- **THEN** system displays 4 images in a grid

### Requirement: Handle and display errors

The system SHALL display error messages when analysis or image generation fails, with an option to retry.

#### Scenario: Error with retry

- **WHEN** analysis or image generation fails
- **THEN** system displays an error message
- **THEN** system provides a way to retry
