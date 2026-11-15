export type StoreIconKind =
  | "g-outline"
  | "orbit"
  | "code"
  | "globe"
  | "pdf"
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
  rating: number;
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

export const BUILTIN_STORE_APPS: StoreAppItem[] = [
  {
    id: "gamura",
    name: "Gamura",
    cat: "Platform",
    tag: "The home of everything Gamura",
    desc: "Gamura is the main hub of the ecosystem: gaming, tools and creator features in one cinematic, fast web experience. Create your profile, explore features and jump into every Gamura app from one place.",
    url: "https://gamura.vercel.app/",
    c1: "#34d399",
    c2: "#059669",
    iconKind: "g-outline",
    rating: 4.9,
    age: "3+",
    chart: "No. 1",
    dl: "10K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "galaxy",
    name: "Gamura Galaxy",
    cat: "Games",
    tag: "Explore the Gamura universe",
    desc: "Gamura Galaxy is the gaming universe of Gamura. Discover games, challenges and community content inside a glowing galaxy-style interface.",
    url: "https://gamuragalaxy.vercel.app/",
    c1: "#60a5fa",
    c2: "#1d4ed8",
    iconKind: "orbit",
    rating: 4.8,
    age: "3+",
    chart: "No. 2",
    dl: "5K+",
    size: "Web · 3 MB",
    isBuiltin: true,
  },
  {
    id: "gcp",
    name: "GCP · Gamura Code Preview",
    cat: "Developer tools",
    tag: "Write code. See it live.",
    desc: "Gamura Code Preview (GCP) lets you write HTML, CSS and JavaScript and instantly preview the result in your browser. Built for students and developers who ship fast.",
    url: "https://gamuracp.vercel.app/",
    c1: "#fbbf24",
    c2: "#d97706",
    iconKind: "code",
    rating: 4.7,
    age: "3+",
    chart: "No. 3",
    dl: "3K+",
    size: "Web · 1 MB",
    isBuiltin: true,
  },
  {
    id: "world",
    name: "Gamura World",
    cat: "Platform",
    tag: "Every Gamura venture. One world.",
    desc: "Gamura World is the unified project hub that connects all Gamura ventures: apps, games, tools and news in one world.",
    url: "https://gamuraworld.vercel.app/",
    c1: "#f87171",
    c2: "#9f1239",
    iconKind: "globe",
    rating: 4.8,
    age: "3+",
    chart: "No. 4",
    dl: "2K+",
    size: "Web · 2 MB",
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
    age: "3+",
    chart: "No. 5",
    dl: "4K+",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
  {
    id: "veo",
    name: "Gamura Veo",
    cat: "Creative",
    tag: "Create, edit & export videos with Motion FX",
    desc: "Gamura Veo is the full browser video studio inside Gamura. Merge clips, convert photos to motion videos, apply Aura looks, add captions, music, voiceover, and logo watermarks, and export in HD or Full HD MP4/WebM.",
    url: "/veo",
    c1: "#34d399",
    c2: "#0284c7",
    logoUrl: GAMURA_VEO_LOGO_URL,
    logoFallbackUrl: GAMURA_VEO_LOGO_FALLBACK,
    rating: 4.9,
    age: "3+",
    chart: "No. 1",
    dl: "Featured",
    size: "Web · 2 MB",
    isBuiltin: true,
  },
];

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
