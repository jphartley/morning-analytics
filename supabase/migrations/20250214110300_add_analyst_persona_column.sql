-- Add analyst_persona column to analyses table
-- This column tracks which analyst persona was used for each analysis
-- Default NULL for backwards compatibility with existing analyses

ALTER TABLE analyses ADD COLUMN analyst_persona TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN analyses.analyst_persona IS 'The analyst persona used for this analysis (jungian, mel-robbins, loving-parent)';
