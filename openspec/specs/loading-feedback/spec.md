### Requirement: Display rotating status messages during loading

The LoadingState component SHALL cycle through an array of status messages at a configurable interval (default 7 seconds). Messages SHALL transition with a fade effect.

#### Scenario: Messages rotate during text analysis

- **WHEN** the app is in the "analyzing" state
- **THEN** the spinner SHALL display messages from the analysis message set
- **THEN** the displayed message SHALL change every ~7 seconds
- **THEN** messages SHALL cycle back to the beginning after reaching the end

#### Scenario: Messages rotate during image generation

- **WHEN** the app is in the "text-ready" state (images generating)
- **THEN** the spinner SHALL display messages from the image generation message set
- **THEN** the displayed message SHALL change every ~7 seconds

### Requirement: Display expected duration hint

The LoadingState component SHALL display a duration hint below the rotating message in smaller, muted text.

#### Scenario: Duration hint for text analysis

- **WHEN** the app is in the "analyzing" state
- **THEN** the spinner SHALL display a duration hint indicating approximately 15 seconds

#### Scenario: Duration hint for image generation

- **WHEN** the app is in the "text-ready" state (images generating)
- **THEN** the spinner SHALL display a duration hint indicating approximately 1 minute

### Requirement: Provide themed message sets

The component SHALL export two predefined message arrays: one for text analysis (reading/interpreting themes) and one for image generation (painting/composing themes), each containing 8-10 messages.

#### Scenario: Analysis messages are thematic

- **WHEN** the analysis message set is used
- **THEN** messages SHALL be themed around reading, interpreting, and exploring text

#### Scenario: Image messages are thematic

- **WHEN** the image message set is used
- **THEN** messages SHALL be themed around painting, composing, and creating imagery
