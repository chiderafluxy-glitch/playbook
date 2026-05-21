import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { UserPlan, UserProfile } from "../types";

interface CheckoutProps {
  currentPlan: UserPlan;
  onPaymentSuccess: (plan: UserPlan) => void;
  onNavigateHome: () => void;
  user: UserProfile | null;
}

const plans = [
  {
    id: "Basic" as UserPlan,
    label: "POPULAR INBOUND",
    price: "$15",
    period: "/month",
    tagline: "Perfect for solopreneurs launching their first strategic outbound lead systems.",
    trial: "3-day free trial included",
    features: ["Lead Magnet Builder","Dream 100 Outreach","Email Nurture Sequence","Up to 20 generations per tool","Email support"],
    highlight: false,
  },
  {
    id: "Pro" as UserPlan,
    label: "RECOMMENDED",
    price: "$30",
    period: "/month",
    tagline: "Maximize growth with specialized distribution, 80/20 scorecards, and high-converting impulse offers.",
    trial: null,
    features: ["Everything in Basic","LinkedIn Content Engine","Partner Scorecard","Tripwire Offer Generator","Up to 100 generations per tool","Priority support"],
    highlight: true,
  },
];

export default function Checkout({ currentPlan, onPaymentSuccess, onNavigateHome, user }: CheckoutProps) {
  const [selected, setSelected] = useState<UserPlan>("Basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selected.toLowerCase(),
          userId: user?.userId || user?.email || '',
          email: user?.email || ''
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Payment setup failed. Please try again.');
      }
    } catch (err: any) {
      setError('Could not connect to payment service. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={onNavigateHome} className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-[#edfc47] rounded-full" />
          </span>
          Playbook
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Choose your plan</h1>
          <p className="text-gray-500">Activate your Playbook. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all ${selected === plan.id ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold tracking-widest ${selected === plan.id ? "text-[#edfc47]" : "text-gray-400"}`}>{plan.label}</span>
                {selected === plan.id && <div className="w-5 h-5 rounded-full bg-[#edfc47] flex items-center justify-center"><Check size={12} className="text-black" /></div>}
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${selected === plan.id ? "text-gray-300" : "text-gray-500"}`}>{plan.period}</span>
              </div>
              <p className={`text-sm mb-5 ${selected === plan.id ? "text-gray-300" : "text-gray-500"}`}>{plan.tagline}</p>

              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className={selected === plan.id ? "text-[#edfc47]" : "text-gray-400"} />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.trial && (
                <div className={`mt-4 text-xs font-medium px-3 py-1.5 rounded-full inline-block ${selected === plan.id ? "bg-[#edfc47] text-black" : "bg-gray-100 text-gray-600"}`}>
                  ✓ {plan.trial}
                </div>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

        <button
          onClick={handleCheckout} disabled={loading}
          className="flex items-center gap-2 bg-black text-[#edfc47] font-semibold px-10 py-4 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 text-lg"
        >
          <Zap size={18} />
          {loading ? "Redirecting to payment..." : `Activate ${selected} Plan`}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          {selected === "Basic" ? "3-day free trial — no charge today." : "No trial — billed immediately at $30/mo."} Cancel anytime.
        </p>
        <p className="text-xs text-gray-400 mt-1">Secure payment powered by Stripe</p>
      </div>
    </div>
  );
}
