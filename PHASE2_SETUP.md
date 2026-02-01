# Phase 2 Setup – Auth + Profiles

Phase 2 is implemented. Complete these steps before testing:

## 1. Run the database migration

Create the `profiles` table and auth trigger in Supabase:

**Option A: Supabase Dashboard**
1. Open your [Supabase project](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250201000000_create_profiles.sql`
4. Paste and run the SQL

**Option B: Supabase CLI**
```bash
supabase db push
```

## 2. Configure auth redirect URLs (if using email confirmation)

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (local dev)
   - Your production URL + `/auth/callback` when deploying

## 3. Optional: Disable email confirmation for local testing

In Supabase Dashboard → **Authentication** → **Providers** → **Email**:
- Turn off **Confirm email** if you want immediate sign-in without confirmation

## 4. Optional: Next.js 16 proxy (middleware deprecation)

Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. The app still works with `middleware.ts`. To migrate later:
- Rename `middleware.ts` → `proxy.ts`
- Change export `middleware` → `proxy`

## Test locally

1. Run `npm run dev`
2. Sign up at `/signup`
3. Sign in at `/login`
4. Profile page shows your info and role switcher (once you have agent/landlord roles)
5. Visiting `/agent`, `/landlord`, `/dashboard`, `/m2`, or `/moderation` while logged out redirects to `/login`
