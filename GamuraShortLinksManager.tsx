import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link2, Plus, Trash2, ExternalLink, Loader2, Copy, Check } from "lucide-react";

export default function GamuraShortLinksManager({ user }: { user: any }) {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, "gamura_shortlinks"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load short links", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [user]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Server is currently busy. Please try again later.");
    return;
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "gamura_shortlinks", id));
      setLinks(prev => prev.filter(l => l.id !== id));
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
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-white font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <Link2 className="text-cyan-400" /> Short Links
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Create custom short URLs like {window.location.host}/go/youtube</p>
      </div>

      <form onSubmit={handleAddLink} className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Slug</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-cyan-500/50">
            <span className="text-xs text-zinc-500 pl-4 py-3 font-mono">{window.location.host}/go/</span>
            <input 
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="youtube"
              className="w-full bg-transparent border-none outline-none text-white text-sm py-3 px-2 font-mono"
            />
          </div>
        </div>
        
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Destination URL</label>
          <input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/@selvaranjan"
            className="w-full bg-black/40 border border-white/10 focus:border-cyan-500/50 outline-none text-white text-sm px-4 py-3 rounded-xl font-mono"
          />
        </div>
        
        <div className="flex items-end">
          <button 
            type="submit" 
            disabled={adding || !slug || !url}
            className="h-[46px] px-6 bg-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center p-10 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 text-sm">
            You don't have any short links yet.
          </div>
        ) : (
          links.map(link => {
            const shortUrl = `${window.location.origin}/go/${link.slug}`;
            return (
              <div key={link.id} className="group bg-white/5 border border-white/10 hover:border-cyan-500/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm truncate">{link.slug}</h3>
                    <span className="bg-cyan-500/10 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ml-2">
                       {link.clicks || 0} CLICKS
                    </span>
                  </div>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 font-mono flex items-center gap-1 hover:text-cyan-400 truncate">
                    {link.url} <ExternalLink size={10} />
                  </a>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-zinc-400">
                    /go/{link.slug}
                  </div>
                  <button
                    onClick={() => copyLink(shortUrl, link.id)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
                    title="Copy URL"
                  >
                    {copied === link.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
