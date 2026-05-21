import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, BookOpen, Target, ShieldCheck, Mail, Zap, Star, Settings, LogOut, Lock, 
  CheckCircle, Play, ChevronRight, Copy, RefreshCw, Download, ArrowUp, AlertCircle, HelpCircle, Bug, Trash2, Plus,
  Compass
} from "lucide-react";
import { 
  UserProfile, OnboardingData, LeadMagnetOutput, Dream100Partner, 
  EmailSequenceOutput, LinkedInOutput, TripwireOutput, ToolGenerationCounts, UserPlan 
} from "../types";
import WarRoom from "./WarRoom";
import { getSession, getOutput, upsertOutput, getGenerationCounts, incrementGenerationCount } from "../lib/supabase";

interface DashboardProps {
  user: UserProfile;
  onboardingData: OnboardingData;
  onLogout: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onUpdateOnboarding: (data: OnboardingData) => void;
  onTriggerUpgradeCheckout: () => void;
}

export default function Dashboard({
  user,
  onboardingData,
  onLogout,
  onUpdateProfile,
  onUpdateOnboarding,
  onTriggerUpgradeCheckout
}: DashboardProps) {
  // Navigation Active Page: 'home', 'lead-magnet', 'dream-100', 'email-sequence', 'linkedin', 'scorecard', 'tripwire', 'settings'
  const [activeTab, setActiveTab] = useState<string>("home");
  
  // Bug Reporting State
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugComplaints, setBugComplaints] = useState("");
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);

  // LinkedIn Interactivity States
  const [linkedinView, setLinkedinView] = useState<'editor' | 'preview'>('editor');
  const [linkedinLikes, setLinkedinLikes] = useState<Record<string, number>>({ post1: 24, post2: 37, post3: 56 });
  const [linkedinLikedStatus, setLinkedinLikedStatus] = useState<Record<string, boolean>>({ post1: false, post2: false, post3: false });

  // Lead Magnet interactive preview simulation
  const [lmagSubName, setLmagSubName] = useState("");
  const [lmagSubEmail, setLmagSubEmail] = useState("");
  const [lmagFormSubmitting, setLmagFormSubmitting] = useState(false);
  const [lmagFormSuccess, setLmagFormSuccess] = useState(false);

  // Instant Tripwire Revenue Calculator
  const [calcLeadCount, setCalcLeadCount] = useState(1500);
  const [calcConvRate, setCalcConvRate] = useState(3.5); // 3.5%
  const [bumpChecked, setBumpChecked] = useState(true);

  // Manual Partner addition inline form states
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerPlatform, setNewPartnerPlatform] = useState("YouTube");
  const [newPartnerContact, setNewPartnerContact] = useState("");
  const [newPartnerLink, setNewPartnerLink] = useState("");
  const [newPartnerMessage, setNewPartnerMessage] = useState("");

  const handleManualAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName || !newPartnerContact) return;
    const added: Dream100Partner = {
      partnerName: newPartnerName,
      platform: newPartnerPlatform,
      link: newPartnerLink || `https://${newPartnerPlatform.toLowerCase()}.com/c/mock-partner`,
      contact: newPartnerContact,
      message: newPartnerMessage || `Hey ${newPartnerName}, love your work on ${newPartnerPlatform}. We should partner on ${onboardingData.niche}!`,
      leadsSent: Math.floor(Math.random() * 40) + 10,
      rank: Math.floor(Math.random() * 5) + 1,
      highlighted: Math.random() > 0.6
    };
    const updated = [added, ...dream100];
    setDream100(updated);
    localStorage.setItem("pn_d100", JSON.stringify(updated));
    
    // reset
    setNewPartnerName("");
    setNewPartnerContact("");
    setNewPartnerLink("");
    setNewPartnerMessage("");
    setShowAddPartnerForm(false);
  };

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
        setBugTitle("");
        setBugComplaints("");
      }, 2000);
    }, 1200);
  };

  const updateLinkedInPost = (postKey: 'post1' | 'post2' | 'post3', field: 'hook' | 'body' | 'commentNote', value: string) => {
    if (!linkedin) return;
    const updatedValue = {
      ...linkedin,
      [postKey]: {
        ...linkedin[postKey],
        [field]: value
      }
    };
    setLinkedin(updatedValue);
    localStorage.setItem("pn_linkedin", JSON.stringify(updatedValue));
  };
  
  // Settings Tab internal state: 'account', 'billing', 'niche-offer'
  const [settingsSubTab, setSettingsSubTab] = useState<string>("account");

  // Lock upgrade modal/popup
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLockedFeature, setUpgradeLockedFeature] = useState("");

  // Lock subscription cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Core Generated Data states (loaded from localStorage to mock persist across reloads)
  const [leadMagnet, setLeadMagnet] = useState<LeadMagnetOutput | null>(null);
  const [dream100, setDream100] = useState<Dream100Partner[]>([]);
  const [emailSequence, setEmailSequence] = useState<EmailSequenceOutput | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedInOutput | null>(null);
  const [tripwire, setTripwire] = useState<TripwireOutput | null>(null);
  const [scorecardSuggestions, setScorecardSuggestions] = useState<string>("");

  // Quota usage tracker state
  const [counts, setCounts] = useState<ToolGenerationCounts>({
    leadMagnet: 3,
    dream100: 2,
    emailSequence: 4,
    linkedin: 0,
    tripwire: 0
  });

  // Load cache — Supabase first, localStorage as fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        const session = await getSession();
        if (session?.user?.id) {
          const uid = session.user.id;
          const [lmag, d100, email, li, trip] = await Promise.all([
            getOutput(uid, 'lead_magnet'),
            getOutput(uid, 'dream_100'),
            getOutput(uid, 'email_sequence'),
            getOutput(uid, 'linkedin'),
            getOutput(uid, 'tripwire'),
          ]);
          if (lmag) { setLeadMagnet(lmag as LeadMagnetOutput); localStorage.setItem("pn_lmag", JSON.stringify(lmag)); }
          if (d100) { setDream100((d100 as any).partners || []); localStorage.setItem("pn_d100", JSON.stringify((d100 as any).partners || [])); }
          if (email) { setEmailSequence(email as EmailSequenceOutput); localStorage.setItem("pn_email", JSON.stringify(email)); }
          if (li) { setLinkedin(li as LinkedInOutput); localStorage.setItem("pn_linkedin", JSON.stringify(li)); }
          if (trip) { setTripwire(trip as TripwireOutput); localStorage.setItem("pn_trip", JSON.stringify(trip)); }
          const sbCounts = await getGenerationCounts(uid);
          if (Object.keys(sbCounts).length > 0) {
            const mapped: ToolGenerationCounts = {
              leadMagnet: sbCounts["lead_magnet"] || 0, dream100: sbCounts["dream_100"] || 0,
              emailSequence: sbCounts["email_sequence"] || 0, linkedin: sbCounts["linkedin"] || 0, tripwire: sbCounts["tripwire"] || 0,
            };
            setCounts(mapped); localStorage.setItem("pn_counts", JSON.stringify(mapped)); return;
          }
        }
      } catch (e) { /* Supabase unavailable — fallback below */ }
      const savedLmag = localStorage.getItem("pn_lmag"); if (savedLmag) setLeadMagnet(JSON.parse(savedLmag));
      const savedD100 = localStorage.getItem("pn_d100"); if (savedD100) setDream100(JSON.parse(savedD100));
      const savedEmail = localStorage.getItem("pn_email"); if (savedEmail) setEmailSequence(JSON.parse(savedEmail));
      const savedLinkedIn = localStorage.getItem("pn_linkedin"); if (savedLinkedIn) setLinkedin(JSON.parse(savedLinkedIn));
      const savedTrip = localStorage.getItem("pn_trip"); if (savedTrip) setTripwire(JSON.parse(savedTrip));
      const savedCounts = localStorage.getItem("pn_counts");
      if (savedCounts) { setCounts(JSON.parse(savedCounts)); } else { localStorage.setItem("pn_counts", JSON.stringify(counts)); }
    };
    loadData();
  }, []);

  // Utility to increment generation counts in cache
  const toolKeyMap: Record<keyof ToolGenerationCounts, string> = {
    leadMagnet: "lead_magnet", dream100: "dream_100", emailSequence: "email_sequence",
    linkedin: "linkedin", tripwire: "tripwire"
  };

  const triggerToolCount = async (tool: keyof ToolGenerationCounts) => {
    const updated = { ...counts, [tool]: counts[tool] + 1 };
    setCounts(updated);
    localStorage.setItem("pn_counts", JSON.stringify(updated));
    try {
      const session = await getSession();
      if (session?.user?.id) await incrementGenerationCount(session.user.id, toolKeyMap[tool]);
    } catch (e) { /* offline */ }
  };

  // --- LOADING states for API routes ---
  const [loadingLmag, setLoadingLmag] = useState(false);
  const [loadingD100, setLoadingD100] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- Copy Clipboard Notifications ---
  const [copiedText, setCopiedText] = useState("");
  const triggerCopyNotice = (textContext: string) => {
    setCopiedText(textContext);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Safe copying action
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    triggerCopyNotice(identifier);
  };

  // Route protection handles
  const handleProtectedClick = (tabName: string, featureLabel: string) => {
    if (user.plan === "Basic") {
      setUpgradeLockedFeature(featureLabel);
      setShowUpgradeModal(true);
    } else {
      setActiveTab(tabName);
    }
  };

  // --- API Call Functions ---

  // Lead Magnet Generation
  const [lmagNiche, setLmagNiche] = useState(onboardingData.niche);
  const [lmagAudience, setLmagAudience] = useState(onboardingData.audience);
  const [lmagOffer, setLmagOffer] = useState(onboardingData.offerName);

  const generateLeadMagnet = async () => {
    setLoadingLmag(true);
    try {
      const response = await fetch("/api/generate/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: lmagNiche, audience: lmagAudience, offer: lmagOffer })
      });
      const data = await response.json();
      setLeadMagnet(data);
      localStorage.setItem("pn_lmag", JSON.stringify(data));
      triggerToolCount("leadMagnet");
      try { const s = await getSession(); if (s?.user?.id) await upsertOutput(s.user.id, "lead_magnet", data); } catch(e){}
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLmag(false);
    }
  };

  // Dream 100 List Creation
  const [partnerCount, setPartnerCount] = useState(user.plan === "Pro" ? 25 : 12);
  const [platformOption, setPlatformOption] = useState("Both");

  const generateDream100 = async () => {
    setLoadingD100(true);
    try {
      const response = await fetch("/api/generate/dream-100", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          niche: onboardingData.niche, 
          audience: onboardingData.audience, 
          offer: onboardingData.offerName,
          count: partnerCount,
          platform: platformOption
        })
      });
      const data = await response.json();
      if (data && Array.isArray(data.partners)) {
        setDream100(data.partners);
        localStorage.setItem("pn_d100", JSON.stringify(data.partners));
        triggerToolCount("dream100");
        try { const s = await getSession(); if (s?.user?.id) await upsertOutput(s.user.id, "dream_100", data); } catch(e){}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingD100(false);
    }
  };

  // Email Sequence Generation
  const [emailNiche, setEmailNiche] = useState(onboardingData.niche);
  const [emailOffer, setEmailOffer] = useState(onboardingData.offerName);
  const [emailHookOffer, setEmailHookOffer] = useState("Free 15-Minute Technical Audit");

  const generateEmailSequence = async () => {
    setLoadingEmail(true);
    try {
      const response = await fetch("/api/generate/email-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: emailNiche, offer: emailOffer, hookOffer: emailHookOffer })
      });
      const data = await response.json();
      setEmailSequence(data);
      localStorage.setItem("pn_email", JSON.stringify(data));
      triggerToolCount("emailSequence");
      try { const s = await getSession(); if (s?.user?.id) await upsertOutput(s.user.id, "email_sequence", data); } catch(e){}
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmail(false);
    }
  };

  // LinkedIn repurposing
  const generateLinkedIn = async () => {
    if (!emailSequence) return;
    setLoadingLinkedIn(true);
    try {
      const response = await fetch("/api/generate/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          niche: onboardingData.niche, 
          offer: onboardingData.offerName,
          emails: emailSequence 
        })
      });
      const data = await response.json();
      setLinkedin(data);
      localStorage.setItem("pn_linkedin", JSON.stringify(data));
      triggerToolCount("linkedin");
      try { const s = await getSession(); if (s?.user?.id) await upsertOutput(s.user.id, "linkedin", data); } catch(e){}
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLinkedIn(false);
    }
  };

  // Tripwire Generator
  const [tripwireOfferName, setTripwireOfferName] = useState(onboardingData.offerName);
  const [tripwireOfferPrice, setTripwireOfferPrice] = useState(onboardingData.offerPrice);
  const [tripwirePrice, setTripwirePrice] = useState("9");

  const generateTripwire = async () => {
    setLoadingTrip(true);
    try {
      const response = await fetch("/api/generate/tripwire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          offerName: tripwireOfferName, 
          offerPrice: tripwireOfferPrice, 
          tripwirePrice: tripwirePrice 
        })
      });
      const data = await response.json();
      setTripwire(data);
      localStorage.setItem("pn_trip", JSON.stringify(data));
      triggerToolCount("tripwire");
      try { const s = await getSession(); if (s?.user?.id) await upsertOutput(s.user.id, "tripwire", data); } catch(e){}
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrip(false);
    }
  };

  // Scorecard top-performer triggers
  const [leadsInput, setLeadsInput] = useState<{[key: string]: string}>({});
  
  const handleScoreCardNumeric = (partnerName: string, value: string) => {
    setLeadsInput(prev => ({
      ...prev,
      [partnerName]: value
    }));
  };

  const calculateTopPerformers = () => {
    // Inject leadsSent numbers and sort
    const mappedPartners = dream100.map(p => {
      const numericVal = parseInt(leadsInput[p.partnerName] || "0");
      return {
        ...p,
        leadsSent: numericVal
      };
    });

    // Sort descending
    mappedPartners.sort((a, b) => (b.leadsSent || 0) - (a.leadsSent || 0));

    // Rank from 1 to N
    const fullyRanked = mappedPartners.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      highlighted: idx < Math.ceil(mappedPartners.length * 0.20) && (item.leadsSent || 0) > 0
    }));

    setDream100(fullyRanked);
    localStorage.setItem("pn_d100", JSON.stringify(fullyRanked));

    // Get the top guys
    const topPerformers = fullyRanked.filter(p => p.highlighted);
    if (topPerformers.length > 0) {
      triggerPerryMarshallAnalysis(topPerformers);
    }
  };

  const triggerPerryMarshallAnalysis = async (tops: any[]) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/generate/scorecard-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topPartners: tops })
      });
      const data = await response.json();
      setScorecardSuggestions(data.suggestions || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // File exporter for CSV
  const downloadDream100CSV = () => {
    if (dream100.length === 0) return;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Partner Name,Platform,Platform Link,Contact Email,Personalized Outreach Message,Leads Sent,Rank,Top Performer\n";
    
    dream100.forEach(p => {
      const row = [
        `"${p.partnerName.replace(/"/g, '""')}"`,
        `"${p.platform}"`,
        `"${p.link}"`,
        `"${p.contact}"`,
        `"${(p.message || "").replace(/"/g, '""').replace(/\n/g, '\\n')}"`,
        p.leadsSent || 0,
        p.rank || "N/A",
        p.highlighted ? "Yes (80/20)" : "No"
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${onboardingData.niche.replace(/\s+/g, "_")}_dream100_playbook.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Settings State parameters
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePass, setProfilePass] = useState("••••••••");

  // Niche variables settings editor
  const [editNiche, setEditNiche] = useState(onboardingData.niche);
  const [editAudience, setEditAudience] = useState(onboardingData.audience);
  const [editProblem, setEditProblem] = useState(onboardingData.problem);
  const [editOfferName, setEditOfferName] = useState(onboardingData.offerName);
  const [editOfferPrice, setEditOfferPrice] = useState(onboardingData.offerPrice);
  const [editOfferSentence, setEditOfferSentence] = useState(onboardingData.offerSentence);

  const saveProfileSettings = () => {
    onUpdateProfile({ name: profileName, email: profileEmail });
    triggerCopyNotice("Profile saved successfully");
  };

  const saveNicheSettings = () => {
    onUpdateOnboarding({
      niche: editNiche,
      audience: editAudience,
      problem: editProblem,
      offerName: editOfferName,
      offerPrice: editOfferPrice,
      offerSentence: editOfferSentence
    });
    triggerCopyNotice("Business strategy updated! Downstream tool inputs updated.");
  };

  // Helper setup checklist stats
  const isLmagDone = leadMagnet !== null;
  const isD100Done = dream100.length > 0;
  const isEmailDone = emailSequence !== null;
  
  // Progress tracker percentage calculation
  let progressPct = 50; // Starts at 50% for Signup, Payment Confirmed, Onboarding
  if (isLmagDone) progressPct += 16;
  if (isD100Done) progressPct += 17;
  if (isEmailDone) progressPct += 17;

  return (
    <div className="flex min-h-screen bg-white text-black selection:bg-[#edfc47] selection:text-black font-sans relative">
      {/* 4px top highlight */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#edfc47] z-50" />

      {/* LEFT SIDEBAR - Persistent layout */}
      <aside className="w-64 border-r border-[#cccccc] bg-[#f7f6f5] flex flex-col justify-between pt-8 pb-6 px-4 shrink-0">
        <div className="space-y-8">
          {/* Top user profile & Plan label */}
          <div className="px-2">
            <div className="font-roobert font-extrabold text-xl tracking-tight text-black flex items-center gap-1 mb-3">
              <span>Playbook</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#edfc47] border border-black inline-block" />
            </div>

            <div className="bg-white rounded-lg p-3.5 border border-[#cccccc] mt-4 flex flex-col shadow-sm">
              <span className="block font-semibold text-sm text-black truncate">
                {user.name}
                <span className="bg-[#edfc47] text-black text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ml-1.5 border border-black/10 inline-block">
                  {user.plan}
                </span>
              </span>
              <span className="block text-xs font-mono font-medium text-[#4d4d4d] truncate mt-1">{user.email}</span>
              
              {/* 3-day Free Trial Badge */}
              <div className="mt-2.5 text-[10px] font-bold text-green-700 bg-green-50 rounded border border-green-200 p-1.5 leading-relaxed shrink-0">
                🎁 3-DAY FREE TRIAL ACTIVE
                <span className="block text-[9px] font-normal text-green-600 font-mono">No Credit Card Linked</span>
              </div>

              {user.plan === 'Basic' && (
                <button 
                  onClick={onTriggerUpgradeCheckout}
                  className="text-[9px] font-bold text-black uppercase tracking-wider underline hover:opacity-75 mt-2.5 self-start"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          {/* Navigation link sets */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("home")} 
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'home' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
            >
              <span className="flex items-center gap-2.5">
                <BarChart className="w-4 h-4 shrink-0" />
                <span>Dashboard Home</span>
              </span>
            </button>

            <button 
              onClick={() => setActiveTab("war-room")} 
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-lg transition-colors border-2 ${activeTab === 'war-room' ? 'bg-black text-[#edfc47] border-black shadow-sm' : 'text-black hover:bg-[#f7f6f5] border-transparent'}`}
            >
              <span className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 shrink-0 ${activeTab === 'war-room' ? 'text-[#edfc47]' : 'text-zinc-650 animate-pulse'}`} />
                <span>The War Room</span>
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border ${activeTab === 'war-room' ? 'bg-yellow-950 text-[#edfc47] border-[#edfc47]/30' : 'bg-black text-[#edfc47] border-black'}`}>
                TACTICAL
              </span>
            </button>

            <button 
              onClick={() => setActiveTab("lead-magnet")} 
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'lead-magnet' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Lead Magnet</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${isLmagDone ? 'bg-green-100 text-green-800' : 'bg-[#f7f6f5] text-[#4d4d4d]'}`}>
                {isLmagDone ? '✓' : '1'}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab("dream-100")} 
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'dream-100' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
            >
              <span className="flex items-center gap-2.5">
                <Target className="w-4 h-4 shrink-0" />
                <span>Dream 100</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${isD100Done ? 'bg-green-100 text-green-800' : 'bg-[#f7f6f5] text-[#4d4d4d]'}`}>
                {isD100Done ? '✓' : '2'}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab("email-sequence")} 
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'email-sequence' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
            >
              <span className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Email Sequence</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${isEmailDone ? 'bg-green-100 text-green-800' : 'bg-[#f7f6f5] text-[#4d4d4d]'}`}>
                {isEmailDone ? '✓' : '3'}
              </span>
            </button>

            {/* Pro only locked navigations */}
            <div className="pt-3 border-t border-[#cccccc]/30 mt-3 space-y-1">
              <span className="block px-3 text-[10px] font-bold font-mono tracking-wider text-[#4d4d4d]/60 mb-1">PRO TOOLS</span>
              
              <button 
                onClick={() => handleProtectedClick("linkedin", "LinkedIn Repurposer")} 
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-all ${user.plan === 'Basic' ? 'opacity-65 hover:bg-[#f7f6f5]/20' : ''} ${activeTab === 'linkedin' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
              >
                <span className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>LinkedIn Content</span>
                </span>
                {user.plan === 'Basic' && <Lock className="w-3.5 h-3.5 text-[#4d4d4d]" />}
              </button>

              <button 
                onClick={() => handleProtectedClick("scorecard", "Perry Marshall Lead Matrix")} 
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-all ${user.plan === 'Basic' ? 'opacity-65 hover:bg-[#f7f6f5]/20' : ''} ${activeTab === 'scorecard' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
              >
                <span className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 shrink-0" />
                  <span>Partner Scorecard</span>
                </span>
                {user.plan === 'Basic' && <Lock className="w-3.5 h-3.5 text-[#4d4d4d]" />}
              </button>

              <button 
                onClick={() => handleProtectedClick("tripwire", "Ryan Deiss Tripwire Upsell")} 
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md transition-all ${user.plan === 'Basic' ? 'opacity-65 hover:bg-[#f7f6f5]/20' : ''} ${activeTab === 'tripwire' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Tripwire Offer</span>
                </span>
                {user.plan === 'Basic' && <Lock className="w-3.5 h-3.5 text-[#4d4d4d]" />}
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer parameters */}
        <div className="space-y-1">
          <button 
            onClick={() => { setActiveTab("settings"); setSettingsSubTab("account"); }} 
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'settings' ? 'bg-black text-[#edfc47]' : 'text-black hover:bg-[#f7f6f5]'}`}
          >
            <Settings className="w-4 h-4 text-[#4d4d4d]" />
            <span>Settings</span>
          </button>

          <button 
            onClick={() => { setShowBugModal(true); setBugSuccess(false); }} 
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-md text-black hover:bg-yellow-50/60 border border-amber-300 border-dashed transition-all cursor-pointer"
          >
            <Bug className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Report a Bug</span>
          </button>
          
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-md text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN MAIN MAIN CONTENT PORT */}
      <main className="flex-1 bg-[#f7f6f5] p-8 md:p-12 overflow-y-auto max-w-[1200px] w-full mx-auto">
        
        {/* Banner notification for copy checks */}
        <AnimatePresence>
          {copiedText && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-[50%] translate-x-[-50%] bg-[#edfc47] border-2 border-black text-black text-xs font-bold font-mono py-2.5 px-6 rounded-full z-[100] shadow-md flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-black stroke-[3]" />
              <span>COPIED: {copiedText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TACTICAL WAR ROOM TAB */}
        {activeTab === "war-room" && (
          <WarRoom 
            user={user} 
            setActiveTab={setActiveTab} 
            onTriggerUpgrade={() => {
              setUpgradeLockedFeature("Pro War Room Planners");
              setShowUpgradeModal(true);
            }} 
            handleProtectedClick={handleProtectedClick}
          />
        )}

        {/* 1. DASHBOARD HOME VIEW */}
        {activeTab === "home" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#cccccc]/40 pb-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-roobert font-extrabold text-black tracking-tight" id="dash-welcome">
                  Welcome back, {user.name.split(" ")[0] || "Founder"}.
                </h1>
                <p className="text-base text-[#4d4d4d] font-normal mt-1" id="dash-welcome-sub">
                  Here’s your marketing system. Pick a playbook tool below to generate copywriting or outreach datasets.
                </p>
              </div>

              {/* 3-day trial indicator alert */}
              <div className="bg-green-50 border-2 border-green-200 rounded-[8px] p-3 text-green-900 flex items-center gap-3 shadow-xs max-w-sm">
                <span className="text-lg">🎁</span>
                <div className="text-left leading-tight">
                  <span className="block text-[10px] font-bold uppercase font-mono tracking-wider text-green-800">
                    3-Day Sandbox Trial Active
                  </span>
                  <span className="block text-[11px] font-medium text-green-700 mt-0.5">
                    No card required. Upgrade to Pro anywhere to unblock scorecards and Ryan Deiss scripts!
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical War Room Centralized Map Banner */}
            <div className="bg-[#111614] border-2 border-black rounded-2xl p-6 text-left relative overflow-hidden shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
                style={{
                  backgroundImage: `linear-gradient(#20382d 1px, transparent 1px), linear-gradient(90deg, #20382d 1px, transparent 1px)`,
                  backgroundSize: "20px 20px"
                }}
              />
              <div className="relative z-10 space-y-1.5 max-w-xl">
                <span className="text-[9px] uppercase font-bold font-mono bg-[#16211d] text-[#edfc47] px-2.5 py-0.5 rounded border border-[#edfc47]/20">
                  ♟️ CENTRAL OPERATIONAL MAP
                </span>
                <h2 className="text-xl md:text-2xl font-roobert font-extrabold text-white tracking-tight">
                  Enter The War Room
                </h2>
                <p className="text-[#a1b3aa] text-xs leading-relaxed font-mono font-medium">
                  An interactive, high-fidelity sandbox mapping the direct loops between all 6 core playbooks. Click commanders on the hexagonal table to diagnose problems, view step-by-steps, and execute strategies.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab("war-room")} 
                className="relative z-10 bg-[#edfc47] text-black hover:bg-white text-xs font-mono font-bold uppercase tracking-wider py-3 px-5 rounded-lg border border-black cursor-pointer shadow-md shrink-0 flex items-center gap-2 transition-all hover:scale-[1.03]"
              >
                <span>Activate Command Deck</span>
                <Compass className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Quick Strategy grid — Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              {/* Card 1 - Lead Magnet -> md:col-span-4 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">Lead Magnet Builder</h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${isLmagDone ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {isLmagDone ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Generate the complete headlines and benefit bullets for Russell Brunson's free incentive page.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("lead-magnet")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2 - Dream 100 -> md:col-span-2 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">Dream 100 Finder</h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${isD100Done ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {isD100Done ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Scrape or synthesize partner hosts aligned with your demographic and write Hormozi pitches.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("dream-100")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3 - Email Sequence -> md:col-span-2 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">Email Nurture</h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${isEmailDone ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {isEmailDone ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Set up GaryVee's "Jab, Jab, Jab, Hook" sequence of 3 value posts and 1 soft-offer.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("email-sequence")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 4 - LinkedIn Content -> md:col-span-4 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] relative overflow-hidden hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                {user.plan === 'Basic' && (
                  <div className="absolute top-2 right-2 border border-black/10 bg-black text-[#edfc47] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO ONLY
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">
                      LinkedIn Engine
                      {user.plan === 'Basic' && <span className="border border-black text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 inline-block text-black bg-white">PRO</span>}
                    </h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${linkedin ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {linkedin ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Repurpose value-driven sequences into viral high-contrast organic text scrolls formatted like Justin Welsh.
                  </p>
                </div>
                <button 
                  onClick={() => handleProtectedClick("linkedin", "LinkedIn Repurposer")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 5 - Scorecard -> md:col-span-3 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] relative overflow-hidden hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                {user.plan === 'Basic' && (
                  <div className="absolute top-2 right-2 border border-black/10 bg-black text-[#edfc47] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO ONLY
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">
                      Partner Scorecard
                      {user.plan === 'Basic' && <span className="border border-black text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 inline-block text-black bg-white">PRO</span>}
                    </h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${dream100.some(p => (p.leadsSent || 0) > 0) ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {dream100.some(p => (p.leadsSent || 0) > 0) ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Audit leads sent to isolate and highlight your top 20% conversion vehicles, as coached by Perry Marshall.
                  </p>
                </div>
                <button 
                  onClick={() => handleProtectedClick("scorecard", "Perry Marshall Lead Matrix")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 6 - Tripwire -> md:col-span-3 */}
              <div className="bg-white border border-[#cccccc] p-6 rounded-[10px] flex flex-col justify-between min-h-[190px] relative overflow-hidden hover:border-black transition-colors duration-200 shadow-sm hover:shadow-md">
                {user.plan === 'Basic' && (
                  <div className="absolute top-2 right-2 border border-black/10 bg-black text-[#edfc47] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO ONLY
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-roobert font-bold text-lg text-black">
                      Tripwire Upsell
                      {user.plan === 'Basic' && <span className="border border-black text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 inline-block text-black bg-white">PRO</span>}
                    </h3>
                    <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase ${tripwire ? 'bg-[#e6f9e6] text-[#1e561e]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                      {tripwire ? 'Ready' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    Formulate a micro-transaction impulse-purchase offer ($9–$20) to turn regular leads into paying customers automatically.
                  </p>
                </div>
                <button 
                  onClick={() => handleProtectedClick("tripwire", "Ryan Deiss Tripwire Upsell")} 
                  className="btn-soft w-full py-2 mt-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Setups checklist tracker progressive widget */}
            <div className="bg-white border border-[#cccccc] rounded-[10px] p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#cccccc]/40">
                <div>
                  <h3 className="font-roobert font-bold text-xl text-black">Your Inbound Loop Setup Checklist</h3>
                  <p className="text-xs text-[#4d4d4d]">Watch your marketing loop activate as you finish steps.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-black">{progressPct}% ACTIVE</span>
                  <div className="w-32 h-2.5 bg-[#f7f6f5] border border-[#cccccc] rounded-full overflow-hidden">
                    <div className="bg-[#edfc47] h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-[#edfc47] text-black rounded-full flex items-center justify-center text-[10px] font-bold border border-[#cccccc]">✓</span>
                  <span className="text-sm font-semibold text-black">Account created</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-[#edfc47] text-black rounded-full flex items-center justify-center text-[10px] font-bold border border-[#cccccc]">✓</span>
                  <span className="text-sm font-semibold text-black">Plan selected ({user.plan})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-[#edfc47] text-black rounded-full flex items-center justify-center text-[10px] font-bold border border-[#cccccc]">✓</span>
                  <span className="text-sm font-semibold text-black">Niche and offer entered</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${isLmagDone ? 'bg-[#edfc47] text-black border-[#cccccc]' : 'border-[#cccccc] bg-white text-transparent'}`}>{isLmagDone ? '✓' : ''}</span>
                  <span className={`text-sm ${isLmagDone ? 'font-semibold text-black' : 'text-[#4d4d4d]'}`}>Lead magnet generated</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${isD100Done ? 'bg-[#edfc47] text-black border-[#cccccc]' : 'border-[#cccccc] bg-white text-transparent'}`}>{isD100Done ? '✓' : ''}</span>
                  <span className={`text-sm ${isD100Done ? 'font-semibold text-black' : 'text-[#4d4d4d]'}`}>Dream 100 list created</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${isEmailDone ? 'bg-[#edfc47] text-black border-[#cccccc]' : 'border-[#cccccc] bg-white text-transparent'}`}>{isEmailDone ? '✓' : ''}</span>
                  <span className={`text-sm ${isEmailDone ? 'font-semibold text-black' : 'text-[#4d4d4d]'}`}>Email sequence written</span>
                </div>
              </div>
              <div style={{ height: "4px", background: "#eee", width: "100%", borderRadius: "2px", marginTop: "16px" }}>
                <div style={{ height: "100%", background: "var(--color-lime-accent)", width: `${progressPct}%`, borderRadius: "2px" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LEAD MAGNET VIEW */}
        {activeTab === "lead-magnet" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                RUSSELL BRUNSON PLAYBOOK
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                Lead Magnet Page Builder
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                Generate the high-converting content for your free lead-capture offer in one click.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form panel */}
              <div className="lg:col-span-4 bg-white border border-[#cccccc] p-6 rounded-xl space-y-4">
                <h3 className="font-roobert font-bold text-lg text-black border-b border-[#cccccc]/40 pb-2">Modify Strategy Inputs</h3>
                
                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">My niche is</label>
                  <input 
                    type="text" 
                    value={lmagNiche} 
                    onChange={(e) => setLmagNiche(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Target Audience</label>
                  <input 
                    type="text" 
                    value={lmagAudience} 
                    onChange={(e) => setLmagAudience(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Main Offer Description</label>
                  <input 
                    type="text" 
                    value={lmagOffer} 
                    onChange={(e) => setLmagOffer(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                  />
                </div>

                <button 
                  onClick={generateLeadMagnet}
                  disabled={loadingLmag}
                  className="w-full btn-primary py-3 font-roobert text-sm flex items-center justify-center gap-2"
                  id="leadmagnet-btn-gen"
                >
                  {loadingLmag ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Drafting via Gemini...</span>
                    </>
                  ) : (
                    <span>Generate My Lead Magnet</span>
                  )}
                </button>
              </div>

              {/* Display Result panel */}
              <div className="lg:col-span-8 space-y-6">
                {leadMagnet ? (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-6 relative space-y-6">
                    <span className="absolute top-4 right-4 text-xs font-mono font-semibold text-[#4d4d4d]/40">BRUNSON BROWSER PREVIEW</span>
                    
                    {/* Visual mockup representation as a beautiful browser */}
                    <div className="border-4 border-black rounded-lg overflow-hidden bg-white shadow-lg">
                      {/* Browser Title Bar */}
                      <div className="bg-[#f7f6f5] border-b-2 border-black px-4 py-3 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10 inline-block" />
                        </div>
                        <div className="bg-white border border-[#cccccc] rounded px-3 py-1 font-mono text-[10px] text-gray-500 w-3/5 text-center truncate select-all">
                          https://optin.{onboardingData.niche.toLowerCase().replace(/[^a-z0-9]/g, "") || "funnel"}.com/free-playbook
                        </div>
                        <div className="w-8" />
                      </div>

                      {/* Browser Content */}
                      <div className="p-8 bg-white relative">
                        {lmagFormSuccess ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12 space-y-4"
                          >
                            <div className="text-4xl animate-bounce">🎉</div>
                            <h3 className="text-xl font-roobert font-extrabold text-green-700 uppercase">Subscribed on Free Trial!</h3>
                            <p className="text-sm text-[#4d4d4d] max-w-sm mx-auto">
                              Welcome, <strong className="text-black">{lmagSubName || "anonymous lead"}</strong>! The lead magnet automated system has captured your signup under <span className="font-mono bg-[#f7f6f5] px-1 hover:bg-[#edfc47]">{lmagSubEmail}</span>. Sequence jabs and hooks will deploy shortly.
                            </p>
                            <button 
                              onClick={() => {
                                setLmagFormSuccess(false);
                                setLmagSubName("");
                                setLmagSubEmail("");
                              }}
                              className="btn-soft font-mono font-bold text-xs py-2 px-6"
                            >
                              ← Back to live preview
                            </button>
                          </motion.div>
                        ) : (
                          <div className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center">
                              <span className="inline-block bg-[#edfc47] border border-black text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                                {leadMagnet.title}
                              </span>
                            </div>

                            <div className="space-y-2 text-center">
                              {/* Let the user interactively edit headline in browser! */}
                              <label className="block text-[8px] font-bold text-gray-400 font-mono uppercase text-center select-none">
                                ✍️ Click text below to live-edit headlines
                              </label>
                              <textarea
                                value={leadMagnet.headline}
                                onChange={(e) => {
                                  const updated = { ...leadMagnet, headline: e.target.value };
                                  setLeadMagnet(updated);
                                  localStorage.setItem("pn_lmag", JSON.stringify(updated));
                                }}
                                rows={2}
                                className="w-full text-xl md:text-2xl font-roobert font-black text-black text-center leading-snug tracking-tight bg-yellow-50/40 hover:bg-yellow-50 focus:bg-white focus:ring-2 focus:ring-black rounded p-1 outline-none border-b border-transparent focus:border-black resize-none"
                              />
                            </div>

                            <div className="space-y-2 border-t border-b border-[#cccccc]/40 py-4">
                              <p className="text-[9px] font-bold text-gray-400 font-mono uppercase tracking-wider select-none">
                                Core value claims (Edit below):
                              </p>
                              {leadMagnet.bullets.map((b: string, i: number) => (
                                <div key={i} className="flex gap-2 text-xs text-black align-top items-start">
                                  <span className="font-mono font-bold text-black shrink-0 mt-1">[✓]</span>
                                  <input 
                                    type="text"
                                    value={b}
                                    onChange={(e) => {
                                      const newBullets = [...leadMagnet.bullets];
                                      newBullets[i] = e.target.value;
                                      const updated = { ...leadMagnet, bullets: newBullets };
                                      setLeadMagnet(updated);
                                      localStorage.setItem("pn_lmag", JSON.stringify(updated));
                                    }}
                                    className="w-full bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white text-xs text-[#4d4d4d] border-b border-transparent focus:border-black outline-none py-0.5 px-1 font-semibold"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Simulated active opt-in submit form */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!lmagSubName || !lmagSubEmail) return;
                                setLmagFormSubmitting(true);
                                setTimeout(() => {
                                  setLmagFormSubmitting(false);
                                  setLmagFormSuccess(true);
                                }, 1000);
                              }}
                              className="bg-[#f7f6f5] p-5 rounded-lg border border-[#cccccc] space-y-3"
                            >
                              <span className="block text-[9px] font-bold text-black uppercase tracking-widest font-mono text-center mb-1">
                                Test Drive Your Funnel (Simulated Check)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  required
                                  value={lmagSubName}
                                  onChange={(e) => setLmagSubName(e.target.value)}
                                  placeholder="Type lead name"
                                  className="bg-white border text-xs text-black px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                />
                                <input 
                                  type="email"
                                  required
                                  value={lmagSubEmail}
                                  onChange={(e) => setLmagSubEmail(e.target.value)}
                                  placeholder="Type lead email"
                                  className="bg-white border text-xs text-black px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={lmagFormSubmitting}
                                className="w-full py-2.5 bg-black text-[#edfc47] hover:opacity-90 transition-all font-roobert font-extrabold text-xs uppercase tracking-wider rounded border border-black flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {lmagFormSubmitting ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  leadMagnet.cta
                                )}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copy managers */}
                    <div className="flex gap-2 pt-2 border-t border-[#cccccc]/40">
                      <button 
                        onClick={() => copyToClipboard(`Lead Magnet Title: ${leadMagnet.title}\nHeadline: ${leadMagnet.headline}\nBullets:\n- ${leadMagnet.bullets.join("\n- ")}\nCTA: ${leadMagnet.cta}`, "Lead Magnet details")}
                        className="btn-soft text-xs py-2 px-4 flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Details
                      </button>
                      <button 
                        onClick={generateLeadMagnet}
                        disabled={loadingLmag}
                        className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate Version
                      </button>
                    </div>

                    {/* Quota stamp */}
                    <div className="text-xs text-[#4d4d4d] font-mono mt-2 flex items-center justify-between bg-zinc-50 p-2.5 rounded border border-[#cccccc]/40">
                      <span>PLAN LIMIT STATUS:</span>
                      <span>{counts.leadMagnet} of {user.plan === 'Pro' ? '100' : '20'} generations utilized</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d] space-y-4">
                    <BookOpen className="w-12 h-12 text-[#cccccc] mx-auto" />
                    <div>
                      <h4 className="font-roobert font-bold text-lg text-black">Generate your lead magnet page copy</h4>
                      <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1 text-[#4d4d4d]">
                        Click the generator button on the left. Gemini will process your business variables and write direct opt-in page layouts.
                      </p>
                    </div>
                    <button 
                      onClick={generateLeadMagnet}
                      className="btn-soft bg-black text-[#edfc47] hover:bg-[#222222] font-mono font-bold text-xs"
                    >
                      Instant Blueprint
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. DREAM 100 VIEW */}
        {activeTab === "dream-100" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                ALEX HORMOZI PLAYBOOK
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                Dream 100 Outreach List
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                Identify partners who share your demographic. Gemini creates customized warmly framed pitch scripts.
              </p>
            </div>

            <div className="bg-white border border-[#cccccc] padded-card rounded-xl p-6 space-y-6">
              {/* Form settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pb-6 border-b border-[#cccccc]/40">
                {/* Count slider */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1.5 flex justify-between">
                    <span>Partners Count</span>
                    <span className="font-semibold text-black bg-[#edfc47] px-1 rounded border border-black/15 font-mono">{partnerCount} Channels</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#4d4d4d] font-mono font-bold">10</span>
                    <input 
                      type="range" 
                      min="10" 
                      max={user.plan === "Pro" ? "100" : "20"} 
                      step="5"
                      value={partnerCount} 
                      onChange={(e) => setPartnerCount(parseInt(e.target.value))}
                      className="w-full accent-black cursor-pointer bg-[#f7f6f5] rounded border border-[#cccccc] h-2 py-1"
                    />
                    <span className="text-xs text-[#4d4d4d] font-mono font-bold">{user.plan === "Pro" ? "100" : "20"}</span>
                  </div>
                  {user.plan === "Basic" && (
                    <span className="text-[10px] text-[#4d4d4d] block mt-1 hover:underline cursor-pointer" onClick={onTriggerUpgradeCheckout}>
                      🔒 Upgrade to Pro to adjust up to 100
                    </span>
                  )}
                </div>

                {/* Platform select dropdown */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1.5">Where should we look?</label>
                  <select 
                    value={platformOption} 
                    onChange={(e) => setPlatformOption(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black font-semibold"
                  >
                    <option value="Both">Both (Podcasts & YouTube)</option>
                    <option value="YouTube">YouTube Creators only</option>
                    <option value="Podcasts">Podcasts only</option>
                  </select>
                </div>

                <div>
                  <button 
                    onClick={generateDream100}
                    disabled={loadingD100}
                    className="w-full btn-primary py-3 font-roobert text-xs flex items-center justify-center gap-2"
                  >
                    {loadingD100 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Scanning via Hunter.io Mock APIs...</span>
                      </>
                    ) : (
                      <span>Find My Partners & Write Pitches</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Table Result Port */}
              {dream100.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <span className="text-xs font-mono font-bold text-black uppercase border-b-2 border-black pb-0.5">
                      IDENTIFIED PREP SHEET CRM ({dream100.length})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowAddPartnerForm(!showAddPartnerForm)}
                        className="btn-soft text-xs py-1.5 px-3 flex items-center gap-1 bg-black text-white hover:bg-[#111] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Partner Lead
                      </button>

                      <button 
                        onClick={downloadDream100CSV}
                        className="btn-soft text-xs py-1.5 px-3 flex items-center gap-1 bg-[#edfc47] border border-black/25 font-bold cursor-pointer"
                        title="Download complete sheet"
                      >
                        <Download className="w-3.5 h-3.5" /> Download CSV Report
                      </button>
                    </div>
                  </div>

                  {/* Manual Partner Form Append Row */}
                  <AnimatePresence>
                    {showAddPartnerForm && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleManualAddPartner}
                        className="bg-amber-50/50 border border-amber-200 p-4 rounded-lg space-y-3 text-left overflow-hidden shadow-xs"
                      >
                        <div className="text-xs font-bold uppercase text-amber-800 font-mono flex items-center gap-1.5">
                          <span>➕ Append Custom Lead Target</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#4d4d4d] uppercase mb-1 font-mono">Partner Channel Name</label>
                            <input 
                              type="text" 
                              required
                              value={newPartnerName} 
                              onChange={(e) => setNewPartnerName(e.target.value)}
                              placeholder="e.g. Creator Weekly"
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 text-xs text-black"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4d4d4d] uppercase mb-1 font-mono">Platform Type</label>
                            <select 
                              value={newPartnerPlatform} 
                              onChange={(e) => setNewPartnerPlatform(e.target.value)}
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 text-xs text-black font-semibold"
                            >
                              <option value="YouTube">YouTube</option>
                              <option value="Podcasts">Podcast</option>
                              <option value="LinkedIn">LinkedIn</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4d4d4d] uppercase mb-1 font-mono">Contact Email / Handlers</label>
                            <input 
                              type="text" 
                              required
                              value={newPartnerContact} 
                              onChange={(e) => setNewPartnerContact(e.target.value)}
                              placeholder="e.g. outreach@creatorweekly.com"
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 text-xs text-black"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#4d4d4d] uppercase mb-1 font-mono">Platform Channel Link (URL)</label>
                            <input 
                              type="text" 
                              value={newPartnerLink} 
                              onChange={(e) => setNewPartnerLink(e.target.value)}
                              placeholder="e.g. youtube.com/creatorweekly"
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 text-xs text-black font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4d4d4d] uppercase mb-1 font-mono">Outreach Pitch Statement</label>
                            <input 
                              type="text" 
                              value={newPartnerMessage} 
                              onChange={(e) => setNewPartnerMessage(e.target.value)}
                              placeholder="Type outreach proposal pitch wording here..."
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 text-xs text-black"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowAddPartnerForm(false)}
                            className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 font-mono font-bold text-[10px] px-3 py-1 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="bg-black text-[#edfc47] hover:bg-black/95 font-mono font-bold text-[10px] px-3.5 py-1 rounded border border-black cursor-pointer"
                          >
                            Add Lead Partner
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto border border-[#cccccc] rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f7f6f5] border-b border-[#cccccc] text-black font-mono font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Partner Title (Edit)</th>
                          <th className="p-3">Platform</th>
                          <th className="p-3">Channel Links (Edit)</th>
                          <th className="p-3">Contact Email/Handler (Edit)</th>
                          <th className="p-3">Outreach Proposal Pitch (Edit/Copy)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cccccc]/50">
                        {dream100.slice(0, 15).map((p: Dream100Partner, i: number) => (
                          <tr key={i} className="hover:bg-zinc-50/70 text-black">
                            <td className="p-2 font-bold max-w-[140px]">
                              <input 
                                type="text"
                                value={p.partnerName}
                                onChange={(e) => {
                                  const updated = [...dream100];
                                  updated[i] = { ...updated[i], partnerName: e.target.value };
                                  setDream100(updated);
                                  localStorage.setItem("pn_d100", JSON.stringify(updated));
                                }}
                                className="w-full border-b border-transparent hover:border-[#cccccc] focus:border-black focus:bg-white p-1 rounded font-bold transition-all text-xs outline-none bg-transparent"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={p.platform}
                                onChange={(e) => {
                                  const updated = [...dream100];
                                  updated[i] = { ...updated[i], platform: e.target.value };
                                  setDream100(updated);
                                  localStorage.setItem("pn_d100", JSON.stringify(updated));
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-white border border-[#cccccc] outline-none"
                              >
                                <option value="YouTube">YouTube</option>
                                <option value="Podcasts">Podcasts</option>
                                <option value="LinkedIn">LinkedIn</option>
                              </select>
                            </td>
                            <td className="p-2 max-w-[140px]">
                              <input 
                                type="text"
                                value={p.link}
                                onChange={(e) => {
                                  const updated = [...dream100];
                                  updated[i] = { ...updated[i], link: e.target.value };
                                  setDream100(updated);
                                  localStorage.setItem("pn_d100", JSON.stringify(updated));
                                }}
                                className="w-full border-b border-transparent hover:border-[#cccccc] focus:border-black focus:bg-white p-1 rounded transition-all font-mono text-[10px] text-zinc-600 bg-transparent outline-none"
                              />
                            </td>
                            <td className="p-2 max-w-[130px]">
                              <input 
                                type="text"
                                value={p.contact}
                                onChange={(e) => {
                                  const updated = [...dream100];
                                  updated[i] = { ...updated[i], contact: e.target.value };
                                  setDream100(updated);
                                  localStorage.setItem("pn_d100", JSON.stringify(updated));
                                }}
                                className="w-full border-b border-transparent hover:border-[#cccccc] focus:border-black focus:bg-white p-1 rounded transition-all text-[11px] text-[#4d4d4d] bg-transparent outline-none font-semibold"
                              />
                            </td>
                            <td className="p-2 min-w-[280px]">
                              <div className="bg-zinc-50 border border-zinc-200 p-2 rounded relative text-[11px] leading-relaxed text-[#4d4d4d] space-y-1.5">
                                <textarea 
                                  value={p.message}
                                  onChange={(e) => {
                                    const updated = [...dream100];
                                    updated[i] = { ...updated[i], message: e.target.value };
                                    setDream100(updated);
                                    localStorage.setItem("pn_d100", JSON.stringify(updated));
                                  }}
                                  rows={2}
                                  className="w-full bg-transparent border-none text-[11px] leading-normal italic text-black focus:ring-1 focus:ring-black rounded p-0.5 focus:bg-white resize-none outline-none"
                                />
                                <div className="flex justify-between items-center mt-1 border-t border-zinc-200/65 pt-1">
                                  <button 
                                    onClick={() => {
                                      const updated = dream100.filter((_, idx) => idx !== i);
                                      setDream100(updated);
                                      localStorage.setItem("pn_d100", JSON.stringify(updated));
                                      triggerCopyNotice("Lead removed from prep-sheet");
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                    title="Delete Lead Target"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => copyToClipboard(p.message, `Outreach pitch for ${p.partnerName}`)}
                                    className="text-[9px] font-bold uppercase bg-white border border-[#cccccc] px-2 py-0.5 rounded hover:bg-black hover:text-white transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <Copy className="w-2.5 h-2.5" /> Copy Message
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {dream100.length > 15 && (
                    <p className="text-center text-xs text-[#4d4d4d] italic py-2">
                      Showing top 15 rows of {dream100.length} partners. Download the complete matching CSV spreadsheet to view all.
                    </p>
                  )}

                  {/* Limit status usage tracker */}
                  <div className="text-xs text-[#4d4d4d] font-mono mt-4 flex items-center justify-between bg-zinc-50 p-2.5 rounded border border-[#cccccc]/40">
                    <span>STRIPE QUOTA STATUS:</span>
                    <span>{counts.dream100} of {user.plan === 'Pro' ? '100' : '20'} search iterations utilized</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#4d4d4d] space-y-4">
                  <Target className="w-12 h-12 text-[#cccccc] mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-roobert font-bold text-lg text-black">Find your premium marketing partners</h4>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1 text-[#4d4d4d]">
                      Set your configuration values and trigger the builder. Gemini identifies niche distribution vehicles is milliseconds.
                    </p>
                  </div>
                  <button 
                    onClick={generateDream100}
                    className="btn-soft bg-black text-[#edfc47] hover:bg-[#222222] font-mono font-bold text-xs"
                  >
                    Initiate Search Scrapers
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. EMAIL SEQUENCE VIEW */}
        {activeTab === "email-sequence" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                GARY VAYNERCHUK PLAYBOOK
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                4-Email Nurture Sequence
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                4 pre-written emails — 3 educational/story value jabs followed by 1 soft-pitch hook.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left modifications panel */}
              <div className="lg:col-span-4 bg-white border border-[#cccccc] p-6 rounded-xl space-y-4">
                <h3 className="font-roobert font-bold text-lg text-black border-b border-[#cccccc]/40 pb-2">Nurture Variables</h3>
                
                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">My Niche</label>
                  <input 
                    type="text" 
                    value={emailNiche} 
                    onChange={(e) => setEmailNiche(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Core Offer Name</label>
                  <input 
                    type="text" 
                    value={emailOffer} 
                    onChange={(e) => setEmailOffer(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Soft-Pitch Hook Offer</label>
                  <input 
                    type="text" 
                    value={emailHookOffer} 
                    onChange={(e) => setEmailHookOffer(e.target.value)}
                    className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black font-medium"
                    placeholder="e.g. Free 15-min consult"
                  />
                  <p className="text-[10px] text-[#4d4d4d] mt-1">What we pitch in Email 4.</p>
                </div>

                <button 
                  onClick={generateEmailSequence}
                  disabled={loadingEmail}
                  className="w-full btn-primary py-3 font-roobert text-sm flex items-center justify-center gap-2"
                >
                  {loadingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Writing Copy Streams via Gemini...</span>
                    </>
                  ) : (
                    <span>Write My Emails (GaryVee structure)</span>
                  )}
                </button>
              </div>

              {/* Display Result panel */}
              <div className="lg:col-span-8 space-y-6">
                {emailSequence ? (
                  <div className="space-y-6 bg-white border border-[#cccccc] rounded-xl p-8 relative">
                    <span className="absolute top-4 right-4 text-xs font-mono font-semibold text-[#4d4d4d]/50">JAB-JAB-JAB-HOOK STACK</span>
                    
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                      {/* Email 1 */}
                      <div className="border border-[#cccccc]/75 rounded-lg p-5 bg-[#f7f6f5]/20 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-black border-b border-[#cccccc]/40 pb-2">
                          <span>EMAIL 1 — JAB (ACTIONABLE PURE VALUE)</span>
                          <button 
                            onClick={() => copyToClipboard(`Subject: ${emailSequence.email1.subject}\n\n${emailSequence.email1.body}`, "Email 1 Subject & Body")}
                            className="text-black flex items-center gap-1 bg-white border border-black/30 px-2 py-0.5 rounded font-mono font-bold"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-black"><span className="text-[#4d4d4d]">Subject:</span> {emailSequence.email1.subject}</p>
                        <p className="text-xs text-[#4d4d4d] whitespace-pre-line leading-relaxed font-mono bg-white p-2.5 rounded border border-[#cccccc]/20">{emailSequence.email1.body}</p>
                      </div>

                      {/* Email 2 */}
                      <div className="border border-[#cccccc]/75 rounded-lg p-5 bg-[#f7f6f5]/20 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-black border-b border-[#cccccc]/40 pb-2">
                          <span>EMAIL 2 — JAB (STORY / CASE STUDY)</span>
                          <button 
                            onClick={() => copyToClipboard(`Subject: ${emailSequence.email2.subject}\n\n${emailSequence.email2.body}`, "Email 2 Subject & Body")}
                            className="text-black flex items-center gap-1 bg-white border border-black/30 px-2 py-0.5 rounded font-mono font-bold"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-black"><span className="text-[#4d4d4d]">Subject:</span> {emailSequence.email2.subject}</p>
                        <p className="text-xs text-[#4d4d4d] whitespace-pre-line leading-relaxed font-mono bg-white p-2.5 rounded border border-[#cccccc]/20">{emailSequence.email2.body}</p>
                      </div>

                      {/* Email 3 */}
                      <div className="border border-[#cccccc]/75 rounded-lg p-5 bg-[#f7f6f5]/20 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-black border-b border-[#cccccc]/40 pb-2">
                          <span>EMAIL 3 — JAB (EDUCATIONAL CHECKLIST)</span>
                          <button 
                            onClick={() => copyToClipboard(`Subject: ${emailSequence.email3.subject}\n\n${emailSequence.email3.body}`, "Email 3 Subject & Body")}
                            className="text-black flex items-center gap-1 bg-white border border-black/30 px-2 py-0.5 rounded font-mono font-bold"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-black"><span className="text-[#4d4d4d]">Subject:</span> {emailSequence.email3.subject}</p>
                        <p className="text-xs text-[#4d4d4d] whitespace-pre-line leading-relaxed font-mono bg-white p-2.5 rounded border border-[#cccccc]/20">{emailSequence.email3.body}</p>
                      </div>

                      {/* Email 4 */}
                      <div className="border border-[#eeeeee] rounded-lg p-5 bg-yellow-50/20 shadow-sm border-2 border-[#edfc47]/50 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-black border-b border-[#edfc47]/40 pb-2">
                          <span>EMAIL 4 — RIGHT HOOK (SOFT OFFER ALIGNMENT)</span>
                          <button 
                            onClick={() => copyToClipboard(`Subject: ${emailSequence.email4.subject}\n\n${emailSequence.email4.body}`, "Email 4 Subject & Body")}
                            className="text-black flex items-center gap-1 bg-white border border-black/30 px-2 py-0.5 rounded font-mono font-bold"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-black"><span className="text-[#4d4d4d]">Subject:</span> {emailSequence.email4.subject}</p>
                        <p className="text-xs text-[#4d4d4d] whitespace-pre-line leading-relaxed font-mono bg-white p-2.5 rounded border border-[#cccccc]/20">{emailSequence.email4.body}</p>
                      </div>
                    </div>

                    {/* Overall panel copy controls */}
                    <div className="flex gap-2 pt-4 border-t border-[#cccccc]/40">
                      <button 
                        onClick={() => copyToClipboard(
                          `--- EMAIL 1 ---\nSubject: ${emailSequence.email1.subject}\n${emailSequence.email1.body}\n\n--- EMAIL 2 ---\nSubject: ${emailSequence.email2.subject}\n${emailSequence.email2.body}\n\n--- EMAIL 3 ---\nSubject: ${emailSequence.email3.subject}\n${emailSequence.email3.body}\n\n--- EMAIL 4 ---\nSubject: ${emailSequence.email4.subject}\n${emailSequence.email4.body}`,
                          "All four emails from list"
                        )}
                        className="btn-soft text-xs py-2 px-4 flex items-center gap-1 px-4 py-2 bg-black text-[#edfc47] hover:bg-[#222222]"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy All Emails
                      </button>
                      <button 
                        onClick={generateEmailSequence}
                        disabled={loadingEmail}
                        className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate All
                      </button>
                    </div>

                    {/* Limit status usage tracker */}
                    <div className="text-xs text-[#4d4d4d] font-mono mt-4 flex items-center justify-between bg-zinc-50 p-2.5 rounded border border-[#cccccc]/40">
                      <span>PLAN REMAINING USAGE:</span>
                      <span>{counts.emailSequence} of {user.plan === 'Pro' ? '100' : '20'} generations utilized</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d] space-y-4">
                    <Mail className="w-12 h-12 text-[#cccccc] mx-auto animate-pulse" />
                    <div>
                      <h4 className="font-roobert font-bold text-lg text-black">Write your nurture sequence copies</h4>
                      <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1 text-[#4d4d4d]">
                        Wired to process user niche parameters and create GaryVee nurture cascades.
                      </p>
                    </div>
                    <button 
                      onClick={generateEmailSequence}
                      className="btn-soft bg-black text-[#edfc47] hover:bg-[#222222] font-mono font-bold text-xs"
                    >
                      Instant Generation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. LINKEDIN REPURPOSER (Pro Only) */}
        {activeTab === "linkedin" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                JUSTIN WELSH PLAYBOOK (PRO ONLY)
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                LinkedIn Content Engine
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                Automatically convert your value emails into viral premium organic post grids using minimalist spacing.
              </p>
            </div>

            {!emailSequence ? (
              <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d] space-y-4">
                <AlertCircle className="w-12 h-12 text-black mx-auto" />
                <h4 className="font-roobert font-bold text-lg text-black">Generate your Email Sequence first!</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  Our system requires your value-loaded GaryVee emails as baseline source data. Head to the Email tab.
                </p>
                <button 
                  onClick={() => setActiveTab("email-sequence")}
                  className="btn-primary py-2 px-6 text-xs"
                >
                  Write Email Sequence
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white border border-[#cccccc] p-6 rounded-xl flex justify-between items-center bg-zinc-50 border-2">
                  <div className="space-y-1">
                    <h3 className="font-roobert font-bold text-base text-black">Emails Available for Repurposing</h3>
                    <p className="text-xs text-[#4d4d4d]">Connected successfully: {onboardingData.niche} Value Packs.</p>
                  </div>
                  <button 
                    onClick={generateLinkedIn}
                    disabled={loadingLinkedIn}
                    className="btn-primary py-3 px-6 text-sm flex items-center gap-2"
                  >
                    {loadingLinkedIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Re-authoring into LinkedIn scrolls...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-[#edfc47]" />
                        <span>Convert Emails to LinkedIn Posts</span>
                      </>
                    )}
                  </button>
                </div>

                {linkedin ? (
                  <div className="space-y-6">
                    {/* View mode toggle */}
                    <div className="flex bg-[#f7f6f5] border border-[#cccccc] p-1 rounded-lg max-w-sm">
                      <button 
                        onClick={() => setLinkedinView('editor')}
                        className={`flex-1 text-center py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer ${linkedinView === 'editor' ? 'bg-black text-[#edfc47]' : 'text-[#4d4d4d] hover:text-black'}`}
                      >
                        ✍️ Visual Copy Editor
                      </button>
                      <button 
                        onClick={() => setLinkedinView('preview')}
                        className={`flex-1 text-center py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer ${linkedinView === 'preview' ? 'bg-black text-[#edfc47]' : 'text-[#4d4d4d] hover:text-black'}`}
                      >
                        ✨ Feed Live Preview
                      </button>
                    </div>

                    {linkedinView === 'editor' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Post 1 Editor */}
                        <div className="bg-white border border-[#cccccc] rounded-xl p-5 flex flex-col justify-between min-h-[440px] text-left">
                          <div className="space-y-3">
                            <span className="text-[9px] font-bold font-mono text-black border border-black px-2 py-0.5 rounded tracking-wider uppercase bg-zinc-50">
                              POST 1 — SHOCKING CLAIM HOOK
                            </span>
                            
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Headline Hook</label>
                              <input 
                                type="text"
                                value={linkedin.post1.hook}
                                onChange={(e) => updateLinkedInPost('post1', 'hook', e.target.value)}
                                className="w-full text-xs font-extrabold text-black bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Scroll Body spacing</label>
                              <textarea 
                                value={linkedin.post1.body}
                                onChange={(e) => updateLinkedInPost('post1', 'body', e.target.value)}
                                rows={8}
                                className="w-full text-xs font-mono text-[#4d4d4d] bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all whitespace-pre-line leading-relaxed outline-none resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Outbound Link Comment Anchor</label>
                              <input 
                                type="text"
                                value={linkedin.post1.commentNote}
                                onChange={(e) => updateLinkedInPost('post1', 'commentNote', e.target.value)}
                                className="w-full italic text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded border border-transparent hover:border-green-300 focus:bg-white outline-none"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => copyToClipboard(`"${linkedin.post1.hook}"\n\n${linkedin.post1.body}\n\n${linkedin.post1.commentNote}`, "LinkedIn Post 1")}
                            className="btn-soft text-xs py-2 mt-4 text-center w-full flex items-center justify-center gap-1.5 border border-[#cccccc]"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Prepared Copys
                          </button>
                        </div>

                        {/* Post 2 Editor */}
                        <div className="bg-white border border-[#cccccc] rounded-xl p-5 flex flex-col justify-between min-h-[440px] text-left">
                          <div className="space-y-3">
                            <span className="text-[9px] font-bold font-mono text-black border border-black px-2 py-0.5 rounded tracking-wider uppercase bg-zinc-50">
                              POST 2 — LESSONS ACQUIRED STORY
                            </span>
                            
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Headline Hook</label>
                              <input 
                                type="text"
                                value={linkedin.post2.hook}
                                onChange={(e) => updateLinkedInPost('post2', 'hook', e.target.value)}
                                className="w-full text-xs font-extrabold text-black bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Scroll Body spacing</label>
                              <textarea 
                                value={linkedin.post2.body}
                                onChange={(e) => updateLinkedInPost('post2', 'body', e.target.value)}
                                rows={8}
                                className="w-full text-xs font-mono text-[#4d4d4d] bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all whitespace-pre-line leading-relaxed outline-none resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Outbound Link Comment Anchor</label>
                              <input 
                                type="text"
                                value={linkedin.post2.commentNote}
                                onChange={(e) => updateLinkedInPost('post2', 'commentNote', e.target.value)}
                                className="w-full italic text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded border border-transparent hover:border-green-300 focus:bg-white outline-none"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => copyToClipboard(`"${linkedin.post2.hook}"\n\n${linkedin.post2.body}\n\n${linkedin.post2.commentNote}`, "LinkedIn Post 2")}
                            className="btn-soft text-xs py-2 mt-4 text-center w-full flex items-center justify-center gap-1.5 border border-[#cccccc]"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Prepared Copys
                          </button>
                        </div>

                        {/* Post 3 Editor */}
                        <div className="bg-white border border-[#cccccc] rounded-xl p-5 flex flex-col justify-between min-h-[440px] text-left">
                          <div className="space-y-3">
                            <span className="text-[9px] font-bold font-mono text-black border border-black px-2 py-0.5 rounded tracking-wider uppercase bg-zinc-50">
                              POST 3 — FRAMEWORK BENCHMARK
                            </span>
                            
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Headline Hook</label>
                              <input 
                                type="text"
                                value={linkedin.post3.hook}
                                onChange={(e) => updateLinkedInPost('post3', 'hook', e.target.value)}
                                className="w-full text-xs font-extrabold text-black bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Scroll Body spacing</label>
                              <textarea 
                                value={linkedin.post3.body}
                                onChange={(e) => updateLinkedInPost('post3', 'body', e.target.value)}
                                rows={8}
                                className="w-full text-xs font-mono text-[#4d4d4d] bg-yellow-50/30 hover:bg-yellow-50 focus:bg-white border-2 border-transparent focus:border-black p-2 rounded transition-all whitespace-pre-line leading-relaxed outline-none resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono mb-1">Outbound Link Comment Anchor</label>
                              <input 
                                type="text"
                                value={linkedin.post3.commentNote}
                                onChange={(e) => updateLinkedInPost('post3', 'commentNote', e.target.value)}
                                className="w-full italic text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded border border-transparent hover:border-green-300 focus:bg-white outline-none"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => copyToClipboard(`"${linkedin.post3.hook}"\n\n${linkedin.post3.body}\n\n${linkedin.post3.commentNote}`, "LinkedIn Post 3")}
                            className="btn-soft text-xs py-2 mt-4 text-center w-full flex items-center justify-center gap-1.5 border border-[#cccccc]"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Prepared Copys
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Feed Live Previews with full rich interactions */
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Feed Simulated Card 1 */}
                        {[
                          { key: 'post1', raw: linkedin.post1, label: 'Shocking Claim' },
                          { key: 'post2', raw: linkedin.post2, label: 'Hard Lessons Learned' },
                          { key: 'post3', raw: linkedin.post3, label: 'High Impact Guide' }
                        ].map((postObj) => {
                          const pKey = postObj.key as 'post1' | 'post2' | 'post3';
                          const isLiked = linkedinLikedStatus[pKey];
                          const customLikes = linkedinLikes[pKey];

                          return (
                            <div key={pKey} className="bg-[#fcf8f2] border-2 border-black rounded-lg p-5 shadow-md flex flex-col justify-between min-h-[460px] text-left">
                              <div className="space-y-4">
                                {/* Simulated Linkedin Profile Header */}
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-black text-[#edfc47] border border-black flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                    {user.name.split(" ").map(w => w[0]).join("") || "N"}
                                  </div>
                                  <div className="leading-tight truncate pr-1">
                                    <span className="block font-bold text-xs text-black truncate hover:underline cursor-pointer">{user.name}</span>
                                    <span className="block text-[10px] text-gray-500 truncate mt-0.5">Author at {onboardingData.offerName || "SaaS"} • Influencing {onboardingData.niche}</span>
                                    <span className="block text-[8px] text-gray-400 font-mono mt-0.5">1h ago • 🌍</span>
                                  </div>
                                </div>

                                {/* Post scroll content */}
                                <div className="text-[11px] text-[#222] font-semibold leading-relaxed space-y-2 border-t border-gray-200/60 pt-3">
                                  <p className="font-extrabold text-black text-xs leading-snug">
                                    {postObj.raw.hook}
                                  </p>
                                  <p className="whitespace-pre-line leading-relaxed font-mono font-medium text-[#444] bg-white p-2.5 border border-[#cccccc]/40 rounded-lg">
                                    {postObj.raw.body}
                                  </p>
                                  <p className="italic text-[10px] text-green-800 font-bold bg-green-50/50 p-2 rounded border border-green-200/50 select-text">
                                    💬 First Comment Anchor: "{postObj.raw.commentNote}"
                                  </p>
                                </div>
                              </div>

                              {/* Interactive like/comment tracker footer */}
                              <div className="mt-5 pt-3 border-t border-gray-200 space-y-3">
                                <div className="flex justify-between items-center text-[10px] text-[#4d4d4d] font-mono select-none">
                                  <span className="flex items-center gap-1 font-bold">
                                    👍 {customLikes} likes
                                  </span>
                                  <span>11 comments • 9 shares</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-gray-100">
                                  <button 
                                    onClick={() => {
                                      const nowLiked = !isLiked;
                                      setLinkedinLikedStatus({ ...linkedinLikedStatus, [pKey]: nowLiked });
                                      setLinkedinLikes({
                                        ...linkedinLikes,
                                        [pKey]: nowLiked ? customLikes + 1 : customLikes - 1
                                      });
                                      triggerCopyNotice(nowLiked ? "Liked post simulated" : "Like removed");
                                    }}
                                    className={`py-1.5 text-center text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${isLiked ? 'bg-[#0a66c2]/10 text-[#0a66c2]' : 'bg-transparent text-[#4d4d4d] hover:bg-gray-100'}`}
                                  >
                                    <span>👍</span>
                                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      triggerCopyNotice("🏆 Organic comment-booster algorithm engaged!");
                                    }}
                                    className="py-1.5 text-center text-[10px] font-bold text-[#4d4d4d] hover:bg-gray-100 rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <span>💬</span>
                                    <span>Comment</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      copyToClipboard(`${postObj.raw.hook}\n\n${postObj.raw.body}`, "Scroll Post Copied");
                                    }}
                                    className="py-1.5 text-center text-[10px] font-bold text-[#4d4d4d] hover:bg-gray-100 rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <span>🔗</span>
                                    <span>Copy Post</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Usage quotas tracking */}
                    <div className="text-xs text-[#4d4d4d] font-mono mt-4 flex items-center justify-between bg-zinc-50 p-2.5 rounded border border-[#cccccc]/40 bg-white">
                      <span>LINKEDIN USAGE METER (PRO):</span>
                      <span>{counts.linkedin} of 100 generations utilized</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d]">
                    <Zap className="w-12 h-12 text-[#cccccc] mx-auto animate-pulse mb-3" />
                    <h4 className="font-roobert font-bold text-lg text-black">Execute LinkedIn Conversion Repurposer</h4>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1">
                      Convert your educational campaign modules into Justin Welsh-style minimalist scroll snippets instantly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. SCORECARD PAGE (Pro Only) */}
        {activeTab === "scorecard" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                PERRY MARSHALL 80/20 PLAYBOOK (PRO ONLY)
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                Outreach Partner Scorecard
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                Isolate which Dream 100 channels converted best. Enter mockup lead figures and run 80/20 sorting recommendations.
              </p>
            </div>

            {dream100.length === 0 ? (
              <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d] space-y-4">
                <AlertCircle className="w-12 h-12 text-black mx-auto" />
                <h4 className="font-roobert font-bold text-lg text-black">Generate your partners search first!</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  We need channels inside your workspace before you can rate and catalog scorecard telemetry.
                </p>
                <button 
                  onClick={() => setActiveTab("dream-100")}
                  className="btn-primary py-2 px-6 text-xs"
                >
                  Find Dream 100
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual scorecard matrix controls */}
                <div className="bg-white border border-[#cccccc] rounded-xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="font-roobert font-bold text-base text-black font-semibold">Active Ambassadors</h3>
                      <p className="text-xs text-[#4d4d4d]">Type in estimated/mock "Leads Sent" under the count box, then press Calculate.</p>
                    </div>
                    <button 
                      onClick={calculateTopPerformers}
                      className="btn-primary text-xs py-2.5 px-6"
                    >
                      Calculate My Top 20% Performers
                    </button>
                  </div>

                  {/* List matrix */}
                  <div className="overflow-x-auto border border-[#cccccc]/60 rounded-lg">
                    <table className="w-full text-left text-xs text-black border-collapse">
                      <thead>
                        <tr className="bg-[#f7f6f5] border-b border-[#cccccc] font-semibold text-black">
                          <th className="p-3 font-mono font-bold">Partner Name</th>
                          <th className="p-3 font-mono font-bold">Platform</th>
                          <th className="p-3 font-mono font-bold">Manual Leads Sent input</th>
                          <th className="p-3 font-mono font-bold">Calculated Rank</th>
                          <th className="p-3 font-mono font-bold">Ambassador Status tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cccccc]/30 text-black">
                        {dream100.slice(0, 8).map((p: Dream100Partner, i: number) => (
                          <tr 
                            key={i} 
                            className={`transition-colors text-black ${p.highlighted ? 'bg-[#edfc47]/15 font-semibold text-black' : 'hover:bg-zinc-50'}`}
                          >
                            <td className="p-3 font-bold">{p.partnerName}</td>
                            <td className="p-3 text-[10px] font-mono font-semibold uppercase">{p.platform}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 max-w-[120px]">
                                <input 
                                  type="number" 
                                  value={leadsInput[p.partnerName] || p.leadsSent || "0"} 
                                  onChange={(e) => handleScoreCardNumeric(p.partnerName, e.target.value)}
                                  placeholder="0"
                                  className="w-16 bg-[#f7f6f5] border border-[#cccccc] rounded p-1.5 text-xs text-black text-center font-bold"
                                />
                                <span className="text-[10px] text-[#4d4d4d]">leads</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold">{p.rank ? `#${p.rank}` : 'N/A'}</td>
                            <td className="p-3">
                              {p.highlighted ? (
                                <span className="inline-block text-[9px] font-bold tracking-wider font-mono bg-[#edfc47] text-black border border-black/30 px-2 rounded">
                                  ★ TOP PERFORMER (80/20)
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] font-bold tracking-wider font-mono bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 rounded">
                                  LOW PRIORITY CONTRIB
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dream100.length > 8 && (
                    <p className="text-[10px] text-[#4d4d4d] text-center italic">
                      Displaying premium active channels on dashboard. Sorting calculations apply to all channels.
                    </p>
                  )}
                </div>

                {/* AI Perry Marshall analyst suggestions segment */}
                <div className="bg-white border border-[#cccccc] rounded-xl p-8 space-y-4">
                  <h3 className="font-roobert font-bold text-lg text-black flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-black fill-[#edfc47]" /> 80/20 Strategic Diagnostics
                  </h3>
                  
                  {scorecardSuggestions ? (
                    <div className="space-y-4">
                      <div className="bg-[#f7f6f5] border border-[#cccccc]/40 p-6 rounded-lg text-xs leading-relaxed text-[#4d4d4d] prose max-w-full font-mono whitespace-pre-line">
                        {scorecardSuggestions}
                      </div>
                      
                      <button 
                        onClick={() => copyToClipboard(scorecardSuggestions, "Strategic sugestions template")}
                        className="btn-soft text-xs py-2 px-4"
                      >
                        Copy Recommendation Data
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#4d4d4d] border border-dashed border-[#cccccc] p-4 rounded-lg">
                      <HelpCircle className="w-8 h-8 text-[#cccccc] mx-auto mb-2" />
                      Assign leads on the table above and press "Calculate My Top 20% Performers" to trigger Perry Marshall's automated Gemini audits.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. TRIPWIRE OFFERS VIEW (Pro Only) */}
        {activeTab === "tripwire" && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold font-mono bg-black text-[#edfc47] px-2.5 py-1 rounded inline-block border border-[#edfc47]/20 mb-2">
                RYAN DEISS PLAYBOOK (PRO ONLY)
              </span>
              <h1 className="text-3xl md:text-4xl font-roobert font-extrabold text-black tracking-tight">
                Tripwire Offers Generator
              </h1>
              <p className="text-[#4d4d4d] text-sm">
                Design low-friction $9–$20 impulse checkouts to capture instant cash, converting subscriber trust.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form & Calculator panel */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-[#cccccc] p-5 rounded-xl space-y-4 text-left">
                  <h3 className="font-roobert font-bold text-base text-black border-b border-[#cccccc]/30 pb-2">🎯 Offer Pricing Points</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Your Main Offer</label>
                    <input 
                      type="text" 
                      value={tripwireOfferName} 
                      onChange={(e) => setTripwireOfferName(e.target.value)}
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2 text-xs text-black font-semibold outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1">Main Offer Price ($)</label>
                    <input 
                      type="text" 
                      value={tripwireOfferPrice} 
                      onChange={(e) => setTripwireOfferPrice(e.target.value)}
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2 text-xs text-black font-mono font-semibold outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono text-black uppercase mb-1.5 flex justify-between">
                      <span>Tripwire Price ($)</span>
                      <span className="font-bold font-mono text-xs text-black bg-[#edfc47] px-1 rounded">${tripwirePrice}</span>
                    </label>
                    <input 
                      type="range" 
                      min="9" 
                      max="20" 
                      value={tripwirePrice} 
                      onChange={(e) => setTripwirePrice(e.target.value)}
                      className="w-full accent-black cursor-pointer bg-[#f7f6f5] rounded border border-[#cccccc] h-2 py-1"
                    />
                    <span className="text-[9px] text-[#4d4d4d] italic">Companion threshold highly recommended: $9–$20.</span>
                  </div>

                  <button 
                    onClick={generateTripwire}
                    disabled={loadingTrip}
                    className="w-full btn-primary py-3 font-mono font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingTrip ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Formulating Upsell...</span>
                      </>
                    ) : (
                      <span>Generate Tripwire Offer</span>
                    )}
                  </button>
                </div>

                {/* Premium Bento Cash Flow Solver Calculator */}
                <div className="bg-black text-[#edfc47] p-5 rounded-xl space-y-4 border-2 border-black shadow text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🧮</span>
                    <div>
                      <h4 className="font-roobert font-extrabold text-xs uppercase tracking-wider text-white">LTV Cash Liquidator</h4>
                      <p className="text-[9px] text-gray-400">Scale your self-funding customer flow</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 text-[#cccccc] text-xs">
                    <div>
                      <label className="block text-[9px] font-bold font-mono uppercase mb-0.5 flex justify-between">
                        <span>Simulated Funnel Leads</span>
                        <span className="text-white font-bold">{calcLeadCount.toLocaleString()} leads</span>
                      </label>
                      <input 
                        type="range"
                        min="200"
                        max="10000"
                        step="100"
                        value={calcLeadCount}
                        onChange={(e) => setCalcLeadCount(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded accent-[#edfc47] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold font-mono uppercase mb-0.5 flex justify-between">
                        <span>Conversion Rate (Tripwire)</span>
                        <span className="text-white font-bold">{calcConvRate}%</span>
                      </label>
                      <input 
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={calcConvRate}
                        onChange={(e) => setCalcConvRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded accent-[#edfc47] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3 space-y-2 text-left">
                    <div className="flex justify-between text-[11px] text-white">
                      <span>Simulated Buyers:</span>
                      <span className="font-bold underline text-[#edfc47]">{Math.round(calcLeadCount * (calcConvRate / 100))} customer conversions</span>
                    </div>

                    <div className="bg-zinc-900 border border-[#edfc47]/20 p-2.5 rounded text-center">
                      <span className="block text-[8px] font-mono text-gray-400 uppercase tracking-widest">Self-Funding Harvest cash</span>
                      <span className="block text-2xl font-black text-[#edfc47] tracking-tight mt-0.5">
                        ${(Math.round(calcLeadCount * (calcConvRate / 100)) * Number(tripwirePrice)).toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-[#cccccc] leading-normal mt-1 pr-1 pl-1">
                        This covers your outreach/ads budget instantly!
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display panel */}
              <div className="lg:col-span-8">
                {tripwire ? (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-8 relative space-y-6">
                    <span className="absolute top-4 right-4 text-xs font-mono font-semibold text-[#4d4d4d]/50">IMMEDIATE BUMP TEMPLATE</span>
                    
                    <div className="border-4 border-dashed border-red-400 bg-red-50/10 p-6 rounded-lg space-y-4">
                      <div className="bg-red-500 text-white font-mono font-bold text-[9px] px-3 py-1 uppercase rounded-full inline-block">
                        LIMITED TIME UPSELL BUMP OFFER
                      </div>

                      <h3 className="text-xl md:text-2xl font-roobert font-extrabold text-black">
                        {tripwire.orderBumpHeadline}
                      </h3>

                      <p className="text-xs text-[#0a0a0c] font-bold font-mono">
                        Product: {tripwire.title}
                      </p>

                      <p className="text-xs text-[#4d4d4d] leading-relaxed">
                        {tripwire.description}
                      </p>

                      <div className="space-y-2 border-t border-[#cccccc]/30 pt-4">
                        <p className="text-xs uppercase font-extrabold text-black tracking-wider">What's Included in Asset Pack:</p>
                        {tripwire.bullets.map((b: string, i: number) => (
                          <div key={i} className="flex gap-2 text-xs text-black font-semibold items-start">
                            <span className="text-[#edfc47] bg-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] mt-0.5 shrink-0 border border-black inline-block">✓</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Checkbox Addon Box */}
                      <button 
                        type="button"
                        onClick={() => {
                          const nowChecked = !bumpChecked;
                          setBumpChecked(nowChecked);
                          triggerCopyNotice(nowChecked ? "Added Order Bump to invoice" : "Removed Order Bump");
                        }}
                        className="w-full text-left bg-zinc-50 hover:bg-zinc-100 rounded border border-[#cccccc]/50 p-4 text-xs font-medium text-black flex justify-between items-center mt-4 cursor-pointer transition-colors"
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          {bumpChecked ? '⚡ Live Upsell Bump Added!' : '➕ Click to Add Companion Add-on ($' + tripwirePrice + ' only)'}
                        </span>
                        <div className={`w-6 h-6 border-2 border-black rounded flex items-center justify-center font-extrabold font-mono transition-all ${bumpChecked ? 'bg-[#edfc47] text-black' : 'bg-white'}`}>
                          {bumpChecked ? '✓' : ''}
                        </div>
                      </button>
                    </div>

                    {/* Simulated Sandbox Checkout invoice */}
                    <div className="bg-[#fcfbf9] border border-black rounded-lg p-4 space-y-3 font-mono text-xs">
                      <div className="text-gray-400 font-bold uppercase tracking-widest text-[9px] border-b border-[#cccccc]/50 pb-1 flex justify-between items-center font-mono select-none">
                        <span>Simulated Invoice Statement</span>
                        <span className="text-green-600 font-mono text-[8px] uppercase font-bold border border-green-300 px-1 bg-green-50">Active Sandbox Test</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-600 font-semibold">{tripwireOfferName || "Main Package Offer"}</span>
                        <span className="font-bold font-mono text-black">${Number(tripwireOfferPrice || 97)}</span>
                      </div>
                      {bumpChecked && (
                        <div className="flex justify-between items-center text-[#222]">
                          <span>➕ Companion Order Bump: {tripwire.title}</span>
                          <span className="font-bold font-mono text-green-700">+${tripwirePrice}</span>
                        </div>
                      )}
                      <div className="border-t border-dashed border-[#cccccc] pt-2 flex justify-between items-center text-xs text-black font-bold">
                        <span>TOTAL CLIENT LTV CASH HARVEST:</span>
                        <span className="font-black text-xs underline text-black">${(Number(tripwireOfferPrice || 97)) + (bumpChecked ? Number(tripwirePrice) : 0)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(`Order Bump: ${tripwire.orderBumpHeadline}\nProduct: ${tripwire.title}\nDescription: ${tripwire.description}\nBullets:\n- ${tripwire.bullets.join("\n- ")}`, "Tripwire Copy Text")}
                        className="btn-soft text-xs py-2 px-4 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Code details
                      </button>
                      <button 
                        onClick={generateTripwire}
                        disabled={loadingTrip}
                        className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-Draft Offer
                      </button>
                    </div>

                    <div className="text-xs text-[#4d4d4d] font-mono mt-4 flex items-center justify-between bg-zinc-50 p-2.5 rounded border border-[#cccccc]/40 bg-white">
                      <span>TRIPWIRE METRICS (PRO):</span>
                      <span>{counts.tripwire} of 100 generations utilized</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#cccccc] rounded-xl p-12 text-center text-[#4d4d4d]">
                    <ShieldCheck className="w-12 h-12 text-[#cccccc] mx-auto animate-pulse mb-3" />
                    <h4 className="font-roobert font-bold text-lg text-black">Compose Tripwire Bump Offers</h4>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1">
                      Wired to evaluate main pricing points and output high-converting companion packs in milliseconds.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-roobert font-extrabold text-black tracking-tight">System Settings</h1>
              <p className="text-[#4d4d4d] text-sm">Control profile updates, billing tiers, and core niche variables.</p>
            </div>

            {/* Sub-navigation tabs */}
            <div className="bg-white border border-[#cccccc] rounded-xl p-8 space-y-6">
              <div className="flex border-b border-[#cccccc]/30 gap-6 pb-2.5 font-roobert font-semibold">
                <button 
                  onClick={() => setSettingsSubTab("account")} 
                  className={`pb-2.5 text-sm ${settingsSubTab === 'account' ? 'text-black border-b-2 border-black font-bold' : 'text-[#4d4d4d] hover:text-black font-medium'}`}
                  id="settings-tab-account"
                >
                  Account Profile
                </button>
                <button 
                  onClick={() => setSettingsSubTab("billing")} 
                  className={`pb-2.5 text-sm ${settingsSubTab === 'billing' ? 'text-black border-b-2 border-black font-bold' : 'text-[#4d4d4d] hover:text-black font-medium'}`}
                  id="settings-tab-billing"
                >
                  Stripe Billing
                </button>
                <button 
                  onClick={() => setSettingsSubTab("niche-offer")} 
                  className={`pb-2.5 text-sm ${settingsSubTab === 'niche-offer' ? 'text-black border-b-2 border-black font-bold' : 'text-[#4d4d4d] hover:text-black font-medium'}`}
                  id="settings-tab-niche"
                >
                  Business Niche & Offer variables
                </button>
              </div>

              {/* Sub-tab 1 - Account */}
              {settingsSubTab === "account" && (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">User Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-sm text-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Business Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)} 
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-sm text-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Pass Key Phrase</label>
                    <input 
                      type="password" 
                      value={profilePass} 
                      onChange={(e) => setProfilePass(e.target.value)} 
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-sm text-black font-medium"
                    />
                  </div>
                  <button 
                    onClick={saveProfileSettings} 
                    className="btn-primary text-xs py-2.5 px-6"
                  >
                    Save Profile Changes
                  </button>
                </div>
              )}

              {/* Sub-tab 2 - Billing */}
              {settingsSubTab === "billing" && (
                <div className="space-y-6">
                  <div className="p-6 bg-[#f7f6f5] rounded-lg border border-[#cccccc]/50 max-w-xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase">CURRENT SUBSCRIPTION</span>
                        <span className="text-xl font-roobert font-extrabold text-black uppercase mt-1 block">{user.plan} Active Plan</span>
                      </div>
                      <span className="text-lg font-mono font-bold text-black">{user.plan === 'Pro' ? '$30.00/mo' : '$15.00/mo'}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4d4d4d] border-t border-[#cccccc]/40 pt-4 font-mono">
                      <p>Next billing date scheduled: <strong>June 20, 2026</strong></p>
                      <p>Stripe Gateway reference key: <strong>sub_ST78921B</strong></p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {user.plan === "Basic" && (
                      <button 
                        onClick={onTriggerUpgradeCheckout} 
                        className="btn-primary py-2.5 px-6 font-roobert text-xs flex items-center gap-1.5"
                      >
                        <ArrowUp className="w-4 h-4 text-[#edfc47] stroke-[3]" /> Upgrade Account to Pro Playbooks
                      </button>
                    )}
                    <button 
                      onClick={() => setShowCancelModal(true)} 
                      className="btn-ghost py-2.5 px-6 text-red-600 border-red-600 hover:bg-red-50 text-xs font-medium"
                    >
                      Cancel Sandbox Subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 3 - Onboarding niche & offers */}
              {settingsSubTab === "niche-offer" && (
                <div className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">My Niche is</label>
                      <input 
                        type="text" 
                        value={editNiche} 
                        onChange={(e) => setEditNiche(e.target.value)} 
                        className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Target demographic</label>
                      <input 
                        type="text" 
                        value={editAudience} 
                        onChange={(e) => setEditAudience(e.target.value)} 
                        className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Demographic primary friction pain</label>
                    <input 
                      type="text" 
                      value={editProblem} 
                      onChange={(e) => setEditProblem(e.target.value)} 
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Core Offer product name</label>
                      <input 
                        type="text" 
                        value={editOfferName} 
                        onChange={(e) => setEditOfferName(e.target.value)} 
                        className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Value Price ($)</label>
                      <input 
                        type="text" 
                        value={editOfferPrice} 
                        onChange={(e) => setEditOfferPrice(e.target.value)} 
                        className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono text-[#4d4d4d] uppercase mb-1.5">Core offering single-sentence promise</label>
                    <input 
                      type="text" 
                      value={editOfferSentence} 
                      onChange={(e) => setEditOfferSentence(e.target.value)} 
                      className="w-full bg-[#f7f6f5] border border-[#cccccc] rounded p-2.5 text-xs text-black"
                    />
                  </div>

                  <button 
                    onClick={saveNicheSettings} 
                    className="btn-primary text-xs py-2.5 px-6"
                  >
                    Save Business Strategy Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* A. LOCKED UPGRADE POPUP MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-6 backdrop-blur-xs select-none">
          <div className="bg-white border-2 border-black max-w-[400px] w-full p-8 rounded-xl shadow-lg relative space-y-6">
            <div className="w-12 h-12 bg-[#edfc47] border border-black rounded-lg flex items-center justify-center text-black mx-auto">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-roobert font-extrabold text-xl text-black">Upgrade to unlock feature!</h3>
              <p className="text-sm text-[#4d4d4d] leading-normal">
                "{upgradeLockedFeature}" is optimized for the **Pro Blueprint**. Upgrade your tier from Basic to lock in premium access.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full btn-soft py-2.5 text-xs font-bold border border-[#cccccc]"
              >
                Keep Basic
              </button>
              <button 
                onClick={() => { setShowUpgradeModal(false); onTriggerUpgradeCheckout(); }}
                className="w-full btn-primary py-2.5 text-xs font-bold"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. CANCEL INVOICE MOCK-CONFIRM POPUP MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-6 backdrop-blur-xs select-none">
          <div className="bg-white border-2 border-black max-w-[400px] w-full p-8 rounded-xl shadow-lg space-y-6">
            <div className="w-12 h-12 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center text-red-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-roobert font-bold text-lg text-black">Are you absolutely sure?</h3>
              <p className="text-xs text-[#4d4d4d] leading-relaxed">
                Canceling will pause mock Gemini integrations at the terminal. You will lose access to premium playbooks at the end of the billing period. No payments will be charged today.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="w-full btn-soft py-2.5 text-xs font-bold border border-[#cccccc]"
              >
                No, Keep My Subscription
              </button>
              <button 
                onClick={() => { setShowCancelModal(false); onUpdateProfile({ plan: 'Free' }); setActiveTab("home"); triggerCopyNotice("Subscription canceled gracefully"); }}
                className="w-full bg-red-600 text-white font-roobert font-bold text-xs py-2.5 rounded border border-red-600 hover:bg-red-700 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Bug Report Modal */}
      <AnimatePresence>
        {showBugModal && (
          <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border-4 border-black rounded-[10px] w-full max-w-sm overflow-hidden shadow-2xl relative text-black text-left"
            >
              {/* Top Accent bar */}
              <div className="h-2 bg-[#edfc47] border-b border-black w-full" />
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-black text-[#edfc47]">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-roobert font-extrabold text-sm uppercase tracking-wide">System Bug Report</h4>
                      <p className="text-[10px] text-[#4d4d4d]">Submit complaints and ticket logs directly</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowBugModal(false)}
                    className="text-black font-semibold hover:opacity-75 text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {bugSuccess ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#e6f9e6] text-[#1e561e] border border-[#1e561e]/20 flex items-center justify-center mx-auto text-sm font-bold animate-bounce">
                      ✓
                    </div>
                    <h5 className="font-bold text-black text-xs uppercase">Bug Dispatched!</h5>
                    <p className="text-[11px] text-[#4d4d4d] max-w-xs mx-auto px-2">
                      Thank you. Your complaints regarding "{bugTitle}" have been successfully queued into the Dev tracker.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendBug} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-black font-mono">
                        Title of Your Bug
                      </label>
                      <input 
                        type="text"
                        required
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="e.g. Dream 100 table has offset columns"
                        className="w-full px-2.5 py-1.5 text-xs border-2 border-[#cccccc] focus:border-black rounded-[4px] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-black font-mono">
                        Your Complaints (In Words)
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={bugComplaints}
                        onChange={(e) => setBugComplaints(e.target.value)}
                        placeholder="Please describe what is askew or broken in detail..."
                        className="w-full px-2.5 py-1.5 text-xs border-2 border-[#cccccc] focus:border-black rounded-[4px] outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowBugModal(false)}
                        className="flex-1 px-3 py-1.5 border-2 border-[#cccccc] hover:bg-[#f7f6f5] rounded-[4px] text-xs font-bold text-[#4d4d4d] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bugSubmitting}
                        className="flex-1 px-3 py-1.5 bg-black text-[#edfc47] hover:bg-[#111] transition-all rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {bugSubmitting ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#edfc47] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Submit Bug'
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
    </div>
  );
}
