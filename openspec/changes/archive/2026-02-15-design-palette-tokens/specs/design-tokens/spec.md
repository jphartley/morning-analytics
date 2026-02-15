## ADDED Requirements

### Requirement: Centralized color palette via CSS custom properties

The system SHALL define all UI colors as CSS custom properties in `globals.css` under `:root`, registered as Tailwind theme colors via `@theme inline`. Components SHALL reference these as Tailwind utility classes (e.g., `bg-page`, `text-ink`, `border-outline`) instead of hardcoded color classes.

#### Scenario: Palette tokens are defined

- **WHEN** the application loads
- **THEN** the following CSS custom properties are available: `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--accent-hover`, `--accent-soft`, `--border`
- **THEN** the following Tailwind utilities are generated: `bg-page`, `bg-surface`, `text-ink`, `text-ink-muted`, `bg-accent`, `bg-accent-hover`, `bg-accent-soft`, `border-outline`

#### Scenario: Components use tokens

- **WHEN** any component renders
- **THEN** it uses Tailwind token utilities (e.g., `bg-page`, `text-ink`) instead of hardcoded color classes (e.g., `bg-stone-100`, `text-stone-800`)

### Requirement: Twenty switchable palette options

The system SHALL include 20 palette definitions in `globals.css`, selectable at runtime via a `data-palette` attribute on the `<html>` element. The default palette (no attribute) SHALL be "Reverie" (violet). Each alternate palette SHALL be defined as `:root[data-palette="<id>"]`.

#### Scenario: Runtime palette switching

- **WHEN** the `data-palette` attribute is set on `<html>` to a valid palette ID
- **THEN** all CSS custom properties update to that palette's values
- **THEN** all components reflect the new palette instantly without page reload

#### Scenario: Default palette

- **WHEN** no `data-palette` attribute is present on `<html>`
- **THEN** the Reverie palette is active (`--bg: #faf8f6`, `--accent: #7c3aed`)

#### Scenario: All 20 palettes are available

- **WHEN** the CSS is loaded
- **THEN** the following palette IDs are available: (default), moss, inkwell, dusk-rose, amber-den, sage, plum, terracotta, ocean, lavender, sepia, nordic, cherry, forest, copper, twilight, matcha, slate-coral, midnight, sandstorm

### Requirement: User-facing palette picker

The system SHALL display a floating `PalettePicker` component on all pages (including auth pages) that allows users to switch between palettes. The picker SHALL appear in the bottom-left corner of the viewport.

#### Scenario: Picker displays current palette

- **WHEN** the page loads
- **THEN** the picker shows a compact button with the current palette's accent color dot and name

#### Scenario: Picker expands to show all palettes

- **WHEN** user clicks the picker button
- **THEN** a grid of 20 palette swatches expands upward with a "Choose your palette" title
- **THEN** the current palette is indicated with a checkmark and white ring

#### Scenario: User switches palette

- **WHEN** user clicks a palette swatch in the picker
- **THEN** the palette changes instantly across the entire app

### Requirement: Palette selection persisted to localStorage

The system SHALL persist the user's palette selection to browser localStorage under the key `palette`. On page load, the stored palette SHALL be applied automatically.

#### Scenario: Palette persists across page loads

- **WHEN** user selects a palette and reloads the page
- **THEN** the previously selected palette is restored from localStorage

#### Scenario: No stored palette

- **WHEN** no palette is stored in localStorage
- **THEN** the default Reverie palette is used

#### Scenario: Clearing palette selection

- **WHEN** user selects the default Reverie palette
- **THEN** the `palette` key is removed from localStorage
