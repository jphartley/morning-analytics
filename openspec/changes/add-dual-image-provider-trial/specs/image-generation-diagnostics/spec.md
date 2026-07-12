## ADDED Requirements

### Requirement: Return diagnostics for every Dual mode provider attempt
The system SHALL create and return an independent redacted diagnostic trace for each provider attempted by a Dual mode request.

#### Scenario: Dual mode starts
- **WHEN** an authorized Dual mode generation or regeneration request begins
- **THEN** Black Forest Labs and Midjourney SHALL each receive a fresh distinct attempt ID and provider-specific diagnostics recorder

#### Scenario: Both attempts complete
- **WHEN** both Dual mode provider attempts finish
- **THEN** the response SHALL contain both diagnostic traces in Black Forest Labs then Midjourney order
- **AND** each trace SHALL retain its own provider, status, timing, events, and summary

#### Scenario: One attempt fails
- **WHEN** one Dual mode provider fails and the other succeeds
- **THEN** the response SHALL include the completed diagnostic trace for both attempts
- **AND** the failed trace SHALL identify its failure stage without exposing sensitive data

### Requirement: Display Dual mode diagnostics per provider
The system SHALL present Dual mode diagnostic traces as separate provider attempts in Test view.

#### Scenario: User opens Dual mode diagnostics
- **WHEN** Dual mode diagnostics are available in Test view
- **THEN** the disclosure SHALL distinguish the Black Forest Labs and Midjourney attempts
- **AND** copied diagnostic output SHALL contain both redacted traces without merging their timelines
