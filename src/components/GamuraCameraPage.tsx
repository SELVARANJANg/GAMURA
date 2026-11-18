import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Compass,
  Download,
  ExternalLink,
  FlipHorizontal,
  Frame,
  Grid3X3,
  HardDrive,
  Image as ImageIcon,
  Layers,
  Plus,
  Repeat,
  RotateCcw,
  RotateCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  SwitchCamera,
  Timer,
  Trash2,
  Upload,
  Video as VideoIcon,
  Wand2,
  Zap,
} from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  GAMURA_CAMERA_LOGO_FALLBACK,
  GAMURA_CAMERA_LOGO_URL,
  StoreAppItem,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
} from "../utils/gamuraStoreApps";
import {
  UNIVERSE_PREFS_STORAGE_KEY,
  loadUniversePreferences,
} from "./UniverseSettingsView";

interface GamuraCameraPageProps {
  onBackHome: () => void;
}

interface FilterParams {
  b?: number;
  c?: number;
  s?: number;
  w?: number;
  t?: number;
  g?: number;
  sp?: number;
  inv?: number;
  blur?: number;
  fade?: number;
  vig?: number;
  grain?: number;
}

interface AdjValues {
  b: number;
  c: number;
  s: number;
  w: number;
  fade: number;
  vig: number;
  grain: number;
  t: number;
  sh: number;
  hi: number;
  sharp: number;
}

interface CameraPhotoItem {
  id: string;
  src: HTMLCanvasElement;
  pi: number;
  int: number;
  adj: AdjValues;
  ang: number;
  frame: "w" | "b" | null;
  wm: boolean;
  txt: string;
  rot: number;
  flip: boolean;
  crop: [number, number] | null;
  thumb: string;
  createdAt: number;
}

interface RecordedVideoItem {
  id: string;
  url: string;
  filename: string;
  durationSec: number;
  createdAt: number;
}

const CAMERA_STORAGE_KEY = "gamura_camera_saved_photos_v1";
const MAX_STORED_PHOTOS = 18;

interface StoredCameraPhoto {
  id: string;
  dataUrl: string;
  thumb: string;
  pi: number;
  int: number;
  adj: AdjValues;
  ang: number;
  frame: "w" | "b" | null;
  wm: boolean;
  txt: string;
  rot: number;
  flip: boolean;
  crop: [number, number] | null;
  createdAt: number;
}

const DEFAULT_ADJ: AdjValues = {
  b: 0,
  c: 0,
  s: 0,
  w: 0,
  fade: 0,
  vig: 0,
  grain: 0,
  t: 0,
  sh: 0,
  hi: 0,
  sharp: 0,
};

const PRESET_FILTERS: [string, FilterParams][] = [
  ["Normal", {}],
  ["Grayscale", { g: 1 }],
  ["Sepia", { sp: 1, c: 8 }],
  ["High Contrast", { c: 65, s: 12, b: 4 }],
  ["Vivid", { s: 38, c: 14 }],
  ["Clarendon", { c: 22, s: 35, b: 6, w: -8 }],
  ["Juno", { c: 18, s: 40, w: 12, t: -6 }],
  ["Lark", { b: 10, c: -8, s: 18, w: -10 }],
  ["Gingham", { b: 8, c: -14, s: -22, fade: 0.28, w: 6 }],
  ["Valencia", { sp: 0.2, b: 8, c: 10, s: 14, w: 22 }],
  ["Nashville", { b: 8, c: 18, s: 15, w: 28, t: -12 }],
  ["Perpetua", { b: 6, s: 12, t: 18, fade: 0.15 }],
  ["Portrait", { c: 8, s: -4, w: 9, b: 5, vig: 0.2, fade: 0.05 }],
  ["Noir", { g: 1, c: 34, vig: 0.45 }],
  ["Silver", { g: 1, c: -6, b: 7, fade: 0.22 }],
  ["Warm", { w: 32, s: 10, b: 5 }],
  ["Ice", { w: -32, c: 8, s: 5 }],
  ["Emerald", { w: -12, s: 16, c: 10, t: 30 }],
  ["Vintage", { sp: 0.45, fade: 0.4, vig: 0.4, grain: 0.5, w: 15 }],
  ["Cinema", { c: 22, s: -12, w: -8, t: 12, vig: 0.5 }],
  ["Pop", { s: 62, c: 22, b: 5 }],
  ["Dream", { b: 10, c: -12, fade: 0.3, w: 10, s: 10 }],
  ["Film", { grain: 0.7, fade: 0.25, c: 10, w: 8, s: -8 }],
  ["Chrome", { c: 20, s: -8, b: 4, fade: 0.08 }],
  ["Matte", { fade: 0.45, c: -6, s: -10 }],
  ["Mono", { g: 1, c: 12, fade: 0.1 }],
  ["Sunset", { w: 45, s: 20, c: 8, t: -8, vig: 0.25 }],
  ["Teal Orange", { w: 14, t: 20, c: 20, s: 14, vig: 0.3 }],
  ["Moody", { b: -10, c: 25, s: -18, vig: 0.55, w: -6 }],
  ["Golden", { w: 38, b: 8, s: 14, fade: 0.1, vig: 0.2 }],
  ["Crisp", { c: 25, s: 12, b: 3 }],
  ["Kodak", { w: 18, s: 8, c: 12, fade: 0.15, grain: 0.35, sp: 0.15 }],
  ["Lomo", { s: 35, c: 30, vig: 0.7, grain: 0.3, t: 10 }],
  ["Neon", { s: 90, c: 30, t: 25, w: -20 }],
  ["Cyberpunk", { s: 75, c: 32, w: -45, t: 35, vig: 0.4 }],
  ["Obsidian", { b: -12, c: 42, s: -25, vig: 0.65 }],
  ["Soft Glow", { b: 12, c: -10, blur: 1, s: 12 }],
  ["Pastel", { b: 12, c: -18, s: -10, fade: 0.3, w: 6 }],
  ["Drama", { c: 40, s: -15, vig: 0.5, b: -4 }],
  ["Invert X", { inv: 1, c: 15 }],
];

const ADJ_DEFS: [keyof AdjValues, string, number, number][] = [
  ["b", "Brightness", -60, 60],
  ["c", "Contrast", -60, 60],
  ["s", "Saturation", -100, 100],
  ["w", "Warmth", -60, 60],
  ["fade", "Fade", 0, 100],
  ["vig", "Vignette", 0, 100],
  ["grain", "Grain", 0, 100],
  ["t", "Tint", -60, 60],
  ["sh", "Shadows", -60, 60],
  ["hi", "Highlights", -60, 60],
  ["sharp", "Sharpness", 0, 100],
];

const CROP_DEFS: [string, [number, number] | null][] = [
  ["Original", null],
  ["1:1", [1, 1]],
  ["4:5", [4, 5]],
  ["3:4", [3, 4]],
  ["16:9", [16, 9]],
  ["9:16", [9, 16]],
];

const RATIOS: [string, number, number][] = [
  ["4:3", 4, 3],
  ["1:1", 1, 1],
  ["16:9", 16, 9],
  ["9:16", 9, 16],
];

const MODES = [
  "PHOTO",
  "SQUARE",
  "PORTRAIT",
  "BOOMERANG",
  "BURST 3×",
  "B&W",
  "VIDEO",
] as const;
type CamMode = (typeof MODES)[number];
type CameraProfile = "iphone" | "instagram" | "facebook" | "pro";
type FrameOverlay = "none" | "cg-badge" | "ig-story" | "fb-polaroid";
type CameraView = "cam" | "edit" | "gal";
type EditorTab = "pf" | "pa" | "pt";

const CAMERA_PROFILES: {
  id: CameraProfile;
  label: string;
  desc: string;
}[] = [
  { id: "iphone", label: "iPhone", desc: "Photographic Styles & Leveler" },
  { id: "instagram", label: "Instagram", desc: "Stories 9:16, Clarendon & Boomerang" },
  { id: "facebook", label: "Facebook", desc: "Social Polaroid & Soft Beauty" },
  { id: "pro", label: "CG Pro", desc: "Histogram, Manual Gain & Gyro" },
];

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function cssFilterFromPreset(p: FilterParams, expo: number): string {
  return `brightness(${1 + (p.b || 0) / 100}) contrast(${1 + (p.c || 0) / 100}) saturate(${1 + (p.s || 0) / 100}) grayscale(${p.g || 0}) sepia(${p.sp || 0}) invert(${p.inv || 0}) blur(${p.blur || 0}px) hue-rotate(${-(p.w || 0) * 0.2}deg) brightness(${1 + expo / 100})`;
}

function buildGeometryCanvas(
  photo: CameraPhotoItem,
  maxDim: number,
): HTMLCanvasElement {
  const src = photo.src;
  const rotOdd = photo.rot % 2 === 1;
  const w = src.width;
  const h = src.height;
  const cw = rotOdd ? h : w;
  const ch = rotOdd ? w : h;

  const temp = document.createElement("canvas");
  temp.width = cw;
  temp.height = ch;
  const ctx = temp.getContext("2d")!;

  const absRad = (Math.abs(photo.ang || 0) * Math.PI) / 180;
  const scaleFill = Math.cos(absRad) + Math.max(cw / ch, ch / cw) * Math.sin(absRad);
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((photo.rot * Math.PI) / 2 + ((photo.ang || 0) * Math.PI) / 180);
  ctx.scale(scaleFill, scaleFill);
  if (photo.flip) ctx.scale(-1, 1);
  ctx.drawImage(src, -w / 2, -h / 2);

  let tw = cw;
  let th = ch;
  let ox = 0;
  let oy = 0;
  if (photo.crop) {
    const [ca, cb] = photo.crop;
    tw = cw;
    th = (cw * cb) / ca;
    if (th > ch) {
      th = ch;
      tw = (ch * ca) / cb;
    }
    ox = (cw - tw) / 2;
    oy = (ch - th) / 2;
  }

  const s = Math.min(1, maxDim / Math.max(tw, th));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(tw * s));
  out.height = Math.max(1, Math.round(th * s));
  out.getContext("2d")!.drawImage(temp, ox, oy, tw, th, 0, 0, out.width, out.height);
  return out;
}

interface ProcessedParams {
  b: number;
  c: number;
  s: number;
  w: number;
  t: number;
  sh: number;
  hi: number;
  sharp: number;
  fade: number;
  vig: number;
  grain: number;
  g: number;
  sp: number;
  inv: number;
  blur: number;
}

function resolvePhotoParams(photo: CameraPhotoItem): ProcessedParams {
  const base = PRESET_FILTERS[photo.pi]?.[1] || {};
  const k = photo.int / 100;
  const a = photo.adj;
  const getScaled = (key: keyof FilterParams) => (base[key] || 0) * k;
  return {
    b: getScaled("b") + a.b,
    c: Math.max(-95, Math.min(95, getScaled("c") + a.c)),
    s: getScaled("s") + a.s,
    w: getScaled("w") + a.w,
    t: a.t + getScaled("t"),
    sh: a.sh,
    hi: a.hi,
    sharp: a.sharp / 100,
    fade: getScaled("fade") + a.fade / 100,
    vig: getScaled("vig") + a.vig / 100,
    grain: getScaled("grain") + a.grain / 100,
    g: getScaled("g"),
    sp: getScaled("sp"),
    inv: getScaled("inv"),
    blur: getScaled("blur"),
  };
}

function processPixels(src: HTMLCanvasElement, p: ProcessedParams): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0);

  const im = ctx.getImageData(0, 0, w, h);
  const d = im.data;
  const contrastK = p.c * 2.55;
  const cf = (259 * (contrastK + 255)) / (255 * (259 - contrastK));
  const sat = Math.max(0, 1 + p.s / 100);
  const B = p.b * 2.55;
  const W = p.w * 0.5;
  const T = p.t * 0.3;
  const cx = w / 2;
  const cy = h / 2;
  const maxD = cx * cx + cy * cy || 1;

  for (let y = 0, i = 0; y < h; y++) {
    const dy = (y - cy) * (y - cy);
    for (let x = 0; x < w; x++, i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (p.g) {
        r += (lum - r) * p.g;
        g += (lum - g) * p.g;
        b += (lum - b) * p.g;
      }
      if (p.sp) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * p.sp;
        g += (sg - g) * p.sp;
        b += (sb - b) * p.sp;
      }

      lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * sat;
      g = lum + (g - lum) * sat;
      b = lum + (b - lum) * sat;

      r += W - T * 0.5;
      g += T;
      b += -W - T * 0.5;

      r = (r - 128) * cf + 128 + B;
      g = (g - 128) * cf + 128 + B;
      b = (b - 128) * cf + 128 + B;

      if (p.sh || p.hi) {
        const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const lift = p.sh * 0.9 * (1 - L) * (1 - L) + p.hi * 0.9 * L * L;
        r += lift;
        g += lift;
        b += lift;
      }
      if (p.fade) {
        const f = p.fade * 55;
        r += f * (1 - r / 255);
        g += f * (1 - g / 255);
        b += f * (1 - b / 255);
      }
      if (p.vig) {
        const m = 1 - p.vig * Math.pow(((x - cx) * (x - cx) + dy) / maxD, 1.2);
        r *= m;
        g *= m;
        b *= m;
      }
      if (p.grain) {
        const n = (Math.random() - 0.5) * p.grain * 70;
        r += n;
        g += n;
        b += n;
      }

      if (p.inv) {
        r += (255 - 2 * r) * p.inv;
        g += (255 - 2 * g) * p.inv;
        b += (255 - 2 * b) * p.inv;
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  }
  ctx.putImageData(im, 0, 0);

  if (p.blur > 0) {
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext("2d")!;
    gCtx.filter = `blur(${p.blur}px)`;
    gCtx.drawImage(c, 0, 0);
    ctx.drawImage(glowCanvas, 0, 0);
  }

  if (p.sharp > 0) {
    const s = ctx.getImageData(0, 0, w, h);
    const o = s.data;
    const q = new Uint8ClampedArray(o);
    const sk = p.sharp * 1.2;
    const stride = w * 4;
    for (let i = stride + 4; i < q.length - stride - 4; i += 4) {
      const cx2 = (i / 4) % w;
      if (cx2 === 0 || cx2 === w - 1) continue;
      for (let j = 0; j < 3; j++) {
        const idx = i + j;
        o[idx] =
          q[idx] * (1 + 4 * sk) -
          sk * (q[idx - 4] + q[idx + 4] + q[idx - stride] + q[idx + stride]);
      }
    }
    ctx.putImageData(s, 0, 0);
  }

  return c;
}

function decorateCanvas(c: HTMLCanvasElement, photo: CameraPhotoItem): HTMLCanvasElement {
  const ctx = c.getContext("2d")!;
  const maxDim = Math.max(c.width, c.height);
  if (photo.frame) {
    const bw = Math.round(maxDim * 0.035);
    ctx.strokeStyle = photo.frame === "w" ? "#ffffff" : "#000000";
    ctx.lineWidth = bw * 2;
    ctx.strokeRect(0, 0, c.width, c.height);
  }
  if (photo.txt) {
    ctx.font = `700 ${Math.round(maxDim * 0.045)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = maxDim * 0.012;
    ctx.fillText(photo.txt, c.width / 2, c.height * 0.9);
  }
  if (photo.wm) {
    ctx.font = `600 ${Math.round(maxDim * 0.022)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = maxDim * 0.005;
    ctx.fillText("CG PIC · GAMURA CAMERA", c.width - maxDim * 0.03, c.height - maxDim * 0.03);
  }
  return c;
}

export default function GamuraCameraPage({ onBackHome }: GamuraCameraPageProps) {
  const [logoStage, setLogoStage] = useState(0);
  const logoSrc =
    logoStage === 0
      ? GAMURA_CAMERA_LOGO_URL
      : logoStage === 1
        ? "/assets/aistudio/cgpic-logo_43c1db18.png"
        : GAMURA_CAMERA_LOGO_FALLBACK;

  const [installedInUniverse, setInstalledInUniverse] = useState(() => {
    const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
    return list.some((a) => a.id === "gamura-camera");
  });

  const [view, setView] = useState<CameraView>("cam");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Camera viewfinder & studio profiles state
  const [cameraProfile, setCameraProfile] = useState<CameraProfile>("iphone");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [mode, setMode] = useState<CamMode>("PHOTO");
  const [ratioIdx, setRatioIdx] = useState(0);
  const [liveFilterIdx, setLiveFilterIdx] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [screenFlashOpacity, setScreenFlashOpacity] = useState(0);
  const [timerSec, setTimerSec] = useState<0 | 3 | 5 | 10>(0);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [gridOn, setGridOn] = useState(false);
  const [hdrOn, setHdrOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [expo, setExpo] = useState(0);
  const [beautyOn, setBeautyOn] = useState(false);
  const [frameOverlay, setFrameOverlay] = useState<FrameOverlay>("none");
  const [cameraBlockedReason, setCameraBlockedReason] = useState<string | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [isDemoFeed, setIsDemoFeed] = useState(false);
  const [busyCapture, setBusyCapture] = useState(false);

  // Focus reticle + exposure
  const [focusBox, setFocusBox] = useState<{ x: number; y: number } | null>(null);
  const focusTimerRef = useRef<number | null>(null);

  // Full 3-Axis Gyroscope & Artificial Horizon Leveler
  const [gyroEnabled, setGyroEnabled] = useState(true);
  const [gyroStabilize, setGyroStabilize] = useState(false);
  const [gyroTelemetry, setGyroTelemetry] = useState<{
    alpha: number;
    beta: number;
    gamma: number;
    hasSensor: boolean;
  }>({ alpha: 0, beta: 0, gamma: 0, hasSensor: false });
  const [showHistogram, setShowHistogram] = useState(false);
  const histogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const demoFeedRafRef = useRef<number | null>(null);
  const shutterFlashTimerRef = useRef<number | null>(null);

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recorderRef = useRef<{
    mr: MediaRecorder;
    stopDraw: () => void;
    iv: number;
  } | null>(null);

  // Viewfinder mask box
  const [maskSize, setMaskSize] = useState<{ w: number; h: number }>({ w: 320, h: 240 });

  // Photos & Videos session state
  const [photos, setPhotos] = useState<CameraPhotoItem[]>([]);
  const [videos, setVideos] = useState<RecordedVideoItem[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [cameraDeviceCount, setCameraDeviceCount] = useState<number>(0);
  const [hasFrontBackSwitch, setHasFrontBackSwitch] = useState<boolean>(() =>
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ""),
  );
  const [storedPhotoIds, setStoredPhotoIds] = useState<Set<string>>(new Set());

  // Editor UI state
  const [editorTab, setEditorTab] = useState<EditorTab>("pf");
  const [showOriginal, setShowOriginal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [thumbPreviews, setThumbPreviews] = useState<string[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseGeoRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nativeCamInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraStartSeqRef = useRef(0);
  const isMountedRef = useRef(true);
  const computeMaskBoxRef = useRef<() => void>(() => {});

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      if (shutterFlashTimerRef.current) window.clearTimeout(shutterFlashTimerRef.current);
      if (demoFeedRafRef.current) cancelAnimationFrame(demoFeedRafRef.current);
    };
  }, []);

  const activePhoto = useMemo(
    () => photos.find((p) => p.id === activePhotoId) || null,
    [photos, activePhotoId],
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "GAMURA CAMERA · CG PIC";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const detectAvailableCameras = useCallback(async (activeStream?: MediaStream | null) => {
    const isMobileUA =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");

    let count = 0;
    let multiFacing = false;

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        count = videoInputs.length;
        const labels = videoInputs.map((d) => d.label.toLowerCase()).join(" ");
        if (count >= 2 || (labels.includes("front") && labels.includes("back"))) {
          multiFacing = true;
        }
      } catch {
        // ignore enumerateDevices errors
      }
    }

    if (activeStream) {
      const track = activeStream.getVideoTracks()[0];
      const caps = track?.getCapabilities ? (track.getCapabilities() as any) : null;
      if (Array.isArray(caps?.facingMode) && caps.facingMode.length > 1) {
        multiFacing = true;
      }
    }

    setCameraDeviceCount(count);
    setHasFrontBackSwitch(multiFacing || isMobileUA);
  }, []);

  const persistPhotosToBrowser = useCallback((items: CameraPhotoItem[]) => {
    const prefs = loadUniversePreferences();
    if (!prefs.allowAccess.storage) return;

    const toStore = items.slice(0, MAX_STORED_PHOTOS).map((p) => {
      const maxSaveDim = 1280;
      const scale = Math.min(1, maxSaveDim / Math.max(p.src.width, p.src.height));
      const sc = document.createElement("canvas");
      sc.width = Math.max(1, Math.round(p.src.width * scale));
      sc.height = Math.max(1, Math.round(p.src.height * scale));
      sc.getContext("2d")!.drawImage(p.src, 0, 0, sc.width, sc.height);
      const record: StoredCameraPhoto = {
        id: p.id,
        dataUrl: sc.toDataURL("image/jpeg", 0.82),
        thumb: p.thumb,
        pi: p.pi,
        int: p.int,
        adj: p.adj,
        ang: p.ang,
        frame: p.frame,
        wm: p.wm,
        txt: p.txt,
        rot: p.rot,
        flip: p.flip,
        crop: p.crop,
        createdAt: p.createdAt,
      };
      return record;
    });

    let candidate = toStore;
    while (candidate.length > 0) {
      try {
        localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(candidate));
        setStoredPhotoIds(new Set(candidate.map((c) => c.id)));
        return;
      } catch {
        candidate = candidate.slice(0, candidate.length - 1);
      }
    }
  }, []);

  // Rehydrate still captures saved in browser storage on mount
  useEffect(() => {
    detectAvailableCameras();
    try {
      const raw = localStorage.getItem(CAMERA_STORAGE_KEY);
      if (!raw) return;
      const parsed: StoredCameraPhoto[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      Promise.all(
        parsed.map(
          (entry) =>
            new Promise<CameraPhotoItem | null>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                c.getContext("2d")!.drawImage(img, 0, 0);
                resolve({
                  id: entry.id,
                  src: c,
                  pi: entry.pi ?? 0,
                  int: entry.int ?? 100,
                  adj: { ...DEFAULT_ADJ, ...(entry.adj || {}) },
                  ang: entry.ang ?? 0,
                  frame: entry.frame ?? null,
                  wm: Boolean(entry.wm),
                  txt: entry.txt || "",
                  rot: entry.rot ?? 0,
                  flip: Boolean(entry.flip),
                  crop: entry.crop ?? null,
                  thumb: entry.thumb || entry.dataUrl,
                  createdAt: entry.createdAt || Date.now(),
                });
              };
              img.onerror = () => resolve(null);
              img.src = entry.dataUrl;
            }),
        ),
      ).then((rehydrated) => {
        const valid = rehydrated.filter((x): x is CameraPhotoItem => Boolean(x));
        if (valid.length > 0) {
          setPhotos((prev) => (prev.length === 0 ? valid : prev));
          setStoredPhotoIds(new Set(valid.map((v) => v.id)));
        }
      });
    } catch {
      // ignore corrupted storage
    }
  }, [detectAvailableCameras]);

  useEffect(() => {
    const syncUniverse = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(list.some((a) => a.id === "gamura-camera"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    window.addEventListener("storage", syncUniverse);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
      window.removeEventListener("storage", syncUniverse);
    };
  }, []);

  const handleToggleUniverseInstall = () => {
    const appDef = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-camera");
    if (!appDef) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-camera");
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(appDef);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps ✓");
    }
  };

  const playShutterSound = () => {
    try {
      navigator.vibrate?.(15);
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => null);
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.11, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // ignore audio context policies
    }
  };

  const triggerVisualShutterFlash = useCallback((intensity = 0.94) => {
    if (shutterFlashTimerRef.current) {
      window.clearTimeout(shutterFlashTimerRef.current);
    }
    setScreenFlashOpacity(intensity);
    shutterFlashTimerRef.current = window.setTimeout(() => {
      setScreenFlashOpacity(0);
    }, 170);
  }, []);

  const stopCamera = useCallback(() => {
    if (demoFeedRafRef.current) {
      cancelAnimationFrame(demoFeedRafRef.current);
      demoFeedRafRef.current = null;
    }
    if (recorderRef.current) {
      try {
        recorderRef.current.stopDraw();
        if (recorderRef.current.mr.state !== "inactive") {
          recorderRef.current.mr.stop();
        }
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamReady(false);
    setIsDemoFeed(false);
  }, []);

  const computeMaskBox = useCallback(() => {
    const container = stageContainerRef.current;
    const v = videoRef.current;
    const W = container?.clientWidth || 360;
    const H = container?.clientHeight || 480;
    const vw = v?.videoWidth || W;
    const vh = v?.videoHeight || H;
    const [, a, b] = RATIOS[ratioIdx];
    const r = vh > vw ? b / a : a / b;
    let mw = W;
    let mh = W / r;
    if (mh > H) {
      mh = H;
      mw = H * r;
    }
    setMaskSize({ w: Math.round(mw), h: Math.round(mh) });
    return { W, H, mw, mh };
  }, [ratioIdx]);

  useEffect(() => {
    computeMaskBoxRef.current = computeMaskBox;
    computeMaskBox();
  }, [computeMaskBox]);

  const isVideoMode = mode === "VIDEO";

  const startCamera = useCallback(async () => {
    const seq = ++cameraStartSeqRef.current;
    stopCamera();

    const prefs = loadUniversePreferences();
    if (!prefs.allowAccess.camera) {
      setCameraBlockedReason(
        "Camera access is turned off in Universe Settings → Allow Access. Turn Camera ON below or import a photo.",
      );
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraBlockedReason(
        "Live camera stream is unavailable in this browser window. Use your phone camera or import any photo below.",
      );
      return;
    }

    try {
      const wantAudio = isVideoMode && prefs.allowAccess.microphone;
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: wantAudio,
        });
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facing } },
            audio: false,
          });
        } catch {
          s = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!isMountedRef.current || seq !== cameraStartSeqRef.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = s;
      setCameraBlockedReason(null);
      setStreamReady(true);

      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.playsInline = true;
        v.srcObject = s;
        v.play().catch(() => null);
      }

      detectAvailableCameras(s);
      window.setTimeout(() => computeMaskBoxRef.current(), 90);
    } catch (err: any) {
      if (!isMountedRef.current || seq !== cameraStartSeqRef.current) return;
      const errName = String(err?.name || "");
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraBlockedReason(
          "Browser camera permission is blocked. Allow camera access for this site in your browser bar, open your phone camera, or import a photo.",
        );
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        setCameraBlockedReason(
          "Your camera is currently in use by another app or tab. Close the other camera app and tap Try Camera Again, or import a photo.",
        );
      } else {
        setCameraBlockedReason(
          "No active hardware camera was detected in this browser. Open your phone camera or import any photo below.",
        );
      }
    }
  }, [detectAvailableCameras, facing, isVideoMode, stopCamera]);

  useEffect(() => {
    if (view === "cam") {
      startCamera();
    } else {
      cameraStartSeqRef.current++;
      stopCamera();
    }
    return () => {
      cameraStartSeqRef.current++;
      stopCamera();
    };
  }, [view, startCamera, stopCamera]);

  // Listen for live browser camera permission changes via navigator.permissions API
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let active = true;
    let permStatus: PermissionStatus | null = null;
    const handlePermChange = () => {
      if (!active || !permStatus) return;
      if (permStatus.state === "granted" && view === "cam") {
        startCamera();
      } else if (permStatus.state === "denied") {
        stopCamera();
        setCameraBlockedReason(
          "Browser camera permission is denied. Allow camera in site settings or import a photo below.",
        );
      }
    };

    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((status) => {
        if (!active) return;
        permStatus = status;
        status.addEventListener?.("change", handlePermChange);
      })
      .catch(() => null);

    return () => {
      active = false;
      permStatus?.removeEventListener?.("change", handlePermChange);
    };
  }, [view, startCamera, stopCamera]);

  useEffect(() => {
    window.addEventListener("resize", computeMaskBox);
    return () => window.removeEventListener("resize", computeMaskBox);
  }, [computeMaskBox]);

  useEffect(() => {
    if (!gyroEnabled) return;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null && e.beta == null && e.alpha == null) return;
      setGyroTelemetry({
        alpha: Math.round(e.alpha || 0),
        beta: Number((e.beta || 0).toFixed(1)),
        gamma: Number((e.gamma || 0).toFixed(1)),
        hasSensor: true,
      });
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [gyroEnabled]);

  const handleToggleGyroscope = async () => {
    if (gyroEnabled) {
      setGyroEnabled(false);
      setGyroStabilize(false);
      showToast("Gyroscope HUD off");
      return;
    }
    const DevOrient = window.DeviceOrientationEvent as any;
    if (typeof DevOrient?.requestPermission === "function") {
      try {
        const res = await DevOrient.requestPermission();
        if (res !== "granted") {
          showToast("Motion sensor permission declined — simulated tilt enabled");
        }
      } catch {
        // ignore
      }
    }
    setGyroEnabled(true);
    showToast("3-Axis Gyroscope Horizon ON ✓");
  };

  // Start animated studio demo canvas stream when user has no physical webcam
  const startDemoStudioFeed = useCallback(() => {
    stopCamera();
    const cv = document.createElement("canvas");
    cv.width = 1280;
    cv.height = 720;
    const ctx = cv.getContext("2d");
    if (!ctx || typeof (cv as any).captureStream !== "function") {
      showToast("Live demo stream unavailable in this browser");
      return;
    }

    let t = 0;
    const renderDemo = () => {
      t += 0.025;
      const grd = ctx.createLinearGradient(0, 0, cv.width, cv.height);
      grd.addColorStop(0, `hsl(${(150 + Math.sin(t * 0.6) * 28).toFixed(0)}, 68%, 24%)`);
      grd.addColorStop(0.5, `hsl(${(205 + Math.cos(t * 0.4) * 32).toFixed(0)}, 64%, 20%)`);
      grd.addColorStop(1, "#07130d");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, cv.width, cv.height);

      // Floating studio bokeh spheres
      for (let i = 0; i < 6; i++) {
        const bx = cv.width * (0.2 + i * 0.14) + Math.sin(t + i) * 44;
        const by = cv.height * (0.35 + (i % 3) * 0.18) + Math.cos(t * 1.1 + i) * 32;
        const rad = 75 + (i % 3) * 28;
        const bGrad = ctx.createRadialGradient(bx, by, 4, bx, by, rad);
        bGrad.addColorStop(0, "rgba(255,255,255,0.48)");
        bGrad.addColorStop(0.45, "rgba(52,211,153,0.22)");
        bGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subject focal ring + timestamp
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cv.width / 2, cv.height / 2, 118 + Math.sin(t * 2) * 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "700 40px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAMURA LIVE STUDIO", cv.width / 2, cv.height / 2 - 8);
      ctx.fillStyle = "rgba(52,211,153,0.92)";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(new Date().toLocaleTimeString(), cv.width / 2, cv.height / 2 + 28);

      demoFeedRafRef.current = requestAnimationFrame(renderDemo);
    };
    renderDemo();

    const s: MediaStream = (cv as any).captureStream(30);
    streamRef.current = s;
    setCameraBlockedReason(null);
    setStreamReady(true);
    setIsDemoFeed(true);
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.playsInline = true;
      v.srcObject = s;
      v.play().catch(() => null);
    }
    window.setTimeout(() => computeMaskBoxRef.current(), 80);
    showToast("Demo Live Studio Feed active ✓");
  }, [showToast, stopCamera]);

  // Real-time Luminance Histogram updater (active when showHistogram or CG Pro active)
  useEffect(() => {
    if (view !== "cam" || !showHistogram || !streamReady) return;
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 80;
    sampleCanvas.height = 45;
    const sCtx = sampleCanvas.getContext("2d");

    const iv = window.setInterval(() => {
      const v = videoRef.current;
      const hCanvas = histogramCanvasRef.current;
      if (!v || !v.videoWidth || !sCtx || !hCanvas) return;
      const hCtx = hCanvas.getContext("2d");
      if (!hCtx) return;

      sCtx.drawImage(v, 0, 0, 80, 45);
      const data = sCtx.getImageData(0, 0, 80, 45).data;
      const bins = new Array<number>(32).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bIdx = Math.min(31, Math.floor((lum / 256) * 32));
        bins[bIdx]++;
      }
      const maxBin = Math.max(1, ...bins);
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
      hCtx.fillStyle = "rgba(48, 209, 88, 0.88)";
      const bw = hCanvas.width / 32;
      bins.forEach((count, i) => {
        const bh = (count / maxBin) * hCanvas.height;
        hCtx.fillRect(i * bw, hCanvas.height - bh, Math.max(1, bw - 1), bh);
      });
    }, 180);

    return () => window.clearInterval(iv);
  }, [view, showHistogram, streamReady]);

  const addPhotoAndOpenEditor = useCallback(
    (
      srcCanvas: HTMLCanvasElement,
      filterIdx: number,
      isCamera: boolean,
      withHdr: boolean,
      openEditorImmediately = true,
    ) => {
      const thumbCanvas = document.createElement("canvas");
      const ts = 260 / Math.max(srcCanvas.width, srcCanvas.height);
      thumbCanvas.width = Math.max(1, Math.round(srcCanvas.width * ts));
      thumbCanvas.height = Math.max(1, Math.round(srcCanvas.height * ts));
      const tCtx = thumbCanvas.getContext("2d")!;
      tCtx.filter = cssFilterFromPreset(PRESET_FILTERS[filterIdx]?.[1] || {}, isCamera ? expo : 0);
      tCtx.drawImage(srcCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      tCtx.filter = "none";

      const id = `cam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const item: CameraPhotoItem = {
        id,
        src: srcCanvas,
        pi: filterIdx,
        int: 100,
        adj: {
          ...DEFAULT_ADJ,
          b: isCamera ? expo : 0,
          sh: withHdr ? 28 : 0,
          hi: withHdr ? -22 : 0,
        },
        ang: 0,
        frame: null,
        wm: false,
        txt: "",
        rot: 0,
        flip: false,
        crop: null,
        thumb: thumbCanvas.toDataURL("image/jpeg", 0.82),
        createdAt: Date.now(),
      };

      setPhotos((prev) => {
        const next = [item, ...prev];
        persistPhotosToBrowser(next);
        return next;
      });
      setActivePhotoId(id);
      baseGeoRef.current = null;
      setShowOriginal(false);
      if (openEditorImmediately) {
        setView("edit");
      } else {
        showToast("Captured & saved to browser storage ✓");
      }
    },
    [expo, persistPhotosToBrowser, showToast],
  );

  const loadImageFile = (file?: File | null) => {
    if (!file) return;
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxDim = 3000;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(objUrl);
      addPhotoAndOpenEditor(c, 0, false, false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      showToast("Unable to decode that image file");
    };
    img.src = objUrl;
  };

  const toggleVideoRecording = () => {
    if (recorderRef.current) {
      try {
        recorderRef.current.stopDraw();
        if (recorderRef.current.mr.state !== "inactive") {
          recorderRef.current.mr.stop();
        }
      } catch {
        recorderRef.current = null;
        setIsRecording(false);
      }
      return;
    }
    const stream = streamRef.current;
    const v = videoRef.current;
    if (!stream || !v || !v.videoWidth) {
      showToast("Camera stream not active yet");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      showToast("Video recording is not supported in this browser");
      return;
    }

    const cv = document.createElement("canvas");
    cv.width = v.videoWidth;
    cv.height = v.videoHeight;
    const ctx = cv.getContext("2d")!;
    let drawing = true;
    let rafId = 0;

    const drawFrame = () => {
      if (!drawing) return;
      ctx.save();
      ctx.filter = cssFilterFromPreset(PRESET_FILTERS[liveFilterIdx][1], expo);
      if (facing === "user") {
        ctx.translate(cv.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(v, 0, 0);
      ctx.restore();
      rafId = requestAnimationFrame(drawFrame);
    };
    drawFrame();

    let outStream: MediaStream;
    try {
      outStream =
        typeof (cv as any).captureStream === "function"
          ? (cv as any).captureStream(30)
          : stream;
      if (outStream !== stream) {
        stream.getAudioTracks().forEach((track) => outStream.addTrack(track));
      }
    } catch {
      outStream = stream;
    }

    const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find(
      (t) => MediaRecorder.isTypeSupported(t),
    );
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(outStream, mime ? { mimeType: mime } : undefined);
    } catch {
      drawing = false;
      cancelAnimationFrame(rafId);
      showToast("Could not initialize video recorder");
      return;
    }
    const chunks: Blob[] = [];
    const startTs = Date.now();

    mr.ondataavailable = (ev) => {
      if (ev.data.size) chunks.push(ev.data);
    };
    mr.onstop = () => {
      drawing = false;
      cancelAnimationFrame(rafId);
      if (recorderRef.current?.iv) window.clearInterval(recorderRef.current.iv);
      const blob = new Blob(chunks, { type: mr.mimeType || "video/webm" });
      if (!isMountedRef.current) return;
      const vidUrl = URL.createObjectURL(blob);
      const filename = `CGPIC_${Date.now()}${blob.type.includes("mp4") ? ".mp4" : ".webm"}`;
      const dur = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      setVideos((prev) => [
        {
          id: `vid_${Date.now()}`,
          url: vidUrl,
          filename,
          durationSec: dur,
          createdAt: Date.now(),
        },
        ...prev,
      ]);

      const a = document.createElement("a");
      a.href = vidUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      recorderRef.current = null;
      setIsRecording(false);
      setRecSeconds(0);
      showToast("Video saved & added to Gallery ✓");
    };

    try {
      mr.start();
    } catch {
      drawing = false;
      cancelAnimationFrame(rafId);
      showToast("Unable to start video recording");
      return;
    }
    const iv = window.setInterval(() => {
      setRecSeconds(Math.floor((Date.now() - startTs) / 1000));
    }, 500);
    recorderRef.current = {
      mr,
      stopDraw: () => {
        drawing = false;
        cancelAnimationFrame(rafId);
      },
      iv,
    };
    setIsRecording(true);
    setRecSeconds(0);
  };

  const stampSocialOverlay = (
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    overlay: FrameOverlay,
    profile: CameraProfile,
  ) => {
    const dim = Math.max(cw, ch);
    if (overlay === "fb-polaroid") {
      const border = Math.round(dim * 0.032);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = border * 2;
      ctx.strokeRect(0, 0, cw, ch);
      ctx.fillStyle = "rgba(24,119,242,0.92)";
      ctx.font = `700 ${Math.round(dim * 0.022)}px -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("GAMURA · SOCIAL MOMENT", border * 1.3, ch - border * 1.1);
    } else if (overlay === "ig-story") {
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      const pw = Math.round(dim * 0.34);
      const ph = Math.round(dim * 0.055);
      const px = Math.round(dim * 0.035);
      const py = Math.round(dim * 0.035);
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${Math.round(dim * 0.02)}px -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(
        `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · IG STORY`,
        px + Math.round(dim * 0.015),
        py + Math.round(ph * 0.65),
      );
    } else if (overlay === "cg-badge" || profile === "pro") {
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = `700 ${Math.round(dim * 0.02)}px -apple-system, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(
        `CG PIC · ${profile.toUpperCase()}`,
        cw - Math.round(dim * 0.03),
        ch - Math.round(dim * 0.03),
      );
    }
  };

  const captureSingleFrameFromVideo = (): HTMLCanvasElement | null => {
    const v = videoRef.current;
    if (!streamRef.current || !v || !v.videoWidth) return null;
    const w = v.videoWidth;
    const h = v.videoHeight;
    const container = stageContainerRef.current;
    const W = container?.clientWidth || w;
    const H = container?.clientHeight || h;
    const [, ra, rb] = RATIOS[ratioIdx];
    const r = h > w ? rb / ra : ra / rb;
    let mw = W;
    let mh = W / r;
    if (mh > H) {
      mh = H;
      mw = H * r;
    }

    const k = Math.max(W / w, H / h);
    const cw = Math.min(w, mw / k / zoom);
    const ch = Math.min(h, mh / k / zoom);

    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(cw));
    c.height = Math.max(1, Math.round(ch));
    const ctx = c.getContext("2d")!;
    ctx.save();
    if (facing === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, c.width, c.height);
    ctx.restore();
    if (frameOverlay !== "none") {
      stampSocialOverlay(ctx, c.width, c.height, frameOverlay, cameraProfile);
    }
    return c;
  };

  const captureBoomerangLoop = async () => {
    const v = videoRef.current;
    if (!streamRef.current || !v || !v.videoWidth) {
      nativeCamInputRef.current?.click();
      return;
    }
    setBusyCapture(true);
    showToast("Recording Boomerang loop…");
    try {
      const frames: HTMLCanvasElement[] = [];
      for (let i = 0; i < 8; i++) {
        const snap = captureSingleFrameFromVideo();
        if (snap) frames.push(snap);
        await new Promise((r) => setTimeout(r, 85));
      }
      if (frames.length === 0) return;

      const seq = [...frames, ...frames.slice(0, -1).reverse()];
      const out = document.createElement("canvas");
      out.width = seq[0].width;
      out.height = seq[0].height;
      const oCtx = out.getContext("2d")!;

      if (
        typeof MediaRecorder !== "undefined" &&
        typeof (out as any).captureStream === "function"
      ) {
        const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((t) =>
          MediaRecorder.isTypeSupported(t),
        );
        const recStream: MediaStream = (out as any).captureStream(24);
        const mr = new MediaRecorder(recStream, mime ? { mimeType: mime } : undefined);
        const chunks: Blob[] = [];
        mr.ondataavailable = (ev) => {
          if (ev.data.size) chunks.push(ev.data);
        };
        const finished = new Promise<void>((resolve) => {
          mr.onstop = () => {
            const blob = new Blob(chunks, { type: mr.mimeType || "video/webm" });
            const url = URL.createObjectURL(blob);
            const filename = `BOOMERANG_${Date.now()}.webm`;
            setVideos((prev) => [
              {
                id: `vid_${Date.now()}`,
                url,
                filename,
                durationSec: 2,
                createdAt: Date.now(),
              },
              ...prev,
            ]);
            resolve();
          };
        });
        mr.start();
        for (let loop = 0; loop < 2; loop++) {
          for (const frame of seq) {
            oCtx.filter = cssFilterFromPreset(PRESET_FILTERS[liveFilterIdx][1], expo);
            oCtx.drawImage(frame, 0, 0);
            oCtx.filter = "none";
            await new Promise((r) => setTimeout(r, 65));
          }
        }
        mr.stop();
        await finished;
        triggerVisualShutterFlash(0.9);
        playShutterSound();
        showToast("Boomerang loop saved to Gallery ✓");
      } else {
        triggerVisualShutterFlash(0.9);
        playShutterSound();
        addPhotoAndOpenEditor(seq[0], liveFilterIdx, true, hdrOn, false);
      }
    } finally {
      setBusyCapture(false);
    }
  };

  const handleShutter = async () => {
    if (mode === "VIDEO") {
      toggleVideoRecording();
      return;
    }
    if (mode === "BOOMERANG") {
      await captureBoomerangLoop();
      return;
    }
    if (busyCapture) return;
    const stream = streamRef.current;
    const v = videoRef.current;
    if (!stream || !v || !v.videoWidth) {
      triggerVisualShutterFlash(0.75);
      nativeCamInputRef.current?.click();
      return;
    }
    setBusyCapture(true);
    try {
      if (timerSec > 0) {
        for (let i = timerSec; i > 0; i--) {
          setCountdownVal(i);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdownVal(null);
      }

      let torchUsed = false;
      const track = stream.getVideoTracks()[0];
      if (flashOn) {
        if (facing === "user" || isDemoFeed) {
          setScreenFlashOpacity(0.95);
          await new Promise((r) => setTimeout(r, 220));
        } else if (track?.applyConstraints) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true } as any] });
            torchUsed = true;
            await new Promise((r) => setTimeout(r, 260));
          } catch {
            setScreenFlashOpacity(0.9);
            await new Promise((r) => setTimeout(r, 140));
          }
        }
      }

      if (mode === "BURST 3×") {
        for (let b = 0; b < 3; b++) {
          const snap = captureSingleFrameFromVideo();
          if (snap) {
            triggerVisualShutterFlash(0.92);
            playShutterSound();
            addPhotoAndOpenEditor(snap, liveFilterIdx, true, hdrOn, b === 2);
          }
          await new Promise((r) => setTimeout(r, 180));
        }
        showToast("Burst 3× captured & saved ✓");
      } else {
        const captured = captureSingleFrameFromVideo();
        if (torchUsed && track?.applyConstraints) {
          track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => null);
        }
        // Guaranteed crisp visual flash confirmation on Capture click
        triggerVisualShutterFlash(0.95);
        playShutterSound();
        if (captured) {
          addPhotoAndOpenEditor(
            captured,
            liveFilterIdx,
            true,
            hdrOn || beautyOn,
          );
        }
      }
    } finally {
      setBusyCapture(false);
    }
  };

  const applyCameraProfile = (profile: CameraProfile) => {
    setCameraProfile(profile);
    if (profile === "iphone") {
      setRatioIdx(0);
      setHdrOn(true);
      setBeautyOn(false);
      setFrameOverlay("none");
      setShowHistogram(false);
      setMode("PHOTO");
      setLiveFilterIdx(0);
      showToast("iPhone Camera · Smart HDR & Leveler");
    } else if (profile === "instagram") {
      setRatioIdx(3); // 9:16 Story
      setFrameOverlay("ig-story");
      setBeautyOn(false);
      setShowHistogram(false);
      const clarendon = PRESET_FILTERS.findIndex(([n]) => n === "Clarendon");
      if (clarendon >= 0) setLiveFilterIdx(clarendon);
      showToast("Instagram Camera · 9:16 Story & Clarendon");
    } else if (profile === "facebook") {
      setRatioIdx(0);
      setFrameOverlay("fb-polaroid");
      setBeautyOn(true);
      setShowHistogram(false);
      const glow = PRESET_FILTERS.findIndex(([n]) => n === "Vivid");
      if (glow >= 0) setLiveFilterIdx(glow);
      showToast("Facebook Camera · Social Polaroid & Soft Glow");
    } else {
      setRatioIdx(0);
      setFrameOverlay("cg-badge");
      setShowHistogram(true);
      setGridOn(true);
      setGyroEnabled(true);
      showToast("CG Pro · Live Histogram & 3-Axis Gyro");
    }
  };

  const handleModeSwitch = (nextMode: CamMode) => {
    setMode(nextMode);
    if (nextMode === "SQUARE") setRatioIdx(1);
    else if (nextMode === "VIDEO") setRatioIdx(2);
    else if (nextMode === "BOOMERANG") setRatioIdx(3);
    else setRatioIdx(0);

    if (nextMode === "PORTRAIT") {
      setLiveFilterIdx(PRESET_FILTERS.findIndex(([name]) => name === "Portrait"));
    } else if (nextMode === "B&W") {
      setLiveFilterIdx(PRESET_FILTERS.findIndex(([name]) => name === "Grayscale"));
    } else if (nextMode !== "VIDEO" && nextMode !== "BOOMERANG") {
      setLiveFilterIdx(0);
    }
  };

  const updateActivePhoto = useCallback(
    (updater: (prev: CameraPhotoItem) => CameraPhotoItem) => {
      if (!activePhotoId) return;
      setPhotos((prev) => {
        const next = prev.map((item) => (item.id === activePhotoId ? updater(item) : item));
        persistPhotosToBrowser(next);
        return next;
      });
    },
    [activePhotoId, persistPhotosToBrowser],
  );

  const handleCameraSwitchToggle = () => {
    const nextFacing = facing === "environment" ? "user" : "environment";
    setFacing(nextFacing);
    showToast(
      nextFacing === "user"
        ? "Front Camera ON"
        : "Back Camera ON",
    );
  };

  // Compute geo base & render editor preview canvas
  useEffect(() => {
    if (view !== "edit" || !activePhoto || !editorCanvasRef.current) return;
    const geoKey = `${activePhoto.id}:${activePhoto.rot}:${activePhoto.flip}:${activePhoto.ang}:${JSON.stringify(activePhoto.crop)}`;
    let baseCanvas = baseGeoRef.current?.key === geoKey ? baseGeoRef.current.canvas : null;
    if (!baseCanvas) {
      baseCanvas = buildGeometryCanvas(activePhoto, 900);
      baseGeoRef.current = { key: geoKey, canvas: baseCanvas };
    }

    const out = showOriginal
      ? baseCanvas
      : decorateCanvas(processPixels(baseCanvas, resolvePhotoParams(activePhoto)), activePhoto);
    const cv = editorCanvasRef.current;
    cv.width = out.width;
    cv.height = out.height;
    cv.getContext("2d")!.drawImage(out, 0, 0);
  }, [view, activePhoto, showOriginal]);

  // Build 26 filter strip thumbnails whenever geometry changes
  useEffect(() => {
    if (view !== "edit" || !activePhoto) return;
    const small = buildGeometryCanvas(activePhoto, 78);
    const nextThumbs = PRESET_FILTERS.map(([, p]) => {
      const proc = processPixels(small, {
        b: p.b || 0,
        c: p.c || 0,
        s: p.s || 0,
        w: p.w || 0,
        t: p.t || 0,
        sh: 0,
        hi: 0,
        sharp: 0,
        fade: p.fade || 0,
        vig: p.vig || 0,
        grain: p.grain || 0,
        g: p.g || 0,
        sp: p.sp || 0,
        inv: p.inv || 0,
        blur: p.blur || 0,
      });
      return proc.toDataURL("image/jpeg", 0.72);
    });
    setThumbPreviews(nextThumbs);
    // Only recompute thumbnails when geometry changes or photo changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view,
    activePhoto?.id,
    activePhoto?.rot,
    activePhoto?.flip,
    activePhoto?.ang,
    activePhoto?.crop,
  ]);

  const handleAutoEnhance = () => {
    if (!activePhoto) return;
    const base = baseGeoRef.current?.canvas || buildGeometryCanvas(activePhoto, 900);
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = Math.max(1, Math.round((80 * base.height) / base.width));
    const ctx = c.getContext("2d")!;
    ctx.drawImage(base, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const n = data.length / 4;
    let sum = 0;
    let sq = 0;
    for (let i = 0; i < data.length; i += 4) {
      const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += l;
      sq += l * l;
    }
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
    const clamp = (v: number, lo: number, hi: number) =>
      Math.round(Math.max(lo, Math.min(hi, v)));

    updateActivePhoto((item) => ({
      ...item,
      adj: {
        ...item.adj,
        b: clamp((120 - mean) * 0.35, -30, 30),
        c: clamp((62 - sd) * 0.5, 0, 30),
        s: Math.max(item.adj.s, 10),
        sharp: Math.max(item.adj.sharp, 25),
        sh: clamp((110 - mean) * 0.4, 0, 35),
      },
    }));
    showToast("✦ Auto Enhanced");
  };

  const exportFullResolutionBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!activePhoto) return null;
    const full = decorateCanvas(
      processPixels(buildGeometryCanvas(activePhoto, 3000), resolvePhotoParams(activePhoto)),
      activePhoto,
    );
    const mime =
      exportFormat === "png"
        ? "image/png"
        : exportFormat === "webp"
          ? "image/webp"
          : "image/jpeg";
    const ext = exportFormat === "png" ? "png" : exportFormat === "webp" ? "webp" : "jpg";
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const filename = `CGPIC_${stamp}.${ext}`;
    const blob = await new Promise<Blob | null>((res) =>
      full.toBlob((b) => res(b), mime, 0.95),
    );
    if (!blob) return null;
    return { blob, filename };
  };

  const handleSavePhoto = async () => {
    showToast("Rendering full quality…");
    const result = await exportFullResolutionBlob();
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(`Saved ${result.filename} ✓`);
  };

  const handleSharePhoto = async () => {
    showToast("Preparing share sheet…");
    const result = await exportFullResolutionBlob();
    if (!result) return;
    const file = new File([result.blob], result.filename, { type: result.blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "GAMURA CAMERA · CG PIC" });
        return;
      } catch {
        // user cancelled share
      }
    }
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("Downloaded image for sharing ✓");
  };

  const handleDownloadGalleryPhoto = async (photo: CameraPhotoItem) => {
    showToast("Preparing full-resolution photo…");
    const full = decorateCanvas(
      processPixels(buildGeometryCanvas(photo, 3000), resolvePhotoParams(photo)),
      photo,
    );
    const blob = await new Promise<Blob | null>((res) =>
      full.toBlob((b) => res(b), "image/jpeg", 0.94),
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CGPIC_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("Saved full-resolution photo ✓");
  };

  const enableCameraPermissionPreference = () => {
    const cur = loadUniversePreferences();
    const updated = {
      ...cur,
      allowAccess: { ...cur.allowAccess, camera: true, video: true },
    };
    try {
      localStorage.setItem(UNIVERSE_PREFS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    startCamera();
    showToast("Camera access enabled ✓");
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className={`bg-[#050b08] text-[#f5f5f7] flex flex-col select-none ${
        view === "cam" ? "h-[100dvh] overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Top Apple Studio Header Bar */}
      <header className="sticky top-0 z-30 bg-[#07110c]/92 backdrop-blur-2xl border-b border-white/[0.08] shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-13 sm:h-14 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-2">
          {/* Brand & Back Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0 justify-self-start">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              className="hidden lg:inline-flex min-h-[38px] px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-0.5 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[9px] overflow-hidden border border-white/15 bg-[#0a1c13] shrink-0">
                <img
                  src={logoSrc}
                  alt="GAMURA CAMERA Logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoStage((s) => Math.min(2, s + 1))}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="shrink-0">
                <div className="text-[11px] sm:text-sm font-bold tracking-tight text-white whitespace-nowrap leading-tight">
                  <span className="sm:hidden">
                    <span className="text-[#30d158]">CG</span> CAM
                  </span>
                  <span className="hidden sm:inline">
                    GAMURA <span className="text-[#30d158]">CAMERA</span>
                  </span>
                </div>
                <div className="hidden lg:block text-[10px] text-zinc-400 leading-none mt-0.5">
                  CG PIC Studio · Live Capture &amp; Pro Editor
                </div>
              </div>
            </div>
          </div>

          {/* Center Mode Switcher (Perfectly Centered) */}
          <nav className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 justify-self-center">
            <button
              type="button"
              onClick={() => setView("cam")}
              className={`min-h-[32px] px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                view === "cam"
                  ? "bg-[#30d158] text-[#04130c]"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <Camera size={12} />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activePhoto) setView("edit");
                else uploadInputRef.current?.click();
              }}
              className={`min-h-[32px] px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                view === "edit"
                  ? "bg-[#30d158] text-[#04130c]"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <SlidersHorizontal size={12} />
              <span>{activePhoto ? "Edit" : "Import"}</span>
            </button>
            <button
              type="button"
              onClick={() => setView("gal")}
              className={`min-h-[32px] px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 tabular-nums ${
                view === "gal"
                  ? "bg-[#30d158] text-[#04130c]"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <ImageIcon size={12} />
              <span>Gallery ({photos.length + videos.length})</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-2 shrink-0 justify-self-end">
            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40"
                  : "bg-white/[0.08] hover:bg-white/[0.14] text-white"
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Add to Universe"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* VIEW 1: LIVE CAMERA */}
      {view === "cam" && (
        <main className="flex-1 min-h-0 flex flex-col max-w-6xl w-full mx-auto px-2 sm:px-5 py-2 sm:py-2.5 gap-2 shrink overflow-hidden">
          {/* Camera Engine Bar: iPhone · Instagram · Facebook · CG Pro */}
          <div className="flex items-center justify-between gap-2 bg-[#0b1812] border border-white/[0.08] rounded-2xl px-2.5 py-1.5 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {CAMERA_PROFILES.map((prof) => {
                const active = cameraProfile === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    title={prof.desc}
                    onClick={() => applyCameraProfile(prof.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-[#30d158] text-[#04130c]"
                        : "bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.1]"
                    }`}
                  >
                    {prof.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setBeautyOn((b) => !b);
                  showToast(!beautyOn ? "Soft Beauty Glow ON" : "Soft Beauty Glow OFF");
                }}
                title="Toggle Soft Beauty Glow"
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  beautyOn
                    ? "bg-pink-500/20 text-pink-300 border-pink-400/40"
                    : "bg-white/[0.05] text-zinc-400 border-white/10 hover:text-white"
                }`}
              >
                <Sparkles size={12} />
                <span className="hidden sm:inline">Glow</span>
              </button>

              <button
                type="button"
                onClick={handleToggleGyroscope}
                title="Toggle 3-Axis Gyroscope Horizon Leveler"
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  gyroEnabled
                    ? "bg-[#ffd60a]/15 text-[#ffd60a] border-[#ffd60a]/40"
                    : "bg-white/[0.05] text-zinc-400 border-white/10 hover:text-white"
                }`}
              >
                <Compass size={12} />
                <span className="hidden sm:inline">Gyro</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistogram((h) => !h)}
                title="Toggle Live Luminance Histogram"
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  showHistogram
                    ? "bg-[#30d158]/20 text-[#30d158] border-[#30d158]/40"
                    : "bg-white/[0.05] text-zinc-400 border-white/10 hover:text-white"
                }`}
              >
                <Activity size={12} />
                <span className="hidden sm:inline">Histo</span>
              </button>
            </div>
          </div>

          {/* Viewfinder Stage */}
          <div
            ref={stageContainerRef}
            onClick={(e) => {
              if (!streamReady) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setFocusBox({
                x: Math.max(40, Math.min(rect.width - 40, e.clientX - rect.left)),
                y: Math.max(40, Math.min(rect.height - 40, e.clientY - rect.top)),
              });
              if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
              focusTimerRef.current = window.setTimeout(() => setFocusBox(null), 3500);
            }}
            className="relative flex-1 min-h-[190px] sm:min-h-[380px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl"
          >
            {/* Live Camera <video> Stream with Applied CSS Filter & Zoom/Gyro Transform */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              onLoadedMetadata={() => computeMaskBoxRef.current()}
              style={{
                filter: `${cssFilterFromPreset(PRESET_FILTERS[liveFilterIdx][1], expo)}${beautyOn ? " brightness(1.06) saturate(1.08)" : ""}`,
                transform: `${facing === "user" ? "scaleX(-1) " : ""}${
                  gyroStabilize && gyroTelemetry.hasSensor
                    ? `rotate(${(-gyroTelemetry.gamma * 0.35).toFixed(2)}deg) `
                    : ""
                }scale(${zoom})`,
              }}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
            />

            {/* Aspect Ratio Mask Frame */}
            <div
              style={{ width: maskSize.w, height: maskSize.h }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_100vmax_rgba(0,0,0,0.48)] border border-white/15 z-[2]"
            />

            {/* Social / Studio Live Overlay Preview */}
            {frameOverlay === "fb-polaroid" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 rounded-2xl border-[6px] border-white/90 z-[3] flex items-end p-3"
              >
                <span className="px-2.5 py-1 rounded-md bg-[#1877F2] text-white text-[10px] font-bold tracking-wider">
                  GAMURA · FACEBOOK FRAME
                </span>
              </div>
            )}
            {frameOverlay === "ig-story" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-14 left-4 z-[3] px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white"
              >
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · IG STORY
              </div>
            )}

            {/* Rule of Thirds Grid */}
            {gridOn && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[3]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg,transparent 33.2%,rgba(255,255,255,.32) 33.3%,transparent 33.5%,transparent 66.5%,rgba(255,255,255,.32) 66.6%,transparent 66.8%),linear-gradient(transparent 33.2%,rgba(255,255,255,.32) 33.3%,transparent 33.5%,transparent 66.5%,rgba(255,255,255,.32) 66.6%,transparent 66.8%)",
                }}
              />
            )}

            {/* 3-Axis Gyroscope Horizon Leveler */}
            {gyroEnabled && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[4] flex flex-col items-center gap-2"
              >
                <div
                  style={{
                    transform: `rotate(${-gyroTelemetry.gamma}deg)`,
                  }}
                  className={`w-36 h-[2px] transition-transform duration-75 relative ${
                    Math.abs(gyroTelemetry.gamma) < 2 ? "bg-[#ffd60a]" : "bg-white/75"
                  }`}
                >
                  <span className="absolute left-1/2 -top-[3px] -translate-x-1/2 w-2 h-2 rounded-full bg-current" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-xs border border-white/10 text-[10px] font-semibold text-zinc-200 tabular-nums whitespace-nowrap">
                  Roll {gyroTelemetry.gamma}° · Pitch {gyroTelemetry.beta}° · {gyroTelemetry.alpha}°
                </div>
              </div>
            )}

            {/* Live Luminance Histogram */}
            {showHistogram && streamReady && (
              <div className="pointer-events-none absolute left-3 bottom-3 z-[5] bg-black/65 backdrop-blur-md border border-white/15 rounded-xl p-1.5">
                <canvas
                  ref={histogramCanvasRef}
                  width={96}
                  height={36}
                  className="block rounded"
                />
              </div>
            )}

            {/* Tap-to-Focus + Exposure Reticle */}
            {focusBox && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ left: focusBox.x - 36, top: focusBox.y - 36 }}
                className="absolute w-[72px] h-[72px] border-[1.5px] border-[#ffd60a] rounded-lg z-[6] pointer-events-none"
              >
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={expo}
                  aria-label="Tap Focus Exposure"
                  onChange={(e) => {
                    setExpo(Number(e.target.value));
                    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
                    focusTimerRef.current = window.setTimeout(() => setFocusBox(null), 3500);
                  }}
                  className="pointer-events-auto absolute top-[80px] -left-[14px] w-[100px] accent-[#ffd60a]"
                />
              </div>
            )}

            {/* Visual Shutter Capture Flash Overlay */}
            <div
              aria-hidden="true"
              style={{ opacity: screenFlashOpacity }}
              className="pointer-events-none absolute inset-0 bg-white z-[8] transition-opacity duration-150"
            />

            {/* Countdown Overlay */}
            {countdownVal !== null && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-[112px] font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] z-[7] tabular-nums">
                {countdownVal}
              </div>
            )}

            {/* Recording Pill */}
            {isRecording && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#ff453a] text-white text-xs font-bold tabular-nums z-[7] shadow-lg">
                ● {String(Math.floor(recSeconds / 60)).padStart(2, "0")}:
                {String(recSeconds % 60).padStart(2, "0")}
              </div>
            )}

            {/* Top Viewfinder Tool Row — Single-line Aligned Apple HUD */}
            <div className="absolute top-0 left-0 right-0 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2 bg-gradient-to-b from-black/75 via-black/35 to-transparent z-[5]">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
                <span className="text-xs sm:text-sm font-extrabold tracking-wide text-white drop-shadow-xs whitespace-nowrap">
                  CG <span className="text-[#30d158]">PIC</span>
                </span>
                <span className="text-[11px] font-semibold text-zinc-200 whitespace-nowrap truncate max-w-[140px] sm:max-w-none">
                  · {facing === "user" ? "Front" : "Back"}
                  {liveFilterIdx > 0 ? ` · ${PRESET_FILTERS[liveFilterIdx][0]}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !flashOn;
                    setFlashOn(next);
                    showToast(next ? "Flash on" : "Flash off");
                  }}
                  title="Flash"
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    flashOn
                      ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                      : "bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75"
                  }`}
                >
                  <Zap size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextMap: Record<number, 0 | 3 | 5 | 10> = {
                      0: 3,
                      3: 5,
                      5: 10,
                      10: 0,
                    };
                    const next = nextMap[timerSec];
                    setTimerSec(next);
                    showToast(next ? `Timer ${next}s` : "Timer off");
                  }}
                  title="Timer"
                  className={`min-w-[36px] h-9 px-2 rounded-full border text-xs font-bold flex items-center justify-center transition-colors cursor-pointer tabular-nums shrink-0 ${
                    timerSec > 0
                      ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                      : "bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75"
                  }`}
                >
                  {timerSec ? `${timerSec}s` : <Timer size={15} />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGridOn((g) => !g);
                  }}
                  title="Rule of Thirds Grid"
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    gridOn
                      ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                      : "bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75"
                  }`}
                >
                  <Grid3X3 size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const order: FrameOverlay[] = ["none", "ig-story", "fb-polaroid", "cg-badge"];
                    const next = order[(order.indexOf(frameOverlay) + 1) % order.length];
                    setFrameOverlay(next);
                    showToast(`Frame: ${next === "none" ? "Off" : next.toUpperCase()}`);
                  }}
                  title="AR Frame / Overlay"
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    frameOverlay !== "none"
                      ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                      : "bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75"
                  }`}
                >
                  <Frame size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !hdrOn;
                    setHdrOn(next);
                    showToast(next ? "HDR on" : "HDR off");
                  }}
                  title="HDR"
                  className={`h-9 px-2.5 rounded-full border text-[11px] font-extrabold tracking-wide flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    hdrOn
                      ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                      : "bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75"
                  }`}
                >
                  HDR
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRatioIdx((idx) => (idx + 1) % RATIOS.length);
                  }}
                  title="Aspect Ratio"
                  className="h-9 px-2.5 rounded-full border bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75 text-[11px] font-extrabold tracking-wide cursor-pointer tabular-nums shrink-0"
                >
                  {RATIOS[ratioIdx][0]}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadInputRef.current?.click();
                  }}
                  title="Import Photo"
                  className="w-9 h-9 rounded-full border bg-black/55 text-white border-white/15 backdrop-blur-md hover:bg-black/75 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Upload size={15} />
                </button>
              </div>
            </div>

            {/* Camera Blocked / Fallback Overlay */}
            {cameraBlockedReason && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-[4] bg-[#07110c]/92 backdrop-blur-md flex flex-col items-center justify-center text-center p-5 gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#10261b] border border-white/10 flex items-center justify-center text-[#30d158]">
                  <Camera size={28} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">Camera Preview Ready</h2>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
                  {cameraBlockedReason}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {!loadUniversePreferences().allowAccess.camera && (
                    <button
                      type="button"
                      onClick={enableCameraPermissionPreference}
                      className="px-4 py-2 rounded-full bg-[#30d158] hover:bg-[#28b84c] text-[#04130c] text-xs font-bold cursor-pointer transition-colors"
                    >
                      Turn Camera Access On
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-full bg-[#30d158] hover:bg-[#28b84c] text-[#04130c] text-xs font-bold cursor-pointer transition-colors"
                  >
                    Try Camera Again
                  </button>
                  <button
                    type="button"
                    onClick={startDemoStudioFeed}
                    className="px-4 py-2 rounded-full bg-white text-[#04130c] hover:bg-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Use Live Studio Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => nativeCamInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Open Phone Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Import Photo
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Floating Zoom Pills inside Viewfinder */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-2 z-[5]"
            >
              {[0.5, 1, 2, 3].map((z) => {
                const active = Math.abs(zoom - z) < 0.2;
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-xs font-bold transition-all cursor-pointer tabular-nums flex items-center justify-center ${
                      active
                        ? "w-10 h-10 text-[#ffd60a] border-[#ffd60a]/50"
                        : "w-8 h-8 text-white/85 hover:text-white"
                    }`}
                  >
                    {z}×
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shutter & Live CSS Filter Dock */}
          <div className="bg-[#0b1812] border border-white/[0.08] rounded-3xl p-2.5 sm:p-3.5 space-y-2.5 shrink-0">
            {/* CSS Filter Dropdown Menu + Live Quick-Filter Strip */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <select
                  aria-label="Select CSS Filter"
                  value={liveFilterIdx}
                  onChange={(e) => {
                    const nextIdx = Number(e.target.value);
                    setLiveFilterIdx(nextIdx);
                    showToast(`Filter: ${PRESET_FILTERS[nextIdx]?.[0] || "Normal"}`);
                  }}
                  className="appearance-none min-h-[34px] pl-3 pr-8 rounded-full bg-[#30d158] text-[#04130c] text-xs font-bold outline-none cursor-pointer"
                >
                  {PRESET_FILTERS.map(([name], i) => (
                    <option key={name} value={i} className="bg-[#0b1812] text-white">
                      Filter: {name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#04130c]"
                />
              </div>

              <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {PRESET_FILTERS.map(([name], i) => {
                  const active = i === liveFilterIdx;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setLiveFilterIdx(i);
                        showToast(`Filter: ${name}`);
                      }}
                      className={`shrink-0 min-h-[32px] px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? "bg-[#30d158]/20 text-[#30d158] border-[#30d158] font-bold"
                          : "bg-[#11231a] text-zinc-200 border-white/10 hover:bg-[#173024]"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Mode Strip */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar border-b border-white/[0.06] pb-1.5">
              {MODES.map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeSwitch(m)}
                    className={`relative text-[11px] sm:text-xs font-bold tracking-wider py-0.5 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                      active ? "text-[#ffd60a]" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {m === "BOOMERANG" && <Repeat size={11} />}
                    {m === "BURST 3×" && <Layers size={11} />}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>

            {/* 3-Column Balanced Shutter Row */}
            <div className="grid grid-cols-3 items-center gap-2 pt-0.5">
              {/* Left Column: Gallery Preview & Quick Save */}
              <div className="flex items-center gap-2 justify-self-start">
                <button
                  type="button"
                  onClick={() => setView("gal")}
                  title="Open Session Gallery"
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1c1c1e] border border-white/15 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/30 transition-colors shrink-0"
                >
                  {photos[0] ? (
                    <img
                      src={photos[0].thumb}
                      alt="Last captured"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-zinc-300" />
                  )}
                  {photos.length + videos.length > 0 && (
                    <span className="absolute right-1 top-1 bg-[#30d158] text-[#04130c] rounded-full text-[10px] font-extrabold px-1.5 py-0.5 leading-none tabular-nums">
                      {photos.length + videos.length}
                    </span>
                  )}
                </button>

                {mode !== "VIDEO" && mode !== "BOOMERANG" && (
                  <button
                    type="button"
                    onClick={() => {
                      const captured = captureSingleFrameFromVideo();
                      if (!captured) {
                        triggerVisualShutterFlash(0.75);
                        nativeCamInputRef.current?.click();
                        return;
                      }
                      triggerVisualShutterFlash(0.92);
                      playShutterSound();
                      addPhotoAndOpenEditor(captured, liveFilterIdx, true, hdrOn || beautyOn, false);
                    }}
                    title="Quick Capture & Save to Browser Storage"
                    className="inline-flex min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#11231a] hover:bg-[#173024] border border-white/12 text-[11px] font-semibold text-zinc-100 items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  >
                    <HardDrive size={13} className="text-[#30d158]" />
                    <span className="hidden sm:inline">Capture &amp; Save</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                )}
              </div>

              {/* Center Column: Primary Concentric Capture Button */}
              <div className="justify-self-center flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleShutter}
                  aria-label={mode === "VIDEO" ? "Record video" : "Capture"}
                  title="Capture"
                  className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full border-4 border-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-lg"
                >
                  <span
                    className={`block transition-all ${
                      mode === "VIDEO"
                        ? isRecording
                          ? "w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#ff453a]"
                          : "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#ff453a]"
                        : mode === "BOOMERANG"
                          ? "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                          : "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white"
                    }`}
                  />
                </button>
              </div>

              {/* Right Column: Front/Back Switch & Gyro Stabilize */}
              <div className="flex items-center justify-end justify-self-end gap-1.5 sm:gap-2">
                {gyroTelemetry.hasSensor && (
                  <button
                    type="button"
                    onClick={() => {
                      setGyroStabilize((s) => !s);
                      showToast(!gyroStabilize ? "Gyro Leveling ON" : "Gyro Leveling OFF");
                    }}
                    title="Auto Horizon Leveling"
                    className={`hidden md:inline-flex min-h-[36px] px-2.5 rounded-xl border text-[11px] font-semibold items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      gyroStabilize
                        ? "bg-[#ffd60a]/20 text-[#ffd60a] border-[#ffd60a]/45"
                        : "bg-[#141f19] text-zinc-300 border-white/12 hover:text-white"
                    }`}
                  >
                    <Compass size={12} />
                    <span>Level</span>
                  </button>
                )}

                <div
                  className="flex items-center gap-2 bg-[#141f19] border border-white/12 rounded-2xl px-2.5 py-1.5"
                  title={
                    hasFrontBackSwitch
                      ? "Switch between Front and Back cameras"
                      : "Single camera detected (tap to toggle facing mode)"
                  }
                >
                  <div className="flex flex-col text-right leading-tight">
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">
                      {facing === "user" ? "Front" : "Back"}
                    </span>
                    <span className="hidden sm:block text-[9px] text-zinc-400 whitespace-nowrap">
                      {cameraDeviceCount > 1
                        ? `${cameraDeviceCount} Lenses`
                        : hasFrontBackSwitch
                          ? "Camera Flip"
                          : "Lens"}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={facing === "user"}
                    aria-label={
                      facing === "user"
                        ? "Front camera on, tap for back camera"
                        : "Back camera active, tap to turn front camera on"
                    }
                    onClick={handleCameraSwitchToggle}
                    className={`relative w-[48px] h-[28px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30d158]/60 ${
                      facing === "user" ? "bg-[#30d158]" : "bg-zinc-600"
                    }`}
                  >
                    <span
                      className={`w-[24px] h-[24px] rounded-full bg-white shadow-sm flex items-center justify-center text-[#04130c] transition-transform duration-200 ${
                        facing === "user" ? "translate-x-[20px]" : "translate-x-0"
                      }`}
                    >
                      <SwitchCamera size={12} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: PRO PHOTO EDITOR */}
      {view === "edit" && activePhoto && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Canvas Stage */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 bg-black border border-white/10 rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[540px]">
            <canvas
              ref={editorCanvasRef}
              className="max-w-full max-h-[65vh] rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Inspector Controls */}
          <div className="lg:col-span-5 bg-[#0b1812] border border-white/[0.08] rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit Photo
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onPointerDown={() => setShowOriginal(true)}
                  onPointerUp={() => setShowOriginal(false)}
                  onPointerLeave={() => setShowOriginal(false)}
                  onPointerCancel={() => setShowOriginal(false)}
                  className="px-3 py-1.5 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  Hold Original
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateActivePhoto((p) => ({
                      ...p,
                      pi: 0,
                      int: 100,
                      adj: { ...DEFAULT_ADJ },
                      ang: 0,
                      frame: null,
                      wm: false,
                      txt: "",
                      rot: 0,
                      flip: false,
                      crop: null,
                    }));
                    showToast("Reset all edits");
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#1c1c1e] hover:bg-red-500/20 border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Editor Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#1c1c1e]">
              {(
                [
                  { id: "pf", label: "Filters" },
                  { id: "pa", label: "Adjust" },
                  { id: "pt", label: "Tools" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditorTab(t.id)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    editorTab === t.id
                      ? "bg-[#3a3a3c] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Panel 1: 26 Filters + Intensity */}
            {editorTab === "pf" && (
              <div className="space-y-4">
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {PRESET_FILTERS.map(([name], i) => {
                    const active = activePhoto.pi === i;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() =>
                          updateActivePhoto((item) => ({ ...item, pi: i }))
                        }
                        className="shrink-0 w-[68px] text-center space-y-1.5 cursor-pointer"
                      >
                        <div
                          className={`w-[68px] h-[68px] rounded-xl overflow-hidden border-2 bg-black ${
                            active ? "border-[#30d158]" : "border-transparent"
                          }`}
                        >
                          {thumbPreviews[i] && (
                            <img
                              src={thumbPreviews[i]}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            active ? "text-[#30d158] font-bold" : "text-zinc-400"
                          }`}
                        >
                          {name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-[88px_1fr_36px] items-center gap-2 text-xs">
                  <span className="font-medium text-zinc-200">Intensity</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activePhoto.int}
                    onChange={(e) =>
                      updateActivePhoto((item) => ({
                        ...item,
                        int: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#30d158]"
                  />
                  <span className="text-right text-zinc-400 tabular-nums">
                    {activePhoto.int}
                  </span>
                </div>
              </div>
            )}

            {/* Panel 2: 11 Adjustments + Auto Enhance */}
            {editorTab === "pa" && (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={handleAutoEnhance}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#30d158] hover:bg-[#28b84c] text-[#04130c] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wand2 size={14} />
                  <span>Auto Enhance</span>
                </button>

                {ADJ_DEFS.map(([key, label, lo, hi]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[88px_1fr_36px] items-center gap-2 text-xs py-0.5"
                  >
                    <span className="text-zinc-200">{label}</span>
                    <input
                      type="range"
                      min={lo}
                      max={hi}
                      value={activePhoto.adj[key]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateActivePhoto((item) => ({
                          ...item,
                          adj: { ...item.adj, [key]: val },
                        }));
                      }}
                      className="w-full accent-[#30d158]"
                    />
                    <span className="text-right text-zinc-400 tabular-nums">
                      {activePhoto.adj[key]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Panel 3: Transform, Straighten, Crop, Frame, Watermark, Caption */}
            {editorTab === "pt" && (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateActivePhoto((p) => ({ ...p, rot: (p.rot + 3) % 4 }))
                    }
                    className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#2c2c2e]"
                  >
                    <RotateCcw size={13} /> Rotate Left
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateActivePhoto((p) => ({ ...p, rot: (p.rot + 1) % 4 }))
                    }
                    className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#2c2c2e]"
                  >
                    <RotateCw size={13} /> Rotate Right
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateActivePhoto((p) => ({ ...p, flip: !p.flip }))
                    }
                    className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#2c2c2e]"
                  >
                    <FlipHorizontal size={13} /> Mirror
                  </button>
                </div>

                <div className="grid grid-cols-[88px_1fr_40px] items-center gap-2 text-xs">
                  <span className="text-zinc-200">Straighten</span>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={0.5}
                    value={activePhoto.ang}
                    onChange={(e) =>
                      updateActivePhoto((p) => ({
                        ...p,
                        ang: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#30d158]"
                  />
                  <span className="text-right text-zinc-400 tabular-nums">
                    {activePhoto.ang}°
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CROP_DEFS.map(([label, ratioVal]) => {
                    const active =
                      JSON.stringify(activePhoto.crop) ===
                      JSON.stringify(ratioVal);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          updateActivePhoto((p) => ({ ...p, crop: ratioVal }))
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                            : "bg-[#1c1c1e] text-zinc-200 border-white/10 hover:bg-[#2c2c2e]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateActivePhoto((p) => ({
                        ...p,
                        frame:
                          p.frame === null ? "w" : p.frame === "w" ? "b" : null,
                      }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      activePhoto.frame
                        ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                        : "bg-[#1c1c1e] text-zinc-200 border-white/10"
                    }`}
                  >
                    Frame:{" "}
                    {activePhoto.frame === "w"
                      ? "White"
                      : activePhoto.frame === "b"
                        ? "Black"
                        : "None"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateActivePhoto((p) => ({ ...p, wm: !p.wm }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      activePhoto.wm
                        ? "bg-[#30d158] text-[#04130c] border-[#30d158]"
                        : "bg-[#1c1c1e] text-zinc-200 border-white/10"
                    }`}
                  >
                    Watermark: {activePhoto.wm ? "On" : "Off"}
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={60}
                  value={activePhoto.txt}
                  onChange={(e) =>
                    updateActivePhoto((p) => ({ ...p, txt: e.target.value }))
                  }
                  placeholder="Add a caption overlay (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/15 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#30d158]"
                />
              </div>
            )}

            {/* Format + Save / Share Row */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Export Format</span>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1c1c1e]">
                  {(["jpeg", "png", "webp"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[11px] font-bold cursor-pointer ${
                        exportFormat === fmt
                          ? "bg-[#30d158] text-[#04130c]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setView("cam")}
                  className="py-3 rounded-2xl bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 text-xs font-semibold text-white cursor-pointer transition-colors"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleSharePhoto}
                  className="py-3 rounded-2xl bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Share2 size={14} /> Share
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="py-3 rounded-2xl bg-[#30d158] hover:bg-[#28b84c] text-[#04130c] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: SESSION GALLERY */}
      {view === "gal" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Saved Photos &amp; Captures
              </h2>
              <p className="text-xs text-zinc-400 tabular-nums">
                {photos.length} photos ({storedPhotoIds.size} in browser storage) · {videos.length} videos
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(CAMERA_STORAGE_KEY);
                    } catch {
                      // ignore
                    }
                    setPhotos([]);
                    setStoredPhotoIds(new Set());
                    setActivePhotoId(null);
                    showToast("Cleared saved browser photos");
                  }}
                  className="px-3.5 py-2 rounded-full bg-[#1c1c1e] hover:bg-red-500/20 border border-white/15 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Clear Saved
                </button>
              )}
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="px-4 py-2 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} /> Import Photo
              </button>
              <button
                type="button"
                onClick={() => setView("cam")}
                className="px-4 py-2 rounded-full bg-[#30d158] hover:bg-[#28b84c] text-[#04130c] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera size={14} /> Back to Camera
              </button>
            </div>
          </div>

          {photos.length === 0 && videos.length === 0 ? (
            <div className="rounded-3xl bg-[#0b1812] border border-white/10 py-16 px-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#10261b] mx-auto flex items-center justify-center text-[#30d158]">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white">No Captures Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Capture a still photo with live Grayscale, Sepia, or High Contrast filters—saved automatically to your browser storage.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer"
                      onClick={() => {
                        setActivePhotoId(p.id);
                        baseGeoRef.current = null;
                        setShowOriginal(false);
                        setView("edit");
                      }}
                    >
                      <img
                        src={p.thumb}
                        alt={`Session photo ${photos.length - idx}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-zinc-200 truncate">
                          {PRESET_FILTERS[p.pi]?.[0] || "Normal"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadGalleryPhoto(p);
                            }}
                            aria-label="Download full-resolution photo"
                            className="w-7 h-7 rounded-full bg-white/15 hover:bg-[#30d158] hover:text-[#04130c] text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotos((prev) => {
                                const next = prev.filter((x) => x.id !== p.id);
                                persistPhotosToBrowser(next);
                                return next;
                              });
                              if (activePhotoId === p.id) setActivePhotoId(null);
                            }}
                            aria-label="Delete photo"
                            className="w-7 h-7 rounded-full bg-white/15 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {videos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <VideoIcon size={13} /> Recorded Videos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videos.map((v) => (
                      <div
                        key={v.id}
                        className="bg-[#0b1812] border border-white/10 rounded-2xl p-3 space-y-2.5"
                      >
                        <video
                          src={v.url}
                          controls
                          className="w-full rounded-xl bg-black max-h-60"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium truncate">
                            {v.filename} ({v.durationSec}s)
                          </span>
                          <a
                            href={v.url}
                            download={v.filename}
                            className="px-3 py-1.5 rounded-full bg-[#30d158] text-[#04130c] font-bold inline-flex items-center gap-1"
                          >
                            <Download size={12} /> Save
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Hidden Inputs */}
      <input
        ref={nativeCamInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          loadImageFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          loadImageFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1c1c1e]/95 border border-[#30d158] text-white text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
