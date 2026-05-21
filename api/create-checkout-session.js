const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const { plan, userId, email } = req.body;
  if (!plan || !userId || !email) {
    return res.status(400).json({ error: 'Missing fields: plan, userId, email required' });
  }

  const priceId = plan === 'basic' ? process.env.STRIPE_BASIC_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return res.status(400).json({ error: 'Price ID not configured for this plan' });
  }

  try {
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId, plan },
      success_url: `${process.env.APP_URL || 'https://playbook-mauve-gamma.vercel.app'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://playbook-mauve-gamma.vercel.app'}/`,
    };
    if (plan === 'basic') sessionParams.subscription_data = { trial_period_days: 3 };
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
