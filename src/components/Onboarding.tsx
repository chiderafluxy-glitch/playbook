import { useState, useEffect } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { UserProfile, OnboardingData } from "../types";
import { supabase, upsertOnboarding, updateProfile, getSession } from "../lib/supabase";

interface OnboardingProps {
  initialStep: number;
  onboardingData: OnboardingData;
  onUpdateStep: (nextStep: number, fields: Partial<OnboardingData>) => void;
  onOnboardingComplete: () => void;
  user: UserProfile | null;
}

const EMAIL_PLATFORMS = ["Mailchimp","ConvertKit","ActiveCampaign","Mailerlite","Brevo","I don't use one"];

export default function Onboarding({ initialStep, onboardingData, onUpdateStep, onOnboardingComplete, user }: OnboardingProps) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 4));
  const [fields, setFields] = useState<OnboardingData>(onboardingData);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setFields(onboardingData); }, [onboardingData]);

  const saveToSupabase = async (updatedFields: Partial<OnboardingData>, nextStep: number) => {
    const session = await getSession();
    if (!session?.user?.id) return;
    await upsertOnboarding(session.user.id, {
      niche: updatedFields.niche, audience: updatedFields.audience,
      problem: updatedFields.problem, offer_name: updatedFields.offerName,
      offer_price: updatedFields.offerPrice, offer_sentence: updatedFields.offerSentence,
      step: nextStep
    });
    if (updatedFields.gmail_connected !== undefined || updatedFields.email_platform !== undefined) {
      await updateProfile(session.user.id, {
        gmail_connected: updatedFields.gmail_connected,
        email_platform: updatedFields.email_platform === "I don't use one" ? null : updatedFields.email_platform,
        email_platform_key: updatedFields.email_platform_key,
      });
    }
  };

  const completeOnboarding = async () => {
    const session = await getSession();
    if (session?.user?.id) {
      await upsertOnboarding(session.user.id, {
        niche: fields.niche, audience: fields.audience, problem: fields.problem,
        offer_name: fields.offerName, offer_price: fields.offerPrice,
        offer_sentence: fields.offerSentence, step: 5,
        completed_at: new Date().toISOString()
      });
      await updateProfile(session.user.id, {
        onboarding_complete: true,
        gmail_connected: fields.gmail_connected,
        email_platform: fields.email_platform === "I don't use one" ? null : fields.email_platform,
        email_platform_key: fields.email_platform_key,
      });
    }
  };

  const goNext = async (nextStep: number, updatedFields: Partial<OnboardingData>) => {
    setSaving(true);
    const merged = { ...fields, ...updatedFields };
    setFields(merged);
    onUpdateStep(nextStep, updatedFields);
    await saveToSupabase(merged, nextStep).catch(console.warn);
    setSaving(false);
    if (nextStep > 4) {
      setSuccess(true);
      await completeOnboarding().catch(console.warn);
      setTimeout(() => onOnboardingComplete(), 2000);
    } else {
      setStep(nextStep);
    }
  };

  const stepLabels = ["Your Niche","Your Audience","Your Offer","Connect Tools"];
  const progress = ((step - 1) / 3) * 100;

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#edfc47] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-3">You're all set.</h1>
          <p className="text-gray-500">Your marketing system is ready. Let's get you some leads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-[#edfc47] rounded-full" />
          </span>
          Playbook
        </div>
      </nav>

      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between mb-2">
            {stepLabels.map((label, i) => (
              <span key={i} className={`text-xs font-medium ${i + 1 === step ? "text-black" : "text-gray-300"}`}>{label}</span>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">Step {step} of 4</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">

          {/* Step 1 */}
          {step === 1 && (
            <Step1
              value={fields.niche}
              onChange={v => setFields(f => ({ ...f, niche: v }))}
              onNext={() => goNext(2, { niche: fields.niche })}
              saving={saving}
            />
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Step2
              audience={fields.audience}
              problem={fields.problem}
              onChangeAudience={v => setFields(f => ({ ...f, audience: v }))}
              onChangeProblem={v => setFields(f => ({ ...f, problem: v }))}
              onNext={() => goNext(3, { audience: fields.audience, problem: fields.problem })}
              saving={saving}
            />
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Step3
              offerName={fields.offerName}
              offerPrice={fields.offerPrice}
              offerSentence={fields.offerSentence}
              onChangeName={v => setFields(f => ({ ...f, offerName: v }))}
              onChangePrice={v => setFields(f => ({ ...f, offerPrice: v }))}
              onChangeSentence={v => setFields(f => ({ ...f, offerSentence: v }))}
              onNext={() => goNext(4, { offerName: fields.offerName, offerPrice: fields.offerPrice, offerSentence: fields.offerSentence })}
              saving={saving}
            />
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Step4
              gmailConnected={fields.gmail_connected}
              emailPlatform={fields.email_platform}
              emailPlatformKey={fields.email_platform_key}
              onToggleGmail={() => setFields(f => ({ ...f, gmail_connected: !f.gmail_connected }))}
              onSelectPlatform={v => setFields(f => ({ ...f, email_platform: v }))}
              onSetPlatformKey={v => setFields(f => ({ ...f, email_platform_key: v }))}
              onNext={() => goNext(5, { gmail_connected: fields.gmail_connected, email_platform: fields.email_platform, email_platform_key: fields.email_platform_key })}
              onSkip={() => goNext(5, {})}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepButton({ onClick, disabled, saving, label = "Continue" }: { onClick: () => void; disabled: boolean; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled || saving} className="flex items-center gap-2 bg-black text-[#edfc47] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
      {saving ? <Loader2 size={16} className="animate-spin" /> : null}
      {saving ? "Saving..." : label}
      {!saving && <ArrowRight size={16} />}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, helper, type = "text" }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
      {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
    </div>
  );
}

function Step1({ value, onChange, onNext, saving }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">First, what's your niche?</h1>
        <p className="text-gray-500">This helps us personalize every strategy, every piece of copy, and every output to your specific market.</p>
      </div>
      <Field label="My niche is…" value={value} onChange={onChange} placeholder="e.g. fitness, food, real estate, home services, ecommerce, content creation"
        helper="Be specific. 'Fitness for busy moms over 40' works better than just 'fitness'." />
      <StepButton onClick={onNext} disabled={!value.trim()} saving={saving} />
    </div>
  );
}

function Step2({ audience, problem, onChangeAudience, onChangeProblem, onNext, saving }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Who are you selling to?</h1>
        <p className="text-gray-500">Describe the exact person you want to attract. The more specific the better.</p>
      </div>
      <Field label="My target audience is…" value={audience} onChange={onChangeAudience}
        placeholder="e.g. homeowners aged 35–50, college students, local families, small business owners"
        helper="Think about the person who needs you most. What keeps them up at night?" />
      <Field label="Their biggest problem is…" value={problem} onChange={onChangeProblem}
        placeholder="e.g. they can't find a trustworthy service provider in their area" />
      <StepButton onClick={onNext} disabled={!audience.trim() || !problem.trim()} saving={saving} />
    </div>
  );
}

function Step3({ offerName, offerPrice, offerSentence, onChangeName, onChangePrice, onChangeSentence, onNext, saving }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">What are you selling?</h1>
        <p className="text-gray-500">This is what you ultimately want people to buy — your course, service, coaching, or product.</p>
      </div>
      <Field label="My offer is called…" value={offerName} onChange={onChangeName}
        placeholder="e.g. a plumbing service, online course, Shopify store, coaching program"
        helper="Don't overthink this. You can update it anytime in settings." />
      <Field label="It costs…" value={offerPrice} onChange={onChangePrice} placeholder="97" type="text" />
      <Field label="In one sentence it helps people…" value={offerSentence} onChange={onChangeSentence}
        placeholder="e.g. lose 10 pounds in 30 days without giving up their favourite foods" />
      <StepButton onClick={onNext} disabled={!offerName.trim() || !offerSentence.trim()} saving={saving} />
    </div>
  );
}

function Step4({ gmailConnected, emailPlatform, emailPlatformKey, onToggleGmail, onSelectPlatform, onSetPlatformKey, onNext, onSkip, saving }: any) {
  const hasConnection = gmailConnected || (emailPlatform && emailPlatform !== "I don't use one" && emailPlatformKey);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Last step — connect your tools.</h1>
        <p className="text-gray-500">Connect the platforms you already use so we can send everything there directly. You can skip and connect later in settings.</p>
      </div>

      {/* Gmail */}
      <div className={`p-5 rounded-2xl border-2 transition-all ${gmailConnected ? "border-black bg-black text-white" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold mb-0.5">Gmail</p>
            <p className={`text-sm ${gmailConnected ? "text-gray-300" : "text-gray-500"}`}>Save Dream 100 outreach as Gmail drafts. Review and send yourself.</p>
          </div>
          <button onClick={onToggleGmail} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${gmailConnected ? "bg-[#edfc47] text-black" : "bg-black text-[#edfc47] hover:bg-gray-900"}`}>
            {gmailConnected ? "Connected ✓" : "Connect Gmail"}
          </button>
        </div>
      </div>

      {/* Email Platform */}
      <div className="p-5 rounded-2xl border-2 border-gray-200">
        <p className="font-semibold mb-1">Email Platform</p>
        <p className="text-sm text-gray-500 mb-3">Send your nurture sequence directly to your email tool.</p>
        <select value={emailPlatform} onChange={e => onSelectPlatform(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-black">
          <option value="">Select your platform</option>
          {EMAIL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {emailPlatform && emailPlatform !== "I don't use one" && (
          <input type="text" value={emailPlatformKey} onChange={e => onSetPlatformKey(e.target.value)}
            placeholder="Paste your API key here"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
        )}
        {emailPlatform && emailPlatformKey && emailPlatform !== "I don't use one" && (
          <p className="text-xs text-green-600 mt-2 font-medium">✓ API key saved</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <StepButton onClick={onNext} disabled={false} saving={saving} label="Finish Setup" />
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-black underline underline-offset-2 transition-colors">
          Skip for now — I'll connect later
        </button>
      </div>
    </div>
  );
}
