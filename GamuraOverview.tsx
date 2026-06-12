import React, { useState, useEffect, useRef } from "react";
import { 
  Home, Monitor, Users, Activity, Sun, Grid, MessageSquare, Settings, 
  Phone, ChevronLeft, Search, User, Menu, Sparkles, Cpu, Zap, 
  Database, Network, ArrowRight, Lock, ShieldCheck, Terminal, Send,
  Share2, RefreshCw, Star, Layers, Play, Pause, ChevronRight
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SafeImage } from "./SafeImage";

// Canvas Starfield Component with interactive Warp Engine
const StarfieldCanvas: React.FC<{ warpSpeed: number; density?: number }> = ({ warpSpeed, density = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const stars: Array<{
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
    }> = [];

    // Initialize stars
    for (let i = 0; i < density; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        color: i % 10 === 0 ? "#7c3aed" : i % 5 === 0 ? "#3b82f6" : "#ffffff",
        size: Math.random() * 1.5 + 0.5,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.fillStyle = "rgba(8, 12, 16, 0.2)"; // Dark trails
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        star.z -= warpSpeed;

        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
        }

        const k = 128.0 / star.z;
        const px = star.x * k + width / 2;
        const py = star.y * k + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = star.size * k;
          ctx.beginPath();
          // Draw star line for speed effect
          if (warpSpeed > 5) {
            ctx.strokeStyle = star.color;
            ctx.lineWidth = size * 0.4;
            const tailK = 128.0 / (star.z + warpSpeed * 3);
            const tailX = star.x * tailK + width / 2;
            const tailY = star.y * tailK + height / 2;
            ctx.moveTo(px, py);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
          } else {
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [warpSpeed, density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-45" />;
};

// Interactive waveform visualization for AI & Brainwaves
const InteractiveWaveform: React.FC = () => {
  const [points, setPoints] = useState<number[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(Array.from({ length: 42 }, () => Math.random() * 40 + 10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-1 h-20 w-full justify-between px-2 bg-gradient-to-t from-violet-950/20 to-transparent border border-white/5 p-2 overflow-hidden">
      {points.map((val, idx) => (
        <div 
          key={idx} 
          className="w-1 rounded-t-sm transition-all duration-150"
          style={{ 
            height: `${val}%`, 
            background: `linear-gradient(to top, rgba(124, 58, 237, 0.4), rgba(59, 130, 246, 0.8))`
          }} 
        />
      ))}
    </div>
  );
};

interface GamuraProps {
  activeTab: string;
  onLaunchWarp?: () => void;
}

export const GamuraOverview: React.FC<GamuraProps> = ({ activeTab }) => {
  const [warpSpeed, setWarpSpeed] = useState(1.5);
  const [isWarpActive, setIsWarpActive] = useState(false);
  const [selectedBentoCard, setSelectedBentoCard] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // Sync Global Settings for real-time effects
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_configs", "aura_global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSystemSettings(data);
        if (data.nexusSpeed) {
           // Base warp speed scales with nexusSpeed set in Aura Settings
           setWarpSpeed(data.nexusSpeed / 50);
        }
      }
    }, (error) => console.error("Aura Global Snapshot Failed", error));
    return unsub;
  }, []);

  const starDensity = systemSettings?.auraParticle || (activeTab === "Overview" ? 180 : 100);
  const [bubuMsg, setBubuMsg] = useState("");
  const [bubuHistory, setBubuHistory] = useState<Array<{ sender: "user" | "bubu"; text: string }>>([
    { sender: "bubu", text: "Greetings, Explorer. I am BuBuBai, cosmic mind of the Gamura Universe. My system nodes are 100% operational. How can I assist your voyage today?" }
  ]);
  const [isBubuTyping, setIsBubuTyping] = useState(false);

  // Community Chat State
  const [userChatInput, setUserChatInput] = useState("");
  const [communityChats, setCommunityChats] = useState([
    { user: "Apex_Racer", text: "Warp speed just reached 50x! Gamura AI integration is crazy fast.", time: "11:01" },
    { user: "Solaris_Dev", text: "SELVARANJAN G designed an absolute masterpiece. The Rajdhani accents are stunning.", time: "11:02" },
    { user: "BubuFan_01", text: "BuBuBai helped me design a custom real-time engine node in seconds.", time: "11:03" }
  ]);

  // Warp toggle trigger
  const handleWarpDrive = () => {
    setIsWarpActive(true);
    setWarpSpeed(35);
    setTimeout(() => {
      setWarpSpeed(1.5);
      setIsWarpActive(false);
    }, 2800);
  };

  // Chat Submission to BuBuBai
  const handleBubuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bubuMsg.trim()) return;

    const userText = bubuMsg;
    setBubuHistory(prev => [...prev, { sender: "user", text: userText }]);
    setBubuMsg("");
    setIsBubuTyping(true);

    setTimeout(() => {
      let response = "Input registered. Syncing cosmic variables. Gamura Universe offers unlimited potential.";
      const lower = userText.toLowerCase();

      if (lower.includes("voyager") || lower.includes("pilot") || lower.includes("selvaranjan")) {
        response = "Greetings, SELVARANJAN G. You are currently navigating the Gamura Universe, the apex node of design, tech-forward monospace architectures, and next-gen identity solutions.";
      } else if (lower.includes("bubu") || lower.includes("ai")) {
        response = "My core is the BuBuBai Cognitive Module, executing sub-millisecond predictions, custom canvas optimizations, and responding to live spatial queries across the Gamura framework.";
      } else if (lower.includes("platform") || lower.includes("system") || lower.includes("galaxy")) {
        response = "The Gamura System operates via a distributed mesh of Galaxy Nodes. Each node processes rendering pipelines, secure client identities, and responsive layouts tailored for modern desktop layouts.";
      } else if (lower.includes("warp") || lower.includes("speed")) {
        response = "Warp drives are fully charged! Initiating custom starfield simulation at 35x hyper-acceleration. Observe the stars stretch!";
        handleWarpDrive();
      } else if (lower.includes("skills") || lower.includes("core")) {
        response = "Gamura is built with modern React, Tailwind CSS styling, advanced Firestore Zero-Trust architectures, and cybernetic scifi interfaces.";
      }

      setBubuHistory(prev => [...prev, { sender: "bubu", text: response }]);
      setIsBubuTyping(false);
    }, 1200);
  };

  // Submit community comment
  const handleCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const newChat = {
      user: "You_Explorer",
      text: userChatInput,
      time: "Just now"
    };
    setCommunityChats(prev => [...prev, newChat]);
    setUserChatInput("");

    // Automated cyber-bot reply
    setTimeout(() => {
      const bots = ["VortexNode", "Starlight_X", "BubuGuard"];
      const replies = [
        "Incredible input! Synchronizing node streams.",
        "Beautifully spoken, welcome to the collective.",
        "Zero-Trust status confirmed. Your packet has been broadcasted successfully."
      ];
      const selectedBot = bots[Math.floor(Math.random() * bots.length)];
      const selectedReply = replies[Math.floor(Math.random() * replies.length)];

      setCommunityChats(prev => [...prev, {
        user: selectedBot,
        text: selectedReply,
        time: "Just now"
      }]);
    }, 1500);
  };

  // BENTO CARD DATA
  const bentoCards = [
    {
      id: "core",
      title: "GAMURA CORE",
      subtitle: "Unified System Kernel",
      desc: "Architected around a blazing-fast micro-kernel, providing low-latency resource management",
      icon: Cpu,
      color: "from-blue-600/20 to-indigo-600/20 border-blue-500/30",
      accentColor: "text-blue-400",
      bgLight: "bg-blue-500/5",
      details: "Gamura Core serves as the heart of the network. Built using safe state models and non-blocking background routines, it processes over 24,000 sub-tasks seamlessly without rendering bottlenecks."
    },
    {
      id: "galaxy",
      title: "GAMURA GALAXY",
      subtitle: "Distributed Node Web",
      desc: "Distributed client-side rendering engine bringing ultra-responsive interfaces to any portal.",
      icon: Network,
      color: "from-purple-600/20 to-fuchsia-600/20 border-purple-500/30",
      accentColor: "text-purple-400",
      bgLight: "bg-purple-500/5",
      details: "Galaxy web routes data dynamically through optimized servers. Users can create, collaborate, and inspect live modules with stateful sync hooks and secure token authorization."
    },
    {
      id: "bububai",
      title: "BUBUBAI AI",
      subtitle: "Cognitive Synthesizer",
      desc: "Cosmic mind answering complex inquiries, generating code snippets & executing warp metrics.",
      icon: Monitor,
      color: "from-violet-600/20 to-purple-600/20 border-violet-500/30",
      accentColor: "text-violet-400",
      bgLight: "bg-violet-500/5",
      details: "The brain center of the current epoch. BuBuBai integrates advanced natural language comprehension to enable voice transcripts, live diagnostics, and smart asset rendering on the fly."
    },
    {
      id: "pipeline",
      title: "REAL-TIME ENGINE",
      subtitle: "Visual Pipeline Sync",
      desc: "High-frequency animation streams powered by motion vectors and modular sub-tick physics.",
      icon: Activity,
      color: "from-emerald-600/20 to-teal-600/20 border-emerald-500/30",
      accentColor: "text-emerald-400",
      bgLight: "bg-emerald-500/5",
      details: "Engineers live telemetry directly onto the interface. With responsive canvas sizing, ResizeObservers, and requestAnimationFrame intervals, every pulse stays buttery smooth."
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-140px)] w-full text-gamura-text overflow-hidden select-none">
      {/* Immersive Starfield Canvas Background */}
      <StarfieldCanvas warpSpeed={warpSpeed} density={starDensity} />

      {/* Cyber retro grid and scanline filters */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,32,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,32,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40 z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gamura-bg/80 pointer-events-none z-0" />

      {/* Top Scrolling Stock Ticker */}
      <div className="w-full bg-gamura-surface/85 backdrop-blur-md border-y border-white/5 py-1 px-4 text-xs font-sharetech tracking-wider text-gamura-accent flex items-center overflow-hidden mb:6 select-none z-10 relative">
        <span className="inline-block animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          SYSTEM HEALTH: 100% OPERATIONAL // MEMORY LOAD: 18% // GALAXY NODES ACTIVE: 841/1000 // BUBUBAI COGNITIVE SYNCHRONIZER: ONLINE // PILOT STATUS: ACTIVE SELVARANJAN G // CORE ENGINES: CHARGED // READY TO IGNITE //
          SYSTEM HEALTH: 100% OPERATIONAL // MEMORY LOAD: 18% // GALAXY NODES ACTIVE: 841/1000 // BUBUBAI COGNITIVE SYNCHRONIZER: ONLINE // PILOT STATUS: ACTIVE SELVARANJAN G // CORE ENGINES: CHARGED // READY TO IGNITE //
        </span>
      </div>

      {/* ===================================== */}
      {/* OVERVIEW PANEL                        */}
      {/* ===================================== */}
      {activeTab === "Overview" && (
        <div className="space-y-8 relative z-10 p-1 md:p-3">
          {/* Main Hero Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto py-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gamura-accent/10 border border-gamura-accent/25 text-gamura-accent text-[10px] font-bold uppercase tracking-[0.25em] font-orbitron">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Epoch Phase III Live
            </div>
            <h1 className="font-orbitron font-extrabold text-[28px] md:text-[38px] tracking-tight bg-gradient-to-r from-white via-indigo-200 to-gamura-accent bg-clip-text text-transparent leading-none">
              GAMURA UNIVERSE
            </h1>
            <p className="font-rajdhani font-semibold text-[15px] text-gamura-muted uppercase tracking-[0.15em]">
              Beyond Reality • Beyond Limits • Beyond Now
            </p>
            
            {/* Warp Drive Controller */}
            <div className="pt-2">
              <button 
                onClick={handleWarpDrive}
                disabled={isWarpActive}
                className={`relative px-6 py-2.5 font-orbitron text-xs font-bold uppercase tracking-widest overflow-hidden transition-all duration-300 border ${isWarpActive ? "bg-violet-950/40 text-violet-400 border-violet-800" : "bg-gradient-to-r from-gamura-accent to-indigo-600 text-white hover:shadow-lg hover:shadow-gamura-accent/20 border-white/10 active:scale-95"}`}
              >
                {isWarpActive ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Warp Initiated...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 animate-pulse" />
                    Activate Warp Engine (35x)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Players */}
            <div className="bg-gamura-surface/60 border border-white/5 p-4 flex items-center justify-between group hover:border-gamura-accent/30 transition-all duration-300 backdrop-blur-md">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gamura-muted tracking-widest font-rajdhani">ACTIVE PLAYERS</span>
                <div className="text-[22px] font-extrabold text-gamura-text font-orbitron">2,042,918</div>
                <span className="text-[10px] text-emerald-400 font-bold font-sharetech">+12.4% THIS MONTH</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gamura-accent/10 flex items-center justify-center text-gamura-accent group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gamura-surface/60 border border-white/5 p-4 flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300 backdrop-blur-md">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gamura-muted tracking-widest font-rajdhani">BLOCK RESPONSE</span>
                <div className="text-[22px] font-extrabold text-gamura-text font-orbitron">142 MS</div>
                <span className="text-[10px] text-blue-400 font-bold font-sharetech">STABLE GALAXY PIN</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Cognitive Sync */}
            <div className="bg-gamura-surface/60 border border-white/5 p-4 flex items-center justify-between group hover:border-purple-500/30 transition-all duration-300 backdrop-blur-md">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gamura-muted tracking-widest font-rajdhani">COGNITIVE SYNC</span>
                <div className="text-[22px] font-extrabold text-gamura-text font-orbitron">98.2%</div>
                <span className="text-[10px] text-purple-400 font-bold font-sharetech">BUBUBAI LIVE AGENT</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
            </div>

            {/* Galaxy Nodes */}
            <div className="bg-gamura-surface/60 border border-white/5 p-4 flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-md">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gamura-muted tracking-widest font-rajdhani">GALAXY NODES</span>
                <div className="text-[22px] font-extrabold text-gamura-text font-orbitron">841 / 1K</div>
                <span className="text-[10px] text-emerald-400 font-bold font-sharetech">ONLINE & SHIELDED</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Network className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Core Systems Bento Grid with Interactive Accordion Drawers */}
          <div className="space-y-4">
            <h2 className="font-orbitron text-sm font-bold uppercase tracking-widest text-gamura-accent flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Integrated Core Modules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bentoCards.map((card) => (
                <div 
                  key={card.id}
                  onClick={() => setSelectedBentoCard(selectedBentoCard === card.id ? null : card.id)}
                  className={`bg-gradient-to-br ${card.color} border p-5 cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden group select-none`}
                >
                  <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 group-hover:scale-125 transition-transform ${card.bgLight}`} />
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold font-sharetech tracking-[0.2em] opacity-60 uppercase">{card.subtitle}</span>
                      <h3 className="font-orbitron font-extrabold text-base md:text-lg tracking-wide text-white group-hover:text-gamura-accent transition-colors flex items-center gap-2">
                        <card.icon className={`w-5 h-5 ${card.accentColor}`} />
                        {card.title}
                      </h3>
                      <p className="font-rajdhani font-medium text-[13px] text-gamura-muted leading-relaxed pr-6">
                        {card.desc}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gamura-muted shrink-0 group-hover:text-gamura-accent transition-all ${selectedBentoCard === card.id ? "rotate-90 text-gamura-accent" : ""}`} />
                  </div>

                  {/* Expanding Drawer Content */}
                  {selectedBentoCard === card.id && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-[12px] text-gamura-muted font-dm space-y-2 animate-in slide-in-from-top duration-300">
                      <p>{card.details}</p>
                      <div className="flex items-center gap-1.5 text-gamura-accent font-sharetech text-[10px] uppercase font-bold mt-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        NODE CERTIFICATION: ZERO TRUST ENFORCED
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Timeline Roadmap */}
          <div className="bg-gamura-surface/40 border border-white/5 p-6 space-y-6 backdrop-blur-md">
            <h2 className="font-orbitron text-sm font-bold uppercase tracking-widest text-gamura-accent">
              GAMURA ROADMAP & MILESTONES
            </h2>
            <div className="relative pl-6 border-l border-white/15 space-y-6">
              {/* Timeline 1 */}
              <div className="relative">
                <div className="absolute -left-9.5 top-1 w-3.5 h-3.5 rounded-full bg-violet-600 border-2 border-gamura-bg shadow-lg shadow-violet-500/50" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-sharetech text-violet-400">PHASE I • ORIGIN KERNEL [COMPLETE]</span>
                  <p className="font-orbitron text-sm font-bold text-white">Gamura Core Infrastructure Deploy</p>
                  <p className="text-xs text-gamura-muted leading-relaxed">Pioneered secure state containers, custom UI component setups, and rapid navigation hooks.</p>
                </div>
              </div>

              {/* Timeline 2 */}
              <div className="relative">
                <div className="absolute -left-9.5 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-gamura-bg shadow-lg shadow-blue-500/50" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-sharetech text-blue-400">PHASE II • EXPANSION [COMPLETE]</span>
                  <p className="font-orbitron text-sm font-bold text-white">Distributed Galaxy Node Launch</p>
                  <p className="text-xs text-gamura-muted leading-relaxed">Deployed distributed nodes processing real-time telemetry, transaction flows, and spatial indexing.</p>
                </div>
              </div>

              {/* Timeline 3 */}
              <div className="relative">
                <div className="absolute -left-9.5 top-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-gamura-bg shadow-lg shadow-emerald-400/50 animate-pulse" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-sharetech text-emerald-400">PHASE III • COGNITIVE SYNTHESIS [NOW ACTIVE]</span>
                  <p className="font-orbitron text-sm font-bold text-white">BuBuBai Intelligence Expansion</p>
                  <p className="text-xs text-gamura-muted leading-relaxed text-emerald-300">Unleashing BuBuBai AI companion models, spatial search routines, and direct audio integrations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Meet the Founder Section */}
          <div className="bg-gradient-to-r from-violet-950/15 via-indigo-950/5 to-transparent border border-white/5 p-6 space-y-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gamura-accent/5 rounded-full blur-3xl" />
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gamura-accent to-indigo-600 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full rounded-2xl bg-gamura-surface overflow-hidden flex items-center justify-center border border-white/10">
                  <SafeImage 
                    srcs={["https://lh3.googleusercontent.com/d/1X_b-gsSwt_-LDOt7t8IyFqop60mHBUCY", "https://lh3.googleusercontent.com/d/1zZfXn3YsmmOGXxzJ6zNKAmW6BFusX0NH"]} 
                    alt="Voyager" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3 text-center md:text-left flex-1">
                <span className="text-[9px] font-bold font-sharetech text-gamura-accent tracking-[0.2em] uppercase">SYSTEM PILOT</span>
                <h3 className="font-orbitron text-lg md:text-xl font-extrabold text-white leading-tight">SELVARANJAN G</h3>
                <p className="font-rajdhani text-sm font-bold text-indigo-300 tracking-[0.1em] uppercase">Navigator // Galaxy Explorer // Node Pioneer</p>
                <p className="text-xs text-gamura-muted leading-relaxed">
                  Navigating high-fidelity cybernetic designs, SELVARANJAN G harmonized cutting-edge React technologies with beautiful aerospace typography and Zero-Trust environments.
                </p>

                {/* Founder Skills List */}
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-2">
                  {["React 18+", "Tailwind CSS", "Zero-Trust Firestore", "Aerospace Typography", "BuBuBai AI", "Space Mechanics"].map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-sharetech text-gamura-muted hover:text-gamura-accent hover:border-gamura-accent/20 transition-all cursor-pointer">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* BUBUBAI AI PANEL                      */}
      {/* ===================================== */}
      {activeTab === "BuBuBai" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 p-1 md:p-3">
          {/* AI Interactive Orb Column */}
          <div className="lg:col-span-1 bg-gamura-surface/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl" />
            
            {/* Spinning Neon Orbital Rings */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 border border-dashed border-violet-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-3 border border-indigo-500/30 rounded-full animate-[spin_6s_linear_infinite]" />
              <div className="absolute inset-6 border border-fuchsia-500/40 rounded-full animate-[spin_3s_linear_infinite]" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gamura-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-gamura-accent/40 animate-pulse relative z-10">
                <Monitor className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="font-orbitron font-extrabold text-base text-white">BuBuBai Cognitive Core</h2>
                <p className="font-rajdhani font-semibold text-xs text-gamura-accent tracking-widest uppercase">NODE ACTIVE & SHIELDED</p>
                <p className="text-xs text-gamura-muted max-w-xs leading-relaxed mx-auto">
                  Harnessing quantum prediction weights to resolve layout anomalies, compile aerospace typography states, and sync spatial modules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open('https://bububai.vercel.app/', '_blank')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:shadow-[0_0_25px_rgba(139,92,246,0.55)] transform hover:-translate-y-0.5 cursor-pointer"
              >
                🚀 LAUNCH BUBUBAI PLATFORM
              </button>
            </div>

            {/* Simulated Live Telemetry Wave */}
            <div className="w-full space-y-2">
              <span className="text-[9px] font-sharetech text-gamura-muted uppercase tracking-widest block text-left">Brainwaves Telemetry</span>
              <InteractiveWaveform />
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div className="lg:col-span-2 bg-gamura-surface/60 border border-white/5 rounded-2xl flex flex-col h-[480px] overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-white/5 bg-gamura-surface/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">INTELLIGENT TELEMETRY DIALOG</span>
              </div>
              <span className="text-[10px] font-sharetech text-gamura-muted uppercase">Latency: 2ms</span>
            </div>

            {/* Chat History Panel */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-dm text-[13px] md:text-[14px]">
              {bubuHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
                  <div className={`max-w-[75%] rounded-xl p-3.5 space-y-1 ${msg.sender === "user" ? "bg-gamura-accent text-white" : "bg-white/5 border border-white/5 text-gamura-text"}`}>
                    <div className="text-[9px] font-sharetech opacity-60 uppercase font-bold tracking-widest">
                      {msg.sender === "user" ? "EXPLORER SELVARANJAN G" : "BUBUBAI INTEL"}
                    </div>
                    <p className="leading-relaxed select-text">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isBubuTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 text-gamura-text max-w-[75%] rounded-xl p-3.5">
                    <span className="text-[10px] font-sharetech opacity-60 uppercase font-bold tracking-widest block mb-1">BUBUBAI INTEL</span>
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gamura-accent animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gamura-accent animate-bounce delay-150" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gamura-accent animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggesters */}
            <div className="p-3 bg-gamura-surface/40 border-t border-white/5 flex flex-wrap gap-1.5">
              {[
                "Who is the founder of Gamura?",
                "What are Galaxy Nodes?",
                "Tell me about SELVARANJAN G",
                "Charge Warp Engines"
              ].map((suggest, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => setBubuMsg(suggest)}
                  className="px-2.5 py-1 border border-white/5 rounded-md text-[10px] font-sharetech text-gamura-muted hover:text-white hover:border-gamura-accent/30 hover:bg-gamura-accent/5 transition-all text-left"
                >
                  {suggest}
                </button>
              ))}
            </div>

            {/* Input Submission Bar */}
            <form onSubmit={handleBubuSubmit} className="p-3 border-t border-white/5 bg-gamura-surface/80 flex gap-2">
              <input 
                type="text" 
                value={bubuMsg}
                onChange={(e) => setBubuMsg(e.target.value)}
                placeholder="Inquire into the cosmos..." 
                className="flex-1 bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 outline-none focus:border-gamura-accent/40 text-xs font-dm text-white placeholder:text-gamura-muted"
                disabled={isBubuTyping}
              />
              <button 
                type="submit" 
                disabled={isBubuTyping || !bubuMsg.trim()}
                className="bg-gamura-accent hover:bg-gamura-accent/80 disabled:opacity-50 text-white rounded-lg px-4 flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* USERS / CREW PANEL                    */}
      {/* ===================================== */}
      {activeTab === "Users" && (
        <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-5 relative z-10 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="font-orbitron font-extrabold text-white text-base">ACTIVE PLAYERS & NODES INDEX</h2>
              <p className="text-xs text-gamura-muted text-left">Real-world voyager profiles currently connected through Gamura Galaxy nodes.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3.5 py-1.5 border border-white/5 rounded-lg text-xs font-sharetech hover:text-white hover:border-gamura-accent/20 transition-all flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                REFRESH NODE
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs font-dm">
              <thead className="bg-white/5 text-gamura-muted uppercase tracking-wider text-[9px] font-sharetech">
                <tr className="border-b border-white/5">
                  <th className="py-3 px-4">SELVARANJAN G</th>
                  <th className="py-3 px-4">Coordinates</th>
                  <th className="py-3 px-4">Node Connection</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: "SELVARANJAN G", role: "Navigator", coords: "A7-K5-99", ip: "192.168.1.100", status: "ONLINE", lat: "2ms", isStaff: true },
                  { name: "Astra_Blade", role: "Explorer Node", coords: "X9-N1-10", ip: "10.0.124.50", status: "ONLINE", lat: "14ms" },
                  { name: "NebulaStream", role: "Starlight Corp", coords: "B4-Z2-44", ip: "172.16.8.99", status: "ONLINE", lat: "22ms" },
                  { name: "BubuGuard", role: "System Oracle", coords: "O0-S0-00", ip: "localhost:3000", status: "MAINTENANCE", lat: "0ms" },
                  { name: "Lunar_Quest", role: "Alpha Build explorer", coords: "Y3-T2-15", ip: "104.22.18.25", status: "OFFLINE", lat: "--" }
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gamura-accent/10 border border-gamura-accent/15 overflow-hidden flex items-center justify-center font-bold font-orbitron text-gamura-accent uppercase">
                          {u.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            {u.name}
                            {u.isStaff && (
                              <span className="px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-400 text-[8px] font-bold font-sharetech uppercase">PILOT</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gamura-muted">{u.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sharetech text-gamura-accent">{u.coords}</td>
                    <td className="py-3.5 px-4 font-mono text-gamura-muted text-[11px]">{u.ip}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-sharetech tracking-wider uppercase ${u.status === "ONLINE" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/20" : u.status === "MAINTENANCE" ? "bg-amber-400/10 text-amber-400 border border-amber-500/20" : "bg-white/5 text-gamura-muted"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sharetech">{u.lat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* ANALYTICS PANEL                       */}
      {/* ===================================== */}
      {activeTab === "Analytics" && (
        <div className="space-y-6 relative z-10 p-1 md:p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md space-y-4">
              <h3 className="font-orbitron font-extrabold text-white text-xs uppercase tracking-widest text-left">Cognitive Computation Rates</h3>
              
              {/* Graphic Chart representation with SVG path */}
              <div className="h-44 w-full flex items-end justify-center relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 150">
                  <path 
                    d="M 0,140 Q 50,110 100,120 T 200,60 T 300,80 T 400,20" 
                    fill="none" 
                    stroke="rgba(124, 58, 237, 0.4)" 
                    strokeWidth="6"
                  />
                  <path 
                    d="M 0,140 Q 50,110 100,120 T 200,60 T 300,80 T 400,20" 
                    fill="none" 
                    stroke="#7c3aed" 
                    strokeWidth="3.5"
                  />
                  <circle cx="200" cy="60" r="5" fill="#7c3aed" className="animate-ping" />
                  <circle cx="200" cy="60" r="4.5" fill="#ffffff" />
                </svg>
                <div className="absolute top-2 left-2 text-[9px] font-sharetech text-gamura-muted uppercase">LOAD: 12.4K REQ/SEC</div>
              </div>
              <p className="text-xs text-gamura-muted leading-relaxed text-left">
                Measures response logs computed synchronously by the BuBuBai engine. Nodes are load balanced globally across distributed channels.
              </p>
            </div>

            <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md space-y-4">
              <h3 className="font-orbitron font-extrabold text-white text-xs uppercase tracking-widest text-left">Starlight Node Performance</h3>
              
              <div className="space-y-3 pt-2">
                {[
                  { name: "Node Alpha (Core)", value: 98, status: "EXCELLENT", color: "bg-emerald-400" },
                  { name: "Node Vega (Spatial)", value: 92, status: "STABLE", color: "bg-blue-500" },
                  { name: "Node Sirius (AI Pipeline)", value: 96, status: "HYPER-ACTIVE", color: "bg-violet-500" },
                  { name: "Node Polaris (Database)", value: 81, status: "OPTIMIZING", color: "bg-indigo-500" }
                ].map((node, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sharetech">
                      <span className="text-white uppercase font-bold">{node.name}</span>
                      <span className="text-gamura-accent font-bold">{node.value}% - {node.status}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${node.color} rounded-full`} style={{ width: `${node.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* FEATURES PANEL                        */}
      {/* ===================================== */}
      {activeTab === "Features" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 p-1 md:p-3">
          {[
            { title: "Aerospace Grid Systems", subtitle: "Orbitron & Rajdhani Alignment", icon: Sun, text: "Aesthetics powered by premium futuristic type pairings. Sharp lines, elegant borders, glowing modules, and high contrast cyber interfaces." },
            { title: "Interactive Particle field", subtitle: "Warp Starfields Canvas", icon: Star, text: "Runs responsive custom renders calculated using high frequency state update arrays to adapt perfectly to window resize margins." },
            { title: "Quantum Telemetry API", subtitle: "BuBuBai Multi-Engine Integrations", icon: Terminal, text: "Access high-performance neural modules capable of parsing inputs, formulating code, and keeping logs secure via advanced FireStore patterns." }
          ].map((feat, i) => (
            <div key={i} className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-5 hover:border-gamura-accent/20 transition-all duration-300 backdrop-blur-md space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-gamura-accent/10 flex items-center justify-center text-gamura-accent">
                <feat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-sharetech text-gamura-accent uppercase tracking-widest">{feat.subtitle}</span>
              <h3 className="font-orbitron font-extrabold text-base text-white">{feat.title}</h3>
              <p className="text-xs text-gamura-muted leading-relaxed">{feat.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===================================== */}
      {/* COMMUNITY CHAT PORTAL                 */}
      {/* ===================================== */}
      {activeTab === "Community" && (
        <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl flex flex-col h-[460px] overflow-hidden backdrop-blur-md relative z-10 p-1">
          <div className="p-4 border-b border-white/5 bg-gamura-surface/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Galaxy Broadcast Terminal</span>
            </div>
            <span className="text-[10px] font-sharetech text-gamura-muted uppercase">Nodes Online: 841</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-dm text-xs">
            {communityChats.map((c, index) => (
              <div key={index} className="flex gap-2 text-left bg-white/3 p-2.5 rounded-lg border border-white/5 animate-fade-up">
                <div className="font-orbitron text-[11px] font-bold text-gamura-accent shrink-0 min-w-16">
                  {c.user}:
                </div>
                <div className="flex-1 text-gamura-text select-text">{c.text}</div>
                <div className="text-[9px] font-sharetech text-gamura-muted shrink-0">{c.time}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCommunitySubmit} className="p-3 border-t border-white/5 bg-gamura-surface/80 flex gap-2">
            <input 
              type="text" 
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="Send packet payload to Galaxy Broadcast..." 
              className="flex-1 bg-white/5 border border-white/5 rounded-lg px-4 py-2 outline-none focus:border-gamura-accent/40 text-xs font-dm text-white placeholder:text-gamura-muted"
            />
            <button 
              type="submit" 
              disabled={!userChatInput.trim()}
              className="bg-gamura-accent hover:bg-gamura-accent/80 disabled:opacity-50 text-white rounded-lg px-4 flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ===================================== */}
      {/* SETTINGS PANEL                        */}
      {/* ===================================== */}
      {activeTab === "Settings" && (
        <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-6 relative z-10 backdrop-blur-md space-y-6 text-left">
          <div className="space-y-1">
            <h2 className="font-orbitron font-extrabold text-white text-base">COSMIC SIMULATOR ADJUSTMENTS</h2>
            <p className="text-xs text-gamura-muted">Customize starfield warp densities, particle trails, and cognitive limits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-sharetech text-white uppercase tracking-wider block">Starfield warp multiplier</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5"
                    value={warpSpeed}
                    onChange={(e) => setWarpSpeed(parseFloat(e.target.value))}
                    className="w-full accent-gamura-accent cursor-pointer"
                  />
                  <span className="font-sharetech text-gamura-accent w-12 text-right">{warpSpeed}x</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sharetech text-white uppercase tracking-wider block">Security protocols</label>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-white font-semibold font-orbitron">Zero-Trust Shielding</p>
                    <p className="text-[10px] text-gamura-muted">Always validate users on database targets.</p>
                  </div>
                  <div className="w-9 h-5 bg-gamura-accent rounded-full p-0.5 cursor-pointer flex items-center justify-end">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-tr from-violet-950/20 to-transparent border border-white/5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-400 border border-violet-500/20 text-[9px] font-bold font-sharetech uppercase inline-block">SYSTEM DATA</span>
                <p className="font-orbitron text-xs font-bold text-white uppercase">Aerospace aligned core v3.4.1</p>
                <p className="text-xs text-gamura-muted leading-relaxed">
                  Engineered with specialized Tailwind configuration elements, Google Fonts, and non-blocking state loops to prevent performance issues.
                </p>
              </div>
              <div className="text-[10px] font-sharetech text-gamura-accent uppercase tracking-widest pt-4">
                AUTHENTICATED AS: explorer@gamura.universe
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* SUPPORT PANEL                         */}
      {/* ===================================== */}
      {activeTab === "Support" && (
        <div className="bg-gamura-surface/60 border border-white/5 rounded-2xl p-6 relative z-10 backdrop-blur-md space-y-4 text-left">
          <div className="space-y-1">
            <h2 className="font-orbitron font-extrabold text-white text-base">SELVARANJAN G TRANSMISSION PORTAL</h2>
            <p className="text-xs text-gamura-muted">Submit telemetry bugs or core synchronization anomalies directly to our ground team.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert("Packet dispatched to Ground Command!"); }} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-sharetech text-gamura-muted uppercase tracking-wider block">SELVARANJAN G Name</label>
                <input 
                  type="text" 
                  defaultValue="SELVARANJAN G" 
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2 outline-none focus:border-gamura-accent/40 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-sharetech text-gamura-muted uppercase tracking-wider block">Galaxy Channel</label>
                <input 
                  type="text" 
                  defaultValue="Node-Alpha-BCA" 
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2 outline-none focus:border-gamura-accent/40 text-xs text-white color-scheme-dark"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sharetech text-gamura-muted uppercase tracking-wider block">Transmission Logs / Payload</label>
              <textarea 
                rows={4} 
                placeholder="Explicate your warp anomaly or code requirements here..." 
                className="w-full bg-white/5 border border-white/5 rounded-lg p-4 outline-none focus:border-gamura-accent/40 text-xs text-white resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="bg-gradient-to-r from-gamura-accent to-indigo-600 hover:shadow-lg hover:shadow-gamura-accent/20 text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Packet Payload
            </button>
          </form>
        </div>
      )}

      {/* Decorative Cybernetic Footer */}
      <div className="pt-12 pb-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-[11px] font-sharetech text-gamura-muted z-10 relative">
        <div>
          © 2026 GAMURA UNIVERSE // SECURED BY SELVARANJAN G (founder & developer)
        </div>
        <div className="flex gap-4">
          <a href="#privacy" className="hover:text-gamura-accent transition-colors">SECURE_PRIVACY.SH</a>
          <span className="opacity-30">//</span>
          <a href="#terms" className="hover:text-gamura-accent transition-colors">GALAXY_TERMS.DAT</a>
        </div>
      </div>
    </div>
  );
};
