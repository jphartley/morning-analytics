## ADDED Requirements

### Requirement: Generate comparable Dual mode image groups
The system SHALL submit the exact same image prompt to Black Forest Labs and Midjourney during an authorized Dual mode request and SHALL keep their results independently attributed.

#### Scenario: Both providers succeed
- **WHEN** Black Forest Labs and Midjourney each return a valid four-image set
- **THEN** the system SHALL return eight images in two provider result groups
- **AND** the Black Forest Labs group SHALL appear before the Midjourney group
- **AND** each group SHALL identify its provider and exact submitted prompt

#### Scenario: One provider fails
- **WHEN** exactly one provider returns a valid four-image set and the other provider fails
- **THEN** the system SHALL return the successful four-image group as a partial success
- **AND** the failed group SHALL identify its provider and a safe provider-specific error
- **AND** successful images SHALL remain eligible for upload and persistence

#### Scenario: Both providers fail
- **WHEN** neither provider returns a valid four-image set
- **THEN** the system SHALL return a failed Dual mode result containing both provider outcomes

### Requirement: Display provider-labelled generation results
The system SHALL render generated images in groups based on persisted or newly returned provider attribution.

#### Scenario: Fresh Dual mode result is displayed
- **WHEN** a Dual mode request returns provider result groups
- **THEN** the results page SHALL show a `Black Forest Labs` heading above its images
- **AND** the results page SHALL show a `Midjourney` heading above its images

#### Scenario: Partial result is displayed
- **WHEN** one Dual mode provider succeeds and the other fails
- **THEN** the results page SHALL show the successful provider's image block
- **AND** the results page SHALL show a provider-labelled failure state for the failed block

#### Scenario: Historical attributed result is displayed
- **WHEN** an analysis with persisted generation batches is loaded from history
- **THEN** the system SHALL reconstruct provider-labelled blocks from those batches
- **AND** it SHALL preserve generation-batch order within each provider's results

#### Scenario: Legacy result is displayed
- **WHEN** a historical analysis has image paths but no persisted generation batches
- **THEN** the system SHALL display its images with a neutral legacy label
- **AND** the system SHALL NOT infer provider attribution from path position
