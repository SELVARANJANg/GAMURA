import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  increment,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Sparkles,
  Globe,
  ArrowLeft,
  Loader2,
  Code2,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Calendar,
  QrCode,
  Share2,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ClaimedProfileViewProps {
  username: string;
  onBack: () => void;
  onClaimRoute: (prefillUsername?: string) => void;
}

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

const withTimeout = <T,>(promise: Promise<T>, ms = 3200): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    ),
  ]);

export default function ClaimedProfileView({
  username,
  onBack,
  onClaimRoute,
}: ClaimedProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [existsCheck, setExistsCheck] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const normalizedUsername = (username || "").trim().toLowerCase();
    if (
      !normalizedUsername ||
      normalizedUsername.includes("/") ||
      normalizedUsername.length > 50
    ) {
      setLoading(false);
      setExistsCheck(false);
      return;
    }

    let cancelled = false;
    let resolvedDocRef = doc(db, "gamura_developers", normalizedUsername);

    // 1. Instant local cache check so previously claimed pages load immediately
    try {
      const cachedRaw = localStorage.getItem(`gamura_profile_cache_${normalizedUsername}`);
      if (cachedRaw) {
        const cachedData = JSON.parse(cachedRaw);
        if (cachedData && cachedData.username) {
          setProfile(cachedData);
          setExistsCheck(true);
          setLoading(false);
        }
      }
    } catch {
      // ignore storage errors
    }

    const persistCache = (data: any) => {
      try {
        localStorage.setItem(
          `gamura_profile_cache_${normalizedUsername}`,
          JSON.stringify({ ...data, updatedAt: Date.now() })
        );
      } catch {
        // ignore storage errors
      }
    };

    const resolveFallbackByUsernameField = async () => {
      try {
        const qByUsername = query(
          collection(db, "gamura_developers"),
          where("username", "==", normalizedUsername),
          limit(1)
        );
        const qSnap = await withTimeout(getDocs(qByUsername), 3000);
        if (!qSnap.empty && !cancelled) {
          const foundDoc = qSnap.docs[0];
          resolvedDocRef = foundDoc.ref;
          const data = foundDoc.data();
          setProfile(data);
          setExistsCheck(true);
          persistCache(data);
          setLoading(false);
          return true;
        }
      } catch {
        // ignore query error
      }
      return false;
    };

    const logView = async () => {
      if (!auth.currentUser) return;
      try {
        await updateDoc(resolvedDocRef, {
          views: increment(1),
          visitors: increment(1),
          engagements: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // view metric increment skipped if permissions disallow
      }
    };

    // Fast one-shot lookup race so mobile browsers never spin infinitely
    (async () => {
      try {
        const directSnap = await withTimeout(getDoc(resolvedDocRef), 3000);
        if (cancelled) return;
        if (directSnap.exists()) {
          const data = directSnap.data();
          setProfile(data);
          setExistsCheck(true);
          persistCache(data);
          setLoading(false);
          logView();
          return;
        }
        const foundViaQuery = await resolveFallbackByUsernameField();
        if (!cancelled) {
          if (!foundViaQuery) {
            setExistsCheck((prev) => prev);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          await resolveFallbackByUsernameField();
          if (!cancelled) setLoading(false);
        }
      }
    })();

    const safetyTimer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3600);

    const unsub = onSnapshot(
      resolvedDocRef,
      async (docSnap) => {
        if (cancelled) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setExistsCheck(true);
          persistCache(data);
          setLoading(false);
        } else {
          const found = await resolveFallbackByUsernameField();
          if (!found && !cancelled) {
            setProfile((prev: any) => prev || null);
            setExistsCheck((prev) => prev);
            setLoading(false);
          }
        }
      },
      (error) => {
        console.warn("Claimed profile live listener fallback:", error);
        if (!cancelled) setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      unsub();
    };
  }, [username]);

  const trackClick = async () => {
    const normalizedUsername = (username || "").trim().toLowerCase();
    if (!normalizedUsername || normalizedUsername.includes("/") || !auth.currentUser) {
      return;
    }
    const docRef = doc(db, "gamura_developers", normalizedUsername);
    try {
      await updateDoc(docRef, {
        clicks: increment(1),
        engagements: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // ignore if viewer cannot write
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/@${username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/@${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName || username} on Gamura`,
          text: `Check out ${profile?.displayName || username}'s Gamura profile.`,
          url,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const getJoinDateString = () => {
    if (!profile) return "2026";
    const t = profile.createdAt || profile.updatedAt;
    if (!t) return "2026";
    try {
      const d = t.toDate ? t.toDate() : t instanceof Date ? t : new Date(t);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return "2026";
    }
  };

  if (loading) {
    return (
      <div
        style={APPLE_FONT_STYLE}
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col items-center justify-center p-6 gap-3"
      >
        <Loader2 className="animate-spin text-[#0071E3]" size={32} />
        <p className="text-xs font-medium text-[#6E6E73]">
          Loading @{username}...
        </p>
      </div>
    );
  }

  // Available to claim state
  if (!existsCheck || !profile) {
    return (
      <div
        style={APPLE_FONT_STYLE}
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col items-center justify-center p-6 relative"
      >
        <button
          type="button"
          onClick={onBack}
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200/80 text-[#1D1D1F] transition-colors text-xs font-semibold cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Back to Gamura</span>
        </button>

        <div className="max-w-md w-full bg-white border border-zinc-200/80 rounded-3xl p-8 text-center space-y-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center mx-auto">
            <Globe size={30} />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
              Available Handle
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] break-all">
              {window.location.host}/@<span className="text-[#0071E3]">{username}</span>
            </h1>
            <p className="text-sm text-[#6E6E73] leading-relaxed pt-1">
              This Gamura URL is unclaimed. Reserve it for free to publish your links, bio, and featured projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onClaimRoute(username)}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold py-3.5 px-6 rounded-2xl transition-all active:scale-[0.99] text-sm cursor-pointer shadow-sm"
          >
            Claim /@{username} for Free
          </button>

          <p className="text-xs text-[#6E6E73]">
            Includes live QR code and customizable link blocks.
          </p>
        </div>
      </div>
    );
  }

  const blocks = profile.blocks || [];
  const projects = profile.projects || [];
  const displayName = profile.displayName || username;

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-between pb-12"
    >
      {/* Top Apple Frosted Nav */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="w-full max-w-2xl mx-auto px-4 h-14 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-[#1D1D1F] transition-colors text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                showQr
                  ? "bg-blue-50 border-blue-200 text-[#0071E3]"
                  : "bg-zinc-100 border-zinc-200/70 text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
              title="Show QR Code"
            >
              <QrCode size={15} />
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-full bg-zinc-100 border border-zinc-200/70 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full bg-zinc-100 border border-zinc-200/70 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              title="Share Profile"
            >
              <Share2 size={15} />
            </button>

            <button
              type="button"
              onClick={() => onClaimRoute()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white transition-colors text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Sparkles size={12} />
              <span>Claim URL</span>
            </button>
          </div>
        </div>
      </header>

      {/* QR Code Card */}
      {showQr && (
        <div className="w-full max-w-xl mx-auto px-4 pt-5">
          <div className="bg-white border border-zinc-200/80 p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="bg-[#F5F5F7] p-2.5 rounded-2xl border border-zinc-200/70 shrink-0">
              <QRCodeSVG
                value={`${window.location.origin}/@${username}`}
                size={104}
                level="H"
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-[#1D1D1F]">Scan to Open Hub</h4>
              <p className="text-xs text-[#6E6E73]">
                {`${window.location.host}/@${username}`}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer pt-1"
              >
                {copied ? "Copied to clipboard" : "Copy link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Column */}
      <div className="w-full max-w-xl mx-auto px-4 py-6 flex-1 flex flex-col space-y-5">
        {/* Profile Header Card */}
        <div className="bg-white border border-zinc-200/80 p-6 sm:p-8 rounded-3xl text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-[#0071E3] to-sky-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-sm">
            {username.slice(0, 2).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {displayName}
            </h2>
            <div className="text-xs font-medium text-[#0071E3]">@{username}</div>
          </div>

          {profile.bio && (
            <p className="text-[#424245] text-sm max-w-sm mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}

          {profile.website && (
            <div className="pt-1 flex justify-center">
              <a
                href={
                  profile.website.startsWith("http")
                    ? profile.website
                    : `https://${profile.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-full transition-colors"
              >
                <Globe size={13} />
                <span>Visit Website</span>
              </a>
            </div>
          )}

          {(profile.github ||
            profile.linkedin ||
            profile.twitter ||
            profile.youtube) && (
            <div className="pt-3 flex justify-center gap-2.5 border-t border-zinc-100">
              {profile.github && (
                <a
                  href={
                    profile.github.startsWith("http")
                      ? profile.github
                      : `https://${profile.github}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2.5 border border-zinc-200/80 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/70 text-[#1D1D1F] transition-colors"
                  title="GitHub"
                >
                  <Github size={16} />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={
                    profile.linkedin.startsWith("http")
                      ? profile.linkedin
                      : `https://${profile.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2.5 border border-zinc-200/80 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/70 text-[#0071E3] transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={
                    profile.twitter.startsWith("http")
                      ? profile.twitter
                      : `https://${profile.twitter}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2.5 border border-zinc-200/80 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/70 text-[#1D1D1F] transition-colors"
                  title="Twitter"
                >
                  <Twitter size={16} />
                </a>
              )}
              {profile.youtube && (
                <a
                  href={
                    profile.youtube.startsWith("http")
                      ? profile.youtube
                      : `https://${profile.youtube}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2.5 border border-zinc-200/80 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/70 text-red-600 transition-colors"
                  title="YouTube"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          )}

          <div className="pt-1 flex justify-center items-center gap-1.5 text-[11px] text-[#6E6E73]">
            <Calendar size={12} />
            <span>Joined {getJoinDateString()}</span>
          </div>
        </div>

        {/* Featured Projects */}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] px-1">
              Featured Projects
            </h3>
            <div className="grid grid-cols-1 gap-3.5">
              {projects.map((proj: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-[#1D1D1F]">
                      {proj.title || "Untitled Project"}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {proj.githubUrl && (
                        <a
                          href={
                            proj.githubUrl.startsWith("http")
                              ? proj.githubUrl
                              : `https://${proj.githubUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={trackClick}
                          className="p-1.5 rounded-lg bg-[#F5F5F7] hover:bg-zinc-200/70 text-[#1D1D1F] transition-colors"
                          title="GitHub Repository"
                        >
                          <Github size={14} />
                        </a>
                      )}
                      {proj.url && (
                        <a
                          href={
                            proj.url.startsWith("http")
                              ? proj.url
                              : `https://${proj.url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={trackClick}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0071E3] transition-colors"
                          title="Open Project"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.image && (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-200/70 bg-[#F5F5F7]">
                      <img
                        src={proj.image}
                        alt={proj.title || "Project"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {proj.description && (
                    <p className="text-xs leading-relaxed text-[#424245]">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Blocks */}
        {blocks.length > 0 && (
          <div className="space-y-3">
            {blocks.map((b: any, index: number) => {
              const key = b.id || `claimed-b-${index}`;
              switch (b.type) {
                case "hdr": {
                  const ini = (b.name || "GM")
                    .split(" ")
                    .map((w: any) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={key}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-5 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-[#1D1D1F] text-sm font-bold mb-2">
                        {ini}
                      </div>
                      <div className="text-base font-bold text-[#1D1D1F]">
                        {b.name}
                      </div>
                      <div className="text-xs text-[#6E6E73] mt-1">{b.bio}</div>
                    </div>
                  );
                }
                case "img":
                  return (
                    <div
                      key={key}
                      className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden"
                    >
                      <img
                        src={b.src}
                        alt={b.alt || "Attachment"}
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-[350px] object-cover block"
                      />
                      {b.alt && (
                        <div className="p-3 text-center text-xs text-[#6E6E73] border-t border-zinc-100">
                          {b.alt}
                        </div>
                      )}
                    </div>
                  );
                case "txt":
                  return (
                    <div
                      key={key}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-5"
                    >
                      {b.tt === "h1" ? (
                        <h1 className="text-lg font-bold text-[#1D1D1F] mb-1">
                          {b.content}
                        </h1>
                      ) : b.tt === "h2" ? (
                        <h2 className="text-sm font-semibold text-[#1D1D1F] mb-1">
                          {b.content}
                        </h2>
                      ) : (
                        <p className="text-sm leading-relaxed text-[#424245]">
                          {b.content}
                        </p>
                      )}
                    </div>
                  );
                case "lnk":
                  return (
                    <a
                      key={key}
                      href={
                        b.url?.startsWith("http") ? b.url : `https://${b.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackClick}
                      className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-base shrink-0">
                          {b.icon || "🔗"}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] truncate">
                            {b.title || "Link"}
                          </div>
                          <div className="text-xs text-[#6E6E73] truncate">
                            {b.url}
                          </div>
                        </div>
                      </div>
                      <ExternalLink
                        size={15}
                        className="text-zinc-400 group-hover:text-[#0071E3] shrink-0"
                      />
                    </a>
                  );
                case "pdf":
                  return (
                    <a
                      key={key}
                      href={
                        b.url?.startsWith("http") ? b.url : `https://${b.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackClick}
                      className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#1D1D1F] truncate">
                            {b.title || "Document"}
                          </div>
                          <div className="text-xs text-[#6E6E73] truncate">
                            PDF Document
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={15} className="text-zinc-400 shrink-0" />
                    </a>
                  );
                case "html":
                  return (
                    <div
                      key={key}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                          <Code2 size={14} className="text-[#0071E3]" />
                          {b.title}
                        </span>
                      </div>
                      <div className="w-full h-[260px] rounded-xl border border-zinc-200 overflow-hidden bg-white">
                        <iframe
                          title={b.title}
                          srcDoc={b.code || "<h1>Preview</h1>"}
                          sandbox="allow-scripts"
                          referrerPolicy="no-referrer"
                          className="w-full h-full border-none block"
                        />
                      </div>
                    </div>
                  );
                case "div":
                  return <div key={key} className="h-px w-full bg-zinc-200/80 my-1" />;
                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>

      {/* Clean Analytics & Footer */}
      <div className="w-full max-w-xl mx-auto px-4 pt-4 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 grid grid-cols-4 gap-2 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">{profile.views || 0}</div>
            <div className="text-[11px] text-[#6E6E73]">Views</div>
          </div>
          <div className="border-l border-zinc-100">
            <div className="text-sm font-bold text-[#1D1D1F]">{profile.clicks || 0}</div>
            <div className="text-[11px] text-[#6E6E73]">Clicks</div>
          </div>
          <div className="border-l border-zinc-100">
            <div className="text-sm font-bold text-[#1D1D1F]">{profile.engagements || 0}</div>
            <div className="text-[11px] text-[#6E6E73]">Visits</div>
          </div>
          <div className="border-l border-zinc-100">
            <div className="text-sm font-bold text-[#1D1D1F]">{profile.visitors || 0}</div>
            <div className="text-[11px] text-[#6E6E73]">Reach</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6E6E73]">
          Powered by GAMURA
        </p>
      </div>
    </div>
  );
}
