## Purpose

Define the main Morning Analytics app shell behavior, including journal input, analysis triggering, loading feedback, result display, image grid behavior, error handling, palette picker dismissal, and authenticated header layout.
## Requirements
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

The system SHALL show loading indicators styled with design token colors (`border-t-accent` spinner color, `border-accent-soft` spinner track). Loading indicators SHALL use the `LoadingState` component for both the analysis phase and the image generation phase, with appropriate rotating messages and duration hints.

#### Scenario: Initial analysis loading

- **WHEN** user clicks Analyze
- **THEN** system displays a `LoadingState` with analysis-themed rotating messages and a duration hint

#### Scenario: Image generation loading

- **WHEN** text analysis completes and images are being generated
- **THEN** system displays a `LoadingState` with image-themed rotating messages and a duration hint
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

### Requirement: App header layout

The app header SHALL use increased vertical padding (`py-5`) to accommodate the header logo image at a natural display height. The header SHALL contain the logo image and "Morning Analytics" text link on the left, and user email with sign-out button on the right.

#### Scenario: Header displays with logo and increased height

- **WHEN** an authenticated user views any page with the AppHeader
- **THEN** the header SHALL have `py-5` padding (increased from `py-3`)
- **THEN** the left side SHALL show the logo image followed by the "Morning Analytics" text
- **THEN** the right side SHALL show user email and sign-out button

### Requirement: First-run welcome empty state

The authenticated app shell SHALL display a lightweight welcome guide when the current user is idle and has no saved analysis history.

#### Scenario: New user sees welcome guide near top

- **WHEN** an authenticated user loads the app
- **AND** the app is idle
- **AND** the user's analysis history has zero entries
- **THEN** the system SHALL display a welcome guide in the main content area below the navigation/header
- **AND** the guide SHALL appear above the journal input so it is visible near the top of the screen

#### Scenario: Welcome guide explains app flow

- **WHEN** the welcome guide is displayed
- **THEN** the guide SHALL briefly explain that the user can write or paste morning pages
- **AND** the guide SHALL briefly explain that the app produces an AI-powered analysis
- **AND** the guide SHALL briefly explain that the app generates four artistic images inspired by the writing

#### Scenario: Returning user does not see welcome guide

- **WHEN** an authenticated user loads the app
- **AND** the user's analysis history has one or more entries
- **THEN** the system SHALL NOT display the welcome guide

#### Scenario: Welcome guide hides outside idle state

- **WHEN** the app is analyzing, showing completed results, showing an error, or viewing history
- **THEN** the system SHALL NOT display the welcome guide

#### Scenario: Welcome guide uses lightweight styling

- **WHEN** the welcome guide is displayed
- **THEN** the guide SHALL use existing design-token colors
- **AND** the guide SHALL NOT visually overwhelm the journal input area

### Requirement: Display collapsible image generation diagnostics

The app shell SHALL provide a collapsible diagnostics disclosure for the current image generation attempt near the generated-images area only in test mode.

#### Scenario: Image generation is waiting
- **WHEN** text analysis has completed, image generation is in progress, and the user is in `test` mode
- **THEN** the app SHALL preserve the existing image loading presentation
- **THEN** the app SHALL NOT add an extra diagnostic or phase-status sentence to the loading state
- **THEN** the app SHALL show a small, low-emphasis icon-only diagnostics disclosure near the image loading area
- **THEN** expanding the diagnostics disclosure SHALL indicate that the request is still running and detailed server events will appear after the request returns

#### Scenario: Diagnostics are available
- **WHEN** image generation returns diagnostics and the user is in `test` mode
- **THEN** the app SHALL make the diagnostic trace available behind a collapsed disclosure by default
- **THEN** the collapsed disclosure SHALL be an icon-only status affordance that is visually minimal and secondary to the generated images
- **THEN** the user SHALL be able to expand the disclosure to inspect redacted stage details
- **THEN** the expanded disclosure SHALL explain diagnostic events in plain language before showing raw event details
- **THEN** the expanded disclosure SHALL provide a copy action for a paste-ready diagnostic report

#### Scenario: Image generation fails after text analysis
- **WHEN** text analysis succeeds but image generation fails
- **THEN** the app SHALL keep the analysis visible
- **THEN** the app SHALL display a specific image-generation failure summary in all view-density modes
- **THEN** the app SHALL provide a visually subtle redacted diagnostics disclosure for local debugging only in `test` mode

### Requirement: Preserve normal result display

The diagnostics disclosure SHALL NOT disrupt the existing analysis and image display flow when image generation succeeds.

#### Scenario: Images generate successfully
- **WHEN** image generation succeeds and returns images
- **THEN** the app SHALL display the generated image grid as before
- **THEN** the app MAY show only a small, low-emphasis diagnostics disclosure collapsed below or near the generated image area

### Requirement: Honor view-density modes in the app shell
The main app shell SHALL render controls, metadata, and diagnostics according to the selected view-density mode while preserving the core analysis workflow.

#### Scenario: Header controls follow mode
- **WHEN** the main page header is displayed
- **THEN** the system SHALL show the view-density control in all modes
- **AND** the system SHALL show the analyst persona picker in all modes
- **AND** the system SHALL show the model picker only in `insight` and `test` modes

#### Scenario: Mock mode banner follows mode
- **WHEN** mock image provider mode is active
- **THEN** the system SHALL show the mock-mode banner only in `test` mode

#### Scenario: History context follows mode
- **WHEN** the user views a historical analysis
- **THEN** the system SHALL show the original input in all modes
- **AND** the system SHALL show the analyzed-by banner only in `insight` and `test` modes

#### Scenario: User-facing warnings remain visible
- **WHEN** a warning or error is present in any mode
- **THEN** the app shell SHALL render a user-facing warning or error message

