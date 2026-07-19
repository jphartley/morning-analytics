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
The system SHALL select bounded user-scoped contextual memory before generating a daily analysis and SHALL provide the same selected context to any supported analyst persona.

#### Scenario: Relevant memory is available
- **WHEN** the user submits non-empty journal text and the relevance selector returns valid memories
- **THEN** the system SHALL provide the bounded compact memory context with the original journal text to the selected analyst persona
- **AND** it SHALL instruct the analyst to treat today's writing as primary and memory as potentially uncertain background

#### Scenario: Memory is unavailable
- **WHEN** the user has no memory store, no relevant selection, or a selector failure
- **THEN** the system SHALL continue to analyze the original journal text without memory

### Requirement: Update contextual memory after persistence
The system SHALL update contextual memory only after the chosen analysis is saved and SHALL keep memory-update status separate from the readable analysis result.

#### Scenario: Normal analysis is saved
- **WHEN** a normal daily analysis is saved successfully
- **THEN** the system SHALL invoke memory update once using the original journal entry

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
