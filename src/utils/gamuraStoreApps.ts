export type StoreIconKind =
  | "g-outline"
  | "orbit"
  | "code"
  | "globe"
  | "pdf"
  | "gainosor"
  | "gigor"
  | "music"
  | "calc"
  | "art"
  | "sparkles"
  | "chart"
  | "notes"
  | "user"
  | "clip"
  | "camera"
  | "messenger"
  | "numbers"
  | "gfiles"
  | "buysell"
  | "links"
  | "resume"
  | "pb1"
  | "pb2"
  | "letter";

export interface StoreAppItem {
  id: string;
  name: string;
  cat: string;
  tag: string;
  desc: string;
  url: string;
  c1: string;
  c2: string;
  iconKind?: StoreIconKind;
  logoUrl?: string;
  logoFallbackUrl?: string;
  logoBg?: string;
  logoFit?: "contain" | "cover";
  rating: number;
  version?: string;
  age?: string;
  chart?: string;
  dl: string;
  size: string;
  isBuiltin?: boolean;
}

export const UNIVERSE_APPS_KEY = "gamura_universe_apps_v1";
export const MOBILE_APPS_KEY = "gamura_mobile_apps_v1";
export const CUSTOM_STORE_APPS_KEY = "gs_custom";
export const LEGACY_INSTALLED_KEY = "gs_inst";
export const UNIVERSE_APPS_EVENT = "gamura-universe-apps-updated";
export const APP_RATINGS_KEY = "gamura_store_app_ratings_v1";
export const APP_RATINGS_EVENT = "gamura-store-ratings-updated";
export const GAMURA_VEO_LOGO_URL =
  "/assets/aistudio/IMG_20261115_083802_9866b1da.png";
export const GAMURA_VEO_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1FqBAdXuyDDSSuYtd3iZzf9x5PM8orKrd";
export const GAMURA_CALC_LOGO_URL =
  "/assets/aistudio/gamura-calc-logo_d6aec2f0.png";
export const GAMURA_CALC_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/19GM0X_7lRgIlwQ-PJP8uAJzVqkDOE2s_=w512";
export const GAMURA_CAMERA_LOGO_URL =
  "/assets/aistudio/1794885573140_43c1db18.png";
export const GAMURA_CAMERA_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1joiKBbYSqZSH-rcuixhuHd5lWWxqisW6=w512";
export const GAMURA_BUYSELL_LOGO_URL =
  "/assets/aistudio/1795024263692_cd59eb3c.png";
export const GAMURA_BUYSELL_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1mVAD61FkOS6C6rUiOLTLnDEgfeLI9qaR=w512";

const driveLogo = (id: string) => ({
  logoUrl: `https://lh3.googleusercontent.com/d/${id}=w512`,
  logoFallbackUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w512`,
});

export const BUILTIN_STORE_APPS: StoreAppItem[] = [
  {
    id: "gamura",
    name: "GAMURA",
    cat: "Platform",
    tag: "The home of everything Gamura",
    desc: "Gamura is the main hub of the ecosystem: gaming, tools and creator features in one fast web experience. Explore features and jump into every Gamura app from one place.",
    url: "https://gamura.vercel.app/",
    c1: "#34d399",
    c2: "#059669",
    iconKind: "g-outline",
    ...driveLogo("1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x"),
    rating: 4.9,
    version: "3.4",
    age: "3+",
    chart: "No. 1",
    dl: "10K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-ai",
    name: "GAMURA AI",
    cat: "AI",
    tag: "Intelligent assistant & creation suite",
    desc: "GAMURA AI brings smart generation, fast answers, and productivity workflows together in one clean web experience.",
    url: "https://gamura.netlify.app/",
    c1: "#38bdf8",
    c2: "#2563eb",
    iconKind: "sparkles",
    ...driveLogo("13tcEyolbVvBRSozc2-J-NcPQYQGDCcoC"),
    rating: 4.9,
    version: "3.1",
    age: "3+",
    chart: "No. 1 AI",
    dl: "6K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gcp",
    name: "GAMURA CODE PREVIEW (GCP)",
    cat: "Developer tools",
    tag: "Write code. See it live.",
    desc: "Gamura Code Preview (GCP) lets you write HTML, CSS and JavaScript and instantly preview the result in your browser. Built for students and developers who ship fast.",
    url: "https://gamuracp.vercel.app/",
    c1: "#fbbf24",
    c2: "#d97706",
    iconKind: "code",
    ...driveLogo("1m5BQU-4xvdapNsi4tos5iM2cFmasKfGc"),
    rating: 4.8,
    version: "2.6",
    age: "3+",
    chart: "No. 1 Dev",
    dl: "4K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "bububai",
    name: "BUBUBAI",
    cat: "AI",
    tag: "Friendly conversational AI companion",
    desc: "BUBUBAI is an approachable web companion for quick brainstorming, study help, and everyday questions.",
    url: "https://bububai.vercel.app/",
    c1: "#a78bfa",
    c2: "#6d28d9",
    iconKind: "sparkles",
    ...driveLogo("1YQ_yqbUkfjuIDrM6rH1IYThahwYLReZw"),
    rating: 4.8,
    version: "2.1",
    age: "3+",
    chart: "No. 2 AI",
    dl: "3K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gainosor",
    name: "GAINOSOR",
    cat: "Games",
    tag: "High-speed arcade survival adventure",
    desc: "Play GAINOSOR directly from Gamura Launch Store. Fast-paced responsive arcade action engineered for mobile and desktop browsers.",
    url: "https://gainosor.vercel.app/",
    c1: "#10b981",
    c2: "#065f46",
    iconKind: "gainosor",
    ...driveLogo("1b9yNo3yTx-NTOmcmmzhLfFSKtI9P-_y9"),
    rating: 4.9,
    version: "1.8",
    age: "3+",
    chart: "No. 1 Game",
    dl: "5K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gigor",
    name: "GIGOR",
    cat: "Games",
    tag: "Kinetic reflex & precision challenge game",
    desc: "Play GIGOR directly from Gamura Launch Store. Test your reflexes, climb high scores, and install straight to your Universe Apps dock or mobile home.",
    url: "https://gigor.vercel.app/",
    c1: "#f97316",
    c2: "#dc2626",
    iconKind: "gigor",
    rating: 4.9,
    version: "1.5",
    age: "3+",
    chart: "No. 2 Game",
    dl: "4K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "musong",
    name: "MUSONG",
    cat: "Music & Audio",
    tag: "Stream & vibe to your favorite tracks",
    desc: "MUSONG delivers fast music playback, clean controls, and curated listening directly from your browser.",
    url: "https://musong.vercel.app/",
    c1: "#ec4899",
    c2: "#7e22ce",
    iconKind: "music",
    rating: 4.8,
    age: "3+",
    chart: "No. 1 Audio",
    dl: "3K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "world",
    name: "GAMURA WORLD",
    cat: "Platform",
    tag: "Every Gamura venture. One world.",
    desc: "Gamura World is the unified project hub that connects all Gamura ventures: apps, games, tools and news in one world.",
    url: "https://gamuraworld.vercel.app/",
    c1: "#f87171",
    c2: "#9f1239",
    iconKind: "globe",
    rating: 4.8,
    age: "3+",
    chart: "No. 2",
    dl: "2K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "only-calc",
    name: "ONLY CALC",
    cat: "Utilities",
    tag: "Fast, distraction-free smart calculator",
    desc: "ONLY CALC gives you instant arithmetic and scientific calculations in a clean, minimal interface.",
    url: "https://onlycalc.netlify.app/",
    c1: "#0ea5e9",
    c2: "#0369a1",
    iconKind: "calc",
    rating: 4.8,
    age: "3+",
    chart: "No. 1 Utility",
    dl: "2K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "sr-portfolio",
    name: "SR PORTFOLIO",
    cat: "Portfolio",
    tag: "Official Selvaranjan showcase & works",
    desc: "Explore Selvaranjan's portfolio, creations, applications, and developer milestones on the official web experience.",
    url: "https://selvaranjan.netlify.app/",
    c1: "#334155",
    c2: "#0f172a",
    iconKind: "user",
    ...driveLogo("1mpwHuKJMbXaOgnIAXVZNFrVW8Pmp-g-K"),
    rating: 4.9,
    age: "3+",
    chart: "Featured",
    dl: "3K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-art",
    name: "GAMURA ART",
    cat: "Creative",
    tag: "Digital canvas, illustrations & art studio",
    desc: "Create artwork, sketch ideas, and explore visual art pieces in the GAMURA ART web studio.",
    url: "https://artgamura.vercel.app/",
    c1: "#f43f5e",
    c2: "#9333ea",
    iconKind: "art",
    rating: 4.8,
    age: "3+",
    chart: "Featured",
    dl: "2K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "galaxy",
    name: "GAMURA GALAXY",
    cat: "Games",
    tag: "Explore the Gamura universe",
    desc: "Gamura Galaxy is the gaming universe of Gamura. Discover games, challenges and community content inside a glowing galaxy-style interface.",
    url: "https://gamuragalaxy.vercel.app/",
    c1: "#60a5fa",
    c2: "#1d4ed8",
    iconKind: "orbit",
    ...driveLogo("1TqxgExM7o866SAgpNri0R-mx0sZtCtc3"),
    rating: 4.8,
    age: "3+",
    chart: "No. 3 Game",
    dl: "5K+",
    size: "Web · 3 MB",
    isBuiltin: true,
  },
  {
    id: "gro-gamura-rollout",
    name: "GRO GAMURA ROLLOUT",
    cat: "Platform",
    tag: "New releases, rollouts & live updates",
    desc: "Track every Gamura feature rollout, launch milestone, and upcoming web release in real time.",
    url: "https://gamuraro.vercel.app/",
    c1: "#14b8a6",
    c2: "#0f766e",
    iconKind: "orbit",
    ...driveLogo("1EdWkXkqrPiigNUdHmDIOLg8kU8fDFSV3"),
    rating: 4.8,
    age: "3+",
    chart: "Trending",
    dl: "2K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gtrade",
    name: "GAMURA TRADE (Gtrade)",
    cat: "Finance",
    tag: "Market insights & smart trading hub",
    desc: "GAMURA TRADE (Gtrade) provides clean market tracking, live metrics, and portfolio tools in your browser.",
    url: "https://gamuratrade.netlify.app/",
    c1: "#22c55e",
    c2: "#15803d",
    iconKind: "chart",
    ...driveLogo("14cikzfsCYvY3Vf3JdyiF9U9V6BwMnUe3"),
    rating: 4.8,
    age: "3+",
    chart: "Top Finance",
    dl: "3K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-notes",
    name: "GAMURA NOTES",
    cat: "Productivity",
    tag: "Fast notes, checklists & ideas notebook",
    desc: "Capture quick thoughts, organize notebooks, and stay productive anywhere with GAMURA NOTES.",
    url: "https://gnotebook.netlify.app/",
    c1: "#eab308",
    c2: "#ca8a04",
    iconKind: "notes",
    ...driveLogo("1f5bGh0tLZcDMa8Yjv7No0hu6YCJgWByz"),
    rating: 4.8,
    age: "3+",
    chart: "Top Notes",
    dl: "2K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "goakok",
    name: "GO ASK OKAY (GOAKOK)",
    cat: "AI",
    tag: "Ask anything and get clear answers fast",
    desc: "GO ASK OKAY (GOAKOK) helps you ask quick questions, explore topics, and find helpful answers immediately.",
    url: "https://goakok.vercel.app/",
    c1: "#6366f1",
    c2: "#4338ca",
    iconKind: "sparkles",
    ...driveLogo("1iD1_ju6b7X3Djp1x6PIY_pOvUhPD7ivL"),
    rating: 4.8,
    age: "3+",
    chart: "Trending",
    dl: "2K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-clip",
    name: "GAMURA CLIP",
    cat: "Utilities",
    tag: "Copy here. Paste there across devices.",
    desc: "Send text, links, images and files between your phone and laptop with a six-letter room code. Add a PIN for AES-256 encryption, QR sharing, auto-expiring clips, and Firebase room sync.",
    url: "/clip",
    c1: "#34d399",
    c2: "#0f9f6e",
    iconKind: "clip",
    rating: 4.9,
    version: "2.2",
    age: "3+",
    chart: "No. 1 Utility",
    dl: "Featured",
    size: "Web · 1 MB",
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
    iconKind: "pdf",
    rating: 4.9,
    version: "2.9",
    age: "3+",
    chart: "Top Productivity",
    dl: "4K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "veo",
    name: "Gamura Veo",
    cat: "Creative",
    tag: "Create, edit & export videos with Motion FX",
    desc: "Gamura Veo is the full browser video studio inside Gamura. Merge clips, trim, convert photos to motion videos, apply Aura looks, add captions, music, voiceover, and export in MP4, WebM, MOV, MKV, GIF, WAV, PNG & JPEG.",
    url: "/veo",
    c1: "#34d399",
    c2: "#0284c7",
    logoUrl: GAMURA_VEO_LOGO_URL,
    logoFallbackUrl: GAMURA_VEO_LOGO_FALLBACK,
    rating: 4.9,
    version: "3.0",
    age: "3+",
    chart: "Featured",
    dl: "Featured",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-calculator",
    name: "GAMURA CALCULATOR",
    cat: "Utilities",
    tag: "Scientific calculator, 13 converters, finance & math lab",
    desc: "GAMURA CALCULATOR delivers a full scientific keypad with memory and history, 13 unit converters, Finance calculators (Currency, GST, Investment/SIP, Loan/EMI), and an interactive Math Lab with live function graphing, equation solvers, statistics, and physics constants.",
    url: "/calculator",
    c1: "#3a3a3c",
    c2: "#1c1c1e",
    iconKind: "calc",
    logoUrl: GAMURA_CALC_LOGO_URL,
    logoFallbackUrl: GAMURA_CALC_LOGO_FALLBACK,
    rating: 4.9,
    version: "2.4",
    age: "3+",
    chart: "No. 1 Utility",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-camera",
    name: "GAMURA CAMERA",
    cat: "Creative",
    tag: "Pro live camera, 26 filters, RAW-grade adjust & video",
    desc: "GAMURA CAMERA (CG PIC) delivers a pro browser camera & Apple-grade photo studio: live 26-filter viewfinder, HDR, grid level, timer, 1x-3x zoom, video recording, 11 tonal adjustments, Auto Enhance, straighten, aspect crops, frames, watermark & full-resolution export.",
    url: "/camera",
    c1: "#30d158",
    c2: "#050b08",
    iconKind: "camera",
    logoUrl: GAMURA_CAMERA_LOGO_URL,
    logoFallbackUrl: GAMURA_CAMERA_LOGO_FALLBACK,
    rating: 4.9,
    version: "2.5",
    age: "3+",
    chart: "No. 1 Camera",
    dl: "Featured",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-messenger",
    name: "GAMURA MESSENGER",
    cat: "Communication",
    tag: "End-to-end encrypted chats, calls & AES-256 Vault",
    desc: "Every message is sealed on your device using ECDH P-256 key exchange and AES-256-GCM encryption. Enjoy private chats with safety number verification, voice and video calls, disappearing messages, and an offline PBKDF2 AES-256 Vault.",
    url: "/messenger",
    c1: "#ff3b47",
    c2: "#c4151f",
    iconKind: "messenger",
    rating: 4.9,
    version: "2.0",
    age: "12+",
    chart: "No. 1 Social",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-numbers",
    name: "GAMURA NUMBERS",
    cat: "Utilities",
    tag: "Explore numbers, primes, sequences & live math insights",
    desc: "GAMURA NUMBERS lets you explore mathematical numbers, factorizations, number systems, conversions, and numerical patterns cleanly in your browser.",
    url: "https://gamuranumbers.netlify.app/",
    c1: "#10b981",
    c2: "#047857",
    iconKind: "numbers",
    rating: 4.9,
    version: "2.0",
    age: "3+",
    chart: "Featured",
    dl: "3K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gfiles",
    name: "Gfiles",
    cat: "Utilities",
    tag: "Gamura File Manager System (GMS) · Browse, clean & vault",
    desc: "Gfiles (Gamura File Manager System · GMS) brings Apple Files simplicity to your browser: browse internal folders, preview images/video/audio/PDFs, edit text files, lock Private Files behind a 4-digit PIN, recover Trash for 30 days, and optimize storage locally.",
    url: "/gfiles",
    c1: "#0a84ff",
    c2: "#0055d4",
    iconKind: "gfiles",
    rating: 4.9,
    version: "1.0",
    age: "3+",
    chart: "No. 1 Files",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "buysell",
    name: "BUYSELL",
    cat: "Marketplace",
    tag: "Buy, sell & trade seamlessly in the Gamura marketplace",
    desc: "BUYSELL (GS Marketplace) lets you discover curated listings, post items for sale, connect with buyers and sellers, and manage deals fast inside an Apple-clean marketplace web experience.",
    url: "https://gbuysell.vercel.app/",
    c1: "#27272a",
    c2: "#09090b",
    iconKind: "buysell",
    logoUrl: GAMURA_BUYSELL_LOGO_URL,
    logoFallbackUrl: GAMURA_BUYSELL_LOGO_FALLBACK,
    logoBg: "#0a0b0e",
    logoFit: "cover",
    rating: 4.9,
    version: "1.0",
    age: "12+",
    chart: "No. 1 Shopping",
    dl: "Featured",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-links",
    name: "LINKS (GAMURA LINKS)",
    cat: "Utilities",
    tag: "Short links, QR codes & live click insights",
    desc: "LINKS (GAMURA LINKS) creates clean short links (gamura.vercel.app/x/...), scannable QR codes with PNG export, and real-time analytics showing weekly clicks, devices, and countries.",
    url: "/links",
    c1: "#0fa874",
    c2: "#0a7d57",
    iconKind: "links",
    rating: 4.9,
    version: "1.0",
    age: "3+",
    chart: "No. 1 Links",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-resume",
    name: "RESUME MAKER (GAMURA RESUME)",
    cat: "Productivity",
    tag: "Live A4 resume builder, templates & PDF export",
    desc: "RESUME MAKER (GAMURA RESUME) gives you live A4 preview as you type across Aurora, Clean, and Classic serif templates, accent color swatches, AI-style bullet sharpening, resume strength scoring, and clean PDF export.",
    url: "/resume",
    c1: "#10b981",
    c2: "#047857",
    iconKind: "resume",
    rating: 4.9,
    version: "1.0",
    age: "3+",
    chart: "No. 1 Career",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-pb1",
    name: "PORTFOLIO BUILDER ¹ (PB¹)",
    cat: "Portfolio",
    tag: "Apple-style personal portfolio, showcase & gallery builder",
    desc: "PORTFOLIO BUILDER ¹ (PB¹) lets you create an Apple-grade personal portfolio with live Edit & Preview modes, custom accent colors, photo compression for projects & certificates, an image/video masonry gallery with lightbox zoom, automatic/light/dark appearance, and one-click HTML export.",
    url: "/pb1",
    c1: "#0071e3",
    c2: "#bf5af2",
    iconKind: "pb1",
    rating: 4.9,
    version: "1.0",
    age: "3+",
    chart: "No. 1 Portfolio",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "gamura-pb2",
    name: "PORTFOLIO BUILDER²(PB²)",
    cat: "Portfolio",
    tag: "Multi-page visual block portfolio & modular site studio",
    desc: "PORTFOLIO BUILDER²(PB²) lets you build multi-page Apple-style portfolio websites right on the canvas: add/reorder/edit modular Hero, Text, Skills, Cards, Gallery, Links & Contact sections, manage custom pages and URL slugs, customize fonts, radius corners, accent colors & themes, and export a full multi-page site.",
    url: "/pb2",
    c1: "#5e5ce6",
    c2: "#bf5af2",
    iconKind: "pb2",
    rating: 4.9,
    version: "2.0",
    age: "3+",
    chart: "No. 2 Portfolio",
    dl: "Featured",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
];

export function getAppVersion(app: StoreAppItem): string {
  if (app.version && app.version.trim()) return app.version.trim();
  return app.isBuiltin ? "2.0" : "1.0";
}

export function readStoreJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoreJson(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage errors
  }
}

export function getAllStoreApps(): StoreAppItem[] {
  const custom = readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []);
  return [...BUILTIN_STORE_APPS, ...custom];
}

export function getUniverseInstalledApps(): StoreAppItem[] {
  return readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
}

export function addAppToUniverse(app: StoreAppItem): StoreAppItem[] {
  const existing = getUniverseInstalledApps();
  const next = [app, ...existing.filter((x) => x.id !== app.id)];
  writeStoreJson(UNIVERSE_APPS_KEY, next);
  window.dispatchEvent(new CustomEvent(UNIVERSE_APPS_EVENT));
  return next;
}

export function removeAppFromUniverse(appId: string): StoreAppItem[] {
  const existing = getUniverseInstalledApps();
  const next = existing.filter((x) => x.id !== appId);
  writeStoreJson(UNIVERSE_APPS_KEY, next);
  window.dispatchEvent(new CustomEvent(UNIVERSE_APPS_EVENT));
  return next;
}

export function getMobileInstalledIds(): string[] {
  return readStoreJson<string[]>(MOBILE_APPS_KEY, []);
}

export function addMobileInstalledId(appId: string): string[] {
  const existing = getMobileInstalledIds();
  const next = existing.includes(appId) ? existing : [...existing, appId];
  writeStoreJson(MOBILE_APPS_KEY, next);
  return next;
}

export function removeMobileInstalledId(appId: string): string[] {
  const existing = getMobileInstalledIds();
  const next = existing.filter((x) => x !== appId);
  writeStoreJson(MOBILE_APPS_KEY, next);
  return next;
}

export function downloadStandaloneAppPackage(app: StoreAppItem) {
  if (typeof window === "undefined") return;
  const resolvedUrl = app.url.startsWith("/")
    ? `${window.location.origin}${app.url}`
    : app.url;
  const safeName = app.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const logoMarkup = app.logoUrl
    ? `<div class="ic" style="background:#fff;border:1px solid rgba(0,0,0,.08);padding:8px;box-sizing:border-box"><img src="${app.logoUrl}" alt="${app.name}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:contain" /></div>`
    : `<div class="ic">${app.name.trim().charAt(0).toUpperCase()}</div>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${app.name} · Gamura App</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;color:#1D1D1F;padding:24px}
    .card{max-width:400px;width:100%;background:#fff;border-radius:28px;padding:32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.08);border:1px solid rgba(0,0,0,.06)}
    .ic{width:76px;height:76px;border-radius:20px;margin:0 auto 18px;display:grid;place-items:center;color:#fff;font-size:32px;font-weight:700;background:linear-gradient(145deg,${app.c1},${app.c2})}
    h1{margin:0 0 6px;font-size:22px;letter-spacing:-.02em}
    p{margin:0 0 24px;color:#6E6E73;font-size:14px;line-height:1.45}
    a{display:inline-block;width:100%;padding:13px 20px;border-radius:999px;background:#059669;color:#fff;font-weight:600;font-size:15px;text-decoration:none;box-sizing:border-box}
  </style>
</head>
<body>
  <div class="card">
    ${logoMarkup}
    <h1>${app.name}</h1>
    <p>${app.tag}</p>
    <a href="${resolvedUrl}" rel="noopener noreferrer">Launch ${app.name}</a>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName || "gamura"}-app.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

interface StoredRatingMap {
  [appId: string]: number;
}

export function getAppRatingStats(app: StoreAppItem): {
  average: number;
  totalVotes: number;
  userRating: number;
} {
  const ratings = readStoreJson<StoredRatingMap>(APP_RATINGS_KEY, {});
  const userRating = Number(ratings[app.id] || 0);
  const baseVotes = app.isBuiltin ? 120 : 12;
  if (userRating > 0) {
    const weighted = Number(
      (((app.rating || 4.8) * baseVotes + userRating) / (baseVotes + 1)).toFixed(1),
    );
    return {
      average: weighted,
      totalVotes: baseVotes + 1,
      userRating,
    };
  }
  return {
    average: Number((app.rating || 4.8).toFixed(1)),
    totalVotes: baseVotes,
    userRating: 0,
  };
}

export function rateStoreApp(app: StoreAppItem, stars: number) {
  const clamped = Math.max(1, Math.min(5, Math.round(stars)));
  const current = readStoreJson<StoredRatingMap>(APP_RATINGS_KEY, {});
  const next = { ...current, [app.id]: clamped };
  writeStoreJson(APP_RATINGS_KEY, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APP_RATINGS_EVENT));
  }
  return getAppRatingStats(app);
}
