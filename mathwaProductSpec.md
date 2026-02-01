# Mathwa Product Spec (Single Source of Truth)

Version: 2
Owner: Zachary Al Noor
Stack target: Next.js (Web, mobile-first + desktop responsive) + Supabase (Postgres, Auth, Storage, RLS, Edge Functions, Scheduled Jobs) + Cursor + Claude
Moderation surface: Discord (notifications + approvals workflow)

This document is the canonical reference for Cursor, Claude, and future contributors.
If an older chat contradicts this spec, this spec wins.

---

## 1) Product Summary

Mathwa is a Bahrain property renting platform with verified listings, chat per listing, tour booking, and contract e-sign flow.

### Platforms

* **Web App (Next.js)**: Single responsive web app that supports phone and desktop

  * Tenant Interface (default)
  * Agent Interface
  * Landlord Interface
* **Web Dashboards (private within same Next.js app or separate route group)**

  * **Mathwa Dashboard**: Agency profiles (admin + analytics, web-only)
  * **m² Dashboard**: m² team (create/edit m² listings, upload pro media, web-only)
* **Moderation**

  * Moderators operate inside **Discord** using an approvals workflow (webhook notifications plus approve/deny actions via a secure web moderation page)

### Monetization

* **Featured listings**: paid ads (credits purchased by Agency profiles, allocated to Agents)
* **m² listings**: paid service (pro photos, videos, 3D tours captured by m² team)

---

## 2) Terminology (Use these exact words)

* “Dashboard” and “Interface” are interchangeable.
* “Agency accounts” are “Agency profiles”.
* “Mathwa verified” is now **m²**, also called **Mathwa²** or **Mathwa Squared**.
* “Featured” stays “Featured”.
* “Mathwa Dashboard” = Agency web admin and analytics dashboard.
* “m² Dashboard” = m² team web dashboard.

---

## 3) Roles and Access

### Core Roles

1. **Tenant**

   * Anyone searching for properties
   * Can browse without an account
   * Must create a quick account to: book tours, chat, e-sign, rent request
2. **Landlord**

   * Private owners listing without an agency
   * Can hold both Tenant + Landlord profiles and switch
3. **Agent**

   * Works under an Agency profile
   * Must be linked to an Agency profile and validated
   * Can hold both Tenant + Agent profiles and switch
4. **Agency profile**

   * Company account on Mathwa Dashboard (web-only)
   * Sub-roles: agents, listing manager, admin
5. **Moderator**

   * Discord-based review for approvals and verification (ownership, RERA, listings submissions)
6. **m² Team**

   * Private web dashboard access for m² service listings only (or any listing that requested m² service)

### High Level Permission Rules

* Tenants can create chats only from a listing via “create chat” or “book tour”. Tour booking creates the listing-linked chat if it does not exist.
* Chats are always tied to a single listing.
* Agents can only create listings once the Agency profile assigns them a property from inventory.
* Landlords can create up to **4 active listings free**, then monthly fee to exceed.
* Agency profiles can assign listings to agents and remove listings, but do not approve moderation results.
* Listings must be renewed every **30 days** from publish.

  * Notify at renewal time
  * Auto-remove 24 hours after notification if not renewed or taken down

---

## 4) App Interfaces and Navigation

### Tenant Interface (Web, mobile-first)

Primary bottom navigation:

* Discover
* Saved
* My Home
* Messages
* Profile

Discover page has two main feeds: Rentals and Uni Hub. Default is Rentals.
Both feeds:

* Top segmented control: Uni Hub | Rentals
* Filter icon aligned with segmented control
* Search icon aligned with segmented control
* Each feed card uses full-bleed listing photo
* Bottom overlay: title (bold), then key points: price, beds, baths, city
* Below the top segmented control: Newest | Current Search | Popular
* Popular default if no search ever made
* Current Search default if search has been made

Tenant key actions:

* View listing
* Save listing (requires account)
* Start chat (requires account)
* Book tour (requires account)
* Request to rent (in chat)

### Agent Interface (Web)

Core sections (recommended):

* Today (tour requests queue + today schedule + upcoming section for future tour bookings)
* Listings (assigned listings and created listings + removed/archived with reasons)
* Messages (includes pinned agency broadcast chat)
* Contracts (To Create, Sent, Completed)
* Profile/Menu

Pinned, read-only chat at top:

* “Agency Broadcasts”
* Agents cannot reply in that thread

### Landlord Interface (Web)

Core sections (recommended):

* Today (tour requests queue + today schedule + upcoming section)
* Listings (create/edit, statuses, removed section)
* Messages
* Contracts (To Create, Sent, Completed)
* Profile/Menu

---

## 5) Account Creation and Role Switching

### Tenant signup (quick)

Required when booking, chatting, e-sign, or submitting rent request:

* Email or phone, or Apple/Google
* First name required
* Last name optional

### Agent signup flow (from default Tenant interface)

* Choose/search an existing Agency profile
* Full name
* CPR or Passport
* Upload RERA certification
* Email + phone
* Enter referral code provided by agency
* Submit
* If referral invalid, show error and retry path
* Once approved, user gains Agent profile and can switch interfaces

### Landlord signup flow (from default Tenant interface)

* Full name
* CPR or Passport
* Nationality
* Email + phone
* User gains Landlord profile and can switch interfaces

### Role switching

A single auth user can have multiple profiles:

* Tenant + Agent
* Tenant + Landlord

Implementation guideline:

* One Supabase Auth user id
* One `profiles` row per user
* Additional role-specific tables as needed, keyed by `user_id`
* UI switcher in menu
* Server verifies role via RLS, not client-only flags

---

## 6) Core Objects and Data Model (Supabase Postgres)

This replaces the Firebase Firestore structure.

### Tables Overview (starter)

* `profiles` (1 row per auth user)

* `agencies`

* `agency_staff` (membership + role within agency)

* `agency_referral_codes`

* `agency_credit_wallets`

* `agency_credit_ledger`

* `listings`

* `listing_media`

* `listing_renewals` (or renewal fields directly on listings)

* `moderation_queue`

* `moderation_decisions`

* `chat_threads`

* `chat_messages`

* `tour_requests`

* `contracts`

* `notifications` (in-app inbox)

* `m2_jobs`

### Key Schema Notes

* Use UUID PKs everywhere.
* Use `created_at`, `updated_at` on all tables.
* Use Postgres enums for status fields where helpful.

#### profiles

* `user_id` (uuid, references auth.users)
* `display_name`, `email`, `phone`
* `roles` (jsonb or separate boolean columns)
* `active_role`
* other common profile fields

#### agencies

* `name`, `cr_number`, `status`
* doc paths stored as storage object keys
* `primary_contact_user_id`

#### listings

* Ownership: `owner_type` (landlord | agency)
* Optional links: `landlord_user_id`, `agency_id`, `agent_user_id`
* Status: `status`, `removed_reason_type`, `moderation_status`
* Publish/renewal: `publish_at`, `renew_by`, `last_renewed_at`, `renewal_notified_at`
* All listing fields remain as described in Version 1 spec

#### listing_media

* `listing_id`
* `type` (photo | video | tour3d | floorplan)
* `storage_path` or `external_url`
* `order_index`
* `uploaded_by_user_id`
* `created_at`

#### chat_threads

Chat is always tied to a listing:

* `listing_id`
* `tenant_user_id`
* `counterparty_type` (agent | landlord)
* `agent_user_id` or `landlord_user_id`
* `created_at`, `last_message_at`, `last_message_preview`
* `is_pinned_read_only` (true for agency broadcast threads)

Thread uniqueness rule:

* unique constraint on `(listing_id, tenant_user_id)` to enforce one thread per listing per tenant.

#### chat_messages

* `thread_id`
* `sender_user_id`
* `message_type` (text | system | structured_payload)
* `body` (text) or `payload` (jsonb)
* `created_at`

#### tour_requests

* `listing_id`, `tenant_user_id`, `counterparty_type`, `agent_user_id` or `landlord_user_id`
* `requested_slot`
* `status` and reschedule fields
* timestamps

#### contracts

* listing and party linkage
* `status`: to_create | sent | completed | cancelled
* `tenant_info` (jsonb)
* `contract_file_path` (storage key)
* `esign` fields provider-agnostic

#### moderation_queue

* entity reference, status, submitted_by, timestamps, reviewed_by

---

## 7) Listing Lifecycle

Unchanged in product logic. Implementation uses Postgres rows + RLS.

---

## 8) Renewal Rules (Critical Automation)

Rule:

* Listings expire every 30 days from `publish_at`
* At `renew_by`: send notification to owner
* After 24 hours: if not renewed or taken down, auto-remove

Implementation in this stack:

* Use Supabase Scheduled Jobs (or an external cron) to run every hour.
* Scheduled job calls a Supabase Edge Function that:

  * finds listings needing notification
  * sets `renewal_notified_at`
  * writes a notification row
  * optionally sends email
  * removes expired listings after 24 hours and writes audit rows

Renew action:

* Owner taps “Renew listing”
* System sets `renew_by = now + 30 days`, `last_renewed_at = now`, clears `renewal_notified_at`

---

## 9) Chat Rules and Rent Request Flow

Unchanged in product logic.

Implementation in this stack:

* Rent request form submission writes a structured message payload to `chat_messages`
* Creates or upserts a `contracts` row with `status = to_create`

---

## 10) Contracts Flow (To Create → Sent → Completed)

Unchanged in product logic.
E-sign provider stays provider-agnostic. MVP may use upload + acknowledgement.

---

## 11) Booking Tours (Time Slot Rules + Workflow)

Unchanged in product logic.

Implementation notes:

* Slot generation happens client-side with Bahrain local time rules.
* Server validates requested slot in Edge Function to prevent bypass.
* 1-hour reminders triggered by scheduled job or delayed queue pattern using scheduled jobs.

---

## 12) Agency Profile Workflows (Mathwa Dashboard)

Unchanged in product logic. Implemented as role-gated routes in the same Next.js app or a dashboard subdomain.

---

## 13) Featured Ads and Credits and m²

Unchanged in product logic.

---

## 14) m² Service Workflows (m² Dashboard)

Unchanged in product logic.

---

## 15) Moderation in Discord (Approvals + Verification)

Same approach, but backend is Supabase:

* Discord webhook posts a moderation alert.
* Moderator clicks a secure moderation web page.
* Approve/Reject actions call an Edge Function.
* Edge Function writes `moderation_decisions` and updates the target entity.

---

## 16) Notifications (Web)

Replace Firebase Cloud Messaging with web-friendly options.

Must-have notification events:

* Listing approved / rejected
* Renewal required + expiry removal
* New chat message
* New tour request
* Tour accepted/denied/rescheduled
* 1-hour tour reminder
* Contract sent for e-sign
* Contract completed

Implementation:

* In-app inbox: `notifications` table.
* Optional email notifications for MVP.
* Web push can be added later if needed.

---

## 17) Architecture (Supabase + Next.js)

### Services

* Next.js web app
* Supabase Auth
* Supabase Postgres
* Supabase Storage
* Supabase Edge Functions
* Scheduled Jobs (Supabase) or external cron for renewals and reminders
* Hosting on Vercel

### Edge Function responsibilities

* Create chat thread on first message if needed
* Rent request creates contract in To Create
* Tour request create, accept/deny/reschedule
* 1-hour reminders
* Listing renewal notifications and auto-removal
* Agency referral code validation and agent onboarding
* Discord notifications and moderation decisions
* Any privileged updates that should not be done directly by client

---

## 18) Security Model (Non-negotiables)

Replace Firestore security rules with Postgres RLS.

RLS goals:

* Tenants can read active listings
* Users can only read/write their own chats and contracts
* Agents can only access listings assigned to them or created by them
* Landlords can only access their own listings, chats, tours, contracts
* Agency dashboard restricted to agency staff roles
* m² dashboard restricted to m² team only
* Moderation actions restricted to Edge Functions only

Key pattern:

* Client can insert “requests”
* Edge Functions validate and perform privileged state changes
* RLS blocks direct status flips for moderation and sensitive lifecycle updates

---

## 19) MVP Feature Checklist

Unchanged in product logic.

---

## 20) Third Party Integrations (Now vs Later)

### Needed now (recommended)

* Google Maps / Places API for address and pins
* Image compression pipeline (client-side or server-side)

### Later

* Payments for credits and m² services
* Formal e-sign provider
* Analytics (PostHog, Mixpanel)
* 3D tour provider

---

## 21) UX Rules and Edge Cases

Unchanged.

---

## 22) Implementation Notes for Next.js Vibe Coding

Recommended repo structure:

* `app/` routes for tenant and dashboards
* `components/` UI components
* `lib/` helpers (supabase client, utilities)
* `server/` server actions or API routes if needed
* `db/` migrations, schema notes, seed scripts

Key principles:

* Keep types centralized and generated where possible
* Use database constraints for truth (unique thread per listing per tenant)
* Use RLS as the real permission system

---

## 23) Deprecated or Optional Ideas (Do not build unless re-approved)

* Guest booking and guest chat without an account remains deprecated.

---

## 24) Open Decisions (Capture and lock soon)

Unchanged:

* Featured duration and pricing model
* m² service ordering and payment flow
* Re-review policy for listing edits
* Chat retention rules and legal compliance
* Identity verification strictness for landlords

End of spec.
