import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  Loader2,
  Globe,
  Sparkles,
  User,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Trash2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

interface ProfileManagerProps {
  user: any;
  initialHandle?: string;
  onNavigateLogin?: () => void;
  showToast?: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
}

const RESERVED_HANDLES = new Set([
  "home",
  "gpg",
  "universe",
  "community",
  "features",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "delete-account",
  "account-deletion",
  "claim",
  "docs",
  "feed",
  "chat",
  "direct",
  "profile",
  "settings",
  "developer",
  "white-page",
  "showcase",
  "apps",
  "u",
  "go",
  "api",
  "skills",
  "login",
  "signup",
  "history",
  "aura",
  "gg",
]);

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

export default function GamuraUniverseProfileManager({
  user,
  initialHandle = "",
  onNavigateLogin,
  showToast,
}: ProfileManagerProps) {
  const [authUser, setAuthUser] = useState<any>(() => auth.currentUser);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(() =>
    (initialHandle || "").toLowerCase().replace(/[^a-z0-9_-]/g, "")
  );
  const [checkStatus, setCheckStatus] = useState<
    "none" | "checking" | "available" | "taken" | "reserved" | "invalid"
  >("none");
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
    });
    return () => unsub();
  }, []);

  const effectiveUser =
    authUser ||
    (user && user.uid && user.uid !== "guest_explorer_uid" ? user : null);

  // Restore local draft for convenience before sign-in
  useEffect(() => {
    if (initialHandle) {
      const sanitized = initialHandle
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      if (sanitized) setUsername(sanitized);
    }
    try {
      const savedDraft = localStorage.getItem("gamura_claim_draft");
      if (savedDraft && !effectiveUser) {
        const parsed = JSON.parse(savedDraft);
        if (!initialHandle && parsed.username) setUsername(parsed.username);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.github) setGithub(parsed.github);
        if (parsed.linkedin) setLinkedin(parsed.linkedin);
        if (parsed.twitter) setTwitter(parsed.twitter);
        if (parsed.youtube) setYoutube(parsed.youtube);
        if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
        if (Array.isArray(parsed.blocks)) setBlocks(parsed.blocks);
      }
    } catch {
      // ignore storage errors
    }
  }, [initialHandle, effectiveUser]);

  // Persist draft locally on change so nothing is lost during sign-in
  useEffect(() => {
    try {
      localStorage.setItem(
        "gamura_claim_draft",
        JSON.stringify({
          username,
          displayName,
          bio,
          website,
          github,
          linkedin,
          twitter,
          youtube,
          projects,
          blocks,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [
    username,
    displayName,
    bio,
    website,
    github,
    linkedin,
    twitter,
    youtube,
    projects,
    blocks,
  ]);

  // Load existing claimed profile from Firestore when signed in
  useEffect(() => {
    if (!effectiveUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "gamura_developers", effectiveUser.uid);
    const unsubDoc = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          if (!initialHandle) setUsername(data.username || "");
          setBio(data.bio || "");
          setDisplayName(data.displayName || "");
          setWebsite(data.website || "");
          setGithub(data.github || "");
          setLinkedin(data.linkedin || "");
          setTwitter(data.twitter || "");
          setYoutube(data.youtube || "");
          setProjects(data.projects || []);
          setBlocks(data.blocks || []);
          setLoading(false);
        } else if (effectiveUser.email) {
          const q = query(
            collection(db, "gamura_developers"),
            where("email", "==", effectiveUser.email)
          );
          getDocs(q)
            .then((snap) => {
              if (!snap.empty) {
                const data = snap.docs[0].data();
                setProfile(data);
                if (!initialHandle)
                  setUsername(data.username || snap.docs[0].id || "");
                setBio(data.bio || "");
                setDisplayName(data.displayName || "");
                setWebsite(data.website || "");
                setGithub(data.github || "");
                setLinkedin(data.linkedin || "");
                setTwitter(data.twitter || "");
                setYoutube(data.youtube || "");
                setProjects(data.projects || []);
                setBlocks(data.blocks || []);
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubDoc();
  }, [effectiveUser?.uid, effectiveUser?.email, initialHandle]);

  // Real-time handle availability check
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setCheckStatus("none");
      return;
    }
    if (clean.length < 2 || !/^[a-z0-9_-]{2,30}$/.test(clean)) {
      setCheckStatus("invalid");
      return;
    }
    if (RESERVED_HANDLES.has(clean)) {
      setCheckStatus("reserved");
      return;
    }
    if (profile?.username?.toLowerCase() === clean) {
      setCheckStatus("available");
      return;
    }

    const check = async () => {
      setCheckStatus("checking");
      try {
        const [devDoc, usernameDoc] = await Promise.all([
          getDoc(doc(db, "gamura_developers", clean)),
          getDoc(doc(db, "usernames", clean)),
        ]);

        if (devDoc.exists()) {
          const ownerUid = devDoc.data()?.uid;
          if (effectiveUser?.uid && ownerUid === effectiveUser.uid) {
            setCheckStatus("available");
          } else {
            setCheckStatus("taken");
          }
          return;
        }

        if (usernameDoc.exists()) {
          const ownerUid = usernameDoc.data()?.uid;
          if (effectiveUser?.uid && ownerUid === effectiveUser.uid) {
            setCheckStatus("available");
          } else {
            setCheckStatus("taken");
          }
          return;
        }

        setCheckStatus("available");
      } catch {
        setCheckStatus("none");
      }
    };

    const timer = setTimeout(check, 350);
    return () => clearTimeout(timer);
  }, [username, profile?.username, effectiveUser?.uid]);

  const handleQuickGoogleSignIn = async () => {
    setSigningIn(true);
    setSaveError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (showToast) {
        showToast("✅", "Signed In", "Ready to publish your Gamura URL.", "success");
      }
    } catch (err: any) {
      const msg = err?.message || "Google sign-in was cancelled or blocked.";
      setSaveError(msg);
      if (showToast) showToast("⚠️", "Sign-In Required", msg, "warning");
    } finally {
      setSigningIn(false);
    }
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    if (showToast) showToast("✓", "Copied", "Link copied to clipboard.", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    setSaveError(null);
    const cleanUser = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (!cleanUser || cleanUser.length < 2) {
      const msg = "Choose a handle with at least 2 characters (letters, numbers, _ or -).";
      setSaveError(msg);
      if (showToast) showToast("⚠️", "Valid Handle Required", msg, "warning");
      return;
    }

    if (RESERVED_HANDLES.has(cleanUser)) {
      const msg = `"/${cleanUser}" is a reserved system path. Please pick another URL.`;
      setSaveError(msg);
      if (showToast) showToast("⚠️", "Reserved Path", msg, "warning");
      return;
    }

    if (checkStatus === "taken" && profile?.username !== cleanUser) {
      const msg = "This URL handle is already claimed. Please choose another.";
      setSaveError(msg);
      if (showToast) showToast("⚠️", "Handle Taken", msg, "warning");
      return;
    }

    if (!auth.currentUser) {
      const msg = "Please sign in with Google or your Gamura account below to permanently lock and publish your live URL.";
      setSaveError(msg);
      if (showToast) showToast("🔐", "Sign In to Claim", msg, "info");
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      const payload: any = {
        username: cleanUser,
        displayName: displayName.trim() || cleanUser,
        bio: bio.trim(),
        website: website.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        twitter: twitter.trim(),
        youtube: youtube.trim(),
        projects: projects || [],
        blocks: blocks || [],
        published: true,
        uid,
        email: auth.currentUser.email || `${cleanUser}@gamura.app`,
        plan: profile?.plan || "Starter",
        clicks: profile?.clicks || 0,
        views: profile?.views || 1,
        visitors: profile?.visitors || 1,
        engagements: profile?.engagements || 1,
        updatedAt: serverTimestamp(),
      };

      const devSlugRef = doc(db, "gamura_developers", cleanUser);
      await setDoc(devSlugRef, payload, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${cleanUser}`);
      });

      await setDoc(doc(db, "gamura_developers", uid), payload, { merge: true }).catch(
        () => null
      );

      const unameRef = doc(db, "usernames", cleanUser);
      const unameSnap = await getDoc(unameRef).catch(() => null);
      if (!unameSnap || !unameSnap.exists()) {
        await setDoc(unameRef, { uid }).catch(() => null);
      }

      setProfile(payload);
      setShowPublishSuccess(true);
      if (showToast) {
        showToast(
          "🚀",
          "URL Claimed & Live",
          `Your public page /@${cleanUser} is now active.`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      const msg = err?.message || "Failed to publish profile. Please try again.";
      setSaveError(msg);
      if (showToast) showToast("❌", "Publish Failed", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={APPLE_FONT_STYLE}
        className="p-12 flex flex-col items-center justify-center gap-3 text-[#6E6E73]"
      >
        <Loader2 className="animate-spin text-[#0071E3]" size={26} />
        <span className="text-xs font-medium">Loading URL Claim Studio...</span>
      </div>
    );
  }

  if (showPublishSuccess) {
    const claimUrlPath = `/@${username}`;
    const fullLocalUrl = `${window.location.origin}/@${username}`;
    const publicTargetUrl = `https://gamura.vercel.app/@${username}`;

    return (
      <div style={APPLE_FONT_STYLE} className="max-w-2xl mx-auto py-4 px-2 sm:px-4 text-[#1D1D1F]">
        <div className="bg-white border border-zinc-200/80 p-6 sm:p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
              Live &amp; Published
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Your Gamura URL is Claimed
            </h1>
            <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
              Your personal hub at <span className="font-semibold text-[#1D1D1F]">/@{username}</span> is active and ready to share.
            </p>
          </div>

          <div className="bg-[#F5F5F7] border border-zinc-200/70 rounded-2xl p-4 sm:p-5 space-y-3 max-w-md mx-auto text-left">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#6E6E73] block">
                Live Hub Link
              </span>
              <div className="flex items-center justify-between bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs">
                <a
                  href={claimUrlPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066CC] hover:underline font-medium truncate mr-2"
                >
                  {fullLocalUrl}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy("live", fullLocalUrl)}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#1D1D1F] hover:text-[#0066CC] cursor-pointer"
                >
                  {copiedKey === "live" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedKey === "live" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#6E6E73] block">
                Official Production URL
              </span>
              <div className="flex items-center justify-between bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs">
                <span className="text-[#424245] truncate mr-2">{publicTargetUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("prod", publicTargetUrl)}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#1D1D1F] hover:text-[#0066CC] cursor-pointer"
                >
                  {copiedKey === "prod" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedKey === "prod" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-1">
            <a
              href={claimUrlPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Open My Page</span>
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => setShowPublishSuccess(false)}
              className="flex-1 py-3 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={APPLE_FONT_STYLE} className="max-w-3xl mx-auto py-2 px-1 sm:px-2 text-[#1D1D1F] space-y-5">
      {/* Main Apple Card */}
      <div className="bg-white border border-zinc-200/80 p-5 sm:p-7 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center shrink-0">
                <Globe size={17} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Gamura Free URL Claim
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6E6E73]">
              Reserve your personal <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-[#1D1D1F]">/@username</code> page, social hub, and project showcase for free.
            </p>
          </div>

          {profile?.username && (
            <a
              href={`/@${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors shrink-0 self-start sm:self-center whitespace-nowrap"
            >
              <span>View /@{profile.username}</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Auth Status Banner for Unauthenticated Visitors */}
        {!effectiveUser && (
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-[#1D1D1F] shrink-0 mt-0.5">
                <Lock size={15} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  Sign in to permanently lock your free URL
                </p>
                <p className="text-xs text-[#6E6E73]">
                  Check handle availability and draft your page anytime, then sign in to publish live.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickGoogleSignIn}
                disabled={signingIn}
                className="px-3.5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {signingIn ? "Signing in..." : "Sign in with Google"}
              </button>
              {onNavigateLogin && (
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Account Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* Username Handle Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#1D1D1F] block">
            Choose Your Free Handle
          </label>
          <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <span className="text-xs sm:text-sm text-[#6E6E73] pl-4 pr-0.5 py-3.5 font-medium select-none shrink-0">
              {window.location.host}/@
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                )
              }
              placeholder="yourname"
              disabled={saving}
              className="w-full bg-transparent border-none outline-none text-[#1D1D1F] text-sm py-3.5 pr-3 font-semibold flex-1 min-w-0"
            />
            <div className="pr-4 shrink-0 flex items-center">
              {checkStatus === "checking" && (
                <Loader2 size={16} className="text-[#6E6E73] animate-spin" />
              )}
              {checkStatus === "available" && (
                <CheckCircle2 size={17} className="text-emerald-600" />
              )}
              {(checkStatus === "taken" ||
                checkStatus === "reserved" ||
                checkStatus === "invalid") && (
                <XCircle size={17} className="text-red-500" />
              )}
            </div>
          </div>
          {checkStatus === "available" && (
            <p className="text-xs text-emerald-700 font-medium pl-1">
              /@{username} is available to claim.
            </p>
          )}
          {checkStatus === "taken" && (
            <p className="text-xs text-red-600 font-medium pl-1">
              /@{username} is already claimed by another user.
            </p>
          )}
          {checkStatus === "reserved" && (
            <p className="text-xs text-red-600 font-medium pl-1">
              /{username} is a reserved route name. Please choose another handle.
            </p>
          )}
          {checkStatus === "invalid" && (
            <p className="text-xs text-amber-700 font-medium pl-1">
              Use 2 to 30 characters: lowercase letters, numbers, underscores, or hyphens.
            </p>
          )}
        </div>

        {/* Basic Profile Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] block">
              Display Name
            </label>
            <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 focus-within:bg-white focus-within:border-[#0071E3] transition-all">
              <User size={15} className="text-[#6E6E73] shrink-0" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Selvaranjan G"
                className="w-full bg-transparent border-none outline-none text-[#1D1D1F] text-sm py-2.5 pl-2.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] block">
              Personal Website
            </label>
            <div className="flex items-center bg-[#F5F5F7] border border-zinc-200/80 rounded-xl px-3.5 focus-within:bg-white focus-within:border-[#0071E3] transition-all">
              <LinkIcon size={15} className="text-[#6E6E73] shrink-0" />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full bg-transparent border-none outline-none text-[#1D1D1F] text-sm py-2.5 pl-2.5"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#1D1D1F] block">
            Bio &amp; Role
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Developer, Designer, Creator..."
            rows={2}
            className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl outline-none text-[#1D1D1F] text-sm px-3.5 py-2.5 focus:bg-white focus:border-[#0071E3] transition-all resize-none"
          />
        </div>

        {/* Social Links */}
        <div className="pt-4 border-t border-zinc-100 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
            Social Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              {
                label: "GitHub",
                icon: <Github size={14} className="text-[#6E6E73]" />,
                value: github,
                setter: setGithub,
                placeholder: "https://github.com/username",
              },
              {
                label: "LinkedIn",
                icon: <Linkedin size={14} className="text-[#6E6E73]" />,
                value: linkedin,
                setter: setLinkedin,
                placeholder: "https://linkedin.com/in/username",
              },
              {
                label: "Twitter / X",
                icon: <Twitter size={14} className="text-[#6E6E73]" />,
                value: twitter,
                setter: setTwitter,
                placeholder: "https://x.com/username",
              },
              {
                label: "YouTube",
                icon: <Youtube size={14} className="text-[#6E6E73]" />,
                value: youtube,
                setter: setYoutube,
                placeholder: "https://youtube.com/@channel",
              },
            ].map((soc) => (
              <div key={soc.label} className="space-y-1">
                <label className="text-[11px] font-medium text-[#6E6E73] flex items-center gap-1.5">
                  {soc.icon}
                  <span>{soc.label}</span>
                </label>
                <input
                  value={soc.value}
                  onChange={(e) => soc.setter(e.target.value)}
                  placeholder={soc.placeholder}
                  className="w-full bg-[#F5F5F7] border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#0071E3] transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Featured Projects */}
        <div className="pt-4 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                Featured Projects
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Showcase links and live demos on your public page.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProjects([
                  ...projects,
                  { title: "", description: "", url: "", githubUrl: "", image: "" },
                ])
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-5 bg-[#F5F5F7] border border-dashed border-zinc-200 rounded-2xl text-[#6E6E73] text-xs">
              No projects added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="bg-[#F5F5F7] border border-zinc-200/80 p-4 rounded-2xl space-y-3 relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...projects];
                      next.splice(idx, 1);
                      setProjects(next);
                    }}
                    className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove Project"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-9">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6E6E73]">
                        Project Title
                      </label>
                      <input
                        value={proj.title || ""}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setProjects(next);
                        }}
                        placeholder="Project Name"
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6E6E73]">
                        Cover Image URL (optional)
                      </label>
                      <input
                        value={proj.image || ""}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], image: e.target.value };
                          setProjects(next);
                        }}
                        placeholder="https://..."
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#6E6E73]">
                      Description
                    </label>
                    <textarea
                      value={proj.description || ""}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setProjects(next);
                      }}
                      rows={2}
                      placeholder="Short overview of what you built..."
                      className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6E6E73]">
                        Live Demo URL
                      </label>
                      <input
                        value={proj.url || ""}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setProjects(next);
                        }}
                        placeholder="https://..."
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6E6E73]">
                        GitHub Repo URL
                      </label>
                      <input
                        value={proj.githubUrl || ""}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], githubUrl: e.target.value };
                          setProjects(next);
                        }}
                        placeholder="https://github.com/..."
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Profile Blocks */}
        <div className="pt-4 border-t border-zinc-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                Custom Page Blocks
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Add extra links, notes, images, or dividers.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setBlocks([
                    ...blocks,
                    { id: `b-${Date.now()}`, type: "lnk", title: "", url: "", icon: "🔗" },
                  ])
                }
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                + Link
              </button>
              <button
                type="button"
                onClick={() =>
                  setBlocks([
                    ...blocks,
                    { id: `b-${Date.now()}`, type: "txt", tt: "p", content: "" },
                  ])
                }
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                + Text
              </button>
              <button
                type="button"
                onClick={() =>
                  setBlocks([
                    ...blocks,
                    { id: `b-${Date.now()}`, type: "img", src: "", alt: "" },
                  ])
                }
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                + Image
              </button>
              <button
                type="button"
                onClick={() =>
                  setBlocks([...blocks, { id: `b-${Date.now()}`, type: "div" }])
                }
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                + Divider
              </button>
            </div>
          </div>

          {blocks.length > 0 && (
            <div className="space-y-3">
              {blocks.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="bg-[#F5F5F7] border border-zinc-200/80 p-4 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      {b.type === "lnk"
                        ? "Link Button"
                        : b.type === "txt"
                        ? "Text Block"
                        : b.type === "img"
                        ? "Image Block"
                        : "Divider"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...blocks];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            setBlocks(next);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                      )}
                      {idx < blocks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...blocks];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            setBlocks(next);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...blocks];
                          next.splice(idx, 1);
                          setBlocks(next);
                        }}
                        className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 cursor-pointer"
                        title="Remove Block"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {b.type === "lnk" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={b.title || ""}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setBlocks(next);
                        }}
                        placeholder="Button Label"
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                      <input
                        value={b.url || ""}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setBlocks(next);
                        }}
                        placeholder="https://..."
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  )}

                  {b.type === "txt" && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[
                          { label: "Heading", value: "h1" },
                          { label: "Subheading", value: "h2" },
                          { label: "Paragraph", value: "p" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const next = [...blocks];
                              next[idx] = { ...next[idx], tt: opt.value };
                              setBlocks(next);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                              b.tt === opt.value
                                ? "bg-[#1D1D1F] text-white"
                                : "bg-white border border-zinc-200 text-[#6E6E73]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={b.content || ""}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = { ...next[idx], content: e.target.value };
                          setBlocks(next);
                        }}
                        rows={2}
                        placeholder="Write your text here..."
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3] resize-none"
                      />
                    </div>
                  )}

                  {b.type === "img" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={b.src || ""}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = { ...next[idx], src: e.target.value };
                          setBlocks(next);
                        }}
                        placeholder="Image URL (https://...)"
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                      <input
                        value={b.alt || ""}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = { ...next[idx], alt: e.target.value };
                          setBlocks(next);
                        }}
                        placeholder="Caption (optional)"
                        className="w-full bg-white border border-zinc-200/80 rounded-xl text-[#1D1D1F] text-xs px-3 py-2 outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  )}

                  {b.type === "div" && (
                    <div className="h-px w-full bg-zinc-200 my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {saveError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {saveError}
          </div>
        )}

        {/* Footer Publish Bar */}
        <div className="pt-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          {profile?.username ? (
            <div className="flex items-center gap-3 bg-[#F5F5F7] border border-zinc-200/80 p-2.5 rounded-2xl w-full sm:w-auto">
              <div className="bg-white p-1.5 rounded-xl border border-zinc-200/60 shrink-0">
                <QRCodeSVG
                  value={`${window.location.origin}/@${profile.username}`}
                  size={44}
                  level="H"
                />
              </div>
              <div className="min-w-0 pr-2">
                <div className="text-[11px] font-semibold text-[#1D1D1F]">
                  Active QR Link
                </div>
                <div className="text-xs text-[#6E6E73] truncate max-w-[180px]">
                  {window.location.host}/@{profile.username}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#6E6E73]">
              Instant live URL • Free QR Code included
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving ||
              !username.trim() ||
              checkStatus === "taken" ||
              checkStatus === "reserved" ||
              checkStatus === "invalid"
            }
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>
              {profile ? "Save & Publish Updates" : "Claim Free URL & Publish"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
