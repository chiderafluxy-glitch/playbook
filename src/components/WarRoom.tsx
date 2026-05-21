import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  HelpCircle, 
  Award, 
  Sparkles, 
  X, 
  ChevronRight, 
  Check, 
  Zap, 
  RefreshCw,
  Coins,
  ChevronDown,
  Handshake,
  Heart,
  FileText,
  PenTool,
  Search,
  ArrowUpRight,
  Sparkle
} from "lucide-react";
import { UserProfile } from "../types";

interface WarRoomProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  onTriggerUpgrade: () => void;
  handleProtectedClick: (tabName: string, featureLabel: string) => void;
}

interface Playbook {
  id: string;
  slotNumber: number;
  name: string;
  expert: string;
  playbookName: string;
  problem: string;
  steps: string[];
  emoji: string;
  buttonLabel: string;
  targetTab: string;
  isPro: boolean;
  featureLabel: string;
  colorTheme: {
    bg: string;     // Can background gradient
    accent: string; // Neon accents
    glow: string;   // Drop shadow glow colors
    labelBg: string;// Text label color matching
  };
}

export default function WarRoom({ user, setActiveTab, onTriggerUpgrade, handleProtectedClick }: WarRoomProps) {
  // Playbook list
  const playbooks: Playbook[] = [
    {
      id: "hormozi",
      slotNumber: 1,
      name: "The Connector",
      expert: "Alex Hormozi",
      playbookName: "Dream 100",
      problem: "You don't know who to partner with, and cold outreach fails.",
      steps: [
        "Find 100 people who already have your ideal customers.",
        "Give them your high-converting lead magnet for free.",
        "Send a value-first outreach message with zero immediate pitching."
      ],
      emoji: "🤝",
      buttonLabel: "Run Dream 100",
      targetTab: "dream-100",
      isPro: false,
      featureLabel: "Dream 100 Partnerships",
      colorTheme: {
        bg: "from-emerald-950 via-emerald-900 to-black",
        accent: "#edfc47", // Neon Lime/Yellow
        glow: "rgba(237,252,71,0.4)",
        labelBg: "bg-emerald-500/20 text-[#edfc47]"
      }
    },
    {
      id: "garyvee",
      slotNumber: 2,
      name: "The Boxer",
      expert: "GaryVee",
      playbookName: "3 Jabs + 1 Hook",
      problem: "Leads go cold and unsubscribe because you pitch products too early.",
      steps: [
        "Send 3 high-impact, pure-value emails (case studies, tools, or tips).",
        "On the 4th email, present a soft offer (booking call, product checkout).",
        "Maintain an ironclad rule: never ask before providing undeniable value."
      ],
      emoji: "🥊",
      buttonLabel: "Build Email Sequence",
      targetTab: "email-sequence",
      isPro: false,
      featureLabel: "3 Jabs 1 Hook Sequence",
      colorTheme: {
        bg: "from-rose-950 via-rose-900 to-black",
        accent: "#ff4a4a", // Hot Neon Red
        glow: "rgba(255,74,74,0.4)",
        labelBg: "bg-rose-500/20 text-rose-400"
      }
    },
    {
      id: "brunson",
      slotNumber: 3,
      name: "The Funnel Architect",
      expert: "Russell Brunson",
      playbookName: "Lead Magnet Funnel",
      problem: "Strangers visit your website or assets but leave without subscribing.",
      steps: [
        "Draft an irresistible free asset (blueprint, calculator, or checklist).",
        "Assemble a streamlined squeeze landing page targeting email captures.",
        "Fulfill and deliver files automatically while preparing warm followups."
      ],
      emoji: "🌪️",
      buttonLabel: "Create Lead Magnet",
      targetTab: "lead-magnet",
      isPro: false,
      featureLabel: "Lead Magnet Funnel",
      colorTheme: {
        bg: "from-sky-950 via-sky-900 to-black",
        accent: "#00f0ff", // Cyber Neon Cyan
        glow: "rgba(0,240,255,0.4)",
        labelBg: "bg-sky-500/20 text-sky-400"
      }
    },
    {
      id: "welsh",
      slotNumber: 4,
      name: "The Scribe (Pro)",
      expert: "Justin Welsh",
      playbookName: "LinkedIn Repurposer",
      problem: "Your high-performing newsletters and value emails die in inbox vaults.",
      steps: [
        "Harvest your 3 successful jab emails from the warming sequence.",
        "Repurpose each into an aesthetic, minimalist organic LinkedIn carousel.",
        "Anchor your custom lead magnet link in the comments to farm passive leads."
      ],
      emoji: "✒️",
      buttonLabel: "Generate LinkedIn Posts",
      targetTab: "linkedin",
      isPro: true,
      featureLabel: "LinkedIn Repurposer",
      colorTheme: {
        bg: "from-yellow-950 via-amber-900 to-black",
        accent: "#f59e0b", // Classic Pro Gold
        glow: "rgba(245,158,11,0.4)",
        labelBg: "bg-amber-500/20 text-amber-400"
      }
    },
    {
      id: "marshall",
      slotNumber: 5,
      name: "The Analyst (Pro)",
      expert: "Perry Marshall",
      playbookName: "80/20 Scorecard",
      problem: "You waste invaluable time tracking cold partners that send zero leads.",
      steps: [
        "Track which Dream 100 partners actively route real, operational subscribers.",
        "Isolate the vital 20% of contributors driving 80% of aggregate opt-ins.",
        "Double down on champions with hand-sent gifts, special bonuses, and spotlight slots."
      ],
      emoji: "🔍",
      buttonLabel: "Score My Partners",
      targetTab: "scorecard",
      isPro: true,
      featureLabel: "Perry Marshall Lead Matrix",
      colorTheme: {
        bg: "from-indigo-950 via-indigo-900 to-black",
        accent: "#8b5cf6", // Purple Laser
        glow: "rgba(139,92,246,0.4)",
        labelBg: "bg-indigo-500/20 text-indigo-400"
      }
    },
    {
      id: "deiss",
      slotNumber: 6,
      name: "The Elevator (Pro)",
      expert: "Ryan Deiss",
      playbookName: "Post-Purchase Tripwire",
      problem: "New subscribers convert but exit without discovering your main products.",
      steps: [
        "Immediately position a high-value $7–$20 impulse checkout on opt-in thanks lines.",
        "Make it direct, hyper-specific, and contextually tied to the original entry point.",
        "Funnel liquidator revenue instantly to offset premium marketing and ads costs."
      ],
      emoji: "🛗",
      buttonLabel: "Create Tripwire Offer",
      targetTab: "tripwire",
      isPro: true,
      featureLabel: "Ryan Deiss Tripwire Upsell",
      colorTheme: {
        bg: "from-fuchsia-950 via-purple-900 to-black",
        accent: "#ec4899", // Neon Pink Magnet
        glow: "rgba(236,72,153,0.4)",
        labelBg: "bg-pink-500/20 text-pink-400"
      }
    }
  ];

  // System States
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [dispensedPlaybook, setDispensedPlaybook] = useState<Playbook | null>(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [coinsCount, setCoinsCount] = useState<number>(0);
  const [machineMessage, setMachineMessage] = useState<string>("INSERT COIN OR KEY IN CODE");
  const [capsCollected, setCapsCollected] = useState<string[]>([]);
  const [isCoinAnimating, setIsCoinAnimating] = useState(false);

  // Read caps already launched/run
  useEffect(() => {
    const savedCaps = localStorage.getItem("pn_caps_collected");
    if (savedCaps) {
      try {
        setCapsCollected(JSON.parse(savedCaps));
      } catch (e) {
        setCapsCollected([]);
      }
    }
  }, []);

  const addCapRun = (playbookId: string) => {
    const updated = capsCollected.includes(playbookId) ? capsCollected : [...capsCollected, playbookId];
    setCapsCollected(updated);
    localStorage.setItem("pn_caps_collected", JSON.stringify(updated));
  };

  const isBasicPlan = user.plan === "Basic" || user.plan === "Free" || !user.plan;

  // Insert Coin helper
  const handleInsertCoin = () => {
    if (isDispensing) return;
    setIsCoinAnimating(true);
    setCoinsCount(prev => prev + 1);
    setMachineMessage("COIN ACCEPTED! CHOOSE A FLAVOR [1-6]");
    
    // Play a gentle subtle audio beep using standard browser AudioContext if supported
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); // chime frequency
      osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}

    setTimeout(() => {
      setIsCoinAnimating(false);
    }, 600);
  };

  // Dispenses the selected playbook can
  const handleDispensePlaybook = (playbook: Playbook) => {
    if (isDispensing) return;
    
    // Check pricing restrictions if needed
    if (playbook.isPro && isBasicPlan) {
      setMachineMessage("PRO LOCKED! UPGRADE IN MAIN TAB");
      handleProtectedClick(playbook.targetTab, playbook.featureLabel);
      return;
    }

    // Set dispensing flow
    setIsDispensing(true);
    setDispensedPlaybook(null); // clear previous
    setMachineMessage(`DISPENSING SLOT #${playbook.slotNumber}...`);

    // Little synth whistle/clunk
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Motor whistle
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.8);
      gain1.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.9);

      // Thud impact at 900ms
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(90, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.35);
      }, 850);
    } catch (e) {}

    // Animate item falling
    setTimeout(() => {
      setIsDispensing(false);
      setDispensedPlaybook(playbook);
      setMachineMessage("CAN DISPENSED! GRAB IT FROM TRAY");
      if (coinsCount > 0) {
        setCoinsCount(prev => Math.max(0, prev - 1));
      }
    }, 1200);
  };

  // Triggered when user grabs the can from the tray
  const handleGrabCan = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setMachineMessage(`ENJOYING PLAYBOOK: ${playbook.playbookName}`);
  };

  // Trigger automated workflow run
  const handleLaunchWorkflow = (playbook: Playbook) => {
    addCapRun(playbook.id);
    if (playbook.isPro) {
      handleProtectedClick(playbook.targetTab, playbook.featureLabel);
    } else {
      setActiveTab(playbook.targetTab);
    }
    setSelectedPlaybook(null);
  };

  // Vending frame shake
  const handleShakeMachine = () => {
    if (isDispensing || isShaking) return;
    if (hasShaken) {
      setMachineMessage("MAX SHAKES PER SESSION UTILIZED!");
      return;
    }

    setIsShaking(true);
    setHasShaken(true);
    setMachineMessage("SHAKING... PLEASE DO NOT TILT!");

    // Play visual shake sounds
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {}

    setTimeout(() => {
      setIsShaking(false);
      // Dispense a random playbook
      const unlockedPlaybooks = playbooks.filter(p => !p.isPro || !isBasicPlan);
      const randomPlaybook = unlockedPlaybooks[Math.floor(Math.random() * unlockedPlaybooks.length)];
      if (randomPlaybook) {
        handleDispensePlaybook(randomPlaybook);
      }
    }, 1000);
  };

  // Helper to draw realistic metallic cans with CSS lines
  const renderSodaCan = (playbook: Playbook, mini: boolean = false) => {
    const isLocked = playbook.isPro && isBasicPlan;
    
    return (
      <div 
        className={`relative rounded-lg overflow-hidden flex flex-col items-center justify-between border-2 select-none transition-all ${
          mini ? 'w-14 h-24 border-zinc-700 shadow-lg' : 'w-full h-44 cursor-pointer hover:scale-105 active:scale-95'
        } ${isLocked ? 'opacity-55 grayscale border-dashed border-zinc-700 bg-zinc-900' : 'border-black hover:shadow-cyan-500/10'}`}
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)`,
          backgroundColor: isLocked ? '#2e2e30' : undefined,
          borderColor: isLocked ? undefined : playbook.colorTheme.accent,
          boxShadow: isLocked ? 'none' : `0 0 15px ${playbook.colorTheme.glow}`
        }}
        onClick={() => {
          if (!mini) {
            handleDispensePlaybook(playbook);
          }
        }}
      >
        {/* Dynamic Can custom colored gradient base back of aluminum sheet */}
        {!isLocked && (
          <div className={`absolute inset-0 bg-gradient-to-b ${playbook.colorTheme.bg} -z-10`} />
        )}

        {/* Glossy overlay mimicking a reflection cylinder */}
        <div className="absolute inset-y-0 left-1/4 w-1.5 bg-white/20 blur-[0.5px] pointer-events-none -z-5" />
        <div className="absolute inset-y-0 left-3 w-3 bg-white/10 blur-[1px] pointer-events-none -z-5" />

        {/* Can tab header ring representing aluminum seal rims */}
        <div className="w-full h-3 border-b bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 border-black/30 flex justify-center items-center">
          <div className="w-3 h-1 rounded-full bg-zinc-800" />
        </div>

        {/* Central main product wrapper content */}
        <div className="flex-1 w-full flex flex-col items-center justify-between p-2 py-3 text-center">
          <div>
            {/* Playbook Expert brand */}
            <span className={`block font-mono font-black scale-90 select-none tracking-widest leading-none ${mini ? 'text-[6px]' : 'text-[8px]'} text-zinc-300`}>
              {playbook.expert.toUpperCase()}
            </span>
          </div>

          {/* Central Logo and Icon Circle representing flavor badge */}
          <div className={`rounded-full border flex items-center justify-center transition-all bg-zinc-900/80 ${
            mini ? 'w-6 h-6 border-zinc-500' : 'w-12 h-12 border-white/20 group-hover:scale-110'
          }`}
            style={{ borderColor: playbook.colorTheme.accent }}
          >
            {isLocked ? (
              <Lock className={`${mini ? 'w-3 h-3' : 'w-5 h-5'} text-zinc-500`} />
            ) : (
              <span className={`${mini ? 'text-xs' : 'text-xl'}`}>{playbook.emoji}</span>
            )}
          </div>

          {/* Playbook name or Slot coordinates */}
          <div className="w-full">
            <h5 className={`font-mono leading-none tracking-tight font-black uppercase text-white ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
              {playbook.playbookName}
            </h5>
            
            {/* Basic / Pro status banner */}
            {!mini && (
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${
                playbook.isPro 
                  ? 'bg-amber-400/20 text-yellow-400 border border-amber-400/30' 
                  : 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
              }`}>
                {playbook.isPro ? "PRO" : "BASIC"}
              </span>
            )}
          </div>
        </div>

        {/* Underlay bottom metallic tab representing bottom canned rim */}
        <div className="w-full h-3 border-t bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 border-black/30" />
      </div>
    );
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner info detailing playbooks */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold font-mono bg-zinc-950 text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
            🎰 STRATEGY VENDING INTERACTIVE
          </span>
          <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight" id="war-title">
            Central Tactical Playbook Vender
          </h1>
          <p className="text-[#4d4d4d] text-sm">
            Grab a high-conversion soda-can playbook engineered directly from world-class industry creators. Let's dispense your outbound client system.
          </p>
        </div>

        {/* Caps Collected Counter Panel */}
        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 flex items-center gap-4 text-left shadow-lg">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black font-extrabold border border-zinc-800 shadow-md">
              <Award className="w-5 h-5" />
            </div>
            {capsCollected.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-red-500 text-white rounded-full text-[9px] w-4.5 h-4.5 font-bold flex items-center justify-center border border-black animate-bounce">
                {capsCollected.length}
              </span>
            )}
          </div>
          <div>
            <span className="block text-[8px] font-mono font-bold tracking-widest text-zinc-400 uppercase">OFFER CAPS EARNED</span>
            <div className="flex gap-1.5 items-center mt-1">
              <div className="flex -space-x-1.5 overflow-hidden">
                {playbooks.map(p => {
                  const hasRun = capsCollected.includes(p.id);
                  return (
                    <div 
                      key={p.id} 
                      title={`${p.playbookName} cap`}
                      className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] relative transition-all ${
                        hasRun 
                          ? 'bg-zinc-800 scale-105 opacity-100 invert border-yellow-400' 
                          : 'bg-zinc-900 opacity-30 scale-90 grayscale'
                      }`}
                    >
                      {p.emoji}
                    </div>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-[#edfc47] font-mono ml-1">
                {capsCollected.length}/6 Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main interactive vending grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Solid Steel Retro Metal Vending Machine container box */}
        <div className="col-span-1 lg:col-span-8 bg-zinc-950 border-4 border-zinc-800 rounded-3xl p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
          
          {/* Cyberpunk Arcade Glowing Grid details pattern */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%]" />
          
          {/* Machine Header neon lights layout */}
          <div className="relative z-10 flex justify-between items-center border-b border-zinc-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
              <div className="font-mono text-xs font-black tracking-widest text-[#00f0ff] uppercase shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                AUTOMAT SYSTEM 2000
              </div>
            </div>
            <div className="font-mono text-[9px] text-[#edfc47] tracking-widest border border-[#edfc47]/20 px-2 py-0.5 rounded uppercase">
              COINS FOR PLAYBOOKS: ${coinsCount * 0.25}
            </div>
          </div>

          <motion.div 
            animate={isShaking ? { 
              x: [-12, 12, -10, 10, -8, 8, -5, 5, -2, 2, 0],
              y: [-6, 6, -5, 5, -3, 3, -1, 1, 0]
            } : {}}
            transition={{ duration: 1 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10"
          >
            {/* Glass window showing available playbooks inside */}
            <div className="col-span-1 md:col-span-9 bg-black/90 border-4 border-zinc-800 rounded-2xl relative p-4 flex flex-col justify-between" style={{ minHeight: "450px" }}>
              {/* Glass background sheen gloss */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.05] rounded-xl" />
              
              {/* Shelf rails container */}
              <div className="space-y-8">
                
                {/* SHELF 1: Basic Free Playbooks */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1 font-mono text-[9.5px] font-bold text-[#edfc47]/70">
                    <span>SHELF A // COLD-LAUNCH BASICS</span>
                    <span>100% COMPATIBLE</span>
                  </div>
                  
                  {/* Grid of basic cans */}
                  <div className="grid grid-cols-3 gap-3">
                    {playbooks.slice(0, 3).map((playbook) => (
                      <div key={playbook.id} className="relative group">
                        {renderSodaCan(playbook)}
                        <span className="absolute bottom-1 right-1 px-1 bg-black/80 font-mono text-[8px] font-black text-[#edfc47] rounded pointer-events-none">
                          #{playbook.slotNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-gradient-to-b from-zinc-800 to-zinc-900 border-t border-black rounded shadow" />
                </div>

                {/* SHELF 2: Pro Specialized Playbooks */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1 font-mono text-[9.5px] font-bold text-amber-500/70">
                    <span>SHELF B // PRO GROWTH FLAVORS</span>
                    <span>RESTRICTED UPGRADE ACCESS</span>
                  </div>

                  {/* Grid of pro cans */}
                  <div className="grid grid-cols-3 gap-3">
                    {playbooks.slice(3, 6).map((playbook) => (
                      <div key={playbook.id} className="relative group">
                        {renderSodaCan(playbook)}
                        <span className="absolute bottom-1 right-1 px-1 bg-black/80 font-mono text-[8px] font-black text-amber-400 rounded pointer-events-none">
                          #{playbook.slotNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-gradient-to-b from-zinc-800 to-zinc-900 border-t border-black rounded shadow" />
                </div>

              </div>

              {/* Physical Can dropping slide track */}
              <div className="h-6 bg-zinc-950 mt-4 rounded-lg flex items-center justify-between px-3 border border-zinc-800 relative overflow-hidden">
                <span className="text-[7.5px] font-mono text-zinc-600 tracking-widest uppercase">DISPENSE TRACK SENSOR FLUID LIVE</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <span key={i} className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Slot Panel Details: Keypad, Coins, Shake and physical indicators */}
            <div className="col-span-1 md:col-span-3 flex flex-col justify-between space-y-4">
              
              {/* OLED Screen Interface message */}
              <div className="bg-zinc-950 border-2 border-zinc-800 p-3 rounded-xl font-mono text-center space-y-1.5 relative overflow-hidden shadow-inner">
                <div className="absolute top-0.5 right-1.5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                </div>
                <div className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest block text-left">OLED STATUS MONITOR</div>
                <div className="bg-black/90 text-emerald-400 p-2 rounded text-[10px] font-black leading-snug tracking-wider min-h-[56px] flex items-center justify-center border border-emerald-950 uppercase">
                  {machineMessage}
                </div>
                <span className="text-[8px] text-[#edfc47] font-bold block">
                  COINS INSERTED: {coinsCount} // CREDITS: {coinsCount}
                </span>
              </div>

              {/* KEYPAD CONTROL INTERFACE (Buttons 1-6) */}
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-3 text-center space-y-2">
                <div className="text-[8px] text-zinc-400 font-mono uppercase tracking-widest font-black">NUMERIC KEYPAD</div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const matched = playbooks.find(p => p.slotNumber === num);
                    const isLocked = matched?.isPro && isBasicPlan;
                    return (
                      <button
                        key={num}
                        onClick={() => matched && handleDispensePlaybook(matched)}
                        className={`font-mono text-xs font-black p-2.5 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                          isLocked 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'bg-zinc-950 text-white border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer active:scale-90 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        }`}
                      >
                        <span>{num}</span>
                        {matched && (
                          <span className="text-[6.5px] opacity-65 leading-none mt-0.5 truncate max-w-full">
                            {matched.emoji}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PHYSICS COIN INSERT SLIT */}
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-3 text-center space-y-2 relative overflow-hidden">
                <div className="text-[8px] text-zinc-400 font-mono uppercase tracking-widest font-bold">COIN INTAKE</div>
                
                {/* Physical stylized gold coin clicker */}
                <div className="flex flex-col items-center justify-center py-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInsertCoin}
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 border-2 border-yellow-600 flex items-center justify-center font-bold text-black shadow-md relative cursor-pointer ${
                      isCoinAnimating ? 'animate-bounce' : ''
                    }`}
                  >
                    <Coins className="w-5 h-5 text-yellow-900" />
                    {/* Inner sheen details */}
                    <div className="absolute inset-1 rounded-full border border-yellow-200/50 pointer-events-none" />
                  </motion.div>
                  <span className="text-[9px] font-mono text-zinc-400 font-bold block mt-2">CLICK TO INSERT COIN</span>
                </div>

                {/* Simulated vertical coin slit */}
                <div className="w-3 h-10 bg-black rounded-full mx-auto border-2 border-zinc-700 shadow-inner flex items-center justify-center">
                  <div className="w-1 h-6 bg-zinc-950 rounded-full" />
                </div>
              </div>

              {/* DANGEROUS SHAKE STABILIZER GEARS */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleShakeMachine}
                  disabled={isShaking || hasShaken}
                  className={`w-full py-2 px-3 rounded-lg font-mono text-[9px] uppercase font-black tracking-widest border flex items-center justify-center gap-1.5 transition-all ${
                    hasShaken
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-yellow-500/15 text-[#edfc47] border-[#edfc47]/30 hover:bg-[#edfc47]/20 cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isShaking ? 'animate-spin' : ''}`} />
                  <span>Shake Machine (Reroll)</span>
                </button>
              </div>

            </div>
          </motion.div>

          {/* Bottom Tray Opening Compartment for pickup */}
          <div className="mt-8 border-t-4 border-zinc-800 pt-6">
            <div className="bg-zinc-950 border-4 border-zinc-800 p-4 rounded-2xl relative h-32 flex items-center justify-center shadow-inner overflow-hidden">
              <div className="absolute top-1 left-1.5 text-[7px] font-mono text-zinc-600 font-extrabold">DISPENSING TRAY</div>
              
              {/* Sliding glass cover look */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950/90 pointer-events-none" />

              {/* Tray Backwall laser grill grid wires */}
              <div className="absolute inset-y-0 w-full flex justify-between px-10 border-r border-[#edfc47]/5 opacity-10 pointer-events-none">
                {[1,2,3,4,5,6].map(x => <div key={x} className="w-[1px] h-full bg-[#00f0ff]" />)}
              </div>

              {/* Empty tray placeholder if nothing is dropped */}
              {!isDispensing && !dispensedPlaybook && (
                <div className="text-center text-zinc-600 space-y-1">
                  <ChevronDown className="w-6 h-6 mx-auto stroke-[1.5] animate-bounce" />
                  <p className="font-mono text-[9px] tracking-wider font-semibold">TRAY IS EMPTY . INSERT INPUT</p>
                </div>
              )}

              {/* Falling animation can or can laying in the tray ready */}
              {isDispensing && (
                <motion.div
                  initial={{ y: -150, rotate: -40, opacity: 0 }}
                  animate={{ y: 0, rotate: 15, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.7 }}
                  className="absolute"
                >
                  <div className="scale-90 opacity-60 pointer-events-none">
                    {/* Visual representative dummy fallback */}
                    <div className="w-10 h-16 bg-zinc-700/80 rounded" />
                  </div>
                </motion.div>
              )}

              {/* Ready dispensed grab item */}
              {dispensedPlaybook && !isDispensing && (
                <motion.div
                  initial={{ scale: 0.8, y: 15, rotate: 90 }}
                  animate={{ scale: 1, y: 0, rotate: 75 }}
                  whileHover={{ scale: 1.1, rotate: 90, y: -5 }}
                  className="cursor-pointer font-sans absolute z-40 p-2 filter drop-shadow-[0_4px_16px_rgba(0,240,255,0.4)]"
                  onClick={() => handleGrabCan(dispensedPlaybook)}
                >
                  <div className="relative group">
                    {renderSodaCan(dispensedPlaybook, true)}
                    {/* Pulse overlay glow click prompt */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-[8px] px-1.5 py-0.5 uppercase tracking-widest font-black animate-pulse border border-black shadow-lg">
                      GRAB!
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="flex justify-between text-xs font-mono font-bold text-zinc-500 mt-2 px-1">
              <span>MODEL PB-V2026 // MANUAL FLAVORS</span>
              <span className="text-[#edfc47]">SOLOPRENEUR LOOPS v2.0</span>
            </div>
          </div>

        </div>

        {/* Right Side: Educational details/modal summary of the grabbed playback can */}
        <div className="col-span-1 lg:col-span-4 bg-white border border-[#cccccc] p-6 rounded-2xl relative min-h-[580px] flex flex-col justify-between text-left">
          <AnimatePresence mode="wait">
            {selectedPlaybook ? (
              <motion.div
                key={selectedPlaybook.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col justify-between h-full"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded border border-black/15 inline-block mb-1.5 ${selectedPlaybook.colorTheme.labelBg}`}>
                        {selectedPlaybook.playbookName} Playbook
                      </span>
                      <h2 className="text-2xl font-roobert font-extrabold text-black leading-tight">
                        {selectedPlaybook.expert}
                      </h2>
                      <p className="text-xs font-mono font-bold text-gray-400">Tactical Strategy Director</p>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedPlaybook(null);
                        setMachineMessage("CHOOSE ANOTHER COLD TACTIC");
                      }}
                      className="p-1 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>

                  {/* Can Info Graphic */}
                  <div className="bg-[#f7f6f5] border border-[#cccccc]/40 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-1 rounded-lg">
                      {renderSodaCan(selectedPlaybook, true)}
                    </div>
                    <div>
                      <span className="block text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider">SODA INGREDIENTS</span>
                      <span className="text-xs text-black font-extrabold block">Expert {selectedPlaybook.expert} Loop formulation</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">100% Outbound conversion gas</span>
                    </div>
                  </div>

                  {/* Playbook contents breakdown */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-zinc-400">PROBLEM SOLVED:</h4>
                      <p className="text-xs text-black font-semibold mt-1 leading-relaxed bg-[#edfc47]/10 border border-yellow-200 p-2.5 rounded-lg">
                        🎯 "{selectedPlaybook.problem}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-zinc-400 font-mono">STEP-BY-STEP RECIPE:</h4>
                      <div className="space-y-2.5">
                        {selectedPlaybook.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start">
                            <span 
                              className="w-5 h-5 font-mono text-[10px] font-black text-black border border-black rounded-full flex items-center justify-center shrink-0 shadow-sm"
                              style={{ backgroundColor: selectedPlaybook.colorTheme.accent }}
                            >
                              0{idx + 1}
                            </span>
                            <p className="text-xs text-zinc-700 leading-relaxed font-mono">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Launch action trigger bottom row */}
                <div className="pt-6 border-t border-zinc-200 mt-6">
                  {selectedPlaybook.isPro && isBasicPlan ? (
                    <button
                      onClick={onTriggerUpgrade}
                      className="w-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black hover:from-amber-600 font-bold text-xs uppercase font-mono p-3 rounded-lg flex items-center justify-center gap-2 border border-black shadow-md"
                    >
                      <span>Upgrade to Pro to Unlock</span>
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleLaunchWorkflow(selectedPlaybook)}
                      className="w-full bg-black text-[#edfc47] hover:opacity-90 text-xs font-mono font-bold uppercase tracking-wider p-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-black shadow"
                    >
                      <Zap className="w-3.5 h-3.5 fill-[#edfc47]" />
                      <span>Run Playbook Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-center text-[9px] text-[#4d4d4d] italic mt-1.5 font-mono">
                    Routes directly to your live sandbox generator workbench.
                  </p>
                </div>
              </motion.div>
            ) : (
              // Empty selection state guide
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-[#f7f6f5] border border-zinc-300 flex items-center justify-center text-zinc-400 animate-pulse">
                  <Coins className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-roobert font-extrabold text-sm text-black uppercase">Vender Tray Empty</h3>
                  <p className="text-xs text-[#4d4d4d] max-w-[220px] mx-auto mt-1 leading-normal">
                    Insert a coin, select or shake out your favor code, and grab the ready can from the bottom compartment to taste!
                  </p>
                </div>
                
                <div className="border border-zinc-200 border-dashed rounded-xl p-3.5 text-[10px] text-[#4d4d4d] leading-normal w-full bg-[#fcfbf9] text-left space-y-2">
                  <div className="flex items-center gap-1 font-mono tracking-widest text-[#4d4d4d] uppercase font-bold text-[8px]">
                    <Sparkle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    <span>How it works:</span>
                  </div>
                  <p className="font-mono text-[9px] text-zinc-600 leading-normal">
                    1. Tap the golden **Coin Intake token** helper to insert some arcade credits.<br />
                    2. Select any flavor of playbook from the shelf can or enter code 1-6.<br />
                    3. Grab the physical metallic can from the bottom drawer to open the tool blueprints!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
