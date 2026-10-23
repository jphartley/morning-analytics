# Spec Delta

## MODIFIED Requirements

### Requirement: Generate comparable Dual mode image groups
The system SHALL submit the exact same image prompt to the configured trial candidate and Midjourney during an authorized Dual mode request and SHALL keep their results independently attributed.

#### Scenario: Both providers succeed
- **WHEN** the configured trial candidate and Midjourney each return a valid four-image set
- **THEN** the system SHALL return eight images in two provider result groups
- **AND** the trial-candidate group SHALL appear before the Midjourney group
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
The system SHALL render generated images in groups based on persisted or newly returned provider attribution. It SHALL show a provider heading above an image group only when the admin image-provider picker is available in the current view; otherwise, it SHALL render the image grid directly without a provider heading or its reserved heading space.

#### Scenario: Fresh Dual mode result is displayed
- **WHEN** a Dual mode request returns provider result groups
- **AND** the admin image-provider picker is available in the current view
- **THEN** the results page SHALL show the configured trial candidate's provider heading above its images
- **AND** the results page SHALL show a `Midjourney` heading above its images

#### Scenario: Fresh single-provider result is displayed with the provider picker
- **WHEN** a single-provider request returns an image result group
- **AND** the admin image-provider picker is available in the current view
- **THEN** the results page SHALL show that group's provider heading above its images

#### Scenario: Standard user views a generated image group
- **WHEN** the admin image-provider picker is not available in the current view
- **AND** a generated image group has one or more images
- **THEN** the results page SHALL render the image grid without a provider heading
- **AND** it SHALL NOT reserve vertical space for a provider heading

#### Scenario: Image generation is pending
- **WHEN** image generation is in progress
- **THEN** the results page SHALL render generation progress without a `Generated Images` heading
- **AND** it SHALL NOT reserve vertical space for that heading

#### Scenario: Partial result is displayed
- **WHEN** one Dual mode provider succeeds and the other fails
- **THEN** the results page SHALL show the successful provider's image block
- **AND** the results page SHALL show a provider-labelled failure state for the failed block

#### Scenario: Historical attributed result is displayed
- **WHEN** an analysis with persisted generation batches is loaded from history
- **AND** the admin image-provider picker is available in the current view
- **THEN** the system SHALL reconstruct provider-labelled blocks from those batches
- **AND** it SHALL preserve generation-batch order within each provider's results

#### Scenario: Historical attributed result is displayed for a standard user
- **WHEN** an analysis with persisted generation batches is loaded from history
- **AND** the admin image-provider picker is not available in the current view
- **THEN** the system SHALL preserve generation-batch order within the displayed image groups
- **AND** it SHALL render each non-empty image grid without a provider heading

#### Scenario: Legacy result is displayed
- **WHEN** a historical analysis has image paths but no persisted generation batches
- **THEN** the system SHALL display its images with a neutral legacy label only when the admin image-provider picker is available
- **AND** it SHALL display the same images without a heading when the picker is unavailable
- **AND** the system SHALL NOT infer provider attribution from path position

#### Scenario: Disabled-provider images are displayed
- **WHEN** a historical analysis contains BFL or mixed BFL/Midjourney batches and BFL is disabled for new generation
- **THEN** all previously stored images SHALL remain displayable in their existing order
- **AND** the system SHALL preserve their stored provider attribution and exact per-batch prompt
- **AND** headings SHALL continue to follow the current picker-visibility rule
- **AND** loading history SHALL NOT require BFL credentials or invoke BFL

