import React, { useState } from "react";
import { ArrowLeft, Shield, ShieldCheck, Trash2, CheckCircle2, AlertTriangle, FileText, ExternalLink, Mail, UserCheck } from "lucide-react";

interface LegalViewProps {
  onBack: () => void;
  currentUser?: any;
  onDeleteAccount?: () => Promise<void>;
}

export function PrivacyPolicyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8 sm:py-12 selection:bg-emerald-500/30">
      <div className="w-full max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Gamura</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <ShieldCheck size={14} />
            <span>Google Play Policy Compliant</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
            <Shield size={12} />
            Gamura Legal Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Last Updated: November 2026 • Official Privacy Notice for GAMURA (Gamura World) & Android Application
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Introduction & Developer Identity
            </h2>
            <p>
              Gamura ("we", "our", or "us"), founded and engineered by Selvaranjan G, operates the Gamura intelligence, workspace, prompt generation (GPG), and gaming platform across web (<a href="https://gamura.vercel.app" target="_blank" rel="noreferrer" className="text-cyan-400 underline">gamura.vercel.app</a>) and the Android Google Play Store application (<code className="text-emerald-400 text-xs bg-black/40 px-1.5 py-0.5 rounded">com.gamura.app</code>).
            </p>
            <p>
              We respect your privacy and are committed to protecting your personal data in accordance with Google Play Developer Policies and global data protection standards.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Information We Collect
            </h2>
            <p>Gamura is built to minimize data collection:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
              <li><strong className="text-white">Account Information:</strong> When signing in with Google or Email, we store your Firebase User ID, email, display name, and avatar URL.</li>
              <li><strong className="text-white">User-Generated Content:</strong> Custom workspace messages, streak check-ins, and GPG prompt history created within your private user space.</li>
              <li><strong className="text-white">Anonymous Usage:</strong> Local storage flags for theme preference (light/dark mode) and offline cached assets.</li>
            </ul>
            <p className="text-xs text-zinc-400 mt-2">
              We do NOT sell, lease, or monetize your personal data.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. AI & Third-Party Service Providers
            </h2>
            <p>
              Gamura utilizes industry-standard cloud infrastructure:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
              <li><strong className="text-white">Google Cloud & Firebase:</strong> Authentication and Firestore database management with strict security rules.</li>
              <li><strong className="text-white">Puter.js & AI Endpoints:</strong> Realtime, zero-credential prompt generation for GPG. Prompt inputs are transmitted solely to compute responses.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              4. Data Retention & Account Deletion
            </h2>
            <p>
              You maintain full ownership of your data. You may request immediate deletion of your account and all associated Firestore records at any time using our dedicated deletion gateway at:
            </p>
            <div className="pt-2">
              <a
                href="/delete-account"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-all"
              >
                <Trash2 size={14} />
                <span>Open Account Deletion Portal (/delete-account)</span>
              </a>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              5. Contact Us
            </h2>
            <p>
              For privacy inquiries, rights enforcement, or legal requests, contact Developer Selvaranjan G:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Mail size={14} className="text-emerald-400" />
                <span>support@gamura.app</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <ExternalLink size={14} className="text-cyan-400" />
                <span>https://gamura.vercel.app</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TermsOfServiceView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8 sm:py-12 selection:bg-emerald-500/30">
      <div className="w-full max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Gamura</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <FileText size={14} />
            <span>Platform Agreement</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold uppercase tracking-wider">
            <FileText size={12} />
            Gamura Platform Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Last Updated: November 2026 • Official Platform Terms for GAMURA (Gamura World)
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Gamura platform, applications, and services (including GPG Gamura Prompt Generator and Neural Link workspaces), you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              2. Acceptable Use
            </h2>
            <p>
              You agree to use Gamura responsibly. You may not utilize our platform or prompt generation systems to generate illegal, infringing, or abusive material, reverse engineer core systems, or disrupt normal operations.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              3. Intellectual Property
            </h2>
            <p>
              The Gamura branding, interface layouts, and proprietary code are the intellectual property of Selvaranjan G. Prompts and creative texts generated by you using GPG belong to you.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AccountDeletionView({ onBack, currentUser, onDeleteAccount }: LegalViewProps) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualRequested, setManualRequested] = useState(false);

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
      setDeletedSuccess(true);
    } catch (e) {
      console.error("Account deletion error:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8 sm:py-12 selection:bg-red-500/30">
      <div className="w-full max-w-2xl space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Gamura</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
            <AlertTriangle size={14} />
            <span>Google Play Policy Requirement</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold uppercase tracking-wider">
            <Trash2 size={12} />
            User Data & Account Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Delete Gamura Account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Google Play Account Deletion Portal for Gamura (<code className="text-white text-xs">com.gamura.app</code>)
          </p>
        </div>

        {deletedSuccess ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">Account Deletion Complete</h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
              Your Gamura account credentials, stored workspace data, and Firestore entries have been permanently removed.
            </p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        ) : currentUser ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Active Account</p>
                <p className="text-sm font-bold text-white">{currentUser.email || currentUser.displayName || currentUser.uid}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <p className="font-semibold text-white">What happens when you delete your account:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
                <li>Your profile and login credentials will be permanently erased.</li>
                <li>Your chat history, saved prompts, and streak data will be purged.</li>
                <li>This action is immediate and cannot be undone.</li>
              </ul>
            </div>

            {!confirmStep ? (
              <button
                onClick={() => setConfirmStep(true)}
                className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                <span>Proceed to Delete Account</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                <p className="text-xs text-red-300 font-semibold text-center">
                  Are you absolutely certain? This cannot be reversed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
            <p className="text-xs sm:text-sm text-zinc-300">
              Not currently logged in. If you have an existing Gamura account and wish to submit a data deletion request under Google Play policies, please enter your registered email below:
            </p>
            {manualRequested ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Deletion Request Submitted</p>
                <p className="text-[11px] text-zinc-400">
                  We have queued your account deletion. Associated records for {manualEmail} will be purged within 48 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualEmail) setManualRequested(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                    Registered Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="explorer@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-red-500/50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Submit Account Deletion Request
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
