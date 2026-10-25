# image-provider-selection Specification

## Purpose
Define strict, server-controlled selection and isolation of supported image-generation providers.

## Requirements

### Requirement: Resolve image generation through a strict provider registry
The system SHALL resolve image generation through a registry containing the known provider identifiers `mock`, `midjourney`, and `black-forest-labs`. The system SHALL distinguish known identities from providers available for new generation; Black Forest Labs SHALL be unavailable unless explicitly selected as the active trial candidate and server-side override support is enabled.

#### Scenario: Supported deployment provider is configured
- **WHEN** the server starts an image generation attempt with a registered and available deployment-default provider
- **THEN** the system SHALL resolve the matching provider adapter
- **AND** the system SHALL record the resolved provider on the attempt diagnostics

#### Scenario: Unsupported provider is configured
- **WHEN** the configured provider identifier is not registered
- **THEN** the system SHALL reject image generation with an actionable configuration error
- **AND** the system SHALL NOT silently fall back to Midjourney, Black Forest Labs, or mock generation

#### Scenario: Disabled provider is configured as the deployment default
- **WHEN** the deployment default names Black Forest Labs while no authorized BFL trial is active
- **THEN** the system SHALL return an actionable configuration error before invoking any image provider
- **AND** it SHALL NOT silently substitute Midjourney or mock generation

#### Scenario: Disabled provider is requested directly
- **WHEN** a generation request explicitly selects Black Forest Labs while it is unavailable
- **THEN** the server SHALL reject the selection before provider credential validation or external generation calls
- **AND** old override or Dual flags alone SHALL NOT enable it

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
The supported application flow SHALL expose provider override controls, including the dual-provider selection, only when the signed-in account resolves to the `admin` role, Test/Debug is active, an active trial candidate is available, and the server gates are enabled and browser availability is derived from those gates. Once an administrator has selected an available override, the system SHALL submit that override in Quiet, Insights, and Test/Debug even though the control remains visible only in Test/Debug. Normal-user flows SHALL submit no provider override and SHALL use the deployment default. The server SHALL additionally verify the current administrator capability before accepting an override, including crafted direct requests, under the server-action authorization contract.

#### Scenario: Single-provider override is selected outside test view
- **WHEN** an administrator has a saved registered and available provider override and opens Quiet or Insights while override support is enabled
- **THEN** the system SHALL send the saved selection as a request override
- **AND** the system SHALL use the selected provider for that generation attempt
- **AND** the provider control SHALL remain hidden outside Test/Debug

#### Scenario: Dual selection is honored outside test view
- **WHEN** an administrator has a saved Dual selection and opens Quiet or Insights while the configured trial candidate, provider override, and Dual mode are enabled
- **THEN** the system SHALL submit the Dual request override
- **AND** the system SHALL resolve the configured trial candidate followed by `midjourney` for that attempt
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
- **WHEN** provider override support is enabled and an authorized trial candidate is available
- **THEN** the system SHALL display the provider override control only to an administrator in enabled Test/Debug
- **AND** it SHALL not display the control to a normal user or in administrator Quiet or Insights

#### Scenario: Normal user loads with a stored provider override
- **WHEN** a user-role account has a stored registered provider or Dual selection
- **THEN** the normal-user UI SHALL not display or submit that selection
- **AND** it SHALL use the configured Midjourney/Discord default

#### Scenario: Administrator uses Test/Debug
- **WHEN** an administrator opens enabled Test/Debug with provider overrides enabled and an authorized trial candidate available
- **THEN** the system SHALL show the available provider choices
- **AND** it SHALL show Dual only when the Dual-mode feature gate is enabled and both comparison providers are available
- **AND** it SHALL submit the administrator's active selection as an override

#### Scenario: No trial is active
- **WHEN** no trial candidate is configured or server-side trial override support is disabled
- **THEN** the system SHALL hide the provider picker and Dual choice in every view, including administrator Test/Debug
- **AND** normal application generation SHALL use the deployment default
- **AND** unrelated Test/Debug controls SHALL remain governed by their existing settings

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
- **WHEN** Black Forest Labs is enabled as the trial candidate, selected, and its required API key is missing
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
The system SHALL save an administrator's image-provider picker selection to browser localStorage and SHALL restore and apply it in Quiet, Insights, and Test/Debug whenever the selection is registered and available under the current authorized trial configuration and derived browser configuration. The picker SHALL remain visible only in enabled administrator Test/Debug. The system SHALL ignore stored provider selections for normal users without deleting them, and no stored preference SHALL bypass the existing server-controlled provider override gates.

#### Scenario: User changes the provider
- **WHEN** provider override support is enabled and an administrator selects a provider in Test/Debug
- **THEN** the system SHALL update the selected provider in page state
- **AND** the system SHALL save the selection to localStorage

#### Scenario: User returns with an available selection
- **WHEN** an administrator loads any view with a saved provider selection that is registered and available under the current authorized trial configuration and derived browser configuration
- **THEN** the system SHALL restore that provider as the selected option
- **AND** it SHALL send the selection as a request override when the applicable override support is enabled

#### Scenario: Administrator leaves Test/Debug
- **WHEN** an administrator with a saved provider selection switches from Test/Debug to Quiet or Insights
- **THEN** the system SHALL retain and submit the saved selection when the selection remains available and the applicable feature gates remain enabled
- **AND** it SHALL hide the provider picker outside Test/Debug

#### Scenario: Normal user returns with a saved selection
- **WHEN** a user-role account loads the app with a saved provider or Dual selection
- **THEN** the system SHALL ignore the selection without deleting it
- **AND** it SHALL not display or submit the selection
- **AND** generation SHALL use the configured Midjourney/Discord default

#### Scenario: Saved Dual mode is no longer enabled
- **WHEN** localStorage contains `dual` and the trial candidate is unavailable or the derived Dual availability is false
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

#### Scenario: Saved BFL selection outlives the trial
- **WHEN** an administrator loads Quiet, Insights, or Test/Debug with a saved BFL selection while BFL is disabled
- **THEN** the system SHALL use the deployment-derived default for page state, image-cap calculations, initial generation, and regeneration
- **AND** it SHALL NOT send the unavailable stored selection as an override
- **AND** it SHALL NOT delete historical BFL image batches

### Requirement: Client and server SHALL agree on the deployment default provider
The system SHALL derive the client-side default-provider indicator from the same deployment configuration the server uses to resolve its deployment default, so that the client and server never disagree about which provider is the default. The client SHALL NOT rely on a separate configuration source that can diverge from the server default. The canonical setting SHALL be IMAGE_GENERATION_PROVIDER, defaulting to Midjourney when unset; NEXT_PUBLIC_IMAGE_PROVIDER SHALL NOT be read.

#### Scenario: Deployment default is configured
- **WHEN** the deployment configures a supported default provider
- **THEN** the client-side default-provider indicator SHALL equal the provider the server resolves as its deployment default

#### Scenario: Override detection uses the shared default
- **WHEN** the client decides whether the user's current selection differs from the deployment default in order to forward an override
- **THEN** the comparison SHALL use the same default value the server would resolve
- **AND** a selection equal to the server deployment default SHALL NOT be misclassified as an override
- **AND** a selection differing from the server deployment default SHALL be forwarded as an override when override support is enabled

#### Scenario: Legacy public default is set alone
- **WHEN** IMAGE_GENERATION_PROVIDER is unset and NEXT_PUBLIC_IMAGE_PROVIDER names mock or BFL
- **THEN** both client and server SHALL default to Midjourney
- **AND** the removed legacy variable SHALL NOT influence provider selection

### Requirement: Authorize Dual mode separately from registered providers
The system SHALL treat `dual` as an explicitly gated generation selection that orchestrates the explicitly configured available trial candidate followed by Midjourney without registering Dual mode as an image provider.

#### Scenario: Dual mode is available
- **WHEN** an administrator is in Test/Debug
- **AND** derived browser configuration enables provider overrides and Dual mode and an authorized trial candidate is available
- **THEN** the provider picker SHALL include a `Dual mode` option

#### Scenario: Server authorizes Dual mode
- **WHEN** an administrator generation or regeneration request selects `dual`
- **AND** server-side provider overrides and Dual mode are enabled and an authorized trial candidate is available
- **THEN** the system SHALL resolve an ordered trial-candidate and Midjourney orchestration resolved once for the complete round

#### Scenario: Dual mode is not authorized
- **WHEN** a request selects `dual` while server-side provider overrides or the server-side Dual mode flag is disabled, or the trial candidate is missing or unavailable
- **THEN** the system SHALL reject the selection before invoking either provider

#### Scenario: Dual mode is hidden outside the trial
- **WHEN** the user is outside Test view or the derived Dual availability is false or the trial candidate is unavailable
- **THEN** the provider picker SHALL NOT display `Dual mode`

#### Scenario: Trial candidate configuration is invalid
- **WHEN** a trial selection is requested with an unknown candidate or with Midjourney or mock configured as its own experimental candidate
- **THEN** the system SHALL reject the trial selection with an actionable configuration error before invoking either provider
- **AND** it SHALL NOT infer Black Forest Labs as a default candidate

### Requirement: Preserve explicit selection semantics
The system SHALL distinguish an explicit Dual mode request from implicit cross-provider fallback.

#### Scenario: A Dual mode provider fails
- **WHEN** one provider fails during an authorized Dual mode request
- **THEN** the system SHALL still attempt the other provider as part of the original explicit selection
- **AND** the system SHALL NOT describe the second attempt as fallback

#### Scenario: A single provider fails
- **WHEN** a single registered provider was selected and fails
- **THEN** the system SHALL NOT invoke another provider

### Requirement: Default image trials to dormant
The system SHALL treat an omitted or empty trial candidate as no active trial. Server-side availability SHALL govern new generation independently of historical provider identity and retained adapter code.

#### Scenario: Dormant deployment has no BFL credentials
- **WHEN** Midjourney or mock is the deployment default, no trial candidate is configured, and BFL credentials are absent
- **THEN** application startup and generation SHALL NOT require BFL credentials
- **AND** neither initial generation nor regeneration SHALL invoke BFL

#### Scenario: Browser configuration is stale
- **WHEN** an old browser presents BFL or Dual as available after the server has disabled the trial
- **THEN** the server SHALL reject the unavailable explicit selection before invoking any image provider
- **AND** client-side visibility SHALL NOT authorize generation

### Requirement: Derive trial visibility from server configuration
The system SHALL derive public trial availability from the server candidate and override/Dual gates. Operators SHALL NOT need separate public override or Dual flags. Removed public settings SHALL NOT enable or suppress trial availability.

#### Scenario: Authorized trial is enabled
- **WHEN** an available candidate and server override support are configured
- **THEN** the browser SHALL receive derived candidate availability
- **AND** its Dual choice SHALL reflect the server Dual gate without a separately configured public flag

#### Scenario: Retired public flags disagree
- **WHEN** old public override or Dual settings disagree with server configuration
- **THEN** only server-derived metadata SHALL control browser trial choices
- **AND** the server SHALL independently validate each requested selection

### Requirement: Keep dormant adapter modules unloaded
The system SHALL retain the BFL adapter while loading its module only when an authorized BFL attempt is invoked.

#### Scenario: Dormant application runs
- **WHEN** the app resolves or generates Midjourney/mock images or reads historical BFL batches
- **THEN** it SHALL NOT load the BFL adapter module or require its credentials

#### Scenario: Authorized candidate is invoked
- **WHEN** an authorized BFL attempt starts generation
- **THEN** the system SHALL load the retained adapter and apply its existing credential and generation contract
