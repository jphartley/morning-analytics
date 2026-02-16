### Requirement: Provide text input for journal entry

The system SHALL display a large text area where users can paste or write their morning pages. The text area SHALL use design token Tailwind classes (`bg-surface` background, `text-ink` text color, `border-outline` border, `ring-accent` focus ring).

#### Scenario: Text input available

- **WHEN** user loads the application
- **THEN** system displays a text area for journal entry
- **THEN** text area accepts paste and direct typing
- **THEN** text area uses `bg-surface` background, `border-outline` border, and `ring-accent` focus ring

### Requirement: Trigger analysis on user action

The system SHALL provide an "Analyze" button styled with design token accent color (`bg-accent` background, `hover:bg-accent-hover` on hover).

#### Scenario: Start analysis

- **WHEN** user clicks "Analyze" with text entered
- **THEN** system initiates the analysis and image generation pipeline

#### Scenario: Disabled during processing

- **WHEN** analysis is in progress
- **THEN** the Analyze button is disabled

### Requirement: Display loading state

The system SHALL show loading indicators styled with design token colors (`border-t-accent` spinner color, `border-accent-soft` spinner track).

#### Scenario: Initial analysis loading

- **WHEN** user clicks Analyze
- **THEN** system displays a loading indicator using accent token colors

#### Scenario: Image generation loading

- **WHEN** text analysis completes and images are being generated
- **THEN** system displays a loading placeholder in the images section
- **THEN** user can read the analysis while waiting for images

### Requirement: Display analysis results

The system SHALL display the analysis text in a panel using design token colors (`bg-surface` background, `text-ink` body text, `border-outline` panel border).

#### Scenario: Show analysis immediately

- **WHEN** text analysis completes
- **THEN** system displays the analysis text immediately in a `bg-surface` panel with `border-outline` border
- **THEN** system begins image generation in background

### Requirement: Display generated images

The system SHALL display 4 separate images in a grid layout using design token colors for hover/focus rings (`ring-accent`).

#### Scenario: Show image grid

- **WHEN** image generation completes successfully
- **THEN** system displays 4 separate images in a grid
- **THEN** each image is displayed at a larger size than the original grid

#### Scenario: Images are clickable

- **WHEN** images are displayed
- **THEN** each image can be clicked to open in lightbox
- **THEN** hover/focus ring uses `ring-accent` color

### Requirement: Handle and display errors

The system SHALL display error messages when analysis or image generation fails, with an option to retry.

#### Scenario: Error with retry

- **WHEN** analysis or image generation fails
- **THEN** system displays an error message
- **THEN** system provides a way to retry

### Requirement: Dismiss palette picker popup on outside click

The system SHALL close the palette picker popup when the user clicks anywhere outside the popup and its toggle button.

#### Scenario: Click outside closes popup

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks anywhere outside the popup container and toggle button
- **THEN** the popup SHALL close

#### Scenario: Click inside popup does not close it

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks on a palette swatch or inside the popup area
- **THEN** the popup SHALL remain open

#### Scenario: Toggle button still works

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks the toggle button
- **THEN** the popup SHALL close (existing toggle behavior preserved)
