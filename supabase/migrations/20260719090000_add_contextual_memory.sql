-- Add user-scoped contextual memory, grounded evidence, and immutable analysis
-- context snapshots. Existing analyses remain valid with NULL memory_context.

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  retrieval_terms JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(retrieval_terms) = 'array'),
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  significance DOUBLE PRECISION NOT NULL CHECK (significance BETWEEN 0 AND 1),
  temporal_status TEXT NOT NULL CHECK (temporal_status IN ('active', 'inactive', 'uncertain')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memories_user_last_observed_idx
ON memories (user_id, last_observed_at DESC);

CREATE TABLE memory_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  source_entry_at TIMESTAMPTZ NOT NULL,
  excerpt TEXT NOT NULL CHECK (char_length(excerpt) BETWEEN 1 AND 800),
  effect TEXT NOT NULL CHECK (effect IN ('supports', 'revises', 'conflicts')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memory_evidence_memory_entry_idx
ON memory_evidence (memory_id, source_entry_at DESC);

CREATE INDEX memory_evidence_user_idx
ON memory_evidence (user_id);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SELECT: Users can view their own memories"
ON memories FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "INSERT: Users can create their own memories"
ON memories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "UPDATE: Users can update their own memories"
ON memories FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "DELETE: Users can delete their own memories"
ON memories FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "SELECT: Users can view their own memory evidence"
ON memory_evidence FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "INSERT: Users can create their own memory evidence"
ON memory_evidence FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM memories
    WHERE memories.id = memory_evidence.memory_id
      AND memories.user_id = auth.uid()
  )
  AND (
    source_analysis_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM analyses
      WHERE analyses.id = memory_evidence.source_analysis_id
        AND analyses.user_id = auth.uid()
    )
  )
);

CREATE POLICY "UPDATE: Users can update their own memory evidence"
ON memory_evidence FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM memories
    WHERE memories.id = memory_evidence.memory_id
      AND memories.user_id = auth.uid()
  )
  AND (
    source_analysis_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM analyses
      WHERE analyses.id = memory_evidence.source_analysis_id
        AND analyses.user_id = auth.uid()
    )
  )
);

CREATE POLICY "DELETE: Users can delete their own memory evidence"
ON memory_evidence FOR DELETE TO authenticated
USING (auth.uid() = user_id);

ALTER TABLE analyses
ADD COLUMN memory_context JSONB NULL
CHECK (memory_context IS NULL OR jsonb_typeof(memory_context) = 'array');

COMMENT ON COLUMN analyses.memory_context IS
  'Immutable snapshot of contextual memory IDs, versions, and summaries supplied to this analysis';
