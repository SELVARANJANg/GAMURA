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
  Share,
  Globe,
  Smartphone,
  Layers,
} from "lucide-react";
import StoreAppGlyph from "./StoreAppGlyph";
import {
  type StoreAppItem,
  BUILTIN_STORE_APPS,
  CUSTOM_STORE_APPS_KEY,
  LEGACY_INSTALLED_KEY,
  UNIVERSE_APPS_KEY,
  MOBILE_APPS_KEY,
  readStoreJson,
  writeStoreJson,
  addAppToUniverse,
  removeAppFromUniverse,
  addMobileInstalledId,
  removeMobileInstalledId,
  downloadStandaloneAppPackage,
} from "../utils/gamuraStoreApps";

export const LAUNCH_LOGO_SRC = "/assets/aistudio/1794679627931_b0492bbb.png";
export const LAUNCH_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1FqBAdXuyDDSSuYtd3iZzf9x5PM8orKrd";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

type StorePage = "home" | "search" | "lib" | "dev";
type HomeTab = "foryou" | "games" | "top" | "cats" | "new";
type InstallDestination = "universe" | "mobile" | "both";

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
    readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []),
  );
  const [universeApps, setUniverseApps] = useState<StoreAppItem[]>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []),
  );
  const [mobileIds, setMobileIds] = useState<string[]>(() =>
    readStoreJson<string[]>(MOBILE_APPS_KEY, []),
  );

  const [selectedApp, setSelectedApp] = useState<StoreAppItem | null>(null);
  const [promptApp, setPromptApp] = useState<StoreAppItem | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installPct, setInstallPct] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Developer publish form state
  const [fName, setFName] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fTag, setFTag] = useState("");
  const [fCat, setFCat] = useState("Platform");
  const [fDesc, setFDesc] = useState("");
  const [fC1, setFC1] = useState("#34d399");
  const [fC2, setFC2] = useState("#059669");

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Launch Store";
    return () => {
      document.title = prev;
    };
  }, []);

  // Keep synced with storage changes across tabs (e.g. uninstall from Universe tab)
  useEffect(() => {
    const syncState = () => {
      setUniverseApps(readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []));
      setMobileIds(readStoreJson<string[]>(MOBILE_APPS_KEY, []));
      setCustomApps(readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []));
    };
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  };

  const allApps = useMemo(
    () => [...BUILTIN_STORE_APPS, ...customApps],
    [customApps],
  );

  const installedIdSet = useMemo(() => {
    const ids = new Set<string>(mobileIds);
    universeApps.forEach((a) => ids.add(a.id));
    return ids;
  }, [mobileIds, universeApps]);

  const isInUniverse = (id: string) => universeApps.some((a) => a.id === id);
  const isInMobile = (id: string) => mobileIds.includes(id);

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

  // Clicking GET or Download opens the destination prompt question
  const handleGetClick = (
    app: StoreAppItem,
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    if (e) e.stopPropagation();
    if (installingId === app.id) return;
    if (installedIdSet.has(app.id)) {
      setSelectedApp(app);
      return;
    }
    setPromptApp(app);
  };

  // Run animated install after user answers where they want to use the app
  const executeInstallWithDestination = (
    app: StoreAppItem,
    destination: InstallDestination,
  ) => {
    setPromptApp(null);
    setInstallingId(app.id);
    setInstallPct(12);

    let progress = 12;
    const timer = window.setInterval(() => {
      progress += 18 + Math.random() * 14;
      if (progress >= 100) {
        window.clearInterval(timer);
        setInstallingId(null);
        setInstallPct(0);

        if (destination === "universe" || destination === "both") {
          const updatedU = addAppToUniverse(app);
          setUniverseApps(updatedU);
        }
        if (destination === "mobile" || destination === "both") {
          const updatedM = addMobileInstalledId(app.id);
          setMobileIds(updatedM);
          downloadStandaloneAppPackage(app);
        }

        // Sync legacy installed key for full compatibility
        const legacy = readStoreJson<string[]>(LEGACY_INSTALLED_KEY, []);
        if (!legacy.includes(app.id)) {
          writeStoreJson(LEGACY_INSTALLED_KEY, [...legacy, app.id]);
        }

        if (destination === "universe") {
          showToast(`${app.name} added to Universe Apps ✓`);
        } else if (destination === "mobile") {
          showToast(`${app.name} downloaded for Mobile App ✓`);
        } else {
          showToast(`${app.name} installed in Universe & Mobile ✓`);
        }
      } else {
        setInstallPct(Math.min(95, Math.round(progress)));
      }
    }, 95);
  };

  const handleUninstallAll = (app: StoreAppItem) => {
    const nextU = removeAppFromUniverse(app.id);
    const nextM = removeMobileInstalledId(app.id);
    setUniverseApps(nextU);
    setMobileIds(nextM);
    const legacy = readStoreJson<string[]>(LEGACY_INSTALLED_KEY, []).filter(
      (id) => id !== app.id,
    );
    writeStoreJson(LEGACY_INSTALLED_KEY, legacy);
    showToast(`${app.name} uninstalled`);
  };

  const handleToggleUniverse = (app: StoreAppItem) => {
    if (isInUniverse(app.id)) {
      setUniverseApps(removeAppFromUniverse(app.id));
      showToast(`Removed ${app.name} from Universe Apps`);
    } else {
      setUniverseApps(addAppToUniverse(app));
      showToast(`Added ${app.name} to Universe Apps ✓`);
    }
  };

  const handleShareApp = async (app: StoreAppItem) => {
    const fullUrl = app.url.startsWith("/")
      ? `${window.location.origin}${app.url}`
      : app.url;
    try {
      if (navigator.share) {
        await navigator.share({
          title: app.name,
          text: app.tag,
          url: fullUrl,
        });
        return;
      }
    } catch {
      // fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast("App link copied ✓");
    } catch {
      showToast(fullUrl);
    }
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
      iconKind: "letter",
      rating: 4.8,
      age: "3+",
      chart: "New",
      dl: "New",
      size: "Web · 1 MB",
    };

    const next = [...customApps, created];
    setCustomApps(next);
    writeStoreJson(CUSTOM_STORE_APPS_KEY, next);
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
    setCustomApps(nextCustom);
    writeStoreJson(CUSTOM_STORE_APPS_KEY, nextCustom);
    setUniverseApps(removeAppFromUniverse(id));
    setMobileIds(removeMobileInstalledId(id));
    if (selectedApp?.id === id) setSelectedApp(null);
    showToast("App removed from Store");
  };

  const renderAppRow = (app: StoreAppItem, rank?: number) => {
    const isInstalled = installedIdSet.has(app.id);
    const isInstalling = installingId === app.id;
    return (
      <div
        key={app.id}
        onClick={() => setSelectedApp(app)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedApp(app);
          }
        }}
        className="w-full flex items-center gap-3.5 py-3.5 px-2.5 sm:px-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors text-left cursor-pointer"
      >
        {rank !== undefined && (
          <span className="w-5 text-xs font-bold text-[#6E6E73] tabular-nums shrink-0 text-center">
            {rank}
          </span>
        )}
        <StoreAppGlyph app={app} sizeClass="w-14 h-14 text-2xl" iconPx={26} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-[#1D1D1F] truncate">
            {app.name}
          </div>
          <div className="text-xs sm:text-[13px] text-[#6E6E73] truncate">
            {app.tag}
          </div>
          <div className="text-[11px] text-[#6E6E73] mt-0.5 tabular-nums flex items-center gap-1.5">
            <span>{app.cat}</span>
            <span aria-hidden="true">·</span>
            <span>{app.rating} ★</span>
            {isInUniverse(app.id) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#059669] font-semibold">Universe</span>
              </>
            )}
          </div>
        </div>

        {isInstalling ? (
          <div className="px-4 py-1.5 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums shrink-0">
            {installPct}%
          </div>
        ) : isInstalled ? (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide shrink-0 whitespace-nowrap transition-colors"
          >
            OPEN
          </a>
        ) : (
          <button
            type="button"
            onClick={(e) => handleGetClick(app, e)}
            className="px-5 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide shrink-0 whitespace-nowrap cursor-pointer transition-colors"
          >
            GET
          </button>
        )}
      </div>
    );
  };

  const renderAppTile = (app: StoreAppItem) => (
    <button
      key={app.id}
      type="button"
      onClick={() => setSelectedApp(app)}
      className="w-[116px] sm:w-[126px] shrink-0 text-left group cursor-pointer space-y-2"
    >
      <div className="group-hover:scale-[1.03] transition-transform">
        <StoreAppGlyph
          app={app}
          sizeClass="w-[116px] h-[116px] sm:w-[126px] sm:h-[126px] text-4xl"
          iconPx={46}
        />
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

          <div className="flex-1 flex items-center gap-2.5 bg-[#F5F5F7] border border-zinc-200/80 focus-within:bg-white focus-within:border-[#059669] rounded-full px-3.5 py-2 transition-all min-w-0">
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
            className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>G PDF Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Filter Tabs */}
        {page === "home" && !queryText.trim() && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-black/[0.04]">
            {[
              { id: "foryou" as const, label: "For you" },
              { id: "games" as const, label: "Games" },
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
                    ? "text-[#059669] border-[#059669]"
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
                Download apps directly into your Universe Apps dock or save to
                your mobile device.
              </p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {queryText.trim() ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-[#1D1D1F] px-2 pb-1">
              Discover ({filteredApps.length})
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
                {/* Gamura Veo Spotlight Card */}
                {(() => {
                  const veoApp = allApps.find((a) => a.id === "veo");
                  if (!veoApp) return null;
                  const veoInstalled = installedIdSet.has(veoApp.id);
                  const veoInstalling = installingId === veoApp.id;
                  return (
                    <div
                      onClick={() => setSelectedApp(veoApp)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedApp(veoApp);
                        }
                      }}
                      className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <StoreAppGlyph
                          app={veoApp}
                          sizeClass="w-16 h-16 sm:w-18 sm:h-18"
                          iconPx={32}
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                            Spotlight · Video Studio
                          </span>
                          <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight truncate">
                            {veoApp.name}
                          </h2>
                          <p className="text-xs text-[#6E6E73] truncate">
                            {veoApp.tag}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {veoInstalling ? (
                          <span className="px-5 py-2 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums">
                            {installPct}%
                          </span>
                        ) : veoInstalled ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUninstallAll(veoApp);
                            }}
                            className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#6E6E73] cursor-pointer transition-colors"
                          >
                            Uninstall
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleGetClick(veoApp, e)}
                            className="px-5 py-2 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide cursor-pointer transition-colors"
                          >
                            GET
                          </button>
                        )}
                        <a
                          href={veoApp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-5 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <span>OPEN</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {/* Featured Carousel */}
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                  {allApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      style={{
                        background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
                      }}
                      className="min-w-[260px] sm:min-w-[300px] flex-1 snap-center rounded-[22px] p-5 min-h-[172px] text-white text-left relative overflow-hidden flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                    >
                      <span className="absolute -right-2 -top-4 text-[120px] font-black opacity-15 pointer-events-none select-none leading-none">
                        {app.name.charAt(0)}
                      </span>
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <StoreAppGlyph
                          app={app}
                          sizeClass="w-12 h-12 text-lg"
                          iconPx={22}
                        />
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase">
                          {app.cat}
                        </span>
                      </div>
                      <div className="relative z-10 mt-3">
                        <div className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
                          {app.name}
                        </div>
                        <div className="text-xs opacity-90 line-clamp-1 mt-0.5">
                          {app.tag}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Games on Launch (GAINOSOR, GIGOR, Gamura Galaxy) */}
                {(() => {
                  const gameApps = allApps.filter((a) => a.cat === "Games");
                  if (gameApps.length === 0) return null;
                  return (
                    <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                            Games on Launch
                          </h2>
                          <p className="text-xs text-[#6E6E73]">
                            Play instantly or install GAINOSOR &amp; GIGOR to Universe Apps
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab("games")}
                          className="text-xs font-semibold text-[#059669] hover:underline cursor-pointer shrink-0"
                        >
                          See all ({gameApps.length})
                        </button>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {gameApps.map((app) => renderAppRow(app))}
                      </div>
                    </div>
                  );
                })()}

                {/* Gamura Originals */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                      Gamura originals
                    </h2>
                    <span className="text-xs font-semibold text-[#059669]">
                      {allApps.length} apps
                    </span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {allApps.map(renderAppTile)}
                  </div>
                </div>

                {/* Apple App Store Style List */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E73] px-2 pb-1">
                    Discover
                  </h2>
                  <div className="divide-y divide-zinc-100">
                    {allApps.map((app) => renderAppRow(app))}
                  </div>
                </div>
              </div>
            )}

            {tab === "games" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                <div className="px-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                    Games on Gamura Launch
                  </h2>
                  <p className="text-xs text-[#6E6E73]">
                    Featured arcade &amp; action web games including GAINOSOR and GIGOR.
                  </p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {allApps
                    .filter((a) => a.cat === "Games")
                    .map((app, i) => renderAppRow(app, i + 1))}
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
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Installed apps
              </h2>
              <span className="text-xs text-[#6E6E73]">
                {installedIdSet.size} installed
              </span>
            </div>

            {allApps.filter((a) => installedIdSet.has(a.id)).length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {allApps
                  .filter((a) => installedIdSet.has(a.id))
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-3.5 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <StoreAppGlyph
                          app={app}
                          sizeClass="w-14 h-14 text-2xl"
                          iconPx={26}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1D1D1F] truncate">
                            {app.name}
                          </div>
                          <div className="text-xs text-[#6E6E73] truncate">
                            {[
                              isInUniverse(app.id) ? "In Universe Apps" : "",
                              isInMobile(app.id) ? "In Mobile App" : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors"
                        >
                          OPEN
                        </a>
                        <button
                          type="button"
                          onClick={() => handleUninstallAll(app)}
                          className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Uninstall
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium text-[#1D1D1F]">
                  Nothing installed yet.
                </p>
                <p className="text-xs text-[#6E6E73]">
                  Tap GET on any app to install it in Universe Page or your
                  mobile app.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Developer Tab */
          <div className="space-y-5">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                  Publish an app
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Add a web application to the Gamura Launch Store catalog.
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                  <input
                    required
                    type="text"
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                    placeholder="App link (https://…)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    maxLength={60}
                    value={fTag}
                    onChange={(e) => setFTag(e.target.value)}
                    placeholder="Short tagline"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                  <select
                    value={fCat}
                    onChange={(e) => setFCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  >
                    {[
                      "Platform",
                      "AI",
                      "Games",
                      "Developer tools",
                      "Music & Audio",
                      "Finance",
                      "Portfolio",
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
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
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-colors cursor-pointer"
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
                      <StoreAppGlyph
                        app={app}
                        sizeClass="w-12 h-12 text-lg"
                        iconPx={22}
                      />
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

      {/* Bottom Apple Store Dock */}
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
                    ? "bg-[#E2F5ED] text-[#059669] font-semibold"
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

      {/* Apple App Store Style App Detail Sheet (Exact Uploaded Screenshot Design) */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] overflow-y-auto shadow-2xl border border-zinc-200/80 pb-8"
          >
            {/* Top Sheet Header */}
            <div className="sticky top-0 z-10 bg-white/92 backdrop-blur-xl px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                Discover
              </span>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                aria-label="Close app details"
                className="w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300/80 flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 sm:px-7 pt-1 space-y-6">
              {/* App Header Lockup matching Screenshot */}
              <div className="flex items-start gap-4">
                <StoreAppGlyph
                  app={selectedApp}
                  sizeClass="w-24 h-24 sm:w-28 sm:h-28 text-4xl"
                  iconPx={44}
                />
                <div className="flex-1 min-w-0 pt-0.5 space-y-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                      {selectedApp.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] mt-0.5">
                      {selectedApp.tag}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {installingId === selectedApp.id ? (
                        <span className="px-5 py-1.5 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums">
                          {installPct}%
                        </span>
                      ) : installedIdSet.has(selectedApp.id) ? (
                        <>
                          <a
                            href={selectedApp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide transition-colors inline-flex items-center gap-1"
                          >
                            <span>OPEN</span>
                            <ExternalLink size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleUninstallAll(selectedApp)}
                            className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#6E6E73] cursor-pointer transition-colors"
                          >
                            Uninstall
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPromptApp(selectedApp)}
                            className="px-6 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide cursor-pointer transition-colors"
                          >
                            GET
                          </button>
                          <a
                            href={selectedApp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold tracking-tight transition-colors inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </a>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleShareApp(selectedApp)}
                      aria-label="Share app"
                      className="w-9 h-9 rounded-full hover:bg-zinc-100 text-[#059669] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                      <Share size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3-Column Metrics Strip Matching Apple App Store Screenshot */}
              <div className="grid grid-cols-3 divide-x divide-zinc-200/80 py-3.5 border-y border-zinc-200/70 text-center">
                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Rating
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F] tabular-nums mt-0.5">
                    {selectedApp.rating}
                  </div>
                  <div className="text-[10px] text-[#6E6E73] tracking-tight">
                    ★★★★★
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Age
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F] tabular-nums mt-0.5">
                    {selectedApp.age || "3+"}
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">Years Old</div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Chart
                  </div>
                  <div className="text-xl font-bold text-[#1D1D1F] mt-0.5">
                    {selectedApp.chart || "Top"}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] truncate">
                    {selectedApp.cat}
                  </div>
                </div>
              </div>

              {/* Destination Quick Controls */}
              {installedIdSet.has(selectedApp.id) && (
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-2.5">
                  <div className="text-xs font-bold text-[#1D1D1F]">
                    Where this app is installed
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUniverse(selectedApp)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 border transition-colors ${
                        isInUniverse(selectedApp.id)
                          ? "bg-[#E2F5ED] border-[#059669]/30 text-[#059669]"
                          : "bg-white border-zinc-200 text-[#6E6E73]"
                      }`}
                    >
                      <Globe size={13} />
                      <span>
                        {isInUniverse(selectedApp.id)
                          ? "Added to Universe Apps ✓"
                          : "Add to Universe Apps"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileIds(addMobileInstalledId(selectedApp.id));
                        downloadStandaloneAppPackage(selectedApp);
                        showToast(`Downloaded ${selectedApp.name} for mobile ✓`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Smartphone size={13} />
                      <span>Download Mobile File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Showcase Cards */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {["Discover", "Play", "Create"].map((word, idx) => (
                  <div
                    key={word}
                    style={{
                      background: `linear-gradient(${150 + idx * 40}deg, ${selectedApp.c1}, ${selectedApp.c2})`,
                    }}
                    className="w-40 h-56 shrink-0 rounded-2xl p-4 text-white flex flex-col justify-between shadow-xs"
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
                  className="text-[#059669] shrink-0 mt-0.5"
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

              {/* Ratings */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  Ratings &amp; reviews
                </h3>
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <div className="text-4xl font-light text-[#1D1D1F] tabular-nums">
                      {selectedApp.rating}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 text-[#059669] mt-1">
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
                            className="h-full bg-[#059669] rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ask User Where To Install/Use App Modal */}
      {promptApp && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPromptApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl border border-zinc-200/80 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <StoreAppGlyph
                  app={promptApp}
                  sizeClass="w-12 h-12 text-xl"
                  iconPx={22}
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1D1D1F] truncate">
                    Where do you want to use {promptApp.name}?
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Choose an install location. You can uninstall anytime.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromptApp(null)}
                aria-label="Cancel install"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-[#6E6E73] cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  executeInstallWithDestination(promptApp, "universe")
                }
                className="w-full p-4 rounded-2xl bg-[#F5F5F7] hover:bg-[#E2F5ED]/60 border border-zinc-200/80 hover:border-[#059669]/40 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    In Universe Page
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Add directly inside the Apps section of Gamura Universe.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  executeInstallWithDestination(promptApp, "mobile")
                }
                className="w-full p-4 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/70 border border-zinc-200/80 hover:border-[#0071E3]/40 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shrink-0">
                  <Smartphone size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    In Your Mobile App / Device
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Download standalone web app launcher &amp; add to My apps.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => executeInstallWithDestination(promptApp, "both")}
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    Both (Universe Page &amp; Mobile App)
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Install in Universe Apps and download for your device.
                  </div>
                </div>
              </button>
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
