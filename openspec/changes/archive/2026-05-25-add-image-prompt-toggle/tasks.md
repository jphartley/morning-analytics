## 1. Prompt Disclosure Component

- [x] 1.1 Create a reusable `ImagePromptDisclosure` client component that accepts an `imagePrompt` string.
- [x] 1.2 Implement collapsed-by-default reveal/hide behavior with accessible button labels.
- [x] 1.3 Display the revealed prompt in a styled, wrapping block using existing design-token classes.
- [x] 1.4 Add a clipboard copy control for the revealed prompt with graceful failure handling.

## 2. Page Integration

- [x] 2.1 Render `ImagePromptDisclosure` below the fresh analysis image grid when `currentImagePrompt` exists.
- [x] 2.2 Render `ImagePromptDisclosure` below the history image grid when `historyViewData.imagePrompt` exists.
- [x] 2.3 Preserve existing regeneration controls and spacing below the image grid.

## 3. Verification

- [x] 3.1 Run lint/build checks required by the queue handoff.
- [ ] 3.2 Manually verify fresh analysis prompt reveal, hide, default collapsed state, and copy behavior.
- [ ] 3.3 Manually verify history prompt reveal, hide, default collapsed state, and copy behavior.
- [ ] 3.4 Verify no prompt toggle renders when no image prompt is available.
