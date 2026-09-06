## ADDED Requirements

### Requirement: Authorize Dual mode separately from registered providers
The system SHALL treat `dual` as an explicitly gated generation selection that orchestrates Black Forest Labs and Midjourney without registering Dual mode as an image provider.

#### Scenario: Dual mode is available
- **WHEN** an authenticated user is in Test view
- **AND** client-visible provider overrides and Dual mode are enabled
- **THEN** the provider picker SHALL include a `Dual mode` option

#### Scenario: Server authorizes Dual mode
- **WHEN** a Test-mode generation or regeneration request selects `dual`
- **AND** server-side provider overrides and Dual mode are enabled
- **THEN** the system SHALL resolve an ordered Black Forest Labs and Midjourney orchestration

#### Scenario: Dual mode is not authorized
- **WHEN** a request selects `dual` while Test mode, server-side provider overrides, or the server-side Dual mode flag is disabled
- **THEN** the system SHALL reject the selection before invoking either provider

#### Scenario: Dual mode is hidden outside the trial
- **WHEN** the user is outside Test view or the client-visible Dual mode flag is disabled
- **THEN** the provider picker SHALL NOT display `Dual mode`

### Requirement: Preserve explicit selection semantics
The system SHALL distinguish an explicit Dual mode request from implicit cross-provider fallback.

#### Scenario: A Dual mode provider fails
- **WHEN** one provider fails during an authorized Dual mode request
- **THEN** the system SHALL still attempt the other provider as part of the original explicit selection
- **AND** the system SHALL NOT describe the second attempt as fallback

#### Scenario: A single provider fails
- **WHEN** a single registered provider was selected and fails
- **THEN** the system SHALL NOT invoke another provider
