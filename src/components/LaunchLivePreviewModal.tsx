import React, { useMemo, useState } from "react";
import {
  BatteryCharging,
  ExternalLink,
  Globe,
  Laptop,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wifi,
  X,
} from "lucide-react";
import StoreAppGlyph from "./StoreAppGlyph";
import type { StoreAppItem } from "../utils/gamuraStoreApps";

interface LaunchLivePreviewModalProps {
  app: StoreAppItem;
  allApps: StoreAppItem[];
  averageRating: number;
  reviewCount: number;
  isInstalled: boolean;
  onSelectApp: (nextApp: StoreAppItem) => void;
  onInstallClick: (app: StoreAppItem) => void;
  onClose: () => void;
}

const FEATURED_PREVIEW_IDS = [
  "gamura-gcard",
  "gamura-gwallet",
  "gamura-ppt-cred",
  "gamura-cover-gened",
  "gamura-pb1",
  "gamura-pb2",
  "gamura-lifeline",
  "gamura-shield",
  "gamura-fresh",
  "gamura-links",
  "gamura-resume",
];

export default function LaunchLivePreviewModal({
  app,
  allApps,
  averageRating,
  reviewCount,
  isInstalled,
  onSelectApp,
  onInstallClick,
  onClose,
}: LaunchLivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">(() =>
    ["gamura-ppt-cred", "gamura-cover-gened", "gamura-pb1", "gamura-pb2"].includes(
      app.id,
    )
      ? "desktop"
      : "mobile",
  );
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [previewSurface, setPreviewSurface] = useState<"live" | "showcase">(() =>
    app.url.startsWith("/") ? "live" : "showcase",
  );

  const isSameOriginApp = app.url.startsWith("/");

  const resolvedPreviewUrl = useMemo(() => {
    if (typeof window === "undefined") return app.url;
    if (app.url.startsWith("/")) {
      return `${window.location.origin}${app.url}`;
    }
    return app.url;
  }, [app.url]);

  const quickSwitchApps = useMemo(() => {
    const featured = FEATURED_PREVIEW_IDS.map((id) =>
      allApps.find((a) => a.id === id),
    ).filter((a): a is StoreAppItem => Boolean(a));
    if (!featured.some((a) => a.id === app.id)) {
      return [app, ...featured];
    }
    return featured;
  }, [allApps, app]);

  const handleSwitchApp = (next: StoreAppItem) => {
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
    setPreviewSurface(next.url.startsWith("/") ? "live" : "showcase");
    if (
      ["gamura-ppt-cred", "gamura-cover-gened", "gamura-pb1", "gamura-pb2"].includes(
        next.id,
      )
    ) {
      setDeviceMode("desktop");
    }
    onSelectApp(next);
  };

  const nowTime = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Live Preview — ${app.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-2 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[94vh] bg-[#F5F5F7] rounded-[28px] shadow-2xl border border-white/25 overflow-hidden flex flex-col"
      >
        {/* Top Simulator Header */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-zinc-200/80 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <StoreAppGlyph app={app} sizeClass="w-10 h-10" iconPx={20} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] truncate">
                  {app.name}
                </h2>
                <span className="text-[11px] font-semibold text-[#059669] whitespace-nowrap">
                  · Live Preview
                </span>
              </div>
              <div className="text-[11px] text-[#6E6E73] flex items-center gap-1.5 tabular-nums truncate">
                <span>{app.cat}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-0.5 text-[#1D1D1F] font-semibold">
                  <Star size={11} className="text-amber-500 fill-amber-500" />
                  {averageRating.toFixed(1)}
                </span>
                {reviewCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{reviewCount} reviews</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Device Frame Switcher + Mode Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center p-1 rounded-xl bg-[#F5F5F7] border border-zinc-200/70">
              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  deviceMode === "mobile"
                    ? "bg-white text-[#1D1D1F] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                <Smartphone size={14} />
                <span>Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode("desktop")}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  deviceMode === "desktop"
                    ? "bg-white text-[#1D1D1F] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                <Laptop size={14} />
                <span>Desktop</span>
              </button>
            </div>

            {!isSameOriginApp && (
              <div className="inline-flex items-center p-1 rounded-xl bg-[#F5F5F7] border border-zinc-200/70">
                <button
                  type="button"
                  onClick={() => setPreviewSurface("showcase")}
                  className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    previewSurface === "showcase"
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#6E6E73]"
                  }`}
                >
                  Interactive Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewSurface("live");
                    setIframeLoaded(false);
                    setIframeKey((k) => k + 1);
                  }}
                  className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    previewSurface === "live"
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#6E6E73]"
                  }`}
                >
                  Web Frame
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIframeLoaded(false);
                setIframeKey((k) => k + 1);
              }}
              aria-label="Reload preview"
              title="Reload live app preview"
              className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] flex items-center justify-center cursor-pointer transition-colors"
            >
              <RotateCw size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close live preview"
              className="w-9 h-9 rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-[#1D1D1F] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick App Switcher Rail */}
        <div className="bg-white border-b border-zinc-200/70 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] shrink-0 pr-1">
            Try Live:
          </span>
          {quickSwitchApps.map((item) => {
            const active = item.id === app.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchApp(item)}
                className={`min-h-[34px] pl-1.5 pr-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                  active
                    ? "bg-[#E2F5ED] border-[#059669]/40 text-[#059669]"
                    : "bg-[#F5F5F7] border-zinc-200/70 text-[#1D1D1F] hover:bg-zinc-200/60"
                }`}
              >
                <StoreAppGlyph app={item} sizeClass="w-5 h-5" iconPx={11} />
                <span>{item.name.split(" (")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Main Simulated Device Viewport */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 flex items-center justify-center bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px]">
          {deviceMode === "mobile" ? (
            /* Simulated iPhone Device Bezel */
            <div className="w-full max-w-[392px] h-full min-h-[540px] max-h-[760px] bg-[#161618] rounded-[46px] p-[11px] shadow-[0_28px_70px_-12px_rgba(0,0,0,0.42)] ring-1 ring-white/15 flex flex-col">
              <div className="flex-1 bg-white rounded-[36px] overflow-hidden flex flex-col relative">
                {/* Phone Status Bar + Dynamic Island */}
                <div className="h-11 px-6 bg-white/95 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between text-[#1D1D1F] shrink-0 select-none z-10">
                  <span className="text-[12px] font-bold tabular-nums">
                    {nowTime}
                  </span>
                  <div className="w-[96px] h-[24px] rounded-full bg-[#161618] flex items-center justify-end pr-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#1e293b] ring-1 ring-blue-400/30" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[#1D1D1F]">
                    <Wifi size={12} />
                    <BatteryCharging size={14} />
                  </div>
                </div>

                {/* Inner Live Viewport */}
                <div className="flex-1 relative bg-white overflow-hidden">
                  {previewSurface === "live" ? (
                    <>
                      {!iframeLoaded && (
                        <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                          <StoreAppGlyph app={app} sizeClass="w-14 h-14" iconPx={26} />
                          <div className="text-sm font-bold text-[#1D1D1F]">
                            Booting {app.name}…
                          </div>
                          <div className="text-xs text-[#6E6E73]">
                            Running interactive preview inside phone frame
                          </div>
                        </div>
                      )}
                      <iframe
                        key={`${app.id}-mobile-${iframeKey}`}
                        src={resolvedPreviewUrl}
                        title={`${app.name} Mobile Live Preview`}
                        onLoad={() => setIframeLoaded(true)}
                        className="w-full h-full border-0 bg-white"
                        allow="camera; microphone; clipboard-write; geolocation"
                      />
                    </>
                  ) : (
                    <ExternalAppSandboxView
                      app={app}
                      resolvedUrl={resolvedPreviewUrl}
                      onTryWebFrame={() => {
                        setPreviewSurface("live");
                        setIframeLoaded(false);
                        setIframeKey((k) => k + 1);
                      }}
                    />
                  )}
                </div>

                {/* Home Indicator */}
                <div className="h-5 bg-white border-t border-zinc-100 flex items-center justify-center shrink-0">
                  <div className="w-28 h-1 rounded-full bg-zinc-300" />
                </div>
              </div>
            </div>
          ) : (
            /* Simulated Desktop / Tablet Window Frame */
            <div className="w-full max-w-[1060px] h-full min-h-[460px] bg-white rounded-[22px] shadow-[0_24px_65px_-12px_rgba(0,0,0,0.3)] border border-zinc-300/80 overflow-hidden flex flex-col">
              {/* macOS / Browser Top Chrome */}
              <div className="h-11 px-4 bg-[#F5F5F7] border-b border-zinc-200/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>

                <div className="flex-1 max-w-md mx-auto bg-white border border-zinc-200/80 rounded-lg px-3 py-1 flex items-center justify-center gap-1.5 text-[11px] text-[#6E6E73] font-mono truncate">
                  <Globe size={11} className="text-[#059669] shrink-0" />
                  <span className="truncate">{resolvedPreviewUrl}</span>
                </div>

                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#059669] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Full Tab</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Inner Live Desktop Viewport */}
              <div className="flex-1 relative bg-white overflow-hidden">
                {previewSurface === "live" ? (
                  <>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <StoreAppGlyph app={app} sizeClass="w-16 h-16" iconPx={30} />
                        <div className="text-base font-bold text-[#1D1D1F]">
                          Loading interactive {app.name} workspace…
                        </div>
                        <p className="text-xs text-[#6E6E73] max-w-sm">
                          You can test features live inside this simulated screen before installing.
                        </p>
                      </div>
                    )}
                    <iframe
                      key={`${app.id}-desktop-${iframeKey}`}
                      src={resolvedPreviewUrl}
                      title={`${app.name} Desktop Live Preview`}
                      onLoad={() => setIframeLoaded(true)}
                      className="w-full h-full border-0 bg-white"
                      allow="camera; microphone; clipboard-write; geolocation"
                    />
                  </>
                ) : (
                  <ExternalAppSandboxView
                    app={app}
                    resolvedUrl={resolvedPreviewUrl}
                    onTryWebFrame={() => {
                      setPreviewSurface("live");
                      setIframeLoaded(false);
                      setIframeKey((k) => k + 1);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Install & Action Bar */}
        <div className="bg-white border-t border-zinc-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
            <ShieldCheck size={15} className="text-[#059669] shrink-0" />
            <span>
              Interactive sandbox preview · Changes made inside local web apps stay right in your browser.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-4 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Open Full App</span>
              <ExternalLink size={13} />
            </a>

            {isInstalled ? (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span>Installed ✓ · Launch</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInstallClick(app);
                }}
                className="min-h-[40px] px-5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Sparkles size={13} />
                <span>GET &amp; Install App</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalAppSandboxView({
  app,
  resolvedUrl,
  onTryWebFrame,
}: {
  app: StoreAppItem;
  resolvedUrl: string;
  onTryWebFrame: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F7] p-5 sm:p-8 flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-4">
        <div
          style={{
            background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
          }}
          className="rounded-2xl p-5 text-white flex flex-col items-center gap-2.5"
        >
          <StoreAppGlyph app={app} sizeClass="w-16 h-16" iconPx={30} />
          <div className="text-lg font-bold tracking-tight">{app.name}</div>
          <div className="text-xs opacity-90">{app.tag}</div>
        </div>

        <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed text-left">
          {app.desc}
        </p>

        <div className="grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-3 rounded-xl bg-[#F5F5F7]">
            <div className="text-[#6E6E73] text-[10px] uppercase font-bold">
              Category
            </div>
            <div className="font-semibold text-[#1D1D1F] mt-0.5">{app.cat}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#F5F5F7]">
            <div className="text-[#6E6E73] text-[10px] uppercase font-bold">
              Version
            </div>
            <div className="font-semibold text-[#1D1D1F] mt-0.5">
              v{app.version || "2.0"} · {app.size}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={onTryWebFrame}
            className="flex-1 min-h-[42px] px-4 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold cursor-pointer transition-colors"
          >
            Attempt Web Embed
          </button>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[42px] px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Launch App Site</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
