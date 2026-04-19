## Context

The app has a multi-phase UI state machine: idle → analyzing → text-ready → complete. Currently, content panels (AnalysisPanel, ImageGrid) appear instantly when their state activates. There is no transition between the loading spinner and the content. The LoadingState component already uses fade transitions for its rotating messages, but content panels have no mount animation.

Components are simple React functional components styled with Tailwind CSS and design token classes. The existing `globals.css` defines palette tokens but no animation keyframes.

## Goals / Non-Goals

**Goals:**
- Smooth fade-in (with subtle upward slide) when AnalysisPanel mounts at the "text-ready" transition
- Same animation when ImageGrid mounts at the "complete" transition
- Animation duration of 200–300ms — subtle, not slow
- Zero layout shift — final position must match current static position

**Non-Goals:**
- Exit/fade-out animations when content is replaced or removed
- Animation for history view loads (only fresh analysis transitions)
- Staggered or per-element animations within panels
- Third-party animation library (framer-motion, react-spring, etc.)

## Decisions

### CSS `@keyframes` animation vs. React state-driven transition

**Choice:** CSS `@keyframes` with a utility class applied on mount.

**Rationale:** A CSS-only approach is simpler, has zero JS overhead, and works immediately on mount without needing a two-render state flip (`opacity-0` → `opacity-100`). The `animation` property plays automatically when the element enters the DOM. React state-driven transitions would require a `useEffect` to flip state after mount, adding complexity for no benefit.

**Alternative considered:** Tailwind's `transition-*` utilities require a state change to trigger — they animate between states, not on mount. A `@keyframes` animation fires once on mount, which is exactly the behavior needed.

### Animation definition location

**Choice:** Define a `@keyframes fadeInUp` in `globals.css` and expose it via a Tailwind utility class `animate-fade-in-up` using `@theme inline`.

**Rationale:** Keeps the animation reusable and consistent with the project's existing Tailwind-based styling. Other components could use the same class in the future. Defining it in globals.css alongside the design tokens is the natural location.

### Animation parameters

**Choice:** 300ms duration, ease-out timing, opacity 0→1 with translateY 8px→0.

**Rationale:** 300ms is at the upper end of "subtle" — long enough to be perceived as smooth, short enough not to feel sluggish. Ease-out (fast start, slow finish) feels natural for content appearing. The 8px vertical shift is minimal but provides directional context — the content feels like it "settles into place" rather than just fading.

## Risks / Trade-offs

- **Reduced motion preference**: Users with `prefers-reduced-motion: reduce` should not see the animation. → Mitigation: Wrap the keyframe in a `@media` query or disable it via a Tailwind `motion-reduce:` modifier so the animation is skipped for accessibility.
- **Flash of invisible content**: If CSS loads late, elements using the animation might briefly be invisible (opacity: 0 at animation start). → Mitigation: The animation is `forwards` fill-mode and the keyframe starts at opacity 0, but since Next.js inlines critical CSS this is not a practical concern.
