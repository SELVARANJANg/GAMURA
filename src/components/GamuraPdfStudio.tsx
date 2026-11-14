import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  FilePlus2,
  Pencil,
  Layers,
  Minimize2,
  Palette,
  Upload,
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  X,
  Download,
  Undo2,
  Trash2,
  FlipHorizontal2,
  FileCheck2,
  Sparkles,
  Loader2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const G_PDF_LOGO_SRC = "/assets/aistudio/1794644548783_b0cc329b.png";
export const G_PDF_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1uYVL1_8XGFCk_V7e1b4lxCy9C1CzF3su";

type StudioView = "home" | "create" | "edit" | "merge" | "comp" | "ultra";
type MergeTab = "merge" | "split" | "img";
type CompressLevel = "low" | "med" | "high";
type UltraTool = "pen" | "eraser" | "text";

interface EditablePage {
  idx: number;
  rot: number;
  thumb: string;
}

interface PdfToImgItem {
  previewUrl: string;
  blob: Blob;
  pageNumber: number;
}

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

const formatBytes = (b: number) =>
  b > 1048576
    ? `${(b / 1048576).toFixed(2)} MB`
    : `${(b / 1024).toFixed(1)} KB`;

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

const isPdfFile = (f: File) =>
  /pdf/i.test(f.type) || /\.pdf$/i.test(f.name);

async function fileToImageBytes(
  f: File,
): Promise<{ bytes: ArrayBuffer; kind: "png" | "jpg" }> {
  if (f.type === "image/png" || f.type === "image/jpeg") {
    return {
      bytes: await f.arrayBuffer(),
      kind: f.type === "image/png" ? "png" : "jpg",
    };
  }
  const bm = await createImageBitmap(f);
  const c = makeCanvas(bm.width, bm.height);
  c.getContext("2d")!.drawImage(bm, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (res) => (res ? resolve(res) : reject(new Error("Image encode failed"))),
      "image/png",
    ),
  );
  return { bytes: await blob.arrayBuffer(), kind: "png" };
}

async function openPdfDoc(ab: ArrayBuffer) {
  return pdfjsLib.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
}

async function renderPdfPageCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
) {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = makeCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

function parsePageRanges(spec: string, totalPages: number): number[] {
  const indices: number[] = [];
  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error("Use a page range format like 1-3,5");
    const a = Number(match[1]);
    const b = Number(match[2] || match[1]);
    if (a < 1 || b > totalPages || a > b) {
      throw new Error(`Pages must be between 1 and ${totalPages}`);
    }
    for (let i = a; i <= b; i++) indices.push(i - 1);
  }
  if (!indices.length) {
    throw new Error("Enter at least one page number or range");
  }
  return indices;
}

function downloadFileBlob(
  filename: string,
  payload: Uint8Array | Blob,
  mime = "application/pdf",
) {
  const blob =
    payload instanceof Blob
      ? payload
      : new Blob([new Uint8Array(payload)], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  title: string;
  subtitle: string;
  onFiles: (files: File[]) => void;
}

function StudioDropZone({
  accept,
  multiple = false,
  title,
  subtitle,
  onFiles,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length) onFiles(files);
      }}
      className={`rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${
        dragging
          ? "border-[#059669] bg-emerald-50/70"
          : "border-zinc-200 hover:border-zinc-300 bg-[#F5F5F7]/70 hover:bg-[#F5F5F7]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <div className="mx-auto mb-2.5 w-10 h-10 rounded-xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-center text-[#1D1D1F]">
        <Upload size={18} />
      </div>
      <div className="text-sm font-semibold text-[#1D1D1F]">{title}</div>
      <div className="text-xs text-[#6E6E73] mt-0.5">{subtitle}</div>
    </div>
  );
}

const STUDIO_TOOLS = [
  {
    id: "create" as const,
    name: "PDF Creator",
    desc: "Build PDFs from text and images",
    icon: FilePlus2,
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    id: "edit" as const,
    name: "PDF Editor",
    desc: "Reorder, rotate, delete, watermark, number",
    icon: Pencil,
    gradient: "from-amber-400 to-orange-600",
  },
  {
    id: "merge" as const,
    name: "Merge & Convert",
    desc: "Merge, split, or turn pages into images",
    icon: Layers,
    gradient: "from-sky-500 to-indigo-600",
  },
  {
    id: "comp" as const,
    name: "Compress",
    desc: "Shrink file size with a before and after",
    icon: Minimize2,
    gradient: "from-purple-500 to-rose-500",
  },
  {
    id: "ultra" as const,
    name: "Ultra Modifier",
    desc: "Edit any image on a canvas, export to PDF",
    icon: Palette,
    gradient: "from-teal-400 to-emerald-600",
  },
];

export default function GamuraPdfStudio({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [view, setView] = useState<StudioView>("home");
  const [logoFallback, setLogoFallback] = useState(false);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showStatus = useCallback((msg: string) => {
    setStatusToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setStatusToast(null), 3000);
  }, []);

  const runWork = useCallback(
    async (msg: string, task: () => Promise<void>) => {
      setBusyMsg(msg);
      try {
        await task();
      } catch (err: any) {
        showStatus(err?.message || "Something went wrong");
      } finally {
        setBusyMsg(null);
      }
    },
    [showStatus],
  );

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "G PDF · Gamura PDF Studio";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // ---- 1. PDF Creator state ----
  const [cTitle, setCTitle] = useState("");
  const [cText, setCText] = useState("");
  const [cSize, setCSize] = useState<"A4" | "Letter">("A4");
  const [cFontSize, setCFontSize] = useState<number>(12);
  const [cImages, setCImages] = useState<File[]>([]);

  const handleCreatePdf = () =>
    runWork("Creating PDF…", async () => {
      const trimmedTitle = cTitle.trim();
      if (!cText.trim() && !trimmedTitle && !cImages.length) {
        throw new Error("Add some text or images first");
      }
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pageSize: [number, number] =
        cSize === "A4" ? [595.28, 841.89] : [612, 792];
      const margin = 56;
      const lineHeight = cFontSize * 1.5;
      const maxWidth = pageSize[0] - margin * 2;

      if (trimmedTitle || cText.trim()) {
        let pg = pdfDoc.addPage(pageSize);
        let y = pageSize[1] - margin;
        const drawLine = (textLine: string) => {
          if (y < margin + lineHeight) {
            pg = pdfDoc.addPage(pageSize);
            y = pageSize[1] - margin;
          }
          pg.drawText(textLine, {
            x: margin,
            y: y - cFontSize,
            size: cFontSize,
            font,
          });
          y -= lineHeight;
        };

        try {
          if (trimmedTitle) {
            pg.drawText(trimmedTitle, {
              x: margin,
              y: y - 24,
              size: 24,
              font: bold,
            });
            y -= 46;
          }
          for (const para of cText.split("\n")) {
            let cur = "";
            for (const word of para.split(" ")) {
              const candidate = cur ? `${cur} ${word}` : word;
              if (font.widthOfTextAtSize(candidate, cFontSize) > maxWidth && cur) {
                drawLine(cur);
                cur = word;
              } else {
                cur = candidate;
              }
            }
            drawLine(cur);
          }
        } catch {
          throw new Error(
            "This text contains characters unsupported by standard Latin font. Add non-Latin text as images instead.",
          );
        }
      }

      for (const file of cImages) {
        const { bytes, kind } = await fileToImageBytes(file);
        const im =
          kind === "png"
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes);
        const pg = pdfDoc.addPage(pageSize);
        const k = Math.min(
          (pageSize[0] - 40) / im.width,
          (pageSize[1] - 40) / im.height,
        );
        const w = im.width * k;
        const h = im.height * k;
        pg.drawImage(im, {
          x: (pageSize[0] - w) / 2,
          y: (pageSize[1] - h) / 2,
          width: w,
          height: h,
        });
      }

      const out = await pdfDoc.save();
      downloadFileBlob("gamura-document.pdf", out, "application/pdf");
      showStatus("Saved gamura-document.pdf ✓");
    });

  // ---- 2. PDF Editor state ----
  const [eBytes, setEBytes] = useState<ArrayBuffer | null>(null);
  const [eFileName, setEFileName] = useState("");
  const [ePages, setEPages] = useState<EditablePage[]>([]);
  const [eWatermark, setEWatermark] = useState("");
  const [eNumberPages, setENumberPages] = useState(false);

  const handleLoadEditPdf = (files: File[]) => {
    const file = files.find(isPdfFile);
    if (!file) return;
    runWork("Loading PDF pages…", async () => {
      const ab = await file.arrayBuffer();
      const doc = await openPdfDoc(ab);
      const loaded: EditablePage[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        setBusyMsg(`Rendering thumbnail ${i + 1} of ${doc.numPages}…`);
        const canvas = await renderPdfPageCanvas(doc, i + 1, 0.38);
        loaded.push({
          idx: i,
          rot: 0,
          thumb: canvas.toDataURL("image/jpeg", 0.72),
        });
      }
      setEBytes(ab);
      setEFileName(file.name);
      setEPages(loaded);
    });
  };

  const handleExportEditedPdf = () =>
    runWork("Exporting edited PDF…", async () => {
      if (!eBytes || !ePages.length) return;
      const src = await PDFDocument.load(eBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.HelveticaBold);
      const wm = eWatermark.trim();
      const copied = await out.copyPages(
        src,
        ePages.map((p) => p.idx),
      );

      try {
        copied.forEach((pg, k) => {
          pg.setRotation(
            degrees((pg.getRotation().angle + ePages[k].rot) % 360),
          );
          out.addPage(pg);
          const { width: w, height: h } = pg.getSize();
          if (wm) {
            const s = Math.min(72, (w * 0.9) / Math.max(1, wm.length * 0.6));
            const tw = font.widthOfTextAtSize(wm, s);
            pg.drawText(wm, {
              x: w / 2 - tw * 0.35,
              y: h / 2 - tw * 0.35,
              size: s,
              font,
              color: rgb(0.5, 0.5, 0.5),
              opacity: 0.22,
              rotate: degrees(45),
            });
          }
          if (eNumberPages) {
            pg.drawText(String(k + 1), {
              x: w / 2 - 4,
              y: 20,
              size: 10,
              font,
              color: rgb(0.3, 0.3, 0.3),
            });
          }
        });
      } catch {
        throw new Error("Watermark contains unsupported characters");
      }

      const bytes = await out.save();
      downloadFileBlob("gamura-edited.pdf", bytes, "application/pdf");
      showStatus("Saved gamura-edited.pdf ✓");
    });

  // ---- 3. Merge & Convert state ----
  const [mTab, setMTab] = useState<MergeTab>("merge");
  const [mFiles, setMFiles] = useState<File[]>([]);
  const [sBytes, setSBytes] = useState<ArrayBuffer | null>(null);
  const [sInfo, setSInfo] = useState("to extract pages from");
  const [sPageCount, setSPageCount] = useState(0);
  const [sRange, setSRange] = useState("");
  const [imgItems, setImgItems] = useState<PdfToImgItem[]>([]);

  const handleMergePdfs = () =>
    runWork("Merging PDFs…", async () => {
      const out = await PDFDocument.create();
      for (const file of mFiles) {
        const src = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      downloadFileBlob("gamura-merged.pdf", bytes, "application/pdf");
      showStatus("Saved gamura-merged.pdf ✓");
    });

  const handleLoadSplitPdf = (files: File[]) => {
    const file = files.find(isPdfFile);
    if (!file) return;
    runWork("Reading PDF…", async () => {
      const ab = await file.arrayBuffer();
      const count = (
        await PDFDocument.load(ab, { ignoreEncryption: true })
      ).getPageCount();
      setSBytes(ab);
      setSPageCount(count);
      setSInfo(`${file.name} · ${count} pages`);
    });
  };

  const handleExtractPages = () =>
    runWork("Extracting pages…", async () => {
      if (!sBytes) return;
      const idx = parsePageRanges(sRange, sPageCount);
      const src = await PDFDocument.load(sBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, idx);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadFileBlob("gamura-extract.pdf", bytes, "application/pdf");
      showStatus("Saved gamura-extract.pdf ✓");
    });

  const handleLoadPdfToImages = (files: File[]) => {
    const file = files.find(isPdfFile);
    if (!file) return;
    runWork("Rendering pages to PNG…", async () => {
      const doc = await openPdfDoc(await file.arrayBuffer());
      const items: PdfToImgItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setBusyMsg(`Rendering page ${i} of ${doc.numPages}…`);
        const canvas = await renderPdfPageCanvas(doc, i, 2);
        const previewUrl = canvas.toDataURL("image/jpeg", 0.65);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
            "image/png",
          ),
        );
        items.push({ previewUrl, blob, pageNumber: i });
      }
      setImgItems(items);
    });
  };

  // ---- 4. Compress state ----
  const [kBytes, setKBytes] = useState<ArrayBuffer | null>(null);
  const [kName, setKName] = useState("");
  const [kLevel, setKLevel] = useState<CompressLevel>("med");
  const [kResult, setKResult] = useState<{
    before: number;
    after: number;
    pct: number;
    bytes: Uint8Array;
  } | null>(null);

  const handleLoadCompressPdf = async (files: File[]) => {
    const file = files.find(isPdfFile);
    if (!file) return;
    const ab = await file.arrayBuffer();
    setKBytes(ab);
    setKName(file.name);
    setKResult(null);
  };

  const handleCompressPdf = () =>
    runWork("Compressing PDF…", async () => {
      if (!kBytes) return;
      const presets: Record<CompressLevel, [number, number]> = {
        low: [0.9, 0.5],
        med: [1.3, 0.65],
        high: [1.9, 0.82],
      };
      const [scale, quality] = presets[kLevel];
      const doc = await openPdfDoc(kBytes);
      const out = await PDFDocument.create();

      for (let i = 1; i <= doc.numPages; i++) {
        setBusyMsg(`Compressing page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        const canvas = await renderPdfPageCanvas(doc, i, scale);
        const jpgBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
            "image/jpeg",
            quality,
          ),
        );
        const im = await out.embedJpg(await jpgBlob.arrayBuffer());
        const newPg = out.addPage([vp.width, vp.height]);
        newPg.drawImage(im, {
          x: 0,
          y: 0,
          width: vp.width,
          height: vp.height,
        });
      }

      const compressed = await out.save();
      const before = kBytes.byteLength;
      const after = compressed.byteLength;
      const pct = Math.round((1 - after / before) * 100);
      setKResult({ before, after, pct, bytes: compressed });
    });

  // ---- 5. Ultra Modifier (Canvas Image Studio) ----
  const uCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uSrcRef = useRef<HTMLCanvasElement | null>(null);
  const uInkRef = useRef<HTMLCanvasElement | null>(null);
  const uFilteredRef = useRef<HTMLCanvasElement | null>(null);
  const uHistoryRef = useRef<HTMLCanvasElement[]>([]);
  const uDrawingRef = useRef(false);
  const uLastPtRef = useRef<[number, number]>([0, 0]);

  const [uLoaded, setULoaded] = useState(false);
  const [uTool, setUTool] = useState<UltraTool>("pen");
  const [uColor, setUColor] = useState("#10b981");
  const [uSize, setUSize] = useState(6);
  const [uStampText, setUStampText] = useState("");
  const [uBrightness, setUBrightness] = useState(100);
  const [uContrast, setUContrast] = useState(100);
  const [uSaturation, setUSaturation] = useState(100);
  const [uGrayscale, setUGrayscale] = useState(false);
  const [uSepia, setUSepia] = useState(false);

  const compositeUltra = useCallback(() => {
    const cv = uCanvasRef.current;
    const src = uSrcRef.current;
    const fb = uFilteredRef.current;
    const ink = uInkRef.current;
    if (!cv || !src || !fb || !ink) return;
    if (cv.width !== src.width || cv.height !== src.height) {
      cv.width = src.width;
      cv.height = src.height;
    }
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(fb, 0, 0);
    ctx.drawImage(ink, 0, 0);
  }, []);

  const applyUltraFilters = useCallback(
    (
      bVal = uBrightness,
      cVal = uContrast,
      sVal = uSaturation,
      gray = uGrayscale,
      sep = uSepia,
    ) => {
      const src = uSrcRef.current;
      if (!src) return;
      const fb = makeCanvas(src.width, src.height);
      const x = fb.getContext("2d")!;
      const imgData = src
        .getContext("2d")!
        .getImageData(0, 0, src.width, src.height);
      const p = imgData.data;
      const b = bVal / 100;
      const c = cVal / 100;
      const s = sVal / 100;

      for (let i = 0; i < p.length; i += 4) {
        let r = (p[i] * b - 128) * c + 128;
        let g = (p[i + 1] * b - 128) * c + 128;
        let bl = (p[i + 2] * b - 128) * c + 128;
        const l = 0.299 * r + 0.587 * g + 0.114 * bl;
        r = l + (r - l) * s;
        g = l + (g - l) * s;
        bl = l + (bl - l) * s;
        if (gray) {
          r = g = bl = l;
        }
        if (sep) {
          const R = 0.393 * r + 0.769 * g + 0.189 * bl;
          const G = 0.349 * r + 0.686 * g + 0.168 * bl;
          const B = 0.272 * r + 0.534 * g + 0.131 * bl;
          r = R;
          g = G;
          bl = B;
        }
        p[i] = r;
        p[i + 1] = g;
        p[i + 2] = bl;
      }
      x.putImageData(imgData, 0, 0);
      uFilteredRef.current = fb;
      compositeUltra();
    },
    [uBrightness, uContrast, uSaturation, uGrayscale, uSepia, compositeUltra],
  );

  useEffect(() => {
    if (uLoaded) {
      applyUltraFilters(
        uBrightness,
        uContrast,
        uSaturation,
        uGrayscale,
        uSepia,
      );
    }
  }, [
    uLoaded,
    uBrightness,
    uContrast,
    uSaturation,
    uGrayscale,
    uSepia,
    applyUltraFilters,
  ]);

  const handleLoadUltraImage = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const bm = await createImageBitmap(file);
      const k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
      const w = Math.round(bm.width * k);
      const h = Math.round(bm.height * k);
      const srcCanvas = makeCanvas(w, h);
      srcCanvas.getContext("2d")!.drawImage(bm, 0, 0, w, h);
      uSrcRef.current = srcCanvas;
      uInkRef.current = makeCanvas(w, h);
      uHistoryRef.current = [];
      setUBrightness(100);
      setUContrast(100);
      setUSaturation(100);
      setUGrayscale(false);
      setUSepia(false);
      setULoaded(true);
      window.requestAnimationFrame(() => applyUltraFilters(100, 100, 100, false, false));
    } catch {
      showStatus("Could not open that image");
    }
  };

  const cloneCanvas = (c: HTMLCanvasElement) => {
    const n = makeCanvas(c.width, c.height);
    n.getContext("2d")!.drawImage(c, 0, 0);
    return n;
  };

  const canvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const cv = uCanvasRef.current!;
    const rect = cv.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) * cv.width) / rect.width,
      ((e.clientY - rect.top) * cv.height) / rect.height,
    ];
  };

  const drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
    const ink = uInkRef.current;
    const cv = uCanvasRef.current;
    if (!ink || !cv) return;
    const ctx = ink.getContext("2d")!;
    ctx.globalCompositeOperation =
      uTool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = uColor;
    ctx.lineWidth = uSize * Math.max(1, cv.width / 700);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    compositeUltra();
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ink = uInkRef.current;
    const cv = uCanvasRef.current;
    if (!uSrcRef.current || !ink || !cv) return;
    const [x, y] = canvasCoords(e);
    uHistoryRef.current.push(cloneCanvas(ink));
    if (uHistoryRef.current.length > 25) uHistoryRef.current.shift();

    if (uTool === "text") {
      const ctx = ink.getContext("2d")!;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = uColor;
      const fontSize = (uSize * 3 + 14) * Math.max(1, cv.width / 700);
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(uStampText.trim() || "Gamura", x, y);
      compositeUltra();
      return;
    }

    uDrawingRef.current = true;
    uLastPtRef.current = [x, y];
    cv.setPointerCapture(e.pointerId);
    drawStroke(x, y, x, y);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!uDrawingRef.current) return;
    const [x, y] = canvasCoords(e);
    drawStroke(uLastPtRef.current[0], uLastPtRef.current[1], x, y);
    uLastPtRef.current = [x, y];
  };

  const handleUltraTransform = (rotate: boolean) => {
    if (!uSrcRef.current || !uInkRef.current) return;
    const transformOne = (c: HTMLCanvasElement) => {
      const n = rotate
        ? makeCanvas(c.height, c.width)
        : makeCanvas(c.width, c.height);
      const x = n.getContext("2d")!;
      if (rotate) {
        x.translate(n.width, 0);
        x.rotate(Math.PI / 2);
      } else {
        x.translate(n.width, 0);
        x.scale(-1, 1);
      }
      x.drawImage(c, 0, 0);
      return n;
    };
    uSrcRef.current = transformOne(uSrcRef.current);
    uInkRef.current = transformOne(uInkRef.current);
    uHistoryRef.current = [];
    applyUltraFilters();
  };

  const handleUltraUndo = () => {
    const ink = uInkRef.current;
    if (!ink || !uHistoryRef.current.length) return;
    const prev = uHistoryRef.current.pop()!;
    const ctx = ink.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ink.width, ink.height);
    ctx.drawImage(prev, 0, 0);
    compositeUltra();
  };

  const handleUltraClearInk = () => {
    const ink = uInkRef.current;
    if (!ink) return;
    uHistoryRef.current.push(cloneCanvas(ink));
    ink.getContext("2d")!.clearRect(0, 0, ink.width, ink.height);
    compositeUltra();
  };

  const exportUltraPng = async () => {
    const cv = uCanvasRef.current;
    if (!cv) return;
    const blob = await new Promise<Blob>((resolve, reject) =>
      cv.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
        "image/png",
        0.94,
      ),
    );
    downloadFileBlob("gamura-image.png", blob, "image/png");
    showStatus("Saved gamura-image.png ✓");
  };

  const exportUltraPdf = () =>
    runWork("Building PDF…", async () => {
      const cv = uCanvasRef.current;
      if (!cv) return;
      const jpgBlob = await new Promise<Blob>((resolve, reject) =>
        cv.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("JPEG export failed"))),
          "image/jpeg",
          0.92,
        ),
      );
      const doc = await PDFDocument.create();
      const im = await doc.embedJpg(await jpgBlob.arrayBuffer());
      const w = cv.width * 0.75;
      const h = cv.height * 0.75;
      const pg = doc.addPage([w, h]);
      pg.drawImage(im, { x: 0, y: 0, width: w, height: h });
      downloadFileBlob("gamura-image.pdf", await doc.save(), "application/pdf");
      showStatus("Saved gamura-image.pdf ✓");
    });

  const activeToolMeta = STUDIO_TOOLS.find((t) => t.id === view);

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col"
    >
      {/* Top Apple Studio Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (view === "home") {
                onBackHome();
              } else {
                setView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.05] hover:bg-black/[0.09] text-sm font-medium text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={15} />
            <span>{view === "home" ? "Home" : "Studio"}</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img
              src={logoFallback ? G_PDF_LOGO_FALLBACK : G_PDF_LOGO_SRC}
              alt="G PDF"
              referrerPolicy="no-referrer"
              onError={() => setLogoFallback(true)}
              className="w-6 h-6 rounded-md object-contain scale-[1.35] mix-blend-multiply shrink-0"
            />
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#1D1D1F] truncate">
              {activeToolMeta ? activeToolMeta.name : "Gamura PDF Studio"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              if (view !== "home") {
                setView("home");
              } else {
                onBackHome();
              }
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {view === "home" ? "Gamura" : "All Tools"}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
        {/* STUDIO HOME: Centered G PDF Logo in the middle + 5 Apple Studio Tool Tiles */}
        {view === "home" && (
          <div className="space-y-8 sm:space-y-10">
            <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-5">
              {/* Centered G PDF Logo */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mx-auto select-none">
                <img
                  src={logoFallback ? G_PDF_LOGO_FALLBACK : G_PDF_LOGO_SRC}
                  alt="G PDF Logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFallback(true)}
                  className="w-full h-full object-contain scale-[1.2] mix-blend-multiply"
                />
              </div>

              <div className="space-y-2.5 max-w-2xl">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06] text-[#1D1D1F]">
                  Every PDF tool.
                  <br />
                  One beautiful place.
                </h2>
                <p className="text-sm sm:text-lg text-[#6E6E73] leading-relaxed">
                  Create, edit, merge, compress and design. Everything runs in
                  your browser, so your files never leave your device.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STUDIO_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setView(tool.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="group bg-white hover:bg-white border border-zinc-200/75 rounded-[22px] p-6 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-xs mb-4 group-hover:scale-105 transition-transform`}
                      >
                        <Icon size={23} />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-[#6E6E73] mt-1 leading-snug">
                        {tool.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. PDF CREATOR */}
        {view === "create" && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6E6E73]">
                Title (optional)
              </label>
              <input
                type="text"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="My document"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6E6E73]">
                Text
              </label>
              <textarea
                value={cText}
                onChange={(e) => setCText(e.target.value)}
                placeholder="Type or paste your text…"
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#6E6E73]">
                  Page size
                </label>
                <select
                  value={cSize}
                  onChange={(e) => setCSize(e.target.value as "A4" | "Letter")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#6E6E73]">
                  Font size
                </label>
                <select
                  value={cFontSize}
                  onChange={(e) => setCFontSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                >
                  {[11, 12, 14, 16].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} pt
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#6E6E73]">
                Add images (each becomes a page)
              </label>
              <StudioDropZone
                accept="image/*"
                multiple
                title="Add images"
                subtitle={
                  cImages.length
                    ? `${cImages.length} image(s) queued`
                    : "PNG, JPG, WebP"
                }
                onFiles={(files) => setCImages((prev) => [...prev, ...files])}
              />
              {cImages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {cImages.map((img, i) => (
                    <span
                      key={`${img.name}-${i}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] border border-zinc-200/80 text-xs font-medium text-[#1D1D1F]"
                    >
                      <ImageIcon size={12} className="text-[#059669]" />
                      <span className="max-w-[160px] truncate">{img.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-zinc-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-[#6E6E73]">
              Text uses the standard Latin font. For other scripts, add them as
              images instead.
            </p>

            <button
              type="button"
              onClick={handleCreatePdf}
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-2"
            >
              <FileCheck2 size={16} />
              <span>Create PDF</span>
            </button>
          </div>
        )}

        {/* 2. PDF EDITOR */}
        {view === "edit" && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <StudioDropZone
              accept="application/pdf,.pdf"
              title={eFileName ? `Loaded: ${eFileName}` : "Choose a PDF"}
              subtitle="or drop it here to rotate, reorder, watermark & paginate"
              onFiles={handleLoadEditPdf}
            />

            {ePages.length > 0 && (
              <div className="space-y-5">
                <p className="text-xs text-[#6E6E73]">
                  Rotate, reorder or delete pages, then export.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {ePages.map((pg, idx) => (
                    <div
                      key={`${pg.idx}-${idx}`}
                      className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl p-2.5 text-center space-y-2"
                    >
                      <div className="h-40 flex items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
                        <img
                          src={pg.thumb}
                          alt={`Page ${pg.idx + 1}`}
                          style={{ transform: `rotate(${pg.rot}deg)` }}
                          className="max-w-full max-h-full object-contain shadow-xs transition-transform duration-200"
                        />
                      </div>
                      <div className="text-xs font-medium text-[#6E6E73]">
                        Page {pg.idx + 1}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Rotate Left"
                          onClick={() =>
                            setEPages((prev) =>
                              prev.map((item, n) =>
                                n === idx
                                  ? { ...item, rot: (item.rot + 270) % 360 }
                                  : item,
                              ),
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-[#1D1D1F] cursor-pointer"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          type="button"
                          title="Rotate Right"
                          onClick={() =>
                            setEPages((prev) =>
                              prev.map((item, n) =>
                                n === idx
                                  ? { ...item, rot: (item.rot + 90) % 360 }
                                  : item,
                              ),
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-[#1D1D1F] cursor-pointer"
                        >
                          <RotateCw size={13} />
                        </button>
                        <button
                          type="button"
                          title="Move Left"
                          disabled={idx === 0}
                          onClick={() =>
                            setEPages((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [
                                next[idx],
                                next[idx - 1],
                              ];
                              return next;
                            })
                          }
                          className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-[#1D1D1F] cursor-pointer disabled:opacity-35"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          title="Move Right"
                          disabled={idx === ePages.length - 1}
                          onClick={() =>
                            setEPages((prev) => {
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [
                                next[idx],
                                next[idx + 1],
                              ];
                              return next;
                            })
                          }
                          className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-[#1D1D1F] cursor-pointer disabled:opacity-35"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          title="Delete Page"
                          onClick={() =>
                            setEPages((prev) => prev.filter((_, n) => n !== idx))
                          }
                          className="w-8 h-8 rounded-lg bg-white hover:bg-red-50 border border-zinc-200/80 flex items-center justify-center text-red-500 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#6E6E73]">
                      Watermark text
                    </label>
                    <input
                      type="text"
                      value={eWatermark}
                      onChange={(e) => setEWatermark(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2.5 py-2.5 text-sm font-medium text-[#1D1D1F] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={eNumberPages}
                      onChange={(e) => setENumberPages(e.target.checked)}
                      className="w-4 h-4 accent-[#059669]"
                    />
                    <span>Add page numbers</span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!ePages.length}
                  onClick={handleExportEditedPdf}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 inline-flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Export PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. MERGE & CONVERT */}
        {view === "merge" && (
          <div className="space-y-4">
            <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-black/[0.06]">
              {[
                { id: "merge" as const, label: "Merge" },
                { id: "split" as const, label: "Split" },
                { id: "img" as const, label: "PDF to images" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMTab(t.id)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    mTab === t.id
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {mTab === "merge" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
                <StudioDropZone
                  accept="application/pdf,.pdf"
                  multiple
                  title="Add PDFs"
                  subtitle="Choose two or more PDFs to combine"
                  onFiles={(files) =>
                    setMFiles((prev) => [...prev, ...files.filter(isPdfFile)])
                  }
                />

                {mFiles.length > 0 && (
                  <div className="divide-y divide-zinc-100">
                    {mFiles.map((f, idx) => (
                      <div
                        key={`${f.name}-${idx}`}
                        className="py-2.5 flex items-center gap-2.5 text-sm"
                      >
                        <span className="flex-1 truncate font-medium text-[#1D1D1F]">
                          {f.name}
                        </span>
                        <span className="text-xs text-[#6E6E73] tabular-nums shrink-0">
                          {formatBytes(f.size)}
                        </span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            setMFiles((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [
                                next[idx],
                                next[idx - 1],
                              ];
                              return next;
                            })
                          }
                          className="w-8 h-8 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200/70 flex items-center justify-center cursor-pointer disabled:opacity-30"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mFiles.length - 1}
                          onClick={() =>
                            setMFiles((prev) => {
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [
                                next[idx],
                                next[idx + 1],
                              ];
                              return next;
                            })
                          }
                          className="w-8 h-8 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200/70 flex items-center justify-center cursor-pointer disabled:opacity-30"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMFiles((prev) => prev.filter((_, n) => n !== idx))
                          }
                          className="w-8 h-8 rounded-lg bg-[#F5F5F7] hover:bg-red-50 text-red-500 flex items-center justify-center cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  disabled={mFiles.length < 2}
                  onClick={handleMergePdfs}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 inline-flex items-center gap-2"
                >
                  <Layers size={16} />
                  <span>Merge PDFs</span>
                </button>
              </div>
            )}

            {mTab === "split" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
                <StudioDropZone
                  accept="application/pdf,.pdf"
                  title="Choose a PDF"
                  subtitle={sInfo}
                  onFiles={handleLoadSplitPdf}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#6E6E73]">
                    Pages to keep (for example 1-3,5)
                  </label>
                  <input
                    type="text"
                    value={sRange}
                    onChange={(e) => setSRange(e.target.value)}
                    placeholder="1-3,5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                </div>

                <button
                  type="button"
                  disabled={!sBytes}
                  onClick={handleExtractPages}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-40"
                >
                  Extract pages
                </button>
              </div>
            )}

            {mTab === "img" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
                <StudioDropZone
                  accept="application/pdf,.pdf"
                  title="Choose a PDF"
                  subtitle="to turn each page into high-resolution PNG images"
                  onFiles={handleLoadPdfToImages}
                />

                {imgItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imgItems.map((item) => (
                      <div
                        key={item.pageNumber}
                        className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl p-2.5 text-center space-y-2"
                      >
                        <div className="h-40 flex items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
                          <img
                            src={item.previewUrl}
                            alt={`Page ${item.pageNumber}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="text-xs font-medium text-[#6E6E73]">
                          Page {item.pageNumber}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            downloadFileBlob(
                              `gamura-page-${item.pageNumber}.png`,
                              item.blob,
                              "image/png",
                            );
                            showStatus(`Saved page ${item.pageNumber} PNG ✓`);
                          }}
                          className="w-full py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold cursor-pointer"
                        >
                          Save PNG
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. COMPRESS */}
        {view === "comp" && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <StudioDropZone
              accept="application/pdf,.pdf"
              title={kName || "Choose a PDF"}
              subtitle={
                kBytes
                  ? `${kName} · ${formatBytes(kBytes.byteLength)}`
                  : "to make it smaller"
              }
              onFiles={handleLoadCompressPdf}
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#6E6E73]">
                Compression level
              </label>
              <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-black/[0.06]">
                {[
                  { id: "low" as const, label: "Maximum" },
                  { id: "med" as const, label: "Balanced" },
                  { id: "high" as const, label: "Quality" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKLevel(opt.id)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      kLevel === opt.id
                        ? "bg-white text-[#1D1D1F] shadow-xs"
                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6E6E73]">
                Pages are re-rendered as optimized images, so text won’t be
                selectable in the result.
              </p>
            </div>

            <button
              type="button"
              disabled={!kBytes}
              onClick={handleCompressPdf}
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-40"
            >
              Compress
            </button>

            {kResult && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 space-y-3">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] tabular-nums">
                  {formatBytes(kResult.before)} → {formatBytes(kResult.after)}
                </div>
                <p className="text-xs sm:text-sm text-[#6E6E73]">
                  {kResult.pct > 0
                    ? `Saved ${kResult.pct}%`
                    : "Already well optimized. Try Maximum level or keep the original."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const outName = `compressed-${kName.replace(/[^\w.-]+/g, "_")}`;
                    downloadFileBlob(outName, kResult.bytes, "application/pdf");
                    showStatus(`Saved ${outName} ✓`);
                  }}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-[#1D1D1F] hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Download size={15} />
                  <span>Save compressed PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. ULTRA MODIFIER */}
        {view === "ultra" && (
          <div className="space-y-4">
            {!uLoaded ? (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs">
                <StudioDropZone
                  accept="image/*"
                  title="Upload an image"
                  subtitle="Edit it like a canvas, apply filters, draw, stamp text & export as PNG or PDF"
                  onFiles={handleLoadUltraImage}
                />
              </div>
            ) : (
              <>
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                  <canvas
                    ref={uCanvasRef}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={() => {
                      uDrawingRef.current = false;
                    }}
                    onPointerCancel={() => {
                      uDrawingRef.current = false;
                    }}
                    className="block max-w-full max-h-[65vh] w-auto h-auto mx-auto rounded-2xl bg-[#F5F5F7] touch-none cursor-crosshair border border-zinc-200/70"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex p-1 rounded-2xl bg-black/[0.06] gap-1">
                      {[
                        { id: "pen" as const, label: "Pen" },
                        { id: "eraser" as const, label: "Eraser" },
                        { id: "text" as const, label: "Text" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setUTool(t.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                            uTool === t.id
                              ? "bg-white text-[#1D1D1F] shadow-xs"
                              : "text-[#6E6E73] hover:text-[#1D1D1F]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[220px]">
                      <input
                        type="color"
                        value={uColor}
                        onChange={(e) => setUColor(e.target.value)}
                        aria-label="Brush Color"
                        className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="range"
                        min={2}
                        max={40}
                        value={uSize}
                        onChange={(e) => setUSize(Number(e.target.value))}
                        aria-label="Brush Size"
                        className="flex-1 min-w-[100px] accent-[#059669]"
                      />
                      <input
                        type="text"
                        value={uStampText}
                        onChange={(e) => setUStampText(e.target.value)}
                        placeholder="Text to place, then tap image"
                        className="flex-1 min-w-[170px] px-3 py-2 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-xs sm:text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleUltraUndo}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Undo2 size={13} />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUltraClearInk}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Clear drawing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUltraTransform(true)}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCw size={13} />
                      <span>Rotate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUltraTransform(false)}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FlipHorizontal2 size={13} />
                      <span>Flip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUBrightness(112);
                        setUContrast(150);
                        setUSaturation(100);
                        setUGrayscale(true);
                        setUSepia(false);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Document mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUBrightness(100);
                        setUContrast(100);
                        setUSaturation(100);
                        setUGrayscale(false);
                        setUSepia(false);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                    >
                      Reset filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setULoaded(false)}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                    >
                      New image
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6E6E73]">
                        Brightness ({uBrightness}%)
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={uBrightness}
                        onChange={(e) => setUBrightness(Number(e.target.value))}
                        className="w-full accent-[#059669]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6E6E73]">
                        Contrast ({uContrast}%)
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={170}
                        value={uContrast}
                        onChange={(e) => setUContrast(Number(e.target.value))}
                        className="w-full accent-[#059669]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6E6E73]">
                        Saturation ({uSaturation}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={uSaturation}
                        onChange={(e) => setUSaturation(Number(e.target.value))}
                        className="w-full accent-[#059669]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-5 pt-1">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1D1D1F] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uGrayscale}
                        onChange={(e) => setUGrayscale(e.target.checked)}
                        className="w-4 h-4 accent-[#059669]"
                      />
                      <span>Black &amp; white</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1D1D1F] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uSepia}
                        onChange={(e) => setUSepia(e.target.checked)}
                        className="w-4 h-4 accent-[#059669]"
                      />
                      <span>Sepia</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportUltraPdf}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Save as PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportUltraPng}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200/80 text-[#1D1D1F] text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Save as PNG</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Processing Modal Overlay */}
      {busyMsg && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 text-sm font-semibold text-[#1D1D1F]">
            <Loader2 size={18} className="animate-spin text-[#059669]" />
            <span>{busyMsg}</span>
          </div>
        </div>
      )}

      {/* Status Toast */}
      {statusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-lg flex items-center gap-2 max-w-[90vw]">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate">{statusToast}</span>
        </div>
      )}
    </div>
  );
}
