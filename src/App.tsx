import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Checkout from "./components/Checkout";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import InfoPages from "./components/InfoPages";
import { UserProfile, OnboardingData, UserPlan } from "./types";
import { supabase, getProfile, getOnboarding } from "./lib/supabase";

export default function App() {
  const [screen, setScreen] = useState<string>("landing");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    niche: "", audience: "", problem: "",
    offerName: "", offerPrice: "", offerSentence: "",
    gmail_connected: false, email_platform: "", email_platform_key: "", step: 1
  });
  const [infoPageName, setInfoPageName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    // Check for Stripe redirect success
    const urlParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = window.location.pathname === '/checkout-success' || urlParams.get('session_id');

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        if (isCheckoutSuccess) {
          setScreen("landing");
        }
        setLoading(false);
        return;
      }

      const { data: profile } = await getProfile(session.user.id);
      const { data: onb } = await getOnboarding(session.user.id);

      if (!profile) { setLoading(false); return; }

      const freshUser: UserProfile = {
        name: profile.name || session.user.email?.split('@')[0] || 'User',
        email: profile.email || session.user.email || '',
        plan: (profile.plan as UserPlan) || 'Free',
        hasOnboarded: profile.onboarding_complete
      };
      setUser(freshUser);

      if (onb) {
        setOnboardingData({
          niche: onb.niche || "", audience: onb.audience || "",
          problem: onb.problem || "", offerName: onb.offer_name || "",
          offerPrice: onb.offer_price || "", offerSentence: onb.offer_sentence || "",
          gmail_connected: profile.gmail_connected || false,
          email_platform: profile.email_platform || "",
          email_platform_key: profile.email_platform_key || "",
          step: onb.step || 1
        });
      }

      // Route based on status
      if (!profile.has_paid) {
        setScreen("checkout");
      } else if (!profile.onboarding_complete) {
        setScreen("onboarding");
      } else if (isCheckoutSuccess) {
        window.history.replaceState({}, '', '/');
        setScreen("dashboard");
      } else {
        setScreen("dashboard");
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setScreen("landing");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fallback: sync from localStorage when Supabase not configured
  useEffect(() => {
    if (!loading) return;
    try {
      const storedUser = localStorage.getItem("pbook_user_session");
      if (storedUser && !user) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const storedOnb = localStorage.getItem("pbook_onboarding_session");
        if (storedOnb) {
          const parsedOnb = JSON.parse(storedOnb);
          setOnboardingData(parsedOnb);
          if (parsedUser.plan === "Free") setScreen("checkout");
          else if (parsedOnb.step < 5) setScreen("onboarding");
          else setScreen("dashboard");
        } else {
          setScreen("onboarding");
        }
      }
    } catch (e) { /* ignore */ }
  }, [loading]);

  const handleSelectPricingTier = (plan: UserPlan) => {
    setSelectedPlan(plan);
    setScreen("auth-signup");
  };

  const handleAuthSuccess = (name: string, email: string, assignedPlan: UserPlan, userId?: string) => {
    const freshUser: UserProfile = { name, email, plan: assignedPlan };
    setUser(freshUser);
    localStorage.setItem("pbook_user_session", JSON.stringify(freshUser));
    if (assignedPlan === "Free") setScreen("checkout");
    else setScreen("onboarding");
  };

  const handlePaymentSuccess = (finalPlan: UserPlan) => {
    if (user) {
      const updatedUser = { ...user, plan: finalPlan };
      setUser(updatedUser);
      localStorage.setItem("pbook_user_session", JSON.stringify(updatedUser));
    }
    setScreen("onboarding");
  };

  const handleUpdateOnboardingStep = (nextStep: number, fields: Partial<OnboardingData>) => {
    const updated = { ...onboardingData, ...fields, step: nextStep };
    setOnboardingData(updated);
    localStorage.setItem("pbook_onboarding_session", JSON.stringify(updated));
  };

  const handleOnboardingComplete = () => {
    const completed = { ...onboardingData, step: 5 };
    setOnboardingData(completed);
    localStorage.setItem("pbook_onboarding_session", JSON.stringify(completed));
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedPlan(null);
    setOnboardingData({ niche: "", audience: "", problem: "", offerName: "", offerPrice: "", offerSentence: "", gmail_connected: false, email_platform: "", email_platform_key: "", step: 1 });
    ['pbook_user_session','pbook_onboarding_session','pn_lmag','pn_d100','pn_email','pn_linkedin','pn_trip','pn_counts'].forEach(k => localStorage.removeItem(k));
    setScreen("landing");
  };

  const handleNavigate = (target: string) => {
    if (target === "login") setScreen("auth-login");
    else if (target === "signup") setScreen("auth-signup");
    else if (["about","changelog","contact","privacy","terms"].includes(target)) { setInfoPageName(target); setScreen("info-page"); }
    else setScreen("landing");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-[#edfc47] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#ffffff] min-h-screen text-[#000000] selection:bg-[#edfc47] font-sans antialiased">
      {screen === "landing" && <LandingPage onNavigate={handleNavigate} onSelectPlanAndSignup={handleSelectPricingTier} />}
      {screen === "auth-login" && <Auth initialMode="login" selectedPlan={selectedPlan} onAuthSuccess={handleAuthSuccess} onNavigateHome={() => setScreen("landing")} />}
      {screen === "auth-signup" && <Auth initialMode="signup" selectedPlan={selectedPlan} onAuthSuccess={handleAuthSuccess} onNavigateHome={() => setScreen("landing")} />}
      {screen === "checkout" && <Checkout currentPlan={user?.plan || "Free"} onPaymentSuccess={handlePaymentSuccess} onNavigateHome={() => setScreen("landing")} user={user} />}
      {screen === "onboarding" && <Onboarding initialStep={onboardingData.step || 1} onboardingData={onboardingData} onUpdateStep={handleUpdateOnboardingStep} onOnboardingComplete={handleOnboardingComplete} user={user} />}
      {screen === "dashboard" && user && <Dashboard user={user} onboardingData={onboardingData} onLogout={handleLogout} onUpdateProfile={(data) => { const upd = { ...user, ...data }; setUser(upd); localStorage.setItem("pbook_user_session", JSON.stringify(upd)); }} onUpdateOnboarding={(data) => { setOnboardingData(data); localStorage.setItem("pbook_onboarding_session", JSON.stringify(data)); }} onTriggerUpgradeCheckout={() => setScreen("checkout")} />}
      {screen === "info-page" && <InfoPages page={infoPageName} onBack={() => setScreen("landing")} />}
    </div>
  );
}
