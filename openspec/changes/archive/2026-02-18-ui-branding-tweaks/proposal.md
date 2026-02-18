## Why

The app currently uses default placeholder branding — no logo, a generic tagline, and the default Next.js favicon. Adding custom branding (logo images, updated tagline, favicon) gives the app a polished, cohesive identity across all pages.

## What Changes

- **Tagline update**: Change subtitle from "AI-powered insights from your morning pages" to "Insights From Your Morning Pages" on the main page
- **Favicon**: Replace default `favicon.ico` with custom 32x32 PNG (watercolor pen-and-sunrise motif)
- **Header logo**: Add a logo image (472x100) to the `AppHeader` bar, positioned between the "New Analysis" button and the "Morning Analytics" title text. Increase header padding to accommodate the logo at natural size.
- **Auth page logo**: Add full-size logo (1000x579) above the sign-in and sign-up forms
- **Metadata**: Update the `<meta>` description in `layout.tsx` to align with the new tagline

## Capabilities

### New Capabilities
- `branding`: Logo placement, favicon, and tagline text across all app surfaces

### Modified Capabilities
- `app-shell`: Header layout changes (increased height, logo image added) and tagline text update

## Impact

- **Files modified**: `app/app/page.tsx`, `app/components/AppHeader.tsx`, `app/app/layout.tsx`, `app/app/(auth)/signin/page.tsx`, `app/app/(auth)/signup/page.tsx`
- **Files added**: `app/public/logo-header.png`, `app/public/logo-full.png`, `app/app/favicon.ico` (replaced)
- **No API, dependency, or schema changes**
