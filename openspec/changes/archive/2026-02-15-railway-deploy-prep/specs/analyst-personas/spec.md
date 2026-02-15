## MODIFIED Requirements

### Requirement: Load and cache persona prompts

The system SHALL load all three persona prompt files at server startup and cache them in memory. Prompt files SHALL be located at `prompts/<persona>.md` relative to the Next.js app root (`process.cwd()`), not in a sibling directory outside the app.

#### Scenario: Prompts loaded successfully
- **WHEN** server starts
- **THEN** system loads `prompts/jungian.md`, `prompts/mel-robbins.md`, and `prompts/loving-parent.md` from the app directory
- **AND** prompts are cached for fast access

#### Scenario: Missing prompt file
- **WHEN** a persona prompt file is missing or unreadable
- **THEN** system logs an error and throws an exception preventing that persona from being used
