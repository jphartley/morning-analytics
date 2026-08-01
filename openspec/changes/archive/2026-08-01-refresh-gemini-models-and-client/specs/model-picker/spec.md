## MODIFIED Requirements

### Requirement: Display model selection options

The system SHALL display a model picker with three current Gemini text-model options in insight and test modes, each showing a display name and trade-off description. The system SHALL hide the model picker in quiet mode while preserving the selected model value for analysis.

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3.6 Flash | `gemini-3.6-flash` | Strong, efficient analysis |
| Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | Fastest, lowest-cost answers |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | Most advanced reasoning; default |

#### Scenario: User views model options in insight or test mode
- **WHEN** user opens the model picker dropdown while in `insight` or `test` mode
- **THEN** system displays exactly the three current Gemini model options with their display names and descriptions
- **AND** system does not display the removed `gemini-3.1-flash-lite` or `gemini-3.5-flash` options
- **AND** model picker is positioned alongside the analyst persona picker and view-density control in the header

#### Scenario: User is in quiet mode
- **WHEN** user views the page header while in `quiet` mode
- **THEN** system hides the model picker
- **AND** system preserves the currently selected model for future analysis

### Requirement: Configure extended thinking for supported models

The system SHALL request each selected model's configured Gemini 3 thinking level through the supported `thinkingConfig` request field.

#### Scenario: User selects Gemini 3.6 Flash
- **WHEN** user submits journal text with `gemini-3.6-flash` selected
- **THEN** the Gemini request includes `thinkingConfig.thinkingLevel` set to `medium`

#### Scenario: User selects Gemini 3.5 Flash-Lite
- **WHEN** user submits journal text with `gemini-3.5-flash-lite` selected
- **THEN** the Gemini request includes `thinkingConfig.thinkingLevel` set to `minimal`
- **AND** the request does not enable thought summaries

#### Scenario: User selects Gemini 3.1 Pro Preview
- **WHEN** user submits journal text with `gemini-3.1-pro-preview` selected
- **THEN** the Gemini request includes `thinkingConfig.thinkingLevel` set to `high`
- **AND** the request does not enable thought summaries

### Requirement: Default model selection

The system SHALL use `gemini-3.1-pro-preview` as the default model when no selection has been saved.

#### Scenario: First-time user sees default
- **WHEN** user loads the app with no saved model preference
- **THEN** system displays "Gemini 3.1 Pro Preview" as the selected model

### Requirement: Graceful fallback when localStorage is unavailable

The system SHALL fall back to `gemini-3.1-pro-preview` without error when localStorage is unavailable or when localStorage contains a model ID that is no longer supported.

#### Scenario: localStorage unavailable
- **WHEN** localStorage is unavailable (SSR, private browsing, or disabled)
- **THEN** system uses `gemini-3.1-pro-preview` as the model
- **AND** system does not throw an error or crash

#### Scenario: Saved model is no longer supported
- **WHEN** localStorage contains a model ID that is not one of the currently supported model picker options
- **THEN** system uses `gemini-3.1-pro-preview` as the model
- **AND** system does not throw an error or crash

### Requirement: Reject removed model IDs from the current picker catalog

The system SHALL treat removed or unknown model IDs as unsupported for new picker selections and runtime requests.

#### Scenario: Removed model is stored in localStorage
- **WHEN** localStorage contains `gemini-3.1-flash-lite`, `gemini-3.5-flash`, or another unknown model ID
- **THEN** system falls back to the configured default model
- **AND** system does not display the removed model as a picker option

#### Scenario: Removed model reaches the server action
- **WHEN** an analysis request supplies a removed or unknown model ID
- **THEN** system uses the configured default model for the Gemini request
- **AND** system does not send the removed or unknown ID to the Gemini API
