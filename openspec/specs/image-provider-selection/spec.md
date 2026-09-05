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
The system SHALL select its deployment-default image provider using server-side configuration and SHALL use Midjourney/Discord as the configured normal-user default for this release.

#### Scenario: No request override is supplied
- **WHEN** an initial generation or regeneration request does not contain an allowed provider override
- **THEN** the system SHALL use the configured server-side deployment default

#### Scenario: Normal-user generation starts
- **WHEN** a user-role account generates initial or regenerated images
- **THEN** the system SHALL submit the request to the configured Midjourney/Discord provider
- **AND** it SHALL not send a browser-selected provider override

#### Scenario: Provider secrets remain server-side
- **WHEN** provider selection and configuration are returned to the browser
- **THEN** the system SHALL NOT expose Discord tokens, the Black Forest Labs API key, or other provider secrets

#### Scenario: Midjourney generation fails for a normal user
- **WHEN** the configured Midjourney/Discord attempt fails
- **THEN** the system SHALL show a user-safe retryable failure
- **AND** it SHALL NOT silently submit the request to Black Forest Labs, Mock, or another provider

### Requirement: Allow explicitly gated provider overrides in any view mode
The supported application flow SHALL expose provider override controls, including the dual-provider selection, only when the signed-in account resolves to the `admin` role, Test/Debug is active, and the applicable server and client feature gates are enabled. Once an administrator has selected an available override, the system SHALL submit that override in Quiet, Insights, and Test/Debug even though the control remains visible only in Test/Debug. Normal-user flows SHALL submit no provider override and SHALL use the deployment default. This requirement defines the role-aware product flow for the trusted-friends release; rejection of forged direct requests based on a server-verified role remains deferred to the separate server-session hardening change.

#### Scenario: Single-provider override is selected outside test view
- **WHEN** an administrator has a saved registered provider override and opens Quiet or Insights while override support is enabled
- **THEN** the system SHALL send the saved selection as a request override
- **AND** the system SHALL use the selected provider for that generation attempt
- **AND** the provider control SHALL remain hidden outside Test/Debug

#### Scenario: Dual selection is honored outside test view
- **WHEN** an administrator has a saved Dual selection and opens Quiet or Insights while provider override and Dual mode are enabled
- **THEN** the system SHALL submit the Dual request override
- **AND** the system SHALL resolve both `black-forest-labs` and `midjourney` for that attempt
- **AND** the Dual control SHALL remain hidden outside Test/Debug

#### Scenario: Override support is disabled
- **WHEN** a request supplies a provider override while server-side override support is disabled
- **THEN** the system SHALL ignore or reject the override according to the server contract
- **AND** the system SHALL NOT route the attempt to a provider other than the deployment default

#### Scenario: Dual is selected while dual mode is disabled
- **WHEN** an administrator in Test/Debug supplies the Dual selection while Dual mode is disabled on the server
- **THEN** the system SHALL reject the Dual request with an actionable configuration error
- **AND** the system SHALL NOT silently substitute a single provider and present it as a successful dual result

#### Scenario: Provider override control visibility
- **WHEN** provider override support is enabled
- **THEN** the system SHALL display the provider override control only to an administrator in enabled Test/Debug
- **AND** it SHALL not display the control to a normal user or in administrator Quiet or Insights

#### Scenario: Normal user loads with a stored provider override
- **WHEN** a user-role account has a stored registered provider or Dual selection
- **THEN** the normal-user UI SHALL not display or submit that selection
- **AND** it SHALL use the configured Midjourney/Discord default

#### Scenario: Administrator uses Test/Debug
- **WHEN** an administrator opens enabled Test/Debug with provider overrides enabled
- **THEN** the system SHALL show the available provider choices
- **AND** it SHALL show Dual only when the Dual-mode feature gate is enabled
- **AND** it SHALL submit the administrator's active selection as an override

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

### Requirement: Persist and restore provider selections independent of view mode
The system SHALL save an administrator's image-provider picker selection to browser localStorage and SHALL restore and apply it in Quiet, Insights, and Test/Debug whenever the selection is registered and available under the current provider registry and client feature flags. The picker SHALL remain visible only in enabled administrator Test/Debug. The system SHALL ignore stored provider selections for normal users without deleting them, and no stored preference SHALL bypass the existing server-controlled provider override gates.

#### Scenario: User changes the provider
- **WHEN** provider override support is enabled and an administrator selects a provider in Test/Debug
- **THEN** the system SHALL update the selected provider in page state
- **AND** the system SHALL save the selection to localStorage

#### Scenario: User returns with an available selection
- **WHEN** an administrator loads any view with a saved provider selection that is registered and available under the current client feature flags
- **THEN** the system SHALL restore that provider as the selected option
- **AND** it SHALL send the selection as a request override when the applicable override support is enabled

#### Scenario: Administrator leaves Test/Debug
- **WHEN** an administrator with a saved provider selection switches from Test/Debug to Quiet or Insights
- **THEN** the system SHALL retain and submit the saved selection when the applicable feature gates remain enabled
- **AND** it SHALL hide the provider picker outside Test/Debug

#### Scenario: Normal user returns with a saved selection
- **WHEN** a user-role account loads the app with a saved provider or Dual selection
- **THEN** the system SHALL ignore the selection without deleting it
- **AND** it SHALL not display or submit the selection
- **AND** generation SHALL use the configured Midjourney/Discord default

#### Scenario: Saved Dual mode is no longer enabled
- **WHEN** localStorage contains `dual` and the Dual mode client flag is disabled
- **THEN** the system SHALL use the deployment-derived default provider in page state
- **AND** the system SHALL NOT display or submit Dual mode

#### Scenario: Saved provider is invalid
- **WHEN** localStorage contains an unregistered or otherwise unavailable provider selection
- **THEN** the system SHALL use the deployment-derived default provider
- **AND** the system SHALL NOT throw an error or crash

#### Scenario: localStorage is unavailable
- **WHEN** browser localStorage cannot be read or written
- **THEN** the system SHALL use the deployment-derived default provider
- **AND** provider changes SHALL continue working for the current administrator Test/Debug session when the picker is available
- **AND** the system SHALL NOT throw an error or crash

#### Scenario: Override support is disabled
- **WHEN** provider override support is disabled
- **THEN** the system SHALL NOT display the provider picker or send its stored selection as a request override

### Requirement: Client and server SHALL agree on the deployment default provider
The system SHALL derive the client-side default-provider indicator from the same deployment configuration the server uses to resolve its deployment default, so that the client and server never disagree about which provider is the default. The client SHALL NOT rely on a separate configuration source that can diverge from the server default.

#### Scenario: Deployment default is configured
- **WHEN** the deployment configures a supported default provider
- **THEN** the client-side default-provider indicator SHALL equal the provider the server resolves as its deployment default

#### Scenario: Override detection uses the shared default
- **WHEN** the client decides whether the user's current selection differs from the deployment default in order to forward an override
- **THEN** the comparison SHALL use the same default value the server would resolve
- **AND** a selection equal to the server deployment default SHALL NOT be misclassified as an override
- **AND** a selection differing from the server deployment default SHALL be forwarded as an override when override support is enabled
