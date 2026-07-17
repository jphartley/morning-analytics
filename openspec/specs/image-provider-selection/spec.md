# image-provider-selection Specification

## Purpose
Define strict, server-controlled selection and isolation of supported image-generation providers.
## Requirements
### Requirement: Resolve image generation through a strict provider registry
The system SHALL resolve image generation through a registry containing exactly the supported provider identifiers `mock`, `midjourney`, and `black-forest-labs`.

#### Scenario: Supported deployment provider is configured
- **WHEN** the server starts an image generation attempt with a supported deployment-default provider
- **THEN** the system SHALL resolve the matching provider adapter
- **AND** the system SHALL record the resolved provider on the attempt diagnostics

#### Scenario: Unsupported provider is configured
- **WHEN** the configured provider identifier is not registered
- **THEN** the system SHALL reject image generation with an actionable configuration error
- **AND** the system SHALL NOT silently fall back to Midjourney, Black Forest Labs, or mock generation

### Requirement: Keep the deployment default server-controlled
The system SHALL select its deployment-default image provider using server-side configuration.

#### Scenario: No request override is supplied
- **WHEN** an initial generation or regeneration request does not contain an allowed provider override
- **THEN** the system SHALL use the configured server-side deployment default

#### Scenario: Provider secrets remain server-side
- **WHEN** provider selection and configuration are returned to the browser
- **THEN** the system SHALL NOT expose Discord tokens, the Black Forest Labs API key, or other provider secrets

### Requirement: Allow explicitly gated test-mode provider overrides
The system SHALL allow a request-level provider override only when provider override support is explicitly enabled by server configuration.

#### Scenario: Test override is enabled
- **WHEN** an authenticated user in test mode selects a registered provider
- **AND** server-side provider override support is enabled
- **THEN** the system SHALL use the selected provider for that generation attempt
- **AND** the system SHALL show the selected provider in test-mode diagnostics

#### Scenario: Test override is disabled
- **WHEN** a request supplies a provider override while server-side override support is disabled
- **THEN** the system SHALL ignore or reject the override according to the server contract
- **AND** the system SHALL NOT route the attempt to an unauthorized provider

#### Scenario: Quiet or insight mode is active
- **WHEN** provider override support is enabled but the user is not in test mode
- **THEN** the system SHALL NOT display the provider override control

### Requirement: Keep provider selection immutable within an attempt
The system SHALL resolve the provider once when an image generation attempt begins and SHALL use that provider for the complete attempt.

#### Scenario: Configuration changes during generation
- **WHEN** deployment configuration changes after an attempt has started
- **THEN** the running attempt SHALL continue with its originally resolved provider

#### Scenario: Provider attempt is retried internally
- **WHEN** a provider adapter performs a bounded retry for a transient error
- **THEN** the retry SHALL use the same provider and model as the original attempt

### Requirement: Isolate provider configuration
The system SHALL validate only the configuration required by the provider selected for the current attempt.

#### Scenario: Black Forest Labs is selected
- **WHEN** Black Forest Labs is selected and its required API key is missing
- **THEN** the attempt SHALL fail with a Black Forest Labs configuration error before submitting generation work
- **AND** missing Discord configuration SHALL NOT affect this validation

#### Scenario: Midjourney is selected
- **WHEN** Midjourney is selected and its required Discord configuration is present
- **THEN** missing Black Forest Labs configuration SHALL NOT prevent the Midjourney attempt

### Requirement: Do not perform implicit cross-provider fallback
The system SHALL NOT automatically submit an attempt to another provider after the resolved provider fails.

#### Scenario: Midjourney capture fails
- **WHEN** a Midjourney attempt fails after Discord accepts the prompt
- **THEN** the system SHALL report the Midjourney failure
- **AND** the system SHALL NOT automatically create Black Forest Labs requests

#### Scenario: Black Forest Labs generation fails
- **WHEN** a Black Forest Labs attempt reaches a terminal failure
- **THEN** the system SHALL report the Black Forest Labs failure
- **AND** the system SHALL NOT automatically trigger Midjourney

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

