## Why

The palette picker popup ("Choose your palette") only closes when the user clicks the toggle button itself (e.g., "Forest"). Users expect to be able to click anywhere outside the popup to dismiss it — standard behavior for popover/dropdown UI. This is a usability friction point.

## What Changes

- Add click-outside-to-dismiss behavior to the PalettePicker component's expanded popup
- When the popup is open and the user clicks anywhere outside the popup and its toggle button, the popup closes

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `app-shell`: The palette picker is part of the app shell UI. Its dismiss behavior is a UX requirement change.

## Impact

- **Code**: `/app/components/PalettePicker.tsx` — add a `useRef` + click-outside event listener
- **No API, dependency, or schema changes**
- **No breaking changes**
