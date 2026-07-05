## Purpose

Enable users to choose which supported Gemini model powers journal analysis.
## Requirements
### Requirement: Display model selection options

The system SHALL display a model picker with three options in insight and test modes, each showing a display name and trade-off description. The system SHALL hide the model picker in quiet mode while preserving the selected model value for analysis.

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite` | Fastest answers |
| Gemini 3.5 Flash | `gemini-3.5-flash` | All-around help |
| Gemini 3.1 Pro | `gemini-3.1-pro-preview` | Advanced analysis and reasoning |

#### Scenario: User views model options in insight or test mode
- **WHEN** user opens the model picker dropdown while in `insight` or `test` mode
- **THEN** system displays all three current Gemini model options with their display names and descriptions
- **AND** model picker is positioned alongside the analyst persona picker and view-density control in the header

#### Scenario: User is in quiet mode
- **WHEN** user views the page header while in `quiet` mode
- **THEN** system hides the model picker
- **AND** system preserves the currently selected model for future analysis

### Requirement: Default model selection

The system SHALL use `gemini-3.5-flash` as the default model when no selection has been saved.

#### Scenario: First-time user sees default
- **WHEN** user loads the app with no saved model preference
- **THEN** system displays "Gemini 3.5 Flash" as the selected model

### Requirement: Persist model selection

The system SHALL save the user's model selection to localStorage under the key `gemini-model`.

#### Scenario: User changes model selection
- **WHEN** user selects a different model from the picker
- **THEN** system saves the model ID to localStorage key `gemini-model`

#### Scenario: User returns to app
- **WHEN** user loads the app with a previously saved model preference for a currently supported model
- **THEN** system displays the saved model as selected

### Requirement: Graceful fallback when localStorage unavailable

The system SHALL fall back to the default model without error when localStorage is unavailable or when localStorage contains a model ID that is no longer supported.

#### Scenario: localStorage unavailable
- **WHEN** localStorage is unavailable (SSR, private browsing, or disabled)
- **THEN** system uses `gemini-3.5-flash` as the model
- **AND** system does not throw an error or crash

#### Scenario: Saved model is no longer supported
- **WHEN** localStorage contains a model ID that is not one of the currently supported model picker options
- **THEN** system uses `gemini-3.5-flash` as the model
- **AND** system does not throw an error or crash

### Requirement: Pass model selection to analysis

The system SHALL pass the selected model ID to the `analyzeText` server action when analyzing journal text.

#### Scenario: Analysis uses selected model
- **WHEN** user submits journal text for analysis
- **THEN** system calls `analyzeText` with the currently selected model ID
- **AND** the Gemini API call uses that model ID

### Requirement: Configure extended thinking for supported models

The system SHALL request extended thinking for selected Gemini models when the model supports configurable thinking, while leaving unsupported models on the standard request path.

#### Scenario: Selected model supports extended thinking
- **WHEN** user submits journal text with a thinking-capable selected model
- **THEN** the Gemini API request includes the model's configured extended thinking settings

#### Scenario: Selected model does not support extended thinking
- **WHEN** user submits journal text with a selected model that does not support configurable thinking
- **THEN** the Gemini API request omits thinking settings
- **AND** analysis generation continues without error

