## ADDED Requirements

### Requirement: Display model selection options

The system SHALL display a model picker with three options, each showing a display name and trade-off description.

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3 Pro | `gemini-3-pro-preview` | Deepest reasoning – best insights, slowest |
| Gemini 2.5 Pro | `gemini-2.5-pro` | High-end reasoning – stable, long context |
| Gemini 2.5 Flash | `gemini-2.5-flash` | Balanced – good quality, faster |

#### Scenario: User views model options
- **WHEN** user opens the model picker dropdown
- **THEN** system displays all three model options with their display names and descriptions

### Requirement: Default model selection

The system SHALL use `gemini-3-pro-preview` as the default model when no selection has been saved.

#### Scenario: First-time user sees default
- **WHEN** user loads the app with no saved model preference
- **THEN** system displays "Gemini 3 Pro" as the selected model

### Requirement: Persist model selection

The system SHALL save the user's model selection to localStorage under the key `gemini-model`.

#### Scenario: User changes model selection
- **WHEN** user selects a different model from the picker
- **THEN** system saves the model ID to localStorage key `gemini-model`

#### Scenario: User returns to app
- **WHEN** user loads the app with a previously saved model preference
- **THEN** system displays the saved model as selected

### Requirement: Graceful fallback when localStorage unavailable

The system SHALL fall back to the default model without error when localStorage is unavailable.

#### Scenario: localStorage unavailable
- **WHEN** localStorage is unavailable (SSR, private browsing, or disabled)
- **THEN** system uses `gemini-3-pro-preview` as the model
- **AND** system does not throw an error or crash

### Requirement: Pass model selection to analysis

The system SHALL pass the selected model ID to the `analyzeText` server action when analyzing journal text.

#### Scenario: Analysis uses selected model
- **WHEN** user submits journal text for analysis
- **THEN** system calls `analyzeText` with the currently selected model ID
- **AND** the Gemini API call uses that model ID
