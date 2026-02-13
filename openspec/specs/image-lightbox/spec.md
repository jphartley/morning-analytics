## ADDED Requirements

### Requirement: View image in lightbox

The system SHALL display a full-size image in a modal overlay when clicked.

#### Scenario: Open lightbox

- **WHEN** user clicks on an image in the grid
- **THEN** system displays a modal overlay with the image at full size

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
