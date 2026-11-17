import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  MessageCircle,
  Mic,
  MicOff,
  Moon,
  Phone,
  PhoneOff,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  UserPlus,
  Video,
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
import { loadUniversePreferences } from "./UniverseSettingsView";

interface GamuraMessengerPageProps {
  onBackHome: () => void;
}

interface MessengerProfile {
  name: string;
  uid: string;
}

interface EncryptedMsgRecord {
  id: string;
  me: boolean;
  ct: string; // hex(12-byte iv) + hex(ciphertext)
  exp: number; // 0 if permanent, else timestamp ms
  ts: number;
}

interface MessengerContact {
  name: string;
  uid: string;
  key: CryptoKey;
  keyRawHex: string;
  safety: string;
  last: string;
  msgs: EncryptedMsgRecord[];
}

interface StoredContactEntry {
  name: string;
  uid: string;
  keyRawHex: string;
  safety: string;
  last: string;
  msgs: EncryptedMsgRecord[];
}

interface DecryptedBubble {
  id: string;
  me: boolean;
  text: string;
  ct: string;
  exp: number;
  ts: number;
}

interface CallLogEntry {
  id: string;
  name: string;
  uid: string;
  video: boolean;
  durationSec: number;
  ts: number;
}

type MessengerTab = "chats" | "calls" | "tools" | "me";

const PROFILE_STORAGE_KEY = "gm_me";
const CONTACTS_STORAGE_KEY = "gamura_messenger_contacts_v1";
const THEME_STORAGE_KEY = "gamura_messenger_theme_v1";

const APPLE_FONT: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hexStr: string): Uint8Array {
  const clean = hexStr.trim();
  const pairs = clean.match(/../g);
  if (!pairs) return new Uint8Array(0);
  return new Uint8Array(pairs.map((x) => parseInt(x, 16)));
}

function generateMessengerUid(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(rnd)
    .map((x) => alphabet[x % alphabet.length])
    .join("");
  return `GM-${code.slice(0, 4)}-${code.slice(4)}`;
}

async function deriveVaultKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 150000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function MessengerLogoSvg({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 76 76" aria-hidden="true">
      <rect width="76" height="76" rx="22" fill="#e5202e" />
      <path
        d="M38 17c-11.6 0-21 8-21 18 0 5.6 3 10.6 7.7 13.9L23 58l9.7-5.2c1.7.4 3.5.6 5.3.6 11.6 0 21-8 21-18S49.6 17 38 17z"
        fill="#fff"
      />
      <rect x="31" y="32" width="14" height="11" rx="3" fill="#e5202e" />
      <path
        d="M33.5 32v-3a4.5 4.5 0 0 1 9 0v3"
        fill="none"
        stroke="#e5202e"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const REPLY_LINES = [
  "Received, and only your device keys could read it.",
  "Sealed and verified with ECDH P-256.",
  "Nice. Encryption keys match on both ends.",
  "Tap Sealed in the header anytime to inspect the ciphertext.",
];

export default function GamuraMessengerPage({
  onBackHome,
}: GamuraMessengerPageProps) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
    } catch {
      return false;
    }
  });

  const [installedInUniverse, setInstalledInUniverse] = useState(() => {
    const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
    return list.some((a) => a.id === "gamura-messenger");
  });

  const [profile, setProfile] = useState<MessengerProfile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.uid && parsed?.name ? parsed : null;
    } catch {
      return null;
    }
  });

  const [nameInput, setNameInput] = useState("");
  const [tab, setTab] = useState<MessengerTab>("chats");
  const [contacts, setContacts] = useState<MessengerContact[]>([]);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [decryptedMsgs, setDecryptedMsgs] = useState<DecryptedBubble[]>([]);
  const [showCiphertext, setShowCiphertext] = useState(false);
  const [disappearSec, setDisappearSec] = useState<number>(0);

  // Add Contact Modal
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newContactUid, setNewContactUid] = useState("");
  const [newContactName, setNewContactName] = useState("");

  // Safety Number & Panic Wipe Modals
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  const [showWipeSheet, setShowWipeSheet] = useState(false);

  // Vault Tool State
  const [vaultText, setVaultText] = useState("");
  const [vaultPass, setVaultPass] = useState("");
  const [showVaultPass, setShowVaultPass] = useState(false);

  // Active Call Overlay State
  const [activeCall, setActiveCall] = useState<{
    name: string;
    uid: string;
    video: boolean;
    status: string;
    muted: boolean;
    startedAt: number | null;
  } | null>(null);
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const callVideoRef = useRef<HTMLVideoElement | null>(null);
  const callStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const callRingTimerRef = useRef<number | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const msgsEndRef = useRef<HTMLDivElement | null>(null);
  const myKeyPairRef = useRef<Promise<CryptoKeyPair> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2100);
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Gamura Messenger · Encrypted Chats";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  }, [dark]);

  useEffect(() => {
    const syncUniverse = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(list.some((a) => a.id === "gamura-messenger"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    window.addEventListener("storage", syncUniverse);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
      window.removeEventListener("storage", syncUniverse);
    };
  }, []);

  const handleToggleUniverseInstall = () => {
    const appDef = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-messenger");
    if (!appDef) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-messenger");
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(appDef);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps ✓");
    }
  };

  const getMyKeyPair = useCallback(() => {
    if (!myKeyPairRef.current) {
      myKeyPairRef.current = crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"],
      );
    }
    return myKeyPairRef.current;
  }, []);

  const persistContacts = useCallback((items: MessengerContact[]) => {
    const prefs = loadUniversePreferences();
    if (!prefs.allowAccess.storage) return;
    try {
      const serialized: StoredContactEntry[] = items.map((c) => ({
        name: c.name,
        uid: c.uid,
        keyRawHex: c.keyRawHex,
        safety: c.safety,
        last: c.last,
        msgs: c.msgs,
      }));
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(serialized));
    } catch {
      // ignore quota errors
    }
  }, []);

  const createEncryptedContact = useCallback(
    async (name: string, uid: string): Promise<MessengerContact> => {
      const peerPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"],
      );
      const mine = await getMyKeyPair();
      const aesKey = await crypto.subtle.deriveKey(
        { name: "ECDH", public: peerPair.publicKey },
        mine.privateKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
      );
      const exportedAes = await crypto.subtle.exportKey("raw", aesKey);
      const aHex = toHex(await crypto.subtle.exportKey("raw", mine.publicKey));
      const bHex = toHex(await crypto.subtle.exportKey("raw", peerPair.publicKey));
      const digest = new Uint8Array(
        await crypto.subtle.digest("SHA-256", enc.encode([aHex, bHex].sort().join())),
      );
      const safety = [0, 1, 2, 3, 4, 5]
        .map((i) => String(((digest[i * 2] << 8) | digest[i * 2 + 1]) % 100000).padStart(5, "0"))
        .join(" ");

      return {
        name,
        uid,
        key: aesKey,
        keyRawHex: toHex(exportedAes),
        safety,
        last: "Say hello",
        msgs: [],
      };
    },
    [getMyKeyPair],
  );

  const encryptMessageForContact = useCallback(
    async (contact: MessengerContact, text: string, mine: boolean): Promise<MessengerContact> => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ctBuf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        contact.key,
        enc.encode(text),
      );
      const msg: EncryptedMsgRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        me: mine,
        ct: toHex(iv) + toHex(ctBuf),
        exp: disappearSec ? Date.now() + disappearSec * 1000 : 0,
        ts: Date.now(),
      };
      return {
        ...contact,
        last: text,
        msgs: [...contact.msgs, msg],
      };
    },
    [disappearSec],
  );

  // Boot / Restore contacts when profile is available
  useEffect(() => {
    if (!profile) {
      setContacts([]);
      setActiveUid(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
        if (raw) {
          const parsed: StoredContactEntry[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const restored = await Promise.all(
              parsed.map(async (entry) => {
                const rawBytes = fromHex(entry.keyRawHex);
                const key = await crypto.subtle.importKey(
                  "raw",
                  rawBytes as BufferSource,
                  { name: "AES-GCM", length: 256 },
                  true,
                  ["encrypt", "decrypt"],
                );
                return {
                  name: entry.name,
                  uid: entry.uid,
                  key,
                  keyRawHex: entry.keyRawHex,
                  safety: entry.safety,
                  last: entry.last,
                  msgs: (entry.msgs || []).filter((m) => !m.exp || m.exp > Date.now()),
                } satisfies MessengerContact;
              }),
            );
            if (!cancelled) {
              setContacts(restored);
              setActiveUid((prev) => prev || restored[0]?.uid || null);
            }
            return;
          }
        }
      } catch {
        // fall through to fresh echo bootstrap
      }

      const baseEcho = await createEncryptedContact("Gamura Echo", "GM-ECHO-0001");
      const seededEcho = await encryptMessageForContact(
        baseEcho,
        `Welcome, ${profile.name}. This chat is sealed with ECDH P-256 & AES-256-GCM keys made on your device.`,
        false,
      );
      if (!cancelled) {
        setContacts([seededEcho]);
        setActiveUid(seededEcho.uid);
        persistContacts([seededEcho]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [createEncryptedContact, encryptMessageForContact, persistContacts, profile]);

  const activeContact = useMemo(
    () => contacts.find((c) => c.uid === activeUid) || null,
    [contacts, activeUid],
  );

  // Decrypt messages for active conversation
  useEffect(() => {
    if (!activeContact) {
      setDecryptedMsgs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const resolved: DecryptedBubble[] = [];
      for (const m of activeContact.msgs) {
        try {
          const iv = fromHex(m.ct.slice(0, 24));
          const cipher = fromHex(m.ct.slice(24));
          const plainBuf = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as BufferSource },
            activeContact.key,
            cipher as BufferSource,
          );
          resolved.push({
            id: m.id,
            me: m.me,
            text: dec.decode(plainBuf),
            ct: m.ct,
            exp: m.exp,
            ts: m.ts,
          });
        } catch {
          resolved.push({
            id: m.id,
            me: m.me,
            text: "[Encrypted message]",
            ct: m.ct,
            exp: m.exp,
            ts: m.ts,
          });
        }
      }
      if (!cancelled) {
        setDecryptedMsgs(resolved);
        window.setTimeout(() => {
          msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 40);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeContact]);

  // Disappearing messages 1-second sweep
  useEffect(() => {
    const iv = window.setInterval(() => {
      const now = Date.now();
      setContacts((prev) => {
        let changed = false;
        const next = prev.map((c) => {
          const filtered = c.msgs.filter((m) => !m.exp || m.exp > now);
          if (filtered.length !== c.msgs.length) {
            changed = true;
            return {
              ...c,
              msgs: filtered,
              last: filtered.length === 0 ? "Messages vanished" : c.last,
            };
          }
          return c;
        });
        if (changed) {
          persistContacts(next);
          return next;
        }
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [persistContacts]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) {
      showToast("Enter your name to create an ID");
      return;
    }
    const created: MessengerProfile = {
      name: clean,
      uid: generateMessengerUid(),
    };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(created));
    } catch {
      // ignore storage errors
    }
    setProfile(created);
    setNameInput("");
    showToast(`Created ${created.uid} ✓`);
  };

  const handleSendMessage = async () => {
    const txt = messageInput.trim();
    if (!txt || !activeContact) return;
    const prefs = loadUniversePreferences();
    if (!prefs.allowAccess.messages) {
      showToast("Turn Messages Access ON in Universe Settings to send messages.");
      return;
    }

    const targetUid = activeContact.uid;
    setMessageInput("");

    const updatedTarget = await encryptMessageForContact(activeContact, txt, true);
    setContacts((prev) => {
      const next = prev.map((c) => (c.uid === targetUid ? updatedTarget : c));
      persistContacts(next);
      return next;
    });

    // Encrypted peer echo response
    window.setTimeout(async () => {
      const replyText = REPLY_LINES[Math.floor(Math.random() * REPLY_LINES.length)];
      setContacts((prev) => {
        const currentTarget = prev.find((c) => c.uid === targetUid);
        if (!currentTarget) return prev;
        encryptMessageForContact(currentTarget, replyText, false).then((withReply) => {
          setContacts((latest) => {
            const merged = latest.map((c) => (c.uid === targetUid ? withReply : c));
            persistContacts(merged);
            return merged;
          });
        });
        return prev;
      });
    }, 850);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUid = newContactUid.trim().toUpperCase();
    if (!/^GM-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanUid)) {
      showToast("UID must match GM-XXXX-XXXX");
      return;
    }
    if (contacts.some((c) => c.uid === cleanUid)) {
      showToast("Contact already in your chats");
      return;
    }
    const label = newContactName.trim() || `Contact ${cleanUid.slice(-4)}`;
    const contact = await createEncryptedContact(label, cleanUid);
    const next = [contact, ...contacts];
    setContacts(next);
    persistContacts(next);
    setActiveUid(contact.uid);
    setNewContactUid("");
    setNewContactName("");
    setShowAddSheet(false);
    setTab("chats");
    showToast(`${label} added with ECDH P-256 key ✓`);
  };

  const endCurrentCall = useCallback(() => {
    if (callRingTimerRef.current) window.clearTimeout(callRingTimerRef.current);
    if (callTimerRef.current) window.clearInterval(callTimerRef.current);
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop());
      callStreamRef.current = null;
    }
    setActiveCall((prev) => {
      if (prev) {
        const dur = prev.startedAt ? Math.max(1, Math.round((Date.now() - prev.startedAt) / 1000)) : 0;
        setCallLogs((logs) => [
          {
            id: `call_${Date.now()}`,
            name: prev.name,
            uid: prev.uid,
            video: prev.video,
            durationSec: dur,
            ts: Date.now(),
          },
          ...logs,
        ]);
      }
      return null;
    });
  }, []);

  const startCall = async (contact: MessengerContact, video: boolean) => {
    if (callRingTimerRef.current) window.clearTimeout(callRingTimerRef.current);
    if (callTimerRef.current) window.clearInterval(callTimerRef.current);
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop());
      callStreamRef.current = null;
    }

    setActiveCall({
      name: contact.name,
      uid: contact.uid,
      video,
      status: "Ringing…",
      muted: false,
      startedAt: null,
    });

    if (video) {
      const prefs = loadUniversePreferences();
      if (!prefs.allowAccess.camera) {
        showToast("Camera access is turned off in Universe Settings");
      } else if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          callStreamRef.current = stream;
          if (callVideoRef.current) {
            callVideoRef.current.srcObject = stream;
          }
        } catch {
          showToast("Camera unavailable — using voice-only overlay");
        }
      }
    }

    callRingTimerRef.current = window.setTimeout(() => {
      const startTs = Date.now();
      setActiveCall((cur) =>
        cur ? { ...cur, status: "Encrypted call · 00:00", startedAt: startTs } : null,
      );
      let secs = 0;
      callTimerRef.current = window.setInterval(() => {
        secs += 1;
        const mm = String(Math.floor(secs / 60)).padStart(2, "0");
        const ss = String(secs % 60).padStart(2, "0");
        setActiveCall((cur) =>
          cur ? { ...cur, status: `Encrypted call · ${mm}:${ss}` } : null,
        );
      }, 1000);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (callRingTimerRef.current) window.clearTimeout(callRingTimerRef.current);
      if (callTimerRef.current) window.clearInterval(callTimerRef.current);
      if (callStreamRef.current) {
        callStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleVaultLock = async () => {
    if (!vaultText || !vaultPass) {
      showToast("Add a note and a passphrase");
      return;
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveVaultKey(vaultPass, salt);
    const cipherBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      enc.encode(vaultText),
    );
    setVaultText(toHex(salt) + toHex(iv) + toHex(cipherBuf));
    showToast("Note locked with AES-256 ✓");
  };

  const handleVaultUnlock = async () => {
    const clean = vaultText.trim();
    if (!clean || !vaultPass) {
      showToast("Paste locked ciphertext and passphrase");
      return;
    }
    try {
      const bytes = fromHex(clean);
      if (bytes.length < 29) throw new Error("Short payload");
      const salt = bytes.slice(0, 16);
      const iv = bytes.slice(16, 28);
      const cipher = bytes.slice(28);
      const key = await deriveVaultKey(vaultPass, salt);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        cipher as BufferSource,
      );
      setVaultText(dec.decode(plain));
      showToast("Unlocked ✓");
    } catch {
      showToast("Wrong passphrase or invalid locked text");
    }
  };

  const handlePanicWipe = () => {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(CONTACTS_STORAGE_KEY);
    } catch {
      // ignore
    }
    myKeyPairRef.current = null;
    setProfile(null);
    setContacts([]);
    setActiveUid(null);
    setDecryptedMsgs([]);
    setCallLogs([]);
    setVaultText("");
    setVaultPass("");
    setShowWipeSheet(false);
    showToast("Account, chats & keys wiped from this device");
  };

  const handleCopyUid = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.uid);
      showToast("UID copied to clipboard ✓");
    } catch {
      showToast(profile.uid);
    }
  };

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.uid.toLowerCase().includes(q),
    );
  }, [contacts, searchQuery]);

  // Theme tokens
  const surfaceBg = dark ? "bg-[#000000] text-[#f5f5f7]" : "bg-[#F5F5F7] text-[#1D1D1F]";
  const cardBg = dark
    ? "bg-[#1C1C1E] border-white/[0.1] text-[#f5f5f7]"
    : "bg-white border-black/[0.06] text-[#1D1D1F]";
  const subCardBg = dark ? "bg-[#2C2C2E] border-white/[0.08]" : "bg-[#F5F5F7] border-black/[0.06]";
  const mutedText = dark ? "text-[#98989D]" : "text-[#6E6E73]";

  return (
    <div style={APPLE_FONT} className={`min-h-screen flex flex-col transition-colors ${surfaceBg}`}>
      {/* Top Apple Studio Navigation Bar */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-2xl border-b shrink-0 ${
          dark
            ? "bg-[#0a0a0c]/88 border-white/[0.08]"
            : "bg-white/88 border-black/[0.06]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[38px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                dark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F]"
              }`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden sm:inline-flex min-h-[38px] px-3 rounded-full text-xs font-semibold items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                dark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F]"
              }`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-0.5 min-w-0">
              <div className="shrink-0 shadow-xs rounded-[9px] overflow-hidden">
                <MessengerLogoSvg size={32} />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold tracking-tight truncate">
                  Gamura <span className="text-[#e5202e]">Messenger</span>
                </div>
                <div className={`hidden md:block text-[10px] leading-none ${mutedText}`}>
                  ECDH P-256 · AES-256-GCM Device-Sealed Messaging
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle Light or Dark mode"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                dark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F]"
              }`}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#e5202e]/15 text-[#e5202e] border border-[#e5202e]/30"
                  : dark
                    ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                    : "bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F]"
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden xs:inline sm:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ONBOARDING VIEW (NO PROFILE YET) */}
      {!profile ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <form
            onSubmit={handleCreateAccount}
            className={`w-full max-w-md border rounded-[32px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.08)] space-y-6 ${cardBg}`}
          >
            <div className="flex items-center justify-between">
              <MessengerLogoSvg size={68} />
              <span className="text-[11px] font-semibold text-[#e5202e]">
                On-Device Keys
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Gamura Messenger
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Every message is sealed on your device using WebCrypto ECDH P-256 and AES-256-GCM. Nobody else can read it, not even us.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="gm-onb-name" className="text-xs font-semibold block">
                Display Name
              </label>
              <input
                id="gm-onb-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                maxLength={24}
                autoComplete="off"
                className={`w-full border rounded-2xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#e5202e] ${subCardBg}`}
              />
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-[#e5202e] hover:bg-[#c4151f] active:scale-[0.99] text-white font-semibold text-sm transition-all cursor-pointer shadow-sm"
              >
                Create account
              </button>
            </div>
          </form>
        </main>
      ) : (
        /* MAIN WORKSPACE (Desktop Split-View / Mobile Single-Column Tab Shell) */
        <main className="flex-1 max-w-6xl w-full mx-auto p-0 sm:p-5 flex flex-col min-h-0">
          <div
            className={`flex-1 sm:border sm:rounded-[28px] overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr] min-h-[calc(100vh-56px)] sm:min-h-[640px] sm:h-[calc(100vh-104px)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] ${cardBg}`}
          >
            {/* LEFT PANE: Navigation Tabs + List */}
            <aside
              className={`flex flex-col min-h-0 border-r ${
                dark ? "border-white/[0.08]" : "border-black/[0.06]"
              } ${activeUid && tab === "chats" ? "hidden md:flex" : "flex"}`}
            >
              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {tab === "chats" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Chats
                      </h1>
                      <button
                        type="button"
                        onClick={() => setShowAddSheet(true)}
                        className="px-3 py-1.5 rounded-full bg-[#e5202e]/12 hover:bg-[#e5202e]/20 text-[#e5202e] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <UserPlus size={13} />
                        <span>Add UID</span>
                      </button>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${subCardBg}`}
                    >
                      <Search size={14} className={mutedText} />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats or UID"
                        className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
                      />
                    </div>

                    <div
                      className={`divide-y ${
                        dark ? "divide-white/[0.07]" : "divide-black/[0.06]"
                      }`}
                    >
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((c) => {
                          const selected = activeUid === c.uid;
                          return (
                            <button
                              key={c.uid}
                              type="button"
                              onClick={() => setActiveUid(c.uid)}
                              className={`w-full flex items-center gap-3.5 py-3 px-2.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                selected
                                  ? dark
                                    ? "bg-[#e5202e]/16"
                                    : "bg-[#e5202e]/[0.07]"
                                  : dark
                                    ? "hover:bg-white/[0.04]"
                                    : "hover:bg-[#F5F5F7]"
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ring-2 ring-[#e5202e] ring-offset-2 ${
                                  dark
                                    ? "bg-[#2C2C2E] ring-offset-[#1C1C1E]"
                                    : "bg-[#F5F5F7] ring-offset-white"
                                }`}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold truncate">
                                    {c.name}
                                  </span>
                                  <span className={`text-[10px] font-mono shrink-0 ${mutedText}`}>
                                    {c.uid}
                                  </span>
                                </div>
                                <div className={`text-xs truncate mt-0.5 ${mutedText}`}>
                                  {c.last}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className={`py-8 text-center text-xs ${mutedText}`}>
                          No matching chats. Add a contact by UID.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddSheet(true)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${subCardBg}`}
                    >
                      Add contact by UID
                    </button>
                  </div>
                )}

                {tab === "calls" && (
                  <div className="space-y-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Calls
                    </h1>

                    <div
                      className={`divide-y ${
                        dark ? "divide-white/[0.07]" : "divide-black/[0.06]"
                      }`}
                    >
                      {contacts.map((c) => (
                        <div
                          key={c.uid}
                          className="flex items-center gap-3 py-3"
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ring-2 ring-[#e5202e] ring-offset-2 ${
                              dark
                                ? "bg-[#2C2C2E] ring-offset-[#1C1C1E]"
                                : "bg-[#F5F5F7] ring-offset-white"
                            }`}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{c.name}</div>
                            <div className={`text-xs font-mono truncate ${mutedText}`}>
                              {c.uid}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startCall(c, false)}
                            aria-label={`Voice call ${c.name}`}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[#e5202e] transition-colors cursor-pointer ${subCardBg}`}
                          >
                            <Phone size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => startCall(c, true)}
                            aria-label={`Video call ${c.name}`}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[#e5202e] transition-colors cursor-pointer ${subCardBg}`}
                          >
                            <Video size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {callLogs.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className={`text-xs font-semibold ${mutedText}`}>
                          Recent Calls
                        </div>
                        <div className="space-y-1.5">
                          {callLogs.map((log) => (
                            <div
                              key={log.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${subCardBg}`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{log.name}</div>
                                <div className={mutedText}>
                                  {log.video ? "Encrypted Video Call" : "Encrypted Voice Call"}
                                </div>
                              </div>
                              <span className={`font-mono tabular-nums ${mutedText}`}>
                                {log.durationSec > 0 ? `${log.durationSec}s` : "Cancelled"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "tools" && (
                  <div className="space-y-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Tools
                    </h1>

                    {/* Vault Card */}
                    <div className={`rounded-2xl border p-4 space-y-3 ${subCardBg}`}>
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5">
                          <Lock size={14} className="text-[#e5202e]" />
                          <span>AES-256 Vault</span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${mutedText}`}>
                          Lock any note with a passphrase. PBKDF2 SHA-256 + AES-GCM on this device.
                        </p>
                      </div>

                      <textarea
                        rows={3}
                        value={vaultText}
                        onChange={(e) => setVaultText(e.target.value)}
                        placeholder="Note or locked hex text"
                        className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#e5202e] ${cardBg}`}
                      />

                      <div className="relative">
                        <input
                          type={showVaultPass ? "text" : "password"}
                          value={vaultPass}
                          onChange={(e) => setVaultPass(e.target.value)}
                          placeholder="Passphrase"
                          className={`w-full border rounded-xl pl-3 pr-9 py-2 text-xs outline-none focus:border-[#e5202e] ${cardBg}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowVaultPass((s) => !s)}
                          aria-label="Toggle passphrase visibility"
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${mutedText}`}
                        >
                          {showVaultPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleVaultLock}
                          className="py-2.5 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Lock size={13} /> Lock
                        </button>
                        <button
                          type="button"
                          onClick={handleVaultUnlock}
                          className={`py-2.5 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            dark
                              ? "bg-white text-black hover:bg-zinc-200"
                              : "bg-[#1D1D1F] text-white hover:bg-zinc-800"
                          }`}
                        >
                          <LockOpen size={13} /> Unlock
                        </button>
                      </div>
                    </div>

                    {/* Disappearing Messages Card */}
                    <div className={`rounded-2xl border p-4 space-y-2.5 ${subCardBg}`}>
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5">
                          <Clock size={14} className="text-[#e5202e]" />
                          <span>Disappearing messages</span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${mutedText}`}>
                          New messages vanish after the time you pick.
                        </p>
                      </div>
                      <div className="relative">
                        <select
                          value={disappearSec}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDisappearSec(val);
                            showToast(
                              val
                                ? `Disappearing messages set to ${val}s`
                                : "Disappearing messages off",
                            );
                          }}
                          className={`w-full appearance-none border rounded-xl pl-3 pr-9 py-2.5 text-xs font-semibold outline-none focus:border-[#e5202e] cursor-pointer ${cardBg}`}
                        >
                          <option value={0}>Off</option>
                          <option value={10}>10 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={3600}>1 hour</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${mutedText}`}
                        />
                      </div>
                    </div>

                    {/* Panic Wipe Card */}
                    <div className={`rounded-2xl border p-4 space-y-3 ${subCardBg}`}>
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5 text-[#e5202e]">
                          <Trash2 size={14} />
                          <span>Panic wipe</span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${mutedText}`}>
                          Erase your account, chats and keys from this device now.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWipeSheet(true)}
                        className="w-full py-2.5 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Wipe everything
                      </button>
                    </div>
                  </div>
                )}

                {tab === "me" && (
                  <div className="space-y-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      You
                    </h1>

                    <div className={`rounded-2xl border p-4 space-y-3 ${subCardBg}`}>
                      <div className={`text-xs ${mutedText}`}>Your unique UID</div>
                      <div className="text-2xl font-bold font-mono tracking-wider text-[#e5202e]">
                        {profile.uid}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${cardBg}`}
                      >
                        <Copy size={13} /> Copy UID
                      </button>
                      <p className={`text-xs leading-relaxed ${mutedText}`}>
                        Share your UID so people can add you. Your name stays private until you chat.
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-4 space-y-1.5 ${subCardBg}`}>
                      <h3 className="text-base font-bold">{profile.name}</h3>
                      <p className={`text-xs leading-relaxed ${mutedText}`}>
                        Keys: ECDH P-256 · Cipher: AES-256-GCM · Vault: PBKDF2-SHA256. Private keys never leave this device.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Apple Tab Bar */}
              <nav
                className={`border-t grid grid-cols-4 px-2 py-1.5 shrink-0 ${
                  dark ? "border-white/[0.08] bg-[#141416]" : "border-black/[0.06] bg-white"
                }`}
              >
                {(
                  [
                    { id: "chats", label: "Chats", icon: <MessageCircle size={19} /> },
                    { id: "calls", label: "Calls", icon: <Phone size={19} /> },
                    { id: "tools", label: "Tools", icon: <Lock size={19} /> },
                    { id: "me", label: "You", icon: <User size={19} /> },
                  ] as const
                ).map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                        active ? "text-[#e5202e]" : mutedText
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* RIGHT PANE: Encrypted Conversation View */}
            <section
              className={`flex flex-col min-h-0 ${
                !activeUid ? "hidden md:flex items-center justify-center" : "flex"
              }`}
            >
              {activeContact ? (
                <>
                  {/* Conversation Header */}
                  <div
                    className={`px-3 sm:px-5 py-3 border-b flex items-center gap-3 shrink-0 ${
                      dark ? "border-white/[0.08]" : "border-black/[0.06]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveUid(null)}
                      aria-label="Back to Chats"
                      className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#e5202e] cursor-pointer"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-[#e5202e] ring-offset-2 ${
                        dark
                          ? "bg-[#2C2C2E] ring-offset-[#1C1C1E]"
                          : "bg-[#F5F5F7] ring-offset-white"
                      }`}
                    >
                      {activeContact.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{activeContact.name}</div>
                      <button
                        type="button"
                        onClick={() => setShowSafetySheet(true)}
                        className="text-[11px] font-semibold text-[#e5202e] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck size={12} />
                        <span>
                          Sealed{disappearSec ? ` · Auto-vanish ${disappearSec}s` : " · tap for safety number"}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startCall(activeContact, false)}
                        aria-label="Voice call"
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-[#e5202e] transition-colors cursor-pointer ${subCardBg}`}
                      >
                        <Phone size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startCall(activeContact, true)}
                        aria-label="Video call"
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-[#e5202e] transition-colors cursor-pointer ${subCardBg}`}
                      >
                        <Video size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5">
                    {decryptedMsgs.length === 0 ? (
                      <div className={`h-full flex items-center justify-center text-center text-xs ${mutedText}`}>
                        Messages here are end-to-end encrypted with AES-256-GCM.
                      </div>
                    ) : (
                      decryptedMsgs.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.me ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-[20px] text-sm leading-relaxed break-words ${
                              m.me
                                ? "bg-[#e5202e] text-white rounded-br-[6px]"
                                : dark
                                  ? "bg-[#2C2C2E] text-white rounded-bl-[6px]"
                                  : "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-[6px]"
                            }`}
                          >
                            <div>{m.text}</div>
                            {showCiphertext && (
                              <code className="block text-[10px] font-mono opacity-75 mt-1.5 break-all">
                                {m.ct.slice(0, 72)}…
                              </code>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={msgsEndRef} />
                  </div>

                  {/* Composer */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className={`p-3 sm:px-5 border-t flex items-center gap-2 shrink-0 ${
                      dark ? "border-white/[0.08]" : "border-black/[0.06]"
                    }`}
                  >
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Message"
                      autoComplete="off"
                      className={`flex-1 border rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#e5202e] ${subCardBg}`}
                    />
                    <button
                      type="submit"
                      aria-label="Send message"
                      className="w-10 h-10 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      <ArrowUp size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center p-8 space-y-3 max-w-sm">
                  <div className="mx-auto w-fit">
                    <MessengerLogoSvg size={56} />
                  </div>
                  <h2 className="text-lg font-bold">Select a Sealed Conversation</h2>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>
                    Choose a contact on the left or add a new UID (GM-XXXX-XXXX) to start an ECDH P-256 encrypted session.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddSheet && (
        <div
          onClick={() => setShowAddSheet(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <form
            onSubmit={handleAddContact}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md border rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl ${cardBg}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add contact by UID</h3>
              <button
                type="button"
                onClick={() => setShowAddSheet(false)}
                aria-label="Close"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${subCardBg}`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name (optional)"
                maxLength={24}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#e5202e] ${subCardBg}`}
              />
              <input
                value={newContactUid}
                onChange={(e) => setNewContactUid(e.target.value.toUpperCase())}
                placeholder="GM-XXXX-XXXX"
                required
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase outline-none focus:border-[#e5202e] ${subCardBg}`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white text-sm font-semibold cursor-pointer transition-colors"
            >
              Add Contact
            </button>
          </form>
        </div>
      )}

      {/* SAFETY NUMBER & CIPHERTEXT MODAL */}
      {showSafetySheet && activeContact && (
        <div
          onClick={() => setShowSafetySheet(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md border rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl ${cardBg}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Safety number</h3>
              <button
                type="button"
                onClick={() => setShowSafetySheet(false)}
                aria-label="Close"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${subCardBg}`}
              >
                <X size={15} />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${mutedText}`}>
              If this 30-digit number matches on {activeContact.name}&rsquo;s device, your ECDH P-256 conversation is verified end-to-end.
            </p>

            <div className={`p-4 rounded-2xl border text-center font-mono text-lg sm:text-xl font-bold tracking-widest leading-relaxed ${subCardBg}`}>
              {activeContact.safety}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCiphertext((s) => !s);
                setShowSafetySheet(false);
              }}
              className="w-full py-3 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white text-sm font-semibold cursor-pointer transition-colors"
            >
              {showCiphertext ? "Hide encrypted ciphertext" : "View encrypted ciphertext"}
            </button>
          </div>
        </div>
      )}

      {/* PANIC WIPE CONFIRMATION MODAL */}
      {showWipeSheet && (
        <div
          onClick={() => setShowWipeSheet(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md border rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl ${cardBg}`}
          >
            <h3 className="text-lg font-bold">Wipe everything?</h3>
            <p className={`text-xs leading-relaxed ${mutedText}`}>
              This permanently erases your account, UID, encrypted chats, and keys from this device. It cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowWipeSheet(false)}
                className={`py-3 rounded-full text-sm font-semibold border cursor-pointer ${subCardBg}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePanicWipe}
                className="py-3 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                Wipe now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ENCRYPTED CALL OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0f] text-white flex flex-col items-center justify-center p-6 text-center">
          {activeCall.video && (
            <video
              ref={callVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}

          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-white text-[#1D1D1F] flex items-center justify-center text-4xl font-bold ring-4 ring-[#e5202e] shadow-2xl">
              {activeCall.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{activeCall.name}</h2>
              <p className="text-sm text-zinc-300 mt-1 tabular-nums">{activeCall.status}</p>
            </div>

            <div className="flex items-center gap-6 pt-12">
              <button
                type="button"
                onClick={() =>
                  setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : null))
                }
                aria-label={activeCall.muted ? "Unmute" : "Mute"}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  activeCall.muted
                    ? "bg-white text-[#1D1D1F]"
                    : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                }`}
              >
                {activeCall.muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                type="button"
                onClick={endCurrentCall}
                aria-label="End call"
                className="w-16 h-16 rounded-full bg-[#e5202e] hover:bg-[#c4151f] text-white flex items-center justify-center shadow-xl cursor-pointer transition-colors"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST BANNER */}
      {toastMsg && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#1D1D1F] text-white border border-white/15 text-xs font-semibold shadow-xl whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
