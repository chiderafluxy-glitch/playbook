import { useState } from "react";
import { UserPlan } from "../types";
import { supabase, signUp, signIn } from "../lib/supabase";

interface AuthProps {
  initialMode: "login" | "signup";
  selectedPlan: UserPlan | null;
  onAuthSuccess: (name: string, email: string, plan: UserPlan, userId?: string) => void;
  onNavigateHome: () => void;
}

export default function Auth({ initialMode, selectedPlan, onAuthSuccess, onNavigateHome }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);

    if (mode === "signup") {
      // Try Supabase signup first
      const { data, error: sbError } = await signUp(email, password, name);
      if (sbError) {
        // Fallback to localStorage mode if Supabase not configured
        if (sbError.message?.includes('fetch') || sbError.message?.includes('placeholder')) {
          const plan: UserPlan = selectedPlan || "Basic";
          onAuthSuccess(name, email, plan, undefined);
        } else {
          setError(sbError.message);
        }
        setLoading(false);
        return;
      }
      if (data?.user) {
        onAuthSuccess(name, email, selectedPlan || "Free", data.user.id);
      }
    } else {
      const { data, error: sbError } = await signIn(email, password);
      if (sbError) {
        if (sbError.message?.includes('fetch') || sbError.message?.includes('placeholder')) {
          // Fallback: check localStorage
          const stored = localStorage.getItem("pbook_user_session");
          if (stored) {
            const u = JSON.parse(stored);
            if (u.email === email) { onAuthSuccess(u.name, u.email, u.plan); setLoading(false); return; }
          }
          setError("Invalid credentials.");
        } else {
          setError(sbError.message === "Invalid login credentials" ? "Incorrect email or password." : sbError.message);
        }
        setLoading(false);
        return;
      }
      if (data?.user) {
        // Profile + routing handled by App.tsx auth listener
        onAuthSuccess(data.user.user_metadata?.name || email.split('@')[0], email, selectedPlan || "Free", data.user.id);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={onNavigateHome} className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-[#edfc47] rounded-full" />
          </span>
          Playbook
        </button>
        <button onClick={onNavigateHome} className="text-sm text-gray-500 hover:text-black transition-colors">← Back to home</button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="text-gray-500">{mode === "signup" ? "Start building your lead machine." : "Sign in to your Playbook account."}</p>
          </div>

          {selectedPlan && mode === "signup" && (
            <div className="mb-6 p-4 bg-[#edfc47] rounded-xl">
              <p className="text-sm font-semibold">Selected: <span className="font-bold">{selectedPlan}</span></p>
              <p className="text-xs mt-1 opacity-70">Free access - no payment required.</p>
            </div>
          )}

          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full bg-black text-[#edfc47] font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} className="font-semibold text-black underline underline-offset-2">
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>

          {mode === "signup" && (
            <p className="text-center text-xs text-gray-400 mt-4">
              By creating an account you agree to our{" "}
              <button className="underline">Terms of Service</button> and{" "}
              <button className="underline">Privacy Policy</button>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
