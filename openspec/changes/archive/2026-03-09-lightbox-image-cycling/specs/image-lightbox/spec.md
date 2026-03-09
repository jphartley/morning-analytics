## ADDED Requirements

### Requirement: Navigate between images with arrow buttons

The system SHALL display previous and next arrow buttons flanking the main image in the lightbox backdrop area.

#### Scenario: Click next arrow

- **WHEN** lightbox is open and user clicks the next (right) arrow button
- **THEN** system displays the next image in the set with a crossfade transition

#### Scenario: Click previous arrow

- **WHEN** lightbox is open and user clicks the previous (left) arrow button
- **THEN** system displays the previous image in the set with a crossfade transition

### Requirement: Navigate between images with keyboard arrows

The system SHALL allow navigating between images using left and right keyboard arrow keys.

#### Scenario: Press right arrow key

- **WHEN** lightbox is open and user presses the right arrow key
- **THEN** system displays the next image in the set with a crossfade transition

#### Scenario: Press left arrow key

- **WHEN** lightbox is open and user presses the left arrow key
- **THEN** system displays the previous image in the set with a crossfade transition

### Requirement: Wrapping navigation cycle

The system SHALL wrap navigation so that advancing past the last image returns to the first, and going before the first image returns to the last.

#### Scenario: Next from last image

- **WHEN** lightbox is showing the last image and user navigates next
- **THEN** system displays the first image

#### Scenario: Previous from first image

- **WHEN** lightbox is showing the first image and user navigates previous
- **THEN** system displays the last image

### Requirement: Crossfade transition between images

The system SHALL apply a subtle crossfade transition (~150ms) when switching between images via any navigation method.

#### Scenario: Image transition

- **WHEN** user navigates to a different image (via arrows or keyboard)
- **THEN** the current image fades out and the new image fades in over approximately 150 milliseconds

### Requirement: Opaque backdrop

The system SHALL display a fully opaque black backdrop when the lightbox is open, hiding the UI behind it.

#### Scenario: Backdrop hides UI

- **WHEN** lightbox is open
- **THEN** the backdrop SHALL be fully opaque black
- **THEN** the page content behind the lightbox SHALL NOT be visible

## MODIFIED Requirements

### Requirement: View image in lightbox

The system SHALL display a full-size image in a modal overlay when clicked, with access to the full set of generated images for navigation.

#### Scenario: Open lightbox

- **WHEN** user clicks on an image in the grid
- **THEN** system displays a modal overlay with that image at full size
- **THEN** system provides navigation controls to cycle through all images in the set
