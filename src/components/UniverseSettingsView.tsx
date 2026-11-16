import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Palette,
  Sliders,
  Shield,
  Bell,
  Link2,
  Database,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  ArrowLeft,
  Download,
  RotateCcw,
  Trash2,
  LogOut,
  Plus,
  ExternalLink,
  Volume2,
  Wifi,
  Eye,
  Lock,
  Upload,
  CheckCircle2,
  Loader2,
  Compass,
  Zap,
  Globe,
  Cpu,
  Briefcase,
  Camera,
  MessageSquare,
  Video,
  Mic,
  HardDrive,
  Clipboard,
  Image as ImageIcon,
  Monitor,
  MapPin,
  FileDown,
  Users,
  Music,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";
import { AuraEngineControlPanel } from "./GamuraAuraHub";

export interface AllowAccessPermissions {
  camera: boolean;
  messages: boolean;
  video: boolean;
  microphone: boolean;
  storage: boolean;
  notifications: boolean;
  photosMedia: boolean;
  screenCapture: boolean;
  clipboard: boolean;
  location: boolean;
  filesDownloads: boolean;
  contactsProfile: boolean;
  audioPlayback: boolean;
  backgroundSync: boolean;
}

export const DEFAULT_ALLOW_ACCESS: AllowAccessPermissions = {
  camera: true,
  messages: true,
  video: true,
  microphone: true,
  storage: true,
  notifications: true,
  photosMedia: true,
  screenCapture: true,
  clipboard: true,
  location: false,
  filesDownloads: true,
  contactsProfile: true,
  audioPlayback: true,
  backgroundSync: true,
};

export interface UniversePreferences {
  accentColor: string;
  surfaceMode: "light" | "frost" | "dark";
  density: "comfortable" | "compact";
  cornerStyle: "rounded" | "sharp";
  reduceMotion: boolean;
  defaultStartupTab: string;
  showQuickBroadcastBar: boolean;
  showDockBadges: boolean;
  showJoinSelvaranjanPill: boolean;
  enableKeyboardShortcut: boolean;
  broadcastPresence: boolean;
  publicDirectoryVisible: boolean;
  defaultActivityScope: "mine" | "global";
  inAppAlerts: boolean;
  broadcastAlerts: boolean;
  streakReminders: boolean;
  tactileSounds: boolean;
  defaultAudioVolume: number;
  allowAccess: AllowAccessPermissions;
}

export const UNIVERSE_PREFS_STORAGE_KEY = "gamura_universe_settings_v1";

export const DEFAULT_UNIVERSE_PREFERENCES: UniversePreferences = {
  accentColor: "#0071E3",
  surfaceMode: "light",
  density: "comfortable",
  cornerStyle: "rounded",
  reduceMotion: false,
  defaultStartupTab: "Overview",
  showQuickBroadcastBar: true,
  showDockBadges: true,
  showJoinSelvaranjanPill: true,
  enableKeyboardShortcut: true,
  broadcastPresence: true,
  publicDirectoryVisible: true,
  defaultActivityScope: "mine",
  inAppAlerts: true,
  broadcastAlerts: true,
  streakReminders: true,
  tactileSounds: false,
  defaultAudioVolume: 30,
  allowAccess: { ...DEFAULT_ALLOW_ACCESS },
};

export function loadUniversePreferences(): UniversePreferences {
  try {
    const raw = localStorage.getItem(UNIVERSE_PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_UNIVERSE_PREFERENCES,
        ...parsed,
        allowAccess: {
          ...DEFAULT_ALLOW_ACCESS,
          ...(parsed?.allowAccess || {}),
        },
      };
    }
  } catch {
    // ignore storage parse failures
  }
  return DEFAULT_UNIVERSE_PREFERENCES;
}

const ACCENT_SWATCHES = [
  { id: "apple-blue", name: "Apple Blue", color: "#0071E3" },
  { id: "emerald", name: "Emerald", color: "#059669" },
  { id: "indigo", name: "Indigo", color: "#4F46E5" },
  { id: "violet", name: "Violet", color: "#7C3AED" },
  { id: "coral", name: "Rose", color: "#E11D48" },
  { id: "graphite", name: "Graphite", color: "#1D1D1F" },
];

type SettingsSection =
  | "account"
  | "permissions"
  | "appearance"
  | "workspace"
  | "privacy"
  | "notifications"
  | "access"
  | "aura"
  | "storage";

interface UniverseSettingsViewProps {
  user: any;
  userInfo: any;
  setCurrentUserInfo: (info: any) => void;
  preferences: UniversePreferences;
  onUpdatePreferences: (next: UniversePreferences) => void;
  onNavigateTab: (tab: string) => void;
  onBack: () => void;
  showToast: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  isLoggedIn: boolean;
  onConnect: () => void;
  gamuraAccounts?: any[];
  setCurrentPage?: (p: any) => void;
  setEmail?: (val: string) => void;
  setUsername?: (val: string) => void;
  setShowDeleteConfirm?: (val: boolean) => void;
  setShowSignOutConfirm?: (val: boolean) => void;
  connectedApps: string[];
  onConnectApp: (appId: string) => void;
  onDisconnectApp: (appId: string) => void;
  onExportTelemetry: () => void;
  addActivity: (title: string, ic?: string) => void;
}

const APPLE_FONT: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function AppleSwitch({
  checked,
  onChange,
  accentColor = "#0071E3",
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  accentColor?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-[46px] h-[27px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      style={{
        backgroundColor: checked ? accentColor : "#D1D1D6",
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className="w-[23px] h-[23px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] block"
        style={{
          marginLeft: checked ? "auto" : "0px",
          marginRight: checked ? "0px" : "auto",
        }}
      />
    </button>
  );
}

export default function UniverseSettingsView({
  user,
  userInfo,
  setCurrentUserInfo,
  preferences,
  onUpdatePreferences,
  onNavigateTab,
  onBack,
  showToast,
  isLoggedIn,
  onConnect,
  gamuraAccounts = [],
  setCurrentPage,
  setEmail,
  setUsername,
  setShowDeleteConfirm,
  setShowSignOutConfirm,
  connectedApps,
  onConnectApp,
  onDisconnectApp,
  onExportTelemetry,
  addActivity,
}: UniverseSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [editNickname, setEditNickname] = useState(userInfo?.nickname || "");
  const [editHandle, setEditHandle] = useState(userInfo?.username || "");
  const [editBio, setEditBio] = useState(userInfo?.bio || "");
  const [editAvatar, setEditAvatar] = useState(userInfo?.avatarUrl || user?.photoURL || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditNickname(userInfo?.nickname || user?.displayName || "");
    setEditHandle(userInfo?.username || "");
    setEditBio(userInfo?.bio || "");
    setEditAvatar(userInfo?.avatarUrl || user?.photoURL || "");
  }, [userInfo, user]);

  const isAuthUser = Boolean(
    user && auth.currentUser && user.uid !== "guest_explorer_uid",
  );

  const isHandleLocked = (() => {
    const lastChange = userInfo?.lastUidChange;
    if (!lastChange) return false;
    const ms =
      typeof lastChange === "number"
        ? lastChange
        : lastChange.toMillis
          ? lastChange.toMillis()
          : lastChange.seconds
            ? lastChange.seconds * 1000
            : 0;
    return Date.now() - ms < 365 * 24 * 60 * 60 * 1000;
  })();

  const accent = preferences.accentColor || "#0071E3";

  const playSubtleClick = () => {
    if (!preferences.tactileSounds || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      setTimeout(() => ctx.close().catch(() => null), 120);
    } catch {
      // ignore audio context policies
    }
  };

  const [checkingPermKey, setCheckingPermKey] = useState<string | null>(null);
  const [browserPermStatus, setBrowserPermStatus] = useState<Record<string, string>>({});

  const allowAccess: AllowAccessPermissions = {
    ...DEFAULT_ALLOW_ACCESS,
    ...(preferences.allowAccess || {}),
  };

  const setPref = <K extends keyof UniversePreferences>(
    key: K,
    val: UniversePreferences[K],
    toastTitle?: string,
  ) => {
    playSubtleClick();
    const next: UniversePreferences = { ...preferences, [key]: val };
    onUpdatePreferences(next);
    if (toastTitle) {
      showToast("⚙️", "Preference Updated", toastTitle, "success");
    }
  };

  const setAccessPerm = (
    key: keyof AllowAccessPermissions,
    enabled: boolean,
    label: string,
  ) => {
    playSubtleClick();
    const nextAllowAccess: AllowAccessPermissions = {
      ...allowAccess,
      [key]: enabled,
    };
    const nextPrefs: UniversePreferences = {
      ...preferences,
      allowAccess: nextAllowAccess,
      ...(key === "notifications" ? { inAppAlerts: enabled } : {}),
    };
    onUpdatePreferences(nextPrefs);
    showToast(
      enabled ? "🔓" : "🔒",
      `${label} Access ${enabled ? "Turned On" : "Turned Off"}`,
      enabled
        ? `Gamura Universe can now use ${label.toLowerCase()}.`
        : `${label} access paused inside Universe.`,
      enabled ? "success" : "info",
    );
  };

  const setAllAccessPerms = (enabled: boolean) => {
    playSubtleClick();
    const nextAllowAccess: AllowAccessPermissions = {
      camera: enabled,
      messages: enabled,
      video: enabled,
      microphone: enabled,
      storage: enabled,
      notifications: enabled,
      photosMedia: enabled,
      screenCapture: enabled,
      clipboard: enabled,
      location: enabled,
      filesDownloads: enabled,
      contactsProfile: enabled,
      audioPlayback: enabled,
      backgroundSync: enabled,
    };
    onUpdatePreferences({
      ...preferences,
      allowAccess: nextAllowAccess,
      inAppAlerts: enabled,
    });
    showToast(
      enabled ? "✅" : "🛡️",
      enabled ? "All Access Turned On" : "All Access Turned Off",
      enabled
        ? "All Universe device and workspace permissions enabled."
        : "All optional Universe permissions turned off.",
      enabled ? "success" : "info",
    );
  };

  const requestBrowserPermission = async (
    key: keyof AllowAccessPermissions,
    label: string,
  ) => {
    setCheckingPermKey(key);
    try {
      if (key === "notifications") {
        if (typeof Notification === "undefined") {
          setBrowserPermStatus((s) => ({ ...s, [key]: "Saved in Universe" }));
          showToast("🔔", "Preference Active", "In-app notification access is enabled.", "info");
        } else {
          const result = await Notification.requestPermission();
          const granted = result === "granted";
          setBrowserPermStatus((s) => ({
            ...s,
            [key]: granted ? "Browser Allowed" : result === "denied" ? "Browser Blocked" : "Prompt Dismissed",
          }));
          if (granted) setAccessPerm("notifications", true, label);
          else showToast("⚠️", "Browser Setting", `Notifications permission: ${result}`, "warning");
        }
      } else if (key === "camera" || key === "video") {
        if (!navigator.mediaDevices?.getUserMedia) {
          setBrowserPermStatus((s) => ({ ...s, [key]: "Saved in Universe" }));
          showToast("📷", "Preference Saved", "Camera preference saved for this workspace.", "info");
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          setBrowserPermStatus((s) => ({ ...s, [key]: "Browser Allowed" }));
          setAccessPerm(key, true, label);
        }
      } else if (key === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) {
          setBrowserPermStatus((s) => ({ ...s, [key]: "Saved in Universe" }));
          showToast("🎙️", "Preference Saved", "Microphone preference saved for this workspace.", "info");
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setBrowserPermStatus((s) => ({ ...s, [key]: "Browser Allowed" }));
          setAccessPerm("microphone", true, label);
        }
      } else if (key === "storage") {
        if (navigator.storage?.persist) {
          const persisted = await navigator.storage.persist();
          setBrowserPermStatus((s) => ({
            ...s,
            storage: persisted ? "Persistent Granted" : "Standard Storage",
          }));
          setAccessPerm("storage", true, label);
        } else {
          setBrowserPermStatus((s) => ({ ...s, storage: "Local Storage Ready" }));
          setAccessPerm("storage", true, label);
        }
      } else if (key === "location") {
        if (!navigator.geolocation) {
          setBrowserPermStatus((s) => ({ ...s, location: "Unavailable" }));
        } else {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setBrowserPermStatus((s) => ({ ...s, location: "Browser Allowed" }));
                setAccessPerm("location", true, label);
                resolve();
              },
              () => {
                setBrowserPermStatus((s) => ({ ...s, location: "Browser Blocked" }));
                showToast("📍", "Location Denied", "Browser blocked geolocation request.", "warning");
                resolve();
              },
              { timeout: 6000 },
            );
          });
        }
      } else if (key === "clipboard") {
        try {
          await navigator.clipboard.readText();
          setBrowserPermStatus((s) => ({ ...s, clipboard: "Browser Allowed" }));
          setAccessPerm("clipboard", true, label);
        } catch {
          setBrowserPermStatus((s) => ({ ...s, clipboard: "Write Ready" }));
          setAccessPerm("clipboard", true, label);
        }
      }
    } catch {
      setBrowserPermStatus((s) => ({ ...s, [key]: "Blocked in Browser" }));
      showToast(
        "⚠️",
        `${label} Blocked by Browser`,
        "Allow access in your browser site settings to test hardware capture.",
        "warning",
      );
    } finally {
      setCheckingPermKey(null);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 256 / img.width);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setEditAvatar(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthUser) {
      showToast("🔒", "Sign In Required", "Sign in to save account changes.", "warning");
      return;
    }
    setSavingProfile(true);
    try {
      const cleanNewHandle = editHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const oldHandle = (userInfo?.username || "").trim().toLowerCase();
      const handleChanged = Boolean(cleanNewHandle && cleanNewHandle !== oldHandle);

      if (handleChanged) {
        if (cleanNewHandle.length < 3) {
          showToast("⚠️", "Handle Too Short", "Use at least 3 characters.", "warning");
          setSavingProfile(false);
          return;
        }
        if (isHandleLocked) {
          showToast("⏳", "Handle Locked", "Gamura ID can only change once per year.", "info");
          setSavingProfile(false);
          return;
        }
        const existingName = await getDoc(doc(db, "usernames", cleanNewHandle)).catch(() => null);
        if (existingName && existingName.exists() && existingName.data()?.uid !== user.uid) {
          showToast("🔒", "Handle Taken", `@${cleanNewHandle} is already reserved.`, "error");
          setSavingProfile(false);
          return;
        }
        await setDoc(doc(db, "usernames", cleanNewHandle), { uid: user.uid });
        if (oldHandle) {
          await deleteDoc(doc(db, "usernames", oldHandle)).catch(() => null);
        }
      }

      const updatePayload: any = {
        uid: user.uid,
        nickname: editNickname.trim() || userInfo?.nickname || "Member",
        bio: editBio.trim(),
        avatarUrl: editAvatar,
        createdAt: userInfo?.createdAt || Date.now(),
      };
      if (handleChanged) {
        updatePayload.username = cleanNewHandle;
        updatePayload.lastUidChange = Date.now();
      }

      await setDoc(doc(db, "users", user.uid), updatePayload, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`),
      );

      const mergedUser = { ...(userInfo || {}), ...updatePayload };
      setCurrentUserInfo(mergedUser);
      try {
        localStorage.setItem(`gamura_user_info_${user.uid}`, JSON.stringify(mergedUser));
      } catch {
        // ignore
      }
      addActivity("Updated account details in Universe Settings", "⚙️");
      showToast("✅", "Profile Saved", "Your Gamura identity has been updated.", "success");
    } catch (err: any) {
      showToast("❌", "Save Failed", err?.message || "Could not update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopy = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    showToast("✓", "Copied", `${label} copied to clipboard.`, "success");
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExportWorkspaceJson = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: user?.uid || "guest",
        username: userInfo?.username || null,
        nickname: userInfo?.nickname || null,
        email: user?.email || null,
      },
      universePreferences: preferences,
      connectedApps,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamura-universe-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥", "Settings Exported", "Downloaded workspace configuration JSON.", "success");
  };

  const handleClearCaches = () => {
    try {
      const keysToClear = [
        "gamura_claim_draft",
        "gamura_integration_endpoints",
        "universe_streak_data",
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      showToast("🧹", "Local Caches Cleared", "Temporary drafts & view caches cleared.", "info");
    } catch {
      showToast("⚠️", "Cache Clear Skipped", "Storage access unavailable.", "warning");
    }
  };

  const handleResetDefaults = () => {
    onUpdatePreferences(DEFAULT_UNIVERSE_PREFERENCES);
    showToast("↺", "Defaults Restored", "Apple standard preferences restored.", "success");
  };

  const sections: {
    id: SettingsSection;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
  }[] = [
    {
      id: "account",
      label: "Account & Profile",
      subtitle: "Identity, handle & switcher",
      icon: <User size={15} />,
      iconBg: "bg-blue-500 text-white",
    },
    {
      id: "permissions",
      label: "Allow Access",
      subtitle: "Camera, messages, mic & storage",
      icon: <KeyRound size={15} />,
      iconBg: "bg-blue-600 text-white",
    },
    {
      id: "appearance",
      label: "Appearance & Theme",
      subtitle: "Accent color, surface & layout",
      icon: <Palette size={15} />,
      iconBg: "bg-indigo-500 text-white",
    },
    {
      id: "workspace",
      label: "Dock & Navigation",
      subtitle: "Startup tab, shortcuts & bars",
      icon: <Sliders size={15} />,
      iconBg: "bg-zinc-800 text-white",
    },
    {
      id: "privacy",
      label: "Privacy & Presence",
      subtitle: "Live status & visibility",
      icon: <Shield size={15} />,
      iconBg: "bg-emerald-600 text-white",
    },
    {
      id: "notifications",
      label: "Alerts & Audio",
      subtitle: "Notifications, chimes & volume",
      icon: <Bell size={15} />,
      iconBg: "bg-rose-500 text-white",
    },
    {
      id: "access",
      label: "Access & Integrations",
      subtitle: "Services, webhooks & deep links",
      icon: <Link2 size={15} />,
      iconBg: "bg-sky-500 text-white",
    },
    {
      id: "aura",
      label: "Aura 8-Core Engine",
      subtitle: "Subsystems, FPS & spectral calibration",
      icon: <Sparkles size={15} />,
      iconBg: "bg-violet-600 text-white",
    },
    {
      id: "storage",
      label: "Data & Reset",
      subtitle: "Export config, caches & defaults",
      icon: <Database size={15} />,
      iconBg: "bg-amber-500 text-white",
    },
  ];

  const activeMeta = sections.find((s) => s.id === activeSection)!;

  return (
    <div style={APPLE_FONT} className="w-full space-y-4 text-[#1D1D1F] pb-10">
      {/* Top Apple Settings Header Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer shrink-0"
            aria-label="Back to Overview"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
              Universe Settings
            </h2>
            <p className="text-xs text-[#6E6E73] truncate mt-0.5">
              Personalize controls, workspace access, appearance &amp; privacy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              playSubtleClick();
              setActiveSection("permissions");
            }}
            className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <KeyRound size={13} style={{ color: accent }} />
            <span>Allow Access</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("Join Selvaranjan")}
            className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Compass size={13} style={{ color: accent }} />
            <span>Join Selvaranjan</span>
          </button>
          <button
            type="button"
            onClick={handleExportWorkspaceJson}
            style={{ backgroundColor: accent }}
            className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Responsive Mobile Pill Strip */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {sections.map((sec) => {
          const isCurrent = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                playSubtleClick();
                setActiveSection(sec.id);
              }}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
                isCurrent
                  ? "bg-white border-zinc-300 text-[#1D1D1F] shadow-xs"
                  : "bg-white/60 border-zinc-200/70 text-[#6E6E73] hover:bg-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${sec.iconBg}`}>
                {sec.icon}
              </span>
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split View: macOS System Settings Sidebar + Grouped Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Desktop Apple Sidebar */}
        <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-2 bg-white border border-zinc-200/80 rounded-3xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sticky top-[68px]">
          {/* User Banner inside Sidebar */}
          <button
            type="button"
            onClick={() => setActiveSection("account")}
            className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
              activeSection === "account" ? "bg-[#F5F5F7]" : "hover:bg-[#F5F5F7]/70"
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
              {editAvatar ? (
                <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-zinc-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1D1D1F] truncate">
                {userInfo?.nickname || user?.displayName || "Guest Explorer"}
              </div>
              <div className="text-[11px] text-[#6E6E73] truncate">
                {userInfo?.username ? `@${userInfo.username}` : "Gamura ID"}
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-400 shrink-0" />
          </button>

          <div className="h-px bg-zinc-100 mx-1 my-0.5" />

          <nav className="space-y-0.5">
            {sections.map((sec) => {
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    playSubtleClick();
                    setActiveSection(sec.id);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    active
                      ? "text-white font-semibold shadow-xs"
                      : "text-[#1D1D1F] hover:bg-[#F5F5F7] font-medium"
                  }`}
                  style={active ? { backgroundColor: accent } : undefined}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? "bg-white/20 text-white" : sec.iconBg
                    }`}
                  >
                    {sec.icon}
                  </span>
                  <span className="text-xs truncate flex-1">{sec.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Pane: Active Settings Panel */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={preferences.reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={preferences.reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* Section Banner */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${activeMeta.iconBg}`}
                >
                  {activeMeta.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F] leading-tight">
                    {activeMeta.label}
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-0.5">{activeMeta.subtitle}</p>
                </div>
              </div>

              {/* 1. ACCOUNT & PROFILE */}
              {activeSection === "account" && (
                <div className="space-y-4">
                  <form
                    onSubmit={handleSaveProfile}
                    className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-zinc-100">
                      <div className="relative w-16 h-16 rounded-full bg-[#F5F5F7] border border-zinc-200 overflow-hidden shrink-0">
                        {editAvatar ? (
                          <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <User size={26} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-sm font-bold text-[#1D1D1F] truncate">
                          {editNickname || "Explorer"}
                        </div>
                        <div className="text-xs text-[#6E6E73] truncate">
                          {user?.email || "Not signed in to a Gamura account"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Upload size={13} />
                          <span>Change Photo</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1D1D1F] block">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          placeholder="Your display name"
                          className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            Gamura Handle
                          </label>
                          {isHandleLocked && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Locked 1yr
                            </span>
                          )}
                        </div>
                        <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-[#0071E3]">
                          <span className="pl-3.5 text-sm text-[#6E6E73] font-medium">@</span>
                          <input
                            type="text"
                            value={editHandle}
                            readOnly={isHandleLocked}
                            onChange={(e) =>
                              !isHandleLocked &&
                              setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                            }
                            placeholder="username"
                            className={`w-full bg-transparent px-1.5 py-2.5 text-sm font-medium outline-none ${
                              isHandleLocked ? "text-[#6E6E73] cursor-not-allowed" : "text-[#1D1D1F]"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F] block">
                        Bio &amp; Role
                      </label>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Creator, Builder, Designer on Gamura..."
                        className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {user?.uid && user.uid !== "guest_explorer_uid" ? (
                        <button
                          type="button"
                          onClick={() => handleCopy("uid", user.uid, "User ID")}
                          className="inline-flex items-center gap-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-mono cursor-pointer"
                        >
                          <span>UID: {user.uid.slice(0, 12)}…</span>
                          {copiedField === "uid" ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-[#6E6E73]">Guest Explorer Session</span>
                      )}

                      {isLoggedIn ? (
                        <button
                          type="submit"
                          disabled={savingProfile}
                          style={{ backgroundColor: accent }}
                          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 shadow-xs"
                        >
                          {savingProfile ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          <span>{savingProfile ? "Saving..." : "Save Profile Changes"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onConnect}
                          style={{ backgroundColor: accent }}
                          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          Sign In to Save Account
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Account Switcher & Access Card */}
                  <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    {gamuraAccounts.filter((a) => a.uid !== user?.uid).length > 0 && (
                      <div className="p-4 space-y-2">
                        <div className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider px-1">
                          Saved Gamura Accounts
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {gamuraAccounts
                            .filter((a) => a.uid !== user?.uid)
                            .map((acc, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={async () => {
                                  setCurrentUserInfo(null);
                                  await firebaseSignOut(auth).catch(() => null);
                                  setEmail?.(acc.email || "");
                                  setUsername?.(acc.username || "");
                                  setCurrentPage?.("login");
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 transition-colors cursor-pointer text-left"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                                    @{acc.username}
                                  </div>
                                  <div className="text-[11px] text-[#6E6E73] truncate">
                                    {acc.nickname}
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold text-[#0071E3] shrink-0">
                                  Switch
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setCurrentUserInfo(null);
                          await firebaseSignOut(auth).catch(() => null);
                          setUsername?.("");
                          setEmail?.("");
                          setCurrentPage?.("login");
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Connect Other ID</span>
                      </button>

                      {isLoggedIn && setShowSignOutConfirm && (
                        <button
                          type="button"
                          onClick={() => setShowSignOutConfirm(true)}
                          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl hover:bg-amber-50 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      )}

                      {isLoggedIn && setShowDeleteConfirm && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete Account</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ALLOW ACCESS & DEVICE PERMISSIONS */}
              {activeSection === "permissions" && (() => {
                const permissionEntries: {
                  group: string;
                  items: {
                    key: keyof AllowAccessPermissions;
                    label: string;
                    description: string;
                    icon: React.ReactNode;
                    iconBg: string;
                    supportsBrowserCheck?: boolean;
                  }[];
                }[] = [
                  {
                    group: "Media, Camera & Audio",
                    items: [
                      {
                        key: "camera",
                        label: "Camera",
                        description: "Capture profile photos, snapshots, and live visual media.",
                        icon: <Camera size={15} />,
                        iconBg: "bg-sky-500 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "video",
                        label: "Video",
                        description: "Enable video playback, clip capture, and Gamura Veo studio.",
                        icon: <Video size={15} />,
                        iconBg: "bg-indigo-500 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "microphone",
                        label: "Microphone",
                        description: "Record voiceovers, audio notes, and spoken prompts.",
                        icon: <Mic size={15} />,
                        iconBg: "bg-orange-500 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "photosMedia",
                        label: "Photos & Media Library",
                        description: "Import images, artwork, and custom avatars into Universe.",
                        icon: <ImageIcon size={15} />,
                        iconBg: "bg-emerald-500 text-white",
                      },
                      {
                        key: "screenCapture",
                        label: "Screen Capture & Canvas Recording",
                        description: "Allow exporting studio canvas recordings and workspace captures.",
                        icon: <Monitor size={15} />,
                        iconBg: "bg-violet-500 text-white",
                      },
                      {
                        key: "audioPlayback",
                        label: "Audio Playback & Synthesizer",
                        description: "Play ambient focus soundscapes and tactile UI chimes.",
                        icon: <Music size={15} />,
                        iconBg: "bg-pink-500 text-white",
                      },
                    ],
                  },
                  {
                    group: "Messages, Alerts & Contacts",
                    items: [
                      {
                        key: "messages",
                        label: "Messages",
                        description: "Send and receive Neutral Link messages, notes, and quick signals.",
                        icon: <MessageSquare size={15} />,
                        iconBg: "bg-green-500 text-white",
                      },
                      {
                        key: "notifications",
                        label: "Notifications",
                        description: "Deliver workspace banners, broadcast alerts, and streak reminders.",
                        icon: <Bell size={15} />,
                        iconBg: "bg-rose-500 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "contactsProfile",
                        label: "Contacts & Developer Directory",
                        description: "Allow discovering collaborators and connecting via @handle.",
                        icon: <Users size={15} />,
                        iconBg: "bg-blue-500 text-white",
                      },
                    ],
                  },
                  {
                    group: "Storage, Files & System",
                    items: [
                      {
                        key: "storage",
                        label: "Storage",
                        description: "Store installed Universe apps, workspace drafts, and offline state.",
                        icon: <HardDrive size={15} />,
                        iconBg: "bg-slate-700 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "filesDownloads",
                        label: "Files & Downloads",
                        description: "Allow exporting PDFs, videos, JSON backups, and CSV logs.",
                        icon: <FileDown size={15} />,
                        iconBg: "bg-teal-600 text-white",
                      },
                      {
                        key: "clipboard",
                        label: "Clipboard",
                        description: "Allow one-tap link copying and Gamura Clip paste sync.",
                        icon: <Clipboard size={15} />,
                        iconBg: "bg-amber-500 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "location",
                        label: "Location Services",
                        description: "Allow regional time formatting and nearby relay routing.",
                        icon: <MapPin size={15} />,
                        iconBg: "bg-cyan-600 text-white",
                        supportsBrowserCheck: true,
                      },
                      {
                        key: "backgroundSync",
                        label: "Background Refresh & Cloud Sync",
                        description: "Keep preferences, streaks, and activity updated in real time.",
                        icon: <RefreshCw size={15} />,
                        iconBg: "bg-zinc-800 text-white",
                      },
                    ],
                  },
                ];

                const allKeys = Object.keys(DEFAULT_ALLOW_ACCESS) as (keyof AllowAccessPermissions)[];
                const enabledCount = allKeys.filter((k) => allowAccess[k]).length;

                return (
                  <div className="space-y-4">
                    <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                          {enabledCount} of {allKeys.length} Permissions Turned On
                        </div>
                        <div className="text-xs text-[#6E6E73] mt-0.5">
                          Turn access on or off individually for Camera, Messages, Video, Microphone, Storage, Notifications, and workspace capabilities.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAllAccessPerms(false)}
                          className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          Turn All Off
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllAccessPerms(true)}
                          style={{ backgroundColor: accent }}
                          className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                        >
                          Allow All
                        </button>
                      </div>
                    </div>

                    {permissionEntries.map((group) => (
                      <div
                        key={group.group}
                        className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                      >
                        <div className="px-5 py-3 bg-[#FAFAFC]">
                          <h4 className="text-[11px] font-semibold text-[#6E6E73] tracking-wide">
                            {group.group}
                          </h4>
                        </div>
                        {group.items.map((item) => {
                          const isEnabled = allowAccess[item.key];
                          const browserNote = browserPermStatus[item.key];
                          const isChecking = checkingPermKey === item.key;

                          return (
                            <div
                              key={item.key}
                              className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${item.iconBg}`}
                                >
                                  {item.icon}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-[#1D1D1F]">
                                      {item.label}
                                    </span>
                                    <span
                                      className={`text-[11px] font-semibold tabular-nums ${
                                        isEnabled ? "text-emerald-600" : "text-[#86868B]"
                                      }`}
                                    >
                                      {isEnabled ? "Allowed · On" : "Blocked · Off"}
                                    </span>
                                    {browserNote && (
                                      <span className="text-[11px] text-[#6E6E73]">
                                        · {browserNote}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                {item.supportsBrowserCheck && (
                                  <button
                                    type="button"
                                    disabled={isChecking}
                                    onClick={() => requestBrowserPermission(item.key, item.label)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200/80 text-[11px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                  >
                                    {isChecking ? "Checking..." : "Test Access"}
                                  </button>
                                )}
                                <AppleSwitch
                                  checked={isEnabled}
                                  onChange={(v) => setAccessPerm(item.key, v, item.label)}
                                  accentColor={accent}
                                  label={`Allow access to ${item.label}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 2. APPEARANCE & THEME */}
              {activeSection === "appearance" && (
                <div className="space-y-4">
                  <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Accent Color</h4>
                        <p className="text-xs text-[#6E6E73]">
                          Applied immediately across active Universe buttons, highlights &amp; toggles.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-2.5 py-1.5 self-start">
                        <input
                          type="color"
                          value={accent}
                          onChange={(e) => setPref("accentColor", e.target.value)}
                          aria-label="Custom Accent Color"
                          className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="text-xs font-mono uppercase text-[#1D1D1F]">
                          {accent}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {ACCENT_SWATCHES.map((sw) => {
                        const selected = accent.toLowerCase() === sw.color.toLowerCase();
                        return (
                          <button
                            key={sw.id}
                            type="button"
                            onClick={() =>
                              setPref("accentColor", sw.color, `${sw.name} accent active.`)
                            }
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                              selected
                                ? "bg-white border-zinc-900 shadow-xs"
                                : "bg-[#F5F5F7] border-zinc-200/70 hover:bg-zinc-100"
                            }`}
                          >
                            <span
                              className="w-7 h-7 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white"
                              style={{ backgroundColor: sw.color }}
                            >
                              {selected && <Check size={13} />}
                            </span>
                            <span className="text-[11px] font-semibold text-[#1D1D1F]">
                              {sw.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Surface Finish</div>
                        <div className="text-xs text-[#6E6E73]">
                          Switch between crisp Apple White, Soft Frost canvas, or Studio Dark.
                        </div>
                      </div>
                      <div className="flex bg-[#F5F5F7] border border-zinc-200/80 rounded-xl p-1 shrink-0">
                        {(["light", "frost", "dark"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setPref(
                                "surfaceMode",
                                mode,
                                `Surface switched to ${mode.toUpperCase()}.`,
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                              preferences.surfaceMode === mode
                                ? "bg-white text-[#1D1D1F] shadow-xs"
                                : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Layout Density</div>
                        <div className="text-xs text-[#6E6E73]">
                          Adjust vertical spacing and card padding across Universe views.
                        </div>
                      </div>
                      <div className="flex bg-[#F5F5F7] border border-zinc-200/80 rounded-xl p-1 shrink-0">
                        {(["comfortable", "compact"] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              setPref("density", d, `Layout density set to ${d}.`)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                              preferences.density === d
                                ? "bg-white text-[#1D1D1F] shadow-xs"
                                : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Reduce Motion</div>
                        <div className="text-xs text-[#6E6E73]">
                          Minimize spring transitions between Universe tabs and sheets.
                        </div>
                      </div>
                      <AppleSwitch
                        checked={preferences.reduceMotion}
                        onChange={(v) =>
                          setPref("reduceMotion", v, v ? "Reduced motion enabled." : "Full Apple motion enabled.")
                        }
                        accentColor={accent}
                        label="Reduce Motion"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DOCK & NAVIGATION */}
              {activeSection === "workspace" && (
                <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Default Startup View</div>
                      <div className="text-xs text-[#6E6E73]">
                        Choose which Universe tab opens automatically when you enter.
                      </div>
                    </div>
                    <select
                      value={preferences.defaultStartupTab}
                      onChange={(e) =>
                        setPref("defaultStartupTab", e.target.value, `Startup tab set to ${e.target.value}.`)
                      }
                      className="bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3] cursor-pointer"
                    >
                      {[
                        "Overview",
                        "Apps",
                        "Join Selvaranjan",
                        "Daily Streak",
                        "Audio Module",
                        "Neutral Link",
                        "Users",
                        "Settings",
                      ].map((tabName) => (
                        <option key={tabName} value={tabName}>
                          {tabName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Quick Signal Bar</div>
                      <div className="text-xs text-[#6E6E73]">
                        Show the instant broadcast composer on Overview.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.showQuickBroadcastBar}
                      onChange={(v) => setPref("showQuickBroadcastBar", v)}
                      accentColor={accent}
                      label="Quick Signal Bar"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Dock Count Badges</div>
                      <div className="text-xs text-[#6E6E73]">
                        Display live app counters on the bottom Universe navigation dock.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.showDockBadges}
                      onChange={(v) => setPref("showDockBadges", v)}
                      accentColor={accent}
                      label="Dock Count Badges"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">
                        Top Bar &ldquo;Join Selvaranjan&rdquo; Pill
                      </div>
                      <div className="text-xs text-[#6E6E73]">
                        Keep quick access to Join Selvaranjan on Gamura pinned in the menu bar.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.showJoinSelvaranjanPill}
                      onChange={(v) => setPref("showJoinSelvaranjanPill", v)}
                      accentColor={accent}
                      label="Top Bar Join Selvaranjan Pill"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Spotlight Shortcut (⌘K / Ctrl+K)</div>
                      <div className="text-xs text-[#6E6E73]">
                        Open Universe quick search &amp; command palette with keyboard shortcut.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.enableKeyboardShortcut}
                      onChange={(v) => setPref("enableKeyboardShortcut", v)}
                      accentColor={accent}
                      label="Spotlight Keyboard Shortcut"
                    />
                  </div>
                </div>
              )}

              {/* 4. PRIVACY & PRESENCE */}
              {activeSection === "privacy" && (
                <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Wifi size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Broadcast Online Status</div>
                        <div className="text-xs text-[#6E6E73]">
                          Show real-time active presence in Users &amp; Active Users tabs.
                        </div>
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.broadcastPresence}
                      onChange={(v) =>
                        setPref("broadcastPresence", v, v ? "Online presence enabled." : "Presence paused.")
                      }
                      accentColor={accent}
                      label="Broadcast Online Status"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Eye size={16} className="text-[#0071E3] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Public Profile Discoverability</div>
                        <div className="text-xs text-[#6E6E73]">
                          Allow your @handle to appear in the Gamura member directory.
                        </div>
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.publicDirectoryVisible}
                      onChange={(v) => setPref("publicDirectoryVisible", v)}
                      accentColor={accent}
                      label="Public Directory Visibility"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Lock size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Default Activity Stream</div>
                        <div className="text-xs text-[#6E6E73]">
                          Filter activity history between personal actions or global ecosystem events.
                        </div>
                      </div>
                    </div>
                    <div className="flex bg-[#F5F5F7] border border-zinc-200/80 rounded-xl p-1 shrink-0">
                      {(["mine", "global"] as const).map((scope) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => setPref("defaultActivityScope", scope)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                            preferences.defaultActivityScope === scope
                              ? "bg-white text-[#1D1D1F] shadow-xs"
                              : "text-[#6E6E73] hover:text-[#1D1D1F]"
                          }`}
                        >
                          {scope === "mine" ? "My Activity" : "Global Feed"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. ALERTS & AUDIO */}
              {activeSection === "notifications" && (
                <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">In-App Toast Alerts</div>
                      <div className="text-xs text-[#6E6E73]">
                        Display floating Apple notification banners for actions and sync events.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.inAppAlerts}
                      onChange={(v) => setPref("inAppAlerts", v)}
                      accentColor={accent}
                      label="In-App Toast Alerts"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Global Broadcast Banners</div>
                      <div className="text-xs text-[#6E6E73]">
                        Receive live notifications when other Gamura members post broadcasts.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.broadcastAlerts}
                      onChange={(v) => setPref("broadcastAlerts", v)}
                      accentColor={accent}
                      label="Global Broadcast Banners"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Daily Streak Check-In Prompt</div>
                      <div className="text-xs text-[#6E6E73]">
                        Keep daily reward check-in reminders active inside Universe.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.streakReminders}
                      onChange={(v) => setPref("streakReminders", v)}
                      accentColor={accent}
                      label="Daily Streak Check-In Prompt"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Subtle UI Tap Feedback</div>
                      <div className="text-xs text-[#6E6E73]">
                        Play a quiet crystalline WebAudio tick when toggling controls.
                      </div>
                    </div>
                    <AppleSwitch
                      checked={preferences.tactileSounds}
                      onChange={(v) => setPref("tactileSounds", v)}
                      accentColor={accent}
                      label="Subtle UI Tap Feedback"
                    />
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                        <Volume2 size={14} className="text-[#6E6E73]" />
                        Ambient Synthesizer Target Volume
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-[#1D1D1F]">
                        {preferences.defaultAudioVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={preferences.defaultAudioVolume}
                      onChange={(e) =>
                        setPref("defaultAudioVolume", parseInt(e.target.value, 10))
                      }
                      style={{ accentColor: accent }}
                      className="w-full h-1.5 bg-zinc-200 rounded-full cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 6. ACCESS & INTEGRATIONS */}
              {activeSection === "access" && (
                <div className="space-y-4">
                  <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Quick Universe Access</h4>
                        <p className="text-xs text-[#6E6E73]">
                          Jump directly to core Gamura tools &amp; creator workspaces.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          tab: "Join Selvaranjan",
                          title: "Join Selvaranjan on Gamura",
                          sub: "Developer hubs, block studio & public @URL",
                          icon: <Compass size={15} />,
                        },
                        {
                          tab: "Gamura Universe",
                          title: "Claim Free /@username URL",
                          sub: "Reserve your personal Gamura profile route",
                          icon: <Globe size={15} />,
                        },
                        {
                          tab: "Portfolio Builder",
                          title: "Portfolio Studio Builder",
                          sub: "Build & deploy your personal site to GitHub",
                          icon: <Briefcase size={15} />,
                        },
                        {
                          tab: "Gamura Link",
                          title: "Gamura /go/ Short Links",
                          sub: "Create & track short redirects",
                          icon: <Zap size={15} />,
                        },
                        {
                          tab: "Galaxy Core",
                          title: "Galaxy Core Telemetry",
                          sub: "Live Firestore, RTDB & server health",
                          icon: <Cpu size={15} />,
                        },
                        {
                          tab: "Integrations",
                          title: "Webhook Endpoints",
                          sub: "Configure Vercel, Netlify, Slack & Discord",
                          icon: <ExternalLink size={15} />,
                        },
                      ].map((item) => (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => onNavigateTab(item.tab)}
                          className="p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0"
                              style={{ color: accent }}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#1D1D1F] truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#6E6E73] truncate">
                                {item.sub}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="px-5 py-3.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F]">
                        Connected Cloud Integrations ({connectedApps.length}/4)
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("Integrations")}
                        className="text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: accent }}
                      >
                        Manage Endpoints
                      </button>
                    </div>
                    {["Vercel", "Netlify", "Slack", "Discord"].map((service) => {
                      const active = connectedApps.includes(service);
                      return (
                        <div
                          key={service}
                          className="px-5 py-3.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[#1D1D1F]">
                              {service}
                            </div>
                            <div className="text-[11px] text-[#6E6E73]">
                              {active ? "Connected to workspace" : "Not connected"}
                            </div>
                          </div>
                          <AppleSwitch
                            checked={active}
                            onChange={(next) =>
                              next ? onConnectApp(service) : onDisconnectApp(service)
                            }
                            accentColor={accent}
                            label={`Toggle ${service}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. AURA 8-CORE ENGINE */}
              {activeSection === "aura" && (
                <AuraEngineControlPanel
                  user={user}
                  userInfo={userInfo}
                  setCurrentUserInfo={setCurrentUserInfo}
                  showToast={showToast}
                  compact
                />
              )}

              {/* 8. DATA & RESET */}
              {activeSection === "storage" && (
                <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">
                        Export Workspace Settings (JSON)
                      </div>
                      <div className="text-xs text-[#6E6E73]">
                        Download your Universe preferences, theme, and integration state.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportWorkspaceJson}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Download JSON</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">
                        Export Activity Telemetry (CSV)
                      </div>
                      <div className="text-xs text-[#6E6E73]">
                        Save recent Universe activity logs for reporting or backup.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onExportTelemetry}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">
                        Clear Local Drafts &amp; View Cache
                      </div>
                      <div className="text-xs text-[#6E6E73]">
                        Frees local browser cache while keeping your cloud Firebase account intact.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCaches}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0"
                    >
                      Clear Cache
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-red-600">
                        Reset Preferences to Default
                      </div>
                      <div className="text-xs text-[#6E6E73]">
                        Restore standard Apple styling, dock layout, and alert defaults.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-600 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Defaults</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
