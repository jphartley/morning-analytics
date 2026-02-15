-- Add user_id column and RLS policies for authentication
-- This migration prepares the analyses table for multi-user support with data isolation

-- Step 1: Add user_id UUID column (NOT NULL for production)
ALTER TABLE analyses ADD COLUMN user_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Step 2: Delete all existing analyses (breaking change - no backfill)
-- These are pre-authentication demo records with no user context
DELETE FROM analyses;

-- Step 3: Make user_id required going forward (drop default after cleanup)
ALTER TABLE analyses ALTER COLUMN user_id DROP DEFAULT;

-- Step 4: Enable RLS on analyses table
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for data isolation

-- SELECT: Users can only read their own analyses
CREATE POLICY "SELECT: Users can view their own analyses"
ON analyses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can only create analyses with their own user_id
CREATE POLICY "INSERT: Users can create analyses with their user_id"
ON analyses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own analyses
CREATE POLICY "UPDATE: Users can update their own analyses"
ON analyses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own analyses
CREATE POLICY "DELETE: Users can delete their own analyses"
ON analyses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: Service role key (used by server actions) bypasses RLS by design.
-- This allows `saveAnalysis()` to write with user_id from auth.uid() without triggering policies.
