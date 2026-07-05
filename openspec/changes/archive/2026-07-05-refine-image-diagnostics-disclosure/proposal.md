# Refine Image Diagnostics Disclosure

## Why

The image-generation diagnostics disclosure works, but the collapsed state still consumes too much visual space, the expanded trace is too technical to understand at a glance, and copying the trace for debugging requires manual selection.

## What Changes

- Replace the collapsed diagnostics text row with a tiny icon-only status affordance.
- Add plain-language explanations to each diagnostic event while preserving the raw redacted details.
- Add a copy action that produces a neat, paste-ready diagnostic report for follow-up debugging.

## Impact

- Capability: `app-shell`
- Capability: `image-generation-diagnostics`
- UI-only implementation change in `app/components/ImageGenerationDiagnosticsDisclosure.tsx`
