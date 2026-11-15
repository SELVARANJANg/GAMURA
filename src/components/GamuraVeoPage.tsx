import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Film,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Layers,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Square,
  Sticker,
  Trash2,
  Type as TypeIcon,
  Upload,
  Wand2,
} from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  GAMURA_VEO_LOGO_FALLBACK,
  GAMURA_VEO_LOGO_URL,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  addMobileInstalledId,
  downloadStandaloneAppPackage,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";
import {
  VEO_ASPECT_DIMENSIONS,
  VEO_LOOK_FILTERS,
  VEO_MANUAL_SECTIONS,
  VEO_STICKERS,
  VEO_TITLE_GRADIENTS,
  VEO_UPLOADED_ASSETS,
  clipDuration,
  computeMotionOffset,
  createDefaultClipProps,
  formatVeoTime,
  pickSupportedRecorderMime,
  totalDuration,
  type VeoAspectRatio,
  type VeoAudioTrack,
  type VeoClip,
  type VeoLook,
  type VeoMotion,
  type VeoTrans,
  type VeoUploadedKitAsset,
  type VeoWatermark,
} from "../utils/gamuraVeoEngine";

type VeoScreen = "tools" | "editor" | "files" | "manual";
type EditorTab =
  | "clips"
  | "edit"
  | "motion"
  | "look"
  | "text"
  | "logo"
  | "audio"
  | "magic"
  | "export";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

const STUDIO_TOOLS: {
  id: string;
  title: string;
  sub: string;
  tab: EditorTab | "manual";
  pick: "a" | "v" | "i" | "n";
  grad: string;
  emoji: string;
}[] = [
  { id: "ve", title: "Video Editor", sub: "Timeline, trim, split", tab: "clips", pick: "a", grad: "from-sky-500 to-cyan-400", emoji: "🎬" },
  { id: "mv", title: "Merge Videos", sub: "Join clips into one", tab: "clips", pick: "v", grad: "from-indigo-500 to-blue-500", emoji: "🔗" },
  { id: "ptv", title: "Photo to Video", sub: "Images with motion", tab: "motion", pick: "i", grad: "from-cyan-500 to-indigo-500", emoji: "🖼" },
  { id: "tc", title: "Trim & Crop", sub: "Cut, zoom, rotate", tab: "edit", pick: "n", grad: "from-blue-600 to-violet-500", emoji: "✂" },
  { id: "fx", title: "Motion FX", sub: "Zoom, pan, beat pulse", tab: "motion", pick: "n", grad: "from-sky-400 to-blue-600", emoji: "✦" },
  { id: "lk", title: "Looks", sub: "Aura filters, vignette", tab: "look", pick: "n", grad: "from-violet-500 to-fuchsia-500", emoji: "◐" },
  { id: "tx", title: "Text & Stickers", sub: "Captions and emoji", tab: "text", pick: "n", grad: "from-blue-500 to-sky-400", emoji: "T" },
  { id: "lg", title: "Logo Watermark", sub: "Brand every video", tab: "logo", pick: "n", grad: "from-emerald-500 to-teal-500", emoji: "◎" },
  { id: "au", title: "Song & Voice", sub: "Music and voiceover", tab: "audio", pick: "n", grad: "from-indigo-500 to-sky-500", emoji: "♪" },
  { id: "mg", title: "Magic Tools", sub: "Auto-edit, title cards", tab: "magic", pick: "n", grad: "from-purple-500 to-blue-500", emoji: "⚡" },
  { id: "mn", title: "Manual", sub: "Step-by-step guide", tab: "manual", pick: "n", grad: "from-zinc-700 to-zinc-900", emoji: "📖" },
  { id: "ex", title: "Export", sub: "720p, 1080p, Reels", tab: "export", pick: "n", grad: "from-emerald-600 to-emerald-500", emoji: "⬆" },
];

const EDITOR_TABS: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
  { id: "clips", label: "Clips", icon: <Layers size={15} /> },
  { id: "edit", label: "Edit", icon: <Scissors size={15} /> },
  { id: "motion", label: "Motion", icon: <Sparkles size={15} /> },
  { id: "look", label: "Look", icon: <Sliders size={15} /> },
  { id: "text", label: "Text", icon: <TypeIcon size={15} /> },
  { id: "logo", label: "Logo", icon: <ImageIcon size={15} /> },
  { id: "audio", label: "Audio", icon: <Music size={15} /> },
  { id: "magic", label: "Magic", icon: <Wand2 size={15} /> },
  { id: "export", label: "Export", icon: <Download size={15} /> },
];

const TAB_TIPS: Record<EditorTab, string> = {
  clips: "Tap + Add Clips to import videos or photos. Tap any timeline chip to select and edit.",
  edit: "Trim start/end cuts video length. Zoom + Pan crops. Fit + blur keeps the whole frame on a blurred backdrop.",
  motion: "Photos get smooth Ken Burns motion automatically. Beat pulse syncs zoom to your BPM.",
  look: "Pick an Aura look, then fine-tune brightness, contrast, saturation, or vignette.",
  text: "Type a caption, pick position and colour, or stamp an emoji sticker.",
  logo: "Your GAMURA VEO logo is pre-loaded. Tap Use app logo as watermark or upload any PNG.",
  audio: "Add a background song and record voiceover directly from the playhead.",
  magic: "One-tap Auto-edit, gradient Title Card generator, and instant PNG frame snapshot.",
  export: "Choose aspect ratio and resolution, then Render & download in real time as MP4 or WebM.",
};

export default function GamuraVeoPage({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [screen, setScreen] = useState<VeoScreen>("tools");
  const [activeTab, setActiveTab] = useState<EditorTab>("clips");
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    try {
      return localStorage.getItem("veoLogo") || GAMURA_VEO_LOGO_URL;
    } catch {
      return GAMURA_VEO_LOGO_URL;
    }
  });
  const [logoFallbackApplied, setLogoFallbackApplied] = useState(false);

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "veo",
    ),
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Uploaded Files viewer state
  const [previewAsset, setPreviewAsset] = useState<VeoUploadedKitAsset | null>(
    VEO_UPLOADED_ASSETS[1],
  );
  const [manualText, setManualText] = useState<string>("");
  const [openManualIdx, setOpenManualIdx] = useState<number>(0);

  // Reactive snapshots for UI controls while canvas animates at 60fps via refs
  const [, setVersion] = useState(0);
  const forceSyncUi = useCallback(() => setVersion((v) => v + 1), []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadUi, setPlayheadUi] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  // Title card text + gradient state
  const [cardText, setCardText] = useState("GAMURA VEO");
  const [cardGradIdx, setCardGradIdx] = useState(0);

  // Mutable high-frequency engine state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const appLogoInputRef = useRef<HTMLInputElement>(null);

  const engineRef = useRef<{
    clips: VeoClip[];
    history: VeoClip[][];
    sel: number;
    t: number;
    playing: boolean;
    lastTs: number;
    ar: VeoAspectRatio;
    q: 1 | 1.5;
    bars: 0 | 1;
    vig: 0 | 1;
    mute: 0 | 1;
    bpm: number;
    mv: number;
    vv: number;
    mOff: number;
    fade: 0 | 1;
    music: VeoAudioTrack | null;
    voice: VeoAudioTrack | null;
    vStart: number;
    wm: VeoWatermark;
    ac: AudioContext | null;
    dest: MediaStreamAudioDestinationNode | null;
    vrec: MediaRecorder | null;
    rec: MediaRecorder | null;
    recCancelled: boolean;
    scrubbing: boolean;
    rafId: number | null;
  }>({
    clips: [],
    history: [],
    sel: -1,
    t: 0,
    playing: false,
    lastTs: 0,
    ar: "16:9",
    q: 1,
    bars: 0,
    vig: 0,
    mute: 0,
    bpm: 120,
    mv: 0.7,
    vv: 1,
    mOff: 0,
    fade: 1,
    music: null,
    voice: null,
    vStart: 0,
    wm: {
      img: null,
      srcUrl: "",
      on: true,
      x: 0.88,
      y: 0.12,
      size: 0.16,
      op: 0.88,
    },
    ac: null,
    dest: null,
    vrec: null,
    rec: null,
    recCancelled: false,
    scrubbing: false,
    rafId: null,
  });

  const veoStoreApp: StoreAppItem =
    BUILTIN_STORE_APPS.find((a) => a.id === "veo") || {
      id: "veo",
      name: "Gamura Veo",
      cat: "Creative",
      tag: "Create, edit & export videos with Motion FX",
      desc: "Full browser video studio inside Gamura.",
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
    };

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "GAMURA VEO · Video Studio";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const syncUniverse = () => {
      setInstalledInUniverse(
        readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
          (a) => a.id === "veo",
        ),
      );
    };
    window.addEventListener("storage", syncUniverse);
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    return () => {
      window.removeEventListener("storage", syncUniverse);
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    };
  }, []);

  // Load markdown manual preview content if selected in Uploaded Files
  useEffect(() => {
    if (previewAsset?.id === "manual-md" && !manualText) {
      fetch(previewAsset.path)
        .then((r) => (r.ok ? r.text() : ""))
        .then((txt) => {
          if (txt) setManualText(txt);
        })
        .catch(() => {});
    }
  }, [previewAsset, manualText]);

  // Cleanup audio / RAF / media on unmount
  useEffect(() => {
    const eng = engineRef.current;
    return () => {
      if (eng.rafId !== null) cancelAnimationFrame(eng.rafId);
      eng.music?.el.pause();
      eng.voice?.el.pause();
      eng.clips.forEach((c) => {
        if (c.k === "v" && c.el instanceof HTMLVideoElement) {
          c.el.pause();
        }
      });
      if (eng.ac && eng.ac.state !== "closed") {
        eng.ac.close().catch(() => {});
      }
    };
  }, []);

  const ensureAudioContext = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.ac) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const dest = ctx.createMediaStreamDestination();
      // Keep-alive silent tone ensures MediaRecorder gets a valid audio track even on silent clips
      const osc = ctx.createOscillator();
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      osc.connect(silentGain);
      silentGain.connect(dest);
      osc.start();
      eng.ac = ctx;
      eng.dest = dest;
    }
    if (eng.ac.state === "suspended") {
      eng.ac.resume().catch(() => {});
    }
  }, []);

  const connectMediaElement = useCallback((el: HTMLMediaElement) => {
    const eng = engineRef.current;
    if (!eng.ac || !eng.dest) return;
    const tagged = el as HTMLMediaElement & { _veoConnected?: boolean };
    if (tagged._veoConnected) return;
    try {
      const src = eng.ac.createMediaElementSource(el);
      src.connect(eng.ac.destination);
      src.connect(eng.dest);
      tagged._veoConnected = true;
    } catch {
      // ignore already connected or CORS elements
    }
  }, []);

  const locateAtTime = useCallback((t: number) => {
    const clips = engineRef.current.clips;
    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const d = clipDuration(c);
      if (t < acc + d || i === clips.length - 1) {
        return { i, c, lt: Math.min(Math.max(t - acc, 0), d), d };
      }
      acc += d;
    }
    return null;
  }, []);

  const startTimeOfClip = useCallback((idx: number) => {
    const clips = engineRef.current.clips;
    let acc = 0;
    for (let i = 0; i < idx && i < clips.length; i++) {
      acc += clipDuration(clips[i]);
    }
    return acc;
  }, []);

  const syncAudioElements = useCallback(() => {
    const eng = engineRef.current;
    const tot = totalDuration(eng.clips);
    const m = eng.music;
    const v = eng.voice;

    if (m) {
      if (eng.playing) {
        m.el.volume = Math.max(
          0,
          Math.min(1, eng.mv * (eng.fade ? Math.min(1, (tot - eng.t) / 2) : 1)),
        );
        if (m.el.paused) {
          m.el.currentTime = eng.t + eng.mOff;
          m.el.play().catch(() => {});
        }
      } else if (!m.el.paused) {
        m.el.pause();
      }
    }

    if (v) {
      if (eng.playing && eng.t >= eng.vStart) {
        v.el.volume = Math.min(1, eng.vv);
        if (v.el.paused && !v.done) {
          v.el.currentTime = Math.max(0, eng.t - eng.vStart);
          v.el.play().catch(() => {});
        }
      } else if (!v.el.paused) {
        v.el.pause();
      }
    }
  }, []);

  const syncVideoElements = useCallback(() => {
    const eng = engineRef.current;
    const loc = locateAtTime(eng.t);
    eng.clips.forEach((c) => {
      if (c.k !== "v" || !(c.el instanceof HTMLVideoElement)) return;
      const el = c.el;
      if (!loc || loc.c !== c) {
        if (!el.paused) el.pause();
        return;
      }
      const targetTime = c.start + loc.lt * c.speed;
      el.playbackRate = c.speed;
      el.volume = eng.mute ? 0 : c.vol;
      if (eng.playing) {
        if (el.paused) {
          el.currentTime = targetTime;
          el.play().catch(() => {});
        } else if (Math.abs(el.currentTime - targetTime) > 0.35) {
          el.currentTime = targetTime;
        }
      } else {
        if (!el.paused) el.pause();
        if (Math.abs(el.currentTime - targetTime) > 0.05) {
          el.currentTime = targetTime;
        }
      }
    });
  }, [locateAtTime]);

  const drawCanvasFrame = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;
    const eng = engineRef.current;

    const [baseW, baseH] = VEO_ASPECT_DIMENSIONS[eng.ar];
    const W = Math.round(baseW * eng.q);
    const H = Math.round(baseH * eng.q);
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }

    cx.filter = "none";
    cx.globalAlpha = 1;
    cx.fillStyle = "#000000";
    cx.fillRect(0, 0, W, H);

    const loc = locateAtTime(eng.t);
    if (!loc) {
      const grad = cx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#f5f5f7");
      grad.addColorStop(1, "#e6f4ef");
      cx.fillStyle = grad;
      cx.fillRect(0, 0, W, H);
      cx.fillStyle = "#1d1d1f";
      cx.textAlign = "center";
      cx.font = `800 ${Math.round(H * 0.075)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      cx.fillText("GAMURA VEO", W / 2, H * 0.47);
      cx.fillStyle = "#6e6e73";
      cx.font = `500 ${Math.round(H * 0.034)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      cx.fillText("Add videos or photos below to start editing", W / 2, H * 0.56);
      return;
    }

    const c = loc.c;
    const el = c.el;
    let sw = 0;
    let sh = 0;
    let ready = false;
    if (c.k === "v" && el instanceof HTMLVideoElement) {
      sw = el.videoWidth;
      sh = el.videoHeight;
      ready = el.readyState >= 2;
    } else if (el instanceof HTMLImageElement) {
      sw = el.naturalWidth || el.width;
      sh = el.naturalHeight || el.height;
      ready = sw > 0;
    } else if (el instanceof HTMLCanvasElement) {
      sw = el.width;
      sh = el.height;
      ready = sw > 0;
    }

    if (sw > 0 && sh > 0 && ready) {
      const progress = loc.d > 0 ? loc.lt / loc.d : 0;
      const m = computeMotionOffset(c, progress, eng.t, eng.bpm);
      const rotated = c.rot % 180 !== 0;
      const scaleFn = c.fit ? Math.min : Math.max;
      const s =
        scaleFn(W / (rotated ? sh : sw), H / (rotated ? sw : sh)) *
        c.zoom *
        m[0];

      if (c.fit) {
        const bgScale = Math.max(W / sw, H / sh) * 1.15;
        cx.save();
        cx.filter = "blur(28px) brightness(70%)";
        cx.translate(W / 2, H / 2);
        cx.scale(bgScale, bgScale);
        cx.drawImage(el, -sw / 2, -sh / 2);
        cx.restore();
      }

      cx.filter =
        `${VEO_LOOK_FILTERS[c.look]} brightness(${c.br}%) contrast(${c.ct}%) saturate(${c.sa}%) blur(${c.bl}px)`.trim();
      cx.save();
      cx.translate(W / 2 + (c.px + m[1]) * W, H / 2 + (c.py + m[2]) * H);
      cx.rotate((c.rot * Math.PI) / 180);
      cx.scale(c.flip ? -s : s, s);
      cx.drawImage(el, -sw / 2, -sh / 2);
      cx.restore();
      cx.filter = "none";
    }

    if (c.text) {
      cx.save();
      cx.font = `800 ${Math.round(H * c.ts)}px -apple-system, "SF Pro Display", sans-serif`;
      cx.textAlign = "center";
      cx.fillStyle = c.tc;
      cx.shadowColor = "rgba(0,0,0,0.65)";
      cx.shadowBlur = H * 0.02;
      cx.globalAlpha = Math.min(1, loc.lt / 0.4);
      const yPos =
        c.tp === "top" ? H * 0.12 : c.tp === "mid" ? H * 0.52 : H * 0.9;
      cx.fillText(c.text, W / 2, yPos, W * 0.9);
      cx.restore();
    }

    if (c.stk && c.stk !== "none") {
      cx.save();
      cx.font = `${Math.round(H * c.ss)}px serif`;
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      cx.fillText(c.stk, W * c.sx, H * c.sy);
      cx.restore();
    }

    const wm = eng.wm;
    if (wm.on && wm.img && wm.img.naturalWidth > 0) {
      cx.save();
      cx.globalAlpha = wm.op;
      const ww = W * wm.size;
      const hh = (ww * wm.img.naturalHeight) / wm.img.naturalWidth;
      cx.drawImage(wm.img, W * wm.x - ww / 2, H * wm.y - hh / 2, ww, hh);
      cx.restore();
    }

    if (eng.vig) {
      const g = cx.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.3,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.75,
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.6)");
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
    }

    if (eng.bars) {
      cx.fillStyle = "#000000";
      cx.fillRect(0, 0, W, H * 0.11);
      cx.fillRect(0, H * 0.89, W, H * 0.11);
    }

    if (c.trans === "fade") {
      const alpha = Math.min(1, loc.lt / 0.45, (loc.d - loc.lt) / 0.45);
      cx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - alpha)})`;
      cx.fillRect(0, 0, W, H);
    } else if (c.trans === "flash" && loc.lt < 0.3) {
      cx.fillStyle = `rgba(255,255,255,${1 - loc.lt / 0.3})`;
      cx.fillRect(0, 0, W, H);
    }
  }, [locateAtTime]);

  const resyncMedia = useCallback(() => {
    const eng = engineRef.current;
    [eng.music, eng.voice].forEach((tr) => {
      if (tr) {
        tr.el.pause();
        tr.done = false;
      }
    });
    syncVideoElements();
    drawCanvasFrame();
  }, [drawCanvasFrame, syncVideoElements]);

  const stopPlayback = useCallback(() => {
    const eng = engineRef.current;
    eng.playing = false;
    setIsPlaying(false);
    if (eng.rafId !== null) {
      cancelAnimationFrame(eng.rafId);
      eng.rafId = null;
    }
    syncVideoElements();
    syncAudioElements();
    drawCanvasFrame();
    if (eng.vrec && eng.vrec.state === "recording") {
      eng.vrec.stop();
    }
  }, [drawCanvasFrame, syncAudioElements, syncVideoElements]);

  const runLoop = useCallback(
    (ts: number) => {
      const eng = engineRef.current;
      if (!eng.playing) return;
      const dt = eng.lastTs > 0 ? Math.min(0.1, (ts - eng.lastTs) / 1000) : 0;
      eng.lastTs = ts;
      eng.t += dt;

      const tot = totalDuration(eng.clips);
      if (eng.t >= tot) {
        eng.t = tot;
        setPlayheadUi(tot);
        stopPlayback();
        if (eng.rec && eng.rec.state === "recording") {
          eng.rec.stop();
        }
        return;
      }

      syncVideoElements();
      syncAudioElements();
      drawCanvasFrame();
      setPlayheadUi(eng.t);

      if (eng.rec && eng.rec.state === "recording" && tot > 0) {
        setExportProgress(Math.min(100, Math.round((eng.t / tot) * 100)));
      }

      eng.rafId = requestAnimationFrame(runLoop);
    },
    [drawCanvasFrame, stopPlayback, syncAudioElements, syncVideoElements],
  );

  const startPlayback = useCallback(() => {
    const eng = engineRef.current;
    const tot = totalDuration(eng.clips);
    if (tot <= 0) {
      showToast("Add a video or image clip first");
      return;
    }
    ensureAudioContext();
    if (eng.t >= tot - 0.05) eng.t = 0;
    resyncMedia();
    eng.playing = true;
    eng.lastTs = performance.now();
    setIsPlaying(true);
    eng.rafId = requestAnimationFrame(runLoop);
  }, [ensureAudioContext, resyncMedia, runLoop, showToast]);

  const togglePlayback = useCallback(() => {
    if (engineRef.current.playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [startPlayback, stopPlayback]);

  // Draw initial canvas when entering editor or changing screen
  useEffect(() => {
    if (screen === "editor") {
      drawCanvasFrame();
    }
  }, [drawCanvasFrame, screen]);

  const snapshotHistory = useCallback(() => {
    const eng = engineRef.current;
    eng.history.push(eng.clips.map((c) => ({ ...c })));
    if (eng.history.length > 30) eng.history.shift();
  }, []);

  const handleMediaFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      ensureAudioContext();
      const eng = engineRef.current;
      let addedCount = 0;

      Array.from(fileList).forEach((file) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image")) {
          const im = new Image();
          im.onload = () => {
            const clip = createDefaultClipProps({
              id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              k: "i",
              el: im,
              url,
              name: file.name,
              max: 30,
              start: 0,
              end: 4,
            });
            eng.clips.push(clip);
            eng.sel = eng.clips.length - 1;
            drawCanvasFrame();
            forceSyncUi();
          };
          im.src = url;
          addedCount++;
        } else if (file.type.startsWith("video")) {
          const v = document.createElement("video");
          v.src = url;
          v.playsInline = true;
          v.preload = "auto";
          v.onloadedmetadata = () => {
            connectMediaElement(v);
            const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 5;
            const clip = createDefaultClipProps({
              id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              k: "v",
              el: v,
              url,
              name: file.name,
              max: dur,
              start: 0,
              end: dur,
            });
            eng.clips.push(clip);
            eng.sel = eng.clips.length - 1;
            drawCanvasFrame();
            forceSyncUi();
          };
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setScreen("editor");
      }
    },
    [connectMediaElement, drawCanvasFrame, ensureAudioContext, forceSyncUi],
  );

  const selectedClip = engineRef.current.clips[engineRef.current.sel] || null;
  const totalSec = totalDuration(engineRef.current.clips);

  const updateSelectedClip = useCallback(
    (updater: (clip: VeoClip) => void) => {
      const c = engineRef.current.clips[engineRef.current.sel];
      if (!c) return;
      updater(c);
      if (c.start < 0) c.start = 0;
      if (c.end <= c.start + 0.2) c.end = Math.min(c.max, c.start + 0.2);
      drawCanvasFrame();
      forceSyncUi();
    },
    [drawCanvasFrame, forceSyncUi],
  );

  const moveClip = (dir: -1 | 1) => {
    const eng = engineRef.current;
    const i = eng.sel;
    const j = i + dir;
    if (i < 0 || j < 0 || j >= eng.clips.length) return;
    snapshotHistory();
    [eng.clips[i], eng.clips[j]] = [eng.clips[j], eng.clips[i]];
    eng.sel = j;
    drawCanvasFrame();
    forceSyncUi();
  };

  const duplicateClip = () => {
    const eng = engineRef.current;
    const c = eng.clips[eng.sel];
    if (!c) return;
    snapshotHistory();
    let elClone = c.el;
    if (c.k === "v" && c.url) {
      const v = document.createElement("video");
      v.src = c.url;
      v.playsInline = true;
      v.preload = "auto";
      v.onloadedmetadata = () => connectMediaElement(v);
      elClone = v;
    }
    const copy: VeoClip = {
      ...c,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      el: elClone,
    };
    eng.clips.splice(eng.sel + 1, 0, copy);
    eng.sel += 1;
    drawCanvasFrame();
    forceSyncUi();
    showToast("Clip duplicated");
  };

  const deleteSelectedClip = useCallback(() => {
    const eng = engineRef.current;
    if (eng.sel < 0 || !eng.clips[eng.sel]) return;
    snapshotHistory();
    const [removed] = eng.clips.splice(eng.sel, 1);
    if (removed.k === "v" && removed.el instanceof HTMLVideoElement) {
      removed.el.pause();
    }
    eng.sel = Math.min(eng.sel, eng.clips.length - 1);
    eng.t = Math.min(eng.t, totalDuration(eng.clips));
    setPlayheadUi(eng.t);
    drawCanvasFrame();
    forceSyncUi();
  }, [drawCanvasFrame, forceSyncUi, snapshotHistory]);

  const splitAtPlayhead = useCallback(() => {
    const eng = engineRef.current;
    const loc = locateAtTime(eng.t);
    if (!loc || loc.d < 0.6) {
      showToast("Move the playhead inside a longer clip to split");
      return;
    }
    snapshotHistory();
    const c = loc.c;
    const splitPoint = c.start + loc.lt * c.speed;
    let cloneEl = c.el;
    if (c.k === "v" && c.url) {
      const v = document.createElement("video");
      v.src = c.url;
      v.playsInline = true;
      v.preload = "auto";
      v.onloadedmetadata = () => connectMediaElement(v);
      cloneEl = v;
    }
    const rightHalf: VeoClip = {
      ...c,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      el: cloneEl,
      start: splitPoint,
    };
    c.end = splitPoint;
    eng.clips.splice(loc.i + 1, 0, rightHalf);
    eng.sel = loc.i;
    drawCanvasFrame();
    forceSyncUi();
    showToast("Clip split");
  }, [connectMediaElement, drawCanvasFrame, forceSyncUi, locateAtTime, showToast, snapshotHistory]);

  const undoClips = () => {
    const eng = engineRef.current;
    const prev = eng.history.pop();
    if (!prev) {
      showToast("Nothing to undo");
      return;
    }
    eng.clips = prev;
    eng.sel = Math.min(eng.sel, eng.clips.length - 1);
    drawCanvasFrame();
    forceSyncUi();
  };

  const applyKeysToAll = (keys: (keyof VeoClip)[]) => {
    const eng = engineRef.current;
    const src = eng.clips[eng.sel];
    if (!src) return;
    snapshotHistory();
    eng.clips.forEach((clip) => {
      keys.forEach((k) => {
        (clip as unknown as Record<string, unknown>)[k] = src[k];
      });
    });
    drawCanvasFrame();
    forceSyncUi();
    showToast("Applied to all clips");
  };

  const handleSetAudioTrack = (
    kind: "music" | "voice",
    url: string,
    name: string,
  ) => {
    ensureAudioContext();
    const eng = engineRef.current;
    const prev = eng[kind];
    if (prev) prev.el.pause();
    const el = new Audio(url);
    el.loop = kind === "music";
    el.preload = "auto";
    connectMediaElement(el);
    const track: VeoAudioTrack = { el, url, name, done: false };
    el.onended = () => {
      track.done = true;
    };
    eng[kind] = track;
    forceSyncUi();
  };

  const handleRecordVoice = async () => {
    const eng = engineRef.current;
    if (eng.vrec && eng.vrec.state === "recording") {
      eng.vrec.stop();
      return;
    }
    if (totalDuration(eng.clips) <= 0) {
      showToast("Add a clip first before recording voiceover");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      eng.vrec = mr;
      eng.vStart = eng.t;
      setIsRecordingVoice(true);

      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        eng.vrec = null;
        setIsRecordingVoice(false);
        handleSetAudioTrack("voice", URL.createObjectURL(blob), "Voiceover");
        stopPlayback();
        showToast("Voiceover added at playhead ✓");
      };

      mr.start();
      startPlayback();
    } catch {
      setIsRecordingVoice(false);
      showToast("Microphone permission is required for voiceover");
    }
  };

  const handleAutoEdit = () => {
    const eng = engineRef.current;
    if (eng.clips.length === 0) {
      showToast("Add clips first");
      return;
    }
    snapshotHistory();
    const cycle: VeoMotion[] = ["zoomin", "panl", "zoomout", "panr", "drift"];
    eng.clips.forEach((c, idx) => {
      if (c.k === "i") c.motion = cycle[idx % cycle.length];
      c.trans = "fade";
      c.look = "cinema";
    });
    eng.vig = 1;
    drawCanvasFrame();
    forceSyncUi();
    showToast("Magic Auto-edit applied ⚡");
  };

  const handleAddTitleCard = () => {
    const eng = engineRef.current;
    snapshotHistory();
    const k = document.createElement("canvas");
    k.width = 1280;
    k.height = 720;
    const ctx = k.getContext("2d");
    if (ctx) {
      const [, c1, c2] = VEO_TITLE_GRADIENTS[cardGradIdx];
      const gr = ctx.createLinearGradient(0, 0, 1280, 720);
      gr.addColorStop(0, c1);
      gr.addColorStop(1, c2);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "800 92px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(cardText.trim() || "GAMURA VEO", 640, 360, 1080);
    }
    const clip = createDefaultClipProps({
      id: `title_${Date.now()}`,
      k: "i",
      el: k,
      url: k.toDataURL("image/png"),
      name: cardText.trim() || "Title Card",
      max: 30,
      start: 0,
      end: 3,
    });
    eng.clips.push(clip);
    eng.sel = eng.clips.length - 1;
    drawCanvasFrame();
    forceSyncUi();
    showToast("Title card added to timeline");
  };

  const handleSaveSnapshot = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gamura-veo-frame.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Saved PNG snapshot ✓");
    });
  };

  const handleUseAppLogoWatermark = () => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      engineRef.current.wm.img = im;
      engineRef.current.wm.srcUrl = logoSrc;
      engineRef.current.wm.on = true;
      drawCanvasFrame();
      forceSyncUi();
      showToast("Gamura Veo logo watermark active ✓");
    };
    im.onerror = () => {
      const fb = new Image();
      fb.onload = () => {
        engineRef.current.wm.img = fb;
        engineRef.current.wm.srcUrl = GAMURA_VEO_LOGO_URL;
        engineRef.current.wm.on = true;
        drawCanvasFrame();
        forceSyncUi();
      };
      fb.src = GAMURA_VEO_LOGO_URL;
    };
    im.src = logoSrc;
  };

  const handleExportVideo = () => {
    const eng = engineRef.current;
    const cv = canvasRef.current;
    if (!cv || totalDuration(eng.clips) <= 0) {
      showToast("Add at least one clip before exporting");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      showToast("Export is not supported in this browser");
      return;
    }

    ensureAudioContext();
    stopPlayback();
    eng.t = 0;
    eng.recCancelled = false;
    resyncMedia();

    const stream = cv.captureStream(30);
    if (eng.dest) {
      eng.dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    }

    const mime = pickSupportedRecorderMime();
    const chunks: Blob[] = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined,
      );
    } catch {
      mr = new MediaRecorder(stream);
    }

    eng.rec = mr;
    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    mr.onerror = () => {
      setExportProgress(null);
      eng.rec = null;
      stopPlayback();
      showToast("Export failed — try Chrome or Edge");
    };
    mr.onstop = () => {
      setExportProgress(null);
      stopPlayback();
      if (eng.recCancelled) {
        eng.rec = null;
        return;
      }
      const actualMime = mr.mimeType || mime || "video/webm";
      const ext = actualMime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: actualMime });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `gamura-veo.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(dlUrl), 6000);
      eng.rec = null;
      showToast(`Exported gamura-veo.${ext} ✓`);
    };

    setExportProgress(0);
    mr.start(250);
    startPlayback();
  };

  // Keyboard shortcuts when editing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== "editor") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const eng = engineRef.current;
      const tot = totalDuration(eng.clips);
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayback();
      } else if (e.key === "ArrowRight") {
        eng.t = Math.min(tot, eng.t + 1);
        setPlayheadUi(eng.t);
        resyncMedia();
      } else if (e.key === "ArrowLeft") {
        eng.t = Math.max(0, eng.t - 1);
        setPlayheadUi(eng.t);
        resyncMedia();
      } else if (e.key === "s" || e.key === "S") {
        splitAtPlayhead();
      } else if (e.key === "Delete") {
        deleteSelectedClip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelectedClip, resyncMedia, screen, splitAtPlayhead, togglePlayback]);

  const handleToggleUniverseInstall = () => {
    if (installedInUniverse) {
      removeAppFromUniverse("veo");
      setInstalledInUniverse(false);
      showToast("Gamura Veo removed from Universe Apps");
    } else {
      addAppToUniverse(veoStoreApp);
      setInstalledInUniverse(true);
      showToast("Gamura Veo added to Universe Apps ✓");
    }
  };

  const handleDownloadMobileLauncher = () => {
    addMobileInstalledId("veo");
    downloadStandaloneAppPackage(veoStoreApp);
    showToast("Downloaded Gamura Veo launcher ✓");
  };

  const openToolFromHome = (tool: (typeof STUDIO_TOOLS)[number]) => {
    if (tool.tab === "manual") {
      setScreen("manual");
      return;
    }
    setActiveTab(tool.tab);
    setScreen("editor");
    if (
      tool.pick !== "n" ||
      (engineRef.current.clips.length === 0 &&
        ["edit", "motion", "look", "text"].includes(tool.tab))
    ) {
      if (mediaInputRef.current) {
        mediaInputRef.current.accept =
          tool.pick === "v"
            ? "video/*"
            : tool.pick === "i"
              ? "image/*"
              : "video/*,image/*";
        mediaInputRef.current.click();
      }
    }
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col"
    >
      {/* Hidden File Inputs */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleMediaFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={songInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleSetAudioTrack("music", URL.createObjectURL(f), f.name);
          e.target.value = "";
        }}
      />
      <input
        ref={watermarkInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = URL.createObjectURL(f);
            const im = new Image();
            im.onload = () => {
              engineRef.current.wm.img = im;
              engineRef.current.wm.srcUrl = url;
              engineRef.current.wm.on = true;
              drawCanvasFrame();
              forceSyncUi();
              showToast("Watermark uploaded ✓");
            };
            im.src = url;
          }
          e.target.value = "";
        }}
      />
      <input
        ref={appLogoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const rd = new FileReader();
          rd.onload = () => {
            const res = String(rd.result || "");
            try {
              localStorage.setItem("veoLogo", res);
            } catch {}
            setLogoSrc(res);
            showToast("Custom Gamura Veo logo updated ✓");
          };
          rd.readAsDataURL(f);
        }}
      />

      {/* Apple-White Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-zinc-200/80 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors whitespace-nowrap"
            >
              <Layers size={13} />
              <span className="hidden md:inline">Launch Store</span>
            </a>

            <div className="flex items-center gap-2 pl-1 pr-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200/80 p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                <img
                  src={logoSrc}
                  alt="GAMURA VEO Logo"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (!logoFallbackApplied) {
                      setLogoFallbackApplied(true);
                      setLogoSrc(GAMURA_VEO_LOGO_FALLBACK);
                    }
                  }}
                  className="w-full h-full object-contain scale-[1.2]"
                />
              </div>
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap">
                GAMURA <span className="text-[#059669]">VEO</span>
              </span>
            </div>
          </div>

          {/* Center Navigation Switcher */}
          <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-full border border-zinc-200/80 shrink-0">
            {(
              [
                { id: "tools" as const, label: "Tools" },
                { id: "editor" as const, label: "Studio" },
                { id: "files" as const, label: "Files" },
                { id: "manual" as const, label: "Manual" },
              ] as const
            ).map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setScreen(nav.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  screen === nav.id
                    ? "bg-white text-[#1D1D1F] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#E2F5ED] border-[#059669]/30 text-[#059669]"
                  : "bg-white border-zinc-200/80 text-[#1D1D1F] hover:bg-zinc-50"
              }`}
              title="Install to Universe Apps"
            >
              <Globe size={13} />
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe ✓" : "Universe"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScreen("editor");
                setActiveTab("export");
              }}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* SCREEN 1: TOOLS LAUNCHER HOME */}
      {screen === "tools" && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <section className="bg-white border border-zinc-200/80 rounded-[28px] p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
            <button
              type="button"
              onClick={() => appLogoInputRef.current?.click()}
              title="Tap to customize GAMURA VEO logo"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] bg-white border border-zinc-200/80 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden cursor-pointer hover:scale-[1.03] transition-transform"
            >
              <img
                src={logoSrc}
                alt="GAMURA VEO Logo"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (!logoFallbackApplied) {
                    setLogoFallbackApplied(true);
                    setLogoSrc(GAMURA_VEO_LOGO_FALLBACK);
                  }
                }}
                className="w-full h-full object-contain scale-[1.22]"
              />
            </button>

            <div className="space-y-1.5 max-w-lg">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6E6E73]">
                Welcome to
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
                GAMURA{" "}
                <span className="bg-gradient-to-r from-[#059669] to-[#0284c7] bg-clip-text text-transparent">
                  VEO
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                Create, edit and export videos in your browser. Pick any tool
                below, browse the uploaded Veo files, or start a new video right
                away.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("clips");
                  setScreen("editor");
                  mediaInputRef.current?.click();
                }}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Start a new video</span>
              </button>

              <button
                type="button"
                onClick={() => setScreen("files")}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-[#1D1D1F] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FolderOpen size={15} />
                <span>Uploaded Files ({VEO_UPLOADED_ASSETS.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMobileLauncher}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#E2F5ED] hover:bg-[#D1EFE3] text-[#059669] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={15} />
                <span>Download App</span>
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {STUDIO_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => openToolFromHome(tool)}
                className="bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-[22px] p-4 sm:p-5 text-left flex flex-col items-start gap-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tool.grad} text-white flex items-center justify-center text-xl shadow-sm`}
                >
                  {tool.emoji}
                </span>
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#1D1D1F] tracking-tight">
                    {tool.title}
                  </div>
                  <div className="text-xs text-[#6E6E73] mt-0.5">
                    {tool.sub}
                  </div>
                </div>
              </button>
            ))}
          </section>
        </main>
      )}

      {/* SCREEN 2: LIVE VIDEO EDITOR WORKSPACE */}
      {screen === "editor" && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-5 py-4 flex flex-col gap-3">
          {/* Canvas Stage */}
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-3 sm:p-4 shadow-xs flex flex-col items-center">
            <div className="w-full h-[260px] sm:h-[320px] flex items-center justify-center bg-[#F5F5F7] rounded-2xl overflow-hidden border border-zinc-200/70">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-xl shadow-md bg-black"
              />
            </div>

            {/* Playback & Scrubber Bar */}
            <div className="w-full flex items-center gap-3 pt-3 px-1">
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-10 h-10 rounded-full bg-[#1D1D1F] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>

              <input
                type="range"
                min={0}
                max={1000}
                value={totalSec > 0 ? Math.round((playheadUi / totalSec) * 1000) : 0}
                onChange={(e) => {
                  const eng = engineRef.current;
                  eng.scrubbing = true;
                  eng.t = (Number(e.target.value) / 1000) * totalDuration(eng.clips);
                  setPlayheadUi(eng.t);
                  resyncMedia();
                  eng.scrubbing = false;
                }}
                aria-label="Timeline scrubber"
                className="flex-1 accent-[#059669] cursor-pointer"
              />

              <span className="text-xs font-mono text-[#6E6E73] tabular-nums shrink-0 min-w-[92px] text-right">
                {formatVeoTime(playheadUi)} / {formatVeoTime(totalSec)}
              </span>
            </div>

            {/* Timeline Strip */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pt-3 pb-1 min-h-[60px]">
              {engineRef.current.clips.length === 0 ? (
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-zinc-300 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] hover:border-[#059669] transition-colors cursor-pointer"
                >
                  + Timeline empty — tap to add videos or photos
                </button>
              ) : (
                engineRef.current.clips.map((clip, idx) => {
                  const active = idx === engineRef.current.sel;
                  const dur = clipDuration(clip);
                  return (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => {
                        const eng = engineRef.current;
                        eng.sel = idx;
                        eng.t = startTimeOfClip(idx);
                        setPlayheadUi(eng.t);
                        resyncMedia();
                        forceSyncUi();
                      }}
                      style={{
                        width: `${Math.max(76, Math.round(dur * 24))}px`,
                        backgroundImage:
                          clip.k === "i" && clip.url ? `url("${clip.url}")` : undefined,
                      }}
                      className={`h-12 shrink-0 rounded-xl bg-cover bg-center border-2 p-1.5 flex items-end justify-between text-left transition-all cursor-pointer ${
                        active
                          ? "border-[#059669] shadow-sm bg-[#E2F5ED]"
                          : "border-zinc-200 bg-[#F5F5F7]"
                      }`}
                    >
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold tabular-nums whitespace-nowrap">
                        {clip.k === "v" ? "🎬" : "🖼"} {formatVeoTime(dur)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Tool Tab Controls Card */}
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-4">
            {/* Compact Tab Selector */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 border-b border-zinc-100">
              {EDITOR_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    activeTab === t.id
                      ? "bg-[#E2F5ED] text-[#059669]"
                      : "text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] text-xs text-[#6E6E73]">
              💡 {TAB_TIPS[activeTab]}
            </div>

            {/* Tab Bodies */}
            {["edit", "motion", "look", "text"].includes(activeTab) && !selectedClip ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  No clip selected
                </p>
                <p className="text-xs text-[#6E6E73]">
                  Add a video or image clip, or tap a clip on the timeline above.
                </p>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-full bg-[#059669] text-white text-xs font-bold cursor-pointer"
                >
                  + Add videos &amp; images
                </button>
              </div>
            ) : activeTab === "clips" ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="w-full min-h-[46px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add videos &amp; images</span>
                </button>

                {selectedClip && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveClip(-1)}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer"
                    >
                      ◀ Move Left
                    </button>
                    <button
                      type="button"
                      onClick={() => moveClip(1)}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer"
                    >
                      Move Right ▶
                    </button>
                    <button
                      type="button"
                      onClick={splitAtPlayhead}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Scissors size={12} />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      onClick={duplicateClip}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Copy size={12} />
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={undoClips}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelectedClip}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-[#6E6E73]">
                  {engineRef.current.clips.length} clips · Total{" "}
                  {formatVeoTime(totalSec)}. Clips merge seamlessly in timeline order.
                </p>
              </div>
            ) : activeTab === "edit" && selectedClip ? (
              <div className="space-y-4">
                {selectedClip.k === "v" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VeoSlider
                      label="Trim start"
                      value={selectedClip.start}
                      min={0}
                      max={selectedClip.max}
                      step={0.1}
                      unit="s"
                      onChange={(v) =>
                        updateSelectedClip((c) => {
                          c.start = Math.min(v, c.end - 0.2);
                        })
                      }
                    />
                    <VeoSlider
                      label="Trim end"
                      value={selectedClip.end}
                      min={0}
                      max={selectedClip.max}
                      step={0.1}
                      unit="s"
                      onChange={(v) =>
                        updateSelectedClip((c) => {
                          c.end = Math.max(v, c.start + 0.2);
                        })
                      }
                    />
                    <VeoSlider
                      label="Speed"
                      value={selectedClip.speed}
                      min={0.25}
                      max={4}
                      step={0.05}
                      unit="×"
                      onChange={(v) => updateSelectedClip((c) => { c.speed = v; })}
                    />
                    <VeoSlider
                      label="Volume"
                      value={selectedClip.vol}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => updateSelectedClip((c) => { c.vol = v; })}
                    />
                  </div>
                ) : (
                  <VeoSlider
                    label="Photo Duration"
                    value={selectedClip.end}
                    min={0.5}
                    max={30}
                    step={0.1}
                    unit="s"
                    onChange={(v) => updateSelectedClip((c) => { c.end = v; })}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
                  <VeoSlider
                    label="Crop zoom"
                    value={selectedClip.zoom}
                    min={1}
                    max={4}
                    step={0.05}
                    unit="×"
                    onChange={(v) => updateSelectedClip((c) => { c.zoom = v; })}
                  />
                  <VeoSlider
                    label="Pan X"
                    value={selectedClip.px}
                    min={-0.5}
                    max={0.5}
                    step={0.01}
                    onChange={(v) => updateSelectedClip((c) => { c.px = v; })}
                  />
                  <VeoSlider
                    label="Pan Y"
                    value={selectedClip.py}
                    min={-0.5}
                    max={0.5}
                    step={0.01}
                    onChange={(v) => updateSelectedClip((c) => { c.py = v; })}
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Mirror
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        [0, "Normal"],
                        [1, "Mirror"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateSelectedClip((c) => {
                              c.flip = val as 0 | 1;
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            selectedClip.flip === val
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Rotate
                    </div>
                    <div className="flex gap-1.5">
                      {([0, 90, 180, 270] as const).map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() =>
                            updateSelectedClip((c) => {
                              c.rot = deg;
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            selectedClip.rot === deg
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Frame
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        [0, "Fill"],
                        [1, "Fit + blur"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateSelectedClip((c) => {
                              c.fit = val as 0 | 1;
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            selectedClip.fit === val
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "motion" && selectedClip ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Magic Motion
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["none", "None"],
                        ["zoomin", "Zoom in"],
                        ["zoomout", "Zoom out"],
                        ["panl", "Pan ←"],
                        ["panr", "Pan →"],
                        ["drift", "Drift"],
                        ["pulse", "Beat pulse"],
                        ["shake", "Shake"],
                      ] as [VeoMotion, string][]
                    ).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          updateSelectedClip((c) => {
                            c.motion = m;
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          selectedClip.motion === m
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedClip.motion === "pulse" && (
                  <VeoSlider
                    label="Beat tempo (BPM)"
                    value={engineRef.current.bpm}
                    min={60}
                    max={200}
                    step={1}
                    onChange={(v) => {
                      engineRef.current.bpm = v;
                      drawCanvasFrame();
                      forceSyncUi();
                    }}
                  />
                )}

                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Transition in
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["none", "Cut"],
                        ["fade", "Fade"],
                        ["flash", "Flash"],
                      ] as [VeoTrans, string][]
                    ).map(([tr, label]) => (
                      <button
                        key={tr}
                        type="button"
                        onClick={() =>
                          updateSelectedClip((c) => {
                            c.trans = tr;
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          selectedClip.trans === tr
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applyKeysToAll(["motion", "trans"])}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Apply motion &amp; transition to all clips
                </button>
              </div>
            ) : activeTab === "look" && selectedClip ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Aura Looks
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(VEO_LOOK_FILTERS) as VeoLook[]).map((lk) => (
                      <button
                        key={lk}
                        type="button"
                        onClick={() =>
                          updateSelectedClip((c) => {
                            c.look = lk;
                          })
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                          selectedClip.look === lk
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {lk}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <VeoSlider
                    label="Brightness"
                    value={selectedClip.br}
                    min={50}
                    max={150}
                    step={1}
                    unit="%"
                    onChange={(v) => updateSelectedClip((c) => { c.br = v; })}
                  />
                  <VeoSlider
                    label="Contrast"
                    value={selectedClip.ct}
                    min={50}
                    max={150}
                    step={1}
                    unit="%"
                    onChange={(v) => updateSelectedClip((c) => { c.ct = v; })}
                  />
                  <VeoSlider
                    label="Saturation"
                    value={selectedClip.sa}
                    min={0}
                    max={200}
                    step={1}
                    unit="%"
                    onChange={(v) => updateSelectedClip((c) => { c.sa = v; })}
                  />
                  <VeoSlider
                    label="Blur"
                    value={selectedClip.bl}
                    min={0}
                    max={10}
                    step={0.5}
                    unit="px"
                    onChange={(v) => updateSelectedClip((c) => { c.bl = v; })}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      Film Vignette:
                    </span>
                    {[
                      [0, "Off"],
                      [1, "On"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          engineRef.current.vig = val as 0 | 1;
                          drawCanvasFrame();
                          forceSyncUi();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          engineRef.current.vig === val
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => applyKeysToAll(["look", "br", "ct", "sa", "bl"])}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply look to all
                  </button>
                </div>
              </div>
            ) : activeTab === "text" && selectedClip ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Caption on this clip
                  </label>
                  <input
                    type="text"
                    value={selectedClip.text}
                    onChange={(e) =>
                      updateSelectedClip((c) => {
                        c.text = e.target.value;
                      })
                    }
                    placeholder="Type your caption..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Position
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ["top", "Top"],
                          ["mid", "Middle"],
                          ["bottom", "Bottom"],
                        ] as ["top" | "mid" | "bottom", string][]
                      ).map(([pos, lbl]) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() =>
                            updateSelectedClip((c) => {
                              c.tp = pos;
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            selectedClip.tp === pos
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Text colour
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ["#ffffff", "White"],
                        ["#ffd60a", "Yellow"],
                        ["#64d2ff", "Sky"],
                        ["#ff375f", "Pink"],
                        ["#000000", "Black"],
                      ].map(([hex, lbl]) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            updateSelectedClip((c) => {
                              c.tc = hex;
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            selectedClip.tc === hex
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <VeoSlider
                  label="Text size"
                  value={selectedClip.ts}
                  min={0.03}
                  max={0.14}
                  step={0.005}
                  onChange={(v) => updateSelectedClip((c) => { c.ts = v; })}
                />

                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] flex items-center gap-1">
                    <Sticker size={12} />
                    <span>Emoji Stickers</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VEO_STICKERS.map((stk) => (
                      <button
                        key={stk}
                        type="button"
                        onClick={() =>
                          updateSelectedClip((c) => {
                            c.stk = stk;
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          selectedClip.stk === stk
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {stk === "none" ? "None" : stk}
                      </button>
                    ))}
                  </div>

                  {selectedClip.stk !== "none" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <VeoSlider
                        label="Sticker size"
                        value={selectedClip.ss}
                        min={0.05}
                        max={0.4}
                        step={0.01}
                        onChange={(v) => updateSelectedClip((c) => { c.ss = v; })}
                      />
                      <VeoSlider
                        label="Sticker X"
                        value={selectedClip.sx}
                        min={0.05}
                        max={0.95}
                        step={0.01}
                        onChange={(v) => updateSelectedClip((c) => { c.sx = v; })}
                      />
                      <VeoSlider
                        label="Sticker Y"
                        value={selectedClip.sy}
                        min={0.05}
                        max={0.95}
                        step={0.01}
                        onChange={(v) => updateSelectedClip((c) => { c.sy = v; })}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "logo" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => watermarkInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                  >
                    {engineRef.current.wm.img
                      ? "Change Watermark Image"
                      : "+ Upload Logo / Watermark"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseAppLogoWatermark}
                    className="px-4 py-2.5 rounded-xl bg-[#E2F5ED] text-[#059669] text-xs font-bold cursor-pointer"
                  >
                    Use GAMURA VEO logo as watermark
                  </button>
                  <button
                    type="button"
                    onClick={() => appLogoInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold cursor-pointer"
                  >
                    Set custom app logo
                  </button>
                </div>

                {engineRef.current.wm.img && (
                  <div className="space-y-4 pt-2 border-t border-zinc-100">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        [true, "Show"],
                        [false, "Hide"],
                      ].map(([on, lbl]) => (
                        <button
                          key={String(on)}
                          type="button"
                          onClick={() => {
                            engineRef.current.wm.on = on as boolean;
                            drawCanvasFrame();
                            forceSyncUi();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            engineRef.current.wm.on === on
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}

                      <div className="ml-auto flex gap-1.5">
                        {[
                          ["↖", 0.12, 0.12],
                          ["↗", 0.88, 0.12],
                          ["⊙", 0.5, 0.5],
                          ["↙", 0.12, 0.88],
                          ["↘", 0.88, 0.88],
                        ].map(([sym, x, y]) => (
                          <button
                            key={String(sym)}
                            type="button"
                            onClick={() => {
                              engineRef.current.wm.x = Number(x);
                              engineRef.current.wm.y = Number(y);
                              drawCanvasFrame();
                              forceSyncUi();
                            }}
                            className="w-8 h-8 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200 text-xs font-bold cursor-pointer"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <VeoSlider
                        label="Watermark Size"
                        value={engineRef.current.wm.size}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        onChange={(v) => {
                          engineRef.current.wm.size = v;
                          drawCanvasFrame();
                          forceSyncUi();
                        }}
                      />
                      <VeoSlider
                        label="Opacity"
                        value={engineRef.current.wm.op}
                        min={0.1}
                        max={1}
                        step={0.05}
                        onChange={(v) => {
                          engineRef.current.wm.op = v;
                          drawCanvasFrame();
                          forceSyncUi();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "audio" ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Background Song
                  </div>
                  {engineRef.current.music ? (
                    <div className="p-4 rounded-2xl bg-[#F5F5F7] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1D1D1F] truncate">
                          🎵 {engineRef.current.music.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            engineRef.current.music?.el.pause();
                            engineRef.current.music = null;
                            forceSyncUi();
                          }}
                          className="text-xs font-semibold text-red-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <VeoSlider
                          label="Music volume"
                          value={engineRef.current.mv}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(v) => {
                            engineRef.current.mv = v;
                            forceSyncUi();
                          }}
                        />
                        <VeoSlider
                          label="Start song at"
                          value={engineRef.current.mOff}
                          min={0}
                          max={180}
                          step={1}
                          unit="s"
                          onChange={(v) => {
                            engineRef.current.mOff = v;
                            forceSyncUi();
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => songInputRef.current?.click()}
                      className="w-full py-3 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-bold text-[#1D1D1F] cursor-pointer"
                    >
                      + Add a song
                    </button>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Voiceover
                  </div>
                  <button
                    type="button"
                    onClick={handleRecordVoice}
                    className={`w-full py-3 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      isRecordingVoice
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-zinc-900 hover:bg-zinc-800"
                    }`}
                  >
                    {isRecordingVoice ? (
                      <>
                        <MicOff size={15} />
                        <span>Stop recording voiceover</span>
                      </>
                    ) : (
                      <>
                        <Mic size={15} />
                        <span>Record voice from playhead</span>
                      </>
                    )}
                  </button>

                  {engineRef.current.voice && (
                    <div className="p-4 rounded-2xl bg-[#F5F5F7] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          🎙 Voiceover ready (starts at{" "}
                          {formatVeoTime(engineRef.current.vStart)})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            engineRef.current.voice?.el.pause();
                            engineRef.current.voice = null;
                            forceSyncUi();
                          }}
                          className="text-xs font-semibold text-red-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <VeoSlider
                        label="Voice volume"
                        value={engineRef.current.vv}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => {
                          engineRef.current.vv = v;
                          forceSyncUi();
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "magic" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAutoEdit}
                    className="w-full py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wand2 size={15} />
                    <span>Auto-edit my clips</span>
                  </button>
                  <p className="text-xs text-[#6E6E73]">
                    Applies alternating Ken Burns motion, smooth fades, and a
                    cinematic Aura look across every clip.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Title Card Generator
                  </div>
                  <input
                    type="text"
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    placeholder="Title card text..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {VEO_TITLE_GRADIENTS.map(([name], idx) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCardGradIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          cardGradIdx === idx
                            ? "bg-zinc-900 text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTitleCard}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
                  >
                    + Add Title Card to Timeline
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSnapshot}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer"
                    >
                      📷 Save snapshot
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        engineRef.current.t = 0;
                        setPlayheadUi(0);
                        resyncMedia();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold cursor-pointer"
                    >
                      ⏮ To Start
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#6E6E73]">
                      Original Audio:
                    </span>
                    {[
                      [0, "Keep"],
                      [1, "Mute all"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          engineRef.current.mute = val as 0 | 1;
                          syncVideoElements();
                          forceSyncUi();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          engineRef.current.mute === val
                            ? "bg-[#059669] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Export Tab */
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Canvas Aspect
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ["16:9", "16:9 Wide"],
                          ["9:16", "9:16 Reels"],
                          ["1:1", "1:1 Square"],
                        ] as [VeoAspectRatio, string][]
                      ).map(([ratio, lbl]) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            engineRef.current.ar = ratio;
                            drawCanvasFrame();
                            forceSyncUi();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            engineRef.current.ar === ratio
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Quality
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        [1, "HD 720p"],
                        [1.5, "Full HD 1080p"],
                      ].map(([q, lbl]) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            engineRef.current.q = q as 1 | 1.5;
                            drawCanvasFrame();
                            forceSyncUi();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            engineRef.current.q === q
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Cinema Bars
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        [0, "Off"],
                        [1, "On"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            engineRef.current.bars = val as 0 | 1;
                            drawCanvasFrame();
                            forceSyncUi();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            engineRef.current.bars === val
                              ? "bg-[#059669] text-white"
                              : "bg-[#F5F5F7] text-[#1D1D1F]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#6E6E73]">
                  {engineRef.current.clips.length} clips ·{" "}
                  {formatVeoTime(totalSec)} · {engineRef.current.ar} · music{" "}
                  {engineRef.current.music ? "on" : "off"} · voice{" "}
                  {engineRef.current.voice ? "on" : "off"}
                </div>

                <button
                  type="button"
                  onClick={handleExportVideo}
                  className="w-full min-h-[48px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                  <span>Render &amp; Download Video</span>
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* SCREEN 3: UPLOADED CONTENT FILES VIEWER */}
      {screen === "files" && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-[24px] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">
                  GAMURA VEO Uploaded Files
                </h2>
                <span className="text-xs font-semibold text-[#059669]">
                  {VEO_UPLOADED_ASSETS.length} files
                </span>
              </div>
              <p className="text-xs text-[#6E6E73]">
                Preview, run, or download every uploaded GAMURA VEO file below.
              </p>

              <div className="divide-y divide-zinc-100">
                {VEO_UPLOADED_ASSETS.map((asset) => {
                  const isActive = previewAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setPreviewAsset(asset)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewAsset(asset);
                        }
                      }}
                      className={`py-3 px-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${
                        isActive ? "bg-[#E2F5ED]/60" : "hover:bg-[#F5F5F7]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                        {asset.kind === "Logo" ? (
                          <img
                            src={asset.path}
                            alt={asset.name}
                            className="w-full h-full object-contain scale-110"
                          />
                        ) : asset.kind === "Manual" ? (
                          <BookOpen size={17} className="text-[#059669]" />
                        ) : (
                          <Film size={17} className="text-[#0284c7]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1D1D1F] truncate">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-[#6E6E73] truncate">
                          {asset.sizeLabel}
                        </div>
                      </div>
                      <a
                        href={asset.path}
                        download={asset.name}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-white border border-zinc-200/80 hover:bg-zinc-100 flex items-center justify-center text-[#1D1D1F] shrink-0"
                        title={`Download ${asset.name}`}
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-[24px] p-5 shadow-xs flex flex-col min-h-[420px]">
              {previewAsset ? (
                <>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1D1D1F] truncate">
                        {previewAsset.name}
                      </h3>
                      <p className="text-xs text-[#6E6E73] truncate">
                        {previewAsset.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={previewAsset.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-[#059669] text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>Open Tab</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <div className="flex-1 pt-4 flex items-center justify-center">
                    {previewAsset.kind === "Logo" ? (
                      <div className="w-64 h-64 rounded-3xl bg-[#F5F5F7] border border-zinc-200/80 p-6 flex items-center justify-center">
                        <img
                          src={previewAsset.path}
                          alt={previewAsset.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : previewAsset.kind === "Manual" ? (
                      <pre className="w-full h-[360px] overflow-auto rounded-2xl bg-[#F5F5F7] p-4 text-xs font-mono text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
                        {manualText ||
                          VEO_MANUAL_SECTIONS.map(
                            (s) => `${s.title}\n${s.body}`,
                          ).join("\n\n")}
                      </pre>
                    ) : (
                      <iframe
                        title={previewAsset.name}
                        src={previewAsset.path}
                        className="w-full h-[400px] rounded-2xl border border-zinc-200 bg-white"
                      />
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 4: 10-CHAPTER MANUAL */}
      {screen === "manual" && (
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
          <div className="bg-white border border-zinc-200/80 rounded-[26px] p-6 shadow-xs space-y-1">
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              GAMURA VEO Manual
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73]">
              Everything you need to create, edit, brand, and export videos.
            </p>
          </div>

          <div className="space-y-2.5">
            {VEO_MANUAL_SECTIONS.map((sec, idx) => {
              const isOpen = openManualIdx === idx;
              return (
                <div
                  key={sec.title}
                  className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenManualIdx(isOpen ? -1 : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#1D1D1F]">
                      {sec.title}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#6E6E73] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-[#6E6E73] leading-relaxed border-t border-zinc-100 pt-3">
                      {sec.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* Real-time Export Rendering Overlay */}
      {exportProgress !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white">
          <div className="text-lg font-bold tracking-tight">
            Rendering your video…
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-emerald-400">
            {exportProgress}%
          </div>
          <button
            type="button"
            onClick={() => {
              engineRef.current.recCancelled = true;
              if (
                engineRef.current.rec &&
                engineRef.current.rec.state === "recording"
              ) {
                engineRef.current.rec.stop();
              }
            }}
            className="mt-2 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Square size={12} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-lg flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

function VeoSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#1D1D1F]">{label}</span>
        <span className="font-semibold text-[#059669] tabular-nums">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#059669] cursor-pointer"
      />
    </div>
  );
}
