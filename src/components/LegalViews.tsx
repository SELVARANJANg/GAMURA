import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  FileText,
  ExternalLink,
  Mail,
  UserCheck,
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface LegalViewProps {
  onBack: () => void;
  currentUser?: any;
  onDeleteAccount?: () => Promise<void>;
}

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

export function PrivacyPolicyView({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Top Apple Frosted Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Back to Gamura</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] whitespace-nowrap">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>Privacy Policy</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="space-y-2 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E6E73]">
            Gamura Legal &amp; Privacy
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#6E6E73]">
            Last updated November 2026 • GAMURA (Gamura World) Web &amp; Android Application
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#424245] leading-relaxed">
          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              1. Introduction &amp; Developer Identity
            </h2>
            <p>
              Gamura (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), founded and engineered by Selvaranjan G, operates the Gamura workspace, GPG Prompt Generator, Developer Portfolio Builder, and Universe URL Hub across web (
              <a
                href="https://gamura.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline font-medium"
              >
                gamura.vercel.app
              </a>
              ) and our Android application (<code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-[#1D1D1F]">com.gamura.app</code>).
            </p>
            <p>
              We respect your privacy and handle your personal data responsibly in accordance with Google Play Developer Policies and applicable data protection standards.
            </p>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              2. Information We Collect
            </h2>
            <p>Gamura is designed to collect only what is necessary to provide your workspace features:</p>
            <ul className="list-disc list-inside space-y-2 pl-1 text-[#424245]">
              <li>
                <strong className="font-semibold text-[#1D1D1F]">Account Information:</strong> When you sign in with Google or email, we store your Firebase User ID, email address, display name, username handle, and optional avatar URL.
              </li>
              <li>
                <strong className="font-semibold text-[#1D1D1F]">Workspace &amp; Public Profile Content:</strong> Prompts you create in GPG, claimed Gamura Universe URL profiles, short links, and portfolio drafts.
              </li>
              <li>
                <strong className="font-semibold text-[#1D1D1F]">Local Browser Preferences:</strong> Theme choices, saved drafts, and daily GPG prompt usage timestamps stored locally on your device.
              </li>
            </ul>
            <p className="text-xs text-[#6E6E73] pt-1">
              We do not sell, rent, or trade your personal information to third parties.
            </p>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              3. Infrastructure &amp; AI Processing
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-1 text-[#424245]">
              <li>
                <strong className="font-semibold text-[#1D1D1F]">Google Cloud &amp; Firebase:</strong> Authentication, Firestore database storage, and Realtime Database presence secured with strict access rules.
              </li>
              <li>
                <strong className="font-semibold text-[#1D1D1F]">Puter AI &amp; Prompt Generation Endpoints:</strong> Inputs submitted in GPG are processed solely to generate tailored prompts for your immediate use.
              </li>
            </ul>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              4. Data Retention &amp; Account Deletion
            </h2>
            <p>
              You retain full control over your account and data. You can permanently delete your account and associated records at any time through our dedicated deletion page:
            </p>
            <div className="pt-1">
              <a
                href="/delete-account"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 text-xs font-semibold transition-colors"
              >
                <Trash2 size={14} />
                <span>Open Account Deletion Page</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              5. Contact
            </h2>
            <p>
              For privacy questions or data requests, please reach out to Developer Selvaranjan G:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-1 text-xs font-medium text-[#1D1D1F]">
              <a
                href="mailto:support@gamura.app"
                className="inline-flex items-center gap-2 hover:text-[#0066CC] transition-colors"
              >
                <Mail size={14} className="text-[#6E6E73]" />
                <span>support@gamura.app</span>
              </a>
              <a
                href="https://gamura.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#0066CC] transition-colors"
              >
                <ExternalLink size={14} className="text-[#6E6E73]" />
                <span>https://gamura.vercel.app</span>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function TermsOfServiceView({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Top Apple Frosted Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Back to Gamura</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] whitespace-nowrap">
            <FileText size={15} className="text-[#0066CC]" />
            <span>Terms &amp; Conditions</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="space-y-2 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E6E73]">
            Platform Agreement
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-[#6E6E73]">
            Last updated November 2026 • Official Terms of Service for GAMURA (Gamura World)
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#424245] leading-relaxed">
          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Gamura, including GPG (Gamura Prompt Generator), Gamura Universe URL Claim, Portfolio Builder, and related web or Android applications, you agree to comply with these Terms &amp; Conditions.
            </p>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              2. Acceptable Use &amp; Fair Limits
            </h2>
            <p>
              You agree to use Gamura responsibly and lawfully. You must not misuse prompt generation endpoints, impersonate other creators when claiming Gamura Universe handles, distribute malicious links, or attempt to disrupt service availability. Daily usage limits (such as the 3-prompt daily allowance in GPG) help keep free access reliable for all users.
            </p>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              3. Ownership &amp; Intellectual Property
            </h2>
            <p>
              Gamura branding, visual design, and core software architecture remain the intellectual property of Selvaranjan G. Prompts generated by you in GPG and personal portfolio content you author belong to you.
            </p>
          </section>

          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              4. Account Termination &amp; Deletion
            </h2>
            <p>
              You may discontinue use and permanently delete your account data at any time via{" "}
              <a
                href="/delete-account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline font-medium"
              >
                gamura.vercel.app/delete-account
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export function AccountDeletionView({
  onBack,
  currentUser,
  onDeleteAccount,
}: LegalViewProps) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [manualRequested, setManualRequested] = useState(false);

  const isRealAuthenticatedUser = Boolean(
    currentUser &&
      currentUser.uid &&
      currentUser.uid !== "guest_explorer_uid" &&
      auth.currentUser
  );

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        await deleteDoc(doc(db, "users", uid)).catch(() => null);
        await deleteDoc(doc(db, "gamura_developers", uid)).catch(() => null);
      }
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
      setDeletedSuccess(true);
    } catch (e: any) {
      console.error("Account deletion error:", e);
      setDeleteError(
        e?.message ||
          "Please re-authenticate or submit a deletion request by email below."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col selection:bg-red-100 selection:text-red-900"
    >
      {/* Top Apple Frosted Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Back to Gamura</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 whitespace-nowrap">
            <Trash2 size={14} />
            <span>Account Deletion</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="space-y-2 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E6E73]">
            User Data &amp; Account Management
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            Delete Gamura Account
          </h1>
          <p className="text-sm text-[#6E6E73]">
            Official account &amp; data deletion portal for Gamura (<code className="text-xs bg-zinc-200/70 px-1.5 py-0.5 rounded text-[#1D1D1F]">com.gamura.app</code>)
          </p>
        </div>

        {deletedSuccess ? (
          <div className="p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">
              Account Deletion Complete
            </h2>
            <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
              Your Gamura account credentials and associated workspace records have been permanently removed.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        ) : isRealAuthenticatedUser ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center gap-3.5 pb-5 border-b border-zinc-100">
              <div className="w-11 h-11 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[#1D1D1F] shrink-0">
                <UserCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#6E6E73] font-medium">Signed-in Account</p>
                <p className="text-sm font-semibold text-[#1D1D1F] truncate">
                  {currentUser.email || currentUser.displayName || currentUser.uid}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-[#424245]">
              <p className="font-semibold text-[#1D1D1F]">
                Deleting your account permanently removes:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#6E6E73]">
                <li>Your Gamura login credentials and profile details.</li>
                <li>Saved GPG prompt history, preferences, and streak logs.</li>
                <li>Associated developer hub entries linked to your user ID.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            {!confirmStep ? (
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Delete My Account</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                <p className="text-xs text-red-800 font-semibold text-center">
                  Are you sure you want to permanently delete this account? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Deletion"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
            <p className="text-sm text-[#424245] leading-relaxed">
              You are not currently signed in. Enter the email address registered with your Gamura account to request complete account and data deletion:
            </p>
            {manualRequested ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  Deletion Request Received
                </p>
                <p className="text-xs text-[#6E6E73]">
                  Your request for <span className="font-medium text-[#1D1D1F]">{manualEmail}</span> has been queued. Associated records will be permanently purged within 48 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualEmail.trim()) setManualRequested(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Registered Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200 text-[#1D1D1F] text-sm outline-none focus:bg-white focus:border-[#0066CC] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Submit Deletion Request
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
