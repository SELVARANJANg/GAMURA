import React, { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Sparkles, Globe, Eye, Zap, MousePointerClick, ArrowLeft, Loader2, FileText, 
  Code2, ExternalLink, Github, Linkedin, Twitter, Youtube, Calendar, QrCode, Share2, Copy, Check 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

interface ClaimedProfileViewProps {
  username: string;
  onBack: () => void;
  onClaimRoute: () => void;
}

export default function ClaimedProfileView({ username, onBack, onClaimRoute }: ClaimedProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [existsCheck, setExistsCheck] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Load profile in real-time
  useEffect(() => {
    const normalizedUsername = username.toLowerCase();
    const docRef = doc(db, "gamura_developers", normalizedUsername);

    // Initial incremental view logging
    const logView = async () => {
      try {
        await updateDoc(docRef, {
          views: increment(1),
          visitors: increment(1),
          engagements: increment(1),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("View logging bypassed:", err);
      }
    };
    logView();

    // Setup real-time listener
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
        setExistsCheck(true);
      } else {
        setProfile(null);
        setExistsCheck(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      handleFirestoreError(error, OperationType.GET, `gamura_developers/${normalizedUsername}`);
      setLoading(false);
    });

    return () => unsub();
  }, [username]);

  // Atomic link/PDF click tracking
  const trackClick = async () => {
    const normalizedUsername = username.toLowerCase();
    const docRef = doc(db, "gamura_developers", normalizedUsername);
    try {
      await updateDoc(docRef, {
        clicks: increment(1),
        engagements: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Click tracking bypassed:", err);
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
          text: `Check out ${profile?.displayName || username}'s links hub & personal creations on Gamura!`,
          url: url
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const getJoinDateString = () => {
    if (!profile) return "May 2026";
    let t = profile.createdAt || profile.updatedAt;
    if (!t) return "May 2026";
    try {
      let d: Date;
      if (t.toDate) d = t.toDate();
      else if (t instanceof Date) d = t;
      else d = new Date(t);
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return "May 2026";
    }
  };

  // Render Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#03050C] text-white flex flex-col items-center justify-center p-6 font-sans">
        <Loader2 className="animate-spin text-cyan-400 mb-4" size={40} />
        <p className="text-sm font-mono tracking-widest text-zinc-400 uppercase">ACCESSING GAMURA DATABASE...</p>
      </div>
    );
  }

  // Render "Available to Claim" state
  if (!existsCheck || !profile) {
    return (
      <div className="min-h-screen bg-[#03050C] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background mesh glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={14} className="text-cyan-400" /> Back to Home
        </button>

        <div className="max-w-md w-full text-center space-y-6 z-10">
          <div className="inline-flex p-4 rounded-3xl bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 mb-2">
            <Globe size={40} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Domain Status: Available</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
              {window.location.host}/@<span className="text-cyan-400">{username}</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed pt-2">
              The link you requested is currently free and available. You can claim it instantly to build your dynamic Links Hub & Interactive Web Canvas!
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={onClaimRoute}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-extrabold py-4 px-6 rounded-2xl shadow-[0_4px_30px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_40px_rgba(14,165,233,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-widest uppercase cursor-pointer"
            >
              🚀 CLAIM THIS URL NOW FOR FREE
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono pt-4">
            🔒 Includes real-time Firestore database analytics & Free Galaxy subdomains.
          </div>
        </div>
      </div>
    );
  }

  // Render Active profile live page
  const plan = profile.plan || "Starter";
  const blocks = profile.blocks || [];
  const projects = profile.projects || [];
  const displayName = profile.displayName || username;

  return (
    <div className="min-h-screen bg-[#03050C] text-zinc-100 flex flex-col justify-between font-sans relative overflow-x-hidden pb-12">
      {/* Cosmic Slate & Aurora backglow elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-[-150px] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navigation Control Row */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-6 z-20 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={12} className="text-cyan-400" /> Back
        </button>

        <div className="flex items-center gap-2">
          {/* QR Button */}
          <button
            onClick={() => setShowQr(!showQr)}
            className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
              showQr 
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Show QR Code"
          >
            <QrCode size={14} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
            title="Copy URL"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
            title="Share Profile"
          >
            <Share2 size={14} />
          </button>

          <button
            onClick={onClaimRoute}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/10 text-emerald-400 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Sparkles size={11} className="text-emerald-400 animate-pulse" /> Claim Custom URL
          </button>
        </div>
      </div>

      {/* QR Code Slideout Reveal Overlay */}
      {showQr && (
        <div className="w-full max-w-xl mx-auto px-4 pt-4 z-20">
          <div className="bg-[#050811] border border-cyan-500/25 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in shadow-[0_8px_32px_rgba(6,182,212,0.15)]">
            <div className="bg-white p-2.5 rounded-xl shrink-0">
              <QRCodeSVG value={`${window.location.origin}/@${username}`} size={110} level="H" />
            </div>
            <div className="text-center sm:text-left space-y-1.5 py-1">
              <span className="inline-block text-[9px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/30">
                ⚡ GEN KEY LINK QR
              </span>
              <h4 className="text-sm font-extrabold text-white">Scan to Open Hub</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                {`${window.location.host}/@${username}`}
              </p>
              <button 
                onClick={handleCopyLink}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 pointer-events-auto cursor-pointer underline flex items-center justify-center sm:justify-start gap-1 focus:outline-none"
              >
                {copied ? "Copied!" : "Copy link directly"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Column */}
      <div className="w-full max-w-xl mx-auto px-4 py-8 z-10 flex-1 flex flex-col space-y-6">
        
        {/* Domain tier badge */}
        <div className="text-center">
          {plan === "Pro" ? (
            <span className="inline-flex items-center gap-1 text-[8px] font-black tracking-widest text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/25 px-3 py-1 rounded-full uppercase">
              🛡️ PRO HUB CHANNEL
            </span>
          ) : plan === "GalaxyPass" || plan === "Galaxy" ? (
            <span className="inline-flex items-center gap-1 text-[8px] font-black tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/25 px-3 py-1 rounded-full uppercase">
              🌌 GALAXY PASS MEMBERSHIP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[8px] font-black tracking-widest text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 px-3 py-1 rounded-full uppercase">
              STANDARD DEV LINK
            </span>
          )}
        </div>

        {/* PROFILE BODY CARD */}
        <div className="bg-[#080B14] border border-white/[0.04] p-6 rounded-3xl text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

          {/* Initials Avatar Icon */}
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-black uppercase shadow-2xl relative z-10 border-2 border-white/10">
            {username.slice(0, 2).toUpperCase()}
          </div>

          <div className="space-y-1.5 relative z-10">
            <h2 className="text-2xl font-black tracking-tight text-white">{displayName}</h2>
            <div className="font-mono text-xs text-cyan-400 tracking-wider">@{username}</div>
          </div>

          {profile.bio && (
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed z-10 relative">
              {profile.bio}
            </p>
          )}

          {/* Personal Website Link */}
          {profile.website && (
            <div className="pt-2 flex justify-center z-10 relative">
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider cursor-pointer bg-emerald-500/10 px-3.5 py-1.5 border border-emerald-500/15 rounded-full"
              >
                <Globe size={12} /> View Personal Website
              </a>
            </div>
          )}

          {/* Social Links Badge Tray */}
          {(profile.github || profile.linkedin || profile.twitter || profile.youtube) && (
            <div className="pt-3 flex justify-center gap-3 z-10 relative border-t border-white/[0.02]">
              {profile.github && (
                <a 
                  href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="GitHub Profile"
                >
                  <Github size={15} />
                </a>
              )}
              {profile.linkedin && (
                <a 
                  href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={15} />
                </a>
              )}
              {profile.twitter && (
                <a 
                  href={profile.twitter.startsWith("http") ? profile.twitter : `https://${profile.twitter}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Twitter Profile"
                >
                  <Twitter size={15} />
                </a>
              )}
              {profile.youtube && (
                <a 
                  href={profile.youtube.startsWith("http") ? profile.youtube : `https://${profile.youtube}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-red-500 hover:text-red-400 transition-all cursor-pointer"
                  title="YouTube Channel"
                >
                  <Youtube size={15} />
                </a>
              )}
            </div>
          )}

          {/* Metadata Join Date Badge */}
          <div className="pt-2 flex justify-center items-center gap-1.5 text-[9px] font-mono text-zinc-500 tracking-wider">
            <Calendar size={10} /> MEMBERSHIP ESTABLISHED: {getJoinDateString().toUpperCase()}
          </div>
        </div>

        {/* FEATURED PROJECTS SHELF */}
        {projects.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Featured Projects</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {projects.map((proj: any, idx: number) => (
                <div key={idx} className="bg-[#080B14] border border-white/[0.04] rounded-2xl p-5 hover:border-cyan-500/20 transition-all relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/[0.02] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-cyan-400 transition-colors">
                      {proj.title || "Untitled Project"}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      {proj.githubUrl && (
                        <a 
                          href={proj.githubUrl.startsWith("http") ? proj.githubUrl : `https://${proj.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={trackClick}
                          className="p-1 border border-white/5 bg-zinc-900 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="View Repository"
                        >
                          <Github size={12} />
                        </a>
                      )}
                      {proj.url && (
                        <a 
                          href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={trackClick}
                          className="p-1 border border-white/5 bg-zinc-900 rounded hover:bg-white/10 text-[#0EA5E9] hover:text-sky-300 transition-colors"
                          title="View Demo"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.image && (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-white/5 bg-zinc-950 mb-3 select-none">
                      <img 
                        src={proj.image} 
                        alt={proj.title || "Project Artwork"} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-zinc-400">
                    {proj.description || "No project snapshot description available."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOM BLOCKS RENDERING (Backward compatibility layer) */}
        {blocks.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Interactive Canvas Blocks</h3>
            </div>

            <div className="space-y-4">
              {blocks.map((b: any, index: number) => {
                const key = b.id || `claimed-b-${index}`;
                switch (b.type) {
                  case "hdr": {
                    const ini = (b.name || "SG").split(" ").map((w: any) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div key={key} className="bg-[#080B14] border border-white/[0.04] rounded-2xl p-5 text-center relative overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-zinc-800/80 mx-auto flex items-center justify-center text-white text-sm font-extrabold border border-white/5 mb-3">
                          {ini}
                        </div>
                        <div className="text-base font-bold text-white mb-1">{b.name}</div>
                        <div className="text-xs text-zinc-400 max-w-md mx-auto">{b.bio}</div>
                      </div>
                    );
                  }
                  case "img": {
                    return (
                      <div key={key} className="bg-[#080B14] border border-white/[0.04] rounded-2xl overflow-hidden shadow-md">
                        <img 
                          src={b.src} 
                          alt={b.alt || "Developer Attachment"} 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-[350px] object-cover block"
                        />
                        {b.alt && (
                          <div className="p-3 text-center text-xs text-zinc-400 bg-[#0A0E18] border-t border-white/[0.02]">
                            {b.alt}
                          </div>
                        )}
                      </div>
                    );
                  }
                  case "txt": {
                    return (
                      <div key={key} className="bg-[#080B14] border border-white/[0.04] rounded-2xl p-5 text-zinc-300">
                        {b.tt === "h1" ? (
                          <h1 className="text-lg font-black tracking-tight text-white mb-2">{b.content}</h1>
                        ) : b.tt === "h2" ? (
                          <h2 className="text-sm font-bold text-white mb-1.5">{b.content}</h2>
                        ) : (
                          <p className="text-xs md:text-sm leading-relaxed text-zinc-400 font-sans">{b.content}</p>
                        )}
                      </div>
                    );
                  }
                  case "lnk": {
                    return (
                      <a
                        key={key}
                        href={b.url.startsWith("http") ? b.url : `https://${b.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={trackClick}
                        className="flex items-center justify-between p-4 bg-[#080B14] hover:bg-[#0C1220] border border-white/[0.04] hover:border-cyan-500/30 rounded-2xl shadow-sm transition-all group cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-lg shadow-inner group-hover:bg-cyan-950/20 transition-all border border-white/5">
                            {b.icon || "🔗"}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">{b.title}</div>
                            <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px] md:max-w-md">{b.url}</div>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-zinc-600 group-hover:text-cyan-400 transition-colors mr-1" />
                      </a>
                    );
                  }
                  case "pdf": {
                    return (
                      <a
                        key={key}
                        href={b.url.startsWith("http") ? b.url : `https://${b.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={trackClick}
                        className="flex items-center justify-between p-4 bg-[#080B14] hover:bg-[#0E0F1A] border border-red-500/[0.12] hover:border-red-500/30 rounded-2xl shadow-sm transition-all group cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-500/10 flex items-center justify-center text-lg text-red-400 shadow-inner">
                            📄
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-wide">{b.title}</div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                              <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded text-[8px] font-bold">PDF FILE</span>
                              <span>{b.url.length > 40 ? b.url.substring(0, 40) + "..." : b.url}</span>
                            </div>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-zinc-600 group-hover:text-red-400 transition-colors mr-1" />
                      </a>
                    );
                  }
                  case "html": {
                    return (
                      <div key={key} className="bg-[#080B14] border border-emerald-500/[0.12] rounded-2xl p-5 text-left shadow-lg overflow-hidden relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-extrabold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                            <Code2 size={13} className="text-emerald-400" /> {b.title}
                          </span>
                          <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            LIVE RESULT PREVIEW
                          </span>
                        </div>
                        <div className="w-full h-[260px] rounded-xl border border-white/[0.04] bg-[#000] overflow-hidden">
                          <iframe
                            title={b.title}
                            srcDoc={b.code || "<h1>No code preview</h1>"}
                            sandbox="allow-scripts"
                            referrerPolicy="no-referrer"
                            className="w-full h-full border-none block"
                          />
                        </div>
                      </div>
                    );
                  }
                  case "div": {
                    return (
                      <div key={key} className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-2" />
                    );
                  }
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        )}

      </div>

      {/* Synchronized Real-time Engagement Live Analytics Deck */}
      <div className="w-full max-w-xl mx-auto px-4 pb-12 pt-6 z-10 space-y-6">
        <div className="bg-[#050811] p-5 rounded-2xl border border-white/[0.02] grid grid-cols-4 gap-2 text-center shadow-inner">
          <div className="space-y-1">
            <div className="font-mono text-cyan-400 font-extrabold text-sm md:text-base tracking-tight">{profile.views || 0}</div>
            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">TOTAL VIEWS</div>
          </div>
          <div className="space-y-1 border-l border-white/[0.04]">
            <div className="font-mono text-emerald-400 font-extrabold text-sm md:text-base tracking-tight">{profile.clicks || 0}</div>
            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">LINK CLICKS</div>
          </div>
          <div className="space-y-1 border-l border-white/[0.04]">
            <div className="font-mono text-amber-400 font-extrabold text-sm md:text-base tracking-tight">{profile.engagements || 0}</div>
            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">ENGAGEMENTS</div>
          </div>
          <div className="space-y-1 border-l border-white/[0.04]">
            <div className="font-mono text-purple-400 font-extrabold text-sm md:text-base tracking-tight">{profile.visitors || 0}</div>
            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">LIVE VISITORS</div>
          </div>
        </div>

        <div className="text-center font-mono text-[9px] text-zinc-600 tracking-wider">
          🛰️ POWERED BY GAMURA ENGINE · SYNCED IN REAL-TIME WITH SECURE CLOUD STORAGE
        </div>
      </div>
    </div>
  );
}
