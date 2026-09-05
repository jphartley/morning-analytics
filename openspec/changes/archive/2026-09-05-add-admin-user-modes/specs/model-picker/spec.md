## MODIFIED Requirements

### Requirement: Display model selection options
The system SHALL display a model picker with the three current Gemini text-model options only to administrators in Insights and Test/Debug, with each option showing its display name and trade-off description. The system SHALL hide the picker in administrator Quiet while preserving and applying the selected administrator model. The system SHALL not display model selection to normal users and SHALL use Gemini 3.1 Pro Preview for their analyses.

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3.6 Flash | `gemini-3.6-flash` | Strong, efficient analysis |
| Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | Fastest, lowest-cost answers |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | Most advanced reasoning; default |

#### Scenario: User views model options in insight or test mode
- **WHEN** an administrator opens the model picker dropdown while in Insights or Test/Debug
- **THEN** the system SHALL display exactly the three current Gemini model options with their display names and descriptions
- **AND** the system SHALL not display the removed `gemini-3.1-flash-lite` or `gemini-3.5-flash` options
- **AND** the model picker SHALL be positioned alongside the analyst persona picker and view-density control in the header

#### Scenario: User is in quiet mode
- **WHEN** an administrator views the page header while in Quiet
- **THEN** the system SHALL hide the model picker
- **AND** it SHALL preserve and apply the currently selected administrator model for analysis

#### Scenario: Normal user views either available mode
- **WHEN** a user-role account views Quiet or Insights
- **THEN** the model picker SHALL not render
- **AND** the next analysis SHALL use `gemini-3.1-pro-preview`

#### Scenario: Administrator views Insights or Test/Debug
- **WHEN** an administrator opens Insights or Test/Debug
- **THEN** the system SHALL display the existing supported model options alongside the analyst and view controls

#### Scenario: Administrator views Quiet
- **WHEN** an administrator selects Quiet
- **THEN** the system SHALL hide the model picker while preserving and applying the selected administrator model

### Requirement: Default model selection
The system SHALL use `gemini-3.1-pro-preview` when a normal user analyzes text and when an administrator has no saved model preference.

#### Scenario: First-time user sees default
- **WHEN** an administrator loads the app with no saved model preference
- **THEN** the system SHALL display Gemini 3.1 Pro Preview as the selected model

#### Scenario: No saved model preference
- **WHEN** an applicable account submits a new entry without a supported saved model selection
- **THEN** the Gemini request SHALL use `gemini-3.1-pro-preview` with its configured thinking level

### Requirement: Persist model selection
The system SHALL save an administrator's model selection to localStorage under the key `gemini-model` and SHALL restore and apply a supported saved administrator selection in every administrator view. The system SHALL ignore a stored model selection for a normal user without deleting it.

#### Scenario: User changes model selection
- **WHEN** an administrator selects a different model from the picker in Insights or Test/Debug
- **THEN** the system SHALL save the model ID to localStorage key `gemini-model`

#### Scenario: User returns to app
- **WHEN** an administrator loads the app with a previously saved model preference for a currently supported model
- **THEN** the system SHALL restore and apply the saved model in Quiet, Insights, and Test/Debug
- **AND** the picker SHALL display it as selected whenever the picker is visible

#### Scenario: Normal user returns with a stored model preference
- **WHEN** a user-role account loads the app with a supported or unsupported model ID stored under `gemini-model`
- **THEN** the system SHALL ignore the stored selection without deleting it
- **AND** the system SHALL use `gemini-3.1-pro-preview` for analysis

### Requirement: Pass model selection to analysis
The supported application flow SHALL pass the active administrator model ID to the `analyzeText` server action in every administrator view. For a normal user, it SHALL pass `gemini-3.1-pro-preview` regardless of any browser-stored model preference.

#### Scenario: Analysis uses selected model
- **WHEN** an administrator submits journal text for analysis in Quiet, Insights, or Test/Debug
- **THEN** the system SHALL call `analyzeText` with the currently selected administrator model ID
- **AND** the Gemini API call SHALL use that model ID

#### Scenario: Normal-user analysis uses the fixed model
- **WHEN** a user-role account submits journal text for analysis in Quiet or Insights
- **THEN** the system SHALL call `analyzeText` with `gemini-3.1-pro-preview`
- **AND** the Gemini API call SHALL use `gemini-3.1-pro-preview` with its configured thinking level
