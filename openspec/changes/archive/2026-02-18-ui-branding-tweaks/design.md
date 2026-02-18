## Context

The app uses default/placeholder branding. Three custom logo images have been provided (favicon 32x32, header bar 472x100, full-size 1000x579) with a watercolor pen-and-sunrise motif. The tagline needs updating from "AI-powered insights from your morning pages" to "Insights From Your Morning Pages".

## Goals / Non-Goals

**Goals:**
- Add custom branding (favicon, header logo, auth page logo) across all surfaces
- Update the tagline to the approved text
- Increase header bar size to accommodate the logo at natural proportions
- Keep the layout clean and consistent with existing design token system

**Non-Goals:**
- Responsive logo variants (mobile-specific sizes) — not addressing now
- Dark mode logo variants — current images work on all palettes (transparent PNG)
- Updating the "New Analysis" button or sidebar — those stay as-is

## Decisions

1. **Image file locations**: Place `logo-header.png` and `logo-full.png` in `app/public/`. Replace existing `app/app/favicon.ico` with the new PNG favicon (Next.js App Router supports `favicon.ico` or `icon.png` in the `app/` directory).

2. **Header logo placement**: In `AppHeader.tsx`, add the header logo image to the left side, inline with the "Morning Analytics" text link. Display at natural aspect ratio with a height of roughly 48-56px (the 472x100 source scales cleanly). Increase header padding from `py-3` to `py-4` or `py-5` to give the taller logo breathing room.

3. **Auth page logo placement**: Add the full-size logo centered above the form card on both signin and signup pages. Display at `max-w-xs` (320px width) to keep it proportional within the max-w-md card layout.

4. **Favicon approach**: Use Next.js App Router convention — place a `icon.png` file in `app/app/` directory. Remove the old `favicon.ico`.

5. **Tagline**: Simple text replacement in `page.tsx`. Capitalize as "Insights From Your Morning Pages".

6. **Metadata description**: Update to "Insights from your morning pages" (sentence case for meta tags, distinct from the title-case display tagline).

## Risks / Trade-offs

- **Image file size**: The full-size logo is 1000x579 which should be acceptable for a one-time auth page load. No optimization needed for MVP.
- **Header height increase**: Slightly reduces vertical content space. Acceptable trade-off for proper branding.
- **No SVG versions**: Using PNG means no infinite scaling, but at the provided resolutions this is fine for current viewport targets.
