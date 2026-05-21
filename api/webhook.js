const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).send('Services not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check for duplicate event
  const { data: existing } = await supabaseAdmin.from('stripe_events').select('id').eq('id', event.id).single();
  if (existing) return res.status(200).json({ received: true, duplicate: true });
  
  await supabaseAdmin.from('stripe_events').insert({ id: event.id, type: event.type, payload: event });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        await supabaseAdmin.from('profiles').update({
          plan,
          has_paid: true,
          subscription_status: 'active',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }).eq('id', userId);
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      await supabaseAdmin.from('profiles').update({ subscription_status: sub.status }).eq('stripe_customer_id', sub.customer);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await supabaseAdmin.from('profiles').update({ subscription_status: 'canceled', has_paid: false }).eq('stripe_subscription_id', sub.id);
    } else if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object;
      await supabaseAdmin.from('profiles').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', inv.customer);
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return res.status(200).json({ received: true });
};
