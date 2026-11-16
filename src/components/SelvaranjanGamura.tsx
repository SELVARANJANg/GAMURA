import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Globe,
  Image as ImageIcon,
  Layers,
  Linkedin,
  Loader2,
  Lock,
  LogOut,
  Minus,
  MousePointerClick,
  Plus,
  QrCode,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  Upload,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

interface SelvaranjanGamuraProps {
  onBack: () => void;
  embeddedInUniverse?: boolean;
  showToast?: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  accentColor?: string;
}

type StudioTab = "discover" | "studio" | "viewer";
type BlockType = "hdr" | "lnk" | "txt" | "img" | "pdf" | "html" | "div";

interface PageBlock {
  id: string;
  type: BlockType;
  name?: string;
  bio?: string;
  title?: string;
  url?: string;
  icon?: string;
  content?: string;
  tt?: "p" | "h1" | "h2";
  src?: string;
  alt?: string;
  code?: string;
}

const RESERVED_HANDLES = new Set([
  "home",
  "gpg",
  "universe",
  "community",
  "features",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "delete-account",
  "account-deletion",
  "claim",
  "docs",
  "feed",
  "chat",
  "direct",
  "profile",
  "settings",
  "developer",
  "white-page",
  "join-selvaranjan",
  "apps",
  "go",
  "api",
  "login",
  "signup",
  "aura",
]);

const LINK_TEMPLATES = [
  { label: "GitHub", icon: "💻", title: "GitHub Repositories", url: "https://github.com/" },
  { label: "LinkedIn", icon: "💼", title: "Connect on LinkedIn", url: "https://linkedin.com/in/" },
  { label: "Portfolio", icon: "🌐", title: "Personal Portfolio", url: "https://selvaranjan.netlify.app/" },
  { label: "YouTube", icon: "▶️", title: "YouTube Channel", url: "https://youtube.com/@" },
];

const HTML_STARTERS = [
  {
    name: "Apple Glass Card",
    code: `<div style="font-family:-apple-system,sans-serif;padding:24px;border-radius:18px;background:linear-gradient(135deg,#f5f7fa,#e4ebf5);color:#1d1d1f;text-align:center;">
  <div style="font-size:12px;font-weight:600;color:#0071e3;margin-bottom:6px;">LIVE DEMO MODULE</div>
  <h2 style="margin:0 0 8px;font-size:20px;">Built with Gamura</h2>
  <p style="margin:0;font-size:13px;color:#6e6e73;">Interactive HTML, CSS & JS running live inside your developer hub.</p>
</div>`,
  },
  {
    name: "Interactive Counter",
    code: `<div style="font-family:-apple-system,sans-serif;padding:22px;background:#ffffff;color:#1d1d1f;text-align:center;border-radius:16px;">
  <p style="font-size:12px;color:#6e6e73;margin:0 0 10px;">Tap counter prototype</p>
  <button id="btn" style="background:#0071e3;color:#fff;border:none;padding:10px 20px;border-radius:12px;font-weight:600;cursor:pointer;">Clicks: 0</button>
  <script>let n=0;const b=document.getElementById('btn');b.onclick=()=>{n++;b.textContent='Clicks: '+n;};</script>
</div>`,
  },
];

const APPLE_FONT: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function BlockPreviewRenderer({
  block,
  onLinkClick,
  compact = false,
}: {
  block: PageBlock;
  onLinkClick?: () => void;
  compact?: boolean;
}) {
  switch (block.type) {
    case "hdr": {
      const initials = (block.name || "SG")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="text-center py-3 space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#1D1D1F] to-zinc-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            {initials || "G"}
          </div>
          <div className="space-y-0.5 px-2">
            <h4 className="text-base font-bold text-[#1D1D1F] tracking-tight">
              {block.name || "Developer Name"}
            </h4>
            {block.bio && (
              <p className="text-xs text-[#6E6E73] leading-relaxed">{block.bio}</p>
            )}
          </div>
        </div>
      );
    }

    case "lnk":
      return (
        <a
          href={block.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkClick}
          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/80 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-sm shrink-0 shadow-2xs">
              {block.icon || "🔗"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                {block.title || "Untitled Link"}
              </div>
              <div className="text-[11px] text-[#6E6E73] truncate">
                {block.url || "https://"}
              </div>
            </div>
          </div>
          <ExternalLink
            size={14}
            className="text-zinc-400 group-hover:text-[#0071E3] transition-colors shrink-0"
          />
        </a>
      );

    case "txt":
      if (block.tt === "h1") {
        return (
          <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight px-1 pt-1">
            {block.content}
          </h3>
        );
      }
      if (block.tt === "h2") {
        return (
          <h4 className="text-sm font-bold text-[#1D1D1F] px-1 pt-0.5">
            {block.content}
          </h4>
        );
      }
      return (
        <p className="text-xs text-[#424245] leading-relaxed px-1 whitespace-pre-line">
          {block.content}
        </p>
      );

    case "img":
      return block.src ? (
        <div className="rounded-2xl overflow-hidden border border-zinc-200/80 bg-[#F5F5F7]">
          <img
            src={block.src}
            alt={block.alt || "Developer showcase"}
            className="w-full max-h-60 object-cover block"
          />
          {block.alt && (
            <div className="px-3 py-1.5 text-[11px] text-[#6E6E73] bg-white border-t border-zinc-100">
              {block.alt}
            </div>
          )}
        </div>
      ) : null;

    case "pdf":
      return (
        <a
          href={block.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkClick}
          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-red-50/70 hover:bg-red-50 border border-red-200/70 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-red-200 text-red-600 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                {block.title || "Resume / Document"}
              </div>
              <div className="text-[11px] text-red-700 font-medium truncate">
                PDF · Tap to view
              </div>
            </div>
          </div>
          <ArrowUpRight size={14} className="text-red-600 shrink-0" />
        </a>
      );

    case "html":
      return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="px-3.5 py-2 bg-[#F5F5F7] border-b border-zinc-200/70 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5 truncate">
              <Code2 size={13} className="text-[#0071E3] shrink-0" />
              <span className="truncate">{block.title || "Code Preview"}</span>
            </span>
            <span className="text-[10px] font-semibold text-[#0071E3] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
              HTML Live
            </span>
          </div>
          <iframe
            title={block.title || "HTML Code Preview"}
            srcDoc={block.code || "<h3>Hello World</h3>"}
            sandbox="allow-scripts"
            className={`w-full border-none bg-white block ${compact ? "h-44" : "h-56"}`}
          />
        </div>
      );

    case "div":
      return <div className="h-px bg-zinc-200/80 my-1.5" />;

    default:
      return null;
  }
}

export default function SelvaranjanGamura({
  onBack,
  embeddedInUniverse = false,
  showToast,
  accentColor = "#0071E3",
}: SelvaranjanGamuraProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>("discover");
  const [authUser, setAuthUser] = useState<any>(() => auth.currentUser);
  const [developersList, setDevelopersList] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");

  // Hero Handle Claimer
  const [heroHandle, setHeroHandle] = useState("");
  const [heroStatus, setHeroStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "reserved" | "invalid"
  >("idle");

  // Studio State (Builder)
  const [studioUsername, setStudioUsername] = useState("");
  const [studioDisplayName, setStudioDisplayName] = useState("");
  const [studioBio, setStudioBio] = useState("");
  const [studioPlan, setStudioPlan] = useState<"Starter" | "Pro" | "GalaxyPass">("Starter");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [published, setPublished] = useState(false);
  const [studioStats, setStudioStats] = useState({
    clicks: 0,
    views: 0,
    visitors: 0,
    engagements: 0,
  });
  const [savingStudio, setSavingStudio] = useState(false);

  // Selected Profile for Public Viewer
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);

  // Add / Edit Block Modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draftBlockType, setDraftBlockType] = useState<BlockType>("lnk");
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftIcon, setDraftIcon] = useState("🔗");
  const [draftContent, setDraftContent] = useState("");
  const [draftTextType, setDraftTextType] = useState<"p" | "h1" | "h2">("p");
  const [draftImgSrc, setDraftImgSrc] = useState("");
  const [draftImgAlt, setDraftImgAlt] = useState("");
  const [draftHtmlCode, setDraftHtmlCode] = useState(HTML_STARTERS[0].code);
  const imgFileRef = useRef<HTMLInputElement | null>(null);

  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNickname, setAuthNickname] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetUsername, setShareTargetUsername] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const notify = (
    ic: string,
    title: string,
    msg: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    if (showToast) {
      showToast(ic, title, msg, type);
    }
  };

  // Real-time Firestore Directory Listener
  useEffect(() => {
    const q = collection(db, "gamura_developers");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as any)
          .filter((d) => d.username && !String(d.username).includes("/"));
        list.sort((a, b) => {
          const pDiff = (b.published ? 1 : 0) - (a.published ? 1 : 0);
          if (pDiff !== 0) return pDiff;
          return (Number(b.views) || 0) - (Number(a.views) || 0);
        });
        setDevelopersList(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "gamura_developers");
      },
    );
    return () => unsub();
  }, []);

  // Firebase Auth Sync & Profile Hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u);
      if (!u) return;

      // Immediate cache hydrate
      try {
        const cached = localStorage.getItem(`gamura_dev_profile_${u.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.username) setStudioUsername(parsed.username);
          if (parsed.displayName) setStudioDisplayName(parsed.displayName);
          if (parsed.bio) setStudioBio(parsed.bio);
          if (Array.isArray(parsed.blocks)) setBlocks(parsed.blocks);
          if (typeof parsed.published === "boolean") setPublished(parsed.published);
          if (parsed.plan) setStudioPlan(parsed.plan);
        }
      } catch {
        // ignore cache failure
      }

      // Live Firestore resolve
      try {
        let matchedData: any = null;
        let matchedUsername = "";

        if (u.email) {
          const byEmail = await getDocs(
            query(collection(db, "gamura_developers"), where("email", "==", u.email)),
          ).catch(() => null);
          if (byEmail && !byEmail.empty) {
            matchedData = byEmail.docs[0].data();
            matchedUsername = matchedData.username || byEmail.docs[0].id;
          }
        }

        if (!matchedUsername) {
          const userSnap = await getDoc(doc(db, "users", u.uid)).catch(() => null);
          if (userSnap && userSnap.exists()) {
            matchedUsername = userSnap.data()?.username || "";
          }
        }

        if (matchedUsername && !matchedData) {
          const devSnap = await getDoc(
            doc(db, "gamura_developers", matchedUsername.toLowerCase()),
          ).catch(() => null);
          if (devSnap && devSnap.exists()) {
            matchedData = devSnap.data();
          }
        }

        if (matchedData) {
          setStudioUsername(matchedData.username || matchedUsername);
          setStudioDisplayName(
            matchedData.displayName || u.displayName || matchedUsername,
          );
          setStudioBio(matchedData.bio || "");
          setBlocks(Array.isArray(matchedData.blocks) ? matchedData.blocks : []);
          setPublished(Boolean(matchedData.published));
          setStudioPlan(matchedData.plan || "Starter");
          setStudioStats({
            clicks: Number(matchedData.clicks) || 0,
            views: Number(matchedData.views) || 0,
            visitors: Number(matchedData.visitors) || 0,
            engagements: Number(matchedData.engagements) || 0,
          });
          localStorage.setItem(
            `gamura_dev_profile_${u.uid}`,
            JSON.stringify(matchedData),
          );
        } else if (matchedUsername) {
          setStudioUsername(matchedUsername);
          setStudioDisplayName(u.displayName || matchedUsername);
        }
      } catch (err) {
        console.warn("Studio profile sync note:", err);
      }
    });
    return () => unsub();
  }, []);

  // Check URL ?u=username parameter on standalone launch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetU = params.get("u")?.trim().toLowerCase();
    if (targetU && developersList.length > 0) {
      const match = developersList.find(
        (d) => String(d.username || "").toLowerCase() === targetU,
      );
      if (match) {
        setViewingProfile(match);
        setActiveTab("viewer");
      }
    }
  }, [developersList]);

  // Real-Time Handle Checker
  useEffect(() => {
    const clean = heroHandle.trim().toLowerCase();
    if (!clean) {
      setHeroStatus("idle");
      return;
    }
    if (clean.length < 2 || !/^[a-z0-9_-]{2,30}$/.test(clean)) {
      setHeroStatus("invalid");
      return;
    }
    if (RESERVED_HANDLES.has(clean)) {
      setHeroStatus("reserved");
      return;
    }

    const dirMatch = developersList.find(
      (d) => String(d.username || "").toLowerCase() === clean,
    );
    if (dirMatch) {
      setHeroStatus(
        authUser?.uid && dirMatch.uid === authUser.uid ? "available" : "taken",
      );
      return;
    }

    let cancelled = false;
    setHeroStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const [unameDoc, devDoc] = await Promise.all([
          getDoc(doc(db, "usernames", clean)).catch(() => null),
          getDoc(doc(db, "gamura_developers", clean)).catch(() => null),
        ]);
        if (cancelled) return;
        const ownedByUname = unameDoc?.exists()
          ? unameDoc.data()?.uid === authUser?.uid
          : true;
        const ownedByDev = devDoc?.exists()
          ? devDoc.data()?.uid === authUser?.uid
          : true;
        if ((unameDoc?.exists() && !ownedByUname) || (devDoc?.exists() && !ownedByDev)) {
          setHeroStatus("taken");
        } else {
          setHeroStatus("available");
        }
      } catch {
        if (!cancelled) setHeroStatus("available");
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [heroHandle, developersList, authUser?.uid]);

  // Computed Network Stats
  const statsSummary = useMemo(() => {
    const total = developersList.length;
    const now = Date.now();
    const active24h = developersList.filter((u) => {
      if (!u.updatedAt) return false;
      const ms = u.updatedAt?.toDate
        ? u.updatedAt.toDate().getTime()
        : typeof u.updatedAt === "number"
          ? u.updatedAt
          : new Date(u.updatedAt).getTime();
      return ms > 0 && now - ms < 24 * 60 * 60 * 1000;
    }).length;
    const totalClicks = developersList.reduce(
      (sum, d) => sum + (Number(d.clicks) || 0),
      0,
    );
    const totalViews = developersList.reduce(
      (sum, d) => sum + (Number(d.views) || 0),
      0,
    );
    return {
      total,
      active24h: Math.max(1, active24h),
      totalClicks,
      totalViews,
    };
  }, [developersList]);

  const filteredDirectory = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    const unique = new Map<string, any>();
    developersList.forEach((d) => {
      const k = String(d.username || "").toLowerCase();
      if (!k) return;
      if (!unique.has(k) || (d.blocks?.length || 0) > (unique.get(k).blocks?.length || 0)) {
        unique.set(k, d);
      }
    });
    return Array.from(unique.values()).filter((d) => {
      if (!q) return true;
      return (
        String(d.username || "").toLowerCase().includes(q) ||
        String(d.displayName || "").toLowerCase().includes(q) ||
        String(d.bio || "").toLowerCase().includes(q)
      );
    });
  }, [developersList, directorySearch]);

  // Unique Username Generator helper for seamless Google Auth
  const findAvailableHandle = async (seedRaw: string) => {
    let seed = seedRaw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (seed.length < 3) seed = `${seed || "dev"}2026`;
    let candidate = seed;
    let idx = 1;
    while (idx < 20) {
      if (!RESERVED_HANDLES.has(candidate)) {
        const [uDoc, dDoc] = await Promise.all([
          getDoc(doc(db, "usernames", candidate)).catch(() => null),
          getDoc(doc(db, "gamura_developers", candidate)).catch(() => null),
        ]);
        if (!uDoc?.exists() && !dDoc?.exists()) return candidate;
      }
      candidate = `${seed}${idx}`;
      idx++;
    }
    return `${seed}_${Date.now().toString().slice(-4)}`;
  };

  // Provision developer docs after Auth
  const ensureDeveloperDocsForUser = async (
    u: any,
    preferredHandle?: string,
    nick?: string,
  ) => {
    const email = u.email || "";
    let resolvedHandle = "";

    const byEmail = email
      ? await getDocs(
          query(collection(db, "gamura_developers"), where("email", "==", email)),
        ).catch(() => null)
      : null;

    if (byEmail && !byEmail.empty) {
      const existingData = byEmail.docs[0].data();
      resolvedHandle = existingData.username || byEmail.docs[0].id;
      setStudioUsername(resolvedHandle);
      setStudioDisplayName(existingData.displayName || u.displayName || resolvedHandle);
      setStudioBio(existingData.bio || "");
      setBlocks(Array.isArray(existingData.blocks) ? existingData.blocks : []);
      setPublished(Boolean(existingData.published));
      return;
    }

    const userDoc = await getDoc(doc(db, "users", u.uid)).catch(() => null);
    if (userDoc?.exists() && userDoc.data()?.username) {
      resolvedHandle = userDoc.data().username;
    } else if (preferredHandle && /^[a-z0-9_-]{3,24}$/i.test(preferredHandle)) {
      const clean = preferredHandle.toLowerCase();
      const [uDoc, dDoc] = await Promise.all([
        getDoc(doc(db, "usernames", clean)).catch(() => null),
        getDoc(doc(db, "gamura_developers", clean)).catch(() => null),
      ]);
      if (!uDoc?.exists() && !dDoc?.exists() && !RESERVED_HANDLES.has(clean)) {
        resolvedHandle = clean;
      }
    }

    if (!resolvedHandle) {
      const seed = email ? email.split("@")[0] : u.displayName || "dev";
      resolvedHandle = await findAvailableHandle(seed);
    }

    const handleLower = resolvedHandle.toLowerCase();
    await setDoc(doc(db, "usernames", handleLower), { uid: u.uid }, { merge: true }).catch(
      () => null,
    );
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        email,
        username: handleLower,
        nickname: nick || u.displayName || handleLower,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      },
      { merge: true },
    ).catch(() => null);

    const newProfile = {
      username: handleLower,
      displayName: nick || u.displayName || handleLower,
      email: email || `${handleLower}@gamura.app`,
      uid: u.uid,
      blocks: [
        {
          id: `b_${Date.now()}`,
          type: "hdr",
          name: nick || u.displayName || handleLower,
          bio: "Developer & Creator on Gamura Universe",
        },
      ],
      published: true,
      plan: "Starter",
      clicks: 0,
      views: 1,
      visitors: 1,
      engagements: 1,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "gamura_developers", handleLower), newProfile, {
      merge: true,
    }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${handleLower}`),
    );

    setStudioUsername(handleLower);
    setStudioDisplayName(newProfile.displayName);
    setBlocks(newProfile.blocks as PageBlock[]);
    setPublished(true);
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureDeveloperDocsForUser(
        cred.user,
        heroHandle || authUsername || studioUsername,
      );
      setAuthModalOpen(false);
      setActiveTab("studio");
      notify("✅", "Signed In with Google", "Your Developer Studio is ready.", "success");
    } catch (err: any) {
      const msg =
        err?.code === "auth/popup-closed-by-user"
          ? "Sign-in popup closed. Try again when ready."
          : err?.message || "Google authentication failed.";
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (authMode === "signup") {
        const cleanHandle = (authUsername || heroHandle)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "");
        if (cleanHandle.length < 3 || RESERVED_HANDLES.has(cleanHandle)) {
          setAuthError("Choose a valid handle (3–24 characters, letters/numbers/_/-).");
          setAuthBusy(false);
          return;
        }
        const [uSnap, dSnap] = await Promise.all([
          getDoc(doc(db, "usernames", cleanHandle)).catch(() => null),
          getDoc(doc(db, "gamura_developers", cleanHandle)).catch(() => null),
        ]);
        if (uSnap?.exists() || dSnap?.exists()) {
          setAuthError(`@${cleanHandle} is already taken. Choose another handle.`);
          setAuthBusy(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword,
        );
        await ensureDeveloperDocsForUser(
          cred.user,
          cleanHandle,
          authNickname.trim() || cleanHandle,
        );
        setAuthModalOpen(false);
        setActiveTab("studio");
        notify("🎉", "Developer Hub Created", `@${cleanHandle} is now yours!`, "success");
      } else {
        let loginIdentifier = authEmail.trim();
        if (!loginIdentifier.includes("@")) {
          const handleKey = loginIdentifier.toLowerCase();
          const devDoc = await getDoc(doc(db, "gamura_developers", handleKey)).catch(
            () => null,
          );
          if (devDoc?.exists() && devDoc.data()?.email) {
            loginIdentifier = devDoc.data().email;
          } else {
            const unameDoc = await getDoc(doc(db, "usernames", handleKey)).catch(
              () => null,
            );
            const uid = unameDoc?.exists() ? unameDoc.data()?.uid : null;
            const userDoc = uid
              ? await getDoc(doc(db, "users", uid)).catch(() => null)
              : null;
            loginIdentifier =
              userDoc?.exists() && userDoc.data()?.email
                ? userDoc.data().email
                : `${handleKey}@gamura.app`;
          }
        }
        const cred = await signInWithEmailAndPassword(auth, loginIdentifier, authPassword);
        await ensureDeveloperDocsForUser(cred.user);
        setAuthModalOpen(false);
        setActiveTab("studio");
        notify("✅", "Signed In", "Welcome back to Join Selvaranjan Studio.", "success");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please check details.");
    } finally {
      setAuthBusy(false);
    }
  };

  // Persist Studio State to Firestore
  const saveStudioToFirestore = async (
    nextBlocks: PageBlock[],
    nextPublished: boolean,
    nextPlan: "Starter" | "Pro" | "GalaxyPass" = studioPlan,
    showSuccessToast = true,
  ) => {
    const cleanHandle = studioUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanHandle || cleanHandle.length < 2) {
      notify("⚠️", "Handle Required", "Enter a valid @username first.", "warning");
      return;
    }
    if (!auth.currentUser) {
      setAuthUsername(cleanHandle);
      setAuthModalOpen(true);
      notify("🔐", "Sign In to Publish", "Sign in to lock your page on Firestore.", "info");
      return;
    }

    setSavingStudio(true);
    try {
      const payload = {
        username: cleanHandle,
        displayName: studioDisplayName.trim() || auth.currentUser.displayName || cleanHandle,
        bio: studioBio.trim(),
        email: auth.currentUser.email || `${cleanHandle}@gamura.app`,
        uid: auth.currentUser.uid,
        blocks: nextBlocks,
        published: nextPublished,
        plan: nextPlan,
        clicks: studioStats.clicks,
        views: Math.max(1, studioStats.views),
        visitors: Math.max(1, studioStats.visitors),
        engagements: studioStats.engagements + 1,
        updatedAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(db, "gamura_developers", cleanHandle), payload, { merge: true }).catch(
          (err) =>
            handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${cleanHandle}`),
        ),
        setDoc(doc(db, "gamura_developers", auth.currentUser.uid), payload, {
          merge: true,
        }).catch(() => null),
        setDoc(doc(db, "usernames", cleanHandle), { uid: auth.currentUser.uid }, { merge: true }).catch(
          () => null,
        ),
      ]);

      localStorage.setItem(
        `gamura_dev_profile_${auth.currentUser.uid}`,
        JSON.stringify({ ...payload, updatedAt: Date.now() }),
      );

      setStudioUsername(cleanHandle);
      setPublished(nextPublished);
      if (showSuccessToast) {
        notify(
          nextPublished ? "🚀" : "💾",
          nextPublished ? "Hub Published Live" : "Draft Saved",
          nextPublished
            ? `gamura.vercel.app/@${cleanHandle} is updated.`
            : "Your changes are saved in Studio.",
          "success",
        );
      }
    } finally {
      setSavingStudio(false);
    }
  };

  // Block Modal Helpers
  const openCreateBlockModal = (type: BlockType) => {
    if (type === "div") {
      const next = [...blocks, { id: `b_${Date.now()}`, type: "div" as const }];
      setBlocks(next);
      if (auth.currentUser && studioUsername) {
        saveStudioToFirestore(next, published, studioPlan, false);
      }
      notify("✓", "Divider Added", "Separator block added.", "success");
      return;
    }
    setEditingBlockId(null);
    setDraftBlockType(type);
    setDraftName(studioDisplayName || studioUsername || "Developer");
    setDraftBio(studioBio || "Building on Gamura Universe");
    setDraftTitle("");
    setDraftUrl("");
    setDraftIcon("🔗");
    setDraftContent("");
    setDraftTextType("p");
    setDraftImgSrc("");
    setDraftImgAlt("");
    setDraftHtmlCode(HTML_STARTERS[0].code);
    setBlockModalOpen(true);
  };

  const openEditBlockModal = (b: PageBlock) => {
    setEditingBlockId(b.id);
    setDraftBlockType(b.type);
    setDraftName(b.name || "");
    setDraftBio(b.bio || "");
    setDraftTitle(b.title || "");
    setDraftUrl(b.url || "");
    setDraftIcon(b.icon || "🔗");
    setDraftContent(b.content || "");
    setDraftTextType(b.tt || "p");
    setDraftImgSrc(b.src || "");
    setDraftImgAlt(b.alt || "");
    setDraftHtmlCode(b.code || HTML_STARTERS[0].code);
    setBlockModalOpen(true);
  };

  const handleSaveBlockModal = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: PageBlock = {
      id: editingBlockId || `b_${Date.now()}`,
      type: draftBlockType,
    };

    if (draftBlockType === "hdr") {
      newBlock.name = draftName.trim() || "Developer";
      newBlock.bio = draftBio.trim();
    } else if (draftBlockType === "lnk") {
      let cleanUrl = draftUrl.trim();
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
      newBlock.title = draftTitle.trim() || "Link";
      newBlock.url = cleanUrl || "https://gamura.vercel.app";
      newBlock.icon = draftIcon || "🔗";
    } else if (draftBlockType === "txt") {
      newBlock.content = draftContent.trim();
      newBlock.tt = draftTextType;
    } else if (draftBlockType === "img") {
      newBlock.src = draftImgSrc.trim();
      newBlock.alt = draftImgAlt.trim();
    } else if (draftBlockType === "pdf") {
      let cleanPdf = draftUrl.trim();
      if (cleanPdf && !/^https?:\/\//i.test(cleanPdf)) cleanPdf = `https://${cleanPdf}`;
      newBlock.title = draftTitle.trim() || "Resume.pdf";
      newBlock.url = cleanPdf;
    } else if (draftBlockType === "html") {
      newBlock.title = draftTitle.trim() || "HTML Prototype";
      newBlock.code = draftHtmlCode;
    }

    const next = editingBlockId
      ? blocks.map((b) => (b.id === editingBlockId ? newBlock : b))
      : [...blocks, newBlock];

    setBlocks(next);
    setBlockModalOpen(false);
    if (auth.currentUser && studioUsername) {
      saveStudioToFirestore(next, published, studioPlan, false);
    }
    notify("✓", editingBlockId ? "Block Updated" : "Block Added", "Preview synced.", "success");
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    if (auth.currentUser && studioUsername) {
      saveStudioToFirestore(next, published, studioPlan, false);
    }
  };

  const removeBlock = (id: string) => {
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    if (auth.currentUser && studioUsername) {
      saveStudioToFirestore(next, published, studioPlan, false);
    }
  };

  const handleCompressImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 720 / img.width);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDraftImgSrc(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openDeveloperViewer = async (dev: any) => {
    setViewingProfile(dev);
    setActiveTab("viewer");
    const uname = String(dev.username || dev.id || "").toLowerCase();
    const currentUid = auth.currentUser?.uid;
    if (
      uname &&
      currentUid &&
      (dev.uid === currentUid || dev.email === auth.currentUser?.email)
    ) {
      await updateDoc(doc(db, "gamura_developers", uname), {
        views: increment(1),
        visitors: increment(1),
        engagements: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => null);
    }
  };

  const handleRecordViewerClick = () => {
    const target = viewingProfile?.username;
    const currentUid = auth.currentUser?.uid;
    if (
      target &&
      currentUid &&
      (viewingProfile?.uid === currentUid ||
        viewingProfile?.email === auth.currentUser?.email)
    ) {
      updateDoc(doc(db, "gamura_developers", String(target).toLowerCase()), {
        clicks: increment(1),
        engagements: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => null);
    }
  };

  const handleClaimHeroUrl = () => {
    const clean = heroHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!clean) {
      setActiveTab("studio");
      return;
    }
    if (heroStatus === "taken" || heroStatus === "reserved" || heroStatus === "invalid") {
      notify("⚠️", "Handle Unavailable", "Choose an available @username first.", "warning");
      return;
    }
    setStudioUsername(clean);
    if (!authUser) {
      setAuthUsername(clean);
      setAuthMode("signup");
      setAuthModalOpen(true);
    } else {
      setActiveTab("studio");
      if (blocks.length === 0) {
        setBlocks([
          {
            id: `b_${Date.now()}`,
            type: "hdr",
            name: studioDisplayName || clean,
            bio: "Developer Hub powered by Gamura",
          },
        ]);
      }
      notify("✨", "Handle Loaded", `@${clean} is loaded into Studio.`, "success");
    }
  };

  const handleOpenShare = (uname: string) => {
    setShareTargetUsername(uname || studioUsername || "selvaranjan");
    setShareModalOpen(true);
  };

  const copyShareUrl = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    notify("✓", "Copied", "URL copied to clipboard.", "success");
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const shareFullLocal = `${typeof window !== "undefined" ? window.location.origin : ""}/@${shareTargetUsername}`;
  const shareProdUrl = `https://gamura.vercel.app/@${shareTargetUsername}`;

  return (
    <div
      style={APPLE_FONT}
      className={
        embeddedInUniverse
          ? "w-full space-y-4 text-[#1D1D1F] pb-8"
          : "min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col"
      }
    >
      {/* Top Frosted Navigation Bar (Standalone or Embedded Control Strip) */}
      {!embeddedInUniverse ? (
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-zinc-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 truncate">
                <div
                  className="w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <Compass size={14} />
                </div>
                <span className="text-sm font-bold tracking-tight truncate">
                  Join Selvaranjan on Gamura
                </span>
              </div>
            </div>

            {/* Center Segmented Mode Tabs */}
            <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-full p-1 gap-0.5">
              {(
                [
                  { id: "discover", label: "Explore" },
                  { id: "studio", label: "Studio" },
                  ...(viewingProfile ? [{ id: "viewer", label: `@${viewingProfile.username}` }] : []),
                ] as { id: StudioTab; label: string }[]
              ).map((t) => {
                const isAct = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`relative px-3.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isAct ? "text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }`}
                  >
                    {isAct && (
                      <motion.span
                        layoutId="join-selva-tab-standalone"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {authUser ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("studio")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                >
                  <User size={13} />
                  <span className="hidden sm:inline">
                    @{studioUsername || authUser.email?.split("@")[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthModalOpen(true);
                  }}
                  style={{ backgroundColor: accentColor }}
                  className="px-3.5 py-1.5 rounded-full text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>
      ) : (
        /* Embedded inside Universe Header Card */
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
                Join Selvaranjan on Gamura
              </h2>
              <p className="text-xs text-[#6E6E73] truncate mt-0.5">
                Claim your permanent @handle, showcase HTML previews &amp; connect with builders
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-full p-1 gap-0.5">
              {(
                [
                  { id: "discover", label: "Explore Network" },
                  { id: "studio", label: "My Studio" },
                  ...(viewingProfile
                    ? [{ id: "viewer", label: `@${viewingProfile.username}` }]
                    : []),
                ] as { id: StudioTab; label: string }[]
              ).map((t) => {
                const isAct = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isAct ? "text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }`}
                  >
                    {isAct && (
                      <motion.span
                        layoutId="join-selva-tab-embedded"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {!authUser ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthModalOpen(true);
                }}
                style={{ backgroundColor: accentColor }}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Sign In / Claim
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenShare(studioUsername)}
                className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
              >
                <Share2 size={13} />
                <span>Share @{studioUsername || "hub"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={
          embeddedInUniverse
            ? "w-full space-y-4"
            : "flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6"
        }
      >
        <AnimatePresence mode="wait">
          {/* VIEW 1: DISCOVER & CLAIM */}
          {activeTab === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* Apple Hero Claimer Card */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center space-y-6">
                <div className="space-y-2 max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[11px] font-semibold text-[#0071E3]">
                    <Sparkles size={12} />
                    <span>Gamura Developer Network · Free Forever</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] leading-[1.12]">
                    Your Developer Identity, Designed Like Apple.
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                    Claim your clean <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded text-[#1D1D1F]">gamura.vercel.app/@handle</code> page with interactive HTML previews, PDF resumes, and real-time analytics.
                  </p>
                </div>

                {/* Live URL Checker Pill */}
                <div className="max-w-xl mx-auto space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F5F5F7] border border-zinc-200/90 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <div className="flex items-center flex-1 min-w-0 px-3 py-2">
                      <span className="text-xs sm:text-sm font-medium text-[#6E6E73] select-none shrink-0">
                        gamura.vercel.app/@
                      </span>
                      <input
                        type="text"
                        value={heroHandle}
                        onChange={(e) =>
                          setHeroHandle(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                          )
                        }
                        placeholder="yourname"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-[#1D1D1F] ml-0.5 min-w-0"
                      />
                      <div className="shrink-0 ml-2 flex items-center">
                        {heroStatus === "checking" && (
                          <Loader2 size={15} className="animate-spin text-[#6E6E73]" />
                        )}
                        {heroStatus === "available" && (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        )}
                        {(heroStatus === "taken" ||
                          heroStatus === "reserved" ||
                          heroStatus === "invalid") && (
                          <XCircle size={16} className="text-red-500" />
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimHeroUrl}
                      style={{ backgroundColor: accentColor }}
                      className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shrink-0 shadow-xs"
                    >
                      {heroHandle ? `Claim @${heroHandle}` : "Open Page Studio"}
                    </button>
                  </div>

                  {heroStatus === "available" && (
                    <p className="text-xs font-medium text-emerald-700">
                      @{heroHandle} is available — claim it free right now.
                    </p>
                  )}
                  {heroStatus === "taken" && (
                    <p className="text-xs font-medium text-red-600">
                      @{heroHandle} is already claimed by a member.
                    </p>
                  )}
                  {heroStatus === "reserved" && (
                    <p className="text-xs font-medium text-red-600">
                      @{heroHandle} is a reserved Gamura system route.
                    </p>
                  )}
                  {heroStatus === "invalid" && (
                    <p className="text-xs font-medium text-amber-700">
                      Use 2–30 lowercase letters, numbers, underscores, or hyphens.
                    </p>
                  )}
                </div>

                {/* Live Firestore Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-3xl mx-auto text-left">
                  {[
                    {
                      label: "Developers Joined",
                      value: statsSummary.total.toLocaleString(),
                      icon: <Users size={15} style={{ color: accentColor }} />,
                    },
                    {
                      label: "Active (24h)",
                      value: statsSummary.active24h.toLocaleString(),
                      icon: <Sparkles size={15} className="text-emerald-600" />,
                    },
                    {
                      label: "Link Clicks",
                      value: statsSummary.totalClicks.toLocaleString(),
                      icon: <MousePointerClick size={15} className="text-indigo-600" />,
                    },
                    {
                      label: "Profile Views",
                      value: statsSummary.totalViews.toLocaleString(),
                      icon: <Eye size={15} className="text-amber-600" />,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#6E6E73]">
                          {stat.label}
                        </span>
                        {stat.icon}
                      </div>
                      <div className="text-xl font-bold text-[#1D1D1F] tabular-nums">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Developers Directory */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#1D1D1F]">
                      Active Gamura Developer Hubs
                    </h3>
                    <p className="text-xs text-[#6E6E73]">
                      Browse real member pages synced live from Firestore — tap any card to preview.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                    />
                    <input
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Search @handle or bio..."
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3]"
                    />
                  </div>
                </div>

                {filteredDirectory.length === 0 ? (
                  <div className="py-10 text-center bg-[#F5F5F7] rounded-2xl border border-dashed border-zinc-200 space-y-2">
                    <p className="text-xs font-semibold text-[#1D1D1F]">
                      No matching developer profiles
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("studio")}
                      style={{ backgroundColor: accentColor }}
                      className="px-4 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer"
                    >
                      Launch Page Studio
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredDirectory.slice(0, 12).map((dev) => {
                      const initials = String(dev.displayName || dev.username || "G")
                        .slice(0, 2)
                        .toUpperCase();
                      const blockCount = Array.isArray(dev.blocks) ? dev.blocks.length : 0;
                      return (
                        <motion.div
                          key={dev.id}
                          whileHover={{ y: -2 }}
                          transition={{ type: "spring", stiffness: 420, damping: 28 }}
                          className="p-4 rounded-2xl bg-[#F5F5F7] hover:bg-white border border-zinc-200/70 hover:border-zinc-300 transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                              style={{ backgroundColor: accentColor }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-[#1D1D1F] truncate">
                                  {dev.displayName || dev.username}
                                </span>
                                {dev.published && (
                                  <CheckCircle2
                                    size={13}
                                    className="text-emerald-600 shrink-0"
                                  />
                                )}
                              </div>
                              <div
                                className="text-xs font-medium truncate"
                                style={{ color: accentColor }}
                              >
                                /@{dev.username}
                              </div>
                              <p className="text-[11px] text-[#6E6E73] line-clamp-2 mt-1">
                                {dev.bio ||
                                  (blockCount > 0
                                    ? `${blockCount} custom page blocks live`
                                    : "Gamura Developer Member")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/70">
                            <span className="text-[11px] text-[#6E6E73] tabular-nums">
                              {dev.views || 0} views · {dev.clicks || 0} clicks
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openDeveloperViewer(dev)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-[11px] font-semibold text-[#1D1D1F] cursor-pointer"
                              >
                                Preview
                              </button>
                              <a
                                href={`/@${dev.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-[#6E6E73] hover:text-[#0071E3]"
                                title={`Open /@${dev.username}`}
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Membership Tiers (Starter / Pro / GalaxyPass) */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Creator Pass Tiers
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Select your active badge plan inside Studio — free for all Gamura community builders.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: "Starter" as const,
                      price: "Free",
                      desc: "Essential personal hub, /@handle URL & analytics.",
                      features: [
                        "Lifetime /@username route",
                        "Unlimited link & text blocks",
                        "QR share sheet",
                      ],
                    },
                    {
                      id: "Pro" as const,
                      price: "Creator",
                      desc: "Interactive HTML Code Previews, PDF resumes & custom showcase.",
                      features: [
                        "Sandboxed HTML/JS Playground",
                        "Resume / PDF embed cards",
                        "Priority directory placement",
                      ],
                    },
                    {
                      id: "GalaxyPass" as const,
                      price: "Founder",
                      desc: "Full Ecosystem Identity across Selvaranjan Network & Universe.",
                      features: [
                        "Verified Universe badge",
                        "Synced with Gamura Neutral Link",
                        "Custom block studio export",
                      ],
                    },
                  ].map((tier) => {
                    const isSelected = studioPlan === tier.id;
                    return (
                      <div
                        key={tier.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                          isSelected
                            ? "bg-blue-50/50 border-[#0071E3]"
                            : "bg-[#F5F5F7] border-zinc-200/80"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#1D1D1F]">
                              {tier.id}
                            </span>
                            <span className="text-xs font-semibold text-[#0071E3] bg-white px-2.5 py-0.5 rounded-full border border-zinc-200/70">
                              {tier.price}
                            </span>
                          </div>
                          <p className="text-xs text-[#6E6E73] leading-snug">
                            {tier.desc}
                          </p>
                          <ul className="space-y-1.5 pt-1">
                            {tier.features.map((f) => (
                              <li
                                key={f}
                                className="text-[11px] text-[#424245] flex items-center gap-1.5"
                              >
                                <Check size={12} className="text-emerald-600 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStudioPlan(tier.id);
                            setActiveTab("studio");
                            if (auth.currentUser && studioUsername) {
                              saveStudioToFirestore(blocks, published, tier.id, true);
                            } else {
                              notify("✨", `${tier.id} Selected`, "Opened Page Studio.", "info");
                            }
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#1D1D1F] text-white"
                              : "bg-white hover:bg-zinc-100 border border-zinc-200 text-[#1D1D1F]"
                          }`}
                        >
                          {isSelected ? "Active in Studio" : `Use ${tier.id}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: PAGE STUDIO (INTERACTIVE BLOCK BUILDER + MOBILE PREVIEW) */}
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* Studio Control Header */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-[#0071E3]">
                    <span className="text-xs font-medium text-[#6E6E73]">/@</span>
                    <input
                      value={studioUsername}
                      onChange={(e) =>
                        setStudioUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                        )
                      }
                      placeholder="yourhandle"
                      className="bg-transparent border-none outline-none text-xs font-bold text-[#1D1D1F] w-36 ml-0.5"
                    />
                  </div>
                  <input
                    value={studioDisplayName}
                    onChange={(e) => setStudioDisplayName(e.target.value)}
                    placeholder="Display Name"
                    className="bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] w-44"
                  />
                  <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-[11px] font-semibold text-[#1D1D1F]">
                    Plan: {studioPlan}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {authUser ? (
                    <button
                      type="button"
                      onClick={() => firebaseSignOut(auth)}
                      className="px-3 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signin");
                        setAuthModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Lock size={13} />
                      <span>Sign In</span>
                    </button>
                  )}

                  {studioUsername && (
                    <button
                      type="button"
                      onClick={() => handleOpenShare(studioUsername)}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <QrCode size={13} />
                      <span>Share</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={savingStudio}
                    onClick={() => saveStudioToFirestore(blocks, true, studioPlan, true)}
                    style={{ backgroundColor: accentColor }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                  >
                    {savingStudio ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>{savingStudio ? "Publishing..." : published ? "Publish Updates" : "Publish Live"}</span>
                  </button>
                </div>
              </div>

              {/* Studio Split Canvas: Left Controls + Right Live iPhone Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left Column: Block Tools & Ordered Block List */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Quick Bio & Stats Strip */}
                  <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F]">
                        Add Content Blocks
                      </span>
                      <span className="text-[11px] text-[#6E6E73] tabular-nums">
                        {blocks.length} blocks · {studioStats.views} views · {studioStats.clicks} clicks
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: "hdr" as const, label: "Header", icon: <User size={14} /> },
                        { type: "lnk" as const, label: "Link", icon: <ExternalLink size={14} /> },
                        { type: "txt" as const, label: "Text", icon: <Type size={14} /> },
                        { type: "img" as const, label: "Image", icon: <ImageIcon size={14} /> },
                        { type: "pdf" as const, label: "Resume PDF", icon: <FileText size={14} /> },
                        { type: "html" as const, label: "HTML Code", icon: <Code2 size={14} /> },
                        { type: "div" as const, label: "Divider", icon: <Minus size={14} /> },
                      ].map((tool) => (
                        <button
                          key={tool.type}
                          type="button"
                          onClick={() => openCreateBlockModal(tool.type)}
                          className="p-2.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/70 flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          <span style={{ color: accentColor }}>{tool.icon}</span>
                          <span>{tool.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ordered Blocks Editor */}
                  <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1D1D1F]">
                        Page Layers ({blocks.length})
                      </h4>
                      {studioUsername && (
                        <a
                          href={`/@${studioUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                          style={{ color: accentColor }}
                        >
                          <span>Open /@{studioUsername}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    {blocks.length === 0 ? (
                      <div className="py-10 text-center bg-[#F5F5F7] border border-dashed border-zinc-200 rounded-2xl space-y-2">
                        <Layers size={24} className="mx-auto text-zinc-400" />
                        <p className="text-xs text-[#6E6E73]">
                          Add a Header, Link, HTML Playground, or Resume PDF above to start building your page.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {blocks.map((b, idx) => {
                          const summary =
                            b.type === "hdr"
                              ? b.name || "Profile Header"
                              : b.type === "lnk"
                                ? b.title || b.url
                                : b.type === "txt"
                                  ? b.content
                                  : b.type === "pdf"
                                    ? b.title || "Resume PDF"
                                    : b.type === "html"
                                      ? b.title || "HTML Preview"
                                      : b.type === "img"
                                        ? b.alt || "Showcase Image"
                                        : "Divider Line";
                          return (
                            <div
                              key={b.id}
                              className="p-3 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                                  {b.type}
                                </div>
                                <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                                  {summary}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveBlock(idx, -1)}
                                  className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 disabled:opacity-30 cursor-pointer"
                                  aria-label="Move up"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === blocks.length - 1}
                                  onClick={() => moveBlock(idx, 1)}
                                  className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 disabled:opacity-30 cursor-pointer"
                                  aria-label="Move down"
                                >
                                  <ArrowDown size={13} />
                                </button>
                                {b.type !== "div" && (
                                  <button
                                    type="button"
                                    onClick={() => openEditBlockModal(b)}
                                    className="p-1.5 rounded-lg bg-white border border-zinc-200 text-[#0071E3] cursor-pointer"
                                    aria-label="Edit block"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeBlock(b.id)}
                                  className="p-1.5 rounded-lg bg-white border border-zinc-200 text-red-600 cursor-pointer"
                                  aria-label="Delete block"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Apple Mobile Device Preview */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-[360px] bg-white border border-zinc-200/90 rounded-[36px] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.06)] space-y-3">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-zinc-100">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6E6E73]">
                        <Smartphone size={12} />
                        <span>Live Preview</span>
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#0071E3] truncate">
                        /@{studioUsername || "yourname"}
                      </span>
                    </div>

                    <div className="min-h-[360px] max-h-[520px] overflow-y-auto no-scrollbar space-y-2.5 pr-0.5">
                      {blocks.length === 0 ? (
                        <div className="py-20 text-center text-xs text-[#6E6E73]">
                          Live preview updates here as you add blocks.
                        </div>
                      ) : (
                        blocks.map((b) => (
                          <BlockPreviewRenderer key={b.id} block={b} compact />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 3: PUBLIC PROFILE VIEWER */}
          {activeTab === "viewer" && viewingProfile && (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-lg mx-auto space-y-4"
            >
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>All Developers</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenShare(viewingProfile.username)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Share2 size={12} />
                      <span>Share</span>
                    </button>
                    <a
                      href={`/@${viewingProfile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: accentColor }}
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Full</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Header if no explicit hdr block */}
                {!viewingProfile.blocks?.some((b: any) => b.type === "hdr") && (
                  <div className="text-center py-2 space-y-1.5">
                    <div
                      className="w-16 h-16 mx-auto rounded-full text-white font-bold text-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {String(viewingProfile.displayName || viewingProfile.username || "G")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <h3 className="text-xl font-bold text-[#1D1D1F]">
                      {viewingProfile.displayName || viewingProfile.username}
                    </h3>
                    <p className="text-xs font-medium" style={{ color: accentColor }}>
                      @{viewingProfile.username}
                    </p>
                    {viewingProfile.bio && (
                      <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
                        {viewingProfile.bio}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {Array.isArray(viewingProfile.blocks) && viewingProfile.blocks.length > 0 ? (
                    viewingProfile.blocks.map((b: PageBlock, i: number) => (
                      <BlockPreviewRenderer
                        key={b.id || i}
                        block={b}
                        onLinkClick={handleRecordViewerClick}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center bg-[#F5F5F7] rounded-2xl text-xs text-[#6E6E73]">
                      This member has reserved @{viewingProfile.username} on Gamura.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-[#6E6E73] tabular-nums">
                  <span>Plan: {viewingProfile.plan || "Starter"}</span>
                  <span>
                    {viewingProfile.views || 0} views · {viewingProfile.clicks || 0} clicks
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BLOCK ADD/EDIT MODAL */}
      <AnimatePresence>
        {blockModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1050] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setBlockModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden text-[#1D1D1F]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-base font-bold">
                  {editingBlockId ? "Edit Block" : "Add Content Block"}
                </h3>
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveBlockModal} className="p-6 space-y-4">
                {draftBlockType === "hdr" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Full Name / Heading</label>
                      <input
                        required
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Short Bio</label>
                      <textarea
                        rows={2}
                        value={draftBio}
                        onChange={(e) => setDraftBio(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3] resize-none"
                      />
                    </div>
                  </>
                )}

                {draftBlockType === "lnk" && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {LINK_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => {
                            setDraftIcon(tpl.icon);
                            setDraftTitle(tpl.title);
                            setDraftUrl(tpl.url);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200 text-[11px] font-semibold cursor-pointer"
                        >
                          {tpl.icon} {tpl.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Icon</label>
                        <input
                          value={draftIcon}
                          onChange={(e) => setDraftIcon(e.target.value)}
                          className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3 py-2 text-center text-sm outline-none"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-xs font-semibold">Button Label</label>
                        <input
                          required
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="My GitHub"
                          className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Destination URL</label>
                      <input
                        required
                        value={draftUrl}
                        onChange={(e) => setDraftUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                    </div>
                  </>
                )}

                {draftBlockType === "txt" && (
                  <>
                    <div className="flex bg-[#F5F5F7] rounded-xl p-1 gap-1">
                      {(["p", "h1", "h2"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraftTextType(t)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                            draftTextType === t ? "bg-white shadow-xs" : "text-[#6E6E73]"
                          }`}
                        >
                          {t === "p" ? "Paragraph" : t}
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      rows={4}
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder="Write a note, update, or section header..."
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3] resize-none"
                    />
                  </>
                )}

                {draftBlockType === "img" && (
                  <>
                    <input
                      ref={imgFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCompressImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imgFileRef.current?.click()}
                      className="w-full py-3 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-dashed border-zinc-300 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload Image File</span>
                    </button>
                    <input
                      value={draftImgSrc}
                      onChange={(e) => setDraftImgSrc(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:bg-white focus:border-[#0071E3]"
                    />
                    <input
                      value={draftImgAlt}
                      onChange={(e) => setDraftImgAlt(e.target.value)}
                      placeholder="Caption (optional)"
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:bg-white focus:border-[#0071E3]"
                    />
                  </>
                )}

                {draftBlockType === "pdf" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Document Title</label>
                      <input
                        required
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Selvaranjan Resume 2026"
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">PDF Link URL</label>
                      <input
                        required
                        value={draftUrl}
                        onChange={(e) => setDraftUrl(e.target.value)}
                        placeholder="https://example.com/resume.pdf"
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                    </div>
                  </>
                )}

                {draftBlockType === "html" && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {HTML_STARTERS.map((st) => (
                        <button
                          key={st.name}
                          type="button"
                          onClick={() => setDraftHtmlCode(st.code)}
                          className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200 text-[11px] font-semibold cursor-pointer"
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                    <input
                      required
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Widget Title"
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                    />
                    <textarea
                      required
                      rows={6}
                      value={draftHtmlCode}
                      onChange={(e) => setDraftHtmlCode(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:bg-white focus:border-[#0071E3]"
                    />
                  </>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setBlockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: accentColor }}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer"
                  >
                    {editingBlockId ? "Save Block" : "Add Block"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPLE SIGN-IN / CREATE PAGE MODAL */}
      <AnimatePresence>
        {authModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1060] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAuthModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden text-[#1D1D1F]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">
                    {authMode === "signup"
                      ? "Claim Your Gamura Hub"
                      : "Sign In to Join Selvaranjan"}
                  </h3>
                  <p className="text-[11px] text-[#6E6E73]">
                    Sync your developer profile across Gamura Universe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe size={15} className="text-[#0071E3]" />
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] text-[#6E6E73]">
                  <span className="h-px bg-zinc-200 flex-1" />
                  <span>or email / @handle</span>
                  <span className="h-px bg-zinc-200 flex-1" />
                </div>

                <div className="flex bg-[#F5F5F7] rounded-xl p-1">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setAuthMode(m);
                        setAuthError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        authMode === m ? "bg-white shadow-xs text-[#1D1D1F]" : "text-[#6E6E73]"
                      }`}
                    >
                      {m === "signin" ? "Sign In" : "Create New Page"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                  {authMode === "signup" && (
                    <>
                      <input
                        required
                        value={authUsername}
                        onChange={(e) =>
                          setAuthUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                          )
                        }
                        placeholder="Handle (e.g. selvaranjan)"
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                      <input
                        value={authNickname}
                        onChange={(e) => setAuthNickname(e.target.value)}
                        placeholder="Display Name"
                        className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                      />
                    </>
                  )}
                  <input
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={
                      authMode === "signin" ? "Email or @handle" : "Email address"
                    }
                    className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-[#0071E3]"
                  />

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authBusy}
                    style={{ backgroundColor: accentColor }}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {authBusy && <Loader2 size={14} className="animate-spin" />}
                    <span>
                      {authMode === "signup" ? "Create & Claim Page" : "Sign In"}
                    </span>
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE SHEET MODAL */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1070] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShareModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl shadow-2xl p-6 text-center space-y-5 text-[#1D1D1F]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Share @{shareTargetUsername}</span>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-2xl inline-flex items-center justify-center border border-zinc-200/70">
                <QRCodeSVG value={shareFullLocal} size={148} />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3 py-2 text-xs">
                  <span className="truncate font-medium mr-2">{shareFullLocal}</span>
                  <button
                    type="button"
                    onClick={() => copyShareUrl("local", shareFullLocal)}
                    className="font-semibold text-[#0071E3] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedKey === "local" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === "local" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#F5F5F7] border border-zinc-200 rounded-xl px-3 py-2 text-xs">
                  <span className="truncate font-medium mr-2">{shareProdUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyShareUrl("prod", shareProdUrl)}
                    className="font-semibold text-[#0071E3] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedKey === "prod" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === "prod" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareProdUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Linkedin size={13} />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={`https://github.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Github size={13} />
                  <span>GitHub</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
