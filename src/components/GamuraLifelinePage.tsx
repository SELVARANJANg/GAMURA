import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Flame,
  HeartPulse,
  IdCard,
  MapPin,
  Moon,
  Phone,
  Plus,
  ShieldAlert,
  Stethoscope,
  Sun,
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

interface GamuraLifelinePageProps {
  onBackHome: () => void;
}

type LifelineTab = "sos" | "card" | "aid" | "num";

interface EmergencyCardData {
  n: string;
  bg: string;
  md: string;
  cn: string;
  cp: string;
}

const GL_CARD_KEY = "gl_card";
const GL_COUNTRY_KEY = "gl_c";

const COUNTRIES: [string, string][] = [
  ["India", "112"],
  ["United States / Canada", "911"],
  ["United Kingdom", "999"],
  ["European Union", "112"],
  ["Australia", "000"],
  ["New Zealand", "111"],
  ["Japan (ambulance/fire)", "119"],
  ["Japan (police)", "110"],
  ["UAE", "999"],
  ["Singapore (ambulance)", "995"],
  ["Singapore (police)", "999"],
  ["Brazil (ambulance)", "192"],
  ["South Africa (mobile)", "112"],
  ["Other / Worldwide", "112"],
];

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function GamuraLifelinePage({
  onBackHome,
}: GamuraLifelinePageProps) {
  const [activeTab, setActiveTab] = useState<LifelineTab>("sos");
  const [countryIdx, setCountryIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(GL_COUNTRY_KEY);
      if (saved !== null) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && COUNTRIES[parsed]) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return 0;
  });

  const [card, setCard] = useState<EmergencyCardData>(() => {
    try {
      const raw = localStorage.getItem(GL_CARD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          n: parsed.n || "",
          bg: parsed.bg || "",
          md: parsed.md || "",
          cn: parsed.cn || "",
          cp: parsed.cp || "",
        };
      }
    } catch {
      // ignore storage errors
    }
    return { n: "", bg: "", md: "", cn: "", cp: "" };
  });

  const [cardSavedMsg, setCardSavedMsg] = useState<string>("");
  const [locStatus, setLocStatus] = useState<string>("");
  const [sosOpen, setSosOpen] = useState<boolean>(false);
  const [metroActive, setMetroActive] = useState<boolean>(false);
  const [metroPulse, setMetroPulse] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-lifeline",
    ),
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const metroIntervalRef = useRef<number | null>(null);

  const emergencyNum = (COUNTRIES[countryIdx] || COUNTRIES[0])[1];

  useEffect(() => {
    const prev = document.title;
    document.title = "Glifeline · GAMURA Lifeline";
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
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-lifeline"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSosOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Stop metronome cleanly on unmount
  const stopMetronome = useCallback(() => {
    if (metroIntervalRef.current !== null) {
      window.clearInterval(metroIntervalRef.current);
      metroIntervalRef.current = null;
    }
    setMetroActive(false);
    setMetroPulse(false);
  }, []);

  useEffect(() => {
    return () => {
      stopMetronome();
      audioCtxRef.current?.close?.().catch(() => {});
    };
  }, [stopMetronome]);

  const toggleMetronome = () => {
    if (metroActive) {
      stopMetronome();
      return;
    }
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtor && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      // audio optional
    }

    const playTick = () => {
      setMetroPulse(true);
      window.setTimeout(() => setMetroPulse(false), 180);
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.25;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch {
        // ignore audio errors
      }
    };

    setMetroActive(true);
    playTick();
    metroIntervalRef.current = window.setInterval(playTick, 545);
  };

  const handleCountryChange = (nextIdx: number) => {
    setCountryIdx(nextIdx);
    try {
      localStorage.setItem(GL_COUNTRY_KEY, String(nextIdx));
    } catch {
      // ignore storage errors
    }
  };

  const handleSaveCard = () => {
    try {
      localStorage.setItem(GL_CARD_KEY, JSON.stringify(card));
      setCardSavedMsg("Saved on this device ✓");
      window.setTimeout(() => setCardSavedMsg(""), 2500);
    } catch {
      setToastMsg("Could not save card to device storage");
    }
  };

  const handleTriggerSos = () => {
    setSosOpen(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([300, 150, 300]);
      } catch {
        // ignore unsupported vibrate
      }
    }
  };

  const handleShareLocation = () => {
    setLocStatus("Getting location…");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("Location not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const mapUrl = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const shareText = `I need help. My location: ${mapUrl}`;
        if (navigator.share) {
          navigator.share({ text: shareText }).catch(() => {});
          setLocStatus(mapUrl);
        } else if (navigator.clipboard) {
          navigator.clipboard
            .writeText(shareText)
            .then(() => {
              setLocStatus("Location message copied. Paste it to a contact.");
            })
            .catch(() => {
              setLocStatus(mapUrl);
            });
        } else {
          setLocStatus(mapUrl);
        }
      },
      () => {
        setLocStatus("Could not get location. Allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-lifeline");
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

  // Visual theme tokens
  const pageBg = isDark
    ? "bg-[#000000] text-[#f5f5f7]"
    : "bg-[#f2f2f7] text-[#1c1c1e]";
  const cardCls = isDark
    ? "bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
    : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
  const subCls = isDark ? "text-[#98989f]" : "text-[#6e6e73]";
  const lineCls = isDark ? "border-[#2c2c2e]" : "border-[#e5e5ea]";
  const inputBg = isDark
    ? "bg-[#0a0a0c] border-[#2c2c2e] text-[#f5f5f7]"
    : "bg-[#f2f2f7] border-[#e5e5ea] text-[#1c1c1e]";
  const fillBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e5e5ea]/70";
  const glassBar = isDark
    ? "bg-[#1c1c1e]/80 border-[#2c2c2e]"
    : "bg-white/80 border-[#e5e5ea]";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 pb-24 ${pageBg}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Inline keyframes matching Lifeline pulsing SOS & flash overlay */}
      <style>{`
        @keyframes glPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 14px 40px rgba(255,59,48,0.45); }
          50% { transform: scale(1.03); box-shadow: 0 14px 60px rgba(255,59,48,0.72); }
        }
        @keyframes glFlash {
          0%, 100% { background-color: #c4170d; }
          50% { background-color: #ff3b30; }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-xl border-b ${glassBar}`}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${fillBg}`}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className={`hidden sm:inline-flex min-h-[34px] px-3 rounded-full text-xs font-semibold items-center gap-1 whitespace-nowrap ${fillBg}`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-1 min-w-0">
              <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#ff3b30] to-[#c4170d] text-white flex items-center justify-center shadow-xs shrink-0">
                <HeartPulse size={15} />
              </div>
              <span className="font-bold text-sm tracking-tight truncate">
                Glifeline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Toggle Light/Dark theme"
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer ${fillBg}`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              aria-label={
                installedInUniverse ? "In Universe" : "Add to Universe"
              }
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : fillBg
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span className="hidden md:inline">
                {installedInUniverse ? "In Universe" : "Add to Universe"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-[520px] mx-auto px-4 pt-5 flex-1">
        {/* TAB 1: SOS */}
        {activeTab === "sos" && (
          <section aria-label="Emergency SOS">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] leading-tight">
              Lifeline
            </h1>
            <p className={`text-sm mt-1 mb-5 ${subCls}`}>
              Help, ready in one tap. Works offline. Your data stays on this device.
            </p>

            <button
              type="button"
              onClick={handleTriggerSos}
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, #ff6b61, #ff3b30 60%, #c4170d)",
                animation: "glPulse 2.4s infinite",
              }}
              className="w-[210px] h-[210px] rounded-full border-0 mx-auto my-4 flex flex-col items-center justify-center text-white cursor-pointer select-none"
            >
              <span className="text-[44px] font-extrabold tracking-wide leading-none">
                SOS
              </span>
              <small className="text-[13px] font-medium opacity-90 mt-1.5">
                Tap in an emergency
              </small>
            </button>

            <div className={`rounded-[20px] p-4 mt-5 space-y-3 ${cardCls}`}>
              <div>
                <label
                  htmlFor="gl-country-select"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${subCls}`}
                >
                  Your country
                </label>
                <div className="relative">
                  <select
                    id="gl-country-select"
                    value={countryIdx}
                    onChange={(e) => handleCountryChange(Number(e.target.value))}
                    className={`w-full rounded-xl border px-3 py-3 pr-9 text-base outline-none appearance-none cursor-pointer ${inputBg}`}
                  >
                    {COUNTRIES.map(([country, code], idx) => (
                      <option key={country} value={idx}>
                        {country} — {code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${subCls}`}
                  />
                </div>
              </div>

              <a
                href={`tel:${emergencyNum}`}
                className="flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 px-4 text-base font-semibold bg-[#ff3b30] hover:bg-[#e03228] text-white transition-colors"
              >
                <Phone size={17} />
                <span>Call {emergencyNum}</span>
              </a>

              <button
                type="button"
                onClick={handleShareLocation}
                className={`flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 px-4 text-base font-semibold cursor-pointer transition-opacity hover:opacity-85 ${
                  isDark
                    ? "bg-[#2c2c2e] text-white"
                    : "bg-[#f2f2f7] text-[#1c1c1e]"
                }`}
              >
                <MapPin size={17} className="text-[#10b981]" />
                <span>Share my location</span>
              </button>

              {locStatus && (
                <p className={`text-xs break-all pt-0.5 ${subCls}`}>
                  {locStatus}
                </p>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: EMERGENCY CARD */}
        {activeTab === "card" && (
          <section aria-label="Emergency Medical Card">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] leading-tight">
              Emergency Card
            </h1>
            <p className={`text-sm mt-1 mb-5 ${subCls}`}>
              Shown on the SOS screen so helpers know what to do.
            </p>

            <div className={`rounded-[20px] p-4 space-y-3.5 ${cardCls}`}>
              <div>
                <label
                  htmlFor="gl-card-name"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Full name
                </label>
                <input
                  id="gl-card-name"
                  type="text"
                  value={card.n}
                  onChange={(e) =>
                    setCard((prev) => ({ ...prev, n: e.target.value }))
                  }
                  placeholder="Your name"
                  className={`w-full rounded-xl border px-3 py-3 text-base outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label
                  htmlFor="gl-card-bg"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Blood group
                </label>
                <div className="relative">
                  <select
                    id="gl-card-bg"
                    value={card.bg}
                    onChange={(e) =>
                      setCard((prev) => ({ ...prev, bg: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-3 py-3 pr-9 text-base outline-none appearance-none cursor-pointer ${inputBg}`}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg || "none"} value={bg}>
                        {bg || "—"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${subCls}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="gl-card-md"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Allergies / conditions / medicines
                </label>
                <textarea
                  id="gl-card-md"
                  rows={3}
                  value={card.md}
                  onChange={(e) =>
                    setCard((prev) => ({ ...prev, md: e.target.value }))
                  }
                  placeholder="e.g. Penicillin allergy"
                  className={`w-full rounded-xl border px-3 py-3 text-base outline-none resize-y ${inputBg}`}
                />
              </div>

              <div>
                <label
                  htmlFor="gl-card-cn"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Emergency contact name
                </label>
                <input
                  id="gl-card-cn"
                  type="text"
                  value={card.cn}
                  onChange={(e) =>
                    setCard((prev) => ({ ...prev, cn: e.target.value }))
                  }
                  placeholder="Contact person"
                  className={`w-full rounded-xl border px-3 py-3 text-base outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label
                  htmlFor="gl-card-cp"
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}
                >
                  Emergency contact phone
                </label>
                <input
                  id="gl-card-cp"
                  type="tel"
                  inputMode="tel"
                  value={card.cp}
                  onChange={(e) =>
                    setCard((prev) => ({ ...prev, cp: e.target.value }))
                  }
                  placeholder="+91 …"
                  className={`w-full rounded-xl border px-3 py-3 text-base outline-none ${inputBg}`}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCard}
                className="w-full rounded-[14px] py-3.5 px-4 text-base font-semibold bg-[#10b981] hover:bg-[#059669] text-white cursor-pointer transition-colors"
              >
                Save card
              </button>

              {cardSavedMsg && (
                <p className="text-center text-sm font-medium text-[#10b981]">
                  {cardSavedMsg}
                </p>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: FIRST AID */}
        {activeTab === "aid" && (
          <section aria-label="First Aid Guide">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] leading-tight">
              First Aid
            </h1>
            <p className={`text-sm mt-1 mb-5 ${subCls}`}>
              Quick steps. Call emergency services first.
            </p>

            <div className={`rounded-[20px] px-4 py-1 ${cardCls}`}>
              {/* CPR + Interactive Beat Metronome */}
              <details open className={`border-b ${lineCls} py-3.5`}>
                <summary className="font-semibold text-[17px] cursor-pointer list-none flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <span>❤️</span>
                    <span>CPR (adult)</span>
                  </span>
                  <span className="text-xs font-semibold text-[#10b981]">
                    110 BPM Beat
                  </span>
                </summary>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={toggleMetronome}
                    className={`w-[130px] h-[130px] rounded-full mx-auto my-2 flex flex-col items-center justify-center text-white font-extrabold text-xl cursor-pointer transition-transform ${
                      metroActive
                        ? metroPulse
                          ? "bg-[#059669] scale-115 shadow-lg"
                          : "bg-[#10b981] scale-100 shadow-md"
                        : "bg-[#10b981] hover:bg-[#059669] shadow-md"
                    }`}
                  >
                    <span>{metroActive ? "Push!" : "Start beat"}</span>
                    <span className="text-[11px] font-medium opacity-85 mt-1">
                      {metroActive ? "Tap to stop" : "Tap for rhythm"}
                    </span>
                  </button>
                  <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[15px] leading-relaxed">
                    <li>
                      Check the scene is safe, shout for help, call emergency services.
                    </li>
                    <li>
                      Place the heel of your hand on the centre of the chest, other hand on top.
                    </li>
                    <li>
                      Push hard and fast, about 5–6 cm deep, 100–120 times per minute (follow the beat).
                    </li>
                    <li>Let the chest rise fully between pushes.</li>
                    <li>
                      Use an AED as soon as one arrives. Continue until help takes over.
                    </li>
                  </ol>
                </div>
              </details>

              {/* Choking */}
              <details className={`border-b ${lineCls} py-3.5`}>
                <summary className="font-semibold text-[17px] cursor-pointer list-none flex items-center gap-2">
                  <span>🫁</span>
                  <span>Choking (adult)</span>
                </summary>
                <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[15px] leading-relaxed">
                  <li>
                    Ask “Are you choking?” If they cannot cough, speak or breathe, act.
                  </li>
                  <li>Give up to 5 firm back blows between the shoulder blades.</li>
                  <li>
                    Then up to 5 abdominal thrusts (inward and upward above the navel).
                  </li>
                  <li>
                    Alternate until the object clears or they collapse. Then call emergency and start CPR.
                  </li>
                </ol>
              </details>

              {/* Severe Bleeding */}
              <details className={`border-b ${lineCls} py-3.5`}>
                <summary className="font-semibold text-[17px] cursor-pointer list-none flex items-center gap-2">
                  <span>🩸</span>
                  <span>Severe bleeding</span>
                </summary>
                <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[15px] leading-relaxed">
                  <li>Call emergency services.</li>
                  <li>
                    Press firmly on the wound with a clean cloth. Do not remove it if soaked; add more on top.
                  </li>
                  <li>Keep pressure on and raise the injured limb if possible.</li>
                  <li>Keep the person lying down and warm until help arrives.</li>
                </ol>
              </details>

              {/* Burns */}
              <details className={`border-b ${lineCls} py-3.5`}>
                <summary className="font-semibold text-[17px] cursor-pointer list-none flex items-center gap-2">
                  <Flame size={17} className="text-orange-500" />
                  <span>Burns</span>
                </summary>
                <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[15px] leading-relaxed">
                  <li>Cool the burn under cool running water for 20 minutes.</li>
                  <li>
                    Remove rings or tight items before swelling starts, unless stuck to skin.
                  </li>
                  <li>Cover loosely with clean cling film or a non-fluffy cloth.</li>
                  <li>
                    No ice, butter or creams. Seek urgent care for large, deep or facial burns.
                  </li>
                </ol>
              </details>

              {/* Stroke signs (FAST) */}
              <details className="py-3.5">
                <summary className="font-semibold text-[17px] cursor-pointer list-none flex items-center gap-2">
                  <Activity size={17} className="text-rose-500" />
                  <span>Stroke signs (FAST)</span>
                </summary>
                <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[15px] leading-relaxed">
                  <li>
                    <strong>F</strong>ace drooping on one side.
                  </li>
                  <li>
                    <strong>A</strong>rm weakness, cannot raise both.
                  </li>
                  <li>
                    <strong>S</strong>peech slurred or confused.
                  </li>
                  <li>
                    <strong>T</strong>ime: call emergency immediately and note when symptoms began.
                  </li>
                </ol>
              </details>
            </div>
          </section>
        )}

        {/* TAB 4: EMERGENCY NUMBERS */}
        {activeTab === "num" && (
          <section aria-label="Emergency Numbers">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] leading-tight">
              Numbers
            </h1>
            <p className={`text-sm mt-1 mb-5 ${subCls}`}>
              Emergency numbers by country. Tap to call.
            </p>

            <div className={`rounded-[20px] px-4 py-1 ${cardCls}`}>
              {COUNTRIES.map(([country, code], idx) => (
                <div
                  key={country}
                  className={`flex items-center justify-between py-3 text-base ${
                    idx < COUNTRIES.length - 1 ? `border-b ${lineCls}` : ""
                  }`}
                >
                  <span>{country}</span>
                  <a
                    href={`tel:${code}`}
                    className="font-bold text-xl text-[#10b981] hover:underline"
                  >
                    {code}
                  </a>
                </div>
              ))}
            </div>

            <p className={`text-xs text-center mt-4 leading-relaxed ${subCls}`}>
              Numbers can change. Verify for your location. 112 works on most mobile networks worldwide.
            </p>
          </section>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Lifeline sections"
        className={`fixed left-0 right-0 bottom-0 z-30 border-t backdrop-blur-xl ${glassBar}`}
      >
        <div className="max-w-[520px] mx-auto flex items-center px-2 py-2">
          {[
            {
              id: "sos" as LifelineTab,
              label: "SOS",
              icon: <ShieldAlert size={20} />,
            },
            {
              id: "card" as LifelineTab,
              label: "Card",
              icon: <IdCard size={20} />,
            },
            {
              id: "aid" as LifelineTab,
              label: "First Aid",
              icon: <Stethoscope size={20} />,
            },
            {
              id: "num" as LifelineTab,
              label: "Numbers",
              icon: <Phone size={20} />,
            },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== "aid") stopMetronome();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
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

      {/* FLASHING SOS OVERLAY */}
      {sosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="SOS Emergency Screen"
          style={{ animation: "glFlash 1s infinite" }}
          className="fixed inset-0 z-50 flex flex-col justify-center items-center p-6 text-white text-center overflow-auto"
        >
          <div className="w-full max-w-[440px] space-y-4">
            <h2 className="text-[40px] font-extrabold tracking-tight leading-none">
              🆘 I NEED HELP
            </h2>

            <div className="bg-black/30 rounded-[18px] p-4 text-left text-[17px] leading-relaxed space-y-1">
              {card.n || card.bg || card.md || card.cn || card.cp ? (
                <>
                  {card.n && (
                    <div>
                      <strong>Name:</strong> {card.n}
                    </div>
                  )}
                  {card.bg && (
                    <div>
                      <strong>Blood:</strong> {card.bg}
                    </div>
                  )}
                  {card.md && (
                    <div>
                      <strong>Medical:</strong> {card.md}
                    </div>
                  )}
                  {(card.cn || card.cp) && (
                    <div>
                      <strong>Contact:</strong> {card.cn}{" "}
                      {card.cp && (
                        <a
                          href={`tel:${card.cp}`}
                          className="underline font-semibold text-white"
                        >
                          {card.cp}
                        </a>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p>
                  Fill your Emergency Card so helpers can see your details here.
                </p>
              )}
            </div>

            <a
              href={`tel:${emergencyNum}`}
              className="flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 px-4 text-base font-bold bg-white text-[#c4170d] shadow-lg"
            >
              <Phone size={18} />
              <span>Call {emergencyNum}</span>
            </a>

            <button
              type="button"
              onClick={handleShareLocation}
              className="flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 px-4 text-base font-semibold bg-white/90 text-[#1c1c1e] cursor-pointer"
            >
              <MapPin size={18} className="text-[#c4170d]" />
              <span>Share my location</span>
            </button>

            {locStatus && (
              <p className="text-xs text-white/90 break-all">{locStatus}</p>
            )}

            <button
              type="button"
              onClick={() => setSosOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 px-4 text-base font-semibold bg-black/35 hover:bg-black/50 text-white cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

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
