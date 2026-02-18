## MODIFIED Requirements

### Requirement: App header layout

The app header SHALL use increased vertical padding (`py-5`) to accommodate the header logo image at a natural display height. The header SHALL contain the logo image and "Morning Analytics" text link on the left, and user email with sign-out button on the right.

#### Scenario: Header displays with logo and increased height

- **WHEN** an authenticated user views any page with the AppHeader
- **THEN** the header SHALL have `py-5` padding (increased from `py-3`)
- **THEN** the left side SHALL show the logo image followed by the "Morning Analytics" text
- **THEN** the right side SHALL show user email and sign-out button
