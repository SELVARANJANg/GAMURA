import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  Plus,
  QrCode,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

type ClipKind = "text" | "link" | "image" | "file" | "enc";
type ClipFilter = "all" | "text" | "link" | "files";
type SyncMode = "cloud" | "rtdb" | "local";

interface StoredClipItem {
  id: string;
  t: ClipKind;
  v: string;
  iv?: string;
  n?: string;
  s?: number;
  ts: number;
  exp: number;
  pin: boolean;
  from: string;
}

interface DisplayClipItem {
  id: string;
  t: "text" | "link" | "image" | "file" | "locked";
  v: string;
  n?: string;
  s?: number;
  ts: number;
  exp: number;
  pin: boolean;
  from: string;
  locked?: boolean;
  badPin?: boolean;
}

interface PresenceMap {
  [deviceId: string]: { ts: number; n: string };
}

const MAX_ENCODED_PAYLOAD = 880_000;
const MAX_RAW_FILE_BYTES = 640_000;
const MAX_TEXT_CHARS = 100_000;

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

function safeCfgGet(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(`gclip_${key}`);
    return val === null ? fallback : val;
  } catch {
    return fallback;
  }
}

function safeCfgSet(key: string, val: string): void {
  try {
    localStorage.setItem(`gclip_${key}`, val);
  } catch {
    // ignore storage errors
  }
}

function defaultDeviceName(): string {
  const saved = safeCfgGet("dev", "");
  if (saved) return saved;
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|Android|Mobile/i.test(navigator.userAgent);
  const generated = `${isMobile ? "Phone" : "Mac"}-${Math.floor(1000 + Math.random() * 9000)}`;
  safeCfgSet("dev", generated);
  return generated;
}

function getDeviceId(): string {
  const existing = safeCfgGet("dev_id", "");
  if (existing && /^[a-zA-Z0-9_-]{4,32}$/.test(existing)) return existing;
  const created = `d_${Math.random().toString(36).slice(2, 10)}`;
  safeCfgSet("dev_id", created);
  return created;
}

function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

function generateClipId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRtdbUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withProto = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProto.replace(/\.json$/, "").replace(/\/+$/, "");
}

function formatBytes(n?: number): string {
  const num = Number(n) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1048576) return `${Math.round(num / 1024)} KB`;
  return `${(num / 1048576).toFixed(1)} MB`;
}

function formatAgo(ts: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function formatLeft(ts: number, exp: number, pin: boolean, nowMs: number): string {
  if (pin) return "Pinned";
  if (!exp) return "No expiry";
  const rem = exp - (nowMs - ts);
  if (rem <= 0) return "Expiring";
  if (rem < 60_000) return "<1m left";
  const mins = Math.ceil(rem / 60_000);
  return mins < 90 ? `${mins}m left` : `${Math.round(mins / 60)}h left`;
}

/* ---------- AES-256-GCM Room Encryption (compatible with standalone HTML) ---------- */
function uint8ToB64(u: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u.length; i += 32768) {
    s += String.fromCharCode(...Array.from(u.subarray(i, i + 32768)));
  }
  return btoa(s);
}

function b64ToUint8(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function deriveRoomKey(pin: string, roomCode: string): Promise<CryptoKey> {
  if (!(window.crypto && window.crypto.subtle)) {
    throw new Error("Encryption requires a secure HTTPS page");
  }
  const enc = new TextEncoder();
  const base = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`gclip:${roomCode}`),
      iterations: 150000,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptPayload(
  key: CryptoKey,
  payload: { t: "text" | "link" | "image" | "file"; v: string; n?: string; s?: number },
): Promise<{ iv: string; v: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ct = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    iv: uint8ToB64(iv),
    v: uint8ToB64(new Uint8Array(ct)),
  };
}

async function decryptPayload(
  key: CryptoKey,
  ivB64: string,
  cipherB64: string,
): Promise<{ t: "text" | "link" | "image" | "file"; v: string; n?: string; s?: number }> {
  const pt = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToUint8(ivB64) as BufferSource },
    key,
    b64ToUint8(cipherB64) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---------- Image & File Helpers ---------- */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function compressImageForClip(file: File): Promise<string> {
  const src = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, 1280 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      let q = 0.84;
      let out = "";
      do {
        out = canvas.toDataURL("image/jpeg", q);
        q -= 0.1;
      } while (out.length > MAX_ENCODED_PAYLOAD && q > 0.25);

      if (out.length > MAX_ENCODED_PAYLOAD) {
        reject(new Error("Image is too large even after compression"));
      } else {
        resolve(out);
      }
    };
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = src;
  });
}

async function copyPlainText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("Copy failed");
}

function getRoomFromCurrentUrl(): string {
  if (typeof window === "undefined") return "";
  const hashCode = window.location.hash.replace(/^#/, "").trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(hashCode)) return hashCode;
  const params = new URLSearchParams(window.location.search);
  const queryRoom = (params.get("room") || "").trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(queryRoom)) return queryRoom;
  return "";
}

function buildCanonicalShareUrl(roomCode: string): string {
  if (typeof window === "undefined") return `/clip#${roomCode}`;
  return `${window.location.origin}/clip#${roomCode}`;
}

function readLocalRoom(roomCode: string): { items: Record<string, StoredClipItem>; presence: PresenceMap } {
  try {
    const raw = localStorage.getItem(`gclip_local_room_${roomCode}`);
    if (!raw) return { items: {}, presence: {} };
    const parsed = JSON.parse(raw);
    return {
      items: parsed.items || {},
      presence: parsed.presence || {},
    };
  } catch {
    return { items: {}, presence: {} };
  }
}

function writeLocalRoom(
  roomCode: string,
  data: { items: Record<string, StoredClipItem>; presence: PresenceMap },
): void {
  try {
    localStorage.setItem(`gclip_local_room_${roomCode}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function GamuraClipPage({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-clip",
    ),
  );

  // Settings & device state
  const [deviceName, setDeviceName] = useState<string>(() => defaultDeviceName());
  const deviceIdRef = useRef<string>(getDeviceId());
  const [customRtdbUrl, setCustomRtdbUrl] = useState<string>(() =>
    safeCfgGet("db", ""),
  );
  const [defaultExpMs, setDefaultExpMs] = useState<number>(() =>
    Number(safeCfgGet("exp", "3600000")) || 3600000,
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => safeCfgGet("sound", "1") === "1",
  );
  const [autoCopyIncoming, setAutoCopyIncoming] = useState<boolean>(
    () => safeCfgGet("auto", "0") === "1",
  );

  // Active room state
  const [room, setRoom] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [pinEntryInput, setPinEntryInput] = useState<string>("");
  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    try {
      const list = JSON.parse(safeCfgGet("recent", "[]"));
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  });

  // Encryption state
  const roomKeyRef = useRef<CryptoKey | null>(null);
  const [pinLocked, setPinLocked] = useState<boolean>(false);

  // Clips & Sync state
  const [syncMode, setSyncMode] = useState<SyncMode>(() =>
    normalizeRtdbUrl(safeCfgGet("db", "")) ? "rtdb" : "cloud",
  );
  const [rawItems, setRawItems] = useState<StoredClipItem[]>([]);
  const [displayItems, setDisplayItems] = useState<DisplayClipItem[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Composer & Filter state
  const [composerText, setComposerText] = useState<string>("");
  const [composerExpMs, setComposerExpMs] = useState<number>(() =>
    Number(safeCfgGet("exp", "3600000")),
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKind, setFilterKind] = useState<ClipFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Modals / Sheets
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShare, setShowShare] = useState<boolean>(false);
  const [showPinSheet, setShowPinSheet] = useState<boolean>(false);
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  // Sheet temp inputs
  const [draftRtdbUrl, setDraftRtdbUrl] = useState<string>(customRtdbUrl);
  const [draftDevName, setDraftDevName] = useState<string>(deviceName);
  const [draftDefExp, setDraftDefExp] = useState<number>(defaultExpMs);
  const [draftSound, setDraftSound] = useState<boolean>(soundEnabled);
  const [draftAutoCopy, setDraftAutoCopy] = useState<boolean>(autoCopyIncoming);
  const [rtdbTestStatus, setRtdbTestStatus] = useState<string>("");
  const [modalPinInput, setModalPinInput] = useState<string>("");

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstSnapshotRef = useRef<boolean>(true);
  const askedPinRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const clipStoreApp: StoreAppItem = useMemo(
    () =>
      BUILTIN_STORE_APPS.find((a) => a.id === "gamura-clip") || {
        id: "gamura-clip",
        name: "GAMURA CLIP",
        cat: "Utilities",
        tag: "Copy here. Paste there across devices.",
        desc: "Send text, links, images, and files between your phone and laptop with a 6-character room code and optional AES-256 PIN encryption.",
        url: "/clip",
        c1: "#34d399",
        c2: "#0f9f6e",
        iconKind: "clip",
        rating: 4.9,
        age: "3+",
        chart: "No. 1 Utility",
        dl: "Featured",
        size: "Web · 1 MB",
        isBuiltin: true,
      },
    [],
  );

  useEffect(() => {
    const prev = document.title;
    document.title = room ? `Gamura Clip · ${room}` : "Gamura Clip";
    return () => {
      document.title = prev;
    };
  }, [room]);

  useEffect(() => {
    const syncUniverse = () => {
      setInstalledInUniverse(
        readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
          (a) => a.id === "gamura-clip",
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

  // Periodic clock tick for relative time & expiry countdowns
  useEffect(() => {
    if (!room) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, [room]);

  const handleToggleUniverseInstall = () => {
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-clip");
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(clipStoreApp);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps");
    }
  };

  /* ---------- Room Enter / Leave ---------- */
  const enterRoom = useCallback(
    async (rawCode: string, optionalPin = "") => {
      const code = rawCode.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code)) {
        showToast("Enter a 6-character room code");
        return;
      }

      roomKeyRef.current = null;
      setPinLocked(false);
      if (optionalPin.trim()) {
        try {
          roomKeyRef.current = await deriveRoomKey(optionalPin.trim(), code);
          setPinLocked(true);
        } catch {
          showToast("PIN encryption requires HTTPS");
        }
      }

      seenIdsRef.current = new Set();
      firstSnapshotRef.current = true;
      askedPinRef.current = false;
      setRawItems([]);
      setDisplayItems([]);
      setComposerExpMs(defaultExpMs);
      setRoom(code);

      try {
        window.history.replaceState(null, "", `/clip#${code}`);
      } catch {
        window.location.hash = `#${code}`;
      }

      setRecentRooms((prev) => {
        const next = [code, ...prev.filter((c) => c !== code)].slice(0, 5);
        safeCfgSet("recent", JSON.stringify(next));
        return next;
      });
    },
    [defaultExpMs, showToast],
  );

  // Auto-enter room from URL hash or ?room= query on initial load
  useEffect(() => {
    const initialRoom = getRoomFromCurrentUrl();
    if (initialRoom) {
      void enterRoom(initialRoom, "");
    }
  }, [enterRoom]);

  const leaveRoom = useCallback(() => {
    const leavingRoom = room;
    setRoom(null);
    roomKeyRef.current = null;
    setPinLocked(false);
    setPinEntryInput("");
    setRawItems([]);
    setDisplayItems([]);

    try {
      window.history.replaceState(null, "", "/clip");
    } catch {
      window.location.hash = "";
    }

    if (leavingRoom) {
      const activeRtdb = normalizeRtdbUrl(customRtdbUrl);
      if (activeRtdb) {
        fetch(`${activeRtdb}/clip/${leavingRoom}/p/${deviceIdRef.current}.json`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
      } else {
        deleteDoc(
          doc(db, "clip_rooms", leavingRoom, "presence", deviceIdRef.current),
        ).catch(() => {});
      }
    }
  }, [customRtdbUrl, room]);

  /* ---------- Notify on Incoming Clips from Other Devices ---------- */
  const notifyIncoming = useCallback(
    (item: DisplayClipItem) => {
      if (item.from === deviceName) return;
      const what =
        item.t === "image"
          ? "image"
          : item.t === "file"
            ? "file"
            : item.t === "link"
              ? "link"
              : "clip";
      showToast(`New ${what} from ${item.from}`);

      if (soundEnabled) {
        try {
          if (navigator.vibrate) navigator.vibrate(50);
        } catch {
          // ignore
        }
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          const actx = new AudioCtx();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.frequency.value = 880;
          gain.gain.value = 0.04;
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start();
          osc.stop(actx.currentTime + 0.11);
        } catch {
          // ignore
        }
      }

      if (autoCopyIncoming && (item.t === "text" || item.t === "link")) {
        copyPlainText(item.v).catch(() => {});
      }
    },
    [autoCopyIncoming, deviceName, showToast, soundEnabled],
  );

  /* ---------- Real-time Sync Subscription (Firestore Cloud / Custom RTDB / Local) ---------- */
  const pingPresence = useCallback(
    async (roomCode: string) => {
      const devId = deviceIdRef.current;
      const activeRtdb = normalizeRtdbUrl(customRtdbUrl);

      if (activeRtdb) {
        await fetch(`${activeRtdb}/clip/${roomCode}/p/${devId}.json`, {
          method: "PUT",
          body: JSON.stringify({ ts: Date.now(), n: deviceName.slice(0, 32) }),
        });
        return;
      }

      try {
        await setDoc(doc(db, "clip_rooms", roomCode, "presence", devId), {
          ts: Date.now(),
          n: deviceName.slice(0, 32),
        });
      } catch (err) {
        // Fallback silently to local if offline
        const localData = readLocalRoom(roomCode);
        localData.presence[devId] = { ts: Date.now(), n: deviceName.slice(0, 32) };
        writeLocalRoom(roomCode, localData);
        if (
          err instanceof Error &&
          err.message.toLowerCase().includes("permission")
        ) {
          handleFirestoreError(
            err,
            OperationType.WRITE,
            `clip_rooms/${roomCode}/presence/${devId}`,
          );
        }
      }
    },
    [customRtdbUrl, deviceName],
  );

  const deleteRoomClip = useCallback(
    async (roomCode: string, itemId: string) => {
      const activeRtdb = normalizeRtdbUrl(customRtdbUrl);
      if (activeRtdb) {
        await Promise.all([
          fetch(`${activeRtdb}/clip/${roomCode}/i/${itemId}.json`, {
            method: "DELETE",
          }),
          fetch(`${activeRtdb}/clip/${roomCode}/b/${itemId}.json`, {
            method: "DELETE",
          }),
        ]);
        return;
      }

      const localData = readLocalRoom(roomCode);
      if (localData.items[itemId]) {
        delete localData.items[itemId];
        writeLocalRoom(roomCode, localData);
      }

      try {
        await deleteDoc(doc(db, "clip_rooms", roomCode, "items", itemId));
      } catch {
        // ignore if local-only or already removed
      }
    },
    [customRtdbUrl],
  );

  // Sync subscription effect
  useEffect(() => {
    if (!room) {
      setSyncMode(normalizeRtdbUrl(customRtdbUrl) ? "rtdb" : "cloud");
      return;
    }

    const activeRtdb = normalizeRtdbUrl(customRtdbUrl);
    let cancelled = false;

    if (activeRtdb) {
      setSyncMode("rtdb");
      const pollRtdb = async () => {
        try {
          await pingPresence(room);
          const [iRes, pRes] = await Promise.all([
            fetch(`${activeRtdb}/clip/${room}/i.json`, { cache: "no-store" }),
            fetch(`${activeRtdb}/clip/${room}/p.json`, { cache: "no-store" }),
          ]);
          if (!iRes.ok || cancelled) return;
          const itemsObj = (await iRes.json()) || {};
          const presObj = pRes.ok ? (await pRes.json()) || {} : {};
          const now = Date.now();

          const validItems: StoredClipItem[] = [];
          for (const [id, m] of Object.entries<Record<string, unknown>>(itemsObj)) {
            if (!m) continue;
            const item: StoredClipItem = {
              id,
              t: (m.t as ClipKind) || "text",
              v: String(m.v || ""),
              iv: typeof m.iv === "string" ? m.iv : undefined,
              n: typeof m.n === "string" ? m.n : undefined,
              s: typeof m.s === "number" ? m.s : undefined,
              ts: Number(m.ts) || now,
              exp: Number(m.exp) || 0,
              pin: Boolean(m.pin),
              from: String(m.from || "Device"),
            };
            if (!item.pin && item.exp > 0 && now - item.ts > item.exp) {
              void deleteRoomClip(room, id);
              continue;
            }
            if (m.bl && !item.v) {
              const bRes = await fetch(`${activeRtdb}/clip/${room}/b/${id}.json`);
              if (bRes.ok) item.v = String((await bRes.json()) || "");
            }
            validItems.push(item);
          }

          let activeDevices = 0;
          Object.values<Record<string, unknown>>(presObj).forEach((p) => {
            if (p && now - Number(p.ts || 0) < 25_000) activeDevices++;
          });
          if (!cancelled) {
            setOnlineCount(Math.max(1, activeDevices));
            setRawItems(validItems.sort((a, b) => b.ts - a.ts));
          }
        } catch {
          if (!cancelled) setSyncMode("local");
        }
      };

      void pollRtdb();
      const intervalId = window.setInterval(pollRtdb, 2000);
      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }

    // Default: Gamura Cloud Real-Time Firestore Sync (works across Phone & Laptop with 0 setup!)
    setSyncMode("cloud");
    void pingPresence(room);
    const heartbeatId = window.setInterval(() => {
      void pingPresence(room);
    }, 12_000);

    const itemsQuery = query(
      collection(db, "clip_rooms", room, "items"),
      orderBy("ts", "desc"),
    );

    const unsubItems = onSnapshot(
      itemsQuery,
      (snap) => {
        if (cancelled) return;
        setSyncMode("cloud");
        const now = Date.now();
        const nextItems: StoredClipItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const item: StoredClipItem = {
            id: docSnap.id,
            t: (d.t as ClipKind) || "text",
            v: String(d.v || ""),
            iv: typeof d.iv === "string" ? d.iv : undefined,
            n: typeof d.n === "string" ? d.n : undefined,
            s: typeof d.s === "number" ? d.s : undefined,
            ts: Number(d.ts) || now,
            exp: Number(d.exp) || 0,
            pin: Boolean(d.pin),
            from: String(d.from || "Device"),
          };
          if (!item.pin && item.exp > 0 && now - item.ts > item.exp) {
            void deleteRoomClip(room, docSnap.id);
            return;
          }
          nextItems.push(item);
        });
        setRawItems(nextItems);
      },
      () => {
        if (cancelled) return;
        // Fallback seamlessly to local device storage if unreachable
        setSyncMode("local");
        const local = readLocalRoom(room);
        setRawItems(
          Object.values(local.items).sort((a, b) => b.ts - a.ts),
        );
      },
    );

    const unsubPresence = onSnapshot(
      collection(db, "clip_rooms", room, "presence"),
      (snap) => {
        if (cancelled) return;
        const now = Date.now();
        let active = 0;
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (now - Number(d.ts || 0) < 35_000) active++;
        });
        setOnlineCount(Math.max(1, active));
      },
      () => {
        if (!cancelled) setOnlineCount(1);
      },
    );

    return () => {
      cancelled = true;
      window.clearInterval(heartbeatId);
      unsubItems();
      unsubPresence();
    };
  }, [customRtdbUrl, deleteRoomClip, pingPresence, room]);

  /* ---------- Resolve / Decrypt Items ---------- */
  useEffect(() => {
    let active = true;
    const resolveAll = async () => {
      const resolved = await Promise.all(
        rawItems.map(async (m): Promise<DisplayClipItem> => {
          if (m.t === "enc") {
            if (!roomKeyRef.current || !m.iv) {
              return {
                id: m.id,
                t: "locked",
                v: "",
                n: m.n,
                s: m.s,
                ts: m.ts,
                exp: m.exp,
                pin: m.pin,
                from: m.from,
                locked: true,
              };
            }
            try {
              const dec = await decryptPayload(roomKeyRef.current, m.iv, m.v);
              return {
                id: m.id,
                t: dec.t,
                v: dec.v,
                n: dec.n ?? m.n,
                s: dec.s ?? m.s,
                ts: m.ts,
                exp: m.exp,
                pin: m.pin,
                from: m.from,
              };
            } catch {
              return {
                id: m.id,
                t: "locked",
                v: "",
                n: m.n,
                s: m.s,
                ts: m.ts,
                exp: m.exp,
                pin: m.pin,
                from: m.from,
                locked: true,
                badPin: true,
              };
            }
          }

          return {
            id: m.id,
            t: m.t === "link" || m.t === "image" || m.t === "file" ? m.t : "text",
            v: m.v,
            n: m.n,
            s: m.s,
            ts: m.ts,
            exp: m.exp,
            pin: m.pin,
            from: m.from,
          };
        }),
      );

      if (!active) return;

      const fresh = resolved.filter((it) => !seenIdsRef.current.has(it.id));
      resolved.forEach((it) => seenIdsRef.current.add(it.id));
      if (!firstSnapshotRef.current) {
        fresh.forEach(notifyIncoming);
      }
      firstSnapshotRef.current = false;

      if (
        !roomKeyRef.current &&
        !askedPinRef.current &&
        resolved.some((it) => it.locked)
      ) {
        askedPinRef.current = true;
        setShowPinSheet(true);
      }

      setDisplayItems(resolved);
    };

    void resolveAll();
    return () => {
      active = false;
    };
  }, [notifyIncoming, rawItems, pinLocked]);

  /* ---------- Send Clips ---------- */
  const sendClip = useCallback(
    async (
      kind: "text" | "link" | "image" | "file",
      value: string,
      extra?: { n?: string; s?: number },
    ) => {
      if (!room) return;
      const id = generateClipId();
      const ts = Date.now();
      const from = deviceName.slice(0, 32) || "Device";

      setIsSending(true);
      try {
        let payload: Omit<StoredClipItem, "id">;

        if (pinLocked && roomKeyRef.current) {
          const enc = await encryptPayload(roomKeyRef.current, {
            t: kind,
            v: value,
            n: extra?.n,
            s: extra?.s,
          });
          if (enc.v.length > 910_000) {
            showToast("Encrypted clip exceeds size limit");
            return;
          }
          payload = {
            t: "enc",
            v: enc.v,
            iv: enc.iv,
            ...(extra?.n ? { n: extra.n.slice(0, 200) } : {}),
            ...(typeof extra?.s === "number" ? { s: extra.s } : {}),
            ts,
            exp: composerExpMs,
            pin: false,
            from,
          };
        } else {
          if (value.length > 910_000) {
            showToast("Clip exceeds size limit (900 KB max)");
            return;
          }
          payload = {
            t: kind,
            v: value,
            ...(extra?.n ? { n: extra.n.slice(0, 200) } : {}),
            ...(typeof extra?.s === "number" ? { s: extra.s } : {}),
            ts,
            exp: composerExpMs,
            pin: false,
            from,
          };
        }

        const activeRtdb = normalizeRtdbUrl(customRtdbUrl);
        if (activeRtdb) {
          const res = await fetch(`${activeRtdb}/clip/${room}/i/${id}.json`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`RTDB ${res.status}`);
        } else {
          try {
            await setDoc(doc(db, "clip_rooms", room, "items", id), payload);
          } catch (err) {
            // Also persist locally if network unavailable
            const local = readLocalRoom(room);
            local.items[id] = { id, ...payload };
            writeLocalRoom(room, local);
            setRawItems(Object.values(local.items).sort((a, b) => b.ts - a.ts));
            setSyncMode("local");
            if (
              err instanceof Error &&
              err.message.toLowerCase().includes("permission")
            ) {
              handleFirestoreError(
                err,
                OperationType.CREATE,
                `clip_rooms/${room}/items/${id}`,
              );
            }
          }
        }

        seenIdsRef.current.add(id);
        showToast(
          kind === "image"
            ? "Image sent"
            : kind === "file"
              ? "File sent"
              : "Clip sent",
        );
      } catch {
        showToast("Could not send clip. Try a smaller file.");
      } finally {
        setIsSending(false);
      }
    },
    [composerExpMs, customRtdbUrl, deviceName, pinLocked, room, showToast],
  );

  const handleSendText = useCallback(() => {
    const trimmed = composerText.trim();
    if (!trimmed) {
      showToast("Type or paste something first");
      return;
    }
    if (trimmed.length > MAX_TEXT_CHARS) {
      showToast("Text is too long (100,000 characters max)");
      return;
    }
    const isLink = /^https?:\/\/\S+$/i.test(trimmed);
    setComposerText("");
    void sendClip(isLink ? "link" : "text", trimmed);
  }, [composerText, sendClip, showToast]);

  const handleSendFile = useCallback(
    async (file: File) => {
      try {
        if (
          file.type.startsWith("image/") &&
          file.type !== "image/gif" &&
          file.type !== "image/svg+xml"
        ) {
          const compressed = await compressImageForClip(file);
          await sendClip("image", compressed, {
            n: file.name || "image.jpg",
            s: Math.round(compressed.length * 0.75),
          });
          return;
        }
        if (file.size > MAX_RAW_FILE_BYTES) {
          showToast(`File is too large (${formatBytes(MAX_RAW_FILE_BYTES)} max)`);
          return;
        }
        const dataUrl = await readFileAsDataUrl(file);
        await sendClip(
          file.type.startsWith("image/") ? "image" : "file",
          dataUrl,
          { n: file.name || "file", s: file.size },
        );
      } catch {
        showToast("Could not read file. Try a smaller one.");
      }
    },
    [sendClip, showToast],
  );

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard) {
      showToast("Use Ctrl+V or long-press in the text box");
      return;
    }
    try {
      if (navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const trimmed = text.trim();
          const isLink = /^https?:\/\/\S+$/i.test(trimmed);
          await sendClip(isLink ? "link" : "text", trimmed);
          return;
        }
      }
    } catch {
      // fall through to clipboard.read()
    }

    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          await handleSendFile(new File([blob], "pasted.png", { type: blob.type }));
          return;
        }
      }
      showToast("Clipboard is empty");
    } catch {
      showToast("Allow clipboard access or paste directly into the box");
    }
  };

  // Document paste shortcut for images/files inside an active room
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!room) return;
      const cd = e.clipboardData;
      if (!cd) return;
      for (let i = 0; i < cd.items.length; i++) {
        if (cd.items[i].kind === "file") {
          const f = cd.items[i].getAsFile();
          if (f) {
            e.preventDefault();
            void handleSendFile(f);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleSendFile, room]);

  /* ---------- Clip Actions ---------- */
  const handleTogglePin = async (item: DisplayClipItem) => {
    if (!room) return;
    const nextPin = !item.pin;
    const activeRtdb = normalizeRtdbUrl(customRtdbUrl);

    try {
      if (activeRtdb) {
        await fetch(`${activeRtdb}/clip/${room}/i/${item.id}.json`, {
          method: "PATCH",
          body: JSON.stringify({ pin: nextPin }),
        });
      } else {
        try {
          await updateDoc(doc(db, "clip_rooms", room, "items", item.id), {
            pin: nextPin,
          });
        } catch {
          const local = readLocalRoom(room);
          if (local.items[item.id]) {
            local.items[item.id].pin = nextPin;
            writeLocalRoom(room, local);
            setRawItems(Object.values(local.items).sort((a, b) => b.ts - a.ts));
          }
        }
      }
      showToast(nextPin ? "Pinned · Won't expire" : "Unpinned");
    } catch {
      showToast("Could not update pin state");
    }
  };

  const handleDeleteClip = async (itemId: string) => {
    if (!room) return;
    setRawItems((prev) => prev.filter((x) => x.id !== itemId));
    await deleteRoomClip(room, itemId);
    showToast("Clip deleted");
  };

  const handleClearAllClips = async () => {
    if (!room) return;
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    const activeRtdb = normalizeRtdbUrl(customRtdbUrl);
    if (activeRtdb) {
      await Promise.all([
        fetch(`${activeRtdb}/clip/${room}/i.json`, { method: "DELETE" }),
        fetch(`${activeRtdb}/clip/${room}/b.json`, { method: "DELETE" }),
      ]);
    } else {
      writeLocalRoom(room, { items: {}, presence: {} });
      try {
        const snap = await getDocs(collection(db, "clip_rooms", room, "items"));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      } catch {
        // ignore
      }
    }
    setRawItems([]);
    showToast("Room cleared");
  };

  const handleDownloadClipFile = async (dataUrl: string, filename: string) => {
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
    } catch {
      showToast("Download failed");
    }
  };

  const handleCopyImage = async (src: string) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej();
        img.src = src;
      });
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      cv.getContext("2d")?.drawImage(img, 0, 0);
      const blob = await new Promise<Blob | null>((res) =>
        cv.toBlob(res, "image/png"),
      );
      if (!blob || !window.ClipboardItem || !navigator.clipboard?.write) {
        throw new Error("Unsupported");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("Image copied");
    } catch {
      showToast("Use Save to download this image");
    }
  };

  const handleApplyPin = async () => {
    if (!room) return;
    const trimmed = modalPinInput.trim();
    if (!trimmed) {
      showToast("Enter a PIN");
      return;
    }
    try {
      roomKeyRef.current = await deriveRoomKey(trimmed, room);
      setPinLocked((prev) => !prev || true);
      setPinLocked(true);
      // force re-resolve effect even if already true
      setRawItems((prev) => [...prev]);
      setModalPinInput("");
      setShowPinSheet(false);
      showToast("PIN applied · AES-256 active");
    } catch {
      showToast("PIN encryption requires HTTPS");
    }
  };

  const handleTestCustomRtdb = async () => {
    const clean = normalizeRtdbUrl(draftRtdbUrl);
    if (!clean) {
      setRtdbTestStatus("Enter a Realtime Database URL first");
      return;
    }
    setRtdbTestStatus("Testing…");
    try {
      const r = await fetch(`${clean}/clip/_test/t.json`, {
        method: "PUT",
        body: JSON.stringify({ ts: Date.now() }),
      });
      if (!r.ok) throw new Error(String(r.status));
      fetch(`${clean}/clip/_test.json`, { method: "DELETE" }).catch(() => {});
      setRtdbTestStatus("Connected");
    } catch {
      setRtdbTestStatus("Failed · Check URL & rules");
    }
  };

  const handleSaveSettings = () => {
    const normalizedRtdb = normalizeRtdbUrl(draftRtdbUrl);
    safeCfgSet("db", normalizedRtdb);
    setCustomRtdbUrl(normalizedRtdb);

    const trimmedName = draftDevName.trim().slice(0, 20);
    if (trimmedName) {
      safeCfgSet("dev", trimmedName);
      setDeviceName(trimmedName);
    }

    safeCfgSet("exp", String(draftDefExp));
    setDefaultExpMs(draftDefExp);
    setComposerExpMs(draftDefExp);

    safeCfgSet("sound", draftSound ? "1" : "0");
    setSoundEnabled(draftSound);

    safeCfgSet("auto", draftAutoCopy ? "1" : "0");
    setAutoCopyIncoming(draftAutoCopy);

    setShowSettings(false);
    showToast("Settings saved");
  };

  const openSettingsSheet = () => {
    setDraftRtdbUrl(customRtdbUrl);
    setDraftDevName(deviceName);
    setDraftDefExp(defaultExpMs);
    setDraftSound(soundEnabled);
    setDraftAutoCopy(autoCopyIncoming);
    setRtdbTestStatus("");
    setShowSettings(true);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return displayItems.filter((item) => {
      if (filterKind === "text" && item.t !== "text") return false;
      if (filterKind === "link" && item.t !== "link") return false;
      if (filterKind === "files" && item.t !== "image" && item.t !== "file")
        return false;
      if (q) {
        const hay = `${item.n || ""} ${item.v || ""} ${item.from}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [displayItems, filterKind, searchQuery]);

  const canonicalRoomUrl = room ? buildCanonicalShareUrl(room) : "";

  const syncBadgeLabel =
    syncMode === "cloud"
      ? "Cloud Live"
      : syncMode === "rtdb"
        ? "Firebase Live"
        : "Local Only";

  const renderTextWithLinks = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s<]+)/g);
    return parts.map((part, idx) =>
      /^https?:\/\/\S+$/i.test(part) ? (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0f9f6e] font-semibold underline decoration-[#0f9f6e]/35 hover:decoration-[#0f9f6e] break-all"
        >
          {part}
        </a>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      ),
    );
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]"
    >
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files) Array.from(files).forEach((f) => void handleSendFile(f));
          e.target.value = "";
        }}
      />

      {/* Unified Apple-Style Frosted Header (Single Row, Clean 3-Zone) */}
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          {/* Left: Back + Emblem + Wordmark */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={room ? leaveRoom : onBackHome}
              title={room ? "Leave Room" : "Back Home"}
              className="min-h-[38px] min-w-[38px] px-2.5 sm:px-3 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-black/[0.06] inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">{room ? "Rooms" : "Home"}</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div
                style={{
                  background: "linear-gradient(145deg, #34d399, #0f9f6e)",
                }}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shadow-[0_3px_10px_rgba(16,185,129,0.28)] shrink-0"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="8" y="3" width="12" height="14" rx="3" />
                  <path d="M16 21H7a3 3 0 0 1-3-3V8" />
                </svg>
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap truncate">
                GAMURA <span className="text-[#0f9f6e]">CLIP</span>
              </span>
            </div>
          </div>

          {/* Right: Sync State + Universe + Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="px-2.5 py-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05] text-[11px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 whitespace-nowrap"
              title="Cross-device sync status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncMode === "local" ? "bg-amber-500" : "bg-[#0f9f6e]"
                }`}
              />
              <span>{syncBadgeLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              title="Add or remove in Universe Apps"
              className={`min-h-[38px] min-w-[38px] px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#E2F5ED] border-[#0f9f6e]/30 text-[#0f9f6e]"
                  : "bg-white border-black/[0.08] text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              <Globe size={14} />
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe" : "Universe"}
              </span>
            </button>

            <button
              type="button"
              onClick={openSettingsSheet}
              aria-label="Clip settings"
              className="min-h-[38px] min-w-[38px] rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-black/[0.06] inline-flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {!room ? (
          /* HOME VIEW */
          <>
            <div className="space-y-2.5">
              <h1
                style={{ textWrap: "balance" }}
                className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.04] text-[#1D1D1F]"
              >
                Copy here.
                <br />
                Paste there.
              </h1>
              <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed max-w-md">
                Share text, links, images, and files between your phone and
                laptop with a six-character room code. Add a PIN for end-to-end
                AES-256 encryption.
              </p>
            </div>

            {/* Primary Apple Action Card */}
            <section className="bg-white rounded-[26px] border border-black/[0.06] shadow-[0_6px_28px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="space-y-2.5">
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pinEntryInput}
                    onChange={(e) => setPinEntryInput(e.target.value)}
                    placeholder="PIN to encrypt clips (optional)"
                    aria-label="Optional encryption PIN"
                    autoComplete="off"
                    className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:border-[#0f9f6e] focus:bg-white text-sm text-[#1D1D1F] outline-none transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void enterRoom(generateRoomCode(), pinEntryInput)}
                  className="w-full min-h-[48px] px-5 rounded-2xl bg-[#0f9f6e] hover:bg-[#0b835a] active:scale-[0.99] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_6px_18px_rgba(15,159,110,0.24)]"
                >
                  <Plus size={17} />
                  <span>Create a new room</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#86868B] font-medium">
                <div className="h-px flex-1 bg-black/[0.07]" />
                <span>or join an existing room</span>
                <div className="h-px flex-1 bg-black/[0.07]" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) =>
                    setJoinCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void enterRoom(joinCodeInput, pinEntryInput);
                    }
                  }}
                  placeholder="ABC123"
                  aria-label="6-character room code"
                  autoCapitalize="characters"
                  className="flex-1 min-w-0 min-h-[48px] px-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:border-[#0f9f6e] focus:bg-white text-center text-xl font-extrabold font-mono tracking-[0.28em] text-[#1D1D1F] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => void enterRoom(joinCodeInput, pinEntryInput)}
                  className="min-h-[48px] px-6 rounded-2xl bg-[#1D1D1F] hover:bg-zinc-800 active:scale-[0.98] text-white text-sm font-bold transition-all cursor-pointer shrink-0"
                >
                  Join
                </button>
              </div>
            </section>

            {/* Recent Rooms */}
            {recentRooms.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E73] px-1">
                  Recent Rooms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => void enterRoom(code, pinEntryInput)}
                      className="min-h-[40px] px-4 rounded-2xl bg-white hover:bg-zinc-50 border border-black/[0.07] font-mono text-sm font-extrabold tracking-[0.16em] text-[#1D1D1F] shadow-2xs transition-colors cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Clean 3-Step Summary */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  title: "1. Create",
                  desc: "Open a room instantly with live cloud sync across devices.",
                },
                {
                  title: "2. Scan QR",
                  desc: "Scan the room QR code on your other phone or computer.",
                },
                {
                  title: "3. Auto-Expire",
                  desc: "Clips vanish cleanly after your chosen timeout.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="bg-white/80 rounded-2xl border border-black/[0.06] p-4 space-y-1"
                >
                  <div className="text-xs font-bold text-[#1D1D1F]">
                    {step.title}
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </section>
          </>
        ) : (
          /* ACTIVE ROOM VIEW */
          <div className="space-y-4">
            {/* Room Header Bar */}
            <section className="bg-white rounded-[24px] border border-black/[0.06] shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#6E6E73] tabular-nums">
                  {onlineCount} {onlineCount > 1 ? "devices" : "device"} active
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-[0.22em] text-[#0f9f6e] mt-0.5 tabular-nums">
                  {room}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShare(true)}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#E2F5ED] hover:bg-[#D1EFE3] text-[#0f9f6e] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <QrCode size={14} />
                  <span>Share QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPinSheet(true)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                    pinLocked
                      ? "bg-[#1D1D1F] border-transparent text-white"
                      : "bg-[#F5F5F7] hover:bg-zinc-200/80 border-black/[0.05] text-[#1D1D1F]"
                  }`}
                >
                  {pinLocked ? <Lock size={13} /> : <LockOpen size={13} />}
                  <span>{pinLocked ? "Locked" : "PIN"}</span>
                </button>

                <button
                  type="button"
                  onClick={leaveRoom}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Leave
                </button>
              </div>
            </section>

            {/* Composer Card with Drag-and-Drop */}
            <section
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                Array.from(e.dataTransfer.files).forEach((f) => void handleSendFile(f));
              }}
              className={`bg-white rounded-[24px] border p-4 shadow-xs space-y-3 transition-all ${
                isDragging
                  ? "border-[#0f9f6e] ring-2 ring-[#0f9f6e]/20"
                  : "border-black/[0.06]"
              }`}
            >
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                placeholder="Type or paste text, a link, or drop an image…"
                aria-label="Clip content"
                className="w-full min-h-[88px] resize-y p-3.5 rounded-2xl bg-[#F5F5F7] border border-transparent focus:border-[#0f9f6e] focus:bg-white text-sm sm:text-base text-[#1D1D1F] outline-none transition-colors"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendText}
                  className="flex-1 min-w-[120px] min-h-[44px] px-5 rounded-2xl bg-[#0f9f6e] hover:bg-[#0b835a] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{isSending ? "Sending…" : "Send"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboard()}
                  className="min-h-[44px] px-4 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Copy size={13} />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-4 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Upload size={13} />
                  <span>File</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.05]">
                <span className="text-xs font-medium text-[#6E6E73]">
                  Auto-delete after
                </span>
                <select
                  value={composerExpMs}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setComposerExpMs(next);
                    safeCfgSet("exp", String(next));
                  }}
                  aria-label="Delete clip after"
                  className="min-h-[36px] px-3 rounded-xl bg-[#F5F5F7] border border-black/[0.05] text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value={600000}>10 minutes</option>
                  <option value={3600000}>1 hour</option>
                  <option value={86400000}>24 hours</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </section>

            {/* Filter & Search Toolbar (only shown when clips exist) */}
            {displayItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clips"
                    aria-label="Search clips"
                    className="w-full min-h-[40px] pl-9 pr-3 rounded-2xl bg-white border border-black/[0.06] text-xs sm:text-sm text-[#1D1D1F] outline-none focus:border-[#0f9f6e]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-black/[0.06] overflow-x-auto">
                  {(
                    [
                      ["all", "All"],
                      ["text", "Text"],
                      ["link", "Links"],
                      ["files", "Files"],
                    ] as [ClipFilter, string][]
                  ).map(([key, lbl]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilterKind(key)}
                      className={`min-h-[32px] px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        filterKind === key
                          ? "bg-[#0f9f6e] text-white"
                          : "text-[#6E6E73] hover:text-[#1D1D1F]"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clip List */}
            <section className="space-y-3">
              {displayItems.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-black/[0.06] p-8 text-center space-y-1.5">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    Nothing here yet
                  </div>
                  <p className="text-xs text-[#6E6E73] max-w-xs mx-auto leading-relaxed">
                    Send text, a link, or a file from here, or scan the QR code
                    on another device to paste across instantly.
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-black/[0.06] p-8 text-center text-xs text-[#6E6E73]">
                  No clips match your filter.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isLongText =
                    (item.t === "text" || item.t === "link") &&
                    (item.v.length > 300 || item.v.split("\n").length > 6);
                  const expanded = Boolean(expandedIds[item.id]);

                  return (
                    <article
                      key={item.id}
                      className={`bg-white rounded-[22px] border p-4 shadow-2xs space-y-3 ${
                        item.pin
                          ? "border-[#0f9f6e]/50 ring-1 ring-[#0f9f6e]/15"
                          : "border-black/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#86868B] tabular-nums">
                        <span className="font-semibold text-[#6E6E73] truncate">
                          {item.from}
                        </span>
                        <span className="shrink-0">
                          {formatAgo(item.ts, nowTick)} ·{" "}
                          {formatLeft(item.ts, item.exp, item.pin, nowTick)}
                        </span>
                      </div>

                      {item.locked ? (
                        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] text-xs text-[#1D1D1F] flex items-center gap-2.5">
                          <Lock size={15} className="text-[#0f9f6e] shrink-0" />
                          <span>
                            {item.badPin
                              ? "Cannot decrypt this clip. Check the room PIN."
                              : "This clip is AES-256 encrypted. Enter the room PIN to read."}
                          </span>
                        </div>
                      ) : item.t === "image" ? (
                        <button
                          type="button"
                          onClick={() => setZoomImgUrl(item.v)}
                          className="block w-full rounded-2xl overflow-hidden bg-[#F5F5F7] border border-black/[0.05] cursor-zoom-in"
                        >
                          <img
                            src={item.v}
                            alt={item.n || "Shared image"}
                            className="w-full max-h-[340px] object-contain mx-auto"
                          />
                        </button>
                      ) : item.t === "file" ? (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F7]">
                          <div className="w-11 h-11 rounded-xl bg-[#0f9f6e] text-white flex items-center justify-center shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-[#1D1D1F] truncate">
                              {item.n || "File"}
                            </div>
                            <div className="text-[11px] text-[#6E6E73] tabular-nums">
                              {formatBytes(item.s)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div
                            className={`text-sm sm:text-[15px] leading-relaxed text-[#1D1D1F] whitespace-pre-wrap break-words ${
                              isLongText && !expanded ? "line-clamp-6" : ""
                            }`}
                          >
                            {renderTextWithLinks(item.v)}
                          </div>
                          {isLongText && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIds((prev) => ({
                                  ...prev,
                                  [item.id]: !expanded,
                                }))
                              }
                              className="text-xs font-semibold text-[#0f9f6e] cursor-pointer"
                            >
                              {expanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {item.locked ? (
                          <button
                            type="button"
                            onClick={() => setShowPinSheet(true)}
                            className="min-h-[36px] px-3.5 rounded-xl bg-[#0f9f6e] text-white text-xs font-bold cursor-pointer"
                          >
                            Enter PIN
                          </button>
                        ) : item.t === "image" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleCopyImage(item.v)}
                              className="min-h-[36px] px-3.5 rounded-xl bg-[#0f9f6e] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} />
                              <span>Copy Image</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleDownloadClipFile(
                                  item.v,
                                  item.n || "gamura-clip.jpg",
                                )
                              }
                              className="min-h-[36px] px-3 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Download size={12} />
                              <span>Save</span>
                            </button>
                          </>
                        ) : item.t === "file" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDownloadClipFile(
                                item.v,
                                item.n || "gamura-file",
                              )
                            }
                            className="min-h-[36px] px-3.5 rounded-xl bg-[#0f9f6e] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                copyPlainText(item.v)
                                  .then(() => showToast("Copied to clipboard"))
                                  .catch(() => showToast("Select text to copy"))
                              }
                              className="min-h-[36px] px-3.5 rounded-xl bg-[#0f9f6e] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} />
                              <span>Copy</span>
                            </button>
                            {item.t === "link" && (
                              <a
                                href={item.v}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[36px] px-3 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1"
                              >
                                <ExternalLink size={12} />
                                <span>Open</span>
                              </a>
                            )}
                          </>
                        )}

                        {!item.locked && (
                          <button
                            type="button"
                            onClick={() => void handleTogglePin(item)}
                            className="min-h-[36px] px-3 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1 cursor-pointer"
                          >
                            {item.pin ? <PinOff size={12} /> : <Pin size={12} />}
                            <span>{item.pin ? "Unpin" : "Pin"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDeleteClip(item.id)}
                          className="min-h-[36px] px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            {displayItems.length > 0 && (
              <div className="flex justify-center pt-2 pb-6">
                <button
                  type="button"
                  onClick={() => void handleClearAllClips()}
                  className="min-h-[40px] px-4 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  {confirmClear ? "Tap again to confirm clear" : "Clear all clips"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SHARE QR SHEET (Apple Native Sheet with Clean /clip#CODE URL!) */}
      {showShare && room && (
        <div
          onClick={() => setShowShare(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-4 text-center"
          >
            <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-[#1D1D1F]">
                Join from another device
              </h2>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] cursor-pointer"
                aria-label="Close share sheet"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Scan this QR code or open the link below on another phone or
              laptop.
              {pinLocked
                ? " Share your room PIN separately so the other device can decrypt."
                : ""}
            </p>

            <div className="inline-flex p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs mx-auto">
              <QRCodeSVG
                value={canonicalRoomUrl}
                size={196}
                bgColor="#ffffff"
                fgColor="#0b1511"
                level="M"
              />
            </div>

            <div className="space-y-2 text-left">
              <input
                type="text"
                readOnly
                value={canonicalRoomUrl}
                aria-label="Room share link"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-xs font-mono text-[#1D1D1F] outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyPlainText(canonicalRoomUrl)
                      .then(() => showToast("Room link copied"))
                      .catch(() => showToast("Copy link manually"))
                  }
                  className="flex-1 min-h-[44px] rounded-xl bg-[#0f9f6e] hover:bg-[#0b835a] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copy link</span>
                </button>

                {typeof navigator !== "undefined" &&
                  typeof navigator.share === "function" && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator
                          .share({
                            title: `Gamura Clip · ${room}`,
                            url: canonicalRoomUrl,
                          })
                          .catch(() => {});
                      }}
                      className="min-h-[44px] px-4 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-bold text-[#1D1D1F] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS SHEET */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88dvh] overflow-y-auto bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-5"
          >
            <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={17} className="text-[#0f9f6e]" />
                <h2 className="text-lg font-extrabold tracking-tight text-[#1D1D1F]">
                  Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] cursor-pointer"
                aria-label="Close settings"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#E2F5ED]/75 border border-[#0f9f6e]/20 text-xs text-[#0b1511] leading-relaxed">
                <strong className="text-[#0f9f6e]">Gamura Cloud Sync is active</strong>{" "}
                — cross-device clipboard rooms sync automatically between your
                phone and laptop without manual setup.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F]">
                  This device&apos;s name
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={draftDevName}
                  onChange={(e) => setDraftDevName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-sm text-[#1D1D1F] outline-none focus:border-[#0f9f6e]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F]">
                  Default auto-delete after
                </label>
                <select
                  value={draftDefExp}
                  onChange={(e) => setDraftDefExp(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-sm text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value={600000}>10 minutes</option>
                  <option value={3600000}>1 hour</option>
                  <option value={86400000}>24 hours</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              <div className="divide-y divide-black/[0.06] rounded-2xl bg-[#F5F5F7] px-4">
                <label className="flex items-center justify-between py-3.5 text-sm font-medium text-[#1D1D1F] cursor-pointer">
                  <span>Sound &amp; vibration for new clips</span>
                  <input
                    type="checkbox"
                    checked={draftSound}
                    onChange={(e) => setDraftSound(e.target.checked)}
                    className="w-5 h-5 accent-[#0f9f6e] cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between py-3.5 text-sm font-medium text-[#1D1D1F] cursor-pointer">
                  <span>Auto-copy incoming text clips</span>
                  <input
                    type="checkbox"
                    checked={draftAutoCopy}
                    onChange={(e) => setDraftAutoCopy(e.target.checked)}
                    className="w-5 h-5 accent-[#0f9f6e] cursor-pointer"
                  />
                </label>
              </div>

              {/* Optional Custom Firebase RTDB Override */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <label className="text-xs font-bold text-[#6E6E73]">
                  Custom Firebase Realtime Database URL (Optional)
                </label>
                <input
                  type="url"
                  value={draftRtdbUrl}
                  onChange={(e) => setDraftRtdbUrl(e.target.value)}
                  placeholder="Leave empty to use Gamura Cloud Sync"
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-xs text-[#1D1D1F] outline-none focus:border-[#0f9f6e]"
                />
                {draftRtdbUrl.trim() && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleTestCustomRtdb()}
                      className="min-h-[34px] px-3 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                    >
                      Test connection
                    </button>
                    {rtdbTestStatus && (
                      <span className="text-xs text-[#6E6E73]">
                        {rtdbTestStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex-1 min-h-[46px] rounded-2xl bg-[#0f9f6e] hover:bg-[#0b835a] text-white text-sm font-bold cursor-pointer transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="min-h-[46px] px-5 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM PIN SHEET */}
      {showPinSheet && (
        <div
          onClick={() => setShowPinSheet(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-4"
          >
            <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-[#1D1D1F]">
                Room PIN
              </h2>
              <button
                type="button"
                onClick={() => setShowPinSheet(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] cursor-pointer"
                aria-label="Close PIN modal"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Clips are encrypted on your device using AES-256 before sending.
              Everyone in the room needs the same PIN to decrypt.
            </p>

            <input
              type="password"
              inputMode="numeric"
              value={modalPinInput}
              onChange={(e) => setModalPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleApplyPin();
              }}
              placeholder="Enter room PIN"
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-sm text-[#1D1D1F] outline-none focus:border-[#0f9f6e]"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleApplyPin()}
                className="flex-1 min-h-[44px] rounded-xl bg-[#0f9f6e] hover:bg-[#0b835a] text-white text-sm font-bold cursor-pointer"
              >
                Use PIN
              </button>
              <button
                type="button"
                onClick={() => setShowPinSheet(false)}
                className="min-h-[44px] px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {pinLocked && (
              <button
                type="button"
                onClick={() => {
                  roomKeyRef.current = null;
                  setPinLocked(false);
                  setShowPinSheet(false);
                  showToast("New clips won't be encrypted");
                }}
                className="text-xs font-semibold text-red-600 cursor-pointer"
              >
                Stop encrypting new clips
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE ZOOM */}
      {zoomImgUrl && (
        <div
          onClick={() => setZoomImgUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={zoomImgUrl}
            alt="Full size clip"
            className="max-w-full max-h-[88dvh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Apple-Style Floating Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-semibold shadow-xl inline-flex items-center gap-2">
          <Check size={14} className="text-[#34d399]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
