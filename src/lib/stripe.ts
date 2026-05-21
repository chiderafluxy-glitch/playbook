// Stripe helpers — all actual Stripe calls go through the server
// Frontend just calls our API endpoints which call Stripe server-side

export type PlanId = 'basic' | 'pro';

export const PLAN_NAMES: Record<PlanId, string> = {
  basic: 'Basic',
  pro: 'Pro'
};

export const PLAN_PRICES: Record<PlanId, string> = {
  basic: '$15/mo',
  pro: '$30/mo'
};

// Hit our server to create a Stripe Checkout Session and redirect
export async function redirectToCheckout(plan: PlanId, userId: string, email: string) {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, userId, email })
  });

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || 'Failed to create checkout session');
  }
}

// Open Stripe Customer Portal for billing management
export async function redirectToBillingPortal(userId: string) {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || 'Failed to create portal session');
  }
}
