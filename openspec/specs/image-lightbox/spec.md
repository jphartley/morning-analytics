## ADDED Requirements

### Requirement: View image in lightbox

The system SHALL display a full-size image in a modal overlay when clicked, with access to the full set of generated images for navigation.

#### Scenario: Open lightbox

- **WHEN** user clicks on an image in the grid
- **THEN** system displays a modal overlay with that image at full size
- **THEN** system provides navigation controls to cycle through all images in the set

### Requirement: Close lightbox

The system SHALL allow closing the lightbox by clicking outside or pressing Escape.

#### Scenario: Close by clicking backdrop

- **WHEN** lightbox is open and user clicks outside the image
- **THEN** system closes the lightbox and returns to normal view

#### Scenario: Close by pressing Escape

- **WHEN** lightbox is open and user presses Escape key
- **THEN** system closes the lightbox and returns to normal view

### Requirement: Prevent background scroll

The system SHALL prevent page scrolling while the lightbox is open.

#### Scenario: Body scroll locked

- **WHEN** lightbox is open
- **THEN** page body does not scroll
- **THEN** scroll is restored when lightbox closes

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

### Requirement: Display position indicator in lightbox

The system SHALL display a position indicator showing the current image number and total count (e.g., "2 of 4") at the bottom center of the lightbox overlay.

#### Scenario: Position indicator visible on open

- **WHEN** the lightbox is opened on any image
- **THEN** a position indicator SHALL be displayed at the bottom center of the lightbox
- **THEN** the indicator SHALL show the format "{current} of {total}" (e.g., "1 of 4")

#### Scenario: Counter updates on navigation

- **WHEN** the user navigates to a different image via arrow buttons or keyboard
- **THEN** the position indicator SHALL update to reflect the new current position

#### Scenario: Readable over any image

- **WHEN** the lightbox is displaying any image (light or dark)
- **THEN** the position indicator SHALL use a semi-transparent background to remain readable
