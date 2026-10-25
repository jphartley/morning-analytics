BEGIN;

-- Server-allocated identities remain reserved after a journal is deleted.
CREATE TABLE public.analysis_resources (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'complete', 'failed', 'legacy')),
  image_paths text[] NOT NULL DEFAULT '{}',
  image_generation_batches jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(image_generation_batches) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);
ALTER TABLE public.analysis_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analysis_resources FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.analysis_resources TO authenticated;
GRANT ALL ON public.analysis_resources TO service_role;
CREATE POLICY "Owners can read resource allocations" ON public.analysis_resources
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

INSERT INTO public.analysis_resources (id, user_id, state)
SELECT id, user_id, 'legacy' FROM public.analyses;

ALTER TABLE public.analyses ADD CONSTRAINT analyses_allocated_owner_fk
  FOREIGN KEY (id, user_id) REFERENCES public.analysis_resources (id, user_id);

CREATE FUNCTION public.preserve_analysis_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Analysis identity cannot be changed' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preserve_analysis_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER preserve_analysis_identity BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.preserve_analysis_identity();

-- Restrictive policies also constrain any pre-existing permissive owner policies.
CREATE POLICY "Live memory requires current administrator role" ON public.memories
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ))
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));
CREATE POLICY "Live evidence requires current administrator role" ON public.memory_evidence
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ))
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) AND EXISTS (
    SELECT 1 FROM public.memories parent
    WHERE parent.id = memory_evidence.memory_id AND parent.user_id = (SELECT auth.uid())
  ) AND (source_analysis_id IS NULL OR EXISTS (
    SELECT 1 FROM public.analyses source
    WHERE source.id = memory_evidence.source_analysis_id AND source.user_id = (SELECT auth.uid())
  )));
REVOKE ALL ON public.memories, public.memory_evidence FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;

-- Public URL reads remain unchanged; ordinary clients cannot mutate these objects.
CREATE POLICY "Analysis image inserts use authorized server adapter" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (bucket_id <> 'analysis-images');
CREATE POLICY "Analysis image updates use authorized server adapter" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'analysis-images') WITH CHECK (bucket_id <> 'analysis-images');
CREATE POLICY "Analysis image deletes use authorized server adapter" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (bucket_id <> 'analysis-images');

COMMIT;
