# Phase 4 Setup – Tenant Browsing + Listing Detail + Saving

Phase 4 is implemented. Do this to get listings showing:

## 1. Run the seed migration

Adds 7 sample Bahrain listings (Rentals + Uni Hub). **Requires at least one user** in `profiles` (sign up first if needed).

**Supabase Dashboard → SQL Editor** – run:
```
supabase/migrations/20250201000007_seed_listings.sql
```

Or with CLI: `supabase db push` (runs all pending migrations including the seed).

## 2. Test locally

1. `npm run dev`
2. Visit `/discover` – Rentals and Uni Hub tabs, listing cards
3. Visit `/listing/[id]` – listing detail with Save, Chat, Book tour
4. Sign in and use Save – listings appear on `/saved`
5. Unsave via bookmark icon on card or detail page

## What’s included

- **Discover**: Rentals / Uni Hub feeds, Newest / Price sort, listing cards with save
- **Listing detail**: Image, details, Save / Chat / Book tour (Chat/Book tour link to `/messages`; full chat comes in Phase 5)
- **Saved page**: List of saved listings (requires sign in)
