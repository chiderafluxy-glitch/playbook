# Playbook — Developer Handoff Document
**Version:** 2.0  
**Last Updated:** May 2026  
**Status:** Frontend complete. Backend integrations (Supabase + Stripe) wired. Ready for env setup and deploy.

---

## 1. What Is Playbook?

Playbook is a SaaS that automates 6 proven marketing strategies for any business that needs more customers — coaches, local service businesses, ecommerce stores, freelancers, agencies, and more.

**Basic Plan — $15/mo (3-day free trial)**
1. Lead Magnet Builder (Russell Brunson) — generates landing page copy + email capture
2. Dream 100 Outreach (Alex Hormozi) — finds partners + generates personalized outreach messages
3. Email Nurture Sequence (Gary Vaynerchuk) — 3 value emails + 1 soft pitch

**Pro Plan — $30/mo (no trial)**
4. LinkedIn Content Engine (Justin Welsh) — repurposes emails into LinkedIn posts
5. Partner Scorecard (Perry Marshall) — ranks Dream 100 partners by performance, highlights top 20%
6. Tripwire Offer Generator (Ryan Deiss) — generates post-purchase upsell offer

All output is AI-generated (Gemini Flash), copy/paste ready, with Gmail and email platform integrations.

---

## 2. Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | React + Vite + Tailwind | SPA UI |
| Backend | Express (server.ts) | API routes |
| Database | Supabase (PostgreSQL) | Users, outputs, counts |
| Auth | Supabase Auth | Email/password |
| Payments | Stripe Checkout + Webhooks | Subscriptions |
| AI | Google Gemini 1.5 Flash | All content generation |
| Hosting | Vercel | Frontend + serverless |
| Font | Roobert (custom) | Brand typography |

---

## 3. Project Structure

```
Playbook/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx     # Public marketing page
│   │   ├── Auth.tsx            # Login + signup (Supabase Auth)
│   │   ├── Checkout.tsx        # Plan selection + Stripe redirect
│   │   ├── Onboarding.tsx      # 4-step onboarding (saves to Supabase)
│   │   ├── Dashboard.tsx       # Main app — all 6 tools
│   │   ├── WarRoom.tsx         # Interactive demo (landing + dashboard)
│   │   └── InfoPages.tsx       # About, Privacy, Terms, etc.
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client + all DB helpers
│   │   └── stripe.ts           # Stripe frontend helpers
│   ├── App.tsx                 # Router + auth state + screen logic
│   └── types.ts                # All TypeScript types
├── server.ts                   # Express server — AI routes + Stripe webhooks
├── migrations/
│   └── 001_playbook_core_schema.sql   # Run once in Supabase SQL Editor
├── .env.example                # Copy to .env and fill in
├── STRIPE_SETUP.md             # Step-by-step Stripe product creation
├── HANDOFF.md                  # This file
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 4. Environment Variables

Copy `.env.example` to `.env` and fill in all values.

```env
APP_URL=http://localhost:3000
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...     # Server only
VITE_SUPABASE_URL=...             # Frontend (Vite reads VITE_ prefix)
VITE_SUPABASE_ANON_KEY=...        # Frontend
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NODE_ENV=development
```

---

## 5. Database Schema (Supabase)

Run `migrations/001_playbook_core_schema.sql` once in Supabase SQL Editor.

### Tables

**`profiles`** (extended from Supabase Auth)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | = auth.users.id |
| email | text | |
| name | text | Display name |
| plan | text | 'basic' or 'pro' |
| has_paid | boolean | false until Stripe confirms |
| subscription_status | text | active / inactive / past_due / canceled |
| stripe_customer_id | text | |
| stripe_subscription_id | text | |
| trial_ends_at | timestamptz | Basic plan only |
| onboarding_complete | boolean | |
| onboarding_step | int | 1–4 |
| gmail_connected | boolean | |
| email_platform | text | mailchimp / convertkit / etc |
| email_platform_key | text | Encrypted API key |

**`user_onboarding`**
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → profiles |
| niche | text | Step 1 |
| audience | text | Step 2 |
| problem | text | Step 2 |
| offer_name | text | Step 3 |
| offer_price | text | Step 3 |
| offer_sentence | text | Step 3 |
| step | int | Current step (1–5) |
| completed_at | timestamptz | Set on finish |

**`generated_outputs`**
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → profiles |
| tool | text | lead_magnet / dream_100 / email_sequence / linkedin / tripwire |
| output | jsonb | Full AI-generated JSON |
| UNIQUE | (user_id, tool) | One output per tool per user |

**`generation_counts`**
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → profiles |
| tool | text | Same enum as above |
| month | text | YYYY-MM format |
| count | int | Increments per generation |
| UNIQUE | (user_id, tool, month) | Resets monthly |

**`stripe_events`**
| Column | Type | Notes |
|--------|------|-------|
| id | text | Stripe event ID — prevents duplicate processing |
| type | text | Event type |
| payload | jsonb | Full event |

### Key Trigger
`on_auth_user_created` — auto-creates a `profiles` row and `user_onboarding` row when a user signs up.

---

## 6. User Flow & Routing Logic

```
Landing page
    ↓
Sign up → Supabase Auth creates user → trigger creates profile row
    ↓
Checkout → select Basic or Pro → Stripe Checkout Session created on server
    ↓
Stripe hosted checkout → user pays
    ↓
Stripe webhook fires → server updates profiles (has_paid=true, plan, stripe IDs)
    ↓
User redirected to /checkout-success → App.tsx detects session + checks profile
    ↓
has_paid=true + onboarding_complete=false → /onboarding
    ↓
4 steps → saves to user_onboarding + profiles after each step
    ↓
onboarding_complete=true → /dashboard
```

### Status Check on Every Login
App.tsx checks these in order on every session restore:
1. `has_paid = false` → redirect to `/checkout`
2. `has_paid = true` + `onboarding_complete = false` → redirect to `/onboarding` at their last step
3. Both true → redirect to `/dashboard`

---

## 7. API Routes (server.ts)

All routes are `POST`. All generation routes require `Content-Type: application/json`.

### Stripe Routes
| Route | Body | Returns |
|-------|------|---------|
| `POST /api/stripe/create-checkout-session` | `{ plan, userId, email }` | `{ url }` — Stripe hosted checkout URL |
| `POST /api/stripe/create-portal-session` | `{ userId }` | `{ url }` — Stripe billing portal URL |
| `POST /api/stripe/webhook` | Raw Stripe event | `{ received: true }` |

### Generation Cap
| Route | Body | Returns |
|-------|------|---------|
| `POST /api/check-generation-cap` | `{ userId, tool, plan }` | `{ allowed, count, limit }` |

### AI Generation Routes
| Route | Required Body Fields | Returns |
|-------|---------------------|---------|
| `POST /api/generate/lead-magnet` | `niche, audience, offer` | `{ title, headline, bullets[], cta }` |
| `POST /api/generate/dream-100` | `niche, audience, offer, count, platform` | `{ partners[] }` |
| `POST /api/generate/email-sequence` | `niche, offer, hookOffer` | `{ email1, email2, email3, email4 }` |
| `POST /api/generate/linkedin` | `niche, offer, emails` | `{ post1, post2, post3 }` |
| `POST /api/generate/tripwire` | `offerName, offerPrice, tripwirePrice` | `{ title, description, orderBumpHeadline, bullets[] }` |
| `POST /api/generate/scorecard-suggestions` | `topPartners[]` | `{ suggestions }` |

All routes have synthetic fallbacks — they return realistic mock data if Gemini API key is missing.

---

## 8. Generation Limits

| Plan | Limit per tool per month |
|------|--------------------------|
| Basic | 20 |
| Pro | 100 |

Counts are tracked in `generation_counts` table (Supabase) and mirrored to localStorage as fallback. Counts reset on the 1st of each month (month field is YYYY-MM).

The `increment_generation_count` RPC function handles atomic upsert to prevent race conditions.

---

## 9. Stripe Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Sets `has_paid=true`, updates plan + Stripe IDs |
| `customer.subscription.updated` | Updates `subscription_status` |
| `customer.subscription.deleted` | Sets `has_paid=false`, status=canceled |
| `invoice.payment_failed` | Sets status=past_due |

All events are logged to `stripe_events` table for idempotency — duplicate events are silently ignored.

---

## 10. Fallback Architecture

The app is designed to work at every stage even if a service isn't configured yet:

| Service missing | Behavior |
|----------------|----------|
| Supabase | Uses localStorage for all state |
| Stripe | Simulates payment with setTimeout |
| Gemini | Returns synthetic mock output |

This means the app is fully demoable with zero API keys.

---

## 11. What's Built ✅

- Complete frontend — all 7 pages, all 6 tools, War Room, Settings
- All 6 AI generation API routes with Gemini + fallbacks
- Supabase Auth integration (signup, login, session restore)
- Supabase data persistence (outputs + generation counts)
- Stripe Checkout Session creation
- Stripe Billing Portal (cancel/upgrade)
- Stripe webhook handler (all 4 key events)
- Status-based routing (checkout → onboarding → dashboard)
- Generation caps per plan per tool per month
- localStorage fallback for all Supabase operations

---

## 12. What Still Needs Building 🔧

### High priority (needed for launch)
- [ ] Real Gmail OAuth — currently toggles a boolean. Needs Google OAuth2 + Gmail API to actually create drafts
- [ ] Real email platform connection — currently saves API key. Needs Mailchimp/ConvertKit API calls to push sequences
- [ ] Email verification flow — Supabase sends a confirmation email on signup; needs a `/verify` screen
- [ ] Password reset flow — Supabase handles the email; needs a `/reset-password` screen

### Medium priority (post-launch)
- [ ] Dream 100 real scraping — YouTube Data API + ListenNotes API to find actual creators (currently Gemini generates plausible names)
- [ ] Stripe webhook endpoint registration — needs to be added to Stripe dashboard pointing to production URL
- [ ] Admin dashboard — view all users, plan distribution, revenue
- [ ] Upgrade from Basic → Pro mid-subscription (Stripe subscription update, not new checkout)

### Nice to have
- [ ] LinkedIn OAuth posting — applied separately due to LinkedIn API approval process
- [ ] Referral system
- [ ] Usage analytics per tool

---

## 13. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in all values in .env

# 3. Run Supabase migration
# Go to: Supabase Dashboard → SQL Editor → New Query
# Paste contents of migrations/001_playbook_core_schema.sql → Run

# 4. Create Stripe products
# Follow instructions in STRIPE_SETUP.md

# 5. Start dev server
npm run dev
# App runs at http://localhost:3000

# 6. (Optional) Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 14. How to Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# Project → Settings → Environment Variables
# Add all variables from .env

# 4. Update APP_URL in Vercel env vars to your production URL

# 5. Update Stripe webhook URL to production URL
# Stripe Dashboard → Webhooks → Edit endpoint URL
```

---

## 15. Key Design Decisions

**Why Vite + Express instead of Next.js?**  
Simpler for MVP. Express gives full control over the server. Can migrate to Next.js later with minimal changes to the React components.

**Why localStorage fallback?**  
Makes the app demoable and testable without any backend setup. Useful for development and for showing investors/users a working prototype.

**Why Gemini Flash?**  
Cheapest capable model at ~$0.075/million tokens. All 6 strategies combined cost approximately $0.05–0.50/user/month depending on usage.

**Why Stripe Checkout (hosted) instead of custom payment UI?**  
Faster to build, PCI compliant by default, handles 3D Secure automatically. Can switch to Stripe Elements later for a more embedded experience.

**Why UNIQUE constraint on generated_outputs?**  
One output per tool per user. Regenerating replaces the previous output. Keeps the database clean and simple.

---

*End of handoff document.*
