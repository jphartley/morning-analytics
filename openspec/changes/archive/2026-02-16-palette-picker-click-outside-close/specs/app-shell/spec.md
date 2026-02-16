## ADDED Requirements

### Requirement: Dismiss palette picker popup on outside click

The system SHALL close the palette picker popup when the user clicks anywhere outside the popup and its toggle button.

#### Scenario: Click outside closes popup

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks anywhere outside the popup container and toggle button
- **THEN** the popup SHALL close

#### Scenario: Click inside popup does not close it

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks on a palette swatch or inside the popup area
- **THEN** the popup SHALL remain open

#### Scenario: Toggle button still works

- **WHEN** the palette picker popup is expanded
- **AND** the user clicks the toggle button
- **THEN** the popup SHALL close (existing toggle behavior preserved)
