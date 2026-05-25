## ADDED Requirements

### Requirement: Reveal generated image prompt
The system SHALL allow users to reveal and hide the image prompt associated with generated images.

#### Scenario: Fresh analysis prompt starts collapsed
- **WHEN** a fresh analysis reaches the complete state with generated images and an image prompt
- **THEN** a "Show image prompt" toggle appears below the image grid
- **AND** the image prompt text is hidden by default

#### Scenario: Fresh analysis prompt can be revealed and hidden
- **WHEN** the user activates the "Show image prompt" toggle for a fresh analysis
- **THEN** the image prompt text appears below the toggle in a styled block
- **WHEN** the user activates the hide control
- **THEN** the image prompt text is hidden again

#### Scenario: History prompt starts collapsed
- **WHEN** the user views a historical analysis with generated images and a stored image prompt
- **THEN** a "Show image prompt" toggle appears below the image grid
- **AND** the image prompt text is hidden by default

#### Scenario: History prompt can be revealed and hidden
- **WHEN** the user activates the "Show image prompt" toggle for a historical analysis
- **THEN** the stored image prompt text appears below the toggle in a styled block
- **WHEN** the user activates the hide control
- **THEN** the image prompt text is hidden again

#### Scenario: No prompt available
- **WHEN** generated images are shown but no image prompt is available
- **THEN** the image prompt toggle is not rendered

### Requirement: Copy image prompt
The system SHALL provide a way to copy a revealed image prompt when browser clipboard support is available.

#### Scenario: Copy revealed prompt
- **WHEN** the image prompt is revealed and clipboard writing is available
- **THEN** a copy control is available with the prompt text
- **WHEN** the user activates the copy control
- **THEN** the system copies the image prompt text to the clipboard
