import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  History,
  Moon,
  Plus,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
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

interface GamuraShieldPageProps {
  onBackHome: () => void;
}

type ShieldTab = "scan" | "learn" | "hist";

interface ScamFlag {
  icon: string;
  title: string;
  detail: string;
}

interface ScanResult {
  score: number;
  flags: ScamFlag[];
  urlCount: number;
}

interface HistoryEntry {
  t: string;
  s: number;
  v: string;
  full?: string;
}

const HISTORY_KEY = "gs_h";

const RULES: [RegExp, number, string, string, string][] = [
  [
    /\b(otp|one[- ]?time (password|code)|cvv|pin|password|passcode)\b/i,
    40,
    "🔐",
    "Asks for a secret code",
    "OTP, PIN, CVV and passwords must never be shared.",
  ],
  [
    /\b(urgent|immediately|within \d+ ?(hours?|hrs?|mins?|minutes)|last warning|final notice|act now|expires? (today|soon)|right away)\b/i,
    18,
    "⏰",
    "Pressure and urgency",
    "Scammers rush you so you cannot think.",
  ],
  [
    /\b(blocked|suspended|deactivated|frozen|locked|restricted|unusual activity|unauthori[sz]ed)\b.*|\b(account).*(close|block|suspend)/i,
    20,
    "🏦",
    "Account threat",
    "Fear about your account is a common hook.",
  ],
  [
    /\b(kyc|verify your (account|identity|details)|update your (details|account|information)|confirm your (account|identity))\b/i,
    22,
    "🪪",
    "Asks you to verify details",
    "Real banks rarely do this via links in messages.",
  ],
  [
    /\b(you('| ha)ve won|winner|congratulations|lottery|prize|reward|cashback|free gift|claim (your|now))\b/i,
    28,
    "🎁",
    "Prize or reward bait",
    "You cannot win something you never entered.",
  ],
  [
    /\b(gift ?cards?|itunes|google play card|bitcoin|btc|usdt|crypto|western union|wire transfer|upi (id|pin)|send money)\b/i,
    26,
    "💸",
    "Unusual payment method",
    "Gift cards and crypto are untraceable.",
  ],
  [
    /\b(processing fee|registration fee|customs fee|release fee|pay (a )?small fee|advance (fee|payment)|deposit first)\b/i,
    26,
    "💰",
    "Upfront fee",
    "Paying to receive money is a red flag.",
  ],
  [
    /\b(arrest|legal action|police|court|warrant|customs|tax (department|office)|fine)\b/i,
    16,
    "👮",
    "Authority threat",
    "Threats of arrest by message or call are a scam tactic.",
  ],
  [
    /\b(work from home|earn \$?\d+|daily income|part[- ]time job|guaranteed (profit|return)|double your money)\b/i,
    22,
    "💼",
    "Too-good job or profit",
    "Guaranteed returns do not exist.",
  ],
  [
    /\b(dear (customer|user|sir|madam|friend|beneficiary)|valued customer)\b/i,
    8,
    "👤",
    "Generic greeting",
    "Real companies use your name.",
  ],
  [
    /\b(whatsapp|telegram) (me|us|group)|\bjoin (our|my) (group|channel)\b/i,
    10,
    "💬",
    "Moves you to another app",
    "Scammers prefer private channels.",
  ],
];

const URL_RE =
  /((?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|in|co|io|xyz|top|click|link|info|shop|online|site|icu|vip|club|live|work|cc|tk|ml|ga|cf|gq|ru|cn)\b[^\s]*)/gi;

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "ow.ly",
  "tiny.cc",
];

const BAD_TLDS = [
  "xyz",
  "top",
  "click",
  "link",
  "icu",
  "vip",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "shop",
  "work",
  "club",
  "online",
  "site",
];

const BRANDS = [
  "paypal",
  "amazon",
  "google",
  "apple",
  "microsoft",
  "netflix",
  "facebook",
  "instagram",
  "whatsapp",
  "sbi",
  "hdfc",
  "icici",
  "paytm",
  "phonepe",
  "gpay",
  "fedex",
  "dhl",
  "usps",
  "binance",
  "coinbase",
];

const EXAMPLES = [
  "URGENT: Your HDFC account will be blocked within 2 hours. Update KYC now: http://hdfc-kyc-update.xyz/login and share the OTP to verify.",
  "Congratulations! You have won a $1000 Amazon gift card. Claim now: bit.ly/3xYzPrize . Pay a small fee to release your prize.",
  "Hi, are we still meeting for lunch tomorrow at 1 pm? I will bring the notes.",
];

const SCAM_LESSONS = [
  {
    icon: "🏦",
    title: "Fake bank or KYC alert",
    body: "“Your account is blocked, update KYC now.” Real banks do not ask you to confirm details through a link in a message. Open your bank’s official app instead.",
  },
  {
    icon: "🔢",
    title: "OTP and PIN requests",
    body: "Nobody legitimate needs your OTP, PIN, CVV or password. Not support staff, not delivery agents, not “the bank”.",
  },
  {
    icon: "🎁",
    title: "Prizes and lotteries",
    body: "You cannot win a contest you never entered. Asking for a fee to release a prize is the scam.",
  },
  {
    icon: "📦",
    title: "Parcel and toll fees",
    body: "Small “redelivery fee” links steal card details. Check the courier’s official site directly.",
  },
  {
    icon: "💼",
    title: "Easy job offers",
    body: "Pay for simple tasks, then a request to deposit money first. Genuine employers never charge you to start work.",
  },
  {
    icon: "❤️",
    title: "Romance and investment",
    body: "A new online friend pushing crypto or “guaranteed returns” is a classic pig-butchering scam.",
  },
  {
    icon: "👮",
    title: "Fake authority calls",
    body: "Police, tax or customs officers do not demand payment by gift card or crypto, or threaten instant arrest by phone.",
  },
];

function analyzeMessage(text: string): ScanResult {
  const flags: ScamFlag[] = [];
  let sc = 0;

  RULES.forEach(([regex, weight, icon, title, detail]) => {
    if (regex.test(text)) {
      flags.push({ icon, title, detail });
      sc += weight;
    }
  });

  const urls: string[] = text.match(URL_RE) || [];
  urls.forEach((rawUrl: string) => {
    const host = rawUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .toLowerCase();
    const low = host.replace(/:\d+$/, "");
    const tld = low.split(".").pop() || "";

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(low)) {
      flags.push({
        icon: "🌐",
        title: "Link uses a raw IP address",
        detail: "Legit sites use proper names.",
      });
      sc += 30;
    }
    if (SHORTENERS.includes(low)) {
      flags.push({
        icon: "🔗",
        title: "Shortened link",
        detail: `The real destination is hidden: ${low}`,
      });
      sc += 18;
    }
    if (BAD_TLDS.includes(tld)) {
      flags.push({
        icon: "⚠️",
        title: `Risky link ending (.${tld})`,
        detail: "Cheap domains are often used for scams.",
      });
      sc += 18;
    }
    if (/xn--/.test(low)) {
      flags.push({
        icon: "🔤",
        title: "Look-alike characters in link",
        detail: "Internationalised trick domains imitate real sites.",
      });
      sc += 25;
    }
    if (/^http:\/\//i.test(rawUrl)) {
      flags.push({
        icon: "🔓",
        title: "Link is not secure (http)",
        detail: "No encryption on the page.",
      });
      sc += 8;
    }
    if (/@/.test(`${rawUrl.split(/[/?#]/)[0]}`) && /^https?:/i.test(rawUrl)) {
      flags.push({
        icon: "🎭",
        title: "Hidden destination in link",
        detail: "Text before @ is ignored by browsers.",
      });
      sc += 25;
    }
    if ((low.match(/-/g) || []).length >= 3) {
      flags.push({
        icon: "➖",
        title: "Many hyphens in link",
        detail: `Common in fake domains: ${low}`,
      });
      sc += 10;
    }
    BRANDS.forEach((brand) => {
      if (low.includes(brand)) {
        const base = low.split(".").slice(-2).join(".");
        if (base.indexOf(brand) !== 0 || base.split(".")[0] !== brand) {
          flags.push({
            icon: "🎭",
            title: `Link imitates “${brand}”`,
            detail: `The real ${brand} site does not use ${low}`,
          });
          sc += 26;
        }
      }
    });
    const looked = low
      .replace(/0/g, "o")
      .replace(/1/g, "l")
      .replace(/3/g, "e");
    if (looked !== low && BRANDS.some((b) => looked.includes(b))) {
      flags.push({
        icon: "🔤",
        title: "Digits swapped for letters",
        detail: "Example: paypa1 instead of paypal.",
      });
      sc += 25;
    }
  });

  if (
    urls.length &&
    /\b(click|tap|open|visit|login|log in|sign in|verify|update)\b/i.test(text)
  ) {
    flags.push({
      icon: "👆",
      title: "Pushes you to click a link",
      detail: "Do not tap unknown links.",
    });
    sc += 8;
  }
  if (/[A-Z]{6,}/.test(text) && text.length < 400) {
    flags.push({
      icon: "📢",
      title: "Shouting in capitals",
      detail: "Alarmist style.",
    });
    sc += 5;
  }
  if (/\b\d{10,}\b/.test(text) && /\b(call|contact|whatsapp)\b/i.test(text)) {
    flags.push({
      icon: "📞",
      title: "Asks you to call or message a number",
      detail: "Verify the number from the official website.",
    });
    sc += 10;
  }

  const seen = new Set<string>();
  const deduped = flags.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  return {
    score: Math.min(100, sc),
    flags: deduped,
    urlCount: urls.length,
  };
}

function getVerdictLevel(score: number) {
  if (score >= 60) {
    return {
      label: "High risk — likely a scam",
      shortLabel: "High Risk",
      color: "#ff3b30",
      sub: "Do not click, reply or pay.",
      badgeCls: "bg-[#ff3b30]/15 text-[#ff3b30]",
    };
  }
  if (score >= 30) {
    return {
      label: "Suspicious",
      shortLabel: "Suspicious",
      color: "#ff9f0a",
      sub: "Be careful. Verify through an official channel.",
      badgeCls: "bg-[#ff9f0a]/18 text-[#d97706]",
    };
  }
  if (score >= 12) {
    return {
      label: "Low risk, stay alert",
      shortLabel: "Low Risk",
      color: "#ff9f0a",
      sub: "A few signs worth a second look.",
      badgeCls: "bg-[#ff9f0a]/15 text-[#d97706]",
    };
  }
  return {
    label: "Looks safe",
    shortLabel: "Safe",
    color: "#10b981",
    sub: "No common scam signs found. Stay cautious.",
    badgeCls: "bg-[#10b981]/15 text-[#10b981]",
  };
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function GamuraShieldPage({
  onBackHome,
}: GamuraShieldPageProps) {
  const [activeTab, setActiveTab] = useState<ShieldTab>("scan");
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [arcOffset, setArcOffset] = useState<number>(477.5);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>(loadHistory);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-shield",
    ),
  );

  useEffect(() => {
    const prev = document.title;
    document.title = "Gshield · GAMURA Shield";
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
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-shield"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Animate circular gauge score & stroke dashoffset whenever a new result lands
  useEffect(() => {
    if (!result) return;
    setArcOffset(477.5);
    setDisplayScore(0);

    const frameId = window.setTimeout(() => {
      setArcOffset(477.5 * (1 - result.score / 100));
    }, 30);

    let current = 0;
    const step = Math.max(1, Math.round(result.score / 25));
    const timerId = window.setInterval(() => {
      current += step;
      if (current >= result.score) {
        current = result.score;
        window.clearInterval(timerId);
      }
      setDisplayScore(current);
    }, 28);

    return () => {
      window.clearTimeout(frameId);
      window.clearInterval(timerId);
    };
  }, [result]);

  const handleScan = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) {
      setToastMsg("Paste a message or link first");
      return;
    }
    const analysis = analyzeMessage(text);
    const verdict = getVerdictLevel(analysis.score);
    setResult(analysis);

    const entry: HistoryEntry = {
      t: text.slice(0, 70),
      s: analysis.score,
      v: verdict.label,
      full: text,
    };
    const nextHistory = [entry, ...historyList].slice(0, 20);
    setHistoryList(nextHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore storage errors
    }
  };

  const handleClearHistory = () => {
    setHistoryList([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore storage errors
    }
    setToastMsg("History cleared");
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-shield");
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

  const verdict = result ? getVerdictLevel(result.score) : null;
  const todoItems =
    result && result.score >= 30
      ? [
          "Do not click links or call numbers in it.",
          "Never share OTP, PIN or card details.",
          "Block the sender and report it (in India: cybercrime.gov.in or 1930; elsewhere use your national cybercrime or consumer authority).",
          "If you already paid or shared details, contact your bank immediately.",
        ]
      : [
          "Confirm through the official app or website you type yourself.",
          "If unsure, ask a trusted person before acting.",
        ];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 pb-24 ${pageBg}`}
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
                <ShieldCheck size={15} />
              </div>
              <span className="font-bold text-sm tracking-tight whitespace-nowrap truncate">
                Gshield
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
        {/* TAB 1: CHECK */}
        {activeTab === "scan" && (
          <section aria-label="Scam Check">
            <div className="mb-5">
              <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                Shield
              </h1>
              <p className={`text-[15px] mt-1 max-w-2xl leading-relaxed ${subCls}`}>
                Paste any message, email or link. Get an instant scam check. Everything runs on your device.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Message Input + Examples */}
              <div className={`lg:col-span-6 rounded-[22px] p-4 sm:p-5 ${cardCls}`}>
                <label
                  htmlFor="gshield-inp"
                  className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${subCls}`}
                >
                  Message, email or link
                </label>
                <textarea
                  id="gshield-inp"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste the suspicious SMS, WhatsApp, email or link here…"
                  className={`w-full min-h-[160px] rounded-[16px] p-3.5 text-base border-0 outline-none focus:ring-2 focus:ring-[#10b981] resize-y ${inputBg}`}
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setInputText(EXAMPLES[0])}
                    className={`min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 ${
                      isDark ? "bg-[#2c2c2e] text-white" : "bg-[#f2f2f7] text-[#1d1d1f]"
                    }`}
                  >
                    Try: bank SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputText(EXAMPLES[1])}
                    className={`min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 ${
                      isDark ? "bg-[#2c2c2e] text-white" : "bg-[#f2f2f7] text-[#1d1d1f]"
                    }`}
                  >
                    Try: prize link
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputText(EXAMPLES[2])}
                    className={`min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 ${
                      isDark ? "bg-[#2c2c2e] text-white" : "bg-[#f2f2f7] text-[#1d1d1f]"
                    }`}
                  >
                    Try: safe text
                  </button>
                </div>

                <div className="flex items-center gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={() => handleScan()}
                    style={{
                      background: "linear-gradient(135deg, #34d399, #10b981)",
                    }}
                    className="flex-1 min-h-[48px] rounded-[16px] px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.28)] hover:brightness-105 cursor-pointer transition-all"
                  >
                    Check now
                  </button>
                  {inputText.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputText("");
                        setResult(null);
                      }}
                      className={`min-h-[48px] px-4 rounded-[16px] text-sm font-semibold cursor-pointer ${fillBg}`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Risk Gauge + Warning Signs + Actions */}
              <div className="lg:col-span-6 space-y-4">
                {result && verdict ? (
                  <>
                    <div className={`rounded-[22px] p-5 ${cardCls}`}>
                      <div className="relative w-[180px] h-[180px] mx-auto mb-3">
                        <svg
                          width="180"
                          height="180"
                          viewBox="0 0 180 180"
                          className="-rotate-90"
                        >
                          <circle
                            cx="90"
                            cy="90"
                            r="76"
                            fill="none"
                            stroke={isDark ? "#2c2c2e" : "#e8e8ed"}
                            strokeWidth="14"
                          />
                          <circle
                            cx="90"
                            cy="90"
                            r="76"
                            fill="none"
                            stroke={verdict.color}
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray="477.5"
                            strokeDashoffset={arcOffset}
                            style={{
                              transition:
                                "stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), stroke 0.35s",
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[46px] font-bold tracking-tight tabular-nums leading-none">
                            {displayScore}
                          </span>
                          <span className={`text-[13px] mt-1 ${subCls}`}>
                            risk score
                          </span>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <div
                          className="text-[22px] font-bold flex items-center justify-center gap-2"
                          style={{ color: verdict.color }}
                        >
                          {result.score >= 30 ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <CheckCircle2 size={20} />
                          )}
                          <span>{verdict.label}</span>
                        </div>
                        <p className={`text-sm mt-1 ${subCls}`}>{verdict.sub}</p>
                      </div>

                      <div className={`border-t pt-2 ${lineCls}`}>
                        {result.flags.length > 0 ? (
                          result.flags.map((f, idx) => (
                            <div
                              key={f.title}
                              className={`flex gap-3 py-3 text-[15px] leading-snug ${
                                idx < result.flags.length - 1
                                  ? `border-b ${lineCls}`
                                  : ""
                              }`}
                            >
                              <span className="text-xl shrink-0">{f.icon}</span>
                              <div>
                                <div className="font-semibold">{f.title}</div>
                                <div className={`text-[13px] mt-0.5 ${subCls}`}>
                                  {f.detail}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex gap-3 py-3 text-[15px] leading-snug">
                            <span className="text-xl shrink-0">✅</span>
                            <div>
                              <div className="font-semibold">No warning signs</div>
                              <div className={`text-[13px] mt-0.5 ${subCls}`}>
                                This tool cannot guarantee safety. Verify when unsure.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`rounded-[22px] p-5 ${cardCls}`}>
                      <h2 className="text-[17px] font-bold mb-2">What to do</h2>
                      <div>
                        {todoItems.map((tip, idx) => (
                          <div
                            key={tip}
                            className={`flex gap-3 py-2.5 text-[15px] leading-snug ${
                              idx < todoItems.length - 1
                                ? `border-b ${lineCls}`
                                : ""
                            }`}
                          >
                            <span className="text-lg shrink-0">👉</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`rounded-[22px] p-6 text-center ${cardCls}`}>
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 bg-[#10b981]/12 text-[#10b981] flex items-center justify-center">
                      <ShieldAlert size={28} />
                    </div>
                    <h2 className="text-lg font-bold">Ready to inspect</h2>
                    <p className={`text-sm mt-1.5 max-w-sm mx-auto leading-relaxed ${subCls}`}>
                      Paste any SMS, WhatsApp forward, email, or link on the left, or tap one of the examples to see a live risk breakdown.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className={`text-xs text-center mt-6 leading-relaxed ${subCls}`}>
              Shield is an assistant, not a guarantee. Always verify with the official source. Nothing you paste leaves your device.
            </p>
          </section>
        )}

        {/* TAB 2: LEARN */}
        {activeTab === "learn" && (
          <section aria-label="Learn Common Scams">
            <div className="mb-5">
              <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                Learn
              </h1>
              <p className={`text-[15px] mt-1 leading-relaxed ${subCls}`}>
                The scams that fool people everywhere.
              </p>
            </div>

            <div className={`rounded-[22px] px-5 py-1 ${cardCls}`}>
              {SCAM_LESSONS.map((lesson, idx) => (
                <div
                  key={lesson.title}
                  className={`py-4 ${
                    idx < SCAM_LESSONS.length - 1 ? `border-b ${lineCls}` : ""
                  }`}
                >
                  <div className="font-semibold text-base flex items-center gap-2 mb-1">
                    <span>{lesson.icon}</span>
                    <span>{lesson.title}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${subCls}`}>
                    {lesson.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === "hist" && (
          <section aria-label="Check History">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[32px] sm:text-[36px] font-bold tracking-[-0.8px] leading-tight">
                  History
                </h1>
                <p className={`text-[15px] mt-1 leading-relaxed ${subCls}`}>
                  Your recent checks, stored only on this device.
                </p>
              </div>
              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className={`min-h-[42px] px-4 rounded-[14px] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${fillBg}`}
                >
                  <Trash2 size={15} />
                  <span>Clear history</span>
                </button>
              )}
            </div>

            <div className={`rounded-[22px] px-5 py-1 ${cardCls}`}>
              {historyList.length > 0 ? (
                historyList.map((entry, idx) => {
                  const lvl = getVerdictLevel(entry.s);
                  return (
                    <button
                      key={`${entry.t}-${idx}`}
                      type="button"
                      onClick={() => {
                        const textToLoad = entry.full || entry.t;
                        setInputText(textToLoad);
                        handleScan(textToLoad);
                        setActiveTab("scan");
                      }}
                      className={`w-full text-left flex items-center justify-between gap-3 py-3.5 min-h-[56px] cursor-pointer hover:opacity-80 transition-opacity ${
                        idx < historyList.length - 1 ? `border-b ${lineCls}` : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {entry.t}
                          {entry.t.length >= 70 ? "…" : ""}
                        </div>
                        <div className={`text-xs mt-0.5 ${subCls}`}>
                          {lvl.shortLabel} · Tap to view check
                        </div>
                      </div>
                      <span
                        className="text-base font-bold tabular-nums shrink-0"
                        style={{ color: lvl.color }}
                      >
                        {entry.s}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className={`py-8 text-center text-sm ${subCls}`}>
                  No checks yet.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Gshield sections"
        className={`fixed left-0 right-0 bottom-0 z-30 border-t backdrop-blur-xl ${glassBar}`}
      >
        <div className="max-w-lg mx-auto flex items-center px-2 py-1.5">
          {[
            {
              id: "scan" as ShieldTab,
              label: "Check",
              icon: <SearchCheck size={20} />,
            },
            {
              id: "learn" as ShieldTab,
              label: "Learn",
              icon: <BookOpen size={20} />,
            },
            {
              id: "hist" as ShieldTab,
              label: "History",
              icon: <History size={20} />,
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
