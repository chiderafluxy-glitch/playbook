# Stripe Setup — Playbook

Run these steps once to create your Stripe products and prices.

## Step 1 — Create Products & Prices

Go to: https://dashboard.stripe.com/products

### Basic Plan — $15/mo with 3-day trial
1. Click "Add Product"
2. Name: "Playbook Basic"
3. Description: "Lead Magnet Builder, Dream 100 Outreach, Email Nurture Sequence. Up to 20 generations/tool."
4. Pricing: $15.00 / month / recurring
5. Save — copy the Price ID (starts with price_)
6. Paste into .env as STRIPE_BASIC_PRICE_ID

### Pro Plan — $30/mo no trial
1. Click "Add Product"
2. Name: "Playbook Pro"
3. Description: "Everything in Basic + LinkedIn Content Engine, Partner Scorecard, Tripwire Generator. Up to 100 generations/tool."
4. Pricing: $30.00 / month / recurring
5. Save — copy the Price ID
6. Paste into .env as STRIPE_PRO_PRICE_ID

## Step 2 — Create Webhook Endpoint

Go to: https://dashboard.stripe.com/webhooks

1. Click "Add endpoint"
2. URL: https://your-domain.com/api/stripe/webhook
   (For local dev: use Stripe CLI — see Step 3)
3. Select events to listen to:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
4. Save — copy the Signing Secret (whsec_...)
5. Paste into .env as STRIPE_WEBHOOK_SECRET

## Step 3 — Local Development with Stripe CLI

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This gives you a local webhook secret for testing. Use it as STRIPE_WEBHOOK_SECRET during dev.

## Step 4 — Test Cards

Use these card numbers in Stripe's test mode:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

Expiry: any future date. CVC: any 3 digits.
