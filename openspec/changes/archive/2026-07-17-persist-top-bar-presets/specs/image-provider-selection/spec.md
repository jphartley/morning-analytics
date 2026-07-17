## ADDED Requirements

### Requirement: Persist only currently available test-mode provider selections

The system SHALL save the user's image-provider picker selection to browser localStorage and SHALL restore it only when that selection is available under the current provider registry and client feature flags. This preference SHALL NOT bypass the existing server-controlled provider override authorization.

#### Scenario: User changes the test-mode provider
- **WHEN** provider override support is enabled and a user selects a provider in test mode
- **THEN** system updates the selected provider in page state
- **AND** system saves the selection to localStorage

#### Scenario: User returns with an available provider selection
- **WHEN** user loads the app with a saved provider selection that is registered and available under the current client feature flags
- **THEN** system restores that provider as the selected test-mode option
- **AND** system sends it only for an image-generation request that satisfies the existing test-mode override conditions

#### Scenario: Saved Dual mode is no longer enabled
- **WHEN** localStorage contains `dual` and the Dual mode client flag is disabled
- **THEN** system uses the deployment-derived default provider in page state
- **AND** system does not display or submit Dual mode

#### Scenario: Saved provider is invalid
- **WHEN** localStorage contains an unregistered or otherwise unavailable provider selection
- **THEN** system uses the deployment-derived default provider
- **AND** system does not throw an error or crash

#### Scenario: localStorage is unavailable
- **WHEN** browser localStorage cannot be read or written
- **THEN** system uses the deployment-derived default provider
- **AND** provider changes continue working for the current session when the picker is available
- **AND** system does not throw an error or crash

#### Scenario: Override UI is not active
- **WHEN** the user is outside test mode or provider override support is disabled
- **THEN** system does not display the provider picker or send its stored selection as a request override
