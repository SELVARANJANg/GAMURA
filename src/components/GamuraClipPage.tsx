import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Globe, Layers } from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

export default function GamuraClipPage({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-clip",
    ),
  );
  const [iframeSrc] = useState<string>(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    return `/assets/aistudio/gamura-clip_e8cfb37c.html${hash || ""}`;
  });

  const clipStoreApp: StoreAppItem =
    BUILTIN_STORE_APPS.find((a) => a.id === "gamura-clip") || {
      id: "gamura-clip",
      name: "GAMURA CLIP",
      cat: "Utilities",
      tag: "Copy here. Paste there across devices.",
      desc: "Send text, links, images, and files between your phone and laptop with a 6-character room code and optional AES-256 PIN encryption.",
      url: "/clip",
      c1: "#34d399",
      c2: "#0f9f6e",
      iconKind: "clip",
      rating: 4.9,
      age: "3+",
      chart: "No. 1 Utility",
      dl: "Featured",
      size: "Web · 1 MB",
      isBuiltin: true,
    };

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Clip";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const syncUniverse = () => {
      setInstalledInUniverse(
        readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
          (a) => a.id === "gamura-clip",
        ),
      );
    };
    window.addEventListener("storage", syncUniverse);
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    return () => {
      window.removeEventListener("storage", syncUniverse);
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    };
  }, []);

  const handleToggleUniverseInstall = () => {
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-clip");
      setInstalledInUniverse(false);
    } else {
      addAppToUniverse(clipStoreApp);
      setInstalledInUniverse(true);
    }
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
      className="min-h-screen flex flex-col bg-[#f2f5f3] text-[#0b1511]"
    >
      <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              title="Back Home"
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-black/[0.06] text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              title="Launch Store"
              className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/[0.06] text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
            >
              <Layers size={13} />
              <span>Launch Store</span>
            </a>

            <div className="flex items-center gap-2 pl-0.5 min-w-0">
              <div
                style={{
                  background: "linear-gradient(145deg, #34d399, #0f9f6e)",
                }}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(16,185,129,0.32)] shrink-0"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="8" y="3" width="12" height="14" rx="3" />
                  <path d="M16 21H7a3 3 0 0 1-3-3V8" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap truncate">
                GAMURA <span className="text-[#0f9f6e]">CLIP</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#E2F5ED] border-[#0f9f6e]/30 text-[#0f9f6e]"
                  : "bg-white border-black/[0.08] text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
              title="Install to Universe Apps"
            >
              <Globe size={13} />
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe" : "Universe"}
              </span>
            </button>

            <a
              href="/assets/aistudio/gamura-clip_e8cfb37c.html"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-full bg-[#0f9f6e] hover:bg-[#0b835a] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Full Tab</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <iframe
        title="Gamura Clip"
        src={iframeSrc}
        allow="clipboard-read; clipboard-write"
        className="flex-1 w-full min-h-[calc(100dvh-57px)] border-0 bg-transparent"
      />
    </div>
  );
}
