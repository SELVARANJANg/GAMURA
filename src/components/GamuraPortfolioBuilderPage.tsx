import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Monitor,
  Moon,
  Plus,
  QrCode,
  RotateCcw,
  Share2,
  Smartphone,
  Sun,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

interface GamuraPortfolioBuilderPageProps {
  onBackHome: () => void;
}

interface PortfolioLink {
  l: string;
  u: string;
}

interface PortfolioProject {
  t: string;
  d: string;
  img: string;
  u: string;
}

interface PortfolioCert {
  t: string;
  i: string;
  y: string;
  img: string;
}

interface PortfolioMedia {
  type: "image" | "video";
  src: string;
  cap: string;
}

type ThemeSetting = "auto" | "light" | "dark";

interface PortfolioState {
  name: string;
  title: string;
  loc: string;
  email: string;
  bio: string;
  avatar: string;
  skills: string;
  links: PortfolioLink[];
  projects: PortfolioProject[];
  certs: PortfolioCert[];
  media: PortfolioMedia[];
  ac: string;
  theme: ThemeSetting;
}

export const GAMURA_PORTFOLIO_V1_KEY = "gamura_portfolio_v1";
const PB1_CHANNEL_NAME = "gamura-pb1-realtime";

const ACCENT_COLORS = [
  "#0071e3",
  "#30d158",
  "#ff375f",
  "#bf5af2",
  "#ff9f0a",
  "#1d1d1f",
];

const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  name: "Alex Morgan",
  title: "Designer & Developer",
  loc: "Chennai, India",
  email: "",
  bio: "Hi, I’m Alex. I design and build clean, thoughtful digital products. Tap Edit to make this portfolio yours.",
  avatar: "",
  skills: "Design, Web Development, Photography",
  links: [
    { l: "GitHub", u: "" },
    { l: "LinkedIn", u: "" },
  ],
  projects: [
    {
      t: "First Project",
      d: "A short description of what you built and why it matters.",
      img: "",
      u: "",
    },
  ],
  certs: [
    {
      t: "Certificate Name",
      i: "Issuer",
      y: "2026",
      img: "",
    },
  ],
  media: [],
  ac: ACCENT_COLORS[0],
  theme: "auto",
};

function normalizeExternalUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  return /^(https?:|mailto:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function escapeHtmlText(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compressImageToDataUrl(
  file: File,
  maxDim: number,
  onSuccess: (dataUrl: string) => void,
  onError: (message: string) => void,
) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onError("Could not process that image.");
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        onSuccess(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        onError("Could not encode that image.");
      }
    };
    img.onerror = () => onError("Could not read that image.");
    img.src = String(reader.result || "");
  };
  reader.onerror = () => onError("Could not read that image.");
  reader.readAsDataURL(file);
}

type PendingUploadTarget =
  | { kind: "avatar" }
  | { kind: "project"; index: number }
  | { kind: "cert"; index: number }
  | { kind: "media" }
  | null;

export default function GamuraPortfolioBuilderPage({
  onBackHome,
}: GamuraPortfolioBuilderPageProps) {
  const [state, setState] = useState<PortfolioState>(() => {
    try {
      const raw = localStorage.getItem(GAMURA_PORTFOLIO_V1_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PORTFOLIO_STATE,
          ...parsed,
          links: Array.isArray(parsed.links)
            ? parsed.links
            : DEFAULT_PORTFOLIO_STATE.links,
          projects: Array.isArray(parsed.projects)
            ? parsed.projects
            : DEFAULT_PORTFOLIO_STATE.projects,
          certs: Array.isArray(parsed.certs)
            ? parsed.certs
            : DEFAULT_PORTFOLIO_STATE.certs,
          media: Array.isArray(parsed.media) ? parsed.media : [],
        };
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_PORTFOLIO_STATE;
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
      : false,
  );
  const [mode, setMode] = useState<"edit" | "split" | "preview">(() => {
    if (typeof window !== "undefined") {
      try {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("preview") === "1") return "preview";
        if (sp.get("split") === "1") return "split";
      } catch {
        // ignore
      }
    }
    return "edit";
  });
  const [splitDevice, setSplitDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<PendingUploadTarget>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const skipBroadcastRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-pb1",
    ),
  );

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-pb1"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Real-time cross-tab synchronization via BroadcastChannel & localStorage events
  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(PB1_CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (ev: MessageEvent) => {
        const incoming = ev.data?.payload;
        if (incoming && typeof incoming === "object") {
          skipBroadcastRef.current = true;
          setState({
            ...DEFAULT_PORTFOLIO_STATE,
            ...incoming,
            links: Array.isArray(incoming.links)
              ? incoming.links
              : DEFAULT_PORTFOLIO_STATE.links,
            projects: Array.isArray(incoming.projects)
              ? incoming.projects
              : DEFAULT_PORTFOLIO_STATE.projects,
            certs: Array.isArray(incoming.certs)
              ? incoming.certs
              : DEFAULT_PORTFOLIO_STATE.certs,
            media: Array.isArray(incoming.media) ? incoming.media : [],
          });
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== GAMURA_PORTFOLIO_V1_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        skipBroadcastRef.current = true;
        setState({
          ...DEFAULT_PORTFOLIO_STATE,
          ...parsed,
          links: Array.isArray(parsed.links)
            ? parsed.links
            : DEFAULT_PORTFOLIO_STATE.links,
          projects: Array.isArray(parsed.projects)
            ? parsed.projects
            : DEFAULT_PORTFOLIO_STATE.projects,
          certs: Array.isArray(parsed.certs)
            ? parsed.certs
            : DEFAULT_PORTFOLIO_STATE.certs,
          media: Array.isArray(parsed.media) ? parsed.media : [],
        });
      } catch {
        // ignore invalid json
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  // Persist to localStorage filtering temporary blob: video URLs + real-time broadcast
  useEffect(() => {
    const copy: PortfolioState = {
      ...state,
      media: state.media.filter((m) => !m.src.startsWith("blob:")),
    };
    if (skipBroadcastRef.current) {
      skipBroadcastRef.current = false;
      return;
    }
    try {
      localStorage.setItem(GAMURA_PORTFOLIO_V1_KEY, JSON.stringify(copy));
      channelRef.current?.postMessage({ payload: copy });
    } catch {
      setToastMsg("Storage is full. Remove some images.");
    }
  }, [state]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxSrc(null);
        setConfirmResetOpen(false);
        setShareOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDark =
    state.theme === "dark" || (state.theme === "auto" && systemPrefersDark);

  const showToast = (msg: string) => setToastMsg(msg);

  const handleToggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: isDark ? "light" : "dark",
    }));
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-pb1");
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

  const triggerImagePick = (target: PendingUploadTarget) => {
    setPendingTarget(target);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingTarget) return;
    const target = pendingTarget;
    const maxDim = target.kind === "media" ? 1200 : 1000;

    compressImageToDataUrl(
      file,
      maxDim,
      (dataUrl) => {
        setState((prev) => {
          if (target.kind === "avatar") {
            return { ...prev, avatar: dataUrl };
          }
          if (target.kind === "project") {
            return {
              ...prev,
              projects: prev.projects.map((p, idx) =>
                idx === target.index ? { ...p, img: dataUrl } : p,
              ),
            };
          }
          if (target.kind === "cert") {
            return {
              ...prev,
              certs: prev.certs.map((c, idx) =>
                idx === target.index ? { ...c, img: dataUrl } : c,
              ),
            };
          }
          return {
            ...prev,
            media: [...prev.media, { type: "image", src: dataUrl, cap: "" }],
          };
        });
        showToast("Image updated");
      },
      (err) => showToast(err),
    );
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      media: [...prev.media, { type: "video", src: objectUrl, cap: "" }],
    }));
    showToast("Video added for this session. Use a video link to keep it.");
  };

  const handleAddVideoUrl = () => {
    const normalized = normalizeExternalUrl(videoUrlDraft);
    if (!normalized) {
      showToast("Paste a video link first.");
      return;
    }
    setState((prev) => ({
      ...prev,
      media: [...prev.media, { type: "video", src: normalized, cap: "" }],
    }));
    setVideoUrlDraft("");
    showToast("Video link added");
  };

  const parsedSkills = useMemo(
    () =>
      state.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [state.skills],
  );

  const visibleProjects = useMemo(
    () =>
      state.projects.filter(
        (p) => p.t.trim() || p.d.trim() || p.img.trim(),
      ),
    [state.projects],
  );

  const visibleCerts = useMemo(
    () => state.certs.filter((c) => c.t.trim() || c.img.trim()),
    [state.certs],
  );

  const handleExportStandaloneHtml = () => {
    const accent = state.ac || "#0071e3";
    const bgHex = isDark ? "#000000" : "#f5f5f7";
    const cardHex = isDark ? "#1c1c1e" : "#ffffff";
    const txHex = isDark ? "#f5f5f7" : "#1d1d1f";
    const tx2Hex = isDark ? "#98989d" : "#6e6e73";

    const linksHtml = [
      state.email.trim()
        ? `<a class="btn" href="mailto:${escapeHtmlText(state.email.trim())}">Contact</a>`
        : "",
      ...state.links
        .filter((x) => x.l.trim() && x.u.trim())
        .map(
          (x) =>
            `<a class="btn g" target="_blank" rel="noopener noreferrer" href="${escapeHtmlText(
              normalizeExternalUrl(x.u),
            )}">${escapeHtmlText(x.l)}</a>`,
        ),
    ]
      .filter(Boolean)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtmlText(state.name || "Portfolio")} · Made with Gamura PB¹</title>
<style>
:root{--bg:${bgHex};--card:${cardHex};--tx:${txHex};--tx2:${tx2Hex};--ac:${accent};--fill:${
      isDark ? "#2c2c2e" : "#e5e5ea"
    }}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;line-height:1.45}
.pf{max-width:980px;margin:0 auto;padding:0 20px}
.hero{text-align:center;padding:64px 0 48px}
.av{width:132px;height:132px;border-radius:50%;margin:0 auto 24px;background:linear-gradient(135deg,var(--ac),#bf5af2) center/cover;box-shadow:0 10px 40px rgba(0,0,0,.18)}
h1{font-size:clamp(38px,9vw,72px);line-height:1.05;letter-spacing:-.03em;margin:0 0 10px}
.t{font-size:clamp(19px,4vw,28px);color:var(--tx2);margin:0 0 18px;font-weight:500}
.loc{color:var(--tx2);font-size:15px;margin-bottom:22px}
.acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;padding:10px 20px;border-radius:980px;background:var(--ac);color:#fff;font-weight:600;text-decoration:none}
.btn.g{background:var(--fill);color:var(--ac)}
section{padding:44px 0}
h3{font-size:clamp(28px,6vw,44px);letter-spacing:-.025em;margin:0 0 22px}
.about{font-size:clamp(18px,3.4vw,24px);line-height:1.5;max-width:760px;white-space:pre-wrap}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chips span{background:var(--card);padding:9px 18px;border-radius:980px;font-weight:500;font-size:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
.pc{background:var(--card);border-radius:22px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.im{aspect-ratio:16/10;background:linear-gradient(135deg,var(--ac),#5e5ce6) center/cover}
.bd{padding:18px 20px 22px}
.pc h4{margin:0 0 6px;font-size:21px}
.pc p{margin:0;color:var(--tx2);font-size:15px}
.pc a{display:inline-block;margin-top:12px;color:var(--ac);font-weight:600;text-decoration:none}
.gal{columns:2 220px;column-gap:14px}
figure{margin:0 0 14px;break-inside:avoid;border-radius:18px;overflow:hidden;background:var(--card)}
figure img,figure video{width:100%;display:block}
figcaption{padding:10px 14px;font-size:14px;color:var(--tx2)}
.foot{text-align:center;padding:50px 0 34px;color:var(--tx2);font-size:12px;letter-spacing:.18em;text-transform:uppercase}
.foot b{color:var(--tx)}
</style>
</head>
<body>
<div class="pf">
  <div class="hero">
    <div class="av" style="${
      state.avatar ? `background-image:url('${state.avatar}')` : ""
    }"></div>
    <h1>${escapeHtmlText(state.name || "Your Name")}</h1>
    ${state.title ? `<p class="t">${escapeHtmlText(state.title)}</p>` : ""}
    ${state.loc ? `<div class="loc">📍 ${escapeHtmlText(state.loc)}</div>` : ""}
    <div class="acts">${linksHtml}</div>
  </div>
  ${
    state.bio.trim()
      ? `<section><h3>About</h3><div class="about">${escapeHtmlText(
          state.bio,
        )}</div></section>`
      : ""
  }
  ${
    parsedSkills.length
      ? `<section><h3>Skills</h3><div class="chips">${parsedSkills
          .map((s) => `<span>${escapeHtmlText(s)}</span>`)
          .join("")}</div></section>`
      : ""
  }
  ${
    visibleProjects.length
      ? `<section><h3>Projects</h3><div class="grid">${visibleProjects
          .map(
            (p) =>
              `<div class="pc"><div class="im" style="${
                p.img ? `background-image:url('${p.img}')` : ""
              }"></div><div class="bd"><h4>${escapeHtmlText(
                p.t,
              )}</h4><p>${escapeHtmlText(p.d)}</p>${
                p.u.trim()
                  ? `<a target="_blank" rel="noopener noreferrer" href="${escapeHtmlText(
                      normalizeExternalUrl(p.u),
                    )}">View project ›</a>`
                  : ""
              }</div></div>`,
          )
          .join("")}</div></section>`
      : ""
  }
  ${
    visibleCerts.length
      ? `<section><h3>Certificates</h3><div class="grid">${visibleCerts
          .map(
            (c) =>
              `<div class="pc"><div class="im" style="${
                c.img ? `background-image:url('${c.img}')` : ""
              }"></div><div class="bd"><h4>${escapeHtmlText(
                c.t,
              )}</h4><p>${escapeHtmlText(
                [c.i, c.y].filter(Boolean).join(" · "),
              )}</p></div></div>`,
          )
          .join("")}</div></section>`
      : ""
  }
  ${
    state.media.filter((m) => !m.src.startsWith("blob:")).length
      ? `<section><h3>Gallery</h3><div class="gal">${state.media
          .filter((m) => !m.src.startsWith("blob:"))
          .map(
            (m) =>
              `<figure>${
                m.type === "image"
                  ? `<img src="${m.src}" alt="${escapeHtmlText(m.cap)}" />`
                  : `<video controls playsinline src="${escapeHtmlText(
                      m.src,
                    )}"></video>`
              }${m.cap ? `<figcaption>${escapeHtmlText(m.cap)}</figcaption>` : ""}</figure>`,
          )
          .join("")}</div></section>`
      : ""
  }
  <div class="foot">Made with <b>GAMURA</b></div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (state.name || "portfolio")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${slug || "gamura"}-pb1-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded standalone portfolio HTML");
  };

  // Apple system color classes matching attached HTML CSS variables
  const pageBg = isDark
    ? "bg-[#000000] text-[#f5f5f7]"
    : "bg-[#f5f5f7] text-[#1d1d1f]";
  const cardCls = isDark
    ? "bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
    : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
  const borderLine = isDark ? "border-[#38383a]" : "border-[#d2d2d7]/70";
  const tx2 = isDark ? "text-[#98989d]" : "text-[#6e6e73]";
  const fillBg = isDark ? "bg-[#2c2c2e]" : "bg-[#f2f2f7]";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${pageBg}`}
      style={
        {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif',
          "--pb-ac": state.ac || "#0071e3",
        } as React.CSSProperties
      }
    >
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileChange}
      />

      {/* Apple Translucent Top Bar */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-[1.8] border-b ${borderLine} ${
          isDark ? "bg-black/78" : "bg-[#f5f5f7]/78"
        }`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          {/* Left: Home, Store & Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[34px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${fillBg} hover:opacity-85`}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden md:inline-flex min-h-[34px] px-3 rounded-full text-xs font-semibold items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${fillBg} hover:opacity-85`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="hidden sm:flex items-center gap-2 pl-1 min-w-0">
              <div
                className="w-7 h-7 rounded-[8px] text-white flex items-center justify-center font-extrabold text-[11px] tracking-tighter shrink-0 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${state.ac || "#0071e3"}, #bf5af2)`,
                }}
              >
                PB<sup className="text-[7px] ml-0.5">1</sup>
              </div>
              <span className="font-bold text-sm tracking-tight truncate">
                PORTFOLIO BUILDER ¹
              </span>
            </div>
          </div>

          {/* Center: Edit / Split / Preview Apple Segmented Control */}
          <div
            role="tablist"
            aria-label="Portfolio Builder mode"
            className={`flex items-center p-0.5 rounded-[10px] shrink-0 ${fillBg}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "edit"}
              onClick={() => {
                setMode("edit");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mode === "edit"
                  ? isDark
                    ? "bg-[#1c1c1e] text-white shadow-sm"
                    : "bg-white text-[#1d1d1f] shadow-sm"
                  : `${tx2} hover:opacity-85`
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "split"}
              onClick={() => {
                setMode("split");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                mode === "split"
                  ? isDark
                    ? "bg-[#1c1c1e] text-white shadow-sm"
                    : "bg-white text-[#1d1d1f] shadow-sm"
                  : `${tx2} hover:opacity-85`
              }`}
            >
              <Columns2 size={12} />
              <span>Split</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              onClick={() => {
                setMode("preview");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mode === "preview"
                  ? isDark
                    ? "bg-[#1c1c1e] text-white shadow-sm"
                    : "bg-white text-[#1d1d1f] shadow-sm"
                  : `${tx2} hover:opacity-85`
              }`}
            >
              Preview
            </button>
          </div>

          {/* Right: Share, Export, Theme & Universe Install */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              title="Share QR & Export HTML"
              aria-label="Share or export portfolio"
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${fillBg}`}
              style={{ color: state.ac || "#0071e3" }}
            >
              <Share2 size={15} />
            </button>

            <button
              type="button"
              onClick={handleExportStandaloneHtml}
              title="Download standalone portfolio HTML"
              aria-label="Export HTML"
              className={`hidden sm:inline-flex min-h-[34px] px-3 rounded-full text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${fillBg}`}
              style={{ color: state.ac || "#0071e3" }}
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${fillBg}`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              aria-label={installedInUniverse ? "In Universe" : "Add to Universe"}
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : fillBg
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden md:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Mode Workspace */}
      <div
        className={
          mode === "split"
            ? "flex-1 grid grid-cols-1 lg:grid-cols-[minmax(360px,480px)_minmax(0,1fr)] gap-4 max-w-[1440px] w-full mx-auto px-3 sm:px-5 pt-4 pb-6 lg:h-[calc(100vh-56px)] lg:overflow-hidden"
            : "flex-1 w-full"
        }
      >
        {(mode === "edit" || mode === "split") && (
          <main
            className={
              mode === "split"
                ? `w-full overflow-y-auto pr-1 pb-10 lg:h-full`
                : "w-full max-w-[720px] mx-auto px-4 pt-5 pb-16"
            }
          >
          {/* PROFILE */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-1 mb-2 ${tx2}`}
          >
            Profile
          </h2>
          <div className={`rounded-[14px] overflow-hidden ${cardCls}`}>
            <div className={`flex items-center gap-3 px-3.5 py-3 border-b ${borderLine}`}>
              <button
                type="button"
                onClick={() => triggerImagePick({ kind: "avatar" })}
                aria-label="Choose profile photo"
                className={`w-[76px] h-[76px] rounded-full flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ${fillBg} ${tx2} text-2xl bg-cover bg-center`}
                style={
                  state.avatar
                    ? { backgroundImage: `url('${state.avatar}')` }
                    : undefined
                }
              >
                {!state.avatar && "＋"}
              </button>
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => triggerImagePick({ kind: "avatar" })}
                  className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${fillBg}`}
                  style={{ color: state.ac || "#0071e3" }}
                >
                  Choose photo
                </button>
                {state.avatar && (
                  <button
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, avatar: "" }))}
                    className="px-3 py-1.5 text-sm font-semibold text-[#ff3b30] cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}>
              <label className="w-24 shrink-0 text-[15px]">Name</label>
              <input
                type="text"
                value={state.name}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Your name"
                className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
              />
            </div>

            <div className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}>
              <label className="w-24 shrink-0 text-[15px]">Title</label>
              <input
                type="text"
                value={state.title}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="What you do"
                className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
              />
            </div>

            <div className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}>
              <label className="w-24 shrink-0 text-[15px]">Location</label>
              <input
                type="text"
                value={state.loc}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, loc: e.target.value }))
                }
                placeholder="City, Country"
                className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
              />
            </div>

            <div className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}>
              <label className="w-24 shrink-0 text-[15px]">Email</label>
              <input
                type="email"
                value={state.email}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="you@example.com"
                className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5 px-3.5 py-3">
              <label className="text-[15px]">About</label>
              <textarea
                value={state.bio}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell your story"
                className="w-full min-h-[84px] bg-transparent outline-none text-base resize-y"
              />
            </div>
          </div>

          {/* SKILLS */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Skills
          </h2>
          <div className={`rounded-[14px] overflow-hidden ${cardCls}`}>
            <div className="px-3.5 py-3">
              <input
                type="text"
                value={state.skills}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, skills: e.target.value }))
                }
                placeholder="Separate with commas"
                aria-label="Skills"
                className="w-full bg-transparent outline-none text-base"
              />
            </div>
          </div>

          {/* LINKS */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Links
          </h2>
          <div className="space-y-3">
            {state.links.map((link, idx) => (
              <div
                key={`link-${idx}`}
                className={`rounded-[14px] overflow-hidden ${cardCls}`}
              >
                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Label</label>
                  <input
                    type="text"
                    value={link.l}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        links: prev.links.map((item, i) =>
                          i === idx ? { ...item, l: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="GitHub"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>
                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">URL</label>
                  <input
                    type="url"
                    value={link.u}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        links: prev.links.map((item, i) =>
                          i === idx ? { ...item, u: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="github.com/you"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>
                <div className="px-3.5 py-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        links: prev.links.filter((_, i) => i !== idx),
                      }))
                    }
                    className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                links: [...prev.links, { l: "", u: "" }],
              }))
            }
            className={`w-full mt-2.5 py-2.5 rounded-full text-[15px] font-semibold cursor-pointer ${fillBg}`}
            style={{ color: state.ac || "#0071e3" }}
          >
            ＋ Add link
          </button>

          {/* PROJECTS */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {state.projects.map((proj, idx) => (
              <div
                key={`proj-${idx}`}
                className={`rounded-[14px] overflow-hidden ${cardCls}`}
              >
                <div
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        triggerImagePick({ kind: "project", index: idx })
                      }
                      className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ${fillBg} ${tx2} text-xl bg-cover bg-center`}
                      style={
                        proj.img
                          ? { backgroundImage: `url('${proj.img}')` }
                          : undefined
                      }
                    >
                      {!proj.img && "＋"}
                    </button>
                    <span className={`text-sm ${tx2}`}>
                      {proj.img ? "Cover added" : "Tap to add a cover image"}
                    </span>
                  </div>
                  {proj.img && (
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          projects: prev.projects.map((item, i) =>
                            i === idx ? { ...item, img: "" } : item,
                          ),
                        }))
                      }
                      className="text-xs font-semibold text-[#ff3b30] cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Title</label>
                  <input
                    type="text"
                    value={proj.t}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        projects: prev.projects.map((item, i) =>
                          i === idx ? { ...item, t: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Project name"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>

                <div className={`px-3.5 py-2.5 border-b ${borderLine}`}>
                  <textarea
                    value={proj.d}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        projects: prev.projects.map((item, i) =>
                          i === idx ? { ...item, d: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Description"
                    className="w-full min-h-[64px] bg-transparent outline-none text-base resize-y"
                  />
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Link</label>
                  <input
                    type="url"
                    value={proj.u}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        projects: prev.projects.map((item, i) =>
                          i === idx ? { ...item, u: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Optional"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>

                <div className="px-3.5 py-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        projects: prev.projects.filter((_, i) => i !== idx),
                      }))
                    }
                    className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                projects: [
                  ...prev.projects,
                  { t: "", d: "", img: "", u: "" },
                ],
              }))
            }
            className={`w-full mt-2.5 py-2.5 rounded-full text-[15px] font-semibold cursor-pointer ${fillBg}`}
            style={{ color: state.ac || "#0071e3" }}
          >
            ＋ Add project
          </button>

          {/* CERTIFICATES */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Certificates
          </h2>
          <div className="space-y-3">
            {state.certs.map((cert, idx) => (
              <div
                key={`cert-${idx}`}
                className={`rounded-[14px] overflow-hidden ${cardCls}`}
              >
                <div
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        triggerImagePick({ kind: "cert", index: idx })
                      }
                      className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ${fillBg} ${tx2} text-xl bg-cover bg-center`}
                      style={
                        cert.img
                          ? { backgroundImage: `url('${cert.img}')` }
                          : undefined
                      }
                    >
                      {!cert.img && "＋"}
                    </button>
                    <span className={`text-sm ${tx2}`}>
                      {cert.img
                        ? "Certificate image added"
                        : "Tap to add certificate image"}
                    </span>
                  </div>
                  {cert.img && (
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          certs: prev.certs.map((item, i) =>
                            i === idx ? { ...item, img: "" } : item,
                          ),
                        }))
                      }
                      className="text-xs font-semibold text-[#ff3b30] cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Name</label>
                  <input
                    type="text"
                    value={cert.t}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        certs: prev.certs.map((item, i) =>
                          i === idx ? { ...item, t: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Certificate"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Issuer</label>
                  <input
                    type="text"
                    value={cert.i}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        certs: prev.certs.map((item, i) =>
                          i === idx ? { ...item, i: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Organisation"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${borderLine}`}
                >
                  <label className="w-24 shrink-0 text-[15px]">Year</label>
                  <input
                    type="text"
                    value={cert.y}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        certs: prev.certs.map((item, i) =>
                          i === idx ? { ...item, y: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="2026"
                    className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                  />
                </div>

                <div className="px-3.5 py-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        certs: prev.certs.filter((_, i) => i !== idx),
                      }))
                    }
                    className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                certs: [...prev.certs, { t: "", i: "", y: "", img: "" }],
              }))
            }
            className={`w-full mt-2.5 py-2.5 rounded-full text-[15px] font-semibold cursor-pointer ${fillBg}`}
            style={{ color: state.ac || "#0071e3" }}
          >
            ＋ Add certificate
          </button>

          {/* GALLERY: IMAGES & VIDEOS */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Gallery: images &amp; videos
          </h2>
          {state.media.length > 0 && (
            <div className="space-y-3 mb-3">
              {state.media.map((m, idx) => (
                <div
                  key={`media-${idx}`}
                  className={`rounded-[14px] overflow-hidden ${cardCls}`}
                >
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    {m.type === "image" ? (
                      <div
                        className={`w-16 h-16 rounded-xl shrink-0 bg-cover bg-center ${fillBg}`}
                        style={{ backgroundImage: `url('${m.src}')` }}
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-xl shrink-0 flex items-center justify-center ${fillBg} ${tx2}`}
                      >
                        <Video size={22} />
                      </div>
                    )}
                    <input
                      type="text"
                      value={m.cap}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          media: prev.media.map((item, i) =>
                            i === idx ? { ...item, cap: e.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Caption"
                      className="flex-1 min-w-0 bg-transparent outline-none text-base"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          media: prev.media.filter((_, i) => i !== idx),
                        }))
                      }
                      className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => triggerImagePick({ kind: "media" })}
              className={`flex-1 py-2.5 px-4 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${fillBg}`}
              style={{ color: state.ac || "#0071e3" }}
            >
              <ImageIcon size={16} />
              <span>＋ Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (videoInputRef.current) {
                  videoInputRef.current.value = "";
                  videoInputRef.current.click();
                }
              }}
              className={`flex-1 py-2.5 px-4 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${fillBg}`}
              style={{ color: state.ac || "#0071e3" }}
            >
              <Video size={16} />
              <span>＋ Video file</span>
            </button>
          </div>

          <div className={`rounded-[14px] overflow-hidden mt-3 ${cardCls}`}>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <input
                type="url"
                value={videoUrlDraft}
                onChange={(e) => setVideoUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddVideoUrl();
                }}
                placeholder="Or paste a direct video link (.mp4)"
                className="flex-1 min-w-0 bg-transparent outline-none text-base"
              />
              <button
                type="button"
                onClick={handleAddVideoUrl}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white cursor-pointer shrink-0"
                style={{ backgroundColor: state.ac || "#0071e3" }}
              >
                Add
              </button>
            </div>
          </div>
          <p className={`text-[13px] mx-3.5 mt-2 ${tx2}`}>
            Video files play during this session. Use a video link to keep a video saved.
          </p>

          {/* STYLE */}
          <h2
            className={`text-[13px] uppercase tracking-[0.5px] font-semibold mx-3.5 mt-7 mb-2 ${tx2}`}
          >
            Style
          </h2>
          <div className={`rounded-[14px] overflow-hidden ${cardCls}`}>
            <div
              className={`flex items-center justify-between gap-3 px-3.5 py-3 border-b ${borderLine}`}
            >
              <label className="text-[15px] shrink-0">Accent</label>
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {ACCENT_COLORS.map((color) => {
                  const selected =
                    state.ac.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Accent ${color}`}
                      onClick={() =>
                        setState((prev) => ({ ...prev, ac: color }))
                      }
                      className={`w-[30px] h-[30px] rounded-full cursor-pointer border-[3px] transition-transform ${
                        isDark ? "border-[#1c1c1e]" : "border-white"
                      } ${
                        selected
                          ? isDark
                            ? "ring-2 ring-white scale-105"
                            : "ring-2 ring-[#1d1d1f] scale-105"
                          : "ring-1 ring-black/15"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
                <label
                  title="Custom accent color"
                  className={`relative w-[30px] h-[30px] rounded-full cursor-pointer border overflow-hidden flex items-center justify-center ${borderLine}`}
                >
                  <input
                    type="color"
                    aria-label="Pick custom accent color"
                    value={state.ac}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, ac: e.target.value }))
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/15"
                    style={{ backgroundColor: state.ac }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <label className="text-[15px] shrink-0">Appearance</label>
              <select
                value={state.theme}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    theme: e.target.value as ThemeSetting,
                  }))
                }
                aria-label="Appearance"
                className="bg-transparent outline-none text-base text-right cursor-pointer"
              >
                <option value="auto">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode("preview");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full mt-5 py-3.5 rounded-full text-white text-[15px] font-semibold cursor-pointer shadow-sm transition-transform active:scale-[0.99]"
            style={{ backgroundColor: state.ac || "#0071e3" }}
          >
            Preview portfolio
          </button>

          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="w-full mt-2.5 py-2.5 rounded-full text-[#ff3b30] text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset all</span>
          </button>
          </main>
        )}

        {(mode === "preview" || mode === "split") && (
          <section
            aria-label="Live Portfolio Preview"
            className={
              mode === "split"
                ? `flex flex-col rounded-[22px] border ${borderLine} overflow-hidden shadow-sm min-h-[540px] lg:h-full ${pageBg}`
                : "w-full"
            }
          >
            {mode === "split" && (
              <div
                className={`h-11 px-3.5 border-b ${borderLine} flex items-center justify-between gap-2 shrink-0 ${
                  isDark ? "bg-[#1c1c1e]" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: state.ac || "#0071e3" }}
                  />
                  <span className="text-xs font-semibold truncate">
                    Live Preview · {state.name || "Portfolio"}
                  </span>
                </div>
                <div className={`flex items-center p-0.5 rounded-lg ${fillBg}`}>
                  <button
                    type="button"
                    onClick={() => setSplitDevice("desktop")}
                    aria-label="Desktop preview width"
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      splitDevice === "desktop"
                        ? isDark
                          ? "bg-[#1c1c1e] text-white shadow-xs"
                          : "bg-white text-[#1d1d1f] shadow-xs"
                        : tx2
                    }`}
                  >
                    <Monitor size={12} />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitDevice("mobile")}
                    aria-label="Mobile preview width"
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      splitDevice === "mobile"
                        ? isDark
                          ? "bg-[#1c1c1e] text-white shadow-xs"
                          : "bg-white text-[#1d1d1f] shadow-xs"
                        : tx2
                    }`}
                  >
                    <Smartphone size={12} />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>
              </div>
            )}

            <main
              className={
                mode === "split"
                  ? `flex-1 overflow-y-auto px-4 sm:px-6 mx-auto w-full transition-all ${
                      splitDevice === "mobile"
                        ? `max-w-[400px] my-3 rounded-[28px] border ${borderLine} shadow-md`
                        : "max-w-[920px]"
                    }`
                  : "w-full max-w-[980px] mx-auto px-5"
              }
            >
          {/* Hero */}
          <div className="text-center pt-16 pb-12">
            <div
              className="w-[132px] h-[132px] rounded-full mx-auto mb-6 shadow-[0_10px_40px_rgba(0,0,0,0.18)] bg-cover bg-center"
              style={{
                backgroundImage: state.avatar
                  ? `url('${state.avatar}')`
                  : `linear-gradient(135deg, ${state.ac || "#0071e3"}, #bf5af2)`,
              }}
            />
            <h1 className="text-[clamp(38px,9vw,72px)] leading-[1.05] tracking-[-0.03em] font-bold mb-2.5">
              {state.name || "Your Name"}
            </h1>
            {state.title && (
              <p className={`text-[clamp(19px,4vw,28px)] font-medium mb-4 ${tx2}`}>
                {state.title}
              </p>
            )}
            {state.loc && (
              <div
                className={`inline-flex items-center justify-center gap-1.5 text-[15px] mb-5 ${tx2}`}
              >
                <MapPin size={15} />
                <span>{state.loc}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {state.email.trim() && (
                <a
                  href={`mailto:${state.email.trim()}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white text-[15px] font-semibold shadow-xs"
                  style={{ backgroundColor: state.ac || "#0071e3" }}
                >
                  Contact
                </a>
              )}
              {state.links
                .filter((x) => x.l.trim() && x.u.trim())
                .map((x, idx) => (
                  <a
                    key={`pv-link-${idx}`}
                    href={normalizeExternalUrl(x.u)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[15px] font-semibold ${fillBg}`}
                    style={{ color: state.ac || "#0071e3" }}
                  >
                    {x.l}
                  </a>
                ))}
            </div>
          </div>

          {/* About */}
          {state.bio.trim() && (
            <section className="py-10">
              <h3 className="text-[clamp(28px,6vw,44px)] tracking-[-0.025em] font-bold mb-5">
                About
              </h3>
              <div className="text-[clamp(18px,3.4vw,24px)] leading-[1.5] max-w-[760px] whitespace-pre-wrap">
                {state.bio}
              </div>
            </section>
          )}

          {/* Skills */}
          {parsedSkills.length > 0 && (
            <section className="py-10">
              <h3 className="text-[clamp(28px,6vw,44px)] tracking-[-0.025em] font-bold mb-5">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {parsedSkills.map((sk, idx) => (
                  <span
                    key={`${sk}-${idx}`}
                    className={`px-[18px] py-2 rounded-full font-medium text-base ${cardCls}`}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {visibleProjects.length > 0 && (
            <section className="py-10">
              <h3 className="text-[clamp(28px,6vw,44px)] tracking-[-0.025em] font-bold mb-5">
                Projects
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                {visibleProjects.map((proj, idx) => (
                  <div
                    key={`pv-proj-${idx}`}
                    className={`rounded-[22px] overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${cardCls}`}
                  >
                    <button
                      type="button"
                      disabled={!proj.img}
                      onClick={() => proj.img && setLightboxSrc(proj.img)}
                      aria-label={proj.img ? `Zoom ${proj.t}` : proj.t}
                      className={`w-full aspect-[16/10] bg-cover bg-center border-0 ${
                        proj.img ? "cursor-zoom-in" : "cursor-default"
                      }`}
                      style={{
                        backgroundImage: proj.img
                          ? `url('${proj.img}')`
                          : `linear-gradient(135deg, ${
                              state.ac || "#0071e3"
                            }, #5e5ce6)`,
                      }}
                    />
                    <div className="p-5 pb-[22px]">
                      <h4 className="text-[21px] font-bold tracking-[-0.01em] mb-1.5">
                        {proj.t}
                      </h4>
                      <p className={`text-[15px] ${tx2}`}>{proj.d}</p>
                      {proj.u.trim() && (
                        <a
                          href={normalizeExternalUrl(proj.u)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 font-semibold text-[15px] hover:underline"
                          style={{ color: state.ac || "#0071e3" }}
                        >
                          View project ›
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certificates */}
          {visibleCerts.length > 0 && (
            <section className="py-10">
              <h3 className="text-[clamp(28px,6vw,44px)] tracking-[-0.025em] font-bold mb-5">
                Certificates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                {visibleCerts.map((cert, idx) => (
                  <div
                    key={`pv-cert-${idx}`}
                    className={`rounded-[22px] overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${cardCls}`}
                  >
                    <button
                      type="button"
                      disabled={!cert.img}
                      onClick={() => cert.img && setLightboxSrc(cert.img)}
                      aria-label={cert.img ? `Zoom ${cert.t}` : cert.t}
                      className={`w-full aspect-[16/10] bg-cover bg-center border-0 ${
                        cert.img ? "cursor-zoom-in" : "cursor-default"
                      }`}
                      style={{
                        backgroundImage: cert.img
                          ? `url('${cert.img}')`
                          : `linear-gradient(135deg, ${
                              state.ac || "#0071e3"
                            }, #5e5ce6)`,
                      }}
                    />
                    <div className="p-5 pb-[22px]">
                      <h4 className="text-[21px] font-bold tracking-[-0.01em] mb-1.5">
                        {cert.t}
                      </h4>
                      <p className={`text-[15px] ${tx2}`}>
                        {[cert.i, cert.y].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {state.media.length > 0 && (
            <section className="py-10">
              <h3 className="text-[clamp(28px,6vw,44px)] tracking-[-0.025em] font-bold mb-5">
                Gallery
              </h3>
              <div className="columns-1 sm:columns-2 gap-3.5">
                {state.media.map((m, idx) => (
                  <figure
                    key={`pv-media-${idx}`}
                    className={`mb-3.5 break-inside-avoid rounded-[18px] overflow-hidden ${cardCls}`}
                  >
                    {m.type === "image" ? (
                      <img
                        src={m.src}
                        alt={m.cap || "Gallery image"}
                        onClick={() => setLightboxSrc(m.src)}
                        className="w-full block cursor-zoom-in"
                      />
                    ) : (
                      <video
                        controls
                        playsInline
                        src={m.src}
                        className="w-full block"
                      />
                    )}
                    {m.cap && (
                      <figcaption className={`px-3.5 py-2.5 text-sm ${tx2}`}>
                        {m.cap}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Footer + Export Action */}
          <footer className="text-center pt-12 pb-10 space-y-4">
            <div>
              <button
                type="button"
                onClick={handleExportStandaloneHtml}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white cursor-pointer shadow-sm"
                style={{ backgroundColor: state.ac || "#0071e3" }}
              >
                <Download size={15} />
                <span>Download Portfolio HTML</span>
              </button>
            </div>
            <div
              className={`text-xs tracking-[0.18em] uppercase ${tx2}`}
            >
              Made with{" "}
              <strong className={isDark ? "text-white" : "text-[#1d1d1f]"}>
                GAMURA
              </strong>
            </div>
          </footer>
        </main>
      </section>
      )}
      </div>

      {/* Confirm Reset Dialog (no window.confirm) */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmResetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Reset portfolio"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 ${cardCls}`}
          >
            <div>
              <h3 className="text-lg font-bold">Reset everything?</h3>
              <p className={`text-sm mt-1 ${tx2}`}>
                This restores the sample profile, projects, and style settings.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${fillBg}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setState(DEFAULT_PORTFOLIO_STATE);
                  setConfirmResetOpen(false);
                  showToast("Portfolio reset to sample");
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[#ff3b30] text-white cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal (#lb) */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-5"
        >
          <button
            type="button"
            aria-label="Close lightbox"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxSrc}
            alt="Zoomed portfolio media"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
          />
        </div>
      )}

      {/* Share QR & Export Dialog */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share & Export Portfolio"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 ${cardCls}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode size={18} style={{ color: state.ac || "#0071e3" }} />
                <h3 className="text-lg font-bold">Share &amp; Export PB¹</h3>
              </div>
              <button
                type="button"
                aria-label="Close share dialog"
                onClick={() => setShareOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${fillBg}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-black/10">
                <QRCodeSVG
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/pb1?preview=1`
                      : "/pb1?preview=1"
                  }
                  size={156}
                  fgColor={state.ac || "#0071e3"}
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/pb1?preview=1`
                      : "/pb1?preview=1";
                  navigator.clipboard?.writeText(url).catch(() => {});
                  showToast("Preview URL copied");
                }}
                className={`w-full py-2.5 px-4 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${fillBg}`}
              >
                <Copy size={14} />
                <span>Copy Preview Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  handleExportStandaloneHtml();
                }}
                style={{ backgroundColor: state.ac || "#0071e3" }}
                className="w-full py-2.5 px-4 rounded-full text-sm font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Standalone HTML</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2.5 rounded-full bg-[#1d1d1f]/90 text-white text-sm font-medium shadow-lg pointer-events-none max-w-[90vw] text-center"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
