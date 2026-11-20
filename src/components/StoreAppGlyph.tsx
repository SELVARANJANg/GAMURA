import React, { useState } from "react";
import {
  Globe,
  Code2,
  FileText,
  Music,
  Calculator,
  Palette,
  Sparkles,
  TrendingUp,
  StickyNote,
  User,
  Camera,
  Hash,
  FolderOpen,
  ShoppingBag,
  Link2,
  FileCheck2,
  Presentation,
  LayoutTemplate,
  HeartPulse,
} from "lucide-react";
import type { StoreAppItem } from "../utils/gamuraStoreApps";

export default function StoreAppGlyph({
  app,
  sizeClass = "w-14 h-14",
  iconPx = 28,
}: {
  app: StoreAppItem;
  sizeClass?: string;
  iconPx?: number;
}) {
  // stage 0 -> primary logoUrl, stage 1 -> logoFallbackUrl, stage 2 -> vector glyph fallback
  const [imgStage, setImgStage] = useState(0);

  const activeImgSrc =
    imgStage === 0
      ? app.logoUrl
      : imgStage === 1
        ? app.logoFallbackUrl
        : undefined;

  if (activeImgSrc) {
    const isCover = app.logoFit === "cover";
    return (
      <div
        style={app.logoBg ? { backgroundColor: app.logoBg } : undefined}
        className={`${sizeClass} rounded-[22%] ${app.logoBg ? "" : "bg-white"} border border-black/[0.08] ${isCover ? "p-0" : "p-1"} flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)] shrink-0 select-none overflow-hidden`}
      >
        <img
          src={activeImgSrc}
          alt={app.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            if (imgStage === 0 && app.logoFallbackUrl) {
              setImgStage(1);
            } else {
              setImgStage(2);
            }
          }}
          className={`w-full h-full ${isCover ? "object-cover scale-[1.06]" : "object-contain rounded-[16%]"}`}
        />
      </div>
    );
  }

  const renderMark = () => {
    switch (app.iconKind) {
      case "g-outline":
        return (
          <div className="w-[62%] h-[62%] rounded-full border-[3px] border-white flex items-center justify-center shadow-xs">
            <span className="font-bold text-white leading-none text-[1.15em]">
              G
            </span>
          </div>
        );
      case "orbit":
        return (
          <svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 36 36"
            fill="none"
            className="text-white"
          >
            <ellipse
              cx="18"
              cy="18"
              rx="13"
              ry="6"
              transform="rotate(-24 18 18)"
              stroke="currentColor"
              strokeWidth="2.8"
            />
            <circle cx="21" cy="16" r="3" fill="currentColor" />
          </svg>
        );
      case "code":
        return <Code2 size={iconPx} strokeWidth={2.5} className="text-white" />;
      case "globe":
        return <Globe size={iconPx} strokeWidth={2.1} className="text-white" />;
      case "pdf":
        return (
          <FileText size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "music":
        return <Music size={iconPx} strokeWidth={2.2} className="text-white" />;
      case "calc":
        return (
          <Calculator size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "art":
        return (
          <Palette size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "sparkles":
        return (
          <Sparkles size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "chart":
        return (
          <TrendingUp size={iconPx} strokeWidth={2.2} className="text-white" />
        );
      case "notes":
        return (
          <StickyNote size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "user":
        return <User size={iconPx} strokeWidth={2.2} className="text-white" />;
      case "camera":
        return <Camera size={iconPx} strokeWidth={2.2} className="text-white" />;
      case "numbers":
        return <Hash size={iconPx} strokeWidth={2.4} className="text-white" />;
      case "gfiles":
        return (
          <FolderOpen size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "buysell":
        return (
          <ShoppingBag size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "links":
        return (
          <Link2 size={iconPx} strokeWidth={2.3} className="text-white" />
        );
      case "resume":
        return (
          <FileCheck2 size={iconPx} strokeWidth={2.1} className="text-white" />
        );
      case "pb1":
        return (
          <div className="flex flex-col items-center justify-center leading-none text-white select-none">
            <span className="font-extrabold tracking-tighter text-[0.95em]">
              PB<sup className="text-[0.6em] font-bold ml-0.5">1</sup>
            </span>
          </div>
        );
      case "pb2":
        return (
          <div className="flex flex-col items-center justify-center leading-none text-white select-none">
            <span className="font-extrabold tracking-tighter text-[0.95em]">
              PB<sup className="text-[0.6em] font-bold ml-0.5">2</sup>
            </span>
          </div>
        );
      case "pptcred":
        return (
          <Presentation
            size={iconPx}
            strokeWidth={2.1}
            className="text-white"
          />
        );
      case "covergened":
        return (
          <LayoutTemplate
            size={iconPx}
            strokeWidth={2.1}
            className="text-white"
          />
        );
      case "lifeline":
        return (
          <HeartPulse
            size={iconPx}
            strokeWidth={2.2}
            className="text-white"
          />
        );
      case "messenger":
        return (
          <svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 76 76"
            fill="none"
            className="text-white"
          >
            <path
              d="M38 15c-12.7 0-23 8.8-23 19.7 0 6.1 3.3 11.6 8.4 15.2L21.5 60l10.6-5.7c1.9.4 3.9.7 5.9.7 12.7 0 23-8.8 23-19.7S50.7 15 38 15z"
              fill="currentColor"
            />
            <rect x="30" y="31" width="16" height="12.5" rx="3.2" fill="#c4151f" />
            <path
              d="M33 31v-3.5a5 5 0 0 1 10 0V31"
              stroke="#c4151f"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        );
      case "clip":
        return (
          <svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <rect x="8" y="3" width="12" height="14" rx="3" />
            <path d="M16 21H7a3 3 0 0 1-3-3V8" />
          </svg>
        );
      case "gainosor":
        return (
          <svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 36 36"
            fill="none"
            className="text-white"
          >
            <path
              d="M9 26L14 10L20 17L27 9L25 26H9Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="21" cy="13" r="1.8" fill="currentColor" />
          </svg>
        );
      case "gigor":
        return (
          <svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 36 36"
            fill="none"
            className="text-white"
          >
            <path
              d="M20 6L10 20H18L16 30L26 16H18L20 6Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <span className="font-bold text-white leading-none">
            {app.name.trim().charAt(0).toUpperCase() || "G"}
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(155deg, ${app.c1}, ${app.c2})`,
      }}
      className={`${sizeClass} rounded-[22%] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] shrink-0 select-none`}
    >
      {renderMark()}
    </div>
  );
}
