import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Home,
  LayoutGrid,
  Plus,
  Star,
  ShieldCheck,
  ExternalLink,
  X,
  Trash2,
  Check,
  Download,
} from "lucide-react";

export const LAUNCH_LOGO_SRC = "/assets/aistudio/1794679627931_b0492bbb.png";
export const LAUNCH_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1FqBAdXuyDDSSuYtd3iZzf9x5PM8orKrd";

export interface StoreAppItem {
  id: string;
  name: string;
  cat: string;
  tag: string;
  desc: string;
  url: string;
  c1: string;
  c2: string;
  rating: number;
  dl: string;
  size: string;
  isBuiltin?: boolean;
}

const BUILTIN_APPS: StoreAppItem[] = [
  {
    id: "gamura",
    name: "Gamura",
    cat: "Platform",
    tag: "The home of the Gamura ecosystem",
    desc: "Gamura is the main hub of the ecosystem: gaming, tools and creator features in one cinematic, fast web experience. Create your profile, explore features and jump into every Gamura app from one place.",
    url: "https://gamura.vercel.app/",
    c1: "#3bff8b",
    c2: "#0b8f5e",
    rating: 4.9,
    dl: "10K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "galaxy",
    name: "Gamura Galaxy",
    cat: "Games",
    tag: "Explore the Gamura universe",
    desc: "Gamura Galaxy is the gaming universe of Gamura. Discover games, challenges and community content inside a glowing galaxy-style interface.",
    url: "https://gamuragalaxy.vercel.app/",
    c1: "#3b8bff",
    c2: "#1b3fa8",
    rating: 4.8,
    dl: "5K+",
    size: "Web · 3 MB",
    isBuiltin: true,
  },
  {
    id: "gcp",
    name: "GCP · Gamura Code Preview",
    cat: "Developer tools",
    tag: "Write code. See it live.",
    desc: "Gamura Code Preview (GCP) lets you write HTML, CSS and JavaScript and instantly preview the result in your browser. Built for students and developers who ship fast.",
    url: "https://gamuracp.vercel.app/",
    c1: "#ffd93b",
    c2: "#d98a00",
    rating: 4.7,
    dl: "3K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "world",
    name: "Gamura World",
    cat: "Platform",
    tag: "The official hub for every Gamura venture",
    desc: "Gamura World is the unified project hub that connects all Gamura ventures: apps, games, tools and news in one world.",
    url: "https://gamuraworld.vercel.app/",
    c1: "#ff4444",
    c2: "#a3121f",
    rating: 4.8,
    dl: "2K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gpdf",
    name: "Gamura PDF Studio",
    cat: "Productivity",
    tag: "Create, edit, merge & compress PDFs",
    desc: "Gamura PDF Studio gives you five fast browser-side PDF tools: PDF Creator, PDF Editor, Merge & Convert, Compress, and Ultra Modifier canvas studio.",
    url: "/gpdf",
    c1: "#10b981",
    c2: "#047857",
    rating: 4.9,
    dl: "4K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
];

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

type StorePage = "home" | "search" | "lib" | "dev";
type HomeTab = "foryou" | "top" | "cats" | "new";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage errors
  }
}

function AppTileIcon({
  app,
  sizeClass = "w-16 h-16 text-2xl",
}: {
  app: StoreAppItem;
  sizeClass?: string;
}) {
  return (
    <div
      style={{
        background: `linear-gradient(145deg, ${app.c1}, ${app.c2})`,
      }}
      className={`${sizeClass} rounded-[22%] flex items-center justify-center text-white font-bold shadow-[0_3px_10px_rgba(0,0,0,0.12)] shrink-0 select-none`}
    >
      {app.name.trim().charAt(0).toUpperCase() || "G"}
    </div>
  );
}

export default function GamuraStoreLaunch({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [logoFallback, setLogoFallback] = useState(false);
  const [page, setPage] = useState<StorePage>("home");
  const [tab, setTab] = useState<HomeTab>("foryou");
  const [queryText, setQueryText] = useState("");
  const [customApps, setCustomApps] = useState<StoreAppItem[]>(() =>
    readStorage<StoreAppItem[]>("gs_custom", []),
  );
  const [installedIds, setInstalledIds] = useState<string[]>(() =>
    readStorage<string[]>("gs_inst", []),
  );
  const [selectedApp, setSelectedApp] = useState<StoreAppItem | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installPct, setInstallPct] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Developer publish form state
  const [fName, setFName] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fTag, setFTag] = useState("");
  const [fCat, setFCat] = useState("Platform");
  const [fDesc, setFDesc] = useState("");
  const [fC1, setFC1] = useState("#3bff8b");
  const [fC2, setFC2] = useState("#0b8f5e");

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Launch · Gamura Store";
    return () => {
      document.title = prev;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  };

  const allApps = useMemo(
    () => [...BUILTIN_APPS, ...customApps],
    [customApps],
  );

  const filteredApps = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return allApps;
    return allApps.filter((a) =>
      `${a.name} ${a.cat} ${a.tag} ${a.desc}`.toLowerCase().includes(q),
    );
  }, [allApps, queryText]);

  const categories = useMemo(
    () => Array.from(new Set(allApps.map((a) => a.cat))),
    [allApps],
  );

  const handleInstall = (app: StoreAppItem) => {
    if (installedIds.includes(app.id) || installingId === app.id) return;
    setInstallingId(app.id);
    setInstallPct(8);
    let progress = 8;
    const timer = window.setInterval(() => {
      progress += 14 + Math.random() * 14;
      if (progress >= 100) {
        window.clearInterval(timer);
        setInstallPct(100);
        setInstalledIds((prev) => {
          const next = prev.includes(app.id) ? prev : [...prev, app.id];
          writeStorage("gs_inst", next);
          return next;
        });
        setInstallingId(null);
        setInstallPct(0);
        showToast(`${app.name} installed`);
      } else {
        setInstallPct(Math.min(96, Math.round(progress)));
      }
    }, 110);
  };

  const handleUninstall = (id: string) => {
    setInstalledIds((prev) => {
      const next = prev.filter((item) => item !== id);
      writeStorage("gs_inst", next);
      return next;
    });
    showToast("Removed from My apps");
  };

  const handlePublishApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fName.trim();
    if (!cleanName || !fUrl.trim()) return;
    let normalizedUrl = fUrl.trim();
    if (
      !normalizedUrl.startsWith("/") &&
      !/^https?:\/\//i.test(normalizedUrl)
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const created: StoreAppItem = {
      id: `c_${Date.now()}`,
      name: cleanName,
      cat: fCat,
      tag: fTag.trim() || "New on Gamura Store",
      desc: fDesc.trim() || `${cleanName} is now available on Gamura Store.`,
      url: normalizedUrl,
      c1: fC1,
      c2: fC2,
      rating: 4.6,
      dl: "New",
      size: "Web · 1 MB",
    };

    const next = [...customApps, created];
    setCustomApps(next);
    writeStorage("gs_custom", next);
    setFName("");
    setFUrl("");
    setFTag("");
    setFDesc("");
    showToast(`${cleanName} added to Gamura Store`);
    setPage("home");
    setTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCustom = (id: string) => {
    const nextCustom = customApps.filter((a) => a.id !== id);
    const nextInst = installedIds.filter((i) => i !== id);
    setCustomApps(nextCustom);
    setInstalledIds(nextInst);
    writeStorage("gs_custom", nextCustom);
    writeStorage("gs_inst", nextInst);
    if (selectedApp?.id === id) setSelectedApp(null);
    showToast("App removed");
  };

  const renderAppRow = (app: StoreAppItem, rank?: number) => {
    const isInstalled = installedIds.includes(app.id);
    return (
      <button
        key={app.id}
        type="button"
        onClick={() => setSelectedApp(app)}
        className="w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors text-left cursor-pointer"
      >
        {rank !== undefined && (
          <span className="w-5 text-xs font-bold text-[#6E6E73] tabular-nums shrink-0 text-center">
            {rank}
          </span>
        )}
        <AppTileIcon app={app} sizeClass="w-14 h-14 text-xl" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#1D1D1F] truncate">
            {app.name}
          </div>
          <div className="text-xs text-[#6E6E73] truncate">
            {app.cat} · {app.tag}
          </div>
          <div className="text-[11px] text-[#6E6E73] mt-0.5 tabular-nums">
            {app.rating} ★ · {app.size}
          </div>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap border transition-colors ${
            isInstalled
              ? "bg-[#0b8f5e] text-white border-[#0b8f5e]"
              : "bg-white text-[#0b8f5e] border-zinc-200/80"
          }`}
        >
          {isInstalled ? "Open" : "Install"}
        </span>
      </button>
    );
  };

  const renderAppTile = (app: StoreAppItem) => (
    <button
      key={app.id}
      type="button"
      onClick={() => setSelectedApp(app)}
      className="w-[116px] sm:w-[124px] shrink-0 text-left group cursor-pointer space-y-2"
    >
      <div className="group-hover:scale-[1.03] transition-transform">
        <AppTileIcon app={app} sizeClass="w-[116px] h-[116px] sm:w-[124px] sm:h-[124px] text-4xl" />
      </div>
      <div>
        <div className="text-xs font-semibold text-[#1D1D1F] truncate">
          {app.name}
        </div>
        <div className="text-[11px] text-[#6E6E73] tabular-nums">
          {app.rating} ★ · {app.dl}
        </div>
      </div>
    </button>
  );

  const ratingBars = [72, 18, 6, 3, 1];

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col pb-24"
    >
      {/* Top Apple Header Bar with Launch Logo Top-Left */}
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
          {/* Top-Left Launch Logo + Back Home */}
          <button
            type="button"
            onClick={onBackHome}
            title="Back to Gamura Home"
            className="min-h-[40px] flex items-center gap-2 pr-3 pl-1.5 py-1 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/80 transition-colors cursor-pointer shrink-0"
          >
            <img
              src={logoFallback ? LAUNCH_LOGO_FALLBACK : LAUNCH_LOGO_SRC}
              alt="Gamura Launch"
              referrerPolicy="no-referrer"
              onError={() => setLogoFallback(true)}
              className="w-7 h-7 rounded-full object-contain scale-[1.12] mix-blend-multiply bg-white"
            />
            <span className="text-xs font-semibold text-[#1D1D1F] whitespace-nowrap">
              Home
            </span>
          </button>

          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2.5 bg-[#F5F5F7] border border-zinc-200/80 focus-within:bg-white focus-within:border-[#0b8f5e] rounded-full px-3.5 py-2 transition-all min-w-0">
            <Search size={15} className="text-[#6E6E73] shrink-0" />
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search Gamura Store"
              aria-label="Search Gamura Store"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] min-w-0"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => setQueryText("")}
                aria-label="Clear search"
                className="text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <a
            href="/gpdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0b8f5e] hover:bg-[#09774e] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>G PDF Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Store Filter Tabs on Home */}
        {page === "home" && !queryText.trim() && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-black/[0.04]">
            {[
              { id: "foryou" as const, label: "For you" },
              { id: "top" as const, label: "Top charts" },
              { id: "cats" as const, label: "Categories" },
              { id: "new" as const, label: "New" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  tab === t.id
                    ? "text-[#0b8f5e] border-[#0b8f5e]"
                    : "text-[#6E6E73] border-transparent hover:text-[#1D1D1F]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Centered Launch Hero Branding Banner */}
        {page === "home" && !queryText.trim() && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl px-5 py-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <img
                src={logoFallback ? LAUNCH_LOGO_FALLBACK : LAUNCH_LOGO_SRC}
                alt="Gamura Launch Logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoFallback(true)}
                className="w-full h-full object-contain scale-[1.08] mix-blend-multiply"
              />
            </div>
            <div className="space-y-1 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Gamura Launch Store
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6E73]">
                Discover, install, and launch every Gamura web app in one fast
                Apple-style marketplace.
              </p>
            </div>
          </div>
        )}

        {/* Search Results View */}
        {queryText.trim() ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-[#1D1D1F] px-2 pb-1">
              Search Results ({filteredApps.length})
            </h2>
            {filteredApps.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {filteredApps.map((app) => renderAppRow(app))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[#6E6E73]">
                No results for “{queryText}”
              </div>
            )}
          </div>
        ) : page === "home" ? (
          <>
            {tab === "foryou" && (
              <div className="space-y-6">
                {/* Featured Horizontal Snap Carousel */}
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                  {allApps.slice(0, 5).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      style={{
                        background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
                      }}
                      className="min-w-[270px] sm:min-w-[320px] flex-1 snap-center rounded-[22px] p-5 min-h-[168px] text-white text-left relative overflow-hidden flex flex-col justify-end shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                    >
                      <span className="absolute -right-2 -top-4 text-[120px] font-black opacity-15 pointer-events-none select-none leading-none">
                        {app.name.charAt(0)}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">
                        Featured
                      </span>
                      <div className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                        {app.name}
                      </div>
                      <div className="text-xs sm:text-sm opacity-90 line-clamp-1">
                        {app.tag}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Gamura Originals Horizontal Row */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                      Gamura originals
                    </h2>
                    <span className="text-xs font-semibold text-[#0b8f5e]">
                      {allApps.length} apps
                    </span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {allApps.map(renderAppTile)}
                  </div>
                </div>

                {/* Suggested for you */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F] px-2 pb-1">
                    Suggested for you
                  </h2>
                  <div className="divide-y divide-zinc-100">
                    {[...allApps].reverse().map((app) => renderAppRow(app))}
                  </div>
                </div>
              </div>
            )}

            {tab === "top" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F] px-2 pb-1">
                  Top free apps
                </h2>
                <div className="divide-y divide-zinc-100">
                  {[...allApps]
                    .sort((a, b) => b.rating - a.rating)
                    .map((app, i) => renderAppRow(app, i + 1))}
                </div>
              </div>
            )}

            {tab === "cats" && (
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                      {cat}
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                      {allApps
                        .filter((a) => a.cat === cat)
                        .map(renderAppTile)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "new" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F] px-2 pb-1">
                  New &amp; updated
                </h2>
                <div className="divide-y divide-zinc-100">
                  {[...allApps].reverse().map((app) => renderAppRow(app))}
                </div>
              </div>
            )}
          </>
        ) : page === "search" ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
              Popular searches
            </h2>
            <div className="divide-y divide-zinc-100">
              {allApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setQueryText(app.name)}
                  className="w-full flex items-center gap-3 py-3 px-2 hover:bg-[#F5F5F7] rounded-xl text-left text-sm font-medium text-[#1D1D1F] cursor-pointer"
                >
                  <Search size={14} className="text-[#6E6E73]" />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : page === "lib" ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
              Installed apps
            </h2>
            {allApps.filter((a) => installedIds.includes(a.id)).length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {allApps
                  .filter((a) => installedIds.includes(a.id))
                  .map((app) => renderAppRow(app))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium text-[#1D1D1F]">
                  Nothing installed yet.
                </p>
                <p className="text-xs text-[#6E6E73]">
                  Open any app from Home and tap Install.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Developer Publish Tab */
          <div className="space-y-5">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                  Publish an app
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Add a web app to your Gamura Launch Store catalog.
                </p>
              </div>

              <form onSubmit={handlePublishApp} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    maxLength={40}
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="App name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0b8f5e]"
                  />
                  <input
                    required
                    type="text"
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                    placeholder="App link (https://…)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0b8f5e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    maxLength={60}
                    value={fTag}
                    onChange={(e) => setFTag(e.target.value)}
                    placeholder="Short tagline"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0b8f5e]"
                  />
                  <select
                    value={fCat}
                    onChange={(e) => setFCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0b8f5e]"
                  >
                    {[
                      "Platform",
                      "Games",
                      "Developer tools",
                      "Productivity",
                      "Creative",
                      "Education",
                      "Utilities",
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={3}
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0b8f5e]"
                />

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6E6E73]">
                  <span>Icon Colors:</span>
                  <input
                    type="color"
                    value={fC1}
                    onChange={(e) => setFC1(e.target.value)}
                    aria-label="Primary gradient color"
                    className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={fC2}
                    onChange={(e) => setFC2(e.target.value)}
                    aria-label="Secondary gradient color"
                    className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-[#0b8f5e] hover:bg-[#09774e] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Add to Gamura Store
                </button>
              </form>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Your added apps
              </h2>
              {customApps.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {customApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3.5 py-3"
                    >
                      <AppTileIcon app={app} sizeClass="w-12 h-12 text-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1D1D1F] truncate">
                          {app.name}
                        </div>
                        <div className="text-xs text-[#6E6E73]">{app.cat}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(app.id)}
                        className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6E6E73] py-4 text-center">
                  No custom apps published yet.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Apple Store Navigation */}
      <nav
        aria-label="Gamura Store Navigation"
        className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[calc(100vw-20px)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center p-1.5 gap-1 rounded-[28px] bg-white/92 backdrop-blur-2xl border border-zinc-200/80 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.14)]">
          {[
            { id: "home" as const, label: "Home", icon: Home },
            { id: "search" as const, label: "Search", icon: Search },
            { id: "lib" as const, label: "My apps", icon: LayoutGrid },
            { id: "dev" as const, label: "Developer", icon: Plus },
          ].map((navItem) => {
            const Icon = navItem.icon;
            const active = page === navItem.id;
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => {
                  setPage(navItem.id);
                  setQueryText("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`min-h-[46px] min-w-[68px] sm:min-w-[84px] px-3 py-1.5 rounded-[22px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#0b8f5e]/12 text-[#0b8f5e] font-semibold"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] font-medium"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                <span className="text-[10px] tracking-tight leading-none">
                  {navItem.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* App Detail Modal Sheet */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] overflow-y-auto shadow-2xl border border-zinc-200/80 pb-8"
          >
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between border-b border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D1D1F] cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <span className="text-xs font-semibold text-[#6E6E73]">
                Gamura Store
              </span>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* App Header */}
              <div className="flex items-center gap-4">
                <AppTileIcon app={selectedApp} sizeClass="w-20 h-20 text-3xl" />
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                    {selectedApp.name}
                  </h2>
                  <div className="text-xs sm:text-sm font-semibold text-[#0b8f5e]">
                    Gamura Studios
                  </div>
                  <div className="text-xs text-[#6E6E73] mt-0.5">
                    {selectedApp.cat}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 py-3 border-y border-zinc-100 text-center">
                <div>
                  <div className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                    {selectedApp.rating} ★
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">Rating</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                    {selectedApp.dl}
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">Downloads</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    {selectedApp.size.split(" · ")[1] || "1 MB"}
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">Size</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1D1D1F]">3+</div>
                  <div className="text-[11px] text-[#6E6E73]">Rated for</div>
                </div>
              </div>

              {/* Primary Install / Open CTA */}
              <div className="flex items-center gap-3">
                {installedIds.includes(selectedApp.id) ? (
                  <>
                    <a
                      href={selectedApp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[46px] rounded-full bg-[#0b8f5e] hover:bg-[#09774e] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleUninstall(selectedApp.id)}
                      className="min-h-[46px] px-5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-sm font-semibold text-[#1D1D1F] cursor-pointer"
                    >
                      Uninstall
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={installingId === selectedApp.id}
                    onClick={() => handleInstall(selectedApp)}
                    className="relative flex-1 min-h-[46px] rounded-full bg-[#0b8f5e] hover:bg-[#09774e] text-white text-sm font-semibold overflow-hidden cursor-pointer flex items-center justify-center gap-2"
                  >
                    {installingId === selectedApp.id && (
                      <span
                        style={{ width: `${installPct}%` }}
                        className="absolute inset-y-0 left-0 bg-white/25 transition-all"
                      />
                    )}
                    <Download size={15} className="relative z-10" />
                    <span className="relative z-10">
                      {installingId === selectedApp.id
                        ? `Installing… ${installPct}%`
                        : "Install"}
                    </span>
                  </button>
                )}
              </div>

              {/* Visual Showcase Cards */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {["Discover", "Play", "Create"].map((word, idx) => (
                  <div
                    key={word}
                    style={{
                      background: `linear-gradient(${150 + idx * 40}deg, ${selectedApp.c1}, ${selectedApp.c2})`,
                    }}
                    className="w-40 h-60 shrink-0 rounded-2xl p-4 text-white flex flex-col justify-between shadow-xs"
                  >
                    <span className="text-3xl font-black opacity-35">
                      {selectedApp.name.charAt(0)}
                      {idx + 1}
                    </span>
                    <div className="text-sm font-bold leading-snug">
                      {word} with
                      <br />
                      {selectedApp.name.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  About this app
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  {selectedApp.desc}
                </p>
              </div>

              {/* Data Safety */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="text-[#0b8f5e] shrink-0 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1D1D1F]">
                    Data safety
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    No data is shared with third parties. Gamura apps run in
                    your browser and keep your data on your device unless you
                    sign in.
                  </p>
                </div>
              </div>

              {/* Ratings Distribution */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  Ratings &amp; reviews
                </h3>
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <div className="text-4xl font-light text-[#1D1D1F] tabular-nums">
                      {selectedApp.rating}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 text-[#0b8f5e] mt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={12} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingBars.map((pct, i) => (
                      <div
                        key={5 - i}
                        className="flex items-center gap-2 text-[11px] text-[#6E6E73]"
                      >
                        <span className="w-2.5 tabular-nums">{5 - i}</span>
                        <div className="flex-1 h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-[#0b8f5e] rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* More from Gamura Studios */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  More from Gamura Studios
                </h3>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
                  {allApps
                    .filter((a) => a.id !== selectedApp.id)
                    .map(renderAppTile)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-lg flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
