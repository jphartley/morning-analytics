## MODIFIED Requirements

### Requirement: Trigger Midjourney image generation

The system SHALL send an image prompt to Midjourney via Discord and return the generated images. The system SHALL support generating images for both new and existing analyses.

#### Scenario: Successful generation

- **WHEN** system receives an image prompt
- **THEN** system sends `/imagine` command to Midjourney via Discord
- **THEN** system waits for Midjourney to complete generation
- **THEN** system returns 4 image URLs

#### Scenario: Generation for existing analysis (regeneration)

- **WHEN** system receives a regeneration request with an existing analysis ID
- **THEN** system uses the stored image prompt from the analysis record
- **THEN** system uploads images with indices offset by the current image count
- **THEN** system returns 4 new image URLs

#### Scenario: Generation timeout

- **WHEN** Midjourney does not respond within the timeout period
- **THEN** system returns a timeout error

### Requirement: Handle Discord errors

The system SHALL handle Discord connection and API errors gracefully.

#### Scenario: Discord unavailable

- **WHEN** Discord connection fails or user token is invalid
- **THEN** system returns an error message indicating the image service is unavailable
