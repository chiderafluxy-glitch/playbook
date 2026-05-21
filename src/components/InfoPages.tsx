import { ArrowLeft, BookOpen, Clock, ShieldCheck, Mail, Send } from "lucide-react";

interface InfoPagesProps {
  page: string;
  onBack: () => void;
}

export default function InfoPages({ page, onBack }: InfoPagesProps) {
  return (
    <div className="min-h-screen bg-[#f7f6f5] py-12 px-6 selection:bg-[#edfc47]">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#cccccc] p-8 md:p-12 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-black mb-8 hover:opacity-75 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {page === "about" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-[#edfc47] border border-black rounded-lg text-black">
                <BookOpen className="w-6 h-6" />
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black">
                About Playbook
              </h1>
            </div>
            <p className="text-[#4d4d4d] leading-relaxed mb-6 text-base">
              Playbook was born from a simple realization: Most solopreneurs, creators, and founders waste hundreds of hours reading business books and marketing tweets without ever translating those learnings into functional, profitable machines.
            </p>
            <p className="text-[#4d4d4d] leading-relaxed mb-6 text-base">
              Our vision is to bridge strategy and execution. By bundling the timeless, structured playbooks of marketing pioneers — Russell Brunson, Alex Hormozi, Gary Vaynerchuk, Ryan Deiss, Justin Welsh, and Perry Marshall — into an immediate AI automation engine, you go from a raw concept to functional landing pages, outreach pipelines, and upsell loops in minutes.
            </p>
            <div className="mt-8 p-6 bg-[#f7f6f5] rounded-xl border border-[#cccccc]">
              <h3 className="font-roobert font-bold text-lg mb-2 text-black">The Founders Statement</h3>
              <p className="italic text-sm text-[#4d4d4d] leading-normal">
                "Stop buying marketing courses. You already have the answers in your niche. You just need the code to generate the physical copy and automate the pipeline. That's why we built Playbook."
              </p>
            </div>
          </div>
        )}

        {page === "changelog" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-[#edfc47] border border-black rounded-lg text-black">
                <Clock className="w-6 h-6" />
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black">
                Changelog & Updates
              </h1>
            </div>
            <p className="text-[#4d4d4d] mb-8">We ship improvements continuously to make your inbound marketing machine faster and clearer.</p>
            <div className="space-y-8">
              <div className="border-l-2 border-black pl-6">
                <span className="text-xs font-bold font-mono bg-black text-[#edfc47] px-2 py-0.5 rounded">v1.2.0 (May 2026)</span>
                <h3 className="font-roobert font-bold text-lg mt-2 text-black">Perry Marshall 80/20 Analytics</h3>
                <p className="text-sm text-[#4d4d4d] mt-1 leading-relaxed">
                  Introduced the live Partner Scorecard ranking matrix. Automatically filters and highlights your high-vibe top 20% outreach ambassadors and writes deep thank-you prompts.
                </p>
              </div>
              <div className="border-l-2 border-[#cccccc] pl-6">
                <span className="text-xs font-semibold font-mono bg-[#f7f6f5] border border-[#cccccc] text-black px-2 py-0.5 rounded">v1.1.0</span>
                <h3 className="font-roobert font-bold text-lg mt-2 text-black">Justin Welsh Repurposer</h3>
                <p className="text-sm text-[#4d4d4d] mt-1 leading-relaxed">
                  Wired the LinkedIn organic content engine, turning your GaryVee jab structure into highly-readable scrolls.
                </p>
              </div>
              <div className="border-l-2 border-[#cccccc] pl-6">
                <span className="text-xs font-semibold font-mono bg-[#f7f6f5] border border-[#cccccc] text-black px-2 py-0.5 rounded">v1.0.0</span>
                <h3 className="font-roobert font-bold text-lg mt-2 text-black">Public Beta Release</h3>
                <p className="text-sm text-[#4d4d4d] mt-1 leading-relaxed">
                  First public deployment of the core Brunson Lander, Hormozi Dream 100 Scraper models, and Ryan Deiss Tripwire offers!
                </p>
              </div>
            </div>
          </div>
        )}

        {page === "contact" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-[#edfc47] border border-black rounded-lg text-black">
                <Mail className="w-6 h-6" />
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black">
                Contact Us
              </h1>
            </div>
            <p className="text-[#4d4d4d] mb-6">Have a feature request, question, or just want to tell us a success story? Send us a quick note below.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thanks! Message transmitted gracefully."); onBack(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] mb-1.5 uppercase font-mono">Your Name</label>
                <input required type="text" placeholder="Jane Doe" className="w-full bg-[#f7f6f5] border border-[#cccccc] focus:border-black rounded p-3 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] mb-1.5 uppercase font-mono">Your Work Email</label>
                <input required type="email" placeholder="jane@company.com" className="w-full bg-[#f7f6f5] border border-[#cccccc] focus:border-black rounded p-3 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] mb-1.5 uppercase font-mono">Message</label>
                <textarea required rows={4} placeholder="What can we help you solve?" className="w-full bg-[#f7f6f5] border border-[#cccccc] focus:border-black rounded p-3 text-sm focus:outline-none"></textarea>
              </div>
              <button type="submit" className="btn-primary w-full py-3 mt-4 text-center">
                Send Message <Send className="ml-2 w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {page === "privacy" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-[#edfc47] border border-black rounded-lg text-black">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black">
                Privacy Policy
              </h1>
            </div>
            <div className="space-y-4 text-sm text-[#4d4d4d] leading-relaxed">
              <p>Your privacy is of vital importance. This policy outlines how Playbook handles data entered in our sandbox environment.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">1. Information We Collect</h3>
              <p>We collect structural inputs submitted on our forms (onboarding info including niche definitions, problem-statements, and offer details) solely for the purpose of executing the server-side Gemini generation models.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">2. Third-Party API Proxying</h3>
              <p>Your inputs are securely transmitted to Google's Gemini models for processing. No PII is logged in our databases, and we do not store customer credentials.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">3. Sandbox Terms</h3>
              <p>Data stored in the preview browser's local state might occasionally be cleared on browser resets. We do not inspect personal lists of YouTube channels or generated outreach scripts.</p>
            </div>
          </div>
        )}

        {page === "terms" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-[#edfc47] border border-black rounded-lg text-black">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black">
                Terms of Service
              </h1>
            </div>
            <div className="space-y-4 text-sm text-[#4d4d4d] leading-relaxed">
              <p>Welcome to Playbook. By signing up, you agree to comply with our fair-use generation limits and playground policies.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">1. Usage Limits</h3>
              <p>Under the Basic plan, users are allocated up to 20 generations per tool, per billing cycle. Under the Pro plan, this limit upgrades to 100 generations per tool.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">2. Content Ownership</h3>
              <p>You maintain ultimate copyright ownership of the marketing copy generated by our playbooks. We assume no responsibility for the conversion performance of your outbound sequences.</p>
              <h3 className="font-roobert font-bold text-lg text-black mt-6">3. Simulated Transactions</h3>
              <p>Stripe payment portals displayed on this application are mock representations for demonstration and evaluation purposes. No real money or bank credits will be charged.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
