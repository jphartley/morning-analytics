# Administrator and normal-user modes

Each authenticated account has a `profiles` row with one application role:
`user` or `admin`. New and existing accounts start as `user`. The role changes
the supported product experience; it does not grant an administrator access to
another person's journal data.

## Experiences

Normal users have Quiet and Insights, analyst selection, the browser-local
palette picker, journal analysis, images, history, regeneration, and deletion
of their own analyses. Their defaults are Inkwell, Quiet, Jungian Analyst,
Gemini 3.1 Pro Preview, the configured Midjourney/Discord provider, and no
contextual memory.

Administrators retain Quiet, Insights, and enabled Test/Debug. Model selection
is available in Insights and Test/Debug. Provider overrides, mock controls,
memory experiments, diagnostics, reset, and rebuild are available only in
enabled Test/Debug. A valid saved administrator provider override remains
active in every administrator view while its picker is hidden outside
Test/Debug.

## Promote an existing account in Supabase

After applying the profiles migration, use the Supabase SQL Editor while signed
in as an authorized project operator. First locate the account without exposing
or storing its email in source code:

```sql
SELECT id, email
FROM auth.users
WHERE email = '<account-email>';
```

Then promote only the intended profile ID returned above:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<account-id>'
  AND role = 'user';
```

Verify the result:

```sql
SELECT id, role
FROM public.profiles
WHERE id = '<account-id>';
```

Role promotion is data-only and does not require an application deployment.
The promoted person should refresh the application or sign out and back in to
resolve the changed role. To revoke, update that profile's role to `user`.

## Security boundary

The first release resolves this role in the browser to choose product controls.
It is not server-verified role authorization and does not make crafted direct
server-action requests tamper-proof. Existing Supabase RLS continues to isolate
ordinary authenticated access to a person's own analyses, memories, and
evidence. Supabase project owners and service-role holders are trusted
operators who can bypass those ordinary row-level restrictions.

## Migration verification

Run the following count check as a project operator immediately after applying
the migration. It must return zero missing profiles and zero duplicate IDs:

```sql
SELECT
  (SELECT count(*) FROM auth.users u
   LEFT JOIN public.profiles p ON p.id = u.id
   WHERE p.id IS NULL) AS missing_profiles,
  (SELECT count(*) - count(DISTINCT id) FROM public.profiles) AS duplicate_profiles;
```

Then use two ordinary authenticated browser sessions to confirm that each can
read only its own profile and its own analyses, memories, and evidence. Attempt
to change the signed-in user's `profiles.role` from the browser; it must be
rejected because no insert, update, or delete policy exists. Confirm that an
account with existing analyses or contextual memory retains those records after
receiving the default `user` role; the migration only adds profiles and does not
alter journal, memory, or evidence tables.
