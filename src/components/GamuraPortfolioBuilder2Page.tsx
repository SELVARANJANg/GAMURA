import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Lock,
  MapPin,
  Menu,
  Moon,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Video,
  X,
} from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

interface GamuraPortfolioBuilder2PageProps {
  onBackHome: () => void;
}

type FontChoice = "sys" | "serif" | "mono";
type ThemeChoice = "auto" | "light" | "dark";
type BlockType =
  | "hero"
  | "text"
  | "skills"
  | "cards"
  | "gallery"
  | "links"
  | "contact";

interface CardItem {
  t: string;
  d: string;
  img: string;
  u: string;
}

interface GalleryItem {
  type: "image" | "video";
  src: string;
  cap: string;
}

interface LinkItem {
  l: string;
  u: string;
}

interface HeroBlock {
  id: string;
  t: "hero";
  name: string;
  title: string;
  loc: string;
  avatar: string;
  email: string;
  cta: string;
}

interface TextBlock {
  id: string;
  t: "text";
  h: string;
  body: string;
}

interface SkillsBlock {
  id: string;
  t: "skills";
  h: string;
  list: string;
}

interface CardsBlock {
  id: string;
  t: "cards";
  h: string;
  items: CardItem[];
}

interface GalleryBlock {
  id: string;
  t: "gallery";
  h: string;
  items: GalleryItem[];
}

interface LinksBlock {
  id: string;
  t: "links";
  h: string;
  items: LinkItem[];
}

interface ContactBlock {
  id: string;
  t: "contact";
  h: string;
  note: string;
  email: string;
  cta: string;
}

type PortfolioBlock =
  | HeroBlock
  | TextBlock
  | SkillsBlock
  | CardsBlock
  | GalleryBlock
  | LinksBlock
  | ContactBlock;

interface PortfolioPageEntry {
  id: string;
  n: string;
  s: string;
  b: PortfolioBlock[];
}

interface SiteConfig {
  brand: string;
  ac: string;
  font: FontChoice;
  theme: ThemeChoice;
  r: number;
}

interface PortfolioV2State {
  site: SiteConfig;
  pages: PortfolioPageEntry[];
}

type SheetKind = "menu" | "pages" | "style" | "add" | "edit" | null;

type PendingUpload =
  | { blockId: string; kind: "av" }
  | { blockId: string; kind: "it"; itemIdx: number }
  | { blockId: string; kind: "gal" }
  | null;

export const GAMURA_PF_V2_KEY = "gamura_pf_v2";

const ACCENT_SWATCHES = [
  "#0071e3",
  "#30d158",
  "#ff375f",
  "#bf5af2",
  "#ff9f0a",
  "#1d1d1f",
];

const RESERVED_SLUGS = [
  "settings",
  "sidebar",
  "customize",
  "upgrade",
  "downloads",
];

const FONT_STACKS: Record<FontChoice, string> = {
  sys: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: '"New York", Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const BLOCK_TYPE_LABELS: { type: BlockType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Text" },
  { type: "skills", label: "Skills" },
  { type: "cards", label: "Cards (projects, certificates)" },
  { type: "gallery", label: "Gallery (images, videos)" },
  { type: "links", label: "Links" },
  { type: "contact", label: "Contact" },
];

const RADIUS_OPTIONS = [
  { value: 6, label: "Sharp" },
  { value: 14, label: "Soft" },
  { value: 22, label: "Round" },
  { value: 32, label: "Extra round" },
];

function genUid(): string {
  return Math.random().toString(36).slice(2, 8);
}

function createBlock(type: BlockType, heading?: string): PortfolioBlock {
  const id = genUid();
  switch (type) {
    case "hero":
      return {
        id,
        t: "hero",
        name: "Alex Morgan",
        title: "Designer & Developer",
        loc: "Chennai, India",
        avatar: "",
        email: "",
        cta: "Contact me",
      };
    case "text":
      return {
        id,
        t: "text",
        h: heading || "About",
        body: "Write your story here. Tap Edit on this section to change it.",
      };
    case "skills":
      return {
        id,
        t: "skills",
        h: heading || "Skills",
        list: "Design, Web Development, Photography",
      };
    case "cards":
      return {
        id,
        t: "cards",
        h: heading || "Projects",
        items: [
          {
            t: "First Project",
            d: "A short description of what you built.",
            img: "",
            u: "",
          },
        ],
      };
    case "gallery":
      return {
        id,
        t: "gallery",
        h: heading || "Gallery",
        items: [],
      };
    case "links":
      return {
        id,
        t: "links",
        h: heading || "Links",
        items: [
          { l: "GitHub", u: "" },
          { l: "LinkedIn", u: "" },
        ],
      };
    case "contact":
      return {
        id,
        t: "contact",
        h: heading || "Let’s talk",
        note: "I’d love to hear about your project.",
        email: "",
        cta: "Send email",
      };
  }
}

function createDefaultState(): PortfolioV2State {
  const certBlock = createBlock("cards", "Certificates") as CardsBlock;
  certBlock.items[0].t = "Certificate name";
  certBlock.items[0].d = "Issuer · 2026";
  return {
    site: {
      brand: "Alex Morgan",
      ac: ACCENT_SWATCHES[0],
      font: "sys",
      theme: "auto",
      r: 22,
    },
    pages: [
      {
        id: genUid(),
        n: "Home",
        s: "home",
        b: [createBlock("hero"), createBlock("skills")],
      },
      {
        id: genUid(),
        n: "About",
        s: "about",
        b: [createBlock("text")],
      },
      {
        id: genUid(),
        n: "Work",
        s: "work",
        b: [createBlock("cards"), certBlock],
      },
      {
        id: genUid(),
        n: "Gallery",
        s: "gallery",
        b: [createBlock("gallery")],
      },
      {
        id: genUid(),
        n: "Contact",
        s: "contact",
        b: [createBlock("contact"), createBlock("links")],
      },
    ],
  };
}

function normalizeUrl(raw: string): string {
  const u = (raw || "").trim();
  if (!u) return "";
  return /^(https?:|mailto:)/i.test(u) ? u : `https://${u}`;
}

function escHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeSlug(
  raw: string,
  pageId: string,
  pages: PortfolioPageEntry[],
): string {
  let slug =
    String(raw)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "page";
  if (RESERVED_SLUGS.includes(slug) || slug.startsWith("comment-")) {
    slug += "-page";
  }
  const base = slug;
  let counter = 2;
  while (pages.some((p) => p.id !== pageId && p.s === slug)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

function compressImage(
  file: File,
  maxDim: number,
  onSuccess: (dataUrl: string) => void,
  onError: (msg: string) => void,
) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onError("Could not process image.");
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        onSuccess(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        onError("Could not save compressed image.");
      }
    };
    img.onerror = () => onError("Could not read that image.");
    img.src = String(fr.result || "");
  };
  fr.onerror = () => onError("Could not read that image.");
  fr.readAsDataURL(file);
}

export default function GamuraPortfolioBuilder2Page({
  onBackHome,
}: GamuraPortfolioBuilder2PageProps) {
  const [state, setState] = useState<PortfolioV2State>(() => {
    try {
      const raw = localStorage.getItem(GAMURA_PF_V2_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.site &&
          Array.isArray(parsed.pages) &&
          parsed.pages.length > 0
        ) {
          return parsed as PortfolioV2State;
        }
      }
    } catch {
      // ignore storage errors
    }
    return createDefaultState();
  });

  const [currentSlug, setCurrentSlug] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const h = (window.location.hash || "").slice(1);
      if (h) return h;
    }
    return "home";
  });

  const [editMode, setEditMode] = useState<boolean>(true);
  const [sheet, setSheet] = useState<{ kind: SheetKind; blockId?: string }>({
    kind: null,
  });
  const [sheetFull, setSheetFull] = useState<boolean>(false);
  const [resetArmed, setResetArmed] = useState<boolean>(false);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
      : false,
  );

  const dragStartYRef = useRef<number>(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-pb2",
    ),
  );

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-pb2"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    try {
      const sanitized: PortfolioV2State = {
        ...state,
        pages: state.pages.map((p) => ({
          ...p,
          b: p.b.map((b) =>
            b.t === "gallery"
              ? {
                  ...b,
                  items: b.items.filter((m) => !m.src.startsWith("blob:")),
                }
              : b,
          ),
        })),
      };
      localStorage.setItem(GAMURA_PF_V2_KEY, JSON.stringify(sanitized));
    } catch {
      setToastMsg("Storage is full. Remove some images.");
    }
  }, [state]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  useEffect(() => {
    if (!resetArmed) return;
    const id = window.setTimeout(() => setResetArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [resetArmed]);

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || "").slice(1);
      if (h) setCurrentSlug(h);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) setLightboxSrc(null);
        else if (sheet.kind) closeSheet();
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxSrc, sheet.kind]);

  const currentPage = useMemo(
    () =>
      state.pages.find((p) => p.s === currentSlug) || state.pages[0],
    [state.pages, currentSlug],
  );

  const editingBlock = useMemo(() => {
    if (sheet.kind !== "edit" || !sheet.blockId) return null;
    for (const p of state.pages) {
      const found = p.b.find((b) => b.id === sheet.blockId);
      if (found) return found;
    }
    return null;
  }, [state.pages, sheet]);

  const isDark =
    state.site.theme === "dark" ||
    (state.site.theme === "auto" && systemPrefersDark);

  const showToast = (msg: string) => setToastMsg(msg);

  const navigatePage = (slug: string) => {
    setCurrentSlug(slug);
    try {
      window.location.hash = slug;
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSheet = (kind: SheetKind, blockId?: string) => {
    setSheet({ kind, blockId });
    setSheetFull(false);
    setVideoUrlInput("");
  };

  const closeSheet = () => {
    setSheet({ kind: null });
    setSheetFull(false);
    setResetArmed(false);
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-pb2");
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

  // Block operations
  const updateBlock = (
    blockId: string,
    updater: (block: PortfolioBlock) => PortfolioBlock,
  ) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => ({
        ...p,
        b: p.b.map((b) => (b.id === blockId ? updater(b) : b)),
      })),
    }));
  };

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        const idx = p.b.findIndex((b) => b.id === blockId);
        if (idx < 0) return p;
        const target = idx + dir;
        if (target < 0 || target >= p.b.length) return p;
        const copy = [...p.b];
        const tmp = copy[idx];
        copy[idx] = copy[target];
        copy[target] = tmp;
        return { ...p, b: copy };
      }),
    }));
  };

  const removeBlock = (blockId: string) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => ({
        ...p,
        b: p.b.filter((b) => b.id !== blockId),
      })),
    }));
    if (sheet.kind === "edit" && sheet.blockId === blockId) {
      closeSheet();
    }
  };

  const addBlockToCurrentPage = (type: BlockType) => {
    const created = createBlock(type);
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id ? { ...p, b: [...p.b, created] } : p,
      ),
    }));
    closeSheet();
    window.setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  };

  // Image & video file pickers
  const triggerImagePick = (req: PendingUpload) => {
    setPendingUpload(req);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload) return;
    const req = pendingUpload;
    compressImage(
      file,
      1100,
      (dataUrl) => {
        updateBlock(req.blockId, (block) => {
          if (req.kind === "av" && block.t === "hero") {
            return { ...block, avatar: dataUrl };
          }
          if (req.kind === "it" && block.t === "cards") {
            return {
              ...block,
              items: block.items.map((it, i) =>
                i === req.itemIdx ? { ...it, img: dataUrl } : it,
              ),
            };
          }
          if (req.kind === "gal" && block.t === "gallery") {
            return {
              ...block,
              items: [...block.items, { type: "image", src: dataUrl, cap: "" }],
            };
          }
          return block;
        });
        showToast("Image updated");
      },
      (msg) => showToast(msg),
    );
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload) return;
    const req = pendingUpload;
    const blobUrl = URL.createObjectURL(file);
    updateBlock(req.blockId, (block) =>
      block.t === "gallery"
        ? {
            ...block,
            items: [...block.items, { type: "video", src: blobUrl, cap: "" }],
          }
        : block,
    );
    showToast("Video plays this session. Use a video link to keep it.");
  };

  // Multi-page management
  const updatePageName = (pageId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === pageId ? { ...p, n: name } : p)),
    }));
  };

  const updatePageSlug = (pageId: string, rawSlug: string) => {
    setState((prev) => {
      const target = prev.pages.find((p) => p.id === pageId);
      if (!target) return prev;
      const oldSlug = target.s;
      const nextSlug = sanitizeSlug(rawSlug, pageId, prev.pages);
      if (currentSlug === oldSlug) {
        setCurrentSlug(nextSlug);
        try {
          window.location.hash = nextSlug;
        } catch {
          // ignore
        }
      }
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === pageId ? { ...p, s: nextSlug } : p,
        ),
      };
    });
  };

  const movePageOrder = (pageId: string, dir: -1 | 1) => {
    setState((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === pageId);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.pages.length) return prev;
      const copy = [...prev.pages];
      const tmp = copy[idx];
      copy[idx] = copy[nextIdx];
      copy[nextIdx] = tmp;
      return { ...prev, pages: copy };
    });
  };

  const deletePageById = (pageId: string) => {
    setState((prev) => {
      if (prev.pages.length < 2) return prev;
      const remaining = prev.pages.filter((p) => p.id !== pageId);
      if (!remaining.some((p) => p.s === currentSlug)) {
        setCurrentSlug(remaining[0].s);
      }
      return { ...prev, pages: remaining };
    });
  };

  const createNewPage = () => {
    setState((prev) => {
      const id = genUid();
      const s = sanitizeSlug("new-page", id, prev.pages);
      return {
        ...prev,
        pages: [
          ...prev.pages,
          {
            id,
            n: "New Page",
            s,
            b: [createBlock("text", "New page")],
          },
        ],
      };
    });
  };

  const handleResetAllTap = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setResetArmed(false);
    const fresh = createDefaultState();
    setState(fresh);
    setCurrentSlug(fresh.pages[0].s);
    closeSheet();
    showToast("Portfolio builder reset to defaults");
  };

  // Export multi-page static site HTML
  const handleExportSiteHtml = () => {
    const s = state.site;
    const renderBlockHtml = (b: PortfolioBlock): string => {
      if (b.t === "hero") {
        return `<section class="hero"><div class="av" style="${
          b.avatar ? `background-image:url('${b.avatar}')` : ""
        }"></div><h1>${escHtml(b.name)}</h1>${
          b.title ? `<p class="t">${escHtml(b.title)}</p>` : ""
        }${b.loc ? `<div class="loc">📍 ${escHtml(b.loc)}</div>` : ""}<div class="acts">${
          b.email.trim()
            ? `<a class="btn" href="mailto:${escHtml(b.email)}">${escHtml(
                b.cta || "Contact",
              )}</a>`
            : ""
        }</div></section>`;
      }
      if (b.t === "text") {
        return `<section><h3>${escHtml(b.h)}</h3><div class="about">${escHtml(
          b.body,
        )}</div></section>`;
      }
      if (b.t === "skills") {
        const list = b.list
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        return `<section><h3>${escHtml(b.h)}</h3><div class="chips">${list
          .map((x) => `<span>${escHtml(x)}</span>`)
          .join("")}</div></section>`;
      }
      if (b.t === "cards") {
        return `<section><h3>${escHtml(b.h)}</h3><div class="grid">${b.items
          .map(
            (x) =>
              `<div class="pc"><div class="im" style="${
                x.img ? `background-image:url('${x.img}')` : ""
              }"></div><div class="bd"><h4>${escHtml(
                x.t,
              )}</h4><p>${escHtml(x.d)}</p>${
                x.u.trim()
                  ? `<a target="_blank" rel="noopener noreferrer" href="${escHtml(
                      normalizeUrl(x.u),
                    )}">Open ›</a>`
                  : ""
              }</div></div>`,
          )
          .join("")}</div></section>`;
      }
      if (b.t === "gallery") {
        const savedMedia = b.items.filter((m) => !m.src.startsWith("blob:"));
        return `<section><h3>${escHtml(b.h)}</h3><div class="gal">${savedMedia
          .map(
            (m) =>
              `<figure>${
                m.type === "image"
                  ? `<img src="${m.src}" alt="${escHtml(m.cap)}" />`
                  : `<video controls playsinline src="${escHtml(
                      m.src,
                    )}"></video>`
              }${m.cap ? `<figcaption>${escHtml(m.cap)}</figcaption>` : ""}</figure>`,
          )
          .join("")}</div></section>`;
      }
      if (b.t === "links") {
        return `<section><h3>${escHtml(b.h)}</h3><div class="acts">${b.items
          .filter((x) => x.l.trim() && x.u.trim())
          .map(
            (x) =>
              `<a class="btn g" target="_blank" rel="noopener noreferrer" href="${escHtml(
                normalizeUrl(x.u),
              )}">${escHtml(x.l)}</a>`,
          )
          .join("")}</div></section>`;
      }
      return `<section class="ct"><h3>${escHtml(b.h)}</h3><p>${escHtml(
        b.note,
      )}</p><div class="acts">${
        b.email.trim()
          ? `<a class="btn" href="mailto:${escHtml(b.email)}">${escHtml(
              b.cta || "Email",
            )}</a>`
          : ""
      }</div></section>`;
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(s.brand || "Portfolio")} · Made with Gamura PB²</title>
<style>
:root{--bg:${isDark ? "#000" : "#fbfbfd"};--card:${
      isDark ? "#1c1c1e" : "#fff"
    };--tx:${isDark ? "#f5f5f7" : "#1d1d1f"};--tx2:${
      isDark ? "#98989d" : "#6e6e73"
    };--line:${isDark ? "#38383a" : "#d2d2d7"};--fill:${
      isDark ? "#2c2c2e" : "#ececf0"
    };--ac:${s.ac};--r:${s.r}px;--f:${FONT_STACKS[s.font]}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:var(--f);line-height:1.45}
.bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:color-mix(in srgb,var(--bg) 80%,transparent);backdrop-filter:blur(20px);border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:16px}
.nl{display:flex;gap:6px;flex-wrap:wrap}
.nl button{border:0;background:none;color:var(--tx2);font:500 14px var(--f);padding:6px 14px;border-radius:980px;cursor:pointer}
.nl button.on{background:var(--fill);color:var(--tx);font-weight:600}
.pf{max-width:980px;margin:0 auto;padding:0 20px}
.pg{display:none}.pg.on{display:block}
.hero{text-align:center;padding:64px 0 40px}
.av{width:136px;height:136px;border-radius:50%;margin:0 auto 24px;background:linear-gradient(135deg,var(--ac),#bf5af2) center/cover;box-shadow:0 12px 44px rgba(0,0,0,.2)}
h1{font-size:clamp(38px,9vw,76px);line-height:1.04;letter-spacing:-.035em;margin:0 0 10px}
.t{font-size:clamp(19px,4vw,28px);color:var(--tx2);margin:0 0 14px;font-weight:500}
.loc{color:var(--tx2);font-size:15px;margin-bottom:20px}
.acts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
section{padding:40px 0}
h3{font-size:clamp(28px,6vw,46px);letter-spacing:-.03em;margin:0 0 22px}
.about{font-size:clamp(18px,3.4vw,24px);line-height:1.55;max-width:760px;white-space:pre-wrap}
.chips{display:flex;flex-wrap:wrap;gap:10px}.chips span{background:var(--card);padding:9px 18px;border-radius:980px;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
.pc{background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,.07)}
.im{aspect-ratio:16/10;background:linear-gradient(135deg,var(--ac),#5e5ce6) center/cover}
.bd{padding:18px 20px 22px}.pc h4{margin:0 0 6px;font-size:21px}.pc p{margin:0;color:var(--tx2);font-size:15px}
.pc a{display:inline-block;margin-top:12px;color:var(--ac);font-weight:600;text-decoration:none}
.gal{columns:2 230px;column-gap:14px}.gal figure{margin:0 0 14px;break-inside:avoid;border-radius:calc(var(--r) - 4px);overflow:hidden;background:var(--card)}
.gal img,.gal video{width:100%;display:block}.gal figcaption{padding:10px 14px;font-size:14px;color:var(--tx2)}
.ct{text-align:center;background:var(--card);border-radius:var(--r);padding:44px 24px;margin:40px 0}
.btn{display:inline-flex;align-items:center;background:var(--ac);color:#fff;font-weight:600;padding:11px 20px;border-radius:980px;text-decoration:none}
.btn.g{background:var(--fill);color:var(--ac)}
.foot{text-align:center;padding:50px 0 36px;color:var(--tx2);font-size:11px;letter-spacing:.2em;text-transform:uppercase}
</style>
</head>
<body>
<div class="bar"><div class="brand">${escHtml(
      s.brand,
    )}</div><div class="nl">${state.pages
      .map(
        (p, idx) =>
          `<button class="${idx === 0 ? "on" : ""}" onclick="go('${escHtml(
            p.s,
          )}',this)">${escHtml(p.n)}</button>`,
      )
      .join("")}</div></div>
<div class="pf">${state.pages
      .map(
        (p, idx) =>
          `<div class="pg ${idx === 0 ? "on" : ""}" data-p="${escHtml(p.s)}">${p.b
            .map(renderBlockHtml)
            .join("")}</div>`,
      )
      .join("")}<div class="foot">Made with <b>GAMURA</b></div></div>
<script>
function go(s,btn){document.querySelectorAll('.pg').forEach(function(e){e.classList.toggle('on',e.getAttribute('data-p')===s)});document.querySelectorAll('.nl button').forEach(function(b){b.classList.toggle('on',b===btn)});window.scrollTo(0,0)}
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (s.brand || "portfolio")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${slug || "gamura"}-pb2-site.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported multi-page PB² site HTML");
  };

  // Visual theme tokens matching HTML spec
  const bgCls = isDark
    ? "bg-[#000000] text-[#f5f5f7]"
    : "bg-[#fbfbfd] text-[#1d1d1f]";
  const cardBg = isDark ? "bg-[#1c1c1e]" : "bg-white";
  const tx2 = isDark ? "text-[#98989d]" : "text-[#6e6e73]";
  const fillBg = isDark ? "bg-[#2c2c2e]" : "bg-[#ececf0]";
  const lineCls = isDark ? "border-[#38383a]" : "border-[#d2d2d7]/70";
  const sheetBg = isDark ? "bg-[#1c1c1e]" : "bg-[#f2f2f7]";
  const sheetCardBg = isDark ? "bg-[#2c2c2e]" : "bg-white";

  const accent = state.site.ac || "#0071e3";
  const radius = Number(state.site.r ?? 22);
  const fontFamily = FONT_STACKS[state.site.font] || FONT_STACKS.sys;

  const renderBlockContent = (block: PortfolioBlock) => {
    switch (block.t) {
      case "hero":
        return (
          <section className="text-center pt-14 pb-10">
            <div
              className="w-[136px] h-[136px] rounded-full mx-auto mb-6 shadow-[0_12px_44px_rgba(0,0,0,0.2)] bg-cover bg-center"
              style={{
                backgroundImage: block.avatar
                  ? `url('${block.avatar}')`
                  : `linear-gradient(135deg, ${accent}, #bf5af2)`,
              }}
            />
            <h1 className="text-[clamp(38px,9vw,76px)] leading-[1.04] tracking-[-0.035em] font-bold mb-2.5">
              {block.name}
            </h1>
            {block.title && (
              <p className={`text-[clamp(19px,4vw,28px)] font-medium mb-3.5 ${tx2}`}>
                {block.title}
              </p>
            )}
            {block.loc && (
              <div
                className={`inline-flex items-center justify-center gap-1.5 text-[15px] mb-5 ${tx2}`}
              >
                <MapPin size={15} />
                <span>{block.loc}</span>
              </div>
            )}
            {block.email.trim() && (
              <div className="flex justify-center flex-wrap gap-2.5">
                <a
                  href={`mailto:${block.email.trim()}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white text-[15px] font-semibold"
                  style={{ backgroundColor: accent }}
                >
                  {block.cta || "Contact"}
                </a>
              </div>
            )}
          </section>
        );

      case "text":
        return (
          <section className="py-10">
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-5">
              {block.h}
            </h3>
            <div className="text-[clamp(18px,3.4vw,24px)] leading-[1.55] max-w-[760px] whitespace-pre-wrap">
              {block.body}
            </div>
          </section>
        );

      case "skills": {
        const chips = block.list
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return (
          <section className="py-10">
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-5">
              {block.h}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {chips.map((sk, idx) => (
                <span
                  key={`${sk}-${idx}`}
                  className={`px-[18px] py-2 rounded-full font-medium shadow-[0_1px_3px_rgba(0,0,0,0.07)] ${cardBg}`}
                >
                  {sk}
                </span>
              ))}
            </div>
          </section>
        );
      }

      case "cards":
        return (
          <section className="py-10">
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-5">
              {block.h}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {block.items.map((item, idx) => (
                <div
                  key={`${block.id}-card-${idx}`}
                  style={{ borderRadius: `${radius}px` }}
                  className={`overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.07)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] transition-all duration-300 ${cardBg}`}
                >
                  <button
                    type="button"
                    disabled={!item.img}
                    onClick={() => item.img && setLightboxSrc(item.img)}
                    aria-label={item.img ? `Zoom ${item.t}` : item.t}
                    className={`w-full aspect-[16/10] bg-cover bg-center border-0 block ${
                      item.img ? "cursor-zoom-in" : "cursor-default"
                    }`}
                    style={{
                      backgroundImage: item.img
                        ? `url('${item.img}')`
                        : `linear-gradient(135deg, ${accent}, #5e5ce6)`,
                    }}
                  />
                  <div className="p-5 pb-[22px]">
                    <h4 className="text-[21px] font-bold tracking-[-0.01em] mb-1.5">
                      {item.t}
                    </h4>
                    <p className={`text-[15px] whitespace-pre-wrap ${tx2}`}>
                      {item.d}
                    </p>
                    {item.u.trim() && (
                      <a
                        href={normalizeUrl(item.u)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 font-semibold text-[15px] hover:underline"
                        style={{ color: accent }}
                      >
                        Open ›
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "gallery":
        return (
          <section className="py-10">
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-5">
              {block.h}
            </h3>
            {block.items.length === 0 ? (
              <p className={`text-sm ${tx2}`}>
                No media yet. Tap Edit on this section to upload images or videos.
              </p>
            ) : (
              <div className="columns-1 sm:columns-2 gap-3.5">
                {block.items.map((media, idx) => (
                  <figure
                    key={`${block.id}-media-${idx}`}
                    style={{ borderRadius: `${Math.max(6, radius - 4)}px` }}
                    className={`mb-3.5 break-inside-avoid overflow-hidden ${cardBg}`}
                  >
                    {media.type === "image" ? (
                      <img
                        src={media.src}
                        alt={media.cap || "Gallery item"}
                        onClick={() => setLightboxSrc(media.src)}
                        className="w-full block cursor-zoom-in"
                      />
                    ) : (
                      <video
                        controls
                        playsInline
                        src={media.src}
                        className="w-full block"
                      />
                    )}
                    {media.cap && (
                      <figcaption className={`px-3.5 py-2.5 text-sm ${tx2}`}>
                        {media.cap}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </section>
        );

      case "links":
        return (
          <section className="py-10">
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-5">
              {block.h}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {block.items
                .filter((x) => x.l.trim() && x.u.trim())
                .map((x, idx) => (
                  <a
                    key={`${block.id}-link-${idx}`}
                    href={normalizeUrl(x.u)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full font-semibold text-[15px] ${fillBg}`}
                    style={{ color: accent }}
                  >
                    {x.l}
                  </a>
                ))}
            </div>
          </section>
        );

      case "contact":
        return (
          <section
            style={{ borderRadius: `${radius}px` }}
            className={`text-center py-11 px-6 my-10 shadow-[0_2px_14px_rgba(0,0,0,0.07)] ${cardBg}`}
          >
            <h3 className="text-[clamp(28px,6vw,46px)] tracking-[-0.03em] font-bold mb-3">
              {block.h}
            </h3>
            <p className={`text-lg mb-5 ${tx2}`}>{block.note}</p>
            {block.email.trim() && (
              <div className="flex justify-center">
                <a
                  href={`mailto:${block.email.trim()}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white text-[15px] font-semibold"
                  style={{ backgroundColor: accent }}
                >
                  {block.cta || "Email"}
                </a>
              </div>
            )}
          </section>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${bgCls}`}
      style={{ fontFamily }}
    >
      {/* Hidden file pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFile}
      />

      {/* Apple Sticky Top Bar */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-xl backdrop-saturate-[1.8] border-b ${lineCls} ${
          isDark ? "bg-black/75" : "bg-[#fbfbfd]/75"
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">
          {/* Left: Home, Store & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${fillBg}`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden md:inline-flex min-h-[34px] px-3 rounded-full text-xs font-semibold items-center gap-1 whitespace-nowrap ${fillBg}`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={() => navigatePage(state.pages[0].s)}
              className="flex items-center gap-2 pl-1 min-w-0 cursor-pointer text-left"
            >
              <span
                className="w-7 h-7 rounded-[8px] text-white flex items-center justify-center font-extrabold text-[11px] tracking-tighter shrink-0 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #bf5af2)`,
                }}
              >
                PB<sup className="text-[7px] ml-0.5">2</sup>
              </span>
              <span className="font-bold text-[15px] tracking-[-0.2px] truncate max-w-[140px] sm:max-w-[200px]">
                {state.site.brand || "Portfolio"}
              </span>
            </button>
          </div>

          {/* Center: Multi-Page Nav Pills */}
          <nav
            aria-label="Portfolio pages"
            className="hidden md:flex flex-1 items-center justify-center gap-1 overflow-x-auto no-scrollbar"
          >
            {state.pages.map((p) => {
              const active = p.id === currentPage.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigatePage(p.s)}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? `${fillBg} font-semibold ${
                          isDark ? "text-white" : "text-[#1d1d1f]"
                        }`
                      : `${tx2} hover:opacity-80`
                  }`}
                >
                  {p.n}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Right Controls: Edit/Done, Universe Sync, Theme, Export, Menu Sheet */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditMode((v) => !v);
                if (editMode) closeSheet();
              }}
              style={editMode ? { backgroundColor: accent } : undefined}
              className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                editMode
                  ? "text-white shadow-xs"
                  : `${fillBg}`
              }`}
            >
              {editMode ? "Done" : "Edit"}
            </button>

            <button
              type="button"
              onClick={handleExportSiteHtml}
              title="Export Multi-Page Site HTML"
              aria-label="Export multi-page HTML"
              className={`hidden sm:inline-flex w-9 h-9 rounded-full items-center justify-center cursor-pointer ${fillBg}`}
              style={{ color: accent }}
            >
              <Download size={15} />
            </button>

            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  site: { ...prev.site, theme: isDark ? "light" : "dark" },
                }))
              }
              aria-label="Toggle Light/Dark theme"
              className={`hidden sm:inline-flex w-9 h-9 rounded-full items-center justify-center cursor-pointer ${fillBg}`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`min-h-[34px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : fillBg
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden lg:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openSheet("menu")}
              aria-label="Open PB2 Menu & Pages Sheet"
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${fillBg}`}
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 w-full">
        {editMode && (
          <div
            className={`w-max max-w-[90%] mx-auto mt-3.5 px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 ${fillBg} ${tx2}`}
          >
            <Lock size={12} />
            <span>yoursite.com/{currentPage.s}</span>
          </div>
        )}

        <div className="max-w-[980px] mx-auto px-5">
          {currentPage.b.length === 0 ? (
            <div className={`text-center py-24 ${tx2}`}>
              This page is empty.
              <br />
              Tap &ldquo;Add section&rdquo; to start.
            </div>
          ) : (
            currentPage.b.map((block, bIdx) =>
              editMode ? (
                <div
                  key={block.id}
                  className="relative my-3 rounded-[14px] outline-2 outline-dashed"
                  style={{
                    outlineColor: `${accent}80`,
                    outlineOffset: "4px",
                  }}
                >
                  {/* Floating Block Toolbar */}
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openSheet("edit", block.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-md cursor-pointer inline-flex items-center gap-1 ${
                        isDark ? "bg-[#1c1c1e]/90 text-white" : "bg-white/90 text-[#1d1d1f]"
                      }`}
                    >
                      <Pencil size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={bIdx === 0}
                      onClick={() => moveBlock(block.id, -1)}
                      aria-label="Move section up"
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md cursor-pointer disabled:opacity-40 ${
                        isDark ? "bg-[#1c1c1e]/90 text-white" : "bg-white/90 text-[#1d1d1f]"
                      }`}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={bIdx === currentPage.b.length - 1}
                      onClick={() => moveBlock(block.id, 1)}
                      aria-label="Move section down"
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md cursor-pointer disabled:opacity-40 ${
                        isDark ? "bg-[#1c1c1e]/90 text-white" : "bg-white/90 text-[#1d1d1f]"
                      }`}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      aria-label="Remove section"
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md cursor-pointer text-[#ff3b30] ${
                        isDark ? "bg-[#1c1c1e]/90" : "bg-white/90"
                      }`}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {renderBlockContent(block)}
                </div>
              ) : (
                <React.Fragment key={block.id}>
                  {renderBlockContent(block)}
                </React.Fragment>
              ),
            )
          )}

          {editMode && (
            <button
              type="button"
              onClick={() => openSheet("add")}
              style={{
                borderRadius: `${radius}px`,
                color: accent,
              }}
              className={`block w-full my-5 py-4 border-2 border-dashed ${lineCls} font-semibold text-base cursor-pointer hover:opacity-80 transition-opacity`}
            >
              ＋ Add section
            </button>
          )}

          <footer className="text-center pt-12 pb-10 space-y-3">
            <div className={`text-[11px] tracking-[0.2em] uppercase ${tx2}`}>
              Made with{" "}
              <strong className={isDark ? "text-white" : "text-[#1d1d1f]"}>
                GAMURA
              </strong>
            </div>
          </footer>
        </div>
      </main>

      {/* Slide-Up Inspector Sheet (#sheet) */}
      {sheet.kind && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={closeSheet}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio Builder Inspector"
            onClick={(e) => e.stopPropagation()}
            className={`fixed left-0 right-0 bottom-0 mx-auto max-w-[640px] ${
              sheetFull ? "h-[92vh]" : "h-[60vh] sm:h-[64vh]"
            } rounded-t-[26px] flex flex-col shadow-2xl transition-all duration-300 ${sheetBg}`}
          >
            {/* Grab Handle */}
            <div
              onPointerDown={(e) => {
                dragStartYRef.current = e.clientY;
              }}
              onPointerUp={(e) => {
                const dy = e.clientY - dragStartYRef.current;
                if (Math.abs(dy) < 6) setSheetFull((v) => !v);
                else if (dy < -40) setSheetFull(true);
                else if (dy > 60) {
                  if (sheetFull) setSheetFull(false);
                  else closeSheet();
                }
              }}
              className="pt-2.5 pb-1.5 cursor-grab touch-none"
            >
              <div
                className={`w-10 h-1.5 rounded-full mx-auto ${
                  isDark ? "bg-white/25" : "bg-[#d2d2d7]"
                }`}
              />
            </div>

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-4 pb-2.5 gap-2">
              {sheet.kind === "pages" || sheet.kind === "style" ? (
                <button
                  type="button"
                  onClick={() => openSheet("menu")}
                  style={{ color: accent }}
                  className="min-w-[68px] text-left font-semibold text-[15px] inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft size={17} />
                  <span>Menu</span>
                </button>
              ) : (
                <span className="min-w-[68px]" />
              )}

              <b className="text-[17px] truncate">
                {sheet.kind === "menu"
                  ? "Menu"
                  : sheet.kind === "pages"
                    ? "Pages & URLs"
                    : sheet.kind === "style"
                      ? "Site style"
                      : sheet.kind === "add"
                        ? "Add section"
                        : editingBlock
                          ? `Edit ${
                              BLOCK_TYPE_LABELS.find(
                                (b) => b.type === editingBlock.t,
                              )?.label.split(" ")[0] || "Section"
                            }`
                          : "Edit"}
              </b>

              <button
                type="button"
                onClick={closeSheet}
                style={{ color: accent }}
                className="min-w-[68px] text-right font-semibold text-[15px] cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Sheet Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
              {/* SHEET: MENU */}
              {sheet.kind === "menu" && (
                <>
                  <h2
                    className={`text-xs uppercase tracking-[0.5px] font-semibold mx-3 mt-2 mb-1.5 ${tx2}`}
                  >
                    Pages
                  </h2>
                  <div className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}>
                    {state.pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          closeSheet();
                          navigatePage(p.s);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 border-b last:border-b-0 ${lineCls} cursor-pointer text-left`}
                      >
                        <span className="text-[15px] font-medium">{p.n}</span>
                        <span className={`text-sm ${tx2}`}>
                          /{p.s}
                          {p.id === currentPage.id ? " ✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>

                  <h2
                    className={`text-xs uppercase tracking-[0.5px] font-semibold mx-3 mt-4 mb-1.5 ${tx2}`}
                  >
                    Customize
                  </h2>
                  <div className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}>
                    <button
                      type="button"
                      onClick={() => openSheet("pages")}
                      className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${lineCls} cursor-pointer text-left`}
                    >
                      <span className="text-[15px] inline-flex items-center gap-2">
                        <FileText size={16} />
                        <span>Manage pages &amp; URLs</span>
                      </span>
                      <ChevronRight size={16} className={tx2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openSheet("style")}
                      className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${lineCls} cursor-pointer text-left`}
                    >
                      <span className="text-[15px] inline-flex items-center gap-2">
                        <Palette size={16} />
                        <span>Site style</span>
                      </span>
                      <ChevronRight size={16} className={tx2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeSheet();
                        setEditMode((v) => !v);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${lineCls} cursor-pointer text-left`}
                    >
                      <span className="text-[15px] inline-flex items-center gap-2">
                        <Pencil size={15} />
                        <span>
                          {editMode ? "Finish editing" : "Edit this page"}
                        </span>
                      </span>
                      <ChevronRight size={16} className={tx2} />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportSiteHtml}
                      className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${lineCls} cursor-pointer text-left`}
                    >
                      <span className="text-[15px] inline-flex items-center gap-2">
                        <Download size={15} />
                        <span>Export multi-page HTML</span>
                      </span>
                      <ChevronRight size={16} className={tx2} />
                    </button>

                    <button
                      type="button"
                      onClick={handleResetAllTap}
                      className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer text-left text-[#ff3b30]"
                    >
                      <span className="text-[15px] font-medium inline-flex items-center gap-2">
                        <RotateCcw size={15} />
                        <span>
                          {resetArmed
                            ? "Tap again to erase everything"
                            : "Reset everything"}
                        </span>
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* SHEET: PAGES & URLS */}
              {sheet.kind === "pages" && (
                <div className="space-y-3 pt-1">
                  {state.pages.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                    >
                      <div
                        className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                      >
                        <label className="w-20 shrink-0 text-[15px]">
                          Name
                        </label>
                        <input
                          type="text"
                          value={p.n}
                          onChange={(e) => updatePageName(p.id, e.target.value)}
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                      <div
                        className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                      >
                        <label className="w-20 shrink-0 text-[15px]">URL</label>
                        <input
                          type="text"
                          defaultValue={p.s}
                          onBlur={(e) => updatePageSlug(p.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updatePageSlug(
                                p.id,
                                (e.target as HTMLInputElement).value,
                              );
                            }
                          }}
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 px-3.5 py-2.5 flex-wrap">
                        <span className={`flex-1 text-xs truncate ${tx2}`}>
                          yoursite.com/{p.s}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            closeSheet();
                            navigatePage(p.s);
                          }}
                          style={{ color: accent }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${fillBg}`}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePageOrder(p.id, -1)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer disabled:opacity-40 ${fillBg}`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === state.pages.length - 1}
                          onClick={() => movePageOrder(p.id, 1)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer disabled:opacity-40 ${fillBg}`}
                        >
                          ↓
                        </button>
                        {state.pages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deletePageById(p.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#ff3b30] cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={createNewPage}
                    style={{ backgroundColor: accent }}
                    className="w-full py-3 rounded-full text-white font-semibold text-[15px] cursor-pointer"
                  >
                    ＋ Create new page
                  </button>
                </div>
              )}

              {/* SHEET: SITE STYLE */}
              {sheet.kind === "style" && (
                <div className={`rounded-[14px] overflow-hidden mt-1 ${sheetCardBg}`}>
                  <div
                    className={`flex items-center gap-3 px-3.5 py-3 border-b ${lineCls}`}
                  >
                    <label className="w-24 shrink-0 text-[15px]">
                      Site name
                    </label>
                    <input
                      type="text"
                      value={state.site.brand}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          site: { ...prev.site, brand: e.target.value },
                        }))
                      }
                      className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                    />
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 px-3.5 py-3 border-b ${lineCls}`}
                  >
                    <label className="w-20 shrink-0 text-[15px]">Accent</label>
                    <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
                      {ACCENT_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Accent ${c}`}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              site: { ...prev.site, ac: c },
                            }))
                          }
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-full cursor-pointer border-2 ${
                            isDark ? "border-[#2c2c2e]" : "border-white"
                          } ${
                            state.site.ac.toLowerCase() === c.toLowerCase()
                              ? isDark
                                ? "ring-2 ring-white scale-105"
                                : "ring-2 ring-[#1d1d1f] scale-105"
                              : "ring-1 ring-black/15"
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        aria-label="Custom accent color"
                        value={state.site.ac}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            site: { ...prev.site, ac: e.target.value },
                          }))
                        }
                        className="w-8 h-8 border-0 p-0 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 px-3.5 py-3 border-b ${lineCls}`}
                  >
                    <label className="text-[15px]">Appearance</label>
                    <select
                      value={state.site.theme}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          site: {
                            ...prev.site,
                            theme: e.target.value as ThemeChoice,
                          },
                        }))
                      }
                      className="bg-transparent outline-none text-base text-right cursor-pointer"
                    >
                      <option value="auto">Automatic</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 px-3.5 py-3 border-b ${lineCls}`}
                  >
                    <label className="text-[15px]">Font</label>
                    <select
                      value={state.site.font}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          site: {
                            ...prev.site,
                            font: e.target.value as FontChoice,
                          },
                        }))
                      }
                      className="bg-transparent outline-none text-base text-right cursor-pointer"
                    >
                      <option value="sys">Modern</option>
                      <option value="serif">Classic serif</option>
                      <option value="mono">Mono</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <label className="text-[15px]">Corners</label>
                    <select
                      value={state.site.r}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          site: { ...prev.site, r: Number(e.target.value) },
                        }))
                      }
                      className="bg-transparent outline-none text-base text-right cursor-pointer"
                    >
                      {RADIUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* SHEET: ADD SECTION */}
              {sheet.kind === "add" && (
                <div className={`rounded-[14px] overflow-hidden mt-1 ${sheetCardBg}`}>
                  {BLOCK_TYPE_LABELS.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addBlockToCurrentPage(item.type)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 ${lineCls} cursor-pointer text-left`}
                    >
                      <span className="text-[15px] font-medium">
                        {item.label}
                      </span>
                      <span className={`text-base ${tx2}`}>＋</span>
                    </button>
                  ))}
                </div>
              )}

              {/* SHEET: EDIT SECTION */}
              {sheet.kind === "edit" && editingBlock && (
                <div className="space-y-3 pt-1">
                  {editingBlock.t === "hero" && (
                    <div className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}>
                      <div
                        className={`flex items-center gap-3 px-3.5 py-3 border-b ${lineCls}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            triggerImagePick({
                              blockId: editingBlock.id,
                              kind: "av",
                            })
                          }
                          className={`w-[60px] h-[60px] rounded-full shrink-0 flex items-center justify-center bg-cover bg-center cursor-pointer ${fillBg} ${tx2}`}
                          style={
                            editingBlock.avatar
                              ? {
                                  backgroundImage: `url('${editingBlock.avatar}')`,
                                }
                              : undefined
                          }
                        >
                          {!editingBlock.avatar && "＋"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerImagePick({
                              blockId: editingBlock.id,
                              kind: "av",
                            })
                          }
                          style={{ color: accent }}
                          className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${fillBg}`}
                        >
                          Choose photo
                        </button>
                        {editingBlock.avatar && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "hero" ? { ...b, avatar: "" } : b,
                              )
                            }
                            className="text-sm font-semibold text-[#ff3b30] cursor-pointer px-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {(
                        [
                          ["name", "Name"],
                          ["title", "Title"],
                          ["loc", "Location"],
                          ["email", "Email"],
                          ["cta", "Button"],
                        ] as const
                      ).map(([field, label]) => (
                        <div
                          key={field}
                          className={`flex items-center gap-3 px-3.5 py-2.5 border-b last:border-b-0 ${lineCls}`}
                        >
                          <label className="w-20 shrink-0 text-[15px]">
                            {label}
                          </label>
                          <input
                            type="text"
                            value={editingBlock[field]}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "hero"
                                  ? { ...b, [field]: e.target.value }
                                  : b,
                              )
                            }
                            className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {editingBlock.t === "text" && (
                    <div className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}>
                      <div
                        className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                      >
                        <label className="w-20 shrink-0 text-[15px]">
                          Heading
                        </label>
                        <input
                          type="text"
                          value={editingBlock.h}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "text" ? { ...b, h: e.target.value } : b,
                            )
                          }
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 px-3.5 py-3">
                        <label className="text-[15px]">Text</label>
                        <textarea
                          value={editingBlock.body}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "text"
                                ? { ...b, body: e.target.value }
                                : b,
                            )
                          }
                          className="w-full min-h-[100px] bg-transparent outline-none text-base resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {editingBlock.t === "skills" && (
                    <>
                      <div
                        className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                      >
                        <div
                          className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                        >
                          <label className="w-20 shrink-0 text-[15px]">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={editingBlock.h}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "skills"
                                  ? { ...b, h: e.target.value }
                                  : b,
                              )
                            }
                            className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 px-3.5 py-3">
                          <label className="text-[15px]">Skills</label>
                          <textarea
                            value={editingBlock.list}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "skills"
                                  ? { ...b, list: e.target.value }
                                  : b,
                              )
                            }
                            className="w-full min-h-[84px] bg-transparent outline-none text-base resize-y"
                          />
                        </div>
                      </div>
                      <p className={`text-xs mx-3.5 ${tx2}`}>
                        Separate skills with commas.
                      </p>
                    </>
                  )}

                  {editingBlock.t === "contact" && (
                    <div className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}>
                      <div
                        className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                      >
                        <label className="w-20 shrink-0 text-[15px]">
                          Heading
                        </label>
                        <input
                          type="text"
                          value={editingBlock.h}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "contact"
                                ? { ...b, h: e.target.value }
                                : b,
                            )
                          }
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                      <div
                        className={`flex flex-col gap-1.5 px-3.5 py-3 border-b ${lineCls}`}
                      >
                        <label className="text-[15px]">Message</label>
                        <textarea
                          value={editingBlock.note}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "contact"
                                ? { ...b, note: e.target.value }
                                : b,
                            )
                          }
                          className="w-full min-h-[78px] bg-transparent outline-none text-base resize-y"
                        />
                      </div>
                      <div
                        className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                      >
                        <label className="w-20 shrink-0 text-[15px]">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editingBlock.email}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "contact"
                                ? { ...b, email: e.target.value }
                                : b,
                            )
                          }
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <label className="w-20 shrink-0 text-[15px]">
                          Button
                        </label>
                        <input
                          type="text"
                          value={editingBlock.cta}
                          onChange={(e) =>
                            updateBlock(editingBlock.id, (b) =>
                              b.t === "contact"
                                ? { ...b, cta: e.target.value }
                                : b,
                            )
                          }
                          className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                        />
                      </div>
                    </div>
                  )}

                  {editingBlock.t === "cards" && (
                    <>
                      <div
                        className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                      >
                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                          <label className="w-20 shrink-0 text-[15px]">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={editingBlock.h}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "cards"
                                  ? { ...b, h: e.target.value }
                                  : b,
                              )
                            }
                            className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                          />
                        </div>
                      </div>

                      {editingBlock.items.map((item, idx) => (
                        <div
                          key={`ecard-${idx}`}
                          className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                        >
                          <div
                            className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                triggerImagePick({
                                  blockId: editingBlock.id,
                                  kind: "it",
                                  itemIdx: idx,
                                })
                              }
                              className={`w-[60px] h-[60px] rounded-xl shrink-0 flex items-center justify-center bg-cover bg-center cursor-pointer ${fillBg} ${tx2}`}
                              style={
                                item.img
                                  ? { backgroundImage: `url('${item.img}')` }
                                  : undefined
                              }
                            >
                              {!item.img && "＋"}
                            </button>
                            <span className={`text-sm ${tx2}`}>
                              Tap to add an image
                            </span>
                          </div>
                          <div
                            className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <label className="w-20 shrink-0 text-[15px]">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.t}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "cards"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, t: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                            />
                          </div>
                          <div
                            className={`flex flex-col gap-1 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <label className="text-[15px]">Details</label>
                            <textarea
                              value={item.d}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "cards"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, d: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="w-full min-h-[70px] bg-transparent outline-none text-base resize-y"
                            />
                          </div>
                          <div
                            className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <label className="w-20 shrink-0 text-[15px]">
                              Link
                            </label>
                            <input
                              type="url"
                              value={item.u}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "cards"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, u: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                            />
                          </div>
                          <div className="px-3.5 py-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "cards"
                                    ? {
                                        ...b,
                                        items: b.items.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(editingBlock.id, (b) =>
                            b.t === "cards"
                              ? {
                                  ...b,
                                  items: [
                                    ...b.items,
                                    { t: "", d: "", img: "", u: "" },
                                  ],
                                }
                              : b,
                          )
                        }
                        style={{ color: accent }}
                        className={`w-full py-2.5 rounded-full font-semibold text-[15px] cursor-pointer ${fillBg}`}
                      >
                        ＋ Add card
                      </button>
                    </>
                  )}

                  {editingBlock.t === "links" && (
                    <>
                      <div
                        className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                      >
                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                          <label className="w-20 shrink-0 text-[15px]">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={editingBlock.h}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "links"
                                  ? { ...b, h: e.target.value }
                                  : b,
                              )
                            }
                            className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                          />
                        </div>
                      </div>

                      {editingBlock.items.map((item, idx) => (
                        <div
                          key={`elink-${idx}`}
                          className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                        >
                          <div
                            className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <label className="w-20 shrink-0 text-[15px]">
                              Label
                            </label>
                            <input
                              type="text"
                              value={item.l}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "links"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, l: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                            />
                          </div>
                          <div
                            className={`flex items-center gap-3 px-3.5 py-2.5 border-b ${lineCls}`}
                          >
                            <label className="w-20 shrink-0 text-[15px]">
                              URL
                            </label>
                            <input
                              type="url"
                              value={item.u}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "links"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, u: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                            />
                          </div>
                          <div className="px-3.5 py-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "links"
                                    ? {
                                        ...b,
                                        items: b.items.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(editingBlock.id, (b) =>
                            b.t === "links"
                              ? {
                                  ...b,
                                  items: [...b.items, { l: "", u: "" }],
                                }
                              : b,
                          )
                        }
                        style={{ color: accent }}
                        className={`w-full py-2.5 rounded-full font-semibold text-[15px] cursor-pointer ${fillBg}`}
                      >
                        ＋ Add link
                      </button>
                    </>
                  )}

                  {editingBlock.t === "gallery" && (
                    <>
                      <div
                        className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                      >
                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                          <label className="w-20 shrink-0 text-[15px]">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={editingBlock.h}
                            onChange={(e) =>
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "gallery"
                                  ? { ...b, h: e.target.value }
                                  : b,
                              )
                            }
                            className="flex-1 min-w-0 bg-transparent outline-none text-right text-base"
                          />
                        </div>
                      </div>

                      {editingBlock.items.map((media, idx) => (
                        <div
                          key={`egal-${idx}`}
                          className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                        >
                          <div className="flex items-center gap-3 px-3.5 py-2.5">
                            {media.type === "image" ? (
                              <div
                                className={`w-[60px] h-[60px] rounded-xl shrink-0 bg-cover bg-center ${fillBg}`}
                                style={{
                                  backgroundImage: `url('${media.src}')`,
                                }}
                              />
                            ) : (
                              <div
                                className={`w-[60px] h-[60px] rounded-xl shrink-0 flex items-center justify-center ${fillBg} ${tx2}`}
                              >
                                <Video size={20} />
                              </div>
                            )}
                            <input
                              type="text"
                              value={media.cap}
                              onChange={(e) =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "gallery"
                                    ? {
                                        ...b,
                                        items: b.items.map((x, i) =>
                                          i === idx
                                            ? { ...x, cap: e.target.value }
                                            : x,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              placeholder="Caption"
                              className="flex-1 min-w-0 bg-transparent outline-none text-base"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(editingBlock.id, (b) =>
                                  b.t === "gallery"
                                    ? {
                                        ...b,
                                        items: b.items.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      }
                                    : b,
                                )
                              }
                              className="px-2.5 py-1 text-sm font-semibold text-[#ff3b30] cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            triggerImagePick({
                              blockId: editingBlock.id,
                              kind: "gal",
                            })
                          }
                          style={{ color: accent }}
                          className={`flex-1 py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${fillBg}`}
                        >
                          <ImageIcon size={15} />
                          <span>＋ Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingUpload({
                              blockId: editingBlock.id,
                              kind: "gal",
                            });
                            if (videoInputRef.current) {
                              videoInputRef.current.value = "";
                              videoInputRef.current.click();
                            }
                          }}
                          style={{ color: accent }}
                          className={`flex-1 py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${fillBg}`}
                        >
                          <Video size={15} />
                          <span>＋ Video file</span>
                        </button>
                      </div>

                      <div
                        className={`rounded-[14px] overflow-hidden ${sheetCardBg}`}
                      >
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                          <input
                            type="url"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            placeholder="Or paste a video link (.mp4)"
                            className="flex-1 min-w-0 bg-transparent outline-none text-base"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const u = normalizeUrl(videoUrlInput);
                              if (!u) {
                                showToast("Paste a video link first.");
                                return;
                              }
                              updateBlock(editingBlock.id, (b) =>
                                b.t === "gallery"
                                  ? {
                                      ...b,
                                      items: [
                                        ...b.items,
                                        { type: "video", src: u, cap: "" },
                                      ],
                                    }
                                  : b,
                              );
                              setVideoUrlInput("");
                              showToast("Video link added");
                            }}
                            style={{ backgroundColor: accent }}
                            className="px-4 py-2 rounded-full text-white text-sm font-semibold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeBlock(editingBlock.id)}
                    className="w-full py-2.5 text-sm font-semibold text-[#ff3b30] cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Delete section</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox (#lb) */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-5"
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
            alt="Zoomed preview"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-xl object-contain"
          />
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
