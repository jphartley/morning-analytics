# Memory Backlog

This document tracks ideas deliberately excluded from the initial memory experiment so the basic contextual-memory change can land first.

## High priority

### Tune memory quality based on the first real rebuild

The first successful real-data rebuild showed that the system is technically viable and can consolidate recurring subjects, but it is currently too confident and slightly too eager to retain or combine context. A tuning iteration should address the following observations:

- **Use smaller source blocks.** Prefer single-sentence evidence blocks so stored evidence does not include unrelated trailing observations.
- **Support multiple evidence blocks per operation.** Let a create or update reference a small bounded set, initially one to three block IDs, so every material claim in a synthesized summary can be traced to supporting original text.
- **Require evidence coverage for summaries.** Do not add specific people, relationships, events, or causal interpretations to a memory summary unless the selected evidence blocks support them.
- **Calibrate confidence.** Newly inferred or relational memories should begin uncertain or at moderate confidence unless the relationship or fact is explicit. Confidence should grow as later entries reinforce it rather than defaulting close to 90%.
- **Calibrate significance and creation thresholds.** Raise the bar for one-off plans, projects, and transient interests so the store does not accumulate minor context with uniformly high significance.
- **Keep each memory focused.** Avoid combining loosely related practices, emotions, physical symptoms, relationships, and life events into one broad record merely because they occurred in the same entry.
- **Prioritize prevailing emotions explicitly.** Persistent states such as unsafety, rumination, disquiet, relief, or happiness should be eligible for focused emotional-state memories instead of being absorbed into health or coping-practice records.
- **Preserve uncertainty around people.** Do not convert an inferred family or professional relationship into a confident fact when the evidence only establishes that a person recurs.
- **Clarify evidence effects.** Tighten the distinction between `supports`, `revises`, and `conflicts`; additional compatible detail should not automatically be labelled as a revision.

After these changes, reset and rebuild the same journal window and compare catalog size, average confidence/significance, evidence coverage, emotional-state recall, and the number of broad or unsupported summaries.

### Remember analyst suggestions and tasks

The initial memory system will learn only from the user's original stream-of-consciousness writing. It will not learn autobiographical facts, interpretations, or associations from AI-generated analyses.

A later experiment should evaluate retaining actions suggested by an analyst, such as follow-ups or tasks. These suggestions must remain in a separate memory category with explicit AI provenance. They must not become facts about the user's life unless supported by the user's later writing.

The experiment should test whether remembering these suggestions adds value without creating a feedback loop in which AI-generated interpretations become increasingly anchored in later analyses.

## Medium priority

### Correct and delete inferred memories

The initial experiment will provide a read-only memory view so the quality of automatic inference can be evaluated without manual intervention.

A later iteration should allow the user to correct inaccurate memories and delete irrelevant or inappropriate memories. The design must preserve provenance and distinguish user corrections from automatically inferred content.

## Low priority

### Define history-deletion and memory-retention semantics

Decide what happens to inferred memories and their supporting journal excerpts when an originating journal entry or analysis is deleted from History.

The policy remains intentionally unresolved. A future iteration should consider privacy expectations, evidence integrity, consolidated memories supported by multiple entries, and whether deletion should remove evidence, revise confidence, or remove an entire memory.

## Priority not yet assigned

### Weekly and monthly thematic summaries

A future iteration may use accumulated memories and journal evidence to summarize prevailing emotions, themes, events, and changes across a week or month.

This is separate from the initial feature, where memory acts only as a quiet contextual adjunct to a single daily analysis.

### Semantic retrieval pre-filter

The initial experiment sends the compact consolidated memory catalog directly to a dedicated AI relevance selector. If the catalog grows enough to create material latency, cost, or context-quality problems, add a high-recall lexical or vector pre-filter before AI reranking.
