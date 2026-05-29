# ClearPoints

> See what your points are really worth.

ClearPoints turns the credit card points you already have into real flights. It
shows award availability, computes honest value against a cash reference, ties
each deal to the transfer partners in your own wallet, and generates
step-by-step booking instructions.

This repository is **Phase 1**: the full app, built end to end against a mock
award-data provider so it is demoable with zero external data spend.

## Stack

- **Next.js 15** (App Router, React Server Components) + **TypeScript**
- **Supabase** Postgres, Auth (magic link + Google), Row Level Security
- **Tailwind CSS v4**
- Design system generated with the **UI/UX Pro Max** skill (see `design-system/`)

Stripe, Resend/React Email, and Inngest are part of the product roadmap but are
intentionally **not** wired up in Phase 1 (see Roadmap below).

## The one rule that shapes the architecture

The hard part of this product is award availability data. The entire app is
built against a single interface, never a vendor SDK:

```ts
// lib/award-data/provider.ts
export interface AwardDataProvider {
  searchRoute(input: RouteQuery): Promise<AwardResult[]>;
  searchBulk(input: BulkQuery): Promise<AwardResult[]>;
  getAvailability(filter: AlertFilter): Promise<AwardResult[]>;
}
```

- `MockAwardDataProvider` ships now: deterministic, realistic, seeded data
  across many origins, destinations, cabins, programs, and dates over the next
  365 days.
- `SeatsAeroProvider` is stubbed with a documented request/response mapping for
  the seats.aero Partner API (Phase 2+).
- The provider is chosen by `AWARD_PROVIDER=mock|seatsaero` in
  `lib/award-data/index.ts`. Swapping vendors is one env var, no feature
  changes.

## Money math

All value math lives in `lib/money.ts` and comes from data, never a model:

```
value_cpp    = cash_reference_usd / points_cost * 100
discount_pct = (cash_reference_usd - taxes_usd) / cash_reference_usd * 100
```

Full precision is kept in storage; rounding happens only for display.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then copy env and fill it in:
   ```bash
   cp .env.example .env.local
   ```
3. Apply the schema (Supabase CLI or paste `supabase/migrations/0001_init.sql`
   into the SQL editor):
   ```bash
   supabase db reset      # runs the migration locally
   ```
4. Seed reference data and mock deals (single TypeScript source of truth):
   ```bash
   npm run seed
   ```
5. Run the app:
   ```bash
   npm run dev
   ```

### Auth setup

- Enable **Email** (magic link) and **Google** providers in Supabase Auth.
- Add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to the allowed redirect URLs.

## Phase 1 features

1. **Auth + onboarding** — magic link and Google OAuth. New users capture home
   airports and points programs into `users_profile`. A DB trigger provisions
   the profile row on signup.
2. **Flight Search (free)** — `/search`. Calls `provider.searchRoute()`,
   computes value and discount, resolves which of your programs can reach the
   airline via `transfer_partners`, and renders generated booking instructions.
3. **Top Deals Explorer (free, depth gated)** — `/explorer`. Calls
   `searchBulk()` across up to 6x6 origins/destinations. Free sees economy and a
   90 day window; Premium unlocks every cabin and 365 days. The gate is enforced
   server-side off `subscription_tier` in `lib/gating.ts`.
4. **Account** — `/account`. View and edit home airports, programs, cabin
   preference, and see your tier.
5. **Points 101** — `/points-101`. Static (ISR) explainer with an interactive
   cash vs portal vs transfer value comparison.
6. **Provider swap readiness** — the interface, mock, and stubbed seats.aero
   provider described above.

### Premium gating

Gating is never UI-only. The explorer clamps the requested cabins and date
window to what the tier allows **before** querying the provider
(`applyExplorerGate`), and `users_profile` is protected by RLS. To preview the
premium experience, set a user's `subscription_tier` to `premium` in the
database (billing arrives in Phase 3).

## Project layout

```
app/
  (app)/                authenticated shell: search, explorer, account
  auth/                 callback + signout route handlers
  login/                magic link + Google sign in
  onboarding/           profile capture
  points-101/           public ISR explainer
  page.tsx              public landing
components/              UI primitives + product components (deal card, etc.)
lib/
  award-data/           provider interface, mock, seats.aero stub, catalog, rng
  money.ts              value_cpp / discount_pct
  transfers.ts          bank -> airline path resolution
  booking-instructions.ts  template rendering
  gating.ts             server-side premium gate
  reference-data.ts     programs, transfer partners, booking templates
  supabase/             server/browser/middleware clients + types
supabase/migrations/    schema + RLS
scripts/seed.ts         seeds reference data + mock deals
design-system/          ClearPoints design system (UI/UX Pro Max)
```

## Roadmap (not built in Phase 1)

- **Phase 2:** booking-instruction polish, cash-reference sourcing, value
  tuning, real `SeatsAeroProvider`.
- **Phase 3:** Deal Digest email (Inngest + Resend + React Email), Stripe
  Premium tier, full tier gating.
- **Phase 4:** Flight Alerts with dedupe.
- **Phase 5:** Credit Card Marketplace, Concierge, AI deal enrichment, SEO blog.

AI (Anthropic API) is used for copy and enrichment only, never for fares or
points.
