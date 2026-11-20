import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PptxGenJS from "pptxgenjs";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  Italic,
  Layers,
  Minus,
  Moon,
  Play,
  Plus,
  Redo2,
  Save,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Undo2,
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

interface GamuraPptCredPageProps {
  onBackHome: () => void;
}

const STAGE_W = 960;
const STAGE_H = 540;
const PPT_STORAGE_KEY = "gamura-ppt";

type SlideObjectType = "text" | "rect" | "ellipse" | "line" | "img";
type TextAlign = "left" | "center" | "right";
type ThemeName =
  | "Aurora"
  | "Midnight"
  | "Paper"
  | "Sunset"
  | "Emerald"
  | "Ocean"
  | "Berry";
type LayoutKind = "title" | "content" | "two" | "blank";

interface SlideObject {
  id: number;
  t: SlideObjectType;
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
  al: TextAlign;
  op: number;
  rad: number;
  text: string;
  src?: string;
}

interface SlideItem {
  c1: string;
  c2: string;
  o: SlideObject[];
}

interface DeckSnapshot {
  S: SlideItem[];
  cur: number;
}

const THEMES: Record<ThemeName, [string, string, string]> = {
  Aurora: ["#0f2027", "#2c5364", "#ffffff"],
  Midnight: ["#0a0a0f", "#26265c", "#ffffff"],
  Paper: ["#ffffff", "#e9ebf2", "#1d1d1f"],
  Sunset: ["#ff5f6d", "#ffc371", "#ffffff"],
  Emerald: ["#022c22", "#10b981", "#ffffff"],
  Ocean: ["#2193b0", "#6dd5ed", "#0b2a33"],
  Berry: ["#4a1d96", "#ec4899", "#ffffff"],
};

const FONTS = [
  "Helvetica Neue",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Trebuchet MS",
  "Verdana",
  "Impact",
];

const STICKERS = ["🚀", "⭐", "💡", "✅", "🔥", "🎯", "📈", "❤️", "🎉", "🧠", "🌍", "⚡"];

function createObject(
  id: number,
  t: SlideObjectType,
  textColor: string,
  overrides: Partial<SlideObject> = {},
): SlideObject {
  return {
    id,
    t,
    x: 100,
    y: 100,
    w: 320,
    h: 120,
    r: 0,
    fill: "#10b981",
    color: textColor,
    fs: 40,
    ff: "Helvetica Neue",
    b: 0,
    i: 0,
    al: "center",
    op: 1,
    rad: 0,
    text: "Text",
    ...overrides,
  };
}

function createLayoutSlide(
  layout: LayoutKind,
  themeName: ThemeName,
  nextIdRef: React.MutableRefObject<number>,
): SlideItem {
  const [c1, c2, textColor] = THEMES[themeName];
  const nextId = () => nextIdRef.current++;

  if (layout === "title") {
    return {
      c1,
      c2,
      o: [
        createObject(nextId(), "text", textColor, {
          x: 80,
          y: 170,
          w: 800,
          h: 110,
          fs: 72,
          b: 1,
          text: "Your Big Idea",
        }),
        createObject(nextId(), "text", textColor, {
          x: 180,
          y: 300,
          w: 600,
          h: 60,
          fs: 26,
          op: 0.75,
          text: "A subtitle that tells the story",
        }),
      ],
    };
  }
  if (layout === "content") {
    return {
      c1,
      c2,
      o: [
        createObject(nextId(), "text", textColor, {
          x: 60,
          y: 40,
          w: 840,
          h: 80,
          fs: 48,
          b: 1,
          al: "left",
          text: "Slide Title",
        }),
        createObject(nextId(), "text", textColor, {
          x: 60,
          y: 150,
          w: 840,
          h: 300,
          fs: 28,
          al: "left",
          text: "• First key point\n• Second key point\n• Third key point",
        }),
      ],
    };
  }
  if (layout === "two") {
    return {
      c1,
      c2,
      o: [
        createObject(nextId(), "text", textColor, {
          x: 60,
          y: 40,
          w: 840,
          h: 80,
          fs: 48,
          b: 1,
          al: "left",
          text: "Compare",
        }),
        createObject(nextId(), "rect", textColor, {
          x: 60,
          y: 150,
          w: 400,
          h: 320,
          rad: 24,
          fill: "#ffffff33",
          text: "Left",
          fs: 30,
        }),
        createObject(nextId(), "rect", textColor, {
          x: 500,
          y: 150,
          w: 400,
          h: 320,
          rad: 24,
          fill: "#ffffff33",
          text: "Right",
          fs: 30,
        }),
      ],
    };
  }
  return { c1, c2, o: [] };
}

function SlideStagePreview({
  slide,
  scale,
  interactive = false,
  selectedId = null,
  editingId = null,
  onSelectObject,
  onStartDrag,
  onDoubleClickObject,
  onFinishEditText,
}: {
  slide: SlideItem;
  scale: number;
  interactive?: boolean;
  selectedId?: number | null;
  editingId?: number | null;
  onSelectObject?: (id: number | null) => void;
  onStartDrag?: (
    e: React.PointerEvent,
    obj: SlideObject,
    mode: "mv" | "se" | "rot",
  ) => void;
  onDoubleClickObject?: (obj: SlideObject) => void;
  onFinishEditText?: (id: number, text: string) => void;
}) {
  const selectedObj = slide.o.find((o) => o.id === selectedId) || null;
  const invScale = Math.max(0.25, scale);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: STAGE_W,
        height: STAGE_H,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        background: `linear-gradient(135deg, ${slide.c1}, ${slide.c2})`,
        touchAction: interactive ? "none" : "auto",
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        if (e.target === e.currentTarget) {
          onSelectObject?.(null);
        }
      }}
    >
      {slide.o.map((obj) => {
        const isEditing = interactive && editingId === obj.id;
        const height = obj.t === "line" ? Math.min(obj.h, 12) : obj.h;
        const justify =
          obj.al === "left"
            ? "flex-start"
            : obj.al === "right"
              ? "flex-end"
              : "center";

        return (
          <div
            key={obj.id}
            data-obj-id={obj.id}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onPointerDown={(e) => {
              if (!interactive || isEditing) return;
              e.stopPropagation();
              onSelectObject?.(obj.id);
              onStartDrag?.(e, obj, "mv");
            }}
            onDoubleClick={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              if (obj.t !== "img" && obj.t !== "line") {
                onDoubleClickObject?.(obj);
              }
            }}
            onBlur={(e) => {
              if (isEditing) {
                onFinishEditText?.(obj.id, e.currentTarget.innerText);
              }
            }}
            onKeyDown={(e) => {
              if (isEditing && e.key === "Escape") {
                e.stopPropagation();
                onFinishEditText?.(obj.id, e.currentTarget.innerText);
              }
            }}
            style={{
              position: "absolute",
              left: obj.x,
              top: obj.y,
              width: obj.w,
              height,
              transform: `rotate(${obj.r}deg)`,
              opacity: obj.op,
              borderRadius: obj.t === "ellipse" ? "50%" : `${obj.rad}px`,
              background: obj.t === "text" || obj.t === "img" ? "transparent" : obj.fill,
              color: obj.color,
              fontSize: `${obj.fs}px`,
              fontFamily: `'${obj.ff}', -apple-system, sans-serif`,
              fontWeight: obj.b ? 700 : 400,
              fontStyle: obj.i ? "italic" : "normal",
              textAlign: obj.al,
              display: "flex",
              alignItems: "center",
              justifyContent: justify,
              padding: obj.t === "line" || obj.t === "img" ? 0 : "6px 10px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.2,
              cursor: isEditing ? "text" : interactive ? "move" : "default",
              userSelect: isEditing ? "text" : "none",
              outline: isEditing ? "2px dashed #0a84ff" : "none",
            }}
          >
            {obj.t === "img" && obj.src ? (
              <img
                src={obj.src}
                alt=""
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
                style={{ borderRadius: "inherit" }}
              />
            ) : obj.t === "line" ? null : (
              obj.text
            )}
          </div>
        );
      })}

      {/* Selection Handles */}
      {interactive && selectedObj && editingId !== selectedObj.id && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: selectedObj.x,
            top: selectedObj.y,
            width: selectedObj.w,
            height:
              selectedObj.t === "line"
                ? Math.min(selectedObj.h, 12)
                : selectedObj.h,
            transform: `rotate(${selectedObj.r}deg)`,
            border: `${2 / invScale}px solid #0a84ff`,
          }}
        >
          {/* Resize Handle (bottom-right) */}
          <div
            role="button"
            aria-label="Resize object"
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartDrag?.(e, selectedObj, "se");
            }}
            className="pointer-events-auto absolute rounded-full bg-white"
            style={{
              width: 14 / invScale,
              height: 14 / invScale,
              right: -7 / invScale,
              bottom: -7 / invScale,
              border: `${2 / invScale}px solid #0a84ff`,
              cursor: "nwse-resize",
            }}
          />
          {/* Rotation Handle (top-center) */}
          <div
            role="button"
            aria-label="Rotate object"
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartDrag?.(e, selectedObj, "rot");
            }}
            className="pointer-events-auto absolute rounded-full bg-[#0a84ff]"
            style={{
              width: 14 / invScale,
              height: 14 / invScale,
              left: "50%",
              top: -28 / invScale,
              marginLeft: -7 / invScale,
              border: `${2 / invScale}px solid #ffffff`,
              cursor: "grab",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function GamuraPptCredPage({ onBackHome }: GamuraPptCredPageProps) {
  const nextIdRef = useRef<number>(100);

  const [initialLoaded] = useState(() => {
    try {
      const raw = localStorage.getItem(PPT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.S) && parsed.S.length > 0) {
          if (typeof parsed.uid === "number") {
            nextIdRef.current = parsed.uid + 10;
          }
          return {
            slides: parsed.S as SlideItem[],
            theme: (THEMES[parsed.th as ThemeName]
              ? parsed.th
              : "Aurora") as ThemeName,
            title:
              typeof parsed.t === "string" && parsed.t.trim()
                ? parsed.t
                : "Untitled Presentation",
          };
        }
      }
    } catch {
      // fallback to starter deck
    }
    return {
      slides: [
        createLayoutSlide("title", "Aurora", nextIdRef),
        createLayoutSlide("content", "Aurora", nextIdRef),
        createLayoutSlide("two", "Aurora", nextIdRef),
      ],
      theme: "Aurora" as ThemeName,
      title: "Untitled Presentation",
    };
  });

  const [slides, setSlides] = useState<SlideItem[]>(initialLoaded.slides);
  const [curSlide, setCurSlide] = useState<number>(0);
  const [themeName, setThemeName] = useState<ThemeName>(initialLoaded.theme);
  const [title, setTitle] = useState<string>(initialLoaded.title);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [snapOn, setSnapOn] = useState<boolean>(false);

  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presIndex, setPresIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState<number>(0.75);
  const [railScale, setRailScale] = useState<number>(0.17);
  const [presScale, setPresScale] = useState<number>(1);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-ppt-cred",
    ),
  );

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const railWrapRef = useRef<HTMLDivElement | null>(null);
  const presWrapRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);

  const dragStateRef = useRef<{
    mode: "mv" | "se" | "rot";
    objId: number;
    sx: number;
    sy: number;
    orig: SlideObject;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = `${title || "PPT CRED"} · GAMURA PPT Creator`;
    return () => {
      document.title = prev;
    };
  }, [title]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-ppt-cred"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Persist deck to localStorage cleanly
  useEffect(() => {
    try {
      localStorage.setItem(
        PPT_STORAGE_KEY,
        JSON.stringify({
          S: slides,
          th: themeName,
          uid: nextIdRef.current,
          t: title,
        }),
      );
    } catch {
      // ignore storage quota errors
    }
  }, [slides, themeName, title]);

  // Responsive stage + rail + presentation sizing via ResizeObserver
  const computeScales = useCallback(() => {
    if (canvasWrapRef.current) {
      const rect = canvasWrapRef.current.getBoundingClientRect();
      const padV = window.innerWidth > 900 ? 96 : 74;
      const k = Math.min((rect.width - 28) / STAGE_W, (rect.height - padV) / STAGE_H);
      setStageScale(Math.max(0.18, k));
    }
    if (railWrapRef.current) {
      const thumbEl = railWrapRef.current.querySelector("[data-thumb='1']") as HTMLElement | null;
      if (thumbEl && thumbEl.clientWidth > 0) {
        setRailScale(thumbEl.clientWidth / STAGE_W);
      } else {
        setRailScale(window.innerWidth > 900 ? 168 / STAGE_W : 112 / STAGE_W);
      }
    }
    if (presenting) {
      const k = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      setPresScale(Math.max(0.2, k));
    }
  }, [presenting]);

  useEffect(() => {
    computeScales();
    const ro = new ResizeObserver(() => computeScales());
    if (canvasWrapRef.current) ro.observe(canvasWrapRef.current);
    if (railWrapRef.current) ro.observe(railWrapRef.current);
    window.addEventListener("resize", computeScales);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeScales);
    };
  }, [computeScales, slides.length]);

  const activeSlide = slides[curSlide] || slides[0];
  const selectedObj = useMemo(
    () => activeSlide?.o.find((o) => o.id === selectedId) || null,
    [activeSlide, selectedId],
  );

  const pushSnapshot = useCallback(
    (snapSlides = slides, snapCur = curSlide) => {
      setHistory((prev) => {
        const next = [...prev, JSON.stringify({ S: snapSlides, cur: snapCur })];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
      setFuture([]);
    },
    [slides, curSlide],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastRaw = history[history.length - 1];
    const snap = JSON.parse(lastRaw) as DeckSnapshot;
    setFuture((prev) => [...prev, JSON.stringify({ S: slides, cur: curSlide })]);
    setHistory((prev) => prev.slice(0, -1));
    setSlides(snap.S);
    setCurSlide(Math.min(snap.cur, snap.S.length - 1));
    setSelectedId(null);
    setEditingId(null);
  }, [history, slides, curSlide]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const lastRaw = future[future.length - 1];
    const snap = JSON.parse(lastRaw) as DeckSnapshot;
    setHistory((prev) => [...prev, JSON.stringify({ S: slides, cur: curSlide })]);
    setFuture((prev) => prev.slice(0, -1));
    setSlides(snap.S);
    setCurSlide(Math.min(snap.cur, snap.S.length - 1));
    setSelectedId(null);
    setEditingId(null);
  }, [future, slides, curSlide]);

  // Pointer drag / resize / rotate
  const handleStartDrag = (
    e: React.PointerEvent,
    obj: SlideObject,
    mode: "mv" | "se" | "rot",
  ) => {
    pushSnapshot();
    dragStateRef.current = {
      mode,
      objId: obj.id,
      sx: e.clientX,
      sy: e.clientY,
      orig: { ...obj },
    };
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;
      const dx = (e.clientX - d.sx) / stageScale;
      const dy = (e.clientY - d.sy) / stageScale;
      const grid = (v: number) =>
        snapOn ? Math.round(v / 10) * 10 : Math.round(v);

      setSlides((prev) =>
        prev.map((sl, sIdx) => {
          if (sIdx !== curSlide) return sl;
          return {
            ...sl,
            o: sl.o.map((obj) => {
              if (obj.id !== d.objId) return obj;
              if (d.mode === "mv") {
                return {
                  ...obj,
                  x: grid(d.orig.x + dx),
                  y: grid(d.orig.y + dy),
                };
              }
              if (d.mode === "se") {
                return {
                  ...obj,
                  w: Math.max(20, grid(d.orig.w + dx)),
                  h: Math.max(8, grid(d.orig.h + dy)),
                };
              }
              const stageBox = canvasWrapRef.current
                ?.querySelector("[data-stage-box='1']")
                ?.getBoundingClientRect();
              if (!stageBox) return obj;
              const cx = stageBox.left + (obj.x + obj.w / 2) * stageScale;
              const cy = stageBox.top + (obj.y + obj.h / 2) * stageScale;
              const angle = Math.round(
                (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI +
                  90,
              );
              return { ...obj, r: angle };
            }),
          };
        }),
      );
    };

    const onPointerUp = () => {
      if (dragStateRef.current) {
        dragStateRef.current = null;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [curSlide, snapOn, stageScale]);

  // Keyboard shortcuts (Undo/Redo, Delete, Arrow nudge, Presentation controls)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || "";
      if (
        editingId !== null ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return;
      }

      if (e.key === "Escape") {
        setExportMenuOpen(false);
        if (presenting) {
          setPresenting(false);
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (presenting) {
        if (["ArrowRight", " ", "PageDown"].includes(e.key)) {
          e.preventDefault();
          setPresIndex((i) => Math.min(slides.length - 1, i + 1));
        } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
          e.preventDefault();
          setPresIndex((i) => Math.max(0, i - 1));
        }
        return;
      }

      if (!selectedObj) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        pushSnapshot();
        setSlides((prev) =>
          prev.map((sl, idx) =>
            idx === curSlide
              ? { ...sl, o: sl.o.filter((o) => o.id !== selectedObj.id) }
              : sl,
          ),
        );
        setSelectedId(null);
        return;
      }

      const deltaMap: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const delta = deltaMap[e.key];
      if (delta) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setSlides((prev) =>
          prev.map((sl, idx) =>
            idx === curSlide
              ? {
                  ...sl,
                  o: sl.o.map((o) =>
                    o.id === selectedObj.id
                      ? { ...o, x: o.x + delta[0] * step, y: o.y + delta[1] * step }
                      : o,
                  ),
                }
              : sl,
          ),
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    curSlide,
    editingId,
    handleRedo,
    handleUndo,
    presenting,
    pushSnapshot,
    selectedObj,
    slides.length,
  ]);

  // Add element helper
  const addObjectToSlide = (t: SlideObjectType, overrides: Partial<SlideObject>) => {
    pushSnapshot();
    const id = nextIdRef.current++;
    const textColor = THEMES[themeName][2];
    const obj = createObject(id, t, textColor, overrides);
    setSlides((prev) =>
      prev.map((sl, idx) => (idx === curSlide ? { ...sl, o: [...sl.o, obj] } : sl)),
    );
    setSelectedId(id);
  };

  const updateSelectedObject = (
    updater: (obj: SlideObject) => SlideObject,
    recordSnap = false,
  ) => {
    if (!selectedObj) return;
    if (recordSnap) pushSnapshot();
    setSlides((prev) =>
      prev.map((sl, idx) =>
        idx === curSlide
          ? {
              ...sl,
              o: sl.o.map((o) => (o.id === selectedObj.id ? updater(o) : o)),
            }
          : sl,
      ),
    );
  };

  // Image upload
  const handleImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const w = Math.min(420, img.width || 320);
        const h = Math.round((w * (img.height || 240)) / (img.width || 320));
        addObjectToSlide("img", { src: dataUrl, x: 270, y: 100, w, h, rad: 16 });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Slide management
  const addSlideAfterCurrent = (layout: LayoutKind = "content") => {
    pushSnapshot();
    const newSlide = createLayoutSlide(layout, themeName, nextIdRef);
    setSlides((prev) => {
      const next = [...prev];
      next.splice(curSlide + 1, 0, newSlide);
      return next;
    });
    setCurSlide((c) => c + 1);
    setSelectedId(null);
  };

  const duplicateCurrentSlide = () => {
    pushSnapshot();
    const cloned: SlideItem = {
      ...activeSlide,
      o: activeSlide.o.map((o) => ({ ...o, id: nextIdRef.current++ })),
    };
    setSlides((prev) => {
      const next = [...prev];
      next.splice(curSlide + 1, 0, cloned);
      return next;
    });
    setCurSlide((c) => c + 1);
    setSelectedId(null);
  };

  const deleteCurrentSlide = () => {
    if (slides.length < 2) return;
    pushSnapshot();
    setSlides((prev) => prev.filter((_, i) => i !== curSlide));
    setCurSlide((c) => Math.max(0, Math.min(c, slides.length - 2)));
    setSelectedId(null);
  };

  const moveCurrentSlide = (dir: -1 | 1) => {
    const target = curSlide + dir;
    if (target < 0 || target >= slides.length) return;
    pushSnapshot();
    setSlides((prev) => {
      const next = [...prev];
      const tmp = next[curSlide];
      next[curSlide] = next[target];
      next[target] = tmp;
      return next;
    });
    setCurSlide(target);
  };

  const applyThemeAllSlides = (name: ThemeName) => {
    pushSnapshot();
    setThemeName(name);
    const [c1, c2, textColor] = THEMES[name];
    setSlides((prev) =>
      prev.map((sl) => ({
        ...sl,
        c1,
        c2,
        o: sl.o.map((o) => (o.t === "text" ? { ...o, color: textColor } : o)),
      })),
    );
    showToast(`Applied ${name} theme across deck`);
  };

  // Export .pptx natively via pptxgenjs
  const handleExportPptx = async () => {
    setExportMenuOpen(false);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_16x9";
      pptx.title = title || "GAMURA Presentation";

      slides.forEach((s) => {
        const sl = pptx.addSlide();
        sl.background = { color: s.c1.replace("#", "").slice(0, 6) };
        s.o.forEach((o) => {
          const hPx = o.t === "line" ? Math.min(o.h, 12) : o.h;
          const base = {
            x: o.x / 96,
            y: o.y / 96,
            w: o.w / 96,
            h: hPx / 96,
            rotate: o.r,
          };

          if (o.t === "img" && o.src) {
            sl.addImage({
              ...base,
              data: o.src,
              transparency: Math.round((1 - o.op) * 100),
              rounding: o.rad >= o.h / 2,
            });
          } else {
            const fillColor = o.fill.replace("#", "").slice(0, 6);
            const textColor = o.color.replace("#", "").slice(0, 6);
            const shape =
              o.t === "ellipse"
                ? pptx.ShapeType.ellipse
                : o.rad > 0 && o.t !== "text"
                  ? pptx.ShapeType.roundRect
                  : pptx.ShapeType.rect;

            sl.addText(o.t === "line" ? "" : o.text, {
              ...base,
              shape,
              rectRadius: Math.min(0.5, o.rad / 96 / 2),
              fill:
                o.t === "text"
                  ? undefined
                  : {
                      color: fillColor,
                      transparency: Math.round((1 - o.op) * 100),
                    },
              color: textColor,
              fontFace: o.ff,
              fontSize: o.fs * 0.75,
              bold: Boolean(o.b),
              italic: Boolean(o.i),
              align: o.al,
              valign: "middle",
            });
          }
        });
      });

      const fileName = `${(title || "Gamura-Deck").replace(/[^a-z0-9-_]+/gi, "-")}.pptx`;
      await pptx.writeFile({ fileName });
      showToast(`Exported ${fileName}`);
    } catch {
      showToast("Could not export .pptx deck");
    }
  };

  const handleSaveJsonProject = () => {
    setExportMenuOpen(false);
    const payload = JSON.stringify({
      S: slides,
      th: themeName,
      uid: nextIdRef.current,
      t: title,
    });
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "gamura-ppt").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Saved presentation project (.json)");
  };

  const handleOpenJsonProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((raw) => {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.S) && parsed.S.length > 0) {
          pushSnapshot();
          setSlides(parsed.S);
          if (parsed.th && THEMES[parsed.th as ThemeName]) {
            setThemeName(parsed.th);
          }
          if (typeof parsed.uid === "number") {
            nextIdRef.current = Math.max(nextIdRef.current, parsed.uid + 10);
          }
          setTitle(parsed.t || "Imported Presentation");
          setCurSlide(0);
          setSelectedId(null);
          showToast("Loaded project");
        } else {
          showToast("Invalid presentation file");
        }
      } catch {
        showToast("Could not read project file");
      }
    });
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-ppt-cred");
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

  const startPresentation = () => {
    setPresIndex(curSlide);
    setPresenting(true);
    setSelectedId(null);
    setEditingId(null);
    window.setTimeout(() => {
      presWrapRef.current?.requestFullscreen?.().catch(() => {});
    }, 20);
  };

  // Visual design tokens
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

  return (
    <div
      onClick={() => exportMenuOpen && setExportMenuOpen(false)}
      className={`relative h-screen w-full overflow-hidden flex flex-col ${pageBg}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Ambient Radial Glass Aura Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-[-20%] z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(40% 40% at 20% 20%, rgba(16,185,129,0.34), transparent), radial-gradient(40% 40% at 85% 15%, rgba(10,132,255,0.26), transparent), radial-gradient(45% 45% at 70% 90%, rgba(191,90,242,0.22), transparent)",
        }}
      />

      {/* Hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleOpenJsonProject}
      />

      {/* Grid Shell */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)_274px] grid-rows-[56px_84px_minmax(0,1fr)_200px] lg:grid-rows-[56px_minmax(0,1fr)] gap-2.5 p-2.5 h-full">
        {/* TOP BAR */}
        <header
          className={`lg:col-span-3 rounded-[18px] px-3 flex items-center justify-between gap-2 relative z-20 ${glassCls}`}
        >
          <div className="flex items-center gap-1.5 shrink-0">
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

            <span className="hidden sm:inline-block font-extrabold tracking-[0.12em] text-xs pl-1 bg-gradient-to-r from-[#10b981] to-[#0a84ff] bg-clip-text text-transparent select-none">
              PPT CRED
            </span>
          </div>

          <input
            type="text"
            aria-label="Presentation Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Presentation"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-center font-semibold text-sm sm:text-[15px] px-2 truncate"
          />

          <div className="flex items-center gap-1.5 shrink-0">
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
                  setExportMenuOpen((v) => !v);
                }}
                className={`h-8 px-2.5 sm:px-3 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${btnFill}`}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={12} />
              </button>

              {exportMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-10 min-w-[185px] rounded-[14px] p-1.5 flex flex-col gap-0.5 z-30 ${glassCls}`}
                >
                  <button
                    type="button"
                    onClick={handleExportPptx}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left flex items-center gap-2 cursor-pointer ${btnFill} bg-transparent`}
                  >
                    <Download size={13} className="text-[#10b981]" />
                    <span>Download .pptx</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveJsonProject}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left flex items-center gap-2 cursor-pointer ${btnFill} bg-transparent`}
                  >
                    <Save size={13} className="text-[#0a84ff]" />
                    <span>Save project (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      projectInputRef.current?.click();
                    }}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs font-semibold text-left flex items-center gap-2 cursor-pointer ${btnFill} bg-transparent`}
                  >
                    <FolderOpen size={13} />
                    <span>Open project…</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={startPresentation}
              className="h-8 px-3 rounded-[10px] bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Play size={12} fill="currentColor" />
              <span>Present</span>
            </button>
          </div>
        </header>

        {/* SLIDE RAIL */}
        <aside
          className={`rounded-[18px] flex flex-row lg:flex-col overflow-hidden ${glassCls}`}
        >
          <div
            className={`flex flex-col lg:flex-row gap-1 p-1.5 border-r lg:border-r-0 lg:border-b ${lineCls} shrink-0`}
          >
            <button
              type="button"
              onClick={() => addSlideAfterCurrent("content")}
              title="New slide"
              aria-label="New slide"
              className={`w-9 lg:flex-1 h-7 rounded-[8px] flex items-center justify-center cursor-pointer ${btnFill}`}
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={duplicateCurrentSlide}
              title="Duplicate slide"
              aria-label="Duplicate slide"
              className={`w-9 lg:flex-1 h-7 rounded-[8px] flex items-center justify-center cursor-pointer ${btnFill}`}
            >
              <Layers size={13} />
            </button>
            <button
              type="button"
              disabled={curSlide === 0}
              onClick={() => moveCurrentSlide(-1)}
              title="Move slide up"
              aria-label="Move slide up"
              className={`hidden lg:flex lg:flex-1 h-7 rounded-[8px] items-center justify-center cursor-pointer disabled:opacity-35 ${btnFill}`}
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              disabled={curSlide === slides.length - 1}
              onClick={() => moveCurrentSlide(1)}
              title="Move slide down"
              aria-label="Move slide down"
              className={`hidden lg:flex lg:flex-1 h-7 rounded-[8px] items-center justify-center cursor-pointer disabled:opacity-35 ${btnFill}`}
            >
              <ArrowDown size={13} />
            </button>
            <button
              type="button"
              disabled={slides.length < 2}
              onClick={deleteCurrentSlide}
              title="Delete slide"
              aria-label="Delete slide"
              className={`w-9 lg:flex-1 h-7 rounded-[8px] flex items-center justify-center cursor-pointer disabled:opacity-35 text-[#ff3b30] ${btnFill}`}
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div
            ref={railWrapRef}
            className="flex-1 overflow-auto p-2 flex flex-row lg:flex-col items-center lg:items-stretch gap-2.5 no-scrollbar"
          >
            {slides.map((sl, idx) => {
              const active = idx === curSlide;
              return (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  data-thumb="1"
                  onClick={() => {
                    setCurSlide(idx);
                    setSelectedId(null);
                    setEditingId(null);
                  }}
                  className={`relative w-[112px] lg:w-full aspect-video rounded-[8px] overflow-hidden shrink-0 cursor-pointer shadow-sm transition-all ${
                    active ? "ring-2 ring-[#10b981]" : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className="pointer-events-none w-full h-full">
                    <SlideStagePreview slide={sl} scale={railScale} />
                  </div>
                  <span className="absolute left-1.5 bottom-1 px-1.5 py-0.5 rounded bg-black/55 text-white text-[10px] font-bold">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER STAGE + BOTTOM DOCK */}
        <section
          ref={canvasWrapRef}
          className={`relative rounded-[18px] flex items-center justify-center overflow-hidden ${
            isDark ? "bg-white/[0.04]" : "bg-black/[0.05]"
          } border ${lineCls}`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedId(null);
              setEditingId(null);
            }
          }}
        >
          <div
            data-stage-box="1"
            className="relative rounded-[6px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.32)]"
            style={{
              width: STAGE_W * stageScale,
              height: STAGE_H * stageScale,
            }}
          >
            <SlideStagePreview
              slide={activeSlide}
              scale={stageScale}
              interactive
              selectedId={selectedId}
              editingId={editingId}
              onSelectObject={(id) => {
                setSelectedId(id);
                if (id !== editingId) setEditingId(null);
              }}
              onStartDrag={handleStartDrag}
              onDoubleClickObject={(obj) => {
                setSelectedId(obj.id);
                setEditingId(obj.id);
              }}
              onFinishEditText={(id, nextText) => {
                pushSnapshot();
                setSlides((prev) =>
                  prev.map((sl, idx) =>
                    idx === curSlide
                      ? {
                          ...sl,
                          o: sl.o.map((o) =>
                            o.id === id ? { ...o, text: nextText } : o,
                          ),
                        }
                      : sl,
                  ),
                );
                setEditingId(null);
              }}
            />
          </div>

          {/* Floating Insert Dock */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-2.5 rounded-[14px] p-1 flex items-center gap-1 max-w-[95%] overflow-x-auto no-scrollbar ${glassCls}`}
          >
            <button
              type="button"
              onClick={() =>
                addObjectToSlide("text", {
                  x: 300,
                  y: 200,
                  w: 360,
                  h: 80,
                  text: "New text",
                  fs: 36,
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
                addObjectToSlide("rect", {
                  x: 340,
                  y: 190,
                  w: 280,
                  h: 160,
                  rad: 24,
                  text: "",
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Square size={13} />
              <span>Box</span>
            </button>
            <button
              type="button"
              onClick={() =>
                addObjectToSlide("ellipse", {
                  x: 380,
                  y: 170,
                  w: 200,
                  h: 200,
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
              onClick={() =>
                addObjectToSlide("line", {
                  x: 300,
                  y: 270,
                  w: 360,
                  h: 6,
                  fill: "#ffffff",
                  rad: 3,
                })
              }
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Minus size={13} />
              <span>Line</span>
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ImageIcon size={13} />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={() =>
                addObjectToSlide("text", {
                  x: 420,
                  y: 200,
                  w: 120,
                  h: 120,
                  fs: 90,
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
                  ? "bg-[#10b981] text-white"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <Grid size={13} />
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
                  Slide Background
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Gradient A</label>
                    <input
                      type="color"
                      value={activeSlide.c1}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlides((prev) =>
                          prev.map((sl, idx) =>
                            idx === curSlide ? { ...sl, c1: val } : sl,
                          ),
                        );
                      }}
                      className="w-11 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Gradient B</label>
                    <input
                      type="color"
                      value={activeSlide.c2}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlides((prev) =>
                          prev.map((sl, idx) =>
                            idx === curSlide ? { ...sl, c2: val } : sl,
                          ),
                        );
                      }}
                      className="w-11 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${mutedTxt}`}>
                  Themes (All Slides)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(THEMES) as ThemeName[]).map((name) => {
                    const active = themeName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => applyThemeAllSlides(name)}
                        style={{
                          background: `linear-gradient(135deg, ${THEMES[name][0]}, ${THEMES[name][1]})`,
                        }}
                        className={`w-9 h-7 rounded-[8px] border-2 cursor-pointer transition-transform ${
                          active
                            ? "border-[#10b981] scale-105"
                            : isDark
                              ? "border-white/20"
                              : "border-black/15"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${mutedTxt}`}>
                  Add Slide Layout
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { k: "title", label: "Title" },
                      { k: "content", label: "Content" },
                      { k: "two", label: "Two box" },
                      { k: "blank", label: "Blank" },
                    ] as { k: LayoutKind; label: string }[]
                  ).map((lay) => (
                    <button
                      key={lay.k}
                      type="button"
                      onClick={() => addSlideAfterCurrent(lay.k)}
                      className={`py-1.5 px-2.5 rounded-[10px] text-xs font-semibold cursor-pointer ${btnFill}`}
                    >
                      {lay.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${mutedTxt}`}>
                Tap an object to style it. Double-click text to type directly on the canvas. Drag the blue dot to rotate or the corner handle to resize.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${mutedTxt}`}>
                  {selectedObj.t}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md cursor-pointer ${btnFill}`}
                >
                  Done
                </button>
              </div>

              {selectedObj.t !== "text" && selectedObj.t !== "img" && (
                <div className="flex items-center justify-between gap-2">
                  <label className={`text-xs ${mutedTxt}`}>Fill</label>
                  <input
                    type="color"
                    value={selectedObj.fill.slice(0, 7)}
                    onFocus={() => pushSnapshot()}
                    onChange={(e) =>
                      updateSelectedObject((o) => ({ ...o, fill: e.target.value }))
                    }
                    className="w-11 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                </div>
              )}

              {selectedObj.t !== "img" && selectedObj.t !== "line" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Text Color</label>
                    <input
                      type="color"
                      value={selectedObj.color}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelectedObject((o) => ({ ...o, color: e.target.value }))
                      }
                      className="w-11 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs ${mutedTxt}`}>Font</label>
                    <select
                      value={selectedObj.ff}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelectedObject((o) => ({ ...o, ff: e.target.value }))
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
                      min={8}
                      max={300}
                      value={selectedObj.fs}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelectedObject((o) => ({
                          ...o,
                          fs: Number(e.target.value) || 12,
                        }))
                      }
                      className={`px-2 py-1 rounded-[8px] text-xs outline-none w-[84px] ${btnFill}`}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedObject((o) => ({ ...o, b: o.b ? 0 : 1 }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.b ? "bg-[#10b981] text-white" : btnFill
                      }`}
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedObject((o) => ({ ...o, i: o.i ? 0 : 1 }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.i ? "bg-[#10b981] text-white" : btnFill
                      }`}
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedObject((o) => ({ ...o, al: "left" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "left" ? "bg-[#10b981] text-white" : btnFill
                      }`}
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedObject((o) => ({ ...o, al: "center" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "center" ? "bg-[#10b981] text-white" : btnFill
                      }`}
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedObject((o) => ({ ...o, al: "right" }), true)
                      }
                      className={`flex-1 py-1.5 rounded-[8px] flex items-center justify-center cursor-pointer ${
                        selectedObj.al === "right" ? "bg-[#10b981] text-white" : btnFill
                      }`}
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${mutedTxt}`}>
                      Text Content
                    </label>
                    <textarea
                      rows={2}
                      value={selectedObj.text}
                      onFocus={() => pushSnapshot()}
                      onChange={(e) =>
                        updateSelectedObject((o) => ({ ...o, text: e.target.value }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-[8px] text-xs outline-none resize-y ${btnFill}`}
                    />
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
                    updateSelectedObject((o) => ({
                      ...o,
                      op: Number(e.target.value),
                    }))
                  }
                  className="w-28 accent-[#10b981] cursor-pointer"
                />
              </div>

              {selectedObj.t !== "ellipse" && selectedObj.t !== "line" && (
                <div className="flex items-center justify-between gap-2">
                  <label className={`text-xs ${mutedTxt}`}>Corners</label>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={selectedObj.rad}
                    onFocus={() => pushSnapshot()}
                    onChange={(e) =>
                      updateSelectedObject((o) => ({
                        ...o,
                        rad: Number(e.target.value),
                      }))
                    }
                    className="w-28 accent-[#10b981] cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <label className={`text-xs ${mutedTxt}`}>Rotate (°)</label>
                <input
                  type="number"
                  value={selectedObj.r}
                  onFocus={() => pushSnapshot()}
                  onChange={(e) =>
                    updateSelectedObject((o) => ({
                      ...o,
                      r: Number(e.target.value) || 0,
                    }))
                  }
                  className={`px-2 py-1 rounded-[8px] text-xs outline-none w-[84px] ${btnFill}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    setSlides((prev) =>
                      prev.map((sl, idx) => {
                        if (idx !== curSlide) return sl;
                        const rest = sl.o.filter((o) => o.id !== selectedObj.id);
                        return { ...sl, o: [...rest, selectedObj] };
                      }),
                    );
                  }}
                  className={`py-1.5 px-2 rounded-[8px] text-xs font-semibold cursor-pointer ${btnFill}`}
                >
                  Bring Front
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushSnapshot();
                    setSlides((prev) =>
                      prev.map((sl, idx) => {
                        if (idx !== curSlide) return sl;
                        const rest = sl.o.filter((o) => o.id !== selectedObj.id);
                        return { ...sl, o: [selectedObj, ...rest] };
                      }),
                    );
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
                    const dup: SlideObject = {
                      ...selectedObj,
                      id: nextId,
                      x: selectedObj.x + 24,
                      y: selectedObj.y + 24,
                    };
                    setSlides((prev) =>
                      prev.map((sl, idx) =>
                        idx === curSlide ? { ...sl, o: [...sl.o, dup] } : sl,
                      ),
                    );
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
                    setSlides((prev) =>
                      prev.map((sl, idx) =>
                        idx === curSlide
                          ? {
                              ...sl,
                              o: sl.o.filter((o) => o.id !== selectedObj.id),
                            }
                          : sl,
                      ),
                    );
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

      {/* FULLSCREEN PRESENTATION OVERLAY */}
      {presenting && (
        <div
          ref={presWrapRef}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-pres-close='1']")) return;
            if (e.clientX > window.innerWidth / 3) {
              setPresIndex((i) => Math.min(slides.length - 1, i + 1));
            } else {
              setPresIndex((i) => Math.max(0, i - 1));
            }
          }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
        >
          <button
            type="button"
            data-pres-close="1"
            onClick={() => {
              setPresenting(false);
              if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
              }
            }}
            className="absolute right-4 top-4 z-10 px-3.5 py-2 rounded-full bg-white/18 hover:bg-white/28 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <X size={14} />
            <span>Esc</span>
          </button>

          <div
            className="relative overflow-hidden shadow-2xl"
            style={{
              width: STAGE_W * presScale,
              height: STAGE_H * presScale,
            }}
          >
            <SlideStagePreview
              slide={slides[presIndex] || slides[0]}
              scale={presScale}
            />
          </div>

          <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 text-xs text-white/75 font-medium">
            {presIndex + 1} / {slides.length}
          </span>
        </div>
      )}

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
