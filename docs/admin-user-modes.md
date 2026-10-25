# Administrator and normal-user modes

Each authenticated account has a `profiles` row with one application role:
`user` or `admin`. New accounts and accounts without a profile start as `user`;
existing valid role assignments are preserved. The role changes
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
The next protected action reads the current persisted role independently of
browser UI state, so server-side revocation does not require a new login.

## Security boundary

The browser resolves the role to choose product controls. Every protected server
action also verifies the session and loads the current persisted profile role;
forged browser roles do not grant capabilities. Both application roles remain
limited to their own analyses. Live contextual memory and evidence additionally
require the administrator role, including direct authenticated database access.
Normal users' existing live memories remain dormant, while their own historical
analysis snapshots remain readable. Supabase project owners and service-role
holders remain trusted operators outside the application-role boundary.

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
read only its own profile and analyses. Normal users must have no live memory or
evidence access; administrators may access only their own live memory/evidence. Attempt
to change the signed-in user's `profiles.role` from the browser; it must be
rejected because no insert, update, or delete policy exists. Confirm that an
account with existing analyses or contextual memory retains those records after
receiving the default `user` role; the migration only adds profiles and does not
alter journal, memory, or evidence tables.
