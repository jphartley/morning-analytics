-- Preserve provider and per-attempt prompt provenance for generated images.
-- Existing rows intentionally remain an empty array: their provider cannot be
-- inferred safely from flat image path ordering.
ALTER TABLE analyses
ADD COLUMN image_generation_batches JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN analyses.image_generation_batches IS
  'Versioned provider generation attempts with prompt provenance and image paths';
