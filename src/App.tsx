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
  ChevronRight,
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
  Flame,
  Music,
  Compass,
  Scale,
} from "lucide-react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  signInWithRedirect,
  getRedirectResult,
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
import { NetworkGraphView } from "./components/NetworkGraphView";
import { DailyStreakWidget } from "./components/DailyStreakWidget";
import { BackgroundAudioPlayer } from "./components/BackgroundAudioPlayer";
import {
  PrivacyPolicyView,
  TermsOfServiceView,
  AccountDeletionView,
  LicenseAgreementView,
} from "./components/LegalViews";
import GamuraLicenseGate from "./components/GamuraLicenseGate";
import AppleBottomDock from "./components/AppleBottomDock";
import GamuraAuraHub, { AuraEngineControlPanel } from "./components/GamuraAuraHub";
import GamuraPdfStudio, {
  G_PDF_LOGO_SRC,
  G_PDF_LOGO_FALLBACK,
} from "./components/GamuraPdfStudio";
import GamuraStoreLaunch, {
  LAUNCH_LOGO_SRC,
  LAUNCH_LOGO_FALLBACK,
} from "./components/GamuraStoreLaunch";
import UniverseAppsView from "./components/UniverseAppsView";
import UniverseSettingsView, {
  DEFAULT_ALLOW_ACCESS,
  UniversePreferences,
  UNIVERSE_PREFS_STORAGE_KEY,
  loadUniversePreferences,
} from "./components/UniverseSettingsView";
import GamuraVeoPage from "./components/GamuraVeoPage";
import GamuraClipPage from "./components/GamuraClipPage";
import GamuraCalcPage from "./components/GamuraCalcPage";
import GamuraCameraPage from "./components/GamuraCameraPage";
import GamuraMessengerPage from "./components/GamuraMessengerPage";
import GfilesPage from "./components/GfilesPage";
import GamuraLinksPage from "./components/GamuraLinksPage";
import GamuraResumePage from "./components/GamuraResumePage";
import GamuraPortfolioBuilderPage from "./components/GamuraPortfolioBuilderPage";
import GamuraPortfolioBuilder2Page from "./components/GamuraPortfolioBuilder2Page";
import GamuraPptCredPage from "./components/GamuraPptCredPage";
import GamuraCoverGenedPage from "./components/GamuraCoverGenedPage";
import GamuraLifelinePage from "./components/GamuraLifelinePage";
import GamuraShieldPage from "./components/GamuraShieldPage";
import GamuraFreshPage from "./components/GamuraFreshPage";
import GamuraCardPage from "./components/GamuraCardPage";
import GamuraWalletPage from "./components/GamuraWalletPage";
import GamuraForBusinessPage from "./components/GamuraForBusinessPage";
import {
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  getUniverseInstalledApps,
} from "./utils/gamuraStoreApps";
import { exportUserFirestoreBackup } from "./utils/gamuraDataExport";

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
        const next = Math.min(100, prev + 8); // Fast 200ms loader
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(onFinish, 100);
          }, 30);
        }
        return next;
      });
    }, 20);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
      clearInterval(timer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 bg-[#F5F5F7] text-[#1D1D1F] z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans transition-opacity duration-300 ${isFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
      />
      <div className="relative z-10 flex flex-col items-center gap-7 px-6">
        <div className="w-28 h-28 rounded-[28px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center p-4">
          <SafeImage
            srcs={loaderImgSources}
            alt="Gamura"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] tabular-nums">
            {Math.round(progress)}%
          </div>
          <div className="text-xs tracking-wide text-[#6E6E73] font-medium">
            Opening Gamura...
          </div>
        </div>
        <div className="w-[240px]">
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0071E3] rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
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
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("semantic");
  const [semanticMatches, setSemanticMatches] = useState<Record<string, { relevance: number; reason: string }>>({});
  const [isSearchingSemantically, setIsSearchingSemantically] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"users" | "requests" | "active">(
    "users",
  );
  const [refreshBit, setRefreshBit] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatSearchQuery("");
    setSemanticMatches({});
    setIsSearchingSemantically(false);
  }, [activeChat?.id]);

  const triggerSemanticSearch = useCallback(
    async (query: string, currentMessages: any[]) => {
      if (!query.trim() || currentMessages.length === 0) {
        setSemanticMatches({});
        setIsSearchingSemantically(false);
        return;
      }
      setIsSearchingSemantically(true);
      setSemanticError(null);
      try {
        const res = await fetch("/api/chat/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query.trim(),
            messages: currentMessages.map((m: any) => ({
              id: m.id || String(m.ts),
              text: m.text,
              senderName: m.senderName,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const matchMap: Record<string, { relevance: number; reason: string }> = {};
          if (Array.isArray(data.matches)) {
            data.matches.forEach((item: any) => {
              if (item && item.id) {
                matchMap[String(item.id)] = {
                  relevance: typeof item.relevance === "number" ? item.relevance : 85,
                  reason: item.reason || "Semantic contextual match",
                };
              }
            });
          }
          setSemanticMatches(matchMap);
        } else {
          setSemanticError("Semantic search unavailable");
        }
      } catch (err) {
        console.warn("Semantic search failed:", err);
        setSemanticError("Failed to search semantically");
      } finally {
        setIsSearchingSemantically(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (searchMode !== "semantic" || !chatSearchQuery.trim()) {
      setSemanticMatches({});
      setIsSearchingSemantically(false);
      return;
    }
    const timer = setTimeout(() => {
      triggerSemanticSearch(chatSearchQuery, messages);
    }, 350);
    return () => clearTimeout(timer);
  }, [chatSearchQuery, searchMode, messages, triggerSemanticSearch]);

  const filteredMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    if (searchMode === "semantic") {
      const matchCount = Object.keys(semanticMatches).length;
      if (isSearchingSemantically && matchCount === 0) {
        return messages;
      }
      if (!isSearchingSemantically && matchCount === 0) {
        return [];
      }
      return messages
        .filter((m: any) => {
          const key = String(m.id || m.ts);
          return !!semanticMatches[key];
        })
        .sort((a: any, b: any) => {
          const relA = semanticMatches[String(a.id || a.ts)]?.relevance || 0;
          const relB = semanticMatches[String(b.id || b.ts)]?.relevance || 0;
          return relB - relA;
        });
    }

    const q = chatSearchQuery.toLowerCase().trim();
    return messages.filter(
      (m: any) =>
        (m.text && m.text.toLowerCase().includes(q)) ||
        (m.senderName && m.senderName.toLowerCase().includes(q)),
    );
  }, [messages, chatSearchQuery, searchMode, semanticMatches, isSearchingSemantically]);

  const highlightChatQuery = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === query.trim().toLowerCase() ? (
        <mark
          key={index}
          className="bg-amber-300 text-slate-900 px-0.5 rounded font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

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
              {/* Chat Title bar & Workspace Header */}
              <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/50 flex items-center justify-center text-sky-500 font-extrabold text-[12px] shrink-0">
                    {activeChat.type === "group" ? "G" : "D"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                      {activeChat.type === "group"
                        ? activeChat.name
                        : (Object.values(activeChat.nicknames || {}).find(
                            (n) => n !== myNeuralProfile.nickname,
                          ) as string) || "Private Conversation"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                        Ephemeral Segment // 24h Auto-delete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workspace Header Actions: Search Bar & Controls */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Search Bar Component with Semantic Search Mode */}
                  <div className="relative flex items-center gap-1.5">
                    {/* Mode Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setSearchMode(searchMode === "semantic" ? "keyword" : "semantic")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        searchMode === "semantic"
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs hover:brightness-105"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                      }`}
                      title={
                        searchMode === "semantic"
                          ? "Semantic Search (Active) - Searches by AI concept & meaning via Gemini"
                          : "Keyword Filter (Active) - Searches exact word matches. Click to switch to AI Semantic Search."
                      }
                    >
                      <Sparkles size={11} className={searchMode === "semantic" ? "text-amber-200 animate-pulse" : "text-slate-400"} />
                      <span>{searchMode === "semantic" ? "AI Semantic" : "Keyword"}</span>
                    </button>

                    <div
                      className={`relative flex items-center bg-slate-50 hover:bg-slate-100/90 focus-within:bg-white border rounded-xl px-2.5 py-1.5 transition-all duration-300 ${
                        searchMode === "semantic"
                          ? "border-amber-400 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-400/30 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.35)] focus-within:animate-pulse"
                          : "border-sky-300 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-400/30 focus-within:shadow-[0_0_20px_rgba(56,189,248,0.35)] focus-within:animate-pulse"
                      } ${
                        chatSearchQuery ? "w-52 sm:w-68" : "w-36 sm:w-56"
                      }`}
                    >
                      {isSearchingSemantically ? (
                        <Loader2 size={12} className="text-amber-500 animate-spin shrink-0 mr-1.5" />
                      ) : searchMode === "semantic" ? (
                        <Sparkles size={12} className="text-amber-500 shrink-0 mr-1.5" />
                      ) : (
                        <Search size={12} className="text-slate-400 shrink-0 mr-1.5" />
                      )}
                      <input
                        type="text"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        placeholder={
                          searchMode === "semantic"
                            ? "AI Search (e.g. 'budget discussion')..."
                            : "Filter messages..."
                        }
                        className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 w-full font-medium"
                      />
                      {chatSearchQuery && (
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              searchMode === "semantic"
                                ? "text-amber-700 bg-amber-100"
                                : "text-sky-600 bg-sky-100/70"
                            }`}
                          >
                            {filteredMessages.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setChatSearchQuery("");
                              setSemanticMatches({});
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            title="Clear search"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

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
                      setChatSearchQuery("");
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
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col bg-slate-50/50">
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

                  {/* Active Search Filter Banner */}
                  {chatSearchQuery.trim() && (
                    <div
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs shadow-xs ${
                        searchMode === "semantic"
                          ? "bg-amber-50/90 border border-amber-200/70"
                          : "bg-sky-50/90 border border-sky-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {isSearchingSemantically ? (
                          <Loader2 size={13} className="text-amber-600 animate-spin" />
                        ) : searchMode === "semantic" ? (
                          <Sparkles size={13} className="text-amber-600" />
                        ) : (
                          <Search size={13} className="text-sky-600" />
                        )}
                        <span className="font-bold text-[11px] text-slate-700">
                          {searchMode === "semantic" ? "AI Semantic Search:" : "Keyword Filter:"}{" "}
                          <span
                            className={`font-black ${
                              searchMode === "semantic" ? "text-amber-700" : "text-sky-700"
                            }`}
                          >
                            "{chatSearchQuery}"
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            searchMode === "semantic"
                              ? "text-amber-700 bg-white border border-amber-200"
                              : "text-sky-600 bg-white/80 border border-sky-200/60"
                          }`}
                        >
                          {isSearchingSemantically
                            ? "Analyzing meaning..."
                            : `${filteredMessages.length} of ${messages.length} found`}
                        </span>
                        {searchMode === "semantic" && (
                          <span className="text-[9px] font-mono text-amber-600/80 bg-amber-100/60 px-1.5 py-0.5 rounded hidden sm:inline">
                            Powered by Gemini
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSearchMode(searchMode === "semantic" ? "keyword" : "semantic")
                          }
                          className="text-[10px] font-extrabold text-slate-500 hover:text-slate-800 underline uppercase tracking-wider cursor-pointer"
                        >
                          Switch to {searchMode === "semantic" ? "Exact" : "Semantic"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChatSearchQuery("");
                            setSemanticMatches({});
                          }}
                          className={`text-[10px] font-extrabold underline uppercase tracking-wider cursor-pointer transition-colors ${
                            searchMode === "semantic"
                              ? "text-amber-700 hover:text-amber-900"
                              : "text-sky-600 hover:text-sky-800"
                          }`}
                        >
                          Reset Filter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* No matching search results */}
                  {chatSearchQuery.trim() && !isSearchingSemantically && filteredMessages.length === 0 && (
                    <div className="py-12 px-4 text-center bg-white border border-dashed border-slate-200 rounded-2xl max-w-sm mx-auto my-auto space-y-2.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                          searchMode === "semantic" ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {searchMode === "semantic" ? <Sparkles size={18} /> : <Search size={18} />}
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {searchMode === "semantic" ? "No conceptual matches" : "No messages found"}
                      </p>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        {searchMode === "semantic"
                          ? `No messages in this chat session semantically match "${chatSearchQuery}". Try rephrasing or switch to Exact Keyword mode.`
                          : `No messages in this chat session contain "${chatSearchQuery}".`}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {searchMode === "semantic" && (
                          <button
                            type="button"
                            onClick={() => setSearchMode("keyword")}
                            className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Try Keyword Mode
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setChatSearchQuery("");
                            setSemanticMatches({});
                          }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredMessages.map((m, i) => {
                    const isMe = m.senderId === user.uid;
                    const timeStr = getRemainingTimeStr(m.ts);
                    const matchKey = String(m.id || m.ts);
                    const semanticMatch = searchMode === "semantic" ? semanticMatches[matchKey] : null;

                    return (
                      <div
                        key={m.id || i}
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
                            {searchMode === "keyword"
                              ? highlightChatQuery(m.text, chatSearchQuery)
                              : m.text}
                          </p>
                          {semanticMatch && (
                            <div
                              className={`flex items-center justify-between gap-2 mt-2.5 pt-2 border-t text-[9.5px] font-bold ${
                                isMe
                                  ? "border-white/20 text-sky-100"
                                  : "border-slate-100 text-amber-700"
                              }`}
                            >
                              <span className="flex items-center gap-1 font-mono">
                                <Sparkles size={10} className={isMe ? "text-amber-300" : "text-amber-500"} />
                                <span>{semanticMatch.relevance}% Match</span>
                              </span>
                              <span className="truncate max-w-[170px] opacity-90 font-sans">
                                {semanticMatch.reason}
                              </span>
                            </div>
                          )}
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
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [rtdbOnline, setRtdbOnline] = useState(false);
  const [nodeStats, setNodeStats] = useState({
    developers: 0,
    neuralProfiles: 0,
    shortLinks: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const elapsed = Math.max(1, Math.round(performance.now() - start));
        setLatencyMs(elapsed);
        setServerStatus(res.ok ? "online" : "offline");
      } catch {
        setServerStatus("offline");
        setLatencyMs(null);
      }
    };

    measureLatency();
    const timer = setInterval(measureLatency, 8000);

    const unsubConn = rtdb
      ? onValue(
          ref(rtdb, ".info/connected"),
          (snap) => {
            setRtdbOnline(snap.val() === true);
          },
          () => setRtdbOnline(false),
        )
      : () => {};

    const unsubStats = onSnapshot(
      doc(db, "system", "stats"),
      (snap) => {
        if (snap.exists()) {
          setNodeStats((prev) => ({
            ...prev,
            totalUsers: snap.data()?.totalUsers || prev.totalUsers,
          }));
        }
      },
      () => {},
    );

    const unsubDevs = onSnapshot(
      query(collection(db, "gamura_developers"), limit(100)),
      (snap) => {
        setNodeStats((prev) => ({ ...prev, developers: snap.size }));
      },
      () => {},
    );

    const unsubProfiles = onSnapshot(
      query(collection(db, "neural_profiles"), limit(100)),
      (snap) => {
        setNodeStats((prev) => ({ ...prev, neuralProfiles: snap.size }));
      },
      () => {},
    );

    const unsubLinks = onSnapshot(
      query(collection(db, "gamura_shortlinks"), limit(100)),
      (snap) => {
        setNodeStats((prev) => ({ ...prev, shortLinks: snap.size }));
      },
      () => {},
    );

    return () => {
      clearInterval(timer);
      unsubConn();
      unsubStats();
      unsubDevs();
      unsubProfiles();
      unsubLinks();
    };
  }, []);

  const totalLiveNodes = Math.max(
    nodeStats.totalUsers,
    nodeStats.developers + nodeStats.neuralProfiles,
  );

  return (
    <div className="w-full bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-10 shadow-xs font-sans text-[#1D1D1F] space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-[#F5F5F7] border border-zinc-200/80 flex items-center justify-center shadow-xs">
          <Cpu size={36} className="text-[#0071E3]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
            Galaxy Core
          </h2>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === "offline"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-semibold text-emerald-700">
              {serverStatus === "online"
                ? "All Systems Operational"
                : serverStatus === "checking"
                  ? "Checking Real-Time Nodes..."
                  : "Local Mesh Mode Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[
          {
            label: "API Latency",
            val: latencyMs !== null ? `${latencyMs} ms` : "Checking",
            sub: "Real-Time Health Probe",
            icon: <Activity size={16} className="text-[#0071E3]" />,
          },
          {
            label: "Published URLs",
            val: `${nodeStats.developers}`,
            sub: "Active Free /@ Pages",
            icon: <Globe size={16} className="text-emerald-600" />,
          },
          {
            label: "Neutral Link Profiles",
            val: `${nodeStats.neuralProfiles}`,
            sub: `${totalLiveNodes} Total Ecosystem Nodes`,
            icon: <Users size={16} className="text-indigo-600" />,
          },
          {
            label: "Realtime Presence",
            val: rtdbOnline ? "Connected" : "Syncing",
            sub: `${nodeStats.shortLinks} Short Links Tracked`,
            icon: <Database size={16} className="text-amber-600" />,
          },
        ].map((metric, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/60 flex flex-col justify-between space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center shadow-xs">
              {metric.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                {metric.val}
              </div>
              <div className="text-xs font-semibold text-[#1D1D1F] mt-0.5">
                {metric.label}
              </div>
              <div className="text-[11px] text-[#6E6E73] mt-0.5">
                {metric.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#6E6E73] max-w-md mx-auto text-center leading-relaxed">
        Live system telemetry synced directly from Gamura cloud APIs, Realtime Database presence, and Firestore directories.
      </p>
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
  return (
    <AuraEngineControlPanel
      user={user}
      userInfo={userInfo}
      setCurrentUserInfo={setCurrentUserInfo}
      onBack={onBack}
      showToast={showToast}
    />
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
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
  showToast,
}: {
  onBack: () => void;
  loaderImgSources: string[];
  showToast: any;
}) => {
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liveProposals, setLiveProposals] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "features"), limit(30));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item: any) => item.proposedBy || item.description);
        setLiveProposals(items);
      },
      () => {},
    );
    return () => unsub();
  }, []);

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = proposalTitle.trim();
    const desc = proposalDesc.trim();
    if (!title || !desc) return;
    setSubmitting(true);
    try {
      const currentAuthUser = auth.currentUser;
      const newDoc = {
        name: title,
        description: desc,
        status: "Proposed",
        progress: 15,
        color: "sky",
        order: Date.now(),
        proposedBy: currentAuthUser?.displayName || currentAuthUser?.email || "Community Member",
      };

      if (currentAuthUser) {
        const refDoc = doc(collection(db, "features"));
        await setDoc(refDoc, newDoc);
        showToast(
          "🚀",
          "Proposal Published",
          `"${title}" is now saved in the Gamura roadmap.`,
        );
      } else {
        setLiveProposals((prev) => [{ id: `local_${Date.now()}`, ...newDoc }, ...prev]);
        showToast(
          "✨",
          "Proposal Added",
          "Added to your session preview. Sign in to publish globally.",
        );
      }

      setShowProposeModal(false);
      setProposalTitle("");
      setProposalDesc("");
    } catch (err: any) {
      showToast("❌", "Submission Failed", err?.message || "Could not save proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  const coreCapabilities = [
    {
      title: "Gamura Prompt Generator (GPG)",
      subtitle: "Real-Time Prompt Engine",
      icon: Sparkles,
      status: "Live",
      text: "Transforms any goal, topic, or task into crisp, production-ready prompts for code, design, video, and research.",
    },
    {
      title: "Free URL Identity (/@username)",
      subtitle: "Instant Public Hub",
      icon: Globe,
      status: "Live",
      text: "Claim a personalized Gamura URL, custom profile blocks, social links, and QR code sharing in seconds.",
    },
    {
      title: "Neutral Link Chat & Groups",
      subtitle: "Ephemeral 24h Channels",
      icon: MessageSquare,
      status: "Live",
      text: "Connect directly with teammates using unique handles with auto-expiring 24-hour rooms and live presence.",
    },
    {
      title: "AI Semantic Chat Search",
      subtitle: "Meaning-Based Retrieval",
      icon: Search,
      status: "Live",
      text: "Search across message history by meaning, context, and intent rather than exact keyword spelling.",
    },
    {
      title: "Portfolio Builder",
      subtitle: "One-Click Publishing",
      icon: Briefcase,
      status: "Live",
      text: "Build clean Apple-inspired personal websites and export HTML or deploy straight to GitHub Pages.",
    },
    {
      title: "Live Universe Analytics",
      subtitle: "Real-Time Firestore Sync",
      icon: Activity,
      status: "Live",
      text: "Monitor user nodes, short-link clicks, system latency, and shared community projects without mock data.",
    },
  ];

  return (
    <div className="w-full space-y-6 font-sans text-[#1D1D1F] animate-in fade-in duration-500 pb-10">
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer mb-1.5"
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
            System Features
          </h2>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Active capabilities powering Gamura Intelligence and Gamura Universe.
          </p>
        </div>

        <button
          onClick={() => setShowProposeModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Plus size={14} /> Propose Feature
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coreCapabilities.map((feat, i) => (
          <div
            key={i}
            className="bg-white border border-zinc-200/80 rounded-2xl p-5 hover:border-zinc-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
                  <feat.icon className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-semibold">
                  {feat.status}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#0071E3]">
                  {feat.subtitle}
                </span>
                <h3 className="font-bold text-sm text-[#1D1D1F] mt-0.5">
                  {feat.title}
                </h3>
              </div>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                {feat.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {liveProposals.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">
                Community Feature Proposals
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Live submissions stored in Firestore
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]">
              {liveProposals.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveProposals.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/60 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F] truncate">
                    {item.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-[10px] font-semibold text-[#0071E3] shrink-0">
                    {item.status || "Proposed"}
                  </span>
                </div>
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROPOSE MODAL */}
      <AnimatePresence>
        {showProposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={() => setShowProposeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden text-[#1D1D1F]"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handlePropose} className="p-6 sm:p-7 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                    Propose a Feature
                  </h2>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Share an idea for Gamura Universe.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F] block">
                      Feature Name
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      placeholder="e.g. Custom Portfolio Themes"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F] block">
                      Description
                    </label>
                    <textarea
                      required
                      value={proposalDesc}
                      onChange={(e) => setProposalDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all resize-none"
                      placeholder="Describe how it helps users..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProposeModal(false)}
                    className="flex-1 py-2.5 bg-[#F5F5F7] hover:bg-zinc-200 text-[#1D1D1F] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Proposal"}
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
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<any[]>([]);
  const [publicDevs, setPublicDevs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const isAuth = Boolean(
    currentUser && auth.currentUser && currentUser.uid !== "guest_explorer_uid",
  );

  useEffect(() => {
    setLoading(true);
    let settledCount = 0;
    const markReady = () => {
      settledCount += 1;
      if (settledCount >= 1) setLoading(false);
    };

    // Public Neutral Link profiles (always readable)
    const unsubProfiles = onSnapshot(
      query(collection(db, "neural_profiles"), limit(100)),
      (snap) => {
        setPublicProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        markReady();
      },
      () => markReady(),
    );

    // Public Developer URLs (always readable)
    const unsubDevs = onSnapshot(
      query(collection(db, "gamura_developers"), limit(100)),
      (snap) => {
        setPublicDevs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        markReady();
      },
      () => markReady(),
    );

    // Authenticated /users directory (when signed in)
    let unsubUsers = () => {};
    if (isAuth) {
      const q = query(
        collection(db, "users"),
        orderBy("lastLogin", "desc"),
        limit(100),
      );
      unsubUsers = onSnapshot(
        q,
        (snap) => {
          setAuthUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          markReady();
        },
        () => markReady(),
      );
    } else {
      setAuthUsers([]);
    }

    const fallbackTimer = setTimeout(() => setLoading(false), 1500);

    return () => {
      clearTimeout(fallbackTimer);
      unsubProfiles();
      unsubDevs();
      unsubUsers();
    };
  }, [isAuth, db]);

  // Merge authenticated users + public profiles + public developers into one live list
  const usersList = useMemo(() => {
    const map = new Map<string, any>();

    authUsers.forEach((u) => {
      const key = u.uid || u.id;
      map.set(key, {
        ...u,
        id: u.id || key,
        uid: u.uid || key,
        source: "account",
      });
    });

    publicProfiles.forEach((p) => {
      const key = p.uid || `np_${p.nickname || p.id}`;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          neuralNickname: p.nickname,
          lastPulse: p.lastPulse || existing.lastPulse,
          avatarUrl: existing.avatarUrl || p.avatarUrl,
        });
      } else {
        map.set(key, {
          id: p.uid || p.id,
          uid: p.uid || p.id,
          nickname: p.nickname || p.id,
          username: p.nickname || p.id,
          avatarUrl: p.avatarUrl || "",
          lastPulse: p.lastPulse || null,
          source: "neural_profile",
        });
      }
    });

    publicDevs.forEach((dev) => {
      const key = dev.uid || `dev_${dev.username || dev.id}`;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          username: existing.username || dev.username || dev.id,
          displayName: existing.nickname || dev.displayName,
          published: dev.published,
        });
      } else {
        map.set(key, {
          id: dev.uid || dev.id,
          uid: dev.uid || dev.id,
          nickname: dev.displayName || dev.username || dev.id,
          username: dev.username || dev.id,
          photoURL: dev.avatar || "",
          createdAt: dev.updatedAt || null,
          published: dev.published,
          source: "developer_url",
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a: any, b: any) => {
      const aOnline = presenceData?.[a.uid]?.online ? 1 : 0;
      const bOnline = presenceData?.[b.uid]?.online ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;

      const getT = (val: any) => {
        if (!val) return 0;
        if (val.toMillis) return val.toMillis();
        if (val.seconds) return val.seconds * 1000;
        if (val instanceof Date) return val.getTime();
        if (val.toDate) return val.toDate().getTime();
        return Number(val) || 0;
      };
      return Math.max(getT(b.lastLogin), getT(b.lastPulse)) - Math.max(getT(a.lastLogin), getT(a.lastPulse));
    });
    return list;
  }, [authUsers, publicProfiles, publicDevs, presenceData]);

  useEffect(() => {
    setFilterMode(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeThreshold = 5 * 60 * 1000;

  const getUserStatus = (u: any) => {
    const isOnline = presenceData?.[u.uid]?.online || presenceData?.[u.id]?.online;
    if (isOnline) {
      return {
        label: "Active",
        active: true,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500 animate-pulse",
      };
    }

    const pulseSource = u.lastPulse || u.lastLogin;
    if (pulseSource) {
      let t = 0;
      if (pulseSource.toDate) t = pulseSource.toDate().getTime();
      else if (pulseSource.seconds) t = pulseSource.seconds * 1000;
      else if (pulseSource instanceof Date) t = pulseSource.getTime();
      else t = new Date(pulseSource).getTime();

      if (t > 0 && currentTime - t < activeThreshold) {
        return {
          label: "Recent",
          active: true,
          badgeClass: "bg-blue-50 text-[#0071E3] border-blue-200",
          dotClass: "bg-[#0071E3]",
        };
      }
    }

    return {
      label: u.published ? "Public URL" : "Synced",
      active: false,
      badgeClass: "bg-zinc-100 text-[#6E6E73] border-zinc-200",
      dotClass: "bg-zinc-400",
    };
  };

  const getFilteredUsers = () => {
    const q = search.toLowerCase().trim();
    return usersList.filter((u) => {
      const matchesSearch =
        !q ||
        (u.uid && String(u.uid).toLowerCase().includes(q)) ||
        (u.username && String(u.username).toLowerCase().includes(q)) ||
        (u.nickname && String(u.nickname).toLowerCase().includes(q)) ||
        (u.email && String(u.email).toLowerCase().includes(q));

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
      "Copied",
      "User identifier copied to clipboard.",
      "success",
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePing = async (targetUser: any) => {
    setPingingId(targetUser.uid);
    const start = performance.now();
    try {
      await fetch("/api/health", { cache: "no-store" });
      const latency = Math.max(1, Math.round(performance.now() - start));

      if (isAuth && targetUser.uid && targetUser.uid !== currentUser?.uid) {
        try {
          const senderName =
            currentUser.nickname || currentUser.username || currentUser.displayName || "A member";
          await setDoc(
            doc(collection(db, `users/${targetUser.uid}/notifications`)),
            {
              msg: `📡 ${senderName} pinged you (${latency}ms)`,
              ic: "📡",
              timestamp: serverTimestamp(),
              unread: true,
            },
          );
        } catch {
          // Ignore if target isn't a full user doc
        }
      }

      showToast(
        "⚡",
        "Signal Verified",
        `Responded in ${latency}ms.`,
        "success",
      );
      if (isAuth) {
        addActivity(
          `Pinged ${targetUser.nickname || targetUser.username} (${latency}ms)`,
          "📡",
        );
      }
    } catch {
      showToast("⚠️", "Ping Unavailable", "Check network connection.", "warning");
    } finally {
      setPingingId(null);
    }
  };

  const filtered = getFilteredUsers();
  const currentLoggedInUserDoc = usersList.find(
    (u) => isAuth && u.uid === currentUser?.uid,
  );
  const isAdmin =
    isAuth &&
    ((currentLoggedInUserDoc && currentLoggedInUserDoc.role === "admin") ||
      currentUser.email === "gamuragalaxy@gmail.com" ||
      currentUser.email === "selvaranjancg@gmail.com");

  return (
    <div className="space-y-5 animate-in fade-in duration-500 font-sans pb-16 text-[#1D1D1F]">
      {/* Header Card */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer transition-colors mb-1.5"
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Users Directory
          </h2>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Live members, Neutral Link handles, and claimed Gamura URL profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl px-4 py-2.5 flex flex-col items-center min-w-[96px]">
            <span className="text-[11px] font-medium text-[#6E6E73]">
              Total Nodes
            </span>
            <span className="text-base font-bold text-[#1D1D1F] mt-0.5">
              {currentCount}
            </span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl px-4 py-2.5 flex flex-col items-center min-w-[96px]">
            <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Active Now
            </span>
            <span className="text-base font-bold text-emerald-700 mt-0.5">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
          />
          <input
            type="text"
            placeholder="Search by name, @handle, email, or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-zinc-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] focus:outline-none focus:border-[#0071E3] shadow-xs"
          />
        </div>

        <div className="flex bg-white border border-zinc-200/80 p-1 rounded-2xl shadow-xs">
          {[
            { id: "all", label: "All", count: currentCount },
            { id: "active", label: "Active", count: activeCount },
            {
              id: "admins",
              label: "Admins",
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
                className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "bg-[#1D1D1F] text-white"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-[#6E6E73]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-16 bg-white border border-zinc-200/80 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-[#0071E3] animate-spin" />
          <span className="text-xs text-[#6E6E73] font-medium">
            Loading live directory...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-300 rounded-3xl bg-white">
          <Users size={28} className="mx-auto text-zinc-400 mb-2" />
          <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">
            No matching users found
          </h3>
          <p className="text-xs text-[#6E6E73]">
            Try clearing your search filter or switching tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const status = getUserStatus(u);
            const isCurrentUser = isAuth && currentUser?.uid === u.uid;
            return (
              <div
                key={u.uid || u.id}
                className={`p-5 rounded-3xl bg-white border flex flex-col justify-between transition-all shadow-xs ${
                  isCurrentUser
                    ? "border-[#0071E3]/40 ring-1 ring-[#0071E3]/10"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#6E6E73] truncate">
                      ID: {String(u.uid || u.id).slice(0, 10)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrentUser && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-[#0071E3] border border-blue-200 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${status.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-zinc-200 bg-[#F5F5F7] flex items-center justify-center shrink-0">
                      {u.photoURL || u.avatarUrl ? (
                        <img
                          src={u.photoURL || u.avatarUrl}
                          className="w-full h-full object-cover"
                          alt={u.nickname || "User"}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#1D1D1F] uppercase">
                          {(u.nickname || u.username || "G").charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1D1D1F] truncate">
                        {u.nickname || u.username || "Gamura Member"}
                      </div>
                      <div className="text-xs text-[#6E6E73] truncate">
                        @{u.username || u.neuralNickname || "member"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F5F5F7] rounded-2xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#6E6E73] shrink-0">Identifier</span>
                      <span className="font-mono text-[#1D1D1F] truncate font-medium">
                        {u.uid}
                      </span>
                    </div>
                    {u.email && isAuth && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#6E6E73] shrink-0">Email</span>
                        <span className="text-[#1D1D1F] truncate font-medium">
                          {u.email}
                        </span>
                      </div>
                    )}
                    {u.published && u.username && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#6E6E73] shrink-0">Public URL</span>
                        <a
                          href={`/@${u.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0071E3] hover:underline font-semibold truncate"
                        >
                          /@{u.username}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePing(u)}
                    disabled={pingingId === u.uid}
                    className="flex-1 py-2 bg-[#F5F5F7] hover:bg-zinc-200/80 rounded-xl text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {pingingId === u.uid ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Pinging...
                      </>
                    ) : (
                      <>
                        <Zap size={12} className="text-[#0071E3]" /> Ping
                      </>
                    )}
                  </button>

                  {isAdmin && u.uid !== currentUser?.uid && u.source === "account" && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Delete User Record"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(u.uid)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-semibold text-[#0071E3] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedId === u.uid ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === u.uid ? "Copied" : "Copy"}
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[500] flex items-center justify-center p-4 font-sans"
            onClick={() => setUserToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-5 text-[#1D1D1F]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Delete User Record?
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    This permanently removes @{userToDelete.username || "member"} from the directory.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Handle</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    @{userToDelete.username || "member"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Email</span>
                  <span className="font-semibold text-[#1D1D1F] truncate max-w-[200px]">
                    {userToDelete.email || "Not set"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-[#F5F5F7] hover:bg-zinc-200 rounded-xl text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteDoc(doc(db, "users", userToDelete.id));
                      addActivity(
                        `Removed user ${userToDelete.nickname || userToDelete.username}`,
                        "🗑️",
                      );
                      showToast(
                        "🗑️",
                        "User Removed",
                        `@${userToDelete.username || "member"} was deleted.`,
                        "success",
                      );
                    } catch (err: any) {
                      showToast(
                        "❌",
                        "Delete Failed",
                        err.message || "Could not delete user record.",
                        "error",
                      );
                    } finally {
                      setIsDeleting(false);
                      setUserToDelete(null);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <span>Confirm Delete</span>
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

// --- BROADCAST KANBAN COMPONENTS ---
const KanbanItem = ({ id, task, isOverlay = false }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  const priorityColors: any = {
    High: "border-rose-500/30 bg-rose-500/5 text-rose-400",
    Medium: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    Low: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 mb-3 rounded-2xl border bg-zinc-900/50 backdrop-blur-md group hover:border-cyan-500/30 transition-all cursor-grab active:cursor-grabbing ${isOverlay ? "border-cyan-500 shadow-2xl scale-105 z-50" : "border-white/5"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${priorityColors[task.priority || "Medium"]}`}>
          {task.priority || "Medium"}
        </span>
        <span className="text-[8px] font-mono text-zinc-600">
          {task.timestamp?.toDate ? task.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "JUST NOW"}
        </span>
      </div>
      <p className="text-[11px] font-bold text-white leading-relaxed">
        {task.message}
      </p>
      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/5">
        <div className="w-5 h-5 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          <User size={10} />
        </div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          @{task.username || "explorer"}
        </span>
      </div>
    </div>
  );
};

const KanbanColumn = ({ id, title, tasks }: { id: string; title: string; tasks: any[] }) => {
  return (
    <div className="flex-1 min-w-[280px] bg-black/20 rounded-3xl p-4 border border-white/5 flex flex-col h-full max-h-[70vh]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${id === "High" ? "bg-rose-500 shadow-[0_0_8px_#ef4444]" : id === "Medium" ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">{title}</h3>
        </div>
        <span className="text-[9px] font-black text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanItem key={task.id} id={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-2xl opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">No nodes in queue</span>
          </div>
        )}
      </div>
    </div>
  );
};

const BroadcastKanbanView = ({ db, user, showToast }: { db: any; user: any; showToast: any }) => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBroadcasts(list);
    });
    return () => unsub();
  }, [db]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = broadcasts.find(t => t.id === active.id);
    const overId = over.id;

    // Check if over a column or an item
    const overColumn = ["High", "Medium", "Low"].includes(overId as string);
    const overTask = broadcasts.find(t => t.id === overId);
    const targetColumn = overColumn ? (overId as string) : (overTask?.priority || "Medium");

    if (activeTask && activeTask.priority !== targetColumn) {
      // Optimistic update
      setBroadcasts(prev => prev.map(t => t.id === active.id ? { ...t, priority: targetColumn } : t));
      
      // Firestore update
      try {
        await updateDoc(doc(db, "broadcasts", active.id as string), { priority: targetColumn });
      } catch (err) {
        console.error("Failed to update priority", err);
      }
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBroadcasts((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const highTasks = broadcasts.filter(t => (t.priority || "Medium") === "High");
  const mediumTasks = broadcasts.filter(t => (t.priority || "Medium") === "Medium");
  const lowTasks = broadcasts.filter(t => (t.priority || "Medium") === "Low");

  const activeTask = broadcasts.find(t => t.id === activeId);

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Radio className="text-cyan-400" size={24} />
            Broadcast Kanban
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Drag and drop signals to prioritize universe deployment
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
          <KanbanColumn id="High" title="High Priority" tasks={highTasks} />
          <KanbanColumn id="Medium" title="Standard Sync" tasks={mediumTasks} />
          <KanbanColumn id="Low" title="Low Latency" tasks={lowTasks} />
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}>
          {activeId ? (
            <KanbanItem id={activeId} task={activeTask} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
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
  const [universePrefs, setUniversePrefs] = useState<UniversePreferences>(() =>
    loadUniversePreferences(),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => loadUniversePreferences().defaultStartupTab || "Overview");
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
  const [universeAppsCount, setUniverseAppsCount] = useState<number>(() =>
    getUniverseInstalledApps().length,
  );

  useEffect(() => {
    const syncCount = () => {
      setUniverseAppsCount(getUniverseInstalledApps().length);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === UNIVERSE_APPS_KEY) {
        syncCount();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(UNIVERSE_APPS_EVENT, syncCount);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncCount);
    };
  }, []);

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
  const isAuthUser = Boolean(
    user && auth.currentUser && user.uid !== "guest_explorer_uid",
  );

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
    if (isAuthUser && activityFilter === "mine") {
      unsub = onSnapshot(doc(db, "activityLogs", user.uid), (docS) => {
        if (docS.exists()) setTotalTelemetry(docS.data().totalActions || 0);
        else setTotalTelemetry(0);
      });
    } else {
      setTotalTelemetry(null); // Fallback to length or other metric for global
    }
    return () => unsub();
  }, [user, isAuthUser, activityFilter, db]);

  useEffect(() => {
    // Manage Connection Status
    const unsubConn = rtdb
      ? onValue(
          ref(rtdb, '.info/connected'),
          (snap) => {
            setIsConnected(snap.val() === true);
          },
          () => setIsConnected(false),
        )
      : (() => {
          setIsConnected(typeof navigator !== "undefined" ? navigator.onLine : true);
          return () => {};
        })();

    const unsub = rtdb
      ? onValue(
          ref(rtdb, "/presence"),
          (snap) => {
            const data = snap.val() || {};
            setPresenceData(data);
          },
          () => {},
        )
      : () => {};
    
    // Broadcasts Listener
    const broadcastsQuery = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(1));
    let initialBroadcastLoad = true;
    const unsubBroadcasts = onSnapshot(
      broadcastsQuery,
      (snap) => {
        if (initialBroadcastLoad) {
          initialBroadcastLoad = false;
          return;
        }
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.senderUid !== user?.uid && universePrefs.broadcastAlerts) {
              showToast("📡", "GLOBAL BROADCAST", `${data.message}`);
            }
          }
        });
      },
      (err) => {
        console.warn("Broadcasts listener warning:", err?.message || err);
      },
    );
    
    return () => {
      unsub();
      unsubConn();
      unsubBroadcasts();
    };
  }, [user, db, showToast, universePrefs.broadcastAlerts]);

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
    if (!universePrefs.inAppAlerts && deducedType === "info") return;
    setToasts((prev) => [
      ...prev,
      { id, ic, title, content, msg: content, type: deducedType },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const [isExportingBackup, setIsExportingBackup] = useState(false);

  const handleExportFirestoreBackup = async () => {
    if (!isAuthUser) {
      showToast(
        "🔒",
        "Sign In Required",
        "Connect your Gamura ID to export your Firestore backup.",
        "warning",
      );
      return;
    }
    setIsExportingBackup(true);
    try {
      const result = await exportUserFirestoreBackup({
        username: userInfo?.username || null,
        displayName,
        email: user?.email || null,
      });
      showToast(
        "💾",
        "Firestore Backup Exported",
        `Downloaded ${result.summary.totalChats} chats, ${result.summary.activities} activities & ${result.summary.projects} projects.`,
        "success",
      );
    } catch (err: any) {
      showToast(
        "❌",
        "Backup Export Failed",
        err?.message || "Could not export Firestore data backup.",
        "error",
      );
    } finally {
      setIsExportingBackup(false);
    }
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
    if (!isAuthUser) return; // Guard against unauthenticated writes
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
    if (!quickAddText.trim()) return;
    if (!isAuthUser) {
      showToast("🔒", "Sign In Required", "Sign in to broadcast live signals to members.");
      return;
    }

    try {
      await setDoc(doc(collection(db, "broadcasts")), {
        message: quickAddText.trim(),
        senderUid: user.uid,
        username: userInfo?.username || "Member",
        priority: quickPriority,
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
    if (!isAuthUser) return;
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

    // Users listener (Loads authenticated users, plus public developers fallback for guests)
    let unsubUsers = () => {};
    let unsubPublicDevs = () => {};
    if (isAuthUser) {
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
        (error) => console.warn("Users query err:", error),
      );
    } else {
      unsubPublicDevs = onSnapshot(
        query(collection(db, "gamura_developers"), limit(50)),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setAllUsers(list);
          setRecentUsers(list.slice(0, 5));
        },
        () => {},
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
        if (snap.empty && isAuthUser) {
          // Seed initial features if empty (Requires auth to write)
          const initialFeatures = [
            {
              name: "GPG Engine",
              status: "Live",
              progress: 100,
              color: "sky",
              order: 1,
            },
            {
              name: "Galaxy Core",
              status: "Live",
              progress: 100,
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
              status: "Live",
              progress: 100,
              color: "yellow",
              order: 4,
            },
            {
              name: "Free URL Claim",
              status: "Live",
              progress: 100,
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
      (error) => console.warn("Features list skipped:", error),
    );

    // Activities listener (Requires auth)
    let unsubAct = () => {};
    if (isAuthUser) {
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
        (error) => console.warn("Activities query skipped:", error),
      );
    }

    // Neural Profiles listener (Public read)
    const unsubNeural = onSnapshot(
      query(collection(db, "neural_profiles"), limit(100)),
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
      (error) => console.error("Neural profiles fetch failed", error),
    );

    // Global Connections listener (Requires auth)
    let unsubGlobalConn = () => {};
    if (isAuthUser) {
      const globalConnQuery = query(collection(db, "neural_connections"));
      unsubGlobalConn = onSnapshot(
        globalConnQuery,
        (snap) => {
          const connList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setGlobalConnections(connList);
        },
        (error) => console.warn("Neural connections skipped:", error),
      );
    }

    // Notifications listener (Requires auth)
    let unsubNotif = () => {};
    if (isAuthUser) {
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
        (error) => console.warn("Notifications skipped:", error),
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
      (error) => console.warn("Shared projects skipped:", error),
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
      (error) => console.warn("Theme config skipped:", error),
    );

    return () => {
      unsubStats();
      unsubUsers();
      unsubPublicDevs();
      unsubFeat();
      unsubAct();
      unsubNeural();
      unsubGlobalConn();
      unsubNotif();
      unsubProjects();
      unsubTheme();
    };
  }, [user, isAuthUser, activityFilter]);

  useEffect(() => {
    if (isAuthUser && db && universePrefs.broadcastPresence) {
      const updatePulse = async () => {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { lastLogin: serverTimestamp() },
            { merge: true },
          );
        } catch (e) {
          console.warn("Pulse update skipped", e);
        }
      };
      updatePulse();
      const interval = setInterval(updatePulse, 45000);
      return () => clearInterval(interval);
    }
  }, [user, isAuthUser, db, universePrefs.broadcastPresence]);

  useEffect(() => {
    if (userInfo?.universePreferences) {
      setUniversePrefs((prev) => {
        const merged: UniversePreferences = {
          ...prev,
          ...userInfo.universePreferences,
          allowAccess: {
            ...DEFAULT_ALLOW_ACCESS,
            ...(prev.allowAccess || {}),
            ...(userInfo.universePreferences?.allowAccess || {}),
          },
        };
        try {
          localStorage.setItem(UNIVERSE_PREFS_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    }
  }, [userInfo?.universePreferences]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (universePrefs.enableKeyboardShortcut && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [universePrefs.enableKeyboardShortcut, searchOpen]);

  const handleUpdatePreferences = async (next: UniversePreferences) => {
    setUniversePrefs(next);
    try {
      localStorage.setItem(UNIVERSE_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setThemeColors((prev) => ({ ...prev, primary: next.accentColor }));
    setIsDark(next.surfaceMode === "dark");
    setActivityFilter(next.defaultActivityScope);

    if (isAuthUser && user?.uid && userInfo) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            nickname: userInfo.nickname || user.displayName || "Member",
            createdAt: userInfo.createdAt || Date.now(),
            universePreferences: next,
          },
          { merge: true },
        );
      } catch {
        // fallback already saved in localStorage
      }
    }
  };

  useEffect(() => {
    if (editProfileOpen && userInfo) {
      setNewUsername(userInfo.username || "");
      setNewNickname(userInfo.nickname || "");
      setNewBio(userInfo.bio || "");
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

  const [commentProjectId, setCommentProjectId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthUser) {
      showToast("🔒", "Sign In Required", "Sign in to share projects in the Universe.");
      return;
    }
    try {
      const newRef = doc(collection(db, "shared_projects"));
      await setDoc(newRef, {
        id: newRef.id,
        userId: user.uid,
        userName: displayName || userInfo?.nickname || user.email?.split("@")[0] || "Member",
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
    if (!isAuthUser) {
      showToast("🔒", "Sign In Required", "Sign in to like shared projects.");
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

  const handleCommentProject = (project: any) => {
    if (!isAuthUser) {
      showToast("🔒", "Sign In Required", "Sign in to comment on projects.");
      return;
    }
    setCommentDraft("");
    setCommentProjectId((prev) => (prev === project.id ? null : project.id));
  };

  const submitProjectComment = async (project: any) => {
    if (!isAuthUser || !commentDraft.trim()) return;
    const text = commentDraft.trim();
    setCommentDraft("");
    setCommentProjectId(null);
    try {
      await updateDoc(doc(db, "shared_projects", project.id), {
        comments: arrayUnion({
          userId: user.uid,
          userName: userInfo?.nickname || user.email?.split("@")[0] || "Member",
          text,
          timestamp: new Date().toISOString(),
          id: Math.random().toString(36).substring(7)
        })
      });
      showToast("💬", "Comment Added", "Your feedback is now live.");
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
    if (!user || !auth.currentUser || user.uid === "guest_explorer_uid") return;
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
      label: "Workspace",
      items: [
        { name: "Overview", icon: <LayoutGrid size={16} /> },
        {
          name: "Apps",
          icon: <LayoutGrid size={16} />,
          badge: universeAppsCount > 0 ? `${universeAppsCount}` : undefined,
        },
        {
          name: "Join Selvaranjan",
          icon: <Compass size={16} />,
          badge: "NETWORK",
        },
        {
          name: "Settings",
          icon: <Settings size={16} />,
          badge: "SYSTEM",
        },
        {
          name: "Users",
          icon: <Users size={16} />,
          badge: allUsers.length > 0 ? `${allUsers.length}` : undefined,
        },
        {
          name: "Active Users",
          icon: <Radio size={16} />,
          badge: `${activeCount} Live`,
        },
        {
          name: "Features",
          icon: <Layers size={16} />,
          badge: "NEW",
        },
        { name: "Integrations", icon: <Share2 size={16} /> },
        { name: "Network Graph", icon: <Network size={16} /> },
        { name: "Daily Streak", icon: <Flame size={16} /> },
        { name: "Audio Module", icon: <Music size={16} /> },
      ],
    },
    {
      label: "Universe Ecosystem",
      items: [
        { name: "Galaxy Core", icon: <Cpu size={16} /> },
        {
          name: "Gamura Universe",
          icon: <Globe size={16} />,
          badge: "CLAIM",
        },
        {
          name: "Neutral Link",
          icon: <Link size={16} />,
          badge: "ACTIVE",
        },
        { name: "Gamura Link", icon: <Link size={16} /> },
        { name: "Aura Settings", icon: <Sparkles size={16} /> },
        { name: "Portfolio Builder", icon: <Briefcase size={16} /> },
        {
          name: "Website",
          icon: <Globe size={16} />,
          action: () => window.open(window.location.origin, "_blank", "noopener,noreferrer"),
        },
        {
          name: "GCP",
          icon: <Cloud size={16} />,
          action: () => window.open("https://gamuracp.vercel.app/", "_blank", "noopener,noreferrer"),
        },
        {
          name: "Gamura Galaxy",
          icon: <Sparkles size={16} />,
          action: () =>
            window.open("https://gamuragalaxy.vercel.app/", "_blank", "noopener,noreferrer"),
        },
        {
          name: "SR Portfolio",
          icon: <User size={16} />,
          action: () =>
            window.open("https://selvaranjan.netlify.app/", "_blank", "noopener,noreferrer"),
        },
        {
          name: "BuBuBai",
          icon: <Bot size={16} />,
          action: () => window.open("https://bububai.vercel.app/", "_blank", "noopener,noreferrer"),
        },
        {
          name: "Resume & Portfolio Studio",
          icon: <FileText size={16} />,
          action: () => setActiveTab("Portfolio Builder"),
        },
      ],
    },
  ];

  const [connectedApps, setConnectedApps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("gamura_connected_integrations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [configuringApp, setConfiguringApp] = useState<string | null>(null);
  const [integrationEndpoint, setIntegrationEndpoint] = useState("");
  const [integrationEndpoints, setIntegrationEndpoints] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("gamura_integration_endpoints");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleConnectApp = async (app: string) => {
    const currentConns = connectedApps.includes(app)
      ? connectedApps
      : [...connectedApps, app];

    setConnectedApps(currentConns);
    try {
      localStorage.setItem("gamura_connected_integrations", JSON.stringify(currentConns));
    } catch {}

    if (isAuthUser) {
      try {
        const token = `gm_tok_${Math.random().toString(36).substring(2, 12)}`;
        const connRef = doc(db, "user_connections", user.uid);
        await setDoc(
          connRef,
          {
            connections: currentConns,
            [`${app.toLowerCase()}_token`]: token,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        addActivity(`Connected ${app} integration`, "🔗");
      } catch (err) {
        console.warn("Firestore integration sync failed:", err);
      }
    }

    setConfiguringApp(app);
    setIntegrationEndpoint(integrationEndpoints[app] || "");
    showToast(
      "✅",
      `${app} Connected`,
      `${app} is linked and ready to configure.`,
    );
  };

  const handleDisconnectApp = async (app: string) => {
    const nextConns = connectedApps.filter((c) => c !== app);
    setConnectedApps(nextConns);
    if (configuringApp === app) setConfiguringApp(null);
    try {
      localStorage.setItem("gamura_connected_integrations", JSON.stringify(nextConns));
    } catch {}

    if (isAuthUser) {
      try {
        await setDoc(
          doc(db, "user_connections", user.uid),
          {
            connections: nextConns,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        addActivity(`Disconnected ${app} integration`, "🔌");
      } catch (err) {
        console.warn("Disconnect sync failed:", err);
      }
    }

    showToast("🔌", `${app} Disconnected`, `${app} has been unlinked.`);
  };

  const handleSaveIntegrationEndpoint = async (app: string) => {
    const nextEndpoints = {
      ...integrationEndpoints,
      [app]: integrationEndpoint.trim(),
    };
    setIntegrationEndpoints(nextEndpoints);
    try {
      localStorage.setItem("gamura_integration_endpoints", JSON.stringify(nextEndpoints));
    } catch {}

    if (isAuthUser) {
      try {
        await setDoc(
          doc(db, "user_connections", user.uid),
          {
            [`${app.toLowerCase()}_endpoint`]: integrationEndpoint.trim(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {}
    }

    setConfiguringApp(null);
    showToast("✅", `${app} Saved`, `Configuration for ${app} updated.`);
  };

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
      <div className="fixed bottom-20 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const scheme = {
              success: {
                border: "border-emerald-200 bg-white/95",
                iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
              },
              error: {
                border: "border-red-200 bg-white/95",
                iconBg: "bg-red-50 text-red-600 border border-red-200/80",
              },
              warning: {
                border: "border-amber-200 bg-white/95",
                iconBg: "bg-amber-50 text-amber-700 border border-amber-200/80",
              },
              info: {
                border: "border-blue-200 bg-white/95",
                iconBg: "bg-blue-50 text-[#0071E3] border border-blue-200/80",
              },
            }[t.type || "info"];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 20, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94, x: 20 }}
                className={`min-w-[270px] max-w-[340px] ${scheme.border} border p-3.5 pointer-events-auto shadow-[0_8px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl rounded-2xl`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${scheme.iconBg}`}
                  >
                    {t.ic}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#1D1D1F] leading-snug">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5 leading-snug">
                      {t.content}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setToasts((prev) => prev.filter((tt) => tt.id !== t.id))
                    }
                    className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style>{`
        .universe-dashboard-root {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', system-ui, sans-serif;
          background: ${universePrefs.surfaceMode === "dark" ? "#0c0c0f" : universePrefs.surfaceMode === "frost" ? "#eef2f6" : "#f5f5f7"};
          color: #1d1d1f;
          min-height: 100vh;
          overflow-x: clip;
          --ud-accent: ${universePrefs.accentColor || "#0071E3"};
        }
        .universe-dashboard-root * { box-sizing: border-box; }

        .ud-main {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: transparent;
          padding-top: 56px;
          padding-bottom: 78px;
        }
        .ud-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 300;
          height: 56px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: saturate(180%) blur(22px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
        }
        .ud-content {
          flex: 1;
          padding: ${universePrefs.density === "compact" ? "12px 12px 20px" : "18px 14px 24px"};
          display: flex;
          flex-direction: column;
          gap: ${universePrefs.density === "compact" ? "10px" : "14px"};
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 768px) {
          .ud-topbar { padding: 0 24px; gap: 12px; }
          .ud-content { padding: ${universePrefs.density === "compact" ? "16px 20px 24px" : "22px 24px 28px"}; gap: ${universePrefs.density === "compact" ? "12px" : "16px"}; }
        }
      `}</style>

      {/* APPLE-STYLE COMPACT WHITE BOTTOM TAB DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-2xl border-t border-zinc-200/80 px-1.5 h-14 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {[
          { name: "Overview", label: "Home", icon: <Home size={16} />, count: 0 },
          { name: "Apps", label: "Apps", icon: <LayoutGrid size={16} />, count: universeAppsCount },
          { name: "Join Selvaranjan", label: "Join", icon: <Compass size={16} />, count: 0 },
          { name: "Daily Streak", label: "Streak", icon: <Flame size={16} />, count: 0 },
          { name: "Settings", label: "Settings", icon: <Settings size={16} />, count: 0 },
        ].map((item) => {
          const isSelected = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setMobileOpen(false);
              }}
              style={isSelected ? { color: universePrefs.accentColor } : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? "font-semibold"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <div className="relative">
                {item.icon}
                {universePrefs.showDockBadges && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            mobileOpen ? "text-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
          }`}
          aria-label="Open Universe Menu"
        >
          <Menu size={16} />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* APPLE-STYLE WHITE BOTTOM-UP ROUNDED MENU SHEET FOR UNIVERSE PAGE */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[499]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.03, bottom: 0.65 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 320) {
                  setMobileOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-[500] mx-auto w-full max-w-2xl h-[68vh] min-h-[380px] max-h-[640px] bg-white/95 backdrop-blur-2xl rounded-t-[2.25rem] border-t border-x border-zinc-200/80 shadow-[0_-24px_60px_rgba(0,0,0,0.14)] flex flex-col overflow-hidden text-zinc-900 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle & Compact Header */}
              <div className="pt-2.5 pb-2 px-5 flex flex-col items-center border-b border-zinc-100 shrink-0 bg-white/80 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-zinc-300 mb-2.5" />
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-zinc-100 border border-zinc-200/70 flex items-center justify-center p-1 shrink-0">
                      <img src={GAMURA_G_LOGO} className="w-full h-full object-contain mix-blend-multiply" alt="Gamura" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold tracking-tight text-zinc-900 leading-none truncate">
                        Universe Menu
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium mt-0.5 truncate">
                        Workspace &amp; Settings
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("Settings");
                        setMobileOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800 transition-colors cursor-pointer"
                      aria-label="Open Universe Settings"
                    >
                      <Settings size={13} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                      aria-label="Close Menu"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Grouped Apple White Cards */}
              <div
                onPointerDown={(e) => {
                  if (e.currentTarget.scrollTop > 2) {
                    e.stopPropagation();
                  }
                }}
                className="flex-1 overflow-y-auto touch-pan-y px-4 sm:px-5 py-3.5 space-y-4 bg-[#f5f5f7]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Join Selvaranjan");
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-white via-emerald-50/70 to-sky-50/70 border border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: universePrefs.accentColor }}
                      >
                        <Compass size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-950 tracking-tight truncate">
                          Join Selvaranjan on Gamura
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium truncate">
                          Open inside Universe Page
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-[#059669] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Settings");
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Settings size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-950 tracking-tight truncate">
                          Universe Settings
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium truncate">
                          Theme, privacy, access &amp; controls
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-zinc-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    {group.label && (
                      <div className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {group.label}
                      </div>
                    )}
                    <div className="bg-white rounded-2xl border border-zinc-200/70 divide-y divide-zinc-100 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      {group.items.map((item: any, iIdx) => {
                        const isActive = activeTab === item.name;
                        return (
                          <button
                            key={iIdx}
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else {
                                setActiveTab(item.name);
                              }
                              setMobileOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                              isActive
                                ? "bg-zinc-100/80 text-zinc-950 font-semibold"
                                : "hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive ? "text-white" : "bg-zinc-100 text-zinc-600"
                                }`}
                                style={isActive ? { backgroundColor: universePrefs.accentColor } : undefined}
                              >
                                {item.icon}
                              </div>
                              <span className="text-xs truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge && (
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/70 text-[9px] font-semibold text-zinc-600">
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight size={14} className="text-zinc-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Account Footer Strip inside Sheet */}
                <div className="bg-white rounded-2xl border border-zinc-200/70 p-3 flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        setProfileOpen(true);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                        {userInfo?.avatarUrl || user?.photoURL ? (
                          <img
                            src={userInfo?.avatarUrl || user?.photoURL}
                            className="w-full h-full object-cover"
                            alt="User"
                          />
                        ) : (
                          <User size={15} className="text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 truncate">{displayName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">{gamuraId}</div>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onConnect();
                      }}
                      className="flex-1 bg-zinc-900 text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Sign In to Universe
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onBack();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Home
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN WORKSPACE */}
      <main className="ud-main">
        <header className="ud-topbar">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-zinc-100/90 hover:bg-zinc-200/80 border border-zinc-200/70 transition-all cursor-pointer shrink-0"
            aria-label="Open Universe Menu"
          >
            <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-center p-0.5">
              <img src={GAMURA_G_LOGO} className="w-full h-full object-contain mix-blend-multiply" alt="Menu" />
            </div>
            <Menu size={14} className="text-zinc-700" />
            <span className="text-xs font-semibold text-zinc-900 tracking-tight hidden sm:inline">Menu</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 truncate">
              {activeTab}
            </h1>
          </div>

          <div className="flex-1 max-w-xs mx-2 hidden md:flex items-center">
            <div className="w-full relative flex items-center">
              <Search size={13} className="absolute left-3 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!searchOpen) setSearchOpen(true);
                }}
                placeholder={universePrefs.enableKeyboardShortcut ? "Search Universe... (⌘K)" : "Search Universe..."}
                className="w-full bg-zinc-100 border border-zinc-200/70 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-300 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-700"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {universePrefs.showJoinSelvaranjanPill && (
              <button
                type="button"
                onClick={() => setActiveTab("Join Selvaranjan")}
                style={
                  activeTab === "Join Selvaranjan"
                    ? { backgroundColor: universePrefs.accentColor, color: "#fff", borderColor: universePrefs.accentColor }
                    : undefined
                }
                className={`px-2.5 sm:px-3 h-8 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === "Join Selvaranjan"
                    ? "shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200/80 text-zinc-900"
                }`}
                title="Join Selvaranjan on Gamura"
              >
                <Compass size={12} className={activeTab === "Join Selvaranjan" ? "text-white" : "text-[#059669]"} />
                <span className="sm:hidden">Join Selvaranjan</span>
                <span className="hidden sm:inline">Join Selvaranjan on Gamura</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("Settings")}
              style={
                activeTab === "Settings"
                  ? { backgroundColor: universePrefs.accentColor, color: "#fff", borderColor: universePrefs.accentColor }
                  : undefined
              }
              className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "Settings"
                  ? "shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200/70 text-zinc-700"
              }`}
              aria-label="Universe Settings"
              title="Universe Settings"
            >
              <Settings size={14} />
              <span className="hidden lg:inline">Settings</span>
            </button>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                addActivity("Checked notifications", "🔔");
              }}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/70 flex items-center justify-center text-zinc-600 relative transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={14} />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/70 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer hidden sm:flex"
              aria-label="Refresh"
            >
              <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onBack}
              className="px-2.5 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Back to Home"
            >
              <Home size={13} />
              <span className="hidden sm:inline">Home</span>
            </button>
          </div>
        </header>

        <div
          className="ud-content"
          style={{
            maxWidth:
              activeTab === "Portfolio Builder"
                ? "1360px"
                : activeTab === "Gamura Universe" ||
                    activeTab === "Settings" ||
                    activeTab === "Join Selvaranjan"
                  ? "1080px"
                  : "960px",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={universePrefs.reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={universePrefs.reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
          {activeTab === "Apps" ? (
            <UniverseAppsView
              showToast={showToast}
              accentColor={universePrefs.accentColor}
            />
          ) : activeTab === "Join Selvaranjan" ? (
            <SelvaranjanGamura
              embeddedInUniverse
              onBack={() => setActiveTab("Overview")}
              showToast={showToast}
              accentColor={universePrefs.accentColor}
            />
          ) : activeTab === "Settings" ? (
            <UniverseSettingsView
              user={user}
              userInfo={userInfo}
              setCurrentUserInfo={setCurrentUserInfo}
              preferences={universePrefs}
              onUpdatePreferences={handleUpdatePreferences}
              onNavigateTab={(t) => setActiveTab(t)}
              onBack={() => setActiveTab("Overview")}
              showToast={showToast}
              isLoggedIn={isLoggedIn}
              onConnect={onConnect}
              gamuraAccounts={gamuraAccounts}
              setCurrentPage={setCurrentPage}
              setEmail={setEmail}
              setUsername={setUsername}
              setShowDeleteConfirm={setShowDeleteConfirm}
              setShowSignOutConfirm={setShowSignOutConfirm}
              connectedApps={connectedApps}
              onConnectApp={handleConnectApp}
              onDisconnectApp={handleDisconnectApp}
              onExportTelemetry={exportTelemetryData}
              addActivity={addActivity}
            />
          ) : activeTab === "Network Graph" ? (
            <NetworkGraphView
              currentUser={user}
              showToast={showToast}
              onBack={() => setActiveTab("Overview")}
            />
          ) : activeTab === "Daily Streak" ? (
            <div className="max-w-lg mx-auto w-full py-2">
              <DailyStreakWidget db={db} currentUser={user} showToast={showToast} />
            </div>
          ) : activeTab === "Audio Module" ? (
            <div className="max-w-lg mx-auto w-full py-2">
              <BackgroundAudioPlayer showToast={showToast} />
            </div>
          ) : activeTab === "Portfolio Builder" ? (
            <PortfolioBuilderView
              onBack={() => setActiveTab("Overview")}
              showToast={showToast}
            />
          ) : activeTab === "Neutral Link" ? (
            <NeuralLinkView
              onBack={() => setActiveTab("Overview")}
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
              onBack={() => setActiveTab("Overview")}
            />
          ) : activeTab === "Active Users" ? (
            <UsersView
              db={db}
              currentUser={user}
              showToast={showToast}
              presenceData={presenceData}
              addActivity={addActivity}
              initialFilter="active"
              onBack={() => setActiveTab("Overview")}
            />
          ) : activeTab === "Aura Settings" ? (
            <AuraSettingsView
              user={user}
              userInfo={userInfo}
              setCurrentUserInfo={setCurrentUserInfo}
              onBack={() => setActiveTab("Overview")}
              showToast={showToast}
            />
          ) : activeTab === "Galaxy Core" ? (
            <GalaxyCoreView />
          ) : activeTab === "Features" ? (
            <FeaturesView
              onBack={() => setActiveTab("Overview")}
              loaderImgSources={loaderImgSources}
              showToast={showToast}
            />
          ) : activeTab === "Gamura Universe" ? (
            <div className="p-2 md:p-4 pb-16">
              <GamuraUniverseProfileManager
                user={user}
                onNavigateLogin={onConnect}
                showToast={showToast}
              />
            </div>
          ) : activeTab === "Gamura Link" ? (
            <div className="p-2 md:p-4 pb-16">
              <GamuraShortLinksManager user={user} />
            </div>
          ) : activeTab === "Integrations" ? (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <h2 className="text-base font-bold text-zinc-900">Connected Services</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connect hosting providers or webhook alerts to your Gamura Universe workspace.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: "Vercel",
                    name: "Vercel",
                    desc: "Manage deployments and edge functions directly.",
                    placeholder: "https://vercel.com/your-team/gamura",
                    ic: <ArrowUpRight size={18} />,
                    color: "bg-zinc-900 text-white",
                  },
                  {
                    id: "Netlify",
                    name: "Netlify",
                    desc: "Global hosting and serverless form handling.",
                    placeholder: "https://app.netlify.com/sites/your-site",
                    ic: <Globe size={18} />,
                    color: "bg-sky-50 text-sky-600",
                  },
                  {
                    id: "Slack",
                    name: "Slack",
                    desc: "Push system alerts and updates to your workspace.",
                    placeholder: "https://hooks.slack.com/services/...",
                    ic: <MessageSquare size={18} />,
                    color: "bg-rose-50 text-rose-600",
                  },
                  {
                    id: "Discord",
                    name: "Discord",
                    desc: "Community webhooks and real-time alerts.",
                    placeholder: "https://discord.com/api/webhooks/...",
                    ic: <MessageCircle size={18} />,
                    color: "bg-indigo-50 text-indigo-600",
                  },
                ].map((app) => {
                  const isConnected = connectedApps.includes(app.id);
                  const isEditing = configuringApp === app.id;
                  const savedUrl = integrationEndpoints[app.id];
                  return (
                    <div
                      key={app.id}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl ${app.color} flex items-center justify-center border border-zinc-200/50 shrink-0`}>
                          {app.ic}
                        </div>
                        {isConnected ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              Connected
                            </span>
                            <button
                              onClick={() => {
                                setConfiguringApp(isEditing ? null : app.id);
                                setIntegrationEndpoint(savedUrl || "");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold cursor-pointer"
                            >
                              {isEditing ? "Close" : "Configure"}
                            </button>
                            <button
                              onClick={() => handleDisconnectApp(app.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold cursor-pointer"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnectApp(app.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">{app.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{app.desc}</p>
                        {savedUrl && !isEditing && (
                          <p className="text-[11px] font-mono text-[#0071E3] mt-1.5 truncate">
                            {savedUrl}
                          </p>
                        )}
                      </div>
                      {isEditing && (
                        <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                          <input
                            type="url"
                            value={integrationEndpoint}
                            onChange={(e) => setIntegrationEndpoint(e.target.value)}
                            placeholder={app.placeholder}
                            className="flex-1 bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 outline-none focus:bg-white focus:border-[#0071E3]"
                          />
                          <button
                            onClick={() => handleSaveIntegrationEndpoint(app.id)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold cursor-pointer shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* COMPACT APPLE WELCOME CARD */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
                    Welcome back, {displayName}
                  </h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Gamura Universe · {greeting} Workspace
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Join Selvaranjan")}
                    style={{ backgroundColor: universePrefs.accentColor }}
                    className="px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                  >
                    <Compass size={12} />
                    <span>Join Selvaranjan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFirestoreBackup}
                    disabled={isExportingBackup}
                    title="Export chats, activities, and projects from Firestore as JSON"
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    {isExportingBackup ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    <span>{isExportingBackup ? "Exporting..." : "Backup JSON"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Settings")}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Settings size={12} />
                    <span>Settings</span>
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                    <span className="text-[10px] font-medium text-zinc-500">ID</span>
                    <span className="text-xs font-mono font-semibold text-zinc-900 tracking-wide">
                      {gamuraId}
                    </span>
                  </div>
                </div>
              </div>

              {/* COMPACT APPLE QUICK BROADCAST BAR */}
              {universePrefs.showQuickBroadcastBar && (
              <form
                onSubmit={handleQuickAdd}
                className="bg-white border border-zinc-200/80 rounded-2xl p-1.5 flex items-center gap-2 shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                  <Plus size={15} />
                </div>
                <input
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder="Share a quick signal or note..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-900 placeholder:text-zinc-400 px-1"
                />
                <button
                  type="submit"
                  disabled={!quickAddText.trim()}
                  className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-[11px] font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Send
                </button>
              </form>
              )}

              {/* COMPACT STREAK & AUDIO WIDGETS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <DailyStreakWidget db={db} currentUser={user} showToast={showToast} />
                <BackgroundAudioPlayer showToast={showToast} />
              </div>

              {/* COMPACT SHARED PROJECTS SECTION */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <LayoutGrid size={14} className="text-zinc-600" />
                      Shared Universe Projects
                    </h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Creations shared by the community
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        showToast("🔒", "Sign In Required", "Connect your account to share projects.");
                        return;
                      }
                      setProjectTitle("");
                      setProjectLink("");
                      setProjectImage("");
                      setShowProjectModal(true);
                    }}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sharedProjects.length > 0 ? (
                    sharedProjects.map((project, i) => (
                      <div
                        key={project.id || i}
                        className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:bg-white transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-center text-zinc-700 shrink-0">
                              <Code size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-900 truncate">
                                {project.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate">
                                by {project.userName}
                              </div>
                            </div>
                          </div>
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-zinc-200/70 text-zinc-600 hover:text-zinc-900 transition-colors shrink-0"
                            title="Open Project"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-zinc-200/60 text-[10px] font-medium text-zinc-500">
                          <button
                            onClick={() => handleLikeProject(project)}
                            className={`flex items-center gap-1 ${project.likes?.includes(user?.uid) ? "text-rose-500" : "hover:text-zinc-800"} cursor-pointer`}
                          >
                            <Heart size={11} className={project.likes?.includes(user?.uid) ? "fill-rose-500" : ""} />
                            {project.likes?.length || 0}
                          </button>
                          <button
                            onClick={() => handleCommentProject(project)}
                            className="flex items-center gap-1 hover:text-zinc-800 cursor-pointer"
                          >
                            <MessageCircle size={11} />
                            {project.comments?.length || 0}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(project.link);
                              showToast("📋", "Link Copied", "Project URL copied.");
                            }}
                            className="ml-auto flex items-center gap-1 hover:text-zinc-800 cursor-pointer"
                          >
                            <Share2 size={11} />
                            Share
                          </button>
                        </div>
                        {commentProjectId === project.id && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  submitProjectComment(project);
                                }
                              }}
                              placeholder="Write a comment..."
                              className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-[11px] text-zinc-900 outline-none focus:border-[#0071E3]"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => submitProjectComment(project)}
                              disabled={!commentDraft.trim()}
                              className="px-2.5 py-1 rounded-lg bg-[#0071E3] text-white text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                      <LayoutGrid size={18} className="text-zinc-400 mb-1.5" />
                      <p className="text-zinc-600 text-[11px] font-medium">No shared projects yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[500] flex items-start justify-center pt-[14vh] px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 p-3.5 border-b border-zinc-100">
                <Search size={16} className="text-zinc-400" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-900 placeholder:text-zinc-400"
                  placeholder="Jump to any Universe tool, Settings, or Builder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200/70 rounded text-[9px] font-semibold text-zinc-500">
                  ESC
                </div>
              </div>
              <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto">
                {[
                  { ic: "🏠", title: "Overview", sub: "Main workspace & shared projects" },
                  { ic: "🚀", title: "Join Selvaranjan", sub: "Developer network, Free URL studio & HTML sandbox" },
                  { ic: "⚙️", title: "Settings", sub: "Allow Access (camera, messages, video, mic, storage, notifications), theme & privacy" },
                  { ic: "📱", title: "Apps", sub: "Installed Gamura Launch Store workspace apps" },
                  { ic: "🌐", title: "Gamura Universe", sub: "Claim your /@username personal hub" },
                  { ic: "💼", title: "Portfolio Builder", sub: "Design & publish your web portfolio" },
                  { ic: "🔗", title: "Gamura Link", sub: "Short /go/ redirects & analytics" },
                  { ic: "👥", title: "Users", sub: "Directory of live Universe members" },
                  { ic: "📡", title: "Active Users", sub: "Currently online members" },
                  { ic: "🕸️", title: "Network Graph", sub: "Interactive node connection topology" },
                  { ic: "🔥", title: "Daily Streak", sub: "Weekly check-in & points" },
                  { ic: "🎵", title: "Audio Module", sub: "Focus ambient soundscapes" },
                  { ic: "💬", title: "Neutral Link", sub: "Ephemeral 24h channels & groups" },
                  { ic: "🔌", title: "Integrations", sub: "Vercel, Netlify, Slack & Discord hooks" },
                  { ic: "🌌", title: "Galaxy Core", sub: "Live Firestore & server telemetry" },
                  { ic: "✨", title: "Aura Settings", sub: "8-subsystem Aura Engine panel" },
                ]
                  .filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.sub.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setActiveTab(item.title);
                        setSearchOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-sm">
                        {item.ic}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[399]"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[320px] bg-white border-l border-zinc-200/80 z-[400] flex flex-col text-zinc-900 shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-tight text-zinc-900">
                  Notifications
                </span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f5f5f7]">
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
                      className={`p-3 rounded-xl transition-all cursor-pointer border ${n.unread ? "bg-sky-50/70 border-sky-200/70" : "bg-white border-zinc-200/70 hover:bg-zinc-50"}`}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm shrink-0">
                          {n.ic}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs leading-snug text-zinc-800">
                            {n.msg}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {n.time}
                          </p>
                        </div>
                        {n.unread && (
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 px-6">
                    <Bell size={28} className="mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-zinc-600">
                      No notifications
                    </p>
                    <p className="text-[10px] mt-1 text-zinc-500">
                      Updates appear here when triggered.
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
              className="fixed top-[64px] right-4 sm:right-6 w-80 bg-white/95 backdrop-blur-2xl border border-zinc-200/80 rounded-3xl shadow-2xl z-[400] overflow-hidden flex flex-col font-sans text-[#1D1D1F]"
            >
              {/* User Identity Banner */}
              <div className="p-6 text-center border-b border-zinc-100 bg-[#F5F5F7]/70">
                <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] mx-auto mb-3 flex items-center justify-center font-bold text-white shadow-sm relative border border-zinc-200 overflow-hidden">
                  {userInfo?.avatarUrl ? (
                    <img
                      src={userInfo.avatarUrl}
                      className="w-full h-full object-cover"
                      alt="User"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="w-full h-full object-cover"
                      alt="User"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                      {displayName.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-[15px] font-bold tracking-tight text-[#1D1D1F]">
                  {displayName}
                </div>
                <div className="text-[11px] font-semibold text-[#0071E3] mt-1 flex items-center justify-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {gamuraId}
                </div>
              </div>

              {/* Accounts Switcher Block */}
              {gamuraAccounts.filter((acc) => acc.uid !== user?.uid).length >
                0 && (
                <div className="p-4 border-b border-zinc-100 bg-[#F5F5F7]/40">
                  <div className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-2 px-2">
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
                              "Switching ID",
                              `Preparing session for @${acc.username}...`,
                            );
                            setCurrentUserInfo(null);
                            await firebaseSignOut(auth);
                            setEmail(acc.email || "");
                            setUsername(acc.username || "");
                            setCurrentPage("login");
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 cursor-pointer group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-200/70 flex items-center justify-center overflow-hidden">
                              {acc.avatarUrl ? (
                                <img
                                  src={acc.avatarUrl}
                                  className="w-full h-full object-cover"
                                  alt="Saved user"
                                />
                              ) : (
                                <span className="text-xs font-bold text-[#1D1D1F]">
                                  {acc.nickname?.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-[#1D1D1F] truncate max-w-[120px]">
                                @{acc.username}
                              </div>
                              <div className="text-[10px] text-[#6E6E73] truncate max-w-[120px]">
                                {acc.nickname}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#0071E3] bg-blue-50 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                            Switch
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Rows */}
              <div className="p-2.5 space-y-0.5">
                {[
                  {
                    label: "Edit Profile",
                    icon: <Settings size={14} />,
                    action: () => setEditProfileOpen(true),
                  },
                  {
                    label: isExportingBackup
                      ? "Exporting Firestore Backup..."
                      : "Export Firestore Backup (JSON)",
                    icon: isExportingBackup ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    ),
                    action: () => {
                      void handleExportFirestoreBackup();
                    },
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
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                      item.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                    }`}
                    onClick={() => {
                      if (item.action) item.action();
                      setProfileOpen(false);
                    }}
                  >
                    <div>{item.icon}</div>
                    <span className="text-xs font-semibold tracking-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL (APPLE STYLE) */}
      <AnimatePresence>
        {editProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={() => setEditProfileOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden text-[#1D1D1F]"
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-[#F5F5F7]/70">
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F] leading-tight">
                    Edit Profile
                  </h2>
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">
                    Update your Gamura Universe identity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-zinc-200/70 text-[#6E6E73] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-20 h-20 rounded-full bg-[#F5F5F7] border border-zinc-200 overflow-hidden relative group shadow-xs">
                    {newAvatar ? (
                      <img
                        src={newAvatar}
                        className="w-full h-full object-cover"
                        alt="Avatar Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <ImageIcon size={18} className="text-white" />
                      <input
                        type="file"
                        onChange={handleAvatarFile}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] font-medium text-[#0071E3]">
                    Tap avatar to upload photo
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        Username Handle
                      </label>
                      {isUsernameLocked && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Locked
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
                      className={`w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm transition-all ${isUsernameLocked ? "text-[#6E6E73] cursor-not-allowed" : "text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3]"}`}
                      placeholder="Universe ID handle"
                    />
                    <p className="text-[11px] text-[#6E6E73]">
                      {isUsernameLocked
                        ? `Updated once per year. Next edit: ${nextAllowedDateStr}`
                        : "Unique Gamura handle (editable once per year)."}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      placeholder="Display nickname"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      Bio
                    </label>
                    <input
                      type="text"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      placeholder="Write a short bio..."
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: universePrefs.accentColor }}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD PROJECT MODAL (APPLE STYLE) */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={() => setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden text-[#1D1D1F]"
            >
              <div className="px-6 py-4 border-b border-zinc-100 bg-[#F5F5F7]/70 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F] leading-tight">
                    Share Project
                  </h2>
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">
                    Publish your build to Gamura Universe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="w-8 h-8 rounded-full bg-white border border-zinc-200/70 text-[#6E6E73] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="p-6 space-y-4">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      Project Title
                    </label>
                    <input
                      type="text"
                      required
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      placeholder="e.g. Galaxy Core Integration"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      Project URL
                    </label>
                    <input
                      type="url"
                      required
                      value={projectLink}
                      onChange={(e) => setProjectLink(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      placeholder="https://your-project.vercel.app"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: universePrefs.accentColor }}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Share Live
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
  type PageType =
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
    | "join-selvaranjan"
    | "claim"
    | "gpdf"
    | "launch"
    | "veo"
    | "clip"
    | "calculator"
    | "camera"
  | "messenger"
  | "gfiles"
  | "links"
  | "resume"
  | "pb1"
  | "pb2"
  | "ppt-cred"
  | "cover-gened"
  | "glifeline"
  | "gshield"
  | "gfresh"
  | "gcard"
  | "gwallet"
  | "gamura-for-business"
  | "privacy"
  | "terms"
  | "license"
  | "delete-account";

  const reservedRouteSet = new Set([
    "",
    "home",
    "gpg",
    "gpdf",
    "g-pdf",
    "launch",
    "store",
    "veo",
    "gamura-veo",
    "clip",
    "gamura-clip",
    "calculator",
    "calc",
    "gamura-calculator",
    "gamura-calc",
    "camera",
    "gamura-camera",
    "messenger",
    "gamura-messenger",
    "gfiles",
    "gms",
    "links",
    "gamura-links",
    "resume",
    "gamura-resume",
    "resume-maker",
    "pb1",
    "portfolio-builder",
    "gamura-pb1",
    "gamura-portfolio",
    "pb2",
    "portfolio-builder-2",
    "gamura-pb2",
    "ppt-cred",
    "pptcred",
    "ppt",
    "gamura-ppt",
    "gamura-ppt-cred",
    "cover-gened",
    "covergened",
    "cover",
    "gamura-cover",
    "glifeline",
    "lifeline",
    "gamura-lifeline",
    "g-lifeline",
    "gshield",
    "shield",
    "gamura-shield",
    "g-shield",
    "gfresh",
    "fresh",
    "gamura-fresh",
    "g-fresh",
    "gcard",
    "g-card",
    "card",
    "gamura-card",
    "gwallet",
    "g-wallet",
    "wallet",
    "gamura-wallet",
    "gamura-for-business",
    "gb",
    "gamura-business",
    "business",
    "cgpic",
    "cg-pic",
    "claim",
    "universe",
    "universe-active",
    "community",
    "features",
    "pricing",
    "about",
    "contact",
    "terms",
    "privacy",
    "license",
    "eula",
    "delete-account",
    "account-deletion",
    "docs",
    "feed",
    "chat",
    "direct",
    "profile",
    "settings",
    "developer",
    "white-page",
    "join-selvaranjan",
    "showcase",
    "apps",
    "u",
    "api",
    "skills",
    "login",
    "signup",
    "history",
    "aura",
    "gg",
    "index.html",
    "selvaranjan_gamura.html",
  ]);

  const resolveRouteFromLocation = (): {
    page: PageType;
    claimed: string | null;
    shortSlug: string | null;
    prefillHandle: string;
  } => {
    if (typeof window === "undefined") {
      return { page: "home", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    const params = new URLSearchParams(window.location.search);
    const u =
      params.get("u") ||
      params.get("username") ||
      params.get("gamura_hub") ||
      params.get("ref");
    const handleParam = params.get("handle") || params.get("u") || "";

    const cleanedPath = window.location.pathname.replace(/^\/+|\/+$/g, "").trim();
    const lower = cleanedPath.toLowerCase();

    if (lower === "gpg") return { page: "gpg", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "gpdf" || lower === "g-pdf") return { page: "gpdf", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "launch" || lower === "store") return { page: "launch", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "veo" || lower === "gamura-veo") return { page: "veo", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "clip" || lower === "gamura-clip") return { page: "clip", claimed: null, shortSlug: null, prefillHandle: "" };
    if (
      lower === "calculator" ||
      lower === "calc" ||
      lower === "gamura-calculator" ||
      lower === "gamura-calc"
    ) {
      return { page: "calculator", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "camera" ||
      lower === "gamura-camera" ||
      lower === "cgpic" ||
      lower === "cg-pic"
    ) {
      return { page: "camera", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "messenger" || lower === "gamura-messenger") {
      return { page: "messenger", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "gfiles" || lower === "gms") {
      return { page: "gfiles", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "links" || lower === "gamura-links") {
      return { page: "links", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower.startsWith("x/")) {
      const xSlug = cleanedPath.substring(2).trim();
      if (xSlug) {
        return { page: "links", claimed: null, shortSlug: xSlug, prefillHandle: "" };
      }
    }
    if (lower === "resume" || lower === "gamura-resume" || lower === "resume-maker") {
      return { page: "resume", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "pb1" ||
      lower === "portfolio-builder" ||
      lower === "gamura-pb1" ||
      lower === "gamura-portfolio"
    ) {
      return { page: "pb1", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "pb2" ||
      lower === "portfolio-builder-2" ||
      lower === "gamura-pb2"
    ) {
      return { page: "pb2", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "ppt-cred" ||
      lower === "pptcred" ||
      lower === "ppt" ||
      lower === "gamura-ppt" ||
      lower === "gamura-ppt-cred"
    ) {
      return { page: "ppt-cred", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "cover-gened" ||
      lower === "covergened" ||
      lower === "cover" ||
      lower === "gamura-cover"
    ) {
      return { page: "cover-gened", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "glifeline" ||
      lower === "lifeline" ||
      lower === "gamura-lifeline" ||
      lower === "g-lifeline"
    ) {
      return { page: "glifeline", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "gshield" ||
      lower === "shield" ||
      lower === "gamura-shield" ||
      lower === "g-shield"
    ) {
      return { page: "gshield", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "gfresh" ||
      lower === "fresh" ||
      lower === "gamura-fresh" ||
      lower === "g-fresh"
    ) {
      return { page: "gfresh", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "gcard" ||
      lower === "g-card" ||
      lower === "card" ||
      lower === "gamura-card"
    ) {
      return { page: "gcard", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "gwallet" ||
      lower === "g-wallet" ||
      lower === "wallet" ||
      lower === "gamura-wallet"
    ) {
      return { page: "gwallet", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (
      lower === "gamura-for-business" ||
      lower === "gb" ||
      lower === "gamura-business" ||
      lower === "business"
    ) {
      return { page: "gamura-for-business", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "claim") return { page: "claim", claimed: null, shortSlug: null, prefillHandle: handleParam };
    if (lower === "privacy") return { page: "privacy", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "terms") return { page: "terms", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "license" || lower === "eula") return { page: "license", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "delete-account" || lower === "account-deletion") {
      return { page: "delete-account", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "aura") return { page: "aura", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "universe" || lower === "universe-active") {
      return { page: "universe-active", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower === "login") return { page: "login", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "history") return { page: "history", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "about") return { page: "about", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "gg") return { page: "gg", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "white-page") return { page: "white-page", claimed: null, shortSlug: null, prefillHandle: "" };
    if (lower === "join-selvaranjan") return { page: "join-selvaranjan", claimed: null, shortSlug: null, prefillHandle: "" };
    if (u && (lower === "" || lower === "home")) {
      return { page: "white-page", claimed: null, shortSlug: null, prefillHandle: "" };
    }
    if (lower.startsWith("@")) {
      const slug = cleanedPath.substring(1).trim();
      if (slug && !slug.includes("/")) {
        return { page: "home", claimed: slug, shortSlug: null, prefillHandle: "" };
      }
    }
    if (lower.startsWith("u/")) {
      const slug = cleanedPath.substring(2).trim();
      if (slug && !slug.includes("/")) {
        return { page: "home", claimed: slug, shortSlug: null, prefillHandle: "" };
      }
    }
    if (lower.startsWith("go/")) {
      const slug = cleanedPath.substring(3).trim();
      if (slug) {
        return { page: "home", claimed: null, shortSlug: slug, prefillHandle: "" };
      }
    }
    if (
      cleanedPath &&
      !cleanedPath.includes("/") &&
      /^[a-zA-Z0-9_-]{2,30}$/.test(cleanedPath) &&
      !reservedRouteSet.has(lower)
    ) {
      return { page: "home", claimed: cleanedPath, shortSlug: null, prefillHandle: "" };
    }

    return { page: "home", claimed: null, shortSlug: null, prefillHandle: "" };
  };

  const initialRoute = useMemo(() => resolveRouteFromLocation(), []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>(initialRoute.page);
  const [claimedProfileUser, setClaimedProfileUser] = useState<string | null>(
    initialRoute.claimed,
  );
  const [shortLinkTarget, setShortLinkTarget] = useState<string | null>(
    initialRoute.shortSlug,
  );
  const [claimPrefillHandle, setClaimPrefillHandle] = useState<string>(
    initialRoute.prefillHandle,
  );
  const [isDark, setIsDark] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(false);
  const [showUniverseLoader, setShowUniverseLoader] = useState(false);
  const [selectedAuraModule, setSelectedAuraModule] = useState<string | null>(
    null,
  );
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  // Sync dark class on html root element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const [toasts, setToasts] = useState<any[]>([]);

  const showToast = useCallback(
    (
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
    },
    [],
  );

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
  const [isExportingAppBackup, setIsExportingAppBackup] = useState(false);

  const handleExportAppFirestoreBackup = async () => {
    if (!currentUser || !auth.currentUser || currentUser.uid === "guest_explorer_uid") {
      showToast(
        "🔒",
        "Sign In Required",
        "Sign in with your Gamura ID to export your Firestore backup.",
        "warning",
      );
      return;
    }
    setIsExportingAppBackup(true);
    try {
      const result = await exportUserFirestoreBackup({
        username: currentUserInfo?.username || null,
        displayName:
          currentUserInfo?.nickname || currentUser?.displayName || null,
        email: currentUser?.email || null,
      });
      showToast(
        "💾",
        "Firestore Backup Downloaded",
        `Exported ${result.summary.totalChats} chats, ${result.summary.activities} activities & ${result.summary.projects} projects.`,
        "success",
      );
    } catch (err: any) {
      showToast(
        "❌",
        "Backup Export Failed",
        err?.message || "Could not export Firestore data backup.",
        "error",
      );
    } finally {
      setIsExportingAppBackup(false);
    }
  };

  const addActivity = async (title: string, ic: string = "⚡") => {
    if (!currentUser || !auth.currentUser || currentUser.uid === "guest_explorer_uid") return; // Guard against unauthenticated writes
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
    provider.setCustomParameters({ prompt: "select_account" });
    setIsAuthLoading(true);
    setAuthError(null);
    setCreatedGamuraIdInfo(null);
    try {
      await signInWithPopup(auth, provider);
      setIsAuthLoading(false);
      setCurrentPage("universe-active");
    } catch (error: any) {
      setIsAuthLoading(false);
      if (
        error.code === "auth/popup-blocked" &&
        typeof window !== "undefined" &&
        window.self === window.top
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch {
          // fall through to message
        }
      }

      const isPopupError =
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request" ||
        error.message?.toLowerCase().includes("popup") ||
        error.message?.toLowerCase().includes("iframe") ||
        error.message?.toLowerCase().includes("cross-origin");

      if (error.code === "auth/operation-not-allowed") {
        setAuthError(
          <div className="space-y-1 text-red-700 text-left">
            <p className="font-semibold text-xs">Google Sign-In is Not Enabled</p>
            <p className="text-xs leading-relaxed opacity-90">
              Enable Google as a Sign-In provider in Firebase Authentication settings first.
            </p>
          </div>,
        );
      } else if (error.code === "auth/unauthorized-domain") {
        setAuthError(
          <div className="space-y-1 text-red-700 text-left">
            <p className="font-semibold text-xs">Domain Not Authorized</p>
            <p className="text-xs leading-relaxed opacity-90">
              Add <strong>{window.location.hostname}</strong> to Firebase Authentication &gt; Authorized domains.
            </p>
          </div>,
        );
      } else if (isPopupError) {
        setAuthError(
          <div className="space-y-2 text-[#1D1D1F] text-left">
            <p className="font-semibold text-amber-700 text-xs">
              Popup Blocked or Cancelled
            </p>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Your browser closed or restricted the Google popup. Try again, open in a standard tab, or use Google Redirect.
            </p>
            {typeof window !== "undefined" && window.self === window.top && (
              <button
                type="button"
                onClick={() => signInWithRedirect(auth, provider).catch(() => null)}
                className="w-full py-2 px-3 rounded-xl bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED] transition-colors cursor-pointer"
              >
                Continue via Google Redirect
              </button>
            )}
          </div>,
        );
      } else {
        setAuthError("Google authentication failed: " + (error.message || "Please try again."));
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    setCreatedGamuraIdInfo(null);
    try {
      const provider = new OAuthProvider("apple.com");
      await signInWithPopup(auth, provider);
      setIsAuthLoading(false);
      setCurrentPage("universe-active");
    } catch (error: any) {
      setIsAuthLoading(false);
      if (error.code === "auth/operation-not-allowed") {
        setAuthError(
          <div className="space-y-1 text-xs text-left text-amber-800">
            <p className="font-semibold">Apple Sign-In Not Enabled</p>
            <p className="opacity-85">Enable Apple in Firebase Authentication &gt; Sign-in method, or sign in with Google or Gamura ID.</p>
          </div>,
        );
      } else if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-blocked"
      ) {
        setAuthError("Apple sign-in popup was cancelled or blocked by the browser.");
      } else {
        setAuthError("Apple sign-in error: " + (error.message || "Authentication failed"));
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onPopState = () => {
        const resolved = resolveRouteFromLocation();
        setClaimedProfileUser(resolved.claimed);
        setShortLinkTarget(resolved.shortSlug);
        setClaimPrefillHandle(resolved.prefillHandle);
        setCurrentPage(resolved.page);
      };
      window.addEventListener("popstate", onPopState);
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          setCreatedGamuraIdInfo(null);
          setAuthError(null);
          setCurrentPage((prev) => (prev === "login" || prev === "signup" ? "universe-active" : prev));
        }
      })
      .catch(() => null);

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
        if (rtdb) {
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
          } catch (e) {
            console.warn("RTDB Presence ignored:", e);
          }
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
            setIsAuthInitializing(false);
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
        setIsAuthInitializing(false);
      } else {
        setCurrentUserInfo(null);
        setChats([]);
        setCurrentChatId(null);
        setPassword("");
        setNickname("");
        setAuthError(null);
        // Only redirect to home if they are on an auth-required page
        setCurrentPage((prev) => {
          if (["blank", "history"].includes(prev)) {
            return "home";
          }
          return prev;
        });
        setIsAuthInitializing(false);
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
    if (!currentUser || !auth.currentUser || currentUser.uid === "guest_explorer_uid") return;

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
    if (!currentUser || !auth.currentUser || currentUser.uid === "guest_explorer_uid") return;
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
  const [serverAiAvailable, setServerAiAvailable] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.available === "boolean") {
          setServerAiAvailable(data.available);
        }
      })
      .catch(() => {});
  }, []);

  const isAiConfigured = serverAiAvailable !== false;
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
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) setCurrentChatId(null);
    if (!currentUser || !auth.currentUser || currentUser.uid === "guest_explorer_uid") return;

    setIsDeletingChat(chatId);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/chats`, chatId));
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
    window.history.pushState({}, "", "/gpg");
    setCurrentPage("gpg");
    setIsMenuOpen(false);

    if (currentUser && auth.currentUser && currentUser.uid !== "guest_explorer_uid") {
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

  const getRecentGpgTimestamps = useCallback(() => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    let localTs: number[] = [];
    try {
      const raw = localStorage.getItem("gamura_gpg_timestamps");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localTs = parsed.filter((t) => typeof t === "number" && now - t < twentyFourHours);
        }
      }
    } catch {
      // ignore storage errors
    }
    const userTs = (currentUserInfo?.gpgTimestamps || []).filter(
      (t: number) => typeof t === "number" && now - t < twentyFourHours,
    );
    return Array.from(new Set([...localTs, ...userTs])).sort((a, b) => a - b);
  }, [currentUserInfo?.gpgTimestamps]);

  const extractPuterText = (resp: any): string => {
    if (!resp) return "";
    if (typeof resp === "string") return resp.trim();
    const content =
      resp?.message?.content ??
      resp?.choices?.[0]?.message?.content ??
      resp?.text;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
        .join("")
        .trim();
    }
    return "";
  };

  const handleGpgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpgInput.trim() || isGpgLoading) return;

    const recentTimestamps = getRecentGpgTimestamps();
    if (recentTimestamps.length >= 3) {
      setLimitError("Daily 3-chat limit reached (3/3 used). Please try again in 24 hours.");
      setTimeout(() => setLimitError(null), 4500);
      return;
    }

    let activeChatId = currentChatId;
    let oldChatMessages: Message[] = [];
    let chatTitle = gpgInput.slice(0, 30) + (gpgInput.length > 30 ? "..." : "");
    let baseTimestamp = Date.now();

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

    if (currentUser && auth.currentUser && currentUser.uid !== "guest_explorer_uid") {
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
      let generatedPromptText = "";

      // 1. Puter.js Best ChatGPT-Class Model Cascade
      if (typeof window !== "undefined" && (window as any).puter?.ai?.chat) {
        const targetContext = selectedTool
          ? `Focus specifically for target tool: ${selectedTool.toUpperCase()}.`
          : "Create a ready-to-use, high-precision prompt.";
        const systemInstruction = `You are GPG (Gamura Prompt Generator). Your ONLY purpose is to craft a clean, copy-ready, high-precision prompt tailored directly to what the user needs.
Output ONLY the generated prompt text itself — no greetings, no commentary, no explanations, no refusals, and no markdown code fences.
${targetContext}`;

        const puterMessages = [
          { role: "system", content: systemInstruction },
          ...newMessages.map((m) => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.content,
          })),
        ];

        const preferredModels = ["gpt-4o", "gpt-4.1", "o3-mini"];
        for (const modelName of preferredModels) {
          try {
            const resp = await (window as any).puter.ai.chat(puterMessages, {
              model: modelName,
            });
            const extracted = extractPuterText(resp);
            if (extracted) {
              generatedPromptText = extracted;
              break;
            }
          } catch (modelErr) {
            console.warn(`Puter model ${modelName} unavailable, trying next:`, modelErr);
          }
        }

        if (!generatedPromptText) {
          try {
            const singlePrompt = `${systemInstruction}\n\nUser Need: "${userMessage.content.trim()}"`;
            const resp = await (window as any).puter.ai.chat(singlePrompt);
            const extracted = extractPuterText(resp);
            if (extracted) {
              generatedPromptText = extracted;
            }
          } catch (fallbackErr) {
            console.warn("Puter default fallback failed, using /api/gpg:", fallbackErr);
          }
        }
      }

      // 2. Server-side API (/api/gpg) fallback
      if (!generatedPromptText) {
        try {
          const res = await fetch("/api/gpg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: newMessages,
              selectedTool,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.text === "string") {
              generatedPromptText = data.text;
            } else {
              generatedPromptText = "I couldn't generate a prompt right now. Please try again.";
            }
          } else {
            const errData = await res.json().catch(() => null);
            const errMsg = errData?.error || "Failed to generate prompt from AI server.";
            throw new Error(errMsg);
          }
        } catch (err: any) {
          console.error("GPG request error:", err);
          throw new Error(err.message || "Failed to generate prompt. Please try again.");
        }
      }

      const modelMessage: Message = {
        role: "model",
        content:
          generatedPromptText ||
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

      if (!modelMessage.content.startsWith("Error:")) {
        const now = Date.now();
        const updatedTimestamps = [...recentTimestamps, now];
        try {
          localStorage.setItem(
            "gamura_gpg_timestamps",
            JSON.stringify(updatedTimestamps),
          );
        } catch {
          // ignore storage write failures
        }
        if (currentUserInfo) {
          setCurrentUserInfo({
            ...currentUserInfo,
            gpgTimestamps: updatedTimestamps,
          });
        }
        if (
          currentUser &&
          auth.currentUser &&
          currentUser.uid !== "guest_explorer_uid"
        ) {
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
      }

      if (currentUser && auth.currentUser && currentUser.uid !== "guest_explorer_uid") {
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
      const rawMsg =
        error?.message ||
        (typeof error === "string" ? error : JSON.stringify(error));
      let errorText = rawMsg;

      try {
        if (
          rawMsg.includes("PERMISSION_DENIED") ||
          rawMsg.includes("403") ||
          rawMsg.includes("does not have permission")
        ) {
          errorText =
            "Permission denied for the Generative Language API. Please verify that your GEMINI_API_KEY in the Secrets panel has permissions enabled.";
        } else if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE")) {
          errorText =
            "Gamura AI is currently experiencing high demand. Please wait a moment and try again.";
        } else if (rawMsg.includes("missing") || rawMsg.includes("not configured")) {
          errorText =
            "GEMINI_API_KEY is not configured. Please add your key in the Secrets panel.";
        }
      } catch (e) {
        errorText = "Could not connect to the AI service. Please try again.";
      }

      const errorMessage: Message = {
        role: "model",
        content: `Error: ${errorText}`,
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

      if (currentUser && auth.currentUser && currentUser.uid !== "guest_explorer_uid" && activeChatId) {
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

  const activePageView = (() => {
  if (createdGamuraIdInfo) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] relative flex flex-col items-center justify-center p-5 select-none"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white border border-black/[0.06] p-7 sm:p-8 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-center space-y-6"
        >
          {/* Apple ID Emblem + Emerald Verification Check */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-full h-full bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl flex items-center justify-center p-3 shadow-xs">
              <SafeImage
                srcs={logoSources}
                alt="Gamura"
                className="w-full h-full object-contain mix-blend-multiply"
                fallbackIcon={Sparkles}
              />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
              className="absolute -bottom-1.5 -right-1.5 bg-[#059669] p-1.5 rounded-full border-2 border-white shadow-sm text-white"
            >
              <Check size={14} strokeWidth={3} />
            </motion.div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#059669]">
              Account Ready
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              Gamura ID Activated
            </h2>
            <p className="text-sm text-[#6E6E73] leading-relaxed">
              Your Gamura account is ready across Universe, Store, and Cloud apps.
            </p>
          </div>

          {/* Apple Inset Grouped Account Summary */}
          <div className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl divide-y divide-zinc-200/70 text-left overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#6E6E73] font-medium">Gamura ID</span>
              <span className="text-sm font-semibold text-[#1D1D1F] font-mono">
                @{createdGamuraIdInfo.username}
              </span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#6E6E73] font-medium">Display Name</span>
              <span className="text-sm font-semibold text-[#1D1D1F] truncate">
                {createdGamuraIdInfo.nickname}
              </span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#6E6E73] font-medium shrink-0">Account UID</span>
              <span className="text-xs font-mono text-[#6E6E73] truncate tabular-nums">
                {createdGamuraIdInfo.uid}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreatedGamuraIdInfo(null);
              setCurrentPage("universe-active");
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>Enter Gamura Universe</span>
            <ArrowRight size={16} />
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
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                CHAT HISTORY
              </h2>
              <p className="text-sm text-zinc-500">
                Your previous prompt generations
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportAppFirestoreBackup}
              disabled={isExportingAppBackup}
              title="Download your chats, activities, and projects from Firestore as JSON"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isExportingAppBackup ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>
                {isExportingAppBackup ? "Exporting Backup..." : "Export Backup (JSON)"}
              </span>
            </button>
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
                    window.history.pushState({}, "", "/gpg");
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
      <div
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] relative flex flex-col items-center justify-center p-4 sm:p-6"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
        }}
      >
        <div className="w-full max-w-md">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setCurrentPage("login");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          </div>

          <div className="bg-white border border-black/[0.06] rounded-[28px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 mx-auto p-2.5 flex items-center justify-center">
                <SafeImage
                  srcs={logoSources}
                  alt="Gamura"
                  className="w-full h-full object-contain mix-blend-multiply"
                  fallbackIcon={Sparkles}
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Create Gamura ID
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  One account for Gamura Universe, Store, and Free URLs
                </p>
              </div>
            </div>

            <form
              className="space-y-3.5"
              onSubmit={async (e) => {
                e.preventDefault();
                const cleanUsername = username.trim();
                if (cleanUsername.length < 6) {
                  setAuthError("Username must be at least 6 characters long.");
                  return;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
                  setAuthError("Username can only contain letters, numbers, underscores, and hyphens.");
                  return;
                }
                if (password.length < 8) {
                  setAuthError("Password must be at least 8 characters long.");
                  return;
                }
                setAuthError(null);
                setIsAuthLoading(true);

                try {
                  const usernameLower = cleanUsername.toLowerCase();
                  const usernameDoc = await getDocWithTimeout(
                    doc(db, "usernames", usernameLower),
                    2500,
                  ).catch(() => null);
                  if (usernameDoc && usernameDoc.exists()) {
                    setAuthError("This Gamura ID is already taken. Please choose another.");
                    setIsAuthLoading(false);
                    return;
                  }

                  const finalEmail = email.trim() || `${usernameLower}@gamura.app`;
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
                        regErr.message.toLowerCase().includes("email-already-in-use"))
                    ) {
                      try {
                        const userCredential = await signInWithEmailAndPassword(
                          auth,
                          finalEmail,
                          password,
                        );
                        user = userCredential.user;
                      } catch {
                        throw regErr;
                      }
                    } else {
                      throw regErr;
                    }
                  }

                  try {
                    Promise.all([
                      (async () => {
                        try {
                          const statsRef = doc(db, "system", "stats");
                          const statsDoc = await getDocWithTimeout(statsRef, 2500).catch(() => null);
                          if (statsDoc && !statsDoc.exists()) {
                            await setDoc(statsRef, { loginCount: 1, totalUsers: 1 }, { merge: true });
                          } else {
                            await updateDoc(statsRef, {
                              totalUsers: increment(1),
                              loginCount: increment(1),
                            });
                          }
                        } catch {
                          // ignore stats error
                        }
                      })(),
                      setDoc(doc(db, "usernames", usernameLower), { uid: user.uid }).catch(() => null),
                      setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        email: finalEmail,
                        username: cleanUsername,
                        nickname: nickname.trim() || cleanUsername,
                        createdAt: Date.now(),
                        gpgTimestamps: [],
                        lastLogin: Date.now(),
                      }).catch(() => null),
                      setDoc(doc(db, "gamura_developers", usernameLower), {
                        uid: user.uid,
                        username: usernameLower,
                        displayName: nickname.trim() || cleanUsername,
                        email: finalEmail,
                        blocks: [],
                        published: false,
                        plan: "Starter",
                        clicks: 0,
                        views: 1,
                        visitors: 1,
                        engagements: 1,
                        updatedAt: serverTimestamp(),
                      }).catch(() => null),
                    ]);

                    const userInfoObj = {
                      username: cleanUsername,
                      nickname: nickname.trim() || cleanUsername,
                      gpgTimestamps: [],
                    };
                    setCurrentUserInfo(userInfoObj);

                    try {
                      localStorage.setItem(
                        `gamura_user_info_${user.uid}`,
                        JSON.stringify(userInfoObj),
                      );
                      localStorage.setItem(`gamura_id_email_${usernameLower}`, finalEmail);
                    } catch {
                      // ignore storage error
                    }

                    setDoc(doc(collection(db, "activities")), {
                      title: `${cleanUsername} created a Gamura ID`,
                      ic: "✨",
                      timestamp: serverTimestamp(),
                      user: cleanUsername,
                      userId: user.uid,
                    }).catch(() => null);

                    setCreatedGamuraIdInfo({
                      username: cleanUsername,
                      nickname: nickname.trim() || cleanUsername,
                      uid: user.uid,
                    });

                    setUsername("");
                    setPassword("");
                    setEmail("");
                    setNickname("");
                  } catch (dbError) {
                    console.error("Silent db fallback activated for login registration", dbError);
                  } finally {
                    (window as any).isRegisteringUser = false;
                  }
                } catch (error: any) {
                  (window as any).isRegisteringUser = false;
                  if (error.code === "auth/email-already-in-use") {
                    setAuthError("This Email or Gamura ID already exists.");
                  } else if (error.code === "auth/operation-not-allowed") {
                    setAuthError("Email/Password authentication is not enabled in Firebase Console.");
                  } else {
                    setAuthError(error.message || "Could not create account. Please try again.");
                  }
                } finally {
                  setIsAuthLoading(false);
                }
              }}
            >
              {authError && (
                <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200">
                  {authError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Display Name
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Email <span className="text-[#6E6E73] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-3.5 font-semibold text-sm transition-all shadow-sm active:scale-[0.99] mt-2 flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Creating ID...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200/80" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#6E6E73]">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full bg-white border border-zinc-200 rounded-xl py-3 text-sm font-semibold text-[#1D1D1F] flex items-center justify-center gap-2.5 hover:bg-zinc-50 transition-all active:scale-[0.99] cursor-pointer min-h-[46px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={isAuthLoading}
                  className="w-full bg-[#1D1D1F] hover:bg-black text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer min-h-[46px]"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.37.13-9.13-1.9-14.29-6.07-3.57-2.9-7.51-7.7-11.83-14.42-7.51-11.61-13-25.01-16.48-40.17-3.48-15.17-3.17-29.17.9-42 4.07-12.9 10.9-22.75 20.48-29.58 9.58-6.82 19.9-10.28 30.93-10.39 5.71 0 11.66 1.41 17.84 4.19 6.18 2.78 10.36 4.17 12.54 4.17 2.01 0 6.03-1.34 12.06-4.01 6.03-2.68 11.47-3.96 16.32-3.85 11.52.45 21.01 4.54 28.48 12.27 7.47 7.72 11.75 16.93 12.83 27.65-11.61 5.37-19.16 12.8-22.65 22.28-3.48 9.48-2.6 19.24 2.65 29.27 3.35 6.43 8.01 11.63 13.98 15.61 5.96 3.97 12.18 6.17 18.63 6.6-1.56 4.58-3.57 9.52-6.03 14.83zm-27.14-101.46c0-7.72 2.73-14.75 8.19-21.08 5.46-6.33 11.96-10.03 19.51-11.1 0.45 7.82-2.3 14.93-8.25 21.34-5.95 6.41-12.43 10.27-19.45 10.84 0 0 .0-.10 0-1z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-[#6E6E73]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setCurrentPage("login");
                }}
                className="text-[#0071E3] font-semibold cursor-pointer hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "login") {
    if (forgotPassword) {
      return (
        <div
          className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] relative flex flex-col items-center justify-center p-4 sm:p-6"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
          }}
        >
          <div className="w-full max-w-md bg-white border border-black/[0.06] rounded-[28px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 mx-auto p-2.5 flex items-center justify-center">
                <SafeImage
                  srcs={logoSources}
                  alt="Gamura"
                  className="w-full h-full object-contain mix-blend-multiply"
                  fallbackIcon={Sparkles}
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Reset Password
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Enter your Gamura ID or Email to receive a reset link
                </p>
              </div>
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

                  if (!resetTarget.includes("@")) {
                    const uNameDoc = await getDocWithTimeout(
                      doc(db, "usernames", resetTarget.toLowerCase()),
                      2500,
                    ).catch(() => null);
                    if (uNameDoc && uNameDoc.exists()) {
                      const uid = uNameDoc.data()?.uid;
                      if (uid) {
                        const uDoc = await getDocWithTimeout(doc(db, "users", uid), 2500).catch(() => null);
                        if (uDoc && uDoc.exists() && uDoc.data()?.email) {
                          resetTarget = uDoc.data()?.email;
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
                    setAuthError("No account found with this Gamura ID or Email.");
                  } else if (err.code === "auth/invalid-email") {
                    setAuthError("The email address format is invalid.");
                  } else {
                    setAuthError(err.message || "Could not send reset email. Check your ID or Email.");
                  }
                } finally {
                  setIsAuthLoading(false);
                }
              }}
            >
              {authError && (
                <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200 text-center">
                  {authError}
                </div>
              )}
              <div className="space-y-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Gamura ID or Email"
                  className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 px-4 focus:bg-white focus:border-[#0071E3] outline-none text-sm text-[#1D1D1F]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-3.5 font-semibold text-sm transition-all cursor-pointer min-h-[46px]"
              >
                {isAuthLoading ? (
                  <Loader2 size={17} className="animate-spin mx-auto" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setResetEmailSent(false);
                  setAuthError(null);
                }}
                className="w-full text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors py-2 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          </div>

          <AnimatePresence>
            {resetEmailSent && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
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
                  transition={{ type: "spring", damping: 28, stiffness: 260 }}
                  className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-[2rem] z-50 p-8 shadow-2xl flex flex-col items-center justify-center text-center border-t border-zinc-200"
                >
                  <div className="w-12 h-1 bg-zinc-300 rounded-full mb-5" />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mb-4">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[#1D1D1F]">
                      Reset Link Sent
                    </h3>
                    <p className="text-sm text-[#6E6E73] max-w-xs mx-auto">
                      Check your inbox and spam folder for password reset instructions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setForgotPassword(false);
                      setResetEmailSent(false);
                      setAuthError(null);
                    }}
                    className="w-full max-w-xs py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl font-semibold text-sm transition-all mt-6 cursor-pointer"
                  >
                    Back to Sign In
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
        <div
          className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] relative flex flex-col items-center justify-center p-4"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
          }}
        >
          <div className="w-full max-w-sm space-y-6">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-black/[0.06] rounded-[28px] p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden"
            >
              {!showDeleteConfirm ? (
                <div className="text-center space-y-5">
                  <div className="relative inline-block">
                    {currentUserInfo.avatarUrl ? (
                      <img
                        src={currentUserInfo.avatarUrl}
                        alt={currentUserInfo.nickname}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover mx-auto border border-zinc-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#0071E3] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-xs">
                        {(currentUserInfo.nickname ||
                          currentUserInfo.username ||
                          "G")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                      {currentUserInfo.nickname}
                    </h2>
                    <p className="text-xs font-mono font-semibold text-[#0071E3]">
                      @{currentUserInfo.username}
                    </p>
                    {currentUserInfo.bio && (
                      <p className="text-[#6E6E73] text-xs py-1.5 px-3 bg-[#F5F5F7] rounded-xl leading-relaxed mt-2 max-w-xs mx-auto">
                        {currentUserInfo.bio}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, "", "/claim");
                        setCurrentPage("claim");
                      }}
                      className="w-full flex items-center justify-between gap-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-3 px-4 font-semibold text-xs transition-all active:scale-[0.99] cursor-pointer min-h-[44px]"
                    >
                      <span>Claim Gamura Free URL</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage("universe-active");
                      }}
                      className="w-full flex items-center justify-between gap-3 bg-[#1D1D1F] hover:bg-black text-white rounded-xl py-3 px-4 font-semibold text-xs transition-all active:scale-[0.99] cursor-pointer min-h-[44px]"
                    >
                      <span>Open Universe Dashboard</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportAppFirestoreBackup}
                      disabled={isExportingAppBackup}
                      className="w-full flex items-center justify-between gap-3 bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] rounded-xl py-3 px-4 font-semibold text-xs transition-all active:scale-[0.99] cursor-pointer min-h-[44px] disabled:opacity-60"
                    >
                      <span>
                        {isExportingAppBackup
                          ? "Exporting Firestore Backup..."
                          : "Export Firestore Backup (JSON)"}
                      </span>
                      {isExportingAppBackup ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentPage("home")}
                      className="w-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] rounded-xl py-3 font-semibold text-xs transition-all cursor-pointer text-center min-h-[44px]"
                    >
                      Back to Home
                    </button>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSignOutConfirm(true)}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full h-10 flex items-center justify-center gap-2 text-[#6E6E73] hover:text-red-600 rounded-xl font-medium text-xs transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Delete Account
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
                                setIsAuthLoading(false);
                                setDeletionProgress(null);
                                const isCancelled =
                                  err?.code === "auth/popup-closed-by-user" ||
                                  err?.code === "auth/cancelled-popup-request" ||
                                  err?.code === "auth/popup-blocked" ||
                                  err?.message?.includes("popup-closed-by-user") ||
                                  err?.message?.includes("cancelled-popup-request") ||
                                  err?.message?.toLowerCase().includes("popup closed");

                                if (isCancelled) {
                                  showToast(
                                    "⚠️",
                                    "Authentication Cancelled",
                                    "The Google verification popup was closed. Verification was cancelled.",
                                    "warning"
                                  );
                                } else {
                                  console.error("Google re-auth failed:", err);
                                  showToast("❌", "Verification Failed", err?.message || "Re-authentication failed.", "error");
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
      <div
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] relative flex flex-col items-center justify-center p-4 sm:p-6"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
        }}
      >
        <div className="w-full max-w-md">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setCurrentPage("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>
          </div>

          <div className="bg-white border border-black/[0.06] rounded-[28px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 mx-auto p-2.5 flex items-center justify-center">
                <SafeImage
                  srcs={logoSources}
                  alt="Gamura"
                  className="w-full h-full object-contain mix-blend-multiply"
                  fallbackIcon={Sparkles}
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Sign in to Gamura
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Access your Gamura Universe, Store, and Claimed URLs
                </p>
              </div>
            </div>

            <form
              className="space-y-3.5"
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError(null);
                setIsAuthLoading(true);

                try {
                  let loginEmail = username.trim();
                  const uLower = loginEmail.toLowerCase();
                  if (!loginEmail.includes("@")) {
                    const cachedEmail = localStorage.getItem(`gamura_id_email_${uLower}`);
                    loginEmail = cachedEmail || `${uLower}@gamura.app`;
                  }

                  let userCred;
                  try {
                    userCred = await signInWithEmailAndPassword(auth, loginEmail, password);
                  } catch (initialErr: any) {
                    if (
                      !username.trim().includes("@") &&
                      !localStorage.getItem(`gamura_id_email_${uLower}`) &&
                      (initialErr.code === "auth/user-not-found" ||
                        initialErr.code === "auth/invalid-credential")
                    ) {
                      const uDoc = await getDocWithTimeout(
                        doc(db, "usernames", uLower),
                        2500,
                      ).catch(() => null);
                      if (uDoc && uDoc.exists()) {
                        const uid = uDoc.data()?.uid;
                        if (uid) {
                          const uProfile = await getDocWithTimeout(
                            doc(db, "users", uid),
                            2500,
                          ).catch(() => null);
                          if (uProfile && uProfile.exists() && uProfile.data()?.email) {
                            loginEmail = uProfile.data()?.email;
                            userCred = await signInWithEmailAndPassword(auth, loginEmail, password);
                          } else {
                            throw initialErr;
                          }
                        } else {
                          throw initialErr;
                        }
                      } else {
                        throw initialErr;
                      }
                    } else {
                      throw initialErr;
                    }
                  }

                  if (userCred && userCred.user && !username.trim().includes("@")) {
                    localStorage.setItem(`gamura_id_email_${uLower}`, loginEmail);
                  }
                  setCurrentPage("universe-active");
                } catch (error: any) {
                  if (error.code === "auth/operation-not-allowed") {
                    setAuthError("Email/Password authentication is not enabled in Firebase Console.");
                  } else {
                    setAuthError("Invalid Gamura ID or password.");
                  }
                } finally {
                  setIsAuthLoading(false);
                }
              }}
            >
              {authError && (
                <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200">
                  {authError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Gamura ID or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPassword(true)}
                    className="text-xs font-medium text-[#0071E3] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all text-sm text-[#1D1D1F]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-3.5 font-semibold text-sm transition-all shadow-sm active:scale-[0.99] mt-2 flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200/80" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#6E6E73]">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full bg-white border border-zinc-200 rounded-xl py-3 text-sm font-semibold text-[#1D1D1F] flex items-center justify-center gap-2.5 hover:bg-zinc-50 transition-all active:scale-[0.99] cursor-pointer min-h-[46px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={isAuthLoading}
                  className="w-full bg-[#1D1D1F] hover:bg-black text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer min-h-[46px]"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.37.13-9.13-1.9-14.29-6.07-3.57-2.9-7.51-7.7-11.83-14.42-7.51-11.61-13-25.01-16.48-40.17-3.48-15.17-3.17-29.17.9-42 4.07-12.9 10.9-22.75 20.48-29.58 9.58-6.82 19.9-10.28 30.93-10.39 5.71 0 11.66 1.41 17.84 4.19 6.18 2.78 10.36 4.17 12.54 4.17 2.01 0 6.03-1.34 12.06-4.01 6.03-2.68 11.47-3.96 16.32-3.85 11.52.45 21.01 4.54 28.48 12.27 7.47 7.72 11.75 16.93 12.83 27.65-11.61 5.37-19.16 12.8-22.65 22.28-3.48 9.48-2.6 19.24 2.65 29.27 3.35 6.43 8.01 11.63 13.98 15.61 5.96 3.97 12.18 6.17 18.63 6.6-1.56 4.58-3.57 9.52-6.03 14.83zm-27.14-101.46c0-7.72 2.73-14.75 8.19-21.08 5.46-6.33 11.96-10.03 19.51-11.1 0.45 7.82-2.3 14.93-8.25 21.34-5.95 6.41-12.43 10.27-19.45 10.84 0 0 .0-.10 0-1z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-1">
              <p className="text-center text-xs text-[#6E6E73]">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setCurrentPage("signup");
                  }}
                  className="text-[#0071E3] font-semibold cursor-pointer hover:underline"
                >
                  Sign up
                </button>
              </p>

              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setCurrentUserInfo({
                    username: "Explorer",
                    nickname: "Guest Explorer",
                    gpgTimestamps: [],
                    avatarUrl: "",
                    bio: "Guest Explorer Session",
                    email: "explorer@gamura.app",
                    themeColor: "",
                  });
                  setCurrentUser({
                    uid: "guest_explorer_uid",
                    displayName: "Guest Explorer",
                    email: "explorer@gamura.app",
                  });
                  setCurrentPage("universe-active");
                }}
                className="w-full py-2.5 px-4 bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-zinc-200/70 cursor-pointer min-h-[42px]"
              >
                <Sparkles size={14} className="text-[#0071E3]" />
                <span>Explore as Guest</span>
              </button>
            </div>
          </div>
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
            <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
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

  if (currentPage === "white-page" || currentPage === "join-selvaranjan") {
    return (
      <SelvaranjanGamura
        onBack={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "blank") {
    return (
      <UniverseDashboard
        onBack={() => {
          setCurrentPage("home");
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
    );
  }

  if (currentPage === "universe-active") {
    return (
      <UniverseDashboard
        onBack={() => {
          setCurrentPage("home");
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
    );
  }

  if (currentPage === "aura") {
    return (
      <GamuraAuraHub
        user={currentUser}
        userInfo={currentUserInfo}
        setCurrentUserInfo={setCurrentUserInfo}
        selectedModule={selectedAuraModule}
        onSelectModule={setSelectedAuraModule}
        onBackHome={() => {
          setSelectedAuraModule(null);
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
        onOpenPortfolio={() => setCurrentPage("portfolio")}
        onOpenClaimUrl={(prefill) => {
          if (prefill) setClaimPrefillHandle(prefill);
          window.history.pushState(
            {},
            "",
            prefill ? `/claim?handle=${encodeURIComponent(prefill)}` : "/claim",
          );
          setCurrentPage("claim");
        }}
        onOpenGpg={() => {
          window.history.pushState({}, "", "/gpg");
          setCurrentPage("gpg");
        }}
        onOpenUniverse={() => {
          if (!isLoggedIn) {
            setCurrentUserInfo({
              username: "Explorer",
              nickname: "Guest Explorer",
              gpgTimestamps: [],
              avatarUrl: "",
              bio: "Guest Explorer Session",
              email: "explorer@gamura.app",
              themeColor: "",
            });
            setCurrentUser({
              uid: "guest_explorer_uid",
              displayName: "Guest Explorer",
              email: "explorer@gamura.app",
            });
          }
          setCurrentPage("universe-active");
        }}
        showToast={showToast}
        addActivity={addActivity}
      />
    );
  }

  if (currentPage === "gpg") {
    const recentGpgCount = getRecentGpgTimestamps().length;
    const remainingGpgCount = Math.max(0, 3 - recentGpgCount);

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col h-screen overflow-hidden">
        {/* Header Bar with Apple/Gamura Aesthetic */}
        <div className="py-2.5 px-3 md:px-6 w-full flex items-center justify-between border-b border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.history.pushState({}, "", "/");
                setCurrentPage("home");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer border border-zinc-200 dark:border-white/10 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <a
              href="/gpg"
              target="_blank"
              rel="noreferrer"
              title="Open GPG in dedicated window"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 text-xs transition-all border border-zinc-200 dark:border-white/10 whitespace-nowrap"
            >
              <ExternalLink size={12} />
              <span className="text-[10px] font-mono">Dedicated Page</span>
            </a>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-sm md:text-base font-black tracking-widest uppercase font-sans">
                <span className="text-red-500">G</span>
                <span className="text-yellow-400">P</span>
                <span className="text-green-500">G</span>
              </span>
              <span className="text-xs md:text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wider">
                PROMPT GENERATOR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/20 px-3 py-1.5 rounded-xl hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
            >
              New Chat
            </button>
          </div>
        </div>

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
                placeholder="Describe what you need a prompt for..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-sm shadow-sm placeholder:text-zinc-400 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!gpgInput.trim() || isGpgLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md flex items-center justify-center"
              >
                {isGpgLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <div className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 mt-3 tracking-wide font-medium flex items-center justify-center gap-2">
              <span className="font-semibold">Prompt Generator Only</span>
              <span aria-hidden="true">·</span>
              <span className={remainingGpgCount === 0 ? "text-red-500 font-semibold" : "text-zinc-600 dark:text-zinc-300"}>
                {remainingGpgCount}/3 prompts remaining today
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentPage === "claim") {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        }}
      >
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-2xl border-b border-black/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                window.history.pushState({}, "", "/");
                setCurrentPage("home");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.05] hover:bg-black/[0.09] text-sm font-medium text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft size={15} />
              <span>Home</span>
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F] tracking-tight">
              <Globe size={16} className="text-[#0071E3]" />
              <span>Gamura Free URL</span>
            </div>
            <button
              onClick={() => setCurrentPage("login")}
              className="px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isLoggedIn ? "Account" : "Sign In"}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <GamuraUniverseProfileManager
            user={currentUser}
            initialHandle={claimPrefillHandle}
            onNavigateLogin={() => setCurrentPage("login")}
            showToast={showToast}
          />
        </main>
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
        onClaimRoute={(prefill) => {
          const targetHandle = prefill || claimedProfileUser || "";
          setClaimPrefillHandle(targetHandle);
          setClaimedProfileUser(null);
          const nextUrl = targetHandle
            ? `/claim?handle=${encodeURIComponent(targetHandle)}`
            : "/claim";
          window.history.pushState({}, "", nextUrl);
          setCurrentPage("claim");
        }}
      />
    );
  }

  if (currentPage === "privacy") {
    return (
      <PrivacyPolicyView
        onBack={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "terms") {
    return (
      <TermsOfServiceView
        onBack={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "license") {
    return (
      <LicenseAgreementView
        currentUser={currentUser}
        onBack={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "delete-account") {
    return (
      <AccountDeletionView
        currentUser={currentUser}
        onBack={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
        onDeleteAccount={async () => {
          if (currentUser) {
            try {
              await deleteUser(currentUser);
            } catch (e) {
              console.warn("Direct auth deletion exception:", e);
            }
            setCurrentUser(null);
            setCurrentUserInfo(null);
            window.history.pushState({}, "", "/");
            setCurrentPage("home");
          }
        }}
      />
    );
  }

  if (currentPage === "gpdf") {
    return (
      <GamuraPdfStudio
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "launch") {
    return (
      <GamuraStoreLaunch
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "veo") {
    return (
      <GamuraVeoPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "clip") {
    return (
      <GamuraClipPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "calculator") {
    return (
      <GamuraCalcPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "camera") {
    return (
      <GamuraCameraPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "messenger") {
    return (
      <GamuraMessengerPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "gfiles") {
    return (
      <GfilesPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "links") {
    return (
      <GamuraLinksPage
        initialSlug={shortLinkTarget}
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "resume") {
    return (
      <GamuraResumePage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "pb1") {
    return (
      <GamuraPortfolioBuilderPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "pb2") {
    return (
      <GamuraPortfolioBuilder2Page
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "ppt-cred") {
    return (
      <GamuraPptCredPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "cover-gened") {
    return (
      <GamuraCoverGenedPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "glifeline") {
    return (
      <GamuraLifelinePage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "gshield") {
    return (
      <GamuraShieldPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "gfresh") {
    return (
      <GamuraFreshPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "gcard") {
    return (
      <GamuraCardPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
        onNavigateUrl={(path) => {
          window.history.pushState({}, "", path);
          const resolved = resolveRouteFromLocation();
          setCurrentPage(resolved.page);
        }}
      />
    );
  }

  if (currentPage === "gwallet") {
    return (
      <GamuraWalletPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
        }}
        onNavigateUrl={(path) => {
          window.history.pushState({}, "", path);
          const resolved = resolveRouteFromLocation();
          setCurrentPage(resolved.page);
        }}
      />
    );
  }

  if (currentPage === "gamura-for-business") {
    return (
      <GamuraForBusinessPage
        onBackHome={() => {
          window.history.pushState({}, "", "/");
          setCurrentPage("home");
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col overflow-hidden transition-colors duration-300">
        {/* Apple-Style Bottom-Up Sheet Menu Bar (Half Screen, White, Rounded Top Corners) */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Frosted Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
              />

              {/* Apple iOS/iPadOS Bottom Sheet Container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.85 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0.03, bottom: 0.65 }}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 80 || info.velocity.y > 320) {
                    setIsMenuOpen(false);
                  }
                }}
                className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-2xl h-[54vh] min-h-[380px] max-h-[620px] bg-white/95 backdrop-blur-2xl z-50 rounded-t-[2.25rem] shadow-[0_-24px_60px_rgba(0,0,0,0.16)] border-t border-x border-zinc-200/80 flex flex-col select-none text-zinc-900 overflow-hidden"
              >
                {/* Grabber Handle */}
                <div
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing shrink-0"
                  title="Swipe down or tap to close"
                >
                  <div className="w-11 h-1.5 rounded-full bg-zinc-300/90 hover:bg-zinc-400 transition-colors" />
                </div>

                {/* Sheet Top Bar */}
                <div className="px-6 py-3 flex items-center justify-between border-b border-zinc-100 shrink-0 cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-1.5 shrink-0">
                      <SafeImage
                        srcs={logoSources}
                        alt="Gamura Logo"
                        className="w-full h-full object-contain mix-blend-multiply"
                        fallbackIcon={Sparkles}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight text-zinc-900">
                        Gamura
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Workspace & Apps
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Apple Grouped Scrollable Body */}
                <div
                  onPointerDown={(e) => {
                    if (e.currentTarget.scrollTop > 2) {
                      e.stopPropagation();
                    }
                  }}
                  className="flex-1 px-5 py-4 overflow-y-auto touch-pan-y bg-[#F5F5F7]/70 space-y-4"
                >
                  {/* Group 1: Core Platforms */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 divide-y divide-zinc-100 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    {/* GPG */}
                    <button
                      onClick={() => {
                        window.history.pushState({}, "", "/gpg");
                        setCurrentPage("gpg");
                        setIsMenuOpen(false);
                      }}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <MessageSquarePlus size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900 truncate">
                              GPG Prompt Generator
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600">
                              Free
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 truncate">
                            Realtime Puter AI prompt engineering
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* Universe */}
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          setCurrentUserInfo({
                            username: "Explorer",
                            nickname: "Guest Explorer",
                            gpgTimestamps: [],
                            avatarUrl: "",
                            bio: "Guest Explorer Session",
                            email: "explorer@gamura.app",
                            themeColor: "",
                          });
                          setCurrentUser({
                            uid: "guest_explorer_uid",
                            displayName: "Guest Explorer",
                            email: "explorer@gamura.app",
                          });
                        }
                        setCurrentPage("universe-active");
                        setIsMenuOpen(false);
                      }}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Globe size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            Universe
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Network, community & neural workspaces
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* Aura */}
                    <button
                      onClick={() => {
                        window.history.pushState({}, "", "/aura");
                        setSelectedAuraModule(null);
                        setCurrentPage("aura");
                        setIsMenuOpen(false);
                      }}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Sparkles size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            Aura
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Spatial showcase & system modules
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* Free URL Claim */}
                    <button
                      onClick={() => {
                        window.history.pushState({}, "", "/claim");
                        setCurrentPage("claim");
                        setIsMenuOpen(false);
                      }}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Link size={17} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            Free URL Claim
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Claim your public @username page
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* G PDF Studio (Opens new URL page) */}
                    <a
                      href="/gpdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          <img
                            src={G_PDF_LOGO_SRC}
                            alt="G PDF"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                G_PDF_LOGO_FALLBACK;
                            }}
                            className="w-full h-full object-contain scale-[1.4] mix-blend-multiply"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            G PDF Studio
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Create, edit, merge, compress &amp; canvas modify
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={15} className="text-zinc-400 group-hover:text-zinc-700 transition-all shrink-0" />
                    </a>

                    {/* Gamura Launch Store (Opens new URL page) */}
                    <a
                      href="/launch"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          <img
                            src={LAUNCH_LOGO_SRC}
                            alt="Gamura Launch"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                LAUNCH_LOGO_FALLBACK;
                            }}
                            className="w-full h-full object-contain scale-[1.15] p-0.5 mix-blend-multiply"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            Gamura Launch Store
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Discover, install &amp; open all Gamura apps
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={15} className="text-zinc-400 group-hover:text-zinc-700 transition-all shrink-0" />
                    </a>

                    {/* Join Galaxy */}
                    <button
                      onClick={() => {
                        window.open("https://gamuragalaxy.vercel.app/", "_blank");
                        setIsMenuOpen(false);
                      }}
                      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <ExternalLink size={17} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            Join Galaxy
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            Official community portal
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </div>

                  {/* Group 2: Account & Utilities */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      onClick={() => {
                        setCurrentPage("login");
                        setIsMenuOpen(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white border border-zinc-200/70 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                        {isLoggedIn ? <User size={16} /> : <LogIn size={16} />}
                      </div>
                      <span className="text-xs font-medium text-zinc-800 whitespace-nowrap">
                        {isLoggedIn ? "Profile" : "Sign In"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage("history");
                        setIsMenuOpen(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white border border-zinc-200/70 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <History size={16} />
                      </div>
                      <span className="text-xs font-medium text-zinc-800 whitespace-nowrap">
                        History
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage("gg");
                        setIsMenuOpen(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white border border-zinc-200/70 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <Gamepad2 size={16} />
                      </div>
                      <span className="text-xs font-medium text-zinc-800 whitespace-nowrap">
                        GG Gaming
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage("about");
                        setIsMenuOpen(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white border border-zinc-200/70 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <Info size={16} />
                      </div>
                      <span className="text-xs font-medium text-zinc-800 whitespace-nowrap">
                        About
                      </span>
                    </button>
                  </div>

                  {/* Group 3: Legal & Account Management (Opens on dedicated URL page) */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 divide-y divide-zinc-100 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={15} className="text-emerald-600" />
                        <span className="text-xs font-medium text-zinc-700">Privacy Policy</span>
                      </div>
                      <ExternalLink size={13} className="text-zinc-400" />
                    </a>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={15} className="text-sky-600" />
                        <span className="text-xs font-medium text-zinc-700">Terms &amp; Conditions</span>
                      </div>
                      <ExternalLink size={13} className="text-zinc-400" />
                    </a>
                    <a
                      href="/license"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Scale size={15} className="text-[#1A73E8]" />
                        <span className="text-xs font-medium text-zinc-700">Software License (EULA)</span>
                      </div>
                      <ExternalLink size={13} className="text-zinc-400" />
                    </a>
                    <a
                      href="/delete-account"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="group w-full flex items-center justify-between px-4 py-2.5 hover:bg-red-50/70 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 size={15} className="text-red-500" />
                        <span className="text-xs font-medium text-red-600">Account Deletion</span>
                      </div>
                      <ExternalLink size={13} className="text-zinc-400" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top Header Bar — Clean Top-Left Menu Dock Trigger Only */}
        <header className="w-full z-30 px-4 md:px-8 py-3 flex items-center justify-between bg-white/95 backdrop-blur-xl sticky top-0">
          {/* Zone 1: Unique Apple-Style Integrated Menu-Logo Dock Trigger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="group flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-2xl bg-zinc-50/90 hover:bg-zinc-100 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.97] transition-all cursor-pointer shrink-0"
            title="Open Gamura Menu"
            aria-label="Open Gamura Navigation Menu"
          >
            {/* Sculptural Gamura Emblem Capsule */}
            <div className="relative w-8 h-8 rounded-xl bg-white border border-zinc-200/70 flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform">
              <SafeImage
                srcs={logoSources}
                alt="Gamura Menu"
                className="w-full h-full object-contain mix-blend-multiply"
                fallbackIcon={Sparkles}
              />
            </div>

            {/* Bespoke Architectural Dual-Bar Menu Glyph */}
            <div className="flex flex-col items-start justify-center gap-[3.5px] pl-0.5 pr-1">
              <span className="w-4 h-[2px] rounded-full bg-zinc-900 group-hover:w-5 transition-all duration-200" />
              <span className="w-2.5 h-[2px] rounded-full bg-zinc-500 group-hover:w-4 group-hover:bg-zinc-900 transition-all duration-200" />
            </div>

            <span className="text-xs font-bold tracking-[0.18em] text-zinc-900 uppercase font-sans whitespace-nowrap hidden sm:inline">
              GAMURA
            </span>
          </button>
        </header>

        {/* MIDDLE INTERFACE OF THE APPLICATION — Pure White Centered Alignment */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center w-full h-full px-6 pt-8 pb-28 relative z-0">
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto gap-3 sm:gap-5 w-full bg-transparent">
            {/* Centered Emblem Logo (Transparent Background Blend) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex items-center justify-center p-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer bg-transparent border-none shadow-none outline-none"
              title="Open Gamura Menu"
            >
              <SafeImage
                srcs={logoSources}
                alt="GAMURA Logo"
                className="w-full h-full object-contain bg-transparent mix-blend-multiply"
                fallbackIcon={Sparkles}
              />
            </button>

            {/* Centered GAMURA Name Image (Aligned directly below Emblem, zero box/background) */}
            <div className="w-full max-w-[260px] sm:max-w-[360px] md:max-w-[460px] flex items-center justify-center mx-auto bg-transparent">
              <SafeImage
                srcs={mainImgSources}
                alt="GAMURA"
                className="w-full max-h-[30vh] sm:max-h-[36vh] object-contain bg-transparent mix-blend-multiply"
                fallbackIcon={Sparkles}
              />
            </div>
          </div>
        </div>

        {/* Unique Extensible Apple-Style Rounded Bottom Dock */}
        <AppleBottomDock
          activeId="home"
          onNavigateHome={() => {
            window.history.pushState({}, "", "/");
            setCurrentPage("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onNavigateGpg={() => {
            window.history.pushState({}, "", "/gpg");
            setCurrentPage("gpg");
          }}
          onNavigateClaim={() => {
            window.history.pushState({}, "", "/claim");
            setCurrentPage("claim");
          }}
          onOpenMoreMenu={() => setIsMenuOpen(true)}
        />

        {/* TOASTS CONTAINER FOR APP (LOGIN, SIGNUP, SYSTEM GATEWAY) */}
        <div className="fixed bottom-24 right-4 sm:right-8 z-[1000] flex flex-col gap-3 pointer-events-none">
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
  })();

  return (
    <>
      {activePageView}
      <GamuraLicenseGate
        currentPage={currentPage}
        authUser={currentUser}
        onNavigateLegalPage={(page) => {
          window.history.pushState({}, "", `/${page}`);
          setCurrentPage(page);
        }}
      />
    </>
  );
}
