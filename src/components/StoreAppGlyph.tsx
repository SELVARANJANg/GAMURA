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
    return (
      <div
        className={`${sizeClass} rounded-[22%] bg-white border border-black/[0.08] p-1 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)] shrink-0 select-none overflow-hidden`}
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
          className="w-full h-full object-contain rounded-[16%]"
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
