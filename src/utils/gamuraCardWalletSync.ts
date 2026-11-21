import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { OperationType, handleFirestoreError } from "../firebaseErrorHandler";

export interface GcardSticker {
  src: string;
  x: number;
  y: number;
  s: number;
  r: number;
}

export interface GcardState {
  name: string;
  head: string;
  loc: string;
  showLoc: boolean;
  link: string;
  phone: string;
  email: string;
  photo: string | null;
  layout: number;
  font: number;
  bg: string;
  ink: string;
  pat: number;
  st: GcardSticker[];
  cuts: string[];
  doods: string[];
  updatedAtMs?: number;
}

export interface GcardStorePayload {
  card: GcardState;
  coll: GcardState[];
  onboarded: boolean;
  darkMode: boolean;
  updatedAtMs: number;
}

export type GwalletPassType = "pay" | "pass" | "id" | "key" | "gift";

export interface GwalletTx {
  t: string;
  a: number;
  d: number;
}

export interface GwalletPass {
  id: string;
  type: GwalletPassType;
  name: string;
  sub: string;
  num: string;
  bal?: number;
  col: number;
  customColors?: [string, string, string?];
  tx?: GwalletTx[];
  linkedGcard?: boolean;
  cardLink?: string;
  updatedAtMs?: number;
}

export interface GwalletStorePayload {
  cards: GwalletPass[];
  pin: string | null;
  darkMode: boolean;
  updatedAtMs: number;
}

export interface CardWalletLinkState {
  connected: boolean;
  connectedAtMs: number;
  updatedByApp: "gcard" | "gwallet";
  updatedAtMs: number;
}

export const GCARD_SYNCED_PASS_ID = "gcard_synced_pass";
export const GCARD_STORAGE_KEY = "gamura_gcard_v2";
export const GWALLET_STORAGE_KEY = "gamura_gwallet_v2";
export const CARD_WALLET_LINK_KEY = "gamura_card_wallet_link_v1";
export const BROADCAST_CHANNEL_NAME = "gamura_card_wallet_sync_v1";
export const CARD_WALLET_SYNC_EVENT = "gamura-card-wallet-synced";

export const GCARD_FONTS: [string, string, number][] = [
  ["Clean", "Inter", 600],
  ["Strong", "Archivo Black", 400],
  ["Classic", "Playfair Display", 600],
  ["Striking", "Bebas Neue", 400],
  ["Precise", "Space Mono", 700],
  ["Grand", "Syne", 800],
];

export const GCARD_SOLIDS: ([string, string] | null)[] = [
  ["#fafaf8", "#111111"],
  ["#3b2619", "#ffffff"],
  null,
  null,
  null,
  null,
  ["#c8e6fb", "#0a2540"],
  ["#cfebd0", "#0b3d1e"],
  ["#fddcc2", "#5a2a0a"],
  ["#fde0df", "#6b0f1a"],
  ["#fcdcf0", "#5a0f4a"],
  ["#e6dcfb", "#2e1a66"],
  ["#2358e8", "#ffffff"],
  ["#0b7a2f", "#ffffff"],
  ["#bd4208", "#ffffff"],
  ["#c0173b", "#ffffff"],
  ["#a81b9a", "#ffffff"],
  ["#6a4bd8", "#ffffff"],
  ["#0b3a75", "#ffffff"],
  ["#0a4630", "#ffffff"],
  ["#7a2208", "#ffffff"],
  ["#7a0f2a", "#ffffff"],
  ["#6e0b52", "#ffffff"],
  ["#4b1e66", "#ffffff"],
];

export const GCARD_SETS: [string, string][] = [
  ["#fff7e6", "#2358e8"],
  ["#fff7e6", "#0b7a2f"],
  ["#fff7e6", "#bd4208"],
  ["#fff7e6", "#c0173b"],
  ["#fff7e6", "#a81b9a"],
  ["#fff7e6", "#6a4bd8"],
  ["#fddcf0", "#0a4630"],
  ["#c8e6fb", "#0a4630"],
  ["#fddcc2", "#4b1e66"],
  ["#fddcc2", "#7a0f2a"],
  ["#c8e6fb", "#6e0b52"],
  ["#fddcf0", "#0b3a75"],
];

export const GWALLET_TYPES: Record<GwalletPassType, [string, string]> = {
  pay: ["Payment", "💳"],
  pass: ["Pass", "🎫"],
  id: ["ID", "🪪"],
  key: ["Key", "🔑"],
  gift: ["Gift & loyalty", "🎁"],
};

export const GWALLET_PALETTES: [string, string, boolean?][] = [
  ["#10b981", "#064e3b"],
  ["#2358e8", "#0b1f66"],
  ["#e11d48", "#4a0a1d"],
  ["#a21caf", "#3a0a4a"],
  ["#f59e0b", "#7a2d08"],
  ["#2b2b30", "#050506"],
  ["#06b6d4", "#0b3a66"],
  ["#f4f4f7", "#b9b9c6", true],
];

export const GCARD_DEFAULT: GcardState = {
  name: "SELVARANJAN G",
  head: "Founder Of GAMURA · BCA Student · Developer",
  loc: "Chennai",
  showLoc: true,
  link: "https://gamura.vercel.app",
  phone: "",
  email: "",
  photo: null,
  layout: 0,
  font: 0,
  bg: "#fafaf8",
  ink: "#111111",
  pat: 0,
  st: [],
  cuts: [],
  doods: [],
};

export function createSeedWalletCards(): GwalletPass[] {
  const now = Date.now();
  return [
    {
      id: "gw_pay_default",
      type: "pay",
      name: "Gamura Pay",
      sub: "Virtual card",
      num: "4821 7733 0912 4821",
      bal: 2450,
      col: 0,
      tx: [
        { t: "Gamura Cafe", a: -120, d: now - 86400000 },
        { t: "Added money", a: 2000, d: now - 2 * 86400000 },
      ],
    },
    {
      id: "gw_id_default",
      type: "id",
      name: "Gamura ID",
      sub: "Selvaranjan G · BCA",
      num: "GAMURA-SR-2026",
      col: 1,
    },
    {
      id: "gw_pass_metro",
      type: "pass",
      name: "Metro Pass",
      sub: "Chennai · Monthly",
      num: "MTR-8842-1190",
      col: 6,
    },
    {
      id: "gw_gift_gold",
      type: "gift",
      name: "Gamura Gold",
      sub: "Loyalty · 1,240 pts",
      num: "GG-5521-0007",
      bal: 1240,
      col: 4,
    },
    {
      id: "gw_key_hostel",
      type: "key",
      name: "Campus Key",
      sub: "Block B · Suite 204",
      num: "KEY-B204-AX9",
      col: 5,
    },
  ];
}

export function getCardPatternDataUri(i: number, c: string): string {
  if (!i) return "none";
  const a = `stroke="${c}" stroke-opacity=".28" fill="none" stroke-width="1.3"`;
  let b = "";
  const tile = (w: number, h: number, inner: string) =>
    `<defs><pattern id="p" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern></defs><rect width="320" height="200" fill="url(#p)"/>`;

  if (i === 1) {
    for (let k = 0; k < 14; k++) {
      b += `<ellipse cx="190" cy="95" rx="${12 + k * 13}" ry="${8 + k * 8}" transform="rotate(-18 190 95)" ${a}/>`;
    }
  } else if (i === 2) {
    for (let k = 0; k < 26; k++) {
      b += `<line x1="0" y1="0" x2="320" y2="${k * 9}" ${a}/><line x1="0" y1="0" x2="${k * 13}" y2="200" ${a}/>`;
    }
  } else if (i === 3) {
    b = tile(24, 24, `<path d="M24 0H0V24" ${a}/>`);
  } else if (i === 4) {
    b = tile(
      16,
      16,
      `<circle cx="8" cy="8" r="1.3" fill="${c}" fill-opacity=".35"/>`,
    );
  } else if (i === 5) {
    b = tile(
      40,
      40,
      `<path d="M20 0c8 8 12 8 20 0M0 0c8 8 12 8 20 0M20 40c8-8 12-8 20 0M0 40c8-8 12-8 20 0M0 20c8-8 8-12 0-20M40 20c-8-8-8-12 0-20M0 20c8 8 8 12 0 20M40 20c-8 8-8 12 0 20" ${a}/>`,
    );
  } else if (i === 6) {
    b = tile(
      40,
      20,
      `<path d="M0 20a20 20 0 0 1 40 0M8 20a12 12 0 0 1 24 0M15 20a5 5 0 0 1 10 0" ${a}/>`,
    );
  } else if (i === 7) {
    b = tile(
      36,
      36,
      `<circle cx="18" cy="18" r="18" ${a}/><circle cx="0" cy="0" r="18" ${a}/><circle cx="36" cy="36" r="18" ${a}/><circle cx="36" cy="0" r="18" ${a}/><circle cx="0" cy="36" r="18" ${a}/>`,
    );
  } else if (i === 8) {
    for (let k = 0; k < 12; k++) {
      b += `<path d="M-10 ${k * 18 + 10}C60 ${k * 18 - 15} 120 ${k * 18 + 35} 190 ${k * 18 + 10}S280 ${k * 18 - 15} 340 ${k * 18 + 10}" ${a}/>`;
    }
  } else if (i === 9) {
    for (let k = 1; k < 9; k++) {
      b += `<circle cx="160" cy="100" r="${k * 14}" stroke="${c}" stroke-opacity=".4" fill="none" stroke-width="3" stroke-dasharray="2 ${k * 3 + 4}"/>`;
    }
  } else if (i === 10) {
    for (let k = 1; k < 9; k++) {
      b += `<circle cx="30" cy="190" r="${k * 7}" ${a}/><circle cx="300" cy="20" r="${k * 8}" ${a}/>`;
    }
  } else if (i === 11) {
    b = `<path d="M0 150C60 170 110 90 170 100S250 40 320 60V0H200C170 60 120 40 60 60S0 90 0 90Z" fill="${c}" fill-opacity=".14"/><path d="M130 200C170 150 220 150 250 120S320 110 320 110V200Z" fill="${c}" fill-opacity=".14"/>`;
  }

  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">${b}</svg>`,
  )}")`;
}

export function encodeGcardCode(card: GcardState): string {
  const clean = { ...card };
  const json = JSON.stringify(clean);
  try {
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
}

export function decodeGcardCode(raw: string): GcardState | null {
  try {
    const json = decodeURIComponent(escape(atob(raw.trim())));
    const parsed = JSON.parse(json) as Partial<GcardState>;
    if (!parsed || typeof parsed.name !== "string" || parsed.layout == null) {
      return null;
    }
    return {
      ...GCARD_DEFAULT,
      ...parsed,
      st: [],
      cuts: [],
      doods: [],
      updatedAtMs: Date.now(),
    };
  } catch {
    return null;
  }
}

export function buildGcardVCard(card: GcardState): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${card.name}`,
    `TITLE:${card.head}`,
    card.phone ? `TEL:${card.phone}` : "",
    card.email ? `EMAIL:${card.email}` : "",
    card.showLoc && card.loc ? `ADR:;;${card.loc};;;;` : "",
    card.link ? `URL:${card.link}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readGcardStore(): GcardStorePayload {
  if (typeof window === "undefined") {
    return {
      card: { ...GCARD_DEFAULT },
      coll: [],
      onboarded: false,
      darkMode: false,
      updatedAtMs: 0,
    };
  }
  const existing = safeParseJson<Partial<GcardStorePayload> | null>(
    localStorage.getItem(GCARD_STORAGE_KEY),
    null,
  );
  if (existing && existing.card) {
    return {
      card: { ...GCARD_DEFAULT, ...existing.card },
      coll: Array.isArray(existing.coll) ? existing.coll : [],
      onboarded: Boolean(existing.onboarded),
      darkMode: Boolean(existing.darkMode),
      updatedAtMs: Number(existing.updatedAtMs) || Date.now(),
    };
  }
  // Legacy fallback check
  const legacyCard = safeParseJson<Partial<GcardState> | null>(
    localStorage.getItem("gcard"),
    null,
  );
  const legacyColl = safeParseJson<GcardState[]>(
    localStorage.getItem("gcoll"),
    [],
  );
  return {
    card: legacyCard ? { ...GCARD_DEFAULT, ...legacyCard } : { ...GCARD_DEFAULT },
    coll: Array.isArray(legacyColl) ? legacyColl : [],
    onboarded: Boolean(legacyCard),
    darkMode: false,
    updatedAtMs: Date.now(),
  };
}

export function readGwalletStore(): GwalletStorePayload {
  if (typeof window === "undefined") {
    return {
      cards: createSeedWalletCards(),
      pin: null,
      darkMode: false,
      updatedAtMs: 0,
    };
  }
  const existing = safeParseJson<Partial<GwalletStorePayload> | null>(
    localStorage.getItem(GWALLET_STORAGE_KEY),
    null,
  );
  if (existing && Array.isArray(existing.cards)) {
    return {
      cards: existing.cards,
      pin: typeof existing.pin === "string" ? existing.pin : null,
      darkMode: Boolean(existing.darkMode),
      updatedAtMs: Number(existing.updatedAtMs) || Date.now(),
    };
  }
  const legacy = safeParseJson<{ cards?: GwalletPass[]; pin?: string | null } | null>(
    localStorage.getItem("gw2"),
    null,
  );
  if (legacy && Array.isArray(legacy.cards)) {
    return {
      cards: legacy.cards,
      pin: typeof legacy.pin === "string" ? legacy.pin : null,
      darkMode: false,
      updatedAtMs: Date.now(),
    };
  }
  return {
    cards: createSeedWalletCards(),
    pin: null,
    darkMode: false,
    updatedAtMs: Date.now(),
  };
}

export function readCardWalletLink(): CardWalletLinkState {
  if (typeof window === "undefined") {
    return {
      connected: false,
      connectedAtMs: 0,
      updatedByApp: "gcard",
      updatedAtMs: 0,
    };
  }
  const raw = safeParseJson<Partial<CardWalletLinkState> | null>(
    localStorage.getItem(CARD_WALLET_LINK_KEY),
    null,
  );
  return {
    connected: Boolean(raw?.connected),
    connectedAtMs: Number(raw?.connectedAtMs) || 0,
    updatedByApp: raw?.updatedByApp === "gwallet" ? "gwallet" : "gcard",
    updatedAtMs: Number(raw?.updatedAtMs) || 0,
  };
}

export function projectGcardToWalletPass(card: GcardState): GwalletPass {
  const cleanName = (card.name || "GAMURA CARD").trim().slice(0, 60);
  const subParts = [
    card.head?.trim(),
    card.showLoc && card.loc?.trim() ? card.loc.trim() : "",
  ].filter(Boolean);
  const subtitle = (subParts.join(" · ") || "Gamura Digital Card").slice(0, 90);
  const passNum = card.link?.trim()
    ? card.link.replace(/^https?:\/\//i, "").slice(0, 36)
    : `GCARD-${cleanName.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase() || "ID"}`;

  return {
    id: GCARD_SYNCED_PASS_ID,
    type: "id",
    name: cleanName,
    sub: subtitle,
    num: passNum,
    col: 0,
    customColors: [card.bg || "#0a4630", card.bg || "#064e3b", card.ink || "#ffffff"],
    linkedGcard: true,
    cardLink: card.link || "https://gamura.vercel.app",
    updatedAtMs: Date.now(),
  };
}

function upsertLinkedPassInWallet(
  wallet: GwalletStorePayload,
  card: GcardState,
): GwalletStorePayload {
  const syncedPass = projectGcardToWalletPass(card);
  const rest = wallet.cards.filter(
    (c) => c.id !== GCARD_SYNCED_PASS_ID && !c.linkedGcard,
  );
  return {
    ...wallet,
    cards: [syncedPass, ...rest],
    updatedAtMs: Date.now(),
  };
}

function broadcastSyncPacket(sourceApp: "gcard" | "gwallet") {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      ch.postMessage({ sourceApp, ts: Date.now() });
      ch.close();
    }
  } catch {
    // ignore BroadcastChannel failures on restricted contexts
  }
  window.dispatchEvent(
    new CustomEvent(CARD_WALLET_SYNC_EVENT, { detail: { sourceApp } }),
  );
}

function stripOversizedAssetsForCloud(gcard: GcardStorePayload): string {
  const cleanCard: GcardState = {
    ...gcard.card,
    photo:
      gcard.card.photo && gcard.card.photo.length <= 160000
        ? gcard.card.photo
        : null,
    st: (gcard.card.st || []).slice(0, 8),
    cuts: [],
    doods: [],
  };
  const compact: GcardStorePayload = {
    ...gcard,
    card: cleanCard,
    coll: (gcard.coll || []).slice(0, 15).map((c) => ({
      ...c,
      photo: c.photo && c.photo.length <= 25000 ? c.photo : null,
      st: [],
      cuts: [],
      doods: [],
    })),
  };
  const serialized = JSON.stringify(compact);
  if (serialized.length <= 590000) return serialized;
  return JSON.stringify({
    ...compact,
    card: { ...cleanCard, photo: null, st: [] },
    coll: compact.coll.slice(0, 6).map((c) => ({ ...c, photo: null })),
  });
}

export async function pushCardWalletVaultToCloud(
  uid: string,
  sourceApp: "gcard" | "gwallet",
): Promise<void> {
  const path = `card_wallet_vaults/${uid}`;
  const ref = doc(db, "card_wallet_vaults", uid);
  const gcard = readGcardStore();
  const gwallet = readGwalletStore();
  const link = readCardWalletLink();

  const cardJson = stripOversizedAssetsForCloud(gcard).slice(0, 599000);
  const walletJson = JSON.stringify({
    ...gwallet,
    cards: gwallet.cards.slice(0, 40).map((c) => ({
      ...c,
      tx: (c.tx || []).slice(0, 30),
    })),
  }).slice(0, 249000);

  try {
    await setDoc(ref, {
      uid,
      connected: Boolean(link.connected),
      connectedAtMs: Number(link.connectedAtMs) || 0,
      cardJson,
      walletJson,
      updatedByApp: sourceApp,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function saveGcardState(
  nextStore: GcardStorePayload,
  uid?: string | null,
): { link: CardWalletLinkState; wallet: GwalletStorePayload } {
  const stamped: GcardStorePayload = {
    ...nextStore,
    card: { ...nextStore.card, updatedAtMs: Date.now() },
    updatedAtMs: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GCARD_STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      // storage quota fallback
    }
  }

  const link = readCardWalletLink();
  let wallet = readGwalletStore();

  if (link.connected) {
    wallet = upsertLinkedPassInWallet(wallet, stamped.card);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(GWALLET_STORAGE_KEY, JSON.stringify(wallet));
      } catch {
        // ignore quota errors
      }
    }
    const nextLink: CardWalletLinkState = {
      ...link,
      updatedByApp: "gcard",
      updatedAtMs: Date.now(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(CARD_WALLET_LINK_KEY, JSON.stringify(nextLink));
    }
  }

  broadcastSyncPacket("gcard");
  if (uid) {
    void pushCardWalletVaultToCloud(uid, "gcard");
  }
  return { link: readCardWalletLink(), wallet };
}

export function saveGwalletState(
  nextWallet: GwalletStorePayload,
  options?: { uid?: string | null; syncBackToGcard?: boolean },
): { link: CardWalletLinkState; gcard: GcardStorePayload } {
  const stamped: GwalletStorePayload = {
    ...nextWallet,
    updatedAtMs: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GWALLET_STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      // ignore storage errors
    }
  }

  const link = readCardWalletLink();
  let gcard = readGcardStore();

  if (link.connected && options?.syncBackToGcard) {
    const linkedPass = stamped.cards.find(
      (c) => c.id === GCARD_SYNCED_PASS_ID || c.linkedGcard,
    );
    if (linkedPass) {
      gcard = {
        ...gcard,
        card: {
          ...gcard.card,
          name: linkedPass.name.slice(0, 40) || gcard.card.name,
          head: linkedPass.sub.slice(0, 100) || gcard.card.head,
          link: linkedPass.cardLink || gcard.card.link,
          updatedAtMs: Date.now(),
        },
        updatedAtMs: Date.now(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(GCARD_STORAGE_KEY, JSON.stringify(gcard));
      }
    }
  }

  if (link.connected && typeof window !== "undefined") {
    localStorage.setItem(
      CARD_WALLET_LINK_KEY,
      JSON.stringify({
        ...link,
        updatedByApp: "gwallet",
        updatedAtMs: Date.now(),
      }),
    );
  }

  broadcastSyncPacket("gwallet");
  if (options?.uid) {
    void pushCardWalletVaultToCloud(options.uid, "gwallet");
  }
  return { link: readCardWalletLink(), gcard };
}

export function connectCardAndWallet(
  sourceApp: "gcard" | "gwallet",
  uid?: string | null,
): {
  link: CardWalletLinkState;
  gcard: GcardStorePayload;
  wallet: GwalletStorePayload;
} {
  const now = Date.now();
  const gcard = readGcardStore();
  const nextWallet = upsertLinkedPassInWallet(readGwalletStore(), gcard.card);
  const nextLink: CardWalletLinkState = {
    connected: true,
    connectedAtMs: now,
    updatedByApp: sourceApp,
    updatedAtMs: now,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(GWALLET_STORAGE_KEY, JSON.stringify(nextWallet));
    localStorage.setItem(CARD_WALLET_LINK_KEY, JSON.stringify(nextLink));
    localStorage.setItem(GCARD_STORAGE_KEY, JSON.stringify(gcard));
  }

  broadcastSyncPacket(sourceApp);
  if (uid) {
    void pushCardWalletVaultToCloud(uid, sourceApp);
  }
  return { link: nextLink, gcard, wallet: nextWallet };
}

export function disconnectCardAndWallet(
  sourceApp: "gcard" | "gwallet",
  uid?: string | null,
): CardWalletLinkState {
  const now = Date.now();
  const nextLink: CardWalletLinkState = {
    connected: false,
    connectedAtMs: 0,
    updatedByApp: sourceApp,
    updatedAtMs: now,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_WALLET_LINK_KEY, JSON.stringify(nextLink));
  }
  broadcastSyncPacket(sourceApp);
  if (uid) {
    void pushCardWalletVaultToCloud(uid, sourceApp);
  }
  return nextLink;
}

export function subscribeLocalCardWalletSync(
  onSync: (payload: {
    gcard: GcardStorePayload;
    gwallet: GwalletStorePayload;
    link: CardWalletLinkState;
  }) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const emit = () => {
    onSync({
      gcard: readGcardStore(),
      gwallet: readGwalletStore(),
      link: readCardWalletLink(),
    });
  };

  let bc: BroadcastChannel | null = null;
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = () => emit();
    }
  } catch {
    // ignore
  }

  const onStorage = (e: StorageEvent) => {
    if (
      e.key === null ||
      e.key === GCARD_STORAGE_KEY ||
      e.key === GWALLET_STORAGE_KEY ||
      e.key === CARD_WALLET_LINK_KEY
    ) {
      emit();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CARD_WALLET_SYNC_EVENT, emit);
  return () => {
    bc?.close();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CARD_WALLET_SYNC_EVENT, emit);
  };
}

function tsToMs(val: unknown): number {
  if (typeof val === "number") return val;
  if (
    val &&
    typeof val === "object" &&
    "toMillis" in val &&
    typeof (val as Timestamp).toMillis === "function"
  ) {
    return (val as Timestamp).toMillis();
  }
  return Date.now();
}

export function subscribeCloudCardWalletVault(
  uid: string,
  currentApp: "gcard" | "gwallet",
  onSync: (payload: {
    gcard: GcardStorePayload;
    gwallet: GwalletStorePayload;
    link: CardWalletLinkState;
  }) => void,
): () => void {
  const path = `card_wallet_vaults/${uid}`;
  const ref = doc(db, "card_wallet_vaults", uid);
  let initialized = false;

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        if (!initialized) {
          initialized = true;
          const localLink = readCardWalletLink();
          if (localLink.connected) {
            void pushCardWalletVaultToCloud(uid, currentApp);
          }
        }
        return;
      }
      initialized = true;
      const data = snap.data();
      const cloudCard = safeParseJson<GcardStorePayload | null>(
        typeof data.cardJson === "string" ? data.cardJson : null,
        null,
      );
      const cloudWallet = safeParseJson<GwalletStorePayload | null>(
        typeof data.walletJson === "string" ? data.walletJson : null,
        null,
      );
      const cloudLink: CardWalletLinkState = {
        connected: Boolean(data.connected),
        connectedAtMs: Number(data.connectedAtMs) || 0,
        updatedByApp: data.updatedByApp === "gwallet" ? "gwallet" : "gcard",
        updatedAtMs: tsToMs(data.updatedAt),
      };

      const localCard = readGcardStore();
      const localWallet = readGwalletStore();

      if (cloudCard && typeof window !== "undefined") {
        // Keep local full-res photo if cloud stripped a >160KB avatar
        const mergedCard: GcardStorePayload = {
          ...cloudCard,
          card: {
            ...GCARD_DEFAULT,
            ...cloudCard.card,
            photo: cloudCard.card?.photo ?? localCard.card.photo,
          },
        };
        localStorage.setItem(GCARD_STORAGE_KEY, JSON.stringify(mergedCard));
      }
      if (cloudWallet && typeof window !== "undefined") {
        localStorage.setItem(GWALLET_STORAGE_KEY, JSON.stringify(cloudWallet));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(CARD_WALLET_LINK_KEY, JSON.stringify(cloudLink));
      }

      onSync({
        gcard: readGcardStore(),
        gwallet: cloudWallet || localWallet,
        link: cloudLink,
      });
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    },
  );
}
