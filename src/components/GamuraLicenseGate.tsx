import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Scale, ShieldCheck, X } from "lucide-react";
import {
  acceptGamuraLicense,
  declineGamuraLicense,
  GAMURA_LICENSE_EVENT,
  GAMURA_LICENSE_VERSION,
  GAMURA_OPEN_LICENSE_EVENT,
  GamuraLicenseRecord,
  GamuraLicenseTab,
  readLicenseRecord,
  subscribeCloudUserLicense,
} from "../utils/gamuraLicense";

interface GamuraLicenseGateProps {
  currentPage: string;
  authUser: { uid?: string | null; email?: string | null } | null;
  onNavigateLegalPage?: (page: "license" | "terms" | "privacy") => void;
}

const FONT_STACK: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

export default function GamuraLicenseGate({
  currentPage,
  authUser,
  onNavigateLegalPage,
}: GamuraLicenseGateProps) {
  const [record, setRecord] = useState<GamuraLicenseRecord>(() => readLicenseRecord());
  const [manualOpen, setManualOpen] = useState(false);
  const [viewMode, setViewMode] = useState<GamuraLicenseTab | "declined">(() => {
    const initial = readLicenseRecord();
    return initial.status === "declined" ? "declined" : "prompt";
  });
  const [isSaving, setIsSaving] = useState(false);

  const authUid = authUser?.uid && authUser.uid !== "guest_explorer_uid" ? authUser.uid : null;

  // Keep synchronized with localStorage updates across components/tabs
  useEffect(() => {
    const syncLocal = () => {
      const next = readLicenseRecord();
      setRecord(next);
      if (next.status === "declined") {
        setViewMode("declined");
      } else if (next.status === "pending") {
        setViewMode("prompt");
      }
    };

    const onCustomUpdate = (e: Event) => {
      const detail = (e as CustomEvent<GamuraLicenseRecord>).detail;
      if (detail) {
        setRecord(detail);
        if (detail.status === "declined") setViewMode("declined");
        else if (detail.status === "pending") setViewMode("prompt");
      } else {
        syncLocal();
      }
    };

    const onOpenModal = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: GamuraLicenseTab }>).detail;
      setViewMode(detail?.tab || "prompt");
      setManualOpen(true);
    };

    window.addEventListener("storage", syncLocal);
    window.addEventListener(GAMURA_LICENSE_EVENT, onCustomUpdate);
    window.addEventListener(GAMURA_OPEN_LICENSE_EVENT, onOpenModal);
    return () => {
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener(GAMURA_LICENSE_EVENT, onCustomUpdate);
      window.removeEventListener(GAMURA_OPEN_LICENSE_EVENT, onOpenModal);
    };
  }, []);

  // Subscribe to Firestore /user_licenses/{uid} for cross-device Gamura ID consent sync
  useEffect(() => {
    if (!authUid) return;
    const unsubscribe = subscribeCloudUserLicense(authUid, (remoteRecord) => {
      setRecord(remoteRecord);
      if (remoteRecord.status === "agreed") {
        setManualOpen(false);
      } else if (remoteRecord.status === "declined") {
        setViewMode("declined");
      }
    });
    return () => unsubscribe();
  }, [authUid]);

  const isLegalRoute =
    currentPage === "privacy" ||
    currentPage === "terms" ||
    currentPage === "license" ||
    currentPage === "delete-account";

  // Show gate whenever consent isn't agreed (on all non-legal routes) OR when manually opened
  const isVisible = manualOpen || (!isLegalRoute && record.status !== "agreed");

  const handleAgree = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const next = await acceptGamuraLicense(authUid);
      setRecord(next);
      setManualOpen(false);
      setViewMode("prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisagree = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const next = await declineGamuraLicense(authUid);
      setRecord(next);
      setViewMode("declined");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseManual = () => {
    if (record.status === "agreed") {
      setManualOpen(false);
      setViewMode("prompt");
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="gamura-license-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={FONT_STACK}
          className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gamura-license-title"
        >
          {/* VIEW 1: Clean iOS/Android-style Agreement Prompt (Matches reference design) */}
          {viewMode === "prompt" && (
            <motion.div
              key="prompt-card"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-[332px] sm:max-w-[356px] bg-white rounded-[22px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-black/[0.06] overflow-hidden select-none"
            >
              {manualOpen && record.status === "agreed" && (
                <div className="px-4 pt-3 pb-0 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={13} />
                    Accepted · v{record.version}
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseManual}
                    className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                    aria-label="Close license dialog"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <div className="px-6 pt-7 pb-6 text-center">
                <h2
                  id="gamura-license-title"
                  className="text-[18px] font-semibold tracking-tight text-[#1D1D1F] leading-snug mb-2.5"
                >
                  Welcome to GAMURA
                </h2>

                <p className="text-[13.5px] leading-[1.5] text-[#3A3A3C]">
                  Read our{" "}
                  <button
                    type="button"
                    onClick={() => setViewMode("terms")}
                    className="text-[#1A73E8] hover:underline font-medium cursor-pointer inline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => setViewMode("privacy")}
                    className="text-[#1A73E8] hover:underline font-medium cursor-pointer inline"
                  >
                    Privacy Policy
                  </button>
                  . Understand our services and how we protect your information. By tapping Agree,
                  you consent to the above agreements.
                </p>

                <button
                  type="button"
                  onClick={() => setViewMode("license")}
                  className="mt-3 text-[11.5px] font-medium text-[#6E6E73] hover:text-[#1A73E8] transition-colors cursor-pointer"
                >
                  Software License Agreement (EULA · v{GAMURA_LICENSE_VERSION})
                </button>
              </div>

              <div className="border-t border-zinc-200/85 grid grid-cols-2 divide-x divide-zinc-200/85">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleDisagree}
                  className="min-h-[48px] flex items-center justify-center text-[15px] font-medium text-[#1D1D1F] hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Disagree
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleAgree}
                  className="min-h-[48px] flex items-center justify-center text-[15px] font-semibold text-[#1A73E8] hover:bg-blue-50/50 active:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Agree"}
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: Declined / Required Notice */}
          {viewMode === "declined" && (
            <motion.div
              key="declined-card"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="w-full max-w-[356px] bg-white rounded-[22px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-black/[0.06] overflow-hidden select-none"
            >
              <div className="px-6 pt-6 pb-5 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto text-[#1D1D1F]">
                  <Scale size={20} />
                </div>
                <div className="space-y-1.5">
                  <h2
                    id="gamura-license-title"
                    className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]"
                  >
                    License Consent Required
                  </h2>
                  <p className="text-[13px] leading-[1.48] text-[#424245]">
                    You selected Disagree. Accessing GAMURA workspace tools, cloud sync, and Launch
                    Store applications requires consent to our Software License, Terms of Service, and
                    Privacy Policy.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1 text-[12px] font-medium">
                  <button
                    type="button"
                    onClick={() => setViewMode("license")}
                    className="text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    License
                  </button>
                  <span className="text-zinc-300">·</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("terms")}
                    className="text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    Terms
                  </button>
                  <span className="text-zinc-300">·</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("privacy")}
                    className="text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    Privacy
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-200/85 grid grid-cols-2 divide-x divide-zinc-200/85">
                <button
                  type="button"
                  onClick={() => setViewMode("prompt")}
                  className="min-h-[48px] flex items-center justify-center text-[14.5px] font-medium text-[#1D1D1F] hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Review Prompt
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleAgree}
                  className="min-h-[48px] flex items-center justify-center text-[14.5px] font-semibold text-[#1A73E8] hover:bg-blue-50/50 active:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Agree &amp; Enter
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW 3: In-Modal Legal Reader (Software License / Terms / Privacy) */}
          {(viewMode === "license" || viewMode === "terms" || viewMode === "privacy") && (
            <motion.div
              key="reader-card"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="w-full max-w-lg max-h-[85vh] bg-white rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.24)] border border-black/[0.06] flex flex-col overflow-hidden"
            >
              {/* Header & Tab Strip */}
              <div className="px-5 pt-4 pb-3 border-b border-zinc-200/80 space-y-3 shrink-0 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("prompt")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F] hover:text-[#1A73E8] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <span
                    id="gamura-license-title"
                    className="text-xs font-semibold text-[#6E6E73] tracking-tight"
                  >
                    GAMURA Legal · v{GAMURA_LICENSE_VERSION}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const target = viewMode;
                      setManualOpen(false);
                      if (onNavigateLegalPage) {
                        onNavigateLegalPage(target);
                      } else {
                        window.location.assign(`/${target}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    <span>Full Page</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-3 bg-[#F5F5F7] p-1 rounded-xl border border-zinc-200/70">
                  {(
                    [
                      { id: "license", label: "License", icon: <Scale size={13} /> },
                      { id: "terms", label: "Terms", icon: <FileText size={13} /> },
                      { id: "privacy", label: "Privacy", icon: <ShieldCheck size={13} /> },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setViewMode(tab.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === tab.id
                          ? "bg-white text-[#1D1D1F] shadow-xs"
                          : "text-[#6E6E73] hover:text-[#1D1D1F]"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Legal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-[13px] leading-relaxed text-[#424245]">
                {viewMode === "license" && (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-[#1D1D1F]">
                        GAMURA Software License Agreement (EULA)
                      </h3>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Version {GAMURA_LICENSE_VERSION} · Copyright &copy; 2026 Selvaranjan G · Gamura World
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">1. Grant of License</h4>
                      <p>
                        Subject to your compliance with this Agreement, Gamura grants you a personal,
                        non-exclusive, non-transferable, revocable license to access and use GAMURA Web
                        and the Android application (<code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">com.gamura.app</code>),
                        including Launch Store applications such as Portfolio Builder&sup2; (PB&sup2;), PPT Cred,
                        Cover Gened, Glifeline, Gshield, Gfresh, GAMURA Card, Gwallet, GPDF Studio, and GPG.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">2. Connected Services &amp; Real-Time Sync</h4>
                      <p>
                        When signed in with a Gamura ID or pairing devices via QR pairing codes (such as
                        GAMURA Card and Gwallet sync or Launch Store cloud sync), your consent status and
                        workspace state may synchronize securely via Firebase Firestore under owner-scoped rules.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">3. Ownership &amp; Restrictions</h4>
                      <p>
                        GAMURA software, UI architecture, and brand marks belong to Selvaranjan G.
                        You retain ownership of documents, presentations, portfolios, and content you author.
                        Reverse engineering, automated scraping, or unauthorized resale of platform infrastructure
                        is prohibited.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">4. Disclaimer &amp; Revocation</h4>
                      <p>
                        GAMURA is provided &ldquo;as is&rdquo; without warranty of uninterrupted availability. You may
                        withdraw consent or delete your account data anytime under Universe Settings or{" "}
                        <span className="font-mono text-xs text-[#1D1D1F]">/delete-account</span>.
                      </p>
                    </div>
                  </>
                )}

                {viewMode === "terms" && (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-[#1D1D1F]">
                        Terms of Service
                      </h3>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Effective November 2026 · GAMURA Web &amp; Mobile Ecosystem
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">1. Acceptance of Terms</h4>
                      <p>
                        By tapping Agree or using GAMURA services (GPG Prompt Generator, Gamura Universe,
                        Launch Store apps, URL Shortener, and creator studios), you agree to abide by these
                        Terms of Service and the Software License Agreement.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">2. Acceptable Use &amp; Fair Limits</h4>
                      <p>
                        You agree to use GAMURA responsibly. Impersonating creators on Universe URLs,
                        generating deceptive links, abusing shared pairing channels, or bypassing fair usage
                        allowances (including daily prompt limits) is strictly prohibited.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">3. Intellectual Property &amp; User Content</h4>
                      <p>
                        You retain full rights to portfolios, resumes, slides, passes, and records created inside
                        GAMURA tools. Platform brand assets and source code remain protected under applicable
                        copyright law.
                      </p>
                    </div>
                  </>
                )}

                {viewMode === "privacy" && (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-[#1D1D1F]">
                        Privacy Policy
                      </h3>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Developer: Selvaranjan G · support@gamura.app
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">1. Information We Collect</h4>
                      <p>
                        We collect only what is needed to run your workspace: optional Firebase account details
                        (UID, email, display name, @handle), app installation &amp; sync preferences, license
                        consent timestamp, and content you choose to save to cloud sync.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">2. How Data Is Protected</h4>
                      <p>
                        We never sell or trade personal data. Private workspace collections (installed apps,
                        card/wallet vaults, license consent) are protected with owner-only Firebase Authentication
                        and Firestore Security Rules.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-[#1D1D1F]">3. Data Control &amp; Deletion</h4>
                      <p>
                        Local drafts reside in browser storage under your control. Authenticated users can withdraw
                        license consent in Universe Settings or permanently purge cloud records via the{" "}
                        <span className="font-mono text-xs text-[#1D1D1F]">/delete-account</span> portal.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Divided Footer */}
              <div className="border-t border-zinc-200/85 grid grid-cols-2 divide-x divide-zinc-200/85 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("prompt")}
                  className="min-h-[48px] flex items-center justify-center text-[15px] font-medium text-[#1D1D1F] hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                {manualOpen && record.status === "agreed" ? (
                  <button
                    type="button"
                    onClick={handleCloseManual}
                    className="min-h-[48px] flex items-center justify-center text-[15px] font-semibold text-[#1A73E8] hover:bg-blue-50/50 active:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleAgree}
                    className="min-h-[48px] flex items-center justify-center text-[15px] font-semibold text-[#1A73E8] hover:bg-blue-50/50 active:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Agree & Continue"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
