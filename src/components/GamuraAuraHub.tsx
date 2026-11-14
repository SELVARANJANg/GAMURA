import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Users,
  Globe,
  BarChart3,
  Cloud,
  Settings,
  Shield,
  Radio,
  Link2,
  Sparkles,
  ExternalLink,
  Search,
  RefreshCw,
  CheckCircle2,
  Zap,
  Cpu,
  Wifi,
  Lock,
  Send,
  Briefcase,
  ChevronRight,
  RotateCcw,
  Save,
  Plus,
  Loader2,
  Copy,
  Check,
  MessageSquarePlus,
} from "lucide-react";
import {
  collection,
  doc,
  getDocFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref as rtdbRef, onValue } from "firebase/database";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { auth, db, rtdb } from "../firebase";

export interface AuraEngineConfig {
  nexus: { active: boolean; speed: number; depth: number; protocol: string };
  velo: { active: boolean; speed: number; cache: string; turbo: boolean };
  aura: { active: boolean; glow: number; density: number; theme: string };
  zync: { active: boolean; freq: number; conflict: string; live: boolean };
  oryn: { active: boolean; sens: number; algorithm: string; predictive: boolean };
  fluxe: { active: boolean; rate: number; turb: number; pattern: string };
  kova: { active: boolean; shield: number; layer: string; auto: boolean };
  lumis: { active: boolean; luminance: number; adaptive: boolean; spectrum: string };
  universe: {
    active: boolean;
    fps: number;
    renderMode: string;
    cdn: string;
    preload: boolean;
    animationQuality: string;
    shader: boolean;
    volume: number;
    spatial: boolean;
  };
  themePreset: string;
  customPrimary: string;
  customSecondary: string;
  customAccent: string;
}

export const DEFAULT_AURA_ENGINE: AuraEngineConfig = {
  nexus: { active: true, speed: 88, depth: 4, protocol: "WebSocket RT" },
  velo: { active: true, speed: 94, cache: "L2", turbo: true },
  aura: { active: true, glow: 72, density: 60, theme: "Apple Frost" },
  zync: { active: true, freq: 60, conflict: "Auto-Resolve", live: true },
  oryn: { active: true, sens: 80, algorithm: "A* Dynamic", predictive: true },
  fluxe: { active: true, rate: 70, turb: 18, pattern: "Sine Wave" },
  kova: { active: true, shield: 95, layer: "Firebase Rules", auto: true },
  lumis: { active: true, luminance: 82, adaptive: true, spectrum: "Full Spectrum" },
  universe: {
    active: true,
    fps: 60,
    renderMode: "GPU Accelerated",
    cdn: "HIGH",
    preload: true,
    animationQuality: "High",
    shader: true,
    volume: 65,
    spatial: true,
  },
  themePreset: "apple-blue",
  customPrimary: "#0071E3",
  customSecondary: "#10B981",
  customAccent: "#6366F1",
};

const AURA_PRESETS = [
  {
    id: "apple-blue",
    name: "Apple Classic",
    primary: "#0071E3",
    secondary: "#10B981",
    accent: "#6366F1",
    desc: "Clean Cupertino blue with crisp emerald & indigo accents.",
  },
  {
    id: "ocean-sky",
    name: "Ocean Breeze",
    primary: "#0EA5E9",
    secondary: "#06B6D4",
    accent: "#3B82F6",
    desc: "Airy coastal sky blue with smooth cyan clarity.",
  },
  {
    id: "emerald-studio",
    name: "Emerald Studio",
    primary: "#10B981",
    secondary: "#14B8A6",
    accent: "#059669",
    desc: "Balanced studio mint with high-contrast forest tones.",
  },
  {
    id: "violet-prism",
    name: "Violet Prism",
    primary: "#7C3AED",
    secondary: "#EC4899",
    accent: "#6366F1",
    desc: "Expressive studio iris paired with crisp magenta highlights.",
  },
];

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function mergeAuraConfig(raw: any): AuraEngineConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_AURA_ENGINE;
  return {
    nexus: { ...DEFAULT_AURA_ENGINE.nexus, ...(raw.nexus || {}) },
    velo: { ...DEFAULT_AURA_ENGINE.velo, ...(raw.velo || {}) },
    aura: { ...DEFAULT_AURA_ENGINE.aura, ...(raw.aura || {}) },
    zync: { ...DEFAULT_AURA_ENGINE.zync, ...(raw.zync || {}) },
    oryn: { ...DEFAULT_AURA_ENGINE.oryn, ...(raw.oryn || {}) },
    fluxe: { ...DEFAULT_AURA_ENGINE.fluxe, ...(raw.fluxe || {}) },
    kova: { ...DEFAULT_AURA_ENGINE.kova, ...(raw.kova || {}) },
    lumis: { ...DEFAULT_AURA_ENGINE.lumis, ...(raw.lumis || {}) },
    universe: { ...DEFAULT_AURA_ENGINE.universe, ...(raw.universe || {}) },
    themePreset: raw.themePreset || DEFAULT_AURA_ENGINE.themePreset,
    customPrimary: raw.customPrimary || DEFAULT_AURA_ENGINE.customPrimary,
    customSecondary: raw.customSecondary || DEFAULT_AURA_ENGINE.customSecondary,
    customAccent: raw.customAccent || DEFAULT_AURA_ENGINE.customAccent,
  };
}

export function AuraEngineControlPanel({
  user,
  userInfo,
  setCurrentUserInfo,
  onBack,
  showToast,
  compact = false,
}: {
  user?: any;
  userInfo?: any;
  setCurrentUserInfo?: (info: any) => void;
  onBack?: () => void;
  showToast?: any;
  compact?: boolean;
}) {
  const [config, setConfig] = useState<AuraEngineConfig>(() => {
    try {
      const cached = localStorage.getItem("gamura_aura_engine_v1");
      if (cached) return mergeAuraConfig(JSON.parse(cached));
    } catch {
      // ignore storage errors
    }
    const accent =
      userInfo?.themeColor ||
      localStorage.getItem("gamura_aura_accent") ||
      DEFAULT_AURA_ENGINE.customPrimary;
    return { ...DEFAULT_AURA_ENGINE, customPrimary: accent };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "system_configs", "aura_global"),
      (snap) => {
        if (snap.exists()) {
          const merged = mergeAuraConfig(snap.data());
          setConfig(merged);
          try {
            localStorage.setItem("gamura_aura_engine_v1", JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      },
      () => {
        // fallback to local config
      },
    );
    return () => unsub();
  }, []);

  const subsystems = [
    { key: "nexus" as const, title: "NEXUS", sub: "Connection Core", metricLabel: "Link Speed", metricKey: "speed", suffix: "%" },
    { key: "velo" as const, title: "VELO", sub: "Velocity Engine", metricLabel: "Render Speed", metricKey: "speed", suffix: "%" },
    { key: "aura" as const, title: "AURA", sub: "Visual Identity", metricLabel: "Glow Intensity", metricKey: "glow", suffix: "%" },
    { key: "zync" as const, title: "ZYNC", sub: "Realtime Sync", metricLabel: "Sync Frequency", metricKey: "freq", suffix: " Hz" },
    { key: "oryn" as const, title: "ORYN", sub: "Orbit Navigator", metricLabel: "Sensitivity", metricKey: "sens", suffix: "%" },
    { key: "fluxe" as const, title: "FLUXE", sub: "Motion Curve", metricLabel: "Flow Rate", metricKey: "rate", suffix: "%" },
    { key: "kova" as const, title: "KOVA", sub: "Access Shield", metricLabel: "Shield Level", metricKey: "shield", suffix: "%" },
    { key: "lumis" as const, title: "LUMIS", sub: "Light Balance", metricLabel: "Luminance", metricKey: "luminance", suffix: "%" },
  ];

  const activeCount = subsystems.filter((s) => config[s.key].active).length;

  const persistConfig = async (nextConfig: AuraEngineConfig) => {
    setSaving(true);
    try {
      localStorage.setItem("gamura_aura_engine_v1", JSON.stringify(nextConfig));
      localStorage.setItem("gamura_aura_accent", nextConfig.customPrimary);

      const isAuthUser = Boolean(
        auth.currentUser && user?.uid && user.uid !== "guest_explorer_uid",
      );

      if (auth.currentUser) {
        await setDoc(doc(db, "system_configs", "aura_global"), nextConfig, {
          merge: true,
        }).catch(() => null);
      }

      if (isAuthUser && setCurrentUserInfo) {
        await setDoc(
          doc(db, "users", user.uid),
          { themeColor: nextConfig.customPrimary },
          { merge: true },
        ).catch(() => null);
        const updatedUser = {
          ...(userInfo || {}),
          themeColor: nextConfig.customPrimary,
        };
        setCurrentUserInfo(updatedUser);
        try {
          localStorage.setItem(
            `gamura_user_info_${user.uid}`,
            JSON.stringify(updatedUser),
          );
        } catch {
          // ignore
        }
      }

      if (showToast) {
        showToast(
          "✨",
          "Aura Settings Applied",
          `${activeCount}/8 Aura systems and ${nextConfig.customPrimary} accent synced.`,
          "success",
        );
      }
    } catch (err: any) {
      if (showToast) {
        showToast("❌", "Save Error", err?.message || "Failed to save.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={APPLE_FONT_STYLE} className="space-y-5 text-[#1D1D1F]">
      {/* Header Summary Card */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: config.customPrimary }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F]">
                Aura Engine &amp; Spectral Controls
              </h2>
              <p className="text-xs text-[#6E6E73]">
                {activeCount} of 8 subsystems active · Apple Frost UI synchronized
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBack && !compact && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Overview</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setConfig(DEFAULT_AURA_ENGINE);
              if (showToast) {
                showToast("↺", "Aura Reset", "Restored default Apple Aura values.", "info");
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persistConfig(config)}
            style={{ backgroundColor: config.customPrimary }}
            className="px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{saving ? "Saving..." : "Apply & Sync"}</span>
          </button>
        </div>
      </div>

      {/* Spectral Theme Presets & Primary Color */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F]">Spectral Theme Presets</h3>
            <p className="text-xs text-[#6E6E73]">
              Choose a calibrated Apple-style palette or customize your primary accent.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-2.5 py-1.5">
            <input
              type="color"
              value={config.customPrimary}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  themePreset: "custom",
                  customPrimary: e.target.value,
                }))
              }
              aria-label="Custom Primary Accent"
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-xs font-mono text-[#1D1D1F] uppercase">
              {config.customPrimary}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AURA_PRESETS.map((preset) => {
            const active = config.themePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    themePreset: preset.id,
                    customPrimary: preset.primary,
                    customSecondary: preset.secondary,
                    customAccent: preset.accent,
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  active
                    ? "bg-blue-50/60 border-[#0071E3] shadow-xs"
                    : "bg-[#F5F5F7] border-zinc-200/70 hover:bg-zinc-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#1D1D1F]">
                      {preset.name}
                    </span>
                    {active && (
                      <CheckCircle2 size={14} className="text-[#0071E3] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#6E6E73] mt-1 leading-snug">
                    {preset.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8 Active Aura Subsystems Grid */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F]">
              8 Active Aura Subsystems
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Real-time performance, visual glow, sync frequency, and protection modules.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                nexus: { ...prev.nexus, active: true },
                velo: { ...prev.velo, active: true },
                aura: { ...prev.aura, active: true },
                zync: { ...prev.zync, active: true },
                oryn: { ...prev.oryn, active: true },
                fluxe: { ...prev.fluxe, active: true },
                kova: { ...prev.kova, active: true },
                lumis: { ...prev.lumis, active: true },
              }))
            }
            className="text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer whitespace-nowrap"
          >
            Enable All 8
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subsystems.map((sys) => {
            const state = config[sys.key] as any;
            const value = state[sys.metricKey] ?? 75;
            return (
              <div
                key={sys.key}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  state.active
                    ? "bg-[#F5F5F7] border-zinc-200/80"
                    : "bg-zinc-50 border-zinc-200/50 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F] tracking-tight">
                      {sys.title}
                    </div>
                    <div className="text-[11px] text-[#6E6E73]">{sys.sub}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(state.active)}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        [sys.key]: { ...prev[sys.key], active: !state.active },
                      }))
                    }
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                      state.active ? "justify-end" : "justify-start bg-zinc-300"
                    }`}
                    style={
                      state.active
                        ? { backgroundColor: config.customPrimary }
                        : undefined
                    }
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6E6E73] font-medium">
                      {sys.metricLabel}
                    </span>
                    <span className="font-semibold text-[#1D1D1F] tabular-nums">
                      {value}
                      {sys.suffix}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={sys.key === "zync" ? 15 : 10}
                    max={sys.key === "zync" ? 120 : 100}
                    value={value}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        [sys.key]: {
                          ...prev[sys.key],
                          [sys.metricKey]: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    style={{ accentColor: config.customPrimary }}
                    className="w-full h-1.5 bg-zinc-200 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Render & Performance Preferences */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-2">
          <div className="text-xs font-semibold text-[#1D1D1F]">Target Frame Rate</div>
          <div className="flex gap-1.5">
            {[60, 90, 120].map((fps) => (
              <button
                key={fps}
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    universe: { ...prev.universe, fps },
                  }))
                }
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  config.universe.fps === fps
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-white text-[#6E6E73] border border-zinc-200"
                }`}
              >
                {fps} FPS
              </button>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#1D1D1F]">Shader Effects</div>
            <div className="text-[11px] text-[#6E6E73]">
              Frosted depth &amp; aura highlights
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                universe: {
                  ...prev.universe,
                  shader: !prev.universe.shader,
                },
              }))
            }
            style={
              config.universe.shader
                ? { backgroundColor: config.customPrimary }
                : undefined
            }
            className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
              config.universe.shader
                ? "justify-end"
                : "justify-start bg-zinc-300"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#1D1D1F]">Preload Assets</div>
            <div className="text-[11px] text-[#6E6E73]">
              Instant view switching
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                universe: {
                  ...prev.universe,
                  preload: !prev.universe.preload,
                },
              }))
            }
            style={
              config.universe.preload
                ? { backgroundColor: config.customPrimary }
                : undefined
            }
            className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
              config.universe.preload
                ? "justify-end"
                : "justify-start bg-zinc-300"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface GamuraAuraHubProps {
  user: any;
  userInfo: any;
  setCurrentUserInfo: (info: any) => void;
  selectedModule: string | null;
  onSelectModule: (id: string | null) => void;
  onBackHome: () => void;
  onOpenPortfolio: () => void;
  onOpenClaimUrl: (prefill?: string) => void;
  onOpenGpg: () => void;
  onOpenUniverse: () => void;
  showToast: any;
  addActivity: (title: string, ic: string) => void;
}

export default function GamuraAuraHub({
  user,
  userInfo,
  setCurrentUserInfo,
  selectedModule,
  onSelectModule,
  onBackHome,
  onOpenPortfolio,
  onOpenClaimUrl,
  onOpenGpg,
  onOpenUniverse,
  showToast,
  addActivity,
}: GamuraAuraHubProps) {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [neuralProfiles, setNeuralProfiles] = useState<any[]>([]);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalLogins: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  // Cloud diagnostics
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [firestoreLive, setFirestoreLive] = useState<"checking" | "online" | "offline">("checking");
  const [rtdbConnected, setRtdbConnected] = useState(false);
  const [checkingCloud, setCheckingCloud] = useState(false);

  // Signal broadcast composer
  const [signalTitle, setSignalTitle] = useState("");
  const [signalMsg, setSignalMsg] = useState("");
  const [sendingSignal, setSendingSignal] = useState(false);

  // Quick short-link creator inside Node Synapse
  const [quickSlug, setQuickSlug] = useState("");
  const [quickDest, setQuickDest] = useState("");
  const [creatingShort, setCreatingShort] = useState(false);
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null);
  const [copiedShort, setCopiedShort] = useState(false);

  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const uDevs = onSnapshot(
      query(collection(db, "gamura_developers"), limit(60)),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d: any) => d.username && !String(d.username).includes("/"));
        setDevelopers(rows);
      },
      () => {},
    );

    const uNeural = onSnapshot(
      query(collection(db, "neural_profiles"), limit(60)),
      (snap) => {
        setNeuralProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {},
    );

    const uProj = onSnapshot(
      query(collection(db, "shared_projects"), limit(40)),
      (snap) => {
        setSharedProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {},
    );

    const uBroadcasts = onSnapshot(
      query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(20)),
      (snap) => {
        setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {
        onSnapshot(
          query(collection(db, "broadcasts"), limit(20)),
          (snap) => setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
          () => {},
        );
      },
    );

    const uStats = onSnapshot(
      doc(db, "system", "stats"),
      (snap) => {
        if (snap.exists()) setStats(snap.data());
      },
      () => {},
    );

    const connRef = rtdbRef(rtdb, ".info/connected");
    const uRtdb = onValue(
      connRef,
      (snap) => setRtdbConnected(snap.val() === true),
      () => setRtdbConnected(false),
    );

    return () => {
      uDevs();
      uNeural();
      uProj();
      uBroadcasts();
      uStats();
      uRtdb();
    };
  }, []);

  const runCloudProbe = useCallback(async () => {
    setCheckingCloud(true);
    try {
      const start = performance.now();
      const [hRes, aiRes] = await Promise.all([
        fetch("/api/health").catch(() => null),
        fetch("/api/ai/status").catch(() => null),
      ]);
      const elapsed = Math.round(performance.now() - start);
      if (hRes?.ok) setApiLatency(elapsed);
      if (aiRes?.ok) {
        const aiJson = await aiRes.json();
        setAiAvailable(Boolean(aiJson.available));
      }
      try {
        await getDocFromServer(doc(db, "test", "connection"));
        setFirestoreLive("online");
      } catch {
        setFirestoreLive("offline");
      }
    } finally {
      setCheckingCloud(false);
    }
  }, []);

  useEffect(() => {
    runCloudProbe();
  }, [runCloudProbe]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      showToast?.("✅", "Signed In", "Full Aura features unlocked.", "success");
    } catch (err: any) {
      showToast?.("⚠️", "Sign-In Cancelled", err?.message || "Popup closed.", "warning");
    } finally {
      setSigningIn(false);
    }
  };

  const AURA_MODULES = [
    {
      id: "users",
      name: "User Directory",
      icon: Users,
      accent: "bg-blue-50 text-[#0071E3]",
      pos: { x: 50, y: 18.5 },
      desc: `${developers.length + neuralProfiles.length} active profiles & claimed hubs`,
    },
    {
      id: "global",
      name: "Global Network",
      icon: Globe,
      accent: "bg-sky-50 text-sky-600",
      pos: { x: 72.3, y: 27.7 },
      desc: "Portfolio builder, Free URL & ecosystem shortcuts",
    },
    {
      id: "analytics",
      name: "Neural Analytics",
      icon: BarChart3,
      accent: "bg-indigo-50 text-indigo-600",
      pos: { x: 81.5, y: 50 },
      desc: "Live reach, views, clicks & creator metrics",
    },
    {
      id: "cloud",
      name: "Cloud Fabric",
      icon: Cloud,
      accent: "bg-emerald-50 text-emerald-600",
      pos: { x: 72.3, y: 72.3 },
      desc: apiLatency !== null ? `${apiLatency}ms API · Firestore & RTDB status` : "Live server & DB probe",
    },
    {
      id: "settings",
      name: "Core Protocols",
      icon: Settings,
      accent: "bg-zinc-100 text-[#1D1D1F]",
      pos: { x: 50, y: 81.5 },
      desc: "8 Aura subsystems, performance & spectral themes",
    },
    {
      id: "security",
      name: "Shield Systems",
      icon: Shield,
      accent: "bg-emerald-50 text-emerald-700",
      pos: { x: 27.7, y: 72.3 },
      desc: "Session protection, verified auth & legal center",
    },
    {
      id: "signal",
      name: "Spectral Signal",
      icon: Radio,
      accent: "bg-violet-50 text-violet-600",
      pos: { x: 18.5, y: 50 },
      desc: `${broadcasts.length} live workspace broadcasts & signals`,
    },
    {
      id: "nodes",
      name: "Node Synapse",
      icon: Link2,
      accent: "bg-amber-50 text-amber-600",
      pos: { x: 27.7, y: 27.7 },
      desc: "Quick /go/ short links, GPG & Free URL bridges",
    },
  ];

  // Deduplicated directory entries for User Directory
  const directoryMap = new Map<string, any>();
  developers.forEach((dev) => {
    const key = String(dev.username || dev.id).toLowerCase();
    directoryMap.set(key, {
      key,
      name: dev.displayName || dev.username,
      handle: dev.username,
      bio: dev.bio || "Gamura Free URL Hub",
      views: dev.views || 0,
      hasUrl: Boolean(dev.published || dev.username),
    });
  });
  neuralProfiles.forEach((np) => {
    const key = String(np.nickname || np.id).toLowerCase();
    if (!directoryMap.has(key)) {
      directoryMap.set(key, {
        key,
        name: np.nickname,
        handle: np.nickname,
        bio: "Neutral Link Member",
        views: 0,
        hasUrl: false,
      });
    }
  });
  const directoryList = Array.from(directoryMap.values()).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(item.name || "").toLowerCase().includes(q) ||
      String(item.handle || "").toLowerCase().includes(q) ||
      String(item.bio || "").toLowerCase().includes(q)
    );
  });

  // Aggregated telemetry for Neural Analytics
  const totalViews = developers.reduce((sum, d) => sum + (Number(d.views) || 0), 0);
  const totalClicks = developers.reduce((sum, d) => sum + (Number(d.clicks) || 0), 0);
  const totalEngagements = developers.reduce((sum, d) => sum + (Number(d.engagements) || 0), 0);
  const chartData = [...developers]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6)
    .map((d) => ({
      name: `@${String(d.username || "").slice(0, 10)}`,
      views: Number(d.views) || 0,
      clicks: Number(d.clicks) || 0,
    }));

  const handlePublishSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalTitle.trim() || !signalMsg.trim()) return;
    if (!auth.currentUser) {
      showToast?.("🔐", "Sign In Required", "Sign in with Google to broadcast a signal.", "info");
      return;
    }
    setSendingSignal(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        title: signalTitle.trim(),
        message: signalMsg.trim(),
        status: "live",
        senderUid: auth.currentUser.uid,
        senderName: userInfo?.nickname || auth.currentUser.displayName || "Explorer",
        timestamp: serverTimestamp(),
      });
      setSignalTitle("");
      setSignalMsg("");
      showToast?.("📡", "Signal Broadcasted", "Your Aura signal is live across Universe.", "success");
    } catch (err: any) {
      showToast?.("❌", "Broadcast Failed", err?.message || "Could not send.", "error");
    } finally {
      setSendingSignal(false);
    }
  };

  const handleCreateQuickShortLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = quickSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanSlug || !quickDest.trim()) return;
    if (!auth.currentUser) {
      showToast?.("🔐", "Sign In Required", "Sign in to reserve custom /go/ short links.", "info");
      return;
    }
    setCreatingShort(true);
    try {
      let dest = quickDest.trim();
      if (!/^https?:\/\//i.test(dest)) dest = `https://${dest}`;
      await setDoc(doc(db, "gamura_shortlinks", cleanSlug), {
        slug: cleanSlug,
        url: dest,
        uid: auth.currentUser.uid,
        clicks: 0,
        createdAt: serverTimestamp(),
      });
      setCreatedShortUrl(`${window.location.origin}/go/${cleanSlug}`);
      setQuickSlug("");
      setQuickDest("");
      showToast?.("🔗", "Short Link Active", `/go/${cleanSlug} is live.`, "success");
    } catch (err: any) {
      showToast?.("❌", "Creation Failed", err?.message || "Could not create link.", "error");
    } finally {
      setCreatingShort(false);
    }
  };

  // Module Detail Page View
  if (selectedModule) {
    const activeMod = AURA_MODULES.find((m) => m.id === selectedModule);
    const ActiveIcon = activeMod?.icon || Sparkles;

    return (
      <div style={APPLE_FONT_STYLE} className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-2xl border-b border-zinc-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSelectModule(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>Aura Hub</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-bold text-[#1D1D1F] truncate">
              <ActiveIcon size={16} className="text-[#0071E3] shrink-0" />
              <span className="truncate">{activeMod?.name}</span>
            </div>

            <button
              type="button"
              onClick={onBackHome}
              className="px-3 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Home
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {/* 1. USER DIRECTORY */}
          {selectedModule === "users" && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Aura User Directory</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Live directory of claimed Gamura Free URL pages and Neutral Link members.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search @handle or name..."
                    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {directoryList.length === 0 ? (
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-[#1D1D1F]">No matching profiles found</p>
                  <button
                    type="button"
                    onClick={() => onOpenClaimUrl()}
                    className="px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-semibold cursor-pointer"
                  >
                    Claim a Free URL
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {directoryList.map((member) => (
                    <div
                      key={member.key}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0071E3] to-sky-500 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                          {String(member.name || "G").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1D1D1F] truncate">
                            {member.name}
                          </div>
                          <div className="text-xs font-medium text-[#0071E3] truncate">
                            /@{member.handle}
                          </div>
                          <p className="text-xs text-[#6E6E73] line-clamp-2 mt-1">
                            {member.bio}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <span className="text-[11px] text-[#6E6E73] tabular-nums">
                          {member.views} views
                        </span>
                        {member.hasUrl ? (
                          <a
                            href={`/@${member.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071E3] hover:underline"
                          >
                            <span>Open Hub</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenClaimUrl(member.handle)}
                            className="text-xs font-semibold text-[#1D1D1F] hover:text-[#0071E3] cursor-pointer"
                          >
                            Claim /@{member.handle}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. GLOBAL NETWORK */}
          {selectedModule === "global" && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Global Ecosystem Network</h2>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Real-time bridge across Gamura Portfolio Builder, Free URL Hubs, and Universe Workspaces.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Claimed URLs", value: developers.length },
                    { label: "Neutral Profiles", value: neuralProfiles.length },
                    { label: "Shared Projects", value: sharedProjects.length },
                    { label: "Live Signals", value: broadcasts.length },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70"
                    >
                      <div className="text-2xl font-bold text-[#1D1D1F] tabular-nums">
                        {kpi.value}
                      </div>
                      <div className="text-xs text-[#6E6E73] mt-0.5">{kpi.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={onOpenPortfolio}
                    className="p-4 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-left transition-colors cursor-pointer space-y-1.5"
                  >
                    <Briefcase size={18} />
                    <div className="text-sm font-bold">Portfolio Builder</div>
                    <div className="text-xs text-blue-100">
                      Design and publish your Apple-style portfolio
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenClaimUrl()}
                    className="p-4 rounded-2xl bg-[#1D1D1F] hover:bg-zinc-800 text-white text-left transition-colors cursor-pointer space-y-1.5"
                  >
                    <Link2 size={18} />
                    <div className="text-sm font-bold">Gamura Free URL</div>
                    <div className="text-xs text-zinc-300">
                      Reserve your /@username page instantly
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenUniverse}
                    className="p-4 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-[#1D1D1F] text-left transition-colors cursor-pointer space-y-1.5"
                  >
                    <Globe size={18} className="text-[#0071E3]" />
                    <div className="text-sm font-bold">Universe Workspace</div>
                    <div className="text-xs text-[#6E6E73]">
                      Open Network Graph, Users &amp; Neutral Link
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. NEURAL ANALYTICS */}
          {selectedModule === "analytics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Hub Views", val: totalViews },
                  { label: "Total Link Clicks", val: totalClicks },
                  { label: "Total Engagements", val: totalEngagements },
                  { label: "Tracked Users", val: stats?.totalUsers || developers.length },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  >
                    <div className="text-2xl font-bold text-[#1D1D1F] tabular-nums">
                      {stat.val}
                    </div>
                    <div className="text-xs text-[#6E6E73] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Creator Hub Reach &amp; Clicks
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Live performance data directly from Firestore developer hubs.
                  </p>
                </div>

                {chartData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6E6E73] bg-[#F5F5F7] rounded-2xl">
                    No hub engagement data recorded yet. Claim a Free URL to start tracking!
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6E6E73" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#6E6E73" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e4e4e7",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="views" name="Views" fill="#0071E3" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="clicks" name="Clicks" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. CLOUD FABRIC */}
          {selectedModule === "cloud" && (
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Cloud Fabric Diagnostics</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Live connectivity checks across API, Gemini Engine, Firestore, and Realtime DB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runCloudProbe}
                  disabled={checkingCloud}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={13} className={checkingCloud ? "animate-spin" : ""} />
                  <span>{checkingCloud ? "Probing..." : "Re-Test"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73]">
                    <Zap size={14} className="text-[#0071E3]" />
                    <span>API Latency</span>
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F] tabular-nums">
                    {apiLatency !== null ? `${apiLatency} ms` : "Checking..."}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73]">
                    <Cpu size={14} className="text-indigo-600" />
                    <span>Server AI Service</span>
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F]">
                    {aiAvailable === null ? "Checking..." : aiAvailable ? "Configured" : "Fallback Mode"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73]">
                    <Cloud size={14} className="text-emerald-600" />
                    <span>Firestore Server Sync</span>
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F] capitalize">
                    {firestoreLive}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73]">
                    <Wifi size={14} className={rtdbConnected ? "text-emerald-600" : "text-zinc-400"} />
                    <span>Realtime Database</span>
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F]">
                    {rtdbConnected ? "Connected" : "Idle"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CORE PROTOCOLS */}
          {selectedModule === "settings" && (
            <AuraEngineControlPanel
              user={user}
              userInfo={userInfo}
              setCurrentUserInfo={setCurrentUserInfo}
              showToast={showToast}
              compact
            />
          )}

          {/* 6. SHIELD SYSTEMS */}
          {selectedModule === "security" && (
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Shield Systems &amp; Privacy</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Authentication verification status and direct account governance links.
                  </p>
                </div>
                {!auth.currentUser && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {signingIn ? "Signing in..." : "Sign in with Google"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="text-xs text-[#6E6E73] font-medium flex items-center gap-1.5">
                    <Lock size={13} />
                    <span>Session Mode</span>
                  </div>
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    {auth.currentUser ? "Authenticated Account" : "Guest Explorer"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="text-xs text-[#6E6E73] font-medium">Verified Email</div>
                  <div className="text-sm font-bold text-[#1D1D1F] truncate">
                    {auth.currentUser?.email || "Not signed in"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1">
                  <div className="text-xs text-[#6E6E73] font-medium">Firestore Protection</div>
                  <div className="text-sm font-bold text-emerald-700">
                    ABAC Rules Active
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 flex items-center justify-between text-xs font-semibold text-[#1D1D1F]"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink size={14} className="text-[#6E6E73]" />
                </a>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 flex items-center justify-between text-xs font-semibold text-[#1D1D1F]"
                >
                  <span>Terms &amp; Conditions</span>
                  <ExternalLink size={14} className="text-[#6E6E73]" />
                </a>
                <a
                  href="/delete-account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200/70 flex items-center justify-between text-xs font-semibold text-red-700"
                >
                  <span>Account Deletion</span>
                  <ExternalLink size={14} className="text-red-500" />
                </a>
              </div>
            </div>
          )}

          {/* 7. SPECTRAL SIGNAL */}
          {selectedModule === "signal" && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Spectral Signal Broadcasts</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Publish real-time announcements to the Gamura Universe feed.
                  </p>
                </div>

                {auth.currentUser ? (
                  <form onSubmit={handlePublishSignal} className="space-y-3 bg-[#F5F5F7] p-4 rounded-2xl border border-zinc-200/70">
                    <input
                      value={signalTitle}
                      onChange={(e) => setSignalTitle(e.target.value)}
                      placeholder="Signal headline (e.g. New portfolio drop live)"
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={signalMsg}
                        onChange={(e) => setSignalMsg(e.target.value)}
                        placeholder="Write your broadcast message..."
                        className="flex-1 bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                      <button
                        type="submit"
                        disabled={sendingSignal || !signalTitle.trim() || !signalMsg.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>{sendingSignal ? "Sending..." : "Broadcast"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-[#6E6E73]">
                      Sign in with Google to publish live Spectral Signals.
                    </span>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-semibold cursor-pointer self-start sm:self-center"
                    >
                      Sign in with Google
                    </button>
                  </div>
                )}

                <div className="space-y-2.5">
                  {broadcasts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#6E6E73]">
                      No recent workspace signals yet.
                    </div>
                  ) : (
                    broadcasts.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1D1D1F]">
                            {b.title || "System Signal"}
                          </span>
                          <span className="text-[11px] text-[#6E6E73]">
                            {b.senderName || "Gamura"}
                          </span>
                        </div>
                        <p className="text-xs text-[#424245]">{b.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8. NODE SYNAPSE */}
          {selectedModule === "nodes" && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Node Synapse Quick Bridges</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Create custom /go/ short links or jump straight into GPG Prompt Generator and Free URL Claim.
                  </p>
                </div>

                {auth.currentUser ? (
                  <form onSubmit={handleCreateQuickShortLink} className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center bg-white border border-zinc-200/80 rounded-xl overflow-hidden px-3">
                        <span className="text-xs text-[#6E6E73] shrink-0">/go/</span>
                        <input
                          value={quickSlug}
                          onChange={(e) =>
                            setQuickSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                          }
                          placeholder="portfolio"
                          className="w-full py-2.5 pl-1 text-xs text-[#1D1D1F] outline-none bg-transparent"
                        />
                      </div>
                      <input
                        value={quickDest}
                        onChange={(e) => setQuickDest(e.target.value)}
                        placeholder="https://destination-url.com"
                        className="w-full bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      {createdShortUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdShortUrl);
                            setCopiedShort(true);
                            setTimeout(() => setCopiedShort(false), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] cursor-pointer truncate"
                        >
                          {copiedShort ? <Check size={13} /> : <Copy size={13} />}
                          <span className="truncate">{createdShortUrl}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#6E6E73]">
                          Instant global redirect with click analytics
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={creatingShort || !quickSlug.trim() || !quickDest.trim()}
                        className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Plus size={13} />
                        <span>{creatingShort ? "Creating..." : "Create /go/ Link"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-[#6E6E73]">
                      Sign in with Google to create custom /go/ short links.
                    </span>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-semibold cursor-pointer self-start sm:self-center"
                    >
                      Sign in with Google
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onOpenGpg}
                    className="p-4 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
                        <MessageSquarePlus size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">GPG Prompt Generator</div>
                        <div className="text-[11px] text-[#6E6E73]">Generate prompts for code, design &amp; video</div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-[#6E6E73]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenClaimUrl()}
                    className="p-4 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shrink-0">
                        <Globe size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F]">Claim Free URL</div>
                        <div className="text-[11px] text-[#6E6E73]">Publish your public /@username hub</div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-[#6E6E73]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main Aura Orbital Hub + Active 8-Feature Grid
  return (
    <div style={APPLE_FONT_STYLE} className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col select-none">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-2xl border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#0071E3]" />
            <span className="text-sm font-bold tracking-tight text-[#1D1D1F]">
              Gamura Aura
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenClaimUrl()}
            className="px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Free URL
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Split: Interactive Orbital Wheel + Live Intro */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative w-full max-w-[380px] sm:max-w-[440px] aspect-square mx-auto">
            <img
              src="https://lh3.googleusercontent.com/d/1iCaP3BYXSeXCQqsxyHy0dGhqgCfpYgIp"
              alt="Gamura Aura"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply"
            />
            {AURA_MODULES.map((mod) => (
              <motion.button
                key={mod.id}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onSelectModule(mod.id);
                  addActivity(`Opened Aura: ${mod.name}`, "✨");
                }}
                style={{ left: `${mod.pos.x}%`, top: `${mod.pos.y}%` }}
                title={`Open ${mod.name}`}
                aria-label={`Open ${mod.name}`}
                className="absolute w-[13%] h-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-10 flex items-center justify-center bg-white/10 hover:bg-[#0071E3]/10 border border-transparent hover:border-[#0071E3]/40 transition-colors"
              />
            ))}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#0071E3]">
                All 8 Systems Active
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Gamura Aura Command Suite
              </h1>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Select any orbital node or module card below to access live analytics, user directories, cloud diagnostics, spectral themes, short links, and broadcast signals.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70">
                <div className="text-lg font-bold text-[#1D1D1F] tabular-nums">
                  {developers.length}
                </div>
                <div className="text-xs text-[#6E6E73]">Active Free URLs</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70">
                <div className="text-lg font-bold text-[#1D1D1F] tabular-nums">
                  {apiLatency !== null ? `${apiLatency} ms` : "Online"}
                </div>
                <div className="text-xs text-[#6E6E73]">API Health Probe</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onSelectModule("settings")}
                className="px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Configure Core Protocols
              </button>
              <button
                type="button"
                onClick={onOpenUniverse}
                className="px-4 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Universe
              </button>
            </div>
          </div>
        </div>

        {/* All 8 Active Modules Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#1D1D1F] px-1">
            Active Aura Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {AURA_MODULES.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onSelectModule(mod.id);
                    addActivity(`Opened Aura: ${mod.name}`, "✨");
                  }}
                  className="group bg-white hover:bg-zinc-50 border border-zinc-200/80 hover:border-[#0071E3]/40 rounded-2xl p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mod.accent}`}
                    >
                      <ModIcon size={18} />
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-zinc-400 group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1D1D1F]">{mod.name}</div>
                    <p className="text-xs text-[#6E6E73] mt-0.5 leading-snug">
                      {mod.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
