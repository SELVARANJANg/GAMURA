import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  Cloud,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Link2,
  Link2Off,
  Moon,
  PenTool,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";
import {
  GCARD_DEFAULT,
  GCARD_FONTS,
  GCARD_SETS,
  GCARD_SOLIDS,
  buildGcardVCard,
  connectCardAndWallet,
  decodeGcardCode,
  disconnectCardAndWallet,
  encodeGcardCode,
  getCardPatternDataUri,
  pushCardWalletVaultToCloud,
  readCardWalletLink,
  readGcardStore,
  readGwalletStore,
  saveGcardState,
  subscribeCloudCardWalletVault,
  subscribeLocalCardWalletSync,
  type CardWalletLinkState,
  type GcardState,
  type GcardStorePayload,
} from "../utils/gamuraCardWalletSync";

interface GamuraCardPageProps {
  onBackHome: () => void;
  onNavigateUrl?: (path: string) => void;
}

type GcardScreen = "intro" | "view" | "edit" | "coll";

const EDIT_TABS = [
  "Info",
  "Layout",
  "Font",
  "Color",
  "Pattern",
  "Back",
] as const;

const FAN_PRESETS: {
  card: GcardState;
  rotate: number;
  x: number;
  y: number;
  z: number;
}[] = [
  {
    card: {
      ...GCARD_DEFAULT,
      bg: "#0a4630",
      ink: "#ffffff",
      pat: 5,
      layout: 4,
      font: 2,
    },
    rotate: -10,
    x: -56,
    y: -18,
    z: 1,
  },
  {
    card: {
      ...GCARD_DEFAULT,
      bg: "#fddcf0",
      ink: "#0a4630",
      pat: 11,
      layout: 2,
      font: 0,
    },
    rotate: 8,
    x: 56,
    y: -12,
    z: 2,
  },
  {
    card: {
      ...GCARD_DEFAULT,
      bg: "#6e0b52",
      ink: "#ffffff",
      pat: 3,
      layout: 5,
      font: 3,
    },
    rotate: -4,
    x: -24,
    y: 28,
    z: 3,
  },
  {
    card: {
      ...GCARD_DEFAULT,
      bg: "#2358e8",
      ink: "#ffffff",
      pat: 1,
      layout: 3,
      font: 1,
    },
    rotate: 6,
    x: 34,
    y: 42,
    z: 4,
  },
  {
    card: {
      ...GCARD_DEFAULT,
      bg: "#fafaf8",
      ink: "#111111",
      pat: 0,
      layout: 0,
      font: 0,
    },
    rotate: -1.5,
    x: 0,
    y: 72,
    z: 5,
  },
];

function GcardFaceFront({
  card,
  className = "",
}: {
  card: GcardState;
  className?: string;
}) {
  const fontTuple = GCARD_FONTS[card.font] || GCARD_FONTS[0];
  const initial = (card.name || "G").trim().charAt(0).toUpperCase() || "G";
  const patternBg = getCardPatternDataUri(card.pat, card.ink);

  const layoutClasses = (() => {
    switch (card.layout) {
      case 1:
        return {
          photo:
            "right-[7cqw] top-[7cqw] bottom-[7cqw] w-[23cqw] rounded-[3cqw]",
          tx: "left-[7cqw] top-1/2 -translate-y-1/2 max-w-[60cqw] text-left",
          title: "text-[8.4cqw]",
          showPhoto: true,
        };
      case 2:
        return {
          photo:
            "right-[7cqw] top-[7cqw] w-[17cqw] h-[17cqw] rounded-[3cqw]",
          tx: "left-[7cqw] top-[7cqw] max-w-[66cqw] text-left",
          title: "text-[8.4cqw]",
          showPhoto: true,
        };
      case 3:
        return {
          photo: "hidden",
          tx: "right-[7cqw] bottom-[7cqw] max-w-[84cqw] text-right",
          title: "text-[8.4cqw]",
          showPhoto: false,
        };
      case 4:
        return {
          photo: "hidden",
          tx: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[84cqw] text-center",
          title: "text-[8.4cqw]",
          showPhoto: false,
        };
      case 5:
        return {
          photo: "hidden",
          tx: "left-[7cqw] top-[7cqw] max-w-[84cqw] text-left",
          title: "text-[11cqw]",
          showPhoto: false,
        };
      default:
        return {
          photo:
            "left-[7cqw] top-[7cqw] w-[16cqw] h-[16cqw] rounded-full",
          tx: "left-[7cqw] bottom-[7cqw] max-w-[84cqw] text-left",
          title: "text-[8.4cqw]",
          showPhoto: true,
        };
    }
  })();

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none [container-type:inline-size] ${className}`}
      style={{
        backgroundColor: card.bg,
        color: card.ink,
        fontFamily: `"${fontTuple[1]}", sans-serif`,
        fontWeight: fontTuple[2],
      }}
    >
      {patternBg !== "none" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: patternBg }}
        />
      )}

      {layoutClasses.showPhoto && (
        <div
          className={`absolute overflow-hidden grid place-items-center font-bold text-[7cqw] text-white bg-cover bg-center ${layoutClasses.photo}`}
          style={
            card.photo
              ? { backgroundImage: `url(${card.photo})` }
              : {
                  background: "linear-gradient(135deg, #0a8f5a, #0b3d1e)",
                }
          }
        >
          {!card.photo ? initial : null}
        </div>
      )}

      <div className={`absolute leading-[1.2] ${layoutClasses.tx}`}>
        <h2
          className={`m-0 leading-[1.02] uppercase break-words ${layoutClasses.title}`}
          style={{ fontWeight: "inherit" }}
        >
          {card.name || "\u00A0"}
        </h2>
        {card.head && (
          <p className="mt-[1.6cqw] mb-0 text-[3.5cqw] font-sans font-normal opacity-95">
            {card.head}
          </p>
        )}
        {card.showLoc && card.loc && (
          <p className="mt-[0.6cqw] mb-0 text-[3.4cqw] font-sans font-normal opacity-80">
            {card.loc}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GamuraCardPage({
  onBackHome,
  onNavigateUrl,
}: GamuraCardPageProps) {
  const [store, setStore] = useState<GcardStorePayload>(() => readGcardStore());
  const [linkState, setLinkState] = useState<CardWalletLinkState>(() =>
    readCardWalletLink(),
  );
  const [walletCount, setWalletCount] = useState<number>(
    () => readGwalletStore().cards.length,
  );
  const [screen, setScreen] = useState<GcardScreen>(() =>
    readGcardStore().onboarded ? "view" : "intro",
  );
  const [editTab, setEditTab] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [selectedStickerIdx, setSelectedStickerIdx] = useState<number | null>(
    null,
  );
  const [editSnapshot, setEditSnapshot] = useState<GcardState | null>(null);
  const [collectInput, setCollectInput] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Doodle drawing modal state
  const [doodleOpen, setDoodleOpen] = useState<boolean>(false);
  const [penSize, setPenSize] = useState<number>(9);
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doodleStrokesRef = useRef<{ w: number; p: [number, number][] }[]>([]);
  const activeStrokeRef = useRef<{ w: number; p: [number, number][] } | null>(
    null,
  );

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cutInputRef = useRef<HTMLInputElement | null>(null);
  const backSurfaceRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<number | null>(null);

  // Firebase Auth for cross-device cloud sync
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(
    () => auth.currentUser,
  );

  // Launch Store installation state
  const [isInstalledInUniverse, setIsInstalledInUniverse] = useState<boolean>(
    () =>
      readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
        (x) => x.id === "gamura-gcard",
      ),
  );

  const toastTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "GAMURA CARD (Gcard)";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time BroadcastChannel + localStorage sync
  useEffect(() => {
    return subscribeLocalCardWalletSync(({ gcard, gwallet, link }) => {
      setStore(gcard);
      setWalletCount(gwallet.cards.length);
      setLinkState(link);
    });
  }, []);

  // Subscribe to real-time Firestore Cloud Sync when signed in
  useEffect(() => {
    if (!authUser) return;
    return subscribeCloudCardWalletVault(
      authUser.uid,
      "gcard",
      ({ gcard, gwallet, link }) => {
        setStore(gcard);
        setWalletCount(gwallet.cards.length);
        setLinkState(link);
      },
    );
  }, [authUser]);

  // Keep Universe install toggle synced
  useEffect(() => {
    const refreshInstalled = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setIsInstalledInUniverse(list.some((x) => x.id === "gamura-gcard"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, refreshInstalled);
    return () =>
      window.removeEventListener(UNIVERSE_APPS_EVENT, refreshInstalled);
  }, []);

  const dark = store.darkMode;
  const card = store.card;

  const commitStore = (next: GcardStorePayload) => {
    setStore(next);
    const { link, wallet } = saveGcardState(next, authUser?.uid);
    setLinkState(link);
    setWalletCount(wallet.cards.length);
  };

  const updateCard = (patch: Partial<GcardState>) => {
    commitStore({
      ...store,
      onboarded: true,
      card: { ...store.card, ...patch },
    });
  };

  const handleToggleUniverseInstall = () => {
    const catalogApp = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-gcard");
    if (!catalogApp) return;
    if (isInstalledInUniverse) {
      removeAppFromUniverse("gamura-gcard");
      showToast("Removed Gcard from Universe Apps");
    } else {
      addAppToUniverse(catalogApp);
      showToast("Added Gcard to Universe Apps");
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigateUrl) {
      onNavigateUrl(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleConnectToggle = (connect: boolean) => {
    if (connect) {
      const { link, wallet } = connectCardAndWallet("gcard", authUser?.uid);
      setLinkState(link);
      setWalletCount(wallet.cards.length);
      showToast("Connected & live synced with Gwallet");
    } else {
      const link = disconnectCardAndWallet("gcard", authUser?.uid);
      setLinkState(link);
      showToast("Disconnected live sync from Gwallet");
    }
  };

  const handleManualSync = async () => {
    if (linkState.connected) {
      const { wallet } = connectCardAndWallet("gcard", authUser?.uid);
      setWalletCount(wallet.cards.length);
    } else {
      commitStore(store);
    }
    if (authUser) {
      await pushCardWalletVaultToCloud(authUser.uid, "gcard");
    }
    showToast(
      authUser
        ? "Synced live across Gwallet & Gamura Cloud"
        : "Synced live with Gwallet",
    );
  };

  const handleGoogleCloudSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Signed in · Cloud sync active");
    } catch {
      showToast("Sign-in cancelled");
    }
  };

  const shrinkImage = (
    file: File,
    maxPx: number,
    mime: "image/jpeg" | "image/png",
    cb: (dataUrl: string) => void,
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * k));
        canvas.height = Math.max(1, Math.round(img.height * k));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL(mime, 0.85));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  // Doodle canvas helpers
  const redrawDoodleCanvas = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
    for (const s of doodleStrokesRef.current) {
      ctx.lineWidth = s.w;
      ctx.beginPath();
      s.p.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      });
      if (s.p.length === 1) {
        ctx.lineTo(s.p[0][0] + 0.1, s.p[0][1]);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!doodleOpen) return;
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(320, canvas.clientWidth * 2);
    canvas.height = 560;
    doodleStrokesRef.current = [];
    redrawDoodleCanvas();
  }, [doodleOpen]);

  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return [0, 0];
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * canvas.width) / r.width,
      ((e.clientY - r.top) * canvas.height) / r.height,
    ];
  };

  const handleSaveDoodle = () => {
    const strokes = doodleStrokesRef.current;
    const canvas = doodleCanvasRef.current;
    if (!strokes.length || !canvas) {
      showToast("Draw something first");
      return;
    }
    let x0 = 1e9;
    let y0 = 1e9;
    let x1 = 0;
    let y1 = 0;
    strokes.forEach((s) =>
      s.p.forEach((pt) => {
        x0 = Math.min(x0, pt[0] - s.w);
        y0 = Math.min(y0, pt[1] - s.w);
        x1 = Math.max(x1, pt[0] + s.w);
        y1 = Math.max(y1, pt[1] + s.w);
      }),
    );
    x0 = Math.max(0, x0);
    y0 = Math.max(0, y0);
    const w = Math.max(12, Math.min(canvas.width, x1) - x0);
    const h = Math.max(12, Math.min(canvas.height, y1) - y0);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const g = out.getContext("2d");
    if (!g) return;
    g.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    const dataUrl = out.toDataURL("image/png");
    updateCard({ doods: [...card.doods, dataUrl] });
    setDoodleOpen(false);
    showToast("Doodle saved to stickers");
  };

  const addStickerToBack = (src: string, size: number) => {
    if (card.st.length >= 12) {
      showToast("Max 12 stickers on card back");
      return;
    }
    const nextSt = [...card.st, { src, x: 50, y: 50, s: size, r: 0 }];
    setSelectedStickerIdx(nextSt.length - 1);
    updateCard({ st: nextSt });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("Copy blocked by browser");
    }
  };

  const handleShare = async () => {
    const sharePayload = {
      title: card.name,
      text: `${card.name} — ${card.head}`,
      url: card.link || "https://gamura.vercel.app",
    };
    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        // user cancelled
      }
    }
    await copyText(card.link || "https://gamura.vercel.app", "Card link copied");
  };

  const handleDownloadVCard = () => {
    const vcf = buildGcardVCard(card);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(card.name || "gamura-card").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    showToast("vCard downloaded");
  };

  const handleCollectCard = () => {
    const decoded = decodeGcardCode(collectInput);
    if (!decoded) {
      showToast("Invalid Gamura Card code");
      return;
    }
    commitStore({
      ...store,
      onboarded: true,
      coll: [decoded, ...store.coll],
    });
    setCollectInput("");
    showToast(`Collected ${decoded.name}`);
  };

  const startEditing = () => {
    setEditSnapshot(JSON.parse(JSON.stringify(card)) as GcardState);
    setEditTab(0);
    setFlipped(false);
    setSelectedStickerIdx(null);
    setScreen("edit");
  };

  const cancelEditing = () => {
    if (editSnapshot) {
      commitStore({
        ...store,
        card: editSnapshot,
      });
    }
    setEditSnapshot(null);
    setFlipped(false);
    setScreen(store.onboarded ? "view" : "intro");
  };

  const saveEditing = () => {
    setEditSnapshot(null);
    setFlipped(false);
    commitStore({
      ...store,
      onboarded: true,
    });
    setScreen("view");
    showToast(
      linkState.connected
        ? "Card saved & synced to Gwallet"
        : "Card saved",
    );
  };

  const selectedSticker =
    selectedStickerIdx != null ? card.st[selectedStickerIdx] ?? null : null;

  const qrValue = useMemo(
    () => card.link?.trim() || "https://gamura.vercel.app",
    [card.link],
  );

  const rootBg = dark
    ? "bg-[#09090B] text-[#F5F5F7]"
    : "bg-[#F2F2F7] text-[#1D1D1F]";
  const surfaceBg = dark
    ? "bg-[#1C1C1E] border-zinc-800"
    : "bg-white border-zinc-200/80";
  const subtleBg = dark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]";
  const mutedText = dark ? "text-zinc-400" : "text-[#6E6E73]";

  return (
    <div className={`min-h-screen ${rootBg} transition-colors duration-200`}>
      {/* Compact Sticky Top App Bar */}
      <header
        className={`sticky top-0 z-30 h-14 px-4 sm:px-6 border-b backdrop-blur-xl flex items-center justify-between gap-4 ${
          dark
            ? "bg-[#09090B]/90 border-zinc-800/90"
            : "bg-white/90 border-zinc-200/80"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackHome}
            aria-label="Back to Gamura"
            className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              dark
                ? "hover:bg-zinc-800 text-zinc-200"
                : "hover:bg-zinc-100 text-zinc-800"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap truncate">
            GAMURA CARD
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setScreen("view");
            }}
            className={`whitespace-nowrap cursor-pointer transition-colors ${
              screen === "view"
                ? "text-[#0a8f5a] font-semibold"
                : `${mutedText} hover:text-current`
            }`}
          >
            My Card
          </button>
          <button
            type="button"
            onClick={startEditing}
            className={`whitespace-nowrap cursor-pointer transition-colors ${
              screen === "edit"
                ? "text-[#0a8f5a] font-semibold"
                : `${mutedText} hover:text-current`
            }`}
          >
            Customize
          </button>
          <button
            type="button"
            onClick={() => setScreen("coll")}
            className={`whitespace-nowrap cursor-pointer transition-colors ${
              screen === "coll"
                ? "text-[#0a8f5a] font-semibold"
                : `${mutedText} hover:text-current`
            }`}
          >
            Collected ({store.coll.length})
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/gwallet")}
            className={`whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${mutedText} hover:text-current`}
          >
            <span>Open Gwallet</span>
            <ArrowUpRight size={14} />
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConnectSheetOpen(true)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              linkState.connected
                ? "bg-[#0a8f5a] text-white hover:bg-[#08774b]"
                : dark
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            <Wallet size={14} />
            <span>
              {linkState.connected ? "Gwallet Connected" : "Connect Gwallet"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => commitStore({ ...store, darkMode: !dark })}
            aria-label="Toggle theme"
            className={`min-h-[38px] min-w-[38px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${subtleBg}`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {screen === "intro" && (
          <div className="max-w-3xl mx-auto">
            <div
              className={`rounded-3xl border p-6 sm:p-10 shadow-sm ${surfaceBg}`}
            >
              <div className="relative h-64 sm:h-72 flex items-center justify-center overflow-hidden mb-4">
                {FAN_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="absolute w-52 sm:w-64 aspect-[8/5] rounded-2xl overflow-hidden shadow-xl transition-transform duration-500"
                    style={{
                      transform: `translate(${preset.x}px, ${preset.y}px) rotate(${preset.rotate}deg)`,
                      zIndex: preset.z,
                    }}
                  >
                    <GcardFaceFront card={preset.card} />
                  </div>
                ))}
              </div>

              <div className="text-center max-w-xl mx-auto space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight [text-wrap:balance]">
                  Say hello to your Gamura Card
                </h1>
                <p className={`text-base sm:text-lg ${mutedText}`}>
                  Meet in person. Scan. Connect in seconds across Gcard and
                  Gwallet.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                  <div className={`p-3.5 rounded-2xl ${subtleBg}`}>
                    <div className="font-semibold text-sm">Personalize</div>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      6 layouts, 6 fonts, 12 patterns, doodles &amp; photo
                      stickers.
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${subtleBg}`}>
                    <div className="font-semibold text-sm">Instant Share</div>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Live QR code, link sharing, card code, and vCard export.
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${subtleBg}`}>
                    <div className="font-semibold text-sm">Live Gwallet Sync</div>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      One-tap connect keeps your pass live in Gamura Wallet.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="w-full sm:w-auto min-h-[48px] px-7 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white font-semibold text-base cursor-pointer transition-colors"
                  >
                    Customize your card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      commitStore({ ...store, onboarded: true });
                      setScreen("view");
                    }}
                    className={`w-full sm:w-auto min-h-[48px] px-6 rounded-full border font-semibold text-sm cursor-pointer transition-colors ${
                      dark
                        ? "border-zinc-700 hover:bg-zinc-800"
                        : "border-zinc-300 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    View Business Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "view" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Center Stage: Live 3D Flip Card + Real-time Connect Bar */}
            <div className="lg:col-span-7 space-y-5">
              <div className={`rounded-3xl border p-5 sm:p-7 shadow-sm ${surfaceBg}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Business Card
                    </h1>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Tap card to flip ·{" "}
                      {linkState.connected
                        ? "Live synced to Gwallet"
                        : "Ready to connect with Gwallet"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startEditing}
                    className="min-h-[40px] px-4 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PenTool size={14} />
                    <span>Edit Card</span>
                  </button>
                </div>

                {/* 3D Flip Card Stage */}
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  aria-label="Flip business card"
                  className="w-full block text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a8f5a] rounded-[22px] [perspective:1200px]"
                >
                  <div
                    className="relative w-full aspect-[8/5] transition-transform duration-500 [transform-style:preserve-3d]"
                    style={{
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    <div className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.16)] [backface-visibility:hidden]">
                      <GcardFaceFront card={card} />
                    </div>

                    <div
                      className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.16)] bg-[#111111] text-white [backface-visibility:hidden]"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      {card.st.map((sticker, idx) => (
                        <div
                          key={idx}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            width: `${sticker.s}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.r}deg)`,
                            filter:
                              "drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)",
                          }}
                        >
                          <img
                            src={sticker.src}
                            alt=""
                            className="w-full h-auto block"
                          />
                        </div>
                      ))}
                      {card.st.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6 text-zinc-400 text-sm">
                          <span>GAMURA CARD</span>
                          <span className="text-xs mt-1 text-zinc-500">
                            Edit card back to add doodles &amp; photo stickers
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Primary Share / Export Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`min-h-[44px] px-3 rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      dark
                        ? "border-zinc-700 hover:bg-zinc-800"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(qrValue, "Link copied")}
                    className={`min-h-[44px] px-3 rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      dark
                        ? "border-zinc-700 hover:bg-zinc-800"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        encodeGcardCode(card),
                        "Card code copied for friends",
                      )
                    }
                    className={`min-h-[44px] px-3 rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      dark
                        ? "border-zinc-700 hover:bg-zinc-800"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Card Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className={`min-h-[44px] px-3 rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      dark
                        ? "border-zinc-700 hover:bg-zinc-800"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <Download size={14} />
                    <span>Save vCard</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Connect Gwallet Live Sync Card */}
              <div className={`rounded-3xl border p-5 shadow-sm ${surfaceBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#064e3b] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                        <span>Gwallet Real-Time Connect</span>
                        <span
                          className={`text-xs font-semibold ${
                            linkState.connected
                              ? "text-[#0a8f5a]"
                              : mutedText
                          }`}
                        >
                          · {linkState.connected ? "Connected" : "Not Connected"}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>
                        {linkState.connected
                          ? `Your Gamura Card is actively linked inside Gwallet (${walletCount} passes). Any edit here updates Gwallet live.`
                          : "Connect GAMURA CARD (Gcard) and Gwallet to keep your digital card pass synced in real time across both apps."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {linkState.connected ? (
                      <>
                        <button
                          type="button"
                          onClick={handleManualSync}
                          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${subtleBg}`}
                        >
                          <RefreshCw size={13} />
                          <span>Sync Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNavigate("/gwallet")}
                          className="min-h-[40px] px-4 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>Open Gwallet</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnectToggle(true)}
                        className="min-h-[42px] px-5 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Link2 size={14} />
                        <span>Connect to Gwallet</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Rail: Scannable QR Code + Quick Actions + Store/Cloud */}
            <div className="lg:col-span-5 space-y-5">
              <div className={`rounded-3xl border p-6 shadow-sm text-center ${surfaceBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <QrCode size={16} className="text-[#0a8f5a]" />
                    <span>Scan to Connect</span>
                  </span>
                  <span className={`text-xs truncate max-w-[180px] ${mutedText}`}>
                    {qrValue}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 inline-block shadow-xs my-2">
                  <QRCodeSVG
                    value={qrValue}
                    size={190}
                    level="M"
                    fgColor="#111111"
                    bgColor="#FFFFFF"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setScreen("coll")}
                    className={`min-h-[40px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${subtleBg}`}
                  >
                    <UserPlus size={14} />
                    <span>Card Collection ({store.coll.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmReset) {
                        setConfirmReset(true);
                        window.setTimeout(() => setConfirmReset(false), 3500);
                        return;
                      }
                      commitStore({
                        ...store,
                        card: { ...GCARD_DEFAULT },
                      });
                      setConfirmReset(false);
                      showToast("Card reset to defaults");
                    }}
                    className={`min-h-[40px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                      confirmReset
                        ? "bg-red-600 text-white"
                        : `${subtleBg} text-red-600`
                    }`}
                  >
                    <RotateCcw size={13} />
                    <span>{confirmReset ? "Tap Again to Reset" : "Reset Card"}</span>
                  </button>
                </div>
              </div>

              {/* Gamura Cloud & Launch Store Utility */}
              <div className={`rounded-3xl border p-5 shadow-sm space-y-3 ${surfaceBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Cloud size={16} className="text-[#0a8f5a]" />
                    <span>Cross-Device Cloud Sync</span>
                  </div>
                  <span className={`text-xs ${mutedText}`}>
                    {authUser ? "Active" : "Local"}
                  </span>
                </div>
                <p className={`text-xs ${mutedText}`}>
                  {authUser
                    ? `Signed in as ${authUser.email || authUser.displayName || "Gamura ID"}. Gcard and Gwallet stay synced across every device.`
                    : "Works instantaneously on this browser. Sign in with Gamura ID to sync Gcard and Gwallet across devices."}
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {!authUser && (
                    <button
                      type="button"
                      onClick={handleGoogleCloudSignIn}
                      className="min-h-[38px] px-4 rounded-full bg-zinc-900 text-white text-xs font-semibold cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                      Sign in for Cloud Sync
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleUniverseInstall}
                    className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                      isInstalledInUniverse
                        ? "bg-[#E2F5ED] text-[#059669]"
                        : subtleBg
                    }`}
                  >
                    {isInstalledInUniverse ? <Check size={13} /> : <Plus size={13} />}
                    <span>
                      {isInstalledInUniverse ? "In Universe" : "Pin to Universe"}
                    </span>
                  </button>
                  <a
                    href="/launch"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/launch");
                    }}
                    className={`min-h-[38px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${subtleBg}`}
                  >
                    <span>Launch Store</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "edit" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sticky Live 3D Card Stage */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              <div className={`rounded-3xl border p-5 shadow-sm ${surfaceBg}`}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
                  >
                    Cancel
                  </button>
                  <span className="text-sm font-bold">Edit Card</span>
                  <button
                    type="button"
                    onClick={saveEditing}
                    className="min-h-[38px] px-5 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </div>

                {/* Live Interactive 3D Card */}
                <div
                  onClick={() => {
                    if (editTab !== 5) setFlipped((f) => !f);
                  }}
                  className="w-full cursor-pointer [perspective:1200px]"
                >
                  <div
                    className="relative w-full aspect-[8/5] transition-transform duration-500 [transform-style:preserve-3d]"
                    style={{
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    <div className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.16)] [backface-visibility:hidden]">
                      <GcardFaceFront card={card} />
                    </div>

                    <div
                      ref={backSurfaceRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editTab !== 5) setFlipped(false);
                      }}
                      className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.16)] bg-[#111111] text-white [backface-visibility:hidden]"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      {card.st.map((sticker, idx) => (
                        <div
                          key={idx}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedStickerIdx(idx);
                            draggingRef.current = idx;
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            if (draggingRef.current !== idx) return;
                            const host = backSurfaceRef.current;
                            if (!host) return;
                            const r = host.getBoundingClientRect();
                            const nx = Math.max(
                              0,
                              Math.min(100, ((e.clientX - r.left) / r.width) * 100),
                            );
                            const ny = Math.max(
                              0,
                              Math.min(100, ((e.clientY - r.top) / r.height) * 100),
                            );
                            const nextSt = card.st.map((item, sIdx) =>
                              sIdx === idx ? { ...item, x: nx, y: ny } : item,
                            );
                            updateCard({ st: nextSt });
                          }}
                          onPointerUp={() => {
                            draggingRef.current = null;
                          }}
                          className={`absolute touch-none cursor-grab active:cursor-grabbing ${
                            selectedStickerIdx === idx
                              ? "outline-2 outline-dashed outline-white outline-offset-4"
                              : ""
                          }`}
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            width: `${sticker.s}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.r}deg)`,
                            filter:
                              "drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)",
                          }}
                        >
                          <img
                            src={sticker.src}
                            alt=""
                            draggable={false}
                            className="w-full h-auto block pointer-events-none"
                          />
                        </div>
                      ))}
                      {card.st.length === 0 && (
                        <div className="h-full flex items-center justify-center text-center px-8 text-sm font-medium text-zinc-400 pointer-events-none">
                          Add a photo sticker or doodle to the back
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="font-semibold text-[#0a8f5a] cursor-pointer hover:underline"
                  >
                    {flipped ? "Show Front" : "Flip to Back"}
                  </button>
                  <span className={mutedText}>
                    {linkState.connected ? "Auto-syncs to Gwallet" : "Editing card"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Editor Controls Panel */}
            <div className="lg:col-span-7 space-y-4">
              {/* Segmented Tab Bar */}
              <div className={`p-1.5 rounded-2xl border grid grid-cols-3 sm:grid-cols-6 gap-1 ${surfaceBg}`}>
                {EDIT_TABS.map((tabLabel, idx) => {
                  const active = editTab === idx;
                  return (
                    <button
                      key={tabLabel}
                      type="button"
                      onClick={() => {
                        setEditTab(idx);
                        setFlipped(idx === 5);
                      }}
                      className={`min-h-[40px] rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        active
                          ? "bg-[#0a8f5a] text-white"
                          : `${mutedText} hover:text-current`
                      }`}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>

              <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm ${surfaceBg}`}>
                {editTab === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold">Card Information</h2>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${mutedText}`}>
                        Name
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        value={card.name}
                        onChange={(e) => updateCard({ name: e.target.value })}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                          dark
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-[#F5F5F7] border-zinc-200"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className={mutedText}>Headline</span>
                        <span className={`${mutedText} tabular-nums`}>
                          {card.head.length}/100
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={card.head}
                        onChange={(e) => updateCard({ head: e.target.value })}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                          dark
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-[#F5F5F7] border-zinc-200"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${mutedText}`}>
                          Location
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCard({ showLoc: !card.showLoc })}
                          className={`min-h-[30px] px-3 rounded-full text-xs font-semibold cursor-pointer ${
                            card.showLoc
                              ? "bg-[#0a8f5a] text-white"
                              : subtleBg
                          }`}
                        >
                          {card.showLoc ? "Shown" : "Hidden"}
                        </button>
                      </div>
                      {card.showLoc && (
                        <input
                          type="text"
                          value={card.loc}
                          onChange={(e) => updateCard({ loc: e.target.value })}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                            dark
                              ? "bg-zinc-900 border-zinc-700"
                              : "bg-[#F5F5F7] border-zinc-200"
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${mutedText}`}>
                        Card Link (QR code target)
                      </label>
                      <input
                        type="url"
                        value={card.link}
                        onChange={(e) => updateCard({ link: e.target.value })}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                          dark
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-[#F5F5F7] border-zinc-200"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${mutedText}`}>
                          Phone (vCard)
                        </label>
                        <input
                          type="tel"
                          value={card.phone}
                          onChange={(e) => updateCard({ phone: e.target.value })}
                          placeholder="+91 ..."
                          className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                            dark
                              ? "bg-zinc-900 border-zinc-700"
                              : "bg-[#F5F5F7] border-zinc-200"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${mutedText}`}>
                          Email (vCard)
                        </label>
                        <input
                          type="email"
                          value={card.email}
                          onChange={(e) => updateCard({ email: e.target.value })}
                          placeholder="name@example.com"
                          className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                            dark
                              ? "bg-zinc-900 border-zinc-700"
                              : "bg-[#F5F5F7] border-zinc-200"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="min-h-[42px] px-4 rounded-full bg-zinc-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>{card.photo ? "Change Photo" : "Upload Photo"}</span>
                      </button>
                      {card.photo && (
                        <button
                          type="button"
                          onClick={() => updateCard({ photo: null })}
                          className={`min-h-[42px] px-4 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {editTab === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold">Card Layout</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[0, 1, 2, 3, 4, 5].map((lIdx) => {
                        const active = card.layout === lIdx;
                        return (
                          <button
                            key={lIdx}
                            type="button"
                            onClick={() => updateCard({ layout: lIdx })}
                            className={`aspect-[8/5] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                              active
                                ? "border-[#0a8f5a] ring-2 ring-[#0a8f5a]/25"
                                : dark
                                  ? "border-zinc-700"
                                  : "border-zinc-200"
                            }`}
                          >
                            <div className="w-[300%] h-[300%] origin-top-left scale-[0.3333] pointer-events-none">
                              <GcardFaceFront
                                card={{
                                  ...card,
                                  layout: lIdx,
                                  pat: 0,
                                  bg: "#f2f1ee",
                                  ink: "#111111",
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editTab === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold">Typography Style</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {GCARD_FONTS.map((fontTuple, fIdx) => {
                        const active = card.font === fIdx;
                        return (
                          <button
                            key={fontTuple[0]}
                            type="button"
                            onClick={() => updateCard({ font: fIdx })}
                            style={{
                              fontFamily: `"${fontTuple[1]}", sans-serif`,
                              fontWeight: fontTuple[2],
                            }}
                            className={`min-h-[78px] rounded-2xl border-2 text-lg cursor-pointer transition-colors ${
                              active
                                ? "border-[#0a8f5a] bg-[#0a8f5a]/10"
                                : dark
                                  ? "border-zinc-700 hover:bg-zinc-800"
                                  : "border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {fontTuple[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editTab === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-bold">Colors &amp; Contrast</h2>
                    <div>
                      <div className={`text-xs font-semibold mb-2.5 ${mutedText}`}>
                        Solid Colors
                      </div>
                      <div className="grid grid-cols-6 gap-2.5">
                        {GCARD_SOLIDS.map((c, idx) =>
                          c ? (
                            <button
                              key={idx}
                              type="button"
                              aria-label={`Color ${c[0]}`}
                              onClick={() => updateCard({ bg: c[0], ink: c[1] })}
                              className={`w-10 h-10 rounded-full border-2 cursor-pointer flex items-center justify-center ${
                                card.bg === c[0] && card.ink === c[1]
                                  ? "ring-2 ring-[#0a8f5a] ring-offset-2"
                                  : "border-zinc-300"
                              }`}
                              style={{ backgroundColor: c[0] }}
                            >
                              {c[0] === "#fafaf8" && (
                                <span className="w-3 h-3 rounded-full bg-[#111111]" />
                              )}
                            </button>
                          ) : (
                            <span key={idx} aria-hidden="true" />
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <div className={`text-xs font-semibold mb-2.5 ${mutedText}`}>
                        Curated Color Sets
                      </div>
                      <div className="grid grid-cols-6 gap-2.5">
                        {GCARD_SETS.map((pair, idx) => (
                          <button
                            key={idx}
                            type="button"
                            aria-label={`Color set ${idx + 1}`}
                            onClick={() => updateCard({ bg: pair[0], ink: pair[1] })}
                            className={`w-10 h-10 rounded-full border-2 cursor-pointer ${
                              card.bg === pair[0] && card.ink === pair[1]
                                ? "ring-2 ring-[#0a8f5a] ring-offset-2"
                                : "border-zinc-300"
                            }`}
                            style={{
                              background: `linear-gradient(90deg, ${pair[0]} 50%, ${pair[1]} 50%)`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className={`flex items-center justify-between p-3 rounded-2xl ${subtleBg}`}>
                        <span className="text-xs font-semibold">Background</span>
                        <input
                          type="color"
                          value={card.bg}
                          onChange={(e) => updateCard({ bg: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                      <label className={`flex items-center justify-between p-3 rounded-2xl ${subtleBg}`}>
                        <span className="text-xs font-semibold">Ink / Text</span>
                        <input
                          type="color"
                          value={card.ink}
                          onChange={(e) => updateCard({ ink: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {editTab === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold">Background Pattern</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {Array.from({ length: 12 }, (_, idx) => {
                        const active = card.pat === idx;
                        const patUri = getCardPatternDataUri(
                          idx,
                          dark ? "#f5f5f7" : "#333333",
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => updateCard({ pat: idx })}
                            className={`aspect-[8/5] rounded-2xl border-2 relative overflow-hidden cursor-pointer flex items-center justify-center ${
                              subtleBg
                            } ${
                              active
                                ? "border-[#0a8f5a] ring-2 ring-[#0a8f5a]/25"
                                : dark
                                  ? "border-zinc-700"
                                  : "border-zinc-200"
                            }`}
                          >
                            {idx === 0 ? (
                              <span className="text-xs font-semibold">None</span>
                            ) : (
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: patUri }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editTab === 5 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-bold">
                      Card Back Stickers &amp; Doodles
                    </h2>

                    <div>
                      <div className={`text-xs font-semibold mb-2 ${mutedText}`}>
                        Photo Cut-outs
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => cutInputRef.current?.click()}
                          className={`w-20 h-20 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            dark
                              ? "border-zinc-700 hover:bg-zinc-800"
                              : "border-zinc-300 bg-[#F5F5F7] hover:bg-zinc-200/70"
                          }`}
                        >
                          <Plus size={20} />
                          <span className="text-[11px] font-medium">Cut-out</span>
                        </button>
                        {card.cuts.map((src, idx) => (
                          <div
                            key={idx}
                            onClick={() => addStickerToBack(src, 28)}
                            className={`relative w-20 h-20 rounded-2xl border p-2 flex items-center justify-center cursor-pointer ${subtleBg}`}
                          >
                            <img
                              src={src}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                            />
                            <button
                              type="button"
                              aria-label="Remove cut-out"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCard({
                                  cuts: card.cuts.filter((_, i) => i !== idx),
                                });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className={`text-xs font-semibold mb-2 ${mutedText}`}>
                        Hand-Drawn Doodles
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setDoodleOpen(true)}
                          className={`w-20 h-20 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            dark
                              ? "border-zinc-700 hover:bg-zinc-800"
                              : "border-zinc-300 bg-[#F5F5F7] hover:bg-zinc-200/70"
                          }`}
                        >
                          <Sparkles size={18} />
                          <span className="text-[11px] font-medium">Draw</span>
                        </button>
                        {card.doods.map((src, idx) => (
                          <div
                            key={idx}
                            onClick={() => addStickerToBack(src, 34)}
                            className="relative w-20 h-20 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 flex items-center justify-center cursor-pointer"
                          >
                            <img
                              src={src}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                            />
                            <button
                              type="button"
                              aria-label="Remove doodle"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCard({
                                  doods: card.doods.filter((_, i) => i !== idx),
                                });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedSticker && selectedStickerIdx != null ? (
                      <div className={`p-4 rounded-2xl space-y-3 ${subtleBg}`}>
                        <div className="text-xs font-bold">
                          Selected Sticker Controls (drag directly on card back)
                        </div>
                        <label className="block text-xs">
                          <span className={mutedText}>
                            Size ({selectedSticker.s}%)
                          </span>
                          <input
                            type="range"
                            min={8}
                            max={80}
                            value={selectedSticker.s}
                            onChange={(e) => {
                              const nextS = Number(e.target.value);
                              updateCard({
                                st: card.st.map((item, i) =>
                                  i === selectedStickerIdx
                                    ? { ...item, s: nextS }
                                    : item,
                                ),
                              });
                            }}
                            className="w-full accent-[#0a8f5a] mt-1"
                          />
                        </label>
                        <label className="block text-xs">
                          <span className={mutedText}>
                            Rotation ({selectedSticker.r}°)
                          </span>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={selectedSticker.r}
                            onChange={(e) => {
                              const nextR = Number(e.target.value);
                              updateCard({
                                st: card.st.map((item, i) =>
                                  i === selectedStickerIdx
                                    ? { ...item, r: nextR }
                                    : item,
                                ),
                              });
                            }}
                            className="w-full accent-[#0a8f5a] mt-1"
                          />
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const picked = card.st[selectedStickerIdx];
                              const nextSt = [
                                ...card.st.filter(
                                  (_, i) => i !== selectedStickerIdx,
                                ),
                                picked,
                              ];
                              setSelectedStickerIdx(nextSt.length - 1);
                              updateCard({ st: nextSt });
                            }}
                            className="min-h-[36px] px-3.5 rounded-full bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                          >
                            Bring to Front
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateCard({
                                st: card.st.filter(
                                  (_, i) => i !== selectedStickerIdx,
                                ),
                              });
                              setSelectedStickerIdx(null);
                            }}
                            className="min-h-[36px] px-3.5 rounded-full bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Remove Sticker</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs ${mutedText}`}>
                        Tap a cut-out or doodle above to stamp it onto the card
                        back, then drag it anywhere.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {screen === "coll" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4 ${surfaceBg}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Collect a Card</h2>
                  <button
                    type="button"
                    onClick={() => setScreen("view")}
                    className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
                  >
                    Back to My Card
                  </button>
                </div>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  Paste anyone&apos;s encoded Gamura Card code below to save their
                  card to your deck.
                </p>
                <textarea
                  rows={4}
                  value={collectInput}
                  onChange={(e) => setCollectInput(e.target.value)}
                  placeholder="Paste Gamura Card code..."
                  className={`w-full rounded-2xl p-3.5 text-xs font-mono border outline-none ${
                    dark
                      ? "bg-zinc-900 border-zinc-700"
                      : "bg-[#F5F5F7] border-zinc-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCollectCard}
                  className="w-full min-h-[46px] rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-semibold cursor-pointer transition-colors"
                >
                  Collect Card
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold">
                {store.coll.length}{" "}
                {store.coll.length === 1 ? "Card" : "Cards"} Collected
              </h2>
              {store.coll.length === 0 ? (
                <div className={`rounded-3xl border p-12 text-center ${surfaceBg}`}>
                  <CreditCard size={36} className={`mx-auto mb-3 ${mutedText}`} />
                  <div className="font-semibold text-base">
                    No Collected Cards Yet
                  </div>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Copy someone&apos;s Card Code and paste it to add them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {store.coll.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-3xl border p-3.5 shadow-sm space-y-2.5 ${surfaceBg}`}
                    >
                      <div className="aspect-[8/5] rounded-2xl overflow-hidden shadow-md">
                        <GcardFaceFront card={item} />
                      </div>
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-semibold truncate">{item.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            commitStore({
                              ...store,
                              coll: store.coll.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-red-600 font-semibold cursor-pointer hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 px-2 border-t backdrop-blur-xl grid grid-cols-4 items-center ${
          dark
            ? "bg-[#09090B]/95 border-zinc-800"
            : "bg-white/95 border-zinc-200"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            setScreen("view");
          }}
          className={`flex flex-col items-center justify-center text-[11px] font-semibold cursor-pointer ${
            screen === "view" ? "text-[#0a8f5a]" : mutedText
          }`}
        >
          <CreditCard size={18} />
          <span className="mt-0.5">Card</span>
        </button>
        <button
          type="button"
          onClick={startEditing}
          className={`flex flex-col items-center justify-center text-[11px] font-semibold cursor-pointer ${
            screen === "edit" ? "text-[#0a8f5a]" : mutedText
          }`}
        >
          <PenTool size={18} />
          <span className="mt-0.5">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen("coll")}
          className={`flex flex-col items-center justify-center text-[11px] font-semibold cursor-pointer ${
            screen === "coll" ? "text-[#0a8f5a]" : mutedText
          }`}
        >
          <UserPlus size={18} />
          <span className="mt-0.5">Deck</span>
        </button>
        <button
          type="button"
          onClick={() => setConnectSheetOpen(true)}
          className={`flex flex-col items-center justify-center text-[11px] font-semibold cursor-pointer ${
            linkState.connected ? "text-[#0a8f5a]" : mutedText
          }`}
        >
          <Wallet size={18} />
          <span className="mt-0.5">Gwallet</span>
        </button>
      </nav>

      {/* Connect Gwallet Modal Sheet */}
      {connectSheetOpen && (
        <div
          onClick={() => setConnectSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl border ${surfaceBg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0a8f5a] text-white flex items-center justify-center">
                  <Link2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Connect to Gwallet</h2>
                  <p className={`text-xs ${mutedText}`}>
                    Real-time card &amp; pass bridge
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close connect sheet"
                onClick={() => setConnectSheetOpen(false)}
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Live Pass Preview Card */}
            <div
              className="rounded-2xl p-4 text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${card.bg === "#fafaf8" ? "#0a8f5a" : card.bg}, #064e3b)`,
              }}
            >
              <div className="flex items-center justify-between text-xs opacity-85 font-semibold">
                <span>🪪 GAMURA CARD PASS</span>
                <span>{linkState.connected ? "LIVE SYNCED" : "READY"}</span>
              </div>
              <div className="mt-4 font-bold text-lg truncate">{card.name}</div>
              <div className="text-xs opacity-90 truncate">{card.head}</div>
            </div>

            <div className="space-y-2.5">
              {linkState.connected ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectSheetOpen(false);
                      handleNavigate("/gwallet");
                    }}
                    className="w-full min-h-[46px] rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Gwallet</span>
                    <ArrowUpRight size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      className={`min-h-[42px] rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${subtleBg}`}
                    >
                      <RefreshCw size={14} />
                      <span>Sync Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectToggle(false)}
                      className="min-h-[42px] rounded-full bg-red-600/12 text-red-600 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Link2Off size={14} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnectToggle(true)}
                  className="w-full min-h-[46px] rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Link2 size={16} />
                  <span>Connect GAMURA CARD &amp; Gwallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Doodle Modal Sheet */}
      {doodleOpen && (
        <div
          onClick={() => setDoodleOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-3 border ${surfaceBg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Close doodle drawer"
                  onClick={() => setDoodleOpen(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
                >
                  <X size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Undo stroke"
                  onClick={() => {
                    doodleStrokesRef.current.pop();
                    redrawDoodleCanvas();
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
                >
                  <Undo2 size={16} />
                </button>
              </div>
              <span className="font-bold text-sm">Create Doodle</span>
              <button
                type="button"
                onClick={handleSaveDoodle}
                className="min-h-[38px] px-4 rounded-full bg-[#0a8f5a] text-white text-xs font-semibold cursor-pointer"
              >
                Add Doodle
              </button>
            </div>

            <canvas
              ref={doodleCanvasRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const stroke = { w: penSize * 2, p: [toCanvasPoint(e)] };
                activeStrokeRef.current = stroke;
                doodleStrokesRef.current.push(stroke);
                redrawDoodleCanvas();
              }}
              onPointerMove={(e) => {
                if (!activeStrokeRef.current) return;
                activeStrokeRef.current.p.push(toCanvasPoint(e));
                redrawDoodleCanvas();
              }}
              onPointerUp={() => {
                activeStrokeRef.current = null;
              }}
              className="w-full h-64 bg-[#F2F1EE] rounded-2xl touch-none block cursor-crosshair"
            />

            <label className="flex items-center justify-between gap-4 text-xs font-semibold px-1">
              <span className={mutedText}>Pen Size ({penSize}px)</span>
              <input
                type="range"
                min={3}
                max={20}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-48 accent-[#0a8f5a]"
              />
            </label>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            shrinkImage(f, 360, "image/jpeg", (url) =>
              updateCard({ photo: url }),
            );
          }
          e.target.value = "";
        }}
      />
      <input
        ref={cutInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            shrinkImage(f, 320, "image/png", (url) =>
              updateCard({ cuts: [...card.cuts, url] }),
            );
          }
          e.target.value = "";
        }}
      />

      {toastMsg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-8 z-50 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xl whitespace-nowrap"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
