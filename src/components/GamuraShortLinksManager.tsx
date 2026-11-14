import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Lock,
} from "lucide-react";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

export default function GamuraShortLinksManager({ user }: { user: any }) {
  const [authUser, setAuthUser] = useState<any>(() => auth.currentUser);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUser(u));
    return () => unsub();
  }, []);

  const effectiveUid =
    authUser?.uid ||
    (user?.uid && user.uid !== "guest_explorer_uid" ? user.uid : null);

  useEffect(() => {
    let active = true;
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const q = effectiveUid
          ? query(collection(db, "gamura_shortlinks"), where("uid", "==", effectiveUid))
          : query(collection(db, "gamura_shortlinks"), limit(15));
        const snap = await getDocs(q);
        if (active) {
          setLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Failed to load short links", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLinks();
    return () => {
      active = false;
    };
  }, [effectiveUid]);

  const handleQuickSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      setErrorMsg(err?.message || "Google sign-in was cancelled.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !url.trim()) return;
    setErrorMsg(null);

    let uid = auth.currentUser?.uid;
    if (!uid) {
      setAdding(true);
      try {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider());
        uid = cred.user.uid;
      } catch (err: any) {
        setErrorMsg(err?.message || "Sign in with Google to create custom short links.");
        setAdding(false);
        return;
      }
    }

    setAdding(true);
    try {
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!cleanSlug) {
        setErrorMsg("Please provide a valid slug (letters, numbers, underscores, hyphens).");
        setAdding(false);
        return;
      }
      const docId = cleanSlug;
      const newLink = {
        slug: cleanSlug,
        url: formattedUrl,
        uid,
        clicks: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "gamura_shortlinks", docId), newLink);
      setLinks((prev) => [
        { id: docId, ...newLink, clicks: 0 },
        ...prev.filter((l) => l.id !== docId),
      ]);
      setSlug("");
      setUrl("");
    } catch (err: any) {
      console.error("Failed to add short link", err);
      setErrorMsg(err?.message || "Failed to create short link. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "gamura_shortlinks", id));
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete link", err);
    }
  };

  const copyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div style={APPLE_FONT_STYLE} className="flex flex-col items-center justify-center p-12 gap-2 text-[#6E6E73]">
        <Loader2 className="animate-spin text-[#0071E3]" size={24} />
        <span className="text-xs font-medium">Loading short links...</span>
      </div>
    );
  }

  return (
    <div style={APPLE_FONT_STYLE} className="max-w-4xl mx-auto p-2 sm:p-4 text-[#1D1D1F] space-y-5">
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-2">
              <Link2 size={20} className="text-[#0071E3]" />
              <span>Gamura Short Links</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-0.5">
              Create instant short URLs like{" "}
              <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded text-[#1D1D1F] text-xs">
                {window.location.host}/go/portfolio
              </code>
            </p>
          </div>
          {!auth.currentUser && (
            <button
              type="button"
              onClick={handleQuickSignIn}
              disabled={signingIn}
              className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-center disabled:opacity-60"
            >
              <Lock size={13} />
              <span>{signingIn ? "Signing in..." : "Sign in to Manage"}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleAddLink} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#F5F5F7] border border-zinc-200/70 p-4 rounded-2xl">
          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-semibold text-[#6E6E73] pl-1 block">
              Short Slug
            </label>
            <div className="flex items-center bg-white border border-zinc-200/80 rounded-xl overflow-hidden focus-within:border-[#0071E3]">
              <span className="text-xs text-[#6E6E73] pl-3 py-2.5 font-medium shrink-0">
                /go/
              </span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
                placeholder="youtube"
                className="w-full bg-transparent border-none outline-none text-[#1D1D1F] text-xs py-2.5 pr-3 font-semibold"
              />
            </div>
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-semibold text-[#6E6E73] pl-1 block">
              Destination URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full bg-white border border-zinc-200/80 focus:border-[#0071E3] outline-none text-[#1D1D1F] text-xs px-3.5 py-2.5 rounded-xl"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={adding || !slug.trim() || !url.trim()}
              className="w-full h-[38px] px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Create</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2.5">
          {links.length === 0 ? (
            <div className="text-center py-8 bg-[#F5F5F7] border border-dashed border-zinc-200 rounded-2xl text-[#6E6E73] text-xs">
              No short links created yet. Add your first /go/ shortcut above.
            </div>
          ) : (
            links.map((link) => {
              const shortUrl = `${window.location.origin}/go/${link.slug}`;
              const isOwner = auth.currentUser?.uid && link.uid === auth.currentUser.uid;
              return (
                <div
                  key={link.id}
                  className="bg-[#F5F5F7] border border-zinc-200/70 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1D1D1F] truncate">
                        /go/{link.slug}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0071E3] tabular-nums">
                        · {link.clicks || 0} clicks
                      </span>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#6E6E73] flex items-center gap-1 hover:text-[#0071E3] truncate"
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyLink(shortUrl, link.id)}
                      className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-[#1D1D1F] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied === link.id ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id)}
                        className="p-2 bg-white hover:bg-red-50 text-red-600 border border-zinc-200 hover:border-red-200 rounded-xl transition-colors cursor-pointer"
                        title="Delete short link"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
