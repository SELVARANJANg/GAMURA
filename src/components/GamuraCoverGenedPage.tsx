import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Italic,
  Magnet,
  Moon,
  Plus,
  Redo2,
  Shield,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Undo2,
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

interface GamuraCoverGenedPageProps {
  onBackHome: () => void;
}

type CoverObjType = "text" | "rect" | "ellipse" | "img";
type AlignMode = "left" | "center" | "right";
type StarterTemplate = "bold" | "profile" | "split" | "minimal";

interface CoverObject {
  id: number;
  t: CoverObjType;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  fill: string;
  color: string;
  fs: number;
  ff: string;
  b: number;
  i: number;
  al: AlignMode;
  op: number;
  rad: number;
  sh: number;
  ls: number;
  text: string;
  src?: string;
}

interface CoverBackground {
  a: string;
  b: string;
  ang: number;
  src: string | null;
  dim: number;
}

interface CoverDocState {
  w: number;
  h: number;
  name: string;
  bg: CoverBackground;
  o: CoverObject[];
}

const COVER_STORAGE_KEY = "gamura_cover_gened_v1";

const PLATFORMS: [string, string, number, number][] = [
  ["Facebook", "Cover", 820, 312],
  ["Facebook", "Post", 1200, 630],
  ["Instagram", "Post", 1080, 1080],
  ["Instagram", "Portrait", 1080, 1350],
  ["Instagram", "Story", 1080, 1920],
  ["WhatsApp", "Status", 1080, 1920],
  ["WhatsApp", "Profile", 500, 500],
  ["LinkedIn", "Banner", 1584, 396],
  ["LinkedIn", "Post", 1200, 627],
  ["YouTube", "Banner", 2560, 1440],
  ["YouTube", "Thumbnail", 1280, 720],
  ["X", "Header", 1500, 500],
  ["X", "Post", 1600, 900],
  ["Pinterest", "Pin", 1000, 1500],
  ["TikTok", "Cover", 1080, 1920],
  ["Telegram", "Channel", 640, 640],
];

const GRADIENTS: [string, string][] = [
  ["#0f2027", "#2c5364"],
  ["#ff5f6d", "#ffc371"],
  ["#4a1d96", "#ec4899"],
  ["#022c22", "#10b981"],
  ["#0a84ff", "#5e5ce6"],
  ["#111111", "#434343"],
  ["#f9d423", "#ff4e50"],
  ["#ffffff", "#dfe4ee"],
  ["#00c6ff", "#0072ff"],
  ["#f5af19", "#f12711"],
];

const FONTS = [
  "Helvetica Neue",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Trebuchet MS",
  "Verdana",
  "Impact",
  "Palatino",
  "Futura",
];

const STICKERS = [
  "🚀",
  "⭐",
  "💡",
  "✅",
  "🔥",
  "🎯",
  "📈",
  "❤️",
  "🎉",
  "🧠",
  "🌍",
  "⚡",
  "👑",
  "💎",
  "🎨",
  "📸",
];

function createCoverObj(
  id: number,
  t: CoverObjType,
  docW: number,
  docH: number,
  overrides: Partial<CoverObject> = {},
): CoverObject {
  return {
    id,
    t,
    x: 100,
    y: 100,
    w: 300,
    h: 100,
    r: 0,
    fill: "#ffffff",
    color: "#ffffff",
    fs: Math.round(Math.min(docW, docH) * 0.08),
    ff: "Helvetica Neue",
    b: 1,
    i: 0,
    al: "center",
    op: 1,
    rad: 0,
    sh: 0,
    ls: 0,
    text: "Text",
    ...overrides,
  };
}

function buildStarterObjects(
  tpl: StarterTemplate,
  W: number,
  H: number,
  nextId: () => number,
): { objects: CoverObject[]; nextBg?: CoverBackground } {
  const T = Math.min(H * 0.2, W * 0.09);
  const g = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  if (tpl === "bold") {
    return {
      objects: [
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.08,
          y: H * 0.26,
          w: W * 0.84,
          h: H * 0.3,
          fs: Math.round(T),
          text: "YOUR BRAND",
          ls: 3,
          sh: 12,
        }),
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.15,
          y: H * 0.6,
          w: W * 0.7,
          h: H * 0.12,
          fs: Math.round(T * 0.35),
          b: 0,
          op: 0.85,
          text: "Your tagline goes here",
        }),
        createCoverObj(nextId(), "rect", W, H, {
          x: W * 0.44,
          y: H * 0.8,
          w: W * 0.12,
          h: Math.max(6, H * 0.012),
          rad: 99,
          fill: "#ffffff",
          text: "",
        }),
      ],
    };
  }

  if (tpl === "profile") {
    const s = Math.min(H * 0.62, W * 0.28);
    return {
      objects: [
        createCoverObj(nextId(), "rect", W, H, {
          x: W * 0.06,
          y: (H - s) / 2,
          w: s,
          h: s,
          rad: 999,
          fill: "#ffffff40",
          text: "👤",
          fs: Math.round(s * 0.45),
          sh: 20,
        }),
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.06 + s + W * 0.04,
          y: H * 0.3,
          w: W * 0.9 - s - W * 0.04,
          h: H * 0.22,
          fs: Math.round(T * 0.8),
          al: "left",
          text: "Your Name",
        }),
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.06 + s + W * 0.04,
          y: H * 0.54,
          w: W * 0.9 - s - W * 0.04,
          h: H * 0.14,
          fs: Math.round(T * 0.35),
          al: "left",
          b: 0,
          op: 0.8,
          text: "Creator · Developer · Dreamer",
        }),
      ],
    };
  }

  if (tpl === "split") {
    return {
      objects: [
        createCoverObj(nextId(), "rect", W, H, {
          x: 0,
          y: 0,
          w: W * 0.38,
          h: H,
          fill: g[0],
          text: "",
          rad: 0,
        }),
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.42,
          y: H * 0.3,
          w: W * 0.52,
          h: H * 0.25,
          fs: Math.round(T * 0.8),
          al: "left",
          text: "Big Headline",
        }),
        createCoverObj(nextId(), "text", W, H, {
          x: W * 0.42,
          y: H * 0.58,
          w: W * 0.52,
          h: H * 0.14,
          fs: Math.round(T * 0.32),
          al: "left",
          b: 0,
          op: 0.8,
          text: "Supporting line of text",
        }),
      ],
      nextBg: { a: g[0], b: g[1], ang: 135, src: null, dim: 0 },
    };
  }

  return {
    objects: [
      createCoverObj(nextId(), "text", W, H, {
        x: W * 0.06,
        y: H * 0.62,
        w: W * 0.7,
        h: H * 0.2,
        fs: Math.round(T * 0.7),
        al: "left",
        text: "Minimal Title",
        ls: 1,
      }),
      createCoverObj(nextId(), "rect", W, H, {
        x: W * 0.06,
        y: H * 0.58,
        w: W * 0.08,
        h: Math.max(5, H * 0.01),
        rad: 99,
        fill: "#ffffff",
        text: "",
      }),
    ],
    nextBg: { a: g[0], b: g[1], ang: 135, src: null, dim: 0 },
  };
}

function drawRoundedRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

function wrapCanvasText(
  c: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const out: string[] = [];
  text.split("\n").forEach((para) => {
    let line = "";
    para.split(" ").forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && c.measureText(candidate).width > maxW) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    out.push(line);
  });
  return out;
}

function handlePos(
  o: CoverObject,
  kind: "se" | "rot",
  scale: number,
): [number, number] {
  const a = (o.r * Math.PI) / 180;
  const lx = kind === "se" ? o.w / 2 : 0;
  const ly = kind === "se" ? o.h / 2 : -o.h / 2 - 34 / Math.max(0.15, scale);
  const cX = o.x + o.w / 2;
  const cY = o.y + o.h / 2;
  return [
    cX + lx * Math.cos(a) - ly * Math.sin(a),
    cY + lx * Math.sin(a) + ly * Math.cos(a),
  ];
}

export default function GamuraCoverGenedPage({
  onBackHome,
}: GamuraCoverGenedPageProps) {
  const nextIdRef = useRef<number>(1);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  const [doc, setDoc] = useState<CoverDocState>(() => {
    try {
      const raw = localStorage.getItem(COVER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.w && parsed.h && Array.isArray(parsed.o)) {
          const maxId = parsed.o.reduce(
            (m: number, item: CoverObject) => Math.max(m, item.id || 0),
            0,
          );
          nextIdRef.current = maxId + 1;
          return parsed as CoverDocState;
        }
      }
    } catch {
      // ignore storage errors
    }
    const starter = buildStarterObjects("bold", 820, 312, () => nextIdRef.current++);
    return {
      w: 820,
      h: 312,
      name: "Facebook Cover",
      bg: { a: "#0f2027", b: "#2c5364", ang: 135, src: null, dim: 0 },
      o: starter.objects,
    };
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [safeZone, setSafeZone] = useState<boolean>(false);
  const [snapOn, setSnapOn] = useState<boolean>(true);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [customW, setCustomW] = useState<string>(String(doc.w));
  const [customH, setCustomH] = useState<string>(String(doc.h));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-cover-gened",
    ),
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const layerTextRef = useRef<HTMLTextAreaElement | null>(null);
  const objImageInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);

  const scaleRef = useRef<number>(1);
  const multiRef = useRef<number>(1);
  const guidesRef = useRef<(["v" | "h", number])[]>([]);
  const dragRef = useRef<{
    mode: "mv" | "se" | "rot";
    pt: [number, number];
    orig: CoverObject;
  } | null>(null);

  const docRef = useRef(doc);
  docRef.current = doc;
  const selRef = useRef(selectedId);
  selRef.current = selectedId;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "COVER GENED · GAMURA Cover Generator & Editor";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    setCustomW(String(doc.w));
    setCustomH(String(doc.h));
  }, [doc.w, doc.h]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-cover-gened"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Persist lightweight state cleanly
  useEffect(() => {
    try {
      localStorage.setItem(COVER_STORAGE_KEY, JSON.stringify(doc));
    } catch {
      // ignore quota overflow on large images
    }
  }, [doc]);

  const selectedObj = useMemo(
    () => doc.o.find((item) => item.id === selectedId) || null,
    [doc.o, selectedId],
  );

  // Canvas drawing engine (both live UI + sharp 1x/2x export)
  const renderScene = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      multiplier: number,
      showUi: boolean,
      targetDoc: CoverDocState,
    ) => {
      const W = targetDoc.w;
      const H = targetDoc.h;
      const B = targetDoc.bg;
      const K = Math.max(0.05, scaleRef.current);

      const getCachedImg = (src: string): HTMLImageElement | null => {
        if (!src) return null;
        let img = imageCacheRef.current[src];
        if (!img) {
          img = new Image();
          imageCacheRef.current[src] = img;
          img.onload = () => {
            const c = canvasRef.current?.getContext("2d");
            if (c) renderScene(c, multiRef.current, true, docRef.current);
          };
          img.src = src;
        }
        return img;
      };

      ctx.setTransform(multiplier, 0, 0, multiplier, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const bgImg = B.src ? getCachedImg(B.src) : null;
      if (bgImg && bgImg.naturalWidth) {
        const s = Math.max(W / bgImg.width, H / bgImg.height);
        ctx.drawImage(
          bgImg,
          (W - bgImg.width * s) / 2,
          (H - bgImg.height * s) / 2,
          bgImg.width * s,
          bgImg.height * s,
        );
        if (B.dim) {
          ctx.fillStyle = `rgba(0,0,0,${B.dim})`;
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        const a = (B.ang * Math.PI) / 180;
        const L = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
        const dx = (Math.cos(a) * L) / 2;
        const dy = (Math.sin(a) * L) / 2;
        const grad = ctx.createLinearGradient(
          W / 2 - dx,
          H / 2 - dy,
          W / 2 + dx,
          H / 2 + dy,
        );
        grad.addColorStop(0, B.a);
        grad.addColorStop(1, B.b);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      targetDoc.o.forEach((o) => {
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        ctx.rotate((o.r * Math.PI) / 180);
        ctx.globalAlpha = o.op;
        ctx.translate(-o.w / 2, -o.h / 2);
        const w = o.w;
        const h = o.h;

        if (o.sh) {
          ctx.shadowColor = "rgba(0,0,0,0.45)";
          ctx.shadowBlur = o.sh;
          ctx.shadowOffsetY = o.sh / 3;
        }

        if (o.t === "img" && o.src) {
          const im = getCachedImg(o.src);
          if (im && im.naturalWidth) {
            ctx.save();
            drawRoundedRectPath(ctx, 0, 0, w, h, o.rad);
            ctx.clip();
            const sc = Math.max(w / im.width, h / im.height);
            ctx.drawImage(
              im,
              (w - im.width * sc) / 2,
              (h - im.height * sc) / 2,
              im.width * sc,
              im.height * sc,
            );
            ctx.restore();
          }
        } else if (o.t !== "text") {
          ctx.fillStyle = o.fill;
          if (o.t === "ellipse") {
            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          } else {
            drawRoundedRectPath(ctx, 0, 0, w, h, o.rad);
          }
          ctx.fill();
        }

        if (o.t !== "img" && o.text) {
          ctx.fillStyle = o.color;
          ctx.font = `${o.i ? "italic " : ""}${o.b ? 700 : 400} ${o.fs}px '${o.ff}', sans-serif`;
          ctx.textBaseline = "middle";
          ctx.textAlign = o.al;
          try {
            (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
              `${o.ls}px`;
          } catch {
            // ignore unsupported letterSpacing
          }
          const pad = o.t === "text" ? 0 : 12;
          const lines = wrapCanvasText(ctx, o.text, Math.max(20, w - pad * 2));
          const lh = o.fs * 1.2;
          const y0 = h / 2 - (lines.length * lh) / 2 + lh / 2;
          const x = o.al === "left" ? pad : o.al === "right" ? w - pad : w / 2;
          lines.forEach((line, idx) => ctx.fillText(line, x, y0 + idx * lh));
        }

        ctx.restore();
      });

      if (!showUi) return;

      ctx.lineWidth = 2 / K;
      const activeObj = targetDoc.o.find((o) => o.id === selRef.current);
      if (activeObj) {
        ctx.save();
        ctx.translate(activeObj.x + activeObj.w / 2, activeObj.y + activeObj.h / 2);
        ctx.rotate((activeObj.r * Math.PI) / 180);
        ctx.strokeStyle = "#0a84ff";
        ctx.strokeRect(-activeObj.w / 2, -activeObj.h / 2, activeObj.w, activeObj.h);
        ctx.restore();

        [handlePos(activeObj, "se", K), handlePos(activeObj, "rot", K)].forEach(
          (pt, idx) => {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 7 / K, 0, Math.PI * 2);
            ctx.fillStyle = idx ? "#0a84ff" : "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#0a84ff";
            ctx.stroke();
          },
        );
      }

      if (guidesRef.current.length > 0) {
        ctx.strokeStyle = "#ff375f";
        guidesRef.current.forEach(([axis, pos]) => {
          ctx.beginPath();
          if (axis === "v") {
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, H);
          } else {
            ctx.moveTo(0, pos);
            ctx.lineTo(W, pos);
          }
          ctx.stroke();
        });
      }

      if (safeZone) {
        let sw = W * 0.84;
        let sh = H * 0.84;
        if (targetDoc.name === "YouTube Banner") {
          sw = 1546;
          sh = 423;
        }
        ctx.setLineDash([10 / K, 8 / K]);
        ctx.strokeStyle = "#ffd60a";
        ctx.strokeRect((W - sw) / 2, (H - sh) / 2, sw, sh);
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffd60a";
        ctx.font = `600 ${Math.round(12 / K)}px sans-serif`;
        ctx.fillText(
          "SAFE ZONE",
          (W - sw) / 2 + 8 / K,
          (H - sh) / 2 + 18 / K,
        );
      }
    },
    [safeZone],
  );

  const fitAndDraw = useCallback(() => {
    const wrap = stageWrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const rect = wrap.getBoundingClientRect();
    const padV = window.innerWidth > 900 ? 84 : 44;
    const k = Math.max(
      0.05,
      Math.min((rect.width - 30) / doc.w, (rect.height - padV) / doc.h),
    );
    scaleRef.current = k;
    const m = Math.min(3, Math.max(1, k * (window.devicePixelRatio || 1)));
    multiRef.current = m;
    cv.width = Math.round(doc.w * m);
    cv.height = Math.round(doc.h * m);
    cv.style.width = `${Math.round(doc.w * k)}px`;
    cv.style.height = `${Math.round(doc.h * k)}px`;
    const ctx = cv.getContext("2d");
    if (ctx) renderScene(ctx, m, true, doc);
  }, [doc, renderScene]);

  useEffect(() => {
    fitAndDraw();
    const ro = new ResizeObserver(() => fitAndDraw());
    if (stageWrapRef.current) ro.observe(stageWrapRef.current);
    window.addEventListener("resize", fitAndDraw);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fitAndDraw);
    };
  }, [fitAndDraw, selectedId, safeZone]);

  const pushSnapshot = useCallback((snapshotDoc = docRef.current) => {
    setHistory((prev) => {
      const next = [...prev, JSON.stringify(snapshotDoc)];
      return next.length > 40 ? next.slice(next.length - 40) : next;
    });
    setFuture([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevRaw = history[history.length - 1];
    setFuture((f) => [...f, JSON.stringify(docRef.current)]);
    setHistory((h) => h.slice(0, -1));
    setDoc(JSON.parse(prevRaw) as CoverDocState);
    setSelectedId(null);
  }, [history]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextRaw = future[future.length - 1];
    setHistory((h) => [...h, JSON.stringify(docRef.current)]);
    setFuture((f) => f.slice(0, -1));
    setDoc(JSON.parse(nextRaw) as CoverDocState);
    setSelectedId(null);
  }, [future]);

  // Platform resize proportionally
  const applyCanvasSize = (w: number, h: number, label?: string) => {
    pushSnapshot();
    setDoc((prev) => {
      const sx = w / prev.w;
      const sy = h / prev.h;
      const s = Math.min(sx, sy);
      return {
        ...prev,
        w,
        h,
        name: label || "Custom",
        o: prev.o.map((o) => ({
          ...o,
          x: Math.round(o.x * sx),
          w: Math.round(o.w * sx),
          y: Math.round(o.y * sy),
          h: Math.round(o.h * sy),
          fs: Math.max(8, Math.round(o.fs * s)),
          rad: Math.round(o.rad * s),
        })),
      };
    });
    setSelectedId(null);
  };

  const applyStarterTemplate = (tpl: StarterTemplate) => {
    pushSnapshot();
    const res = buildStarterObjects(
      tpl,
      docRef.current.w,
      docRef.current.h,
      () => nextIdRef.current++,
    );
    setDoc((prev) => ({
      ...prev,
      bg: res.nextBg ? res.nextBg : prev.bg,
      o: res.objects,
    }));
    setSelectedId(null);
  };

  // Pointer hit detection & manipulation on canvas
  const toCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * docRef.current.w,
      ((e.clientY - r.top) / r.height) * docRef.current.h,
    ];
  };

  const isInsideObj = (o: CoverObject, pt: [number, number]) => {
    const a = (-o.r * Math.PI) / 180;
    const dx = pt[0] - o.x - o.w / 2;
    const dy = pt[1] - o.y - o.h / 2;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= o.w / 2 && Math.abs(ly) <= o.h / 2;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toCanvasCoords(e);
    const K = Math.max(0.05, scaleRef.current);
    const R = 18 / K;
    const currentSel = docRef.current.o.find((o) => o.id === selRef.current);
    let mode: "mv" | "se" | "rot" | null = null;

    if (currentSel) {
      const se = handlePos(currentSel, "se", K);
      const rot = handlePos(currentSel, "rot", K);
      if (Math.hypot(pt[0] - se[0], pt[1] - se[1]) < R) mode = "se";
      else if (Math.hypot(pt[0] - rot[0], pt[1] - rot[1]) < R) mode = "rot";
    }

    let nextActiveObj = currentSel || null;
    if (!mode) {
      const hit = [...docRef.current.o]
        .reverse()
        .find((o) => isInsideObj(o, pt));
      setSelectedId(hit ? hit.id : null);
      nextActiveObj = hit || null;
      if (hit) mode = "mv";
    }

    if (mode && nextActiveObj) {
      pushSnapshot();
      dragRef.current = {
        mode,
        pt,
        orig: { ...nextActiveObj },
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const pt = toCanvasCoords(e);
    const K = Math.max(0.05, scaleRef.current);
    const a = d.orig;
    const nextGuides: (["v" | "h", number])[] = [];

    setDoc((prev) => ({
      ...prev,
      o: prev.o.map((o) => {
        if (o.id !== a.id) return o;
        if (d.mode === "mv") {
          let nx = a.x + pt[0] - d.pt[0];
          let ny = a.y + pt[1] - d.pt[1];
          if (snapOn) {
            const thresh = 8 / K;
            if (Math.abs(nx + o.w / 2 - prev.w / 2) < thresh) {
              nx = prev.w / 2 - o.w / 2;
              nextGuides.push(["v", prev.w / 2]);
            }
            if (Math.abs(ny + o.h / 2 - prev.h / 2) < thresh) {
              ny = prev.h / 2 - o.h / 2;
              nextGuides.push(["h", prev.h / 2]);
            }
          }
          return { ...o, x: Math.round(nx), y: Math.round(ny) };
        }
        if (d.mode === "se") {
          const rad = (a.r * Math.PI) / 180;
          const dx = pt[0] - d.pt[0];
          const dy = pt[1] - d.pt[1];
          const lx = dx * Math.cos(rad) + dy * Math.sin(rad);
          const ly = -dx * Math.sin(rad) + dy * Math.cos(rad);
          const nw = Math.max(16, Math.round(a.w + lx));
          const nh = Math.max(8, Math.round(a.h + ly));
          const ccx =
            a.x +
            a.w / 2 +
            ((nw - a.w) / 2) * Math.cos(rad) -
            ((nh - a.h) / 2) * Math.sin(rad);
          const ccy =
            a.y +
            a.h / 2 +
            ((nw - a.w) / 2) * Math.sin(rad) +
            ((nh - a.h) / 2) * Math.cos(rad);
          return {
            ...o,
            w: nw,
            h: nh,
            x: Math.round(ccx - nw / 2),
            y: Math.round(ccy - nh / 2),
          };
        }
        let deg =
          (Math.atan2(pt[1] - (o.y + o.h / 2), pt[0] - (o.x + o.w / 2)) *
            180) /
            Math.PI +
          90;
        if (snapOn) {
          const q = Math.round(deg / 45) * 45;
          if (Math.abs(deg - q) < 5) deg = q;
        }
        return { ...o, r: Math.round(deg) };
      }),
    }));
    guidesRef.current = nextGuides;
  };

  useEffect(() => {
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        guidesRef.current = [];
        const c = canvasRef.current?.getContext("2d");
        if (c) renderScene(c, multiRef.current, true, docRef.current);
      }
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [renderScene]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const mc = e.metaKey || e.ctrlKey;
      if (mc && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      const active = docRef.current.o.find((o) => o.id === selRef.current);
      if (!active) return;

      if (mc && e.key.toLowerCase() === "d") {
        e.preventDefault();
        pushSnapshot();
        const nextId = nextIdRef.current++;
        setDoc((prev) => ({
          ...prev,
          o: [...prev.o, { ...active, id: nextId, x: active.x + 24, y: active.y + 24 }],
        }));
        setSelectedId(nextId);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        pushSnapshot();
        setDoc((prev) => ({
          ...prev,
          o: prev.o.filter((o) => o.id !== active.id),
        }));
        setSelectedId(null);
        return;
      }

      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const delta = nudge[e.key];
      if (delta) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setDoc((prev) => ({
          ...prev,
          o: prev.o.map((o) =>
            o.id === active.id
              ? { ...o, x: o.x + delta[0] * step, y: o.y + delta[1] * step }
              : o,
          ),
        }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRedo, handleUndo, pushSnapshot]);

  // Add elements
  const addCoverObject = (type: CoverObjType, overrides: Partial<CoverObject>) => {
    pushSnapshot();
    const id = nextIdRef.current++;
    const obj = createCoverObj(id, type, docRef.current.w, docRef.current.h, overrides);
    setDoc((prev) => ({ ...prev, o: [...prev.o, obj] }));
    setSelectedId(id);
  };

  const updateSelected = (updater: (o: CoverObject) => CoverObject, record = false) => {
    if (!selectedObj) return;
    if (record) pushSnapshot();
    setDoc((prev) => ({
      ...prev,
      o: prev.o.map((o) => (o.id === selectedObj.id ? updater(o) : o)),
    }));
  };

  const handleUploadObjectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const src = String(r.result || "");
      const img = new Image();
      img.onload = () => {
        const w = Math.min(docRef.current.w * 0.4, img.width || 300);
        const h = Math.round((w * (img.height || 200)) / (img.width || 300));
        addCoverObject("img", {
          src,
          w,
          h,
          x: Math.round((docRef.current.w - w) / 2),
          y: Math.round((docRef.current.h - h) / 2),
          rad: 0,
        });
      };
      img.src = src;
    };
    r.readAsDataURL(file);
  };

  const handleUploadBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      pushSnapshot();
      const src = String(r.result || "");
      setDoc((prev) => ({
        ...prev,
        bg: { ...prev.bg, src, dim: 0.2 },
      }));
      showToast("Background photo applied");
    };
    r.readAsDataURL(file);
  };

  const handleExportImage = (fmt: "png" | "jpeg", multiplier: number) => {
    setExportOpen(false);
    const outCanvas = document.createElement("canvas");
    outCanvas.width = doc.w * multiplier;
    outCanvas.height = doc.h * multiplier;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    if (fmt === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    }
    renderScene(ctx, multiplier, false, doc);
    outCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gamura-${doc.name
          .toLowerCase()
          .replace(/\s+/g, "-")}-${doc.w * multiplier}x${doc.h * multiplier}.${
          fmt === "jpeg" ? "jpg" : "png"
        }`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(
          `Downloaded ${doc.w * multiplier}×${doc.h * multiplier} ${fmt.toUpperCase()}`,
        );
      },
      `image/${fmt}`,
      0.93,
    );
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-cover-gened");
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

  // Visual theme tokens matching Apple glass aesthetic
  const pageBg = isDark
    ? "bg-[#050508] text-[#f5f5f7]"
    : "bg-[#e9ecf3] text-[#1d1d1f]";
  const glassCls = isDark
    ? "bg-[#1e1e22]/75 border border-white/[0.12] shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
    : "bg-white/75 border border-black/[0.1] shadow-[0_10px_40px_rgba(0,0,0,0.1)] backdrop-blur-2xl";
  const btnFill = isDark
    ? "bg-white/[0.09] hover:bg-white/[0.16] text-[#f5f5f7]"
    : "bg-black/[0.06] hover:bg-black/[0.11] text-[#1d1d1f]";
  const mutedTxt = isDark ? "text-[#98989d]" : "text-[#6e6e73]";
  const lineCls = isDark ? "border-white/[0.12]" : "border-black/[0.1]";

  const W = doc.w;
  const H = doc.h;
  const minDim = Math.min(W, H);

  return (
    <div
      onClick={() => exportOpen && setExportOpen(false)}
      className={`relative h-screen w-full overflow-hidden flex flex-col ${pageBg}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Ambient Radial Mesh Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-[-20%] z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(40% 40% at 15% 25%, rgba(10,132,255,0.34), transparent), radial-gradient(40% 40% at 85% 10%, rgba(255,55,95,0.26), transparent), radial-gradient(45% 45% at 75% 90%, rgba(48,209,88,0.24), transparent)",
        }}
      />

      <input
        ref={objImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadObjectImage}
      />
      <input
        ref={bgImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadBgImage}
      />

      {/* Responsive Workspace Shell */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[216px_minmax(0,1fr)_282px] grid-rows-[56px_54px_minmax(0,1fr)_215px] lg:grid-rows-[56px_minmax(0,1fr)] gap-2.5 p-2.5 h-full">
        {/* TOP BAR */}
        <header
          className={`lg:col-span-3 rounded-[18px] px-3 flex items-center justify-between gap-2 relative z-20 ${glassCls}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`h-8 px-2.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${btnFill}`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden md:inline-flex h-8 px-2.5 rounded-[10px] text-xs font-semibold items-center gap-1 whitespace-nowrap ${btnFill}`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <span className="hidden sm:inline-block font-extrabold tracking-[0.12em] text-xs pl-1 bg-gradient-to-r from-[#0a84ff] to-[#ff375f] bg-clip-text text-transparent select-none whitespace-nowrap">
              COVER GENED
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`hidden xl:inline text-xs mr-1 ${mutedTxt}`}>
              {doc.name} · {doc.w}×{doc.h}
            </span>

            <button
              type="button"
              disabled={history.length === 0}
              onClick={handleUndo}
              title="Undo"
              aria-label="Undo"
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center cursor-pointer disabled:opacity-35 ${btnFill}`}
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              onClick={handleRedo}
              title="Redo"
              aria-label="Redo"
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center cursor-pointer disabled:opacity-35 ${btnFill}`}
            >
              <Redo2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => setSafeZone((s) => !s)}
              title="Safe-zone guide"
              className={`h-8 px-2.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                safeZone ? "bg-[#0a84ff] text-white" : btnFill
              }`}
            >
              <Shield size={13} />
              <span className="hidden sm:inline">Safe zone</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Toggle Light/Dark theme"
              className={`hidden sm:flex w-8 h-8 rounded-[10px] items-center justify-center cursor-pointer ${btnFill}`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`hidden md:inline-flex h-8 px-2.5 rounded-[10px] text-xs font-semibold items-center gap-1 cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/35"
                  : btnFill
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Add to Universe"}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExportOpen((v) => !v);
                }}
                className="h-8 px-3 rounded-[10px] bg-[#0a84ff] hover:bg-[#0070e0] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Download size={13} />
                <span>Export</span>
                <ChevronDown size={12} />
              </button>

              {exportOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-10 min-w-[178px] rounded-[14px] p-1.5 flex flex-col gap-0.5 z-30 ${glassCls}`}
                >
                  <button
                    type="button"
                    onClick={() => handleExportImage("png", 1)}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left cursor-pointer ${btnFill} bg-transparent`}
                  >
                    PNG · 1× ({doc.w}×{doc.h})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImage("png", 2)}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left cursor-pointer ${btnFill} bg-transparent`}
                  >
                    PNG · 2× (sharp)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImage("jpeg", 1)}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left cursor-pointer ${btnFill} bg-transparent`}
                  >
                    JPG · 1×
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImage("jpeg", 2)}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left cursor-pointer ${btnFill} bg-transparent`}
                  >
                    JPG · 2×
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* LEFT PLATFORMS SIDEBAR */}
        <aside
          className={`rounded-[18px] p-2 lg:p-2.5 overflow-auto no-scrollbar flex flex-row lg:flex-col items-center lg:items-stretch gap-1.5 lg:gap-1 ${glassCls}`}
        >
          <h4
            className={`hidden lg:block px-2 pt-0.5 pb-1 text-[11px] font-bold uppercase tracking-wider ${mutedTxt}`}
          >
            Platforms
          </h4>
          {PLATFORMS.map(([brand, kind, pw, ph]) => {
            const label = `${brand} ${kind}`;
            const active = doc.name === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => applyCanvasSize(pw, ph, label)}
                className={`px-2.5 py-2 rounded-[10px] text-xs flex items-center justify-between gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? "bg-[#0a84ff] text-white font-semibold"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span>{label}</span>
                <small className={active ? "text-white/80" : mutedTxt}>
                  {pw}×{ph}
                </small>
              </button>
            );
          })}
        </aside>

        {/* CENTER CANVAS STUDIO + FLOATING INSERT DOCK */}
        <section
          ref={stageWrapRef}
          className={`relative rounded-[18px] flex items-center justify-center overflow-hidden border ${lineCls}`}
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
            backgroundImage: isDark
              ? "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%)"
              : "linear-gradient(45deg, rgba(0,0,0,0.045) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.045) 75%), linear-gradient(45deg, rgba(0,0,0,0.045) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.045) 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onDoubleClick={() => {
              if (layerTextRef.current) {
                layerTextRef.current.focus();
                layerTextRef.current.select();
              }
            }}
            className="block rounded-[4px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] touch-none cursor-crosshair"
          />

          {/* Floating Insert Dock */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-2.5 rounded-[14px] p-1 flex items-center gap-0.5 max-w-[95%] overflow-x-auto no-scrollbar ${glassCls}`}
          >
            <button
              type="button"
              onClick={() =>
                addCoverObject("text", {
                  x: Math.round(W * 0.25),
                  y: Math.round(H * 0.4),
                  w: Math.round(W * 0.5),
                  h: Math.round(minDim * 0.14),
                  text: "New text",
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Type size={13} />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() =>
                addCoverObject("rect", {
                  x: Math.round(W * 0.35),
                  y: Math.round(H * 0.3),
                  w: Math.round(W * 0.3),
                  h: Math.round(H * 0.4),
                  rad: Math.round(minDim * 0.05),
                  fill: "#ff375f",
                  text: "",
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Square size={13} />
              <span>Shape</span>
            </button>
            <button
              type="button"
              onClick={() =>
                addCoverObject("ellipse", {
                  x: Math.round(W * 0.4),
                  y: Math.round(H * 0.25),
                  w: Math.round(minDim * 0.4),
                  h: Math.round(minDim * 0.4),
                  fill: "#0a84ff",
                  text: "",
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Circle size={13} />
              <span>Circle</span>
            </button>
            <button
              type="button"
              onClick={() => objImageInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ImageIcon size={13} />
              <span>Image / Logo</span>
            </button>
            <button
              type="button"
              onClick={() =>
                addCoverObject("text", {
                  x: Math.round(W / 2 - minDim * 0.15),
                  y: Math.round(H / 2 - minDim * 0.15),
                  w: Math.round(minDim * 0.3),
                  h: Math.round(minDim * 0.3),
                  fs: Math.round(minDim * 0.2),
                  text: STICKERS[Math.floor(Math.random() * STICKERS.length)],
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Sparkles size={13} />
              <span>Sticker</span>
            </button>
            <button
              type="button"
              onClick={() => setSnapOn((s) => !s)}
              className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                snapOn
                  ? "bg-[#0a84ff] text-white"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <Magnet size={13} />
              <span>Snap</span>
            </button>
          </div>
        </section>

        {/* RIGHT INSPECTOR PANEL */}
        <aside className={`rounded-[18px] p-3.5 overflow-y-auto ${glassCls}`}>
          {!selectedObj ? (
            <div className="space-y-4">
              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${mutedTxt}`}>
                  Background
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {GRADIENTS.map((g, idx) => (
                    <button
                      key={`grad-${idx}`}
                      type="button"
                      aria-label={`Gradient ${idx + 1}`}
                      onClick={() => {
                        pushSnapshot();
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, a: g[0], b: g[1], src: null },
                        }));
                      }}
                      className={`w-10 h-7 rounded-[8px] border cursor-pointer ${
                        isDark ? "border-white/20" : "border-black/15"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
                      }}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Color A</label>
                    <input
                      type="color"
                      value={doc.bg.a}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, a: val },
                        }));
                      }}
                      className="w-11 h-7 rounded border-0 bg-transparent p-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Color B</label>
                    <input
                      type="color"
                      value={doc.bg.b}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, b: val },
                        }));
                      }}
                      className="w-11 h-7 rounded border-0 bg-transparent p-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Angle</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={doc.bg.ang}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, ang: val },
                        }));
                      }}
                      className="w-28 accent-[#0a84ff] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => bgImageInputRef.current?.click()}
                    className={`flex-1 py-1.5 px-2.5 rounded-[10px] text-xs font-semibold cursor-pointer ${btnFill}`}
                  >
                    Upload photo
                  </button>
                  {doc.bg.src && (
                    <button
                      type="button"
                      onClick={() => {
                        pushSnapshot();
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, src: null },
                        }));
                      }}
                      className="py-1.5 px-2.5 rounded-[10px] text-xs font-semibold text-[#ff3b30] bg-red-500/10 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {doc.bg.src && (
                  <div className="flex items-center justify-between gap-2 mt-2.5">
                    <label className={`text-xs ${mutedTxt}`}>Darken</label>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.05}
                      value={doc.bg.dim}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDoc((prev) => ({
                          ...prev,
                          bg: { ...prev.bg, dim: val },
                        }));
                      }}
                      className="w-28 accent-[#0a84ff] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${mutedTxt}`}>
                  Custom Size
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Width</label>
                    <input
                      type="number"
                      min={100}
                      max={4000}
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      className={`px-2 py-1 rounded-[8px] text-xs outline-none w-24 ${btnFill}`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Height</label>
                    <input
                      type="number"
                      min={100}
                      max={4000}
                      value={customH}
                      onChange={(e) => setCustomH(e.target.value)}
                      className={`px-2 py-1 rounded-[8px] text-xs outline-none w-24 ${btnFill}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const w = Math.min(4000, Math.max(100, Number(customW) || doc.w));
                      const h = Math.min(4000, Math.max(100, Number(customH) || doc.h));
                      applyCanvasSize(w, h);
                    }}
                    className={`w-full py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${btnFill}`}
                  >
                    Apply size
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${mutedTxt}`}>
                  Starter Layouts
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { k: "bold", label: "Bold" },
                      { k: "profile", label: "Profile" },
                      { k: "split", label: "Split" },
                      { k: "minimal", label: "Minimal" },
                    ] as { k: StarterTemplate; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.k}
                      type="button"
                      onClick={() => applyStarterTemplate(item.k)}
                      className={`py-1.5 px-2.5 rounded-[10px] text-xs font-semibold cursor-pointer ${btnFill}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${mutedTxt}`}>
                Click any object to edit. Drag the blue dot to rotate, the white corner dot to resize. Pink guides snap to the centre. Arrow keys nudge (Shift = 10px), Ctrl/⌘+D duplicates, Ctrl/⌘+Z undoes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${mutedTxt}`}>
                  {selectedObj.t === "ellipse" ? "Circle" : selectedObj.t}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md cursor-pointer ${btnFill}`}
                >
                  Done
                </button>
              </div>

              {selectedObj.t !== "img" && (
                <>
                  <textarea
                    ref={layerTextRef}
                    rows={3}
                    value={selectedObj.text}
                    onFocus={() => pushSnapshot()}
                    onChange={(e) =>
                      updateSelected((o) => ({ ...o, text: e.target.value }))
                    }
                    className={`w-full px-2.5 py-2 rounded-[10px] text-xs outline-none resize-y ${btnFill}`}
                  />

                  {(selectedObj.t === "rect" || selectedObj.t === "ellipse") && (
                    <div className="flex items-center justify-between gap-2">
                      <label className={`text-xs ${mutedTxt}`}>Fill</label>
                      <input
                        type="color"
                        value={selectedObj.fill.slice(0, 7)}
                        onFocus={() => pushSnapshot()}
                        onChange={(e) =>
                          updateSelected((o) => ({ ...o, fill: e.target.value }))
                        }
                        className="w-11 h-7 rounded border-0 bg-transparent p-0 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Text color</label>
                    <input
                      type="color"
                      value={selectedObj.color}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelected((o) => ({ ...o, color: e.target.value }))
                      }
                      className="w-11 h-7 rounded border-0 bg-transparent p-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Font</label>
                    <select
                      value={selectedObj.ff}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelected((o) => ({ ...o, ff: e.target.value }))
                      }
                      className={`px-2 py-1 rounded-[8px] text-xs outline-none w-[124px] ${btnFill}`}
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} className="text-black">
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Size</label>
                    <input
                      type="number"
                      min={6}
                      max={600}
                      value={selectedObj.fs}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelected((o) => ({
                          ...o,
                          fs: Number(e.target.value) || 12,
                        }))
                      }
                      className={`px-2 py-1 rounded-[8px] text-xs outline-none w-24 ${btnFill}`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Spacing</label>
                    <input
                      type="range"
                      min={-5}
                      max={40}
                      value={selectedObj.ls}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelected((o) => ({
                          ...o,
                          ls: Number(e.target.value),
                        }))
                      }
                      className="w-28 accent-[#0a84ff] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((o) => ({ ...o, b: o.b ? 0 : 1 }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.b ? "bg-[#0a84ff] text-white" : btnFill
                      }`}
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((o) => ({ ...o, i: o.i ? 0 : 1 }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.i ? "bg-[#0a84ff] text-white" : btnFill
                      }`}
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((o) => ({ ...o, al: "left" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "left" ? "bg-[#0a84ff] text-white" : btnFill
                      }`}
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((o) => ({ ...o, al: "center" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "center" ? "bg-[#0a84ff] text-white" : btnFill
                      }`}
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((o) => ({ ...o, al: "right" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "right" ? "bg-[#0a84ff] text-white" : btnFill
                      }`}
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2">
                <label className={`text-xs ${mutedTxt}`}>Opacity</label>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={selectedObj.op}
                  onFocus={() => pushSnapshot()}
                  onChange={(e) =>
                    updateSelected((o) => ({ ...o, op: Number(e.target.value) }))
                  }
                  className="w-28 accent-[#0a84ff] cursor-pointer"
                />
              </div>

              {selectedObj.t !== "ellipse" && (
                <div className="flex items-center justify-between gap-2">
                  <label className={`text-xs ${mutedTxt}`}>Corners</label>
                  <input
                    type="range"
                    min={0}
                    max={600}
                    value={selectedObj.rad}
                    onFocus={() => pushSnapshot()}
                    onChange={(e) =>
                      updateSelected((o) => ({
                        ...o,
                        rad: Number(e.target.value),
                      }))
                    }
                    className="w-28 accent-[#0a84ff] cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <label className={`text-xs ${mutedTxt}`}>Shadow</label>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={selectedObj.sh}
                  onFocus={() => pushSnapshot()}
                  onChange={(e) =>
                    updateSelected((o) => ({ ...o, sh: Number(e.target.value) }))
                  }
                  className="w-28 accent-[#0a84ff] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className={`text-xs ${mutedTxt}`}>Rotate (°)</label>
                <input
                  type="number"
                  value={selectedObj.r}
                  onFocus={() => pushSnapshot()}
                  onChange={(e) =>
                    updateSelected((o) => ({
                      ...o,
                      r: Number(e.target.value) || 0,
                    }))
                  }
                  className={`px-2 py-1 rounded-[8px] text-xs outline-none w-24 ${btnFill}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    setDoc((prev) => ({
                      ...prev,
                      o: [
                        ...prev.o.filter((o) => o.id !== selectedObj.id),
                        selectedObj,
                      ],
                    }));
                  }}
                  className={`py-1.5 px-2 rounded-[8px] text-xs font-semibold cursor-pointer ${btnFill}`}
                >
                  Bring Front
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    setDoc((prev) => ({
                      ...prev,
                      o: [
                        selectedObj,
                        ...prev.o.filter((o) => o.id !== selectedObj.id),
                      ],
                    }));
                  }}
                  className={`py-1.5 px-2 rounded-[8px] text-xs font-semibold cursor-pointer ${btnFill}`}
                >
                  Send Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    const nextId = nextIdRef.current++;
                    setDoc((prev) => ({
                      ...prev,
                      o: [
                        ...prev.o,
                        {
                          ...selectedObj,
                          id: nextId,
                          x: selectedObj.x + 24,
                          y: selectedObj.y + 24,
                        },
                      ],
                    }));
                    setSelectedId(nextId);
                  }}
                  className={`py-1.5 px-2 rounded-[8px] text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${btnFill}`}
                >
                  <Copy size={12} />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    setDoc((prev) => ({
                      ...prev,
                      o: prev.o.filter((o) => o.id !== selectedObj.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="py-1.5 px-2 rounded-[8px] text-xs font-semibold text-[#ff3b30] bg-red-500/10 hover:bg-red-500/20 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2 rounded-full bg-[#1d1d1f]/90 text-white text-xs font-semibold shadow-lg pointer-events-none"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
