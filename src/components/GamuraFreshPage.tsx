import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Leaf,
  Moon,
  Plus,
  ShoppingCart,
  Sun,
  Trash2,
  TrendingUp,
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

interface GamuraFreshPageProps {
  onBackHome: () => void;
}

type FreshTab = "p" | "s" | "i";
type StoragePlace = "Fridge" | "Freezer" | "Pantry";
type StorageFilter = "All" | StoragePlace;

interface PantryItem {
  id: number;
  n: string;
  e: string;
  d: string;
  l: StoragePlace;
}

interface ShoppingItem {
  id: number;
  n: string;
  k: boolean;
}

interface FreshStoreData {
  items: PantryItem[];
  shop: ShoppingItem[];
  used: number;
  wasted: number;
}

const STORAGE_KEY = "gf";

const PRESETS: [string, string, number, StoragePlace][] = [
  ["Milk", "🥛", 7, "Fridge"],
  ["Bread", "🍞", 5, "Pantry"],
  ["Eggs", "🥚", 21, "Fridge"],
  ["Chicken", "🍗", 2, "Fridge"],
  ["Vegetables", "🥦", 5, "Fridge"],
  ["Fruit", "🍎", 6, "Fridge"],
  ["Curd", "🥣", 7, "Fridge"],
  ["Leftovers", "🍲", 3, "Fridge"],
  ["Rice", "🍚", 365, "Pantry"],
  ["Frozen meat", "🥩", 90, "Freezer"],
];

function toLocalIso(d: Date): string {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalIso(d);
}

function daysLeftFromIso(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function formatExpiryBadge(daysLeft: number): {
  label: string;
  toneClass: string;
} {
  if (daysLeft < 0) {
    return {
      label: `Expired ${-daysLeft}d`,
      toneClass: "bg-[#ff3b30]/15 text-[#ff3b30]",
    };
  }
  if (daysLeft === 0) {
    return {
      label: "Today",
      toneClass: "bg-[#ff3b30]/15 text-[#ff3b30]",
    };
  }
  if (daysLeft <= 2) {
    return {
      label: `${daysLeft}d left`,
      toneClass: "bg-[#ff3b30]/15 text-[#ff3b30]",
    };
  }
  if (daysLeft <= 5) {
    return {
      label: `${daysLeft}d left`,
      toneClass: "bg-[#ff9f0a]/18 text-[#d97706]",
    };
  }
  if (daysLeft > 60) {
    return {
      label: `${Math.round(daysLeft / 30)}mo left`,
      toneClass: "bg-[#10b981]/15 text-[#10b981]",
    };
  }
  return {
    label: `${daysLeft}d left`,
    toneClass: "bg-[#10b981]/15 text-[#10b981]",
  };
}

function loadFreshData(): FreshStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        shop: Array.isArray(parsed.shop) ? parsed.shop : [],
        used: Number(parsed.used) || 0,
        wasted: Number(parsed.wasted) || 0,
      };
    }
  } catch {
    // ignore storage errors
  }
  return { items: [], shop: [], used: 0, wasted: 0 };
}

export default function GamuraFreshPage({ onBackHome }: GamuraFreshPageProps) {
  const [activeTab, setActiveTab] = useState<FreshTab>("p");
  const [data, setData] = useState<FreshStoreData>(loadFreshData);
  const [storageFilter, setStorageFilter] = useState<StorageFilter>("All");
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  // Add Item Modal State
  const [itemName, setItemName] = useState<string>("");
  const [itemEmoji, setItemEmoji] = useState<string>("🛒");
  const [itemDate, setItemDate] = useState<string>(() => plusDaysIso(7));
  const [itemPlace, setItemPlace] = useState<StoragePlace>("Fridge");

  // Shopping Input
  const [shopInput, setShopInput] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-fresh",
    ),
  );

  useEffect(() => {
    const prev = document.title;
    document.title = "Gfresh · GAMURA Fresh";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-fresh"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [data]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sortedPantry = useMemo(() => {
    return [...data.items].sort(
      (a, b) => daysLeftFromIso(a.d) - daysLeftFromIso(b.d),
    );
  }, [data.items]);

  const filteredPantry = useMemo(() => {
    if (storageFilter === "All") return sortedPantry;
    return sortedPantry.filter((item) => item.l === storageFilter);
  }, [sortedPantry, storageFilter]);

  const firstExpiring = sortedPantry[0] ?? null;

  const openAddSheet = () => {
    setItemName("");
    setItemEmoji("🛒");
    setItemDate(plusDaysIso(7));
    setItemPlace("Fridge");
    setSheetOpen(true);
  };

  const applyPreset = (idx: number) => {
    const preset = PRESETS[idx];
    if (!preset) return;
    setItemName(preset[0]);
    setItemEmoji(preset[1]);
    setItemDate(plusDaysIso(preset[2]));
    setItemPlace(preset[3]);
  };

  const handleAddItem = () => {
    const cleanName = itemName.trim();
    if (!cleanName) {
      setToastMsg("Enter an item name");
      return;
    }
    const nextItem: PantryItem = {
      id: Date.now(),
      n: cleanName,
      e: itemEmoji.trim() || "🛒",
      d: itemDate || plusDaysIso(7),
      l: itemPlace,
    };
    setData((prev) => ({
      ...prev,
      items: [...prev.items, nextItem],
    }));
    setSheetOpen(false);
    setToastMsg(`${cleanName} added to ${itemPlace}`);
  };

  const handleMarkUsed = (item: PantryItem) => {
    setData((prev) => {
      const remaining = prev.items.filter((i) => i.id !== item.id);
      const alreadyUncheckedInShop = prev.shop.some(
        (s) => s.n.toLowerCase() === item.n.toLowerCase() && !s.k,
      );
      const nextShop = alreadyUncheckedInShop
        ? prev.shop
        : [...prev.shop, { id: Date.now(), n: item.n, k: false }];
      return {
        ...prev,
        items: remaining,
        shop: nextShop,
        used: prev.used + 1,
      };
    });
    setToastMsg(`${item.n} marked used · added to Shopping`);
  };

  const handleMarkWasted = (item: PantryItem) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== item.id),
      wasted: prev.wasted + 1,
    }));
    setToastMsg(`${item.n} marked wasted`);
  };

  const handleAddShopItem = () => {
    const clean = shopInput.trim();
    if (!clean) return;
    setData((prev) => ({
      ...prev,
      shop: [...prev.shop, { id: Date.now(), n: clean, k: false }],
    }));
    setShopInput("");
  };

  const handleToggleShop = (id: number) => {
    setData((prev) => ({
      ...prev,
      shop: prev.shop.map((s) => (s.id === id ? { ...s, k: !s.k } : s)),
    }));
  };

  const handleClearCheckedShop = () => {
    setData((prev) => ({
      ...prev,
      shop: prev.shop.filter((s) => !s.k),
    }));
    setToastMsg("Checked items cleared");
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-fresh");
    if (!builtin) return;
    if (installedInUniverse) {
      removeAppFromUniverse(builtin.id);
      setInstalledInUniverse(false);
      setToastMsg("Removed from Universe Apps");
    } else {
      addAppToUniverse(builtin);
      setInstalledInUniverse(true);
      setToastMsg("Added to Universe Apps");
    }
  };

  const totalTracked = data.used + data.wasted;
  const zeroWastePct = totalTracked
    ? Math.round((data.used / totalTracked) * 100)
    : 0;

  const pageBg = isDark
    ? "bg-[#000000] text-[#f5f5f7]"
    : "bg-[#f5f5f7] text-[#1d1d1f]";
  const cardCls = isDark
    ? "bg-[#1c1c1e] shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
    : "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]";
  const subCls = isDark ? "text-[#98989f]" : "text-[#6e6e73]";
  const lineCls = isDark ? "border-[#2c2c2e]" : "border-[#e8e8ed]";
  const inputBg = isDark
    ? "bg-[#0a0a0c] text-[#f5f5f7] placeholder:text-[#636366]"
    : "bg-[#f5f5f7] text-[#1d1d1f] placeholder:text-[#86868b]";
  const fillBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e5e5ea]/75";
  const glassBar = isDark
    ? "bg-[#1c1c1e]/80 border-[#2c2c2e]"
    : "bg-white/80 border-[#e5e5ea]";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 pb-28 ${pageBg}`}
      style={{
        fontFamily:
          '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {/* Top Bar */}
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${glassBar}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[40px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${fillBg}`}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden sm:inline-flex min-h-[40px] px-3 rounded-full text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0 ${fillBg}`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-1 min-w-0">
              <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#34d399] to-[#059669] text-white flex items-center justify-center shadow-xs shrink-0">
                <Leaf size={15} />
              </div>
              <span className="font-bold text-sm tracking-tight whitespace-nowrap truncate">
                Gfresh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Toggle Light/Dark theme"
              className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer ${fillBg}`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`min-h-[40px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                installedInUniverse
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : fillBg
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

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto px-4 pt-6 flex-1">
        {/* TAB 1: PANTRY */}
        {activeTab === "p" && (
          <section aria-label="Pantry Tracker">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                  Fresh
                </h1>
                <p className={`text-[15px] mt-1 leading-relaxed ${subCls}`}>
                  Know what to eat first. Waste less food and money.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddSheet}
                style={{
                  background: "linear-gradient(135deg, #34d399, #10b981)",
                }}
                className="min-h-[44px] px-5 rounded-full text-sm font-semibold text-white inline-flex items-center gap-1.5 shadow-[0_8px_22px_rgba(16,185,129,0.3)] hover:brightness-105 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Add item</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Hero Spotlight + Location Filters */}
              <div className="lg:col-span-5 space-y-4">
                <div
                  style={{
                    background: "linear-gradient(135deg, #34d399, #059669)",
                  }}
                  className="text-white rounded-[24px] p-5 shadow-[0_12px_30px_rgba(16,185,129,0.28)]"
                >
                  {firstExpiring ? (
                    (() => {
                      const dLeft = daysLeftFromIso(firstExpiring.d);
                      return (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-wider opacity-85">
                            Use first
                          </div>
                          <h2 className="text-[26px] font-bold tracking-tight mt-1 mb-0.5 leading-snug">
                            {firstExpiring.e} {firstExpiring.n}
                          </h2>
                          <p className="text-[15px] opacity-95">
                            {dLeft < 0
                              ? `Expired ${-dLeft} day(s) ago. Check before using.`
                              : dLeft === 0
                                ? "Expires today. Eat or freeze it now."
                                : `Expires in ${dLeft} day(s). Plan it into your next meal.`}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-wider opacity-85">
                        Your pantry
                      </div>
                      <h2 className="text-[26px] font-bold tracking-tight mt-1 mb-0.5 leading-snug">
                        All clear ✨
                      </h2>
                      <p className="text-[15px] opacity-95">
                        Tap + to add your first item.
                      </p>
                    </>
                  )}
                </div>

                {/* Location filter segmented bar */}
                <div className={`rounded-[20px] p-3.5 ${cardCls}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${subCls}`}>
                    Filter by storage
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["All", "Fridge", "Freezer", "Pantry"] as StorageFilter[]).map(
                      (loc) => {
                        const active = storageFilter === loc;
                        const count =
                          loc === "All"
                            ? data.items.length
                            : data.items.filter((i) => i.l === loc).length;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setStorageFilter(loc)}
                            className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                              active
                                ? "bg-[#10b981] text-white"
                                : `${fillBg} opacity-90 hover:opacity-100`
                            }`}
                          >
                            {loc} ({count})
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Sorted Pantry Items */}
              <div className={`lg:col-span-7 rounded-[22px] p-4 ${cardCls}`}>
                {filteredPantry.length > 0 ? (
                  filteredPantry.map((item, idx) => {
                    const daysLeft = daysLeftFromIso(item.d);
                    const status = formatExpiryBadge(daysLeft);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 py-3 ${
                          idx < filteredPantry.length - 1
                            ? `border-b ${lineCls}`
                            : ""
                        }`}
                      >
                        <div
                          className={`w-[46px] h-[46px] rounded-[14px] flex items-center justify-center text-[26px] shrink-0 ${
                            isDark ? "bg-[#0a0a0c]" : "bg-[#f5f5f7]"
                          }`}
                        >
                          {item.e}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base truncate">
                            {item.n}
                          </div>
                          <div className={`text-[13px] ${subCls}`}>
                            {item.l} · {item.d}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleMarkUsed(item)}
                              className={`min-h-[34px] px-3 rounded-[10px] text-[13px] font-semibold text-[#10b981] cursor-pointer ${
                                isDark ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
                              }`}
                            >
                              ✓ Used
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkWasted(item)}
                              className={`min-h-[34px] px-3 rounded-[10px] text-[13px] font-semibold text-[#ff3b30] cursor-pointer ${
                                isDark ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
                              }`}
                            >
                              Wasted
                            </button>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 tabular-nums ${status.toneClass}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className={`py-8 text-center text-[15px] leading-relaxed ${subCls}`}>
                    {data.items.length === 0 ? (
                      <>
                        Nothing here yet.
                        <br />
                        Add groceries to get expiry alerts and a use-first plan.
                      </>
                    ) : (
                      `No items currently stored in ${storageFilter}.`
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: SHOPPING */}
        {activeTab === "s" && (
          <section aria-label="Shopping List">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                  Shopping
                </h1>
                <p className={`text-[15px] mt-1 leading-relaxed ${subCls}`}>
                  Things you used up are added here for you.
                </p>
              </div>
              {data.shop.some((s) => s.k) && (
                <button
                  type="button"
                  onClick={handleClearCheckedShop}
                  className={`min-h-[42px] px-4 rounded-[14px] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${fillBg}`}
                >
                  <Trash2 size={15} />
                  <span>Clear checked items</span>
                </button>
              )}
            </div>

            <div className="max-w-2xl space-y-4">
              <div className={`rounded-[22px] p-4 ${cardCls}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddShopItem();
                    }}
                    placeholder="Add an item…"
                    className={`flex-1 rounded-[14px] px-3.5 py-3 text-base border-0 outline-none ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddShopItem}
                    aria-label="Add shopping item"
                    className="min-w-[52px] min-h-[48px] rounded-[14px] bg-[#10b981]/15 text-[#10b981] text-2xl font-semibold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={`rounded-[22px] px-4 py-1 ${cardCls}`}>
                {data.shop.length > 0 ? (
                  data.shop.map((item, idx) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3.5 py-3.5 min-h-[52px] cursor-pointer text-base ${
                        idx < data.shop.length - 1 ? `border-b ${lineCls}` : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.k}
                        onChange={() => handleToggleShop(item.id)}
                        className="w-6 h-6 accent-[#10b981] shrink-0 cursor-pointer"
                      />
                      <span className={item.k ? `line-through ${subCls}` : ""}>
                        {item.n}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className={`py-8 text-center text-[15px] ${subCls}`}>
                    Your list is empty.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: INSIGHTS */}
        {activeTab === "i" && (
          <section aria-label="Waste Insights">
            <div className="mb-5">
              <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                Insights
              </h1>
              <p className={`text-[15px] mt-1 leading-relaxed ${subCls}`}>
                Your impact on food waste.
              </p>
            </div>

            <div className="max-w-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={`rounded-[20px] p-5 ${cardCls}`}>
                  <div className="text-[34px] font-bold tracking-tight text-[#10b981] tabular-nums leading-none">
                    {data.used}
                  </div>
                  <div className={`text-[13px] mt-1.5 ${subCls}`}>
                    Items used in time
                  </div>
                </div>
                <div className={`rounded-[20px] p-5 ${cardCls}`}>
                  <div className="text-[34px] font-bold tracking-tight text-[#ff3b30] tabular-nums leading-none">
                    {data.wasted}
                  </div>
                  <div className={`text-[13px] mt-1.5 ${subCls}`}>
                    Items wasted
                  </div>
                </div>
              </div>

              <div className={`rounded-[22px] p-5 ${cardCls}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[17px] font-bold">Zero-waste score</span>
                  <span className="text-base font-bold text-[#10b981] tabular-nums">
                    {zeroWastePct}%
                  </span>
                </div>
                <div
                  className={`h-3 rounded-full overflow-hidden mt-3 ${
                    isDark ? "bg-[#2c2c2e]" : "bg-[#e8e8ed]"
                  }`}
                >
                  <div
                    className="h-full bg-[#10b981] rounded-full transition-all duration-700"
                    style={{ width: `${zeroWastePct}%` }}
                  />
                </div>
                <p className={`text-sm mt-3 leading-relaxed ${subCls}`}>
                  {totalTracked > 0
                    ? `${zeroWastePct}% of your tracked food was used in time. ${
                        zeroWastePct >= 80
                          ? "Excellent work!"
                          : "Plan meals around the “use first” item to improve."
                      }`
                    : "Mark items as used or wasted to see your score."}
                </p>
              </div>

              <div className={`rounded-[22px] p-5 ${cardCls}`}>
                <h2 className="text-[17px] font-bold mb-2">Smart habits</h2>
                <ul className={`text-sm space-y-2 leading-relaxed ${subCls}`}>
                  <li>• Put newer items behind older ones (first in, first out).</li>
                  <li>• Freeze bread, cooked rice and meat before they expire.</li>
                  <li>• “Best before” is about quality. “Use by” is about safety.</li>
                  <li>• Check the fridge before every shop.</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FLOATING ADD BUTTON ON MOBILE (Pantry Tab) */}
      {activeTab === "p" && (
        <button
          type="button"
          onClick={openAddSheet}
          aria-label="Add item"
          style={{
            background: "linear-gradient(135deg, #34d399, #10b981)",
          }}
          className="lg:hidden fixed right-4 bottom-20 w-[56px] h-[56px] rounded-full text-white text-3xl flex items-center justify-center shadow-[0_10px_26px_rgba(16,185,129,0.45)] z-20 cursor-pointer"
        >
          +
        </button>
      )}

      {/* ADD ITEM MODAL / BOTTOM SHEET */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add pantry item"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className={`w-full max-w-[540px] rounded-t-[26px] sm:rounded-[26px] p-5 max-h-[90vh] overflow-auto ${cardCls}`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xl font-bold tracking-tight">Add item</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className={`min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center cursor-pointer ${fillBg}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {PRESETS.map(([name, emoji], idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyPreset(idx)}
                  className={`min-h-[36px] px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    isDark ? "bg-[#2c2c2e] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
                  {emoji} {name}
                </button>
              ))}
            </div>

            <div className="space-y-3 mt-2">
              <div>
                <label
                  htmlFor="gf-name"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Name
                </label>
                <input
                  id="gf-name"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Milk"
                  className={`w-full rounded-[14px] p-3 text-base border-0 outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="gf-emoji"
                    className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                  >
                    Emoji
                  </label>
                  <input
                    id="gf-emoji"
                    type="text"
                    maxLength={4}
                    value={itemEmoji}
                    onChange={(e) => setItemEmoji(e.target.value)}
                    className={`w-full rounded-[14px] p-3 text-base border-0 outline-none ${inputBg}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="gf-loc"
                    className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                  >
                    Stored in
                  </label>
                  <select
                    id="gf-loc"
                    value={itemPlace}
                    onChange={(e) =>
                      setItemPlace(e.target.value as StoragePlace)
                    }
                    className={`w-full rounded-[14px] p-3 text-base border-0 outline-none cursor-pointer ${inputBg}`}
                  >
                    <option value="Fridge">Fridge</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gf-date"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Expiry date
                </label>
                <input
                  id="gf-date"
                  type="date"
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                  className={`w-full rounded-[14px] p-3 text-base border-0 outline-none ${inputBg}`}
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  background: "linear-gradient(135deg, #34d399, #10b981)",
                }}
                className="w-full min-h-[48px] rounded-[16px] py-3.5 text-base font-semibold text-white cursor-pointer mt-2"
              >
                Add to pantry
              </button>

              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className={`w-full min-h-[46px] rounded-[16px] py-3 text-base font-semibold cursor-pointer ${fillBg}`}
              >
                Cancel
              </button>

              <p className={`text-xs text-center pt-1 ${subCls}`}>
                Suggested dates are typical. Always follow the package label.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Gfresh sections"
        className={`fixed left-0 right-0 bottom-0 z-30 border-t backdrop-blur-xl ${glassBar}`}
      >
        <div className="max-w-lg mx-auto flex items-center px-2 py-1.5">
          {[
            {
              id: "p" as FreshTab,
              label: "Pantry",
              icon: <Leaf size={20} />,
            },
            {
              id: "s" as FreshTab,
              label: "Shopping",
              icon: <ShoppingCart size={20} />,
            },
            {
              id: "i" as FreshTab,
              label: "Insights",
              icon: <TrendingUp size={20} />,
            },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex-1 min-h-[46px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                  active ? "text-[#10b981]" : subCls
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-20 z-50 px-4 py-2 rounded-full bg-[#1d1d1f]/90 text-white text-xs font-semibold shadow-lg pointer-events-none"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
