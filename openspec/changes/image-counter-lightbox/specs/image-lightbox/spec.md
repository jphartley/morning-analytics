## ADDED Requirements

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
