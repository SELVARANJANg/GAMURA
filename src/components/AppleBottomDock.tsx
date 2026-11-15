import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Home,
  MessageSquarePlus,
  LayoutGrid,
  FileText,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

export const G_PDF_ROUTE_URL = "/gpdf";
export const G_PDF_LOGO_LOCAL = "/assets/aistudio/1794644548783_b0cc329b.png";
export const G_PDF_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1uYVL1_8XGFCk_V7e1b4lxCy9C1CzF3su";

export const G_LINK_ROUTE_URL = "/launch";
export const G_LINK_LOGO_LOCAL = "/assets/aistudio/1794679627931_b0492bbb.png";
export const G_LINK_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1FqBAdXuyDDSSuYtd3iZzf9x5PM8orKrd";

export interface AppleDockItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  imageSrc?: string;
  imageFallbackSrc?: string;
  imageBoxClass?: string;
  imageScaleClass?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  badge?: string;
}

interface AppleBottomDockProps {
  activeId: string;
  onNavigateHome: () => void;
  onNavigateGpg: () => void;
  onNavigateClaim?: () => void;
  onOpenMoreMenu: () => void;
  extraItems?: AppleDockItem[];
}

export const DEFAULT_DOCK_CONFIG = [
  { id: "home", label: "Home" },
  { id: "gpg", label: "GPG" },
  { id: "gpdf", label: "G PDF" },
  { id: "glink", label: "Launch" },
] as const;

export default function AppleBottomDock({
  activeId,
  onNavigateHome,
  onNavigateGpg,
  onOpenMoreMenu,
  extraItems = [],
}: AppleBottomDockProps) {
  const [imgStage, setImgStage] = useState<Record<string, number>>({});

  const dockItems: AppleDockItem[] = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: onNavigateHome,
    },
    {
      id: "gpg",
      label: "GPG",
      icon: MessageSquarePlus,
      onClick: onNavigateGpg,
    },
    {
      id: "gpdf",
      label: "G PDF",
      icon: FileText,
      imageSrc: G_PDF_LOGO_LOCAL,
      imageFallbackSrc: G_PDF_LOGO_FALLBACK,
      imageBoxClass: "w-9 h-8",
      imageScaleClass: "scale-[1.48]",
      href: G_PDF_ROUTE_URL,
      target: "_blank",
    },
    {
      id: "glink",
      label: "Launch",
      icon: ExternalLink,
      imageSrc: G_LINK_LOGO_LOCAL,
      imageFallbackSrc: G_LINK_LOGO_FALLBACK,
      imageBoxClass: "w-11 h-8",
      imageScaleClass: "scale-[1.36]",
      href: G_LINK_ROUTE_URL,
      target: "_blank",
    },
    ...extraItems,
  ];

  return (
    <nav
      aria-label="Primary Apple Dock"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
      className="fixed bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[calc(100vw-16px)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center px-2 py-1.5 gap-1 rounded-[30px] bg-white/95 backdrop-blur-2xl border border-zinc-200/80 shadow-[0_18px_45px_-10px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            const stage = imgStage[item.id] || 0;
            const resolvedSrc =
              stage === 0
                ? item.imageSrc
                : stage === 1
                  ? item.imageFallbackSrc
                  : undefined;

            const itemClasses = `relative min-h-[54px] min-w-[56px] sm:min-w-[68px] px-2.5 sm:px-3.5 py-1.5 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
              isActive
                ? "text-[#0071E3]"
                : "text-[#6E6E73] hover:text-[#1D1D1F]"
            }`;

            const innerContent = (
              <>
                {isActive && (
                  <motion.div
                    layoutId="appleDockActivePill"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-[22px] bg-[#F5F5F7] border border-zinc-200/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
                  />
                )}

                <span className="relative z-10 h-8 flex items-center justify-center">
                  {resolvedSrc ? (
                    <span
                      className={`${
                        item.imageBoxClass || "w-9 h-8"
                      } rounded-[11px] bg-white border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center`}
                    >
                      <img
                        src={resolvedSrc}
                        alt={item.label}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgStage((prev) => ({
                            ...prev,
                            [item.id]: (prev[item.id] || 0) + 1,
                          }))
                        }
                        className={`w-full h-full object-contain mix-blend-multiply select-none pointer-events-none ${
                          item.imageScaleClass || "scale-[1.25]"
                        }`}
                      />
                    </span>
                  ) : Icon ? (
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.3 : 1.9}
                      className="transition-transform duration-150"
                    />
                  ) : null}
                </span>

                <span
                  className={`relative z-10 text-[10px] tracking-tight leading-none whitespace-nowrap ${
                    isActive
                      ? "font-semibold"
                      : item.imageSrc
                        ? "font-semibold text-[#1D1D1F]"
                        : "font-medium"
                  }`}
                >
                  {item.label}
                </span>

                {item.badge && (
                  <span className="relative z-10 hidden sm:inline text-[8px] font-semibold text-[#0071E3]">
                    {item.badge}
                  </span>
                )}
              </>
            );

            if (item.href) {
              return (
                <motion.a
                  key={item.id}
                  href={item.href}
                  target={item.target || "_blank"}
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  aria-label={`Open ${item.label} in new tab`}
                  title={`Open ${item.label}`}
                  className={itemClasses}
                >
                  {innerContent}
                </motion.a>
              );
            }

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.94 }}
                onClick={item.onClick}
                aria-current={isActive ? "page" : undefined}
                className={itemClasses}
              >
                {innerContent}
              </motion.button>
            );
          })}
        </div>

        {/* Hairline Separator + Extensible Menu Sheet Trigger */}
        <div
          className="w-px h-7 bg-zinc-200/80 mx-0.5 shrink-0"
          aria-hidden="true"
        />

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.94 }}
          onClick={onOpenMoreMenu}
          title="More Apps & Settings"
          aria-label="Open More Apps Menu"
          className="min-h-[54px] min-w-[54px] sm:min-w-[64px] px-2.5 sm:px-3 py-1.5 rounded-[22px] flex flex-col items-center justify-center gap-1 text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer select-none whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
        >
          <span className="h-8 flex items-center justify-center">
            <LayoutGrid size={19} strokeWidth={2} />
          </span>
          <span className="text-[10px] font-medium tracking-tight leading-none whitespace-nowrap">
            More
          </span>
        </motion.button>
      </div>
    </nav>
  );
}
