## MODIFIED Requirements

### Requirement: Display loading state

The system SHALL show loading indicators styled with design token colors (`border-t-accent` spinner color, `border-accent-soft` spinner track). Loading indicators SHALL use the `LoadingState` component for both the analysis phase and the image generation phase, with appropriate rotating messages and duration hints.

#### Scenario: Initial analysis loading

- **WHEN** user clicks Analyze
- **THEN** system displays a `LoadingState` with analysis-themed rotating messages and a duration hint

#### Scenario: Image generation loading

- **WHEN** text analysis completes and images are being generated
- **THEN** system displays a `LoadingState` with image-themed rotating messages and a duration hint
- **THEN** user can read the analysis while waiting for images
