## MODIFIED Requirements

### Requirement: Analyze journal text with Gemini

The system SHALL send user-provided journal text to the Gemini API with a system prompt selected by the chosen analyst persona and return the analysis.

#### Scenario: Successful analysis with Jungian persona
- **WHEN** user submits journal text with Jungian persona selected
- **THEN** system sends text to Gemini API with the Jungian analyst system prompt
- **THEN** system returns the Jungian analysis response

#### Scenario: Successful analysis with Mel Robbins persona
- **WHEN** user submits journal text with Mel Robbins persona selected
- **THEN** system sends text to Gemini API with the Mel Robbins system prompt
- **THEN** system returns the Mel Robbins analysis response

#### Scenario: Successful analysis with Loving Parent persona
- **WHEN** user submits journal text with Loving Parent persona selected
- **THEN** system sends text to Gemini API with the Loving Parent system prompt
- **THEN** system returns the Loving Parent analysis response

#### Scenario: Empty input
- **WHEN** user submits empty text
- **THEN** system returns a validation error without calling the API

### Requirement: Extract image prompt from response

The system SHALL extract the image prompt from the Gemini response using the `---IMAGE PROMPT---` delimiter. This requirement is unchanged from the original spec.

#### Scenario: Delimiter present
- **WHEN** Gemini response contains `---IMAGE PROMPT---`
- **THEN** system returns analysis text (before delimiter) and image prompt (after delimiter) separately

#### Scenario: Delimiter missing
- **WHEN** Gemini response lacks the delimiter
- **THEN** system returns the full response as analysis text with no image prompt

### Requirement: Handle API errors

The system SHALL catch Gemini API errors and return user-friendly error messages. This requirement is unchanged from the original spec.

#### Scenario: API failure
- **WHEN** Gemini API returns an error or times out
- **THEN** system returns an error message that can be displayed to the user
