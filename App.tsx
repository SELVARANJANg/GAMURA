import React, {
  useState,
  useRef,
  useEffect,
  Component,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cloud,
  X,
  Send,
  Loader2,
  Sparkles,
  User,
  Lock,
  Copy,
  Check,
  Linkedin,
  Code,
  Image as ImageIcon,
  Video,
  Calculator,
  BarChart3,
  Activity,
  Home,
  GraduationCap,
  Trophy,
  Mail,
  Briefcase,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  MessageSquarePlus,
  LogIn,
  LogOut,
  History,
  Info,
  Gamepad2,
  Trash2,
  Monitor,
  Users,
  LayoutGrid,
  MessageSquare,
  Settings,
  Menu,
  Search,
  Bell,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Plus,
  RotateCw,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  FileText,
  Star,
  Shield,
  Zap,
  Github,
  Layers,
  Share2,
  Cpu,
  Link,
  Link2,
  Heart,
  Bot,
  Terminal,
  Database,
  ArrowUpRight,
  Globe,
  MessageCircle,
  MoreHorizontal,
  Network,
  Radio,
  Download,
  PieChart as PieChartIcon,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { auth, db, firebaseConfig } from "./firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  increment,
  orderBy,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { rtdb } from "./firebase";
import { handleFirestoreError, OperationType } from "./firebaseErrorHandler";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { GamuraOverview } from "./components/GamuraOverview";
import { SafeImage } from "./components/SafeImage";
import {
  PortfolioBuilderView,
  generatePortfolioHTML,
  DEFAULT_PORTFOLIO,
  THEMES,
} from "./components/PortfolioBuilderView";
import { Octokit } from "octokit";
import SelvaranjanGamura from "./components/SelvaranjanGamura";
import ClaimedProfileView from "./components/ClaimedProfileView";
import ShortLinkRedirectView from "./components/ShortLinkRedirectView";
import GamuraShortLinksManager from "./components/GamuraShortLinksManager";
import GamuraUniverseProfileManager from "./components/GamuraUniverseProfileManager";
import { GlobalConnectionPulse } from "./components/GlobalConnectionPulse";

const GAMURA_G_LOGO =
  "https://lh3.googleusercontent.com/d/1QJprWSIgOa32ADyWHBikyBibzN80Vetv";

const loaderImgSources = [
  "https://lh3.googleusercontent.com/d/1lUg4cyZcP17Av5MC-ij8JJM0HGmmUJu-",
];
const logoSources = [
  "https://lh3.googleusercontent.com/d/1gdDmsxtjEHxq4qvmshBQL3eX3c1cOSWY",
];
const mainImgSources = [
  "https://lh3.googleusercontent.com/d/1ii0yByxrUOAdqWUigeD63TbT3cvYJWsX",
];
const secondaryLogoSources = [
  "https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x",
];
const profileImgSources = [
  "https://lh3.googleusercontent.com/d/1X_b-gsSwt_-LDOt7t8IyFqop60mHBUCY",
  "https://lh3.googleusercontent.com/d/1zZfXn3YsmmOGXxzJ6zNKAmW6BFusX0NH",
];
const certImgSources = [
  "https://lh3.googleusercontent.com/d/1o6tralnliWDBJcAR62QUlpFuDuOHQR1W",
];
const ggImgSources = [
  "https://lh3.googleusercontent.com/d/1e-46lRbggMtRxalG_QwF0zCRd0E7A0jK",
];
const roundImgSources = [
  "https://lh3.googleusercontent.com/d/1QJprWSIgOa32ADyWHBikyBibzN80Vetv",
];
const rightRoundImgSources = [
  "https://lh3.googleusercontent.com/d/1yUWJgx-rYDX78t5Mb-BgZs2TVvhWe2Ct",
];

// Lazy initialization of Gemini AI
const getAi = () => {
  const apiKey =
    process.env.GAMURA_API_KEY && process.env.GAMURA_API_KEY.length > 20
      ? process.env.GAMURA_API_KEY
      : process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20
        ? process.env.GEMINI_API_KEY
        : null;

  if (!apiKey || apiKey.includes("MY_GEMINI_API_KEY")) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Dark Mode Toggle Component
const DarkModeToggle = ({
  isDarkMode,
  setIsDarkMode,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}) => {
  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-full shadow-lg hover:scale-105 transition-transform z-50 border border-zinc-200 dark:border-zinc-700"
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

interface Message {
  role: "user" | "model";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  userId?: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = {
    hasError: false,
    error: null,
  };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <X className="text-red-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Something went wrong
          </h1>
          <p className="text-zinc-500 text-sm max-w-xs mb-6">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const GamuraLoader = ({ onFinish }: { onFinish: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(1);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W: number,
      H: number,
      particles: any[] = [];
    const COLORS = ["rgba(99,57,220,", "rgba(6,182,212,", "rgba(168,85,247,"];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const mkP = () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: Math.random() * 0.35 + 0.1,
      life: Math.random() * 200 + 100,
      age: 0,
    });

    for (let i = 0; i < 80; i++) particles.push(mkP());

    let animationId: number;
    const animP = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.age++;
        const al = p.a * (1 - p.age / p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + al + ")";
        ctx.fill();
        if (p.age >= p.life) particles[i] = mkP();
      });
      animationId = requestAnimationFrame(animP);
    };
    animP();

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + 0.5); // 0.5 * 200 ticks = 100 (200 * 30ms = 6000ms = 6s)
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(onFinish, 200);
          }, 50);
        }
        return next;
      });
    }, 30);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
      clearInterval(timer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans transition-opacity duration-600 ${isFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="logo-wrap-loader">
          <div className="ring-outer"></div>
          <div className="ring-inner"></div>
          <svg className="svg-ring" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6339dc" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle
              cx="120"
              cy="120"
              r="112"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="3"
              strokeDasharray="350 352"
              strokeLinecap="round"
            />
          </svg>
          <div className="orbit-loader">
            <div className="orbit-dot-loader orbit-dot-1-loader"></div>
            <div className="orbit-dot-loader orbit-dot-2-loader"></div>
          </div>
          <div className="orbit-2-loader">
            <div className="orbit-dot-loader orbit-dot-3-loader"></div>
          </div>
          <div className="halo-loader"></div>
          <SafeImage
            srcs={loaderImgSources}
            alt="Gamura"
            className="logo-img-loader rounded-full border-4 border-white/10 shadow-2xl"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="percent-num-loader">{Math.round(progress)}%</div>
          <div className="text-[11px] tracking-[4px] uppercase text-zinc-400 font-semibold">
            Loading
          </div>
        </div>
        <div className="w-[320px]">
          <div className="w-full h-1.5 bg-zinc-100/50 rounded-full overflow-visible relative">
            <div
              className="track-fill-loader h-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div
            className="dot-bounce-loader"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="dot-bounce-loader"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="dot-bounce-loader"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const AuraLoader = ({ onFinish }: { onFinish: () => void }) => {
  const starsRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (starsRef.current) {
      for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.style.position = "absolute";
        star.style.width = "1px";
        star.style.height = "1px";
        star.style.background = "#fff";
        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";
        star.style.opacity = Math.random().toString();
        starsRef.current.appendChild(star);
      }
    }
    if (burstRef.current) {
      for (let i = 0; i < 40; i++) {
        const p = document.createElement("div");
        p.className = "bp";
        const x = (Math.random() - 0.5) * 300 + "px";
        const y = (Math.random() - 0.5) * 300 + "px";
        p.style.setProperty("--x", x);
        p.style.setProperty("--y", y);
        p.style.setProperty("--d", Math.random() * 2 + 1 + "s");
        p.style.setProperty("--s", Math.random() * 2 + "s");
        burstRef.current.appendChild(p);
      }
    }
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden flex items-center justify-center font-sans select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
        
        .aura-loader-scene { position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; }
        
        .aura-loader-halo {
          position: absolute;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(138,43,226,0.45) 0%, rgba(100,20,200,0.2) 40%, transparent 70%);
          filter: blur(30px);
          animation: auraHaloPulse 3s ease-in-out infinite;
        }
        @keyframes auraHaloPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        
        .aura-ring1 {
          position: absolute;
          width: 340px; height: 340px;
          border-radius: 50%;
          border: 1.5px solid rgba(160,80,255,0.4);
          border-top-color: #bf80ff;
          border-right-color: rgba(160,80,255,0.1);
          animation: auraSpin1 3s linear infinite;
          box-shadow: 0 0 12px rgba(160,80,255,0.3), inset 0 0 12px rgba(160,80,255,0.1);
        }
        @keyframes auraSpin1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .aura-ring1::before {
          content: ""; position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: #bf80ff;
          box-shadow: 0 0 10px #bf80ff, 0 0 20px rgba(160,80,255,0.8);
        }
        
        .aura-ring2 {
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          border: 1px solid rgba(180,100,255,0.25);
          border-bottom-color: #d4aaff;
          border-left-color: rgba(160,80,255,0.05);
          animation: auraSpin2 5s linear infinite;
        }
        @keyframes auraSpin2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .aura-ring2::before {
          content: ""; position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%);
          width: 6px; height: 6px; border-radius: 50%;
          background: #d4aaff;
          box-shadow: 0 0 8px #d4aaff, 0 0 16px rgba(200,150,255,0.6);
        }
        
        .aura-ring3 {
          position: absolute;
          width: 220px; height: 220px;
          border-radius: 50%;
          border: 1px dashed rgba(140,60,255,0.15);
          animation: auraSpin1 12s linear infinite reverse;
        }
        
        .aura-logo {
          position: relative; z-index: 5;
          width: 190px; height: auto;
          filter: drop-shadow(0 0 18px rgba(160,80,255,0.9)) drop-shadow(0 0 40px rgba(120,40,220,0.6));
          animation: auraLogoFloat 4s ease-in-out infinite, auraLogoIn 1.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
          opacity: 0;
        }
        @keyframes auraLogoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes auraLogoIn {
          0% { opacity: 0; transform: scale(0.2) rotate(-25deg) translateY(0); }
          65% { opacity: 1; transform: scale(1.12) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        
        .aura-burst { position: absolute; inset: 0; pointer-events: none; }
        .bp {
          position: absolute; top: 50%; left: 50%;
          width: 2px; height: 2px; border-radius: 50%; background: #cc88ff;
          animation: auraBpFly var(--d) ease-out var(--s) infinite; opacity: 0;
        }
        @keyframes auraBpFly {
          0% { transform: translate(-50%, -50%); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))); opacity: 0; width: 1px; height: 1px; }
        }
        
        .aura-hud-corner { position: fixed; width: 50px; height: 50px; z-index: 20; opacity: 0; animation: auraHudIn 0.5s ease 1.8s forwards; }
        @keyframes auraHudIn { to { opacity: 0.6; } }
        .hud-tl { top: 18px; left: 18px; border-top: 2px solid #9040e0; border-left: 2px solid #9040e0; }
        .hud-tr { top: 18px; right: 18px; border-top: 2px solid #9040e0; border-right: 2px solid #9040e0; }
        .hud-bl { bottom: 18px; left: 18px; border-bottom: 2px solid #9040e0; border-left: 2px solid #9040e0; }
        .hud-br { bottom: 18px; right: 18px; border-bottom: 2px solid #9040e0; border-right: 2px solid #9040e0; }
        
        .aura-scan {
          position: fixed; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(160,80,255,0.8) 50%, transparent 100%);
          animation: auraScanMove 4s linear infinite; z-index: 30; pointer-events: none;
        }
        @keyframes auraScanMove { 0% { top: -1px; opacity: 1; } 100% { top: 100%; opacity: 0; } }
        
        .aura-vig { position: fixed; inset: 0; background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%); z-index: 9; pointer-events: none; }
      `}</style>
      <div className="aura-scan"></div>
      <div className="aura-vig"></div>
      <div className="aura-hud-corner hud-tl"></div>
      <div className="aura-hud-corner hud-tr"></div>
      <div className="aura-hud-corner hud-bl"></div>
      <div className="aura-hud-corner hud-br"></div>
      <div className="fixed inset-0 z-0" ref={starsRef}></div>

      <div className="aura-loader-scene">
        <div className="aura-loader-halo"></div>
        <div className="aura-ring1"></div>
        <div className="aura-ring2"></div>
        <div className="aura-ring3"></div>
        <div className="aura-burst" ref={burstRef}></div>
        <img className="aura-logo" src={GAMURA_G_LOGO} />
      </div>
    </div>
  );
};

const NeuralLinkView = ({
  onBack,
  user,
  userInfo,
  showToast,
  addActivity,
}: {
  onBack: () => void;
  user: any;
  userInfo: any;
  showToast: any;
  addActivity: any;
}) => {
  const [nickname, setNickname] = useState("");
  const [myNeuralProfile, setMyNeuralProfile] = useState<any>(null);
  const [searchNickname, setSearchNickname] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState<"users" | "requests" | "active">(
    "users",
  );
  const [refreshBit, setRefreshBit] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force refresh every 30 seconds to update expired messages dynamically
    const interval = setInterval(() => setRefreshBit((b) => b + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Heartbeat pulse to user's registered profile to indicate active state
  useEffect(() => {
    if (!user || !myNeuralProfile?.nickname) return;
    const updatePulse = async () => {
      try {
        await updateDoc(doc(db, "neural_profiles", myNeuralProfile.nickname), {
          lastPulse: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Pulse update failed:", e);
      }
    };
    updatePulse(); // Immediately run
    const interval = setInterval(updatePulse, 10000); // Pulse every 10 seconds
    return () => clearInterval(interval);
  }, [user, myNeuralProfile?.nickname]);

  const getOnlineStatus = (profile: any) => {
    if (!profile || !profile.lastPulse) return "Offline";
    try {
      let pulseMs = 0;
      if (typeof profile.lastPulse.toDate === "function") {
        pulseMs = profile.lastPulse.toDate().getTime();
      } else if (profile.lastPulse.seconds) {
        pulseMs = profile.lastPulse.seconds * 1000;
      } else {
        pulseMs = new Date(profile.lastPulse).getTime();
      }
      const diffSeconds = (Date.now() - pulseMs) / 1000;
      if (diffSeconds < 25) return "Active";
      if (diffSeconds < 80) return "Standby";
      return "Offline";
    } catch {
      return "Offline";
    }
  };

  const getStatusColorClass = (status: "Active" | "Standby" | "Offline") => {
    if (status === "Active")
      return "bg-emerald-500 ring-2 ring-white shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (status === "Standby")
      return "bg-amber-500 ring-2 ring-white shadow-[0_0_8px_rgba(245,158,11,0.4)]";
    return "bg-slate-300 ring-2 ring-white";
  };

  const sortMembersByActiveStatus = (
    membersList: string[] | undefined,
    activeGroupChat: any,
  ) => {
    if (!membersList) return [];
    return [...membersList].sort((aUid, bUid) => {
      const aProfile =
        aUid === user.uid
          ? { ...myNeuralProfile, uid: user.uid }
          : allUsers.find((u: any) => u.uid === aUid);
      const bProfile =
        bUid === user.uid
          ? { ...myNeuralProfile, uid: user.uid }
          : allUsers.find((u: any) => u.uid === bUid);

      const aStatus = getOnlineStatus(aProfile);
      const bStatus = getOnlineStatus(bProfile);

      const weight: Record<string, number> = {
        Active: 3,
        Standby: 2,
        Offline: 1,
      };
      const weightA = weight[aStatus] || 0;
      const weightB = weight[bStatus] || 0;

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      const aLabel = aProfile?.nickname
        ? `@${aProfile.nickname}`
        : activeGroupChat?.nicknames?.[aUid]
          ? `@${activeGroupChat.nicknames[aUid]}`
          : "Anonymous";
      const bLabel = bProfile?.nickname
        ? `@${bProfile.nickname}`
        : activeGroupChat?.nicknames?.[bUid]
          ? `@${activeGroupChat.nicknames[bUid]}`
          : "Anonymous";
      return aLabel.localeCompare(bLabel);
    });
  };

  // Sync Neutral Profile
  useEffect(() => {
    if (!user) return;
    const qProfile = query(
      collection(db, "neural_profiles"),
      where("uid", "==", user.uid),
    );
    const unsubProfile = onSnapshot(
      qProfile,
      (snap) => {
        if (!snap.empty) {
          setMyNeuralProfile(snap.docs[0].data());
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "neural_profiles"),
    );

    // Sync All Users (for standard micro-search directory)
    const unsubUsers = onSnapshot(
      query(collection(db, "neural_profiles"), limit(100)),
      (snap) => {
        setAllUsers(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as any)
            .filter((u: any) => u.uid !== user.uid),
        );
      },
      (err) =>
        handleFirestoreError(err, OperationType.LIST, "neural_profiles_limit"),
    );

    // Sync Incoming Connection Requests
    const qReq = query(
      collection(db, "neural_requests"),
      where("receiverUid", "==", user.uid),
    );
    const unsubReq = onSnapshot(
      qReq,
      (snap) => {
        setRequests(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as any)
            .filter((r: any) => r.status === "pending"),
        );
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          "neural_requests_incoming",
        ),
    );

    // Sync Sent Connection Requests
    const qSent = query(
      collection(db, "neural_requests"),
      where("senderUid", "==", user.uid),
    );
    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        setSentRequests(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as any)
            .filter((r: any) => r.status === "pending"),
        );
      },
      (err) =>
        handleFirestoreError(err, OperationType.LIST, "neural_requests_sent"),
    );

    // Sync Active Multiple Connections
    const qConn = query(
      collection(db, "neural_connections"),
      where("uids", "array-contains", user.uid),
    );
    const unsubConn = onSnapshot(
      qConn,
      (snap) => {
        setConnections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) =>
        handleFirestoreError(err, OperationType.LIST, "neural_connections"),
    );

    return () => {
      unsubProfile();
      unsubUsers();
      unsubReq();
      unsubSent();
      unsubConn();
    };
  }, [user]);

  // Sync Active Chat Channels
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "neural_chats"),
      where("members", "array-contains", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        // Filter out 'ai' type chat hubs to remove BuBuBai AI completely
        const allChats = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as any,
        );
        setChats(allChats.filter((c: any) => c.type !== "ai"));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "neural_chats"),
    );
    return unsub;
  }, [user]);

  // Sync Messages with 24-Hour Auto-Expiry Logic (client-side dynamic window)
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, `neural_chats/${activeChat.id}/messages`),
      orderBy("timestamp", "asc"),
      limit(60),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        const msgs = snap.docs.map((d) => {
          const data = d.data();
          const ts = data.timestamp?.toMillis
            ? data.timestamp.toMillis()
            : data.timestamp || now;
          return { id: d.id, ...data, ts };
        });

        // Filter local state messages to those strictly created within last 24 hours
        const filtered = msgs.filter(
          (m) => Date.now() - m.ts < twentyFourHours,
        );
        setMessages(filtered);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `neural_chats/${activeChat.id}/messages`,
        ),
    );
    return unsub;
  }, [activeChat, refreshBit]);

  const sendRequest = async (target: any) => {
    try {
      const requestId = [user.uid, target.uid].sort().join("_");
      await setDoc(doc(db, "neural_requests", requestId), {
        senderUid: user.uid,
        senderNickname: myNeuralProfile.nickname,
        receiverUid: target.uid,
        receiverNickname: target.nickname,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      showToast(
        "📡",
        "Connection Request Sent",
        `Invited ${target.nickname} to connect in the Gamura Universe.`,
      );
      addActivity(`Sent connection invitation to ${target.nickname}`, "👥");
    } catch (e: any) {
      showToast("❌", "Request Failed", e.message);
    }
  };

  const cancelRequest = async (req: any) => {
    try {
      await deleteDoc(doc(db, "neural_requests", req.id));
      showToast("📡", "Request Recalled", "Connection invitation withdrawn.");
    } catch (e: any) {
      showToast("❌", "Action Failed", e.message);
    }
  };

  const acceptRequest = async (req: any) => {
    try {
      const connectionId = [req.senderUid, user.uid].sort().join("_");
      await setDoc(doc(db, "neural_connections", connectionId), {
        uids: [req.senderUid, user.uid],
        nicknames: {
          [req.senderUid]: req.senderNickname,
          [user.uid]: myNeuralProfile.nickname,
        },
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, "neural_requests", req.id), {
        status: "accepted",
      });
      showToast(
        "🔗",
        "Connection Accepted",
        `You are now connected with ${req.senderNickname}!`,
      );
      addActivity(
        `Connected with multiple-user profile ${req.senderNickname}`,
        "🔗",
      );
    } catch (e: any) {
      showToast("❌", "Action Failed", e.message);
    }
  };

  const rejectRequest = async (req: any) => {
    try {
      await deleteDoc(doc(db, "neural_requests", req.id));
      showToast("⚡", "Request Declined", "Connection invitation declined.");
    } catch (e: any) {
      showToast("❌", "Action Failed", e.message);
    }
  };

  const copyLink = (nickname: string) => {
    const link = `gamura://connect/${nickname}`;
    navigator.clipboard.writeText(link);
    showToast("📋", "Uplink Saved", `Shared identity: ${link}`);
  };

  const handleRegister = async () => {
    if (nickname.length < 3) {
      showToast("⚠️", "Invalid ID", "Nickname must be at least 3 characters.");
      return;
    }
    setIsRegistering(true);
    try {
      const lowerNick = nickname.toLowerCase().replace(/[^a-z0-9_]/g, "");
      const docRef = doc(db, "neural_profiles", lowerNick);
      
      // Try fetching first, but ignore offline errors and fallback to setDoc
      try {
         const existing = await getDoc(docRef);
         if (existing.exists() && existing.data().uid !== user.uid) {
           showToast("❌", "ID Already Taken", "This nickname is already registered.");
           setIsRegistering(false);
           return;
         }
      } catch(e: any) {
         // Silently ignore offline error and rely on security rules to prevent overwrite
         if (!e.message?.toLowerCase().includes("offline")) {
            console.warn("getDoc failed:", e);
         }
      }

      try {
        await setDoc(docRef, {
          uid: user.uid,
          nickname: lowerNick,
          avatarUrl: userInfo?.avatarUrl || "",
        });
      } catch (err: any) {
        if (err.message?.includes("Missing or insufficient permissions")) {
            showToast("❌", "ID Already Taken", "This nickname is already registered.");
            setIsRegistering(false);
            return;
        }
        throw err;
      }
      
      showToast(
        "🧠",
        "Neutral ID Registered",
        `You are now active as @${lowerNick}!`,
      );
      addActivity(`Registered Neutral Link nick: ${lowerNick}`, "🧠");
    } catch (e: any) {
      showToast("❌", "Registration Error", e.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const startChat = async (target: any) => {
    const existing = chats.find(
      (c) => c.type === "direct" && c.members.includes(target.uid),
    );
    if (existing) {
      setActiveChat(existing);
      return;
    }

    try {
      const chatId = [user.uid, target.uid].sort().join("_");
      const chatRef = doc(db, "neural_chats", chatId);
      const chatData = {
        members: [user.uid, target.uid],
        nicknames: {
          [user.uid]: myNeuralProfile?.nickname || "User",
          [target.uid]: target.nickname || "Collaborator",
        },
        type: "direct",
        createdBy: user.uid,
        timestamp: serverTimestamp(),
      };
      await setDoc(chatRef, chatData);
      setActiveChat({ id: chatId, ...chatData });
      showToast(
        "💬",
        "Direct Chat Established",
        `Send direct messages safely to @${target.nickname}.`,
      );
    } catch (e: any) {
      showToast("❌", "Chat Initiation Error", e.message);
    }
  };

  const createGroupChatObj = async () => {
    if (!groupNameInput.trim()) {
      showToast("⚠️", "Write Group Name", "Specify a name for the group chat.");
      return;
    }
    try {
      const chatId = `group_${Date.now()}`;
      const chatData = {
        members: [user.uid],
        nicknames: { [user.uid]: myNeuralProfile?.nickname || "Creator" },
        name: groupNameInput.trim(),
        type: "group",
        createdBy: user.uid,
        timestamp: serverTimestamp(),
      };
      await setDoc(doc(db, "neural_chats", chatId), chatData);
      showToast(
        "🧑‍🤝‍🧑",
        "Group Live",
        `Group room "${groupNameInput.trim()}" created successfully!`,
      );
      setGroupNameInput("");
      setIsCreatingGroup(false);
    } catch (e: any) {
      showToast("❌", "Group Creation Failed", e.message);
    }
  };

  const deleteOrLeaveGroup = async (chat: any) => {
    const actionName =
      chat.createdBy === user.uid ? "dismantle this group" : "leave this group";
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) return;
    try {
      if (chat.createdBy === user.uid) {
        await deleteDoc(doc(db, "neural_chats", chat.id));
        showToast(
          "🗑️",
          "Group Dismantled",
          `Group "${chat.name}" was dismantled successfully.`,
        );
        if (activeChat?.id === chat.id) setActiveChat(null);
      } else {
        const updatedMembers = chat.members.filter(
          (uid: string) => uid !== user.uid,
        );
        const updatedNicknames = { ...chat.nicknames };
        delete updatedNicknames[user.uid];
        await updateDoc(doc(db, "neural_chats", chat.id), {
          members: updatedMembers,
          nicknames: updatedNicknames,
        });
        showToast("🚪", "Left Group", `You left the group "${chat.name}".`);
        if (activeChat?.id === chat.id) setActiveChat(null);
      }
    } catch (e: any) {
      showToast("❌", "Action Failed", e.message);
    }
  };

  const removeConnection = async (
    targetUid: string,
    targetNickname: string,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to sever your connection and delete this chat session with @${targetNickname}?`,
      )
    )
      return;
    try {
      const connectionId = [targetUid, user.uid].sort().join("_");
      await deleteDoc(doc(db, "neural_connections", connectionId));

      const requestId = [targetUid, user.uid].sort().join("_");
      await deleteDoc(doc(db, "neural_requests", requestId));

      const directChatId = [user.uid, targetUid].sort().join("_");
      await deleteDoc(doc(db, "neural_chats", directChatId));

      showToast(
        "🔌",
        "Link Severed",
        `Handshake connection with @${targetNickname} was dissolved.`,
      );
      addActivity(`Severed connection with @${targetNickname}`, "🔌");

      if (activeChat?.id === directChatId) {
        setActiveChat(null);
      }
    } catch (e: any) {
      showToast("❌", "Sever failed", e.message);
    }
  };

  const addMemberToGroup = async (targetUser: any) => {
    if (!activeChat || activeChat.type !== "group") return;
    if (activeChat.members.length >= 24) {
      showToast(
        "⚠️",
        "Group limits reached",
        "Only a maximum of 24 members is allowed in a single group.",
      );
      return;
    }
    try {
      const updatedMembers = [...activeChat.members, targetUser.uid];
      const updatedNicknames = {
        ...activeChat.nicknames,
        [targetUser.uid]: targetUser.nickname || "Collaborator",
      };
      await updateDoc(doc(db, "neural_chats", activeChat.id), {
        members: updatedMembers,
        nicknames: updatedNicknames,
      });
      setActiveChat((prev: any) => {
        if (prev && prev.id === activeChat.id) {
          return {
            ...prev,
            members: updatedMembers,
            nicknames: updatedNicknames,
          };
        }
        return prev;
      });
      showToast(
        "➕",
        "Member Joint",
        `@${targetUser.nickname} invited into ${activeChat.name || "group"}.`,
      );
    } catch (e: any) {
      showToast("❌", "Could not add user", e.message);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    const msg = newMsg.trim();
    setNewMsg("");

    try {
      await setDoc(
        doc(collection(db, `neural_chats/${activeChat.id}/messages`)),
        {
          senderId: user.uid,
          senderName: myNeuralProfile.nickname,
          text: msg,
          timestamp: serverTimestamp(),
        },
      );
    } catch (e: any) {
      showToast("❌", "Send Failed", e.message);
    }
  };

  const getRemainingTimeStr = (ts: number) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const diff = twentyFourHours - (Date.now() - ts);
    if (diff <= 0) return "Expired soon";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  // Profile setup page for Neutral Link
  if (!myNeuralProfile) {
    return (
      <div className="w-full h-full min-h-[580px] bg-white border border-slate-200/80 rounded-[2rem] flex flex-col p-8 md:p-12 relative overflow-hidden animate-in fade-in duration-300 shadow-xl text-slate-800">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100 shadow-sm">
            <Link size={26} className="text-sky-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Activate Your Neutral Link ID
            </h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed uppercase tracking-wider">
              Establish your corporate-ready communication frequency on the
              Gamura premium network.
            </p>
          </div>

          <div className="w-full max-w-sm p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 text-[11px] text-slate-500 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800 uppercase tracking-widest text-[9px]">
              About Neutral Link
            </p>
            <p>
              Neutral Link is a collaboration hub where users in the Gamura
              Universe can request connections, accept connections, and work
              together on projects like LinkedIn.
            </p>
          </div>

          <div className="w-full space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase text-left tracking-wider pl-1">
              Choose Nickname / Nick ID
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) =>
                setNickname(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="e.g. creative_pixel (lowercase, alphanumeric)"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
            <button
              onClick={handleRegister}
              disabled={isRegistering || nickname.length < 3}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl uppercase tracking-[0.15em] shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRegistering
                ? "Registering Signature..."
                : "Activate Connection ID"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter registered users based on search
  const filteredUsers = allUsers.filter(
    (u) =>
      u.nickname &&
      u.nickname.toLowerCase().includes(searchNickname.toLowerCase()),
  );

  const connectedButNotInGroup = allUsers.filter((u) => {
    const isConnected = connections.some((c) => c.uids.includes(u.uid));
    const isAlreadyInGroup = activeChat?.members?.includes(u.uid);
    return isConnected && !isAlreadyInGroup;
  });

  return (
    <div className="w-full h-full min-h-[620px] bg-white border border-slate-200/80 rounded-[2.5rem] flex flex-col relative overflow-hidden animate-in fade-in duration-300 shadow-xl text-slate-800">
      {/* HEADER BAR */}
      <div className="px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-base shadow-md shadow-sky-500/15">
            {myNeuralProfile.nickname.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-slate-900 font-extrabold text-sm tracking-tight">
                @{myNeuralProfile.nickname}
              </h2>
              <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-600 text-[8px] font-extrabold uppercase tracking-widest">
                GETA RELEASE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold tracking-tight">
              Active Mutual Workspace ID:{" "}
              {user.uid.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === "users" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            Discover Users
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider relative transition-all cursor-pointer ${activeTab === "requests" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            Pending Requests
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-sky-500 text-white rounded-full w-4 h-4 text-[8px] font-extrabold flex items-center justify-center animate-bounce">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={onBack}
            className="p-2 ml-auto text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Exit Workspace"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* CORE COLUMNS CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[500px]">
        {/* SIDEBAR: ACTIVE INTERACTION FEEDS */}
        <div className="w-full lg:w-72 flex flex-col shrink-0 bg-slate-50/20 max-h-[500px] lg:max-h-none overflow-y-auto">
          {/* Active Chats Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Interactive Channels
            </span>
            <button
              onClick={() => setIsCreatingGroup(!isCreatingGroup)}
              className="text-xs font-black text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              + Create Group
            </button>
          </div>

          {/* New Group Inline Creation Input */}
          {isCreatingGroup && (
            <div className="p-4 bg-sky-50/40 border-b border-slate-100 animate-slide-down space-y-2">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide block">
                Create Premium Chat Chamber
              </span>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="Group Title (e.g. Design Team)"
                  className="flex-1 bg-white border border-slate-200 outline-none px-2.5 py-1.5 text-xs text-slate-800 rounded-lg focus:border-sky-500 font-medium"
                />
                <button
                  onClick={createGroupChatObj}
                  className="bg-sky-500 hover:bg-sky-600 px-3.5 text-white font-extrabold text-[10px] rounded-lg tracking-wider cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Active Chats List */}
          <div className="flex-1 p-3 space-y-1">
            {chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              const title =
                chat.type === "group"
                  ? chat.name
                  : (Object.values(chat.nicknames || {}).find(
                      (n) => n !== myNeuralProfile?.nickname,
                    ) as string) || "Direct Chat";

              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`group w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? "bg-sky-50 border-sky-100 text-sky-500"
                      : "hover:bg-slate-50 border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isActive
                          ? "bg-sky-500/10 border-sky-300"
                          : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      {chat.type === "group" ? (
                        <Users
                          size={12}
                          className={
                            isActive ? "text-sky-500" : "text-slate-500"
                          }
                        />
                      ) : (
                        <MessageSquare
                          size={12}
                          className={
                            isActive ? "text-sky-500" : "text-slate-500"
                          }
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-bold tracking-tight truncate">
                      {title}
                    </span>
                  </div>

                  {/* Leave or Delete inline controls */}
                  {chat.type === "group" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrLeaveGroup(chat);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-lg transition-all cursor-pointer shrink-0"
                      title={
                        chat.createdBy === user.uid
                          ? "Dismantle Group"
                          : "Leave Group"
                      }
                    >
                      {chat.createdBy === user.uid ? (
                        <Trash2 size={11} />
                      ) : (
                        <LogOut size={11} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {chats.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-1.5 text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-wider">
                  No connections started
                </p>
                <p className="text-[9px] leading-relaxed">
                  Search users under the main tab and invite them to spark a
                  secure workspace interaction channel.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL CONTENT */}
        <div className="flex-1 flex flex-col bg-white">
          {/* USER DIRECTORY TAB */}
          {activeTab === "users" && !activeChat && (
            <div className="flex-1 p-6 md:p-8 flex flex-col space-y-6">
              {/* Discovery search filters */}
              <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-100 rounded-xl max-w-md">
                <input
                  type="text"
                  value={searchNickname}
                  onChange={(e) => setSearchNickname(e.target.value)}
                  placeholder="Real-time search nickname ID..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 px-3 font-semibold"
                />
              </div>

              {/* Users grid list */}
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 block pl-1">
                  GAMURA NETWORK DIRECTORY ({filteredUsers.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredUsers.map((u) => {
                    const isConnected = connections.some((c) =>
                      c.uids.includes(u.uid),
                    );
                    const hasIncoming = requests.some(
                      (r) => r.senderUid === u.uid,
                    );
                    const hasOutgoing = sentRequests.some(
                      (r) => r.receiverUid === u.uid,
                    );

                    return (
                      <div
                        key={u.uid}
                        className="relative p-5 rounded-2xl border border-slate-100 bg-white/90 hover:bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between space-y-5 group"
                      >
                        {/* Upper Section */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3.5">
                            {/* Profile Accent Initial */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-250 shadow-inner flex items-center justify-center font-extrabold text-slate-700 text-base">
                              {u.nickname.substring(0, 1).toUpperCase()}
                            </div>

                            {/* User details */}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                                @{u.nickname}
                                {isConnected && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                                    title="Connected"
                                  />
                                )}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 truncate uppercase tracking-widest">
                                ID: {u.uid.substring(0, 8)}
                              </span>
                            </div>
                          </div>

                          {/* Share / Copy identifier hook */}
                          <button
                            onClick={() => copyLink(u.nickname)}
                            className="p-2 text-slate-400 hover:text-sky-500 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-xs"
                            title="Copy connect link"
                          >
                            <Link size={12} />
                          </button>
                        </div>

                        {/* Mid Meta details */}
                        <div className="bg-slate-50/70 rounded-xl p-2.5 text-[9px] font-medium text-slate-500 border border-slate-100/60 flex items-center justify-between">
                          <span>Connection:</span>
                          <span
                            className={`font-bold uppercase tracking-wider ${
                              isConnected
                                ? "text-emerald-600"
                                : hasIncoming
                                  ? "text-amber-600"
                                  : hasOutgoing
                                    ? "text-blue-500"
                                    : "text-slate-400"
                            }`}
                          >
                            {isConnected
                              ? "Linked"
                              : hasIncoming
                                ? "Incoming Invite"
                                : hasOutgoing
                                  ? "Handshake Sent"
                                  : "Available"}
                          </span>
                        </div>

                        {/* Action buttons with high corporate finish */}
                        <div className="pt-1">
                          {isConnected ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startChat(u)}
                                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md hover:shadow-sky-500/10 active:scale-[0.99]"
                              >
                                <MessageSquare
                                  size={12}
                                  className="stroke-[2.5]"
                                />{" "}
                                Direct Workspace
                              </button>
                              <button
                                onClick={() =>
                                  removeConnection(u.uid, u.nickname)
                                }
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-150 rounded-xl transition-all duration-250 cursor-pointer text-xs flex items-center justify-center"
                                title="Disconnect / Dissolve Connection"
                              >
                                <Trash2 size={13} className="stroke-[2]" />
                              </button>
                            </div>
                          ) : hasIncoming ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  acceptRequest(
                                    requests.find((r) => r.senderUid === u.uid),
                                  )
                                }
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  rejectRequest(
                                    requests.find((r) => r.senderUid === u.uid),
                                  )
                                }
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200/50 rounded-xl text-[10.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-[0.99]"
                              >
                                Decline
                              </button>
                            </div>
                          ) : hasOutgoing ? (
                            <button
                              onClick={() =>
                                cancelRequest(
                                  sentRequests.find(
                                    (r) => r.receiverUid === u.uid,
                                  ),
                                )
                              }
                              className="w-full py-2.5 bg-amber-50 hover:bg-red-50 text-amber-700 hover:text-red-600 border border-amber-200 hover:border-red-100 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.99]"
                            >
                              Cancel Invitation
                            </button>
                          ) : (
                            <button
                              onClick={() => sendRequest(u)}
                              className="w-full py-2.5 bg-sky-50/50 hover:bg-sky-500 text-sky-600 hover:text-white border border-sky-100 hover:border-sky-500 rounded-xl text-[10.5px] font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-sm active:scale-[0.99]"
                            >
                              <Plus size={12} className="stroke-[2.5]" />{" "}
                              Request Handshake
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <div className="col-span-full py-16 text-center space-y-3.5 max-w-md mx-auto bg-slate-50/50 border border-slate-105 p-8 rounded-[2rem]">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mx-auto">
                        <Users size={18} className="text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                          {searchNickname
                            ? "No one found in this name"
                            : "Awaiting Planet Members"}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-normal font-bold uppercase">
                          {searchNickname
                            ? "Please verify spelling or connection signature and query again."
                            : "Share your Gamura namespace with colleagues to activate direct communication keys."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REQUESTS LIST TAB */}
          {activeTab === "requests" && !activeChat && (
            <div className="flex-1 p-6 md:p-8 space-y-6">
              {/* Incoming section */}
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3 pl-1">
                  Incoming Invitations ({requests.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-800 uppercase">
                          {req.senderNickname.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-950">
                            @{req.senderNickname}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Requesting connection link
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => acceptRequest(req)}
                          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[10px] rounded-lg tracking-wider cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(req)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-extrabold text-[10px] rounded-lg tracking-wider cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 bg-slate-50/20 rounded-2xl text-slate-400 text-[11px] font-bold uppercase col-span-full">
                      No incoming invitations pending
                    </div>
                  )}
                </div>
              </div>

              {/* Sent section */}
              <div className="pt-6 border-t border-slate-100">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3 pl-1">
                  Outgoing Invitations Sent
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase">
                          {req.receiverNickname
                            ? req.receiverNickname.substring(0, 1)
                            : "I"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-950">
                            @{req.receiverNickname || "User Link"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Waiting for response...
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelRequest(req)}
                        className="px-3 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                  {sentRequests.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 bg-slate-50/20 rounded-2xl text-slate-400 text-[11px] font-bold uppercase col-span-full">
                      No outgoing connection invitations sent
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CHAT WORKSPACE AREA */}
          {activeChat && (
            <div className="flex-1 flex flex-col h-full bg-slate-50/30">
              {/* Chat Title bar */}
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/50 flex items-center justify-center text-sky-500 font-extrabold text-[12px]">
                    {activeChat.type === "group" ? "G" : "D"}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                      {activeChat.type === "group"
                        ? activeChat.name
                        : (Object.values(activeChat.nicknames || {}).find(
                            (n) => n !== myNeuralProfile.nickname,
                          ) as string) || "Private Conversation"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Highly Secure Ephemeral Segment // Messages Auto-deleted
                        in 24 Hours
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeChat.type === "group" && (
                    <button
                      onClick={() =>
                        setShowAddMemberDropdown(!showAddMemberDropdown)
                      }
                      className={`p-1 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        showAddMemberDropdown
                          ? "bg-sky-500 text-white shadow-sm"
                          : "text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                      }`}
                    >
                      <Plus size={11} className="stroke-[2.5]" />
                      <span className="text-[10px] uppercase tracking-wider font-extrabold">
                        Members ({activeChat.members?.length || 1}/24)
                      </span>
                    </button>
                  )}

                  {activeChat.type === "group" && (
                    <button
                      onClick={() => deleteOrLeaveGroup(activeChat)}
                      className="p-1 px-2 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      title={
                        activeChat.createdBy === user.uid
                          ? "Delete Group"
                          : "Leave Group"
                      }
                    >
                      {activeChat.createdBy === user.uid ? (
                        <Trash2 size={11} />
                      ) : (
                        <LogOut size={11} />
                      )}
                      <span className="hidden sm:inline uppercase text-[9.5px] font-extrabold">
                        {activeChat.createdBy === user.uid ? "Delete" : "Leave"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveChat(null);
                      setShowAddMemberDropdown(false);
                    }}
                    className="p-1 px-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  >
                    Close Chat
                  </button>
                </div>
              </div>

              {/* Members Inviter Panel (rendered right below title bar inside workspace) */}
              {activeChat.type === "group" && showAddMemberDropdown && (
                <div className="bg-slate-50 border-b border-slate-100 p-4 space-y-4 animate-in fade-in duration-200 relative z-20">
                  {/* Current Active Group Members list with online status badges */}
                  <div className="space-y-2 pb-3 border-b border-slate-200/60">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                      Group Members & Status ({activeChat.members?.length || 1})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sortMembersByActiveStatus(
                        activeChat.members,
                        activeChat,
                      ).map((mUid: string) => {
                        const mProfile =
                          mUid === user.uid
                            ? { ...myNeuralProfile, uid: user.uid }
                            : allUsers.find((u: any) => u.uid === mUid);
                        const nicknameLabel = mProfile
                          ? `@${mProfile.nickname}`
                          : activeChat.nicknames?.[mUid]
                            ? `@${activeChat.nicknames[mUid]}`
                            : "Anonymous";
                        const status = getOnlineStatus(mProfile);
                        return (
                          <div
                            key={mUid}
                            className="flex items-center justify-between p-2 bg-white border border-slate-150 rounded-xl shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Avatar with status badge */}
                              <div className="relative shrink-0">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-black text-sky-600 text-[10px] uppercase">
                                  {nicknameLabel.substring(1, 2).toUpperCase()}
                                </div>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getStatusColorClass(status)}`}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10.5px] font-bold text-slate-800 truncate">
                                  {nicknameLabel}
                                  {mUid === user.uid && (
                                    <span className="text-[8px] font-sans text-sky-500 font-extrabold uppercase ml-1">
                                      (You)
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`text-[8px] font-mono tracking-wider font-extrabold uppercase ${
                                    status === "Active"
                                      ? "text-emerald-500 animate-pulse"
                                      : status === "Standby"
                                        ? "text-amber-500"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      Eligible Connected Workspace Profiles (
                      {connectedButNotInGroup.length})
                    </span>
                    <button
                      onClick={() => setShowAddMemberDropdown(false)}
                      className="text-[9px] font-black text-rose-500 uppercase hover:underline cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {connectedButNotInGroup.map((u) => (
                      <div
                        key={u.uid}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-sky-300 transition-all"
                      >
                        <span className="text-[11px] font-bold text-slate-800">
                          @{u.nickname}
                        </span>
                        <button
                          onClick={() => addMemberToGroup(u)}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                        >
                          Invite +
                        </button>
                      </div>
                    ))}
                    {connectedButNotInGroup.length === 0 && (
                      <div className="col-span-full py-2 text-center bg-white/70 rounded-xl border border-dashed border-slate-200">
                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider py-1.5 px-3">
                          No other connections to invite. Only mutual friends
                          can be added to standard groups.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Split Chat Hub + Members list panel */}
              <div className="flex-1 flex overflow-hidden">
                {/* Scrollable messages on left */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col bg-slate-50/50">
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center shadow-sm max-w-md mx-auto space-y-1">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest flex items-center justify-center gap-1">
                      🔒 Protected Uplink
                    </p>
                    <p className="text-[10px] text-slate-400 leading-normal font-bold">
                      To maintain extreme privacy and clean storage space, all
                      conversation history inside this Neutral Link chat room
                      automatically dissolves exactly 24 hours after being sent.
                    </p>
                  </div>

                  {messages.map((m, i) => {
                    const isMe = m.senderId === user.uid;
                    const timeStr = getRemainingTimeStr(m.ts);

                    return (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[75%] space-y-1.5 ${isMe ? "self-end" : "self-start"}`}
                      >
                        <span
                          className={`text-[9px] font-black tracking-wider text-slate-400 px-1 uppercase ${isMe ? "text-right" : "text-left"}`}
                        >
                          {m.senderName}
                        </span>
                        <div
                          className={`px-6 py-4.5 md:px-7 md:py-5 rounded-3xl shadow-[0_3px_12px_-5px_rgba(0,0,0,0.06)] text-xs md:text-[13.5px] font-medium leading-relaxed ${
                            isMe
                              ? "bg-sky-500 text-white rounded-tr-none"
                              : "bg-white border border-slate-150 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap tracking-wide">
                            {m.text}
                          </p>
                          <div className="flex items-center justify-between gap-6 pt-3 mt-3 border-t border-black/5 text-[9px] opacity-60">
                            <span className="font-mono uppercase tracking-wider font-semibold">
                              Expires in
                            </span>
                            <span className="font-extrabold uppercase font-mono tracking-wider">
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Right-hand Sidebar for Group Members */}
                {activeChat.type === "group" && (
                  <div className="w-56 border-l border-slate-150 bg-white p-4.5 hidden lg:flex flex-col space-y-4 shrink-0 overflow-y-auto">
                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                        Active Roster ({activeChat.members?.length || 1})
                      </h4>
                      <p className="text-[8.5px] text-slate-400 font-bold leading-normal uppercase">
                        Colleagues connected inside this safe segment.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {sortMembersByActiveStatus(
                        activeChat.members,
                        activeChat,
                      ).map((mUid: string) => {
                        const mProfile =
                          mUid === user.uid
                            ? { ...myNeuralProfile, uid: user.uid }
                            : allUsers.find((u: any) => u.uid === mUid);
                        const nicknameLabel = mProfile
                          ? `@${mProfile.nickname}`
                          : activeChat.nicknames?.[mUid]
                            ? `@${activeChat.nicknames[mUid]}`
                            : "Anonymous";
                        const status = getOnlineStatus(mProfile);
                        return (
                          <div key={mUid} className="flex items-center gap-2.5">
                            {/* Avatar with status badge */}
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-black text-sky-600 text-xs shadow-xs uppercase">
                                {nicknameLabel.substring(1, 2).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColorClass(status)}`}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-black text-slate-900 truncate leading-tight">
                                {nicknameLabel}
                                {mUid === user.uid && (
                                  <span className="text-[8.5px] font-sans text-sky-500 font-bold ml-0.5">
                                    (You)
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-[8.5px] font-mono tracking-wider font-extrabold uppercase ${
                                  status === "Active"
                                    ? "text-emerald-500 animate-pulse"
                                    : status === "Standby"
                                      ? "text-amber-500"
                                      : "text-slate-400"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Send message form */}
              <form
                onSubmit={sendMessage}
                className="p-4 px-6 border-t border-slate-100 bg-white"
              >
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl p-1.5 max-w-full focus-within:ring-4 focus-within:ring-sky-500/5 focus-within:border-sky-500 focus-within:bg-white transition-all">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a safe message..."
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 px-3 font-semibold h-9"
                  />
                  <button className="h-9 px-4 rounded-lg bg-sky-500 text-white text-[11px] font-extrabold uppercase tracking-wider hover:bg-sky-600 transition-all cursor-pointer">
                    Send Msg
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DEFAULT WELCOME SCREEN WHENEVER NO ACTIVE CHAT AND UNDER DISCOVERY */}
          {!activeChat &&
            activeTab === "users" &&
            !searchNickname &&
            filteredUsers.length > 0 && (
              <div className="p-6 md:p-8 bg-slate-50/40 border-t border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 bg-white rounded-full border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                  <Users size={16} className="text-slate-400" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Connect with multiple users like LinkedIn
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal uppercase">
                    Establish mutual handshakes across the decentralized
                    landscape. Request links, review received authorizations
                    under Pending Tab, and join collaborative Group rooms.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const GalaxyCoreView = () => {
  const [stats, setStats] = useState({
    cpu: 42,
    mem: 2.1,
    network: 85,
    latency: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        cpu: 35 + Math.floor(Math.random() * 25),
        mem: 2.0 + Math.random() * 0.4,
        network: 80 + Math.floor(Math.random() * 15),
        latency: 8 + Math.floor(Math.random() * 8),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-700 relative overflow-hidden p-8 shadow-2xl">
      <div className="ud-welcome-bg" />
      <div className="ud-welcome-grid absolute inset-0 opacity-10" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-700" />
          <div className="w-32 h-32 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl group-hover:scale-105 transition-transform duration-700">
            <Cpu
              size={64}
              className="text-cyan-400 animate-[pulse_4s_infinite]"
            />
            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-3xl animate-[spin_15s_linear_infinite]" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-4">
          Galaxy Core
        </h2>

        <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full mb-12">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
            Quantum Supremacy Stable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-4xl">
          {[
            {
              label: "Neural CPU",
              val: `${stats.cpu}%`,
              sub: "ACTIVE",
              icon: <Cpu size={14} />,
            },
            {
              label: "Sync Memory",
              val: `${stats.mem.toFixed(1)} GB`,
              sub: "VIRTUALIZED",
              icon: <Database size={14} />,
            },
            {
              label: "Mesh Bandwidth",
              val: `${stats.network} TB/s`,
              sub: "UPLINK",
              icon: <Globe size={14} />,
            },
            {
              label: "Core Latency",
              val: `${stats.latency} MS`,
              sub: "REAL-TIME",
              icon: <Activity size={14} />,
            },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 mb-4 group-hover:text-cyan-400 transition-colors">
                {s.icon}
              </div>
              <div className="text-2xl font-black text-white mb-1 tracking-tight">
                {s.val}
              </div>
              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                {s.label}
              </div>
              <div className="text-[7px] font-black text-cyan-500/60 uppercase tracking-widest mt-2">
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] max-w-sm text-center leading-relaxed">
          Gamura Universe centralized node management. All neural frequencies
          are synchronized across the distributed mesh.
        </p>
      </div>
    </div>
  );
};

const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(
    shorthandRegex,
    (m, r, g, b) => r + r + g + g + b + b,
  );
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "59, 130, 246";
};

const AuraSettingsView = ({
  onBack,
  showToast,
  user,
  userInfo,
  setCurrentUserInfo,
}: {
  onBack: () => void;
  showToast: any;
  user: any;
  userInfo: any;
  setCurrentUserInfo: any;
}) => {
  const [accent, setAccent] = useState(userInfo?.themeColor || "#0ea5e9"); // default sky-500
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { name: "Sky", hex: "#0ea5e9" },
    { name: "Cyan", hex: "#06b6d4" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Fuchsia", hex: "#d946ef" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Amber", hex: "#f59e0b" },
  ];

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { themeColor: accent });
      const updatedUserInfo = { ...userInfo, themeColor: accent };
      setCurrentUserInfo(updatedUserInfo);
      try {
        localStorage.setItem(
          `gamura_user_info_${user.uid}`,
          JSON.stringify(updatedUserInfo),
        );
      } catch (e) {}
      showToast(
        "🎨",
        "Theme Updated",
        "UI Accent Color applied across your interface.",
        "success",
      );
    } catch (e: any) {
      showToast("❌", "Save Failed", e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-[500px] bg-[#050810] flex flex-col items-center justify-center relative font-sans overflow-hidden animate-in fade-in duration-700 p-8">
      <div
        className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950/20 opacity-90 z-0"
        style={{ "--tw-gradient-to": `${accent}33` } as React.CSSProperties}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 z-0 animate-pulse" />

      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-2xl">
          <Settings className="w-8 h-8" style={{ color: accent }} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-[0.25em] uppercase font-sans">
            Aura <span style={{ color: accent }}>Theme</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            UI Color Customizer
          </p>
        </div>

        <div className="py-8 border-y border-white/10 relative overflow-hidden group space-y-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Select Primary Accent
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setAccent(c.hex)}
                className={`w-10 h-10 rounded-xl transition-all cursor-pointer shadow-lg ${accent === c.hex ? "scale-110 border-2 border-white ring-4 ring-white/20" : "border border-transparent hover:scale-105 opacity-80 hover:opacity-100"}`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 rounded-xl text-black text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: accent, opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? "Syncing..." : "Apply Identity Theme"}
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm mx-auto">
          Your selected frequency controls the interactive elements, glows, and
          core UI accents across your Gamura Universe dashboard.
        </p>

        <button
          onClick={onBack}
          className="mx-auto flex items-center justify-center gap-2 text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          Return to Console
        </button>
      </div>
    </div>
  );
};

const Deprecated_AuraSettingsView = ({
  onBack,
  showToast,
}: {
  onBack: () => void;
  showToast: any;
}) => {
  const [settings, setSettings] = useState<any>(null);
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [activeCount, setActiveCount] = useState(8);

  const [selectedPreset, setSelectedPreset] = useState<string>("starlight");
  const [primaryColor, setPrimaryColor] = useState<string>("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState<string>("#10b981");
  const [accentColor, setAccentColor] = useState<string>("#cbd5e1");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "system_configs", "aura_global"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings(data);
          if (!localSettings) setLocalSettings(data);
          if (data.themePreset) setSelectedPreset(data.themePreset);
          if (data.customPrimary) setPrimaryColor(data.customPrimary);
          if (data.customSecondary) setSecondaryColor(data.customSecondary);
          if (data.customAccent) setAccentColor(data.customAccent);
        } else {
          const defaults = {
            nexus: {
              active: true,
              speed: 85,
              depth: 3,
              protocol: "WebSocket RT",
            },
            velo: { active: true, speed: 92, cache: "L2", turbo: true },
            aura: {
              active: true,
              glow: 70,
              density: 55,
              theme: "Cinematic Dark",
            },
            zync: {
              active: true,
              freq: 60,
              conflict: "Auto-Resolve",
              live: true,
            },
            oryn: {
              active: true,
              sens: 75,
              algorithm: "A* Dynamic",
              predictive: true,
            },
            fluxe: { active: true, rate: 68, turb: 22, pattern: "Sine Wave" },
            kova: {
              active: true,
              shield: 90,
              layer: "Quantum Layer",
              auto: true,
            },
            lumis: {
              active: true,
              luminance: 78,
              adaptive: true,
              spectrum: "Full Spectrum",
            },
            universe: {
              active: true,
              fps: 60,
              renderMode: "GPU Accelerated",
              cdn: "HIGH",
              preload: true,
              animationQuality: "High",
              shader: true,
              volume: 60,
              spatial: true,
              memory: 512,
              gc: "Balanced",
              auth: "Token-Based",
              lock: true,
            },
            themePreset: "starlight",
            customPrimary: "#3b82f6",
            customSecondary: "#10b981",
            customAccent: "#cbd5e1",
          };
          setSettings(defaults);
          setLocalSettings(defaults);
          setDoc(doc(db, "system_configs", "aura_global"), defaults);
        }
      },
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (localSettings) {
      let count = 0;
      const keys = [
        "nexus",
        "velo",
        "aura",
        "zync",
        "oryn",
        "fluxe",
        "kova",
        "lumis",
      ];
      keys.forEach((k) => {
        if (localSettings[k]?.active) count++;
      });
      setActiveCount(count);
    }
  }, [localSettings]);

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...localSettings,
        themePreset: selectedPreset,
        customPrimary: primaryColor,
        customSecondary: secondaryColor,
        customAccent: accentColor,
      };
      await setDoc(doc(db, "system_configs", "aura_global"), dataToSave);
      showToast(
        "✓",
        "Systems Synced",
        "All neural configurations and theme modifications have been broadcast to the mesh.",
      );
    } catch (e: any) {
      showToast("❌", "Sync Failed", e.message);
    }
  };

  const handleReset = () => {
    const defaults = {
      nexus: { active: true, speed: 85, depth: 3, protocol: "WebSocket RT" },
      velo: { active: true, speed: 92, cache: "L2", turbo: true },
      aura: { active: true, glow: 70, density: 55, theme: "Cinematic Dark" },
      zync: { active: true, freq: 60, conflict: "Auto-Resolve", live: true },
      oryn: {
        active: true,
        sens: 75,
        algorithm: "A* Dynamic",
        predictive: true,
      },
      fluxe: { active: true, rate: 68, turb: 22, pattern: "Sine Wave" },
      kova: { active: true, shield: 90, layer: "Quantum Layer", auto: true },
      lumis: {
        active: true,
        luminance: 78,
        adaptive: true,
        spectrum: "Full Spectrum",
      },
      universe: {
        active: true,
        fps: 60,
        renderMode: "GPU Accelerated",
        cdn: "HIGH",
        preload: true,
        animationQuality: "High",
        shader: true,
        volume: 60,
        spatial: true,
        memory: 512,
        gc: "Balanced",
        auth: "Token-Based",
        lock: true,
      },
      themePreset: "starlight",
      customPrimary: "#3b82f6",
      customSecondary: "#10b981",
      customAccent: "#cbd5e1",
    };
    setLocalSettings(defaults);
    setSelectedPreset("starlight");
    setPrimaryColor("#3b82f6");
    setSecondaryColor("#10b981");
    setAccentColor("#cbd5e1");
    showToast(
      "↺",
      "Reset Complete",
      "Default system and theme values have been restored.",
    );
  };

  if (!localSettings)
    return (
      <div className="h-full flex items-center justify-center text-cyan-500 font-black animate-pulse uppercase tracking-[0.3em] font-sharetech">
        Initializing Neutral mesh...
      </div>
    );

  return (
    <div className="h-full bg-[#050810] flex flex-col relative font-rajdhani overflow-hidden animate-in fade-in duration-700">
      <style>{`
        :root {
          --aura-primary: ${primaryColor};
          --aura-secondary: ${secondaryColor};
          --aura-accent: ${accentColor};
          --aura-primary-rgb: ${hexToRgb(primaryColor)};
          --aura-secondary-rgb: ${hexToRgb(secondaryColor)};
          --aura-accent-rgb: ${hexToRgb(accentColor)};
        }

        /* Live overrides of standard static classes throughout the Aura setting page and dashboard view */
        .text-blue-500 { color: var(--aura-primary) !important; }
        .text-blue-400 { color: var(--aura-primary) !important; }
        .bg-blue-500\/5 { background-color: rgba(var(--aura-primary-rgb), 0.05) !important; }
        .bg-blue-500\/10 { background-color: rgba(var(--aura-primary-rgb), 0.1) !important; }
        .bg-blue-500\/15 { background-color: rgba(var(--aura-primary-rgb), 0.15) !important; }
        .border-blue-500\/10 { border-color: rgba(var(--aura-primary-rgb), 0.1) !important; }
        .border-blue-500\/20 { border-color: rgba(var(--aura-primary-rgb), 0.2) !important; }
        .hover\:border-blue-500\/30:hover { border-color: rgba(var(--aura-primary-rgb), 0.3) !important; }
        .shadow-blue-500\/40 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.4) !important; }
        .shadow-blue-500\/30 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.3) !important; }
        .shadow-blue-500\/20 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.2) !important; }
        .bg-gradient-to-br.from-blue-500.to-cyan-400 {
          background-image: linear-gradient(135deg, var(--aura-primary), var(--aura-accent)) !important;
        }

        .text-green-500 { color: var(--aura-secondary) !important; }
        .text-green-400 { color: var(--aura-secondary) !important; }
        .bg-green-500\/5 { background-color: rgba(var(--aura-secondary-rgb), 0.05) !important; }
        .bg-green-500\/10 { background-color: rgba(var(--aura-secondary-rgb), 0.1) !important; }
        .bg-green-500\/15 { background-color: rgba(var(--aura-secondary-rgb), 0.15) !important; }
        .border-green-500\/10 { border-color: rgba(var(--aura-secondary-rgb), 0.1) !important; }
        .border-green-500\/20 { border-color: rgba(var(--aura-secondary-rgb), 0.2) !important; }
        .hover\:border-green-500\/30:hover { border-color: rgba(var(--aura-secondary-rgb), 0.3) !important; }

        .text-yellow-500 { color: var(--aura-accent) !important; }
        .text-yellow-400 { color: var(--aura-accent) !important; }
        .bg-yellow-500\/5 { background-color: rgba(var(--aura-accent-rgb), 0.05) !important; }
        .bg-yellow-500\/10 { background-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .bg-yellow-500\/15 { background-color: rgba(var(--aura-accent-rgb), 0.15) !important; }
        .border-yellow-500\/10 { border-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .border-yellow-500\/20 { border-color: rgba(var(--aura-accent-rgb), 0.2) !important; }
        .hover\:border-yellow-500\/30:hover { border-color: rgba(var(--aura-accent-rgb), 0.3) !important; }

        .text-red-500 { color: var(--aura-accent) !important; }
        .text-red-400 { color: var(--aura-accent) !important; }
        .bg-red-500\/5 { background-color: rgba(var(--aura-accent-rgb), 0.05) !important; }
        .bg-red-500\/10 { background-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .bg-red-500\/15 { background-color: rgba(var(--aura-accent-rgb), 0.15) !important; }
        .border-red-500\/10 { border-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .border-red-500\/20 { border-color: rgba(var(--aura-accent-rgb), 0.2) !important; }
        .hover\:border-red-500\/30:hover { border-color: rgba(var(--aura-accent-rgb), 0.3) !important; }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .aura-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(var(--aura-primary-rgb),0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--aura-primary-rgb),0.04) 1px, transparent 1px) !important;
          background-size: 40px 40px;
          z-index: 0;
          animation: gridPulse 8s ease-in-out infinite;
        }
        .aura-scan::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--aura-primary), transparent) !important;
          z-index: 50;
          animation: scanLine 4s linear infinite;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="aura-bg aura-scan absolute inset-0 pointer-events-none" />

      {/* WRAPPER */}
      <div className="relative z-10 flex flex-col h-full max-w-[1100px] mx-auto w-full px-4 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between py-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-500 font-sharetech text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border border-white/10 rounded hover:border-blue-500 transition-all shadow hover:shadow-blue-500/10"
            >
              <ArrowLeft size={12} /> GAMURA
            </button>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-500 animate-[gearSpin_12s_linear_infinite]" />
              <div>
                <h2 className="font-orbitron text-base font-black text-white tracking-[0.2em] uppercase">
                  AURA <span className="text-blue-500">SETTINGS</span>
                </h2>
              </div>
              <div className="font-sharetech text-[9px] text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded tracking-[0.1em]">
                v2.4.1
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="font-orbitron text-[9px] font-black text-black bg-gradient-to-br from-blue-500 to-cyan-400 px-4 py-2 rounded tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-500/30"
          >
            SAVE ALL
          </button>
        </div>

        {/* STATUS BAR */}
        <div className="flex items-center gap-4 p-2 bg-blue-500/5 border border-white/5 rounded-lg mb-4 font-sharetech text-[9px] tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[dotPulse_2s_infinite] shadow-[0_0_8px_#22c55e]" />
            <span className="text-zinc-500 uppercase">
              SYSTEM <span className="text-green-500">ONLINE</span>
            </span>
          </div>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-500 uppercase">
            GAMURA CORE <span className="text-green-500">ACTIVE</span>
          </span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-500 uppercase">
            FEATURES <span className="text-green-500">{activeCount}/8</span>{" "}
            OPTIMIZED
          </span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-16 space-y-4 font-sans">
          {/* THEME SPECTRAL DESIGN */}
          <section className="border border-white/5 bg-white/[0.01] rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-blue-500 font-sharetech text-[9px] tracking-[0.3em] uppercase border border-blue-500/20 bg-blue-500/5 px-3 py-0.5 rounded">
                THEME SPECTRAL DESIGN
              </div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {[
                {
                  id: "cyberpunk",
                  name: "Cyberpunk Neon",
                  primary: "#ff007f",
                  secondary: "#00f0ff",
                  accent: "#9d4edd",
                  desc: "High-voltage pink, cyan, and purple matrix.",
                },
                {
                  id: "starlight",
                  name: "Starlight Drift",
                  primary: "#3b82f6",
                  secondary: "#10b981",
                  accent: "#cbd5e1",
                  desc: "Deep space telemetry blueprint slate.",
                },
                {
                  id: "void",
                  name: "Cosmic Void",
                  primary: "#8b5cf6",
                  secondary: "#ea580c",
                  accent: "#0d9488",
                  desc: "Matter-antimatter debris orange and violet.",
                },
              ].map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      setPrimaryColor(preset.primary);
                      setSecondaryColor(preset.secondary);
                      setAccentColor(preset.accent);
                      showToast(
                        "🔮",
                        "Theme Loaded",
                        `Loaded preset ${preset.name} into the buffer.`,
                      );
                    }}
                    className={`text-left p-2.5 rounded-lg border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-20 cursor-pointer ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_12px_rgba(var(--aura-primary-rgb),0.15)]"
                        : "bg-black/30 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-sharetech text-[10px] tracking-wider text-white uppercase font-black">
                          {preset.name}
                        </span>
                        {isActive && (
                          <span className="text-[7.5px] font-mono border border-blue-500/30 text-blue-400 bg-blue-500/15 px-1 py-0.5 rounded uppercase leading-none">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] text-zinc-500 uppercase mt-0.5 leading-tight truncate">
                        {preset.desc}
                      </p>
                    </div>

                    {/* Miniature preview swatches */}
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase">
                          {preset.primary}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase">
                          {preset.secondary}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase">
                          {preset.accent}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers Panel */}
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-sharetech text-[10px] text-white uppercase tracking-wider">
                  SPECTRAL COMPONENT MODULATORS
                </span>
                {selectedPreset === "custom" ? (
                  <span className="text-[7.5px] font-mono border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase font-black">
                    CUSTOM
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedPreset("custom")}
                    className="text-[7.5px] font-mono transition-colors border border-white/10 hover:border-white/20 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-black cursor-pointer leading-none"
                  >
                    Unlock Matrix Config
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. PRIMARY */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 border border-white/20 rounded-md overflow-hidden shrink-0 shadow cursor-pointer">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setSelectedPreset("custom");
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                    <div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-sharetech">
                        PRIMARY
                      </div>
                      <div className="font-mono text-white text-[9px] uppercase mt-0.5">
                        {primaryColor}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={primaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("#") && val.length <= 7) {
                        setPrimaryColor(val);
                        setSelectedPreset("custom");
                      } else if (!val.startsWith("#") && val.length <= 6) {
                        setPrimaryColor("#" + val);
                        setSelectedPreset("custom");
                      }
                    }}
                    className="w-14 bg-black/60 border border-white/10 text-center text-[9px] p-0.5 font-mono uppercase text-white rounded focus:border-blue-500"
                  />
                </div>

                {/* 2. SECONDARY */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 border border-white/20 rounded-md overflow-hidden shrink-0 shadow cursor-pointer">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          setSelectedPreset("custom");
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                    <div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-sharetech">
                        SECONDARY
                      </div>
                      <div className="font-mono text-white text-[9px] uppercase mt-0.5">
                        {secondaryColor}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={secondaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("#") && val.length <= 7) {
                        setSecondaryColor(val);
                        setSelectedPreset("custom");
                      } else if (!val.startsWith("#") && val.length <= 6) {
                        setSecondaryColor("#" + val);
                        setSelectedPreset("custom");
                      }
                    }}
                    className="w-14 bg-black/60 border border-white/10 text-center text-[9px] p-0.5 font-mono uppercase text-white rounded focus:border-blue-500"
                  />
                </div>

                {/* 3. ACCENT */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 border border-white/20 rounded-md overflow-hidden shrink-0 shadow cursor-pointer">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedPreset("custom");
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                    <div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-sharetech">
                        ACCENT
                      </div>
                      <div className="font-mono text-white text-[9px] uppercase mt-0.5">
                        {accentColor}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={accentColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("#") && val.length <= 7) {
                        setAccentColor(val);
                        setSelectedPreset("custom");
                      } else if (!val.startsWith("#") && val.length <= 6) {
                        setAccentColor("#" + val);
                        setSelectedPreset("custom");
                      }
                    }}
                    className="w-14 bg-black/60 border border-white/10 text-center text-[9px] p-0.5 font-mono uppercase text-white rounded focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-blue-500 font-sharetech text-[11px] tracking-[0.3em] uppercase border border-blue-500/20 bg-blue-500/5 px-4 py-1 rounded">
                8 FEATURE OPTIMIZATION
              </div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. NEXUS */}
              <AuraFeatureCard
                title="NEXUS"
                sub="Connection Core"
                icon="🔗"
                color="red"
                active={localSettings.nexus.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    nexus: { ...localSettings.nexus, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Connection Speed"
                  val={localSettings.nexus.speed}
                  color="red"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      nexus: { ...localSettings.nexus, speed: v },
                    })
                  }
                />
                <AuraSliderRow
                  label="Link Depth"
                  val={localSettings.nexus.depth}
                  color="red"
                  min={1}
                  max={10}
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      nexus: { ...localSettings.nexus, depth: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Protocol
                  </div>
                  <select
                    value={localSettings.nexus.protocol}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        nexus: {
                          ...localSettings.nexus,
                          protocol: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-red-500 transition-colors"
                  >
                    <option>WebSocket RT</option>
                    <option>P2P Mesh</option>
                    <option>Relay Bridge</option>
                  </select>
                </div>
              </AuraFeatureCard>

              {/* 2. VELO */}
              <AuraFeatureCard
                title="VELO"
                sub="Velocity Engine"
                icon="⚡"
                color="blue"
                active={localSettings.velo.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    velo: { ...localSettings.velo, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Render Speed"
                  val={localSettings.velo.speed}
                  color="blue"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      velo: { ...localSettings.velo, speed: v },
                    })
                  }
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    Cache Level
                  </span>
                  <div className="flex gap-1">
                    {["L1", "L2", "L3", "L4"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            velo: { ...localSettings.velo, cache: lvl },
                          })
                        }
                        className={`w-8 h-8 rounded flex items-center justify-center font-sharetech text-[10px] border transition-all ${localSettings.velo.cache === lvl ? "bg-blue-500 border-blue-500 text-black shadow-lg shadow-blue-500/20" : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    Turbo Boost
                  </span>
                  <AuraToggle
                    active={localSettings.velo.turbo}
                    color="blue"
                    onToggle={(val) =>
                      setLocalSettings({
                        ...localSettings,
                        velo: { ...localSettings.velo, turbo: val },
                      })
                    }
                  />
                </div>
              </AuraFeatureCard>

              {/* 3. AURA */}
              <AuraFeatureCard
                title="AURA"
                sub="Visual Identity"
                icon="✨"
                color="yellow"
                active={localSettings.aura.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    aura: { ...localSettings.aura, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Glow Intensity"
                  val={localSettings.aura.glow}
                  color="yellow"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      aura: { ...localSettings.aura, glow: v },
                    })
                  }
                />
                <AuraSliderRow
                  label="Particle Density"
                  val={localSettings.aura.density}
                  color="yellow"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      aura: { ...localSettings.aura, density: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Theme Mode
                  </div>
                  <select
                    value={localSettings.aura.theme}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        aura: { ...localSettings.aura, theme: e.target.value },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-yellow-500 transition-colors"
                  >
                    <option>Cinematic Dark</option>
                    <option>Neon Surge</option>
                    <option>Cosmic Void</option>
                  </select>
                </div>
              </AuraFeatureCard>

              {/* 4. ZYNC */}
              <AuraFeatureCard
                title="ZYNC"
                sub="Sync Protocol"
                icon="🔄"
                color="green"
                active={localSettings.zync.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    zync: { ...localSettings.zync, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Sync Frequency"
                  val={localSettings.zync.freq}
                  color="green"
                  max={120}
                  suffix="hz"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      zync: { ...localSettings.zync, freq: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Conflict Mode
                  </div>
                  <select
                    value={localSettings.zync.conflict}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        zync: {
                          ...localSettings.zync,
                          conflict: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-green-500 transition-colors"
                  >
                    <option>Auto-Resolve</option>
                    <option>Manual</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    Live Sync
                  </span>
                  <AuraToggle
                    active={localSettings.zync.live}
                    color="green"
                    onToggle={(val) =>
                      setLocalSettings({
                        ...localSettings,
                        zync: { ...localSettings.zync, live: val },
                      })
                    }
                  />
                </div>
              </AuraFeatureCard>

              {/* 5. ORYN */}
              <AuraFeatureCard
                title="ORYN"
                sub="Orbit Navigator"
                icon="🎯"
                color="blue"
                active={localSettings.oryn.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    oryn: { ...localSettings.oryn, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Nav Sensitivity"
                  val={localSettings.oryn.sens}
                  color="blue"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      oryn: { ...localSettings.oryn, sens: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Path Algorithm
                  </div>
                  <select
                    value={localSettings.oryn.algorithm}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        oryn: {
                          ...localSettings.oryn,
                          algorithm: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-blue-500 transition-colors"
                  >
                    <option>A* Dynamic</option>
                    <option>Dijkstra</option>
                    <option>Orbital Flow</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    Predictive Mode
                  </span>
                  <AuraToggle
                    active={localSettings.oryn.predictive}
                    color="blue"
                    onToggle={(val) =>
                      setLocalSettings({
                        ...localSettings,
                        oryn: { ...localSettings.oryn, predictive: val },
                      })
                    }
                  />
                </div>
              </AuraFeatureCard>

              {/* 6. FLUXE */}
              <AuraFeatureCard
                title="FLUXE"
                sub="Dynamic Flow"
                icon="🌊"
                color="red"
                active={localSettings.fluxe.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    fluxe: { ...localSettings.fluxe, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Flow Rate"
                  val={localSettings.fluxe.rate}
                  color="red"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      fluxe: { ...localSettings.fluxe, rate: v },
                    })
                  }
                />
                <AuraSliderRow
                  label="Turbulence"
                  val={localSettings.fluxe.turb}
                  color="red"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      fluxe: { ...localSettings.fluxe, turb: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Wave Pattern
                  </div>
                  <select
                    value={localSettings.fluxe.pattern}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        fluxe: {
                          ...localSettings.fluxe,
                          pattern: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-red-500 transition-colors"
                  >
                    <option>Sine Wave</option>
                    <option>Chaos Flow</option>
                    <option>Laminar</option>
                  </select>
                </div>
              </AuraFeatureCard>

              {/* 7. KOVA */}
              <AuraFeatureCard
                title="KOVA"
                sub="Armor Shield"
                icon="🛡️"
                color="yellow"
                active={localSettings.kova.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    kova: { ...localSettings.kova, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Shield Strength"
                  val={localSettings.kova.shield}
                  color="yellow"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      kova: { ...localSettings.kova, shield: v },
                    })
                  }
                />
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Defense Layer
                  </div>
                  <select
                    value={localSettings.kova.layer}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        kova: { ...localSettings.kova, layer: e.target.value },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-yellow-500 transition-colors"
                  >
                    <option>Quantum Layer</option>
                    <option>Plasma Barrier</option>
                    <option>Neural Guard</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    Auto-Protect
                  </span>
                  <AuraToggle
                    active={localSettings.kova.auto}
                    color="yellow"
                    onToggle={(val) =>
                      setLocalSettings({
                        ...localSettings,
                        kova: { ...localSettings.kova, auto: val },
                      })
                    }
                  />
                </div>
              </AuraFeatureCard>

              {/* 8. LUMIS */}
              <AuraFeatureCard
                title="LUMIS"
                sub="Light Intelligence"
                icon="💡"
                color="green"
                active={localSettings.lumis.active}
                onToggle={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    lumis: { ...localSettings.lumis, active: val },
                  })
                }
              >
                <AuraSliderRow
                  label="Luminance"
                  val={localSettings.lumis.luminance}
                  color="green"
                  suffix="%"
                  onChange={(v) =>
                    setLocalSettings({
                      ...localSettings,
                      lumis: { ...localSettings.lumis, luminance: v },
                    })
                  }
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs tracking-wider uppercase font-rajdhani">
                    AI Adapt
                  </span>
                  <AuraToggle
                    active={localSettings.lumis.adaptive}
                    color="green"
                    onToggle={(val) =>
                      setLocalSettings({
                        ...localSettings,
                        lumis: { ...localSettings.lumis, adaptive: val },
                      })
                    }
                  />
                </div>
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-sharetech mb-2">
                    Spectrum Mode
                  </div>
                  <select
                    value={localSettings.lumis.spectrum}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        lumis: {
                          ...localSettings.lumis,
                          spectrum: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-black/80 border border-white/10 rounded p-2 text-white text-xs font-rajdhani focus:border-green-500 transition-colors"
                  >
                    <option>Full Spectrum</option>
                    <option>Warm Glow</option>
                    <option>Cold Arc</option>
                    <option>Pulse</option>
                  </select>
                </div>
              </AuraFeatureCard>
            </div>
          </section>

          {/* UNIVERSE SECTION */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-yellow-500 font-sharetech text-[9px] tracking-[0.3em] uppercase border border-yellow-500/20 bg-yellow-500/5 px-3 py-0.5 rounded">
                UNIVERSE PAGE OPTIMIZATION
              </div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-black p-4 border border-blue-500/10 rounded-xl relative overflow-hidden group">
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 font-orbitron text-[32px] font-black text-blue-500/[0.02] rotate-90 pointer-events-none select-none">
                UNIVERSE
              </div>

              <div className="flex items-start justify-between mb-3 relative z-10">
                <div>
                  <h3 className="font-orbitron text-sm font-bold text-white tracking-widest uppercase">
                    <span className="text-red-500">GA</span>
                    <span className="text-blue-500">M</span>
                    <span className="text-green-500">UR</span>
                    <span className="text-yellow-500">A</span> UNIVERSE
                  </h3>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                    Global page rendering & performance controls
                  </div>
                </div>
                <AuraToggle
                  active={localSettings.universe.active}
                  color="green"
                  onToggle={(val) =>
                    setLocalSettings({
                      ...localSettings,
                      universe: { ...localSettings.universe, active: val },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                {/* Render */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    🌐 PAGE RENDER
                  </div>
                  <AuraSliderRow
                    label="FPS Target"
                    val={localSettings.universe.fps}
                    color="blue"
                    min={30}
                    max={144}
                    suffix="fps"
                    onChange={(v) =>
                      setLocalSettings({
                        ...localSettings,
                        universe: { ...localSettings.universe, fps: v },
                      })
                    }
                  />
                  <div className="mt-2">
                    <div className="text-[8px] text-zinc-500 uppercase font-sharetech mb-1">
                      Render Mode
                    </div>
                    <select
                      value={localSettings.universe.renderMode}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: {
                            ...localSettings.universe,
                            renderMode: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded p-1.5 text-white text-[10px] font-rajdhani focus:border-blue-500 transition-colors"
                    >
                      <option>GPU Accelerated</option>
                      <option>CPU Fallback</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Network */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    📡 NETWORK
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      CDN Priority
                    </span>
                    <select
                      value={localSettings.universe.cdn}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: {
                            ...localSettings.universe,
                            cdn: e.target.value,
                          },
                        })
                      }
                      className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-sharetech outline-none"
                    >
                      <option>LOW</option>
                      <option>MED</option>
                      <option>HIGH</option>
                      <option>ULTRA</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Preload Assets
                    </span>
                    <AuraToggle
                      active={localSettings.universe.preload}
                      color="blue"
                      onToggle={(val) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: { ...localSettings.universe, preload: val },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Visuals */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    🎨 VISUALS
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Animation Quality
                    </span>
                    <select
                      value={localSettings.universe.animationQuality}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: {
                            ...localSettings.universe,
                            animationQuality: e.target.value,
                          },
                        })
                      }
                      className="bg-black border border-white/10 text-white text-[9px] px-1.5 py-0.5  rounded font-rajdhani outline-none"
                    >
                      <option>Ultra</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Shader Effects
                    </span>
                    <AuraToggle
                      active={localSettings.universe.shader}
                      color="blue"
                      onToggle={(val) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: { ...localSettings.universe, shader: val },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Audio */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    🔊 AUDIO
                  </div>
                  <AuraSliderRow
                    label="Master Volume"
                    val={localSettings.universe.volume}
                    color="blue"
                    suffix="%"
                    onChange={(v) =>
                      setLocalSettings({
                        ...localSettings,
                        universe: { ...localSettings.universe, volume: v },
                      })
                    }
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Spatial Audio
                    </span>
                    <AuraToggle
                      active={localSettings.universe.spatial}
                      color="blue"
                      onToggle={(val) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: { ...localSettings.universe, spatial: val },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Performance */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    ⚡ PERFORMANCE
                  </div>
                  <AuraSliderRow
                    label="Memory Limit"
                    val={localSettings.universe.memory}
                    color="blue"
                    min={128}
                    max={2048}
                    step={128}
                    suffix="mb"
                    onChange={(v) =>
                      setLocalSettings({
                        ...localSettings,
                        universe: { ...localSettings.universe, memory: v },
                      })
                    }
                  />
                  <div className="mt-2">
                    <div className="text-[8px] text-zinc-500 uppercase font-sharetech mb-1">
                      GC Strategy
                    </div>
                    <select
                      value={localSettings.universe.gc}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: {
                            ...localSettings.universe,
                            gc: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded p-1.5 text-white text-[10px] font-rajdhani outline-none"
                    >
                      <option>Aggressive</option>
                      <option>Balanced</option>
                      <option>Conservative</option>
                    </select>
                  </div>
                </div>

                {/* Security */}
                <div className="p-3 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg hover:border-blue-500/20 transition-all">
                  <div className="font-sharetech text-[9px] text-blue-500 uppercase tracking-widest mb-2">
                    🔐 SECURITY
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Auth Mode
                    </span>
                    <select
                      value={localSettings.universe.auth}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: {
                            ...localSettings.universe,
                            auth: e.target.value,
                          },
                        })
                      }
                      className="bg-black border border-white/10 text-white text-[9px] px-1.5 py-0.5 rounded font-rajdhani outline-none"
                    >
                      <option>Token-Based</option>
                      <option>OAuth2</option>
                      <option>Biometric</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px] uppercase font-rajdhani">
                      Auto-Lock
                    </span>
                    <AuraToggle
                      active={localSettings.universe.lock}
                      color="blue"
                      onToggle={(val) =>
                        setLocalSettings({
                          ...localSettings,
                          universe: { ...localSettings.universe, lock: val },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pb-12">
            <button
              onClick={handleReset}
              className="font-orbitron text-[9px] font-black text-red-500 bg-red-500/5 border border-red-500/20 px-4 py-2 rounded tracking-[0.2em] uppercase hover:bg-red-500/10 transition-all"
            >
              RESET DEFAULTS
            </button>
            <button
              onClick={handleSave}
              className="font-orbitron text-[9px] font-black text-black bg-gradient-to-br from-green-500 to-emerald-400 px-5 py-2 rounded tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-md shadow-green-500/20"
            >
              APPLY & OPTIMIZE
            </button>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between py-6 border-t border-white/5 font-sharetech text-[10px] tracking-[0.3em] text-zinc-600 mt-auto uppercase">
            <div className="flex items-center gap-4">
              <span className="text-zinc-500">GAMURA UNIVERSE</span>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>MESH STATUS: STABLE</span>
            </div>
            <div>v2.4.1 — SYNCED</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuraFeatureCard = ({
  title,
  sub,
  icon,
  color,
  active,
  onToggle,
  children,
}: any) => {
  const colorMap: any = {
    red: "border-red-500/20 hover:border-red-500/40 from-red-500",
    blue: "border-blue-500/20 hover:border-blue-500/40 from-blue-500",
    green: "border-green-500/20 hover:border-green-500/40 from-green-500",
    yellow: "border-yellow-500/20 hover:border-yellow-500/40 from-yellow-500",
  };

  const iconBgMap: any = {
    red: "bg-red-500/15 border-red-500/30",
    blue: "bg-blue-500/15 border-blue-500/30",
    green: "bg-green-500/15 border-green-500/30",
    yellow: "bg-yellow-500/15 border-yellow-500/30",
  };

  const borderAccentMap: any = {
    red: "text-red-500",
    blue: "text-blue-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
  };

  return (
    <div
      className={`p-3 bg-[#0d1428]/80 border ${colorMap[color]} rounded-lg relative overflow-hidden transition-all group backdrop-blur-md`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-current to-transparent ${borderAccentMap[color]}`}
      />

      <div className="flex items-center justify-between mb-2 relative z-10 font-sans">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs border shrink-0 ${iconBgMap[color]}`}
          >
            {icon}
          </div>
          <div>
            <h4 className="font-orbitron text-[10px] font-black text-white tracking-widest leading-none uppercase">
              {title}
            </h4>
            <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
              {sub}
            </div>
          </div>
        </div>
        <AuraToggle active={active} color={color} onToggle={onToggle} />
      </div>

      <div className="h-px bg-white/5 mb-2 relative z-10" />

      <div className="space-y-2 relative z-10">{children}</div>
    </div>
  );
};

const AuraSliderRow = ({
  label,
  val,
  color,
  suffix = "",
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: any) => {
  const accentMap: any = {
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  const textAccentMap: any = {
    red: "text-red-500",
    blue: "text-blue-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
  };

  return (
    <div className="space-y-1 font-sans">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-zinc-550 tracking-wider uppercase font-rajdhani font-medium">
          {label}
        </span>
        <span
          className={`font-sharetech text-[8px] px-1.5 py-0.5 rounded border leading-none font-bold ${accentMap[color]}`}
        >
          {val}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer custom-range ${textAccentMap[color]}`}
      />
    </div>
  );
};

const AuraToggle = ({ active, color, onToggle }: any) => {
  const trackMap: any = {
    red: active
      ? "bg-red-500/20 border-red-500"
      : "bg-zinc-800 border-zinc-700",
    blue: active
      ? "bg-blue-500/20 border-blue-500"
      : "bg-zinc-800 border-zinc-700",
    green: active
      ? "bg-green-500/20 border-green-500"
      : "bg-zinc-800 border-zinc-700",
    yellow: active
      ? "bg-yellow-500/20 border-yellow-500"
      : "bg-zinc-800 border-zinc-700",
  };

  const thumbMap: any = {
    red: active ? "bg-red-500 shadow-[0_0_6px_#ef4444]" : "bg-zinc-500",
    blue: active ? "bg-blue-500 shadow-[0_0_6px_#3b82f6]" : "bg-zinc-500",
    green: active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-zinc-500",
    yellow: active ? "bg-yellow-500 shadow-[0_0_6px_#eab308]" : "bg-zinc-500",
  };

  return (
    <button
      onClick={() => onToggle(!active)}
      className={`relative w-7 h-4 rounded-full border transition-all duration-300 shrink-0 ${trackMap[color]}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform duration-300 ${thumbMap[color]} ${active ? "translate-x-3" : ""}`}
      />
    </button>
  );
};

const FeaturePipelineView = ({
  features,
  user,
  db,
  addActivity,
  showToast,
}: {
  features: any[];
  user: any;
  db: any;
  addActivity: any;
  showToast: any;
}) => {
  const statuses = ["Proposed", "Dev", "Review", "Testing", "Live"];

  const handleAddFeature = async () => {
    const name = prompt("Enter new feature name:");
    if (!name || !user) return;
    try {
      await setDoc(doc(db, "features", name), {
        name,
        status: "Proposed",
        progress: 0,
        color: "violet",
        order: features.length + 1,
        timestamp: serverTimestamp(),
        createdBy: user.uid,
      });
      addActivity(`Proposed feature: ${name}`, "💡");
      showToast(
        "💡",
        "Proposal Synchronized",
        `${name} is now in the roadmap.`,
      );
    } catch (e: any) {
      showToast("❌", "Sync Error", e.message);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "features", id), { status: newStatus });
      addActivity(`Feature moved to ${newStatus}`, "🔄");
    } catch (e: any) {
      showToast("❌", "Move Error", e.message);
    }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm(`Permanently terminate project ${id}?`)) return;
    try {
      await deleteDoc(doc(db, "features", id));
      addActivity(`Terminated feature: ${id}`, "🗑️");
      showToast(
        "🗑️",
        "Feature Removed",
        "The project has been purged from the pipeline.",
      );
    } catch (e: any) {
      showToast("❌", "Delete Failed", e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">
              Neural Roadmap Live
            </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Universe{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              Pipeline
            </span>
          </h2>
        </div>
        <button
          onClick={handleAddFeature}
          className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all duration-500"
        >
          <div className="p-1 bg-black text-white rounded-lg">
            <Plus size={14} strokeWidth={3} />
          </div>
          New Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statuses.map((status, sIndex) => {
          const items = features.filter((f) => f.status === status);
          return (
            <div
              key={status}
              className="flex flex-col bg-zinc-900/40 border border-white/5 rounded-2xl min-h-[450px] backdrop-blur-md group/col hover:border-white/10 transition-colors"
            >
              <div className="p-6 pb-2 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 group-hover/col:text-white transition-colors">
                    {status}
                  </span>
                  <div className="h-0.5 w-6 bg-cyan-500 mt-1 opacity-20 group-hover/col:opacity-100 transition-all rounded-full" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-zinc-500">
                  {items.length}
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {items.length > 0 ? (
                  items.map((f, i) => (
                    <motion.div
                      key={f.id || i}
                      layoutId={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + sIndex * 0.1 }}
                      className="p-5 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-cyan-500/40 group transition-all cursor-pointer relative overflow-hidden backdrop-blur-3xl shadow-xl"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-tight">
                          {f.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFeature(f.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 transition-colors group-hover:text-zinc-400">
                          <span>
                            Lvl{" "}
                            {f.progress >= 100
                              ? "MAX"
                              : Math.floor(f.progress / 10)}
                          </span>
                          <span>{f.progress}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.progress}%` }}
                            className={`h-full bg-gradient-to-r from-cyan-600 to-cyan-400`}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {[1, 2].map((x) => (
                            <div
                              key={x}
                              className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[6px] font-black text-zinc-500"
                            >
                              <User size={8} />
                            </div>
                          ))}
                        </div>
                        {status !== "Live" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(
                                f.id,
                                statuses[statuses.indexOf(status) + 1],
                              );
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all"
                          >
                            Next Stage
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-white/10 rounded-[1.5rem]">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">
                      Standby
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeaturesView = ({
  onBack,
  loaderImgSources,
  showToast,
}: {
  onBack: () => void;
  loaderImgSources: string[];
  showToast: any;
}) => {
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      "🚀",
      "Proposal Received",
      "User innovation data has been synced to the neural network for review.",
    );
    setShowProposeModal(false);
    setProposalTitle("");
    setProposalDesc("");
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-black/40 border border-white/5 flex flex-col p-8 backdrop-blur-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700 shadow-2xl">
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={12} /> Return
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProposeModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 text-black font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            <Plus size={12} /> Propose Feature
          </button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            System Features
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          {
            title: "Aerospace Grid Systems",
            subtitle: "Orbitron & Rajdhani Alignment",
            icon: Sun,
            text: "Aesthetics powered by premium futuristic type pairings. Sharp lines, elegant borders, glowing modules, and high contrast cyber interfaces.",
          },
          {
            title: "Interactive Particle field",
            subtitle: "Warp Starfields Canvas",
            icon: Star,
            text: "Runs responsive custom renders calculated using high frequency state update arrays to adapt perfectly to window resize margins.",
          },
          {
            title: "Quantum Telemetry API",
            subtitle: "BuBuBai Multi-Engine Integrations",
            icon: Terminal,
            text: "Access high-performance neural modules capable of parsing inputs, formulating code, and keeping logs secure via advanced FireStore patterns.",
          },
          {
            title: "Galaxy Connectivity",
            subtitle: "Mesh Resource Allocation",
            icon: Network,
            text: "Distributed client-side rendering engine bringing ultra-responsive interfaces to any portal with sub-millisecond response.",
          },
          {
            title: "Direct Neural Link",
            subtitle: "Encrypted Nickname Uplink",
            icon: Cpu,
            text: "Connect with others using unique nicknames. Shared channels and temporary hubs allow for frictionless cosmic collaboration.",
          },
          {
            title: "Aura Modulation",
            subtitle: "Global Real-time Controls",
            icon: Zap,
            text: "Fine-tune the universe speed, density and visual themes instantly through the Aura Settings interface.",
          },
        ].map((feat, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/5 p-6 hover:border-cyan-500/20 transition-all duration-300 backdrop-blur-md space-y-3"
          >
            <div className="w-10 h-10 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
              <feat.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[8px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">
                {feat.subtitle}
              </span>
              <h3 className="font-black text-sm text-white uppercase mt-1">
                {feat.title}
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
              {feat.text}
            </p>
          </div>
        ))}
      </div>

      {/* Removed Visual Assets & Signals as requested */}

      {/* PROPOSE MODAL */}
      <AnimatePresence>
        {showProposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handlePropose} className="p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none mb-2">
                    Propose Innovation
                  </h2>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    Share your vision for the Gamura Universe
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Feature Name
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                      placeholder="e.g. Neural Visualization Hub"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      System Description
                    </label>
                    <textarea
                      required
                      value={proposalDesc}
                      onChange={(e) => setProposalDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                      placeholder="Explain the functional benefits..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProposeModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-black text-[9px] rounded-xl uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-cyan-500 text-black font-black text-[9px] rounded-xl uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                  >
                    Send Protocol
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Notification {
  id: string;
  msg: string;
  ic: string;
  time?: string;
  timestamp: any;
  unread: boolean;
}

const UsersView = ({
  db,
  currentUser,
  showToast,
  presenceData = {},
  addActivity,
  initialFilter = "all",
  onBack,
}: {
  db: any;
  currentUser: any;
  showToast: any;
  presenceData?: Record<string, any>;
  addActivity: any;
  initialFilter: "all" | "active";
  onBack: () => void;
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "active" | "admins">(
    initialFilter,
  );
  const [search, setSearch] = useState("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users"),
      orderBy("lastLogin", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Client-side sort by lastLogin to avoid index requirement
        list.sort((a: any, b: any) => {
          const getT = (val: any) => {
            if (!val) return 0;
            if (val.toMillis) return val.toMillis();
            if (val instanceof Date) return val.getTime();
            if (val.toDate) return val.toDate().getTime();
            return Number(val) || 0;
          };
          return getT(b.lastLogin) - getT(a.lastLogin);
        });
        setUsersList(list);
        setLoading(false);
      },
      (err) => {
        console.error("Users list query err:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [currentUser, db]);

  useEffect(() => {
    setFilterMode(initialFilter);
  }, [initialFilter]);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeThreshold = 5 * 60 * 1000;

  const getUserStatus = (u: any) => {
    const isOnline = presenceData?.[u.id]?.online;
    if (isOnline) {
      return {
        label: "ACTIVE",
        active: true,
        color:
          "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_8px_rgba(16,185,129,0.1)] animate-pulse",
      };
    }

    if (!u.lastLogin)
      return {
        label: "OFFLINE",
        active: false,
        color: "text-zinc-550 border-white/5 bg-black/20",
      };
    
    let t = 0;
    if (u.lastLogin.toDate) t = u.lastLogin.toDate().getTime();
    else if (u.lastLogin instanceof Date) t = u.lastLogin.getTime();
    else t = new Date(u.lastLogin).getTime();

    const isActive = currentTime - t < activeThreshold;
    if (isActive) {
      return {
        label: "STANDBY",
        active: false,
        color: "text-amber-500 border-amber-500/20 bg-amber-500/5",
      };
    }
    return {
      label: "OFFLINE",
      active: false,
      color: "text-zinc-550 border-white/5 bg-black/20",
    };
  };

  const getFilteredUsers = () => {
    return usersList.filter((u) => {
      const matchesSearch =
        (u.uid && u.uid.toLowerCase().includes(search.toLowerCase())) ||
        (u.username &&
          u.username.toLowerCase().includes(search.toLowerCase())) ||
        (u.nickname &&
          u.nickname.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      const status = getUserStatus(u);
      if (filterMode === "active") {
        return status.active;
      } else if (filterMode === "admins") {
        return (
          u.role === "admin" ||
          u.email === "gamuragalaxy@gmail.com" ||
          u.email === "selvaranjancg@gmail.com"
        );
      }
      return true;
    });
  };

  const currentCount = usersList.length;
  const activeCount = usersList.filter((u) => getUserStatus(u).active).length;

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(
      "📋",
      "ID Copied",
      `Copied user identifier to clipboard.`,
      "success",
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePing = (targetUser: any) => {
    setPingingId(targetUser.uid);
    showToast(
      "📡",
      "Pinging Node",
      `Broadcasting sync signal to node G-ID:${targetUser.uid.substring(0, 6).toUpperCase()}...`,
    );
    setTimeout(async () => {
      setPingingId(null);
      const latency = Math.floor(Math.random() * 60) + 12;
      showToast(
        "⚡",
        "Signal Sync Successful",
        `Node responded in ${latency}ms. Connection strength 100%.`,
        "success",
      );
      addActivity(
        `Pinged user node ${targetUser.nickname || targetUser.username} (${targetUser.uid.substring(0, 6)})`,
        "📡",
      );

      // Add real-time notification to the target user
      if (currentUser && targetUser.uid !== currentUser.uid) {
        try {
          const senderName =
            currentUser.nickname || currentUser.username || "A user";
          await setDoc(
            doc(collection(db, `users/${targetUser.uid}/notifications`)),
            {
              msg: `📡 ${senderName} pinged your node. Latency: ${latency}ms`,
              ic: "📡",
              timestamp: serverTimestamp(),
              read: false,
            },
          );
        } catch (e) {
          // ignore error if they don't have permissions
        }
      }
    }, 1200);
  };

  const filtered = getFilteredUsers();
  const currentLoggedInUserDoc = usersList.find(
    (u) => u.uid === currentUser?.uid,
  );
  const isAdmin =
    currentUser &&
    ((currentLoggedInUserDoc && currentLoggedInUserDoc.role === "admin") ||
      currentUser.email === "gamuragalaxy@gmail.com" ||
      currentUser.email === "selvaranjancg@gmail.com");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div
            onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-cyan-400 font-sharetech text-[10px] tracking-[0.2em] uppercase cursor-pointer select-none transition-colors"
          >
            <ArrowLeft size={12} /> BACK TO ANALYTICS
          </div>
          <h2 className="font-orbitron text-xl font-black text-white tracking-[0.15em] uppercase mt-1">
            NEURAL{" "}
            <span className="text-cyan-400 font-bold">USERS DIRECTORY</span>
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            Real-time synchronization matrix monitoring active core node
            connections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-2.5 flex flex-col items-center min-w-[100px]">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-sharetech">
              REGISTRATION CORES
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5">
              {currentCount}
            </span>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-2.5 flex flex-col items-center min-w-[100px] relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-emerald-500/50" />
            <span className="text-[8px] text-emerald-500 uppercase tracking-widest font-sharetech flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />{" "}
              ACTIVE NODES
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="FILTER BY USER ID, NICKNAME, EMAIL OR HANDLE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/30 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder:text-zinc-600 tracking-wider focus:outline-none focus:border-cyan-500/30 uppercase"
          />
        </div>

        <div className="flex bg-black/30 border border-white/5 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: "all", label: "ALL USERS", count: currentCount },
            { id: "active", label: "LIVE NODES", count: activeCount },
            {
              id: "admins",
              label: "OPERATORS",
              count: usersList.filter(
                (u) =>
                  u.role === "admin" ||
                  u.email === "gamuragalaxy@gmail.com" ||
                  u.email === "selvaranjancg@gmail.com",
              ).length,
            },
          ].map((tab) => {
            const isActive = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                    : "text-zinc-500 border border-transparent hover:text-zinc-300"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono leading-none ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/5 text-zinc-650"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 font-sharetech uppercase tracking-[0.3em] animate-pulse">
            Accessing centralized user schemas...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-black/10">
          <div className="text-zinc-500 text-3xl mb-2">🛸</div>
          <h3 className="font-orbitron text-xs font-black text-white tracking-widest uppercase mb-1">
            No Sync Logs Found
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-relaxed">
            Try expanding search query parameters or modifying selection
            filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u, index) => {
            const status = getUserStatus(u);
            const isCurrentUser = currentUser && currentUser.uid === u.uid;
            return (
              <div
                key={u.id}
                className={`p-4 rounded-xl flex flex-col justify-between border hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden group ${
                  isCurrentUser
                    ? "bg-cyan-500/[0.02] border-cyan-500/20"
                    : "bg-[#0a0f1d]/40 border-white/5"
                }`}
              >
                {isCurrentUser && (
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent" />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">
                        G-NODE:0X{u.uid?.substring(0, 6).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isCurrentUser && (
                        <span className="text-[8px] font-black border border-cyan-500/20 text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                      <span
                        className={`text-[8px] font-mono uppercase border px-1.5 py-0.5 rounded font-black tracking-widest ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-11 h-11 rounded-xl overflow-hidden border bg-zinc-900 ${
                          status.active
                            ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "border-white/10"
                        }`}
                      >
                        {u.photoURL || u.avatarUrl ? (
                          <img
                            src={u.photoURL || u.avatarUrl}
                            className="w-full h-full object-cover"
                            alt="User Avatar"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs font-black uppercase font-orbitron">
                            {(u.nickname || u.username || "A").charAt(0)}
                          </div>
                        )}
                      </div>
                      {status.active && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#050810] animate-ping" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-orbitron text-[11px] font-black text-white uppercase tracking-wider truncate leading-tight">
                        {u.nickname || "Anonymous Explorer"}
                      </div>
                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 truncate">
                        @{u.username || "explorer"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg space-y-1.5 font-mono text-[9px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 uppercase shrink-0">
                        USER ID (UID)
                      </span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-zinc-300 select-text cursor-text truncate font-semibold">
                          {u.uid}
                        </span>
                        <button
                          onClick={() => handleCopy(u.uid)}
                          className="text-zinc-500 hover:text-cyan-400 p-0.5 rounded cursor-pointer shrink-0 transition-colors"
                        >
                          {copiedId === u.uid ? (
                            <Check size={10} className="text-emerald-500" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 uppercase shrink-0">
                        NET EMAIL
                      </span>
                      <span className="text-zinc-300 select-text cursor-text truncate font-semibold">
                        {u.email || "NO_EMAIL"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between items-center text-[8px] uppercase tracking-wider">
                      <span className="text-zinc-500">CONNECTION PULSE</span>
                      <span className="text-zinc-400 font-mono">
                        {u.lastLogin
                          ? u.lastLogin.toDate
                            ? u.lastLogin.toDate().toLocaleString()
                            : new Date(u.lastLogin).toLocaleString()
                          : "NEVER"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[8px] uppercase tracking-wider">
                      <span className="text-zinc-500">NODE DISCOVERY</span>
                      <span className="text-zinc-400 font-mono">
                        {u.createdAt
                          ? u.createdAt.toDate
                            ? u.createdAt.toDate().toLocaleDateString()
                            : new Date(u.createdAt).toLocaleDateString()
                          : "UNKNOWN"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePing(u)}
                    disabled={pingingId === u.uid}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 rounded-md text-[8px] font-black text-zinc-400 hover:text-cyan-400 uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {pingingId === u.uid ? (
                      <>
                        <RefreshCw size={9} className="animate-spin" />{" "}
                        PINGING...
                      </>
                    ) : (
                      <>
                        <Zap size={9} /> PING NODE
                      </>
                    )}
                  </button>

                  {isAdmin && u.uid !== currentUser?.uid && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-md text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      title="Purge User Node"
                    >
                      <Trash2 size={9} />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(u.uid)}
                    className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/15 rounded-md text-[8px] font-black text-cyan-400 uppercase tracking-widest transition-all cursor-pointer"
                  >
                    COPY ID
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[500] flex items-center justify-center p-4 font-sans"
            onClick={() => setUserToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-md bg-[#0a0f1d] border border-red-500/25 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* High Contrast Red Laser Accent */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-orbitron text-xs font-black text-white tracking-[0.15em] uppercase">
                    PURGE USER NODE?
                  </h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                    You are initiating system purging protocol for node
                    alignment. This operation cannot be undone.
                  </p>
                </div>
              </div>

              {/* Target Details Panel */}
              <div className="mt-6 p-4 bg-black/45 border border-white/5 rounded-xl space-y-3 font-mono text-[10px]">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-zinc-500 uppercase tracking-wider">
                    Target Identifier
                  </span>
                  <span className="text-red-400 font-bold">
                    @{userToDelete.username || "explorer"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-zinc-500 uppercase tracking-wider">
                    Nickname
                  </span>
                  <span className="text-zinc-200 font-bold">
                    {userToDelete.nickname || "Anonymous"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-zinc-500 uppercase tracking-wider">
                    Registered Email
                  </span>
                  <span className="text-zinc-200 truncate max-w-[200px] font-bold">
                    {userToDelete.email || "NO_EMAIL"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 uppercase tracking-wider">
                    User ID (UID)
                  </span>
                  <span className="text-zinc-450 tracking-wider text-[9px] font-bold select-all">
                    {userToDelete.uid}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 hover:bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  ABORT SEQUENCE
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      // Delete user document from Firestore users collection
                      await deleteDoc(doc(db, "users", userToDelete.id));
                      addActivity(
                        `Purged user node ${userToDelete.nickname || userToDelete.username} (${userToDelete.uid?.substring(0, 6)})`,
                        "🗑️",
                      );
                      showToast(
                        "🗑️",
                        "Node Purged",
                        `User @${userToDelete.username || "explorer"} has been completely deleted.`,
                        "success",
                      );
                    } catch (err: any) {
                      console.error("Purging failed", err);
                      showToast(
                        "❌",
                        "Purge Failed",
                        err.message ||
                          "An error occurred during database purging.",
                        "error",
                      );
                    } finally {
                      setIsDeleting(false);
                      setUserToDelete(null);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-black font-black font-orbitron text-[9px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={10} className="animate-spin" /> PURGING...
                    </>
                  ) : (
                    <>CONFIRM PURGE</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UniverseDashboard = ({
  onBack,
  isLoggedIn,
  onConnect,
  user,
  userInfo,
  setCurrentUserInfo,
  setCurrentPage,
  isDark,
  setIsDark,
  loaderImgSources,
  gamuraAccounts,
  setEmail,
  setUsername,
  setShowDeleteConfirm,
  setShowSignOutConfirm,
}: {
  onBack: () => void;
  isLoggedIn: boolean;
  onConnect: () => void;
  user: any;
  userInfo: any;
  setCurrentUserInfo: any;
  setCurrentPage: (p: any) => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  loaderImgSources: string[];
  gamuraAccounts: any[];
  setEmail: (val: string) => void;
  setUsername: (val: string) => void;
  setShowDeleteConfirm: (val: boolean) => void;
  setShowSignOutConfirm: (val: boolean) => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Analytics");
  const [quickAddText, setQuickAddText] = useState("");
  const [quickPriority, setQuickPriority] = useState("Medium");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState(new Date());
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(
    null,
  );
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(userInfo?.username || "");
  const [newNickname, setNewNickname] = useState(userInfo?.nickname || "");
  const [newBio, setNewBio] = useState(userInfo?.bio || "");
  const [newAvatar, setNewAvatar] = useState(userInfo?.avatarUrl || "");
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectImage, setProjectImage] = useState("");
  const [sortActiveFirst, setSortActiveFirst] = useState(false);

  // Derive display name and ID early for scope safety
  const displayName =
    userInfo?.username || user?.displayName || "SELVARANJAN G";
  const gamuraId = userInfo?.username
    ? `@${userInfo.username.toUpperCase()}`
    : user
      ? `GM-${user.uid.substring(0, 8).toUpperCase()}`
      : "G-ID-UNSET";

  // Calculate if the user can change their Gamura ID handle (once per year restriction)
  const isUsernameLocked = useMemo(() => {
    const lastChange = userInfo?.lastUidChange;
    if (!lastChange) return false;
    const lastChangeMs =
      typeof lastChange === "number"
        ? lastChange
        : lastChange.toMillis
          ? lastChange.toMillis()
          : lastChange.seconds
            ? lastChange.seconds * 1000
            : 0;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return Date.now() - lastChangeMs < oneYearMs;
  }, [userInfo]);

  const nextAllowedDateStr = useMemo(() => {
    const lastChange = userInfo?.lastUidChange;
    if (!lastChange) return "";
    const lastChangeMs =
      typeof lastChange === "number"
        ? lastChange
        : lastChange.toMillis
          ? lastChange.toMillis()
          : lastChange.seconds
            ? lastChange.seconds * 1000
            : 0;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return new Date(lastChangeMs + oneYearMs).toLocaleDateString();
  }, [userInfo]);

  const [loginCount, setLoginCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [platformStats, setPlatformStats] = useState({ mobile: 60, desktop: 30, tablet: 10 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [neuralProfiles, setNeuralProfiles] = useState<Record<string, string>>({});
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(6);
  const [activityFilter, setActivityFilter] = useState<"mine" | "global">(
    "mine",
  );
  const [globalConnections, setGlobalConnections] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [presenceData, setPresenceData] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [totalTelemetry, setTotalTelemetry] = useState<number | null>(null);
  const [avgLoadTime, setAvgLoadTime] = useState("1.2s");

  useEffect(() => {
    // calculate load time once on mount
    if (typeof window !== "undefined" && window.performance) {
      setTimeout(() => {
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (navEntry) {
           const loadTimeMs = navEntry.loadEventEnd - navEntry.startTime;
           if (loadTimeMs > 0) {
              setAvgLoadTime((loadTimeMs / 1000).toFixed(2) + "s");
           }
        }
      }, 0);
    }
    
    let unsub = () => {};
    if (user && activityFilter === "mine") {
      unsub = onSnapshot(doc(db, "activityLogs", user.uid), (docS) => {
        if (docS.exists()) setTotalTelemetry(docS.data().totalActions || 0);
        else setTotalTelemetry(0);
      });
    } else {
      setTotalTelemetry(null); // Fallback to length or other metric for global
    }
    return () => unsub();
  }, [user, activityFilter, db]);

  useEffect(() => {
    // Manage Connection Status
    const connectedRef = ref(rtdb, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
       setIsConnected(snap.val() === true);
    });

    const listRef = ref(rtdb, "/presence");
    const unsub = onValue(listRef, (snap) => {
      const data = snap.val() || {};
      setPresenceData(data);
    });
    
    // Broadcasts Listener
    const broadcastsQuery = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(1));
    let initialBroadcastLoad = true;
    const unsubBroadcasts = onSnapshot(broadcastsQuery, (snap) => {
      if (initialBroadcastLoad) {
        initialBroadcastLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.senderUid !== user?.uid) {
            showToast("📡", "GLOBAL BROADCAST", `${data.message}`);
          }
        }
      });
    });
    
    return () => {
      unsub();
      unsubConn();
      unsubBroadcasts();
    };
  }, [user, db, showToast]);

  const activitySummary = useMemo(() => {
    if (activities.length === 0) {
      return { total: 0, mostFrequent: "No Event Recorded", maxCount: 0, trendStr: "0%", trendDir: "neutral" };
    }
    const counts: Record<string, number> = {};
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    let lastHourCount = 0;
    let prevHourCount = 0;

    activities.forEach((act) => {
      let type = "System Events";
      const ic = act.ic || "⚡";
      const titleLower = (act.title || act.action || "").toLowerCase();

      if (act.timestamp) {
        const ts = act.timestamp?.toMillis ? act.timestamp.toMillis() : new Date(act.timestamp).getTime();
        const diff = now - ts;
        if (diff <= oneHourMs) lastHourCount++;
        else if (diff <= oneHourMs * 2) prevHourCount++;
      }

      if (
        ic === "🔑" ||
        titleLower.includes("login") ||
        titleLower.includes("auth") ||
        titleLower.includes("sign")
      ) {
        type = "Security & Auth";
      } else if (
        ic === "🔗" ||
        ic === "🧬" ||
        titleLower.includes("connect") ||
        titleLower.includes("link")
      ) {
        type = "Connections";
      } else if (
        ic === "🚀" ||
        ic === "🐙" ||
        titleLower.includes("publish") ||
        titleLower.includes("deploy") ||
        titleLower.includes("sync")
      ) {
        type = "Deployments";
      } else if (
        ic === "📝" ||
        titleLower.includes("register") ||
        titleLower.includes("profile") ||
        titleLower.includes("update")
      ) {
        type = "Identities";
      } else if (
        ic === "⚡" ||
        titleLower.includes("signal") ||
        titleLower.includes("broadcast") ||
        titleLower.includes("task")
      ) {
        type = "Mesh Signals";
      } else if (titleLower.includes("feature")) {
        type = "Feature Ships";
      }
      counts[type] = (counts[type] || 0) + 1;
    });

    let mostFrequent = "System Events";
    let maxCount = 0;
    Object.entries(counts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = type;
      }
    });

    let trendStr = "";
    let trendDir = "neutral";
    if (prevHourCount > 0) {
      const pct = Math.round(((lastHourCount - prevHourCount) / prevHourCount) * 100);
      trendStr = `${pct > 0 ? "+" : ""}${pct}%`;
      trendDir = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
    } else if (lastHourCount > 0) {
      trendStr = "+100%";
      trendDir = "up";
    } else {
      trendStr = "0%";
      trendDir = "neutral";
    }

    return {
      total: activities.length,
      mostFrequent,
      maxCount,
      trendStr,
      trendDir
    };
  }, [activities]);

  const activitiesOverLast7Days = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateKey = d.toDateString();
      days.push({
        name: dayName,
        dateKey: dateKey,
        count: 0,
      });
    }

    activities.forEach((act) => {
      let actDate: Date | null = null;
      if (act.timestamp) {
        if (typeof act.timestamp.toDate === "function") {
          actDate = act.timestamp.toDate();
        } else if (act.timestamp instanceof Date) {
          actDate = act.timestamp;
        } else if (
          typeof act.timestamp === "string" ||
          typeof act.timestamp === "number"
        ) {
          actDate = new Date(act.timestamp);
        }
      }

      if (actDate) {
        const actDateKey = actDate.toDateString();
        const match = days.find((day) => day.dateKey === actDateKey);
        if (match) {
          match.count += 1;
        }
      } else {
        days[6].count += 1;
      }
    });

    return days;
  }, [activities]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleActivitiesCount((prev) => prev + 10);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [activities, activityFilter]);

  const [toasts, setToasts] = useState<any[]>([]);

  const [themeColors, setThemeColors] = useState({
    preset: "starlight",
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#cbd5e1",
  });

  const [dbToken, setDbToken] = useState(
    () => localStorage.getItem("gamura_github_token") || "",
  );
  const [dbRepo, setDbRepo] = useState(
    () => localStorage.getItem("gamura_github_repo") || "my-web-portfolio",
  );
  const [dbCommitMsg, setDbCommitMsg] = useState(
    "Pipeline: sync portfolio build",
  );
  const [dbStatus, setDbStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
    url?: string;
  }>({ type: "idle" });

  useEffect(() => {
    localStorage.setItem("gamura_github_token", dbToken);
  }, [dbToken]);

  useEffect(() => {
    localStorage.setItem("gamura_github_repo", dbRepo);
  }, [dbRepo]);

  const handleDashboardPublishGithub = async () => {
    const token = dbToken.trim();
    const repo = dbRepo.trim();
    const commitMsg = dbCommitMsg.trim() || "Pipeline sync portfolio build";

    if (!token) {
      setDbStatus({
        type: "error",
        message: "Please provide a valid GitHub Personal Access Token.",
      });
      return;
    }
    if (!repo) {
      setDbStatus({
        type: "error",
        message: "Please specify a repository name.",
      });
      return;
    }

    setDbStatus({ type: "loading", message: "Connecting via Octokit..." });

    try {
      const octokit = new Octokit({ auth: token });

      // 1. Authenticate user
      const { data: userData } = await octokit.rest.users.getAuthenticated();
      const username = userData.login;

      setDbStatus({
        type: "loading",
        message: `Authenticated as @${username}. Seeking repo...`,
      });

      // 2. Repo lookup/creation
      let repoData;
      try {
        const { data: existingRepo } = await octokit.rest.repos.get({
          owner: username,
          repo: repo,
        });
        repoData = existingRepo;
      } catch (repoErr: any) {
        if (repoErr.status === 404) {
          setDbStatus({
            type: "loading",
            message: `Repo "${repo}" not found. Creating repo...`,
          });
          const { data: newRepo } =
            await octokit.rest.repos.createForAuthenticatedUser({
              name: repo,
              description:
                "Personal web portfolio compiled on Gamura Engine Studio.",
              private: false,
              auto_init: false,
            });
          repoData = newRepo;
        } else {
          throw repoErr;
        }
      }

      setDbStatus({
        type: "loading",
        message: "Generating bundle archive package...",
      });

      // 3. Compile portfolio HTML
      const saved = localStorage.getItem("portfolio_system");
      let portfolioData = DEFAULT_PORTFOLIO;
      if (saved) {
        try {
          portfolioData = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      const liveHTML = generatePortfolioHTML(portfolioData, false);

      // Check if index.html already exists to obtain SHA
      let existingSha: string | undefined = undefined;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner: username,
          repo: repo,
          path: "index.html",
        });
        if (!Array.isArray(fileData) && fileData.type === "file") {
          existingSha = fileData.sha;
        }
      } catch (fileErr: any) {
        if (fileErr.status !== 404) {
          console.warn("Failed checking index.html metadata", fileErr);
        }
      }

      // Safe base64 encode supporting Unicode characters
      const b64Data = btoa(unescape(encodeURIComponent(liveHTML)));

      setDbStatus({
        type: "loading",
        message: "Transmitting payload to index.html...",
      });

      // 4. Create or update file content
      const { data: commitResponse } =
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: username,
          repo: repo,
          path: "index.html",
          message: commitMsg,
          content: b64Data,
          sha: existingSha,
        });

      const fileUrl = `https://github.com/${username}/${repo}/blob/${repoData.default_branch || "main"}/index.html`;

      showToast(
        "🐙",
        "Pipeline Connected",
        `Pushed latest build to ${repo}!`,
        "success",
      );

      setDbStatus({
        type: "success",
        message: `Compiled & Synchronized with absolute success! Repository active on: github.com/${username}/${repo}. Remember to activate GitHub Pages under Repo Settings -> Pages to enable instant hosting!`,
        url: repoData.html_url,
      });

      if (addActivity) {
        addActivity(
          `Synchronized portfolio payload with GitHub (${repo})`,
          "🐙",
        );
      }
    } catch (err: any) {
      setDbStatus({
        type: "error",
        message:
          err.message ||
          "An unexpected error occurred during GitHub transition.",
      });
    }
  };

  function showToast(
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) {
    const id = Date.now();
    let deducedType: "success" | "error" | "info" | "warning" = type || "info";
    if (!type) {
      const lowerTitle = title.toLowerCase();
      const lowerContent = content ? content.toLowerCase() : "";
      if (
        ic === "❌" ||
        ic === "🚫" ||
        ic === "🚫" ||
        lowerTitle.includes("fail") ||
        lowerTitle.includes("error") ||
        lowerTitle.includes("denied")
      ) {
        deducedType = "error";
      } else if (
        ic === "✅" ||
        ic === "✓" ||
        lowerTitle.includes("success") ||
        lowerTitle.includes("successful") ||
        lowerTitle.includes("complete") ||
        lowerTitle.includes("linked") ||
        lowerTitle.includes("ready")
      ) {
        deducedType = "success";
      } else if (ic === "⚠️") {
        deducedType = "warning";
      } else {
        deducedType = "info";
      }
    }
    // Backward compatibility for templates using msg instead of content
    setToasts((prev) => [
      ...prev,
      { id, ic, title, content, msg: content, type: deducedType },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const exportTelemetryData = () => {
    try {
      const csvRows = [];
      csvRows.push(["Timestamp", "Action", "Icon"]);
      
      activities.forEach((act) => {
        const ts = act.timestamp?.toDate ? act.timestamp.toDate().toISOString() : new Date(act.timestamp || Date.now()).toISOString();
        const action = `"${(act.title || act.action || "").replace(/"/g, '""')}"`;
        const icon = act.ic || "";
        csvRows.push([ts, action, icon].join(","));
      });
      
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `telemetry_export_${new Date().toISOString().split("T")[0]}.csv`);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast("📥", "Export Successful", "Telemetry data exported to CSV.");
      addActivity("Exported telemetry data to CSV", "📥");
    } catch (err) {
      console.error("Export failed", err);
      showToast("❌", "Export Failed", "Could not generate CSV file.");
    }
  };

  const addActivity = async (
    title: string,
    ic: string = "⚡",
    priority: string = "Medium",
    dueDate: string = "",
  ) => {
    if (!user) return; // Guard against unauthenticated writes
    try {
      await setDoc(doc(collection(db, "activities")), {
        title,
        ic,
        timestamp: serverTimestamp(),
        user: displayName,
        userId: user.uid,
        priority,
        dueDate,
      });
    } catch (e) {
      console.error("Failed to add activity", e);
    }
  };

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickAddText.trim() || !user) return;

    try {
      await setDoc(doc(collection(db, "broadcasts")), {
        message: quickAddText.trim(),
        senderUid: user.uid,
        timestamp: serverTimestamp(),
      });
      
      const icon = quickAddText.toLowerCase().includes("note") ? "📝" : "✅";
      await addActivity(quickAddText.trim(), icon);
      setQuickAddText("");
      setQuickPriority("Medium");
      setQuickDueDate("");
      showToast("⚡", "Broadcast Synced", "Signal sent to all active nodes.");
    } catch(err) {
      console.error("Failed to broadcast", err);
    }
  };

  const addNotification = async (msg: string, ic: string = "⚡") => {
    if (!user) return;
    try {
      await setDoc(doc(collection(db, `users/${user.uid}/notifications`)), {
        msg,
        ic,
        unread: true,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to add notification", e);
    }
  };

  useEffect(() => {
    // Stats listener
    const statsRef = doc(db, "system", "stats");
    const unsubStats = onSnapshot(
      statsRef,
      (doc) => {
        if (doc.exists()) {
          const d = doc.data();
          setLoginCount(d.loginCount || 0);
          setTotalUsersCount(d.totalUsers || 0);
          
          let m = d.mobileCount || 0;
          let dt = d.desktopCount || 0;
          let t = d.tabletCount || 0;
          const total = m + dt + t;
          
          if (total > 0) {
            setPlatformStats({
              mobile: Math.round((m/total)*100),
              desktop: Math.round((dt/total)*100),
              tablet: Math.round((t/total)*100)
            });
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, "system/stats"),
    );

    // Users listener (Loads all registered users)
    let unsubUsers = () => {};
    if (user) {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("lastLogin", "desc"),
        limit(100),
      );
      unsubUsers = onSnapshot(
        usersQuery,
        (snap) => {
          const usersList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Client-side sort
          usersList.sort((a: any, b: any) => {
            const getT = (val: any) => {
              if (!val) return 0;
              if (val.toMillis) return val.toMillis();
              if (val instanceof Date) return val.getTime();
              if (val.toDate) return val.toDate().getTime();
              return Number(val) || 0;
            };
            return getT(b.lastLogin) - getT(a.lastLogin);
          });
          setAllUsers(usersList);
          setRecentUsers(usersList.slice(0, 5));
          if (totalUsersCount === 0 && usersList.length > 0) {
            setTotalUsersCount(usersList.length);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, "users"),
      );
    }

    // Features listener
    const featQuery = query(
      collection(db, "features"),
      orderBy("order", "asc"),
    );
    const unsubFeat = onSnapshot(
      featQuery,
      (snap) => {
        if (snap.empty && user) {
          // Seed initial features if empty (Requires auth to write)
          const initialFeatures = [
            {
              name: "BuBuBai",
              status: "Dev",
              progress: 55,
              color: "violet",
              order: 1,
            },
            {
              name: "Galaxy Core v2",
              status: "Testing",
              progress: 80,
              color: "cyan",
              order: 2,
            },
            {
              name: "Auth System",
              status: "Live",
              progress: 100,
              color: "emerald",
              order: 3,
            },
            {
              name: "Notifications",
              status: "Review",
              progress: 65,
              color: "yellow",
              order: 4,
            },
            {
              name: "API v3",
              status: "Dev",
              progress: 40,
              color: "cyan",
              order: 5,
            },
          ];
          initialFeatures.forEach((f) =>
            setDoc(doc(db, "features", f.name), f),
          );
        } else if (!snap.empty) {
          const featList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFeatures(featList);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "features"),
    );

    // Activities listener (Requires auth - can switch between current user's and global activities)
    let unsubAct = () => {};
    if (user) {
      const actQuery =
        activityFilter === "mine"
          ? query(collection(db, "activityLogs", user.uid, "logs"), orderBy("timestamp", "desc"), limit(200))
          : query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(200));
      unsubAct = onSnapshot(
        actQuery,
        (snap) => {
          const actList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setActivities(actList);
        },
        (error) =>
          handleFirestoreError(error, OperationType.LIST, "activities"),
      );
    }

    // Neural Profiles listener
    let unsubNeural = () => {};
    if (user) {
      unsubNeural = onSnapshot(
        query(collection(db, "neural_profiles")),
        (snap) => {
          const profiles: Record<string, string> = {};
          snap.docs.forEach((d) => {
             const data = d.data();
             if (data.uid && data.nickname) {
               profiles[data.uid] = data.nickname;
             }
          });
          setNeuralProfiles(profiles);
        },
        (error) => console.error("Neural profiles fetch failed", error)
      );
    }

    // Global Connections listener (for connection pulse visualizer)
    let unsubGlobalConn = () => {};
    if (user) {
      const globalConnQuery = query(collection(db, "neural_connections"));
      unsubGlobalConn = onSnapshot(
        globalConnQuery,
        (snap) => {
          const connList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setGlobalConnections(connList);
        },
        (error) =>
          handleFirestoreError(error, OperationType.LIST, "neural_connections"),
      );
    }

    // Notifications listener
    let unsubNotif = () => {};
    if (user) {
      const notifQuery = query(
        collection(db, `users/${user.uid}/notifications`),
        orderBy("timestamp", "desc"),
        limit(20),
      );
      unsubNotif = onSnapshot(
        notifQuery,
        (snap) => {
          const notifList = snap.docs.map((d) => {
            const data = d.data();
            let time = "Just now";
            if (data.timestamp?.toDate) {
              const diff = Date.now() - data.timestamp.toDate().getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) time = "Just now";
              else if (mins < 60) time = `${mins}m ago`;
              else time = `${Math.floor(mins / 60)}h ago`;
            }
            return { id: d.id, ...data, time } as Notification;
          });
          setNotifications(notifList);
        },
        (error) =>
          handleFirestoreError(
            error,
            OperationType.LIST,
            `users/${user.uid}/notifications`,
          ),
      );
    }

    // Projects listener
    const projectsQuery = query(
      collection(db, "shared_projects"),
      orderBy("timestamp", "desc"),
    );
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snap) => {
        const pList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSharedProjects(pList);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "shared_projects"),
    );

    // Theme listener
    const unsubTheme = onSnapshot(
      doc(db, "system_configs", "aura_global"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setThemeColors({
            preset: data.themePreset || "starlight",
            primary: data.customPrimary || "#3b82f6",
            secondary: data.customSecondary || "#10b981",
            accent: data.customAccent || "#cbd5e1",
          });
        }
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.GET,
          "system_configs/aura_global",
        ),
    );

    return () => {
      unsubStats();
      unsubUsers();
      unsubFeat();
      unsubAct();
      unsubNeural();
      unsubGlobalConn();
      unsubNotif();
      unsubProjects();
      unsubTheme();
    };
  }, [user, activityFilter]);

  useEffect(() => {
    if (user && db) {
      const updatePulse = async () => {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            lastLogin: serverTimestamp(),
          });
        } catch (e) {
          console.error("Pulse update failed", e);
        }
      };
      updatePulse();
      const interval = setInterval(updatePulse, 45000);
      return () => clearInterval(interval);
    }
  }, [user, db]);

  useEffect(() => {
    if (editProfileOpen && userInfo) {
      setNewUsername(userInfo.username || "");
      setNewNickname(userInfo.nickname || "");
      setNewAvatar(userInfo.avatarUrl || "");
    }
  }, [editProfileOpen, userInfo]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userInfo) return;
    try {
      const normalizedNew = newUsername.trim().toLowerCase();
      const normalizedOld = userInfo.username?.trim().toLowerCase();
      const isUsernameChanged = normalizedNew !== normalizedOld;

      if (isUsernameChanged) {
        if (!newUsername.trim()) {
          showToast(
            "⚠️",
            "Invalid Username",
            "Gamura ID (Username Handle) cannot be empty.",
            "warning",
          );
          return;
        }
        if (newUsername.length < 6) {
          showToast(
            "⚠️",
            "Username too short",
            "Gamura ID (Username Handle) must be at least 6 characters long.",
            "warning",
          );
          return;
        }

        // Check last change timestamp
        const lastChange = userInfo.lastUidChange;
        if (lastChange) {
          const lastChangeMs =
            typeof lastChange === "number"
              ? lastChange
              : lastChange.toMillis
                ? lastChange.toMillis()
                : lastChange.seconds
                  ? lastChange.seconds * 1000
                  : 0;
          const oneYearMs = 365 * 24 * 60 * 60 * 1000;
          if (Date.now() - lastChangeMs < oneYearMs) {
            const nextAllowedDate = new Date(lastChangeMs + oneYearMs);
            showToast(
              "⏳",
              "Temporal Limit",
              `Gamura ID can only be edited once per year.\nNext allowed update: ${nextAllowedDate.toLocaleDateString()}`,
              "info",
            );
            return;
          }
        }

        // Check if new handle is taken of other users
        const nameCheck = await getDoc(doc(db, "usernames", normalizedNew)).catch(() => null);
        if (nameCheck && nameCheck.exists()) {
          showToast(
            "🔒",
            "Username Taken",
            "This Gamura ID is already taken. Please choose another.",
            "error",
          );
          return;
        }

        // Reserve new username, and release old one
        await setDoc(doc(db, "usernames", normalizedNew), { uid: user.uid });
        if (normalizedOld) {
          await deleteDoc(doc(db, "usernames", normalizedOld));
        }
      }

      const updateData: any = {
        nickname: newNickname,
        avatarUrl: newAvatar,
        bio: newBio,
      };

      if (isUsernameChanged) {
        updateData.username = newUsername;
        updateData.lastUidChange = Date.now();
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      showToast(
        "👤",
        "Profile Updated",
        "Your identity has been re-calibrated.",
      );
      setEditProfileOpen(false);
      addActivity(
        "Updated profile details and avatar" +
          (isUsernameChanged ? " & secured a new Gamura ID" : ""),
        "✏️",
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 256); // small for avatar
      setNewAvatar(compressed);
    } catch (err) {
      console.error("Avatar compression error", err);
    }
  };

  const compressImage = (
    file: File,
    maxWidth: number = 800,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newRef = doc(collection(db, "shared_projects"));
      await setDoc(newRef, {
        id: newRef.id,
        userId: user.uid,
        userName: displayName || userInfo?.nickname || user.email?.split("@")[0] || "Anonymous",
        title: projectTitle,
        link: projectLink,
        image: projectImage,
        timestamp: serverTimestamp(),
        likes: [],
        comments: []
      });
      showToast(
        "🚀",
        "Project Shared",
        "Your project is now live in the Universe.",
      );
      setShowProjectModal(false);
      addActivity(`Shared project: ${projectTitle}`, "🎨");
      setProjectTitle("");
      setProjectLink("");
      setProjectImage("");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "shared_projects");
    }
  };

  const handleLikeProject = async (project: any) => {
    if (!user) {
      showToast("🔒", "Access Denied", "Connect your account to like projects.");
      return;
    }
    const isLiked = project.likes?.includes(user.uid);
    try {
      if (isLiked) {
        await updateDoc(doc(db, "shared_projects", project.id), {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(doc(db, "shared_projects", project.id), {
          likes: arrayUnion(user.uid)
        });
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleCommentProject = async (project: any) => {
    if (!user) {
      showToast("🔒", "Access Denied", "Connect your account to comment.");
      return;
    }
    const text = prompt("Enter your comment:");
    if (!text || !text.trim()) return;
    try {
      await updateDoc(doc(db, "shared_projects", project.id), {
        comments: arrayUnion({
          userId: user.uid,
          userName: userInfo?.nickname || user.email?.split("@")[0] || "Anonymous",
          text: text.trim(),
          timestamp: new Date().toISOString(),
          id: Math.random().toString(36).substring(7)
        })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleProjectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800);
      setProjectImage(compressed);
    } catch (err) {
      console.error("Project image compression error", err);
    }
  };

  const totalUsersVal = (
    totalUsersCount > 0 ? totalUsersCount : allUsers.length
  ).toLocaleString();

  const newestLoginUser = recentUsers.length > 0 ? recentUsers[0] : null;
  const newestCreatedUser = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return null;
    const sorted = [...allUsers].sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return sorted[0];
  }, [allUsers]);

  useEffect(() => {
    if (allUsers.length > totalUsersCount) {
      const syncUsers = async () => {
        try {
          await setDoc(
            doc(db, "system", "stats"),
            { totalUsers: allUsers.length },
            { merge: true },
          );
        } catch (e) {
          // ignore
        }
      };
      syncUsers();
    }
  }, [allUsers.length, totalUsersCount]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const t = time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = time.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const h = time.getHours();
  const greeting = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

  const [trafficDataState, setTrafficDataState] = useState<any[]>([
    { name: "Mon", visitors: 0, active: 0 },
    { name: "Tue", visitors: 0, active: 0 },
    { name: "Wed", visitors: 0, active: 0 },
    { name: "Thu", visitors: 0, active: 0 },
    { name: "Fri", visitors: 0, active: 0 },
    { name: "Sat", visitors: 0, active: 0 },
    { name: "Sun", visitors: 0, active: 0 },
  ]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const trafficRef = collection(db, "analytics", "traffic", "weekly");
        const querySnap = await getDocs(query(trafficRef, orderBy("__name__", "desc"), limit(7)));
        if (!querySnap.empty) {
          const fetchedDays: any[] = [];
          querySnap.forEach((docSnap) => {
            const dStr = docSnap.id; // YYYY-MM-DD
            const dObj = new Date(dStr);
            const dName = dObj.toLocaleDateString("en-US", { weekday: "short" });
            const sData = docSnap.data();
            fetchedDays.push({
              name: dName,
              visitors: sData.sessions || 0,
              active: sData.uniqueUsers || Math.floor((sData.sessions || 0) * 0.6) // mockup if missing
            });
          });
          setTrafficDataState(fetchedDays.reverse());
        }
      } catch (e) {
        console.warn("Error fetching traffic data", e);
      }
    };
    fetchTraffic();
    const inv = setInterval(fetchTraffic, 30000); // 30 seconds
    return () => clearInterval(inv);
  }, []);

  const trafficData = trafficDataState;

  const platformData = [
    { name: "Mobile", value: platformStats.mobile, color: "#38bdf8" },
    { name: "Desktop", value: platformStats.desktop, color: "#a78bfa" },
    { name: "Tablet", value: platformStats.tablet, color: "#34d399" },
  ];

  const [isDeploying, setIsDeploying] = useState(false);
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "user_connections", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setConnectedApps(data.connections || []);
      }
    });
    return unsub;
  }, [user]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    showToast(
      "🚀",
      "Deployment Started",
      "Initializing Galaxy Core v2 rollout...",
    );

    // Simulate deployment delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      // Update a deployment count in stats or something
      const statsRef = doc(db, "system", "stats");
      await updateDoc(statsRef, { deployCount: increment(1) });

      addActivity(`Deployed Galaxy Core v2`, "🚀");
      showToast(
        "✅",
        "Deployment Successful",
        "All nodes updated to latest protocols.",
      );
      await addNotification(
        "Galaxy Core v2 rollout successfully completed. System integrity 100%.",
        "🚀",
      );
    } catch (e) {
      console.error("Failed to update deploy count", e);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    showToast("🔄", "Synchronizing", "Gamura Universe nodes are syncing...");
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("✅", "Updated", "Dashboard data is now fully synchronized.");
      addActivity("Data synchronization completed", "🔄");
    }, 1500);
  };

  const activeCount = Object.values(presenceData).filter((p: any) => p?.online).length;

  const navGroups = [
    {
      label: "",
      items: [
        { name: "Analytics", icon: <Activity size={18} /> },
        {
          name: "Users",
          icon: <Users size={18} />,
          badge: allUsers.length > 0 ? `${allUsers.length}` : undefined,
          badgeColor: "cyan",
        },
        {
          name: "Active Users",
          icon: <Radio size={18} />,
          badge: `${activeCount} Live`,
          badgeColor: "green",
        },
        {
          name: "Features",
          icon: <Layers size={18} />,
          badge: "NEW",
          badgeColor: "cyan",
        },
        { name: "Integrations", icon: <Share2 size={18} /> },
      ],
    },
    {
      label: "Universe",
      items: [
        { name: "Galaxy Core", icon: <Cpu size={18} /> },
        {
          name: "Gamura Universe",
          icon: <Globe size={18} />,
          badge: "CLAIM",
          badgeColor: "cyan",
        },
        {
          name: "Neutral Link",
          icon: <Link size={18} />,
          badge: "ACTIVE",
          badgeColor: "green",
        },
        { name: "Gamura Link", icon: <Link size={18} /> },
        { name: "Aura Settings", icon: <Settings size={18} /> },
        {
          name: "Website",
          icon: <Globe size={18} />,
          action: () => window.open(window.location.origin, "_blank"),
        },
        {
          name: "GCP🕊️",
          icon: <Cloud size={18} />,
          action: () => window.open("https://gamuracp.vercel.app/", "_blank"),
        },
        {
          name: "GAMURA ELVARAN (GELVARAN)",
          icon: <Sparkles size={18} />,
          badge: "COMING SOON",
          badgeColor: "yellow",
          action: () =>
            showToast(
              "⌛",
              "Coming Soon",
              "GAMURA ELVARAN is currently in development.",
            ),
        },
        {
          name: "Gamura Galaxy",
          icon: <Sparkles size={18} />,
          action: () =>
            window.open("https://gamuragalaxy.vercel.app/", "_blank"),
        },
        {
          name: "SR Portfolio",
          icon: <User size={18} />,
          action: () =>
            window.open("https://selvaranjan.netlify.app/", "_blank"),
        },
        {
          name: "BuBuBai",
          icon: <Bot size={18} />,
          action: () => window.open("https://bububai.vercel.app/", "_blank"),
        },
        {
          name: "Resume Builder",
          icon: <FileText size={18} />,
          action: () =>
            showToast(
              "📝",
              "Resume Builder",
              "GO TO GAMURA GALAXY AND BUILD YOUR RESUME.",
            ),
        },
        { name: "Portfolio Builder", icon: <Briefcase size={18} /> },
      ],
    },
  ];

  const [connectedApps, setConnectedApps] = useState<any[]>([]);

  const handleConnectApp = async (app: string) => {
    if (!user) return;
    showToast(
      "🔌",
      `Connecting ${app}`,
      "Redirecting to secure authorization...",
    );

    // For Vercel/Netlify/etc., simulate with a prompt for API Key (Real enough for "Authorization")
    const apiKey = prompt(`Enter your ${app} API Token to authorize Gamura:`);
    if (apiKey) {
      const connRef = doc(db, "user_connections", user.uid);
      const currentConns = [...connectedApps];
      if (!currentConns.includes(app)) currentConns.push(app);

      await setDoc(
        connRef,
        {
          connections: currentConns,
          [`${app.toLowerCase()}_token`]: apiKey,
        },
        { merge: true },
      );

      addActivity(`Authorized ${app} integration`, "🔗");
      showToast(
        "✅",
        `${app} Connected`,
        `Successfully linked ${app} via token.`,
      );
    }
  };

  const [isLoadingUniverse, setIsLoadingUniverse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingUniverse(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingUniverse) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
        {/* Animated Background Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(56,189,248,0.2) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Central Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-24 h-24 border border-cyan-500/30 flex items-center justify-center mb-12 relative group"
          >
            <img
              src={GAMURA_G_LOGO}
              className="w-16 h-16 object-contain brightness-125 contrast-125"
              alt="Loading Logo"
            />
            <div className="absolute -inset-4 border border-cyan-400/10 animate-spin-slow pointer-events-none" />
            <div className="absolute -inset-8 border border-white/5 animate-reverse-spin-slow pointer-events-none" />
          </motion.div>

          {/* Loading Text */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] animate-pulse">
              Initializing <span className="text-cyan-400">Universe</span>
            </h2>
          </div>

          {/* Progress Bar (6s) */}
          <div className="w-64 h-1 bg-white/5 border border-white/10 mt-12 overflow-hidden relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-400 shadow-[0_0_15px_#00d2ff]"
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-1.5">
            <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
              GAMURA UNIVERSE
            </p>
          </div>
        </div>

        {/* Decorative Corner Borders */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-cyan-500/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/10" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-white/10" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-cyan-500/30" />
      </div>
    );
  }

  return (
    <div
      className={`universe-dashboard-root ${isDark ? "dark-theme" : "light-theme"}`}
      data-theme={isDark ? "dark" : "light"}
    >
      {/* Global CSS custom variables overrides that update the entire Aura UI dynamically */}
      <style>{`
        :root {
          --aura-primary: ${themeColors.primary};
          --aura-secondary: ${themeColors.secondary};
          --aura-accent: ${themeColors.accent};
          --aura-primary-rgb: ${hexToRgb(themeColors.primary)};
          --aura-secondary-rgb: ${hexToRgb(themeColors.secondary)};
          --aura-accent-rgb: ${hexToRgb(themeColors.accent)};
        }

        /* Dashboard-wide static token style re-skins */
        .text-blue-500 { color: var(--aura-primary) !important; }
        .text-blue-400 { color: var(--aura-primary) !important; }
        .bg-blue-500\/5 { background-color: rgba(var(--aura-primary-rgb), 0.05) !important; }
        .bg-blue-500\/10 { background-color: rgba(var(--aura-primary-rgb), 0.1) !important; }
        .bg-blue-500\/15 { background-color: rgba(var(--aura-primary-rgb), 0.15) !important; }
        .border-blue-500\/10 { border-color: rgba(var(--aura-primary-rgb), 0.1) !important; }
        .border-blue-500\/20 { border-color: rgba(var(--aura-primary-rgb), 0.2) !important; }
        .hover\:border-blue-500\/30:hover { border-color: rgba(var(--aura-primary-rgb), 0.3) !important; }
        .shadow-blue-500\/40 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.4) !important; }
        .shadow-blue-500\/30 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.3) !important; }
        .shadow-blue-500\/20 { box-shadow: 0 4px 14px 0 rgba(var(--aura-primary-rgb), 0.2) !important; }
        .bg-gradient-to-br.from-blue-500.to-cyan-400 {
          background-image: linear-gradient(135deg, var(--aura-primary), var(--aura-accent)) !important;
        }

        .text-green-500 { color: var(--aura-secondary) !important; }
        .text-green-400 { color: var(--aura-secondary) !important; }
        .bg-green-500\/5 { background-color: rgba(var(--aura-secondary-rgb), 0.05) !important; }
        .bg-green-500\/10 { background-color: rgba(var(--aura-secondary-rgb), 0.1) !important; }
        .bg-green-500\/15 { background-color: rgba(var(--aura-secondary-rgb), 0.15) !important; }
        .border-green-500\/10 { border-color: rgba(var(--aura-secondary-rgb), 0.1) !important; }
        .border-green-500\/20 { border-color: rgba(var(--aura-secondary-rgb), 0.2) !important; }
        .hover\:border-green-500\/30:hover { border-color: rgba(var(--aura-secondary-rgb), 0.3) !important; }

        .text-yellow-500 { color: var(--aura-accent) !important; }
        .text-yellow-400 { color: var(--aura-accent) !important; }
        .bg-yellow-500\/5 { background-color: rgba(var(--aura-accent-rgb), 0.05) !important; }
        .bg-yellow-500\/10 { background-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .bg-yellow-500\/15 { background-color: rgba(var(--aura-accent-rgb), 0.15) !important; }
        .border-yellow-500\/10 { border-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .border-yellow-500\/20 { border-color: rgba(var(--aura-accent-rgb), 0.2) !important; }
        .hover\:border-yellow-500\/30:hover { border-color: rgba(var(--aura-accent-rgb), 0.3) !important; }

        .text-red-500 { color: var(--aura-accent) !important; }
        .text-red-400 { color: var(--aura-accent) !important; }
        .bg-red-500\/5 { background-color: rgba(var(--aura-accent-rgb), 0.05) !important; }
        .bg-red-500\/10 { background-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .bg-red-500\/15 { background-color: rgba(var(--aura-accent-rgb), 0.15) !important; }
        .border-red-500\/10 { border-color: rgba(var(--aura-accent-rgb), 0.1) !important; }
        .border-red-500\/20 { border-color: rgba(var(--aura-accent-rgb), 0.2) !important; }
        .hover\:border-red-500\/30:hover { border-color: rgba(var(--aura-accent-rgb), 0.3) !important; }
      `}</style>
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const scheme = {
              success: {
                border: "border-emerald-500/20 bg-[#071912]/95",
                bar: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
                iconBg:
                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              },
              error: {
                border: "border-red-500/20 bg-[#140507]/95",
                bar: "bg-red-400 shadow-[0_0_12px_#f87171]",
                iconBg: "bg-red-500/10 text-red-500 border border-red-500/20",
              },
              warning: {
                border: "border-[#f59e0b]/20 bg-[#140d05]/95",
                bar: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
                iconBg:
                  "bg-[#f59e0b]/10 text-amber-400 border border-[#f59e0b]/20",
              },
              info: {
                border: "border-cyan-500/20 bg-[#05111c]/95",
                bar: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
                iconBg:
                  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
              },
            }[t.type || "info"];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 20, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className={`min-w-[280px] ${scheme.border} border p-4 pointer-events-auto shadow-2xl relative overflow-hidden backdrop-blur-md rounded-xl`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${scheme.bar}`}
                />
                <div className="flex items-start gap-3 pl-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${scheme.iconBg}`}
                  >
                    {t.ic}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tighter leading-tight">
                      {t.title}
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5 leading-tight">
                      {t.content}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setToasts((prev) => prev.filter((tt) => tt.id !== t.id))
                    }
                    className="text-zinc-600 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style>{`
        .universe-dashboard-root {
          --bg: #05080c;
          --bg2: #0a0e14;
          --bg3: #0d121b;
          --surface: #0a0e14;
          --surface2: #0f151e;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.03);
          --text: #ffffff;
          --text2: #94a3b8;
          --text3: #475569;
          --cyan: #38bdf8;
          --cyan2: #0ea5e9;
          --blue: #3b82f6;
          --purple: #a78bfa;
          --green: #34d399;
          --red: #f87171;
          --yellow: #fbbf24;
          --orange: #fb923c;
          --pink: #f472b6;
          --white: #f8fafc;
          --sidebar-w: 220px;
          --topbar-h: 56px;
          --r: 0px; /* Global Sharpness! */
          --shadow: 0 4px 24px rgba(0,0,0,0.6);
          font-family: 'Inter', 'Google Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }
        .universe-dashboard-root[data-theme="light"] {
          --bg: #f8fafc;
          --bg2: #ffffff;
          --bg3: #f1f5f9;
          --surface: #ffffff;
          --surface2: #f8fafc;
          --border: rgba(0,0,0,0.05);
          --border2: rgba(0,0,0,0.02);
          --text: #0f172a;
          --text2: #475569;
          --text3: #94a3b8;
          --shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .universe-dashboard-root * { box-sizing: border-box; border-radius: 0 !important; } /* Hard Sharpness Enforcement */

        .ud-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          z-index: 300;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1);
        }
        .ud-sidebar.collapsed { width: 72px; }
        
        .ud-logo-wrap {
          display: flex; align-items: center; gap: 12px;
          padding: 24px; border-bottom: 1px solid var(--border);
          min-height: 80px; cursor: pointer;
          transition: all 0.2s ease;
          background: #000;
        }
        .ud-logo-wrap:hover { background: #050505; }
        .ud-sidebar.collapsed .ud-logo-wrap {
          padding: 24px 0;
          justify-content: center;
        }
        .ud-logo-icon {
          width: 44px; height: 44px; border: 1px solid rgba(56,189,248,0.2); flex-shrink: 0;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .ud-logo-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px; font-weight: 900;
          color: #fff;
          letter-spacing: 0.15em; white-space: nowrap;
          line-height: 1; text-transform: uppercase;
        }
        .ud-logo-sub {
          font-size: 9px; color: var(--cyan); letter-spacing: 0.4em;
          text-transform: uppercase; white-space: nowrap;
          font-weight: 800; opacity: 0.6;
          margin-top: 2px;
        }

        .ud-nav { flex: 1; padding: 16px 8px; overflow-y: auto; }
        .ud-nav-label {
          font-size: 9px; color: var(--text3); letter-spacing: 0.15em;
          text-transform: uppercase; padding: 16px 12px 8px; font-weight: 800;
        }
        .ud-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          color: var(--text2); font-size: 11px; font-weight: 800;
          transition: all 0.15s; cursor: pointer; margin-bottom: 2px;
          position: relative; border: 1px solid transparent; text-transform: uppercase; tracking-widest;
        }
        .ud-nav-item:hover { background: var(--bg3); color: var(--text); border-color: var(--border); }
        .ud-nav-item.active { background: rgba(56,189,248,0.05); color: var(--cyan); border-color: rgba(56,189,248,0.1); }
        .ud-nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: var(--cyan);
        }
        .ud-nav-badge {
          font-size: 8px; font-weight: 900; padding: 1px 6px; border: 1px solid currentColor;
        }

        .ud-user-panel { padding: 8px; border-top: 1px solid var(--border); background: #000; }
        .ud-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; cursor: pointer; transition: all 0.15s; border: 1px solid var(--border);
        }
        .ud-user-card:hover { border-color: var(--cyan); background: var(--bg3); }
        .ud-user-av {
          width: 34px; height: 34px; flex-shrink: 0;
          background: #111; border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 900; color: white;
        }
        .ud-online-dot { width: 6px; height: 6px; background: var(--green); box-shadow: 0 0 6px var(--green); }

        .ud-main { 
          margin-left: var(--sidebar-w); min-height: 100vh; 
          display: flex; flex-direction: column; transition: margin-left 0.3s; 
          background: var(--bg);
        }
        .ud-main.wide { margin-left: 72px; }

        .ud-topbar {
          position: sticky; top: 0; z-index: 200; height: var(--topbar-h);
          background: var(--bg2); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px; padding: 0 24px;
        }
        .ud-topbar-toggle {
          width: 36px; height: 36px; background: none; border: 1px solid var(--border);
          color: var(--text2); display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; cursor: pointer;
        }
        .ud-topbar-toggle:hover { background: var(--bg3); color: var(--text); border-color: var(--text2); }
        
        .ud-search-box {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg); border: 1px solid var(--border);
          padding: 6px 14px; width: 240px; transition: all 0.2s; cursor: pointer;
        }
        .ud-search-box input { background: none; border: none; color: var(--text); font-size: 11px; width: 100%; cursor: pointer; outline: none; font-weight: 700; text-transform: uppercase; }
        
        .ud-tb-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .ud-tb-btn {
          width: 38px; height: 38px; background: var(--bg); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text2); transition: all 0.15s; position: relative; cursor: pointer;
        }
        .ud-tb-btn:hover { border-color: var(--cyan); color: var(--cyan); }
        .ud-tb-pip { position: absolute; top: -1px; right: -1px; width: 8px; height: 8px; background: var(--red); border: 1px solid var(--bg2); }

        .ud-content { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 32px; max-width: 1600px; margin: 0 auto; w-full; }

        .ud-welcome {
          background: #000; border: 1px solid var(--border);
          padding: 32px 40px; position: relative; overflow: hidden;
        }
        .ud-welcome-bg {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: linear-gradient(rgba(56,189,248,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .ud-welcome-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 900; color: var(--white); margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.02em; }
        .ud-welcome-title span { color: var(--cyan); }
        .ud-welcome-desc { font-size: 11px; color: var(--text2); line-height: 1.6; max-width: 500px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .ud-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .ud-metric {
          background: var(--bg2); border: 1px solid var(--border);
          padding: 20px; transition: all 0.3s ease; position: relative; overflow: hidden; cursor: default;
        }
        .ud-metric:hover { 
          border-color: var(--cyan); 
          background: var(--bg3);
          transform: translateY(-2px);
        }
        .ud-m-val { 
          font-family: 'Space Grotesk', sans-serif; 
          font-size: 28px; 
          font-weight: 900; 
          margin-bottom: 2px; 
          letter-spacing: -0.06em; 
        }
        .ud-m-label { 
          font-size: 9px; 
          color: var(--text3); 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.2em; 
        }

        .ud-charts-row { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
        .ud-panel { background: var(--bg2); border: 1px solid var(--border); overflow: hidden; }
        .ud-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); background: #000; }
        .ud-panel-title { font-size: 11px; font-weight: 900; color: var(--text); text-transform: uppercase; letter-spacing: 0.1em; }

        .ud-tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ud-table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 9px; color: var(--text3); text-transform: uppercase; padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); font-weight: 900; letter-spacing: 0.1em; }
        td { padding: 12px 16px; font-size: 11px; color: var(--text2); border-bottom: 1px solid var(--border2); font-weight: 700; }
        
        .ud-bottom-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

        .ud-status-chip { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border: 1px solid var(--border); font-size: 10px; color: var(--text2); cursor: default; font-weight: 800; text-transform: uppercase; }
        .ud-sc-dot { width: 6px; height: 6px; }

        @media(max-width: 1200px) {
          .ud-metrics { grid-template-columns: repeat(2, 1fr); }
          .ud-charts-row { grid-template-columns: 1fr; }
          .ud-tables-row { grid-template-columns: 1fr; }
          .ud-bottom-row { grid-template-columns: 1fr 1fr; }
        }
        @media(max-width: 900px) {
          .ud-sidebar { transform: translateX(-100%); }
          .ud-sidebar.mob-open { transform: translateX(0); }
          .ud-main { margin-left: 0 !important; }
        }
        @media(max-width: 640px) {
          .ud-metrics { grid-template-columns: 1fr 1fr; }
          .ud-bottom-row { grid-template-columns: 1fr; }
          .ud-search-box { display: none; }
        }
      `}</style>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[299] backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`ud-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mob-open" : ""}`}
      >
        <div className="ud-logo-wrap" onClick={onBack}>
          <div className="ud-logo-icon">
            <img
              src={GAMURA_G_LOGO}
              className="w-9 h-9 object-contain"
              alt="Logo"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col ml-3">
              <span className="ud-logo-name">GAMURA</span>
              <span className="ud-logo-sub">UNIVERSE</span>
            </div>
          )}
        </div>

        <nav className="ud-nav">
          {navGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {group.label && !collapsed && (
                <div className="ud-nav-label mt-4">{group.label}</div>
              )}
              {group.items.map((item: any, iIdx) => (
                <div
                  key={iIdx}
                  className={`ud-nav-item group relative hover:bg-white/10 ${activeTab === item.name ? "active bg-cyan-500/10" : ""}`}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveTab(item.name);
                    }
                  }}
                >
                  {/* Sidebar Teal indicator bar like in screenshot */}
                  {activeTab === item.name && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    />
                  )}

                  <div
                    className={`transition-transform duration-300 ${activeTab === item.name ? "scale-110 text-cyan-400" : "group-hover:scale-110 text-zinc-500"} group-hover:text-cyan-400`}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <span
                      className={`flex-1 font-black text-xs tracking-tight ${activeTab === item.name ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-200"}`}
                    >
                      {item.name}
                    </span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`ud-nav-badge px-2 py-0.5 text-[9px] font-black ${item.badgeColor === "yellow" ? "bg-amber-500/20 text-amber-500" : `nb-${item.badgeColor}`}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* BOTTOM CONNECT BUTTON / USER INFO */}
        {!collapsed && (
          <div className="p-4 mt-auto">
            {isLoggedIn ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all group"
                onClick={() => setProfileOpen(true)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 flex items-center justify-center text-cyan-400 font-black text-sm relative p-1.5 overflow-hidden">
                  {userInfo?.avatarUrl ? (
                    <img
                      src={userInfo.avatarUrl}
                      className="w-full h-full object-cover rounded-lg"
                      alt="User"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="w-full h-full object-cover rounded-lg"
                      alt="User"
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[11px] font-black text-zinc-100 truncate">
                    {displayName}
                  </div>
                  <div className="text-[8px] font-black text-cyan-500 uppercase tracking-widest truncate">
                    {gamuraId}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(34,211,238,0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  showToast(
                    "🔌",
                    "Authenticating",
                    "Establishing neural uplink...",
                  );
                  onConnect();
                }}
                className="w-full bg-cyan-500 text-black font-black text-[11px] py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-400/50"
              >
                <Zap size={14} fill="currentColor" />
                CONNECT
              </motion.button>
            )}
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className={`ud-main ${collapsed ? "wide" : ""}`}>
        <header className="ud-topbar">
          <button
            className="ud-topbar-toggle"
            onClick={() => {
              if (window.innerWidth <= 900) setMobileOpen(!mobileOpen);
              else setCollapsed(!collapsed);
            }}
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-black tracking-tighter leading-none text-white uppercase font-sans">
              DASHBOARD
            </h1>
            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest hidden sm:block uppercase">
              Command Center
            </p>
          </div>

          <div className="ud-tb-actions">
            <button
              className="ud-tb-btn group"
              onClick={() => {
                setIsDark(!isDark);
                addActivity(
                  isDark ? "Switched to Light mode" : "Switched to Dark mode",
                  "🌓",
                );
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="ud-tb-btn group"
              onClick={() => {
                setNotifOpen(!notifOpen);
                if (!notifOpen) {
                  // Mark all as read when opening? Or just leave it.
                }
                addActivity("Checked notifications", "🔔");
              }}
            >
              <Bell size={17} />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-[8px] right-[9px] w-1.5 h-1.5 rounded-full bg-red-500 border border-zinc-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
            </button>
            <button className="ud-tb-btn group" onClick={handleRefresh}>
              <RotateCw
                size={17}
                className={`${isRefreshing ? "animate-spin" : ""} transition-all`}
              />
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="ud-user-av ml-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-white/20 bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center group relative"
            >
              <Home size={14} className="text-white group-hover:hidden" />
              <span className="hidden group-hover:block text-[9px] font-black">
                EXIT
              </span>
            </motion.button>
          </div>
        </header>

        <div className="ud-content">
          {activeTab === "Portfolio Builder" ? (
            <PortfolioBuilderView
              onBack={() => setActiveTab("Analytics")}
              showToast={showToast}
            />
          ) : activeTab === "Neutral Link" ? (
            <NeuralLinkView
              onBack={() => setActiveTab("Analytics")}
              user={user}
              userInfo={userInfo}
              showToast={showToast}
              addActivity={addActivity}
            />
          ) : activeTab === "Users" ? (
            <UsersView
              db={db}
              currentUser={user}
              showToast={showToast}
              presenceData={presenceData}
              addActivity={addActivity}
              initialFilter="all"
              onBack={() => setActiveTab("Analytics")}
            />
          ) : activeTab === "Active Users" ? (
            <UsersView
              db={db}
              currentUser={user}
              showToast={showToast}
              presenceData={presenceData}
              addActivity={addActivity}
              initialFilter="active"
              onBack={() => setActiveTab("Analytics")}
            />
          ) : activeTab === "Aura Settings" ? (
            <AuraSettingsView
              user={user}
              userInfo={userInfo}
              setCurrentUserInfo={setCurrentUserInfo}
              onBack={() => setActiveTab("Analytics")}
              showToast={showToast}
            />
          ) : activeTab === "Galaxy Core" ? (
            <GalaxyCoreView />
          ) : activeTab === "Features" ? (
            <FeaturesView
              onBack={() => setActiveTab("Analytics")}
              loaderImgSources={loaderImgSources}
              showToast={showToast}
            />
          ) : activeTab === "Gamura Universe" ? (
            <div className="p-2 md:p-6 pb-24">
              <GamuraUniverseProfileManager user={user} showToast={showToast} />
            </div>
          ) : activeTab === "Gamura Link" ? (
            <div className="p-2 md:p-6 pb-24">
              <GamuraShortLinksManager user={user} />
            </div>
          ) : activeTab === "Integrations" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
              {[
                {
                  id: "Vercel",
                  name: "Vercel",
                  desc: "Manage deployments and edge functions directly.",
                  ic: <ArrowUpRight size={32} />,
                  color: "bg-black",
                },
                {
                  id: "Netlify",
                  name: "Netlify",
                  desc: "Global hosting and serverless form handling.",
                  ic: <Globe size={32} />,
                  color: "bg-cyan-500/10",
                },
                {
                  id: "Slack",
                  name: "Slack",
                  desc: "Push system alerts and logs to your workspace.",
                  ic: <MessageSquare size={32} />,
                  color: "bg-red-500/10",
                },
                {
                  id: "Discord",
                  name: "Discord",
                  desc: "Gamified community management and webhooks.",
                  ic: <MessageCircle size={32} />,
                  color: "bg-indigo-500/10",
                },
              ].map((app, i) => {
                const isConnected = connectedApps.includes(app.id);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="ud-panel p-6 flex flex-col gap-4 group hover:border-cyan-500/30 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start">
                      <div
                        className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center border border-white/5`}
                      >
                        {app.ic}
                      </div>
                      {isConnected ? (
                        <div className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Authorized
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnectApp(app.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          Authorize
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {app.name}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">
                        {app.desc}
                      </p>
                    </div>
                    {isConnected && (
                      <div className="mt-2 pt-4 border-t border-white/5 flex gap-2">
                        <button className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors">
                          Configure
                        </button>
                        <div className="w-px h-3 bg-white/10 my-auto" />
                        <button className="text-[10px] font-bold text-red-500/60 hover:text-red-500 transition-colors">
                          Revoke
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <>
              {/* WELCOME CARD */}
              <div className="ud-welcome py-8">
                <div className="ud-welcome-bg" />
                <div className="ud-welcome-grid absolute inset-0 opacity-10" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    Live Dashboard
                  </div>
                  <h1 className="ud-welcome-title">
                    Welcome back,{" "}
                    <span className="text-cyan-400">{displayName}!</span> 👋
                  </h1>
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md shadow-lg font-sharetech text-zinc-300 transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      GAMURA ID
                    </span>
                    <span className="text-white font-mono font-bold tracking-widest text-sm drop-shadow-[0_0_8px_#fff]">
                      {gamuraId}
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK ADD MODULE */}
              <div className="mb-8 group">
                <form
                  onSubmit={handleQuickAdd}
                  className="bg-black/40 border border-white/10 rounded-[2rem] p-2 flex flex-col md:flex-row items-center gap-2 group-hover:border-cyan-500/30 transition-all shadow-xl backdrop-blur-md relative"
                >
                  <div className="flex items-center flex-1 w-full gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-focus-within:text-cyan-400 group-focus-within:bg-cyan-500/10 transition-all ml-1 shrink-0">
                      <Plus size={18} />
                    </div>
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      placeholder="Broadcast a quick task or signal to the mesh..."
                      className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-zinc-600 px-2 font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto px-2 pb-2 md:pb-0">
                    <button
                      type="submit"
                      disabled={!quickAddText.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-30 disabled:grayscale disabled:scale-100 shrink-0"
                    >
                      SYNC SIGNAL
                    </button>
                  </div>
                </form>
              </div>

              {/* GITHUB PIPELINE DIRECT COUPLING */}
              <div className="mb-8 p-6 bg-zinc-950/60 border border-white/5 rounded-3xl relative overflow-hidden backdrop-blur-md shadow-2xl">
                {/* Ambient subtle glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
                        Pipeline Engine
                      </span>
                    </div>
                    <h3 className="text-sm font-black uppercase text-white tracking-[0.1em] font-sans">
                      GitHub Direct Deploy Connection
                    </h3>
                    <p className="text-[9.5px] text-zinc-500 font-mono">
                      Push compiled developer portfolio and live code
                      modifications directly to GitHub
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start md:self-auto font-mono text-[9px] text-zinc-400">
                    <div
                      className={`w-2 h-2 rounded-full ${dbStatus.type === "success" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : dbToken ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-zinc-600 animate-pulse"}`}
                    />
                    <span className="font-bold tracking-widest uppercase">
                      {dbStatus.type === "success"
                        ? "Active Uplink"
                        : dbToken
                          ? "Configured"
                          : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-[8px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-black">
                      GitHub Token
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={dbToken}
                      onChange={(e) => setDbToken(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-500 font-mono transition-all placeholder:text-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-black">
                      Repository Target
                    </label>
                    <input
                      type="text"
                      placeholder="my-personal-portfolio"
                      value={dbRepo}
                      onChange={(e) => setDbRepo(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-500 font-mono transition-all placeholder:text-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-black">
                      Commit Annotation
                    </label>
                    <input
                      type="text"
                      placeholder="Publish custom changes"
                      value={dbCommitMsg}
                      onChange={(e) => setDbCommitMsg(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-500 font-mono transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {dbStatus.type !== "idle" && (
                  <div
                    className={`p-3 text-[9px] font-mono rounded-xl border mb-5 leading-relaxed ${
                      dbStatus.type === "loading"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : dbStatus.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 break-all"
                          : "bg-red-500/10 border-red-500/20 text-red-300 break-all"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 font-black font-sans">
                        {dbStatus.type === "loading"
                          ? "⏳"
                          : dbStatus.type === "success"
                            ? "⚡"
                            : "⚠️"}
                      </div>
                      <div>
                        <span className="font-bold">{dbStatus.message}</span>
                        {dbStatus.type === "success" && dbStatus.url && (
                          <div className="mt-2 flex gap-3">
                            <a
                              href={dbStatus.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 rounded-md transition-all font-black uppercase text-[8px] tracking-widest inline-flex items-center gap-1 border border-emerald-500/30"
                            >
                              View Repository{" "}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
                  <span className="text-[9px] text-zinc-500 leading-relaxed font-mono">
                    {dbStatus.type === "success"
                      ? "🎯 Portfolio synchronized on the decentralized internet successfully."
                      : "🔧 Compiles single-page static HTML structures via developer pipeline parameters."}
                  </span>

                  <button
                    onClick={handleDashboardPublishGithub}
                    disabled={dbStatus.type === "loading"}
                    className={`py-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto ${
                      dbStatus.type === "loading"
                        ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        : "bg-[#10b981] hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] duration-200"
                    }`}
                  >
                    {dbStatus.type === "loading" ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                        <span>Syncing Uplink...</span>
                      </span>
                    ) : (
                      <>Sync to GitHub 🚀</>
                    )}
                  </button>
                </div>
              </div>

              {/* METRICS */}
              <div className="ud-metrics">
                {[
                  {
                    label: "Total Users",
                    val: totalUsersVal,
                    trend: "+12.4%",
                    color: "text-cyan-400",
                  },
                  {
                    label: "Active Nodes",
                    val: activeCount || 0,
                    trend: "REAL TIME",
                    color: "text-emerald-400",
                  },
                  {
                    label: "Avg Load Time",
                    val: avgLoadTime,
                    trend: "-0.1s",
                    color: "text-yellow-400",
                  },
                  {
                    label: "Total Logins",
                    val: loginCount.toLocaleString(),
                    trend: "REAL TIME",
                    color: "text-violet-400",
                  },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="ud-metric group relative"
                  >
                    {(m.label === "Total Users" ||
                      m.label === "Active Nodes") && (
                      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        {m.label === "Total Users" ? (
                          <Users size={64} />
                        ) : (
                          <Sparkles size={64} />
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`p-2 rounded-xl bg-zinc-800/80 text-zinc-400 group-hover:text-white group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 border border-white/5 transition-all duration-500 flex items-center justify-center`}
                      >
                        {m.label === "Total Users" ? (
                          <Users size={14} />
                        ) : m.label === "Active Nodes" ? (
                          <Sparkles size={14} />
                        ) : m.label === "Avg Load Time" ? (
                          <Activity size={14} />
                        ) : (
                          <ArrowRight size={14} />
                        )}
                      </div>
                      <div
                        className={`text-[8px] font-black px-2 py-0.5 rounded-md bg-white/5 backdrop-blur-sm border border-white/5 shadow-inner ${m.trend.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {m.trend}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <div
                        className={`ud-m-val ${m.color} transition-colors duration-500`}
                      >
                        {m.val}
                      </div>
                      <div className="ud-m-label">{m.label}</div>
                    </div>
                    {/* Background glow on hover */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                ))}
              </div>

              {/* REAL-TIME IDENTITY FEED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Latest Created User */}
                <div className="bg-[#050811]/90 border border-zinc-900/60 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-[#10F080]/30 transition-all duration-300">
                   <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Users size={48} />
                   </div>
                   <span className="text-[9px] font-black uppercase text-[#10F080] tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#10F080] animate-pulse shadow-[0_0_8px_#10F080]" />
                     New Gamura ID Created
                   </span>
                   <div className="flex items-center justify-between mt-1 relative z-10">
                     <span className="font-mono text-white text-xs sm:text-sm tracking-widest bg-white/5 px-2 py-1 rounded">
                       {newestCreatedUser?.id || "AWAITING..."}
                     </span>
                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">
                       {newestCreatedUser?.username || "---"}
                     </span>
                   </div>
                </div>

                {/* Latest Login User */}
                <div className="bg-[#050811]/90 border border-zinc-900/60 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
                   <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Activity size={48} />
                   </div>
                   <span className="text-[9px] font-black uppercase text-violet-400 tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
                     Newest Login Node
                   </span>
                   <div className="flex items-center justify-between mt-1 relative z-10">
                     <span className="font-mono text-white text-xs sm:text-sm tracking-widest bg-white/5 px-2 py-1 rounded">
                       {newestLoginUser?.id || "AWAITING..."}
                     </span>
                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">
                       {newestLoginUser?.username || "---"}
                     </span>
                   </div>
                </div>
              </div>

              {/* GLOBAL CONNECTION PULSE VISUALIZER */}
              <div className="mb-8">
                <GlobalConnectionPulse
                  allUsers={allUsers}
                  globalConnections={globalConnections}
                />
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <div className="ud-panel">
                  <div className="ud-panel-head">
                    <span className="ud-panel-title">Traffic Overview</span>
                  </div>
                  <div className="p-4 pt-1 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient
                            id="colorVis"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#38bdf8"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#38bdf8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorAct"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#a78bfa"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#a78bfa"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#475569",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a2332",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="visitors"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorVis)"
                        />
                        <Area
                          type="monotone"
                          dataKey="active"
                          stroke="#a78bfa"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorAct)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 7-DAY ACTIVITY FREQUENCY BAR CHART */}
                <div className="ud-panel group hover:border-[#10F080]/20 transition-all duration-300">
                  <div className="ud-panel-head flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="ud-panel-title">Activity Frequency</span>
                      <span className="text-[8px] font-bold text-[#10F080] bg-[#10F080]/10 border border-[#10F080]/20 px-1.5 py-0.5 rounded tracking-widest font-mono uppercase">
                        7 DAYS
                      </span>
                    </div>
                  </div>
                  <div className="p-4 pt-1 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activitiesOverLast7Days}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#475569",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                          dy={10}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#475569",
                            fontSize: 10,
                            fontWeight: 705,
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          contentStyle={{
                            backgroundColor: "#070a13",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          itemStyle={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "#10F080",
                          }}
                          labelStyle={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            color: "#94a3b8",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#10F080"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="ud-panel">
                  <div className="ud-panel-head">
                    <span className="ud-panel-title">
                      Platform Distribution
                    </span>
                  </div>
                  <div className="p-6 flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">
                          60%
                        </span>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          Mobile
                        </span>
                      </div>
                    </div>
                    <div className="w-full mt-8 space-y-4">
                      {[
                        {
                          label: "Mobile",
                          pct: "60%",
                          color: "bg-cyan-500",
                          val: "2.9K",
                        },
                        {
                          label: "Desktop",
                          pct: "30%",
                          color: "bg-violet-500",
                          val: "1.4K",
                        },
                        {
                          label: "Tablet",
                          pct: "10%",
                          color: "bg-emerald-500",
                          val: "482",
                        },
                      ].map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 group cursor-default"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${d.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
                          />
                          <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors flex-1">
                            {d.label}
                          </span>
                          <div className="flex-1 max-w-[80px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: d.pct }}
                              transition={{
                                duration: 1.5,
                                delay: 0.5 + i * 0.1,
                                ease: "circOut",
                              }}
                              className={`h-full ${d.color}`}
                            />
                          </div>
                          <span className="text-[11px] font-black text-zinc-200 font-mono w-10 text-right">
                            {d.pct}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLES ROW */}
              <div className="ud-tables-row">
                <div className="ud-panel">
                  <div className="ud-panel-head">
                    <span className="ud-panel-title">User Directory</span>
                    <button 
                      onClick={() => setSortActiveFirst(!sortActiveFirst)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${sortActiveFirst ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-400 hover:text-zinc-200"}`}
                    >
                      {sortActiveFirst ? "Sorting: Active First" : "Sorting: Newest First"}
                    </button>
                  </div>
                  <div className="ud-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Gamura ID</th>
                          <th>User</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th>Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                           const displayed = [...allUsers];
                           if (sortActiveFirst) {
                             displayed.sort((a, b) => {
                               const aOnline = presenceData?.[a.id]?.online ? 1 : 0;
                               const bOnline = presenceData?.[b.id]?.online ? 1 : 0;
                               if (aOnline !== bOnline) return bOnline - aOnline;
                               const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
                               const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
                               return tb - ta;
                             });
                           } else {
                             displayed.sort((a, b) => {
                               const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
                               const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
                               return tb - ta;
                             });
                           }
                           
                           return displayed.length > 0 ? (
                             displayed.map((u, i) => {
                               const lastSeen = u.lastLogin?.toDate
                                 ? u.lastLogin.toDate()
                                 : new Date();
                               
                               const isOnline = presenceData?.[u.id]?.online;
   
                               let status = "Offline";
                               let statusColor = "zinc";
                               if (isOnline) {
                                 status = "Active";
                                 statusColor = "emerald";
                               }
   
                               const now = new Date();
                               const diffMs = now.getTime() - lastSeen.getTime();
                               const diffMin = Math.floor(diffMs / 60000);
   
                               const joined =
                                 diffMin < 1
                                   ? "Just now"
                                   : diffMin < 60
                                     ? `${diffMin}m ago`
                                     : `${Math.floor(diffMin / 60)}h ago`;
   
                               return (
                                 <tr
                                   key={i}
                                   className="hover:bg-white/[0.02] transition-colors group"
                                 >
                                   <td className="font-mono text-zinc-500 text-[9px] uppercase tracking-widest">
                                     {u.id}
                                   </td>
                                   <td className="font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors uppercase text-[10px] tracking-tight flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" : "bg-zinc-600"}`} />
                                     {u.username || "Anonymous"}
                                     {neuralProfiles[u.id] && (
                                       <button
                                         onClick={() => setActiveTab("Neutral Link")}
                                         className="flex items-center gap-1 text-[8px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono tracking-widest border border-sky-500/30 hover:bg-sky-500/40 hover:text-white transition-all cursor-pointer"
                                         title="Connect via Neutral Link"
                                       >
                                         <Link2 size={8} />
                                         @{neuralProfiles[u.id]}
                                       </button>
                                     )}
                                   </td>
                                   <td className="text-zinc-500 text-[9px] font-bold">
                                     {joined}
                                   </td>
                                   <td>
                                     <span
                                       className={`text-[8px] font-black px-2 py-0.5 rounded-md bg-${statusColor}-500/10 text-${statusColor}-500 uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                                     >
                                       {status}
                                     </span>
                                   </td>
                                   <td>
                                     <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                       <motion.div
                                         initial={{ width: 0 }}
                                         animate={{
                                           width: `${60 + ((i * 7) % 35)}%`,
                                         }}
                                         className={`h-full bg-${statusColor}-500 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]`}
                                       />
                                     </div>
                                   </td>
                                 </tr>
                               );
                             })
                           ) : (
                             <tr>
                               <td
                                 colSpan={5}
                                 className="text-center py-8 text-zinc-600 font-bold uppercase tracking-widest text-[10px]"
                               >
                                 No active user sessions found
                               </td>
                             </tr>
                           );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="ud-bottom-row">
                <div className="ud-panel col-span-full border border-zinc-800/80 rounded-2xl bg-slate-950 overflow-hidden shadow-2xl">
                  <div className="ud-panel-head bg-black px-5 py-3.5 border-b border-zinc-900 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black tracking-[0.25em] text-white uppercase font-sans">
                        Activity Log
                      </span>
                      <span className="bg-[#10F080]/10 text-[#10F080] text-[8.5px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase border border-[#10F080]/15">
                        REAL-TIME
                      </span>
                    </div>

                    {/* Mode + Scope Filter Toggle and Export */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={exportTelemetryData}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-extrabold tracking-wider uppercase rounded-lg transition-all font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                        title="Export Activity Log as CSV"
                      >
                        <Download size={10} />
                        EXPORT CSV
                      </button>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
                        <button
                        onClick={() => {
                          setActivityFilter("mine");
                          setVisibleActivitiesCount(6);
                        }}
                        className={`px-3 py-1 text-[9px] font-extrabold pb-0.5 tracking-wider uppercase rounded transition-all font-mono ${
                          activityFilter === "mine"
                            ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/25 border border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                            : "text-zinc-500 hover:text-zinc-350 cursor-pointer"
                        }`}
                      >
                        👤 My Activities
                      </button>
                      <button
                        onClick={() => {
                          setActivityFilter("global");
                          setVisibleActivitiesCount(6);
                        }}
                        className={`px-3 py-1 text-[9px] font-extrabold pb-0.5 tracking-wider uppercase rounded transition-all font-mono ${
                          activityFilter === "global"
                            ? "bg-gradient-to-r from-teal-500/20 to-emerald-600/25 border border-emerald-500/30 text-[#10F080] shadow-[0_0_8px_rgba(16,240,128,0.15)]"
                            : "text-zinc-500 hover:text-zinc-350 cursor-pointer"
                        }`}
                      >
                        🌐 Global Universe
                      </button>
                    </div>
                  </div>
                  </div>

                  {/* Real-time Activity Summary Card */}
                  <div className="px-5 py-4 bg-gradient-to-r from-zinc-950 via-[#070a13] to-zinc-950 border-b border-zinc-900/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Card 1: Total Activities */}
                    <div className="bg-[#050811]/90 border border-zinc-900/60 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-[#10F080]/30 transition-all duration-300">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block">
                          Uplink Telemetry
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-white font-mono tracking-tight">
                            {totalTelemetry !== null ? totalTelemetry : activitySummary.total}
                          </span>
                          <span className="flex items-center gap-1 text-[8.5px] font-extrabold text-emerald-450 font-sans uppercase">
                            Total Actions
                            <span className={`text-[9px] ${activitySummary.trendDir === "up" ? "text-emerald-400" : activitySummary.trendDir === "down" ? "text-red-400" : "text-zinc-500"} flex items-center`}>
                              {activitySummary.trendDir === "up" ? <ArrowRight size={10} className="-rotate-45" /> : activitySummary.trendDir === "down" ? <ArrowRight size={10} className="rotate-45" /> : "-"} {activitySummary.trendStr}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-[#10F080]/5 text-[#10F080] border border-[#10F080]/15 flex items-center justify-center font-mono text-sm font-black group-hover:scale-105 transition-transform duration-300">
                        Σ
                      </div>
                    </div>

                    {/* Card 2: Most Frequent Activity Type */}
                    <div className="bg-[#050811]/90 border border-zinc-900/60 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-cyan-500/30 transition-all duration-300">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block">
                          Dominant Waveform
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs sm:text-xs font-black text-cyan-400 truncate max-w-[150px] uppercase tracking-wider">
                            {activitySummary.mostFrequent}
                          </span>
                          {activitySummary.maxCount > 0 && (
                            <span className="text-[8.5px] font-mono text-zinc-500 font-bold">
                              x{activitySummary.maxCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/5 text-cyan-400 border border-cyan-500/15 flex items-center justify-center text-sm group-hover:scale-105 transition-transform duration-300">
                        <Activity size={14} />
                      </div>
                    </div>

                    {/* Card 3: Network Pulse / Sync Status */}
                    <div className="bg-[#050811]/90 border border-zinc-900/60 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-violet-500/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block">
                          System Sync Status
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${isConnected ? 'bg-[#10F080] text-[#10F080]' : 'bg-red-500 text-red-500'}`} />
                          <span className={`text-[10px] font-extrabold tracking-widest uppercase font-mono ${isConnected ? 'text-[#10F080]' : 'text-red-500'}`}>
                            {isConnected ? 'CONNECTED' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-violet-500/5 text-violet-400 border border-violet-500/15 flex items-center justify-center text-xs font-mono font-bold group-hover:scale-105 transition-transform duration-300">
                        99.9%
                      </div>
                    </div>
                  </div>

                  <div
                    ref={scrollContainerRef}
                    className="flex flex-col max-h-[620px] overflow-y-auto divide-y divide-zinc-900/60 bg-[#070a13]/80"
                  >
                    {activities.length > 0 ? (
                      activities
                        .slice(0, visibleActivitiesCount)
                        .map((a, i) => {
                          const timeAgo = a.timestamp?.toDate
                            ? Math.floor(
                                (new Date().getTime() -
                                  a.timestamp.toDate().getTime()) /
                                  60000,
                              )
                            : 0;
                          const timeStr =
                            timeAgo < 1
                              ? "Just now"
                              : timeAgo < 60
                                ? `${timeAgo}m ago`
                                : `${Math.floor(timeAgo / 60)}h ago`;
                          return (
                            <div
                              key={i}
                              onClick={() =>
                                setExpandedActivityId(
                                  expandedActivityId === a.id
                                    ? null
                                    : a.id || i.toString(),
                                )
                              }
                              className={`flex flex-col p-4.5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-all cursor-pointer border-b border-zinc-900/40 last:border-0 ${expandedActivityId === a.id ? "bg-white/[0.03]" : ""}`}
                            >
                              <div className="flex items-center gap-4">
                                {(() => {
                                  const textVal = (a.title || a.action || "").toLowerCase();
                                  const isKeyEvent =
                                    a.ic === "🔑" ||
                                    textVal.includes("login") ||
                                    textVal.includes("auth");
                                  const isLinkEvent =
                                    a.ic === "🔗" ||
                                    a.ic === "🧬" ||
                                    textVal.includes("connect");
                                  const iconBgClass = isKeyEvent
                                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                    : isLinkEvent
                                      ? "bg-sky-500/10 border border-sky-500/20 text-sky-450"
                                      : "bg-zinc-900 border border-zinc-800 text-slate-300";
                                  return (
                                    <div
                                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm md:text-base font-bold transition-transform shrink-0 ${iconBgClass} ${expandedActivityId === a.id ? "scale-110 shadow-[0_0_12px_rgba(245,158,11,0.2)]" : ""}`}
                                    >
                                      {a.ic || "⚡"}
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12.5px] font-bold text-slate-100 flex items-center justify-between gap-2">
                                    <span
                                      className={`truncate ${expandedActivityId === a.id ? "text-cyan-400" : "text-slate-200"}`}
                                    >
                                      {a.title || a.action}
                                    </span>
                                    <ChevronDown
                                      size={14}
                                      className={`text-slate-500 transition-transform shrink-0 ${expandedActivityId === a.id ? "rotate-180 text-cyan-400" : ""}`}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex justify-between items-center mt-1.5 font-sans">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-400/80">
                                        {timeStr}
                                      </span>
                                      {a.priority && (
                                        <span
                                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            a.priority === "High"
                                              ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                              : a.priority === "Medium"
                                                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                          }`}
                                        >
                                          {a.priority}
                                        </span>
                                      )}
                                      {a.dueDate && (
                                        <span className="flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                                          <Calendar size={10} /> {a.dueDate}
                                        </span>
                                      )}
                                    </div>
                                    {a.user && (
                                      <span className="text-[10px] font-semibold text-slate-500/80 italic">
                                        by {a.user}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <AnimatePresence>
                                {expandedActivityId === a.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-3.5 pl-13 space-y-3 pb-1">
                                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                        Detailed activity record securely logged
                                        inside your personal account ecosystem.
                                        This secure log entry remains strictly
                                        confidential.
                                      </p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const lowerTitle =
                                              a.title.toLowerCase();
                                            if (lowerTitle.includes("feature"))
                                              setActiveTab("Features");
                                            else if (
                                              lowerTitle.includes(
                                                "integration",
                                              ) ||
                                              lowerTitle.includes("github")
                                            )
                                              setActiveTab("Integrations");
                                            else setActiveTab("Analytics");
                                          }}
                                          className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors cursor-pointer"
                                        >
                                          Go to Section
                                        </button>
                                        <div className="w-px h-3 bg-zinc-850 my-auto" />
                                        <span className="text-[9px] font-bold text-slate-650 uppercase tracking-widest font-mono">
                                          HASH:{" "}
                                          {a.id
                                            ? a.id.substring(0, 8)
                                            : "ACT-SYS"}
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                        No activities recorded in your current session
                      </div>
                    )}

                    {/* Intersection Observer Sentinel for Auto-scrolling / Dynamic Loading */}
                    <div
                      ref={sentinelRef}
                      className="p-5 bg-black/30 border-t border-zinc-950/60 text-center flex items-center justify-center"
                    >
                      {activities.length > visibleActivitiesCount ? (
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-[9px] font-black animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10F080]" />
                          <span>
                            SYNCHRONIZING MORE REAL-TIME DATAFREAMS... (
                            {activities.length - visibleActivitiesCount}{" "}
                            REMAINING)
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-650 tracking-[0.2em] font-black uppercase text-[8px] font-mono">
                          ☠ DATA DEPLOYMENT TRANSCEIVER SYNCHRONIZED ☠
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SHARED PROJECTS SECTION */}
              <div className="mt-8 mb-12">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex flex-col">
                    <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      <LayoutGrid size={16} className="text-violet-400" />
                      Shared Universe Projects
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      Innovation from the Gamura community
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!isLoggedIn) {
                        showToast(
                          "🔒",
                          "Access Denied",
                          "Connect your account to share projects.",
                        );
                        return;
                      }
                      setProjectTitle("");
                      setProjectLink("");
                      setProjectImage("");
                      setShowProjectModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:from-violet-500/30 hover:to-cyan-500/30 transition-all font-sans"
                  >
                    <Plus size={14} />
                    Add Project
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sharedProjects.length > 0 ? (
                    sharedProjects.map((project, i) => (
                      <motion.div
                        key={project.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden hover:border-violet-500/50 transition-all flex flex-col h-full"
                      >
                        <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                          {project.image ? (
                            <img
                              src={project.image}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              alt={project.title}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                              <ImageIcon size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="text-[12px] font-black text-white uppercase tracking-wider">
                              {project.title}
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                              by {project.userName}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 gap-4">
                          <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tight">
                            A unique visualization project connected to the
                            Gamura Universe neural link.
                          </p>
                          <div className="mt-auto flex flex-col gap-4">
                            <div className="flex items-center gap-4 border-t border-zinc-800 pt-4">
                                <button onClick={() => handleLikeProject(project)} className={`flex items-center gap-1.5 text-[10px] font-bold ${project.likes?.includes(user?.uid) ? "text-rose-500" : "text-zinc-500 hover:text-zinc-300"} transition-colors cursor-pointer`}>
                                  <Heart size={14} className={project.likes?.includes(user?.uid) ? "fill-rose-500" : ""} /> {project.likes?.length || 0}
                                </button>
                                <button onClick={() => handleCommentProject(project)} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                                  <MessageCircle size={14} /> {project.comments?.length || 0}
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(project.link); showToast("📋", "Link Copied", "Project URL copied to clipboard."); }} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-cyan-400 transition-colors ml-auto cursor-pointer">
                                  <Share2 size={14} /> Share
                                </button>
                            </div>
                            
                            {project.comments && project.comments.length > 0 && (
                              <div className="bg-black/20 border border-white/5 rounded-xl p-3 max-h-24 overflow-y-auto space-y-2 no-scrollbar">
                                {project.comments.map((comment: any, idx: number) => (
                                  <div key={idx} className="flex flex-col gap-0.5">
                                    <span className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">{comment.userName}</span>
                                    <p className="text-[10px] text-zinc-300 leading-tight block">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-black text-cyan-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5"
                              >
                                View Project <ExternalLink size={12} />
                              </a>
                              <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                                {project.timestamp?.toDate
                                  ? project.timestamp
                                      .toDate()
                                      .toLocaleDateString()
                                  : "Active"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center">
                      <LayoutGrid
                        size={32}
                        className="text-zinc-700 mb-4 opacity-50"
                      />
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        No shared projects yet
                      </p>
                      <p className="text-zinc-600 text-[9px] mt-2 font-bold uppercase tracking-widest">
                        Be the first to showcase your innovation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-start justify-center pt-[15vh] px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <Search size={20} className="text-zinc-500" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-base text-zinc-100 placeholder:text-zinc-600"
                  placeholder="Search Universe commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="px-2 py-1 bg-zinc-800 border border-white/10 rounded text-[9px] font-bold text-zinc-500">
                  ESC
                </div>
              </div>
              <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                {[
                  {
                    ic: "📊",
                    title: "Analytics Overview",
                    sub: "View metrics",
                  },
                  {
                    ic: "🎮",
                    title: "BuBuBai Feature",
                    sub: "Development progress",
                  },
                  { ic: "🌌", title: "Galaxy Core", sub: "Platform status" },
                  { ic: "👥", title: "User Management", sub: "4,829 users" },
                ]
                  .filter((i) =>
                    i.title.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSearchOpen(false);
                        showToast(
                          item.ic,
                          item.title,
                          "Opening dashboard module...",
                        );
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">
                        {item.ic}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.sub}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[399]"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[340px] bg-zinc-900 border-l border-white/5 z-[400] flex flex-col"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-black tracking-widest uppercase">
                  Notifications
                </span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      onClick={async () => {
                        if (n.unread && user) {
                          try {
                            await updateDoc(
                              doc(db, `users/${user.uid}/notifications`, n.id),
                              { unread: false },
                            );
                          } catch (e) {
                            console.error("Failed to update notification", e);
                          }
                        }
                      }}
                      className={`p-4 rounded-xl transition-all cursor-pointer border ${n.unread ? "bg-cyan-500/5 border-cyan-500/10" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"}`}
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                          {n.ic}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[12.5px] leading-relaxed text-zinc-200">
                            {n.msg}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold">
                            {n.time}
                          </p>
                        </div>
                        {n.unread && (
                          <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-6">
                    <Bell size={48} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No active notifications
                    </p>
                    <p className="text-[10px] mt-2">
                      Real-time alerts will appear here as they are triggered.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROFILE DROPDOWN */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <div
              className="fixed inset-0 z-[399]"
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed top-[70px] right-6 w-80 bg-zinc-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-[400] overflow-hidden flex flex-col font-sans"
            >
              {/* User Identity Banner */}
              <div className="p-6 text-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-500 mx-auto mb-3 flex items-center justify-center font-black text-white shadow-[0_4px_25px_rgba(56,189,248,0.35)] relative border border-white/20 p-0.5">
                  {userInfo?.avatarUrl ? (
                    <img
                      src={userInfo.avatarUrl}
                      className="w-full h-full object-cover rounded-2xl"
                      alt="User"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="w-full h-full object-cover rounded-2xl"
                      alt="User"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-sans tracking-tight text-xl font-bold bg-zinc-900 border border-white/10 rounded-2xl text-cyan-400">
                      {displayName.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-[15px] font-black tracking-tight text-white">
                  {displayName}
                </div>
                <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.25em] mt-1 flex items-center justify-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />{" "}
                  {gamuraId}
                </div>
              </div>

              {/* Accounts Switcher Block */}
              {gamuraAccounts.filter((acc) => acc.uid !== user?.uid).length >
                0 && (
                <div className="p-4 border-b border-white/5 bg-black/40">
                  <div className="text-[8px] font-black text-zinc-500 tracking-[0.25em] uppercase mb-2 px-2 font-mono">
                    Switch ID
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                    {gamuraAccounts
                      .filter((acc) => acc.uid !== user?.uid)
                      .map((acc, idx) => (
                        <div
                          key={idx}
                          onClick={async () => {
                            setProfileOpen(false);
                            showToast(
                              "🔄",
                              "Switching Host",
                              `Preparing secure connection for @${acc.username}...`,
                            );
                            setCurrentUserInfo(null);
                            await firebaseSignOut(auth);
                            setEmail(acc.email || "");
                            setUsername(acc.username || "");
                            setCurrentPage("login");
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                              {acc.avatarUrl ? (
                                <img
                                  src={acc.avatarUrl}
                                  className="w-full h-full object-cover"
                                  alt="Saved user"
                                />
                              ) : (
                                <span className="text-xs font-bold text-zinc-400 font-sans">
                                  {acc.nickname?.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold text-zinc-200 truncate max-w-[120px]">
                                @{acc.username}
                              </div>
                              <div className="text-[9px] text-zinc-500 truncate max-w-[120px]">
                                {acc.nickname}
                              </div>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 uppercase">
                            Link
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Rows */}
              <div className="p-3 space-y-0.5">
                {[
                  {
                    label: "Edit Profile",
                    icon: <Settings size={14} />,
                    action: () => setEditProfileOpen(true),
                  },
                  {
                    label: "Connect Other ID",
                    icon: <Plus size={14} />,
                    action: () => {
                      setCurrentUserInfo(null);
                      firebaseSignOut(auth);
                      setUsername("");
                      setEmail("");
                      setCurrentPage("login");
                    },
                  },
                  {
                    label: "Register New ID",
                    icon: <MessageSquarePlus size={14} />,
                    action: () => {
                      setCurrentUserInfo(null);
                      firebaseSignOut(auth);
                      setUsername("");
                      setEmail("");
                      setCurrentPage("signup");
                    },
                  },
                  {
                    label: "Delete Account",
                    icon: <Trash2 size={14} />,
                    danger: true,
                    action: () => {
                      setProfileOpen(false);
                      setCurrentPage("home");
                      setShowDeleteConfirm(true);
                    },
                  },
                  {
                    label: "Sign Out",
                    icon: <LogOut size={14} />,
                    danger: true,
                    action: () => {
                      setProfileOpen(false);
                      setCurrentPage("blank");
                      setShowSignOutConfirm(true);
                    },
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-300 cursor-pointer group ${item.danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                    onClick={() => {
                      if (item.action) item.action();
                      setProfileOpen(false);
                    }}
                  >
                    <div className="transition-transform group-hover:scale-110 text-zinc-400 group-hover:text-current">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold tracking-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {editProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <div className="p-8 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest leading-none">
                      Edit Profile
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">
                      Re-calibrate your Universe identity
                    </p>
                  </div>
                  <button
                    onClick={() => setEditProfileOpen(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden relative group shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                    {newAvatar ? (
                      <img
                        src={newAvatar}
                        className="w-full h-full object-cover"
                        alt="Avatar Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <ImageIcon size={20} className="text-white" />
                      <input
                        type="file"
                        onChange={handleAvatarFile}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                    Click to upload custom avatar image
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Username Handle
                      </label>
                      {isUsernameLocked && (
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) =>
                        !isUsernameLocked && setNewUsername(e.target.value)
                      }
                      readOnly={isUsernameLocked}
                      className={`w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs font-bold transition-all font-sans ${isUsernameLocked ? "text-zinc-500 cursor-not-allowed border-rose-500/20" : "text-white focus:outline-none focus:border-cyan-500/50"}`}
                      placeholder="Universe ID handle"
                    />
                    <p
                      className={`text-[9px] font-bold uppercase tracking-widest mt-1 ml-1 ${isUsernameLocked ? "text-rose-400" : "text-zinc-500"}`}
                    >
                      {isUsernameLocked
                        ? `Gamura ID can be updated once per year. Next update: ${nextAllowedDateStr}`
                        : "Your unique Gamura handle. Can be modified once per year."}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Identity Nickname
                    </label>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                      placeholder="Display nickname"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Bio
                    </label>
                    <input
                      type="text"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                      placeholder="Write a short bio about yourself..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all font-sans"
                >
                  Confirm Re-calibration
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD PROJECT MODAL */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-gradient-to-br from-violet-500/10 to-cyan-500/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowProjectModal(false)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all active:scale-90"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                        Share Broadcast
                      </h2>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">
                        Broadcast your innovation to the Gamura Universe
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProjectModal(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddProject} className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-center block w-full">
                    Broadcast Module Thumbnail
                  </label>
                  <div className="aspect-video w-full rounded-xl bg-black/50 border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        className="w-full h-full object-cover"
                        alt="Project Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                        <ImageIcon size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          Click to upload module cover
                        </span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Plus size={24} className="text-white" />
                      <input
                        type="file"
                        onChange={handleProjectImage}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Innovation Title
                    </label>
                    <input
                      type="text"
                      required
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none focus:border-violet-500/50 transition-all font-sans"
                      placeholder="e.g. Galaxy Core Integration"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Neural Uplink URL
                    </label>
                    <input
                      type="url"
                      required
                      value={projectLink}
                      onChange={(e) => setProjectLink(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none focus:border-violet-500/50 transition-all font-sans"
                      placeholder="https://your-project.vercel.app"
                    />
                  </div>
                </div>

                <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl text-[8px] font-bold text-violet-400 leading-relaxed uppercase tracking-[0.05em]">
                  PROTOCOL NOTICE: Each inhabitant can only host ONE active
                  broadcast at a time. Sharing a new module will terminate your
                  previous signal.
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all font-sans"
                  >
                    Initialize Broadcast Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="w-full py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Return to Universe
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOASTS */}
      <div className="fixed bottom-8 right-8 z-[600] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const scheme = {
              success: {
                border: "border-emerald-500/20 bg-[#071912]/95",
                bar: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
                iconBg:
                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              },
              error: {
                border: "border-red-500/20 bg-[#140507]/95",
                bar: "bg-red-400 shadow-[0_0_12px_#f87171]",
                iconBg: "bg-red-500/10 text-red-500 border border-red-500/20",
              },
              warning: {
                border: "border-[#f59e0b]/20 bg-[#140d05]/95",
                bar: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
                iconBg:
                  "bg-[#f59e0b]/10 text-amber-400 border border-[#f59e0b]/20",
              },
              info: {
                border: "border-cyan-500/20 bg-[#05111c]/95",
                bar: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
                iconBg:
                  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
              },
            }[t.type || "info"];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                layout
                className={`min-w-[300px] ${scheme.border} border p-4 rounded-xl shadow-2xl flex items-center gap-4 group pointer-events-auto backdrop-blur-md relative overflow-hidden`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${scheme.bar}`}
                />
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${scheme.iconBg}`}
                >
                  {t.ic}
                </div>
                <div className="flex-1 pl-1">
                  <div className="text-[11px] font-black text-white leading-tight uppercase tracking-tighter">
                    {t.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 uppercase font-bold leading-tight">
                    {t.content || t.msg}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setToasts((prev) =>
                      prev.filter((toast) => toast.id !== t.id),
                    )
                  }
                  className="text-zinc-650 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "gpg"
    | "login"
    | "history"
    | "signup"
    | "about"
    | "portfolio"
    | "gg"
    | "blank"
    | "aura"
    | "universe-active"
    | "white-page"
  >("home");
  const [claimedProfileUser, setClaimedProfileUser] = useState<string | null>(
    null,
  );
  const [shortLinkTarget, setShortLinkTarget] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [showUniverseLoader, setShowUniverseLoader] = useState(false);
  const [selectedAuraModule, setSelectedAuraModule] = useState<string | null>(
    null,
  );
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  const [toasts, setToasts] = useState<any[]>([]);

  const showToast = (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => {
    const id = Date.now();
    let deducedType: "success" | "error" | "info" | "warning" = type || "info";
    if (!type) {
      const lowerTitle = title.toLowerCase();
      if (
        ic === "❌" ||
        ic === "🚫" ||
        lowerTitle.includes("fail") ||
        lowerTitle.includes("error") ||
        lowerTitle.includes("denied")
      ) {
        deducedType = "error";
      } else if (
        ic === "✅" ||
        ic === "✓" ||
        lowerTitle.includes("success") ||
        lowerTitle.includes("successful") ||
        lowerTitle.includes("complete") ||
        lowerTitle.includes("ready")
      ) {
        deducedType = "success";
      } else if (ic === "⚠️") {
        deducedType = "warning";
      } else {
        deducedType = "info";
      }
    }
    setToasts((prev) => [
      ...prev,
      { id, ic, title, content, type: deducedType },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Login/Signup State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    username: string;
    nickname: string;
    gpgTimestamps?: number[];
    avatarUrl?: string;
    bio?: string;
    email?: string;
    themeColor?: string;
  } | null>(null);
  const isLoggedIn = !!currentUser;

  const [authError, setAuthError] = useState<React.ReactNode | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showReauthConfirm, setShowReauthConfirm] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(
    null,
  );
  const [showDeletePasswordInput, setShowDeletePasswordInput] = useState(false);
  const [needsGoogleReauth, setNeedsGoogleReauth] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{
    status: string;
    progress: number;
  } | null>(null);
  const [deletionLogs, setDeletionLogs] = useState<string[]>([]);
  const [createdGamuraIdInfo, setCreatedGamuraIdInfo] = useState<{
    username: string;
    nickname: string;
    uid: string;
  } | null>(null);
  const [gamuraAccounts, setGamuraAccounts] = useState<any[]>([]);

  const loadSavedAccounts = () => {
    try {
      const stored = localStorage.getItem("gamura_active_accounts");
      if (stored) {
        setGamuraAccounts(JSON.parse(stored));
      } else {
        setGamuraAccounts([]);
      }
    } catch (e) {
      console.warn("Could not load saved accounts from local storage", e);
    }
  };

  const saveAccountSession = (userObj: {
    uid: string;
    username: string;
    nickname: string;
    email: string;
    avatarUrl: string;
  }) => {
    try {
      const stored = localStorage.getItem("gamura_active_accounts");
      let accounts: any[] = stored ? JSON.parse(stored) : [];
      accounts = accounts.filter((acc) => acc.uid !== userObj.uid);
      accounts.push({
        ...userObj,
        lastLogin: Date.now(),
      });
      localStorage.setItem("gamura_active_accounts", JSON.stringify(accounts));
      setGamuraAccounts(accounts);
    } catch (e) {
      console.warn("Could not save account session to local storage", e);
    }
  };

  const removeAccountSession = (uid: string) => {
    try {
      const stored = localStorage.getItem("gamura_active_accounts");
      let accounts: any[] = stored ? JSON.parse(stored) : [];
      accounts = accounts.filter((acc) => acc.uid !== uid);
      localStorage.setItem("gamura_active_accounts", JSON.stringify(accounts));
      setGamuraAccounts(accounts);
    } catch (err) {
      console.warn("Could not remove account session from local storage", err);
    }
  };

  // Multi-Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const addActivity = async (title: string, ic: string = "⚡") => {
    if (!currentUser) return; // Guard against unauthenticated writes
    const path = "activities";
    try {
      await setDoc(doc(collection(db, path)), {
        title,
        ic,
        timestamp: serverTimestamp(),
        user:
          currentUserInfo?.username ||
          currentUser?.displayName ||
          currentUser?.email ||
          "Anonymous",
        userId: currentUser?.uid,
      });

      // ALSO add to user's activity log for analytics
      await setDoc(doc(collection(db, "activityLogs", currentUser.uid, "logs")), {
        action: title,
        ic,
        page: "APP",
        timestamp: serverTimestamp()
      });
      // Increment total actions telemetry
      await setDoc(doc(db, "activityLogs", currentUser.uid), { totalActions: increment(1) }, { merge: true });

    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const getDocWithTimeout = async (docRef: any, timeoutMs: number = 4000) => {
    return Promise.race([
      getDoc(docRef),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout getting document")),
          timeoutMs,
        ),
      ),
    ]);
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // The centralized onAuthStateChanged listener handles all profile existence verification,
      // fallback provisions, system stats update, caching, and account redirection asynchronously.
      // We set isAuthLoading(false) immediately after the sign-in completes.
      setIsAuthLoading(false);
    } catch (error: any) {
      setIsAuthLoading(false);
      console.error("Google login interaction error:", error);
      const isPopupError =
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request" ||
        error.message?.toLowerCase().includes("popup") ||
        error.message?.toLowerCase().includes("iframe") ||
        error.message?.toLowerCase().includes("cross-origin");

      if (error.code === "auth/operation-not-allowed") {
        setAuthError(
          <div className="space-y-1.5 text-red-600 dark:text-red-400 p-1">
            <p className="font-extrabold uppercase tracking-wide text-xs text-left">
              Google Sign-In Off
            </p>
            <p className="text-[10px] normal-case leading-relaxed text-left opacity-90">
              Please activate Google as a Sign-In provider in your Firebase
              Authentication settings first.
            </p>
          </div>,
        );
      } else if (isPopupError) {
        setAuthError(
          <div className="space-y-2 text-zinc-800 dark:text-zinc-200 p-1 text-left normal-case tracking-normal">
            <p className="font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
              <span>🔒</span> Browser Sandbox Restricted
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">
              The Google login popup was closed or restricted by the security
              sandbox rules of this embedded preview.
            </p>
            <div className="bg-amber-500/10 dark:bg-amber-500/5 p-2 rounded-lg space-y-1 my-1">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                ⚡ Bypass instantly by doing either:
              </p>
              <ol className="list-decimal pl-4.5 text-[10.5px] space-y-1 font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                <li>
                  Click the{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    "Open in standard tab"
                  </strong>{" "}
                  icon in the top-right header of your screen to bypass the
                  sandbox, OR
                </li>
                <li>
                  Simply input a username and password under{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold uppercase">
                    "Create Gamura ID"
                  </strong>{" "}
                  to register instantly!
                </li>
              </ol>
            </div>
          </div>,
        );
      } else {
        setAuthError("Google authentication failed: " + error.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAuthError("Server busy.");
    } catch (error: any) {
      setAuthError("Apple sign-in failed: " + error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const u =
        params.get("u") ||
        params.get("username") ||
        params.get("gamura_hub") ||
        params.get("ref");

      const pathname = window.location.pathname;
      const cleanedPath = pathname.replace(/^\/+|\/+$/g, "").trim();
      const lowerPath = cleanedPath.toLowerCase();

      const isSystemWord = [
        "",
        "index.html",
        "selvaranjan_gamura.html",
        "api",
        "skills",
      ].includes(lowerPath);

      if (u) {
        setCurrentPage("white-page");
      } else if (cleanedPath && !isSystemWord) {
        if (lowerPath.startsWith("@")) {
          setClaimedProfileUser(cleanedPath.substring(1));
        } else if (lowerPath.startsWith("go/")) {
          const shortLinkSlug = cleanedPath.substring(3);
          setShortLinkTarget(shortLinkSlug); // We'll need a state for this
        } else {
          // If backwards compatibility is needed for profiles without '@'
          setClaimedProfileUser(cleanedPath);
        }
      }
    }
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import("firebase/firestore");
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("the client is offline")
        ) {
          console.warn(
            "Firebase offline mode is active. (Check internet if this persists)",
          );
        }
      }
    };
    testConnection();

    let unsubUserDoc = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      unsubUserDoc();

      if (user) {
        // --- REALTIME PRESENCE START ---
        try {
          const userStatusDatabaseRef = ref(rtdb, `/presence/${user.uid}`);
          const isOfflineForDatabase = {
            online: false,
            lastSeen: rtdbServerTimestamp(),
          };
          const isOnlineForDatabase = {
            online: true,
            lastSeen: rtdbServerTimestamp(),
          };
          
          const connectedRef = ref(rtdb, '.info/connected');
          onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
              onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
              });
            }
          });
        } catch(e) {
          console.warn("RTDB Presence ignored:", e);
        }
        // --- REALTIME PRESENCE END ---

        // Skip setup if registration is actively writing custom user document
        if ((window as any).isRegisteringUser) {
          return;
        }

        // Increment global login counter asynchronously
        (async () => {
          try {
            const statsRef = doc(db, "system", "stats");
            const statsDoc = await getDoc(statsRef).catch(() => null);
            if (!statsDoc?.exists()) {
              await setDoc(statsRef, { loginCount: 1, totalUsers: 1 }, { merge: true });
            } else {
              await updateDoc(statsRef, { loginCount: increment(1) });
            }
          } catch (e) {
            console.error("Failed to increment counts", e);
          }
        })();

        // Fetch/Update user record
        try {
          const userRef = doc(db, "users", user.uid);

          // Instantly load local storage cache preceding any network handshake requests to provide a 0ms login perception
          const cachedInfo = localStorage.getItem(
            `gamura_user_info_${user.uid}`,
          );
          if (cachedInfo) {
            try {
              const parsed = JSON.parse(cachedInfo);
              setCurrentUserInfo(parsed);
            } catch (e) {
              console.warn("Local storage parsing failed:", e);
            }
          } else {
            // Safe initial placeholder prior to background resolution
            setCurrentUserInfo({
              username: user.email?.split("@")[0] || "explorer",
              nickname: user.displayName || "Explorer",
              gpgTimestamps: [],
              avatarUrl: user.photoURL || "",
              bio: "",
              email: user.email || "",
              themeColor: "",
            });
          }

          // Unsubscribe previous, and start a real-time onSnapshot immediately for cache-fast UI
          unsubUserDoc = onSnapshot(
            userRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                const userInfoObj = {
                  username: data.username || data.email || "Explorer",
                  nickname: data.nickname || "Explorer",
                  gpgTimestamps: data.gpgTimestamps || [],
                  avatarUrl: data.avatarUrl || data.photoURL || "",
                  bio: data.bio || "",
                  email: data.email || "",
                  themeColor: data.themeColor || "",
                };
                setCurrentUserInfo(userInfoObj);

                try {
                  localStorage.setItem(
                    `gamura_user_info_${user.uid}`,
                    JSON.stringify(userInfoObj),
                  );
                  saveAccountSession({
                    uid: user.uid,
                    username: userInfoObj.username,
                    nickname: userInfoObj.nickname,
                    email: user.email || `${userInfoObj.username}@gamura.app`,
                    avatarUrl: userInfoObj.avatarUrl,
                  });
                } catch (err) {
                  console.warn("Storage writing bypassed in container:", err);
                }
              }
            },
            (err) => {
              console.error("User doc real-time subscription error:", err);
            },
          );

          // Run deep database existence checks, profile synchronization, and fallbacks asynchronously
          // in the background, ensuring 0ms blocking latency on the main UI and routing thread!
          (async () => {
            try {
              let userDoc = null;
              try {
                userDoc = await getDocWithTimeout(userRef, 3000);
              } catch (err) {
                console.warn(
                  "User doc background fetch timed out. Proceeding under cache fallback...",
                  err,
                );
              }

              const isMobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              const platformStr = isMobileCheck ? (/iPad/i.test(navigator.userAgent) ? "Tablet" : "Mobile") : "Desktop";

              if (userDoc && !userDoc.exists()) {
                const usernameBase = (
                  user.email?.split("@")[0] || "user"
                ).replace(/[^a-zA-Z0-9]/g, "");
                const finalUsername =
                  usernameBase.length < 6
                    ? (
                        usernameBase +
                        Math.random().toString(36).substring(2, 8)
                      ).substring(0, 10)
                    : usernameBase;
                const displayName = user.displayName || "Explorer";

                // Generate unique username reservation
                const uDoc = await getDocWithTimeout(
                  doc(db, "usernames", finalUsername.toLowerCase()),
                  3000,
                ).catch(() => null);
                const finalUniqueUsername =
                  uDoc && uDoc.exists()
                    ? (
                        finalUsername + Math.floor(Math.random() * 1000)
                      ).substring(0, 15)
                    : finalUsername;

                await setDoc(
                  doc(db, "usernames", finalUniqueUsername.toLowerCase()),
                  { uid: user.uid },
                ).catch(() => null);

                const userData = {
                  uid: user.uid,
                  email: user.email || `${finalUniqueUsername}@gamura.app`,
                  username: finalUniqueUsername,
                  nickname: displayName,
                  photoURL: user.photoURL || null,
                  lastLogin: serverTimestamp(),
                  createdAt: serverTimestamp(),
                  platform: platformStr,
                  gpgTimestamps: [],
                };
                await setDoc(userRef, userData).catch(() => null);

                // Update real time user count metric
                try {
                  const statsRef = doc(db, "system", "stats");
                  const statsDoc = await getDoc(statsRef).catch(() => null);
                  if (statsDoc && !statsDoc.exists()) {
                    await setDoc(
                      statsRef,
                      { loginCount: 1, totalUsers: 1, [platformStr.toLowerCase() + "Count"]: 1 },
                      { merge: true },
                    );
                  } else {
                    await updateDoc(statsRef, { 
                      totalUsers: increment(1),
                      [platformStr.toLowerCase() + "Count"]: increment(1)
                    });
                  }
                } catch (e) {
                  console.error("Failed to increment total users", e);
                }

                // Also assert dev profile in fallback path
                const devProfile = {
                  username: finalUniqueUsername,
                  email: user.email || `${finalUniqueUsername}@gamura.app`,
                  blocks: [],
                  published: false,
                  plan: "Starter",
                  clicks: 0,
                  views: 1,
                  visitors: 1,
                  engagements: 1,
                  updatedAt: serverTimestamp(),
                };
                await setDoc(
                  doc(
                    db,
                    "gamura_developers",
                    finalUniqueUsername.toLowerCase(),
                  ),
                  devProfile,
                ).catch(() => null);

                // Instantly pop unique Gamura ID screen
                setCreatedGamuraIdInfo({
                  username: finalUniqueUsername,
                  nickname: displayName,
                  uid: user.uid,
                });
              } else if (userDoc) {
                const data = userDoc.data();
                const userData: any = {
                  uid: user.uid,
                  lastLogin: serverTimestamp(),
                  platform: platformStr,
                };
                if (user.email) userData.email = user.email;
                if (user.photoURL) userData.photoURL = user.photoURL;
                await updateDoc(userRef, userData).catch(() => null);

                // Track daily session
                const today = new Date().toISOString().split('T')[0];
                try {
                   const analyticsRef = doc(db, "analytics", "traffic", "weekly", today);
                   const anDoc = await getDoc(analyticsRef).catch(()=>null);
                   if (!anDoc?.exists()) {
                     await setDoc(analyticsRef, { sessions: 1 }, { merge: true });
                   } else {
                     await updateDoc(analyticsRef, { sessions: increment(1) });
                   }
                } catch(e) {}
              }
            } catch (bgErr) {
              console.warn("Background user doc synchronization error:", bgErr);
            }

            // Log as activity in the background
            try {
              const freshDoc = await getDocWithTimeout(userRef, 2000).catch(
                () => null,
              );
              const data = freshDoc?.data();
              if (data) {
                await setDoc(doc(collection(db, "activities")), {
                  title: `${data.username || data.email} logged in`,
                  ic: "🔑",
                  timestamp: serverTimestamp(),
                  user: data.username || data.email,
                  userId: user.uid,
                }).catch(() => null);
              }
            } catch (err) {
              console.error("Activity log failed", err);
            }
          })();
        } catch (e) {
          const errStr = e instanceof Error ? e.message : String(e);
          console.warn(
            "Authentication loader encountered an issue (likely offline/network limit). Activating safe fallback...",
            errStr,
          );
          try {
            const cached = localStorage.getItem(`gamura_user_info_${user.uid}`);
            if (cached) {
              setCurrentUserInfo(JSON.parse(cached));
            } else {
              setCurrentUserInfo({
                username: user.email?.split("@")[0] || "Explorer",
                nickname: user.displayName || "Explorer",
                gpgTimestamps: [],
                avatarUrl: user.photoURL || "",
                bio: "",
                email: user.email || "",
              });
            }
          } catch (cacheErr) {
            console.error("Local storage fallback restore failed:", cacheErr);
            setCurrentUserInfo({
              username: user.email?.split("@")[0] || "Explorer",
              nickname: user.displayName || "Explorer",
              gpgTimestamps: [],
              avatarUrl: user.photoURL || "",
              bio: "",
              email: user.email || "",
            });
          }
        }
      } else {
        setCurrentUserInfo(null);
        setChats([]);
        setCurrentChatId(null);
        setPassword("");
        setNickname("");
        setAuthError(null);
        // Only redirect to home if they are on a protected page
        setCurrentPage((prev) => {
          if (
            ["blank", "universe-active", "aura", "gpg", "history"].includes(
              prev,
            )
          ) {
            return "home";
          }
          return prev;
        });
      }
    });

    // Load active account switcher items initially
    loadSavedAccounts();

    return () => {
      unsubscribe();
      unsubUserDoc();
    };
  }, []);

  // Real-time Neural Link Notification System
  useEffect(() => {
    if (!currentUser) return;

    const bootTime = Date.now();
    const notifiedRequestIds = new Set<string>();
    const notifiedMessageIds = new Set<string>();

    // 1. Connection Requests background listener
    const reqQuery = query(
      collection(db, "neural_requests"),
      where("receiverUid", "==", currentUser.uid),
    );

    const unsubRequests = onSnapshot(
      reqQuery,
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const reqId = change.doc.id;
            const reqData = change.doc.data();
            if (reqData.status !== "pending") return; // Client-side filter

            // Skip if already notified or before boot (allowing 5-second buffer)
            const reqTime = reqData.timestamp?.toMillis
              ? reqData.timestamp.toMillis()
              : reqData.timestamp || Date.now();
            if (notifiedRequestIds.has(reqId) || reqTime < bootTime - 5000) {
              notifiedRequestIds.add(reqId);
              return;
            }

            notifiedRequestIds.add(reqId);

            const sender = reqData.senderNickname || "A user";
            // Trigger UI Toast alert
            showToast(
              "📡",
              "Connection Request",
              `@${sender} wants to link orbits in Gamura Universe!`,
              "info",
            );

            // Persist a notification in Firestore users/${user.uid}/notifications
            try {
              await setDoc(
                doc(collection(db, `users/${currentUser.uid}/notifications`)),
                {
                  msg: `@${sender} sent you a connection request.`,
                  ic: "📡",
                  unread: true,
                  timestamp: serverTimestamp(),
                },
              );
            } catch (err) {
              console.warn(
                "Could not save request notification in database:",
                err,
              );
            }
          }
        });
      },
      (error) => {
        console.warn("Background requests notification listener issue:", error);
      },
    );

    // 2. Chat Messages background listener
    // First subscribe to active chats that the user is a member of
    const chatsQuery = query(
      collection(db, "neural_chats"),
      where("members", "array-contains", currentUser.uid),
    );

    // Keep track of active message unsubscribers to clean them up on rebuild or unmount
    const messageUnsubscribes = new Map<string, () => void>();

    const unsubChats = onSnapshot(
      chatsQuery,
      (chatsSnap) => {
        const currentChatIds = new Set<string>();

        chatsSnap.docs.forEach((chatDoc) => {
          const chatId = chatDoc.id;
          currentChatIds.add(chatId);

          // If we don't have a listener for this chat yet, create it!
          if (!messageUnsubscribes.has(chatId)) {
            const msgQuery = query(
              collection(db, `neural_chats/${chatId}/messages`),
              orderBy("timestamp", "desc"),
              limit(1),
            );

            const unsubMsgs = onSnapshot(
              msgQuery,
              (msgsSnap) => {
                if (msgsSnap.empty) return;
                const latestMsgDoc = msgsSnap.docs[0];
                const msgId = latestMsgDoc.id;
                const msgData = latestMsgDoc.data();

                // Skip if send by self, or already notified, or before boot
                if (msgData.senderId === currentUser.uid) {
                  notifiedMessageIds.add(msgId);
                  return;
                }

                const msgTime = msgData.timestamp?.toMillis
                  ? msgData.timestamp.toMillis()
                  : msgData.timestamp || Date.now();
                if (
                  notifiedMessageIds.has(msgId) ||
                  msgTime < bootTime - 5000
                ) {
                  notifiedMessageIds.add(msgId);
                  return;
                }

                notifiedMessageIds.add(msgId);

                const sender = msgData.senderName || "Collaborator";
                const text = msgData.text || "Sent a message";

                // Trigger UI Toast alert
                showToast("💬", `Neural Message: @${sender}`, text, "info");

                // Persist a notification in Firestore users/${user.uid}/notifications
                (async () => {
                  try {
                    await setDoc(
                      doc(
                        collection(
                          db,
                          `users/${currentUser.uid}/notifications`,
                        ),
                      ),
                      {
                        msg: `@${sender}: ${text.length > 50 ? text.substring(0, 47) + "..." : text}`,
                        ic: "💬",
                        unread: true,
                        timestamp: serverTimestamp(),
                      },
                    );
                  } catch (err) {
                    console.warn(
                      "Could not save message notification in database:",
                      err,
                    );
                  }
                })();
              },
              (error) => {
                console.warn(
                  `Background messages listener for chat ${chatId} issue:`,
                  error,
                );
              },
            );

            messageUnsubscribes.set(chatId, unsubMsgs);
          }
        });

        // Cleanup listeners for deleted or removed chats
        messageUnsubscribes.forEach((unsub, chatId) => {
          if (!currentChatIds.has(chatId)) {
            unsub();
            messageUnsubscribes.delete(chatId);
          }
        });
      },
      (error) => {
        console.warn("Background chats notification listener issue:", error);
      },
    );

    return () => {
      unsubRequests();
      unsubChats();
      messageUnsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, `users/${currentUser.uid}/chats`),
      limit(50),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedChats: Chat[] = [];
        snapshot.forEach((doc) => {
          fetchedChats.push(doc.data() as Chat);
        });
        fetchedChats.sort((a, b) => b.timestamp - a.timestamp);
        setChats(fetchedChats);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${currentUser.uid}/chats`,
        );
      },
    );
    return () => unsubscribe();
  }, [currentUser]);

  const [gpgInput, setGpgInput] = useState("");
  const [isGpgLoading, setIsGpgLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [portfolioTab, setPortfolioTab] = useState<
    "home" | "education" | "achievement" | "contact" | "projects"
  >("home");
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<{
    title: string;
    img: string;
  } | null>(null);
  const [showProgressAlert, setShowProgressAlert] = useState(false);

  const copyToClipboard = useCallback((text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const cleanPrompt = useCallback((text: string) => {
    // Remove markdown code blocks if present
    return text
      .replace(/```[a-z]*\n?/gi, "")
      .replace(/```/g, "")
      .trim();
  }, []);

  const currentChat = useMemo(
    () => chats.find((c) => c.id === currentChatId) || null,
    [chats, currentChatId],
  );
  const gpgMessages = useMemo(() => currentChat?.messages || [], [currentChat]);

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    setIsDeletingChat(chatId);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/chats`, chatId));
      if (currentChatId === chatId) setCurrentChatId(null);
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.DELETE,
        `users/${currentUser.uid}/chats/${chatId}`,
      );
    } finally {
      setIsDeletingChat(null);
    }
  };

  const startNewChat = useCallback(async () => {
    const newId = Date.now().toString();
    const newChat: Chat = {
      id: newId,
      title: "New Chat",
      messages: [],
      timestamp: Date.now(),
      userId: currentUser?.uid,
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newId);
    setCurrentPage("gpg");
    setIsMenuOpen(false);

    if (currentUser) {
      try {
        await setDoc(doc(db, `users/${currentUser.uid}/chats`, newId), newChat);
      } catch (e) {
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `users/${currentUser.uid}/chats/${newId}`,
        );
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gpgMessages]);

  const handleGpgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpgInput.trim() || isGpgLoading) return;

    if (currentUser && currentUserInfo) {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const recentTimestamps = (currentUserInfo.gpgTimestamps || []).filter(
        (t: number) => now - t < twentyFourHours,
      );
      if (recentTimestamps.length >= 3) {
        setLimitError(
          "Your daily limit is over. Please try again after 24 hours.",
        );
        setTimeout(() => setLimitError(null), 5000);
        return;
      }
    }

    let activeChatId = currentChatId;
    let oldChatMessages: Message[] = [];
    let chatTitle = gpgInput.slice(0, 30) + (gpgInput.length > 30 ? "..." : "");
    let baseTimestamp = Date.now();

    // If no active chat, create one
    if (!activeChatId) {
      activeChatId = Date.now().toString();
      setCurrentChatId(activeChatId);
    } else {
      const existingChat = chats.find((c) => c.id === activeChatId);
      if (existingChat) {
        oldChatMessages = existingChat.messages;
        chatTitle =
          existingChat.messages.length === 0 ? chatTitle : existingChat.title;
        baseTimestamp = existingChat.timestamp;
      }
    }

    const userMessage: Message = { role: "user", content: gpgInput };
    const newMessages = [...oldChatMessages, userMessage];

    const newChatSession: Chat = {
      id: activeChatId,
      title: chatTitle,
      messages: newMessages,
      timestamp: baseTimestamp,
      userId: currentUser?.uid,
    };

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === activeChatId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = newChatSession;
        return next;
      }
      return [newChatSession, ...prev];
    });

    if (currentUser) {
      setDoc(
        doc(db, `users/${currentUser.uid}/chats`, activeChatId),
        newChatSession,
      ).catch((e) => {
        handleFirestoreError(
          e,
          OperationType.WRITE,
          `users/${currentUser.uid}/chats/${activeChatId}`,
        );
      });
    }

    setGpgInput("");
    setIsGpgLoading(true);

    try {
      const toolContext = selectedTool
        ? `[TOOL: ${selectedTool.toUpperCase()}] `
        : "";
      const ai = getAi();

      if (!ai) {
        throw new Error(
          "GEMINI_API_KEY is missing. Please configure it in the Secrets panel.",
        );
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: newMessages.map((m) => ({
          role: m.role,
          parts: [
            { text: m.role === "user" ? toolContext + m.content : m.content },
          ],
        })),
        config: {
          systemInstruction: `You are the Gamura Prompt Generator (GPG) v3.1. Your ONLY purpose is to generate highly optimized prompts based on the user's input.
          If the user asks a general question, tries to chat with you, or asks you to do anything OTHER than generating a prompt, you MUST reply with exactly: "I'm a GPG". Do not generate a prompt in this case.
          When generating a prompt, your output MUST be ONLY the generated prompt.
          
          STRICT RULES:
          1. ONLY generate prompts. Otherwise reply "I'm a GPG".
          2. NO conversational filler.
          3. NO markdown formatting.
          4. NO unwanted symbols.
          5. Output ONLY the raw prompt text.
          
          TOOL-SPECIFIC OPTIMIZATION:
          - CODE: Focus on logic, language-specific best practices, and architecture.
          - IMAGE: Focus on cinematic lighting, camera specs (35mm, f/1.8), and artistic style.
          - VIDEO: Focus on camera movement (pan, tilt, zoom), frame rate, and temporal consistency.
          - MATHS: Focus on step-by-step logic, precision, and mathematical notation.
          - CHART: Focus on data structure, axes labels, and visual clarity.
          - GRAPH: Focus on nodes, edges, relationships, and topological layout.
          
          SPEED:
          - Provide the absolute best version immediately.`,
          temperature: 0.4,
        },
      });

      const modelMessage: Message = {
        role: "model",
        content:
          response.text ||
          "I couldn't generate a prompt right now. Please try again.",
      };

      const aiChatSession: Chat = {
        id: activeChatId,
        title: chatTitle,
        messages: [...newMessages, modelMessage],
        timestamp: baseTimestamp,
        userId: currentUser?.uid,
      };

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === activeChatId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = aiChatSession;
          return next;
        }
        return [aiChatSession, ...prev];
      });

      if (
        currentUser &&
        currentUserInfo &&
        modelMessage.content !== "I'm a GPG" &&
        !modelMessage.content.startsWith("Error:")
      ) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const updatedTimestamps = [
          ...(currentUserInfo.gpgTimestamps || []).filter(
            (t: number) => now - t < twentyFourHours,
          ),
          now,
        ];
        setCurrentUserInfo({
          ...currentUserInfo,
          gpgTimestamps: updatedTimestamps,
        });

        updateDoc(doc(db, "users", currentUser.uid), {
          gpgTimestamps: updatedTimestamps,
        }).catch((e) => {
          handleFirestoreError(
            e,
            OperationType.UPDATE,
            `users/${currentUser.uid}`,
          );
        });
      }

      if (currentUser) {
        setDoc(
          doc(db, `users/${currentUser.uid}/chats`, activeChatId),
          aiChatSession,
        ).catch((e) => {
          handleFirestoreError(
            e,
            OperationType.WRITE,
            `users/${currentUser.uid}/chats/${activeChatId}`,
          );
        });
      }
    } catch (error: any) {
      console.error("GPG Error:", error);
      const errorMessage: Message = {
        role: "model",
        content: `Error: ${error.message || "Could not connect to the AI service. Please ensure your GEMINI_API_KEY is configured in the Secrets panel."}`,
      };

      const errorChatSession: Chat = {
        id: activeChatId!,
        title: chatTitle,
        messages: [...newMessages, errorMessage],
        timestamp: baseTimestamp,
        userId: currentUser?.uid,
      };

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === activeChatId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = errorChatSession;
          return next;
        }
        return [errorChatSession, ...prev];
      });

      if (currentUser && activeChatId) {
        setDoc(
          doc(db, `users/${currentUser.uid}/chats`, activeChatId),
          errorChatSession,
        ).catch((e) => {
          handleFirestoreError(
            e,
            OperationType.WRITE,
            `users/${currentUser.uid}/chats/${activeChatId}`,
          );
        });
      }
    } finally {
      setIsGpgLoading(false);
    }
  };

  if (createdGamuraIdInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        {/* Rotating Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-8"
        >
          {/* Animated Avatar Core Badge */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse" />
            <div className="relative w-full h-full bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400 text-3xl font-sans">
              G
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-400 to-teal-500 p-1.5 rounded-xl border-2 border-zinc-900 shadow-md text-white"
            >
              <Check size={16} strokeWidth={3} />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 uppercase font-sans">
              GAMURA ID ACTIVATED
            </h2>
            <p className="text-[10px] text-zinc-400 tracking-wide leading-relaxed font-sans font-medium uppercase px-2">
              Your cryptographic identity link has been securely established on
              the decentralised node.
            </p>
          </div>

          {/* Gamura ID Card Details */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-zinc-800/40 group-hover:text-zinc-600 transition-colors">
              <Shield size={40} className="stroke-1 animate-pulse" />
            </div>
            <div className="space-y-4 relative z-10">
              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  GAMURA UNIQUE ID
                </div>
                <div className="text-lg font-mono font-bold tracking-tight flex items-center gap-1.5 text-sky-450 text-zinc-100">
                  <User size={16} className="text-sky-500" />@
                  {createdGamuraIdInfo.username}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  SECURE CREDENTIAL OWNER
                </div>
                <div className="text-sm font-sans font-bold text-zinc-205 uppercase tracking-wide text-zinc-200">
                  {createdGamuraIdInfo.nickname}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  NODE ACCESS KEY (UID)
                </div>
                <div className="text-[10px] font-mono text-zinc-450 truncate tracking-wider text-zinc-400">
                  {createdGamuraIdInfo.uid}
                </div>
              </div>
            </div>
          </div>

          {/* Enter Button */}
          <button
            onClick={() => {
              setCreatedGamuraIdInfo(null);
              setCurrentPage("blank");
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-sans text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-sky-500/15 flex items-center justify-center gap-2 group border border-zinc-800/10"
          >
            <span>Activate & Enter Gamura Universe</span>
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </motion.div>
      </div>
    );
  }

  if (currentPage === "portfolio") {
    const tabs = [
      { id: "home", label: "Home", icon: <Home size={16} /> },
      {
        id: "education",
        label: "Education",
        icon: <GraduationCap size={16} />,
      },
      { id: "achievement", label: "Achievement", icon: <Trophy size={16} /> },
      { id: "projects", label: "Projects", icon: <Briefcase size={16} /> },
      { id: "contact", label: "Contact", icon: <Mail size={16} /> },
    ];

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
        {/* Portfolio Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800/50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950/80 backdrop-blur-md z-20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentPage("home")}
            className="text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-[10px] font-bold uppercase tracking-widest whitespace-nowrap mr-4"
          >
            ← Exit
          </button>
          <div className="flex gap-2 md:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPortfolioTab(tab.id as any)}
                className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-2 whitespace-nowrap ${
                  portfolioTab === tab.id
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/20"
                    : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="w-4 md:w-10 shrink-0"></div> {/* Spacer */}
        </div>

        {/* Portfolio Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={portfolioTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {portfolioTab === "home" && (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                    <div className="relative group">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-2 border-zinc-900 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <SafeImage
                          srcs={profileImgSources}
                          alt="Profile"
                          className="w-full h-full object-cover transition-all duration-700"
                          fallbackIcon={User}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4 flex-1 text-center md:text-left">
                      <div className="space-y-1">
                        <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                          SELVARANJAN G
                        </h1>
                        <p className="text-zinc-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em]">
                          Aspiring Developer & AI Enthusiast
                        </p>
                      </div>
                      <p className="text-zinc-500 text-xs md:text-sm max-w-md leading-relaxed mx-auto md:mx-0">
                        Welcome to my professional space. I am a dedicated
                        student and aspiring developer, currently building the
                        future through code and AI.
                      </p>
                      <button
                        onClick={() => setPortfolioTab("contact")}
                        className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                      >
                        Get In Touch
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-black dark:border-white transition-all duration-500">
                      <div className="space-y-1">
                        <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">
                          Current Location
                        </h3>
                        <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                          MADHURAVOYAL, CHENNAI
                        </p>
                        <p className="text-xs text-zinc-500">
                          TAMIL NADU, INDIA
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50 group-hover:bg-black dark:hover:bg-white group-hover:text-white transition-all duration-500">
                        <MapPin size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {portfolioTab === "education" && (
                <div className="space-y-16">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                      Education & Certifications
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A journey of continuous learning, combining formal
                      academic studies with specialized technical
                      certifications.
                    </p>
                  </div>

                  {/* Formal Education - Tech Timeline Style */}
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                      Academic Path
                    </h3>
                    <div className="grid gap-6">
                      {[
                        {
                          year: "2026 - Present",
                          degree: "Bachelor of Computer Applications (BCA)",
                          school: "DDGD VAISHNAV COLLEGE",
                          status: "In Progress",
                          details:
                            "Focusing on core computing principles, programming, and database management.",
                        },
                        {
                          year: "2024 - 2025",
                          degree: "12th Grade (Higher Secondary)",
                          school:
                            "Bharathi Matriculation Higher Secondary School",
                          status: "Completed",
                          details:
                            "Specialized in Computer Application and Accounting.",
                        },
                      ].map((edu, i) => (
                        <div
                          key={i}
                          className="group p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 hover:border-black dark:border-white transition-all duration-500 relative overflow-hidden"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                                  {edu.year}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {edu.status}
                                </span>
                              </div>
                              <h4 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {edu.degree}
                              </h4>
                              <p className="text-sm font-medium text-zinc-600">
                                {edu.school}
                              </p>
                              <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
                                {edu.details}
                              </p>
                            </div>
                            <GraduationCap
                              className="text-zinc-200 group-hover:text-black dark:hover:text-white dark:text-white transition-colors duration-500"
                              size={40}
                            />
                          </div>
                          {/* Tech background element */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 rounded-full -mr-16 -mt-16 group-hover:bg-zinc-200 transition-colors duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications - Tech Card Style */}
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                      Technical Certifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 border-2 border-zinc-900 rounded-[2rem] bg-white dark:bg-zinc-950 space-y-6 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
                            <Sparkles className="text-white" size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold leading-tight">
                              Google Gemini Certified Student
                            </h4>
                            <p className="text-xs text-zinc-500 font-medium">
                              Verified by Google Cloud / AI
                            </p>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Advanced certification in Generative AI, prompt
                            engineering, and Gemini model integration.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCertificateModal(true)}
                          className="flex items-center justify-between w-full px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-white transition-colors"
                        >
                          View Certificate
                          <ImageIcon size={14} />
                        </button>
                      </div>

                      <div className="p-8 border border-zinc-100 dark:border-zinc-800/50 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 space-y-6 flex flex-col justify-center items-center text-center border-dashed">
                        <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center">
                          <Code className="text-zinc-400" size={20} />
                        </div>
                        <p className="text-xs text-zinc-400 font-medium px-4">
                          More certifications in progress...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {portfolioTab === "achievement" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                      Achievements
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A collection of certifications and milestones achieved
                      through dedicated learning and project development.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Certificate 1",
                        img: "https://lh3.googleusercontent.com/d/1S4-Pbg4Thuhtfcre2ZzLy50V7KyVidLT",
                      },
                      {
                        title: "Certificate 2",
                        img: "https://lh3.googleusercontent.com/d/1eoBSv6wF7gSiTJLGhkOP2qmYxRc90chh",
                      },
                      {
                        title: "Certificate 3",
                        img: "https://lh3.googleusercontent.com/d/119SgtcAstv_4_9gD6z1dLNmgomGyIhtC",
                      },
                      {
                        title: "Certificate 4",
                        img: "https://lh3.googleusercontent.com/d/1esS_LDdf7s2Jrwze0WYmjVOgFMmPQr80",
                      },
                      {
                        title: "Certificate 5",
                        img: "https://lh3.googleusercontent.com/d/1LpO8rlqbvF6odUZvhvajxcplWBd8rhLV",
                      },
                      {
                        title: "Certificate 6",
                        img: "https://lh3.googleusercontent.com/d/1R6I1KI_Wi3cpHLOory2jGY2nd1CVqVDb",
                      },
                      {
                        title: "Certificate 7",
                        img: "https://lh3.googleusercontent.com/d/1iQg5hNZvU5AyeQy7tCwF-AYGJnuu5wY9",
                      },
                      {
                        title: "Certificate 8",
                        img: "https://lh3.googleusercontent.com/d/1_yo_YItLXuBwj4d5r0GPzWQzYXzDOL-c",
                      },
                    ].map((ach, i) => (
                      <div
                        key={i}
                        className="group p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 hover:border-black dark:border-white transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
                        onClick={() =>
                          setSelectedAchievement({
                            title: ach.title,
                            img: ach.img,
                          })
                        }
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50 group-hover:bg-black dark:hover:bg-white transition-colors duration-500 overflow-hidden">
                            <SafeImage
                              srcs={[ach.img]}
                              alt={ach.title}
                              className="w-full h-full object-cover"
                              fallbackIcon={Trophy}
                            />
                          </div>
                          <h3 className="font-bold text-lg tracking-tight">
                            {ach.title}
                          </h3>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black dark:hover:text-white dark:text-white transition-colors">
                          <span>View Certificate</span>
                          <ImageIcon size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolioTab === "projects" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                      Featured Projects
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A showcase of my technical work, focusing on AI
                      integration and modern web development.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {[{ name: "GAMURA", type: "FIRST PROJECT" }].map(
                      (project, i) => (
                        <div
                          key={i}
                          className="flex flex-col md:flex-row items-center justify-between p-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 group hover:border-black dark:border-white transition-all duration-500 gap-8"
                        >
                          <div className="space-y-4 text-center md:text-left">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                {project.type}
                              </span>
                              <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {project.name}
                              </h3>
                            </div>
                            <button
                              onClick={() => setShowProjectModal(true)}
                              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
                            >
                              View Project
                              <ImageIcon size={14} />
                            </button>
                          </div>
                          <div className="w-20 h-20 bg-white dark:bg-zinc-950 rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50 group-hover:bg-black dark:hover:bg-white group-hover:text-white transition-all duration-500">
                            <Briefcase size={32} />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {portfolioTab === "contact" && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="w-full md:w-1/2 space-y-8">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                          Contact
                        </h2>
                        <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">
                          SELVARANJAN G
                        </h3>
                        <p className="text-zinc-500">
                          Interested in working together? Let's connect and
                          build something extraordinary.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <a
                          href="mailto:selva6ranjan@gmail.com"
                          className="flex items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 group hover:border-black dark:border-white transition-colors"
                        >
                          <div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                            <Mail
                              className="text-zinc-400 group-hover:text-black dark:hover:text-white dark:text-white transition-colors"
                              size={18}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              Email
                            </p>
                            <p className="text-sm font-medium">
                              selva6ranjan@gmail.com
                            </p>
                          </div>
                        </a>

                        <div className="flex items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 group hover:border-black dark:border-white transition-colors">
                          <div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                            <Phone
                              className="text-zinc-400 group-hover:text-black dark:hover:text-white dark:text-white transition-colors"
                              size={18}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              Mobile
                            </p>
                            <p className="text-sm font-medium">
                              +91 9514384345
                            </p>
                          </div>
                        </div>

                        <a
                          href="https://linkedin.com/in/selvaranjang"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 group hover:border-black dark:border-white transition-colors"
                        >
                          <div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                            <Linkedin
                              className="text-zinc-400 group-hover:text-black dark:hover:text-white dark:text-white transition-colors"
                              size={18}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              LinkedIn
                            </p>
                            <p className="text-sm font-medium">
                              linkedin.com/in/selvaranjang
                            </p>
                          </div>
                        </a>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2">
                      <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border-2 border-zinc-900 shadow-2xl relative group">
                        <SafeImage
                          srcs={profileImgSources}
                          alt="SELVARANJAN G"
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                          fallbackIcon={User}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                          <p className="text-white text-xs font-bold uppercase tracking-[0.3em]">
                            SELVARANJAN G
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Certificate Modal */}
        <AnimatePresence>
          {showCertificateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setShowCertificateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black dark:hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2">
                  <SafeImage
                    srcs={certImgSources}
                    alt="Google Gemini Certificate"
                    className="w-full h-auto rounded-2xl"
                    fallbackIcon={Trophy}
                    fallbackText="Certificate Not Found"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Modal */}
        <AnimatePresence>
          {showProjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setShowProjectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black dark:hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center min-h-[200px]">
                  <SafeImage
                    srcs={secondaryLogoSources}
                    alt="GAMURA Project"
                    className="w-full h-auto rounded-2xl"
                    fallbackIcon={Briefcase}
                    fallbackText="GAMURA Project"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black dark:hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2">
                  <SafeImage
                    srcs={[selectedAchievement.img]}
                    alt={selectedAchievement.title}
                    className="w-full h-auto rounded-2xl"
                    fallbackIcon={Trophy}
                    fallbackText="Achievement Image Not Found"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (currentPage === "history") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-6 text-center">
          <button
            onClick={() => setCurrentPage("home")}
            className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-xs font-medium"
          >
            ← Back
          </button>
          <div className="max-w-md w-full space-y-8 p-8 border border-zinc-100 dark:border-zinc-800/50 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <History className="text-zinc-400" size={32} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
                Login Required
              </h2>
              <p className="text-zinc-500 text-sm">
                Chat history is only available for registered users. Please sign
                in to see your previous chats.
              </p>
            </div>
            <div className="pt-6 space-y-3">
              <button
                onClick={() => setCurrentPage("login")}
                className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-4 font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col p-6">
        <button
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-xs font-medium"
        >
          ← Back
        </button>

        <div className="max-w-2xl mx-auto w-full mt-12 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              CHAT HISTORY
            </h2>
            <p className="text-sm text-zinc-500">
              Your previous prompt generations
            </p>
          </div>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-3xl">
                <p className="text-zinc-400 text-sm">
                  No history yet. Start a new chat!
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setCurrentPage("gpg");
                  }}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 rounded-2xl transition-all group border border-zinc-100 dark:border-zinc-800/50 cursor-pointer"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                      {chat.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
                      {new Date(chat.timestamp).toLocaleDateString()} •{" "}
                      {chat.messages.length} messages
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      disabled={isDeletingChat === chat.id}
                      className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      {isDeletingChat === chat.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-zinc-400"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                    <div className="text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "signup") {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-6">
        <button
          onClick={() => {
            setAuthError(null);
            setCurrentPage("login");
          }}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-xs font-medium"
        >
          ← Back to Login
        </button>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800/50 mx-auto bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
              <SafeImage
                srcs={secondaryLogoSources}
                alt="GPG Logo"
                className="w-full h-full object-cover"
                fallbackIcon={Sparkles}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                GAMURA SIGNUP
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Create unique Gamura ID
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (username.length < 6) {
                setAuthError("Username must be at least 6 characters long.");
                return;
              }
              if (password.length < 8) {
                setAuthError("Password must be at least 8 characters long.");
                return;
              }
              setAuthError(null);
              setIsAuthLoading(true);

              try {
                const usernameLower = username.trim().toLowerCase();
                const usernameDoc = await getDoc(
                  doc(db, "usernames", usernameLower),
                ).catch(() => null);
                if (usernameDoc && usernameDoc.exists()) {
                  setAuthError(
                    "This Gamura ID is already taken. Please choose another.",
                  );
                  setIsAuthLoading(false);
                  return;
                }

                const finalEmail =
                  email.trim() || `${usernameLower}@gamura.app`;

                // Prevent race conditions in onAuthStateChanged
                (window as any).isRegisteringUser = true;

                let user;
                try {
                  const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    finalEmail,
                    password,
                  );
                  user = userCredential.user;
                } catch (regErr: any) {
                  if (
                    regErr.code === "auth/email-already-in-use" ||
                    (regErr.message &&
                      regErr.message
                        .toLowerCase()
                        .includes("email-already-in-use"))
                  ) {
                    try {
                      const userCredential = await signInWithEmailAndPassword(
                        auth,
                        finalEmail,
                        password,
                      );
                      user = userCredential.user;
                    } catch (loginErr) {
                      throw regErr; // Throw original registration error if password doesn't match
                    }
                  } else {
                    throw regErr;
                  }
                }

                try {
                  // Run background writes concurrently to skip waiting for server ack
                  Promise.all([
                    (async () => {
                      try {
                        const statsRef = doc(db, "system", "stats");
                        const statsDoc = await getDoc(statsRef).catch(
                          () => null,
                        );
                        if (statsDoc && !statsDoc.exists()) {
                          await setDoc(
                            statsRef,
                            { loginCount: 1, totalUsers: 1 },
                            { merge: true },
                          );
                        } else {
                          await updateDoc(statsRef, {
                            totalUsers: increment(1),
                            loginCount: increment(1),
                          });
                        }
                      } catch (e) {
                        console.error("Failed to increment total users", e);
                      }
                    })(),
                    setDoc(doc(db, "usernames", usernameLower), {
                      uid: user.uid,
                    }).catch((err) => {
                      console.warn(
                        "Failsafe warning: Username reservation skipped (likely offline)",
                        err,
                      );
                    }),
                    setDoc(doc(db, "users", user.uid), {
                      uid: user.uid,
                      email: finalEmail,
                      username: username,
                      nickname: nickname,
                      createdAt: Date.now(),
                      gpgTimestamps: [],
                      lastLogin: Date.now(),
                    }).catch((err) => {
                      console.warn(
                        "Failsafe warning: User document creation skipped (likely offline)",
                        err,
                      );
                    }),
                    setDoc(doc(db, "gamura_developers", usernameLower), {
                      uid: user.uid,
                      username: username,
                      email: finalEmail,
                      blocks: [],
                      published: false,
                      plan: "Starter",
                      clicks: 0,
                      views: 1,
                      visitors: 1,
                      engagements: 1,
                      updatedAt: serverTimestamp(),
                    }).catch((err) => {
                      console.warn(
                        "Failsafe warning: Developer profile skipped",
                        err,
                      );
                    }),
                  ]);

                  // 3. Set current user states so the app is instantly active
                  const userInfoObj = {
                    username: username,
                    nickname: nickname,
                    gpgTimestamps: [],
                  };
                  setCurrentUserInfo(userInfoObj);

                  try {
                    localStorage.setItem(
                      `gamura_user_info_${user.uid}`,
                      JSON.stringify(userInfoObj),
                    );
                    localStorage.setItem(
                      `gamura_id_email_${usernameLower}`,
                      finalEmail,
                    );
                  } catch (stErr) {
                    console.warn("Local storage write skipped:", stErr);
                  }

                  // Add activity log in background to eliminate registration latency
                  setDoc(doc(collection(db, "activities")), {
                    title: `${username} created a Gamura ID`,
                    ic: "✨",
                    timestamp: serverTimestamp(),
                    user: username,
                    userId: user.uid,
                  }).catch((err) =>
                    console.error("Silent activity warning:", err),
                  );

                  setCreatedGamuraIdInfo({
                    username: username,
                    nickname: nickname,
                    uid: user.uid,
                  });

                  setUsername("");
                  setPassword("");
                  setEmail("");
                  setNickname("");
                } catch (dbError) {
                  console.error(
                    "Silent db fallback activated for login registration",
                    dbError,
                  );
                } finally {
                  (window as any).isRegisteringUser = false;
                }
              } catch (error: any) {
                (window as any).isRegisteringUser = false;
                if (error.code === "auth/email-already-in-use") {
                  setAuthError("This Email or Gamura ID already exists.");
                } else if (error.code === "auth/operation-not-allowed") {
                  setAuthError(
                    <div className="space-y-2">
                      <p className="font-bold">Auth Not Enabled</p>
                      <p className="text-[10px] lowercase leading-relaxed opacity-80">
                        Enable Email/Password in Firebase Console &gt; Auth &gt;
                        Sign-in method.
                      </p>
                    </div>,
                  );
                } else {
                  setAuthError(error.message);
                }
              } finally {
                setIsAuthLoading(false);
              }
            }}
          >
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  typeof authError === "string"
                    ? "bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl border border-red-100 text-center"
                    : "bg-amber-50/50 dark:bg-amber-950/20 text-zinc-800 dark:text-zinc-200 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-center"
                }
              >
                {authError}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Nickname
              </label>
              <div className="relative">
                <Sparkles
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Email{" "}
                <span className="text-[8px] opacity-60">
                  (Optional for Recovery)
                </span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Recovery email"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              {isAuthLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100 dark:border-zinc-800/50"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg
                  className="w-4 h-4 text-black dark:text-white"
                  fill="currentColor"
                  viewBox="0 0 170 170"
                >
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.37.13-9.13-1.9-14.29-6.07-3.57-2.9-7.51-7.7-11.83-14.42-7.51-11.61-13-25.01-16.48-40.17-3.48-15.17-3.17-29.17.9-42 4.07-12.9 10.9-22.75 20.48-29.58 9.58-6.82 19.9-10.28 30.93-10.39 5.71 0 11.66 1.41 17.84 4.19 6.18 2.78 10.36 4.17 12.54 4.17 2.01 0 6.03-1.34 12.06-4.01 6.03-2.68 11.47-3.96 16.32-3.85 11.52.45 21.01 4.54 28.48 12.27 7.47 7.72 11.75 16.93 12.83 27.65-11.61 5.37-19.16 12.8-22.65 22.28-3.48 9.48-2.6 19.24 2.65 29.27 3.35 6.43 8.01 11.63 13.98 15.61 5.96 3.97 12.18 6.17 18.63 6.6-1.56 4.58-3.57 9.52-6.03 14.83zm-27.14-101.46c0-7.72 2.73-14.75 8.19-21.08 5.46-6.33 11.96-10.03 19.51-11.1 0.45 7.82-2.3 14.93-8.25 21.34-5.95 6.41-12.43 10.27-19.45 10.84 0 0 .0-.10 0-1z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Already have an account?{" "}
            <span
              onClick={() => {
                setAuthError(null);
                setCurrentPage("login");
              }}
              className="text-black dark:text-white font-medium cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "login") {
    if (forgotPassword) {
      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800/50 mx-auto bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                <SafeImage
                  srcs={secondaryLogoSources}
                  alt="GPG"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                RESET PASSWORD
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Enter Gamura ID or Email to recover
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsAuthLoading(true);
                setAuthError(null);
                try {
                  let resetTarget = username.trim();
                  if (!resetTarget) {
                    setAuthError("Please enter your Gamura ID or Email first.");
                    setIsAuthLoading(false);
                    return;
                  }

                  // If it looks like a username, attempt to resolve it to their real email from Firestore
                  if (!resetTarget.includes("@")) {
                    const uNameDoc = await getDoc(
                      doc(db, "usernames", resetTarget.toLowerCase()),
                    );
                    if (uNameDoc.exists()) {
                      const uid = uNameDoc.data()?.uid;
                      if (uid) {
                        const uDoc = await getDoc(doc(db, "users", uid));
                        if (uDoc.exists()) {
                          const matchedEmail = uDoc.data()?.email;
                          if (matchedEmail) {
                            resetTarget = matchedEmail;
                          } else {
                            resetTarget = `${resetTarget.toLowerCase()}@gamura.app`;
                          }
                        } else {
                          resetTarget = `${resetTarget.toLowerCase()}@gamura.app`;
                        }
                      } else {
                        resetTarget = `${resetTarget.toLowerCase()}@gamura.app`;
                      }
                    } else {
                      resetTarget = `${resetTarget.toLowerCase()}@gamura.app`;
                    }
                  }

                  await sendPasswordResetEmail(auth, resetTarget);
                  setResetEmailSent(true);
                } catch (err: any) {
                  if (err.code === "auth/user-not-found") {
                    setAuthError(
                      "No account found with this Gamura ID or Email.",
                    );
                  } else if (err.code === "auth/invalid-email") {
                    setAuthError("The email address format is invalid.");
                  } else {
                    setAuthError(
                      err.message ||
                        "Could not send reset email. Check your ID/Email.",
                    );
                  }
                } finally {
                  setIsAuthLoading(false);
                }
              }}
            >
              <>
                {authError && (
                  <div className="text-red-500 text-[10px] font-bold text-center">
                    {authError}
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Gamura ID or Email"
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-3 font-bold text-xs uppercase tracking-widest mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isAuthLoading ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setResetEmailSent(false);
                  setAuthError(null);
                }}
                className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-black transition-colors"
                style={{ marginTop: 16 }}
              >
                Back to Login
              </button>
            </form>
          </div>

          {/* Slide-up Notification Panel */}
          <AnimatePresence>
            {resetEmailSent && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => {
                    setForgotPassword(false);
                    setResetEmailSent(false);
                    setAuthError(null);
                  }}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 left-0 right-0 h-[50vh] bg-white dark:bg-zinc-950 rounded-t-[2.5rem] z-50 p-8 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center border-t border-zinc-100 dark:border-zinc-800"
                >
                  <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full absolute top-4 left-1/2 -translate-x-1/2" />

                  <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 text-green-500" />
                  </div>

                  <div className="space-y-3 px-4">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50">
                      Link Sent Successfully
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[300px] mx-auto leading-relaxed">
                      We've sent password reset instructions to your associated
                      email. Please check your inbox and spam folder.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setForgotPassword(false);
                      setResetEmailSent(false);
                      setAuthError(null);
                    }}
                    className="w-full max-w-[280px] py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] mt-8"
                  >
                    Back to Login
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (isLoggedIn && currentUserInfo) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 relative flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle top background gradient decoration */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-sky-400/10 to-transparent pointer-events-none" />

              {!showDeleteConfirm ? (
                <div className="text-center relative z-10 space-y-6">
                  {/* Avatar displaying custom image if present, else initials with styled gradient */}
                  <div className="relative inline-block group">
                    {currentUserInfo.avatarUrl ? (
                      <img
                        src={currentUserInfo.avatarUrl}
                        alt={currentUserInfo.nickname}
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-sky-400/20 shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md ring-4 ring-sky-400/20 group-hover:scale-105 transition-transform duration-300">
                        {(currentUserInfo.nickname ||
                          currentUserInfo.username ||
                          "@")[0].toUpperCase()}
                      </div>
                    )}
                    {/* Realtime dynamic status marker */}
                    <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
                  </div>

                  {/* Nickname, ID badge and description bio */}
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans uppercase">
                      {currentUserInfo.nickname}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/30 text-sky-500 text-xs font-bold font-mono uppercase tracking-wider">
                      @{currentUserInfo.username}
                    </div>
                    {currentUserInfo.bio && (
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs py-1.5 px-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl leading-relaxed mt-2 text-center max-w-xs mx-auto">
                        {currentUserInfo.bio}
                      </p>
                    )}
                  </div>

                  {/* Navigation Quick Pathways/Buttons */}
                  <div className="space-y-2 pt-2 text-left">
                    <button
                      type="button"
                      onClick={() => setCurrentPage("white-page")}
                      className="w-full flex items-center justify-between gap-3 bg-[#0EA5E9] hover:bg-[#0284c7] text-white rounded-xl py-3 px-4.5 font-bold text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>🎨</span> CLAIM GAMURA FREE URL
                      </span>
                      <ArrowRight
                        size={13}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUniverseLoader(true);
                        setTimeout(
                          () => setCurrentPage("universe-active"),
                          100,
                        );
                      }}
                      className="w-full flex items-center justify-between gap-3 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-100 rounded-xl py-3 px-4.5 font-bold text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>🌐</span> ENTER UNIVERSE DASHBOARD
                      </span>
                      <ArrowRight
                        size={13}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentPage("home")}
                      className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl py-3 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer text-center"
                    >
                      Return/Cancel
                    </button>
                  </div>

                  {/* Account Actions / Log Out */}
                  <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-col gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={() => setShowSignOutConfirm(true)}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-zinc-900/50 dark:to-zinc-900/50 dark:hover:from-red-950/20 dark:hover:to-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <LogOut size={12} className="stroke-[2.5]" />
                      Sign Out Session
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-zinc-50 hover:bg-red-50/50 dark:bg-zinc-900/10 dark:hover:bg-red-950/10 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-red-100 dark:hover:border-red-900/30 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Permanently Delete Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center relative z-10 space-y-6 py-2">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 mb-2">
                    <Trash2 size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-widest text-red-500 uppercase font-sans">
                      DELETE PROFILE
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      PERMANENT DESTRUCTION WARNING
                    </p>
                  </div>

                  <div className="bg-red-500/5 dark:bg-red-500/5 p-5 rounded-2xl border border-red-500/25 text-center">
                    <p className="text-red-500 font-extrabold tracking-widest text-[11px] uppercase mb-2">
                      WARNING: THIS CANNOT BE UNDONE.
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wide leading-relaxed">
                      All projects, chats, notification logs, neural profiles,
                      and settings will be permanently destroyed instantly from
                      the platform.
                    </p>
                  </div>

                  {showDeletePasswordInput && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                          ENTER PASSKEY TO VERIFY IDENTITY
                        </label>
                        <input
                          type="password"
                          value={deleteConfirmPassword}
                          onChange={(e) => {
                            setDeleteConfirmPassword(e.target.value);
                            setDeletePasswordError(null);
                          }}
                          placeholder="Your account password"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-zinc-100"
                        />
                      </div>
                      {deletePasswordError && (
                        <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">
                          ⚠️ {deletePasswordError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 pt-2 relative">
                    {/* Visual Progress Overlay */}
                    <AnimatePresence>
                      {isAuthLoading && deletionProgress && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 rounded-2xl border border-red-500/20"
                        >
                          <Loader2
                            size={32}
                            className="animate-spin text-red-500 mb-4"
                          />
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mb-3 overflow-hidden">
                            <motion.div
                              className="bg-red-500 h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.max(5, deletionProgress.progress)}%`,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-[10px] font-black tracking-widest text-red-500 uppercase font-mono animate-pulse text-center">
                            {deletionProgress.status}
                          </p>
                          <div className="w-full mt-4 h-24 overflow-y-auto bg-zinc-900/50 rounded p-2 flex flex-col gap-1 border border-zinc-800">
                            {deletionLogs.map((log, i) => (
                              <p
                                key={i}
                                className="text-[8px] font-mono text-zinc-400"
                              >
                                &gt; {log}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={isAuthLoading}
                      onClick={async () => {
                        try {
                          const user = auth.currentUser;
                          if (user) {
                            const isGoogleUser = user.providerData.some(
                              (p) => p.providerId === "google.com",
                            );

                            setIsAuthLoading(true);
                            setAuthError(null);

                            if (isGoogleUser) {
                              try {
                                const provider = new GoogleAuthProvider();
                                setDeletionProgress({
                                  status: "Awaiting Google Auth...",
                                  progress: 5,
                                });
                                await reauthenticateWithPopup(user, provider);
                              } catch (err: any) {
                                console.error("Google re-auth failed:", err);
                                setIsAuthLoading(false);
                                setDeletionProgress(null);
                                if (err.code === "auth/popup-closed-by-user") {
                                  showToast("⚠️", "Authentication Cancelled", "You closed the Google verification popup.", "warning");
                                } else {
                                  showToast("❌", "Verification Failed", err.message, "error");
                                }
                                return;
                              }
                            } else {
                              if (!showDeletePasswordInput) {
                                setShowDeletePasswordInput(true);
                                setDeletePasswordError(
                                  "Please enter your password to confirm.",
                                );
                                setIsAuthLoading(false);
                                setDeletionProgress(null);
                                return;
                              }

                              if (!deleteConfirmPassword.trim()) {
                                setDeletePasswordError(
                                  "Password is required for deletion.",
                                );
                                setIsAuthLoading(false);
                                setDeletionProgress(null);
                                return;
                              }

                              setDeletionProgress({
                                status: "Verifying credentials...",
                                progress: 5,
                              });

                              try {
                                const credential = EmailAuthProvider.credential(
                                  user.email!,
                                  deleteConfirmPassword,
                                );
                                await reauthenticateWithCredential(
                                  user,
                                  credential,
                                );
                              } catch (reauthErr: any) {
                                setDeletePasswordError(
                                  "Invalid password. Re-authentication failed.",
                                );
                                setIsAuthLoading(false);
                                setDeletionProgress(null);
                                return;
                              }
                            }

                            const performDeletion = async (
                              currentUser: any,
                            ) => {
                              const logMessage = (msg: string) => {
                                console.log(`[DELETION] ${msg}`);
                                setDeletionLogs((prev) => [...prev, msg]);
                              };

                              logMessage(
                                `Starting deletion for ${currentUser.uid}`,
                              );
                              // If currentUserInfo or its username is missing, try to restore from Firestore user profile
                              let finalUsername = currentUserInfo?.username;
                              if (!finalUsername && currentUser?.uid) {
                                logMessage(
                                  `Missing username, fetching fallback profile...`,
                                );
                                try {
                                  const userDoc = await getDoc(
                                    doc(db, "users", currentUser.uid),
                                  );
                                  if (userDoc && userDoc.exists()) {
                                    finalUsername = userDoc.data()?.username;
                                    logMessage(
                                      `Found fallback username @${finalUsername}`,
                                    );
                                  } else {
                                    logMessage(`No fallback profile found.`);
                                  }
                                } catch (fetchErr: any) {
                                  logMessage(
                                    `Could not fetch fallback username: ${fetchErr.message}`,
                                  );
                                }
                              }

                              setDeletionProgress({
                                status: "Gathering records...",
                                progress: 15,
                              });

                              const fetchWithTimeout = async (
                                name: string,
                                ref: any,
                              ) => {
                                logMessage(`Fetching ${name}...`);
                                try {
                                  let timeoutFired = false;
                                  const timeout = new Promise<null>((r) =>
                                    setTimeout(() => {
                                      timeoutFired = true;
                                      logMessage(
                                        `Warning: ${name} fetch exceeded 3s. Skipping...`,
                                      );
                                      r(null);
                                    }, 3000),
                                  );
                                  const res = await Promise.race([
                                    getDocs(ref).catch((e: any) => {
                                      logMessage(
                                        `Error processing ${name}: ${e.message}`,
                                      );
                                      return null;
                                    }),
                                    timeout,
                                  ]);
                                  if (res && !timeoutFired) {
                                    logMessage(
                                      `Found ${(res as any).docs.length} ${name}`,
                                    );
                                  }
                                  return res as any;
                                } catch (e: any) {
                                  logMessage(
                                    `Crash block fetching ${name}: ${e.message}`,
                                  );
                                  return null;
                                }
                              };

                              const commitBatches = async (
                                refs: any[],
                                name: string,
                              ) => {
                                if (!refs.length) {
                                  logMessage(`Skipping ${name} (empty)`);
                                  return;
                                }
                                logMessage(`Purging ${refs.length} ${name}...`);
                                try {
                                  const chunks = [];
                                  for (let i = 0; i < refs.length; i += 500) {
                                    chunks.push(refs.slice(i, i + 500));
                                  }
                                  
                                  const batchPromises = chunks.map((chunk, index) => {
                                    const batch = writeBatch(db);
                                    chunk.forEach((ref) => batch.delete(ref));
                                    
                                    const timeout = new Promise((r) =>
                                      setTimeout(() => {
                                        logMessage(`Warning: ${name} chunk ${index + 1} timeout. Moving on...`);
                                        r("timeout");
                                      }, 3000),
                                    );

                                    return Promise.race([
                                      batch.commit().catch((e: any) => {
                                        logMessage(`Batch error ${name}: ${e.message}`);
                                        return "err";
                                      }),
                                      timeout,
                                    ]).then((res) => {
                                      if (res !== "timeout" && res !== "err") {
                                        logMessage(`Purged ${name} chunk ${index + 1}/${chunks.length}`);
                                      }
                                    });
                                  });

                                  await Promise.all(batchPromises);
                                } catch (e: any) {
                                  logMessage(
                                    `Crash purging ${name}: ${e.message}`,
                                  );
                                }
                              };

                              // 1. Fetch all datasets concurrently to minimize database trip latency
                              setDeletionProgress({
                                status:
                                  "Fetching datasets (chats, notifications, projects, profiles)...",
                                progress: 20,
                              });
                              try {
                                const chatsRef = collection(
                                  db,
                                  `users/${currentUser.uid}/chats`,
                                );
                                const notifsRef = collection(
                                  db,
                                  `users/${currentUser.uid}/notifications`,
                                );
                                const projectsQuery = query(
                                  collection(db, "shared_projects"),
                                  where("userId", "==", currentUser.uid),
                                );
                                const npQuery = query(
                                  collection(db, "neural_profiles"),
                                  where("uid", "==", currentUser.uid),
                                );

                                const [
                                  chatsSnap,
                                  notifsSnap,
                                  projectsSnap,
                                  npSnap,
                                ] = await Promise.all([
                                  fetchWithTimeout("chats", chatsRef),
                                  fetchWithTimeout("notifications", notifsRef),
                                  fetchWithTimeout("projects", projectsQuery),
                                  fetchWithTimeout("neural_profiles", npQuery),
                                ]);

                                setDeletionProgress({
                                  status:
                                    "Purging datasets (chats, notifications, projects, profiles)...",
                                  progress: 40,
                                });

                                await Promise.all([
                                  commitBatches(
                                    chatsSnap ? chatsSnap.docs.map((d: any) => d.ref) : [],
                                    "chats",
                                  ),
                                  commitBatches(
                                    notifsSnap ? notifsSnap.docs.map((d: any) => d.ref) : [],
                                    "notifications",
                                  ),
                                  commitBatches(
                                    projectsSnap ? projectsSnap.docs.map((d: any) => d.ref) : [],
                                    "projects",
                                  ),
                                  commitBatches(
                                    npSnap ? npSnap.docs.map((d: any) => d.ref) : [],
                                    "neural_profiles",
                                  )
                                ]);

                                // 3. Release reserved username and delete custom developer profile
                                const userNodes: any[] = [];

                                if (finalUsername) {
                                  setDeletionProgress({
                                    status: "Freeing developer namespaces...",
                                    progress: 60,
                                  });
                                  userNodes.push(
                                    doc(
                                      db,
                                      "usernames",
                                      finalUsername.toLowerCase(),
                                    ),
                                  );
                                  userNodes.push(
                                    doc(
                                      db,
                                      "gamura_developers",
                                      finalUsername.toLowerCase(),
                                    ),
                                  );
                                }

                                userNodes.push(
                                  doc(db, "gamura_developers", currentUser.uid),
                                );

                                // 4. Sever connections and user profile document
                                setDeletionProgress({
                                  status:
                                    "Severing user profile and connections...",
                                  progress: 70,
                                });
                                userNodes.push(
                                  doc(db, "user_connections", currentUser.uid),
                                );
                                userNodes.push(
                                  doc(db, "users", currentUser.uid),
                                );

                                setDeletionProgress({
                                  status: `Executing identity background deletion tasks...`,
                                  progress: 80,
                                });

                                await commitBatches(
                                  userNodes,
                                  "user identity nodes",
                                );

                                // Decrement total users
                                try {
                                  const statsRef = doc(db, "system", "stats");
                                  await updateDoc(statsRef, {
                                    totalUsers: increment(-1),
                                  });
                                } catch (e) {
                                  logMessage(
                                    `Failed to decrement total users: ${e}`,
                                  );
                                }
                              } catch (cleanupError: any) {
                                logMessage(
                                  `Firestore cleanup encountered a broader error: ${cleanupError.message}`,
                                );
                                // We do not throw here. We MUST proceed to delete the Auth account even if Firestore fails
                              }

                              setDeletionProgress({
                                status: "Clearing local sessions...",
                                progress: 85,
                              });

                              // 6. Clean up stored credentials, sessions, and active accounts from localStorage
                              try {
                                localStorage.removeItem(
                                  `gamura_user_info_${currentUser.uid}`,
                                );
                                localStorage.removeItem(
                                  `gamura_dev_profile_${currentUser.uid}`,
                                );
                                removeAccountSession(currentUser.uid);
                              } catch (err) {
                                console.warn(
                                  "Storage cleanup error on account deletion:",
                                  err,
                                );
                              }

                              setDeletionProgress({
                                status: "Erasing Auth identity...",
                                progress: 95,
                              });

                              // 7. Purge Authentication node
                              try {
                                await deleteUser(currentUser);
                              } catch (authErr: any) {
                                if (
                                  authErr.code === "auth/requires-recent-login"
                                ) {
                                  throw authErr;
                                }
                                console.warn(
                                  "Firestore data has been cleared, but direct Auth deletion returned error:",
                                  authErr,
                                );
                                // If requires-recent-login or similar error happens, we can still log them out as failsafe!
                                await firebaseSignOut(auth);
                              }

                              setDeletionProgress({
                                status: "Complete.",
                                progress: 100,
                              });
                            };

                            try {
                              await performDeletion(user);
                              setCurrentPage("home");
                              setCurrentUserInfo(null);
                              setShowDeleteConfirm(false);
                              setShowDeletePasswordInput(false);
                              setDeleteConfirmPassword("");
                              setDeletionProgress(null);
                              showToast(
                                "🗑️",
                                "Identity Erased",
                                "Your Account and all associated data have been completely erased.",
                                "success",
                              );
                            } catch (error: any) {
                              if (error.code === "auth/requires-recent-login") {
                                if (isGoogleUser) {
                                  setNeedsGoogleReauth(true);
                                  setIsAuthLoading(false);
                                  setDeletionProgress(null);
                                  showToast(
                                    "⚠️",
                                    "Security Verification Required",
                                    "Please click the delete button again to re-authenticate with Google.",
                                    "warning",
                                  );
                                  return;
                                } else {
                                  setShowDeletePasswordInput(true);
                                  setDeletePasswordError(
                                    "Re-authentication security verification required. Please enter your password below.",
                                  );
                                  setIsAuthLoading(false);
                                  setDeletionProgress(null);
                                  return;
                                }
                              } else {
                                throw error;
                              }
                            }
                          }
                        } catch (error: any) {
                          console.error("Deletion error:", error);
                          showToast(
                            "❌",
                            "Deletion Failed",
                            error.message ||
                              "Account deletion failed. Please try again.",
                            "error",
                          );
                          setIsAuthLoading(false);
                          setDeletionProgress(null);
                        }
                      }}
                      className={`w-full py-3.5 text-white font-extrabold bg-[#ef4444] hover:bg-[#dc2626] rounded-2xl transition-all text-[10px] tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 ${isAuthLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {isAuthLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : needsGoogleReauth ? (
                        "RE-AUTHENTICATE TO DELETE"
                      ) : (
                        "DELETE ALL MY DATA & PROFILE"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isAuthLoading}
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setShowDeletePasswordInput(false);
                        setNeedsGoogleReauth(false);
                        setDeleteConfirmPassword("");
                      }}
                      className="w-full py-3.5 text-zinc-600 dark:text-zinc-300 font-extrabold bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-2xl transition-all text-[10px] tracking-widest uppercase cursor-pointer"
                    >
                      Cancel / Keep Account
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {showSignOutConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setShowSignOutConfirm(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400" />

                  <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
                      <LogOut className="w-6 h-6 text-red-500" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50">
                        Sign Out
                      </h3>
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        Are you sure you want to terminate this session?
                      </p>
                    </div>

                    <div className="flex w-full gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => setShowSignOutConfirm(false)}
                        className="flex-1 py-3 text-zinc-500 dark:text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-[10px] tracking-widest uppercase transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setCurrentUserInfo(null);
                            await firebaseSignOut(auth);
                            showToast(
                              "🚪",
                              "Logged Out",
                              "Your Gamura session was terminated.",
                              "info",
                            );
                            setShowSignOutConfirm(false);
                            setCurrentPage("home");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="flex-1 py-3 text-white font-bold bg-red-500 hover:bg-red-600 rounded-xl text-[10px] tracking-widest uppercase shadow-lg shadow-red-500/20 transition-all"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setCurrentPage("home")}
            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            ← Back to Home
          </button>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800/50 mx-auto bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
              <SafeImage
                srcs={secondaryLogoSources}
                alt="GPG Logo"
                className="w-full h-full object-cover"
                fallbackIcon={Sparkles}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                GAMURA ID LOGIN
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                ACTIVATE YOUR GAMURA ID SESSION
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError(null);
              setIsAuthLoading(true);

              try {
                let loginEmail = username.trim();
                const uLower = loginEmail.toLowerCase();
                if (!loginEmail.includes("@")) {
                  const cachedEmail = localStorage.getItem(
                    `gamura_id_email_${uLower}`,
                  );
                  loginEmail = cachedEmail || `${uLower}@gamura.app`;
                }

                let userCred;
                try {
                  userCred = await signInWithEmailAndPassword(
                    auth,
                    loginEmail,
                    password,
                  );
                } catch (initialErr: any) {
                  if (
                    !username.trim().includes("@") &&
                    !localStorage.getItem(`gamura_id_email_${uLower}`) &&
                    (initialErr.code === "auth/user-not-found" ||
                      initialErr.code === "auth/invalid-credential")
                  ) {
                    const uDoc = await getDoc(
                      doc(db, "usernames", uLower),
                    ).catch(() => null);
                    if (uDoc && uDoc.exists()) {
                      const uid = uDoc.data()?.uid;
                      if (uid) {
                        const uProfile = await getDoc(
                          doc(db, "users", uid),
                        ).catch(() => null);
                        if (
                          uProfile &&
                          uProfile.exists() &&
                          uProfile.data()?.email
                        ) {
                          loginEmail = uProfile.data()?.email;
                          userCred = await signInWithEmailAndPassword(
                            auth,
                            loginEmail,
                            password,
                          );
                        } else throw initialErr;
                      } else throw initialErr;
                    } else throw initialErr;
                  } else {
                    throw initialErr;
                  }
                }

                if (userCred && userCred.user) {
                  if (!username.trim().includes("@")) {
                    localStorage.setItem(
                      `gamura_id_email_${uLower}`,
                      loginEmail,
                    );
                  }
                  setCurrentPage("blank");
                } else {
                  setCurrentPage("blank");
                }
              } catch (error: any) {
                if (error.code === "auth/operation-not-allowed") {
                  setAuthError(
                    <div className="space-y-2">
                      <p className="font-bold">Auth Not Enabled</p>
                      <p className="text-[10px] lowercase leading-relaxed opacity-80">
                        Enable Email/Password in Firebase Console &gt; Auth &gt;
                        Sign-in method.
                      </p>
                    </div>,
                  );
                } else {
                  setAuthError("Invalid Gamura ID or password.");
                }
              } finally {
                setIsAuthLoading(false);
              }
            }}
          >
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  typeof authError === "string"
                    ? "bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl border border-red-100 text-center"
                    : "bg-amber-50/50 dark:bg-amber-950/20 text-zinc-800 dark:text-zinc-200 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-center"
                }
              >
                {authError}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Gamura ID
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your Gamura ID"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-[9px] font-black text-cyan-500 hover:text-cyan-600 uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black dark:border-white transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              {isAuthLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100 dark:border-zinc-800/50"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg
                  className="w-4 h-4 text-black dark:text-white"
                  fill="currentColor"
                  viewBox="0 0 170 170"
                >
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.37.13-9.13-1.9-14.29-6.07-3.57-2.9-7.51-7.7-11.83-14.42-7.51-11.61-13-25.01-16.48-40.17-3.48-15.17-3.17-29.17.9-42 4.07-12.9 10.9-22.75 20.48-29.58 9.58-6.82 19.9-10.28 30.93-10.39 5.71 0 11.66 1.41 17.84 4.19 6.18 2.78 10.36 4.17 12.54 4.17 2.01 0 6.03-1.34 12.06-4.01 6.03-2.68 11.47-3.96 16.32-3.85 11.52.45 21.01 4.54 28.48 12.27 7.47 7.72 11.75 16.93 12.83 27.65-11.61 5.37-19.16 12.8-22.65 22.28-3.48 9.48-2.6 19.24 2.65 29.27 3.35 6.43 8.01 11.63 13.98 15.61 5.96 3.97 12.18 6.17 18.63 6.6-1.56 4.58-3.57 9.52-6.03 14.83zm-27.14-101.46c0-7.72 2.73-14.75 8.19-21.08 5.46-6.33 11.96-10.03 19.51-11.1 0.45 7.82-2.3 14.93-8.25 21.34-5.95 6.41-12.43 10.27-19.45 10.84 0 0 .0-.10 0-1z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Don't have an account?{" "}
            <span
              onClick={() => {
                setAuthError(null);
                setCurrentPage("signup");
              }}
              className="text-black dark:text-white font-medium cursor-pointer hover:underline"
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "gg") {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-4 md:p-6">
        <button
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-[10px] md:text-xs font-medium"
        >
          ← Back
        </button>
        <div className="text-center space-y-8 max-w-4xl w-full">
          <a
            href="https://gamuragalaxy.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-[250px] mx-auto aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer"
          >
            <SafeImage
              srcs={ggImgSources}
              alt="Gamura Games"
              className="w-full h-full object-cover"
              fallbackIcon={Sparkles}
            />
          </a>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
              <span className="text-red-600">GA</span>
              <span className="text-blue-600">M</span>
              <span className="text-green-600">UR</span>
              <span className="text-yellow-500">A</span>
              <span className="text-zinc-900 dark:text-zinc-50 ml-3">
                GAMES
              </span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em]">
              Coming Soon
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "about") {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-4 md:p-6">
        <button
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-[10px] md:text-xs font-medium"
        >
          ← Back
        </button>
        <div className="w-full max-w-2xl space-y-6 md:space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-[0.2em]">
              About <span className="text-red-600">GA</span>
              <span className="text-blue-600">M</span>
              <span className="text-green-600">UR</span>
              <span className="text-yellow-500">A</span>
            </h2>
            <div className="h-px w-20 bg-zinc-200 mx-auto"></div>
          </div>
          {/* Founder Information Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black text-white dark:bg-white dark:text-black p-6 md:p-8 rounded-3xl shadow-2xl text-center space-y-4"
          >
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
              Legacy
            </p>
            <h3 className="text-lg md:text-2xl font-light tracking-tight leading-tight">
              FOUNDER OF <span className="font-bold">GAMURA</span> IS{" "}
              <span className="text-zinc-400">SELVARANJAN GANTHI</span>
            </h3>
            <div className="pt-2 md:pt-4">
              <a
                href="https://www.linkedin.com/in/selvaranjang"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors border border-zinc-800 px-4 py-2 rounded-full"
              >
                <Linkedin size={14} />
                Connect on LinkedIn
              </a>
            </div>
          </motion.div>

          <div className="w-full max-w-[280px] md:max-w-md mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
            <SafeImage
              srcs={secondaryLogoSources}
              alt="Gamura About"
              className="w-full h-full object-cover"
              fallbackIcon={Sparkles}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "white-page") {
    return <SelvaranjanGamura onBack={() => setCurrentPage("home")} />;
  }

  if (currentPage === "blank") {
    if (!isLoggedIn) {
      showToast(
        "⚠️",
        "Connection Denied",
        "You must first ACTIVATE YOUR GAMURA ID to access the Universe service. Please sign in.",
        "warning",
      );
      setCurrentPage("login");
      return null;
    }

    return (
      <div className="min-h-screen bg-white text-zinc-900 relative flex flex-col items-center select-none w-full">
        {/* Top bar */}
        <div className="w-full max-w-7xl px-4 md:px-8 py-12 md:py-20 flex items-center border-b border-zinc-100 relative bg-white">
          {/* Back button on the left */}
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-all font-sans text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm border border-zinc-200 z-20"
          >
            ← Back
          </button>

          {/* Centered Image in the middle */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-52 w-52 md:h-80 md:w-80 flex items-center justify-center z-10">
            <SafeImage
              srcs={[
                "https://lh3.googleusercontent.com/d/11bcWKdgGYngtK96ERJHGf43jAX-06Cjr",
              ]}
              alt="Gamura Universe Logo"
              className="max-h-full max-w-full object-contain mix-blend-multiply"
              fallbackIcon={Sparkles}
            />
          </div>

          {/* Sliding bar toggle button on the right */}
          <button
            onClick={() => setIsSlideOpen(!isSlideOpen)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white transition-all font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer shadow-md border border-zinc-900 z-20 group"
          >
            <span>Menu</span>
            <motion.div
              animate={{ rotate: isSlideOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown
                size={12}
                className="group-hover:translate-y-0.5 transition-transform"
              />
            </motion.div>
          </button>
        </div>

        {/* Up-to-Down sliding bar/drawer panel */}
        <AnimatePresence>
          {isSlideOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-zinc-50 border-b border-zinc-100 overflow-hidden relative z-10 shadow-inner"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col md:flex-row gap-6 justify-center items-start text-left">
                {isLoggedIn ? (
                  <>
                    {/* Connected State: Displays only the GAMURA USER ID with no cosmic gravity components */}
                    <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono tracking-wider text-emerald-500 uppercase font-bold">
                            GAMURA USER ID
                          </span>
                          <span className="text-[9px] font-mono font-bold text-zinc-400">
                            STATUS: ACTIVE
                          </span>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-mono text-[10px] uppercase">
                              username
                            </span>
                            <span className="font-extrabold text-zinc-950">
                              @{currentUserInfo?.username || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-mono text-[10px] uppercase font-bold">
                              nickname
                            </span>
                            <span className="font-semibold text-zinc-700">
                              {currentUserInfo?.nickname || "N/A"}
                            </span>
                          </div>
                          {currentUser?.email && (
                            <div className="flex justify-between items-center text-xs border-t border-zinc-200/50 pt-2 pb-0.5">
                              <span className="text-zinc-400 font-mono text-[10px] uppercase">
                                email
                              </span>
                              <span className="text-zinc-600 truncate max-w-[190px] font-mono text-[10px]">
                                {currentUser.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowTelemetry(!showTelemetry)}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                            showTelemetry
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200"
                          }`}
                        >
                          {showTelemetry ? "HIDE TELEMETRY" : "VIEW TELEMETRY"}
                        </button>
                        <button
                          onClick={() => setCurrentPage("login")}
                          className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all cursor-pointer"
                        >
                          MANAGE PROFILE
                        </button>
                      </div>
                    </div>

                    {showTelemetry && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono tracking-wider text-violet-500 uppercase font-bold">
                              G-UNIVERSE TELEMETRY
                            </span>
                            <span className="text-[9px] font-mono font-bold text-zinc-400">
                              DATA STREAM // FEED // RESIDUAL RESONANCE
                            </span>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-xs font-mono font-bold text-zinc-800">
                              432 Hz
                            </div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-sans font-bold">
                              Resonance Freq
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-xs font-mono font-bold text-emerald-600">
                              99.8%
                            </div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-sans font-bold">
                              Sync Quality
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-xs font-mono font-bold text-violet-600">
                              12 ms
                            </div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-sans font-bold">
                              Beacon Latency
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-xs font-mono font-bold text-zinc-800">
                              0.00 G
                            </div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-sans font-bold">
                              Gravity Drift
                            </div>
                          </div>
                        </div>

                        {/* Interactive sparkline graph */}
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                            <span>COSMIC WAVE OSCILLATION</span>
                            <span className="text-emerald-400 animate-pulse">
                              ● STREAMING
                            </span>
                          </div>
                          <div className="h-10 flex items-end gap-1 px-1">
                            {[
                              40, 60, 45, 80, 55, 75, 50, 90, 65, 85, 70, 95,
                              100,
                            ].map((h, i) => (
                              <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1.5,
                                  repeatType: "reverse",
                                  delay: i * 0.08,
                                }}
                                className="flex-1 bg-gradient-to-t from-violet-500 to-emerald-500 rounded-t-sm"
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area: centered glassmorphism dashboard */}
        <div className="flex-1 bg-white w-full flex items-center justify-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

          <style>{`
            @keyframes premium-shimmer {
              0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
              20% { opacity: 0.5; }
              50% { opacity: 0.8; }
              80% { opacity: 0.5; }
              100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
            }
            .luxury-shine {
              position: absolute;
              top: 0;
              left: 0;
              width: 60%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.8),
                transparent
              );
              animation: premium-shimmer 3s infinite;
            }
          `}</style>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowUniverseLoader(true);
              setTimeout(() => setCurrentPage("universe-active"), 100);
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="z-10 px-8 py-3.5 rounded-full bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center group hover:bg-white/95 transition-all duration-500 cursor-pointer overflow-hidden relative"
          >
            {/* Shimmer effect */}
            <div className="luxury-shine" />

            <span className="text-[10px] font-black text-zinc-950 tracking-[0.5em] uppercase transition-all duration-700 group-hover:tracking-[0.7em] leading-none relative z-10 pl-[0.5em]">
              Dashboard
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  if (currentPage === "universe-active") {
    return (
      <>
        <AnimatePresence>
          {showUniverseLoader && (
            <GamuraLoader onFinish={() => setShowUniverseLoader(false)} />
          )}
        </AnimatePresence>
        {!showUniverseLoader && (
          <UniverseDashboard
            onBack={() => {
              setShowUniverseLoader(false);
              setCurrentPage("blank");
            }}
            isLoggedIn={isLoggedIn}
            user={currentUser}
            userInfo={currentUserInfo}
            setCurrentUserInfo={setCurrentUserInfo}
            setCurrentPage={setCurrentPage}
            isDark={isDark}
            setIsDark={setIsDark}
            loaderImgSources={loaderImgSources}
            gamuraAccounts={gamuraAccounts}
            setEmail={setEmail}
            setUsername={setUsername}
            setShowDeleteConfirm={setShowDeleteConfirm}
            setShowSignOutConfirm={setShowSignOutConfirm}
            onConnect={() => {
              if (!isLoggedIn) {
                setCurrentPage("login");
              } else {
                setCurrentPage("home");
              }
            }}
          />
        )}
      </>
    );
  }

  if (currentPage === "aura") {
    const AURA_MODULES = [
      {
        id: "users",
        name: "User Directory",
        ic: "👥",
        pos: { x: 50, y: 18.5 },
        desc: "Coming Soon",
      },
      {
        id: "global",
        name: "Global Network",
        ic: "🌐",
        pos: { x: 72.3, y: 27.7 },
        desc: "Coming Soon",
      },
      {
        id: "analytics",
        name: "Neural Analytics",
        ic: "📊",
        pos: { x: 81.5, y: 50 },
        desc: "Coming Soon",
      },
      {
        id: "cloud",
        name: "Cloud Fabric",
        ic: "☁️",
        pos: { x: 72.3, y: 72.3 },
        desc: "Coming Soon",
      },
      {
        id: "settings",
        name: "Core Protocols",
        ic: "⚙️",
        pos: { x: 50, y: 81.5 },
        desc: "Coming Soon",
      },
      {
        id: "security",
        name: "Shield Systems",
        ic: "🛡️",
        pos: { x: 27.7, y: 72.3 },
        desc: "Coming Soon",
      },
      {
        id: "signal",
        name: "Spectral Signal",
        ic: "📡",
        pos: { x: 18.5, y: 50 },
        desc: "Coming Soon",
      },
      {
        id: "nodes",
        name: "Node Synapse",
        ic: "🔗",
        pos: { x: 27.7, y: 27.7 },
        desc: "Coming Soon",
      },
    ];

    if (selectedAuraModule) {
      const activeModule = AURA_MODULES.find(
        (m) => m.id === selectedAuraModule,
      );
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-white flex flex-col items-center justify-center relative select-none p-8"
        >
          <div className="absolute top-8 left-8">
            <button
              onClick={() => setSelectedAuraModule(null)}
              className="flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200 transition-all group cursor-pointer"
            >
              <ChevronLeft
                size={18}
                className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
              />
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 uppercase tracking-widest">
                Return to Core
              </span>
            </button>
          </div>

          <div className="max-w-2xl w-full flex flex-col items-center gap-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-24 h-24 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-4xl shadow-sm"
            >
              {activeModule?.ic}
            </motion.div>

            <div className="flex flex-col gap-3">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-black text-zinc-950 uppercase tracking-tighter"
              >
                {activeModule?.name}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300 mb-2"
              >
                Aura System Identification
              </motion.div>
            </div>

            {activeModule?.id === "global" && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setCurrentPage("portfolio")}
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
              >
                <Briefcase size={20} />
                Access Developer Portfolio
              </motion.button>
            )}

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-zinc-500 font-medium leading-relaxed"
            >
              {activeModule?.desc}
            </motion.p>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-zinc-900 relative flex flex-col items-center select-none w-full">
        {/* Top bar */}
        <div className="w-full max-w-7xl px-4 md:px-8 py-3 md:py-4 flex items-center border-b border-zinc-50 relative bg-white transition-all">
          {/* Back button on the left */}
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-800 transition-all font-sans text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer border border-zinc-200 z-20 shadow-sm"
          >
            <ChevronLeft size={14} />
            Back to Hub
          </button>
        </div>

        {/* Content area: centered image on pure white */}
        <div className="flex-1 bg-white w-full flex items-center justify-center p-12">
          <div className="relative w-full max-w-[640px] md:max-w-[720px] aspect-square">
            <img
              src="https://lh3.googleusercontent.com/d/1iCaP3BYXSeXCQqsxyHy0dGhqgCfpYgIp"
              alt="Aura Logo"
              className="w-full h-full object-contain mix-blend-multiply"
            />
            {/* 8 clickable pods positioned in a circle */}
            {AURA_MODULES.map((mod, idx) => (
              <motion.button
                key={idx}
                initial={{ scale: 1 }}
                whileHover={{
                  scale: 1.15,
                  backgroundColor: "rgba(0,0,0,0.02)",
                }}
                whileTap={{ scale: 0.85, backgroundColor: "rgba(0,0,0,0.08)" }}
                onClick={() => {
                  setSelectedAuraModule(mod.id);
                  addActivity(`Explored Aura: ${mod.name}`, mod.ic);
                }}
                className="absolute w-[12%] h-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-10 flex items-center justify-center group"
                style={{ left: `${mod.pos.x}%`, top: `${mod.pos.y}%` }}
                title={mod.name}
              >
                {/* Visual feedback on hover */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1.25 }}
                  className="absolute inset-0 rounded-full border border-black/5 bg-white/10 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.03)]"
                />
                <span className="hidden">Click to enter {mod.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "gpg") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col items-center justify-center p-6 text-center">
          <button
            onClick={() => setCurrentPage("home")}
            className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-xs font-medium"
          >
            ← Back
          </button>
          <div className="max-w-md w-full space-y-8 p-8 border border-zinc-100 dark:border-zinc-800/50 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-zinc-400" size={32} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
                Login Required
              </h2>
              <p className="text-zinc-500 text-sm">
                You must be signed in to use the Gamura Prompt Generator and
                save your history.
              </p>
            </div>
            <div className="pt-6 space-y-3">
              <button
                onClick={() => setCurrentPage("login")}
                className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-4 font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
              >
                Sign In Now
              </button>
              <button
                onClick={() => setCurrentPage("signup")}
                className="w-full bg-transparent text-zinc-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col h-screen overflow-hidden">
        {/* API Key Warning Overlay */}
        {!getAi() && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 shadow-2xl rounded-[2.5rem] p-8 max-w-md w-full text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Lock className="text-red-600" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Configuration Required
                </h2>
                <p className="text-zinc-500 text-sm">
                  To use the AI Prompt Generator, you need to add your Gemini
                  API Key.
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-left space-y-3">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] flex items-center justify-center shrink-0">
                    1
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Open <b>Settings</b> (gear icon) in the top right.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] flex items-center justify-center shrink-0">
                    2
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Go to <b>Secrets</b> and add <b>GAMURA_API_KEY</b> or{" "}
                    <b>GEMINI_API_KEY</b>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] flex items-center justify-center shrink-0">
                    3
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Paste your key from Google AI Studio.
                  </p>
                </div>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
              >
                Get API Key
              </a>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="pt-4 pb-2 w-full flex justify-center px-4 md:px-16 border-b border-zinc-50 bg-white dark:bg-zinc-950/80 backdrop-blur-md z-10 relative">
          <span className="text-[9px] md:text-xs font-medium tracking-[0.2em] uppercase">
            <span className="text-red-600">GA</span>
            <span className="text-blue-600">M</span>
            <span className="text-green-600">UR</span>
            <span className="text-yellow-500">A</span>
            <span className="text-zinc-400 ml-1"> PROMPT GENERATOR</span>
          </span>
          <button
            onClick={startNewChat}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-bold text-black dark:text-white border border-black dark:border-white px-2 md:px-3 py-1 rounded-full hover:bg-black dark:hover:bg-white hover:text-white transition-all uppercase tracking-tighter"
          >
            New Chat
          </button>
        </div>

        <button
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-2 md:left-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white dark:text-white transition-colors text-[10px] md:text-xs font-medium z-20"
        >
          ← Back
        </button>

        {/* Chat Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
        >
          {gpgMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                <SafeImage
                  srcs={secondaryLogoSources}
                  alt="GPG Logo"
                  className="w-full h-full object-cover"
                  fallbackIcon={Sparkles}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-zinc-900 dark:text-zinc-50 font-medium">
                  Ready to generate?
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Describe what you want to create, and I'll craft the perfect
                  prompt for you.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {gpgMessages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} px-2 md:px-0`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[70%] p-3 md:p-4 rounded-2xl relative group ${
                    m.role === "user"
                      ? "bg-black text-white dark:bg-white dark:text-black rounded-tr-none shadow-lg shadow-black/5"
                      : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-800/50"
                  }`}
                >
                  <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-200 selection:text-blue-900 pr-6">
                    {m.role === "model" ? cleanPrompt(m.content) : m.content}
                  </p>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        m.role === "model" ? cleanPrompt(m.content) : m.content,
                        i,
                      )
                    }
                    className={`absolute right-2 top-2 p-1.5 transition-all rounded-lg backdrop-blur-sm ${
                      m.role === "user"
                        ? "text-zinc-500 hover:text-white bg-white dark:bg-zinc-950/10 opacity-40 group-hover:opacity-100"
                        : "text-zinc-300 hover:text-black dark:hover:text-white dark:text-white bg-white dark:bg-zinc-950/50 opacity-40 md:opacity-0 group-hover:opacity-100"
                    }`}
                    title="Copy"
                  >
                    {copiedId === i ? (
                      <Check
                        size={12}
                        className={
                          m.role === "user"
                            ? "text-green-400"
                            : "text-green-600"
                        }
                      />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGpgLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">
                  Crafting your prompt...
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Search Bar (Prompt Input) at the Bottom */}
        <div className="p-3 md:p-8 bg-gradient-to-t selection:bg-zinc-200 dark:selection:bg-zinc-800 from-white via-white/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80">
          <div className="max-w-3xl mx-auto mb-2 md:mb-4 flex flex-col items-center">
            <button
              onClick={() => setShowTools(!showTools)}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-300 mb-2 md:mb-4 bg-white dark:bg-zinc-950 shadow-sm"
            >
              <Sparkles
                size={12}
                className={showTools ? "text-yellow-500" : "text-zinc-400"}
              />
              {showTools ? "Hide Tools" : "Show Tools"}
            </button>

            <AnimatePresence>
              {showTools && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  className="flex flex-wrap gap-2 justify-center overflow-hidden"
                >
                  {[
                    { id: "code", icon: <Code size={14} />, label: "Code" },
                    {
                      id: "image",
                      icon: <ImageIcon size={14} />,
                      label: "Image",
                    },
                    { id: "video", icon: <Video size={14} />, label: "Video" },
                    {
                      id: "maths",
                      icon: <Calculator size={14} />,
                      label: "Maths",
                    },
                    {
                      id: "chart",
                      icon: <BarChart3 size={14} />,
                      label: "Chart",
                    },
                    {
                      id: "graph",
                      icon: <Activity size={14} />,
                      label: "Graph",
                    },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() =>
                        setSelectedTool(
                          selectedTool === tool.id ? null : tool.id,
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedTool === tool.id
                          ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md"
                          : "bg-white dark:bg-zinc-950 text-zinc-400 border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-300"
                      }`}
                    >
                      {tool.icon}
                      {tool.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <form
            onSubmit={handleGpgSubmit}
            className="max-w-3xl mx-auto relative group"
          >
            <AnimatePresence>
              {limitError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-12 left-0 right-0 py-2 px-4 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center rounded-xl border border-red-100 shadow-sm z-20"
                >
                  {limitError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-center">
              <input
                type="text"
                value={gpgInput}
                onChange={(e) => setGpgInput(e.target.value)}
                placeholder="Ask Gamura..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-sm shadow-sm placeholder:text-zinc-400 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!gpgInput.trim() || isGpgLoading || !getAi()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md flex items-center justify-center"
              >
                {isGpgLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <div className="text-[9px] text-center text-zinc-400 dark:text-zinc-500 mt-4 tracking-widest uppercase font-medium flex items-center justify-center gap-3">
              <span className="font-bold">Gamura Intelligence</span>
              <span className="opacity-30 select-none text-zinc-300">•</span>
              {currentUserInfo && (
                <span
                  className={`px-2 py-0.5 rounded-full border transition-colors ${
                    (currentUserInfo.gpgTimestamps || []).filter(
                      (t) => Date.now() - t < 24 * 60 * 60 * 1000,
                    ).length >= 3
                      ? "border-red-200 text-red-400 bg-red-50/50"
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-400 bg-zinc-50/10"
                  }`}
                >
                  LIMIT:{" "}
                  {3 -
                    (currentUserInfo.gpgTimestamps || []).filter(
                      (t) => Date.now() - t < 24 * 60 * 60 * 1000,
                    ).length}
                  /3
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (shortLinkTarget) {
    return (
      <ShortLinkRedirectView
        slug={shortLinkTarget}
        onBack={() => {
          setShortLinkTarget(null);
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (claimedProfileUser) {
    return (
      <ClaimedProfileView
        username={claimedProfileUser}
        onBack={() => {
          setClaimedProfileUser(null);
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
        onClaimRoute={() => {
          setClaimedProfileUser(null);
          window.history.pushState({}, "", "/");
          setCurrentPage("white-page");
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      {/* Dynamic theme injection */}
      {currentUserInfo?.themeColor && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --color-gamura-accent: ${currentUserInfo.themeColor};
            --color-sky-400: ${currentUserInfo.themeColor};
            --color-sky-500: ${currentUserInfo.themeColor};
            --color-cyan-400: ${currentUserInfo.themeColor};
            --color-cyan-500: ${currentUserInfo.themeColor};
            --color-blue-400: ${currentUserInfo.themeColor};
            --color-blue-500: ${currentUserInfo.themeColor};
            --color-blue-600: ${currentUserInfo.themeColor};
          }
          /* Fallback rules to strictly override predefined classes */
          .bg-sky-500, .bg-cyan-500, .bg-blue-600 { background-color: ${currentUserInfo.themeColor} !important; }
          .text-sky-400, .text-cyan-400, .text-blue-500 { color: ${currentUserInfo.themeColor} !important; }
          .border-sky-500, .border-cyan-500 { border-color: ${currentUserInfo.themeColor} !important; }
        `,
          }}
        />
      )}
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col overflow-hidden">
        {/* Sidebar Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
              />
              {/* Menu Bar */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-64 md:w-80 bg-black z-50 shadow-2xl flex flex-col"
              >
                <div className="p-6 flex justify-end">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:text-zinc-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 px-6 flex flex-col items-center justify-center space-y-6">
                  <button
                    onClick={() => {
                      setCurrentPage("gpg");
                      setIsMenuOpen(false);
                    }}
                    className="group relative flex items-center gap-3 text-4xl font-bold tracking-widest font-sans transition-all hover:scale-105 active:scale-95"
                  >
                    <MessageSquarePlus size={32} className="text-white" />
                    <div>
                      <span className="text-red-600">G</span>
                      <span className="text-yellow-500">P</span>
                      <span className="text-green-600">G</span>
                    </div>
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white border border-zinc-700 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 font-bold uppercase tracking-widest">
                      Start a New Chat
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage("login");
                      setIsMenuOpen(false);
                    }}
                    className="group relative flex items-center gap-3 text-white text-sm font-semibold tracking-[0.25em] uppercase hover:text-zinc-400 transition-all hover:translate-x-1"
                  >
                    {isLoggedIn ? <User size={20} /> : <LogIn size={20} />}
                    <span>
                      {isLoggedIn ? "GAMURA PROFILE" : "GAMURA LOGIN"}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage("history");
                      setIsMenuOpen(false);
                    }}
                    className="group relative flex items-center gap-3 text-white text-sm font-semibold tracking-[0.25em] uppercase hover:text-zinc-400 transition-all hover:translate-x-1"
                  >
                    <History size={20} />
                    <span>HISTORY</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage("about");
                      setIsMenuOpen(false);
                    }}
                    className="group relative flex items-center gap-3 text-white text-sm font-semibold tracking-[0.25em] uppercase hover:text-zinc-400 transition-all hover:translate-x-1"
                  >
                    <Info size={20} />
                    <span>ABOUT</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage("gg");
                      setIsMenuOpen(false);
                    }}
                    className="group relative flex items-center gap-3 text-white text-sm font-semibold tracking-[0.25em] uppercase hover:text-zinc-400 transition-all hover:translate-x-1"
                  >
                    <Gamepad2 size={20} />
                    <span>GG</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Middle Logo (Clickable) */}
        <div className="p-3 md:p-6 absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-12 h-12 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-black dark:border-white/10 shadow-lg focus:outline-none focus:ring-2 focus:ring-black/5 bg-white dark:bg-zinc-950 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <SafeImage
              srcs={logoSources}
              alt="Gamura Logo"
              className="w-full h-full object-cover"
              fallbackIcon={Sparkles}
              fallbackText="GAMURA"
            />
          </button>
        </div>

        {/* Top Right Actions */}
        <div className="p-3 md:p-4 absolute top-0 right-0 z-10 flex gap-4">
          {/* Removed Portfolio button as requested */}
        </div>

        {/* Top Middle Logo / Image */}
        <button
          onClick={() => setCurrentPage("white-page")}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex justify-center w-full max-w-[280px] sm:max-w-[420px] md:max-w-[580px] hover:opacity-90 active:scale-[0.98] transition-all bg-transparent border-none outline-none cursor-pointer focus:outline-none"
        >
          <SafeImage
            srcs={[
              "https://lh3.googleusercontent.com/d/1964MBWOG-tkUyeooBmLizw5Bol97oe1U",
            ]}
            alt="Gamura Top Logo"
            className="w-full h-auto object-contain bg-transparent mix-blend-multiply dark:mix-blend-normal"
            fallbackIcon={Sparkles}
          />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center w-full h-full p-4 md:p-8 mt-16 md:mt-0 relative z-0">
          <div className="w-full max-w-5xl flex items-center justify-center mx-auto">
            <SafeImage
              srcs={mainImgSources}
              alt="Gamura Main"
              className="w-full max-h-[70vh] object-contain bg-white dark:bg-zinc-950 mix-blend-multiply dark:mix-blend-normal"
              fallbackIcon={Sparkles}
              fallbackText="Intelligence Redefined"
            />
          </div>

          <div className="w-full max-w-5xl flex justify-between mx-auto mt-4 px-4 md:px-8">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setShowUniverseLoader(true);
                    setTimeout(() => setCurrentPage("universe-active"), 100);
                  } else {
                    showToast(
                      "⚠️",
                      "Connection Denied",
                      "You must first ACTIVATE YOUR GAMURA ID to access the Universe service. Please sign in.",
                      "warning",
                    );
                    setCurrentPage("login");
                  }
                }}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border border-zinc-200 bg-white flex items-center justify-center p-2 hover:opacity-80 transition-opacity cursor-pointer shadow-black/10 dark:shadow-white/5"
              >
                <SafeImage
                  srcs={roundImgSources}
                  alt="Gamura Extra Details Left"
                  className="w-full h-full object-contain bg-white"
                  fallbackIcon={Sparkles}
                />
              </button>
              <span className="text-[10px] md:text-[11px] font-extrabold tracking-[0.25em] text-zinc-500 dark:text-zinc-400 font-sans uppercase">
                UNIVERSE
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  window.open("https://gamuragalaxy.vercel.app/", "_blank");
                }}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border-2 border-dashed border-sky-400 hover:border-sky-500 bg-white flex items-center justify-center p-1 hover:opacity-90 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-black/10 dark:shadow-white/5"
              >
                <SafeImage
                  srcs={[
                    "https://lh3.googleusercontent.com/d/1TqxgExM7o866SAgpNri0R-mx0sZtCtc3",
                  ]}
                  alt="Join GALAXY"
                  className="w-full h-full object-cover rounded-full"
                  fallbackIcon={User}
                />
              </button>
              <span className="text-[10px] md:text-[11px] font-extrabold tracking-[0.2em] text-[#0EA5E9] dark:text-sky-400 font-sans uppercase text-center animate-pulse">
                JOIN GALAXY
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage("aura");
                }}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border border-zinc-200 bg-white flex items-center justify-center p-2 hover:opacity-80 transition-opacity cursor-pointer shadow-black/10 dark:shadow-white/5"
              >
                <SafeImage
                  srcs={rightRoundImgSources}
                  alt="Gamura Extra Details Right"
                  className="w-full h-full object-contain bg-white"
                  fallbackIcon={Sparkles}
                />
              </button>
              <span className="text-[10px] md:text-[11px] font-extrabold tracking-[0.25em] text-zinc-500 dark:text-zinc-400 font-sans uppercase">
                AURA
              </span>
            </div>
          </div>
        </div>

        {/* TOASTS CONTAINER FOR APP (LOGIN, SIGNUP, SYSTEM GATEWAY) */}
        <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => {
              const scheme = {
                success: {
                  border: "border-emerald-500/20 bg-[#071912]/95",
                  bar: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
                  iconBg:
                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                },
                error: {
                  border: "border-red-500/20 bg-[#140507]/95",
                  bar: "bg-red-400 shadow-[0_0_12px_#f87171]",
                  iconBg: "bg-red-500/10 text-red-500 border border-red-500/20",
                },
                warning: {
                  border: "border-[#f59e0b]/20 bg-[#140d05]/95",
                  bar: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
                  iconBg:
                    "bg-[#f59e0b]/10 text-amber-400 border border-[#f59e0b]/20",
                },
                info: {
                  border: "border-cyan-500/20 bg-[#05111c]/95",
                  bar: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
                  iconBg:
                    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                },
              }[t.type || "info"];

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  layout
                  className={`min-w-[300px] ${scheme.border} border p-4 rounded-xl shadow-2xl flex items-center gap-4 group pointer-events-auto backdrop-blur-md relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${scheme.bar}`}
                  />
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${scheme.iconBg}`}
                  >
                    {t.ic}
                  </div>
                  <div className="flex-1 pl-1">
                    <div className="text-[11px] font-black text-white leading-tight uppercase tracking-tighter">
                      {t.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 uppercase font-bold leading-tight">
                      {t.content || t.msg}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setToasts((prev) =>
                        prev.filter((toast) => toast.id !== t.id),
                      )
                    }
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
}
