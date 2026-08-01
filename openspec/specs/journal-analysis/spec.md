## Purpose

Define the core journal analysis pipeline that sends text to Gemini, extracts image prompts, and handles analysis errors.

## Requirements

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

The system SHALL extract the image prompt from the Gemini response using the `---IMAGE PROMPT---` delimiter.

#### Scenario: Delimiter present

- **WHEN** Gemini response contains `---IMAGE PROMPT---`
- **THEN** system returns analysis text (before delimiter) and image prompt (after delimiter) separately

#### Scenario: Delimiter missing

- **WHEN** Gemini response lacks the delimiter
- **THEN** system returns the full response as analysis text with no image prompt

### Requirement: Handle API errors

The system SHALL catch Gemini API errors and return user-friendly error messages.

#### Scenario: API failure

- **WHEN** Gemini API returns an error or times out
- **THEN** system returns an error message that can be displayed to the user

### Requirement: Enrich journal analysis with relevant contextual memory
The system SHALL honor the effective analysis memory mode when generating a daily analysis and SHALL provide any selected bounded user-scoped context to the supported analyst persona.

#### Scenario: Memory-enabled analysis has relevant context
- **WHEN** the user submits non-empty journal text in a memory-enabled mode and the relevance selector returns valid memories
- **THEN** the system SHALL provide the bounded compact memory context with the original journal text to the selected analyst persona
- **AND** it SHALL instruct the analyst to treat today's writing as primary and memory as potentially uncertain background

#### Scenario: No-memory analysis is requested
- **WHEN** the user submits non-empty journal text in No memory mode
- **THEN** the system SHALL skip contextual-memory relevance selection
- **AND** it SHALL provide no contextual memory to the selected analyst persona
- **AND** it SHALL return an empty memory-context snapshot for the analysis

#### Scenario: Memory is unavailable in a memory-enabled mode
- **WHEN** the user has no memory store, no relevant selection, or a selector failure
- **THEN** the system SHALL continue to analyze the original journal text without memory

#### Scenario: User submits outside Test view
- **WHEN** the user submits an entry from Quiet or Insight view
- **THEN** the system SHALL use the memory-enabled analysis path

### Requirement: Update contextual memory after persistence
The system SHALL update contextual memory only after the chosen analysis is saved and SHALL keep memory-update status separate from the readable analysis result, regardless of whether memory informed that result.

#### Scenario: Memory-enabled single analysis is saved
- **WHEN** a memory-enabled single analysis is saved successfully
- **THEN** the system SHALL invoke memory update once using the original journal entry

#### Scenario: No-memory single analysis is saved
- **WHEN** a no-memory single analysis is saved successfully
- **THEN** the system SHALL invoke memory update once using the original journal entry
- **AND** the generated analysis SHALL remain recorded with an empty memory-context snapshot

#### Scenario: Blind-comparison result is saved
- **WHEN** the user saves the preferred blind-comparison result
- **THEN** the system SHALL invoke memory update once using the original journal entry
- **AND** it SHALL NOT update memory from the rejected result

#### Scenario: Analysis is not saved
- **WHEN** the analysis persistence step fails or the user leaves a comparison without saving
- **THEN** the system SHALL NOT add evidence from that entry to durable memory

#### Scenario: Memory update remains pending or fails
- **WHEN** the analysis is already displayed and its subsequent memory update is pending or fails
- **THEN** the analysis SHALL remain readable
- **AND** image generation and saved-history behavior SHALL not be invalidated by the memory outcome

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
