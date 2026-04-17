## 1. Word Count Computation

- [ ] 1.1 Add `wordCount` derived state to JournalInput that computes from the `value` prop using `split(/\s+/).filter(Boolean).length`
- [ ] 1.2 Verify count updates on typing, pasting, and external value changes (history view)

## 2. Word Count Display

- [ ] 2.1 Add word count text element between editor container and Analyze button
- [ ] 2.2 Show "N words" with singular "1 word" form
- [ ] 2.3 Style with `text-sm` and `tabular-nums` for stable width, right-aligned

## 3. Threshold Indicator

- [ ] 3.1 Apply `text-ink-muted` when count < 300, `text-accent` when count >= 300
- [ ] 3.2 Append "(auto-analyze ready)" text when count >= 300

## 4. Validation

- [ ] 4.1 Run `npm run build` and `npm run lint` with no errors
- [ ] 4.2 Verify no layout shift when word count digit count changes
