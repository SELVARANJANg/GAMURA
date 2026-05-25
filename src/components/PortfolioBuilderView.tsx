import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Octokit } from "octokit";
import { motion, AnimatePresence } from "motion/react";
import { ProjectModal } from "./ProjectModal";
import { 
  Tv, Tablet, Smartphone, Trash2, Plus, Sliders, Layout, 
  User, Layers, Globe, Star, GraduationCap, Trophy, HelpCircle, 
  Heart, Download, Mail, Phone, MapPin, Eye, RefreshCw, LogOut, 
  ExternalLink, Github, Code, Check, ShieldAlert, AlertTriangle, Play, Compass, Paintbrush
} from "lucide-react";

// ─── THEMES ───────────────────────────────────────────────────────────────────
export const THEMES = [
  { name: "Cyber Blue",   accent: "#00d4ff", gold: "#ffcb47", bg: "#04040f", card: "#07071c", text: "#ddeeff" },
  { name: "Neon Green",   accent: "#00ff88", gold: "#ff8800", bg: "#020a05", card: "#041408", text: "#ddffee" },
  { name: "Solar Orange", accent: "#ff7700", gold: "#ffdd00", bg: "#080300", card: "#130600", text: "#fff0dd" },
  { name: "Hot Pink",     accent: "#ff2277", gold: "#ff9944", bg: "#050005", card: "#100010", text: "#ffdded" },
  { name: "Deep Violet",  accent: "#9d4eff", gold: "#66aaff", bg: "#030010", card: "#09011e", text: "#eeddff" },
  { name: "Pure Gold",    accent: "#ffd700", gold: "#ffffff", bg: "#060400", card: "#110d00", text: "#fffadd" },
  { name: "Mint",         accent: "#00ffcc", gold: "#ff6688", bg: "#030d0a", card: "#061510", text: "#ddfffb" },
  { name: "Ice White",    accent: "#88ccff", gold: "#f0c060", bg: "#050810", card: "#0a0f20", text: "#e8f4ff" },
];

const FONTS = ["Orbitron", "Rajdhani", "Exo 2", "Chakra Petch", "Space Grotesk", "Russo One", "Bebas Neue", "Syncopate"];

const resolveDirectImageUrl = (cleanUrl: any): string => {
  if (!cleanUrl || typeof cleanUrl !== "string") return cleanUrl || "";
  let clean = cleanUrl.trim();
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

const isValidImageUrl = (url: any): boolean => {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("data:image/")) {
    return false;
  }
  if (clean.startsWith("data:image/")) return true;
  if (clean.includes("drive.google.com") || clean.includes("googleusercontent.com") || clean.includes("unsplash.com") || clean.includes("picsum.photos")) {
    return true;
  }
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(clean);
};

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
export const DEFAULT_PORTFOLIO = {
  theme: THEMES[0],
  font: "Space Grotesk",
  bodyFont: "Inter",
  effects: { stars: true, grid: true, anim: true, scanlines: false },
  nav: {
    title: "",
    style: "glass",
    links: [] as any[],
    ctaText: "",
    ctaUrl: "",
  },
  hero: {
    show: true,
    name: "",
    role: "",
    college: "",
    tagline: "",
    bio: "",
    initials: "",
    photo: "",
    btnText: "",
    btnUrl: "",
    btnTarget: "_self",
    btnBgColor: "",
    btnTextColor: "",
    btnBorderColor: "",
    btn2Text: "",
    btn2Url: "",
    btn2Target: "_blank",
    btn2BgColor: "",
    btn2TextColor: "",
    btn2BorderColor: "",
    skills: [] as string[],
    resumeUrl: "",
    buttons: [] as any[],
  },
  social: { 
    github: "", 
    linkedin: "", 
    twitter: "", 
    email: "" 
  } as Record<string, string>,
  stats: [] as any[],
  footer: {
    ctaText: "",
    ctaUrl: "",
    copyright: "",
    showCta: false
  },
  sections: { nav: true, hero: true, education: false, achievements: false, projects: true, contact: true, stats: false, footer: true, credentials: false, grid: true },
  customSections: [] as any[],
  education: [] as any[],
  achievements: [] as any[],
  projects: [] as any[],
  contact: { heading: "", subtext: "", email: "", phone: "", location: "", website: "", footer: "" },
  layout: { heroAlign: "center", projCols: "auto", eduCols: "auto", cardRadius: 6 },
  certificates: [] as any[],
  services: [] as any[],
};

const SAMPLE_PORTFOLIO = {
  theme: THEMES[0],
  font: "Chakra Petch",
  bodyFont: "Rajdhani",
  effects: { stars: true, grid: true, anim: true, scanlines: false },
  nav: {
    title: "NEXUS.IO",
    style: "glass",
    links: [
      { label: "Home", url: "#home" },
      { label: "Capabilities", url: "#services" },
      { label: "Selected Works", url: "#projects" },
      { label: "Credentials", url: "#credentials" },
      { label: "Connect", url: "#contact" },
    ],
    ctaText: "Inquire Now",
    ctaUrl: "#contact",
  },
  hero: {
    show: true,
    name: "Alex Thorne",
    role: "Lead Systems Architect & Fullstack Engineer",
    college: "Vanguard Institute of Technology",
    tagline: "Building hyper-scalable web clients and real-time computation kernels with zero runtime compromises.",
    bio: "Systems architect and software engineer specializing in developer tooling, compiler development, and high-performance WebGL graphics vectors.",
    initials: "AT",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    btnText: "Explore Works",
    btnUrl: "#projects",
    btnTarget: "_self",
    btn2Text: "",
    btn2Url: "",
    btn2Target: "_blank",
    skills: ["React", "TypeScript", "Node.js", "Rust", "WebAssembly", "Tailwind CSS", "GraphQL", "Docker"],
    resumeUrl: "https://example.com/resume.pdf",
    buttons: [] as any[],
  },
  social: { 
    github: "https://github.com", 
    linkedin: "https://linkedin.com", 
    twitter: "https://twitter.com", 
    email: "gamuragalaxy@gmail.com" 
  } as Record<string, string>,
  stats: [
    { value: "48+", label: "REPOS COMPLETED" },
    { value: "1.2M", label: "PRODUCTION USERS" },
    { value: "240ms", label: "AVG RESPONSE TIME" }
  ] as any[],
  footer: {
    ctaText: "Initiate Communication",
    ctaUrl: "#contact",
    copyright: "© 2026 ALEX THORNE. INCORPORATED ALL POWER SYSTEM CHANNELS COHESIVE.",
    showCta: true
  },
  sections: { nav: true, hero: true, education: true, achievements: true, projects: true, contact: true, stats: true, footer: true, credentials: true, grid: true },
  customSections: [] as any[],
  education: [
    { id: 1, title: "M.S. in Software Systems", institution: "Vanguard Institute of Technology", year: "2022 - 2024", description: "Focused on high-performance distributed caching systems and reactive user interfaces." },
    { id: 2, title: "B.S. in Computer Science", institution: "Apex Tech University", year: "2018 - 2022", description: "Graduated with honors. Specialized in compiler construction and graphics pipeline optimizations." }
  ] as any[],
  achievements: [
    { id: 1, title: "Global Web Developer Summit Award", year: "2025", organization: "Web Standard Alliance", description: "Awarded top honor for outstanding compiler architecture in lightweight hybrid client systems. Optimized WebAssembly load states.", image: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=400&auto=format&fit=crop" },
    { id: 2, title: "Open Source Advocate of the Year", year: "2024", organization: "OSF", description: "Acknowledged for designing key client-side UI hydration algorithms under Node systems.", image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=400&auto=format&fit=crop" }
  ] as any[],
  projects: [
    { id: 1, title: "Aether Grid Renderer", emoji: "⚡", description: "A multi-threaded WebGL engine rendering complex volumetric light projections at a fluid 120 FPS in client browsers.", tech: ["React", "WebGL", "TypeScript"], liveUrl: "https://example.com/aether", githubUrl: "https://github.com", image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=400&auto=format&fit=crop" },
    { id: 2, title: "Nexus Cold Cache DB", emoji: "❄️", description: "Lightweight schema-free memory caching database engine with hot partition indexing and reactive websocket replication pipelines.", tech: ["Rust", "WASM", "WebSockets"], liveUrl: "https://example.com/nexus", githubUrl: "https://github.com", image: "https://images.unsplash.com/photo-1639322537504-64127da3959e?q=80&w=400&auto=format&fit=crop" },
    { id: 3, title: "Spectre UI Framework", emoji: "🌌", description: "Atomic CSS utility optimization and layout harness compiled via Esbuild, powering responsive high-contrast dashboards.", tech: ["Vite", "Tailwind", "ESNext"], liveUrl: "https://example.com/spectre", githubUrl: "https://github.com", image: "https://images.unsplash.com/photo-1614850523011-8f49ffc73908?q=80&w=400&auto=format&fit=crop" }
  ] as any[],
  contact: { heading: "Initiate Linkup", subtext: "Available for systems consultation, guest speaker requests, and enterprise-grade reactive integrations.", email: "gamuragalaxy@gmail.com", phone: "+1 (555) 342-9921", location: "Sector 4G7, Earth Orbit", website: "https://nexus.io", footer: "ALEX THORNE" },
  layout: { heroAlign: "center", projCols: "auto", eduCols: "auto", cardRadius: 6 },
  certificates: [
    { id: 1, title: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2025", image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=250&auto=format&fit=crop" },
    { id: 2, title: "Professional Rust Dev Certificate", issuer: "Rust Core Org", date: "2024", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=250&auto=format&fit=crop" }
  ] as any[],
  services: [
    { title: "Distributed Web Architectures", description: "Authoring bulletproof multi-layer client-server connections and high-throughput real-time websocket synchronization pipelines." },
    { title: "Reactive Interface Engineering", description: "Designing low-overhead Web UI experiences, optimized component rendering loops, and fine-tuned state machines." },
    { title: "Systems Optimization & Compilers", description: "Integrating client-side WASM binaries, custom micro-bundle toolings, and high-efficiency memory paradigms." }
  ] as any[],
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const FileUpload = ({ label, onUpload, value }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    setError(false);
  }, [value]);

  const handleFileProcess = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFile = (e: any) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const onDragOver = (e: any) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: any) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: any) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileProcess(file);
  };

  const isDataUrl = typeof value === 'string' && value.startsWith('data:');
  const isValidUrl = !value || isDataUrl || /^https?:\/\/.*/.test(value);

  return (
    <div 
      className={`space-y-1 p-1 rounded transition-all border ${isDragActive ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5' : 'border-transparent'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">{label}</label>
      <div className="flex gap-1.5 items-center">
        <button 
          onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }} 
          className={`w-12 h-12 flex-shrink-0 bg-white/5 border ${isDragActive ? 'border-[var(--theme-accent)]' : 'border-white/10'} rounded overflow-hidden flex flex-col items-center justify-center hover:bg-white/10 transition-all group relative active:scale-95`}
          title="Upload or drop image file"
        >
          {value && !error ? (
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover" 
              onError={() => setError(true)} 
            />
          ) : (
            <span className={`text-[10px] font-bold ${isDragActive ? 'text-[var(--theme-accent)] scale-110' : 'text-zinc-450 opacity-60'} group-hover:opacity-100 transition-all`}>
              {error ? "⚠️" : "+"}
            </span>
          )}
          {isDataUrl && <div className="absolute inset-0 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20" />}
        </button>
        
        <div className="flex-1 space-y-1">
          <div className="relative">
            <input 
              type="text" 
              value={isDataUrl ? "Embedded Media File Saved" : (value || "")} 
              readOnly={isDataUrl}
              onChange={e => onUpload(e.target.value)}
              placeholder="Paste URL or drag-drop file..."
              className={`w-full bg-black/40 border ${isValidUrl ? 'border-white/10' : 'border-red-500/30'} rounded px-1.5 py-0.5 text-[9px] ${isValidUrl ? 'text-zinc-300' : 'text-red-400'} focus:text-white outline-none focus:border-[var(--theme-accent)]/30 transition-all font-mono`}
            />
          </div>
          <div className="flex items-center justify-between text-[6.5px]">
            <span className="text-zinc-500 font-mono tracking-tighter">Drag & drop asset here</span>
            {value && (
              <button onClick={(e) => { e.preventDefault(); onUpload(""); }} className="text-red-400 hover:text-red-300 font-mono uppercase tracking-widest transition-colors">Clear</button>
            )}
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} accept="image/*" />
    </div>
  );
};

const UrlInput = ({ value, onChange, placeholder, icon }: any) => {
  const isValid = !value || /^https?:\/\/.*/.test(value);
  return (
    <div className="relative group">
      <div className="absolute left-1 top-0.5 flex items-center justify-center opacity-40 group-focus-within:opacity-100 transition-opacity">
        <span className="text-[8px]">{icon}</span>
      </div>
      <input 
        type="url" 
        value={value || ""} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className={`w-full bg-white/5 border ${isValid ? 'border-white/10' : 'border-red-500/30'} rounded pl-4.5 pr-1 py-0.5 text-[9px] outline-none focus:border-[var(--theme-accent)]/50 text-white font-mono transition-all`} 
      />
      {!isValid && value && <span className="absolute -bottom-2.5 right-0 text-[5.5px] text-red-500 font-bold uppercase tracking-tighter opacity-80">Protocol Error</span>}
    </div>
  );
};

const DeploymentCard = ({ title, desc, url, img }: any) => (
  <motion.a 
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -1, scale: 1.02, borderColor: 'rgba(var(--theme-accent-rgb), 0.3)', backgroundColor: 'rgba(255,255,255,0.06)' }}
    whileTap={{ scale: 0.98 }}
    className="flex flex-col items-center p-1.5 bg-zinc-900/40 border border-white/5 rounded transition-all w-full"
    id={`deploy-to-${title.toLowerCase()}`}
  >
    <div className="w-6 h-6 mb-1 flex items-center justify-center p-1 rounded bg-black/60 border border-white/5 transition-all duration-300">
      <img src={img} alt={title} className="w-full h-full object-contain transition-all" referrerPolicy="no-referrer" />
    </div>
    <div className="text-center">
      <h3 className="text-white font-bold tracking-tight text-[8px] uppercase">{title}</h3>
      <p className="text-[5.5px] text-zinc-500 font-mono tracking-widest leading-tight uppercase">{desc}</p>
    </div>
  </motion.a>
);

const hexRgb = (hex: string) => {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  } catch { return "0,0,0"; }
};

export function generatePortfolioHTML(data: any, isBuilder: boolean = false) {
  const { 
    theme = THEMES[0], 
    font = "Orbitron", 
    bodyFont = "Rajdhani", 
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
    effects = DEFAULT_PORTFOLIO.effects, 
    services = [],
    footer = DEFAULT_PORTFOLIO.footer
  } = data || {};

  const acc = theme.accent || "#00d4ff", gld = theme.gold || "#ffcb47", bg = theme.bg || "#04040f", card = theme.card || "#07071c", txt = theme.text || "#ddeeff";
  const ar = hexRgb(acc), bgr = hexRgb(bg);
  const cr = (layout.cardRadius || 6) + "px";

  const safeFont = String(font || "Orbitron").replace(/ /g, "+");
  const safeBodyFont = String(bodyFont || "Rajdhani").replace(/ /g, "+");

  const socKeys = Object.keys(social || {}).filter(k => social && social[k]);
  const socIcons: any = {
    github: "🐙", linkedin: "💼", twitter: "🐦", instagram: "📸", email: "📧", youtube: "📺"
  };

  const hasPhoto = !!hero.photo;
  const showHeroImg = hasPhoto || isBuilder;
  const placeholderImg = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
  const heroImg = hasPhoto ? hero.photo : placeholderImg;
  const projectPlaceholder = "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=400&auto=format&fit=crop";
  const certPlaceholder = "https://images.unsplash.com/photo-1639322537504-64127da3959e?q=80&w=400&auto=format&fit=crop";
  const errorPlaceholder = "https://images.unsplash.com/photo-1614850523011-8f49ffc73908?q=80&w=200&auto=format&fit=crop";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${hero.name || 'Portfolio'} · Web Node</title>
<link href="https://fonts.googleapis.com/css2?family=${safeFont}:wght@300;400;500;600;700;800;900&family=${safeBodyFont}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--a:${acc};--g:${gld};--bg:${bg};--card:${card};--txt:${txt};--cr:${cr}}
@keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseGrid{0%{opacity:0.25}50%{opacity:0.45}100%{opacity:0.25}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
body{background:var(--bg);color:var(--txt);font-family:'${bodyFont || 'sans-serif'}',sans-serif;margin:0;padding:0;display:flex;flex-direction:column;align-items:center;min-height:100vh;overflow-x:hidden;scroll-behavior:smooth}
.grid-bg{position:fixed;top:0;left:0;width:100%;height:100%;background-image:linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);background-size:40px 40px;z-index:-1;animation:pulseGrid 12s infinite}
.scanline{position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(to bottom,transparent,rgba(${ar},0.04),transparent);z-index:999;pointer-events:none;animation:scanline 6s linear infinite}
.nav{position:fixed;top:0;width:100%;height:54px;background:rgba(${bgr},0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;padding:0 30px;z-index:100;box-sizing:border-box}
.nav-brand{font-family:'${font}',sans-serif;font-weight:900;color:var(--a);text-transform:uppercase;font-size:0.85rem;letter-spacing:1.5px}
.nav-links a{color:rgba(255,255,255,0.65);text-decoration:none;font-size:0.68rem;margin-left:24px;text-transform:uppercase;font-weight:700;letter-spacing:1px;transition:color 0.2s}
.nav-links a:hover{color:var(--a)}
.nav-toggle{display:none;background:none;border:none;color:var(--a);font-size:1.4rem;cursor:pointer;line-height:1}
.mobile-nav{position:fixed;top:54px;left:0;width:100%;background:rgba(${bgr},0.95);backdrop-filter:blur(15px);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;gap:5px;z-index:99;box-sizing:border-box;max-height:0;opacity:0;overflow:hidden;transition:all 0.3s ease;padding:0 30px}
.mobile-nav a{color:rgba(255,255,255,0.65);text-decoration:none;font-size:0.75rem;text-transform:uppercase;font-weight:700;letter-spacing:1.2px;transition:color 0.2s;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.mobile-nav a:hover{color:var(--a)}
.section{max-width:960px;width:100%;padding:80px 30px 40px;box-sizing:border-box;animation:fadeIn 0.8s ease both}
.hero{padding-top:130px;min-height:65vh;display:flex;flex-direction:${layout.heroAlign === 'left' ? 'row' : 'column'};align-items:center;justify-content:${layout.heroAlign === 'left' ? 'space-between' : 'center'};gap:40px;position:relative}
.hero::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: min(80vw, 450px);
  height: min(80vw, 450px);
  background: radial-gradient(circle, rgba(${ar}, 0.12) 0%, transparent 70%);
  z-index: -1;
  pointer-events: none;
  filter: blur(35px);
  border-radius: 50%;
}
.hero-content{flex:1.2;display:flex;flex-direction:column;align-items:${layout.heroAlign === 'left' ? 'flex-start' : 'center'};text-align:${layout.heroAlign}}
.hero-media-wrapper{flex:0.8;display:flex;justify-content:center;align-items:center}
.hero-img{width:210px;height:210px;border-radius:50%;border:4px solid var(--a);padding:6px;object-fit:cover;box-shadow:0 0 45px rgba(${ar},0.25);margin:0;transition:all 0.3s ease}
h1{font-family:'${font}',sans-serif;font-size:clamp(2.4rem, 5.5vw, 4.4rem);margin:0;text-transform:uppercase;line-height:0.95;background:linear-gradient(to bottom, #fff, var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.role{font-size:0.95rem;color:rgba(255,255,255,0.45);margin-top:15px;letter-spacing:4px;text-transform:uppercase;font-weight:800}
.tagline{font-size:1.1rem;max-width:580px;margin:20px ${layout.heroAlign === 'center' ? 'auto' : '0'};font-weight:300;line-height:1.5;color:rgba(255,255,255,0.75)}
.card{background:var(--card);border:1px solid rgba(${ar},0.08);padding:30px;border-radius:var(--cr);margin-bottom:15px;transition:all 0.3s ease;box-sizing:border-box;position:relative;overflow:hidden}
.card:hover{border-color:var(--a);transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,0.4)}
h2{font-family:'${font}',sans-serif;font-size:1.6rem;text-transform:uppercase;margin-bottom:35px;letter-spacing:1.5px;display:flex;align-items:center;gap:12px}
h2::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.08)}
.pill{display:inline-block;padding:4px 12px;border:1px solid rgba(${ar},0.25);color:var(--a);border-radius:var(--cr);margin:3px;font-size:0.6rem;text-transform:uppercase;font-weight:800;letter-spacing:0.8px;background:rgba(${ar},0.03)}
.grid{display:grid;grid-template-columns:${layout.projCols === 'auto' ? 'repeat(auto-fit,minmax(260px,1fr))' : `repeat(${layout.projCols},1fr)`};gap:20px}
.cert-card{display:flex;align-items:center;gap:15px;padding:18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:var(--cr);transition:border-color 0.2s;width:100%;box-sizing:border-box}
.cert-card:hover{border-color:rgba(${ar},0.3)}
.cert-img{width:46px;height:46px;border-radius:6px;object-fit:cover;background:var(--card)}
.social-bar{display:flex;gap:10px;margin-top:30px;justify-content:${layout.heroAlign === 'center' ? 'center' : 'flex-start'}}
.social-link{width:34px;height:34px;background:rgba(255,255,255,0.04);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:1rem;transition:all 0.2s;border:1px solid rgba(255,255,255,0.02)}
.social-link:hover{background:var(--a);color:#000;transform:scale(1.08)}
.footer{width:100%;padding:60px 30px;box-sizing:border-box;text-align:center;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.2);margin-top:auto}
.modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(15px);z-index:2000;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.modal-content{background:var(--card);max-width:700px;width:100%;max-height:85vh;overflow-y:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.08);padding:30px;position:relative;animation:fadeIn 0.25s ease}
.modal-close{position:absolute;top:15px;right:15px;background:none;border:none;color:#fff;font-size:1.8rem;cursor:pointer;opacity:0.4;transition:opacity 0.2s;line-height:1}
.modal-close:hover{opacity:1}
@media (max-width: 768px) {
  .nav{padding:0 15px}
  .nav-links{display:none}
  .nav-toggle{display:block}
  h1{font-size:2.6rem;line-height:1.0}
  .section{padding:70px 15px 30px}
  .hero{flex-direction:column !important;text-align:center !important;padding-top:100px;gap:20px}
  .hero-content{align-items:center !important;text-align:center !important}
  .hero-img{width:165px;height:165px;margin-bottom:10px !important}
  .tagline{margin:15px auto !important}
  .social-bar{justify-content:center !important}
  .grid{grid-template-columns:1fr !important}
  .modal-content{padding:20px;margin:10px}
}
</style>
</head>
<body>
<script>
function imgErr(e) {
  e.onerror = null;
  e.src = '${errorPlaceholder}';
  e.style.opacity = '0.4';
  e.style.filter = 'grayscale(1)';
}
function toggleMobileNav() {
  const m = document.getElementById('mobileNav');
  if (!m) return;
  if (m.style.maxHeight === '0px' || !m.style.maxHeight || m.style.opacity === '0') {
    m.style.maxHeight = '300px';
    m.style.opacity = '1';
    m.style.padding = '15px 30px';
  } else {
    m.style.maxHeight = '0px';
    m.style.opacity = '0';
    m.style.padding = '0px 30px';
  }
}
function closeMobileNav() {
  const m = document.getElementById('mobileNav');
  if (m) {
    m.style.maxHeight = '0px';
    m.style.opacity = '0';
    m.style.padding = '0px 30px';
  }
}
</script>
${effects?.scanlines ? `<div class="scanline"></div>` : ""}
${sections.grid ? `<div class="grid-bg"></div>` : ""}
 
${sections?.nav ? `
<nav class="nav">
  <div class="nav-brand">${nav.title || 'PORTFOLIO'}</div>
  <div class="nav-links">
    ${(nav.links || []).map((l:any)=>`<a href="${l.url || '#'}">${l.label || 'Link'}</a>`).join("")}
  </div>
  <button class="nav-toggle" onclick="toggleMobileNav()">☰</button>
</nav>
<div id="mobileNav" class="mobile-nav">
  ${(nav.links || []).map((l:any)=>`<a href="${l.url || '#'}" onclick="closeMobileNav()">${l.label || 'Link'}</a>`).join("")}
</div>
` : ""}
 
${sections?.hero ? `
<div class="section hero" id="home">
  ${layout.heroAlign === 'left' ? `
    <div class="hero-content">
      <h1 style="${hero.nameColor ? `background:none;-webkit-text-fill-color:${hero.nameColor};color:${hero.nameColor};` : ""}">${hero.name || 'Anonymous'}</h1>
      <div class="role" style="${hero.roleColor ? `color:${hero.roleColor};` : ""}">${hero.role || 'Digital Nomad'}</div>
      <p class="tagline" style="${hero.taglineColor ? `color:${hero.taglineColor};` : ""}">${hero.tagline || ''}</p>
      ${hero.bio ? `<p style="font-size:0.95rem;opacity:0.75;line-height:1.6;margin-top:10px;color:${hero.bioColor || 'inherit'}">${hero.bio}</p>` : ""}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:15px;justify-content:flex-start">
        ${(hero.skills || []).map((s:any)=>`<span class="pill" style="margin:0">${s}</span>`).join("")}
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-start;flex-wrap:wrap;margin-top:20px;align-items:center">
        ${hero.btnText ? `<a href="${hero.btnUrl || '#'}" target="${hero.btnTarget || '_self'}" style="display:inline-block;padding:10px 24px;background:${hero.btnBgColor || 'var(--a)'};color:${hero.btnTextColor || '#000000'};border:1.5px solid ${hero.btnBorderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${hero.btnText}</a>` : ""}
        ${hero.btn2Text ? `<a href="${hero.btn2Url || '#'}" target="${hero.btn2Target || '_blank'}" style="display:inline-block;padding:10px 24px;background:${hero.btn2BgColor || 'rgba(255,255,255,0.06)'};color:${hero.btn2TextColor || '#ffffff'};border:1px solid ${hero.btn2BorderColor || 'rgba(255,255,255,0.1)'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${hero.btn2Text}</a>` : ""}
        ${hero.resumeUrl ? `<a href="${hero.resumeUrl}" target="_blank" style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.06);color:#fff;border:1px solid rgba(255,255,255,0.1);text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s">Get Resume 📥</a>` : ""}
        ${projects && projects.length > 0 ? `<button onclick="openProject(0)" style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.06);color:#fff;border:1px solid rgba(255,255,255,0.1);font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;cursor:pointer;transition:background 0.2s">Showcase 🔥</button>` : ""}
        ${(hero.buttons || []).map((b:any)=>`
          <a href="${b.url || '#'}" target="${b.target || '_blank'}" style="display:inline-block;padding:10px 24px;background:${b.bgColor || 'var(--a)'};color:${b.textColor || '#000000'};border:1px solid ${b.borderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${b.label || 'Action'}</a>
        `).join("")}
      </div>
      <div class="social-bar">
        ${socKeys.map(k => `<a href="${k === 'email' ? 'mailto:' + (social[k] || '') : (social[k] || '#')}" class="social-link" title="${k}">${socIcons[k] || '🔗'}</a>`).join("")}
      </div>
    </div>
    ${showHeroImg ? `
    <div class="hero-media-wrapper">
      <img src="${heroImg}" class="hero-img" alt="${hero.name || 'Hero'}" onerror="imgErr(this)">
    </div>
    ` : ""}
  ` : `
    <div class="hero-content">
      ${showHeroImg ? `
      <img src="${heroImg}" class="hero-img" alt="${hero.name || 'Hero'}" onerror="imgErr(this)" style="margin: 0 auto 30px">
      ` : ""}
      <h1 style="${hero.nameColor ? `background:none;-webkit-text-fill-color:${hero.nameColor};color:${hero.nameColor};` : ""}">${hero.name || 'Anonymous'}</h1>
      <div class="role" style="${hero.roleColor ? `color:${hero.roleColor};` : ""}">${hero.role || 'Digital Nomad'}</div>
      <p class="tagline" style="${hero.taglineColor ? `color:${hero.taglineColor};` : ""}">${hero.tagline || ''}</p>
      ${hero.bio ? `<p style="font-size:0.95rem;opacity:0.75;line-height:1.6;margin-top:10px;color:${hero.bioColor || 'inherit'};max-width:580px;margin-left:auto;margin-right:auto">${hero.bio}</p>` : ""}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:15px;justify-content:center">
        ${(hero.skills || []).map((s:any)=>`<span class="pill" style="margin:0">${s}</span>`).join("")}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px;align-items:center">
        ${hero.btnText ? `<a href="${hero.btnUrl || '#'}" target="${hero.btnTarget || '_self'}" style="display:inline-block;padding:10px 24px;background:${hero.btnBgColor || 'var(--a)'};color:${hero.btnTextColor || '#000000'};border:1.5px solid ${hero.btnBorderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${hero.btnText}</a>` : ""}
        ${hero.btn2Text ? `<a href="${hero.btn2Url || '#'}" target="${hero.btn2Target || '_blank'}" style="display:inline-block;padding:10px 24px;background:${hero.btn2BgColor || 'rgba(255,255,255,0.06)'};color:${hero.btn2TextColor || '#ffffff'};border:1.5px solid ${hero.btn2BorderColor || 'rgba(255,255,255,0.1)'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${hero.btn2Text}</a>` : ""}
        ${hero.resumeUrl ? `<a href="${hero.resumeUrl}" target="_blank" style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.06);color:#fff;border:1px solid rgba(255,255,255,0.1);text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s">Get Resume 📥</a>` : ""}
        ${projects && projects.length > 0 ? `<button onclick="openProject(0)" style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.06);color:#fff;border:1px solid rgba(255,255,255,0.1);font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;cursor:pointer;transition:background 0.2s">Showcase 🔥</button>` : ""}
        ${(hero.buttons || []).map((b:any)=>`
          <a href="${b.url || '#'}" target="${b.target || '_blank'}" style="display:inline-block;padding:10px 24px;background:${b.bgColor || 'var(--a)'};color:${b.textColor || '#000000'};border:1px solid ${b.borderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:var(--cr);text-transform:uppercase;font-size:0.65rem;letter-spacing:1.5px;transition:opacity 0.2s;text-align:center">${b.label || 'Action'}</a>
        `).join("")}
      </div>
      <div class="social-bar">
        ${socKeys.map(k => `<a href="${k === 'email' ? 'mailto:' + (social[k] || '') : (social[k] || '#')}" class="social-link" title="${k}">${socIcons[k] || '🔗'}</a>`).join("")}
      </div>
    </div>
  `}
</div>` : ""}
 
${sections?.stats && stats && stats.length > 0 ? `
<div class="section" style="padding-top:0">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:25px;text-align:center">
    ${stats.map((s:any)=>`<div><div style="font-family:'${font}',sans-serif;font-size:2rem;font-weight:900;color:var(--a)">${s.value || '0'}</div><div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:2px;opacity:0.4;margin-top:4px">${s.label || ''}</div></div>`).join("")}
  </div>
</div>` : ""}
 
${services && services.length > 0 ? `
<div class="section" id="services">
  <h2>Capabilities</h2>
  <div class="grid">
    ${services.map((s:any)=>`
      <div class="card" style="border-left: 3px solid var(--a)">
        <h3 style="font-family:'${font}',sans-serif;margin:0;font-size:0.95rem;color:var(--a);text-transform:uppercase;letter-spacing:0.5px">${s.title || ''}</h3>
        <p style="opacity:0.55;font-size:0.8rem;line-height:1.6;margin-top:10px;margin-bottom:0">${s.description || ''}</p>
      </div>`).join("")}
  </div>
</div>` : ""}
 
${sections?.projects && projects && projects.length > 0 ? `
<div class="section" id="projects">
  <h2 style="color: ${data.projectsHeadingColor || 'inherit'}">${data.projectsHeading || 'Selected Works'}</h2>
  ${data.projectsSubtext ? `<p style="opacity:0.55;font-size:0.8rem;line-height:1.6;margin-top:-15px;margin-bottom:25px;max-width:600px;color: ${data.projectsSubtextColor || 'inherit'}">${data.projectsSubtext}</p>` : ""}
  <div class="grid">
    ${projects.map((p:any, idx:number)=>`
      <div class="card" onclick="openProject(${idx})" style="cursor:pointer;background-color:${p.bgColor || 'rgba(255,255,255,0.025)'};border-color:${p.borderColor || 'rgba(255,255,255,0.06)'};border-width:1px;border-style:solid">
        ${p.image ? `<img src="${p.image}" style="width:100%;height:150px;object-fit:cover;border-radius:6px;margin-bottom:15px" onerror="imgErr(this)" />` : ""}
        <h3 style="font-family:'${font}',sans-serif;margin:0;font-size:1.05rem;text-transform:uppercase;letter-spacing:0.5px;color:${p.titleColor || 'inherit'}">${p.title || 'Project'}</h3>
        <p style="opacity:0.55;font-size:0.8rem;line-height:1.6;margin:10px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:${p.descColor || 'inherit'}">${p.description || ''}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${(p.tech || []).slice(0, 3).map((t:any)=>`<span class="pill" style="margin:0;padding:2px 8px;font-size:0.55rem">${t}</span>`).join("")}
          ${p.tech && p.tech.length > 3 ? `<span class="pill" style="margin:0;padding:2px 8px;font-size:0.55rem;opacity:0.6">+${p.tech.length-3}</span>` : ""}
        </div>
        ${p.buttons && p.buttons.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px" onclick="event.stopPropagation()">
          ${p.buttons.map((b:any)=>`
            <a href="${b.url || '#'}" target="${b.target || '_blank'}" style="flex:1;text-align:center;padding:6px 12px;background:${b.bgColor || 'var(--a)'};color:${b.textColor || '#000000'};border:1px solid ${b.borderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:4px;text-transform:uppercase;font-size:0.55rem;letter-spacing:1px;transition:opacity 0.2s">${b.label || 'Link'}</a>
          `).join("")}
        </div>
        ` : ""}
      </div>`).join("")}
  </div>
</div>` : ""}
 
${sections?.education && education && education.length > 0 ? `
<div class="section" id="education">
  <h2>Training Log</h2>
  <div class="grid">
    ${education.map((e:any)=>`
      <div class="card">
        <h3 style="font-family:'${font}',sans-serif;margin:0;font-size:0.95rem;color:var(--a)">${e.title || ''}</h3>
        <div style="font-size:0.65rem;opacity:0.4;text-transform:uppercase;margin-top:3px">${e.institution || ''} | ${e.year || ''}</div>
        <p style="opacity:0.55;font-size:0.8rem;margin-top:10px;margin-bottom:0;line-height:1.5">${e.description || ''}</p>
      </div>`).join("")}
  </div>
</div>` : ""}
 
${sections?.credentials && certificates && certificates.length > 0 ? `
<div class="section" id="credentials">
  <h2>Credentials</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px">
    ${certificates.map((c:any) => `
      <div class="cert-card">
        <img src="${c.image || certPlaceholder}" class="cert-img" alt="${c.title || ''}" onerror="imgErr(this)">
        <div>
          <div style="font-weight:700;font-size:0.88rem;letter-spacing:0.3px">${c.title || ''}</div>
          <div style="font-size:0.65rem;opacity:0.4;text-transform:uppercase;margin-top:2px">${c.issuer || ''} · ${c.date || ''}</div>
        </div>
      </div>`).join("")}
  </div>
</div>` : ""}
 
${customSections.map((s:any)=>`
<div class="section" id="${s.id || 'custom'}">
  <h2>${s.title || ''}</h2>
  ${s.subtitle ? `<p style="opacity:0.45;text-transform:uppercase;letter-spacing:1px;font-size:0.65rem;margin:-25px 0 25px">${s.subtitle}</p>` : ''}
  <div class="grid">
    ${(s.items || []).map((i:any)=>`
      <div class="card">
        <h4 style="margin:0;font-size:0.9rem;color:var(--g);text-transform:uppercase;letter-spacing:0.5px">${i.title || ''}</h4>
        <p style="opacity:0.55;font-size:0.8rem;line-height:1.6;margin-top:10px;margin-bottom:0">${i.description || ''}</p>
      </div>`).join("")}
  </div>
</div>`).join("")}
 
${sections?.contact ? `
<div class="section" id="contact">
  <h2>${contact.heading || 'Connect'}</h2>
  <div style="max-width:550px">
    <p style="font-size:1.05rem;opacity:0.6;margin-bottom:25px;line-height:1.6">${contact.subtext || ''}</p>
    <div style="display:flex;flex-direction:column;gap:12px;font-size:0.85rem">
      ${contact.email ? `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="opacity:0.3;font-size:0.65rem;letter-spacing:1px">EMAIL</span><a href="mailto:${contact.email}" style="color:var(--a);text-decoration:none;font-weight:700;word-break:break-all">${contact.email}</a></div>` : ""}
      ${contact.phone ? `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="opacity:0.3;font-size:0.65rem;letter-spacing:1px">PHONE</span><span style="font-weight:500;word-break:break-all">${contact.phone}</span></div>` : ""}
      ${contact.location ? `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="opacity:0.3;font-size:0.65rem;letter-spacing:1px">PLANET</span><span style="font-weight:500;word-break:break-all">${contact.location}</span></div>` : ""}
    </div>
  </div>
</div>` : ""}
 
${sections?.footer ? `
<div class="footer">
  ${footer?.showCta ? `
    <div style="margin-bottom:30px">
      <a href="${footer.ctaUrl || '#'}" style="padding:14px 40px;background:var(--a);color:#000;text-decoration:none;font-weight:900;border-radius:6px;text-transform:uppercase;font-size:0.75rem;letter-spacing:2px;display:inline-block;box-shadow:0 0 20px rgba(${ar},0.25)">${footer.ctaText || 'Connect'}</a>
    </div>
  ` : ""}
  <div style="font-size:0.65rem;letter-spacing:1px;opacity:0.4">${footer?.copyright || 'GAMURA'}</div>
</div>` : ""}
 
<div id="projectModal" class="modal" onclick="closeProject(event)">
  <div class="modal-content" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="closeProject()">✕</button>
    <div id="modalBody"></div>
  </div>
</div>
 
<script>
const projectData = ${JSON.stringify(projects || [])};
function openProject(idx) {
  const p = projectData[idx] || projectData[0];
  const modal = document.getElementById('projectModal');
  const body = document.getElementById('modalBody');
  if(!p || !modal || !body) return;
  body.innerHTML = \`
    <img src="\\\${p.image || '${projectPlaceholder}'}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:20px;box-shadow:0 10px 25px rgba(0,0,0,0.4)" onerror="imgErr(this)" />
    <h1 style="font-size:1.6rem;margin-bottom:8px;background:none;color:\\\${p.titleColor || '#ffffff'};-webkit-text-fill-color:\\\${p.titleColor || '#ffffff'};text-fill-color:\\\${p.titleColor || '#ffffff'};letter-spacing:0.5px">\\\${p.title || 'Project'}</h1>
    <div style="display:flex;gap:8px;margin-bottom:15px;flex-wrap:wrap">\\\${(p.tech || []).map(t => \\\`<span class="pill" style="background:rgba(255,255,255,0.06)">\\\${t}</span>\\\`).join('')}</div>
    <p style="font-size:0.85rem;line-height:1.6;opacity:0.85;color:\\\${p.descColor || '#d4d4d8'};margin-bottom:25px">\\\${p.description || ''}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      \\\${p.liveUrl ? \\\`<a href="\\\${p.liveUrl}" target="_blank" style="padding:10px 24px;background:var(--a);color:\#000;text-decoration:none;font-weight:900;border-radius:4px;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;transition:opacity 0.2s">Live Demo 🔗</a>\\\` : ''}
      \\\${p.githubUrl ? \\\`<a href="\\\${p.githubUrl}" target="_blank" style="padding:10px 24px;background:rgba(255,255,255,0.06);color:\#fff;text-decoration:none;font-weight:900;border-radius:4px;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;border:1px solid rgba(255,255,255,0.08);transition:opacity 0.2s">Code 📁</a>\\\` : ''}
      \\\${(p.buttons || []).map(b => \\\`<a href="\\\${b.url || '#'}" target="\\\${b.target || '_blank'}" style="padding:10px 24px;background:\\\${b.bgColor || 'var(--a)'};color:\\\${b.textColor || '#000000'};border:1px solid \\\${b.borderColor || 'transparent'};text-decoration:none;font-weight:900;border-radius:4px;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;transition:opacity 0.2s">\\\${b.label || 'Link'}</a>\\\`).join('')}
    </div>
  \`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeProject(e) {
  document.getElementById('projectModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}
</script>
 
</body>
</html>`;
}

// ─── BUILDER COMPONENTS ──────────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder = "", type = "text", style = {} }: any) => (
  <input 
    type={type} 
    value={value || ""} 
    onChange={e => onChange(e.target.value)} 
    placeholder={placeholder} 
    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[9px] outline-none focus:border-[var(--theme-accent)]/50 text-white font-sans transition-all" 
    style={style} 
  />
);

const Textarea = ({ value, onChange, placeholder = "", rows = 2 }: any) => (
  <textarea 
    value={value || ""} 
    onChange={e => onChange(e.target.value)} 
    placeholder={placeholder}
    rows={rows}
    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[9px] outline-none focus:border-[var(--theme-accent)]/50 text-white font-sans transition-all resize-none leading-tight" 
  />
);

const Btn = ({ onClick, children, variant = "ghost", style = {}, className = "" }: any) => {
  const variants: any = {
    ghost: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(var(--theme-accent-rgb), 0.15)", color: "rgba(216,238,255,0.7)" },
    cyan: { background: "var(--theme-accent)", border: "1px solid rgba(var(--theme-accent-rgb), 0.8)", color: "#000", fontWeight: 800 },
    gold: { background: "var(--theme-gold)", border: "1px solid rgba(var(--theme-accent-rgb), 0.3)", color: "#000", fontWeight: 800 },
    violet: { background: "#9d4eff", border: "1px solid #7c2eeb", color: "#fff", fontWeight: 800 },
    dark: { background: "rgba(0,0,10,0.8)", border: "1px solid rgba(var(--theme-accent-rgb), 0.25)", color: "var(--theme-accent)" },
    red: { background: "rgba(255,50,80,0.1)", border: "1px solid rgba(255,50,80,0.25)", color: "#ff4d6a" }
  };
  return (
    <button 
      onClick={onClick} 
      className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-1 shrink-0 ${className}`} 
      style={{ ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
};

const Accordion = ({ title, icon, defaultOpen = false, children }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition-all text-left group"
      >
        <span className="text-zinc-400 group-hover:text-[var(--theme-accent)] transition-colors shrink-0">{icon}</span>
        <span className="flex-1 text-[8px] font-black uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">{title}</span>
        <span className={`text-[5px] transition-transform duration-200 ${open ? 'rotate-90 text-[var(--theme-accent)]' : 'text-zinc-600'} shrink-0`}>▶</span>
      </button>
      {open && (
        <div className="px-2.5 pb-2 pt-0.5 bg-black/15 space-y-2.5 animation-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: any) => (
  <div className="space-y-0.5">
    <label className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider block">{label}</label>
    {children}
  </div>
);

const Sidebar = ({ 
  data, update, setView, setData, onQuit, setActiveProjectForModal,
  githubToken, setGithubToken, githubRepo, setGithubRepo, handlePublishGithub, githubStatus,
  vercelToken, setVercelToken, vercelProject, setVercelProject, handleDeployVercel, vercelStatus,
  confirmWipe, setConfirmWipe, confirmLoad, setConfirmLoad, soundEffect
}: any) => (
  <div className="w-full md:w-[260px] bg-[#050514] border-r border-white/5 overflow-y-auto flex-shrink-0 select-none flex flex-col h-full z-10" style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.1)' }}>
    <div className="p-2 bg-black/50 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
       <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-[var(--theme-accent)]" />
          <span className="text-[8px] font-black tracking-widest text-[var(--theme-accent)] uppercase">PORTFOLIO</span>
       </div>
       <div className="flex gap-1 items-center">
          {!confirmWipe && !confirmLoad && (
            <>
              <button 
                id="wipe-blank-btn"
                onClick={() => {
                  setConfirmWipe(true);
                  if (typeof soundEffect === "function") soundEffect();
                }} 
                className="text-[6.5px] text-zinc-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors px-1 py-0.5 shrink-0 font-mono cursor-pointer"
                title="Start Completely Blank"
              >
                🧹 Wipe Blank
              </button>
              <button 
                id="load-sample-btn"
                onClick={() => {
                  setConfirmLoad(true);
                  if (typeof soundEffect === "function") soundEffect();
                }} 
                className="text-[6.5px] text-zinc-500 hover:text-indigo-400 font-bold uppercase tracking-widest transition-colors px-1 py-0.5 shrink-0 font-mono cursor-pointer"
                title="Load Sample Template"
              >
                ⚡ Load Sample
              </button>
            </>
          )}

          {confirmWipe && (
            <div className="flex items-center gap-1 bg-red-950/50 border border-red-500/20 px-1 py-0.5 rounded animate-pulse shrink-0">
              <span className="text-[6px] text-red-500 font-black uppercase tracking-wider font-mono">WIPE ALL?</span>
              <button 
                onClick={() => {
                  setData(JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO)));
                  setConfirmWipe(false);
                  if (typeof soundEffect === "function") soundEffect();
                }}
                className="text-[6px] bg-red-600 hover:bg-red-500 text-white font-black px-1.5 py-0.5 rounded uppercase cursor-pointer"
              >
                YES
              </button>
              <button 
                onClick={() => {
                  setConfirmWipe(false);
                  if (typeof soundEffect === "function") soundEffect();
                }}
                className="text-[6px] text-zinc-400 hover:text-white px-1 py-0.5 font-bold uppercase cursor-pointer"
              >
                NO
              </button>
            </div>
          )}

          {confirmLoad && (
            <div className="flex items-center gap-1 bg-indigo-950/50 border border-indigo-500/20 px-1 py-0.5 rounded animate-pulse shrink-0">
              <span className="text-[6px] text-indigo-400 font-black uppercase tracking-wider font-mono">LOAD?</span>
              <button 
                onClick={() => {
                  setData(JSON.parse(JSON.stringify(SAMPLE_PORTFOLIO)));
                  setConfirmLoad(false);
                  if (typeof soundEffect === "function") soundEffect();
                }}
                className="text-[6px] bg-indigo-600 hover:bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded uppercase cursor-pointer"
              >
                YES
              </button>
              <button 
                onClick={() => {
                  setConfirmLoad(false);
                  if (typeof soundEffect === "function") soundEffect();
                }}
                className="text-[6px] text-zinc-400 hover:text-white px-1 py-0.5 font-bold uppercase cursor-pointer"
              >
                NO
              </button>
            </div>
          )}

          <Btn onClick={() => setView("hub")} variant="ghost" style={{ padding: "1px 4px", fontSize: "6.5px" }}>Exit Engine</Btn>
       </div>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar pb-16">
      <Accordion title="Structure & Layout" icon={<Layout className="w-3 h-3 text-[var(--theme-accent)]" />}>
        <div className="space-y-2">
          <p className="text-[6.5px] text-zinc-500 uppercase font-bold tracking-wider">Module Visibility</p>
          <div className="grid grid-cols-2 gap-0.5">
            {Object.keys(data.sections).map(k => (
              <button 
                key={k} 
                onClick={()=>update(`sections.${k}`, !data.sections[k as keyof typeof data.sections])} 
                className={`px-1 py-0.5 rounded border text-[7px] font-bold tracking-wider transition-all ${data.sections[k as keyof typeof data.sections] ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)]' : 'bg-white/3 border-white/5 text-zinc-600'}`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="text-[6.5px] text-zinc-500 uppercase font-bold tracking-wider mt-2.5">Atmospheric Effects</p>
          <div className="grid grid-cols-2 gap-0.5">
            {Object.keys(data.effects).map(k => (
              <button 
                key={k} 
                onClick={()=>update(`effects.${k}`, !data.effects[k as keyof typeof data.effects])} 
                className={`px-1 py-0.5 rounded border text-[7px] font-bold tracking-wider transition-all ${data.effects[k as keyof typeof data.effects] ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/3 border-white/5 text-zinc-600'}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </Accordion>

      <Accordion title="Identity Bios" icon={<User className="w-3 h-3 text-emerald-400" />} defaultOpen>
         <div className="space-y-2">
            <FileUpload label="Avatar Resource" value={data.hero.photo} onUpload={(v:any)=>update("hero.photo", v)} />
            <Field label="Avatar Image URL">
              <Input 
                value={data.hero.photo || ""} 
                onChange={(v:any)=>update("hero.photo", v)} 
                placeholder="https://... or paste direct photo link" 
              />
            </Field>
            {data.hero.photo && (
              <p className="text-[6.5px] font-mono text-zinc-400 mt-1">
                {isValidImageUrl(data.hero.photo) ? (
                  <span className="text-emerald-400">✓ Image format verified and active</span>
                ) : (
                  <span className="text-zinc-500">✓ Link format verified & updated</span>
                )}
              </p>
            )}

            <div className="grid grid-cols-2 gap-1 my-1">
              <button 
                type="button"
                onClick={() => update("hero", { ...DEFAULT_PORTFOLIO.hero, show: data.hero.show })}
                className="text-[6.5px] py-1 bg-white/5 border border-white/5 hover:border-red-500/20 text-red-400 hover:bg-red-500/5 transition-colors font-mono tracking-wider uppercase rounded cursor-pointer"
              >
                Clear Hero Data 🧹
              </button>
              <button 
                type="button"
                onClick={() => update("hero.show", !data.hero.show)}
                className={`text-[6.5px] py-1 border transition-all font-mono tracking-wider uppercase rounded cursor-pointer ${data.hero.show ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}
              >
                {data.hero.show ? '👁️ Hero Visible' : '🙈 Hero Hidden'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Field label="Hero Name">
                <Input value={data.hero.name} onChange={(v:any)=>update("hero.name", v)} placeholder="Anonymous" />
              </Field>
              <Field label="Profession / Role">
                <Input value={data.hero.role} onChange={(v:any)=>update("hero.role", v)} placeholder="Digital Nomad" />
              </Field>
            </div>

            {/* Colors Customization Panel */}
            <div className="bg-black/20 p-1.5 rounded border border-white/5 space-y-1 mt-1 text-left">
              <span className="text-[6.5px] font-bold uppercase tracking-widest text-[var(--theme-accent)] block mb-1">Text Color Customizers</span>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-[5.5px] text-zinc-400 block mb-0.5">Name Color</span>
                  <div className="flex gap-1 items-center">
                    <Input value={data.hero.nameColor || ""} onChange={(v:any)=>update("hero.nameColor", v)} placeholder="Default" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                    <input type="color" value={data.hero.nameColor?.startsWith('#') ? data.hero.nameColor : "#ffffff"} onChange={(e)=>update("hero.nameColor", e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </div>
                <div>
                  <span className="text-[5.5px] text-zinc-400 block mb-0.5">Role Color</span>
                  <div className="flex gap-1 items-center">
                    <Input value={data.hero.roleColor || ""} onChange={(v:any)=>update("hero.roleColor", v)} placeholder="Default" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                    <input type="color" value={data.hero.roleColor?.startsWith('#') ? data.hero.roleColor : "#ffffff"} onChange={(e)=>update("hero.roleColor", e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </div>
                <div>
                  <span className="text-[5.5px] text-zinc-400 block mb-0.5">Bio/Tag Color</span>
                  <div className="flex gap-1 items-center">
                    <Input value={data.hero.taglineColor || ""} onChange={(v:any)=>update("hero.taglineColor", v)} placeholder="Default" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                    <input type="color" value={data.hero.taglineColor?.startsWith('#') ? data.hero.taglineColor : "#ffffff"} onChange={(e)=>update("hero.taglineColor", e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Field label="Primary Sector"><Input value={data.contact.location} onChange={(v:any)=>update("contact.location", v)} /></Field>
              <Field label="Initials"><Input value={data.hero.initials} onChange={(v:any)=>update("hero.initials", v)} placeholder="YN" /></Field>
            </div>
            <Field label="Resume Asset URL"><Input value={data.hero.resumeUrl} onChange={(v:any)=>update("hero.resumeUrl", v)} placeholder="https://..." /></Field>
            <Field label="Core Tagline"><Textarea value={data.hero.tagline} onChange={(v:any)=>update("hero.tagline", v)} rows={2} /></Field>
            
            {/* Detailed Biography Paragraph */}
            <Field label="Detailed Bio / Description">
              <Textarea value={data.hero.bio || ""} onChange={(v:any)=>update("hero.bio", v)} rows={2} placeholder="Slightly longer text description displayed directly underneath the core tagline..." />
            </Field>
            {data.hero.bio && (
              <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded border border-white/5">
                <div className="col-span-2">
                  <span className="text-[5.5px] text-zinc-400 block mb-0.2">Bio Text Color Selection</span>
                  <div className="flex gap-1 items-center">
                    <Input value={data.hero.bioColor || ""} onChange={(v:any)=>update("hero.bioColor", v)} placeholder="Default" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                    <input type="color" value={data.hero.bioColor?.startsWith('#') ? data.hero.bioColor : "#ffffff"} onChange={(e)=>update("hero.bioColor", e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </div>
              </div>
            )}

            <Field label="Keywords Array (split with comma)"><Input value={(data.hero.skills || []).join(", ")} onChange={(v:any)=>update("hero.skills", v.split(",").map((s:string)=>s.trim()).filter(Boolean))} placeholder="Vite, React, Rust" /></Field>

            {/* Primary Action Button Options */}
            <div className="bg-black/20 p-1.5 rounded border border-white/5 space-y-1.5 mt-1 text-left">
              <span className="text-[6.5px] font-bold uppercase tracking-widest text-[var(--theme-accent)] block border-b border-white/5 pb-0.5">Primary Direct Button</span>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Button Word Label">
                  <Input value={data.hero.btnText || ""} onChange={(v:any)=>update("hero.btnText", v)} placeholder="e.g. Explore Works" />
                </Field>
                <Field label="Button Destination Link">
                  <Input value={data.hero.btnUrl || ""} onChange={(v:any)=>update("hero.btnUrl", v)} placeholder="e.g. #projects" />
                </Field>
              </div>
              {data.hero.btnText && (
                <>
                  <div className="pt-0.5">
                    <span className="text-[5.8px] text-zinc-400 block mb-0.5">Click Target Behavior</span>
                    <select
                      value={data.hero.btnTarget || "_self"}
                      onChange={(e) => update("hero.btnTarget", e.target.value)}
                      className="w-full bg-[#161633] border border-white/10 rounded px-1 py-0.5 text-[6.5px] text-white outline-none focus:border-sky-500 font-mono transition-all"
                    >
                      <option value="_self" className="bg-zinc-950">Same Page / Tab</option>
                      <option value="_blank" className="bg-zinc-950">New Window / Tab</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5 text-[5.8px]">
                    <div>
                      <span className="text-zinc-400 block">Btn Bg</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btnBgColor || ""} onChange={(v:any)=>update("hero.btnBgColor", v)} placeholder="Accent" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btnBgColor?.startsWith('#') ? data.hero.btnBgColor : "#00d4ff"} onChange={(e)=>update("hero.btnBgColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Btn Text</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btnTextColor || ""} onChange={(v:any)=>update("hero.btnTextColor", v)} placeholder="#000" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btnTextColor?.startsWith('#') ? data.hero.btnTextColor : "#000000"} onChange={(e)=>update("hero.btnTextColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Btn Border</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btnBorderColor || ""} onChange={(v:any)=>update("hero.btnBorderColor", v)} placeholder="None" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btnBorderColor?.startsWith('#') ? data.hero.btnBorderColor : "#00d4ff"} onChange={(e)=>update("hero.btnBorderColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Secondary Direct Button Options */}
            <div className="bg-black/20 p-1.5 rounded border border-white/5 space-y-1.5 mt-1 text-left">
              <span className="text-[6.5px] font-bold uppercase tracking-widest text-[#fff]/50 block border-b border-white/5 pb-0.5">Secondary Direct Button</span>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Button Word Label">
                  <Input value={data.hero.btn2Text || ""} onChange={(v:any)=>update("hero.btn2Text", v)} placeholder="e.g. Visit GitHub" />
                </Field>
                <Field label="Button Destination Link">
                  <Input value={data.hero.btn2Url || ""} onChange={(v:any)=>update("hero.btn2Url", v)} placeholder="e.g. https://github.com/..." />
                </Field>
              </div>
              {data.hero.btn2Text && (
                <>
                  <div className="pt-0.5">
                    <span className="text-[5.8px] text-zinc-400 block mb-0.5">Click Target Behavior</span>
                    <select
                      value={data.hero.btn2Target || "_blank"}
                      onChange={(e) => update("hero.btn2Target", e.target.value)}
                      className="w-full bg-[#161633] border border-white/10 rounded px-1 py-0.5 text-[6.5px] text-white outline-none focus:border-sky-500 font-mono transition-all"
                    >
                      <option value="_self" className="bg-zinc-950">Same Page / Tab</option>
                      <option value="_blank" className="bg-zinc-950">New Window / Tab</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5 text-[5.8px]">
                    <div>
                      <span className="text-zinc-400 block">Btn bg</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btn2BgColor || ""} onChange={(v:any)=>update("hero.btn2BgColor", v)} placeholder="Transparent" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btn2BgColor?.startsWith('#') ? data.hero.btn2BgColor : "#0d0d26"} onChange={(e)=>update("hero.btn2BgColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Btn Click</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btn2TextColor || ""} onChange={(v:any)=>update("hero.btn2TextColor", v)} placeholder="#fff" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btn2TextColor?.startsWith('#') ? data.hero.btn2TextColor : "#ffffff"} onChange={(e)=>update("hero.btn2TextColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Btn Line</span>
                      <div className="flex gap-0.5 items-center">
                        <Input value={data.hero.btn2BorderColor || ""} onChange={(v:any)=>update("hero.btn2BorderColor", v)} placeholder="Border" style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} />
                        <input type="color" value={data.hero.btn2BorderColor?.startsWith('#') ? data.hero.btn2BorderColor : "#3f3f46"} onChange={(e)=>update("hero.btn2BorderColor", e.target.value)} className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Custom Multi-Button Builder Section */}
            <div className="bg-black/40 p-1.5 rounded border border-white/5 space-y-1.5 mt-1 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[6.5px] font-bold uppercase text-zinc-300 block tracking-widest">Custom Action Links</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentBtns = data.hero.buttons || [];
                    update("hero.buttons", [
                      ...currentBtns,
                      {
                        id: Date.now().toString(),
                        label: "Custom Button",
                        url: "#contact",
                        target: "_self",
                        bgColor: "",
                        textColor: "",
                        borderColor: ""
                      }
                    ]);
                  }}
                  className="text-[6px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/40 px-1 py-0.5 rounded border border-indigo-800/30 transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  + Add Custom Button
                </button>
              </div>

              {(!data.hero.buttons || data.hero.buttons.length === 0) ? (
                <p className="text-[6px] text-zinc-500 font-mono italic">No custom buttons added. Configure extra links to display here.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                  {data.hero.buttons.map((btn: any, btnIndex: number) => (
                    <div key={btn.id || btnIndex} className="p-1 bg-white/5 border border-white/5 rounded space-y-1 relative group/btn">
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = data.hero.buttons.filter((_: any, idx: number) => idx !== btnIndex);
                          update("hero.buttons", remaining);
                        }}
                        className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 font-mono text-[7px]"
                        title="Remove button"
                      >
                        ✕
                      </button>
                      
                      <div className="grid grid-cols-2 gap-1 text-[7px]">
                        <div>
                          <span className="text-[5.8px] text-zinc-400 block mb-0.5">Button Text Label</span>
                          <Input 
                            value={btn.label} 
                            onChange={(val: string) => update(`hero.buttons.${btnIndex}.label`, val)} 
                            placeholder="Connect Now" 
                            style={{ height: '16px', fontSize: '6px', padding: '0 3px' }} 
                          />
                        </div>
                        <div>
                          <span className="text-[5.8px] text-zinc-400 block mb-0.5">Destination URL / Anchor</span>
                          <Input 
                            value={btn.url} 
                            onChange={(val: string) => update(`hero.buttons.${btnIndex}.url`, val)} 
                            placeholder="https://... or #contact" 
                            style={{ height: '16px', fontSize: '6px', padding: '0 3px' }} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-0.5 text-[5.8px]">
                        <div>
                          <span className="text-zinc-400 block">Bg Color</span>
                          <div className="flex gap-0.5 items-center">
                            <Input 
                              value={btn.bgColor || ""} 
                              onChange={(val: string) => update(`hero.buttons.${btnIndex}.bgColor`, val)} 
                              placeholder="Accent" 
                              style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                            />
                            <input 
                              type="color" 
                              value={btn.bgColor?.startsWith('#') ? btn.bgColor : "#38bdf8"} 
                              onChange={(e) => update(`hero.buttons.${btnIndex}.bgColor`, e.target.value)} 
                              className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Text Color</span>
                          <div className="flex gap-0.5 items-center">
                            <Input 
                              value={btn.textColor || ""} 
                              onChange={(val: string) => update(`hero.buttons.${btnIndex}.textColor`, val)} 
                              placeholder="#000" 
                              style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                            />
                            <input 
                              type="color" 
                              value={btn.textColor?.startsWith('#') ? btn.textColor : "#000000"} 
                              onChange={(e) => update(`hero.buttons.${btnIndex}.textColor`, e.target.value)} 
                              className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Border Color</span>
                          <div className="flex gap-0.5 items-center">
                            <Input 
                              value={btn.borderColor || ""} 
                              onChange={(val: string) => update(`hero.buttons.${btnIndex}.borderColor`, val)} 
                              placeholder="None" 
                              style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                            />
                            <input 
                              type="color" 
                              value={btn.borderColor?.startsWith('#') ? btn.borderColor : "#38bdf8"} 
                              onChange={(e) => update(`hero.buttons.${btnIndex}.borderColor`, e.target.value)} 
                              className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <span className="text-[5.8px] text-zinc-400 block mb-0.5">Action open target style</span>
                        <select
                          value={btn.target || "_self"}
                          onChange={(e) => update(`hero.buttons.${btnIndex}.target`, e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded px-1 py-0.5 text-[6px] text-white outline-none focus:border-sky-500 font-mono transition-all"
                        >
                          <option value="_self">Same Page / Anchored Link (_self)</option>
                          <option value="_blank">Open in New Browser Tab (_blank)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         </div>
      </Accordion>

      <Accordion title="Capabilities" icon={<Sliders className="w-3 h-3 text-orange-400" />}>
         <div className="space-y-1.5">
            {data.services.map((s:any, i:number) => (
              <div key={i} className="p-1.5 bg-white/3 border border-white/5 rounded space-y-1 relative group">
                <Input value={s.title} onChange={(v:any)=>update(`services.${i}.title`, v)} placeholder="Capability Title" />
                <Textarea value={s.description} onChange={(v:any)=>update(`services.${i}.description`, v)} rows={2} />
                <button 
                  onClick={()=>update("services", data.services.filter((_:any, idx:any)=>idx!==i))} 
                  className="absolute top-1 right-1 text-[7px] text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                  title="Remove Service"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            <Btn onClick={()=>update("services", [...data.services, {title: "New Capability", description: "Details..."}])} variant="ghost" style={{width:'100%', py:'1px'}}><Plus className="w-3 h-3" /> New Item</Btn>
         </div>
      </Accordion>

      <Accordion title="Education Hub" icon={<GraduationCap className="w-3 h-3 text-amber-400" />}>
         <div className="space-y-1.5">
              {data.education.map((e:any, i:number) => (
                <div key={e.id} className="p-1.5 bg-white/3 rounded border border-white/5 space-y-1 relative group">
                  <Input value={e.title} onChange={(v:any)=>update(`education.${i}.title`, v)} placeholder="Track/Major" />
                  <Input value={e.institution} onChange={(v:any)=>update(`education.${i}.institution`, v)} placeholder="Institution" />
                  <Input value={e.year} onChange={(v:any)=>update(`education.${i}.year`, v)} placeholder="Period e.g. 2021 - 2025" />
                  <button onClick={()=>update("education", data.education.filter((_:any, idx:number)=>idx!==i))} className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 p-0.5" title="Remove Education">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <Btn onClick={()=>update("education", [...data.education, {id: Date.now(), title: "Degree", institution: "University", year: "2024", description: ""}])} variant="ghost" style={{width:'100%'}}><Plus className="w-3 h-3" /> Add Institution</Btn>
         </div>
      </Accordion>

      <Accordion title="Milestones" icon={<Trophy className="w-3 h-3 text-pink-400" />}>
         <div className="space-y-2">
            <div>
              <span className="text-[6.5px] font-bold uppercase text-zinc-500 block mb-0.5">Achievements Log</span>
              {data.achievements.map((a:any, i:number) => (
                <div key={a.id} className="p-1.5 bg-white/3 rounded border border-white/5 mb-1 space-y-1 relative group">
                  <Input value={a.title} onChange={(v:any)=>update(`achievements.${i}.title`, v)} placeholder="Award Title" />
                  <FileUpload label="Attachment Visual Resource" value={a.image} onUpload={(v:any)=>update(`achievements.${i}.image`, v)} />
                  <Input value={a.image || ""} onChange={(v:any)=>update(`achievements.${i}.image`, v)} placeholder="Or paste milestone image URL..." />
                  <button onClick={()=>update("achievements", data.achievements.filter((_:any, idx:number)=>idx!==i))} className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 p-0.5" title="Remove Achievement">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <Btn onClick={()=>update("achievements", [...data.achievements, {id: Date.now(), title: "Achievement Record", year: "2024", organization: "", description: "", image: ""}])} variant="ghost" style={{width:'100%'}}><Plus className="w-3 h-3" /> Log Record</Btn>
            </div>

            <div className="pt-1.5 border-t border-white/5">
              <span className="text-[6.5px] font-bold uppercase text-zinc-500 block mb-0.5">Affiliated Credentials</span>
              {data.certificates.map((c:any, i:number) => (
                <div key={c.id} className="p-1.5 bg-white/3 rounded border border-white/5 mb-1 space-y-1 relative group bg-black/10">
                  <Input value={c.title} onChange={(v:any)=>update(`certificates.${i}.title`, v)} placeholder="Credential Title" />
                  <Input value={c.issuer} onChange={(v:any)=>update(`certificates.${i}.issuer`, v)} placeholder="Issuer Authority" />
                  <FileUpload label="Icon badge" value={c.image} onUpload={(v:any)=>update(`certificates.${i}.image`, v)} />
                  <Input value={c.image || ""} onChange={(v:any)=>update(`certificates.${i}.image`, v)} placeholder="Or paste badge image URL..." />
                  <button onClick={()=>update("certificates", data.certificates.filter((_:any, idx:number)=>idx!==i))} className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 p-0.5" title="Remove Certificate">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <Btn onClick={()=>update("certificates", [...data.certificates, {id: Date.now(), title: "Technical Cert", issuer: "Oracle", year: "2024", image: ""}])} variant="ghost" style={{width:'100%'}}><Plus className="w-3 h-3" /> Cert Item</Btn>
            </div>
         </div>
      </Accordion>

      <Accordion title="Project Blocks" icon={<Globe className="w-3 h-3 text-[var(--theme-accent)]" />}>
         <div className="space-y-2">
            {/* Section Level Word & Color customization */}
            <div className="p-2 bg-white/5 border border-white/5 rounded space-y-2">
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Section Labels & Themes</span>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="Section Header Words">
                  <Input value={data.projectsHeading ?? "Selected Works"} onChange={(v:any)=>update("projectsHeading", v)} placeholder="e.g. My Creations" />
                </Field>
                <Field label="Header Color">
                  <div className="flex gap-1 items-center">
                     <Input value={data.projectsHeadingColor ?? ""} onChange={(v:any)=>update("projectsHeadingColor", v)} placeholder="e.g. #00ffff" style={{ height: '22px', fontSize: '7.5px' }} />
                     <input type="color" value={(data.projectsHeadingColor && data.projectsHeadingColor.startsWith('#')) ? data.projectsHeadingColor : "#ffffff"} onChange={(e)=>update("projectsHeadingColor", e.target.value)} className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="Section Subtitle Words">
                  <Input value={data.projectsSubtext ?? ""} onChange={(v:any)=>update("projectsSubtext", v)} placeholder="My featured applications & builds" />
                </Field>
                <Field label="Subtitle Color">
                  <div className="flex gap-1 items-center">
                     <Input value={data.projectsSubtextColor ?? ""} onChange={(v:any)=>update("projectsSubtextColor", v)} placeholder="e.g. #888888" style={{ height: '22px', fontSize: '7.5px' }} />
                     <input type="color" value={(data.projectsSubtextColor && data.projectsSubtextColor.startsWith('#')) ? data.projectsSubtextColor : "#888888"} onChange={(e)=>update("projectsSubtextColor", e.target.value)} className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  </div>
                </Field>
              </div>
            </div>
           {data.projects.map((p:any, i:number) => (
             <div key={i} className="p-1.5 bg-white/3 border border-white/5 rounded space-y-1.5 relative group">
                <FileUpload label="Visual Card Banner" value={p.image} onUpload={(v:any)=>update(`projects.${i}.image`, v)} />
                <Input value={p.image || ""} onChange={(v:any)=>update(`projects.${i}.image`, v)} placeholder="Paste project card banner image URL..." />
                {p.image && (
                  <div className="w-full h-24 rounded overflow-hidden relative bg-black flex items-center justify-center border border-white/10 my-1">
                    <img src={p.image} className="w-full h-full object-cover opacity-90 transition-opacity" alt="Card banner" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => update(`projects.${i}.image`, "")}
                      className="absolute top-1 right-1 bg-red-950/90 hover:bg-red-900 border border-white/10 text-white font-mono text-[6.5px] uppercase tracking-wider px-1 py-0.5 rounded shadow cursor-pointer transition-colors"
                    >
                      Remove Banner ✕
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1">
                   <div className="col-span-1">
                     <Input value={p.emoji || "💎"} onChange={(v:any)=>update(`projects.${i}.emoji`, v)} placeholder="Icon" style={{ textAlign: 'center' }} />
                   </div>
                   <div className="col-span-3">
                     <Input value={p.title} onChange={(v:any)=>update(`projects.${i}.title`, v)} placeholder="Title" />
                   </div>
                </div>
                <Textarea value={p.description} onChange={(v:any)=>update(`projects.${i}.description`, v)} rows={2} placeholder="Node Details..." />
                
                <Field label="Platform Languages (split with comma)">
                  <Input value={(p.tech || []).join(", ")} onChange={(v:any)=>update(`projects.${i}.tech`, v.split(",").map((s:string)=>s.trim()).filter(Boolean))} placeholder="React, Node.js, WebGL" />
                </Field>
                <div className="grid grid-cols-2 gap-1">
                  <Field label="Deployment Link"><UrlInput value={p.liveUrl} onChange={(v:any)=>update(`projects.${i}.liveUrl`, v)} placeholder="https://..." icon={<ExternalLink className="w-2 h-2 text-zinc-400" />} /></Field>
                  <Field label="Repository Gateway"><UrlInput value={p.githubUrl} onChange={(v:any)=>update(`projects.${i}.githubUrl`, v)} placeholder="https://..." icon={<Github className="w-2 h-2 text-zinc-400" />} /></Field>
                </div>

                {/* Custom styling & coloring controls for each individual project node */}
                <div className="bg-black/25 p-1.5 rounded border border-white/5 space-y-1 mt-1 text-left">
                  <span className="text-[6.5px] font-bold uppercase text-zinc-400 block tracking-widest mb-0.5">Custom Card Colors</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[7px]">
                    <div>
                      <span className="text-[6.1px] text-zinc-400 block mb-0.5">Title Text Color</span>
                      <div className="flex gap-1 items-center">
                        <Input value={p.titleColor || ""} onChange={(v:any)=>update(`projects.${i}.titleColor`, v)} placeholder="e.g. #00ffff" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                        <input type="color" value={p.titleColor?.startsWith('#') ? p.titleColor : "#ffffff"} onChange={(e)=>update(`projects.${i}.titleColor`, e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[6.1px] text-zinc-400 block mb-0.5">Desc Text Color</span>
                      <div className="flex gap-1 items-center">
                        <Input value={p.descColor || ""} onChange={(v:any)=>update(`projects.${i}.descColor`, v)} placeholder="e.g. #ddeeff" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                        <input type="color" value={p.descColor?.startsWith('#') ? p.descColor : "#888888"} onChange={(e)=>update(`projects.${i}.descColor`, e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[6.1px] text-zinc-400 block mb-0.5">Card Background</span>
                      <div className="flex gap-1 items-center">
                        <Input value={p.bgColor || ""} onChange={(v:any)=>update(`projects.${i}.bgColor`, v)} placeholder="e.g. #04041a" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                        <input type="color" value={p.bgColor?.startsWith('#') ? p.bgColor : "#000000"} onChange={(e)=>update(`projects.${i}.bgColor`, e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[6.1px] text-zinc-400 block mb-0.5">Card Border Color</span>
                      <div className="flex gap-1 items-center">
                        <Input value={p.borderColor || ""} onChange={(v:any)=>update(`projects.${i}.borderColor`, v)} placeholder="e.g. #38bdf8" style={{ height: '18px', padding: '0 4px', fontSize: '6.5px' }} />
                        <input type="color" value={p.borderColor?.startsWith('#') ? p.borderColor : "#333333"} onChange={(e)=>update(`projects.${i}.borderColor`, e.target.value)} className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Interactive Buttons Builder for each project item */}
                <div className="bg-black/40 p-1.5 rounded border border-white/5 space-y-1.5 mt-1 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-[6.5px] font-bold uppercase text-zinc-300 block tracking-widest">Custom Buttons & Directives</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentBtns = p.buttons || [];
                        update(`projects.${i}.buttons`, [
                          ...currentBtns,
                          {
                            id: Date.now().toString(),
                            label: "Action Button",
                            url: "https://",
                            target: "_blank",
                            bgColor: "#38bdf8",
                            textColor: "#000000",
                            borderColor: "#38bdf8"
                          }
                        ]);
                      }}
                      className="text-[6px] text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 px-1 py-0.5 rounded border border-sky-800/30 transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                    >
                      + Create Button
                    </button>
                  </div>

                  {(!p.buttons || p.buttons.length === 0) ? (
                    <p className="text-[6px] text-zinc-500 font-mono italic">No custom buttons configured. Use links above or add customized ones here.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                      {p.buttons.map((btn: any, btnIndex: number) => (
                        <div key={btn.id || btnIndex} className="p-1 bg-white/5 border border-white/5 rounded space-y-1 relative group/btn">
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = p.buttons.filter((_: any, idx: number) => idx !== btnIndex);
                              update(`projects.${i}.buttons`, remaining);
                            }}
                            className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 font-mono text-[7px]"
                            title="Remove button"
                          >
                            ✕
                          </button>
                          
                          <div className="grid grid-cols-2 gap-1 text-[7px]">
                            <div>
                              <span className="text-[5.8px] text-zinc-400 block mb-0.5">Button Text/Words</span>
                              <Input 
                                value={btn.label} 
                                onChange={(val: string) => update(`projects.${i}.buttons.${btnIndex}.label`, val)} 
                                placeholder="Button Label" 
                                style={{ height: '16px', fontSize: '6px', padding: '0 3px' }} 
                              />
                            </div>
                            <div>
                              <span className="text-[5.8px] text-zinc-400 block mb-0.5">Target Destination (URL / #Anchor)</span>
                              <Input 
                                value={btn.url} 
                                onChange={(val: string) => update(`projects.${i}.buttons.${btnIndex}.url`, val)} 
                                placeholder="https://... or #contact" 
                                style={{ height: '16px', fontSize: '6px', padding: '0 3px' }} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-0.5 text-[5.8px]">
                            <div>
                              <span className="text-zinc-400 block">Bg Color</span>
                              <div className="flex gap-0.5 items-center">
                                <Input 
                                  value={btn.bgColor || ""} 
                                  onChange={(val: string) => update(`projects.${i}.buttons.${btnIndex}.bgColor`, val)} 
                                  placeholder="#333" 
                                  style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                                />
                                <input 
                                  type="color" 
                                  value={btn.bgColor?.startsWith('#') ? btn.bgColor : "#38bdf8"} 
                                  onChange={(e) => update(`projects.${i}.buttons.${btnIndex}.bgColor`, e.target.value)} 
                                  className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                                />
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Text Color</span>
                              <div className="flex gap-0.5 items-center">
                                <Input 
                                  value={btn.textColor || ""} 
                                  onChange={(val: string) => update(`projects.${i}.buttons.${btnIndex}.textColor`, val)} 
                                  placeholder="#fff" 
                                  style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                                />
                                <input 
                                  type="color" 
                                  value={btn.textColor?.startsWith('#') ? btn.textColor : "#000000"} 
                                  onChange={(e) => update(`projects.${i}.buttons.${btnIndex}.textColor`, e.target.value)} 
                                  className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                                />
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Border Color</span>
                              <div className="flex gap-0.5 items-center">
                                <Input 
                                  value={btn.borderColor || ""} 
                                  onChange={(val: string) => update(`projects.${i}.buttons.${btnIndex}.borderColor`, val)} 
                                  placeholder="#555" 
                                  style={{ height: '14px', fontSize: '5.5px', padding: '0 2px' }} 
                                />
                                <input 
                                  type="color" 
                                  value={btn.borderColor?.startsWith('#') ? btn.borderColor : "#38bdf8"} 
                                  onChange={(e) => update(`projects.${i}.buttons.${btnIndex}.borderColor`, e.target.value)} 
                                  className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0 shrink-0" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-0.5">
                            <span className="text-[5.8px] text-zinc-400 block mb-0.5">Click Directive (Click instruction)</span>
                            <select
                              value={btn.target || "_blank"}
                              onChange={(e) => update(`projects.${i}.buttons.${btnIndex}.target`, e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded px-1 py-0.5 text-[6px] text-white outline-none focus:border-sky-500 font-mono transition-all"
                            >
                              <option value="_blank">Open Link in New Page/Tab (Recommended for external url)</option>
                              <option value="_self">Same Page / Run Section Navigation (Recommended for section anchors like #contact)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1 mt-1 border-t border-white/5 pt-1.5">
                  <button 
                    type="button"
                    onClick={() => setActiveProjectForModal(p)}
                    className="text-[7.5px] text-[var(--theme-accent)] hover:text-white hover:bg-white/5 transition-colors py-1 font-mono uppercase tracking-widest flex items-center justify-center gap-1 rounded cursor-pointer"
                  >
                    🔍 Test Modal
                  </button>
                  <button 
                    type="button"
                    onClick={()=>update("projects", data.projects.filter((_:any, j:number)=>j!==i))} 
                    className="text-[7.5px] text-red-400 hover:text-red-350 hover:bg-white/5 transition-colors py-1 font-mono uppercase tracking-widest flex items-center justify-center gap-1 rounded cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Purge Node
                  </button>
                </div>
             </div>
            ))}
            <Btn onClick={()=>update("projects", [...data.projects, {id: Date.now(), title: "Web Application", emoji: "💎", description: "Node client integration framework.", tech: ["React", "Typescript"], liveUrl: "", githubUrl: "", image: "", buttons: []}])} variant="cyan" style={{ width: "100%" }}><Plus className="w-3 h-3" /> Project Node</Btn>
         </div>
      </Accordion>

      <Accordion title="Interactive Navigation" icon={<Compass className="w-3 h-3 text-sky-400" />}>
         <div className="space-y-1.5">
            <Field label="Brand / Brandname Signature"><Input value={data.nav.title} onChange={(v:any)=>update("nav.title", v)} /></Field>
            <Field label="Nav Links Config">
              <div className="space-y-1 pt-0.5">
                {data.nav.links.map((l:any, i:number) => (
                  <div key={i} className="flex gap-1">
                    <Input value={l.label} onChange={(v:any)=>update(`nav.links.${i}.label`, v)} style={{width:'50%'}} placeholder="Label" />
                    <Input value={l.url} onChange={(v:any)=>update(`nav.links.${i}.url`, v)} style={{width:'50%'}} placeholder="Url" />
                  </div>
                ))}
              </div>
            </Field>
         </div>
      </Accordion>

      <Accordion title="Skins & Themes" icon={<Sliders className="w-3 h-3 text-indigo-400" />}>
         <p className="text-[6.5px] text-zinc-500 uppercase font-black mb-0.5">Core Color Matrix</p>
         <div className="grid grid-cols-4 gap-1 mb-1.5">
            {THEMES.map((t, i) => (
              <button key={i} onClick={()=>setData({...data, theme: t})} 
                className={`w-full aspect-square rounded transition-all flex flex-col items-center justify-center border ${(data.theme || THEMES[0]).name === t.name ? 'border-[var(--theme-accent)] bg-white/10 ring-1 ring-[var(--theme-accent)]/20' : 'border-white/5 hover:border-white/10'}`}
                style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.bg} 100%)` }}
                title={t.name}
              >
                <div className="w-2 h-2 rounded-full border border-white/20 shadow-sm" style={{ background: t.accent }} />
              </button>
            ))}
         </div>
         <div className="space-y-1.5">
            <Field label="Font Configuration">
               <select 
                 className="w-full bg-[#101026] border border-white/10 rounded px-1 py-0.5 text-[9px] text-white outline-none font-mono" 
                 value={data.font} 
                 onChange={e=>update("font", e.target.value)}
               >
                  {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
               </select>
            </Field>
            <Field label="Align Layout">
               <div className="grid grid-cols-2 gap-0.5 bg-white/5 p-0.5 rounded border border-white/5">
                  <button 
                    onClick={()=>update("layout.heroAlign", "left")} 
                    className={`text-[7px] font-bold uppercase tracking-wider py-0.5 rounded transition-colors ${data.layout.heroAlign === "left" ? "bg-[var(--theme-accent)] text-black" : "text-zinc-400 hover:text-white"}`}
                  >
                    Left
                  </button>
                  <button 
                    onClick={()=>update("layout.heroAlign", "center")} 
                    className={`text-[7px] font-bold uppercase tracking-wider py-0.5 rounded transition-colors ${data.layout.heroAlign === "center" ? "bg-[var(--theme-accent)] text-black" : "text-zinc-400 hover:text-white"}`}
                  >
                    Center
                  </button>
               </div>
            </Field>
            <Field label="Global Card Radius">
               <div className="flex items-center gap-1">
                 <input type="range" min="0" max="20" value={data.layout.cardRadius} onChange={e=>update("layout.cardRadius", parseInt(e.target.value))} className="flex-1 h-0.5 bg-zinc-800 rounded accent-[var(--theme-accent)] appearance-none pointer-events-auto" />
                 <span className="text-[7.5px] font-mono text-zinc-400 shrink-0">{data.layout.cardRadius}px</span>
               </div>
            </Field>
         </div>
      </Accordion>

      <Accordion title="Social Matrix" icon={<Globe className="w-3 h-3 text-sky-400" />}>
         <div className="space-y-1">
            {Object.keys(data.social).map(k => (
              <Field key={k} label={k}>
                <Input value={data.social[k]} onChange={(v:any)=>update(`social.${k}`, v)} placeholder={k === 'email' ? 'yourname@email.com' : `https://${k}.com/...`} />
              </Field>
            ))}
         </div>
      </Accordion>

      <Accordion title="Footer Signature" icon={<Compass className="w-3 h-3 text-red-300" />}>
         <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-white/5 p-1 px-1.5 rounded border border-white/5">
               <span className="text-[7px] text-zinc-400 font-bold uppercase">Call to Action Trigger</span>
               <input type="checkbox" checked={data.footer.showCta} onChange={e=>update("footer.showCta", e.target.checked)} className="accent-[var(--theme-accent)] w-3 h-3 shrink-0 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-1 shrink-0">
              <Field label="Trigger Text"><Input value={data.footer.ctaText} onChange={(v:any)=>update("footer.ctaText", v)} /></Field>
              <Field label="Payload Target"><Input value={data.footer.ctaUrl} onChange={(v:any)=>update("footer.ctaUrl", v)} /></Field>
            </div>
            <Field label="Copyright Line"><Input value={data.footer.copyright} onChange={(v:any)=>update("footer.copyright", v)} /></Field>
         </div>
      </Accordion>

      <Accordion title="Custom Blocks" icon={<Plus className="w-3 h-3 text-purple-400" />}>
           <div className="space-y-2">
            {data.customSections.map((s:any, i:number) => (
              <div key={s.id} className="p-1.5 border border-white/5 bg-white/5 rounded space-y-1.5 relative group">
                 <div className="flex justify-between items-center bg-black/40 p-1 rounded font-mono">
                    <span className="text-[6.5px] font-black uppercase text-[var(--theme-accent)]/80">Custom_Block_{i+1}</span>
                    <button onClick={()=>update("customSections", data.customSections.filter((_:any, idx:number)=>idx!==i))} className="text-red-400 hover:text-red-300 text-[6.5px] uppercase font-black transition-colors flex items-center gap-0.5">
                      <Trash2 className="w-2 h-2" /> Del
                    </button>
                 </div>
                 <Input value={s.title} onChange={(v:any)=>update(`customSections.${i}.title`, v)} placeholder="Block Header Title" />
                 
                 <div className="space-y-1.5 pt-1 border-t border-white/5">
                   {s.items.map((item:any, j:number) => (
                     <div key={item.id} className="p-1 bg-black/20 rounded border border-white/5 relative group/item">
                        <Input value={item.title} onChange={(v:any)=>update(`customSections.${i}.items.${j}.title`, v)} style={{marginBottom:3}} placeholder="Item Key" />
                        <Textarea value={item.description} onChange={(v:any)=>update(`customSections.${i}.items.${j}.description`, v)} rows={2} placeholder="Item Value..." />
                        <button onClick={() => update(`customSections.${i}.items`, s.items.filter((_:any, idx:number)=>idx!==j))} className="absolute top-1 right-1 text-zinc-500 hover:text-red-400 p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity" title="Remove subitem">
                          <Trash2 className="w-2 h-2" />
                        </button>
                     </div>
                   ))}
                   <button 
                     onClick={() => {
                       const items = [...s.items, { id: Date.now(), title: "Concept node", description: "Node data description logs." }];
                       update(`customSections.${i}.items`, items);
                     }} 
                     className="w-full py-0.5 border border-dashed border-white/10 rounded text-[6.5px] uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                   >
                     + Sub-Element Info
                   </button>
                 </div>
              </div>
            ))}
            <Btn onClick={()=>update("customSections", [...data.customSections, {id: Date.now().toString(), title: "Dynamic Block", subtitle: "User Custom Segment", items: []}])} variant="violet" style={{ width: "100%" }}><Plus className="w-3" /> New Array Group</Btn>
           </div>
      </Accordion>

      <Accordion title="Publish & Deploy Matrix" icon={<Globe className="w-3 h-3 text-[var(--theme-accent)]" />} defaultOpen>
        <div className="space-y-3.5 pt-1">
          <p className="text-[6.2px] text-zinc-400 font-mono uppercase tracking-widest leading-relaxed">
            Configure uplink tokens to publish instantly from inside the workspace.
          </p>

          {/* GitHub Publish Panel */}
          <div className="p-1.5 border border-white/5 bg-black/40 rounded space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px]">🐙</span>
              <span className="text-[7px] font-black uppercase text-white font-mono tracking-widest">GITHUB UPLINK</span>
            </div>
            
            <Field label="Personal Access Token">
              <input 
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full bg-[#101026] border border-white/10 rounded px-1.5 py-0.5 text-[7px] text-white outline-none focus:border-emerald-500 font-mono transition-all"
              />
            </Field>

            <Field label="Repository Name">
              <input 
                type="text"
                placeholder="my-personal-portfolio"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="w-full bg-[#101026] border border-white/10 rounded px-1.5 py-0.5 text-[7px] text-white outline-none focus:border-emerald-500 font-mono transition-all"
              />
            </Field>

            {githubStatus.type !== "idle" && (
              <div className={`p-1.5 text-[6.5px] font-mono rounded border ${
                githubStatus.type === "loading" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                githubStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 w-full break-all" :
                "bg-red-500/10 border-red-500/30 text-red-300 w-full break-all"
              }`}>
                {githubStatus.message}
                {githubStatus.type === "success" && githubStatus.url && (
                  <a href={githubStatus.url} target="_blank" rel="noopener noreferrer" className="block underline mt-1 font-bold text-emerald-400">
                    OPEN REPO ↗
                  </a>
                )}
              </div>
            )}

            <button 
              onClick={handlePublishGithub} 
              disabled={githubStatus.type === "loading"}
              className={`w-full py-1 text-[7px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors ${githubStatus.type === "loading" ? "bg-zinc-800 text-zinc-500" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
            >
              {githubStatus.type === "loading" ? "Syncing..." : "Sync with GitHub 🔄"}
            </button>
          </div>

          {/* Vercel Deploy Panel */}
          <div className="p-1.5 border border-white/5 bg-black/40 rounded space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px]">▲</span>
              <span className="text-[7px] font-black uppercase text-white font-mono tracking-widest">VERCEL DEPLOY</span>
            </div>

            <Field label="Vercel Access Token">
              <input 
                type="password"
                placeholder="Vercel API Token"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                className="w-full bg-[#101026] border border-white/10 rounded px-1.5 py-0.5 text-[7px] text-white outline-none focus:border-violet-500 font-mono transition-all"
              />
            </Field>

            <Field label="Project Slug Name">
              <input 
                type="text"
                placeholder="my-cool-vercel-project"
                value={vercelProject}
                onChange={(e) => setVercelProject(e.target.value)}
                className="w-full bg-[#101026] border border-white/10 rounded px-1.5 py-0.5 text-[7px] text-white outline-none focus:border-violet-500 font-mono transition-all"
              />
            </Field>

            {vercelStatus.type !== "idle" && (
              <div className={`p-1.5 text-[6.5px] font-mono rounded border ${
                vercelStatus.type === "loading" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                vercelStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 w-full break-all" :
                "bg-red-500/10 border-red-500/30 text-red-300 w-full break-all"
              }`}>
                {vercelStatus.message}
                {vercelStatus.type === "success" && vercelStatus.url && (
                  <a href={vercelStatus.url} target="_blank" rel="noopener noreferrer" className="block underline mt-1 font-bold text-emerald-400">
                    LAUNCH SITE ↗
                  </a>
                )}
              </div>
            )}

            <button 
              onClick={handleDeployVercel} 
              disabled={vercelStatus.type === "loading"}
              className={`w-full py-1 text-[7px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors ${vercelStatus.type === "loading" ? "bg-zinc-800 text-zinc-500" : "bg-violet-600 hover:bg-violet-500 text-white"}`}
            >
              {vercelStatus.type === "loading" ? "Deploying..." : "Deploy to Vercel 🚀"}
            </button>
          </div>
        </div>
      </Accordion>
    </div>
  </div>
);

export interface PortfolioBuilderViewProps {
  onBack: () => void;
  showToast?: (ic: string, title: string, content: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function PortfolioBuilderView({ onBack, showToast }: PortfolioBuilderViewProps) {
  const [view, setView] = useState<"hub" | "builder" | "full-preview" | "code" | "publish">("hub");
  const [score, setScore] = useState(0);
  const [data, setData] = useState(DEFAULT_PORTFOLIO);
  const [previewData, setPreviewData] = useState(DEFAULT_PORTFOLIO);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [activeProjectForModal, setActiveProjectForModal] = useState<any | null>(null);
  const [isThemeCycling, setIsThemeCycling] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"editor" | "preview">("editor");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);

  // Deploy States & Credentials
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("gamura_github_token") || "");
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem("gamura_github_repo") || "my-web-portfolio");
  const [githubCommitMessage, setGithubCommitMessage] = useState("Publish personal portfolio build");
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem("gamura_vercel_token") || "");
  const [vercelProject, setVercelProject] = useState(() => localStorage.getItem("gamura_vercel_project") || "my-web-portfolio");
  
  const [githubStatus, setGithubStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string; url?: string }>({ type: "idle" });
  const [vercelStatus, setVercelStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string; url?: string }>({ type: "idle" });
  const [selectedDeployTab, setSelectedDeployTab] = useState<"github" | "vercel" | "netlify">("github");

  // Sync state changes with localStorage
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

  // GitHub Publish Handler
  const handlePublishGithub = async () => {
    const token = githubToken.trim();
    const repo = githubRepo.trim();
    const commitMsg = githubCommitMessage.trim() || "Publish personal portfolio build";

    if (!token) {
      setGithubStatus({ type: "error", message: "Please provide a valid GitHub Personal Access Token." });
      return;
    }
    if (!repo) {
      setGithubStatus({ type: "error", message: "Please specify a repository name." });
      return;
    }

    setGithubStatus({ type: "loading", message: "Connecting via Octokit..." });

    try {
      // Initialize Octokit client
      const octokit = new Octokit({ auth: token });

      // 1. Get authenticated user info
      const { data: userData } = await octokit.rest.users.getAuthenticated();
      const username = userData.login;

      setGithubStatus({ type: "loading", message: `Authenticated as @${username}. Initializing repository search...` });

      // 2. Try to get the repository
      let repoData;
      try {
        const { data: existingRepo } = await octokit.rest.repos.get({
          owner: username,
          repo: repo,
        });
        repoData = existingRepo;
      } catch (repoErr: any) {
        if (repoErr.status === 404) {
          setGithubStatus({ type: "loading", message: `Repo "${repo}" not found. Provisioning repository directly...` });
          
          const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
            name: repo,
            description: "Personal web portfolio compiled on Gamura Engine Studio.",
            private: false,
            auto_init: false,
          });
          repoData = newRepo;
        } else {
          throw repoErr;
        }
      }

      setGithubStatus({ type: "loading", message: "Successfully verified repository target. Generating clean build artifacts..." });

      // 3. Check if index.html already exists to obtain SHA
      let existingSha: string | undefined = undefined;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner: username,
          repo: repo,
          path: "index.html",
        });
        
        if (!Array.isArray(fileData) && fileData.type === "file") {
          existingSha = fileData.sha;
        }
      } catch (fileErr: any) {
        // 404 can be expected if it's the first commit, ignore other errors
        if (fileErr.status !== 404) {
          console.warn("Failed checking index.html metadata", fileErr);
        }
      }

      // Safe base64 encode supporting Unicode characters
      const b64Data = btoa(unescape(encodeURIComponent(liveHTML)));

      setGithubStatus({ type: "loading", message: "Pushing commit bundle directly via Octokit interface..." });

      // 4. Create or update file content
      const { data: commitResponse } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo: repo,
        path: "index.html",
        message: commitMsg,
        content: b64Data,
        sha: existingSha,
      });

      const fileUrl = `https://github.com/${username}/${repo}/blob/${repoData.default_branch || "main"}/index.html`;

      if (showToast) {
        showToast(
          "🐙",
          "Sync Successful",
          `Committed index.html to ${repo}. File: ${fileUrl}`,
          "success"
        );
      }

      setGithubStatus({
        type: "success",
        message: `Compiled & Synchronized with absolute success! Repository active on: github.com/${username}/${repo}. Remember to activate GitHub Pages under Repo Settings -> Pages to enable instant hosting!`,
        url: repoData.html_url,
      });
    } catch (err: any) {
      setGithubStatus({ 
        type: "error", 
        message: err.message || "An unexpected error occurred during GitHub transition." 
      });
    }
  };

  // Vercel Deploy Handler
  const handleDeployVercel = async () => {
    if (!vercelToken.trim()) {
      setVercelStatus({ type: "error", message: "Please provide a valid Vercel Personal Access Token." });
      return;
    }
    if (!vercelProject.trim()) {
      setVercelStatus({ type: "error", message: "Please specify a Vercel project name." });
      return;
    }

    setVercelStatus({ type: "loading", message: "Initiating Vercel project deployment structure..." });

    try {
      const res = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: vercelProject.trim(),
          files: [
            {
              file: "index.html",
              data: liveHTML,
            }
          ],
          projectSettings: {
            framework: null,
          },
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || `Vercel build failed (Status ${res.status})`);
      }

      setVercelStatus({
        type: "success",
        message: "Pristine compile complete! Active live deployment allocated on Vercel servers.",
        url: `https://${resData.url}`,
      });
    } catch (err: any) {
      setVercelStatus({ type: "error", message: err.message || "An unexpected error occurred during Vercel deployment." });
    }
  };

  // Debounce preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewData(data);
    }, 400);
    return () => clearTimeout(timer);
  }, [data]);

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_system");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults to prevent crashes from missing keys
        const merged = {
          ...DEFAULT_PORTFOLIO,
          ...parsed,
          hero: { ...DEFAULT_PORTFOLIO.hero, ...(parsed.hero || {}) },
          nav: { ...DEFAULT_PORTFOLIO.nav, ...(parsed.nav || {}) },
          social: { ...DEFAULT_PORTFOLIO.social, ...(parsed.social || {}) },
          contact: { ...DEFAULT_PORTFOLIO.contact, ...(parsed.contact || {}) },
          layout: { ...DEFAULT_PORTFOLIO.layout, ...(parsed.layout || {}) },
          effects: { ...DEFAULT_PORTFOLIO.effects, ...(parsed.effects || {}) },
          sections: { ...DEFAULT_PORTFOLIO.sections, ...(parsed.sections || {}) },
        };

        // Ensure theme is always a valid object from THEMES
        if (!merged.theme || typeof merged.theme !== "object" || !merged.theme.name) {
          merged.theme = THEMES[0];
        }
        
        // Ensure arrays are present (handle old saves that might have null/undefined for new array fields)
        const arrays = ["education", "achievements", "projects", "customSections", "certificates", "services", "stats"];
        arrays.forEach(key => {
          if (!Array.isArray((merged as any)[key])) {
            (merged as any)[key] = (DEFAULT_PORTFOLIO as any)[key] || [];
          }
        });

        // Nested array safety
        if (!Array.isArray(merged.nav.links)) merged.nav.links = DEFAULT_PORTFOLIO.nav.links;
        if (!Array.isArray(merged.hero.skills)) merged.hero.skills = DEFAULT_PORTFOLIO.hero.skills;
        
        (merged.customSections || []).forEach((s: any) => {
           if (!Array.isArray(s.items)) s.items = [];
        });

        setData(merged);
        setPreviewData(merged);
      }
    } catch (e) {
      console.error("Failed to restore portfolio nodes from local memory cluster", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("portfolio_system", JSON.stringify(data));
  }, [data]);

  const soundEffect = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext.current) audioContext.current = new AudioCtx();
      if (audioContext.current.state === 'suspended') audioContext.current.resume().catch(() => {});
      
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + (score * 5), audioContext.current.currentTime);
      gain.gain.setValueAtTime(0.04, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.current.currentTime + 0.08);
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.1);
    } catch(e) {}
  };

  const handleScore = () => {
    setScore(s => s + 1);
    soundEffect();
  };

  const cycleTheme = () => {
    setIsThemeCycling(true);
    const currentIndex = THEMES.findIndex(t => t.name === data.theme.name);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    setData(prev => ({ ...prev, theme: nextTheme }));
    soundEffect();
    setTimeout(() => {
      setIsThemeCycling(false);
    }, 500);
  };

  const update = useCallback((path: string, value: any) => {
    setData(prev => {
      const next = { ...prev };
      const parts = path.split(".");
      let current: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (Array.isArray(current[key])) {
          current[key] = [...current[key]];
        } else {
          current[key] = { ...current[key] };
        }
        current = current[key];
      }
      
      let processedValue = value;
      // Auto-convert Google Drive and other direct links when strings are specified for photo or image fields.
      const lastKey = parts[parts.length - 1];
      if (typeof value === "string" && (lastKey === "photo" || lastKey === "image" || lastKey === "avatar" || path.endsWith(".photo") || path.endsWith(".image"))) {
        processedValue = resolveDirectImageUrl(value);
      }
      
      current[parts[parts.length - 1]] = processedValue;
      return next;
    });
  }, []);

  const generatedHTML = useMemo(() => generatePortfolioHTML(previewData, true), [previewData]);
  const liveHTML = useMemo(() => generatePortfolioHTML(data, false), [data]);

  // Bind theme color palette dynamically to CSS custom variables in wrapper
  const activeTheme = data.theme || THEMES[0];
  const tr = hexRgb(activeTheme.accent);
  const styleVariables = {
    "--theme-accent": activeTheme.accent,
    "--theme-accent-rgb": tr,
    "--theme-gold": activeTheme.gold || "#ffcb47",
    "--theme-bg": activeTheme.bg || "#030312",
    "--theme-card": activeTheme.card || "#07071c",
    "--theme-text": activeTheme.text || "#ddeeff",
  } as any;

  return (
    <div 
      style={styleVariables}
      className="flex-1 h-[calc(100vh-140px)] min-h-[500px] w-full flex flex-col bg-[var(--theme-bg)] text-[var(--theme-text)] font-sans selection:bg-[var(--theme-accent)]/30 overflow-hidden relative rounded-2xl border border-white/5 transition-all duration-300"
    >
      <AnimatePresence mode="wait">
        {view === "hub" ? (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--theme-accent-rgb),0.07)_0%,#000000_100%)] select-none pointer-events-none transition-all duration-300" />
            <nav className="absolute top-0 left-0 right-0 z-50 px-4 md:px-6 h-14 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-xl">
               <div className="flex items-center gap-2">
                  <div className="w-2 border animate-pulse" style={{ height: '8px', backgroundColor: "var(--theme-accent)", borderColor: "var(--theme-accent)" }} />
                  <span className="font-mono font-black text-xs tracking-widest uppercase italic" style={{ color: "var(--theme-accent)" }}>PORTFOLIO ENGINE</span>
               </div>
               <div className="flex gap-1.5">
                  <Btn onClick={onBack} variant="red" className="px-2 py-1 text-[8px]">Exit 🚪</Btn>
                  <Btn onClick={() => setView("builder")} variant="cyan" className="px-3 py-1 text-[8px]">Builder Key ⚙️</Btn>
               </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center relative p-4 pt-16">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-center space-y-4 max-w-lg">
                  <h1 className="text-[40px] md:text-[68px] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-700 select-none">
                    PORTFOLIO
                  </h1>
                  
                  {/* Dynamic Pre-populated Content Summary Card */}
                  <div className="p-3 bg-zinc-950/70 border border-white/5 rounded-lg text-left text-[9px] font-mono leading-relaxed space-y-2 max-w-md mx-auto block">
                     <p className="text-zinc-500 uppercase tracking-widest text-[7.5px] border-b border-white/5 pb-1">Current Config Status</p>
                     <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div><span className="text-zinc-600">Theme:</span> <span style={{ color: 'var(--theme-accent)' }}>{data.theme.name}</span></div>
                        <div><span className="text-zinc-600">Font:</span> <span className="text-white">{data.font}</span></div>
                        <div><span className="text-zinc-600">Projects:</span> <span className="text-white">{data.projects.length} nodes</span></div>
                        <div><span className="text-zinc-600">Capabilities:</span> <span className="text-white">{data.services.length} items</span></div>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button onClick={() => setView("builder")} className="px-4 py-1.5 bg-[var(--theme-accent)] text-black font-black uppercase text-[8.5px] tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer rounded">
                      Launch Generator
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={cycleTheme} 
                      className="px-4 py-1.5 bg-white/5 text-[var(--theme-accent)] font-black uppercase text-[8.5px] tracking-widest hover:bg-white/10 transition-all border border-[var(--theme-accent)]/20 cursor-pointer rounded flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.05)] hover:shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.15)]"
                    >
                      <motion.div
                        animate={{ rotate: isThemeCycling ? 360 : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-[var(--theme-accent)]" />
                      </motion.div> 
                      <span>{data.theme.name}</span>
                    </motion.button>
                  </div>
               </motion.div>
            </main>

            <footer className="py-3 flex flex-col items-center gap-1 relative z-10 border-t border-white/5 bg-black/60 shrink-0">
               <div onClick={handleScore} className="w-7 h-7 border border-white/10 rounded-full flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-all hover:border-[var(--theme-accent)]/50 bg-zinc-950 shadow-inner">
                  <span className="text-[var(--theme-accent)] text-[9px] font-black font-mono">{score === 0 ? "G" : score}</span>
               </div>
            </footer>

            {/* Detailed Project Showcase Modal */}
            <AnimatePresence>
               {showcaseOpen && (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }} 
                   className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 select-none"
                   onClick={() => setShowcaseOpen(false)}
                 >
                   <motion.div 
                     initial={{ scale: 0.95, y: 15 }} 
                     animate={{ scale: 1, y: 0 }} 
                     exit={{ scale: 0.95, y: 15 }} 
                     className="bg-[#050514] border border-[var(--theme-accent)]/20 w-full max-w-2xl max-h-[85vh] rounded-xl overflow-hidden flex flex-col p-4 shadow-2xl relative text-left"
                     style={{ boxShadow: "0 0 50px rgba(var(--theme-accent-rgb), 0.15)" }}
                     onClick={e => e.stopPropagation()}
                   >
                     {/* Modal Heading */}
                     <div className="flex items-center justify-between pb-3 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-2">
                           <Trophy className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                           <h3 
                             className="font-black text-[10px] uppercase tracking-wider font-mono"
                             style={{ color: data.projectsHeadingColor || "var(--theme-accent)" }}
                           >
                             {data.projectsHeading || "Selected Works"}
                           </h3>
                        </div>
                        <button 
                          onClick={() => setShowcaseOpen(false)} 
                          className="w-5 h-5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all text-xs font-bold"
                          title="Close"
                        >
                          ✕
                        </button>
                     </div>

                     {/* Scrollable grid area */}
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-3 space-y-3">
                        <p 
                          className="text-[8.5px] font-mono uppercase tracking-wider leading-tight"
                          style={{ color: data.projectsSubtextColor || "#71717a" }}
                        >
                           {data.projectsSubtext || "The following interactive nodes represent high-performance solutions engineered with custom compiled bundles. Click on individual nodes to explore endpoints."}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {data.projects && data.projects.length > 0 ? (
                             data.projects.map((p: any, idx: number) => (
                               <div 
                                 key={idx}
                                 className="p-3 rounded-lg flex flex-col justify-between transition-all hover:brightness-110"
                                 style={{
                                   backgroundColor: p.bgColor || "rgba(9, 9, 20, 0.45)",
                                   borderColor: p.borderColor || "rgba(255, 255, 255, 0.05)",
                                   borderWidth: "1px",
                                   borderStyle: "solid"
                                 }}
                               >
                                 <div>
                                    {p.image && (
                                      <div className="w-full h-24 rounded overflow-hidden bg-black mb-2 border border-white/5 relative">
                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-all duration-300" referrerPolicy="no-referrer" />
                                        <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[7.5px] font-mono border border-white/5">{p.emoji || "💻"}</div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                       <h4 className="text-[10px] font-bold tracking-tight uppercase" style={{ color: p.titleColor || "#ffffff" }}>{p.title}</h4>
                                    </div>
                                    <p className="text-[8.5px] line-clamp-2 mb-2 leading-relaxed" style={{ color: p.descColor || "#a1a1aa" }}>{p.description || "Experimental architecture compilation node."}</p>
                                 </div>
                                 <div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                       {(p.tech || []).map((t: string, ti: number) => (
                                         <span key={ti} className="text-[6px] px-1 py-0.2 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded bg-[var(--theme-accent)]/5 uppercase font-bold tracking-wide">
                                            {t}
                                         </span>
                                       ))}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <button 
                                        onClick={() => setActiveProjectForModal(p)}
                                        className="w-full py-1 text-center bg-white/5 border border-white/10 hover:border-[var(--theme-accent)]/80 text-[var(--theme-accent)] hover:text-white hover:bg-[var(--theme-accent)]/10 text-[7px] font-mono uppercase tracking-[0.08em] font-extrabold rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        🔍 Inspect Full Specs
                                      </button>
                                      <div className="flex gap-1.5 w-full">
                                         {p.liveUrl && (
                                           <a 
                                             href={p.liveUrl} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className="flex-1 py-1 text-center bg-[var(--theme-accent)] text-black text-[7px] font-mono uppercase tracking-[0.08em] font-black rounded hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-0.5"
                                           >
                                             <ExternalLink className="w-2.5 h-2.5" /> Static Site
                                           </a>
                                         )}
                                         {p.githubUrl && (
                                           <a 
                                             href={p.githubUrl} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className="flex-1 py-1 text-center bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[7px] font-mono uppercase tracking-[0.08em] rounded transition-all flex items-center justify-center gap-0.5"
                                           >
                                             <Github className="w-2.5 h-2.5" /> Source
                                           </a>
                                         )}
                                      </div>

                                      {/* Custom Action Buttons */}
                                      {p.buttons && p.buttons.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 border-t border-white/5 pt-1">
                                          {p.buttons.map((btn: any) => (
                                            <a 
                                              key={btn.id}
                                              href={btn.url || "#"} 
                                              target={btn.target || "_blank"} 
                                              rel="noopener noreferrer"
                                              className="flex-1 py-0.5 text-center text-[6px] font-mono uppercase tracking-[0.04em] font-black rounded hover:brightness-110 transition-all flex items-center justify-center gap-0.5 px-1 border"
                                              style={{
                                                backgroundColor: btn.bgColor || "var(--theme-accent)",
                                                color: btn.textColor || "#000000",
                                                borderColor: btn.borderColor || "transparent",
                                              }}
                                            >
                                              {btn.label || "Action"}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                 </div>
                               </div>
                             ))
                           ) : (
                             <div className="col-span-2 text-center py-6 border border-dashed border-white/10 rounded">
                                <span className="text-[8px] text-zinc-500 font-mono uppercase">No projects configured in current session list</span>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Footer close button option */}
                     <div className="pt-2 border-t border-white/5 flex justify-end flex-shrink-0">
                        <Btn onClick={() => setShowcaseOpen(false)} variant="dark" style={{ fontFamily: 'mono', padding: '2px 8px', fontSize: '7.5px' }}>
                           Dismount Terminal
                        </Btn>
                     </div>
                   </motion.div>
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col overflow-hidden">
             {/* Global Builder App Bar */}
             <div className="h-12 bg-black/90 border-b flex items-center px-3 md:px-6 justify-between flex-shrink-0 z-50 transition-all duration-300" style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.15)' }}>
               <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-sm transform rotate-45 transition-colors duration-300" style={{ backgroundColor: "var(--theme-accent)" }} />
                    <span className="font-bold tracking-wider uppercase text-[9px] transition-colors duration-300" style={{ color: "var(--theme-accent)" }}>Uplink editor</span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10 flex-shrink-0" />
                  
                  {/* Dynamic Predefined Theme Switcher Cycle Button */}
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cycleTheme}
                    className="flex items-center gap-1.5 text-[8.5px] uppercase font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded transition-all shrink-0 cursor-pointer shadow-[0_0_12px_rgba(var(--theme-accent-rgb),0.03)]"
                  >
                    <motion.div
                      animate={{ rotate: isThemeCycling ? 360 : 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-[var(--theme-accent)]" />
                    </motion.div>
                    <span>Theme:</span>
                    <span style={{ color: "var(--theme-accent)" }}>{data.theme.name}</span>
                  </motion.button>

                  <div className="h-3 w-[1px] bg-white/10 flex-shrink-0 hidden xs:block" />

                  <div className="flex gap-1 md:gap-2 shrink-0">
                    {[
                      { id: "builder", icon: <Sliders className="w-2.5 h-2.5" /> },
                      { id: "full-preview", icon: <Eye className="w-2.5 h-2.5" /> },
                      { id: "code", icon: <Code className="w-2.5 h-2.5" /> },
                      { id: "publish", icon: <Globe className="w-2.5 h-2.5" /> }
                    ].map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => setView(tab.id as any)} 
                        className={`whitespace-nowrap px-1 py-1.5 text-[8.5px] uppercase tracking-wider font-bold transition-all relative flex items-center gap-1 ${view === tab.id ? 'text-[var(--theme-accent)]' : 'text-zinc-500 hover:text-white'}`}
                      >
                        {tab.icon}
                        <span className="hidden xs:inline">{tab.id.replace("-", " ")}</span>
                        {view === tab.id && <motion.div layoutId="bar" className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[var(--theme-accent)]" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="flex gap-1 shrink-0">
                  <Btn onClick={() => {
                    const blob = new Blob([liveHTML], { type: "text/html" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "portfolio.html";
                    a.click();
                  }} variant="gold" style={{ padding: "3px 6px", fontSize: "7.5px" }}><Download className="w-2.5 h-2.5" /> Download</Btn>
                  <Btn onClick={() => setView("publish")} variant="violet" className="hidden sm:flex" style={{ padding: "3px 6px", fontSize: "7.5px" }}><Globe className="w-2.5 h-2.5" /> Global Live</Btn>
               </div>
             </div>

             {/* Adaptive Switcher Tab bar for small viewports to avoid cramping */}
             {view === "builder" && (
                <div className="flex md:hidden w-full bg-black/45 border-b border-white/5 p-1 shrink-0">
                  <button 
                    onClick={() => setMobileViewMode("editor")} 
                    className={`flex-1 py-1 text-[8.5px] uppercase font-bold tracking-wider rounded text-center transition-colors ${mobileViewMode === "editor" ? "bg-[var(--theme-accent)] text-black" : "text-zinc-400 hover:text-white"}`}
                  >
                    📝 CONFIG EDITOR
                  </button>
                  <button 
                    onClick={() => setMobileViewMode("preview")} 
                    className={`flex-1 py-1 text-[8.5px] uppercase font-bold tracking-wider rounded text-center transition-colors ${mobileViewMode === "preview" ? "bg-[var(--theme-accent)] text-black" : "text-zinc-400 hover:text-white"}`}
                  >
                    👁️ PREVIEW FRAME
                  </button>
                </div>
             )}

             <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
               {view === "builder" && (
                 <div className={`h-full shrink-0 ${mobileViewMode === "editor" ? "flex" : "hidden md:flex"} w-full md:w-auto`}>
                    <Sidebar 
                      data={data} 
                      update={update} 
                      setView={setView} 
                      setData={setData} 
                      onQuit={onBack}
                      setActiveProjectForModal={setActiveProjectForModal}
                      githubToken={githubToken}
                      setGithubToken={setGithubToken}
                      githubRepo={githubRepo}
                      setGithubRepo={setGithubRepo}
                      handlePublishGithub={handlePublishGithub}
                      githubStatus={githubStatus}
                      vercelToken={vercelToken}
                      setVercelToken={setVercelToken}
                      vercelProject={vercelProject}
                      setVercelProject={setVercelProject}
                      handleDeployVercel={handleDeployVercel}
                      vercelStatus={vercelStatus}
                      confirmWipe={confirmWipe}
                      setConfirmWipe={setConfirmWipe}
                      confirmLoad={confirmLoad}
                      setConfirmLoad={setConfirmLoad}
                      soundEffect={soundEffect}
                    />
                 </div>
               )}
               
               <div className={`flex-1 bg-black/40 overflow-hidden flex-col items-center justify-center p-1 md:p-2.5 relative ${view === "builder" && mobileViewMode !== "preview" ? "hidden md:flex" : "flex"}`}>
                  <AnimatePresence mode="wait">
                    {view === "builder" && (
                       <motion.div key="editor-view" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full border border-white/5 bg-[#03030f] rounded-lg flex flex-col overflow-hidden shadow-2xl">
                          <div className="h-8 bg-black/50 border-b border-white/5 flex items-center px-3 justify-between flex-shrink-0 backdrop-blur-xl">
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                   <div className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: "var(--theme-accent)" }} />
                                   <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: "var(--theme-accent)" }}>Preview Stream Live</span>
                                </div>
                             </div>
                             <div className="flex gap-1.5">
                                {[
                                  { id: "desktop", icon: <Tv className="w-2.5 h-2.5" /> },
                                  { id: "tablet", icon: <Tablet className="w-2.5 h-2.5" /> },
                                  { id: "mobile", icon: <Smartphone className="w-2.5 h-2.5" /> }
                                ].map((d:any) => (
                                  <button 
                                    key={d.id} 
                                    onClick={() => setDevice(d.id)} 
                                    className={`flex items-center gap-0.5 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded transition-all ${device === d.id ? 'text-[var(--theme-accent)] bg-[var(--theme-accent)]/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title={d.id}
                                  >
                                    {d.icon}
                                    <span className="hidden xs:inline">{d.id[0]}</span>
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="flex-1 bg-[#090912]/95 flex justify-center py-1 overflow-y-auto custom-scrollbar overflow-x-hidden p-1">
                             <div className={`h-full transition-all duration-300 ease-[0.16,1,0.3,1] bg-white rounded overflow-hidden flex items-center justify-center border border-zinc-950 shadow-2xl relative ${device === 'desktop' ? 'w-full' : device === 'tablet' ? 'w-[700px] max-w-full' : 'w-[340px] max-w-full'}`}>
                                <iframe 
                                  key={generatedHTML.length}
                                  title="Node Preview"
                                  srcDoc={generatedHTML} 
                                  className="w-full h-full border-none bg-[#03030f]" 
                                />
                             </div>
                          </div>
                       </motion.div>
                      )}

                      {view === "full-preview" && (
                        <motion.div key="full-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full bg-[#03030f] border border-white/5 rounded-lg overflow-hidden">
                           <iframe title="Production Mirror" srcDoc={liveHTML} className="w-full h-full border-none bg-[#03030f]" />
                        </motion.div>
                      )}

                      {view === "code" && (
                        <motion.div key="code-view" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full bg-[#01010a] border border-white/5 rounded-lg p-2.5 flex flex-col shadow-2xl">
                           <div className="flex justify-between items-center mb-1.5 shrink-0 bg-black/40 p-1.5 rounded border border-white/5">
                              <div className="flex items-center gap-1.5">
                                 <Code className="w-3.5 h-3.5 text-emerald-400" />
                                 <h3 className="text-emerald-400 font-bold text-[7.5px] uppercase tracking-widest font-mono">EXPORTABLE SINGLE-FILE BUNDLE CODE</h3>
                              </div>
                              <Btn onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(liveHTML).then(() => {
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }).catch(() => {});
                                  }
                              }} variant={copied ? "gold" : "cyan"} style={{fontSize:'7px', padding:'2px 6px'}}>
                                {copied ? <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5" /> COPIED</span> : "Copy HTML"}
                              </Btn>
                           </div>
                           <textarea 
                             readOnly 
                             value={liveHTML} 
                             className="flex-1 bg-black/60 text-emerald-400/40 font-mono text-[9px] p-2 rounded border border-white/5 outline-none resize-none leading-relaxed custom-scrollbar hover:text-emerald-300/80 transition-colors" 
                             spellCheck={false}
                           />
                        </motion.div>
                      )}

                      {view === "publish" && (
                        <motion.div key="publish-view" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col items-center justify-center bg-[#02020a] p-3 text-center rounded-lg border border-white/5 overflow-y-auto">
                           <div className="max-w-lg w-full py-2 flex flex-col items-center min-h-[350px]">
                              <div className="mb-4">
                                 <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-[0.15em] mb-0.5 text-[var(--theme-accent)]">
                                    DEPLOY MATRIX
                                 </h2>
                                 <p className="text-[8px] md:text-[9.5px] text-zinc-400 font-mono uppercase tracking-widest leading-relaxed">
                                    Select target uplink system for transmission of compiled architecture
                                 </p>
                              </div>
                              
                              {/* Selection Cards */}
                              <div className="grid grid-cols-3 gap-2 mb-4 w-full max-w-[420px]">
                                 <button 
                                    onClick={() => setSelectedDeployTab("github")}
                                    className={`flex flex-col items-center p-2 rounded border transition-all text-center cursor-pointer ${selectedDeployTab === "github" ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]" : "bg-zinc-900/40 border-white/5 hover:border-zinc-700 hover:bg-zinc-900/60"}`}
                                 >
                                    <div className="w-6 h-6 mb-1 flex items-center justify-center p-1 rounded bg-black/60 border border-white/5">
                                       <img src="https://cdn.simpleicons.org/github/white" alt="GitHub" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-[8.5px] uppercase font-bold tracking-wider text-white">GITHUB</span>
                                    <span className="text-[5.5px] uppercase font-mono tracking-tighter text-zinc-500">Repository Uplink</span>
                                 </button>

                                 <button 
                                    onClick={() => setSelectedDeployTab("vercel")}
                                    className={`flex flex-col items-center p-2 rounded border transition-all text-center cursor-pointer ${selectedDeployTab === "vercel" ? "bg-violet-500/15 border-violet-500" : "bg-zinc-900/40 border-white/5 hover:border-zinc-700 hover:bg-zinc-900/60"}`}
                                 >
                                    <div className="w-6 h-6 mb-1 flex items-center justify-center p-1 rounded bg-black/60 border border-white/5">
                                       <img src="https://cdn.simpleicons.org/vercel/white" alt="Vercel" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-[8.5px] uppercase font-bold tracking-wider text-white">VERCEL</span>
                                    <span className="text-[5.5px] uppercase font-mono tracking-tighter text-zinc-500">1-Click deploy</span>
                                 </button>

                                 <button 
                                    onClick={() => setSelectedDeployTab("netlify")}
                                    className={`flex flex-col items-center p-2 rounded border transition-all text-center cursor-pointer ${selectedDeployTab === "netlify" ? "bg-emerald-500/15 border-emerald-500" : "bg-zinc-900/40 border-white/5 hover:border-zinc-700 hover:bg-zinc-900/60"}`}
                                 >
                                    <div className="w-6 h-6 mb-1 flex items-center justify-center p-1 rounded bg-black/60 border border-white/5">
                                       <img src="https://cdn.simpleicons.org/netlify/white" alt="Netlify" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-[8.5px] uppercase font-bold tracking-wider text-white">NETLIFY</span>
                                    <span className="text-[5.5px] uppercase font-mono tracking-tighter text-zinc-500">Static drag-drop</span>
                                 </button>
                              </div>

                              {/* Interactive Form Workspace */}
                              <div className="w-full max-w-[420px] bg-black/40 border border-white/5 rounded-lg p-3 text-left mb-4 shadow-xl">
                                 {selectedDeployTab === "github" && (
                                    <div className="space-y-3">
                                       <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                          <span className="text-[10px]">🐙</span>
                                          <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-400 font-mono">GitHub Automatic Integration Console</h4>
                                       </div>
                                       
                                       <div className="space-y-2">
                                          <div>
                                             <label className="block text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mb-1">GitHub Personal Access Token (classic or fine-grained with 'repo' scope)</label>
                                             <input 
                                                type="password"
                                                placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                                value={githubToken}
                                                onChange={(e) => setGithubToken(e.target.value)}
                                                className="w-full bg-zinc-950/80 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white outline-none focus:border-emerald-500 font-mono transition-all"
                                             />
                                          </div>

                                          <div>
                                             <label className="block text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">Repository Name (will be updated or created automatically)</label>
                                             <input 
                                                type="text"
                                                placeholder="my-personal-portfolio"
                                                value={githubRepo}
                                                onChange={(e) => setGithubRepo(e.target.value)}
                                                className="w-full bg-zinc-950/80 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white outline-none focus:border-emerald-500 font-mono transition-all"
                                             />
                                          </div>
                                       </div>

                                       {githubStatus.type !== "idle" && (
                                          <div className={`p-2 text-[7.5px] font-mono rounded border ${
                                             githubStatus.type === "loading" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                                             githubStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 w-full break-all" :
                                             "bg-red-500/10 border-red-500/30 text-red-300 w-full break-all"
                                          }`}>
                                             {githubStatus.message}
                                             {githubStatus.type === "success" && githubStatus.url && (
                                                <a href={githubStatus.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline mt-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                                   Open Repository Page <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                             )}
                                          </div>
                                       )}

                                       <div>
                                          <label className="block text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">Custom Commit Message</label>
                                          <input 
                                             type="text"
                                             placeholder="e.g., Publish personal portfolio build"
                                             value={githubCommitMessage}
                                             onChange={(e) => setGithubCommitMessage(e.target.value)}
                                             className="w-full bg-zinc-950/80 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white outline-none focus:border-emerald-500 font-mono transition-all"
                                          />
                                       </div>

                                       <button 
                                          id="deploy-to-github"
                                          onClick={handlePublishGithub}
                                          disabled={githubStatus.type === "loading"}
                                          className={`w-full py-2.5 rounded text-[8.5px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                             githubStatus.type === "loading" 
                                                ? "bg-zinc-800 text-zinc-500" 
                                                : "bg-[#10b981] hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 duration-200"
                                          }`}
                                       >
                                          {githubStatus.type === "loading" ? (
                                             <span className="flex items-center gap-1.5 justify-center">
                                                <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                                                <span>Syncing with GitHub...</span>
                                             </span>
                                          ) : (
                                             <>
                                                Sync to GitHub 🚀
                                             </>
                                          )}
                                       </button>
                                    </div>
                                 )}

                                 {selectedDeployTab === "vercel" && (
                                    <div className="space-y-3">
                                       <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                          <span className="text-[10px]">▲</span>
                                          <h4 className="text-[9px] font-black uppercase tracking-wider text-violet-400 font-mono">Vercel One-Click Deploy Rest Space</h4>
                                       </div>

                                       <div className="space-y-2">
                                          <div>
                                             <label className="block text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Vercel Token (from vercel.com/account/tokens)</label>
                                             <input 
                                                type="password"
                                                placeholder="Token Code e.g. a1b2c3d4..."
                                                value={vercelToken}
                                                onChange={(e) => setVercelToken(e.target.value)}
                                                className="w-full bg-zinc-950/80 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white outline-none focus:border-violet-500 font-mono transition-all"
                                             />
                                          </div>

                                          <div>
                                             <label className="block text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold font-mono">Project Slug Name</label>
                                             <input 
                                                type="text"
                                                placeholder="my-cool-vercel-project"
                                                value={vercelProject}
                                                onChange={(e) => setVercelProject(e.target.value)}
                                                className="w-full bg-zinc-950/80 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white outline-none focus:border-violet-500 font-mono transition-all"
                                             />
                                          </div>
                                       </div>

                                       {vercelStatus.type !== "idle" && (
                                          <div className={`p-2 text-[7.5px] font-mono rounded border ${
                                             vercelStatus.type === "loading" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                                             vercelStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 w-full break-all" :
                                             "bg-red-500/10 border-red-500/30 text-red-300 w-full break-all"
                                          }`}>
                                             {vercelStatus.message}
                                             {vercelStatus.type === "success" && vercelStatus.url && (
                                                <a href={vercelStatus.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline mt-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                                   Launch Live Vercel URLs <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                             )}
                                          </div>
                                       )}

                                       <button 
                                          onClick={handleDeployVercel}
                                          disabled={vercelStatus.type === "loading"}
                                          className={`w-full py-2 rounded text-[8.5px] font-black uppercase tracking-widest cursor-pointer transition-all ${vercelStatus.type === "loading" ? "bg-zinc-800 text-zinc-500" : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg active:scale-95"}`}
                                       >
                                          {vercelStatus.type === "loading" ? "Deploying Artifact to Vercel..." : "Deploy to Vercel System 🚀"}
                                       </button>
                                    </div>
                                 )}

                                 {selectedDeployTab === "netlify" && (
                                    <div className="space-y-3.5 font-mono text-zinc-300 leading-relaxed text-[8px] p-1">
                                       <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                          <span className="text-[10px]">✨</span>
                                          <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Netlify Static Drag & Drop Hosting</h4>
                                       </div>
                                       <p className="text-zinc-400 leading-relaxed text-[8.5px]">
                                          Netlify Drop is the quickest, zero-config method to host single-file sites live. Following these micro steps:
                                       </p>
                                       <ol className="list-decimal pl-4.5 space-y-1.5 text-zinc-400 text-[8px]">
                                          <li>Click the <strong className="text-white font-black">Download Bundle</strong> button below.</li>
                                          <li>Visit <a href="https://netlify.com/drop" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold">netlify.com/drop</a> in a new window tab.</li>
                                          <li>Drag-and-drop the finished <strong className="text-zinc-200 uppercase">portfolio.html</strong> file directly into the dropbox on netlify.</li>
                                          <li>Receive a fully hosted public site URL within seconds!</li>
                                       </ol>
                                    </div>
                                 )}
                              </div>

                              {/* Copied and downloaded fallback buttons for rapid copy operations */}
                              <div className="grid grid-cols-2 gap-2.5 w-full max-w-[420px] mb-4.5 bg-black/10 p-2 rounded border border-white/5">
                                 <button 
                                    onClick={() => {
                                       const blob = new Blob([liveHTML], { type: "text/html" });
                                       const a = document.createElement("a");
                                       a.href = URL.createObjectURL(blob);
                                       a.download = "portfolio.html";
                                       a.click();
                                    }}
                                    className="flex items-center justify-center gap-1.5 py-1.5 bg-zinc-900 border border-white/10 rounded text-[8px] md:text-[8.5px] uppercase tracking-wider font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                 >
                                    <Download className="w-3 h-3 text-amber-500" /> Download Build File
                                 </button>
                                 <button 
                                    onClick={() => {
                                       if (navigator.clipboard) {
                                          navigator.clipboard.writeText(liveHTML).then(() => {
                                             setCopied(true);
                                             setTimeout(() => setCopied(false), 2000);
                                          }).catch(() => {});
                                       }
                                    }}
                                    className="flex items-center justify-center gap-1.5 py-1.5 bg-zinc-900 border border-white/10 rounded text-[8px] md:text-[8.5px] uppercase tracking-wider font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                 >
                                    {copied ? (
                                       <>
                                          <Check className="w-3 h-3 text-emerald-400" /> Code Copied!
                                       </>
                                    ) : (
                                       <>
                                          <Code className="w-3 h-3 text-sky-400" /> Copy Complete HTML
                                       </>
                                    )}
                                 </button>
                              </div>

                              <div className="pt-2.5 border-t border-white/5 w-full max-w-[120px]">
                                 <Btn onClick={() => setView("builder")} variant="ghost" className="text-zinc-500 hover:text-[var(--theme-accent)] uppercase tracking-wider text-[8px] font-bold w-full" style={{ padding: '2px' }}>
                                    Back to Editor
                                 </Btn>
                              </div>
                           </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reusable React ProjectModal Component inside the Portfolio Builder Page */}
      <AnimatePresence>
        {activeProjectForModal && (
          <ProjectModal 
            project={activeProjectForModal}
            isOpen={!!activeProjectForModal}
            onClose={() => setActiveProjectForModal(null)}
            accentColor={data.theme.accent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
