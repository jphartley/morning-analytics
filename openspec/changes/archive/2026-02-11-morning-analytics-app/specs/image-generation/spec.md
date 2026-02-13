## ADDED Requirements

### Requirement: Trigger Midjourney image generation

The system SHALL send an image prompt to Midjourney via Discord and return the generated images.

#### Scenario: Successful generation

- **WHEN** system receives an image prompt
- **THEN** system sends `/imagine` command to Midjourney via Discord
- **THEN** system waits for Midjourney to complete generation
- **THEN** system returns 4 image URLs

### Requirement: Capture Midjourney response

The system SHALL listen for Midjourney's response in the configured Discord channel and extract the final image URLs.

#### Scenario: Generation completes

- **WHEN** Midjourney posts the completed image grid
- **THEN** system extracts all 4 image URLs from the response

#### Scenario: Generation timeout

- **WHEN** Midjourney does not respond within the timeout period
- **THEN** system returns a timeout error

### Requirement: Handle Discord errors

The system SHALL handle Discord connection and API errors gracefully.

#### Scenario: Discord unavailable

- **WHEN** Discord connection fails or user token is invalid
- **THEN** system returns an error message indicating the image service is unavailable
