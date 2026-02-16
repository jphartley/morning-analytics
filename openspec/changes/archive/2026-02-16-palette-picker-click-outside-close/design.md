## Context

The `PalettePicker` component (`/app/components/PalettePicker.tsx`) renders a fixed-position toggle button at bottom-left and an expandable popup grid of palette swatches. Currently, the popup only closes when the user clicks the toggle button again. Standard popover UX expects click-outside-to-dismiss.

## Goals / Non-Goals

**Goals:**
- Add click-outside-to-dismiss behavior to the palette picker popup
- Maintain existing toggle button behavior (click to open/close)

**Non-Goals:**
- Changing popup styling, animation, or positioning
- Adding keyboard dismiss (Escape key) — could be a follow-up
- Refactoring the component structure

## Decisions

- **Use a `useRef` + `useEffect` with `mousedown` event listener**: This is the standard React pattern for click-outside detection. A `mousedown` listener on `document` checks if the click target is inside the container ref; if not, close the popup.
- **Wrap the entire PalettePicker (button + popup) in a single container div with a ref**: This ensures clicks on both the toggle button and the popup swatch grid are considered "inside" and don't trigger dismissal.
- **Use `mousedown` instead of `click`**: `mousedown` fires before `click`, giving a more responsive feel and avoiding edge cases with drag interactions.
- **Only attach the listener when `expanded` is true**: Avoids unnecessary global event listeners when the popup is closed.

## Risks / Trade-offs

- **Minimal risk**: This is a well-established UI pattern with no side effects on other components.
- **Event listener cleanup**: Must ensure the listener is removed on unmount and when `expanded` changes to `false`. The `useEffect` cleanup function handles this.
