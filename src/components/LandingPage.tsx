import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Zap, Target, BookOpen, ChevronDown, ChevronUp, Star, AlertCircle, Bug, Compass, Lock, Activity } from 'lucide-react';
import { UserPlan } from '../types';
import WarRoom from './WarRoom';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onSelectPlanAndSignup: (plan: UserPlan) => void;
}

export default function LandingPage({ onNavigate, onSelectPlanAndSignup }: LandingPageProps) {
  // Active page view on landing page: 'home' | 'war-room'
  const [activeView, setActiveView] = useState<'home' | 'war-room'>('home');
  const [simulatedPlan, setSimulatedPlan] = useState<UserPlan>('Basic');
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [marketingOfferLabel, setMarketingOfferLabel] = useState('');

  // Bug reporting state
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugComplaints, setBugComplaints] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);

  // FAQ state index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSendBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle || !bugComplaints) return;
    setBugSubmitting(true);
    setTimeout(() => {
      setBugSubmitting(false);
      setBugSuccess(true);
      setTimeout(() => {
        setBugSuccess(false);
        setShowBugModal(false);
        setBugTitle('');
        setBugComplaints('');
      }, 2000);
    }, 1200);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSmoothScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "Do I need any marketing experience?",
      a: "No. You just enter your niche and offer and the system does the rest. Everything is copy/paste ready, formatted using exact playbook guidelines from leading conversion experts."
    },
    {
      q: "What tools do I need to connect?",
      a: "Nothing is required. You can use the outputs in any email tool, social platform, or website builder you already use. We provide clean copy assets and downloadable data schemas."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. No contracts, no lock-ins. You can transition or cancel from your settings page in one click instantly."
    },
    {
      q: "What’s the difference between Basic and Pro?",
      a: "Basic covers the core conversion loop — Russell Brunson lead magnets, Hormozi Dream 100 Outreach lists, and GaryVee value-driven email streams. Pro adds Justin Welsh LinkedIn content generators, Perry Marshall scorecard dashboards, and Ryan Deiss tripwire upsells."
    },
    {
      q: "How many leads can I get with this?",
      a: "That depends on your niche and how many partners you reach out to. Users who complete the full Dream 100 outreach typically see results within 2–4 weeks by leveraging pre-existing audience channels."
    }
  ];

  return (
    <div className="w-full bg-white selection:bg-[#edfc47] selection:text-black min-h-screen flex flex-col font-sans text-black">
      
      {/* Navigation Bar - height 72px */}
      <header className="h-[72px] sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 md:px-12 flex items-center justify-between transition-all border-b border-[#cccccc]/30">
        <div 
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="font-roobert font-extrabold text-2xl tracking-tight cursor-pointer flex items-center gap-1.5 text-black"
          id="nav-logo"
        >
          <span>Playbook</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#edfc47] border border-black inline-block" />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => {
              setActiveView('home');
              setTimeout(() => handleSmoothScroll('features'), 100);
            }} 
            className="text-sm font-semibold text-[#4d4d4d] hover:text-black transition-colors cursor-pointer"
            id="nav-features"
          >
            Features
          </button>
          <button 
            onClick={() => {
              setActiveView('home');
              setTimeout(() => handleSmoothScroll('pricing'), 100);
            }} 
            className="text-sm font-semibold text-[#4d4d4d] hover:text-black transition-colors cursor-pointer"
            id="nav-pricing"
          >
            Pricing
          </button>

          <button 
            onClick={() => {
              setActiveView(activeView === 'war-room' ? 'home' : 'war-room');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`text-xs font-semibold py-1.5 px-3 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'war-room' 
                ? 'bg-black text-[#edfc47] border-black shadow-md' 
                : 'text-black border-black/20 hover:bg-[#f7f6f5]'
            }`}
            id="nav-war-room"
          >
            <Compass className={`w-3.5 h-3.5 ${activeView === 'war-room' ? 'text-[#edfc47]' : 'text-black animate-pulse'}`} />
            <span>The War Room</span>
            <span className="text-[9px] bg-[#edfc47] text-black px-1.5 py-0.5 rounded border border-black font-bold uppercase tracking-wider scale-90">LIVE</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('login')} 
            className="text-sm font-semibold text-black hover:text-[#4d4d4d] px-4 py-2 transition-colors cursor-pointer"
            id="nav-login"
          >
            Login
          </button>
          
          <button 
            onClick={() => onNavigate('signup')} 
            className="bg-black text-white hover:bg-zinc-900 border border-black text-sm font-semibold py-2 px-5 rounded-[6px] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            id="nav-get-started"
          >
            <span>Start free</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#edfc47]" />
          </button>
        </div>
      </header>

      {activeView === 'war-room' ? (
        <div className="max-w-[1200px] w-full mx-auto px-6 py-10 md:py-16 flex-1 space-y-8">
          {/* Simulated Controls / Info Banner */}
          <div className="bg-white border border-[#cccccc] rounded-xl p-6 text-left relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
              style={{
                backgroundImage: `linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }}
            />
            <div className="relative z-10 space-y-1.5 max-w-xl">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-black bg-[#edfc47] px-2.5 py-0.5 rounded border border-black shadow-sm">
                <Compass className="w-3 h-3 text-black animate-spin" style={{ animationDuration: '6s' }} /> Interactive Sandbox Mode
              </span>
              <h2 className="text-xl md:text-2xl font-roobert font-extrabold text-black tracking-tight">
                Preview Playbook Loops Live
              </h2>
              <p className="text-[#4d4d4d] text-xs leading-relaxed font-sans font-medium">
                Toggle simulated builder plans to view how Russell Brunson or Hormozi loops connect. Create your private account to customize copies, run scorecard matrices, and deploy strategies.
              </p>
            </div>
            
            {/* Simulation Tier Switcher */}
            <div className="relative z-10 shrink-0 flex items-center gap-3 bg-[#f7f6f5] p-2 rounded-lg border border-[#cccccc]">
              <span className="text-xs text-[#4d4d4d] font-semibold pl-1 uppercase font-mono tracking-wider">Plan Mock:</span>
              <div className="inline-flex rounded bg-white border border-[#cccccc] p-0.5">
                <button
                  type="button"
                  onClick={() => setSimulatedPlan('Basic')}
                  className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${simulatedPlan === 'Basic' ? 'bg-black text-[#edfc47] shadow-sm' : 'text-[#4d4d4d] hover:text-black'}`}
                >
                  Basic
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedPlan('Pro')}
                  className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${simulatedPlan === 'Pro' ? 'bg-black text-[#edfc47] border border-black shadow-sm' : 'text-[#4d4d4d] hover:text-black'}`}
                >
                  Pro ⭐
                </button>
              </div>
            </div>
          </div>

          {/* TACTICAL WAR ROOM CONTAINER - Dark tactical card for sandbox */}
          <div className="bg-[#111614] rounded-2xl border-4 border-black p-4 md:p-8 relative inset-0 shadow-2xl overflow-hidden text-white" id="strictly-tactical-war-room">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] font-mono text-green-400 tracking-widest font-bold bg-green-950/80 px-2 py-0.5 rounded border border-green-500/30">
                TACTICAL SANDBOX DECK
              </span>
            </div>
            
            <WarRoom 
              user={{ name: "Guest", email: "guest@playbook.io", plan: simulatedPlan }}
              setActiveTab={(tab) => {
                setMarketingOfferLabel(tab);
                setShowMarketingModal(true);
              }}
              onTriggerUpgrade={() => {
                setMarketingOfferLabel("Pro Active Loops");
                setShowMarketingModal(true);
              }}
              handleProtectedClick={(tab, label) => {
                setMarketingOfferLabel(label);
                setShowMarketingModal(true);
              }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Section 1 - Hero Section */}
          <section className="max-w-[1200px] w-full mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              {/* Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#cccccc] bg-[#f7f6f5] text-xs font-semibold tracking-wide text-[#4d4d4d] mb-8 shadow-sm">
                <span className="text-[10px] font-bold bg-[#edfc47] text-black border border-black px-2 py-0.5 rounded uppercase scale-90">NEW</span>
                <span>Playbook Loops 2.0 has arrived</span>
              </div>
              
              {/* Original Bold Display Headline */}
              <h1 className="text-4xl md:text-[64px] font-roobert font-extrabold text-black tracking-tight leading-[1.1] mb-8" id="hero-headline">
                SaaS Marketing Loops Where <br />
                Ideas <span className="underline decoration-[#edfc47] decoration-wavy decoration-4">Thrive</span>, Not Fade Away
              </h1>
              
              <p className="text-base md:text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed mb-10 font-medium" id="hero-subheadline">
                For anyone with an offer and a need for more customers — products, services, or content. We automate the exact marketing loops used by Alex Hormozi, Russell Brunson, and GaryVee so founders and creators can capture prospects, nurture them, and secure subscriptions without agencies at the click of a button.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                {/* Primary Pill Button */}
                <button 
                  onClick={() => onNavigate('signup')} 
                  className="w-full sm:w-auto text-center bg-black hover:bg-zinc-900 border border-black text-white font-bold text-sm py-3 px-8 rounded-[6px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="hero-btn-signup"
                >
                  <span>Start free trial</span>
                  <ArrowRight className="w-4 h-4 text-[#edfc47]" />
                </button>
                
                {/* Outlined Pill button */}
                <button 
                  onClick={() => {
                    setActiveView('war-room');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="w-full sm:w-auto text-center text-black bg-white border-2 border-black hover:bg-[#f7f6f5] font-bold text-sm py-3 px-8 rounded-[6px] shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="hero-btn-war-room"
                >
                  <Compass className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Launch Live War Room</span>
                </button>
                
                <button 
                  onClick={() => handleSmoothScroll('how-it-works')} 
                  className="w-full sm:w-auto text-center text-[#4d4d4d] hover:text-black font-semibold text-sm py-3 px-4 transition-colors cursor-pointer hover:underline"
                  id="hero-btn-how"
                >
                  How it works
                </button>
              </div>

              {/* Product Mock Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-16 bg-white border-2 border-black rounded-xl p-6 shadow-xl max-w-5xl mx-auto relative group overflow-hidden"
              >
                {/* Title interface bar */}
                <div className="flex items-center justify-between pb-4 border-b border-[#cccccc] mb-6 text-left">
                  <div className="flex items-center gap-2 text-xs text-[#4d4d4d] font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
                    <span className="ml-2 font-bold uppercase tracking-wider text-black">Active Command Dashboard Preview</span>
                  </div>
                  <div className="text-[10px] bg-[#edfc47] text-black border border-black px-2 py-0.5 rounded font-bold font-mono uppercase">
                    CLIENT MODE
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                  {/* Left Sidebar mockup */}
                  <div className="md:col-span-3 bg-[#f7f6f5] rounded-lg p-4 border border-[#cccccc] space-y-4 font-mono text-xs text-[#4d4d4d]">
                    <div className="font-bold text-black text-[10px] tracking-wider uppercase">📂 STRATEGIES</div>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-black font-bold bg-[#edfc47] p-1.5 rounded border border-black"><div className="w-1.5 h-1.5 rounded-full bg-black" /> Lead Magnet Funnel</li>
                      <li className="flex items-center gap-2 p-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#4d4d4d]/40" /> Dream 100 List</li>
                      <li className="flex items-center gap-2 p-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#4d4d4d]/40" /> GaryVee Nurturing</li>
                      <li className="flex items-center gap-2 opacity-50 p-1.5"><Lock className="w-3 h-3" /> Welsh LinkedIn Pro</li>
                      <li className="flex items-center gap-2 opacity-50 p-1.5"><Lock className="w-3 h-3" /> Partner Scorecard</li>
                    </ul>
                  </div>

                  {/* Mid main workspace mockup */}
                  <div className="md:col-span-9 space-y-4">
                    <span className="text-[9px] font-bold text-black bg-[#edfc47] border border-black px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                      PLAYBOOK SANDBOX ACTIVE
                    </span>
                    <h3 className="font-roobert font-extrabold text-2xl text-black leading-tight">
                      Russell Brunson's 3-Second Lead Funnel
                    </h3>
                    <p className="text-[#4d4d4d] text-sm leading-relaxed max-w-xl font-medium">
                      Generate high-converting offer blueprints automatically aligned with target keywords and customized benefits.
                    </p>

                    <div className="border-2 border-dashed border-black bg-white rounded-lg p-4 font-mono text-xs text-black space-y-2">
                      <p className="text-black font-extrabold text-sm">H1: How to get 5+ Qualified SaaS Trials Daily</p>
                      <p className="text-[#4d4d4d] italic">H2: Without spending a single dollar on cold advertising.</p>
                      <p className="text-[11px] text-[#4d4d4d] pt-2 border-t border-[#cccccc]/40">✓ Benefit 1: Save 40+ hours of outreach copywriting manually</p>
                      <p className="text-[11px] text-[#4d4d4d]">✓ Benefit 2: Instantly deploy copy to your active landing tools</p>
                    </div>
                  </div>
                </div>

                {/* Floating Quote testimonial card */}
                <div className="absolute bottom-4 right-4 bg-white border-2 border-black rounded-lg p-4 shadow-lg max-w-xs text-left hidden md:block">
                  <p className="font-sans font-medium text-xs text-black leading-relaxed mb-2.5">
                    "This converted our static SaaS landing page from an expense into a genuine subscriber capture loop!"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#edfc47] border border-black flex items-center justify-center text-[10px] text-black font-extrabold">M</div>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-black leading-none">Marcus Sterling</h5>
                      <span className="text-[9px] text-[#4d4d4d] font-mono">Founder, SaasLoop</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Section 2 - Social Proof Trust Rating Bar */}
          <section className="w-full py-12 border-y border-[#cccccc]/50 bg-[#f7f6f5]">
            <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-between">
              
              <div className="text-center md:text-left">
                <div className="font-roobert font-extrabold text-2xl text-black">3.2 Minutes</div>
                <div className="text-xs text-[#4d4d4d] font-semibold uppercase tracking-wider font-mono">Middle time to launch your first loop</div>
              </div>

              <div className="flex flex-col items-center justify-center font-roobert text-center select-none">
                <div className="font-extrabold text-2xl text-black">Trusted By</div>
                <div className="text-xs text-[#4d4d4d] font-semibold uppercase tracking-wider font-mono">15+ active business owners</div>
              </div>

              <div className="text-center md:text-right">
                <div className="font-roobert font-extrabold text-2xl text-black">6 Playbooks</div>
                <div className="text-xs text-[#4d4d4d] font-semibold uppercase tracking-wider font-mono">Engineered directly from top creators</div>
              </div>

            </div>
          </section>

          {/* Section 3 - How It Works */}
          <section id="how-it-works" className="py-20 md:py-24 bg-white">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-[#4d4d4d] border-b-2 border-[#edfc47] pb-1 font-mono">
                  THE PLAYBOOK BLUEPRINT
                </span>
                <h2 className="text-3xl md:text-4xl font-roobert font-extrabold text-black mt-4" id="how-header">
                  Three Steps. Six Strategies. One System.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-16">
                {/* Step 1 */}
                <div className="flex flex-col bg-white border border-[#cccccc] p-8 rounded-xl shadow-sm relative hover:border-black transition-all">
                  <span className="w-8 h-8 bg-[#edfc47] border border-black text-black font-mono font-bold text-sm flex items-center justify-center rounded mb-6">
                    1
                  </span>
                  <h3 className="font-roobert font-bold text-lg mb-3 text-black">
                    Declare Your Offering
                  </h3>
                  <p className="text-sm text-[#4d4d4d] leading-normal font-medium">
                    Enter your niche, target audience, and primary pricing offer. It takes under 2 minutes of onboard input.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col bg-white border border-[#cccccc] p-8 rounded-xl shadow-sm relative hover:border-black transition-all">
                  <span className="w-8 h-8 bg-[#edfc47] border border-black text-black font-mono font-bold text-sm flex items-center justify-center rounded mb-6">
                    2
                  </span>
                  <h3 className="font-roobert font-bold text-lg mb-3 text-black">
                    Calibrate Playbook Loops
                  </h3>
                  <p className="text-sm text-[#4d4d4d] leading-normal font-medium">
                    Select any of the 6 active strategies — from Lead Funnels to Perry Marshall 80/20 Scorecard filters.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col bg-white border border-[#cccccc] p-8 rounded-xl shadow-sm relative hover:border-black transition-all">
                  <span className="w-8 h-8 bg-[#edfc47] border border-black text-black font-mono font-bold text-sm flex items-center justify-center rounded mb-6">
                    3
                  </span>
                  <h3 className="font-roobert font-bold text-lg mb-3 text-black">
                    Distribute & Harvest
                  </h3>
                  <p className="text-sm text-[#4d4d4d] leading-normal font-medium">
                    Deploy copy structures instantly, download email loops, and capture qualified inbound subscriptions on autopilot.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('signup')} 
                className="bg-black hover:bg-zinc-900 border border-black text-white font-bold text-sm py-3.5 px-8 rounded-[6px] shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                id="how-btn-signup"
              >
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4 text-[#edfc47]" />
              </button>
            </div>
          </section>

          {/* Section 4 - Feature Grid */}
          <section id="features" className="py-20 md:py-24 bg-[#f7f6f5] border-y border-[#cccccc]/40">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-[#4d4d4d] bg-white border border-[#cccccc] px-3 py-1 rounded font-mono shadow-sm">
                  CORE SYSTEM PLAYBOOKS
                </span>
                <h2 className="text-3xl md:text-4xl font-roobert font-extrabold text-black mt-4" id="features-header">
                  Direct Loop Frameworks Built on Real Experience
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Feature 1 - Lead Magnet Builder */}
                <div className="bg-white border border-[#cccccc] p-8 rounded-xl hover:border-black transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc]/70 px-2.5 py-0.5 rounded font-mono">
                        BASIC TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">Lead Funnel Blueprints</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Assemble highly structured opt-in lead assets matching Russell Brunson’s formatting checklists.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-[#4d4d4d] font-mono">
                    <span>Brunson Loop</span>
                    <span className="text-[9px] font-bold text-black bg-[#edfc47] border border-black py-0.5 px-2 rounded uppercase">Basic</span>
                  </div>
                </div>

                {/* Feature 2 - Dream 100 Outreach */}
                <div className="bg-white border border-[#cccccc] p-8 rounded-xl hover:border-black transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm">
                        <Target className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc]/70 px-2.5 py-0.5 rounded font-mono">
                        BASIC TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">Dream 100 Outbound</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Isolate partners who already own attention. Write value-driven intros to unlock warm exchanges automatically.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-[#4d4d4d] font-mono">
                    <span>Alex Hormozi Loop</span>
                    <span className="text-[9px] font-bold text-black bg-[#edfc47] border border-black py-0.5 px-2 rounded uppercase">Basic</span>
                  </div>
                </div>

                {/* Feature 3 - Email Nurture Sequence */}
                <div className="bg-white border border-[#cccccc] p-8 rounded-xl hover:border-black transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm">
                        <Zap className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc]/70 px-2.5 py-0.5 rounded font-mono">
                        BASIC TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">3 Jabs + 1 Hook Stream</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Write high-volume educational sequences. Pitch your memberships purely after stacking true value.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-[#4d4d4d] font-mono">
                    <span>GaryVee Sequence</span>
                    <span className="text-[9px] font-bold text-black bg-[#edfc47] border border-black py-0.5 px-2 rounded uppercase">Basic</span>
                  </div>
                </div>

                {/* Feature 4 - LinkedIn Content */}
                <div className="bg-white border-2 border-black p-8 rounded-xl hover:translate-y-[-1px] transition-all flex flex-col justify-between shadow relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[8px] font-mono bg-[#000000] text-[#edfc47] px-2 py-0.5 rounded border border-black uppercase font-bold tracking-widest">PRO UNLOCKED</div>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm mt-2">
                        <Compass className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc] px-2.5 py-0.5 rounded font-mono mt-2">
                        PRO TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">LinkedIn Content Feed</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Harvest successful newsletter jabs and convert them into minimalist organic feed carousels optimized for reach.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-black font-mono font-bold">
                    <span>Justin Welsh Flow</span>
                    <span className="text-[9px] font-semibold text-black bg-zinc-100 py-0.5 px-2 rounded border border-black uppercase">PRO 🔒</span>
                  </div>
                </div>

                {/* Feature 5 - Partner Scorecard */}
                <div className="bg-white border-2 border-black p-8 rounded-xl hover:translate-y-[-1px] transition-all flex flex-col justify-between shadow relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[8px] font-mono bg-[#000000] text-[#edfc47] px-2 py-0.5 rounded border border-black uppercase font-bold tracking-widest">PRO UNLOCKED</div>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm mt-2">
                        <Star className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc] px-2.5 py-0.5 rounded font-mono mt-2">
                        PRO TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">80/20 Partnership Audit</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Sift aggregate partners sent. Pinpoint top producers driving eighty percent of leads with granular charts.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-black font-mono font-bold">
                    <span>Perry Marshall System</span>
                    <span className="text-[9px] font-semibold text-black bg-zinc-100 py-0.5 px-2 rounded border border-black uppercase">PRO 🔒</span>
                  </div>
                </div>

                {/* Feature 6 - Tripwires */}
                <div className="bg-white border-2 border-black p-8 rounded-xl hover:translate-y-[-1px] transition-all flex flex-col justify-between shadow relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[8px] font-mono bg-[#000000] text-[#edfc47] px-2 py-0.5 rounded border border-black uppercase font-bold tracking-widest">PRO UNLOCKED</div>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-block p-2 text-black bg-[#edfc47] rounded border border-black shadow-sm mt-2">
                        <ShieldCheck className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f6f5] border border-[#cccccc] px-2.5 py-0.5 rounded font-mono mt-2">
                        PRO TIER
                      </span>
                    </div>
                    <h3 className="font-roobert font-bold text-lg mb-2 text-black">Post-Purchase Tripwires</h3>
                    <p className="text-xs text-[#4d4d4d] leading-relaxed font-medium">
                      Offset promotion budgets setup immediately. Present high-impulse upsell checks contextually ties to entry points.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#cccccc]/30 flex items-center justify-between text-[11px] text-black font-mono font-bold">
                    <span>Ryan Deiss Tripwire</span>
                    <span className="text-[9px] font-semibold text-black bg-zinc-100 py-0.5 px-2 rounded border border-black uppercase">PRO 🔒</span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Section 5 - Pricing */}
          <section id="pricing" className="py-20 md:py-24 bg-white">
            <div className="max-w-[1000px] mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-[#4d4d4d] border-b-2 border-[#edfc47] pb-1 font-mono">
                  FLEXIBLE BUILDER PLANS
                </span>
                <h2 className="text-3xl md:text-4xl font-roobert font-extrabold text-black mt-4" id="pricing-header">
                  Simple Pricing. No Surprises.
                </h2>
                <p className="text-[#4d4d4d] text-sm mt-4 font-medium" id="pricing-subheader">
                  Choose the scope of copies you wish to launch. Upgrade or cancel inside settings anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch font-sans">
                {/* Basic Plan */}
                <div className="bg-white border border-[#cccccc] shadow-sm hover:border-black transition-all rounded-xl p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-roobert font-extrabold text-2xl text-black">Basic Plan</h3>
                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate bg-[#f7f6f5] border border-[#cccccc] px-2.5 py-1 rounded">
                        Core Loops
                      </span>
                    </div>
                    
                    <div className="mb-6 flex items-baseline">
                      <span className="font-roobert font-extrabold text-5xl text-black">$15</span>
                      <span className="text-[#4d4d4d] text-sm font-semibold ml-1">/ month</span>
                    </div>

                    <p className="text-xs text-[#4d4d4d] mb-8 leading-relaxed font-sans font-medium">
                      Ideal for builders implementing high-converting outbound lead architectures first.
                    </p>

                    <div className="space-y-4 border-t border-[#cccccc]/40 pt-6 mb-8 font-sans">
                      <p className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">INCLUDED LOOPS:</p>
                      <ul className="space-y-3.5 text-xs text-black">
                        {[
                          "Russell Brunson's Lead Funnel copy blueprints",
                          "Alex Hormozi's Dream 100 Partner schemas",
                          "GaryVee's 3-Jabs 1-Hook email loops",
                          "Up to 20 AI generations per tool monthly",
                          "Standard email and builder support access"
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="w-4 h-4 rounded bg-[#edfc47] border border-black flex items-center justify-center shrink-0 text-black text-[9px] font-bold mt-0.5">
                              ✓
                            </span>
                            <span className="font-sans font-medium text-[#4d4d4d] text-[13px]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectPlanAndSignup('Basic')} 
                    className="w-full bg-transparent border border-black hover:bg-[#f7f6f5] text-black font-bold text-sm py-3 px-6 rounded-[6px] text-center cursor-pointer transition-colors"
                    id="pricing-btn-basic"
                  >
                    Select Basic Plan
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white border-2 border-black shadow-md rounded-xl p-8 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#000000] text-[#edfc47] border-b border-l border-black text-[8px] font-bold py-1.5 px-4 rounded-bl-[10px] uppercase tracking-wider font-mono">
                    RECOMMENDED
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-roobert font-extrabold text-2xl text-black">Pro Plan</h3>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#edfc47] border border-black animate-pulse" />
                    </div>
                    
                    <div className="mb-6 flex items-baseline">
                      <span className="font-roobert font-extrabold text-5xl text-black">$30</span>
                      <span className="text-[#4d4d4d] text-sm font-semibold ml-1">/ month</span>
                    </div>

                    <p className="text-xs text-[#4d4d4d] mb-8 leading-relaxed font-sans font-medium">
                      Unlock Justin Welsh carousels, scorecards, and post-purchase high-converters.
                    </p>

                    <div className="space-y-4 border-t border-[#cccccc]/40 pt-6 mb-8">
                      <p className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">PRO SUPERPOWERS:</p>
                      <ul className="space-y-3.5 text-xs text-black">
                        {[
                          "Everything included in standard package",
                          "Justin Welsh's LinkedIn Carousel generator",
                          "Perry Marshall's 80/20 analytic matrix scorecard",
                          "Ryan Deiss's Tripwire Upsell offer writer",
                          "Generous 100 generations per tool monthly",
                          "Priority fast-track operational builder support"
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="w-4 h-4 bg-[#edfc47] border border-black flex items-center justify-center shrink-0 text-black text-[9px] font-bold mt-0.5 rounded">
                              ✓
                            </span>
                            <span className={`font-sans text-[13px] ${item === "Everything included in standard package" ? "font-bold text-black" : "text-[#4d4d4d]"}`}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectPlanAndSignup('Pro')} 
                    className="w-full bg-black hover:bg-zinc-900 border border-black text-white font-bold text-sm py-3 px-6 rounded-[6px] text-center cursor-pointer transition-colors"
                    id="pricing-btn-pro"
                  >
                    Select Pro Plan
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-[#4d4d4d] mt-8 font-mono uppercase tracking-wider" id="pricing-footnote">
                Basic package includes a 3-day free trial sandbox. No credit card required.
              </p>
            </div>
          </section>

          {/* Section 6 - FAQ */}
          <section className="py-20 md:py-24 bg-[#f7f6f5] border-y border-[#cccccc]/50">
            <div className="max-w-[800px] mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-[#4d4d4d] font-mono">
                  HAVE QUESTIONS?
                </span>
                <h2 className="text-3xl md:text-4xl font-roobert font-extrabold text-black mt-4" id="faq-header">
                  Common Ground
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div 
                    key={i} 
                    className="bg-white border border-[#cccccc] rounded-xl overflow-hidden transition-all duration-300 hover:border-black"
                  >
                    <button
                      onClick={() => toggleFaq(i)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between font-roobert font-bold text-lg text-black hover:bg-[#f7f6f5]/50 cursor-pointer"
                      id={`faq-btn-${i}`}
                    >
                      <span className="text-base text-black pr-4">{faq.q}</span>
                      {openFaqIndex === i ? (
                        <ChevronUp className="w-5 h-5 text-[#4d4d4d]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#4d4d4d]" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {openFaqIndex === i && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-1 text-[#4d4d4d] text-sm leading-relaxed border-t border-[#cccccc]/40 font-sans font-medium">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 7 - Final CTA */}
          <section className="py-20 md:py-24 bg-white text-center flex flex-col items-center justify-center">
            <div className="max-w-4xl px-6">
              <h2 className="text-3xl md:text-5xl font-roobert font-extrabold text-black mb-6" id="cta-header">
                Build Your Subscriber Loop
              </h2>
              <p className="text-sm md:text-base text-[#4d4d4d] max-w-xl mx-auto mb-10 leading-relaxed font-semibold font-sans" id="cta-subheader">
                Join hundreds of operators who automated outreach copywriting. Let our modern sandbox templates configure copies instantly.
              </p>

              <button 
                onClick={() => onNavigate('signup')} 
                className="bg-black hover:bg-zinc-900 border border-black text-white font-bold text-sm py-3.5 px-8 rounded-[6px] shadow-sm transition-all inline-flex items-center gap-3 cursor-pointer"
                id="cta-btn-signup"
              >
                <span>Activate my sandbox</span>
                <ArrowRight className="w-4 h-4 text-[#edfc47]" />
              </button>
              <p className="text-[11px] text-[#4d4d4d] mt-4 font-mono uppercase tracking-wider">
                Try 3 days completely free. Cancel in one click.
              </p>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#cccccc]/40 pt-16 pb-8 px-6 md:px-12 font-sans">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
          
          <div className="flex flex-col gap-4">
            <div className="font-roobert font-extrabold text-xl tracking-tight text-black flex items-center gap-1.5">
              <span>Playbook</span>
              <span className="w-2 h-2 rounded-full bg-[#edfc47] border border-black" />
            </div>
            <p className="text-xs text-[#4d4d4d] leading-relaxed font-sans font-medium">
              Automated conversion and partnership marketing strategies for founders who seek inbound lists without agencies.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-sans font-bold text-[11px] tracking-wider text-[#4d4d4d] uppercase font-mono">Product</span>
            <ul className="space-y-2 text-xs text-black font-semibold">
              <li>
                <button onClick={() => handleSmoothScroll('features')} className="hover:text-black cursor-pointer">
                  Capabilities
                </button>
              </li>
              <li>
                <button onClick={() => handleSmoothScroll('pricing')} className="hover:text-black cursor-pointer">
                  Pricing List
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveView('war-room'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#4d4d4d] cursor-pointer text-black font-bold flex items-center gap-1">
                  <span>Interactive Map</span>
                  <Compass className="w-3 h-3 text-black animate-spin" style={{ animationDuration: '12s' }} />
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-sans font-bold text-[11px] tracking-wider text-[#4d4d4d] uppercase font-mono">Workspace Support</span>
            <ul className="space-y-2 text-xs text-black font-semibold">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-black cursor-pointer">
                  About Sandbox
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-black cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-black cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setShowBugModal(true);
                    setBugSuccess(false);
                  }} 
                  className="font-bold text-black hover:text-[#4d4d4d] transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <Bug className="w-3.5 h-3.5 text-black" />
                  Report Anomaly
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-sans font-bold text-[11px] tracking-wider text-[#4d4d4d] uppercase font-mono">Registration</span>
            <ul className="space-y-2 text-xs text-black font-semibold">
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-black cursor-pointer">
                  Login Access
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('signup')} className="hover:text-black cursor-pointer">
                  Register Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto border-t border-[#cccccc]/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] text-[#4d4d4d] font-bold">
          <span>
            © 2026 Playbook SaaS. All rights reserved. Recoded with high-contrast precision.
          </span>
          <div className="flex gap-4">
            <span>SSL Secured Sandbox</span>
            <span>·</span>
            <span>Certified Operational Playbooks</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Bug Button */}
      <button 
        onClick={() => {
          setShowBugModal(true);
          setBugSuccess(false);
        }}
        className="fixed bottom-6 right-6 z-40 bg-black text-[#edfc47] border border-black hover:bg-zinc-900 transition-transform active:scale-95 duration-200 p-3.5 rounded-full shadow-lg flex items-center justify-center cursor-pointer group"
        title="Report anomaly"
      >
        <Bug className="w-4 h-4 text-[#edfc47]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-[11px] font-sans font-bold uppercase tracking-wider transition-all duration-300">
          Report anomaly
        </span>
      </button>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {showBugModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border-2 border-black rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative text-black"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-black text-[#edfc47]">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-roobert font-extrabold text-lg text-black">Report Anomaly</h4>
                      <p className="text-[11px] text-[#4d4d4d] font-mono">Refine our operational loop compilers</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowBugModal(false)}
                    className="text-[#4d4d4d] hover:text-black font-extrabold text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {bugSuccess ? (
                  <div className="py-8 text-center space-y-3 font-sans">
                    <div className="w-10 h-10 rounded-full bg-[#edfc47] border border-black text-black flex items-center justify-center mx-auto text-base font-bold">
                      ✓
                    </div>
                    <h5 className="font-roobert font-extrabold text-black text-lg">Anomalies Logged</h5>
                    <p className="text-xs text-[#4d4d4d] max-w-xs mx-auto font-semibold">
                      Thank you. Our background sandbox diagnostic routines have registered your anomaly report.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendBug} className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#4d4d4d] font-mono">
                        Title of Your Bug
                      </label>
                      <input 
                        type="text"
                        required
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="e.g. Commander hex table offset coordinates"
                        className="w-full px-4 py-2 text-sm border border-[#cccccc] focus:border-black rounded-[6px] outline-none transition-all bg-[#f7f6f5] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#4d4d4d] font-mono">
                        Describe the Anomaly
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={bugComplaints}
                        onChange={(e) => setBugComplaints(e.target.value)}
                        placeholder="Detail exactly what was askew across the blueprint loops..."
                        className="w-full px-4 py-3 text-sm border border-[#cccccc] focus:border-black rounded-[8px] outline-none transition-all bg-[#f7f6f5] focus:bg-white resize-none font-medium"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBugModal(false)}
                        className="flex-1 px-4 py-2.5 border border-[#cccccc] hover:bg-[#f7f6f5] rounded-[6px] text-xs font-semibold text-[#4d4d4d] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bugSubmitting}
                        className="flex-1 px-4 py-2.5 bg-black text-[#edfc47] hover:bg-[#111] transition-all rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {bugSubmitting ? (
                          <div className="w-3 h-3 border-2 border-[#edfc47] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Submit report'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Sandbox Marketing Modal Overlay */}
      <AnimatePresence>
        {showMarketingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border-2 border-black rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative text-black"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-black text-[#edfc47]">
                      <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <h4 className="font-roobert font-extrabold text-lg text-black">Unlock Active Playbook Loop</h4>
                      <p className="text-[10px] text-[#4d4d4d] font-mono font-bold tracking-wider">SANDBOX ACCESS REQUIRED</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMarketingModal(false)}
                    className="text-[#4d4d4d] hover:text-black font-extrabold text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="bg-[#f7f6f5] border border-[#cccccc] rounded-lg p-4 font-mono text-xs text-black leading-relaxed space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-black">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#edfc47] border border-black" />
                      SELECTED PLAYBOOK TARGET:
                    </p>
                    <p className="font-bold uppercase tracking-wider text-black bg-[#edfc47] py-1 px-2.5 rounded border border-black inline-block">
                      📍 {marketingOfferLabel || "Core Active Command Flow"}
                    </p>
                    <p className="text-[#4d4d4d] leading-relaxed pt-1 text-[11px] font-sans font-medium">
                      Our interactive loop generators are ready to generate custom benefit bullets, email sequences, and outreach templates based on your target niching.
                    </p>
                  </div>

                  <p className="text-xs text-[#4d4d4d] leading-relaxed text-left font-sans font-semibold">
                    To write customized strategic formulas, download campaign assets, manage simulated databases, and deploy your live GaryVee or Russell Brunson loops, simply register your workspace!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
                    <button
                      type="button"
                      onClick={() => setShowMarketingModal(false)}
                      className="flex-1 px-4 py-2.5 border border-[#cccccc] hover:bg-[#f7f6f5] rounded-[6px] text-xs font-semibold text-[#4d4d4d] transition-colors cursor-pointer"
                    >
                      Keep Looking Around
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMarketingModal(false);
                        onNavigate('signup');
                      }}
                      className="flex-1 px-4 py-2.5 bg-black text-[#edfc47] hover:bg-zinc-900 border border-black transition-all rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Create free account</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#edfc47]" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
