import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Link2,
  Moon,
  Plus,
  QrCode,
  Search,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

interface GamuraLinksPageProps {
  onBackHome: () => void;
  initialSlug?: string | null;
}

export interface LinkClickEvent {
  t: number;
  c: string;
  d: string;
}

export interface ShortLinkRecord {
  id: string;
  slug: string;
  url: string;
  created: number;
  clicks: LinkClickEvent[];
}

export const GAMURA_LINKS_STORAGE_KEY = "gl_links";
const GAMURA_LINKS_THEME_KEY = "gl_theme";
const BASE_DISPLAY_HOST = "gamura.vercel.app/x/";

const COUNTRIES = [
  "India",
  "India",
  "India",
  "United States",
  "UAE",
  "Singapore",
  "Germany",
  "Japan",
];
const DEVICES = ["Mobile", "Mobile", "Mobile", "Desktop", "Desktop", "Tablet"];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSeedClicks(count: number, daysBack: number): LinkClickEvent[] {
  const now = Date.now();
  const out: LinkClickEvent[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      t: now - Math.random() * daysBack * 86400_000,
      c: pickRandom(COUNTRIES),
      d: pickRandom(DEVICES),
    });
  }
  return out;
}

function createSeedLinks(): ShortLinkRecord[] {
  const now = Date.now();
  return [
    {
      id: "s1",
      slug: "galaxy",
      url: "https://gamuragalaxy.vercel.app/",
      created: now - 86400_000 * 5,
      clicks: buildSeedClicks(42, 7),
    },
    {
      id: "s2",
      slug: "rollout",
      url: "https://gamuraro.vercel.app/",
      created: now - 86400_000 * 3,
      clicks: buildSeedClicks(17, 7),
    },
  ];
}

function extractHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "");
  } catch {
    return rawUrl;
  }
}

function randomSlug(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function computeDayBuckets(clicks: LinkClickEvent[]): { label: string; count: number }[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const out: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = startOfToday.getTime() - i * 86400_000;
    const end = start + 86400_000;
    let count = 0;
    for (const click of clicks) {
      if (click.t >= start && click.t < end) count++;
    }
    out.push({
      label: DAY_LABELS[new Date(start).getDay()],
      count,
    });
  }
  return out;
}

function tallyDimension(
  clicks: LinkClickEvent[],
  key: "c" | "d",
): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const click of clicks) {
    const val = click[key] || "Other";
    map[val] = (map[val] || 0) + 1;
  }
  return Object.keys(map)
    .map((name) => ({ name, value: map[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

const LINKS_QR_COLORS = [
  { id: "ink", label: "Obsidian", color: "#13231c" },
  { id: "emerald", label: "Gamura Green", color: "#0a7d57" },
  { id: "cobalt", label: "Cobalt", color: "#1d4ed8" },
] as const;

export default function GamuraLinksPage({
  onBackHome,
  initialSlug = null,
}: GamuraLinksPageProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(GAMURA_LINKS_THEME_KEY);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch {
      return false;
    }
  });

  const [links, setLinks] = useState<ShortLinkRecord[]>(() => {
    try {
      const raw = localStorage.getItem(GAMURA_LINKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore parse errors
    }
    const seeded = createSeedLinks();
    try {
      localStorage.setItem(GAMURA_LINKS_STORAGE_KEY, JSON.stringify(seeded));
    } catch {
      // ignore quota errors
    }
    return seeded;
  });

  const [activeTab, setActiveTab] = useState<"links" | "insights">("links");
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorText, setErrorText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialSlug) return null;
    try {
      const raw = localStorage.getItem(GAMURA_LINKS_STORAGE_KEY);
      const parsed: ShortLinkRecord[] = raw ? JSON.parse(raw) : [];
      const found = parsed.find(
        (item) => item.slug.toLowerCase() === initialSlug.toLowerCase(),
      );
      return found ? found.id : null;
    } catch {
      return null;
    }
  });

  const [qrTint, setQrTint] = useState<string>("#13231c");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-links",
    ),
  );

  // Sync theme pref
  useEffect(() => {
    try {
      localStorage.setItem(GAMURA_LINKS_THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  // Persist links
  useEffect(() => {
    try {
      localStorage.setItem(GAMURA_LINKS_STORAGE_KEY, JSON.stringify(links));
    } catch {
      // ignore
    }
  }, [links]);

  // Sync Universe install status
  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-links"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Open detail sheet if initialSlug updates
  useEffect(() => {
    if (!initialSlug) return;
    const match = links.find(
      (item) => item.slug.toLowerCase() === initialSlug.toLowerCase(),
    );
    if (match) {
      setSelectedId(match.id);
    }
  }, [initialSlug, links]);

  // Close detail sheet on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 1900);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-links");
    if (!builtin) return;
    if (installedInUniverse) {
      removeAppFromUniverse(builtin.id);
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(builtin);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps");
    }
  };

  const handleCreateLink = () => {
    let rawUrl = urlInput.trim();
    const rawSlug = slugInput.trim().toLowerCase();
    setErrorText("");

    if (!rawUrl) {
      setErrorText("Paste the link you want to shorten.");
      return;
    }
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.hostname.includes(".")) {
        throw new Error("Invalid hostname");
      }
    } catch {
      setErrorText("That link looks incomplete. Check it and try again.");
      return;
    }

    if (rawSlug && !/^[a-z0-9-]{2,24}$/.test(rawSlug)) {
      setErrorText(
        "Custom names use 2 to 24 lowercase letters, numbers or hyphens.",
      );
      return;
    }

    let finalSlug = rawSlug;
    if (!finalSlug) {
      do {
        finalSlug = randomSlug();
      } while (links.some((l) => l.slug === finalSlug));
    } else if (links.some((l) => l.slug === finalSlug)) {
      setErrorText("That name is taken. Try another.");
      return;
    }

    const newLink: ShortLinkRecord = {
      id: `${Date.now()}`,
      slug: finalSlug,
      url: rawUrl,
      created: Date.now(),
      clicks: [],
    };
    setLinks((prev) => [newLink, ...prev]);
    setUrlInput("");
    setSlugInput("");
    setSelectedId(newLink.id);
    showToast("Short link created");
  };

  const handleCopy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      showToast("Copied link");
    } catch {
      showToast("Copy blocked by browser");
    }
  };

  const handleAddTestClick = (id: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              clicks: [
                ...l.clicks,
                {
                  t: Date.now(),
                  c: pickRandom(COUNTRIES),
                  d: pickRandom(DEVICES),
                },
              ],
            }
          : l,
      ),
    );
    showToast("Click recorded");
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
    showToast("Link deleted");
  };

  const selectedLink = useMemo(
    () => links.find((l) => l.id === selectedId) || null,
    [links, selectedId],
  );

  const handleSaveQrPng = () => {
    if (!selectedLink) return;
    const sourceCanvas = document.getElementById(
      "gamura-links-qr-canvas",
    ) as HTMLCanvasElement | null;
    if (!sourceCanvas) {
      showToast("QR code is preparing");
      return;
    }
    try {
      const exportCanvas = document.createElement("canvas");
      const pad = 44;
      const qrDim = sourceCanvas.width;
      exportCanvas.width = qrDim + pad * 2;
      exportCanvas.height = qrDim + pad * 2 + 86;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(sourceCanvas, pad, pad);

      ctx.fillStyle = "#13231c";
      ctx.font =
        '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        `${BASE_DISPLAY_HOST}${selectedLink.slug}`,
        exportCanvas.width / 2,
        qrDim + pad + 40,
      );
      ctx.fillStyle = "#6b7d74";
      ctx.font =
        '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(
        "Scan to open · Gamura Links",
        exportCanvas.width / 2,
        qrDim + pad + 66,
      );

      const url = exportCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `gamura-${selectedLink.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Saved gamura-${selectedLink.slug}.png`);
    } catch {
      showToast("Unable to download QR PNG");
    }
  };

  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (l) =>
        l.slug.toLowerCase().includes(q) || l.url.toLowerCase().includes(q),
    );
  }, [links, searchQuery]);

  // Insights aggregates
  const allClicks = useMemo(
    () => links.flatMap((l) => l.clicks),
    [links],
  );
  const last7DaysClicks = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    return allClicks.filter((c) => c.t > cutoff).length;
  }, [allClicks]);
  const topLink = useMemo(() => {
    if (!links.length) return null;
    return [...links].sort((a, b) => b.clicks.length - a.clicks.length)[0];
  }, [links]);

  const cardSurface = isDark
    ? "bg-[#14211b]/82 border-white/[0.1] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(0,0,0,0.35)]"
    : "bg-white/84 border-[#13231c]/[0.09] shadow-[0_1px_2px_rgba(19,35,28,0.06),0_10px_28px_rgba(19,35,28,0.07)]";

  const fieldSurface = isDark
    ? "bg-[#07110d] border-white/[0.12] text-[#e8f3ee] focus-within:border-[#2fd49a] focus-within:ring-2 focus-within:ring-[#2fd49a]/20"
    : "bg-[#f2f6f4] border-[#13231c]/[0.1] text-[#13231c] focus-within:border-[#0fa874] focus-within:ring-2 focus-within:ring-[#0fa874]/15";

  const mutedText = isDark ? "text-[#8aa196]" : "text-[#6b7d74]";
  const accentText = isDark ? "text-[#2fd49a]" : "text-[#0a7d57]";
  const accentSoftBg = isDark ? "bg-[#2fd49a]/15" : "bg-[#0fa874]/12";

  const renderWeeklyBars = (clicks: LinkClickEvent[]) => {
    const buckets = computeDayBuckets(clicks);
    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return (
      <div className="flex items-end gap-2 h-[112px] pt-2">
        {buckets.map((bucket, idx) => {
          const h = Math.max(6, Math.round((bucket.count / maxCount) * 76));
          return (
            <div
              key={`${bucket.label}-${idx}`}
              className={`flex-1 flex flex-col items-center justify-end h-full gap-1.5 text-xs ${mutedText}`}
            >
              <span className="tabular-nums font-medium">{bucket.count}</span>
              <div
                className="w-full rounded-t-lg rounded-b transition-all duration-300"
                style={{
                  height: `${h}px`,
                  background: isDark
                    ? "linear-gradient(180deg, #2fd49a, #1fb683)"
                    : "linear-gradient(180deg, #0fa874, #0a7d57)",
                }}
              />
              <span>{bucket.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDimensionSplit = (clicks: LinkClickEvent[], key: "c" | "d") => {
    const rows = tallyDimension(clicks, key);
    const total = clicks.length || 1;
    if (!rows.length) {
      return <p className={`text-sm ${mutedText}`}>No clicks yet.</p>;
    }
    return (
      <div className="grid gap-2.5">
        {rows.map((row) => {
          const pct = Math.round((row.value / total) * 100);
          return (
            <div
              key={row.name}
              className="grid grid-cols-[100px_1fr_36px] items-center gap-3 text-sm"
            >
              <span className="truncate font-medium">{row.name}</span>
              <div className={`h-2 rounded-full overflow-hidden ${accentSoftBg}`}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isDark ? "#2fd49a" : "#0fa874",
                  }}
                />
              </div>
              <span className="text-right font-semibold tabular-nums">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-200 ${
        isDark ? "bg-[#07110d] text-[#e8f3ee]" : "bg-[#f2f6f4] text-[#13231c]"
      }`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* Subtle top emerald glow matching spec */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 -top-24 h-96 z-0"
        style={{
          background: isDark
            ? "radial-gradient(60% 65% at 50% 0%, rgba(47,212,154,0.16), transparent 72%)"
            : "radial-gradient(60% 65% at 50% 0%, rgba(15,168,116,0.14), transparent 72%)",
        }}
      />

      {/* Apple Top Header */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-2xl border-b ${
          isDark
            ? "bg-[#07110d]/85 border-white/[0.08]"
            : "bg-[#f2f6f4]/85 border-[#13231c]/[0.08]"
        }`}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden sm:inline-flex min-h-[36px] px-3 rounded-full text-xs font-semibold items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-1 min-w-0">
              <div
                className="w-8 h-8 rounded-[9px] text-white flex items-center justify-center shadow-sm shrink-0"
                style={{
                  background: "linear-gradient(140deg, #0fa874, #0a7d57)",
                }}
              >
                <Link2 size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight truncate leading-tight">
                  LINKS{" "}
                  <span className={`${accentText} font-semibold`}>
                    · Gamura Links
                  </span>
                </div>
                <div
                  className={`hidden sm:block text-[10px] leading-none mt-0.5 ${mutedText}`}
                >
                  Short Links, QR & Click Analytics
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((v) => !v)}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.15] text-amber-300"
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? isDark
                    ? "bg-[#2fd49a]/18 text-[#2fd49a] border border-[#2fd49a]/35"
                    : "bg-[#0fa874]/14 text-[#0a7d57] border border-[#0fa874]/30"
                  : isDark
                    ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                    : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-28">
        {/* Segmented Tab Bar (desktop + accessible top switcher) */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight leading-tight">
              {activeTab === "links" ? "Links" : "Insights"}
            </h1>
            <p className={`text-sm mt-0.5 ${mutedText}`}>
              {activeTab === "links"
                ? "Short links and QR codes, with clicks you can read."
                : "Every click across all your links."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Gamura Links sections"
            className={`hidden sm:flex items-center gap-1 p-1 rounded-2xl ${accentSoftBg}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "links"}
              onClick={() => setActiveTab("links")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "links"
                  ? isDark
                    ? "bg-[#14211b] text-white shadow-sm"
                    : "bg-white text-[#13231c] shadow-sm"
                  : `${mutedText} hover:opacity-80`
              }`}
            >
              Links
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "insights"
                  ? isDark
                    ? "bg-[#14211b] text-white shadow-sm"
                    : "bg-white text-[#13231c] shadow-sm"
                  : `${mutedText} hover:opacity-80`
              }`}
            >
              Insights
            </button>
          </div>
        </div>

        {activeTab === "links" ? (
          <div className="space-y-5">
            {/* Link Maker Card */}
            <section
              className={`rounded-[22px] border backdrop-blur-xl p-4 sm:p-5 space-y-3 ${cardSurface}`}
            >
              <label
                className={`flex items-center rounded-[14px] border px-3.5 min-h-[48px] transition-all ${fieldSurface}`}
              >
                <input
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (errorText) setErrorText("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateLink();
                  }}
                  placeholder="Paste a long link (e.g. https://gamura.vercel.app)"
                  aria-label="Long link"
                  className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-60 py-2.5"
                />
              </label>

              <label
                className={`flex items-center rounded-[14px] border px-3.5 min-h-[48px] transition-all ${fieldSurface}`}
              >
                <span className={`text-sm whitespace-nowrap pr-1 ${mutedText}`}>
                  {BASE_DISPLAY_HOST}
                </span>
                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  maxLength={24}
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value);
                    if (errorText) setErrorText("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateLink();
                  }}
                  placeholder="custom-name (optional)"
                  aria-label="Custom name"
                  className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-60 py-2.5"
                />
              </label>

              {errorText && (
                <p role="alert" className="text-xs font-medium text-[#d23c3c] px-1">
                  {errorText}
                </p>
              )}

              <button
                type="button"
                onClick={handleCreateLink}
                className={`w-full min-h-[48px] rounded-[14px] font-semibold text-[15px] transition-transform active:scale-[0.985] cursor-pointer flex items-center justify-center gap-2 ${
                  isDark
                    ? "bg-[#2fd49a] hover:bg-[#1fb683] text-[#04150e]"
                    : "bg-[#0fa874] hover:bg-[#0a7d57] text-white"
                }`}
              >
                <Plus size={18} />
                <span>Create short link</span>
              </button>
            </section>

            {/* Filter links if multiple exist */}
            {links.length > 2 && (
              <div
                className={`flex items-center gap-2 rounded-2xl border px-3.5 min-h-[42px] ${fieldSurface}`}
              >
                <Search size={15} className={mutedText} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search short links or destinations"
                  aria-label="Search links"
                  className="w-full bg-transparent outline-none text-sm py-2"
                />
              </div>
            )}

            {/* Links List */}
            <section
              className={`rounded-[22px] border backdrop-blur-xl overflow-hidden ${cardSurface}`}
            >
              {!filteredLinks.length ? (
                <div className={`py-10 px-6 text-center text-sm ${mutedText}`}>
                  {links.length === 0
                    ? "No links yet. Paste one above and create your first short link."
                    : "No matching links found."}
                </div>
              ) : (
                <div
                  className={`divide-y ${
                    isDark ? "divide-white/[0.08]" : "divide-[#13231c]/[0.08]"
                  }`}
                >
                  {filteredLinks.map((link) => {
                    const hostname = extractHost(link.url);
                    const initial = hostname.charAt(0).toUpperCase() || "G";
                    return (
                      <div
                        key={link.id}
                        className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                          isDark
                            ? "hover:bg-white/[0.03]"
                            : "hover:bg-[#13231c]/[0.025]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(link.id)}
                          className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                        >
                          <div
                            className={`w-10 h-10 rounded-[12px] grid place-items-center font-bold text-base shrink-0 ${accentSoftBg} ${accentText}`}
                          >
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[15px] truncate">
                              /x/{link.slug}
                            </div>
                            <div className={`text-xs truncate ${mutedText}`}>
                              {hostname}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pr-1">
                            <div className="text-lg font-bold tracking-tight tabular-nums leading-none">
                              {link.clicks.length}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                              clicks
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(`https://${BASE_DISPLAY_HOST}${link.slug}`)}
                          title="Copy short link"
                          aria-label={`Copy ${BASE_DISPLAY_HOST}${link.slug}`}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${accentSoftBg} ${accentText}`}
                        >
                          <Copy size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedId(link.id)}
                          title="View QR & Analytics"
                          aria-label={`Open details for ${link.slug}`}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDark
                              ? "bg-white/[0.06] hover:bg-white/[0.12] text-white"
                              : "bg-[#13231c]/[0.05] hover:bg-[#13231c]/[0.1] text-[#13231c]"
                          }`}
                        >
                          <QrCode size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Insights Tab */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-[22px] border backdrop-blur-xl p-4 sm:p-5 ${cardSurface}`}
              >
                <div className="text-[32px] font-bold tracking-tight tabular-nums leading-tight">
                  {allClicks.length}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${mutedText}`}>
                  Total clicks
                </div>
              </div>
              <div
                className={`rounded-[22px] border backdrop-blur-xl p-4 sm:p-5 ${cardSurface}`}
              >
                <div className="text-[32px] font-bold tracking-tight tabular-nums leading-tight">
                  {last7DaysClicks}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${mutedText}`}>
                  Last 7 days
                </div>
              </div>
            </div>

            <div
              className={`rounded-[22px] border backdrop-blur-xl p-5 ${cardSurface}`}
            >
              <h2 className="text-base font-bold mb-2">Clicks this week</h2>
              {renderWeeklyBars(allClicks)}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div
                className={`rounded-[22px] border backdrop-blur-xl p-5 ${cardSurface}`}
              >
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Smartphone size={16} className={accentText} />
                  <span>Devices</span>
                </h2>
                {renderDimensionSplit(allClicks, "d")}
              </div>

              <div
                className={`rounded-[22px] border backdrop-blur-xl p-5 ${cardSurface}`}
              >
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Globe size={16} className={accentText} />
                  <span>Countries</span>
                </h2>
                {renderDimensionSplit(allClicks, "c")}
              </div>
            </div>

            {topLink && topLink.clicks.length > 0 && (
              <div
                className={`rounded-[22px] border backdrop-blur-xl p-5 flex items-center justify-between gap-3 ${cardSurface}`}
              >
                <div>
                  <h2 className="text-base font-bold mb-0.5">Top link</h2>
                  <p className={`text-sm ${mutedText}`}>
                    <strong className={isDark ? "text-white" : "text-[#13231c]"}>
                      /x/{topLink.slug}
                    </strong>{" "}
                    with{" "}
                    <span className="tabular-nums font-semibold">
                      {topLink.clicks.length}
                    </span>{" "}
                    clicks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(topLink.id)}
                  className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${accentSoftBg} ${accentText}`}
                >
                  Open Details
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Gamura Links mobile navigation"
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 py-2.5 backdrop-blur-2xl border-t ${
          isDark
            ? "bg-[#07110d]/85 border-white/[0.08]"
            : "bg-[#f2f6f4]/85 border-[#13231c]/[0.08]"
        }`}
      >
        <div
          role="tablist"
          className={`flex gap-1.5 p-1 rounded-2xl w-full max-w-[340px] ${accentSoftBg}`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "links"}
            onClick={() => {
              setActiveTab("links");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex-1 min-h-[42px] rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "links"
                ? isDark
                  ? "bg-[#14211b] text-white shadow-sm"
                  : "bg-white text-[#13231c] shadow-sm"
                : mutedText
            }`}
          >
            <Link2 size={15} />
            <span>Links</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "insights"}
            onClick={() => {
              setActiveTab("insights");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex-1 min-h-[42px] rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "insights"
                ? isDark
                  ? "bg-[#14211b] text-white shadow-sm"
                  : "bg-white text-[#13231c] shadow-sm"
                : mutedText
            }`}
          >
            <BarChart3 size={15} />
            <span>Insights</span>
          </button>
        </div>
      </nav>

      {/* Link Details Bottom Sheet / Modal */}
      {selectedLink && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Link details"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] p-5 pb-7 shadow-2xl border ${
              isDark
                ? "bg-[#07110d] border-white/[0.12] text-[#e8f3ee]"
                : "bg-[#f2f6f4] border-[#13231c]/[0.1] text-[#13231c]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8" />
              <div
                className={`w-10 h-1.5 rounded-full ${
                  isDark ? "bg-white/20" : "bg-[#13231c]/15"
                }`}
              />
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close link details"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark
                    ? "bg-white/10 hover:bg-white/15 text-white"
                    : "bg-white hover:bg-[#e5ede9] text-[#13231c]"
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scannable QR Preview */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-3.5 rounded-[20px] shadow-md mb-3">
                <QRCodeSVG
                  value={`https://${BASE_DISPLAY_HOST}${selectedLink.slug}`}
                  size={152}
                  fgColor={qrTint}
                  bgColor="#ffffff"
                  level="M"
                />
                <div className="hidden" aria-hidden="true">
                  <QRCodeCanvas
                    id="gamura-links-qr-canvas"
                    value={`https://${BASE_DISPLAY_HOST}${selectedLink.slug}`}
                    size={512}
                    fgColor={qrTint}
                    bgColor="#ffffff"
                    level="M"
                  />
                </div>
              </div>

              {/* Quick QR color swatches */}
              <div className="flex items-center gap-2 mb-3">
                {LINKS_QR_COLORS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setQrTint(preset.color)}
                    aria-label={`QR color ${preset.label}`}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                      qrTint === preset.color
                        ? "scale-110 ring-2 ring-[#0fa874] border-white"
                        : "border-white/70"
                    }`}
                    style={{ backgroundColor: preset.color }}
                  />
                ))}
              </div>

              <p className="text-center text-lg font-bold tracking-tight break-all">
                {BASE_DISPLAY_HOST}
                {selectedLink.slug}
              </p>
              <p className={`text-center text-xs break-all mt-0.5 mb-4 ${mutedText}`}>
                {selectedLink.url}
              </p>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() =>
                  handleCopy(`https://${BASE_DISPLAY_HOST}${selectedLink.slug}`)
                }
                className={`min-h-[44px] rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? "bg-[#2fd49a] text-[#04150e]"
                    : "bg-[#0fa874] text-white"
                }`}
              >
                <Copy size={15} />
                <span>Copy link</span>
              </button>

              <button
                type="button"
                onClick={handleSaveQrPng}
                className={`min-h-[44px] rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer ${accentSoftBg} ${accentText}`}
              >
                <Download size={15} />
                <span>Save QR</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddTestClick(selectedLink.id)}
                className={`min-h-[42px] rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer ${accentSoftBg} ${accentText}`}
              >
                <Sparkles size={14} />
                <span>Add a test click</span>
              </button>

              <a
                href={selectedLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAddTestClick(selectedLink.id)}
                className={`min-h-[42px] rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 ${accentSoftBg} ${accentText}`}
              >
                <ExternalLink size={14} />
                <span>Open URL</span>
              </a>

              <button
                type="button"
                onClick={() => handleDeleteLink(selectedLink.id)}
                className="col-span-2 min-h-[40px] rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 bg-[#d23c3c]/12 text-[#d23c3c] hover:bg-[#d23c3c]/20 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete link</span>
              </button>
            </div>

            {/* Link Telemetry Cards */}
            <div className="space-y-3">
              <div className={`rounded-[20px] border p-4 ${cardSurface}`}>
                <h3 className="text-sm font-bold mb-1">Clicks this week</h3>
                {renderWeeklyBars(selectedLink.clicks)}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className={`rounded-[20px] border p-4 ${cardSurface}`}>
                  <h3 className="text-sm font-bold mb-2.5">Devices</h3>
                  {renderDimensionSplit(selectedLink.clicks, "d")}
                </div>
                <div className={`rounded-[20px] border p-4 ${cardSurface}`}>
                  <h3 className="text-sm font-bold mb-2.5">Countries</h3>
                  {renderDimensionSplit(selectedLink.clicks, "c")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className={`fixed left-1/2 -translate-x-1/2 bottom-20 sm:bottom-8 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg pointer-events-none ${
            isDark
              ? "bg-[#e8f3ee] text-[#07110d]"
              : "bg-[#13231c] text-white"
          }`}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
