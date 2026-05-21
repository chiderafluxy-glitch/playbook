import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Clients ──────────────────────────────────────────────────────────────────

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
} else { console.warn("GEMINI_API_KEY missing — using synthetic fallbacks."); }

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' as any });
} else { console.warn("STRIPE_SECRET_KEY missing."); }

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
} else { console.warn("SUPABASE env vars missing."); }

// ─── Gemini Helper ────────────────────────────────────────────────────────────

async function generateWithGemini(prompt: string, schema: any, systemInstruction?: string) {
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: { systemInstruction: systemInstruction || "You are an expert marketing strategist and copywriter.", responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 },
      });
      if (response?.text) return JSON.parse(response.text.trim());
    } catch (error) { console.error("Gemini error:", error); }
  }
  return null;
}

// ─── Stripe Routes ────────────────────────────────────────────────────────────

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const { plan, userId, email } = req.body;
  if (!plan || !userId || !email) return res.status(400).json({ error: 'Missing fields' });

  const priceId = plan === 'basic' ? process.env.STRIPE_BASIC_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return res.status(400).json({ error: 'Price ID not configured for this plan' });

  try {
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId, plan },
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/`,
    };
    if (plan === 'basic') sessionParams.subscription_data = { trial_period_days: 3 };
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/create-portal-session', async (req, res) => {
  if (!stripe || !supabaseAdmin) return res.status(503).json({ error: 'Services not configured' });
  const { userId } = req.body;
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', userId).single();
    if (!profile?.stripe_customer_id) return res.status(404).json({ error: 'No Stripe customer found' });
    const session = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard` });
    return res.json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe || !supabaseAdmin) return res.status(503).send('Services not configured');
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body.toString());
  } catch (err: any) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  const { data: existing } = await supabaseAdmin.from('stripe_events').select('id').eq('id', event.id).single();
  if (existing) return res.json({ received: true, duplicate: true });
  await supabaseAdmin.from('stripe_events').insert({ id: event.id, type: event.type, payload: event });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        await supabaseAdmin.from('profiles').update({
          plan, has_paid: true, subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        }).eq('id', userId);
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('profiles').update({ subscription_status: sub.status }).eq('stripe_customer_id', sub.customer as string);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('profiles').update({ subscription_status: 'canceled', has_paid: false }).eq('stripe_subscription_id', sub.id);
    } else if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object as Stripe.Invoice;
      await supabaseAdmin.from('profiles').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', inv.customer as string);
    }
  } catch (e) { console.error('Webhook handler error:', e); }

  return res.json({ received: true });
});

// ─── Generation cap check ─────────────────────────────────────────────────────

app.post('/api/check-generation-cap', async (req, res) => {
  if (!supabaseAdmin) return res.json({ allowed: true });
  const { userId, tool, plan } = req.body;
  const month = new Date().toISOString().slice(0, 7);
  const limit = plan === 'pro' ? 100 : 20;
  const { data } = await supabaseAdmin.from('generation_counts').select('count').eq('user_id', userId).eq('tool', tool).eq('month', month).single();
  return res.json({ allowed: (data?.count || 0) < limit, count: data?.count || 0, limit });
});

// ─── AI Generation Routes ─────────────────────────────────────────────────────

app.post("/api/generate/lead-magnet", async (req, res) => {
  const { niche, audience, offer } = req.body;
  if (!niche || !audience || !offer) return res.status(400).json({ error: "Missing required fields" });

  const prompt = `Create a Russell Brunson-style lead magnet for: Niche: ${niche}, Audience: ${audience}, Offer: ${offer}. Generate a title, compelling headline, 3 benefit bullets, and CTA text.`;
  const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, headline: { type: Type.STRING }, bullets: { type: Type.ARRAY, items: { type: Type.STRING } }, cta: { type: Type.STRING } }, required: ["title","headline","bullets","cta"] };
  const result = await generateWithGemini(prompt, schema, "You are Russell Brunson. Design irresistible lead magnets.");
  if (result) return res.json(result);

  return res.json({
    title: `The Ultimate ${niche} Blueprint`,
    headline: `How to Attract ${audience} and Convert Them in 7 Days — Without Cold Outreach`,
    bullets: ["Copy-paste hook template designed for your audience.", "Step-by-step checklist — set up your loop in under 60 minutes.", "The value-first sequence that positions you as the go-to solution."],
    cta: "Download Your Free Blueprint →"
  });
});

app.post("/api/generate/dream-100", async (req, res) => {
  const { niche, audience, offer, count = 10, platform = "Both" } = req.body;
  if (!niche || !audience || !offer) return res.status(400).json({ error: "Missing required fields" });

  const prompt = `Generate ${count} Dream 100 partners for: Niche: ${niche}, Audience: ${audience}, Offer: ${offer}, Platform: ${platform}. Include realistic influencer names, links, contact emails, and personalized value-first outreach messages.`;
  const schema = { type: Type.OBJECT, properties: { partners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { partnerName: { type: Type.STRING }, platform: { type: Type.STRING }, link: { type: Type.STRING }, contact: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["partnerName","platform","link","contact","message"] } } }, required: ["partners"] };
  const result = await generateWithGemini(prompt, schema, "You are Alex Hormozi. Find highest-leverage partnership opportunities.");
  if (result) return res.json(result);

  const platforms = platform === "Both" ? ["YouTube","Podcast"] : [platform];
  return res.json({ partners: Array.from({ length: count }, (_, i) => ({ partnerName: `${niche} Expert ${i + 1}`, platform: platforms[i % platforms.length], link: `https://${platforms[i % platforms.length].toLowerCase()}.com/c/example-${i + 1}`, contact: `contact${i + 1}@example.com`, message: `Hey, I made a free resource for ${audience} that your audience would love — no pitch. Want me to send it over?` })) });
});

app.post("/api/generate/email-sequence", async (req, res) => {
  const { niche, offer, hookOffer } = req.body;
  if (!niche || !offer) return res.status(400).json({ error: "Missing required fields" });

  const prompt = `Write a GaryVee 3 Jabs + 1 Hook email sequence for: Niche: ${niche}, Offer: ${offer}, Hook CTA: ${hookOffer || "free 15-min strategy call"}. Emails 1-3 are pure value, Email 4 is a soft pitch.`;
  const eItem = { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["subject","body"] };
  const schema = { type: Type.OBJECT, properties: { email1: eItem, email2: eItem, email3: eItem, email4: eItem }, required: ["email1","email2","email3","email4"] };
  const result = await generateWithGemini(prompt, schema, "You are Gary Vaynerchuk. Lead with relentless value.");
  if (result) return res.json(result);

  return res.json({
    email1: { subject: `The #1 mistake in ${niche}`, body: `Hey [First Name],\n\nMost people in ${niche} overlook this completely.\n\n[Core value tip]\n\nNo ask — just wanted to share this.\n\n[Your Name]` },
    email2: { subject: `How this ${niche} business 3x'd results`, body: `Hey [First Name],\n\nQuick case study:\n\n[Brief success story in ${niche}]\n\nKey takeaway: [lesson]\n\n[Your Name]` },
    email3: { subject: `Free tool for ${niche}`, body: `Hey [First Name],\n\nBuilt something useful — no cost.\n\n[Free resource]\n\nHope this helps,\n[Your Name]` },
    email4: { subject: `One spot left`, body: `Hey [First Name],\n\nI've been giving value with no strings attached.\n\nIf you're ready to go deeper: ${hookOffer || "book a free 15-min call"}\n\n[CTA Link]\n\nNo pressure,\n[Your Name]` }
  });
});

app.post("/api/generate/linkedin", async (req, res) => {
  const { niche, offer, emails } = req.body;
  if (!niche || !emails) return res.status(400).json({ error: "Missing required fields" });

  const prompt = `Repurpose these emails into Justin Welsh-style LinkedIn posts for ${niche}. Email 1: ${emails.email1?.body?.slice(0,300)}. Email 2: ${emails.email2?.body?.slice(0,300)}. Email 3: ${emails.email3?.body?.slice(0,300)}. Each needs a hook, body, and comment CTA note.`;
  const pItem = { type: Type.OBJECT, properties: { hook: { type: Type.STRING }, body: { type: Type.STRING }, commentNote: { type: Type.STRING } }, required: ["hook","body","commentNote"] };
  const schema = { type: Type.OBJECT, properties: { post1: pItem, post2: pItem, post3: pItem }, required: ["post1","post2","post3"] };
  const result = await generateWithGemini(prompt, schema, "You are Justin Welsh. Write minimalist LinkedIn content that drives organic leads.");
  if (result) return res.json(result);

  return res.json({
    post1: { hook: `Most ${niche} businesses skip this completely.`, body: `And it costs them leads every week.\n\nHere's what to do instead:\n\n→ [Key insight]\n→ [Supporting point]\n→ [Takeaway]\n\nSimple. But most won't do it.`, commentNote: "Drop 🔥 in comments and I'll send you the free resource." },
    post2: { hook: `I studied 50 ${niche} businesses.`, body: `The ones growing fastest all did one thing.\n\n[Core lesson]\n\nNot complicated. Just consistent.`, commentNote: "Free guide in comments 👇" },
    post3: { hook: `You don't need a bigger budget.`, body: `You need a better system.\n\n[Key insight]\n\nBuilt a free tool that handles this automatically.`, commentNote: "Link in comments — no email required." }
  });
});

app.post("/api/generate/tripwire", async (req, res) => {
  const { offerName, offerPrice, tripwirePrice } = req.body;
  if (!offerName) return res.status(400).json({ error: "Missing offerName" });

  const prompt = `Create a Ryan Deiss tripwire upsell for: Main Offer: ${offerName} ($${offerPrice}), Tripwire Price: $${tripwirePrice || 9}. Generate title, description, order bump headline, and 3 bullets.`;
  const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, orderBumpHeadline: { type: Type.STRING }, bullets: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title","description","orderBumpHeadline","bullets"] };
  const result = await generateWithGemini(prompt, schema, "You are Ryan Deiss. Create irresistible low-ticket tripwire offers.");
  if (result) return res.json(result);

  return res.json({
    title: `The ${offerName} Fast-Start Kit`,
    description: `Everything to hit the ground running with ${offerName} — templates, shortcuts, and a quick-start guide. Just $${tripwirePrice || 9} today.`,
    orderBumpHeadline: `⚡ Add the Fast-Start Kit for just $${tripwirePrice || 9} — one-time offer`,
    bullets: ["Done-for-you templates ready to customize in minutes.", "Step-by-step guide so you see results immediately.", "Exclusive bonus resources not available anywhere else."]
  });
});

app.post("/api/generate/scorecard-suggestions", async (req, res) => {
  const { topPartners } = req.body;
  if (!topPartners?.length) return res.status(400).json({ error: "No top partners provided" });
  const names = topPartners.map((p: any) => p.partnerName).join(", ");
  const prompt = `Apply Perry Marshall's 80/20 principle: top Dream 100 partners are ${names}. Give a specific, actionable strategy to deepen these relationships and maximize results.`;
  const schema = { type: Type.OBJECT, properties: { suggestions: { type: Type.STRING } }, required: ["suggestions"] };
  const result = await generateWithGemini(prompt, schema, "You are Perry Marshall. Apply 80/20 thinking.");
  if (result) return res.json(result);
  return res.json({ suggestions: `Double down on ${names.split(",")[0]}. Send a personalized gift and propose a co-created resource targeting both audiences. This single move can 2-5x your current lead flow.` });
});

// ─── Dev / Prod Server ────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist/client")));
    app.get("*", (_req, res) => res.sendFile(path.resolve("dist/client/index.html")));
  }
  app.listen(PORT, () => console.log(`🚀 Playbook running at http://localhost:${PORT}`));
}

startServer();
