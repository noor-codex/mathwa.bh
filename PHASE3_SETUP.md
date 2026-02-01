# Phase 3 Setup – Database Schema + RLS

Phase 3 migrations create the full database schema. Run them in order.

## Migrations (in order)

1. `20250201000000_create_profiles.sql` (Phase 2 – already run)
2. `20250201000001_create_agencies.sql` – agencies, agency_staff, referral codes, credit wallets
3. `20250201000002_create_listings.sql` – listings, listing_media, saved_listings
4. `20250201000003_create_chat.sql` – chat_threads, chat_messages
5. `20250201000004_create_tours_contracts.sql` – tour_requests, contracts
6. `20250201000005_create_moderation.sql` – moderation_queue, moderation_decisions
7. `20250201000006_create_notifications_m2.sql` – notifications, m2_jobs

## How to run

**Option A: Supabase Dashboard SQL Editor**

1. Open your [Supabase project](https://supabase.com/dashboard) → SQL Editor
2. Run each migration file in order (copy/paste and execute)

**Option B: Supabase CLI**

```bash
supabase db push
```

## Schema overview

| Table | Purpose |
|-------|---------|
| agencies | Agency profiles |
| agency_staff | Staff membership (agent, listing_manager, admin) |
| agency_referral_codes | Referral codes for agent signup |
| agency_credit_wallets | Credit balance per agency |
| agency_credit_ledger | Credit transaction audit |
| listings | Property listings (landlord or agency-owned) |
| listing_media | Photos, videos, floorplans |
| saved_listings | Tenant saved listings |
| chat_threads | One per (listing, tenant) |
| chat_messages | Messages in threads |
| tour_requests | Tour booking requests |
| contracts | Rent contracts (to_create, sent, completed) |
| moderation_queue | Items awaiting moderation |
| moderation_decisions | Audit of approve/reject |
| notifications | In-app inbox |
| m2_jobs | m² team media capture jobs |

## Role flags in profiles

- `roles.moderator` – can access moderation queue
- `roles.m2_team` – can access m² dashboard and jobs

Set these manually in Supabase or via an admin flow.

## Generate TypeScript types (optional)

After migrations:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```
