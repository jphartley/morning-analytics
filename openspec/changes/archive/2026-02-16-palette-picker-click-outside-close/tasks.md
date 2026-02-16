## 1. Add click-outside-to-dismiss to PalettePicker

- [x] 1.1 In `/app/components/PalettePicker.tsx`, add a `useRef` import and create a ref for the outer container div that wraps both the popup and toggle button.
- [x] 1.2 Add a `useEffect` that attaches a `mousedown` event listener on `document` when `expanded` is `true`. The handler checks if the click target is outside the container ref, and if so, sets `expanded` to `false`. Clean up the listener when `expanded` becomes `false` or on unmount.
- [x] 1.3 Attach the ref to the outermost `<div>` (the `fixed bottom-4 left-4 z-50` container).

## 2. Verify behavior

- [x] 2.1 Verify: clicking a palette swatch selects it and the popup stays open.
- [x] 2.2 Verify: clicking outside the popup (e.g., on the page body) closes it.
- [x] 2.3 Verify: clicking the toggle button still toggles the popup open/closed.
