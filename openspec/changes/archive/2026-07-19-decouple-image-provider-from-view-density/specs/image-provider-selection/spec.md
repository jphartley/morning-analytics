## ADDED Requirements

### Requirement: Allow explicitly gated provider overrides in any view mode
The system SHALL allow a request-level provider override — including the dual-provider selection — whenever provider override support is explicitly enabled by server configuration, independent of the active view-density mode. Authorization for an override SHALL depend only on server-side feature flags, never on a client-supplied view-mode or test-mode signal.

#### Scenario: Single-provider override is selected outside test view
- **WHEN** provider override support is enabled and an authenticated user selects a registered provider while in quiet or insight mode
- **THEN** the system SHALL use the selected provider for that generation attempt
- **AND** the system SHALL record the resolved provider on the attempt diagnostics

#### Scenario: Dual selection is honored outside test view
- **WHEN** provider override support and dual mode are both enabled on the server and the user has selected the dual provider option while in any view mode
- **THEN** the system SHALL resolve both `black-forest-labs` and `midjourney` for that attempt
- **AND** the system SHALL tag both resolved providers as override-sourced in diagnostics

#### Scenario: Override support is disabled
- **WHEN** a request supplies a provider override while server-side override support is disabled
- **THEN** the system SHALL ignore or reject the override according to the server contract
- **AND** the system SHALL NOT route the attempt to a provider other than the deployment default

#### Scenario: Dual is selected while dual mode is disabled
- **WHEN** a request supplies the dual selection while dual mode is disabled on the server
- **THEN** the system SHALL reject the dual request with an actionable configuration error
- **AND** the system SHALL NOT silently substitute a single provider and present it as a successful dual result

#### Scenario: Provider override control visibility
- **WHEN** provider override support is enabled
- **THEN** the system SHALL display the provider override control regardless of the active view-density mode

### Requirement: Persist and restore provider selections independent of view mode
The system SHALL save the user's image-provider picker selection to browser localStorage and SHALL restore it whenever that selection is registered and available under the current provider registry and client feature flags. Restoration SHALL NOT be conditioned on the active view-density mode, and this preference SHALL NOT bypass the existing server-controlled provider override authorization.

#### Scenario: User changes the provider
- **WHEN** provider override support is enabled and a user selects a provider
- **THEN** the system SHALL update the selected provider in page state
- **AND** the system SHALL save the selection to localStorage

#### Scenario: User returns with an available selection
- **WHEN** a user loads the app with a saved provider selection that is registered and available under the current client feature flags
- **THEN** the system SHALL restore that provider as the selected option in any view mode
- **AND** the system SHALL send it as a request override whenever override support is enabled

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
- **AND** provider changes SHALL continue working for the current session when the picker is available
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

## REMOVED Requirements

### Requirement: Allow explicitly gated test-mode provider overrides
**Reason**: Overrides are no longer scoped to test view. Authorization now depends solely on server feature flags in any view mode, so the test-mode-scoped requirement (including its "quiet or insight mode hides the control" scenario) is replaced by "Allow explicitly gated provider overrides in any view mode".
**Migration**: No data migration. Behavior change only: the provider picker is now shown, and a selected override forwarded, whenever `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` (and `IMAGE_PROVIDER_DUAL_MODE_ENABLED` for dual) are set on the server, regardless of view-density mode.

### Requirement: Persist only currently available test-mode provider selections
**Reason**: Persistence and restoration are no longer conditioned on test mode; the replacement requirement "Persist and restore provider selections independent of view mode" restores a saved selection in any view mode.
**Migration**: No data migration. Existing saved selections in localStorage remain valid and are now restored regardless of view-density mode, subject to registry validity and client feature flags.
