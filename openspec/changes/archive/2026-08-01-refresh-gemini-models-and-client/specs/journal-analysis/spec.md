## ADDED Requirements

### Requirement: Use the refreshed Google Gemini client

The system SHALL use the supported `@google/genai` client and its typed `models.generateContent` request path for journal analysis and contextual-memory inference. The system SHALL preserve server-side API-key usage and the existing response parsing contract.

#### Scenario: Analysis uses the refreshed client
- **WHEN** a user submits valid journal text with a supported Gemini model selected
- **THEN** the server creates the Google Gen AI client using the server-side Gemini API key
- **AND** the server calls `models.generateContent` with the effective supported model ID
- **AND** the response is parsed through the existing analysis result path

#### Scenario: Contextual-memory inference uses the refreshed client
- **WHEN** contextual-memory selection or update runs with a supported Gemini model
- **THEN** the server uses the same refreshed Google Gen AI client dependency and model metadata
- **AND** structured JSON response validation remains enabled

### Requirement: Preserve the journal response contract during model refresh

The system SHALL preserve persona system instructions, mock mode, and `---IMAGE PROMPT---` extraction while changing the Gemini model catalog or client version.

#### Scenario: Gemini response contains an image prompt after the refresh
- **WHEN** the refreshed client returns a response containing `---IMAGE PROMPT---`
- **THEN** system returns the text before the delimiter as `analysisText`
- **AND** system returns the text after the delimiter as `imagePrompt`

#### Scenario: Mock analysis remains available after the refresh
- **WHEN** `USE_AI_MOCKS=true`
- **THEN** system returns the existing mock analysis without requiring a Gemini API key or network request
