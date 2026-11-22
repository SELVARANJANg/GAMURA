import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Cloud,
  Copy,
  CreditCard,
  Delete,
  ExternalLink,
  Link2,
  Link2Off,
  Lock,
  Moon,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Smartphone,
  Sun,
  Trash2,
  Wallet,
  Wifi,
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
  GCARD_SYNCED_PASS_ID,
  GWALLET_PALETTES,
  GWALLET_TYPES,
  buildPairingQrUrl,
  connectCardAndWallet,
  createSeedWalletCards,
  disconnectCardAndWallet,
  getLatestSyncPulse,
  joinQrPairingSession,
  pushCardWalletVaultToCloud,
  readCardWalletLink,
  readCardWalletPairState,
  readGcardStore,
  readGwalletStore,
  saveGwalletState,
  startQrPairingSession,
  subscribeCloudCardWalletVault,
  subscribeLocalCardWalletSync,
  subscribeQrPairingSession,
  subscribeSyncPulse,
  type CardWalletLinkState,
  type CardWalletPairState,
  type GcardState,
  type GwalletPass,
  type GwalletPassType,
  type GwalletStorePayload,
  type SyncPulseState,
} from "../utils/gamuraCardWalletSync";
import CardWalletSyncIndicator from "./CardWalletSyncIndicator";

interface GamuraWalletPageProps {
  onBackHome: () => void;
  onNavigateUrl?: (path: string) => void;
}

const MERCHANTS = [
  "Gamura Cafe",
  "Campus Store",
  "Metro Ticket",
  "Gamura Games",
];

function formatInr(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function maskPassValue(card: GwalletPass): string {
  if (card.type === "pay") return formatInr(card.bal || 0);
  if (card.linkedGcard) return card.num;
  return `•••• ${String(card.num || "0000").slice(-4)}`;
}

function WalletPassCard({
  pass,
  onClick,
  selected = false,
  stacked = false,
  stackIndex = 0,
}: {
  pass: GwalletPass;
  onClick?: () => void;
  selected?: boolean;
  stacked?: boolean;
  stackIndex?: number;
}) {
  const [sheen, setSheen] = useState({ mx: 25, my: 0, ang: 0 });
  const pal = GWALLET_PALETTES[pass.col] || GWALLET_PALETTES[0];
  const colorA = pass.customColors?.[0] || pal[0];
  const colorB = pass.customColors?.[1] || pal[1];
  const textColor =
    pass.customColors?.[2] || (pal[2] ? "#111111" : "#FFFFFF");
  const typeMeta = GWALLET_TYPES[pass.type] || GWALLET_TYPES.pass;

  return (
    <div
      onClick={onClick}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        setSheen({ mx: x, my: y, ang: x * 3.6 });
      }}
      style={{
        background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
        color: textColor,
        zIndex: stacked ? stackIndex + 1 : undefined,
      }}
      className={`relative aspect-[1.586/1] rounded-[22px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),0_-4px_14px_rgba(0,0,0,0.12),0_14px_28px_rgba(0,0,0,0.22)] transition-transform duration-200 ${
        onClick ? "cursor-pointer active:scale-[0.985]" : ""
      } ${stacked && stackIndex > 0 ? "-mt-24 sm:-mt-28 hover:-translate-y-2" : ""} ${
        selected ? "ring-3 ring-[#10b981] ring-offset-2" : ""
      }`}
    >
      {/* Concentric Vector Pattern */}
      <svg
        viewBox="0 0 230 230"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
        className="absolute -right-10 -top-10 w-56 pointer-events-none"
      >
        <circle cx="115" cy="115" r="40" />
        <circle cx="115" cy="115" r="70" />
        <circle cx="115" cy="115" r="100" />
        <circle cx="115" cy="115" r="140" strokeDasharray="3 7" />
      </svg>

      {/* Holographic Iridescence */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-15 mix-blend-color-dodge"
        style={{
          background: `conic-gradient(from ${sheen.ang}deg at 50% 50%, #ff7ab8, #7affc8, #7ab8ff, #ffe27a, #ff7ab8)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          background: `radial-gradient(circle at ${sheen.mx}% ${sheen.my}%, rgba(255,255,255,0.42), transparent 48%)`,
        }}
      />

      <div className="relative flex items-center justify-between gap-2 font-bold text-base">
        <span className="truncate">
          {typeMeta[1]} {pass.name}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80 shrink-0">
          {pass.linkedGcard ? "GCARD SYNC" : typeMeta[0]}
        </span>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="text-xs opacity-85 truncate max-w-[56%]">
          {pass.sub || ""}
        </span>
        <b className="text-lg sm:text-xl tracking-tight tabular-nums truncate">
          {maskPassValue(pass)}
        </b>
      </div>
    </div>
  );
}

export default function GamuraWalletPage({
  onBackHome,
  onNavigateUrl,
}: GamuraWalletPageProps) {
  const [wallet, setWallet] = useState<GwalletStorePayload>(() =>
    readGwalletStore(),
  );
  const [gcardState, setGcardState] = useState<GcardState>(
    () => readGcardStore().card,
  );
  const [linkState, setLinkState] = useState<CardWalletLinkState>(() =>
    readCardWalletLink(),
  );
  const [filterType, setFilterType] = useState<"all" | GwalletPassType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePassId, setActivePassId] = useState<string | null>(
    () => readGwalletStore().cards[0]?.id ?? null,
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(false);

  // Modal Sheets
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingPassId, setEditingPassId] = useState<string | null>(null);
  const [fType, setFType] = useState<GwalletPassType>("pay");
  const [fName, setFName] = useState<string>("");
  const [fSub, setFSub] = useState<string>("");
  const [fNum, setFNum] = useState<string>("");
  const [fBal, setFBal] = useState<string>("");
  const [fCol, setFCol] = useState<number>(0);

  // Tap-to-Pay / Add Money Sub-Views
  const [subMode, setSubMode] = useState<
    "detail" | "pay" | "nfc" | "paid" | "addMoney"
  >("detail");
  const [selectedMerchantIdx, setSelectedMerchantIdx] = useState<number>(0);
  const [payAmount, setPayAmount] = useState<string>("50");
  const [addMoneyAmount, setAddMoneyAmount] = useState<string>("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Settings / Connect / QR Pairing / PIN Lock
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState<boolean>(false);
  const [confirmResetWallet, setConfirmResetWallet] = useState<boolean>(false);
  const [syncPulse, setSyncPulse] = useState<SyncPulseState>(() =>
    getLatestSyncPulse(),
  );
  const [pairState, setPairState] = useState<CardWalletPairState | null>(() =>
    readCardWalletPairState(),
  );
  const [manualPairInput, setManualPairInput] = useState<string>("");
  const [pairBusy, setPairBusy] = useState<boolean>(false);
  const [pairError, setPairError] = useState<string | null>(null);

  // 4-Digit PIN Overlay
  const [lockVisible, setLockVisible] = useState<boolean>(() =>
    Boolean(readGwalletStore().pin),
  );
  const [lockMode, setLockMode] = useState<"ask" | "set">("ask");
  const [lockTitle, setLockTitle] = useState<string>("Unlock Gamura Wallet");
  const [lockCancelable, setLockCancelable] = useState<boolean>(false);
  const [pinBuffer, setPinBuffer] = useState<string>("");
  const pendingPinActionRef = useRef<((pin: string) => void) | null>(null);

  // Auth & Launch Store install state
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(
    () => auth.currentUser,
  );
  const [isInstalledInUniverse, setIsInstalledInUniverse] = useState<boolean>(
    () =>
      readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
        (x) => x.id === "gamura-gwallet",
      ),
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  useEffect(() => {
    const prev = document.title;
    document.title = "Gwallet (GAMURA WALLET)";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    return subscribeLocalCardWalletSync(({ gcard, gwallet, link }) => {
      setWallet(gwallet);
      setGcardState(gcard.card);
      setLinkState(link);
      setPairState(readCardWalletPairState());
    });
  }, []);

  useEffect(() => {
    return subscribeSyncPulse((pulse) => {
      setSyncPulse(pulse);
    });
  }, []);

  // Auto-join QR pairing session when opened via ?pair=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingPair = params.get("pair");
    if (!incomingPair) return;
    window.history.replaceState({}, "", window.location.pathname);
    setPairBusy(true);
    void joinQrPairingSession(incomingPair, "gwallet").then((res) => {
      setPairBusy(false);
      if (res.ok && res.pairCode) {
        setWallet(readGwalletStore());
        setGcardState(readGcardStore().card);
        setLinkState(readCardWalletLink());
        setPairState(readCardWalletPairState());
        setActivePassId(GCARD_SYNCED_PASS_ID);
        showToast(`Paired with GAMURA CARD (${res.pairCode})`);
      } else {
        showToast(res.error || "QR pairing code expired");
      }
    });
  }, []);

  // Subscribe to active Firestore QR pairing channel
  useEffect(() => {
    if (!pairState?.pairCode) return;
    return subscribeQrPairingSession(
      pairState.pairCode,
      "gwallet",
      ({ gcard, gwallet, link }) => {
        setWallet(gwallet);
        setGcardState(gcard.card);
        setLinkState(link);
        setPairState(readCardWalletPairState());
      },
      () => {
        setLinkState(readCardWalletLink());
        setPairState(null);
        showToast("Sync access disconnected from GAMURA CARD");
      },
    );
  }, [pairState?.pairCode]);

  useEffect(() => {
    if (!authUser) return;
    return subscribeCloudCardWalletVault(
      authUser.uid,
      "gwallet",
      ({ gcard, gwallet, link }) => {
        setWallet(gwallet);
        setGcardState(gcard.card);
        setLinkState(link);
      },
    );
  }, [authUser]);

  useEffect(() => {
    const refreshInstalled = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setIsInstalledInUniverse(list.some((x) => x.id === "gamura-gwallet"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, refreshInstalled);
    return () =>
      window.removeEventListener(UNIVERSE_APPS_EVENT, refreshInstalled);
  }, []);

  const dark = wallet.darkMode;

  const commitWallet = (
    next: GwalletStorePayload,
    syncBackToGcard = false,
  ) => {
    setWallet(next);
    const { link, gcard } = saveGwalletState(next, {
      uid: authUser?.uid,
      syncBackToGcard,
    });
    setLinkState(link);
    setGcardState(gcard.card);
  };

  const totalBalance = useMemo(
    () =>
      wallet.cards
        .filter((c) => c.type === "pay")
        .reduce((sum, c) => sum + (Number(c.bal) || 0), 0),
    [wallet.cards],
  );

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wallet.cards.filter((c) => {
      const typeOk = filterType === "all" || c.type === filterType;
      const textOk =
        !q ||
        `${c.name} ${c.sub} ${c.num}`.toLowerCase().includes(q);
      return typeOk && textOk;
    });
  }, [wallet.cards, filterType, searchQuery]);

  const activePass = useMemo(
    () =>
      wallet.cards.find((c) => c.id === activePassId) ||
      filteredCards[0] ||
      null,
    [wallet.cards, activePassId, filteredCards],
  );

  const handleNavigate = (path: string) => {
    if (onNavigateUrl) {
      onNavigateUrl(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleToggleUniverseInstall = () => {
    const catalogApp = BUILTIN_STORE_APPS.find(
      (a) => a.id === "gamura-gwallet",
    );
    if (!catalogApp) return;
    if (isInstalledInUniverse) {
      removeAppFromUniverse("gamura-gwallet");
      showToast("Removed Gwallet from Universe Apps");
    } else {
      addAppToUniverse(catalogApp);
      showToast("Added Gwallet to Universe Apps");
    }
  };

  const pairingQrUrl = useMemo(
    () =>
      pairState?.pairCode
        ? buildPairingQrUrl("gcard", pairState.pairCode)
        : "",
    [pairState?.pairCode],
  );

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("Copy blocked by browser");
    }
  };

  const handleConnectToggle = (connect: boolean) => {
    if (connect) {
      const { link, gcard, wallet: nextW } = connectCardAndWallet(
        "gwallet",
        authUser?.uid,
      );
      setLinkState(link);
      setGcardState(gcard.card);
      setWallet(nextW);
      setActivePassId(GCARD_SYNCED_PASS_ID);
      showToast("Connected & live synced with GAMURA CARD");
    } else {
      const link = disconnectCardAndWallet("gwallet", authUser?.uid);
      setLinkState(link);
      setPairState(null);
      setPairError(null);
      showToast("Disconnected live sync from GAMURA CARD");
    }
  };

  const handleOpenConnectQr = async (forceNew = false) => {
    setConnectSheetOpen(true);
    setPairError(null);
    if (!forceNew && pairState?.pairCode) return;
    setPairBusy(true);
    try {
      await startQrPairingSession("gwallet", { forceNew });
      setLinkState(readCardWalletLink());
      setWallet(readGwalletStore());
      setGcardState(readGcardStore().card);
      setPairState(readCardWalletPairState());
      if (forceNew) {
        showToast("Generated new QR pairing code");
      }
    } finally {
      setPairBusy(false);
    }
  };

  const handleJoinManualPair = async () => {
    if (!manualPairInput.trim()) {
      setPairError("Enter a pair code or link from Gcard");
      return;
    }
    setPairBusy(true);
    setPairError(null);
    const res = await joinQrPairingSession(manualPairInput, "gwallet");
    setPairBusy(false);
    if (res.ok && res.pairCode) {
      setWallet(readGwalletStore());
      setGcardState(readGcardStore().card);
      setLinkState(readCardWalletLink());
      setPairState(readCardWalletPairState());
      setActivePassId(GCARD_SYNCED_PASS_ID);
      setManualPairInput("");
      showToast(`Paired with GAMURA CARD (${res.pairCode})`);
    } else {
      setPairError(res.error || "Unable to pair with that code");
    }
  };

  const handleManualSync = async () => {
    if (linkState.connected) {
      const { wallet: nextW, gcard } = connectCardAndWallet(
        "gwallet",
        authUser?.uid,
      );
      setWallet(nextW);
      setGcardState(gcard.card);
    } else {
      commitWallet(wallet);
    }
    if (authUser) {
      await pushCardWalletVaultToCloud(authUser.uid, "gwallet");
    }
    showToast(
      authUser
        ? "Synced live across Gcard & Gamura Cloud"
        : "Synced live with Gcard",
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

  const openAddForm = (passToEdit?: GwalletPass | null) => {
    if (passToEdit) {
      setEditingPassId(passToEdit.id);
      setFType(passToEdit.type);
      setFName(passToEdit.name);
      setFSub(passToEdit.sub);
      setFNum(passToEdit.num);
      setFBal(
        passToEdit.bal != null ? String(passToEdit.bal) : "",
      );
      setFCol(passToEdit.col);
    } else {
      setEditingPassId(null);
      setFType("pay");
      setFName("");
      setFSub("");
      setFNum("");
      setFBal("");
      setFCol(0);
    }
    setFormOpen(true);
  };

  const handleSaveForm = () => {
    const cleanName = fName.trim();
    if (!cleanName) {
      showToast("Enter a pass or card name");
      return;
    }
    const cleanNum =
      fNum.trim() || String(Math.floor(100000000000 + Math.random() * 899999999999));

    if (editingPassId) {
      const target = wallet.cards.find((c) => c.id === editingPassId);
      const isLinked = Boolean(target?.linkedGcard || editingPassId === GCARD_SYNCED_PASS_ID);
      const nextCards = wallet.cards.map((c) => {
        if (c.id !== editingPassId) return c;
        return {
          ...c,
          type: fType,
          name: cleanName,
          sub: fSub.trim(),
          num: cleanNum,
          col: fCol,
          bal: fType === "pay" || fType === "gift" ? Number(fBal) || 0 : undefined,
          cardLink: isLinked ? cleanNum : c.cardLink,
          updatedAtMs: Date.now(),
        };
      });
      commitWallet({ ...wallet, cards: nextCards }, isLinked);
      setFormOpen(false);
      showToast(isLinked ? "Updated & synced to Gcard" : "Pass updated");
    } else {
      const newId = `gw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newPass: GwalletPass = {
        id: newId,
        type: fType,
        name: cleanName,
        sub: fSub.trim(),
        num: cleanNum,
        col: fCol,
        tx: [],
        ...(fType === "pay" || fType === "gift"
          ? { bal: Number(fBal) || 0 }
          : {}),
      };
      commitWallet({ ...wallet, cards: [newPass, ...wallet.cards] });
      setActivePassId(newId);
      setFormOpen(false);
      showToast("Added to Gwallet");
    }
  };

  const executeTapToPay = () => {
    if (!activePass || activePass.type !== "pay") return;
    const amt = Number(payAmount);
    if (!(amt > 0)) {
      showToast("Enter a valid amount");
      return;
    }
    if (amt > (activePass.bal || 0)) {
      showToast("Insufficient card balance");
      return;
    }

    const startNfc = () => {
      setSubMode("nfc");
      window.setTimeout(() => {
        const merchantName = MERCHANTS[selectedMerchantIdx] || MERCHANTS[0];
        const nextCards = wallet.cards.map((c) =>
          c.id === activePass.id
            ? {
                ...c,
                bal: (c.bal || 0) - amt,
                tx: [
                  { t: merchantName, a: -amt, d: Date.now() },
                  ...(c.tx || []),
                ],
              }
            : c,
        );
        commitWallet({ ...wallet, cards: nextCards });
        setSubMode("paid");
      }, 1500);
    };

    if (wallet.pin) {
      setLockMode("ask");
      setLockTitle("Confirm Payment");
      setLockCancelable(true);
      setPinBuffer("");
      pendingPinActionRef.current = () => startNfc();
      setLockVisible(true);
    } else {
      startNfc();
    }
  };

  const handleAddMoney = () => {
    if (!activePass || activePass.type !== "pay") return;
    const amt = Number(addMoneyAmount);
    if (!(amt > 0)) {
      showToast("Enter a valid amount");
      return;
    }
    const nextCards = wallet.cards.map((c) =>
      c.id === activePass.id
        ? {
            ...c,
            bal: (c.bal || 0) + amt,
            tx: [
              { t: "Added money", a: amt, d: Date.now() },
              ...(c.tx || []),
            ],
          }
        : c,
    );
    commitWallet({ ...wallet, cards: nextCards });
    setAddMoneyAmount("");
    setSubMode("detail");
    showToast(`Added ${formatInr(amt)}`);
  };

  const handleRemovePass = (pass: GwalletPass) => {
    if (confirmRemoveId !== pass.id) {
      setConfirmRemoveId(pass.id);
      window.setTimeout(() => setConfirmRemoveId(null), 3500);
      return;
    }
    const remaining = wallet.cards.filter((c) => c.id !== pass.id);
    commitWallet({ ...wallet, cards: remaining });
    setConfirmRemoveId(null);
    setActivePassId(remaining[0]?.id ?? null);
    setMobileDetailOpen(false);
    showToast("Removed from wallet");
  };

  const handlePinKey = (key: string) => {
    if (key === "⌫") {
      setPinBuffer((p) => p.slice(0, -1));
      return;
    }
    if (pinBuffer.length >= 4) return;
    const next = pinBuffer + key;
    setPinBuffer(next);
    if (next.length === 4) {
      window.setTimeout(() => {
        if (lockMode === "set" || next === wallet.pin) {
          setLockVisible(false);
          setPinBuffer("");
          const cb = pendingPinActionRef.current;
          pendingPinActionRef.current = null;
          cb?.(next);
        } else {
          setLockTitle("Wrong PIN, try again");
          setPinBuffer("");
        }
      }, 150);
    }
  };

  const handleTogglePinLock = () => {
    if (wallet.pin) {
      setLockMode("ask");
      setLockTitle("Enter PIN to Turn Off");
      setLockCancelable(true);
      setPinBuffer("");
      pendingPinActionRef.current = () => {
        commitWallet({ ...wallet, pin: null });
        showToast("PIN lock removed");
      };
      setLockVisible(true);
    } else {
      setLockMode("set");
      setLockTitle("Create 4-Digit PIN");
      setLockCancelable(true);
      setPinBuffer("");
      pendingPinActionRef.current = (newPin) => {
        commitWallet({ ...wallet, pin: newPin });
        showToast("4-digit PIN lock set");
      };
      setLockVisible(true);
    }
  };

  const rootBg = dark
    ? "bg-[#09090B] text-[#F5F5F7]"
    : "bg-[#F2F2F7] text-[#1D1D1F]";
  const surfaceBg = dark
    ? "bg-[#1C1C1E] border-zinc-800"
    : "bg-white border-zinc-200/80";
  const subtleBg = dark ? "bg-[#2C2C2E]" : "bg-[#EFEFF4]";
  const mutedText = dark ? "text-zinc-400" : "text-[#6E6E73]";

  const renderInspectorContent = (pass: GwalletPass) => {
    const passQrValue = pass.linkedGcard
      ? pass.cardLink || gcardState.link || "https://gamura.vercel.app"
      : `gamura-wallet:${pass.type}:${pass.num}`;

    if (subMode === "pay" && pass.type === "pay") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Tap to Pay</h3>
            <button
              type="button"
              onClick={() => setSubMode("detail")}
              className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
            >
              Back
            </button>
          </div>
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${mutedText}`}>
              Merchant
            </div>
            <div className="flex flex-wrap gap-2">
              {MERCHANTS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMerchantIdx(idx)}
                  className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    selectedMerchantIdx === idx
                      ? "bg-[#0a8f5a] text-white"
                      : subtleBg
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${mutedText}`}>
              Amount (₹ INR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className={`w-full rounded-2xl px-4 py-3 text-lg font-bold tabular-nums outline-none border ${
                dark
                  ? "bg-zinc-900 border-zinc-700"
                  : "bg-[#EFEFF4] border-zinc-200"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={executeTapToPay}
            className="w-full min-h-[48px] rounded-2xl bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-bold cursor-pointer transition-colors"
          >
            Hold Near Reader
          </button>
          <p className={`text-[11px] text-center ${mutedText}`}>
            Simulated payment · Updates live wallet balance and ledger
          </p>
        </div>
      );
    }

    if (subMode === "nfc") {
      return (
        <div className="py-12 text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-[#0a8f5a] animate-ping opacity-40" />
            <div className="w-16 h-16 rounded-full bg-[#0a8f5a] text-white flex items-center justify-center shadow-lg">
              <Wifi size={28} />
            </div>
          </div>
          <div className="text-lg font-bold">Hold near the reader…</div>
          <p className={`text-xs ${mutedText}`}>
            Authorizing {formatInr(Number(payAmount) || 0)}
          </p>
        </div>
      );
    }

    if (subMode === "paid") {
      return (
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#0a8f5a] text-white mx-auto flex items-center justify-center shadow-lg">
            <Check size={32} />
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {formatInr(Number(payAmount) || 0)} Paid
          </div>
          <p className={`text-xs ${mutedText}`}>
            {MERCHANTS[selectedMerchantIdx]} · Remaining balance{" "}
            {formatInr(pass.bal || 0)}
          </p>
          <button
            type="button"
            onClick={() => setSubMode("detail")}
            className="w-full min-h-[46px] rounded-2xl bg-[#0a8f5a] text-white text-sm font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      );
    }

    if (subMode === "addMoney" && pass.type === "pay") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Add Money</h3>
            <button
              type="button"
              onClick={() => setSubMode("detail")}
              className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
            >
              Back
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAddMoneyAmount(String(amt))}
                className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer tabular-nums ${subtleBg}`}
              >
                +{formatInr(amt)}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Custom amount (₹)"
            value={addMoneyAmount}
            onChange={(e) => setAddMoneyAmount(e.target.value)}
            className={`w-full rounded-2xl px-4 py-3 text-base font-bold tabular-nums outline-none border ${
              dark
                ? "bg-zinc-900 border-zinc-700"
                : "bg-[#EFEFF4] border-zinc-200"
            }`}
          />
          <button
            type="button"
            onClick={handleAddMoney}
            className="w-full min-h-[48px] rounded-2xl bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-bold cursor-pointer"
          >
            Add Funds
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <WalletPassCard pass={pass} />

        {pass.linkedGcard && (
          <div className="rounded-2xl p-3.5 bg-[#0a8f5a]/10 border border-[#0a8f5a]/25 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0a8f5a]">
                Live Synced from GAMURA CARD (Gcard)
              </div>
              <p className={`text-[11px] truncate ${mutedText}`}>
                Edits on either Gcard or this pass stay synchronized in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate("/gcard")}
              className="min-h-[34px] px-3 rounded-full bg-[#0a8f5a] text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Open Gcard</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        )}

        {pass.type === "pay" ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSubMode("pay")}
                className="min-h-[46px] rounded-2xl bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-bold cursor-pointer transition-colors"
              >
                Tap to Pay
              </button>
              <button
                type="button"
                onClick={() => setSubMode("addMoney")}
                className={`min-h-[46px] rounded-2xl text-sm font-bold cursor-pointer transition-colors ${subtleBg}`}
              >
                Add Money
              </button>
            </div>

            <div>
              <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${mutedText}`}>
                Recent Activity
              </div>
              {(pass.tx || []).length > 0 ? (
                <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {(pass.tx || []).slice(0, 12).map((tx, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-medium">{tx.t}</div>
                        <div className={`text-[11px] ${mutedText}`}>
                          {new Date(tx.d).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          tx.a > 0 ? "text-[#0a8f5a]" : ""
                        }`}
                      >
                        {tx.a > 0 ? "+" : "−"}
                        {formatInr(Math.abs(tx.a))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs py-4 text-center ${mutedText}`}>
                  No transactions yet
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center space-y-2 py-2">
            <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 inline-block shadow-xs">
              <QRCodeSVG
                value={passQrValue}
                size={180}
                level="M"
                fgColor="#111111"
                bgColor="#FFFFFF"
              />
            </div>
            <div className={`text-xs font-mono tracking-wider ${mutedText}`}>
              {pass.num}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => openAddForm(pass)}
            className={`min-h-[44px] rounded-2xl text-xs font-bold cursor-pointer ${subtleBg}`}
          >
            Edit Pass
          </button>
          <button
            type="button"
            onClick={() => handleRemovePass(pass)}
            className={`min-h-[44px] rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              confirmRemoveId === pass.id
                ? "bg-red-600 text-white"
                : "bg-red-600/12 text-red-600"
            }`}
          >
            <Trash2 size={13} />
            <span>
              {confirmRemoveId === pass.id ? "Tap Again to Remove" : "Remove"}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${rootBg} transition-colors duration-200`}>
      {/* Compact Top App Bar */}
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
            className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center cursor-pointer ${
              dark
                ? "hover:bg-zinc-800 text-zinc-200"
                : "hover:bg-zinc-100 text-zinc-800"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
            Gwallet
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`whitespace-nowrap cursor-pointer ${
              filterType === "all" ? "text-[#0a8f5a] font-semibold" : mutedText
            }`}
          >
            All Passes
          </button>
          <button
            type="button"
            onClick={() => setFilterType("pay")}
            className={`whitespace-nowrap cursor-pointer ${
              filterType === "pay" ? "text-[#0a8f5a] font-semibold" : mutedText
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => setFilterType("id")}
            className={`whitespace-nowrap cursor-pointer ${
              filterType === "id" ? "text-[#0a8f5a] font-semibold" : mutedText
            }`}
          >
            IDs &amp; Gcard
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/gcard")}
            className={`whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${mutedText} hover:text-current`}
          >
            <span>Open Gcard</span>
            <ArrowUpRight size={14} />
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {linkState.connected && (
            <div className="hidden sm:flex items-center px-1">
              <CardWalletSyncIndicator
                connected={linkState.connected}
                pulse={syncPulse}
                pairState={pairState}
                dark={dark}
                variant="compact"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleOpenConnectQr(false)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              linkState.connected
                ? "bg-[#0a8f5a] text-white hover:bg-[#08774b]"
                : dark
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            <CreditCard size={14} />
            <span>
              {linkState.connected
                ? syncPulse.phase === "syncing"
                  ? "Syncing..."
                  : "Gcard Connected"
                : "Connect Gcard"}
            </span>
          </button>

          <button
            type="button"
            aria-label="Wallet settings"
            onClick={() => setSettingsOpen(true)}
            className={`min-h-[38px] min-w-[38px] rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Responsive Two-Column Desktop / Stacked Mobile Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Balance + Connect Bridge + Filter/Search + Apple Card Stack */}
          <div className="lg:col-span-6 space-y-5">
            {/* Balance Hero Card */}
            <div className="rounded-[26px] p-6 bg-gradient-to-br from-[#0b3d2a] to-[#05150f] text-white relative overflow-hidden shadow-lg">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 w-44 h-44 rounded-full border-[24px] border-[#10d98a]/20"
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-75 font-semibold">
                    Gamura Balance
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight tabular-nums mt-1">
                    {formatInr(totalBalance)}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => openAddForm(null)}
                  className="min-h-[40px] px-4 rounded-full bg-white text-[#05150f] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 transition-colors shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Pass</span>
                </button>
              </div>
              <div className="relative mt-4 text-xs text-white/75 flex items-center gap-2 flex-wrap">
                <span>{wallet.cards.length} items in wallet</span>
                <span aria-hidden="true">·</span>
                <span>
                  {linkState.connected
                    ? `Gcard live synced (${gcardState.name})`
                    : "Tap Connect Gcard to sync your business card"}
                </span>
              </div>
            </div>

            {/* Dedicated Connect Gcard Action Bar with Sync Indicator & Disconnect */}
            <div className={`rounded-3xl border p-4 sm:p-5 shadow-sm space-y-3.5 ${surfaceBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#0a8f5a]/15 text-[#0a8f5a] flex items-center justify-center shrink-0">
                    <Link2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">
                      {linkState.connected
                        ? "Connected to GAMURA CARD"
                        : "Connect GAMURA CARD (Gcard)"}
                    </div>
                    <div className={`text-xs truncate ${mutedText}`}>
                      {linkState.connected
                        ? `${gcardState.name} synced in real time`
                        : "Sync your digital business card right into Gwallet"}
                    </div>
                  </div>
                </div>

                {linkState.connected ? (
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${subtleBg}`}
                    >
                      <RefreshCw
                        size={12}
                        className={
                          syncPulse.phase === "syncing" ? "animate-spin" : ""
                        }
                      />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOpenConnectQr(false)}
                      className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${subtleBg}`}
                    >
                      <QrCode size={12} />
                      <span>QR Pair</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/gcard")}
                      className="min-h-[36px] px-3.5 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Open Gcard</span>
                      <ArrowUpRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectToggle(false)}
                      className="min-h-[36px] px-3 rounded-full bg-red-600/12 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Link2Off size={12} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleConnectToggle(true)}
                      className="min-h-[38px] px-4 rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Link2 size={13} />
                      <span>Connect Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOpenConnectQr(false)}
                      className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${subtleBg}`}
                    >
                      <QrCode size={13} />
                      <span>QR Pair</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Animated Live Syncing... Transfer Indicator */}
              <CardWalletSyncIndicator
                connected={linkState.connected}
                pulse={syncPulse}
                pairState={pairState}
                dark={dark}
                variant="full"
              />
            </div>

            {/* Filter Chips + Search */}
            <div className="space-y-2.5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(
                  [
                    ["all", "All"],
                    ...Object.entries(GWALLET_TYPES).map(([k, v]) => [
                      k,
                      `${v[1]} ${v[0]}`,
                    ]),
                  ] as [string, string][]
                ).map(([key, label]) => {
                  const active = filterType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setFilterType(key as "all" | GwalletPassType)
                      }
                      className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                        active
                          ? dark
                            ? "bg-white text-black border-white"
                            : "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                          : `${surfaceBg}`
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${mutedText}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cards, passes, or IDs..."
                  className={`w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border ${
                    dark
                      ? "bg-[#1C1C1E] border-zinc-800"
                      : "bg-white border-zinc-200/80"
                  }`}
                />
              </div>
            </div>

            {/* Interactive Card Stack */}
            {filteredCards.length === 0 ? (
              <div className={`rounded-3xl border p-10 text-center ${surfaceBg}`}>
                <Wallet size={36} className={`mx-auto mb-2 ${mutedText}`} />
                <div className="font-semibold">No Matching Passes</div>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Tap Add Pass or Connect Gcard to fill your wallet.
                </p>
              </div>
            ) : (
              <div className="pt-1 pb-2">
                {filteredCards.map((pass, idx) => (
                  <WalletPassCard
                    key={pass.id}
                    pass={pass}
                    stacked
                    stackIndex={idx}
                    selected={activePass?.id === pass.id}
                    onClick={() => {
                      setActivePassId(pass.id);
                      setSubMode("detail");
                      setConfirmRemoveId(null);
                      if (window.innerWidth < 1024) {
                        setMobileDetailOpen(true);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Desktop Inspector) */}
          <div className="hidden lg:block lg:col-span-6 lg:sticky lg:top-20">
            <div className={`rounded-3xl border p-6 shadow-sm ${surfaceBg}`}>
              {activePass ? (
                renderInspectorContent(activePass)
              ) : (
                <div className="py-16 text-center space-y-2">
                  <Smartphone size={32} className={`mx-auto ${mutedText}`} />
                  <div className="font-semibold">Select a Card or Pass</div>
                  <p className={`text-xs ${mutedText}`}>
                    Click any item on the left stack to inspect QR codes, pay, or
                    add funds.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Fixed CTA */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <button
          type="button"
          onClick={() => openAddForm(null)}
          className={`min-h-[48px] px-7 rounded-full font-bold text-sm shadow-2xl inline-flex items-center gap-2 cursor-pointer ${
            dark ? "bg-white text-black" : "bg-[#1D1D1F] text-white"
          }`}
        >
          <Plus size={16} />
          <span>Add to Wallet</span>
        </button>
      </div>

      {/* Mobile Pass Detail Bottom Sheet */}
      {mobileDetailOpen && activePass && (
        <div
          onClick={() => setMobileDetailOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl p-5 border ${surfaceBg}`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-400/50 mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold truncate">{activePass.name}</h2>
              <button
                type="button"
                aria-label="Close pass details"
                onClick={() => setMobileDetailOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
              >
                <X size={15} />
              </button>
            </div>
            {renderInspectorContent(activePass)}
          </div>
        </div>
      )}

      {/* Add / Edit Pass Modal */}
      {formOpen && (
        <div
          onClick={() => setFormOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 border shadow-2xl ${surfaceBg}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingPassId ? "Edit Pass" : "Add to Wallet"}
              </h2>
              <button
                type="button"
                aria-label="Close pass form"
                onClick={() => setFormOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(GWALLET_TYPES) as [GwalletPassType, [string, string]][]).map(
                ([k, meta]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFType(k)}
                    className={`min-h-[34px] px-3 rounded-full text-xs font-semibold cursor-pointer ${
                      fType === k ? "bg-[#0a8f5a] text-white" : subtleBg
                    }`}
                  >
                    {meta[1]} {meta[0]}
                  </button>
                ),
              )}
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Name (e.g. Gamura Pay)"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                  dark
                    ? "bg-zinc-900 border-zinc-700"
                    : "bg-[#EFEFF4] border-zinc-200"
                }`}
              />
              <input
                type="text"
                placeholder="Subtitle / issuer"
                value={fSub}
                onChange={(e) => setFSub(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                  dark
                    ? "bg-zinc-900 border-zinc-700"
                    : "bg-[#EFEFF4] border-zinc-200"
                }`}
              />
              <input
                type="text"
                placeholder={
                  fType === "pay" ? "Card number" : "Pass / ticket / ID number"
                }
                value={fNum}
                onChange={(e) => setFNum(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                  dark
                    ? "bg-zinc-900 border-zinc-700"
                    : "bg-[#EFEFF4] border-zinc-200"
                }`}
              />
              {(fType === "pay" || fType === "gift") && (
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Balance (₹)"
                  value={fBal}
                  onChange={(e) => setFBal(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                    dark
                      ? "bg-zinc-900 border-zinc-700"
                      : "bg-[#EFEFF4] border-zinc-200"
                  }`}
                />
              )}
            </div>

            <div>
              <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${mutedText}`}>
                Card Color
              </div>
              <div className="flex flex-wrap gap-2.5">
                {GWALLET_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Palette ${idx + 1}`}
                    onClick={() => setFCol(idx)}
                    style={{
                      background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})`,
                    }}
                    className={`w-9 h-9 rounded-full border border-zinc-300 cursor-pointer ${
                      fCol === idx ? "ring-2 ring-[#0a8f5a] ring-offset-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <WalletPassCard
              pass={{
                id: "preview",
                type: fType,
                name: fName || "Your Pass",
                sub: fSub || "Subtitle",
                num: fNum || "0000",
                bal: Number(fBal) || 0,
                col: fCol,
              }}
            />

            <button
              type="button"
              onClick={handleSaveForm}
              className="w-full min-h-[46px] rounded-2xl bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-bold cursor-pointer"
            >
              {editingPassId ? "Save Changes" : "Add to Wallet"}
            </button>
          </div>
        </div>
      )}

      {/* Connect Gcard Modal Sheet with QR Pairing & Live Sync */}
      {connectSheetOpen && (
        <div
          onClick={() => setConnectSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 border shadow-2xl ${surfaceBg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0a8f5a] text-white flex items-center justify-center">
                  <Link2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Connect to Gcard</h2>
                  <p className={`text-xs ${mutedText}`}>
                    Real-time GAMURA CARD &amp; QR pairing
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

            <div
              className="rounded-2xl p-4 text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${gcardState.bg === "#fafaf8" ? "#0a8f5a" : gcardState.bg}, #064e3b)`,
              }}
            >
              <div className="flex items-center justify-between text-xs opacity-85 font-semibold">
                <span>🪪 {gcardState.name}</span>
                <span>
                  {linkState.connected
                    ? syncPulse.phase === "syncing"
                      ? "SYNCING..."
                      : "LIVE CONNECTED"
                    : "PREVIEW"}
                </span>
              </div>
              <div className="mt-3 text-xs opacity-90 truncate">
                {gcardState.head}
              </div>
              <div className="mt-1 text-[11px] opacity-75 truncate">
                {gcardState.link}
              </div>
            </div>

            {/* Animated Syncing Indicator */}
            <CardWalletSyncIndicator
              connected={linkState.connected}
              pulse={syncPulse}
              pairState={pairState}
              dark={dark}
              variant="full"
            />

            {/* QR Code Generator for Cross-Device Pairing */}
            <div
              className={`rounded-2xl border p-4 space-y-3 ${
                dark
                  ? "bg-zinc-900/70 border-zinc-800"
                  : "bg-[#F5F5F7] border-zinc-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <QrCode size={14} className="text-[#0a8f5a]" />
                  <span>Scan on Gcard Device</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    pairState?.peerConnected ? "text-[#0a8f5a]" : mutedText
                  }`}
                >
                  {pairState?.peerConnected
                    ? "Peer Paired ✓"
                    : "Waiting for scan"}
                </span>
              </div>

              {pairingQrUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-white p-2.5 rounded-2xl border border-zinc-200 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={pairingQrUrl}
                      size={132}
                      level="M"
                      fgColor="#111111"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                    <div>
                      <div className={`text-[11px] uppercase tracking-wider font-semibold ${mutedText}`}>
                        Pair Code
                      </div>
                      <div className="text-lg font-mono font-bold tracking-widest">
                        {pairState?.pairCode}
                      </div>
                    </div>
                    <p className={`text-[11px] leading-snug ${mutedText}`}>
                      Scan this QR on another device to open GAMURA CARD paired live with Gwallet.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          pairState?.pairCode &&
                          copyText(pairState.pairCode, "Pair code copied")
                        }
                        className={`min-h-[32px] px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer border ${
                          dark
                            ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            : "border-zinc-200 bg-white hover:bg-zinc-100"
                        }`}
                      >
                        <Copy size={11} />
                        <span>Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(pairingQrUrl, "Pairing link copied")
                        }
                        className={`min-h-[32px] px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer border ${
                          dark
                            ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            : "border-zinc-200 bg-white hover:bg-zinc-100"
                        }`}
                      >
                        <Link2 size={11} />
                        <span>Copy Link</span>
                      </button>
                      <button
                        type="button"
                        disabled={pairBusy}
                        onClick={() => void handleOpenConnectQr(true)}
                        className={`min-h-[32px] px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer border ${
                          dark
                            ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            : "border-zinc-200 bg-white hover:bg-zinc-100"
                        }`}
                      >
                        <RefreshCw
                          size={11}
                          className={pairBusy ? "animate-spin" : ""}
                        />
                        <span>New QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <button
                    type="button"
                    disabled={pairBusy}
                    onClick={() => void handleOpenConnectQr(true)}
                    className="min-h-[38px] px-4 rounded-full bg-[#0a8f5a] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode size={14} />
                    <span>{pairBusy ? "Generating..." : "Generate Pairing QR"}</span>
                  </button>
                </div>
              )}

              {/* Manual Pair Code / Link Join */}
              <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                <div className={`text-[11px] font-medium ${mutedText}`}>
                  Or enter a Gcard pair code / link
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualPairInput}
                    onChange={(e) => {
                      setManualPairInput(e.target.value);
                      setPairError(null);
                    }}
                    placeholder="e.g. GW8K4P2M"
                    className={`flex-1 min-w-0 rounded-xl px-3 py-2 text-xs font-mono border outline-none ${
                      dark
                        ? "bg-zinc-950 border-zinc-700"
                        : "bg-white border-zinc-200"
                    }`}
                  />
                  <button
                    type="button"
                    disabled={pairBusy}
                    onClick={() => void handleJoinManualPair()}
                    className="min-h-[34px] px-4 rounded-xl bg-zinc-900 dark:bg-white dark:text-black text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {pairBusy ? "Pairing..." : "Pair"}
                  </button>
                </div>
                {pairError && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {pairError}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {linkState.connected ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectSheetOpen(false);
                      handleNavigate("/gcard");
                    }}
                    className="w-full min-h-[46px] rounded-full bg-[#0a8f5a] hover:bg-[#08774b] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open GAMURA CARD (Gcard)</span>
                    <ArrowUpRight size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      className={`min-h-[42px] rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${subtleBg}`}
                    >
                      <RefreshCw
                        size={14}
                        className={
                          syncPulse.phase === "syncing" ? "animate-spin" : ""
                        }
                      />
                      <span>Sync Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectToggle(false)}
                      className="min-h-[42px] rounded-full bg-red-600/12 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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
                  <span>Connect Gwallet &amp; Gcard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Settings Modal */}
      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 border shadow-2xl ${surfaceBg}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Wallet Settings</h2>
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${subtleBg}`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Lock size={15} />
                  <span>4-Digit PIN Lock</span>
                </span>
                <button
                  type="button"
                  onClick={handleTogglePinLock}
                  className={`min-h-[32px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${
                    wallet.pin ? "bg-[#0a8f5a] text-white" : subtleBg
                  }`}
                >
                  {wallet.pin ? "Enabled" : "Off"}
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {dark ? <Moon size={15} /> : <Sun size={15} />}
                  <span>Appearance</span>
                </span>
                <button
                  type="button"
                  onClick={() => commitWallet({ ...wallet, darkMode: !dark })}
                  className={`min-h-[32px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${subtleBg}`}
                >
                  {dark ? "Dark" : "Light"}
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Cloud size={15} />
                  <span>Cross-Device Cloud Sync</span>
                </span>
                {authUser ? (
                  <span className="text-xs font-semibold text-[#0a8f5a]">
                    Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleCloudSignIn}
                    className="min-h-[32px] px-3.5 rounded-full bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span className="text-sm font-medium">Universe Apps Pin</span>
                <button
                  type="button"
                  onClick={handleToggleUniverseInstall}
                  className={`min-h-[32px] px-3.5 rounded-full text-xs font-semibold cursor-pointer ${
                    isInstalledInUniverse
                      ? "bg-[#E2F5ED] text-[#059669]"
                      : subtleBg
                  }`}
                >
                  {isInstalledInUniverse ? "Pinned" : "Pin App"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!confirmResetWallet) {
                    setConfirmResetWallet(true);
                    window.setTimeout(() => setConfirmResetWallet(false), 3500);
                    return;
                  }
                  const seed = createSeedWalletCards();
                  commitWallet({
                    cards: seed,
                    pin: null,
                    darkMode: dark,
                    updatedAtMs: Date.now(),
                  });
                  setConfirmResetWallet(false);
                  setSettingsOpen(false);
                  showToast("Demo wallet restored");
                }}
                className={`min-h-[42px] rounded-2xl text-xs font-bold cursor-pointer ${
                  confirmResetWallet
                    ? "bg-red-600 text-white"
                    : "bg-red-600/12 text-red-600"
                }`}
              >
                {confirmResetWallet ? "Tap Again to Reset" : "Reset Wallet"}
              </button>
              <a
                href="/launch"
                onClick={(e) => {
                  e.preventDefault();
                  setSettingsOpen(false);
                  handleNavigate("/launch");
                }}
                className={`min-h-[42px] rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1 ${subtleBg}`}
              >
                <span>Launch Store</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4-Digit Wallet PIN Lock Screen */}
      {lockVisible && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#05150f] to-[#0b3d2a] text-white flex flex-col items-center justify-center p-6">
          <Lock size={38} className="mb-3 opacity-90" />
          <h2 className="text-xl font-bold">{lockTitle}</h2>
          <div className="flex gap-4 my-6">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 border-white transition-colors ${
                  i < pinBuffer.length ? "bg-white" : ""
                }`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
              (k, idx) =>
                k === "" ? (
                  <span key={idx} />
                ) : (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handlePinKey(k)}
                    className="w-[72px] h-[72px] rounded-full bg-white/12 hover:bg-white/20 text-2xl font-medium flex items-center justify-center cursor-pointer transition-colors"
                  >
                    {k === "⌫" ? <Delete size={22} /> : k}
                  </button>
                ),
            )}
          </div>
          {lockCancelable && (
            <button
              type="button"
              onClick={() => {
                setLockVisible(false);
                setPinBuffer("");
                pendingPinActionRef.current = null;
              }}
              className="mt-7 text-sm font-semibold text-white/75 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {toastMsg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-8 z-50 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xl whitespace-nowrap"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
