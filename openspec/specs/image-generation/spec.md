## Purpose

Define provider-neutral image generation, normalized storage output, and provider-specific Midjourney capture behavior.
## Requirements
### Requirement: Normalize provider image output before storage
The system SHALL normalize output from every registered image provider into the same four-image application contract before shared storage and response handling.

#### Scenario: Provider returns a successful image set
- **WHEN** the selected provider returns exactly four supported images
- **THEN** the system SHALL upload the four images through the shared Supabase storage path
- **AND** the system SHALL return four displayable images and their storage paths

#### Scenario: Provider returns an invalid image set
- **WHEN** the selected provider returns an unsupported content type, empty image data, or an unexpected image count
- **THEN** the system SHALL reject the image set before reporting success
- **AND** diagnostics SHALL identify output normalization as the failure stage

### Requirement: Generate images with the selected provider
The system SHALL send an image prompt to the provider resolved for the current attempt and SHALL return the generated images without changing the selected provider during that attempt.

#### Scenario: Midjourney generation succeeds
- **WHEN** Midjourney is selected and its Discord workflow captures a completed grid
- **THEN** the system SHALL split the grid and return four normalized images according to the existing Midjourney requirements

#### Scenario: Black Forest Labs generation succeeds
- **WHEN** Black Forest Labs is selected and its four image slots complete successfully
- **THEN** the system SHALL return four normalized images without invoking Discord or grid splitting

#### Scenario: Mock generation succeeds
- **WHEN** mock is selected
- **THEN** the system SHALL return four local fixture images without invoking an external image provider

#### Scenario: Selected provider fails
- **WHEN** the selected provider returns a terminal failure or timeout
- **THEN** the system SHALL return an error attributed to that provider
- **AND** the system SHALL NOT automatically invoke another provider

### Requirement: Capture Midjourney response

The system SHALL listen for Midjourney's response, extract the grid image, and split it into 4 separate images.

#### Scenario: Generation completes

- **WHEN** Midjourney posts the completed image grid
- **THEN** system fetches the grid image from Discord CDN
- **THEN** system splits the image into 4 quadrants (dividing width and height by 2)
- **THEN** system returns 4 separate image URLs or data

#### Scenario: Split handles variable aspect ratios

- **WHEN** Midjourney returns a grid with non-square aspect ratio
- **THEN** system correctly calculates quadrant dimensions based on actual image width and height

#### Scenario: Generation timeout

- **WHEN** Midjourney does not respond within the timeout period
- **THEN** system returns a timeout error

### Requirement: Handle Discord errors

The system SHALL handle Discord connection and API errors gracefully.

#### Scenario: Discord unavailable

- **WHEN** Discord connection fails or user token is invalid
- **THEN** system returns an error message indicating the image service is unavailable

### Requirement: Recover missed Discord completion messages

The system SHALL attempt a bounded recent-message lookup in the configured Discord channel when the live gateway listener does not observe a completed Midjourney grid.

#### Scenario: Gateway event is missed
- **WHEN** Midjourney has posted a completed image grid in the configured channel after the generation attempt started
- **AND** the live gateway listener does not capture the completion event
- **THEN** the system SHALL inspect a bounded set of recent channel messages for a matching completed Midjourney grid
- **THEN** the system SHALL use the recovered grid image when a matching candidate is found

#### Scenario: Recovery finds no matching message
- **WHEN** neither the live gateway listener nor the bounded recent-message lookup finds a completed Midjourney grid
- **THEN** the system SHALL return an image generation failure with diagnostics that identify the listener/recovery stage

### Requirement: Correlate Midjourney completions conservatively

The system SHALL avoid accepting unrelated Midjourney image messages as the result for the current generation attempt.

#### Scenario: Candidate messages are filtered
- **WHEN** inspecting live or recently fetched Discord messages
- **THEN** the system SHALL only consider messages from the Midjourney bot in the configured channel
- **THEN** the system SHALL prefer messages created after the generation attempt start time
- **THEN** the system SHALL require a completed-grid shape with at least one image attachment or embed

#### Scenario: Prompt context is available
- **WHEN** prompt context can be compared safely
- **THEN** the system SHALL use a redacted prompt snippet or hash to prefer the candidate associated with the current attempt

### Requirement: Report Discord handoff failures clearly

The system SHALL return actionable image-generation errors when Discord trigger, listener, recovery, fetch, split, or upload stages fail.

#### Scenario: Channel handoff fails
- **WHEN** the prompt trigger succeeds but no usable Midjourney grid is captured from the configured channel
- **THEN** the system SHALL return an error that distinguishes capture failure from trigger failure
- **THEN** the diagnostics SHALL include redacted configured channel context and latest inspected candidate counts when available

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
The system SHALL render generated images in groups based on persisted or newly returned provider attribution. It SHALL show a provider heading above an image group only when the admin image-provider picker is available in the current view; otherwise, it SHALL render the image grid directly without a provider heading or its reserved heading space.

#### Scenario: Fresh Dual mode result is displayed
- **WHEN** a Dual mode request returns provider result groups
- **AND** the admin image-provider picker is available in the current view
- **THEN** the results page SHALL show a `Black Forest Labs` heading above its images
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
