import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileCode2,
  FileText,
  Film,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  List,
  Lock,
  LockOpen,
  Menu,
  Moon,
  MoreHorizontal,
  Music,
  Pencil,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
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

interface GfilesPageProps {
  onBackHome: () => void;
}

interface GmsFileEntry {
  id: string;
  n: string; // name
  d: number; // 1 = directory, 0 = file
  p: string; // parent id ('root' or folder id)
  s: number; // byte size
  m: number; // modified timestamp
  f?: number; // 1 = favourite
  v?: number; // 1 = private vault
  t?: number; // trash timestamp
  tp?: number; // 1 = trashed child along with parent
}

interface GmsPrefs {
  view?: "list" | "grid";
  sort?: "name" | "date" | "size" | "type";
  hid?: number;
  pin?: string;
  theme?: "light" | "dark" | "";
}

type GmsTab = "browse" | "recent" | "clean" | "more";
type GmsScreen = "fav" | "trash" | "priv" | "large" | null;
type SortKey = "name" | "date" | "size" | "type";

const GMS_FILES_KEY = "gms.f";
const GMS_PREFS_KEY = "gms.p";
const TOTAL_STORAGE_BYTES = 2 * 1073741824; // 2 GB

const APPLE_FONT: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

const CATEGORIES = [
  {
    key: "img",
    label: "Images",
    color: "#ff9500",
    exts: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "avif"],
  },
  {
    key: "vid",
    label: "Videos",
    color: "#af52de",
    exts: ["mp4", "mkv", "webm", "mov", "avi", "3gp"],
  },
  {
    key: "aud",
    label: "Audio",
    color: "#ff2d55",
    exts: ["mp3", "wav", "m4a", "ogg", "flac", "aac"],
  },
  {
    key: "doc",
    label: "Documents",
    color: "#0a84ff",
    exts: [
      "pdf",
      "doc",
      "docx",
      "txt",
      "md",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "csv",
      "json",
      "html",
      "js",
      "css",
      "rtf",
    ],
  },
  {
    key: "zip",
    label: "Archives",
    color: "#8e8e93",
    exts: ["zip", "rar", "7z", "tar", "gz"],
  },
  {
    key: "apk",
    label: "APKs",
    color: "#34c759",
    exts: ["apk"],
  },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"] | "oth";

const getExt = (name: string) =>
  name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";

const getFileKind = (f: GmsFileEntry): CategoryKey => {
  const e = getExt(f.n);
  const found = CATEGORIES.find((c) => (c.exts as readonly string[]).includes(e));
  return found ? found.key : "oth";
};

const makeUid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const formatDateShort = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

// IndexedDB blob storage ('gms' -> 'b') matching GMS specification
const memBlobStore: Record<string, Blob> = {};
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openGmsDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open("gms", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("b")) {
            req.result.createObjectStore("b");
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function putGmsBlob(id: string, blob: Blob) {
  memBlobStore[id] = blob;
  const db = await openGmsDb();
  if (!db) return;
  try {
    db.transaction("b", "readwrite").objectStore("b").put(blob, id);
  } catch {
    // fallback in memBlobStore
  }
}

async function getGmsBlob(id: string): Promise<Blob | null> {
  if (memBlobStore[id]) return memBlobStore[id];
  const db = await openGmsDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction("b").objectStore("b").get(id);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function delGmsBlob(id: string) {
  delete memBlobStore[id];
  openGmsDb().then((db) => {
    if (!db) return;
    try {
      db.transaction("b", "readwrite").objectStore("b").delete(id);
    } catch {
      // ignore
    }
  });
}

function seedInitialFiles(): GmsFileEntry[] {
  const now = Date.now();
  const folderNames = [
    "Download",
    "DCIM",
    "Documents",
    "Music",
    "Movies",
    "Pictures",
    "Android",
    ".gamura",
  ];
  const entries: GmsFileEntry[] = folderNames.map((name, i) => ({
    id: `fld_${name.replace(/\W/g, "").toLowerCase()}_${i}`,
    n: name,
    d: 1,
    p: "root",
    s: 0,
    m: now - (folderNames.length - i) * 60000,
  }));

  const docsFolder = entries.find((e) => e.n === "Documents")!;
  const picsFolder = entries.find((e) => e.n === "Pictures")!;

  const welcomeBlob = new Blob(
    [
      "Welcome to Gamura File Manager System (GMS).\n\nTap a file to open or edit it. Long-press to select several items, copy, move, lock into Private Files, or share.",
    ],
    { type: "text/plain" },
  );
  const welcomeId = "file_welcome_gms";
  void putGmsBlob(welcomeId, welcomeBlob);
  entries.push({
    id: welcomeId,
    n: "Welcome to GMS.txt",
    d: 0,
    p: docsFolder.id,
    s: welcomeBlob.size,
    m: now,
  });

  const wallBlob = new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a84ff"/><stop offset="1" stop-color="#30d158"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><circle cx="480" cy="90" r="65" fill="rgba(255,255,255,0.14)"/><text x="300" y="212" font-size="56" font-weight="700" text-anchor="middle" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,sans-serif">Gamura</text></svg>`,
    ],
    { type: "image/svg+xml" },
  );
  const wallId = "file_wallpaper_gms";
  void putGmsBlob(wallId, wallBlob);
  entries.push({
    id: wallId,
    n: "gamura-wallpaper.svg",
    d: 0,
    p: picsFolder.id,
    s: wallBlob.size,
    m: now - 15000,
  });

  try {
    localStorage.setItem(GMS_FILES_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
  return entries;
}

function loadGmsFiles(): GmsFileEntry[] {
  try {
    const raw = localStorage.getItem(GMS_FILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GmsFileEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge trash older than 30 days
        const cutoff = Date.now() - 2592e6;
        const fresh = parsed.filter((f) => !(f.t && f.t < cutoff));
        if (fresh.length !== parsed.length) {
          localStorage.setItem(GMS_FILES_KEY, JSON.stringify(fresh));
        }
        return fresh;
      }
    }
  } catch {
    // fall through to seed
  }
  return seedInitialFiles();
}

function loadGmsPrefs(): GmsPrefs {
  try {
    const raw = localStorage.getItem(GMS_PREFS_KEY);
    return raw ? (JSON.parse(raw) as GmsPrefs) : {};
  } catch {
    return {};
  }
}

export default function GfilesPage({ onBackHome }: GfilesPageProps) {
  const [files, setFiles] = useState<GmsFileEntry[]>(() => loadGmsFiles());
  const [prefs, setPrefs] = useState<GmsPrefs>(() => loadGmsPrefs());

  const [tab, setTab] = useState<GmsTab>("browse");
  const [cwd, setCwd] = useState<string | null>(null);
  const [cat, setCat] = useState<CategoryKey | null>(null);
  const [screen, setScreen] = useState<GmsScreen>(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">(prefs.view || "list");
  const [sortBy, setSortBy] = useState<SortKey>(prefs.sort || "name");
  const [showHidden, setShowHidden] = useState(Boolean(prefs.hid));
  const [clip, setClip] = useState<{ ids: string[]; cut: boolean } | null>(null);
  const [privUnlocked, setPrivUnlocked] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (prefs.theme === "dark") return true;
    if (prefs.theme === "light") return false;
    return (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
    );
  });

  const [installedInUniverse, setInstalledInUniverse] = useState(() => {
    const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
    return list.some((a) => a.id === "gfiles");
  });

  // Modals & sheets state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [menuSheet, setMenuSheet] = useState<{
    title: string;
    items: {
      icon: React.ReactNode;
      label: string;
      danger?: boolean;
      onClick: () => void;
    }[];
  } | null>(null);

  const [promptDialog, setPromptDialog] = useState<{
    title: string;
    initial: string;
    isPin?: boolean;
    placeholder?: string;
    onConfirm: (val: string) => void;
  } | null>(null);
  const [promptInput, setPromptInput] = useState("");

  const [previewState, setPreviewState] = useState<{
    file: GmsFileEntry;
    kind: "img" | "vid" | "aud" | "pdf" | "text" | "other";
    url?: string;
    text?: string;
  } | null>(null);
  const [editorText, setEditorText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileUploadRef = useRef<HTMLInputElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Gfiles · Gamura File Manager (GMS)";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GMS_FILES_KEY, JSON.stringify(files));
    } catch {
      // ignore storage quota errors
    }
  }, [files]);

  const updatePrefs = useCallback((patch: Partial<GmsPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(GMS_PREFS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const sync = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(list.some((a) => a.id === "gfiles"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleToggleUniverse = () => {
    const appDef = BUILTIN_STORE_APPS.find((a) => a.id === "gfiles");
    if (!appDef) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gfiles");
      setInstalledInUniverse(false);
      showToast("Removed Gfiles from Universe Apps");
    } else {
      addAppToUniverse(appDef);
      setInstalledInUniverse(true);
      showToast("Added Gfiles to Universe Apps ✓");
    }
  };

  // Helpers
  const getById = useCallback(
    (id: string | null) => files.find((f) => f.id === id) || undefined,
    [files],
  );

  const liveFiles = useMemo(
    () =>
      files.filter((f) => !f.t && !f.v && (showHidden || !f.n.startsWith("."))),
    [files, showHidden],
  );

  const kidsOf = useCallback(
    (parentId: string | null) => liveFiles.filter((f) => f.p === parentId),
    [liveFiles],
  );

  const collectDescendantIds = useCallback(
    (rootId: string): string[] => {
      const out: string[] = [];
      const stack = [rootId];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        const children = files.filter((f) => f.p === cur);
        for (const c of children) {
          out.push(c.id);
          stack.push(c.id);
        }
      }
      return out;
    },
    [files],
  );

  const getDeepSize = useCallback(
    (f: GmsFileEntry): number => {
      if (!f.d) return f.s;
      const ids = collectDescendantIds(f.id);
      return ids.reduce((acc, id) => acc + (getById(id)?.s || 0), 0);
    },
    [collectDescendantIds, getById],
  );

  const buildPath = useCallback(
    (folderId: string | null) => {
      const segs: string[] = [];
      let cur = getById(folderId);
      while (cur) {
        segs.unshift(cur.n);
        cur = getById(cur.p);
      }
      return ["Internal storage", ...segs].join(" › ");
    },
    [getById],
  );

  const makeUniqueName = useCallback(
    (name: string, parentId: string) => {
      const existing = files
        .filter((f) => f.p === parentId && !f.t)
        .map((f) => f.n);
      if (!existing.includes(name)) return name;
      const e = getExt(name);
      const base = e ? name.slice(0, -e.length - 1) : name;
      let i = 1;
      while (existing.includes(`${base} (${i})${e ? "." + e : ""}`)) i++;
      return `${base} (${i})${e ? "." + e : ""}`;
    },
    [files],
  );

  const sortedItems = useCallback(
    (arr: GmsFileEntry[]) =>
      [...arr].sort(
        (x, y) =>
          (y.d || 0) - (x.d || 0) ||
          (sortBy === "date"
            ? y.m - x.m
            : sortBy === "size"
              ? getDeepSize(y) - getDeepSize(x)
              : sortBy === "type"
                ? getExt(x.n).localeCompare(getExt(y.n)) ||
                  x.n.localeCompare(y.n)
                : x.n.localeCompare(y.n, undefined, {
                    numeric: true,
                    sensitivity: "base",
                  })),
      ),
    [getDeepSize, sortBy],
  );

  const viewListing = useMemo((): {
    title: string;
    items: GmsFileEntry[];
    preserveOrder: boolean;
  } => {
    const qLower = query.trim().toLowerCase();
    if (qLower) {
      return {
        title: "Search",
        items: liveFiles.filter((f) => f.n.toLowerCase().includes(qLower)),
        preserveOrder: false,
      };
    }
    if (screen === "fav") {
      return {
        title: "Favourites",
        items: liveFiles.filter((f) => f.f),
        preserveOrder: false,
      };
    }
    if (screen === "trash") {
      return {
        title: "Trash",
        items: files.filter((f) => f.t && !f.tp),
        preserveOrder: false,
      };
    }
    if (screen === "priv") {
      return {
        title: "Private files",
        items: files.filter((f) => f.v && !f.t),
        preserveOrder: false,
      };
    }
    if (screen === "large") {
      return {
        title: "Large files",
        items: liveFiles
          .filter((f) => !f.d)
          .sort((a, b) => b.s - a.s)
          .slice(0, 10),
        preserveOrder: true,
      };
    }
    if (cat) {
      const label = CATEGORIES.find((c) => c.key === cat)?.label || "Files";
      return {
        title: label,
        items: liveFiles.filter((f) => !f.d && getFileKind(f) === cat),
        preserveOrder: false,
      };
    }
    if (tab === "recent") {
      return {
        title: "Recent",
        items: liveFiles
          .filter((f) => !f.d)
          .sort((a, b) => b.m - a.m)
          .slice(0, 50),
        preserveOrder: true,
      };
    }
    return {
      title:
        cwd === "root"
          ? "Internal storage"
          : getById(cwd)?.n || "Browse",
      items: kidsOf(cwd),
      preserveOrder: false,
    };
  }, [cat, cwd, files, getById, kidsOf, liveFiles, query, screen, tab]);

  const displayedItems = useMemo(
    () =>
      viewListing.preserveOrder
        ? viewListing.items
        : sortedItems(viewListing.items),
    [sortedItems, viewListing],
  );

  const isBrowseHome =
    !query.trim() && !screen && !cat && tab === "browse" && cwd === null;
  const isNested =
    Boolean(screen) || Boolean(cat) || (tab === "browse" && cwd !== null);

  const headerTitle =
    tab === "clean" && !screen
      ? "Clean"
      : tab === "more" && !screen
        ? "More"
        : isBrowseHome
          ? "Browse"
          : viewListing.title;

  // Storage & Clean scan stats
  const storageStats = useMemo(() => {
    const allFiles = files.filter((f) => !f.d);
    const totalUsed = allFiles.reduce((acc, f) => acc + f.s, 0);
    const totalFolders = files.filter((f) => f.d).length;
    const segments = CATEGORIES.map((c) => {
      const catBytes = allFiles
        .filter((f) => getFileKind(f) === c.key)
        .reduce((acc, f) => acc + f.s, 0);
      return {
        ...c,
        bytes: catBytes,
        pct: Math.min(100, (catBytes / TOTAL_STORAGE_BYTES) * 100),
        liveCount: liveFiles.filter((f) => !f.d && getFileKind(f) === c.key)
          .length,
      };
    });
    return {
      fileCount: allFiles.length,
      folderCount: totalFolders,
      totalUsed,
      segments,
    };
  }, [files, liveFiles]);

  const cleanScan = useMemo(() => {
    const onlyFiles = liveFiles.filter((f) => !f.d);
    const groups: Record<string, GmsFileEntry[]> = {};
    const dups: GmsFileEntry[] = [];
    for (const f of onlyFiles) {
      const key = `${f.n}:${f.s}`;
      (groups[key] = groups[key] || []).push(f);
    }
    Object.values(groups).forEach((arr) => dups.push(...arr.slice(1)));

    const emptyFolders = liveFiles.filter(
      (f) => f.d && !files.some((c) => c.p === f.id && !c.t),
    );
    const trashRoots = files.filter((f) => f.t && !f.tp);
    const largeFiles = onlyFiles.filter((f) => f.s >= 5242880);
    const trashSize = trashRoots.reduce((acc, f) => acc + getDeepSize(f), 0);
    const score = Math.max(
      50,
      100 -
        (trashRoots.length ? 8 : 0) -
        dups.length * 4 -
        emptyFolders.length * 2 -
        (largeFiles.length ? 5 : 0),
    );
    return {
      dups,
      emptyFolders,
      trashRoots,
      largeFiles,
      trashSize,
      score,
    };
  }, [files, getDeepSize, liveFiles]);

  // PIN gate helper
  const askForInput = useCallback(
    (
      title: string,
      initial: string,
      onConfirm: (val: string) => void,
      options?: { isPin?: boolean; placeholder?: string },
    ) => {
      setPromptInput(initial);
      setPromptDialog({
        title,
        initial,
        isPin: options?.isPin,
        placeholder: options?.placeholder,
        onConfirm,
      });
    },
    [],
  );

  const runWithPrivateGate = useCallback(
    (callback: () => void) => {
      if (privUnlocked) {
        callback();
        return;
      }
      if (!prefs.pin) {
        askForInput(
          "Create a 4-digit PIN",
          "",
          (val) => {
            if (/^\d{4}$/.test(val)) {
              updatePrefs({ pin: btoa(val) });
              setPrivUnlocked(true);
              showToast("Private PIN set ✓");
              callback();
            } else {
              showToast("Use exactly 4 digits");
            }
          },
          { isPin: true, placeholder: "Enter 4 digits" },
        );
        return;
      }
      askForInput(
        "Enter PIN",
        "",
        (val) => {
          if (btoa(val) === prefs.pin) {
            setPrivUnlocked(true);
            callback();
          } else {
            showToast("Wrong PIN");
          }
        },
        { isPin: true, placeholder: "4-digit PIN" },
      );
    },
    [askForInput, prefs.pin, privUnlocked, showToast, updatePrefs],
  );

  // Mutations
  const createEntry = useCallback(
    (name: string, isDir: boolean, parentId: string, blob?: Blob) => {
      const id = makeUid();
      const entry: GmsFileEntry = {
        id,
        n: name,
        d: isDir ? 1 : 0,
        p: parentId,
        s: blob ? blob.size : 0,
        m: Date.now(),
      };
      if (blob) {
        void putGmsBlob(id, blob);
      }
      setFiles((prev) => [...prev, entry]);
      return entry;
    },
    [],
  );

  const markTrash = useCallback(
    (targetIds: string[], trash: boolean) => {
      const allAffected = new Set<string>();
      const primarySet = new Set(targetIds);
      for (const id of targetIds) {
        allAffected.add(id);
        for (const d of collectDescendantIds(id)) {
          allAffected.add(d);
        }
      }
      const now = Date.now();
      setFiles((prev) =>
        prev.map((item) => {
          if (!allAffected.has(item.id)) return item;
          const copy = { ...item };
          if (trash) {
            copy.t = now;
            if (!primarySet.has(item.id)) copy.tp = 1;
            else delete copy.tp;
          } else {
            delete copy.t;
            delete copy.tp;
          }
          return copy;
        }),
      );
    },
    [collectDescendantIds],
  );

  const purgeForever = useCallback(
    (targetIds: string[]) => {
      const allDel = new Set<string>();
      for (const id of targetIds) {
        allDel.add(id);
        for (const d of collectDescendantIds(id)) allDel.add(d);
      }
      allDel.forEach((id) => delGmsBlob(id));
      setFiles((prev) => prev.filter((item) => !allDel.has(item.id)));
    },
    [collectDescendantIds],
  );

  const cloneEntriesTo = useCallback(
    async (sourceIds: string[], destParent: string) => {
      const newEntries: GmsFileEntry[] = [];
      const siblingNames = new Set(
        files
          .filter((f) => f.p === destParent && !f.t)
          .map((f) => f.n),
      );

      const makeLocalUnique = (nm: string, taken: Set<string>) => {
        if (!taken.has(nm)) {
          taken.add(nm);
          return nm;
        }
        const e = getExt(nm);
        const base = e ? nm.slice(0, -e.length - 1) : nm;
        let i = 1;
        while (taken.has(`${base} (${i})${e ? "." + e : ""}`)) i++;
        const resolved = `${base} (${i})${e ? "." + e : ""}`;
        taken.add(resolved);
        return resolved;
      };

      const cloneNode = async (
        srcId: string,
        parentTargetId: string,
        rootLevel: boolean,
      ) => {
        const src = getById(srcId);
        if (!src) return;
        const nextName = rootLevel
          ? makeLocalUnique(src.n, siblingNames)
          : src.n;
        const newId = makeUid();
        const copy: GmsFileEntry = {
          id: newId,
          n: nextName,
          d: src.d,
          p: parentTargetId,
          s: src.s,
          m: Date.now(),
        };
        newEntries.push(copy);
        if (src.d) {
          const children = files.filter((x) => x.p === srcId && !x.t && !x.v);
          for (const ch of children) {
            await cloneNode(ch.id, newId, false);
          }
        } else {
          const blob = await getGmsBlob(srcId);
          if (blob) await putGmsBlob(newId, blob);
        }
      };

      for (const sid of sourceIds) {
        await cloneNode(sid, destParent, true);
      }

      if (newEntries.length > 0) {
        setFiles((prev) => [...prev, ...newEntries]);
      }
    },
    [files, getById],
  );

  const closePreview = useCallback(() => {
    if (previewState?.url) {
      URL.revokeObjectURL(previewState.url);
    }
    setPreviewState(null);
  }, [previewState]);

  const openFilePreview = useCallback(
    async (f: GmsFileEntry) => {
      const blob = await getGmsBlob(f.id);
      if (!blob) {
        showToast("File data unavailable");
        return;
      }
      const k = getFileKind(f);
      const ext = getExt(f.n);
      const url = URL.createObjectURL(blob);

      if (k === "img") {
        setPreviewState({ file: f, kind: "img", url });
      } else if (k === "vid") {
        setPreviewState({ file: f, kind: "vid", url });
      } else if (k === "aud") {
        setPreviewState({ file: f, kind: "aud", url });
      } else if (ext === "pdf") {
        setPreviewState({ file: f, kind: "pdf", url });
      } else if (
        /^(text|application\/json)/.test(blob.type) ||
        /^(txt|md|json|csv|html|js|css|log|xml)$/.test(ext) ||
        !ext
      ) {
        const text = await blob.text();
        setEditorText(text);
        setPreviewState({ file: f, kind: "text", url, text });
      } else {
        setPreviewState({ file: f, kind: "other", url });
      }
    },
    [showToast],
  );

  const downloadOrShareFile = useCallback(
    async (f: GmsFileEntry, share = false) => {
      const blob = await getGmsBlob(f.id);
      if (!blob) {
        showToast("File data unavailable");
        return;
      }
      const fileObj = new File([blob], f.n, {
        type: blob.type || "application/octet-stream",
      });
      if (
        share &&
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [fileObj] })
      ) {
        try {
          await navigator.share({ files: [fileObj], title: f.n });
          return;
        } catch {
          return;
        }
      }
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = f.n;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
      showToast(`Downloading ${f.n}`);
    },
    [showToast],
  );

  const openDetailsMenu = useCallback(
    (targets: GmsFileEntry[]) => {
      if (targets.length === 0) return;
      if (targets.length > 1) {
        const total = targets.reduce((acc, f) => acc + getDeepSize(f), 0);
        setMenuSheet({
          title: `${targets.length} items`,
          items: [
            {
              icon: <HardDrive size={16} />,
              label: `Total size: ${formatSize(total)}`,
              onClick: () => setMenuSheet(null),
            },
          ],
        });
        return;
      }
      const f = targets[0];
      const baseItems = [
        {
          icon: <FileText size={16} />,
          label: `Type: ${f.d ? "Folder" : `${(getExt(f.n) || "file").toUpperCase()} file`}`,
          onClick: () => setMenuSheet(null),
        },
        {
          icon: <HardDrive size={16} />,
          label: `Size: ${formatSize(getDeepSize(f))}`,
          onClick: () => setMenuSheet(null),
        },
        {
          icon: <Folder size={16} />,
          label: buildPath(f.p),
          onClick: () => setMenuSheet(null),
        },
        {
          icon: <Clock size={16} />,
          label: `Modified: ${new Date(f.m).toLocaleString()}`,
          onClick: () => setMenuSheet(null),
        },
      ];
      if (f.d) {
        baseItems.push({
          icon: <FolderOpen size={16} />,
          label: `Items: ${kidsOf(f.id).length}`,
          onClick: () => setMenuSheet(null),
        });
      }
      setMenuSheet({ title: f.n, items: baseItems });
    },
    [buildPath, getDeepSize, kidsOf],
  );

  const openActionSheetFor = useCallback(
    (targets: GmsFileEntry[]) => {
      if (targets.length === 0) return;
      const single = targets.length === 1;
      const first = targets[0];
      const items: NonNullable<typeof menuSheet>["items"] = [];

      if (single && !first.d) {
        items.push({
          icon: <Eye size={17} />,
          label: "Open",
          onClick: () => {
            setMenuSheet(null);
            void openFilePreview(first);
          },
        });
      }

      if (screen === "trash") {
        items.push(
          {
            icon: <RotateCcw size={17} />,
            label: "Restore",
            onClick: () => {
              markTrash(
                targets.map((x) => x.id),
                false,
              );
              setSelectedIds(new Set());
              setMenuSheet(null);
              showToast("Restored");
            },
          },
          {
            icon: <Trash2 size={17} />,
            label: "Delete forever",
            danger: true,
            onClick: () => {
              purgeForever(targets.map((x) => x.id));
              setSelectedIds(new Set());
              setMenuSheet(null);
              showToast("Deleted forever");
            },
          },
        );
      } else {
        if (single) {
          items.push({
            icon: <Pencil size={17} />,
            label: "Rename",
            onClick: () => {
              setMenuSheet(null);
              askForInput("Rename", first.n, (nextName) => {
                const unique = makeUniqueName(nextName, first.p);
                setFiles((prev) =>
                  prev.map((x) =>
                    x.id === first.id ? { ...x, n: unique, m: Date.now() } : x,
                  ),
                );
              });
            },
          });
        }
        items.push(
          {
            icon: <Copy size={17} />,
            label: "Copy",
            onClick: () => {
              setClip({ ids: targets.map((x) => x.id), cut: false });
              setSelectedIds(new Set());
              setMenuSheet(null);
              showToast("Open a folder and tap Paste");
            },
          },
          {
            icon: <Scissors size={17} />,
            label: "Move",
            onClick: () => {
              setClip({ ids: targets.map((x) => x.id), cut: true });
              setSelectedIds(new Set());
              setMenuSheet(null);
              showToast("Open a folder and tap Paste");
            },
          },
          {
            icon: <Star size={17} />,
            label: targets.every((x) => x.f)
              ? "Remove favourite"
              : "Add to favourites",
            onClick: () => {
              const nextVal = targets.every((x) => x.f) ? 0 : 1;
              const tSet = new Set(targets.map((x) => x.id));
              setFiles((prev) =>
                prev.map((x) => (tSet.has(x.id) ? { ...x, f: nextVal } : x)),
              );
              setSelectedIds(new Set());
              setMenuSheet(null);
            },
          },
        );
        if (targets.every((x) => !x.d)) {
          items.push({
            icon:
              screen === "priv" ? <LockOpen size={17} /> : <Lock size={17} />,
            label:
              screen === "priv" ? "Remove from Private" : "Move to Private",
            onClick: () => {
              setMenuSheet(null);
              const tSet = new Set(targets.map((x) => x.id));
              if (screen === "priv") {
                setFiles((prev) =>
                  prev.map((x) => {
                    if (!tSet.has(x.id)) return x;
                    const copy = { ...x };
                    delete copy.v;
                    return copy;
                  }),
                );
                setSelectedIds(new Set());
                showToast("Removed from Private");
              } else {
                runWithPrivateGate(() => {
                  setFiles((prev) =>
                    prev.map((x) => (tSet.has(x.id) ? { ...x, v: 1 } : x)),
                  );
                  setSelectedIds(new Set());
                  showToast("Moved to Private");
                });
              }
            },
          });
        }
        if (single && !first.d) {
          items.push(
            {
              icon: <Download size={17} />,
              label: "Download",
              onClick: () => {
                setMenuSheet(null);
                void downloadOrShareFile(first, false);
              },
            },
            {
              icon: <Share2 size={17} />,
              label: "Share",
              onClick: () => {
                setMenuSheet(null);
                void downloadOrShareFile(first, true);
              },
            },
          );
        }
        items.push(
          {
            icon: <Info size={17} />,
            label: "Details",
            onClick: () => openDetailsMenu(targets),
          },
          {
            icon: <Trash2 size={17} />,
            label: "Delete",
            danger: true,
            onClick: () => {
              markTrash(
                targets.map((x) => x.id),
                true,
              );
              setSelectedIds(new Set());
              setMenuSheet(null);
              showToast("Moved to Trash");
            },
          },
        );
      }

      setMenuSheet({
        title: single ? first.n : `${targets.length} items`,
        items,
      });
    },
    [
      askForInput,
      downloadOrShareFile,
      makeUniqueName,
      markTrash,
      openDetailsMenu,
      openFilePreview,
      purgeForever,
      runWithPrivateGate,
      screen,
      showToast,
    ],
  );

  const handlePasteClip = async () => {
    if (!clip) return;
    const dest = cwd || "root";
    if (clip.cut) {
      const movedIds: string[] = [];
      for (const id of clip.ids) {
        if (id === dest || collectDescendantIds(id).includes(dest)) {
          showToast("Can't move a folder into itself");
          continue;
        }
        movedIds.push(id);
      }
      if (movedIds.length > 0) {
        setFiles((prev) => {
          const taken = new Set(
            prev.filter((f) => f.p === dest && !f.t).map((f) => f.n),
          );
          return prev.map((f) => {
            if (!movedIds.includes(f.id)) return f;
            let nm = f.n;
            if (f.p !== dest && taken.has(nm)) {
              const e = getExt(nm);
              const base = e ? nm.slice(0, -e.length - 1) : nm;
              let i = 1;
              while (taken.has(`${base} (${i})${e ? "." + e : ""}`)) i++;
              nm = `${base} (${i})${e ? "." + e : ""}`;
            }
            taken.add(nm);
            return { ...f, p: dest, n: nm, m: Date.now() };
          });
        });
        showToast("Moved");
      }
    } else {
      await cloneEntriesTo(clip.ids, dest);
      showToast("Pasted");
    }
    setClip(null);
  };

  const handleBackNav = () => {
    if (query) {
      setQuery("");
    } else if (screen) {
      setScreen(null);
    } else if (cat) {
      setCat(null);
    } else {
      setCwd(cwd === "root" ? null : getById(cwd)?.p || null);
    }
  };

  const handleFilesImported = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const dest = cwd || "root";
    const incoming = Array.from(fileList);
    incoming.forEach((file) => {
      const unique = makeUniqueName(file.name, dest);
      createEntry(unique, false, dest, file);
    });
    showToast(`Imported ${incoming.length} file${incoming.length > 1 ? "s" : ""} ✓`);
  };

  const renderGlyphIcon = (f: GmsFileEntry, big = false) => {
    const dim = big ? "w-[52px] h-[52px]" : "w-10 h-10";
    if (f.d) {
      return (
        <div
          className={`${dim} rounded-[11px] flex items-center justify-center shrink-0`}
          style={{ backgroundColor: "rgba(10,132,255,0.14)", color: "#0a84ff" }}
        >
          <Folder size={big ? 24 : 20} fill="currentColor" fillOpacity={0.22} />
        </div>
      );
    }
    const kind = getFileKind(f);
    const meta = CATEGORIES.find((c) => c.key === kind);
    const color = meta?.color || "#8e8e93";
    const IconComp =
      kind === "img"
        ? ImageIcon
        : kind === "vid"
          ? Film
          : kind === "aud"
            ? Music
            : kind === "zip"
              ? FileArchive
              : kind === "apk"
                ? Smartphone
                : kind === "doc"
                  ? FileText
                  : FileCode2;
    return (
      <div
        className={`${dim} rounded-[11px] flex items-center justify-center shrink-0`}
        style={{ backgroundColor: `${color}22`, color }}
      >
        <IconComp size={big ? 24 : 20} />
      </div>
    );
  };

  const surfaceBg = isDark ? "bg-black text-white" : "bg-[#f2f2f7] text-[#1c1c1e]";
  const cardBg = isDark
    ? "bg-[#1c1c1e] border-white/[0.08]"
    : "bg-white border-black/[0.05]";
  const subText = isDark ? "text-[#98989f]" : "text-[#8e8e93]";
  const lineColor = isDark ? "border-[#38383a]" : "border-[#e5e5ea]";

  return (
    <div
      style={APPLE_FONT}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
          handleFilesImported(e.dataTransfer.files);
        }
      }}
      className={`min-h-screen flex flex-col select-none transition-colors ${surfaceBg}`}
    >
      {/* Top Ecosystem Header Bar */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-2xl border-b shrink-0 ${
          isDark
            ? "bg-[#141416]/90 border-white/[0.08]"
            : "bg-white/85 border-black/[0.07]"
        }`}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1c1c1e]"
              }`}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden sm:inline-flex min-h-[36px] px-3 rounded-full text-xs font-semibold items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1c1c1e]"
              }`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-1 min-w-0">
              <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#0a84ff] to-[#0055d4] text-white flex items-center justify-center shadow-sm shrink-0">
                <FolderOpen size={17} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight truncate leading-tight">
                  Gfiles{" "}
                  <span className="text-[#0a84ff] font-semibold">· GMS</span>
                </div>
                <div className={`hidden sm:block text-[10px] leading-none mt-0.5 ${subText}`}>
                  Gamura File Manager System
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                updatePrefs({ theme: next ? "dark" : "light" });
              }}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.15] text-amber-300"
                  : "bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1c1c1e]"
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/35"
                  : isDark
                    ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                    : "bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1c1c1e]"
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main GMS App Container */}
      <div className="flex-1 w-full max-w-[740px] mx-auto flex flex-col relative px-4 pb-28 pt-2">
        {/* Sub-Nav + Large Title */}
        <div className="pt-1 pb-2">
          {selectedIds.size > 0 ? (
            <div className="flex items-center justify-between min-h-[36px] text-sm font-semibold">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[#0a84ff] cursor-pointer px-1 py-1"
              >
                Cancel
              </button>
              <span className="tabular-nums">{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(new Set(displayedItems.map((i) => i.id)))
                }
                className="text-[#0a84ff] cursor-pointer px-1 py-1"
              >
                Select all
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between min-h-[34px]">
              {isNested || query.trim() ? (
                <button
                  type="button"
                  onClick={handleBackNav}
                  className="inline-flex items-center gap-0.5 text-[#0a84ff] font-medium text-[15px] cursor-pointer -ml-1.5 py-1 pr-2"
                >
                  <ChevronLeft size={19} />
                  <span>Back</span>
                </button>
              ) : (
                <span />
              )}
              {tab === "browse" && !screen && !cat && !query.trim() && (
                <button
                  type="button"
                  onClick={() => fileUploadRef.current?.click()}
                  className="text-xs font-semibold text-[#0a84ff] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Import</span>
                </button>
              )}
            </div>
          )}

          <h1 className="text-[32px] sm:text-[34px] font-bold tracking-tight leading-tight mt-0.5">
            {headerTitle}
          </h1>
        </div>

        {/* Search Bar */}
        {(tab === "browse" || tab === "recent" || Boolean(query)) &&
          selectedIds.size === 0 && (
            <div className="relative mb-3">
              <Search
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${subText}`}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files and folders"
                className={`w-full pl-9 pr-8 py-2.5 rounded-[12px] text-[15px] outline-none ${
                  isDark
                    ? "bg-white/[0.1] text-white placeholder:text-[#98989f]"
                    : "bg-black/[0.06] text-[#1c1c1e] placeholder:text-[#8e8e93]"
                }`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-500/30 flex items-center justify-center cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

        {/* Drag & Drop Banner */}
        {dragActive && (
          <div className="mb-3 rounded-2xl border-2 border-dashed border-[#0a84ff] bg-[#0a84ff]/10 p-4 text-center text-sm font-semibold text-[#0a84ff]">
            Drop files here to import into {cwd ? getById(cwd)?.n || "Internal storage" : "Internal storage"}
          </div>
        )}

        {/* VIEW: CLEAN TAB */}
        {!screen && !query.trim() && !cat && tab === "clean" ? (
          <div className="space-y-4">
            <div className={`rounded-[18px] p-5 text-center border ${cardBg}`}>
              <div
                className="w-[152px] h-[152px] rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: `conic-gradient(${cleanScan.score >= 90 ? "#34c759" : "#ff9500"} ${cleanScan.score * 3.6}deg, ${isDark ? "#38383a" : "#e5e5ea"} 0)`,
                }}
              >
                <div
                  className={`w-[126px] h-[126px] rounded-full flex flex-col items-center justify-center ${
                    isDark ? "bg-[#1c1c1e]" : "bg-white"
                  }`}
                >
                  <span className="text-[42px] font-bold leading-none tabular-nums">
                    {cleanScan.score}
                  </span>
                  <span className={`text-xs mt-1 ${subText}`}>
                    {cleanScan.score >= 100 ? "All clean" : "Can be optimised"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const toTrash = [
                    ...cleanScan.dups.map((f) => f.id),
                    ...cleanScan.emptyFolders.map((f) => f.id),
                  ];
                  if (toTrash.length > 0) {
                    markTrash(toTrash, true);
                  }
                  showToast("Optimised ✓");
                }}
                className="w-full py-3 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                Optimise
              </button>
            </div>

            <div className={`rounded-[18px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}>
              {[
                {
                  icon: <Trash2 size={18} className="text-zinc-500" />,
                  title: "Trash",
                  sub: cleanScan.trashRoots.length
                    ? `${formatSize(cleanScan.trashSize)} · ${cleanScan.trashRoots.length} items`
                    : "Empty",
                  btn: cleanScan.trashRoots.length ? "Empty" : null,
                  action: () => {
                    purgeForever(cleanScan.trashRoots.map((f) => f.id));
                    showToast("Trash emptied");
                  },
                },
                {
                  icon: <Copy size={18} className="text-blue-500" />,
                  title: "Duplicate files",
                  sub: cleanScan.dups.length
                    ? `${cleanScan.dups.length} copies found`
                    : "None found",
                  btn: cleanScan.dups.length ? "Trash" : null,
                  action: () => {
                    markTrash(
                      cleanScan.dups.map((f) => f.id),
                      true,
                    );
                    showToast("Duplicates moved to Trash");
                  },
                },
                {
                  icon: <Folder size={18} className="text-amber-500" />,
                  title: "Empty folders",
                  sub: cleanScan.emptyFolders.length
                    ? `${cleanScan.emptyFolders.length} found`
                    : "None found",
                  btn: cleanScan.emptyFolders.length ? "Trash" : null,
                  action: () => {
                    markTrash(
                      cleanScan.emptyFolders.map((f) => f.id),
                      true,
                    );
                    showToast("Empty folders moved to Trash");
                  },
                },
                {
                  icon: <HardDrive size={18} className="text-rose-500" />,
                  title: "Large files (5 MB+)",
                  sub: cleanScan.largeFiles.length
                    ? `${cleanScan.largeFiles.length} files · ${formatSize(cleanScan.largeFiles.reduce((a, f) => a + f.s, 0))}`
                    : "None found",
                  btn: cleanScan.largeFiles.length ? "Review" : null,
                  action: () => {
                    setScreen("large");
                    setTab("browse");
                  },
                },
              ].map((row) => (
                <div key={row.title} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 ${
                      isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"
                    }`}
                  >
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[15px]">{row.title}</div>
                    <div className={`text-xs ${subText}`}>{row.sub}</div>
                  </div>
                  {row.btn && (
                    <button
                      type="button"
                      onClick={row.action}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0a84ff]/12 text-[#0a84ff] text-xs font-semibold cursor-pointer"
                    >
                      {row.btn}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className={`text-xs px-1.5 ${subText}`}>
              Cleaned items go to Trash first, so you can restore them for 30 days.
            </p>
          </div>
        ) : !screen && !query.trim() && !cat && tab === "more" ? (
          /* VIEW: MORE TAB */
          <div className="space-y-4">
            <div className={`rounded-[18px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}>
              {[
                {
                  icon: <Share2 size={18} />,
                  bg: "rgba(10,132,255,0.14)",
                  color: "#0a84ff",
                  label: "Transfer files",
                  onClick: () =>
                    setMenuSheet({
                      title: "Transfer files",
                      items: [
                        {
                          icon: <Upload size={17} />,
                          label: "Import files from this device",
                          onClick: () => {
                            setMenuSheet(null);
                            fileUploadRef.current?.click();
                          },
                        },
                        {
                          icon: <Share2 size={17} />,
                          label: "Share or download any file via ⋯ menu",
                          onClick: () => setMenuSheet(null),
                        },
                      ],
                    }),
                },
                {
                  icon: <Sparkles size={18} />,
                  bg: "rgba(52,199,89,0.14)",
                  color: "#34c759",
                  label: "Deep clean",
                  onClick: () => setTab("clean"),
                },
                {
                  icon: <Star size={18} />,
                  bg: "rgba(255,159,10,0.14)",
                  color: "#ff9f0a",
                  label: "Favourites",
                  onClick: () => {
                    setScreen("fav");
                    setTab("browse");
                  },
                },
                {
                  icon: <Lock size={18} />,
                  bg: "rgba(94,92,230,0.14)",
                  color: "#5e5ce6",
                  label: "Private files",
                  onClick: () =>
                    runWithPrivateGate(() => {
                      setScreen("priv");
                      setTab("browse");
                    }),
                },
                {
                  icon: <Trash2 size={18} />,
                  bg: "rgba(142,142,147,0.16)",
                  color: "#8e8e93",
                  label: "Trash",
                  onClick: () => {
                    setScreen("trash");
                    setTab("browse");
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="flex-1 font-medium text-[15px]">
                    {item.label}
                  </span>
                  <ChevronRight size={16} className={subText} />
                </button>
              ))}
            </div>

            <div className={`rounded-[18px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}>
              <div
                onClick={() => {
                  const next = !isDark;
                  setIsDark(next);
                  updatePrefs({ theme: next ? "dark" : "light" });
                }}
                className="flex items-center gap-3 px-3.5 py-3 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(94,92,230,0.14)",
                    color: "#5e5ce6",
                  }}
                >
                  <Moon size={18} />
                </div>
                <span className="flex-1 font-medium text-[15px]">Dark mode</span>
                <div
                  className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${
                    isDark ? "bg-[#34c759]" : "bg-zinc-400/40"
                  }`}
                >
                  <div
                    className={`w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${
                      isDark ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              <div
                onClick={() => {
                  const next = !showHidden;
                  setShowHidden(next);
                  updatePrefs({ hid: next ? 1 : 0 });
                }}
                className="flex items-center gap-3 px-3.5 py-3 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(142,142,147,0.16)",
                    color: "#8e8e93",
                  }}
                >
                  <Eye size={18} />
                </div>
                <span className="flex-1 font-medium text-[15px]">
                  Show hidden files
                </span>
                <div
                  className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${
                    showHidden ? "bg-[#34c759]" : "bg-zinc-400/40"
                  }`}
                >
                  <div
                    className={`w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${
                      showHidden ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMenuSheet({
                    title: "Gamura File Manager System",
                    items: [
                      {
                        icon: <FolderOpen size={17} />,
                        label: "Version GMS 1.0 · Gfiles",
                        onClick: () => setMenuSheet(null),
                      },
                      {
                        icon: <Lock size={17} />,
                        label:
                          "Files stay on this device inside browser IndexedDB storage",
                        onClick: () => setMenuSheet(null),
                      },
                    ],
                  })
                }
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(10,132,255,0.14)",
                    color: "#0a84ff",
                  }}
                >
                  <Info size={18} />
                </div>
                <span className="flex-1 font-medium text-[15px]">About GMS</span>
                <ChevronRight size={16} className={subText} />
              </button>
            </div>
          </div>
        ) : isBrowseHome ? (
          /* VIEW: BROWSE HOME */
          <div className="space-y-4">
            {/* Internal Storage Card */}
            <div className={`rounded-[18px] p-4 border ${cardBg}`}>
              <div className={`text-xs font-medium ${subText}`}>
                Internal storage
              </div>
              <div className="text-[28px] font-bold tracking-tight leading-tight mt-0.5 tabular-nums">
                {formatSize(storageStats.totalUsed)}{" "}
                <span className={`text-sm font-normal ${subText}`}>
                  of 2 GB
                </span>
              </div>
              <div
                className={`flex h-2.5 rounded-md overflow-hidden my-3 ${
                  isDark ? "bg-[#38383a]" : "bg-[#e5e5ea]"
                }`}
              >
                {storageStats.segments.map((seg) => (
                  <div
                    key={seg.key}
                    style={{
                      width: `${Math.max(seg.pct, seg.bytes > 0 ? 1.5 : 0)}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                ))}
              </div>
              <div className={`text-xs tabular-nums ${subText}`}>
                {storageStats.fileCount} files · {storageStats.folderCount}{" "}
                folders · stored on this device
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {storageStats.segments.map((seg) => {
                const IconComp =
                  seg.key === "img"
                    ? ImageIcon
                    : seg.key === "vid"
                      ? Film
                      : seg.key === "aud"
                        ? Music
                        : seg.key === "doc"
                          ? FileText
                          : seg.key === "zip"
                            ? FileArchive
                            : Smartphone;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onClick={() => setCat(seg.key)}
                    className={`rounded-[18px] p-3.5 text-center border cursor-pointer transition-transform active:scale-[0.98] ${cardBg}`}
                  >
                    <div
                      className="w-10 h-10 rounded-[11px] mx-auto mb-2 flex items-center justify-center"
                      style={{
                        backgroundColor: `${seg.color}22`,
                        color: seg.color,
                      }}
                    >
                      <IconComp size={20} />
                    </div>
                    <div className="text-sm font-medium">{seg.label}</div>
                    <div className={`text-xs tabular-nums ${subText}`}>
                      {seg.liveCount} files
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Locations Card */}
            <div
              className={`rounded-[18px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}
            >
              <button
                type="button"
                onClick={() => setCwd("root")}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(10,132,255,0.14)",
                    color: "#0a84ff",
                  }}
                >
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px]">
                    Internal storage
                  </div>
                  <div className={`text-xs ${subText}`}>
                    Browse all folders
                  </div>
                </div>
                <ChevronRight size={16} className={subText} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setScreen("fav");
                  setTab("browse");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(255,159,10,0.14)",
                    color: "#ff9f0a",
                  }}
                >
                  <Star size={20} />
                </div>
                <div className="flex-1 font-medium text-[15px]">Favourites</div>
                <ChevronRight size={16} className={subText} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setScreen("large");
                  setTab("browse");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(255,55,95,0.14)",
                    color: "#ff375f",
                  }}
                >
                  <HardDrive size={20} />
                </div>
                <div className="flex-1 font-medium text-[15px]">
                  Large files
                </div>
                <ChevronRight size={16} className={subText} />
              </button>
            </div>
          </div>
        ) : (
          /* VIEW: DIRECTORY / SEARCH / CATEGORY / RECENT LIST */
          <div>
            {/* Path & View/Sort/Add Toolbar */}
            <div className="flex items-center gap-1 mb-2.5">
              <span className={`flex-1 text-xs truncate ${subText}`}>
                {cwd && !screen && !cat && !query.trim()
                  ? buildPath(cwd)
                  : `${displayedItems.length} item${displayedItems.length === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                aria-label="Toggle list or grid view"
                onClick={() => {
                  const next = viewMode === "list" ? "grid" : "list";
                  setViewMode(next);
                  updatePrefs({ view: next });
                }}
                className="p-2 rounded-xl text-[#0a84ff] cursor-pointer"
              >
                {viewMode === "list" ? (
                  <LayoutGrid size={17} />
                ) : (
                  <List size={17} />
                )}
              </button>
              <button
                type="button"
                aria-label="Sort files"
                onClick={() =>
                  setMenuSheet({
                    title: "Sort by",
                    items: (
                      [
                        ["name", "Name"],
                        ["date", "Date modified"],
                        ["size", "Size"],
                        ["type", "Type"],
                      ] as [SortKey, string][]
                    ).map(([k, label]) => ({
                      icon:
                        sortBy === k ? (
                          <Check size={16} className="text-[#0a84ff]" />
                        ) : (
                          <ArrowUpDown size={15} />
                        ),
                      label,
                      onClick: () => {
                        setSortBy(k);
                        updatePrefs({ sort: k });
                        setMenuSheet(null);
                      },
                    })),
                  })
                }
                className="p-2 rounded-xl text-[#0a84ff] cursor-pointer"
              >
                <ArrowUpDown size={17} />
              </button>
              {tab === "browse" && !screen && !cat && !query.trim() && (
                <button
                  type="button"
                  aria-label="Create new file or folder"
                  onClick={() =>
                    setMenuSheet({
                      title: "Create new",
                      items: [
                        {
                          icon: <FolderPlus size={17} />,
                          label: "Folder",
                          onClick: () => {
                            setMenuSheet(null);
                            askForInput(
                              "New folder",
                              "Untitled folder",
                              (val) => {
                                const dest = cwd || "root";
                                createEntry(
                                  makeUniqueName(val, dest),
                                  true,
                                  dest,
                                );
                              },
                            );
                          },
                        },
                        {
                          icon: <FileText size={17} />,
                          label: "Text file",
                          onClick: () => {
                            setMenuSheet(null);
                            askForInput("New text file", "note.txt", (val) => {
                              const dest = cwd || "root";
                              createEntry(
                                makeUniqueName(val, dest),
                                false,
                                dest,
                                new Blob([""], { type: "text/plain" }),
                              );
                            });
                          },
                        },
                        {
                          icon: <Upload size={17} />,
                          label: "Upload files",
                          onClick: () => {
                            setMenuSheet(null);
                            fileUploadRef.current?.click();
                          },
                        },
                      ],
                    })
                  }
                  className="p-2 rounded-xl text-[#0a84ff] cursor-pointer"
                >
                  <Plus size={20} />
                </button>
              )}
              {screen === "trash" && displayedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    purgeForever(
                      files.filter((f) => f.t && !f.tp).map((f) => f.id),
                    );
                    showToast("Trash emptied");
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#ff3b30] cursor-pointer"
                >
                  Empty
                </button>
              )}
            </div>

            {/* Empty State or Listing */}
            {displayedItems.length === 0 ? (
              <div className={`text-center py-14 px-5 ${subText}`}>
                <div
                  className={`w-[68px] h-[68px] rounded-[18px] mx-auto mb-3 flex items-center justify-center ${
                    isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"
                  }`}
                >
                  {screen === "trash" ? (
                    <Trash2 size={30} />
                  ) : (
                    <FolderOpen size={30} />
                  )}
                </div>
                <div
                  className={`text-base font-semibold ${
                    isDark ? "text-white" : "text-[#1c1c1e]"
                  }`}
                >
                  {query.trim()
                    ? "No results"
                    : screen === "trash"
                      ? "Trash is empty"
                      : "Nothing here yet"}
                </div>
                <div className="text-xs mt-1">
                  {tab === "browse" && !screen && !cat && !query.trim()
                    ? "Tap ＋ to add files or create a folder."
                    : "Items you add will show up here."}
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {displayedItems.map((f) => {
                  const isSel = selectedIds.has(f.id);
                  return (
                    <div
                      key={f.id}
                      onPointerDown={() => {
                        longPressTriggeredRef.current = false;
                        longPressTimerRef.current = window.setTimeout(() => {
                          longPressTriggeredRef.current = true;
                          navigator.vibrate?.(15);
                          setSelectedIds((prev) => new Set(prev).add(f.id));
                        }, 450);
                      }}
                      onPointerUp={() => {
                        if (longPressTimerRef.current)
                          clearTimeout(longPressTimerRef.current);
                      }}
                      onPointerCancel={() => {
                        if (longPressTimerRef.current)
                          clearTimeout(longPressTimerRef.current);
                      }}
                      onClick={() => {
                        if (longPressTriggeredRef.current) {
                          longPressTriggeredRef.current = false;
                          return;
                        }
                        if (selectedIds.size > 0) {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(f.id)) next.delete(f.id);
                            else next.add(f.id);
                            return next;
                          });
                          return;
                        }
                        if (screen === "trash") {
                          openActionSheetFor([f]);
                        } else if (f.d) {
                          setScreen(null);
                          setCat(null);
                          setQuery("");
                          setTab("browse");
                          setCwd(f.id);
                        } else {
                          void openFilePreview(f);
                        }
                      }}
                      className={`relative rounded-[18px] border p-3.5 text-center cursor-pointer flex flex-col items-center gap-2 transition-colors ${
                        isSel
                          ? "bg-[#0a84ff]/14 border-[#0a84ff]"
                          : cardBg
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`More actions for ${f.n}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionSheetFor([f]);
                        }}
                        className={`absolute top-1.5 right-1.5 p-1 rounded-full ${subText} cursor-pointer`}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {selectedIds.size > 0 ? (
                        <div
                          className={`w-[52px] h-[52px] rounded-[11px] flex items-center justify-center ${
                            isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSel
                                ? "bg-[#0a84ff] border-[#0a84ff] text-white"
                                : "border-[#8e8e93]"
                            }`}
                          >
                            {isSel && <Check size={13} />}
                          </span>
                        </div>
                      ) : (
                        renderGlyphIcon(f, true)
                      )}
                      <div className="w-full min-w-0">
                        <div className="text-[13px] font-medium truncate">
                          {f.n}
                        </div>
                        <div className={`text-[11px] ${subText}`}>
                          {f.d
                            ? `${kidsOf(f.id).length} items`
                            : formatSize(f.s)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className={`rounded-[18px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}
              >
                {displayedItems.map((f) => {
                  const isSel = selectedIds.has(f.id);
                  return (
                    <div
                      key={f.id}
                      onPointerDown={() => {
                        longPressTriggeredRef.current = false;
                        longPressTimerRef.current = window.setTimeout(() => {
                          longPressTriggeredRef.current = true;
                          navigator.vibrate?.(15);
                          setSelectedIds((prev) => new Set(prev).add(f.id));
                        }, 450);
                      }}
                      onPointerUp={() => {
                        if (longPressTimerRef.current)
                          clearTimeout(longPressTimerRef.current);
                      }}
                      onPointerCancel={() => {
                        if (longPressTimerRef.current)
                          clearTimeout(longPressTimerRef.current);
                      }}
                      onClick={() => {
                        if (longPressTriggeredRef.current) {
                          longPressTriggeredRef.current = false;
                          return;
                        }
                        if (selectedIds.size > 0) {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(f.id)) next.delete(f.id);
                            else next.add(f.id);
                            return next;
                          });
                          return;
                        }
                        if (screen === "trash") {
                          openActionSheetFor([f]);
                        } else if (f.d) {
                          setScreen(null);
                          setCat(null);
                          setQuery("");
                          setTab("browse");
                          setCwd(f.id);
                        } else {
                          void openFilePreview(f);
                        }
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                        isSel ? "bg-[#0a84ff]/12" : ""
                      }`}
                    >
                      {selectedIds.size > 0 ? (
                        <div
                          className={`w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 ${
                            isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSel
                                ? "bg-[#0a84ff] border-[#0a84ff] text-white"
                                : "border-[#8e8e93]"
                            }`}
                          >
                            {isSel && <Check size={13} />}
                          </span>
                        </div>
                      ) : (
                        renderGlyphIcon(f, false)
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[15px] truncate">
                          {f.n}
                        </div>
                        <div className={`text-xs truncate ${subText}`}>
                          {f.d
                            ? `${kidsOf(f.id).length} items`
                            : formatSize(f.s)}{" "}
                          · {formatDateShort(f.m)}
                        </div>
                      </div>

                      {Boolean(f.f) && (
                        <Star
                          size={14}
                          className="text-[#ff9f0a] fill-[#ff9f0a] shrink-0"
                        />
                      )}

                      <button
                        type="button"
                        aria-label={`More actions for ${f.n}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionSheetFor([f]);
                        }}
                        className={`p-2 rounded-full cursor-pointer shrink-0 ${subText}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clipboard Floating Paste Banner */}
      {clip && tab === "browse" && selectedIds.size === 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[708px] z-20">
          <div
            className={`rounded-2xl shadow-xl border px-3.5 py-2.5 flex items-center gap-2 ${cardBg}`}
          >
            <span className="flex-1 text-sm font-medium truncate">
              {clip.ids.length} item{clip.ids.length > 1 ? "s" : ""}{" "}
              {clip.cut ? "to move" : "copied"}
            </span>
            <button
              type="button"
              onClick={handlePasteClip}
              className="px-3 py-1.5 rounded-xl bg-[#0a84ff] text-white text-xs font-bold cursor-pointer"
            >
              Paste here
            </button>
            <button
              type="button"
              onClick={() => setClip(null)}
              aria-label="Cancel clipboard"
              className={`p-1.5 rounded-lg cursor-pointer ${subText}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Tab / Selection Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 backdrop-blur-2xl border-t ${
          isDark
            ? "bg-[#1c1c1e]/88 border-[#38383a]"
            : "bg-white/88 border-[#e5e5ea]"
        }`}
      >
        <div className="max-w-[740px] mx-auto px-2 py-1.5 flex items-center justify-around">
          {selectedIds.size > 0 ? (
            screen === "trash" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    markTrash(Array.from(selectedIds), false);
                    setSelectedIds(new Set());
                    showToast("Restored");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#0a84ff] cursor-pointer"
                >
                  <RotateCcw size={19} />
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    purgeForever(Array.from(selectedIds));
                    setSelectedIds(new Set());
                    showToast("Deleted forever");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#ff3b30] cursor-pointer"
                >
                  <Trash2 size={19} />
                  <span>Delete</span>
                </button>
              </>
            ) : screen === "priv" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const sSet = selectedIds;
                    setFiles((prev) =>
                      prev.map((x) => {
                        if (!sSet.has(x.id)) return x;
                        const copy = { ...x };
                        delete copy.v;
                        return copy;
                      }),
                    );
                    setSelectedIds(new Set());
                    showToast("Removed from Private");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#0a84ff] cursor-pointer"
                >
                  <LockOpen size={19} />
                  <span>Unlock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markTrash(Array.from(selectedIds), true);
                    setSelectedIds(new Set());
                    showToast("Moved to Trash");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#ff3b30] cursor-pointer"
                >
                  <Trash2 size={19} />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setClip({ ids: Array.from(selectedIds), cut: false });
                    setSelectedIds(new Set());
                    showToast("Open a folder and tap Paste");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#0a84ff] cursor-pointer"
                >
                  <Copy size={19} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClip({ ids: Array.from(selectedIds), cut: true });
                    setSelectedIds(new Set());
                    showToast("Open a folder and tap Paste");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#0a84ff] cursor-pointer"
                >
                  <Scissors size={19} />
                  <span>Move</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markTrash(Array.from(selectedIds), true);
                    setSelectedIds(new Set());
                    showToast("Moved to Trash");
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#ff3b30] cursor-pointer"
                >
                  <Trash2 size={19} />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targets = Array.from(selectedIds)
                      .map((id) => getById(id))
                      .filter((x): x is GmsFileEntry => Boolean(x));
                    openActionSheetFor(targets);
                  }}
                  className="flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#0a84ff] cursor-pointer"
                >
                  <MoreHorizontal size={19} />
                  <span>More</span>
                </button>
              </>
            )
          ) : (
            (
              [
                { id: "browse", label: "Browse", icon: Folder },
                { id: "recent", label: "Recent", icon: Clock },
                { id: "clean", label: "Clean", icon: Sparkles },
                { id: "more", label: "More", icon: Menu },
              ] as const
            ).map((t) => {
              const active =
                tab === t.id && !screen && !cat && !query.trim();
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setCwd(null);
                    setCat(null);
                    setScreen(null);
                    setQuery("");
                    setSelectedIds(new Set());
                  }}
                  className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium cursor-pointer transition-colors ${
                    active ? "text-[#0a84ff]" : subText
                  }`}
                >
                  <Icon size={20} />
                  <span>{t.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Action Menu Sheet */}
      {menuSheet && (
        <div
          onClick={() => setMenuSheet(null)}
          className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[720px] rounded-t-[24px] sm:rounded-[24px] p-4 pb-7 shadow-2xl max-h-[82vh] overflow-y-auto ${
              isDark ? "bg-black text-white" : "bg-[#f2f2f7] text-[#1c1c1e]"
            }`}
          >
            <h3 className="text-center font-bold text-base mb-3 truncate px-4">
              {menuSheet.title}
            </h3>
            <div
              className={`rounded-[16px] overflow-hidden border divide-y ${cardBg} ${lineColor}`}
            >
              {menuSheet.items.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left text-[15px] cursor-pointer ${
                    item.danger ? "text-[#ff3b30]" : ""
                  }`}
                >
                  <span className="w-6 flex items-center justify-center shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input / PIN Prompt Sheet */}
      {promptDialog && (
        <div
          onClick={() => setPromptDialog(null)}
          className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const val = promptInput.trim();
              if (!val) return;
              const cb = promptDialog.onConfirm;
              setPromptDialog(null);
              cb(val);
            }}
            className={`w-full max-w-md rounded-t-[24px] sm:rounded-[24px] p-5 pb-7 shadow-2xl space-y-3 ${
              isDark ? "bg-[#1c1c1e] text-white" : "bg-[#f2f2f7] text-[#1c1c1e]"
            }`}
          >
            <h3 className="text-center font-bold text-base">
              {promptDialog.title}
            </h3>
            <input
              autoFocus
              type={promptDialog.isPin ? "password" : "text"}
              inputMode={promptDialog.isPin ? "numeric" : "text"}
              maxLength={promptDialog.isPin ? 4 : undefined}
              placeholder={promptDialog.placeholder}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-3 text-base outline-none ${
                isDark
                  ? "bg-black text-white border border-white/10"
                  : "bg-white text-[#1c1c1e] border border-black/10"
              }`}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPromptDialog(null)}
                className={`py-2.5 rounded-xl font-semibold text-sm cursor-pointer ${
                  isDark ? "bg-white/10 text-white" : "bg-black/10 text-[#1c1c1e]"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#0a84ff] text-white font-semibold text-sm cursor-pointer"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fullscreen File Viewer & Editor */}
      {previewState && (
        <div
          className={`fixed inset-0 z-50 flex flex-col ${
            isDark ? "bg-black text-white" : "bg-[#f2f2f7] text-[#1c1c1e]"
          }`}
        >
          <div
            className={`px-4 h-14 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark ? "border-[#38383a] bg-[#1c1c1e]" : "border-[#e5e5ea] bg-white"
            }`}
          >
            <button
              type="button"
              onClick={closePreview}
              className="text-[#0a84ff] font-semibold text-sm cursor-pointer"
            >
              Done
            </button>
            <b className="text-sm font-semibold truncate max-w-[55%]">
              {previewState.file.n}
            </b>
            {previewState.kind === "text" ? (
              <button
                type="button"
                onClick={() => {
                  const nextBlob = new Blob([editorText], {
                    type: "text/plain",
                  });
                  void putGmsBlob(previewState.file.id, nextBlob);
                  setFiles((prev) =>
                    prev.map((x) =>
                      x.id === previewState.file.id
                        ? { ...x, s: nextBlob.size, m: Date.now() }
                        : x,
                    ),
                  );
                  showToast("Saved ✓");
                }}
                className="text-[#0a84ff] font-bold text-sm cursor-pointer"
              >
                Save
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void downloadOrShareFile(previewState.file, false)}
                className="text-[#0a84ff] font-semibold text-sm cursor-pointer"
              >
                Get
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 p-4 flex items-center justify-center overflow-auto">
            {previewState.kind === "img" && (
              <img
                src={previewState.url}
                alt={previewState.file.n}
                className="max-w-full max-h-full rounded-xl object-contain"
              />
            )}
            {previewState.kind === "vid" && (
              <video
                src={previewState.url}
                controls
                playsInline
                className="max-w-full max-h-full rounded-xl"
              />
            )}
            {previewState.kind === "aud" && (
              <audio src={previewState.url} controls className="w-full max-w-md" />
            )}
            {previewState.kind === "pdf" && (
              <iframe
                src={previewState.url}
                title={previewState.file.n}
                className="w-full h-full rounded-xl border-0 bg-white"
              />
            )}
            {previewState.kind === "text" && (
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                className={`w-full h-full rounded-2xl p-4 font-mono text-sm leading-relaxed outline-none resize-none border ${cardBg}`}
              />
            )}
            {previewState.kind === "other" && (
              <div className={`text-center space-y-2 ${subText}`}>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0a84ff]/15 text-[#0a84ff] flex items-center justify-center">
                  <FileCode2 size={28} />
                </div>
                <div className="font-semibold text-base">
                  No preview for this type
                </div>
                <div className="text-xs">
                  Tap Get to download and open it in another app.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileUploadRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          handleFilesImported(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/92 text-white text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
