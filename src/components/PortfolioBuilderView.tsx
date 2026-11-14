import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Octokit } from "octokit";
import { motion, AnimatePresence } from "motion/react";
import { ProjectModal } from "./ProjectModal";
import {
  Monitor,
  Tablet,
  Smartphone,
  Trash2,
  Plus,
  Sliders,
  Layout,
  User,
  Globe,
  GraduationCap,
  Trophy,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  Github,
  Code,
  Check,
  Compass,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

// ─── THEMES ───────────────────────────────────────────────────────────────────
export const THEMES = [
  {
    name: "Apple White",
    accent: "#0071e3",
    gold: "#1d1d1f",
    bg: "#ffffff",
    card: "#f5f5f7",
    text: "#1d1d1f",
    isLight: true,
  },
  {
    name: "Apple Graphite",
    accent: "#1d1d1f",
    gold: "#0071e3",
    bg: "#f5f5f7",
    card: "#ffffff",
    text: "#1d1d1f",
    isLight: true,
  },
  {
    name: "Sky Studio",
    accent: "#0284c7",
    gold: "#0f172a",
    bg: "#ffffff",
    card: "#f0f7ff",
    text: "#0f172a",
    isLight: true,
  },
  {
    name: "Warm Ivory",
    accent: "#d97706",
    gold: "#1c1917",
    bg: "#fafaf9",
    card: "#ffffff",
    text: "#1c1917",
    isLight: true,
  },
  {
    name: "Midnight",
    accent: "#38bdf8",
    gold: "#fbbf24",
    bg: "#09090b",
    card: "#18181b",
    text: "#fafafa",
    isLight: false,
  },
  {
    name: "Ocean Dark",
    accent: "#2dd4bf",
    gold: "#facc15",
    bg: "#040d14",
    card: "#0b1926",
    text: "#e2f1ff",
    isLight: false,
  },
  {
    name: "Emerald Dark",
    accent: "#10b981",
    gold: "#a7f3d0",
    bg: "#03100b",
    card: "#071d14",
    text: "#ecfdf5",
    isLight: false,
  },
  {
    name: "Violet Dark",
    accent: "#a78bfa",
    gold: "#60a5fa",
    bg: "#0b0617",
    card: "#140c29",
    text: "#f3e8ff",
    isLight: false,
  },
];

const FONTS = [
  "SF Pro Display",
  "Plus Jakarta Sans",
  "DM Sans",
  "Space Grotesk",
  "Playfair Display",
  "JetBrains Mono",
  "Orbitron",
];

const resolveDirectImageUrl = (cleanUrl: any): string => {
  if (!cleanUrl || typeof cleanUrl !== "string") return cleanUrl || "";
  const clean = cleanUrl.trim();
  if (clean.includes("drive.google.com")) {
    const fileIdMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${idParamMatch[1]}`;
    }
  }
  return clean;
};

const isLightHex = (hex: string): boolean => {
  try {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55;
  } catch {
    return false;
  }
};

const hexRgb = (hex: string) => {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r},${g},${b}`;
  } catch {
    return "0,0,0";
  }
};

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
export const DEFAULT_PORTFOLIO = {
  theme: THEMES[0],
  font: "SF Pro Display",
  bodyFont: "SF Pro Display",
  effects: { grid: false, anim: true },
  nav: {
    title: "Portfolio",
    style: "glass",
    links: [
      { label: "Home", url: "#home" },
      { label: "Projects", url: "#projects" },
      { label: "Contact", url: "#contact" },
    ],
    ctaText: "",
    ctaUrl: "",
  },
  hero: {
    show: true,
    name: "Selvaranjan G",
    role: "Product Designer & Full-Stack Engineer",
    college: "",
    tagline:
      "Crafting clean, fast, and human-centered software experiences across web and mobile.",
    bio: "",
    initials: "SG",
    photo: "",
    btnText: "View Projects",
    btnUrl: "#projects",
    btnTarget: "_self",
    btnBgColor: "",
    btnTextColor: "",
    btnBorderColor: "",
    btn2Text: "Get in Touch",
    btn2Url: "#contact",
    btn2Target: "_self",
    btn2BgColor: "",
    btn2TextColor: "",
    btn2BorderColor: "",
    skills: ["TypeScript", "React", "Next.js", "Firebase", "UI Design"],
    resumeUrl: "",
    buttons: [] as any[],
  },
  social: {
    github: "",
    linkedin: "",
    twitter: "",
    email: "",
  } as Record<string, string>,
  stats: [
    { value: "12+", label: "Shipped Apps" },
    { value: "99.9%", label: "Uptime" },
    { value: "4 yrs", label: "Experience" },
  ] as any[],
  footer: {
    ctaText: "Contact Me",
    ctaUrl: "#contact",
    copyright: "© 2026 Portfolio. Built with Gamura.",
    showCta: false,
  },
  sections: {
    nav: true,
    hero: true,
    education: true,
    achievements: false,
    projects: true,
    contact: true,
    stats: true,
    footer: true,
    credentials: false,
    grid: false,
  },
  customSections: [] as any[],
  education: [
    {
      id: 1,
      title: "B.Sc. Computer Science",
      institution: "University",
      year: "2021 - 2024",
      description: "Focused on software systems, web engineering, and interface design.",
    },
  ] as any[],
  achievements: [] as any[],
  projects: [
    {
      id: 1,
      title: "Gamura Studio",
      emoji: "✨",
      description:
        "All-in-one creative workspace with prompt engineering, developer link hubs, and real-time collaboration.",
      tech: ["React", "TypeScript", "Firebase"],
      liveUrl: "https://gamura.vercel.app",
      githubUrl: "https://github.com",
      image: "",
      buttons: [],
    },
    {
      id: 2,
      title: "Minimal Design System",
      emoji: "🎨",
      description:
        "Accessible, token-driven component library optimized for mobile touch ergonomics and light-mode clarity.",
      tech: ["Tailwind CSS", "Design Tokens", "Vite"],
      liveUrl: "",
      githubUrl: "",
      image: "",
      buttons: [],
    },
  ] as any[],
  projectsHeading: "Selected Works",
  projectsHeadingColor: "",
  projectsSubtext: "Recent products, tools, and interactive builds.",
  projectsSubtextColor: "",
  contact: {
    heading: "Get in Touch",
    subtext:
      "Open to product collaborations, engineering roles, and freelance commissions.",
    email: "hello@example.com",
    phone: "",
    location: "Chennai, India",
    website: "",
    footer: "",
  },
  layout: { heroAlign: "center", projCols: "auto", eduCols: "auto", cardRadius: 16 },
  certificates: [] as any[],
  services: [
    {
      title: "Product Engineering",
      description:
        "End-to-end web applications built with modern React, TypeScript, and scalable cloud backends.",
    },
    {
      title: "Interface Design",
      description:
        "Clean, responsive layouts with clear typographic hierarchy and smooth touch interactions.",
    },
  ] as any[],
};

const SAMPLE_PORTFOLIO = {
  ...DEFAULT_PORTFOLIO,
  theme: THEMES[0],
  hero: {
    ...DEFAULT_PORTFOLIO.hero,
    name: "Alex Morgan",
    role: "Staff Frontend Engineer",
    tagline:
      "Building crisp, responsive web interfaces and fast developer tooling with thoughtful attention to detail.",
    bio: "Over 5 years building production design systems, realtime collaboration apps, and high-throughput web platforms.",
    initials: "AM",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js", "GraphQL"],
  },
  contact: {
    heading: "Let's Work Together",
    subtext:
      "Available for technical advisory, design engineering, and select full-stack projects.",
    email: "alex@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    website: "https://example.com",
    footer: "Alex Morgan",
  },
  layout: { heroAlign: "left", projCols: "auto", eduCols: "auto", cardRadius: 16 },
};

// ─── HTML GENERATOR ───────────────────────────────────────────────────────────
export function generatePortfolioHTML(data: any, _isBuilder: boolean = false) {
  const {
    theme = THEMES[0],
    font = "SF Pro Display",
    hero = DEFAULT_PORTFOLIO.hero,
    nav = DEFAULT_PORTFOLIO.nav,
    social = DEFAULT_PORTFOLIO.social,
    stats = [],
    education = [],
    achievements = [],
    projects = [],
    contact = DEFAULT_PORTFOLIO.contact,
    sections = DEFAULT_PORTFOLIO.sections,
    customSections = [],
    layout = DEFAULT_PORTFOLIO.layout,
    certificates = [],
    services = [],
    footer = DEFAULT_PORTFOLIO.footer,
  } = data || {};

  const acc = theme.accent || "#0071e3";
  const bg = theme.bg || "#ffffff";
  const card = theme.card || "#f5f5f7";
  const txt = theme.text || "#1d1d1f";
  const light =
    typeof theme.isLight === "boolean" ? theme.isLight : isLightHex(bg);

  const ar = hexRgb(acc);
  const bgr = hexRgb(bg);
  const cr = (layout.cardRadius ?? 16) + "px";

  const mutedText = light ? "rgba(29,29,31,0.64)" : "rgba(255,255,255,0.68)";
  const subtleBorder = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.09)";
  const navBg = light ? `rgba(${bgr},0.85)` : `rgba(${bgr},0.85)`;
  const pillBg = light ? `rgba(${ar},0.08)` : `rgba(${ar},0.12)`;
  const secondaryBtnBg = light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)";
  const secondaryBtnText = light ? "#1d1d1f" : "#ffffff";

  const isSystemFont = font === "SF Pro Display";
  const googleFontName = isSystemFont ? "Plus Jakarta Sans" : String(font || "Plus Jakarta Sans");
  const safeFont = googleFontName.replace(/ /g, "+");
  const fontStack = isSystemFont
    ? "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', sans-serif"
    : `'${googleFontName}', -apple-system, BlinkMacSystemFont, sans-serif`;

  const socKeys = Object.keys(social || {}).filter((k) => social && social[k]);
  const socIcons: Record<string, string> = {
    github: "GitHub",
    linkedin: "LinkedIn",
    twitter: "X",
    instagram: "Instagram",
    email: "Email",
    youtube: "YouTube",
  };

  const escapeHtml = (str: any) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const initialsText = escapeHtml(
    hero.initials ||
      (hero.name || "P")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(hero.name || "Portfolio")} — ${escapeHtml(hero.role || "Portfolio")}</title>
<link href="https://fonts.googleapis.com/css2?family=${safeFont}:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --a:${acc};
  --bg:${bg};
  --card:${card};
  --txt:${txt};
  --muted:${mutedText};
  --border:${subtleBorder};
  --cr:${cr};
}
*{box-sizing:border-box}
body{
  background:var(--bg);
  color:var(--txt);
  font-family:${fontStack};
  margin:0;
  padding:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  min-height:100vh;
  overflow-x:hidden;
  scroll-behavior:smooth;
  -webkit-font-smoothing:antialiased;
}
.nav{
  position:sticky;
  top:0;
  width:100%;
  height:56px;
  background:${navBg};
  backdrop-filter:saturate(180%) blur(20px);
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 24px;
  z-index:100;
}
.nav-inner{
  width:100%;
  max-width:960px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.nav-brand{
  font-weight:700;
  color:var(--txt);
  font-size:0.95rem;
  letter-spacing:-0.01em;
}
.nav-links{display:flex;align-items:center;gap:24px}
.nav-links a{
  color:var(--muted);
  text-decoration:none;
  font-size:0.82rem;
  font-weight:500;
  transition:color 0.2s;
}
.nav-links a:hover{color:var(--a)}
.nav-toggle{
  display:none;
  background:none;
  border:none;
  color:var(--txt);
  font-size:1.25rem;
  cursor:pointer;
}
.mobile-nav{
  width:100%;
  background:var(--bg);
  border-bottom:1px solid var(--border);
  display:none;
  flex-direction:column;
  padding:10px 24px;
}
.mobile-nav.open{display:flex}
.mobile-nav a{
  color:var(--txt);
  text-decoration:none;
  font-size:0.9rem;
  font-weight:500;
  padding:10px 0;
  border-bottom:1px solid var(--border);
}
.mobile-nav a:last-child{border-bottom:none}
.section{
  max-width:960px;
  width:100%;
  padding:56px 24px 28px;
}
.hero{
  padding-top:64px;
  padding-bottom:44px;
  display:flex;
  flex-direction:${layout.heroAlign === "left" ? "row" : "column"};
  align-items:center;
  justify-content:${layout.heroAlign === "left" ? "space-between" : "center"};
  gap:36px;
}
.hero-content{
  flex:1.2;
  display:flex;
  flex-direction:column;
  align-items:${layout.heroAlign === "left" ? "flex-start" : "center"};
  text-align:${layout.heroAlign === "left" ? "left" : "center"};
}
.hero-media-wrapper{
  flex:0.8;
  display:flex;
  justify-content:center;
  align-items:center;
}
.hero-img{
  width:140px;
  height:140px;
  border-radius:50%;
  object-fit:cover;
  border:3px solid var(--border);
  box-shadow:0 8px 24px rgba(0,0,0,0.08);
}
.hero-avatar-fallback{
  width:112px;
  height:112px;
  border-radius:50%;
  background:linear-gradient(135deg, var(--a), rgba(${ar},0.7));
  color:#ffffff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:2rem;
  font-weight:700;
  letter-spacing:-0.02em;
  box-shadow:0 10px 26px rgba(${ar},0.22);
}
h1{
  font-size:clamp(2.1rem, 5vw, 3.6rem);
  font-weight:700;
  letter-spacing:-0.03em;
  line-height:1.08;
  margin:0;
  color:var(--txt);
}
.role{
  font-size:1.02rem;
  color:var(--a);
  margin-top:10px;
  font-weight:600;
  letter-spacing:-0.01em;
}
.tagline{
  font-size:1.05rem;
  max-width:580px;
  margin:14px ${layout.heroAlign === "center" ? "auto" : "0"} 0;
  line-height:1.55;
  color:var(--muted);
}
.card{
  background:var(--card);
  border:1px solid var(--border);
  padding:24px;
  border-radius:var(--cr);
  transition:transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 28px rgba(0,0,0,0.06);
}
h2{
  font-size:1.45rem;
  font-weight:700;
  letter-spacing:-0.02em;
  margin:0 0 20px 0;
  color:var(--txt);
}
.pill{
  display:inline-block;
  padding:5px 12px;
  border-radius:999px;
  font-size:0.75rem;
  font-weight:600;
  background:${pillBg};
  color:var(--a);
}
.grid{
  display:grid;
  grid-template-columns:${layout.projCols === "auto" ? "repeat(auto-fit,minmax(260px,1fr))" : `repeat(${layout.projCols},1fr)`};
  gap:16px;
}
.btn-primary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:11px 22px;
  background:var(--a);
  color:#ffffff;
  text-decoration:none;
  font-weight:600;
  font-size:0.86rem;
  border-radius:12px;
  border:none;
  cursor:pointer;
  transition:opacity 0.2s;
}
.btn-primary:hover{opacity:0.9}
.btn-secondary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:11px 22px;
  background:${secondaryBtnBg};
  color:${secondaryBtnText};
  text-decoration:none;
  font-weight:600;
  font-size:0.86rem;
  border-radius:12px;
  border:1px solid var(--border);
  cursor:pointer;
  transition:opacity 0.2s;
}
.btn-secondary:hover{opacity:0.85}
.social-bar{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:22px;
  justify-content:${layout.heroAlign === "center" ? "center" : "flex-start"};
}
.social-link{
  padding:6px 13px;
  background:var(--card);
  border:1px solid var(--border);
  border-radius:999px;
  text-decoration:none;
  color:var(--txt);
  font-size:0.78rem;
  font-weight:500;
}
.social-link:hover{border-color:var(--a);color:var(--a)}
.footer{
  width:100%;
  padding:40px 24px;
  text-align:center;
  border-top:1px solid var(--border);
  margin-top:auto;
  color:var(--muted);
  font-size:0.8rem;
}
.modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.55);
  backdrop-filter:blur(8px);
  z-index:2000;
  display:none;
  align-items:center;
  justify-content:center;
  padding:20px;
}
.modal-content{
  background:var(--bg);
  color:var(--txt);
  max-width:640px;
  width:100%;
  max-height:85vh;
  overflow-y:auto;
  border-radius:20px;
  border:1px solid var(--border);
  padding:28px;
  position:relative;
  box-shadow:0 24px 60px rgba(0,0,0,0.22);
}
.modal-close{
  position:absolute;
  top:16px;
  right:16px;
  background:var(--card);
  border:1px solid var(--border);
  color:var(--txt);
  width:32px;
  height:32px;
  border-radius:50%;
  font-size:1rem;
  cursor:pointer;
}
@media (max-width:768px){
  .nav-links{display:none}
  .nav-toggle{display:block}
  .hero{flex-direction:column-reverse !important;text-align:center !important;padding-top:40px;gap:24px}
  .hero-content{align-items:center !important;text-align:center !important}
  .tagline{margin:12px auto 0 !important}
  .social-bar{justify-content:center !important}
  .section{padding:36px 18px 20px}
}
</style>
</head>
<body>
${
  sections?.nav
    ? `
<nav class="nav">
  <div class="nav-inner">
    <div class="nav-brand">${escapeHtml(nav.title || hero.name || "Portfolio")}</div>
    <div class="nav-links">
      ${(nav.links || [])
        .map(
          (l: any) =>
            `<a href="${escapeHtml(l.url || "#")}">${escapeHtml(l.label || "Link")}</a>`
        )
        .join("")}
    </div>
    <button class="nav-toggle" onclick="document.getElementById('mobileNav').classList.toggle('open')">☰</button>
  </div>
</nav>
<div id="mobileNav" class="mobile-nav">
  ${(nav.links || [])
    .map(
      (l: any) =>
        `<a href="${escapeHtml(l.url || "#")}" onclick="document.getElementById('mobileNav').classList.remove('open')">${escapeHtml(l.label || "Link")}</a>`
    )
    .join("")}
</div>
`
    : ""
}

${
  sections?.hero && hero.show !== false
    ? `
<section class="section hero" id="home">
  <div class="hero-content">
    ${
      layout.heroAlign !== "left"
        ? hero.photo
          ? `<img src="${escapeHtml(hero.photo)}" class="hero-img" alt="${escapeHtml(hero.name)}" style="margin-bottom:20px" />`
          : `<div class="hero-avatar-fallback" style="margin-bottom:20px">${initialsText}</div>`
        : ""
    }
    <h1 style="${hero.nameColor ? `color:${escapeHtml(hero.nameColor)};` : ""}">${escapeHtml(hero.name || "Your Name")}</h1>
    <div class="role" style="${hero.roleColor ? `color:${escapeHtml(hero.roleColor)};` : ""}">${escapeHtml(hero.role || "Designer & Engineer")}</div>
    ${hero.tagline ? `<p class="tagline" style="${hero.taglineColor ? `color:${escapeHtml(hero.taglineColor)};` : ""}">${escapeHtml(hero.tagline)}</p>` : ""}
    ${hero.bio ? `<p style="font-size:0.95rem;color:${escapeHtml(hero.bioColor || "var(--muted)")};line-height:1.6;max-width:580px;margin-top:10px">${escapeHtml(hero.bio)}</p>` : ""}
    ${
      hero.skills && hero.skills.length > 0
        ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:16px;justify-content:${layout.heroAlign === "center" ? "center" : "flex-start"}">${hero.skills
            .map((s: string) => `<span class="pill">${escapeHtml(s)}</span>`)
            .join("")}</div>`
        : ""
    }
    <div style="display:flex;gap:10px;justify-content:${layout.heroAlign === "center" ? "center" : "flex-start"};flex-wrap:wrap;margin-top:22px">
      ${hero.btnText ? `<a href="${escapeHtml(hero.btnUrl || "#")}" target="${escapeHtml(hero.btnTarget || "_self")}" class="btn-primary" style="${hero.btnBgColor ? `background:${escapeHtml(hero.btnBgColor)};` : ""}${hero.btnTextColor ? `color:${escapeHtml(hero.btnTextColor)};` : ""}">${escapeHtml(hero.btnText)}</a>` : ""}
      ${hero.btn2Text ? `<a href="${escapeHtml(hero.btn2Url || "#")}" target="${escapeHtml(hero.btn2Target || "_self")}" class="btn-secondary" style="${hero.btn2BgColor ? `background:${escapeHtml(hero.btn2BgColor)};` : ""}${hero.btn2TextColor ? `color:${escapeHtml(hero.btn2TextColor)};` : ""}">${escapeHtml(hero.btn2Text)}</a>` : ""}
      ${hero.resumeUrl ? `<a href="${escapeHtml(hero.resumeUrl)}" target="_blank" class="btn-secondary">Resume</a>` : ""}
      ${(hero.buttons || [])
        .map(
          (b: any) =>
            `<a href="${escapeHtml(b.url || "#")}" target="${escapeHtml(b.target || "_blank")}" class="btn-secondary" style="${b.bgColor ? `background:${escapeHtml(b.bgColor)};` : ""}${b.textColor ? `color:${escapeHtml(b.textColor)};` : ""}">${escapeHtml(b.label || "Link")}</a>`
        )
        .join("")}
    </div>
    ${
      socKeys.length > 0
        ? `<div class="social-bar">${socKeys
            .map(
              (k) =>
                `<a href="${k === "email" ? "mailto:" + escapeHtml(social[k]) : escapeHtml(social[k])}" target="_blank" class="social-link">${socIcons[k] || escapeHtml(k)}</a>`
            )
            .join("")}</div>`
        : ""
    }
  </div>
  ${
    layout.heroAlign === "left"
      ? `<div class="hero-media-wrapper">${
          hero.photo
            ? `<img src="${escapeHtml(hero.photo)}" class="hero-img" alt="${escapeHtml(hero.name)}" />`
            : `<div class="hero-avatar-fallback" style="width:150px;height:150px;font-size:2.4rem">${initialsText}</div>`
        }</div>`
      : ""
  }
</section>`
    : ""
}

${
  sections?.stats && stats && stats.length > 0
    ? `
<section class="section" style="padding-top:8px">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;text-align:center">
    ${stats
      .map(
        (s: any) =>
          `<div class="card" style="padding:18px"><div style="font-size:1.75rem;font-weight:700;color:var(--a)">${escapeHtml(s.value || "0")}</div><div style="font-size:0.78rem;color:var(--muted);margin-top:4px">${escapeHtml(s.label || "")}</div></div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${
  services && services.length > 0
    ? `
<section class="section" id="services">
  <h2>Capabilities</h2>
  <div class="grid">
    ${services
      .map(
        (s: any) =>
          `<div class="card"><h3 style="margin:0;font-size:1.02rem;font-weight:600">${escapeHtml(s.title || "")}</h3><p style="color:var(--muted);font-size:0.88rem;line-height:1.55;margin:8px 0 0">${escapeHtml(s.description || "")}</p></div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${
  sections?.projects && projects && projects.length > 0
    ? `
<section class="section" id="projects">
  <h2 style="${data.projectsHeadingColor ? `color:${escapeHtml(data.projectsHeadingColor)}` : ""}">${escapeHtml(data.projectsHeading || "Selected Works")}</h2>
  ${data.projectsSubtext ? `<p style="color:${escapeHtml(data.projectsSubtextColor || "var(--muted)")};font-size:0.92rem;margin:-10px 0 20px">${escapeHtml(data.projectsSubtext)}</p>` : ""}
  <div class="grid">
    ${projects
      .map(
        (p: any, idx: number) => `
      <div class="card" onclick="openProject(${idx})" style="cursor:pointer;${p.bgColor ? `background:${escapeHtml(p.bgColor)};` : ""}${p.borderColor ? `border-color:${escapeHtml(p.borderColor)};` : ""}">
        ${p.image ? `<img src="${escapeHtml(p.image)}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:14px" />` : ""}
        <h3 style="margin:0;font-size:1.05rem;font-weight:600;color:${escapeHtml(p.titleColor || "var(--txt)")}">${escapeHtml(p.title || "Project")}</h3>
        <p style="color:${escapeHtml(p.descColor || "var(--muted)")};font-size:0.88rem;line-height:1.55;margin:8px 0 12px">${escapeHtml(p.description || "")}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${(p.tech || [])
            .slice(0, 4)
            .map((t: string) => `<span class="pill" style="font-size:0.7rem;padding:3px 9px">${escapeHtml(t)}</span>`)
            .join("")}
        </div>
      </div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${
  sections?.education && education && education.length > 0
    ? `
<section class="section" id="education">
  <h2>Education</h2>
  <div class="grid">
    ${education
      .map(
        (e: any) =>
          `<div class="card"><h3 style="margin:0;font-size:1rem;font-weight:600">${escapeHtml(e.title || "")}</h3><div style="font-size:0.8rem;color:var(--a);font-weight:500;margin-top:4px">${escapeHtml(e.institution || "")} · ${escapeHtml(e.year || "")}</div>${e.description ? `<p style="color:var(--muted);font-size:0.86rem;line-height:1.5;margin:10px 0 0">${escapeHtml(e.description)}</p>` : ""}</div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${
  sections?.achievements && achievements && achievements.length > 0
    ? `
<section class="section" id="achievements">
  <h2>Achievements</h2>
  <div class="grid">
    ${achievements
      .map(
        (a: any) =>
          `<div class="card">${a.image ? `<img src="${escapeHtml(a.image)}" style="width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:12px" />` : ""}<h3 style="margin:0;font-size:1rem;font-weight:600">${escapeHtml(a.title || "")}</h3><div style="font-size:0.78rem;color:var(--muted);margin-top:4px">${escapeHtml(a.organization || "")} ${escapeHtml(a.year || "")}</div></div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${
  sections?.credentials && certificates && certificates.length > 0
    ? `
<section class="section" id="credentials">
  <h2>Credentials</h2>
  <div class="grid">
    ${certificates
      .map(
        (c: any) =>
          `<div class="card" style="display:flex;align-items:center;gap:14px">${c.image ? `<img src="${escapeHtml(c.image)}" style="width:46px;height:46px;border-radius:10px;object-fit:cover" />` : ""}<div><div style="font-weight:600;font-size:0.94rem">${escapeHtml(c.title || "")}</div><div style="font-size:0.78rem;color:var(--muted);margin-top:2px">${escapeHtml(c.issuer || "")} · ${escapeHtml(c.date || "")}</div></div></div>`
      )
      .join("")}
  </div>
</section>`
    : ""
}

${customSections
  .map(
    (s: any) => `
<section class="section" id="${escapeHtml(s.id || "custom")}">
  <h2>${escapeHtml(s.title || "")}</h2>
  <div class="grid">
    ${(s.items || [])
      .map(
        (item: any) =>
          `<div class="card"><h4 style="margin:0;font-size:0.95rem;font-weight:600">${escapeHtml(item.title || "")}</h4><p style="color:var(--muted);font-size:0.86rem;line-height:1.55;margin:8px 0 0">${escapeHtml(item.description || "")}</p></div>`
      )
      .join("")}
  </div>
</section>`
  )
  .join("")}

${
  sections?.contact
    ? `
<section class="section" id="contact">
  <h2>${escapeHtml(contact.heading || "Get in Touch")}</h2>
  <div class="card" style="max-width:600px">
    ${contact.subtext ? `<p style="color:var(--muted);font-size:0.94rem;line-height:1.6;margin:0 0 18px 0">${escapeHtml(contact.subtext)}</p>` : ""}
    <div style="display:flex;flex-direction:column;gap:10px;font-size:0.9rem">
      ${contact.email ? `<div><span style="color:var(--muted);font-size:0.78rem;display:inline-block;width:72px">Email</span> <a href="mailto:${escapeHtml(contact.email)}" style="color:var(--a);text-decoration:none;font-weight:600">${escapeHtml(contact.email)}</a></div>` : ""}
      ${contact.phone ? `<div><span style="color:var(--muted);font-size:0.78rem;display:inline-block;width:72px">Phone</span> <span>${escapeHtml(contact.phone)}</span></div>` : ""}
      ${contact.location ? `<div><span style="color:var(--muted);font-size:0.78rem;display:inline-block;width:72px">Location</span> <span>${escapeHtml(contact.location)}</span></div>` : ""}
    </div>
  </div>
</section>`
    : ""
}

${
  sections?.footer
    ? `
<footer class="footer">
  ${footer?.showCta ? `<div style="margin-bottom:20px"><a href="${escapeHtml(footer.ctaUrl || "#contact")}" class="btn-primary">${escapeHtml(footer.ctaText || "Contact Me")}</a></div>` : ""}
  <div>${escapeHtml(footer?.copyright || "© 2026 Portfolio")}</div>
</footer>`
    : ""
}

<div id="projectModal" class="modal" onclick="closeProject()">
  <div class="modal-content" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="closeProject()">✕</button>
    <div id="modalBody"></div>
  </div>
</div>

<script>
const projectData = ${JSON.stringify(projects || [])};
function openProject(idx) {
  const p = projectData[idx];
  const modal = document.getElementById('projectModal');
  const body = document.getElementById('modalBody');
  if(!p || !modal || !body) return;
  body.innerHTML = \`
    \${p.image ? '<img src="' + p.image + '" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:16px" />' : ''}
    <h2 style="margin:0 0 8px 0">\${p.title || 'Project'}</h2>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">\${(p.tech || []).map(t => '<span class="pill">' + t + '</span>').join('')}</div>
    <p style="color:var(--muted);line-height:1.6;margin-bottom:20px">\${p.description || ''}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      \${p.liveUrl ? '<a href="' + p.liveUrl + '" target="_blank" class="btn-primary">Live Demo</a>' : ''}
      \${p.githubUrl ? '<a href="' + p.githubUrl + '" target="_blank" class="btn-secondary">GitHub</a>' : ''}
    </div>
  \`;
  modal.style.display = 'flex';
}
function closeProject() {
  document.getElementById('projectModal').style.display = 'none';
}
</script>
</body>
</html>`;
}

// ─── BUILDER UI PRIMITIVES (APPLE WHITE DESIGN) ───────────────────────────────
const Input = ({
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
}: any) => (
  <input
    type={type}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-blue-500/10 transition-all ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder = "", rows = 2 }: any) => (
  <textarea
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
  />
);

const Field = ({ label, children }: any) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-[#6E6E73] block">
      {label}
    </label>
    {children}
  </div>
);

const Accordion = ({ title, icon, defaultOpen = false, children }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-200/70">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[#6E6E73] shrink-0">{icon}</span>
          <span className="text-xs font-semibold text-[#1D1D1F] truncate">
            {title}
          </span>
        </div>
        <ChevronRight
          size={14}
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${
            open ? "rotate-90 text-[#1D1D1F]" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-white">{children}</div>
      )}
    </div>
  );
};

const FileUpload = ({ label, onUpload, value }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [value]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const isDataUrl = typeof value === "string" && value.startsWith("data:");

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-[#6E6E73] block">
        {label}
      </label>
      <div className="flex gap-2.5 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-11 h-11 shrink-0 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 overflow-hidden flex items-center justify-center hover:bg-zinc-200/60 transition-colors cursor-pointer"
          title="Upload image"
        >
          {value && !error ? (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
          ) : (
            <Plus size={16} className="text-[#6E6E73]" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <Input
            value={isDataUrl ? "Uploaded image" : value || ""}
            onChange={(v: string) => {
              if (!isDataUrl) onUpload(v);
            }}
            placeholder="Paste image URL or click + to upload"
          />
          {value && (
            <button
              type="button"
              onClick={() => onUpload("")}
              className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
            >
              Remove image
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
        accept="image/*"
      />
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export interface PortfolioBuilderViewProps {
  onBack: () => void;
  showToast?: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
}

export function PortfolioBuilderView({
  onBack,
  showToast,
}: PortfolioBuilderViewProps) {
  const [view, setView] = useState<
    "builder" | "full-preview" | "code" | "publish"
  >("builder");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "saved"
  );
  const isInitialMount = useRef(true);

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("portfolio_system");
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: any = {
          ...DEFAULT_PORTFOLIO,
          ...parsed,
          hero: { ...DEFAULT_PORTFOLIO.hero, ...(parsed.hero || {}) },
          nav: { ...DEFAULT_PORTFOLIO.nav, ...(parsed.nav || {}) },
          social: { ...DEFAULT_PORTFOLIO.social, ...(parsed.social || {}) },
          contact: { ...DEFAULT_PORTFOLIO.contact, ...(parsed.contact || {}) },
          layout: { ...DEFAULT_PORTFOLIO.layout, ...(parsed.layout || {}) },
          effects: { ...DEFAULT_PORTFOLIO.effects, ...(parsed.effects || {}) },
          sections: { ...DEFAULT_PORTFOLIO.sections, ...(parsed.sections || {}) },
          footer: { ...DEFAULT_PORTFOLIO.footer, ...(parsed.footer || {}) },
        };
        if (!merged.theme || typeof merged.theme !== "object" || !merged.theme.name) {
          merged.theme = THEMES[0];
        }
        return merged;
      }
    } catch {
      // ignore invalid storage
    }
    return DEFAULT_PORTFOLIO;
  });

  const [previewData, setPreviewData] = useState(data);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [mobileViewMode, setMobileViewMode] = useState<"editor" | "preview">(
    "editor"
  );
  const [copied, setCopied] = useState(false);
  const [activeProjectForModal, setActiveProjectForModal] = useState<any | null>(
    null
  );
  const [confirmReset, setConfirmReset] = useState(false);

  // Deploy credentials
  const [githubToken, setGithubToken] = useState(
    () => localStorage.getItem("gamura_github_token") || ""
  );
  const [githubRepo, setGithubRepo] = useState(
    () => localStorage.getItem("gamura_github_repo") || "my-web-portfolio"
  );
  const [githubCommitMessage, setGithubCommitMessage] = useState(
    "Update personal portfolio"
  );
  const [vercelToken, setVercelToken] = useState(
    () => localStorage.getItem("gamura_vercel_token") || ""
  );
  const [vercelProject, setVercelProject] = useState(
    () => localStorage.getItem("gamura_vercel_project") || "my-web-portfolio"
  );

  const [githubStatus, setGithubStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
    url?: string;
  }>({ type: "idle" });
  const [vercelStatus, setVercelStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
    url?: string;
  }>({ type: "idle" });
  const [selectedDeployTab, setSelectedDeployTab] = useState<
    "github" | "vercel" | "netlify"
  >("github");

  useEffect(() => {
    localStorage.setItem("gamura_github_token", githubToken);
  }, [githubToken]);

  useEffect(() => {
    localStorage.setItem("gamura_github_repo", githubRepo);
  }, [githubRepo]);

  useEffect(() => {
    localStorage.setItem("gamura_vercel_token", vercelToken);
  }, [vercelToken]);

  useEffect(() => {
    localStorage.setItem("gamura_vercel_project", vercelProject);
  }, [vercelProject]);

  // Debounce preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewData(data);
    }, 250);
    return () => clearTimeout(timer);
  }, [data]);

  // Auto-save safely without overwriting on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("portfolio_system", JSON.stringify(data));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const update = useCallback((path: string, value: any) => {
    setData((prev: any) => {
      const next = { ...prev };
      const parts = path.split(".");
      let current: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        current[key] = Array.isArray(current[key])
          ? [...current[key]]
          : { ...(current[key] || {}) };
        current = current[key];
      }
      const lastKey = parts[parts.length - 1];
      let processedValue = value;
      if (
        typeof value === "string" &&
        (lastKey === "photo" || lastKey === "image" || lastKey === "avatar")
      ) {
        processedValue = resolveDirectImageUrl(value);
      }
      current[lastKey] = processedValue;
      return next;
    });
  }, []);

  const generatedHTML = useMemo(
    () => generatePortfolioHTML(previewData, true),
    [previewData]
  );
  const liveHTML = useMemo(() => generatePortfolioHTML(data, false), [data]);

  const handleDownloadHTML = () => {
    const blob = new Blob([liveHTML], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "portfolio.html";
    a.click();
    if (showToast) {
      showToast("✓", "Downloaded", "Saved portfolio.html to your device.", "success");
    }
  };

  const handleCopyHTML = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(liveHTML)
      .then(() => {
        setCopied(true);
        if (showToast) showToast("✓", "Copied", "HTML copied to clipboard.", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handlePublishGithub = async () => {
    const token = githubToken.trim();
    const repo = githubRepo.trim();
    const commitMsg = githubCommitMessage.trim() || "Publish personal portfolio";
    if (!token) {
      setGithubStatus({
        type: "error",
        message: "Enter a GitHub Personal Access Token.",
      });
      return;
    }
    if (!repo) {
      setGithubStatus({ type: "error", message: "Enter a repository name." });
      return;
    }
    setGithubStatus({ type: "loading", message: "Connecting to GitHub..." });

    try {
      const octokit = new Octokit({ auth: token });
      const { data: userData } = await octokit.rest.users.getAuthenticated();
      const username = userData.login;
      let repoData: any;
      try {
        const { data: existingRepo } = await octokit.rest.repos.get({
          owner: username,
          repo,
        });
        repoData = existingRepo;
      } catch (repoErr: any) {
        if (repoErr.status === 404) {
          const { data: newRepo } =
            await octokit.rest.repos.createForAuthenticatedUser({
              name: repo,
              description: "Personal portfolio built with Gamura.",
              private: false,
              auto_init: false,
            });
          repoData = newRepo;
        } else {
          throw repoErr;
        }
      }

      let existingSha: string | undefined;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner: username,
          repo,
          path: "index.html",
        });
        if (!Array.isArray(fileData) && fileData.type === "file") {
          existingSha = fileData.sha;
        }
      } catch {
        // first commit
      }

      const b64Data = btoa(unescape(encodeURIComponent(liveHTML)));
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo,
        path: "index.html",
        message: commitMsg,
        content: b64Data,
        sha: existingSha,
      });

      setGithubStatus({
        type: "success",
        message: `Published index.html to ${username}/${repo}. Enable GitHub Pages in repo settings to view live.`,
        url: repoData.html_url,
      });
      if (showToast) {
        showToast("✓", "Synced to GitHub", `${username}/${repo} updated.`, "success");
      }
    } catch (err: any) {
      setGithubStatus({
        type: "error",
        message: err?.message || "GitHub publish failed.",
      });
    }
  };

  const handleDeployVercel = async () => {
    if (!vercelToken.trim()) {
      setVercelStatus({ type: "error", message: "Enter your Vercel token." });
      return;
    }
    if (!vercelProject.trim()) {
      setVercelStatus({ type: "error", message: "Enter a project name." });
      return;
    }
    setVercelStatus({ type: "loading", message: "Deploying to Vercel..." });
    try {
      const res = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: vercelProject.trim(),
          files: [{ file: "index.html", data: liveHTML }],
          projectSettings: { framework: null },
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || `Vercel error (${res.status})`);
      }
      setVercelStatus({
        type: "success",
        message: "Deployment live on Vercel.",
        url: `https://${resData.url}`,
      });
    } catch (err: any) {
      setVercelStatus({
        type: "error",
        message: err?.message || "Vercel deployment failed.",
      });
    }
  };

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.name === data.theme?.name);
    const next = THEMES[(idx + 1) % THEMES.length];
    setData((prev: any) => ({ ...prev, theme: next }));
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="w-full h-[calc(100vh-148px)] min-h-[540px] flex flex-col bg-[#F5F5F7] text-[#1D1D1F] rounded-3xl border border-zinc-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      {/* Top Apple Studio Bar */}
      <header className="min-h-[52px] bg-white border-b border-zinc-200/80 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Segmented View Control */}
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-xl border border-zinc-200/60 overflow-x-auto">
            {[
              { id: "builder", label: "Editor", icon: <Sliders size={13} /> },
              { id: "full-preview", label: "Preview", icon: <Eye size={13} /> },
              { id: "code", label: "Code", icon: <Code size={13} /> },
              { id: "publish", label: "Publish", icon: <Globe size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  view === tab.id
                    ? "bg-white text-[#1D1D1F] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-[11px] font-medium text-[#6E6E73] whitespace-nowrap">
            {saveStatus === "saving" ? "Saving..." : "Saved"}
          </span>

          <button
            type="button"
            onClick={cycleTheme}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/70 text-xs font-medium text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
            title="Switch portfolio theme"
          >
            <RefreshCw size={12} />
            <span>{data.theme?.name || "Apple White"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHTML}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download size={13} />
            <span>Export HTML</span>
          </button>
        </div>
      </header>

      {/* Mobile Editor / Preview Toggle */}
      {view === "builder" && (
        <div className="flex md:hidden bg-white border-b border-zinc-200/70 p-2 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileViewMode("editor")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              mobileViewMode === "editor"
                ? "bg-[#1D1D1F] text-white"
                : "bg-[#F5F5F7] text-[#6E6E73]"
            }`}
          >
            Edit Content
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode("preview")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              mobileViewMode === "preview"
                ? "bg-[#1D1D1F] text-white"
                : "bg-[#F5F5F7] text-[#6E6E73]"
            }`}
          >
            Live Preview
          </button>
        </div>
      )}

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Sidebar Editor */}
        {view === "builder" && (
          <aside
            className={`w-full md:w-[320px] lg:w-[350px] bg-white border-r border-zinc-200/80 flex-col shrink-0 overflow-hidden ${
              mobileViewMode === "editor" ? "flex h-full" : "hidden md:flex md:h-full"
            }`}
          >
            {/* Sidebar Subheader */}
            <div className="px-4 py-2.5 bg-[#FAFAFC] border-b border-zinc-200/70 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-semibold text-[#1D1D1F]">
                Portfolio Sections
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setData(JSON.parse(JSON.stringify(SAMPLE_PORTFOLIO)))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-[11px] font-medium text-[#1D1D1F] cursor-pointer whitespace-nowrap"
                >
                  <Sparkles size={11} />
                  <span>Template</span>
                </button>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-red-50 border border-zinc-200/80 text-[11px] font-medium text-[#6E6E73] hover:text-red-600 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setData(JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO)));
                        setConfirmReset(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-100 text-[#1D1D1F] text-[11px] font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accordion Scroll List */}
            <div className="flex-1 overflow-y-auto pb-8">
              <Accordion
                title="Profile & Hero"
                icon={<User size={15} />}
                defaultOpen
              >
                <FileUpload
                  label="Profile Photo"
                  value={data.hero.photo}
                  onUpload={(v: any) => update("hero.photo", v)}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Full Name">
                    <Input
                      value={data.hero.name}
                      onChange={(v: string) => update("hero.name", v)}
                      placeholder="Your Name"
                    />
                  </Field>
                  <Field label="Initials (if no photo)">
                    <Input
                      value={data.hero.initials}
                      onChange={(v: string) => update("hero.initials", v)}
                      placeholder="YN"
                    />
                  </Field>
                </div>
                <Field label="Headline / Role">
                  <Input
                    value={data.hero.role}
                    onChange={(v: string) => update("hero.role", v)}
                    placeholder="Product Designer & Developer"
                  />
                </Field>
                <Field label="Short Tagline">
                  <Textarea
                    value={data.hero.tagline}
                    onChange={(v: string) => update("hero.tagline", v)}
                    rows={2}
                    placeholder="What you build and care about..."
                  />
                </Field>
                <Field label="Extended Bio (optional)">
                  <Textarea
                    value={data.hero.bio}
                    onChange={(v: string) => update("hero.bio", v)}
                    rows={2}
                    placeholder="Background or focus areas..."
                  />
                </Field>
                <Field label="Skills (comma separated)">
                  <Input
                    value={(data.hero.skills || []).join(", ")}
                    onChange={(v: string) =>
                      update(
                        "hero.skills",
                        v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="React, TypeScript, Figma"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Primary Button">
                    <Input
                      value={data.hero.btnText}
                      onChange={(v: string) => update("hero.btnText", v)}
                      placeholder="View Projects"
                    />
                  </Field>
                  <Field label="Button Link">
                    <Input
                      value={data.hero.btnUrl}
                      onChange={(v: string) => update("hero.btnUrl", v)}
                      placeholder="#projects"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Secondary Button">
                    <Input
                      value={data.hero.btn2Text}
                      onChange={(v: string) => update("hero.btn2Text", v)}
                      placeholder="Contact"
                    />
                  </Field>
                  <Field label="Secondary Link">
                    <Input
                      value={data.hero.btn2Url}
                      onChange={(v: string) => update("hero.btn2Url", v)}
                      placeholder="#contact"
                    />
                  </Field>
                </div>
                <Field label="Resume URL (optional)">
                  <Input
                    value={data.hero.resumeUrl}
                    onChange={(v: string) => update("hero.resumeUrl", v)}
                    placeholder="https://..."
                  />
                </Field>
              </Accordion>

              <Accordion title="Projects" icon={<Globe size={15} />}>
                <Field label="Section Title">
                  <Input
                    value={data.projectsHeading}
                    onChange={(v: string) => update("projectsHeading", v)}
                    placeholder="Selected Works"
                  />
                </Field>
                <Field label="Section Subtitle">
                  <Input
                    value={data.projectsSubtext}
                    onChange={(v: string) => update("projectsSubtext", v)}
                    placeholder="Recent work & builds"
                  />
                </Field>

                <div className="space-y-2.5 pt-1">
                  {data.projects.map((p: any, i: number) => (
                    <div
                      key={p.id || i}
                      className="p-3 bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#1D1D1F] truncate">
                          {p.title || `Project ${i + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              "projects",
                              data.projects.filter((_: any, j: number) => j !== i)
                            )
                          }
                          className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                          title="Remove project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <Input
                        value={p.title}
                        onChange={(v: string) => update(`projects.${i}.title`, v)}
                        placeholder="Project Title"
                        className="bg-white"
                      />
                      <Textarea
                        value={p.description}
                        onChange={(v: string) =>
                          update(`projects.${i}.description`, v)
                        }
                        rows={2}
                        placeholder="What does it do?"
                      />
                      <Input
                        value={(p.tech || []).join(", ")}
                        onChange={(v: string) =>
                          update(
                            `projects.${i}.tech`,
                            v
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder="Tech stack (React, Vite...)"
                        className="bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={p.liveUrl}
                          onChange={(v: string) =>
                            update(`projects.${i}.liveUrl`, v)
                          }
                          placeholder="Live URL"
                          className="bg-white"
                        />
                        <Input
                          value={p.githubUrl}
                          onChange={(v: string) =>
                            update(`projects.${i}.githubUrl`, v)
                          }
                          placeholder="GitHub URL"
                          className="bg-white"
                        />
                      </div>
                      <FileUpload
                        label="Cover Image (optional)"
                        value={p.image}
                        onUpload={(v: string) => update(`projects.${i}.image`, v)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update("projects", [
                        ...data.projects,
                        {
                          id: Date.now(),
                          title: "New Project",
                          emoji: "✨",
                          description: "Brief description of the project.",
                          tech: ["React", "TypeScript"],
                          liveUrl: "",
                          githubUrl: "",
                          image: "",
                          buttons: [],
                        },
                      ])
                    }
                    className="w-full py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Project</span>
                  </button>
                </div>
              </Accordion>

              <Accordion title="Capabilities & Stats" icon={<Sliders size={15} />}>
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">
                    Services / Capabilities
                  </span>
                  {data.services.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "services",
                            data.services.filter((_: any, idx: number) => idx !== i)
                          )
                        }
                        className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                      <Input
                        value={s.title}
                        onChange={(v: string) => update(`services.${i}.title`, v)}
                        placeholder="Capability Title"
                        className="bg-white pr-7"
                      />
                      <Textarea
                        value={s.description}
                        onChange={(v: string) =>
                          update(`services.${i}.description`, v)
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update("services", [
                        ...data.services,
                        { title: "New Capability", description: "Description..." },
                      ])
                    }
                    className="w-full py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Capability</span>
                  </button>
                </div>
              </Accordion>

              <Accordion
                title="Education & Credentials"
                icon={<GraduationCap size={15} />}
              >
                <div className="space-y-2.5">
                  {data.education.map((e: any, i: number) => (
                    <div
                      key={e.id || i}
                      className="p-3 bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "education",
                            data.education.filter(
                              (_: any, idx: number) => idx !== i
                            )
                          )
                        }
                        className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                      <Input
                        value={e.title}
                        onChange={(v: string) =>
                          update(`education.${i}.title`, v)
                        }
                        placeholder="Degree or Course"
                        className="bg-white pr-7"
                      />
                      <Input
                        value={e.institution}
                        onChange={(v: string) =>
                          update(`education.${i}.institution`, v)
                        }
                        placeholder="School / University"
                        className="bg-white"
                      />
                      <Input
                        value={e.year}
                        onChange={(v: string) =>
                          update(`education.${i}.year`, v)
                        }
                        placeholder="2021 - 2025"
                        className="bg-white"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update("education", [
                        ...data.education,
                        {
                          id: Date.now(),
                          title: "Degree",
                          institution: "University",
                          year: "2025",
                          description: "",
                        },
                      ])
                    }
                    className="w-full py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Education</span>
                  </button>
                </div>
              </Accordion>

              <Accordion title="Theme & Typography" icon={<Layout size={15} />}>
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6E6E73] block mb-2">
                      Color Palette
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {THEMES.map((t, i) => {
                        const active =
                          (data.theme || THEMES[0]).name === t.name;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setData((prev: any) => ({ ...prev, theme: t }))
                            }
                            className={`p-1.5 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              active
                                ? "border-[#0071E3] ring-2 ring-blue-500/20 bg-blue-50/40"
                                : "border-zinc-200/80 hover:border-zinc-300 bg-white"
                            }`}
                            title={t.name}
                          >
                            <div
                              className="w-full h-6 rounded-lg border border-black/10 flex items-center justify-center"
                              style={{ backgroundColor: t.bg }}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: t.accent }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-[#1D1D1F] truncate w-full text-center">
                              {t.name.split(" ")[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Font Family">
                    <select
                      className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3]"
                      value={data.font}
                      onChange={(e) => update("font", e.target.value)}
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Hero Alignment">
                    <div className="grid grid-cols-2 gap-1.5 bg-[#F5F5F7] p-1 rounded-xl border border-zinc-200/70">
                      {["left", "center"].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => update("layout.heroAlign", align)}
                          className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                            data.layout.heroAlign === align
                              ? "bg-white text-[#1D1D1F] shadow-xs"
                              : "text-[#6E6E73]"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label={`Card Corner Radius (${data.layout.cardRadius}px)`}>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      value={data.layout.cardRadius}
                      onChange={(e) =>
                        update("layout.cardRadius", parseInt(e.target.value))
                      }
                      className="w-full accent-[#0071E3] cursor-pointer"
                    />
                  </Field>
                </div>
              </Accordion>

              <Accordion title="Navigation & Social" icon={<Compass size={15} />}>
                <Field label="Brand / Navbar Title">
                  <Input
                    value={data.nav.title}
                    onChange={(v: string) => update("nav.title", v)}
                    placeholder="Portfolio"
                  />
                </Field>
                <div className="space-y-2 pt-1">
                  {Object.keys(data.social).map((k) => (
                    <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                      <Input
                        value={data.social[k]}
                        onChange={(v: string) => update(`social.${k}`, v)}
                        placeholder={
                          k === "email"
                            ? "you@example.com"
                            : `https://${k}.com/username`
                        }
                      />
                    </Field>
                  ))}
                </div>
              </Accordion>

              <Accordion
                title="Contact, Footer & Visibility"
                icon={<Trophy size={15} />}
              >
                <Field label="Contact Heading">
                  <Input
                    value={data.contact.heading}
                    onChange={(v: string) => update("contact.heading", v)}
                  />
                </Field>
                <Field label="Contact Email">
                  <Input
                    value={data.contact.email}
                    onChange={(v: string) => update("contact.email", v)}
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={data.contact.location}
                    onChange={(v: string) => update("contact.location", v)}
                  />
                </Field>
                <Field label="Footer Copyright">
                  <Input
                    value={data.footer.copyright}
                    onChange={(v: string) => update("footer.copyright", v)}
                  />
                </Field>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block mb-2">
                    Visible Sections
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["nav", "hero", "stats", "projects", "education", "contact", "footer"].map(
                      (k) => {
                        const enabled =
                          data.sections[k as keyof typeof data.sections];
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => update(`sections.${k}`, !enabled)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium capitalize transition-colors cursor-pointer ${
                              enabled
                                ? "bg-blue-50 border-blue-200 text-[#0071E3]"
                                : "bg-[#F5F5F7] border-zinc-200/70 text-[#6E6E73]"
                            }`}
                          >
                            {k}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </Accordion>
            </div>
          </aside>
        )}

        {/* Right Workspace Panel (Live Preview / Full Preview / Code / Publish) */}
        <div
          className={`flex-1 min-w-0 min-h-0 flex-col p-3 sm:p-4 overflow-hidden ${
            view === "builder" && mobileViewMode !== "preview"
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          <AnimatePresence mode="wait">
            {view === "builder" && (
              <motion.div
                key="builder-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white border border-zinc-200/80 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden"
              >
                {/* Preview Browser Chrome */}
                <div className="h-11 bg-[#FAFAFC] border-b border-zinc-200/70 px-3.5 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-[#1D1D1F] truncate">
                      Live Preview
                    </span>
                    <span className="text-[11px] text-[#6E6E73] hidden sm:inline">
                      • {data.theme?.name || "Apple White"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-zinc-200/70">
                    {[
                      { id: "desktop", label: "Desktop", icon: <Monitor size={13} /> },
                      { id: "tablet", label: "Tablet", icon: <Tablet size={13} /> },
                      { id: "mobile", label: "Mobile", icon: <Smartphone size={13} /> },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDevice(d.id as any)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          device === d.id
                            ? "bg-white text-[#1D1D1F] shadow-xs"
                            : "text-[#6E6E73] hover:text-[#1D1D1F]"
                        }`}
                        title={d.label}
                      >
                        {d.icon}
                        <span className="hidden lg:inline">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Iframe Viewport */}
                <div className="flex-1 bg-[#F5F5F7] p-2 sm:p-4 flex justify-center overflow-auto">
                  <div
                    className={`h-full transition-all duration-300 bg-white rounded-xl overflow-hidden border border-zinc-200/80 shadow-sm ${
                      device === "desktop"
                        ? "w-full"
                        : device === "tablet"
                        ? "w-[768px] max-w-full"
                        : "w-[375px] max-w-full"
                    }`}
                  >
                    <iframe
                      title="Portfolio Preview"
                      srcDoc={generatedHTML}
                      className="w-full h-full border-none bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {view === "full-preview" && (
              <motion.div
                key="full-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm"
              >
                <iframe
                  title="Full Portfolio Preview"
                  srcDoc={liveHTML}
                  className="w-full h-full border-none bg-white"
                />
              </motion.div>
            )}

            {view === "code" && (
              <motion.div
                key="code-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white border border-zinc-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Code size={16} className="text-[#0071E3]" />
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">
                      Exportable HTML Bundle
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHTML}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                  >
                    {copied ? <Check size={13} /> : <Code size={13} />}
                    <span>{copied ? "Copied" : "Copy HTML"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={liveHTML}
                  spellCheck={false}
                  className="flex-1 bg-[#F5F5F7] text-[#1D1D1F] font-mono text-xs p-3.5 rounded-xl border border-zinc-200/80 outline-none resize-none leading-relaxed"
                />
              </motion.div>
            )}

            {view === "publish" && (
              <motion.div
                key="publish-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-8 overflow-y-auto shadow-sm"
              >
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
                      Publish Your Portfolio
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73]">
                      Deploy directly to GitHub, Vercel, or download a single-file HTML bundle.
                    </p>
                  </div>

                  {/* Provider Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-[#F5F5F7] p-1.5 rounded-2xl border border-zinc-200/70">
                    {[
                      { id: "github", label: "GitHub Pages" },
                      { id: "vercel", label: "Vercel" },
                      { id: "netlify", label: "Netlify Drop" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedDeployTab(p.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedDeployTab === p.id
                            ? "bg-white text-[#1D1D1F] shadow-xs"
                            : "text-[#6E6E73] hover:text-[#1D1D1F]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Provider Forms */}
                  <div className="bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl p-5 space-y-4">
                    {selectedDeployTab === "github" && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
                          <Github size={16} />
                          <span>Push to GitHub Repository</span>
                        </div>
                        <Field label="GitHub Personal Access Token">
                          <Input
                            type="password"
                            value={githubToken}
                            onChange={setGithubToken}
                            placeholder="ghp_..."
                            className="bg-white"
                          />
                        </Field>
                        <Field label="Repository Name">
                          <Input
                            value={githubRepo}
                            onChange={setGithubRepo}
                            placeholder="my-web-portfolio"
                            className="bg-white"
                          />
                        </Field>
                        <Field label="Commit Message">
                          <Input
                            value={githubCommitMessage}
                            onChange={setGithubCommitMessage}
                            placeholder="Update personal portfolio"
                            className="bg-white"
                          />
                        </Field>
                        {githubStatus.type !== "idle" && (
                          <div
                            className={`p-3 rounded-xl text-xs border ${
                              githubStatus.type === "error"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : githubStatus.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                          >
                            <p>{githubStatus.message}</p>
                            {githubStatus.url && (
                              <a
                                href={githubStatus.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 underline font-semibold mt-1.5"
                              >
                                <span>Open Repository</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handlePublishGithub}
                          disabled={githubStatus.type === "loading"}
                          className="w-full py-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {githubStatus.type === "loading"
                            ? "Syncing..."
                            : "Publish to GitHub"}
                        </button>
                      </>
                    )}

                    {selectedDeployTab === "vercel" && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
                          <Globe size={16} />
                          <span>Deploy to Vercel</span>
                        </div>
                        <Field label="Vercel Access Token">
                          <Input
                            type="password"
                            value={vercelToken}
                            onChange={setVercelToken}
                            placeholder="Enter Vercel token"
                            className="bg-white"
                          />
                        </Field>
                        <Field label="Project Name">
                          <Input
                            value={vercelProject}
                            onChange={setVercelProject}
                            placeholder="my-web-portfolio"
                            className="bg-white"
                          />
                        </Field>
                        {vercelStatus.type !== "idle" && (
                          <div
                            className={`p-3 rounded-xl text-xs border ${
                              vercelStatus.type === "error"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : vercelStatus.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                          >
                            <p>{vercelStatus.message}</p>
                            {vercelStatus.url && (
                              <a
                                href={vercelStatus.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 underline font-semibold mt-1.5"
                              >
                                <span>Open Live Site</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleDeployVercel}
                          disabled={vercelStatus.type === "loading"}
                          className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {vercelStatus.type === "loading"
                            ? "Deploying..."
                            : "Deploy to Vercel"}
                        </button>
                      </>
                    )}

                    {selectedDeployTab === "netlify" && (
                      <div className="space-y-3 text-xs text-[#424245]">
                        <p className="font-semibold text-[#1D1D1F]">
                          Zero-config Netlify Drop hosting:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1.5">
                          <li>Click Export HTML below to download portfolio.html.</li>
                          <li>
                            Open{" "}
                            <a
                              href="https://app.netlify.com/drop"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0071E3] underline font-medium"
                            >
                              app.netlify.com/drop
                            </a>{" "}
                            in your browser.
                          </li>
                          <li>Drop the downloaded file to publish instantly.</li>
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Quick Export Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadHTML}
                      className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Download HTML</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyHTML}
                      className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Code size={14} />}
                      <span>{copied ? "Copied!" : "Copy HTML"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {activeProjectForModal && (
          <ProjectModal
            project={activeProjectForModal}
            isOpen={!!activeProjectForModal}
            onClose={() => setActiveProjectForModal(null)}
            accentColor={data.theme?.accent || "#0071e3"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
