## MODIFIED Requirements

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
