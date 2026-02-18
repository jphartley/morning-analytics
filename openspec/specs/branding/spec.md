### Requirement: Display favicon

The app SHALL use a custom favicon (32x32 PNG) placed at `app/app/icon.png` using the Next.js App Router file convention.

#### Scenario: Favicon visible in browser tab

- **WHEN** user loads any page of the application
- **THEN** the browser tab SHALL display the custom watercolor pen-and-sunrise favicon

### Requirement: Display header logo in app header

The app header SHALL display the header logo image (`logo-header.png`) on the left side, inline with the "Morning Analytics" text. The logo SHALL be rendered as a Next.js `Image` component with appropriate alt text.

#### Scenario: Header logo visible on authenticated pages

- **WHEN** an authenticated user views any page with the AppHeader
- **THEN** the header SHALL display the logo image to the left of the "Morning Analytics" text
- **THEN** the logo SHALL maintain its natural aspect ratio

### Requirement: Display full-size logo on auth pages

The sign-in and sign-up pages SHALL display the full-size logo image (`logo-full.png`) centered above the form card.

#### Scenario: Logo on sign-in page

- **WHEN** user views the sign-in page
- **THEN** the full-size logo SHALL be displayed centered above the sign-in form
- **THEN** the logo width SHALL NOT exceed `max-w-xs` (320px)

#### Scenario: Logo on sign-up page

- **WHEN** user views the sign-up page
- **THEN** the full-size logo SHALL be displayed centered above the sign-up form
- **THEN** the logo width SHALL NOT exceed `max-w-xs` (320px)

### Requirement: Display tagline on main page

The main page SHALL display the tagline "Insights From Your Morning Pages" in Title Case below the "Morning Analytics" heading.

#### Scenario: Tagline text

- **WHEN** user views the main analysis page
- **THEN** the subtitle text SHALL read "Insights From Your Morning Pages"
