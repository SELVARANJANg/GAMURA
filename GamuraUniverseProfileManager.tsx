import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Loader2, Globe, Sparkles, User, Link as LinkIcon, CheckCircle2, XCircle, QrCode, Github, Linkedin, Twitter, Youtube, Trash2, Plus, ExternalLink, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ProfileManagerProps {
  user: any;
  showToast?: (ic: string, title: string, content: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function GamuraUniverseProfileManager({ user, showToast }: ProfileManagerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [checkStatus, setCheckStatus] = useState<"none" | "checking" | "available" | "taken">("none");
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [projects, setProjects] = useState<any[]>([]); // [{ title: "", description: "", url: "", githubUrl: "", image: "" }]
  const [blocks, setBlocks] = useState<any[]>([]); // [{ id: "", type: "txt" | "img" | "div", tt?: "h1"|"h2"|"p", content?: "", src?: "", alt?: "" }]
  const [saving, setSaving] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    // Subscribe to developer profile in real-time
    const docRef = doc(db, "gamura_developers", user.uid);
    const unsubDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setUsername(data.username || "");
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
      } else {
        // If profile doesn't exist under UID yet, fall back to lookup by email
        if (user.email) {
          const q = query(collection(db, "gamura_developers"), where("email", "==", user.email));
          getDocs(q).then((snap) => {
            if (!snap.empty) {
              const data = snap.docs[0].data();
              setProfile(data);
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
          }).catch((err) => {
            console.error(err);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Real-time developer profile subscription failed:", err);
      setLoading(false);
    });

    return () => {
      unsubDoc();
    };
  }, [user]);

  useEffect(() => {
    if (!username.trim() || profile?.username === username) {
      setCheckStatus("none");
      return;
    }
    const check = async () => {
      setCheckStatus("checking");
      try {
        const q = query(collection(db, "gamura_developers"), where("username", "==", username.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          const docRef = await getDoc(doc(db, "gamura_developers", username.toLowerCase()));
          if (docRef.exists()) {
            setCheckStatus("taken");
          } else {
            setCheckStatus("available");
          }
        } else {
          setCheckStatus("taken");
        }
      } catch (err) {
        setCheckStatus("none");
      }
    };
    const to = setTimeout(check, 500);
    return () => clearTimeout(to);
  }, [username, profile]);

  const handleSave = async () => {
    if (showToast) {
      showToast("⏳", "Server Busy", "The server is currently busy. Please try again later.", "warning");
    } else {
      alert("Server is currently busy. Please try again later.");
    }
    return;
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>;
  }

  if (showPublishSuccess) {
    const claimUrlPath = `/@${username}`;
    const fullClaimUrl = `https://gamura.vercel.app/@${username}`;
    const customNiceUrl = `https://gamura.vercel.app/${username}`;
    
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 text-white font-sans space-y-6">
        <div className="bg-[#050811] border-2 border-emerald-500/35 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] text-center space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="inline-flex p-4 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 mb-2 animate-pulse">
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 uppercase font-mono">
              🚀 TRANSMISSION SECURED
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">URL LINK CLAIMED & PUBLISHED!</h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
              Your custom project hub is now active on the global Gamura network architecture. Click below to inspect your creation.
            </p>
          </div>

          {/* Links Display Box */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4.5 space-y-3.5 max-w-md mx-auto text-left">
            <div className="space-y-1">
              <span className="text-[7.5px] font-extrabold text-zinc-500 tracking-wider uppercase pl-0.5 block font-mono">Official Vercel Target Link:</span>
              <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs">
                <span className="text-cyan-400 select-all overflow-hidden truncate mr-2">{customNiceUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customNiceUrl);
                    if (showToast) showToast("📋", "Copied", "Copied Vercel link to clipboard.");
                  }}
                  className="flex-shrink-0 text-[10px] text-zinc-400 hover:text-white font-bold uppercase transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] font-extrabold text-zinc-500 tracking-wider uppercase pl-0.5 block font-mono">Standard Gamura Alias Hub Link:</span>
              <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs">
                <span className="text-zinc-300 select-all overflow-hidden truncate mr-2">{fullClaimUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullClaimUrl);
                    if (showToast) showToast("📋", "Copied", "Copied alias link to clipboard.");
                  }}
                  className="flex-shrink-0 text-[10px] text-zinc-400 hover:text-white font-bold uppercase transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] font-extrabold text-zinc-500 tracking-wider uppercase pl-0.5 block font-mono">Current Sandbox Local Path (Click to view):</span>
              <a 
                href={claimUrlPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl px-3 py-2.5 font-mono text-xs text-emerald-450 hover:text-emerald-300 group transition-all"
              >
                <span className="overflow-hidden truncate mr-2">{window.location.host}{claimUrlPath}</span>
                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <a
              href={claimUrlPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-95 text-center block"
            >
              Open My Page 🌐
            </a>
            <button
              type="button"
              onClick={() => setShowPublishSuccess(false)}
              className="flex-grow py-3.5 px-6 rounded-xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold text-xs tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
            >
              Back to Editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 text-white font-sans space-y-6">
      <div className="bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-500/20 p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2 flex items-center gap-3">
          <Globe className="text-cyan-400" /> GAMURA UNIVERSE URL
        </h2>
        <p className="text-sm text-zinc-400">Claim your unique URL and customize your decentralized Link Hub & project page.</p>
        
        <div className="mt-8 space-y-6 relative z-10">
          
          {/* USERNAME CLAIM UPLINK */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest pl-1">CLAIM SUBDOMAIN PATH</label>
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors">
              <span className="text-xs text-zinc-500 pl-4 py-4 font-mono font-bold">gamura.vercel.app/</span>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourname"
                disabled={saving}
                className="w-full bg-transparent border-none outline-none text-white text-sm py-4 pr-4 pl-1 font-mono font-bold flex-1"
              />
              <div className="pr-4 shrink-0">
                {checkStatus === "checking" && <Loader2 size={16} className="text-zinc-500 animate-spin" />}
                {checkStatus === "available" && <CheckCircle2 size={16} className="text-emerald-500" />}
                {checkStatus === "taken" && <XCircle size={16} className="text-red-500" />}
              </div>
            </div>
            {checkStatus === "available" && <p className="text-xs text-emerald-400 font-bold pl-1 mt-1 font-mono uppercase tracking-wider">🌟 URL AVAILABLE TO CLAIM!</p>}
            {checkStatus === "taken" && <p className="text-xs text-red-500 font-bold pl-1 mt-1 font-mono uppercase tracking-wider">❌ URL ALREADY TAKEN BY DEVELOPER.</p>}
          </div>

          {/* BASIC PROFILE DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Display Name</label>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                <User size={16} className="text-zinc-400" />
                <input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="E.g. Selvaranjan G"
                  className="w-full bg-transparent border-none outline-none text-white text-sm py-4 pl-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Website URL</label>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                <LinkIcon size={16} className="text-zinc-400" />
                <input 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourpage.com"
                  className="w-full bg-transparent border-none outline-none text-white text-sm py-4 pl-3"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Profile Bio / Status description</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Full-Stack Developer, Web3 Architect, Designer..."
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-xl outline-none text-white text-sm px-4 py-3 focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* SOCIAL LINKS SECTION */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Connect Social Networks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Github size={12} className="text-zinc-400" /> GitHub Profile
                </label>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                  <input 
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-transparent border-none outline-none text-white text-xs py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Linkedin size={12} className="text-zinc-450" /> LinkedIn Profile
                </label>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                  <input 
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-transparent border-none outline-none text-white text-xs py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Twitter size={12} className="text-zinc-455" /> Twitter / X Profile
                </label>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                  <input 
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="w-full bg-transparent border-none outline-none text-white text-xs py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Youtube size={12} className="text-zinc-455" /> YouTube Channel
                </label>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-white/30 transition-colors">
                  <input 
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@channel"
                    className="w-full bg-transparent border-none outline-none text-white text-xs py-3.5"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* FEATURED PROJECTS SECTION */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  📁 Featured Projects & Credentials
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">Highlight your primary tech creations, codes, and screenshots.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setProjects([...projects, { title: "", description: "", url: "", githubUrl: "", image: "" }]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 hover:bg-[#0ea5e9]/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <Plus size={12} /> Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-6 bg-black/20 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs">
                No featured projects highlighted yet. Highlight your creation above!
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="bg-[#03060c] border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => {
                        const next = [...projects];
                        next.splice(idx, 1);
                        setProjects(next);
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-950/20 text-red-400 border border-red-500/10 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Remove Project"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-10">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Project Title</label>
                        <input 
                          value={proj.title || ""}
                          onChange={(e) => {
                            const next = [...projects];
                            next[idx].title = e.target.value;
                            setProjects(next);
                          }}
                          placeholder="E.g. Gamura Sandbox Engine"
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Project Screenshot Image URL</label>
                        <input 
                          value={proj.image || ""}
                          onChange={(e) => {
                            const next = [...projects];
                            next[idx].image = e.target.value;
                            setProjects(next);
                          }}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20 font-mono"
                        />
                      </div>
                    </div>

                    {proj.image && (
                      <div className="h-28 rounded-lg overflow-hidden border border-white/5 bg-zinc-950 select-none m-0.5">
                        <img 
                          src={proj.image} 
                          alt="Project Preview" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Project Description</label>
                      <textarea 
                        value={proj.description || ""}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx].description = e.target.value;
                          setProjects(next);
                        }}
                        placeholder="Brief description of what you designed, built, and executed."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Deployment Demo Link</label>
                        <input 
                          value={proj.url || ""}
                          onChange={(e) => {
                            const next = [...projects];
                            next[idx].url = e.target.value;
                            setProjects(next);
                          }}
                          placeholder="https://..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">GitHub Repository Link</label>
                        <input 
                          value={proj.githubUrl || ""}
                          onChange={(e) => {
                            const next = [...projects];
                            next[idx].githubUrl = e.target.value;
                            setProjects(next);
                          }}
                          placeholder="https://github.com/..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM INTERACTIVE CANVAS BLOCKS SECTION */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-400" /> Interactive Profile Blocks
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">Add additional headings, texts, media images, and dividers to structure your page layout.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button 
                  type="button"
                  onClick={() => {
                    setBlocks([...blocks, { id: `b-${Date.now()}`, type: "txt", tt: "p", content: "" }]);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={10} /> + TEXT
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setBlocks([...blocks, { id: `b-${Date.now()}`, type: "img", src: "", alt: "" }]);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={10} /> + IMAGE
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setBlocks([...blocks, { id: `b-${Date.now()}`, type: "div" }]);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-700/20 text-zinc-300 border border-white/10 hover:bg-zinc-700/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={10} /> + LINE
                </button>
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="text-center py-6 bg-black/20 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs">
                No custom blocks are added yet. Create headings, upload images, or add stylish dividers above!
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((b, idx) => (
                  <div key={b.id || idx} className="bg-[#03060c] border border-white/5 p-4 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                      <span className="text-[9px] font-black tracking-widest text-zinc-450 uppercase font-mono">
                        {b.type === "txt" ? "📝 Text Block" : b.type === "img" ? "🖼️ Image Block" : "━ Divider Line"}
                      </span>
                      <div className="flex items-center gap-2.5 pr-2">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...blocks];
                              const temp = next[idx];
                              next[idx] = next[idx - 1];
                              next[idx - 1] = temp;
                              setBlocks(next);
                            }}
                            className="text-[9px] font-extrabold text-[#0ea5e9] hover:text-sky-300 font-mono"
                          >
                            ▲ UP
                          </button>
                        )}
                        {idx < blocks.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...blocks];
                              const temp = next[idx];
                              next[idx] = next[idx + 1];
                              next[idx + 1] = temp;
                              setBlocks(next);
                            }}
                            className="text-[9px] font-extrabold text-[#0ea5e9] hover:text-sky-300 font-mono"
                          >
                            ▼ DOWN
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => {
                            const next = [...blocks];
                            next.splice(idx, 1);
                            setBlocks(next);
                          }}
                          className="p-1 px-1.5 rounded bg-red-950/20 text-red-400 border border-red-500/15 hover:bg-red-500/10 cursor-pointer text-[9px] uppercase font-bold"
                          title="Delete Block"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {b.type === "txt" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Text Type:</label>
                          <div className="flex gap-2">
                            {[
                              { label: "Heading 1", value: "h1" },
                              { label: "Heading 2", value: "h2" },
                              { label: "Paragraph", value: "p" }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  const next = [...blocks];
                                  next[idx].tt = opt.value;
                                  setBlocks(next);
                                }}
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${b.tt === opt.value ? "bg-emerald-500/20 text-emerald-450 border border-emerald-500/30" : "bg-black/30 text-zinc-400 border border-white/5 hover:text-white"}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Content Text</label>
                          <textarea 
                            value={b.content || ""}
                            onChange={(e) => {
                              const next = [...blocks];
                              next[idx].content = e.target.value;
                              setBlocks(next);
                            }}
                            placeholder={b.tt === "h1" ? "E.g. SYSTEM ARCHITECTURE INTEGRATION" : b.tt === "h2" ? "E.g. Key technologies" : "Write your custom markdown/content paragraph text here..."}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20 resize-none font-sans"
                          />
                        </div>
                      </div>
                    )}

                    {b.type === "img" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5 flex flex-col justify-start">
                            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Image Resource URL</label>
                            <input 
                              type="text"
                              value={b.src || ""}
                              onChange={(e) => {
                                const next = [...blocks];
                                next[idx].src = e.target.value;
                                setBlocks(next);
                              }}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20 font-mono"
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col justify-start">
                            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Alternative Text / Caption</label>
                            <input 
                              type="text"
                              value={b.alt || ""}
                              onChange={(e) => {
                                const next = [...blocks];
                                next[idx].alt = e.target.value;
                                setBlocks(next);
                              }}
                              placeholder="E.g. Developer workspace graphics diagram"
                              className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 outline-none focus:border-white/20"
                            />
                          </div>
                        </div>

                        {b.src && (
                          <div className="w-full max-h-32 rounded-lg overflow-hidden border border-white/5 bg-zinc-950 flex items-center justify-center">
                            <img 
                              src={b.src} 
                              alt={b.alt || "Preview"} 
                              className="max-h-32 object-contain" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {b.type === "div" && (
                      <div className="py-2 flex flex-col items-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent my-1.5" />
                        <span className="text-[7.5px] text-zinc-500 font-mono tracking-widest uppercase">HORIZONTAL DECORATIVE DIVIDER ATTACHMENT</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            {profile && profile.username && (
               <div className="flex items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-xl w-full md:w-auto">
                 <div className="bg-white p-1.5 rounded-lg shrink-0">
                   <QRCodeSVG value={`${window.location.origin}/@${profile.username}`} size={48} level="H" />
                 </div>
                 <div className="text-left py-1">
                   <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">PROFILE QR</div>
                   <div className="text-xs text-zinc-400 font-mono mt-0.5 max-w-[140px] truncate">{`${window.location.host}/@${profile.username}`}</div>
                 </div>
               </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !username || checkStatus === "taken"}
              className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 md:ml-auto cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
              {profile ? "Uplink & Publish Profile 🚀" : "Claim My URL & Publish 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
