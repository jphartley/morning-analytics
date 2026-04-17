## 1. Word Count Computation

- [x] 1.1 Add `wordCount` derived state to JournalInput that computes from the `value` prop using `split(/\s+/).filter(Boolean).length`
- [x] 1.2 Verify count updates on typing, pasting, and external value changes (history view)

## 2. Word Count Display

- [x] 2.1 Add word count text element between editor container and Analyze button
- [x] 2.2 Show "N words" with singular "1 word" form
- [x] 2.3 Style with `text-sm` and `tabular-nums` for stable width, right-aligned

## 3. Threshold Indicator

- [x] 3.1 Apply `text-ink-muted` when count < 300, `text-accent` when count >= 300
- [x] 3.2 Append "(auto-analyze ready)" text when count >= 300

## 4. Validation

- [x] 4.1 Run `npm run build` and `npm run lint` with no errors
- [x] 4.2 Verify no layout shift when word count digit count changes
