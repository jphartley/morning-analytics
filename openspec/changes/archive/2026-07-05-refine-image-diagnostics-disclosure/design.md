# Design

The diagnostics disclosure remains collapsed by default and stays near the generated image area, but its collapsed state is reduced to a compact icon so successful generations do not compete with the image grid.

When expanded, the component presents the same redacted diagnostic events in a more readable order:

1. A concise attempt summary.
2. A copy button for a paste-ready text report.
3. A timeline where each event starts with a plain-language interpretation.
4. The original raw event message and redacted metadata for debugging precision.

The copy payload mirrors the expanded interpretation and includes attempt metadata, status, summary, event meanings, raw messages, and redacted details. It intentionally does not add any new server-side diagnostic data.
