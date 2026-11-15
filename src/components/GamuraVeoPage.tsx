import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Film,
  Globe,
  Image as ImageIcon,
  Layers,
  Smartphone,
  Trash2,
  Upload,
  Check,
  X,
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

interface UploadedVeoFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  dataUrl: string;
  textContent?: string;
  addedAt: string;
}

const VEO_FILES_STORAGE_KEY = "gamura_veo_uploaded_files_v1";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function GamuraVeoPage({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [logoFallback, setLogoFallback] = useState(false);
  const [files, setFiles] = useState<UploadedVeoFile[]>(() => {
    try {
      const saved = localStorage.getItem(VEO_FILES_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as UploadedVeoFile[]) : [];
    } catch {
      return [];
    }
  });
  const [activeFile, setActiveFile] = useState<UploadedVeoFile | null>(null);
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "veo",
    ),
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const veoApp: StoreAppItem =
    BUILTIN_STORE_APPS.find((a) => a.id === "veo") || {
      id: "veo",
      name: "Gamura Veo",
      cat: "Creative",
      tag: "Gamura Veo Studio & Workspace",
      desc: "Open Gamura Veo in its own dedicated URL page.",
      url: "/veo",
      c1: "#34d399",
      c2: "#0284c7",
      logoUrl: GAMURA_VEO_LOGO_URL,
      logoFallbackUrl: GAMURA_VEO_LOGO_FALLBACK,
      rating: 4.9,
      age: "3+",
      chart: "No. 6",
      dl: "New",
      size: "Web · 2 MB",
      isBuiltin: true,
    };

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Veo";
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2600);
  };

  const persistFiles = (next: UploadedVeoFile[]) => {
    setFiles(next);
    try {
      localStorage.setItem(VEO_FILES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      showToast("File loaded for current session (storage limit reached)");
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const loaded: UploadedVeoFile[] = [];
    for (const file of Array.from(fileList)) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
      });

      const isTextLike =
        file.type.startsWith("text/") ||
        /\.(html|htm|md|txt|json|js|ts|css|svg|xml|csv)$/i.test(file.name);

      let textContent: string | undefined;
      if (isTextLike && file.size <= 1_500_000) {
        try {
          textContent = await file.text();
        } catch {
          textContent = undefined;
        }
      }

      loaded.push({
        id: `veo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        dataUrl,
        textContent,
        addedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    const next = [...loaded, ...files];
    persistFiles(next);
    if (loaded[0]) setActiveFile(loaded[0]);
    showToast(
      `Loaded ${loaded.length} ${loaded.length === 1 ? "file" : "files"} into Gamura Veo`,
    );
  };

  const handleRemoveFile = (id: string) => {
    const next = files.filter((f) => f.id !== id);
    persistFiles(next);
    if (activeFile?.id === id) setActiveFile(next[0] || null);
  };

  const handleToggleUniverseInstall = () => {
    if (installedInUniverse) {
      removeAppFromUniverse("veo");
      setInstalledInUniverse(false);
      showToast("Gamura Veo removed from Universe Apps");
    } else {
      addAppToUniverse(veoApp);
      setInstalledInUniverse(true);
      showToast("Gamura Veo installed in Universe Apps ✓");
    }
  };

  const handleDownloadApp = () => {
    addMobileInstalledId("veo");
    downloadStandaloneAppPackage(veoApp);
    showToast("Downloading Gamura Veo launcher ✓");
  };

  const renderFileIcon = (file: UploadedVeoFile) => {
    if (file.mime.startsWith("video/"))
      return <Film size={18} className="text-[#0284c7]" />;
    if (file.mime.startsWith("image/"))
      return <ImageIcon size={18} className="text-[#059669]" />;
    if (/\.html?$/i.test(file.name))
      return <FileCode2 size={18} className="text-amber-600" />;
    return <FileText size={18} className="text-zinc-600" />;
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col"
    >
      {/* Apple-White Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-zinc-200/80 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
            >
              <Layers size={13} />
              <span>Launch Store</span>
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#E2F5ED] border-[#059669]/30 text-[#059669]"
                  : "bg-white border-zinc-200/80 text-[#1D1D1F] hover:bg-zinc-50"
              }`}
            >
              <Globe size={13} />
              <span>
                {installedInUniverse ? "In Universe ✓" : "Add to Universe"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadApp}
              className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Centered Gamura Veo Hero Lockup */}
        <section className="bg-white border border-zinc-200/80 rounded-[28px] p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] bg-white border border-zinc-200/80 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-center">
            <img
              src={
                logoFallback ? GAMURA_VEO_LOGO_FALLBACK : GAMURA_VEO_LOGO_URL
              }
              alt="Gamura Veo Logo"
              referrerPolicy="no-referrer"
              onError={() => setLogoFallback(true)}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1.5 max-w-lg">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Gamura Veo
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
              Dedicated Gamura Veo workspace. Load, preview, run, and download
              uploaded HTML apps, videos, images, PDFs, or code files right from
              this page.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload size={15} />
              <span>Upload / Load Files</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadApp}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#E2F5ED] hover:bg-[#D1EFE3] text-[#059669] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone size={15} />
              <span>Save Mobile App</span>
            </button>
          </div>
        </section>

        {/* Uploaded Files & Live Viewer */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-[24px] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1D1D1F] tracking-tight">
                Gamura Veo Files ({files.length})
              </h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#059669] hover:underline cursor-pointer"
              >
                + Add file
              </button>
            </div>

            {files.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl bg-[#F5F5F7] border border-dashed border-zinc-300 text-center space-y-2">
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  No files loaded in Gamura Veo yet
                </p>
                <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                  Click <span className="font-semibold">Upload / Load Files</span>{" "}
                  above to open HTML, video, image, PDF, or text files directly
                  inside Gamura Veo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {files.map((file) => {
                  const isActive = activeFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setActiveFile(file)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveFile(file);
                        }
                      }}
                      className={`flex items-center gap-3 py-3 px-2.5 rounded-xl cursor-pointer transition-colors ${
                        isActive ? "bg-[#E2F5ED]/60" : "hover:bg-[#F5F5F7]"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-zinc-200/70 flex items-center justify-center shrink-0">
                        {renderFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-[#6E6E73]">
                          {formatBytes(file.size)} · {file.addedAt}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.id);
                        }}
                        aria-label={`Remove ${file.name}`}
                        className="w-7 h-7 rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Canvas */}
          <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-[24px] p-5 shadow-xs flex flex-col min-h-[340px]">
            {activeFile ? (
              <>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1D1D1F] truncate">
                      {activeFile.name}
                    </div>
                    <div className="text-[11px] text-[#6E6E73]">
                      {activeFile.mime} · {formatBytes(activeFile.size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={activeFile.dataUrl}
                      download={activeFile.name}
                      className="px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Save</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveFile(null)}
                      aria-label="Close preview"
                      className="w-7 h-7 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 flex items-center justify-center text-[#6E6E73] cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 pt-4 flex items-center justify-center overflow-hidden">
                  {/\.html?$/i.test(activeFile.name) && activeFile.textContent ? (
                    <iframe
                      title={activeFile.name}
                      srcDoc={activeFile.textContent}
                      sandbox="allow-scripts allow-forms"
                      className="w-full h-[380px] rounded-2xl border border-zinc-200 bg-white"
                    />
                  ) : activeFile.mime.startsWith("image/") ? (
                    <img
                      src={activeFile.dataUrl}
                      alt={activeFile.name}
                      className="max-h-[380px] max-w-full rounded-2xl object-contain"
                    />
                  ) : activeFile.mime.startsWith("video/") ? (
                    <video
                      src={activeFile.dataUrl}
                      controls
                      className="w-full max-h-[380px] rounded-2xl bg-black"
                    />
                  ) : activeFile.mime === "application/pdf" ? (
                    <iframe
                      title={activeFile.name}
                      src={activeFile.dataUrl}
                      className="w-full h-[380px] rounded-2xl border border-zinc-200"
                    />
                  ) : activeFile.textContent ? (
                    <pre className="w-full h-[380px] overflow-auto rounded-2xl bg-[#F5F5F7] p-4 text-xs font-mono text-[#1D1D1F] whitespace-pre-wrap">
                      {activeFile.textContent}
                    </pre>
                  ) : (
                    <div className="text-center space-y-2 py-8">
                      <p className="text-sm font-semibold text-[#1D1D1F]">
                        Ready to download
                      </p>
                      <a
                        href={activeFile.dataUrl}
                        download={activeFile.name}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#059669] text-white text-xs font-semibold"
                      >
                        <ExternalLink size={12} />
                        <span>Download {activeFile.name}</span>
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 flex items-center justify-center text-[#6E6E73]">
                  <FileCode2 size={22} />
                </div>
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  Gamura Veo File Preview
                </h3>
                <p className="text-xs text-[#6E6E73] max-w-xs leading-relaxed">
                  Select any uploaded file on the left to preview, run, or
                  download it inside Gamura Veo.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-lg flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
