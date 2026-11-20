import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Moon,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Wand2,
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

interface GamuraResumePageProps {
  onBackHome: () => void;
}

type ResumeTemplate = "aurora" | "clean" | "serif";

interface ResumeListEntry {
  t: string; // Title / Role / Project / Degree
  o: string; // Organization / Stack / College
  d: string; // Dates / Year
  b: string; // Bullets (newline separated)
}

interface ResumeState {
  tpl: ResumeTemplate;
  acc: string;
  p: {
    name: string;
    title: string;
    email: string;
    phone: string;
    loc: string;
    link: string;
  };
  sum: string;
  exp: ResumeListEntry[];
  proj: ResumeListEntry[];
  edu: ResumeListEntry[];
  skills: string;
}

const GAMURA_RESUME_STORAGE_KEY = "gr_s";
const GAMURA_RESUME_THEME_KEY = "gr_theme";

const ACCENT_PRESETS = [
  "#0fa874",
  "#2563eb",
  "#7c3aed",
  "#e11d48",
  "#d97706",
  "#1f2937",
];

const TEMPLATES: { id: ResumeTemplate; label: string }[] = [
  { id: "aurora", label: "Aurora" },
  { id: "clean", label: "Clean" },
  { id: "serif", label: "Classic" },
];

const DEFAULT_RESUME_STATE: ResumeState = {
  tpl: "aurora",
  acc: "#0fa874",
  p: {
    name: "Selvaranjan G",
    title: "Full Stack Developer",
    email: "",
    phone: "",
    loc: "Chennai, India",
    link: "gamura.vercel.app",
  },
  sum: "BCA student and solo founder who designs, builds and ships full stack web products on Next.js, Firebase and Vercel.",
  exp: [
    {
      t: "Founder and CEO",
      o: "Gamura",
      d: "Present",
      b: "Launched 7 live web platforms in the Gamura ecosystem\nBuilt, designed and deployed every product solo on a free-tier stack",
    },
    {
      t: "Web Development Intern",
      o: "Cognifyz IT Solutions",
      d: "",
      b: "Built and tested responsive web pages\nFixed interface bugs and shipped updates with the team",
    },
  ],
  proj: [
    {
      t: "Gamura Galaxy",
      o: "Next.js, Firebase",
      d: "",
      b: "Gaming and tech hub with login and live data",
    },
    {
      t: "BuBuBai",
      o: "Gemini API",
      d: "",
      b: "AI chat product deployed on Vercel",
    },
    {
      t: "GJava",
      o: "JavaScript",
      d: "",
      b: "Browser-based Java IDE in a single file",
    },
  ],
  edu: [
    {
      t: "Bachelor of Computer Applications",
      o: "DDGD Vaishnav College, Chennai",
      d: "",
      b: "Scored 100/100 in Computer Applications in 12th grade boards",
    },
  ],
  skills:
    "JavaScript, Next.js, Firebase, Python, Java, C++, PHP, SQL, HTML, CSS",
};

const WEAK_VERBS: [RegExp, string][] = [
  [/^(worked on|working on)\s+/i, "Built "],
  [/^(helped|assisted)( with| in)?\s+/i, "Supported "],
  [/^(made|created)\s+/i, "Built "],
  [/^(responsible for)\s+/i, "Owned "],
  [/^(did|done)\s+/i, "Delivered "],
  [/^(used)\s+/i, "Applied "],
  [/^(fixed)\s+/i, "Resolved "],
];

function parseBullets(raw: string): string[] {
  return String(raw || "")
    .split("\n")
    .map((line) => line.replace(/^[\s\-•*]+/, "").trim())
    .filter(Boolean);
}

function sharpenBulletLine(line: string): string {
  let out = line.replace(/\.$/, "");
  for (const [pattern, replacement] of WEAK_VERBS) {
    out = out.replace(pattern, replacement);
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function escapeHtml(raw: string): string {
  return String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function darkenHex(hex: string, factor = 0.55): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#04150e";
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function GamuraResumePage({
  onBackHome,
}: GamuraResumePageProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(GAMURA_RESUME_THEME_KEY);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch {
      return false;
    }
  });

  const [resume, setResume] = useState<ResumeState>(() => {
    try {
      const raw = localStorage.getItem(GAMURA_RESUME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.p) {
          return {
            ...DEFAULT_RESUME_STATE,
            ...parsed,
            p: { ...DEFAULT_RESUME_STATE.p, ...(parsed.p || {}) },
            exp: Array.isArray(parsed.exp)
              ? parsed.exp
              : DEFAULT_RESUME_STATE.exp,
            proj: Array.isArray(parsed.proj)
              ? parsed.proj
              : DEFAULT_RESUME_STATE.proj,
            edu: Array.isArray(parsed.edu)
              ? parsed.edu
              : DEFAULT_RESUME_STATE.edu,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_RESUME_STATE;
  });

  const [mobileView, setMobileView] = useState<"edit" | "prev">("edit");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [paperScale, setPaperScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(1123);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);

  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-resume",
    ),
  );

  useEffect(() => {
    try {
      localStorage.setItem(GAMURA_RESUME_THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(GAMURA_RESUME_STORAGE_KEY, JSON.stringify(resume));
    } catch {
      // ignore
    }
  }, [resume]);

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-resume"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Dynamically scale A4 paper (794px) to fit wrapper width cleanly
  useEffect(() => {
    const updateScale = () => {
      const wrap = wrapRef.current;
      const paper = paperRef.current;
      if (!wrap || !paper) return;
      const available = wrap.clientWidth;
      if (available <= 0) return;
      const scale = Math.min(1, available / 794);
      setPaperScale(scale);
      setPaperHeight(Math.ceil(paper.offsetHeight * scale));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (paperRef.current) ro.observe(paperRef.current);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [resume, mobileView]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const handleToggleUniverse = () => {
    const builtin = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-resume");
    if (!builtin) return;
    if (installedInUniverse) {
      removeAppFromUniverse(builtin.id);
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(builtin);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps");
    }
  };

  // Profile field updater
  const updateProfileField = (
    field: keyof ResumeState["p"],
    value: string,
  ) => {
    setResume((prev) => ({
      ...prev,
      p: { ...prev.p, [field]: value },
    }));
  };

  // List item helpers
  const addListItem = (key: "exp" | "proj" | "edu") => {
    setResume((prev) => ({
      ...prev,
      [key]: [...prev[key], { t: "", o: "", d: "", b: "" }],
    }));
  };

  const updateListItem = (
    key: "exp" | "proj" | "edu",
    index: number,
    field: keyof ResumeListEntry,
    value: string,
  ) => {
    setResume((prev) => ({
      ...prev,
      [key]: prev[key].map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeListItem = (key: "exp" | "proj" | "edu", index: number) => {
    setResume((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index),
    }));
  };

  const sharpenItemBullets = (key: "exp" | "proj", index: number) => {
    const target = resume[key][index];
    if (!target) return;
    const lines = parseBullets(target.b);
    if (!lines.length) {
      showToast("Add bullet points first to sharpen them");
      return;
    }
    const sharpened = lines.map(sharpenBulletLine).join("\n");
    updateListItem(key, index, "b", sharpened);
    showToast("Points sharpened. Add numbers where you can.");
  };

  const generateLocalSummary = () => {
    const topSkills = resume.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
    const generated = `${resume.p.title || "Professional"} skilled in ${
      topSkills || "modern software engineering"
    }. Focused on shipping clear, reliable work and learning fast.`;
    setResume((prev) => ({ ...prev, sum: generated }));
    showToast("Summary written");
  };

  const handleResetSample = () => {
    setResume(DEFAULT_RESUME_STATE);
    showToast("Sample resume restored");
  };

  const handleDownloadPdf = () => {
    showToast("Choose Save as PDF in the print dialog");
    window.setTimeout(() => {
      try {
        window.print();
      } catch {
        showToast("Print blocked here. Try Save HTML instead.");
      }
    }, 240);
  };

  const handleDownloadHtml = () => {
    const paperEl = paperRef.current;
    if (!paperEl) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(resume.p.name || "Resume")} - Resume</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #eef2ef; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .resume-export { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.15); }
  @page { size: A4; margin: 0; }
  @media print { body { background: #fff; padding: 0; } .resume-export { box-shadow: none; width: 210mm; } }
</style>
</head>
<body>
  <div class="resume-export">${paperEl.outerHTML}</div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (resume.p.name || "resume")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${slug || "gamura"}-resume.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Saved printable HTML resume");
  };

  // Strength metrics matching HTML spec
  const strengthMetrics = useMemo(() => {
    const allEntries = [...resume.exp, ...resume.proj];
    const allBullets = allEntries.flatMap((e) => parseBullets(e.b));
    const bulletsWithNums = allBullets.filter((b) => /\d/.test(b)).length;
    const skillCount = resume.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length;

    const checks: [boolean, string][] = [
      [
        Boolean(resume.p.email.trim() || resume.p.phone.trim()),
        "Add an email or phone so people can reach you.",
      ],
      [
        resume.sum.trim().length > 60,
        "Write a summary of two or three lines.",
      ],
      [
        allBullets.length >= 4,
        "Add more points under Experience or Projects.",
      ],
      [
        bulletsWithNums >= 2,
        "Put a number in at least two points, like users, speed or count.",
      ],
      [skillCount >= 6, "List at least six skills."],
      [Boolean(resume.p.link.trim()), "Add a website or portfolio link."],
    ];

    const passed = checks.filter((c) => c[0]).length;
    const firstMissing = checks.find((c) => !c[0]);
    return {
      pct: Math.round((passed / checks.length) * 100),
      tip: firstMissing
        ? firstMissing[1]
        : "Looks strong. Download it as a PDF when you are ready.",
    };
  }, [resume]);

  const parsedSkills = useMemo(
    () =>
      resume.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [resume.skills],
  );

  const contactItems = useMemo(
    () =>
      [resume.p.email, resume.p.phone, resume.p.loc, resume.p.link]
        .map((s) => s.trim())
        .filter(Boolean),
    [resume.p],
  );

  // Theme utility classes
  const cardSurface = isDark
    ? "bg-[#14211b]/82 border-white/[0.1] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(0,0,0,0.35)]"
    : "bg-white/84 border-[#13231c]/[0.09] shadow-[0_1px_2px_rgba(19,35,28,0.06),0_10px_28px_rgba(19,35,28,0.07)]";

  const inputClass = isDark
    ? "w-full bg-[#07110d] border border-white/[0.12] rounded-xl px-3 py-2.5 text-sm text-[#e8f3ee] outline-none focus:border-[#2fd49a] focus:ring-2 focus:ring-[#2fd49a]/20"
    : "w-full bg-[#f2f6f4] border border-[#13231c]/[0.1] rounded-xl px-3 py-2.5 text-sm text-[#13231c] outline-none focus:border-[#0fa874] focus:ring-2 focus:ring-[#0fa874]/15";

  const nestedItemCard = isDark
    ? "border border-white/[0.1] rounded-2xl p-3 bg-[#07110d]/70 space-y-2.5"
    : "border border-[#13231c]/[0.09] rounded-2xl p-3 bg-[#f2f6f4]/70 space-y-2.5";

  const mutedText = isDark ? "text-[#8aa196]" : "text-[#6b7d74]";
  const accentText = isDark ? "text-[#2fd49a]" : "text-[#0a7d57]";
  const accentSoftBg = isDark ? "bg-[#2fd49a]/15" : "bg-[#0fa874]/12";

  const renderPaperSection = (
    heading: string,
    entries: ResumeListEntry[],
    onDarkSidebar = false,
  ) => {
    const valid = entries.filter((e) => e.t.trim() || e.o.trim());
    if (!valid.length) return null;
    const isSerif = resume.tpl === "serif";
    return (
      <section style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: isSerif ? 14 : 13,
            margin: "0 0 8px",
            color: onDarkSidebar
              ? "#ffffff"
              : isSerif
                ? "#1b2621"
                : resume.acc,
            letterSpacing: "0.02em",
            fontVariant: isSerif ? "small-caps" : "normal",
            borderBottom: onDarkSidebar
              ? "1.5px solid rgba(255,255,255,0.45)"
              : isSerif
                ? "1.5px solid #1b2621"
                : `1.5px solid ${resume.acc}`,
            paddingBottom: 3,
            fontWeight: 700,
          }}
        >
          {heading}
        </h2>
        {valid.map((entry, idx) => {
          const bullets = parseBullets(entry.b);
          return (
            <div
              key={`${heading}-${idx}`}
              style={{ marginBottom: 10, breakInside: "avoid" }}
            >
              <div
                style={{
                  display: onDarkSidebar ? "block" : "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <strong style={{ fontWeight: 700 }}>{entry.t}</strong>
                {entry.d && (
                  <span
                    style={{
                      color: onDarkSidebar
                        ? "rgba(255,255,255,0.8)"
                        : "#66756e",
                      whiteSpace: "nowrap",
                      display: onDarkSidebar ? "block" : "inline",
                      fontSize: 12,
                    }}
                  >
                    {entry.d}
                  </span>
                )}
              </div>
              {entry.o && (
                <div
                  style={{
                    color: onDarkSidebar
                      ? "rgba(255,255,255,0.85)"
                      : "#46544d",
                    fontSize: 12.5,
                  }}
                >
                  {entry.o}
                </div>
              )}
              {bullets.length > 0 && (
                <ul
                  style={{
                    margin: "4px 0 0",
                    paddingLeft: 18,
                    listStyleType: "disc",
                  }}
                >
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ margin: "2px 0" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-200 ${
        isDark ? "bg-[#07110d] text-[#e8f3ee]" : "bg-[#f2f6f4] text-[#13231c]"
      }`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* Print Stylesheet so PDF print outputs strictly the 210mm A4 Resume Paper */}
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .gr-no-print {
            display: none !important;
          }
          .gr-print-shell {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .gr-print-stage {
            background: transparent !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          .gr-print-wrap {
            height: auto !important;
            overflow: visible !important;
          }
          .gr-resume-paper {
            position: static !important;
            transform: none !important;
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
        }
      `}</style>

      {/* Subtle emerald atmospheric glow */}
      <div
        aria-hidden="true"
        className="gr-no-print pointer-events-none fixed inset-x-0 -top-24 h-96 z-0"
        style={{
          background: isDark
            ? "radial-gradient(60% 65% at 50% 0%, rgba(47,212,154,0.16), transparent 72%)"
            : "radial-gradient(60% 65% at 50% 0%, rgba(15,168,116,0.14), transparent 72%)",
        }}
      />

      {/* Apple Top Header */}
      <header
        className={`gr-no-print sticky top-0 z-30 backdrop-blur-2xl border-b ${
          isDark
            ? "bg-[#07110d]/85 border-white/[0.08]"
            : "bg-[#f2f6f4]/85 border-[#13231c]/[0.08]"
        }`}
      >
        <div className="max-w-[1220px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
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
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              <span>Launch Store</span>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 pl-1 min-w-0">
              <div
                className="w-8 h-8 rounded-[9px] text-white flex items-center justify-center shadow-sm shrink-0"
                style={{
                  background: "linear-gradient(140deg, #10b981, #047857)",
                }}
              >
                <FileCheck2 size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight truncate leading-tight">
                  RESUME MAKER{" "}
                  <span className={`${accentText} font-semibold`}>
                    · Gamura Resume
                  </span>
                </div>
                <div
                  className={`hidden md:block text-[10px] leading-none mt-0.5 ${mutedText}`}
                >
                  Live A4 Builder, AI Point Sharpener & PDF Export
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((v) => !v)}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "bg-white/[0.08] hover:bg-white/[0.15] text-amber-300"
                  : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? isDark
                    ? "bg-[#2fd49a]/18 text-[#2fd49a] border border-[#2fd49a]/35"
                    : "bg-[#0fa874]/14 text-[#0a7d57] border border-[#0fa874]/30"
                  : isDark
                    ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                    : "bg-white hover:bg-[#e5ede9] text-[#13231c] border border-[#13231c]/10"
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

      {/* Main Split Workspace */}
      <div className="gr-print-shell relative z-10 flex-1 w-full max-w-[1220px] mx-auto px-4 pt-5 pb-28 lg:pb-12 grid grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)] gap-5 items-start">
        {/* Left Column: Editor Controls */}
        <div
          className={`gr-no-print space-y-4 ${
            mobileView === "prev" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight leading-tight">
                Resume
              </h1>
              <p className={`text-sm mt-0.5 ${mutedText}`}>
                Fill in your details. The page updates as you type.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSample}
              className={`mt-1 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${accentSoftBg} ${accentText}`}
            >
              <RotateCcw size={13} />
              <span>Reset sample</span>
            </button>
          </div>

          {/* Look Panel: Template + Accent Color */}
          <section
            className={`rounded-[22px] border backdrop-blur-xl p-4 space-y-3 ${cardSurface}`}
          >
            <h2 className="text-base font-bold">Look</h2>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((tpl) => {
                const selected = resume.tpl === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setResume((prev) => ({ ...prev, tpl: tpl.id }))
                    }
                    className={`rounded-[14px] py-2.5 px-2 text-sm font-semibold border transition-all cursor-pointer ${
                      selected
                        ? isDark
                          ? "border-[#2fd49a] bg-[#2fd49a]/15 text-[#2fd49a]"
                          : "border-[#0fa874] bg-[#0fa874]/12 text-[#0a7d57]"
                        : isDark
                          ? "border-white/[0.1] bg-[#07110d] text-white/80 hover:border-white/25"
                          : "border-[#13231c]/[0.1] bg-[#f2f6f4] text-[#13231c]/80 hover:border-[#13231c]/25"
                    }`}
                  >
                    {tpl.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {ACCENT_PRESETS.map((color) => {
                const active = resume.acc.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Accent ${color}`}
                    aria-pressed={active}
                    onClick={() => setResume((prev) => ({ ...prev, acc: color }))}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                      active
                        ? "scale-110 ring-2 ring-offset-2 ring-current border-white"
                        : "border-white/80 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}

              <label
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer border ${
                  isDark
                    ? "border-white/15 bg-white/5 text-white/80"
                    : "border-[#13231c]/15 bg-white text-[#13231c]/80"
                }`}
              >
                <input
                  type="color"
                  aria-label="Custom accent color"
                  value={resume.acc}
                  onChange={(e) =>
                    setResume((prev) => ({ ...prev, acc: e.target.value }))
                  }
                  className="w-4 h-4 rounded-full border-0 p-0 bg-transparent cursor-pointer"
                />
                <span>Custom</span>
              </label>
            </div>
          </section>

          {/* About You */}
          <section
            className={`rounded-[22px] border backdrop-blur-xl p-4 space-y-3 ${cardSurface}`}
          >
            <h2 className="text-base font-bold">About you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Full name
                </span>
                <input
                  type="text"
                  value={resume.p.name}
                  onChange={(e) => updateProfileField("name", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Job title
                </span>
                <input
                  type="text"
                  value={resume.p.title}
                  onChange={(e) => updateProfileField("title", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Email
                </span>
                <input
                  type="email"
                  value={resume.p.email}
                  onChange={(e) => updateProfileField("email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Phone
                </span>
                <input
                  type="tel"
                  value={resume.p.phone}
                  onChange={(e) => updateProfileField("phone", e.target.value)}
                  placeholder="+91 98..."
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Location
                </span>
                <input
                  type="text"
                  value={resume.p.loc}
                  onChange={(e) => updateProfileField("loc", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                  Website
                </span>
                <input
                  type="text"
                  value={resume.p.link}
                  onChange={(e) => updateProfileField("link", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* Summary */}
          <section
            className={`rounded-[22px] border backdrop-blur-xl p-4 space-y-2.5 ${cardSurface}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Summary</h2>
              <button
                type="button"
                onClick={generateLocalSummary}
                className={`min-h-[34px] px-3 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${accentSoftBg} ${accentText}`}
              >
                <Wand2 size={13} />
                <span>Write it for me</span>
              </button>
            </div>
            <label className="block">
              <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                Two or three lines about you
              </span>
              <textarea
                rows={3}
                value={resume.sum}
                onChange={(e) =>
                  setResume((prev) => ({ ...prev, sum: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </section>

          {/* Dynamic List Editors: Experience, Projects, Education */}
          {(
            [
              {
                key: "exp",
                title: "Experience",
                labels: [
                  "Role",
                  "Company",
                  "Dates",
                  "What you did (one line per point)",
                ],
                canSharpen: true,
              },
              {
                key: "proj",
                title: "Projects",
                labels: [
                  "Project",
                  "Stack or link",
                  "Year",
                  "What it does (one line per point)",
                ],
                canSharpen: true,
              },
              {
                key: "edu",
                title: "Education",
                labels: ["Degree", "College", "Years", "Notes"],
                canSharpen: false,
              },
            ] as const
          ).map((section) => (
            <section
              key={section.key}
              className={`rounded-[22px] border backdrop-blur-xl p-4 space-y-3 ${cardSurface}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold">{section.title}</h2>
                <button
                  type="button"
                  onClick={() => addListItem(section.key)}
                  className={`min-h-[34px] px-3 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${accentSoftBg} ${accentText}`}
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>

              {resume[section.key].map((entry, idx) => (
                <div key={`${section.key}-${idx}`} className={nestedItemCard}>
                  <label className="block">
                    <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                      {section.labels[0]}
                    </span>
                    <input
                      type="text"
                      value={entry.t}
                      onChange={(e) =>
                        updateListItem(section.key, idx, "t", e.target.value)
                      }
                      className={inputClass}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span
                        className={`block text-xs mb-1 ml-0.5 ${mutedText}`}
                      >
                        {section.labels[1]}
                      </span>
                      <input
                        type="text"
                        value={entry.o}
                        onChange={(e) =>
                          updateListItem(section.key, idx, "o", e.target.value)
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span
                        className={`block text-xs mb-1 ml-0.5 ${mutedText}`}
                      >
                        {section.labels[2]}
                      </span>
                      <input
                        type="text"
                        value={entry.d}
                        onChange={(e) =>
                          updateListItem(section.key, idx, "d", e.target.value)
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                      {section.labels[3]}
                    </span>
                    <textarea
                      rows={3}
                      value={entry.b}
                      onChange={(e) =>
                        updateListItem(section.key, idx, "b", e.target.value)
                      }
                      className={inputClass}
                    />
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    {section.canSharpen && (
                      <button
                        type="button"
                        onClick={() =>
                          sharpenItemBullets(
                            section.key as "exp" | "proj",
                            idx,
                          )
                        }
                        className={`min-h-[34px] px-3 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${accentSoftBg} ${accentText}`}
                      >
                        <Sparkles size={13} />
                        <span>Sharpen points</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeListItem(section.key, idx)}
                      className="min-h-[34px] px-3 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1 bg-[#d23c3c]/12 text-[#d23c3c] hover:bg-[#d23c3c]/20 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {/* Skills */}
          <section
            className={`rounded-[22px] border backdrop-blur-xl p-4 space-y-2.5 ${cardSurface}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Skills</h2>
              <span className={`text-xs font-medium tabular-nums ${mutedText}`}>
                {parsedSkills.length} added
              </span>
            </div>
            <label className="block">
              <span className={`block text-xs mb-1 ml-0.5 ${mutedText}`}>
                Separate with commas
              </span>
              <textarea
                rows={3}
                value={resume.skills}
                onChange={(e) =>
                  setResume((prev) => ({ ...prev, skills: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </section>
        </div>

        {/* Right Column: Live Scaled A4 Preview */}
        <div
          className={`lg:sticky lg:top-[74px] ${
            mobileView === "edit" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Action + Strength Toolbar */}
          <div className="gr-no-print flex items-center justify-between gap-2.5 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tabular-nums ${accentSoftBg} ${accentText}`}
            >
              <FileText size={13} />
              <span>Strength {strengthMetrics.pct}%</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadHtml}
                className={`min-h-[40px] px-3.5 rounded-[13px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${accentSoftBg} ${accentText}`}
              >
                <Download size={14} />
                <span>Save HTML</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className={`min-h-[40px] px-4 rounded-[13px] text-sm font-semibold inline-flex items-center gap-1.5 transition-transform active:scale-[0.97] cursor-pointer whitespace-nowrap ${
                  isDark
                    ? "bg-[#2fd49a] hover:bg-[#1fb683] text-[#04150e]"
                    : "bg-[#0fa874] hover:bg-[#0a7d57] text-white"
                }`}
              >
                <Printer size={15} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <p className={`gr-no-print text-xs mb-3 ${mutedText}`}>
            {strengthMetrics.tip}
          </p>

          {/* A4 Stage Wrapper */}
          <div className={`gr-print-stage rounded-[22px] p-2.5 ${accentSoftBg}`}>
            <div
              ref={wrapRef}
              className="gr-print-wrap relative w-full overflow-hidden"
              style={{ height: `${paperHeight}px` }}
            >
              {/* Actual A4 Sheet (794px width) */}
              <div
                ref={paperRef}
                className="gr-resume-paper"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 794,
                  minHeight: 1123,
                  backgroundColor: "#ffffff",
                  color: "#1b2621",
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontFamily:
                    resume.tpl === "serif"
                      ? 'Georgia, "Times New Roman", serif'
                      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
                  transformOrigin: "0 0",
                  transform: `scale(${paperScale})`,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                  ...(resume.tpl === "aurora"
                    ? {
                        display: "grid",
                        gridTemplateColumns: "250px 1fr",
                      }
                    : { padding: "44px 48px" }),
                }}
              >
                {resume.tpl === "aurora" ? (
                  <>
                    {/* Aurora Template Sidebar */}
                    <aside
                      style={{
                        background: `linear-gradient(165deg, ${resume.acc}, ${darkenHex(
                          resume.acc,
                          0.52,
                        )})`,
                        color: "#ffffff",
                        padding: "40px 24px",
                      }}
                    >
                      <h1
                        style={{
                          margin: 0,
                          fontSize: 28,
                          lineHeight: 1.1,
                          letterSpacing: "-0.02em",
                          fontWeight: 700,
                        }}
                      >
                        {resume.p.name || "Your Name"}
                      </h1>
                      <p
                        style={{
                          margin: "4px 0 8px",
                          fontSize: 15,
                          color: "rgba(255,255,255,0.92)",
                          fontWeight: 600,
                        }}
                      >
                        {resume.p.title}
                      </p>

                      {contactItems.length > 0 && (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.88)",
                            fontSize: 12,
                            display: "grid",
                            gap: 3,
                            margin: "10px 0 20px",
                            wordBreak: "break-word",
                          }}
                        >
                          {contactItems.map((item, idx) => (
                            <span key={idx}>{item}</span>
                          ))}
                        </div>
                      )}

                      {parsedSkills.length > 0 && (
                        <section style={{ marginBottom: 16 }}>
                          <h2
                            style={{
                              fontSize: 13,
                              margin: "0 0 8px",
                              color: "#ffffff",
                              borderBottom:
                                "1.5px solid rgba(255,255,255,0.45)",
                              paddingBottom: 3,
                              fontWeight: 700,
                            }}
                          >
                            Skills
                          </h2>
                          <div>
                            {parsedSkills.map((sk, idx) => (
                              <span
                                key={`${sk}-${idx}`}
                                style={{
                                  display: "inline-block",
                                  backgroundColor: "rgba(255,255,255,0.2)",
                                  color: "#ffffff",
                                  borderRadius: 99,
                                  padding: "2px 10px",
                                  margin: "0 4px 5px 0",
                                  fontSize: 12,
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {renderPaperSection("Education", resume.edu, true)}
                    </aside>

                    {/* Aurora Main Column */}
                    <div style={{ padding: "40px 34px" }}>
                      {resume.sum.trim() && (
                        <section style={{ marginBottom: 16 }}>
                          <h2
                            style={{
                              fontSize: 13,
                              margin: "0 0 8px",
                              color: resume.acc,
                              borderBottom: `1.5px solid ${resume.acc}`,
                              paddingBottom: 3,
                              fontWeight: 700,
                            }}
                          >
                            Profile
                          </h2>
                          <p style={{ margin: 0 }}>{resume.sum}</p>
                        </section>
                      )}

                      {renderPaperSection("Experience", resume.exp, false)}
                      {renderPaperSection("Projects", resume.proj, false)}
                    </div>
                  </>
                ) : (
                  /* Clean & Classic (Serif) Templates */
                  <>
                    <header
                      style={{
                        marginBottom: 18,
                        ...(resume.tpl === "serif"
                          ? {
                              textAlign: "center",
                              borderBottom: "2px solid #1b2621",
                              paddingBottom: 12,
                            }
                          : {}),
                      }}
                    >
                      <h1
                        style={{
                          margin: 0,
                          fontSize: 32,
                          lineHeight: 1.1,
                          letterSpacing: "-0.02em",
                          fontWeight: 700,
                        }}
                      >
                        {resume.p.name || "Your Name"}
                      </h1>
                      <p
                        style={{
                          margin: "4px 0 8px",
                          fontSize: 15,
                          color:
                            resume.tpl === "serif" ? "#1b2621" : resume.acc,
                          fontWeight: resume.tpl === "serif" ? 400 : 600,
                          fontStyle:
                            resume.tpl === "serif" ? "italic" : "normal",
                        }}
                      >
                        {resume.p.title}
                      </p>
                      {contactItems.length > 0 && (
                        <div style={{ color: "#55645d", fontSize: 12 }}>
                          {contactItems.join("  |  ")}
                        </div>
                      )}
                    </header>

                    {resume.sum.trim() && (
                      <section style={{ marginBottom: 16 }}>
                        <h2
                          style={{
                            fontSize: resume.tpl === "serif" ? 14 : 13,
                            margin: "0 0 8px",
                            color:
                              resume.tpl === "serif" ? "#1b2621" : resume.acc,
                            fontVariant:
                              resume.tpl === "serif" ? "small-caps" : "normal",
                            borderBottom:
                              resume.tpl === "serif"
                                ? "1.5px solid #1b2621"
                                : `1.5px solid ${resume.acc}`,
                            paddingBottom: 3,
                            fontWeight: 700,
                          }}
                        >
                          Profile
                        </h2>
                        <p style={{ margin: 0 }}>{resume.sum}</p>
                      </section>
                    )}

                    {renderPaperSection("Experience", resume.exp, false)}
                    {renderPaperSection("Projects", resume.proj, false)}
                    {renderPaperSection("Education", resume.edu, false)}

                    {parsedSkills.length > 0 && (
                      <section style={{ marginBottom: 16 }}>
                        <h2
                          style={{
                            fontSize: resume.tpl === "serif" ? 14 : 13,
                            margin: "0 0 8px",
                            color:
                              resume.tpl === "serif" ? "#1b2621" : resume.acc,
                            fontVariant:
                              resume.tpl === "serif" ? "small-caps" : "normal",
                            borderBottom:
                              resume.tpl === "serif"
                                ? "1.5px solid #1b2621"
                                : `1.5px solid ${resume.acc}`,
                            paddingBottom: 3,
                            fontWeight: 700,
                          }}
                        >
                          Skills
                        </h2>
                        {resume.tpl === "serif" ? (
                          <p style={{ margin: 0 }}>
                            {parsedSkills.join(", ")}
                          </p>
                        ) : (
                          <div>
                            {parsedSkills.map((sk, idx) => (
                              <span
                                key={`${sk}-${idx}`}
                                style={{
                                  display: "inline-block",
                                  backgroundColor: `${resume.acc}20`,
                                  color: "#1b2621",
                                  borderRadius: 99,
                                  padding: "2px 10px",
                                  margin: "0 4px 5px 0",
                                  fontSize: 12,
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Edit / Preview Bottom Switcher */}
      <nav
        aria-label="Resume editor view switcher"
        className={`gr-no-print lg:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 py-2.5 backdrop-blur-2xl border-t ${
          isDark
            ? "bg-[#07110d]/85 border-white/[0.08]"
            : "bg-[#f2f6f4]/85 border-[#13231c]/[0.08]"
        }`}
      >
        <div
          role="tablist"
          className={`flex gap-1.5 p-1 rounded-2xl w-full max-w-[340px] ${accentSoftBg}`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "edit"}
            onClick={() => {
              setMobileView("edit");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex-1 min-h-[42px] rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileView === "edit"
                ? isDark
                  ? "bg-[#14211b] text-white shadow-sm"
                  : "bg-white text-[#13231c] shadow-sm"
                : mutedText
            }`}
          >
            <Pencil size={15} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "prev"}
            onClick={() => {
              setMobileView("prev");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex-1 min-h-[42px] rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileView === "prev"
                ? isDark
                  ? "bg-[#14211b] text-white shadow-sm"
                  : "bg-white text-[#13231c] shadow-sm"
                : mutedText
            }`}
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className={`gr-no-print fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-8 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg pointer-events-none max-w-[90vw] text-center ${
            isDark
              ? "bg-[#e8f3ee] text-[#07110d]"
              : "bg-[#13231c] text-white"
          }`}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
