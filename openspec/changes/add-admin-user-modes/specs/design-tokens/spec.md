## MODIFIED Requirements

### Requirement: Twenty switchable palette options
The system SHALL include 20 palette definitions in `globals.css`, selectable at runtime via a `data-palette` attribute on the `<html>` element. Inkwell SHALL be the first-use default palette, and each palette SHALL remain available to every user.

#### Scenario: Runtime palette switching
- **WHEN** the `data-palette` attribute is set on `<html>` to a valid palette ID
- **THEN** all CSS custom properties SHALL update to that palette's values
- **AND** all components SHALL reflect the new palette instantly without page reload

#### Scenario: First-use default palette
- **WHEN** the application loads and no palette preference is stored
- **THEN** the system SHALL apply the Inkwell palette before application content is shown

#### Scenario: Default palette
- **WHEN** no palette preference can be restored
- **THEN** the Inkwell palette SHALL be active

#### Scenario: All palette choices remain available
- **WHEN** a user opens the palette picker
- **THEN** the picker SHALL offer the existing twenty palette choices, including Inkwell

#### Scenario: All 20 palettes are available
- **WHEN** the CSS is loaded
- **THEN** the existing twenty palette IDs, including Inkwell and Reverie, SHALL be available

### Requirement: Palette selection persisted to localStorage
The system SHALL persist a user's palette selection to browser localStorage under the key `palette` and restore Inkwell when no valid selection exists.

#### Scenario: Palette persists across page loads
- **WHEN** a user chooses a palette and reloads the application in the same browser
- **THEN** the selected palette SHALL be restored

#### Scenario: No stored palette
- **WHEN** no palette is stored in localStorage
- **THEN** the Inkwell palette SHALL be used

#### Scenario: Clearing palette selection
- **WHEN** a user selects the Reverie palette
- **THEN** the system SHALL persist a value that restores Reverie without treating it as an absent preference

#### Scenario: Browser has no valid stored palette
- **WHEN** localStorage is unavailable, empty, or contains an unsupported palette value
- **THEN** the system SHALL use Inkwell without error
