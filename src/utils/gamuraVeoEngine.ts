export type VeoClipKind = "v" | "i";
export type VeoMotion =
  | "none"
  | "zoomin"
  | "zoomout"
  | "panl"
  | "panr"
  | "drift"
  | "pulse"
  | "shake";
export type VeoLook =
  | "none"
  | "cinema"
  | "vivid"
  | "noir"
  | "warm"
  | "cool"
  | "dream"
  | "retro"
  | "ocean"
  | "fade"
  | "pop";
export type VeoTrans = "none" | "fade" | "flash";
export type VeoAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";
export type VeoExportFormat =
  | "mp4"
  | "webm"
  | "mov"
  | "mkv"
  | "gif"
  | "wav"
  | "png"
  | "jpg";

export interface VeoExportFormatMeta {
  id: VeoExportFormat;
  label: string;
  ext: string;
  kind: "video" | "animation" | "audio" | "image";
  summary: string;
}

export const VEO_EXPORT_FORMATS: VeoExportFormatMeta[] = [
  { id: "mp4", label: "MP4 Video", ext: "mp4", kind: "video", summary: "Universal video" },
  { id: "webm", label: "WebM Video", ext: "webm", kind: "video", summary: "Crisp web video" },
  { id: "mov", label: "MOV Video", ext: "mov", kind: "video", summary: "QuickTime file" },
  { id: "mkv", label: "MKV Video", ext: "mkv", kind: "video", summary: "Matroska video" },
  { id: "gif", label: "Animated GIF", ext: "gif", kind: "animation", summary: "Looping clip" },
  { id: "wav", label: "WAV Audio", ext: "wav", kind: "audio", summary: "Extracted audio" },
  { id: "png", label: "PNG Frame", ext: "png", kind: "image", summary: "Lossless frame" },
  { id: "jpg", label: "JPEG Frame", ext: "jpg", kind: "image", summary: "Compact still" },
];

export interface VeoClip {
  id: string;
  k: VeoClipKind;
  el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
  url: string;
  name: string;
  max: number;
  start: number;
  end: number;
  speed: number;
  zoom: number;
  px: number;
  py: number;
  motion: VeoMotion;
  look: VeoLook;
  br: number;
  ct: number;
  sa: number;
  bl: number;
  text: string;
  tp: "top" | "mid" | "bottom";
  ts: number;
  trans: VeoTrans;
  vol: number;
  flip: 0 | 1;
  rot: 0 | 90 | 180 | 270;
  fit: 0 | 1;
  tc: string;
  stk: string;
  sx: number;
  sy: number;
  ss: number;
}

export interface VeoAudioTrack {
  el: HTMLAudioElement;
  url: string;
  name: string;
  done: boolean;
}

export interface VeoWatermark {
  img: HTMLImageElement | null;
  srcUrl: string;
  on: boolean;
  x: number;
  y: number;
  size: number;
  op: number;
}

export const VEO_ASPECT_DIMENSIONS: Record<VeoAspectRatio, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [900, 900],
  "4:5": [720, 900],
};

export const VEO_LOOK_FILTERS: Record<VeoLook, string> = {
  none: "",
  cinema: "contrast(120%) saturate(85%) sepia(.2)",
  vivid: "saturate(155%) contrast(110%)",
  noir: "grayscale(1) contrast(130%)",
  warm: "sepia(.35) saturate(120%)",
  cool: "hue-rotate(-20deg) saturate(110%)",
  dream: "blur(.6px) brightness(110%) saturate(120%)",
  retro: "sepia(.6) contrast(90%) hue-rotate(-10deg)",
  ocean: "hue-rotate(-30deg) saturate(130%) brightness(105%)",
  fade: "contrast(85%) brightness(110%) saturate(80%)",
  pop: "contrast(115%) saturate(140%) brightness(105%)",
};

export const VEO_TITLE_GRADIENTS: [string, string, string][] = [
  ["Ocean", "#0a84ff", "#5e5ce6"],
  ["Indigo", "#5e5ce6", "#bf5af2"],
  ["Midnight", "#050a1f", "#0a2a6b"],
  ["Sunrise", "#ff9f0a", "#ff375f"],
];

export const VEO_STICKERS = [
  "none",
  "😀",
  "🔥",
  "❤️",
  "⭐",
  "🎉",
  "🚀",
  "👑",
  "😎",
  "✨",
];

export const VEO_MANUAL_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1 · Quick start",
    body: "Tap a tool on the Studio home screen, or Start a new video. Add videos or images, tap a clip on the timeline to select it, edit it with the tabs below, then open Export and tap Render & download.",
  },
  {
    title: "2 · Clips & merge",
    body: "Clips play in timeline order, so adding several videos merges them. Use Move to reorder, Split to cut at the playhead, Duplicate to repeat, Delete to remove, and Undo to step back.",
  },
  {
    title: "3 · Trim, crop, rotate",
    body: "Edit tab: Trim start and end cut the clip, Speed changes pace, Crop zoom with Pan X/Y crops the frame, Rotate turns it, and Fit + blur keeps the whole video centered over a blurred backdrop.",
  },
  {
    title: "4 · Photo to video & motion",
    body: "Images become videos automatically. Set Duration in Edit and pick a move in Motion: zoom, pan, drift, shake, or Beat pulse (matched to your song BPM). Fade or Flash sets the transition in.",
  },
  {
    title: "5 · Looks, text & stickers",
    body: "Looks: pick an Aura look, then adjust brightness, contrast, saturation, blur, and film vignette. Text: type a caption, choose position, size, and colour, and place an emoji sticker.",
  },
  {
    title: "6 · Logo & app logo",
    body: "Logo tab: upload a custom watermark, set size, opacity, and corner. Your GAMURA VEO logo is pre-loaded so you can tap Use app logo as watermark right away or upload a new brand emblem.",
  },
  {
    title: "7 · Song & voiceover",
    body: "Audio tab: add a song, set its volume, start offset, and fade-out. Move the playhead where you want to speak, press Record voice from playhead, talk, then press Stop.",
  },
  {
    title: "8 · Magic tools",
    body: "Auto-edit applies alternating motion, fades, and a cinematic Aura look in one tap. Title card generates a gradient intro slide. Save snapshot downloads the current frame as PNG.",
  },
  {
    title: "9 · Export",
    body: "Choose 16:9 Wide, 9:16 Reels, or 1:1 Square, then HD 720p or Full HD 1080p. Rendering runs smoothly in real time in your browser and downloads cleanly as MP4 or WebM.",
  },
  {
    title: "10 · Shortcuts & fixes",
    body: "Desktop shortcuts: Space toggles Play/Pause, Left/Right arrows jump 1 second, S splits the active clip at the playhead, and Delete removes the selected clip.",
  },
];

export interface VeoUploadedKitAsset {
  id: string;
  name: string;
  kind: "HTML Studio" | "Manual" | "App Launcher" | "Logo";
  sizeLabel: string;
  path: string;
  description: string;
}

export const VEO_UPLOADED_ASSETS: VeoUploadedKitAsset[] = [
  {
    id: "logo-png",
    name: "GAMURA VEO Logo.png",
    kind: "Logo",
    sizeLabel: "PNG · Brand Emblem",
    path: "/assets/aistudio/IMG_20261115_083802_9866b1da.png",
    description: "Official uploaded GAMURA VEO multi-color G-V emblem.",
  },
  {
    id: "studio-html",
    name: "GAMURA VEO Studio.html",
    kind: "HTML Studio",
    sizeLabel: "HTML · Standalone App",
    path: "/assets/aistudio/GAMURA_VEO__1__311e9aac.html",
    description: "Complete single-file GAMURA VEO video editor build.",
  },
  {
    id: "manual-md",
    name: "GAMURA VEO Manual.md",
    kind: "Manual",
    sizeLabel: "Markdown · 10 Chapters",
    path: "/assets/aistudio/GAMURA_VEO__1__05084efa.md",
    description: "Official user guide covering timelines, FX, audio & export.",
  },
  {
    id: "launcher-html",
    name: "gamura-veo-app.html",
    kind: "App Launcher",
    sizeLabel: "HTML · Web Launcher",
    path: "/assets/aistudio/gamura-veo-app_bae24800.html",
    description: "Standalone installable mobile/desktop launch card.",
  },
];

export function formatVeoTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = (safe % 60).toFixed(1).padStart(4, "0");
  return `${mins}:${secs}`;
}

export function clipDuration(clip: VeoClip): number {
  const raw = (clip.end - clip.start) / Math.max(0.1, clip.speed);
  return Math.max(0.2, raw);
}

export function totalDuration(clips: VeoClip[]): number {
  return clips.reduce((sum, c) => sum + clipDuration(c), 0);
}

export function createDefaultClipProps(
  partial: Pick<VeoClip, "id" | "k" | "el" | "url" | "name" | "max" | "start" | "end">,
): VeoClip {
  return {
    ...partial,
    speed: 1,
    zoom: 1,
    px: 0,
    py: 0,
    motion: partial.k === "i" ? "zoomin" : "none",
    look: "none",
    br: 100,
    ct: 100,
    sa: 100,
    bl: 0,
    text: "",
    tp: "bottom",
    ts: 0.06,
    trans: "fade",
    vol: 1,
    flip: 0,
    rot: 0,
    fit: 0,
    tc: "#ffffff",
    stk: "none",
    sx: 0.5,
    sy: 0.35,
    ss: 0.14,
  };
}

export function computeMotionOffset(
  clip: VeoClip,
  progress: number,
  globalTime: number,
  bpm: number,
): [number, number, number] {
  switch (clip.motion) {
    case "zoomin":
      return [1 + 0.25 * progress, 0, 0];
    case "zoomout":
      return [1.25 - 0.25 * progress, 0, 0];
    case "panl":
      return [1.2, (0.5 - progress) * 0.12, 0];
    case "panr":
      return [1.2, (progress - 0.5) * 0.12, 0];
    case "drift":
      return [
        1.15,
        Math.sin(globalTime * 0.8) * 0.04,
        Math.cos(globalTime * 0.6) * 0.03,
      ];
    case "pulse":
      return [
        1 +
          0.07 *
            Math.pow(
              0.5 + 0.5 * Math.cos((globalTime * Math.PI * 2 * bpm) / 60),
              6,
            ),
        0,
        0,
      ];
    case "shake":
      return [1.06, (Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.015];
    default:
      return [1, 0, 0];
  }
}

export function pickSupportedRecorderMime(): string {
  return pickRecorderMimeForFormat("mp4");
}

export function pickRecorderMimeForFormat(format: VeoExportFormat): string {
  if (typeof MediaRecorder === "undefined") return "";
  const map: Record<string, string[]> = {
    mp4: [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ],
    mov: [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ],
    mkv: [
      "video/x-matroska;codecs=avc1",
      "video/x-matroska",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ],
    webm: [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ],
  };
  const candidates = map[format] || map.mp4;
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
}

// Pure-TypeScript Animated GIF89a Encoder (6-6-6 palette + LZW)
export function encodeGifFromFrames(
  frames: ImageData[],
  width: number,
  height: number,
  delayCs = 10,
): Blob {
  const bytes: number[] = [];
  const pushStr = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 0xff);
  };
  const pushU16 = (n: number) => {
    bytes.push(n & 0xff, (n >> 8) & 0xff);
  };

  // Global Color Table: 216 web-safe 6x6x6 colors + 40 grayscale shades = 256 entries
  const palette: number[] = [];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push(Math.round((r * 255) / 5));
        palette.push(Math.round((g * 255) / 5));
        palette.push(Math.round((b * 255) / 5));
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i * 255) / 39);
    palette.push(v, v, v);
  }

  // Header & Logical Screen Descriptor
  pushStr("GIF89a");
  pushU16(width);
  pushU16(height);
  bytes.push(0xf7, 0x00, 0x00); // GCT flag=1, 8-bit color, sort=0, size=7 (256 colors)
  for (let i = 0; i < palette.length; i++) bytes.push(palette[i]);

  // Netscape 2.0 looping application extension
  bytes.push(0x21, 0xff, 0x0b);
  pushStr("NETSCAPE2.0");
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const mapPixelToIndex = (r: number, g: number, b: number) => {
    if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8) {
      const lum = Math.round(((r + g + b) / 3 / 255) * 39);
      return 216 + Math.min(39, Math.max(0, lum));
    }
    const ri = Math.round((r / 255) * 5);
    const gi = Math.round((g / 255) * 5);
    const bi = Math.round((b / 255) * 5);
    return ri * 36 + gi * 6 + bi;
  };

  const writeLzwImage = (indexed: Uint8Array) => {
    const minCodeSize = 8;
    bytes.push(minCodeSize);
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const dict = new Map<string, number>();
    const resetDict = () => {
      dict.clear();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    };

    const subBlock: number[] = [];
    let bitBuf = 0;
    let bitCount = 0;
    const flushSubBlock = () => {
      if (subBlock.length > 0) {
        bytes.push(subBlock.length);
        for (let i = 0; i < subBlock.length; i++) bytes.push(subBlock[i]);
        subBlock.length = 0;
      }
    };
    const emitCode = (code: number) => {
      bitBuf |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        subBlock.push(bitBuf & 0xff);
        if (subBlock.length === 255) flushSubBlock();
        bitBuf >>= 8;
        bitCount -= 8;
      }
    };

    emitCode(clearCode);
    let prefix = indexed[0] ?? 0;
    for (let i = 1; i < indexed.length; i++) {
      const k = indexed[i];
      const key = `${prefix},${k}`;
      const existing = dict.get(key);
      if (existing !== undefined) {
        prefix = existing;
      } else {
        emitCode(prefix);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > 1 << codeSize && codeSize < 12) {
            codeSize++;
          }
        } else {
          emitCode(clearCode);
          resetDict();
        }
        prefix = k;
      }
    }
    emitCode(prefix);
    emitCode(eoiCode);
    if (bitCount > 0) {
      subBlock.push(bitBuf & 0xff);
    }
    flushSubBlock();
    bytes.push(0x00); // Block terminator
  };

  for (let f = 0; f < frames.length; f++) {
    const img = frames[f];
    const data = img.data;
    const indexed = new Uint8Array(width * height);
    for (let p = 0, px = 0; p < indexed.length; p++, px += 4) {
      indexed[p] = mapPixelToIndex(data[px], data[px + 1], data[px + 2]);
    }
    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04, 0x04);
    pushU16(delayCs);
    bytes.push(0x00, 0x00);

    // Image Descriptor
    bytes.push(0x2c);
    pushU16(0);
    pushU16(0);
    pushU16(width);
    pushU16(height);
    bytes.push(0x00);

    writeLzwImage(indexed);
  }

  bytes.push(0x3b); // GIF Trailer
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

export function encodePcmWav(
  channels: Float32Array[],
  sampleRate: number,
): Blob {
  const numChannels = Math.max(1, channels.length);
  const frameCount = channels[0]?.length || 0;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLen = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataByteLen);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataByteLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataByteLen, true);

  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i] || 0));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}
