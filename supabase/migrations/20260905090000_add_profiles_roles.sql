-- Add a durable application role for the role-aware product experience.
-- Application administrators retain ordinary user-scoped data access; this table
-- does not grant access to another person's analyses, memories, or evidence.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "SELECT: Users can view their own profile" ON public.profiles;
CREATE POLICY "SELECT: Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_profile_after_auth_user_insert ON auth.users;
CREATE TRIGGER create_profile_after_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Existing valid profiles remain untouched. Missing accounts receive the safe
-- normal-user role, making the migration repeatable without duplicate rows.
INSERT INTO public.profiles (id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
