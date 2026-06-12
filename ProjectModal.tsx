import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Github, X, Code, Globe, HelpCircle, QrCode } from "lucide-react";

interface ProjectModalProps {
  project: {
    title: string;
    description?: string;
    emoji?: string;
    image?: string;
    tech?: string[];
    liveUrl?: string;
    githubUrl?: string;
    buttons?: any[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function ProjectModal({ project, isOpen, onClose, accentColor = "var(--theme-accent)" }: ProjectModalProps) {
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !project) return null;

  const placeholderImage = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      {/* Backdrop motion trigger close */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <motion.div
        initial={{ scale: 0.9, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 15, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#070712] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] z-10 flex flex-col max-h-[85vh]"
        style={{ borderColor: `${accentColor}30`, boxShadow: `0 0 35px ${accentColor}15` }}
      >
        {/* Banner Image / Fallback Container */}
        <div className="relative h-44 sm:h-52 bg-black flex-shrink-0 border-b border-white/5 group">
          <img 
            src={project.image || placeholderImage} 
            alt={project.title}
            className="w-full h-full object-cover opacity-80"
            onError={(e: any) => {
              e.target.src = placeholderImage;
            }}
            referrerPolicy="no-referrer"
          />
          {/* Accent glow line at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: accentColor }} />
          
          {/* Floating Emoji Badge */}
          <div 
            className="absolute -bottom-4 left-6 w-10 h-10 rounded-lg bg-[#0d0d26] border border-white/10 flex items-center justify-center text-lg shadow-lg z-10"
            style={{ borderColor: `${accentColor}30` }}
          >
            {project.emoji || "💎"}
          </div>

          {/* Close X Button top right inside image section */}
          <button 
            id="modal_x_button"
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-zinc-400 hover:text-white transition-all transform hover:rotate-90 duration-300 text-xs"
            title="Dismiss detailed modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Info Content Area */}
        <div className="p-6 pt-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Title & Metadata Header */}
            <div>
              <span className="text-[7.5px] font-mono uppercase tracking-[0.2em] opacity-40 block">Project Endpoint Spec</span>
              <h2 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                {project.title || "Project Node"}
              </h2>
            </div>

            {/* Description Paragraph */}
            <p className="text-[10px] text-zinc-300 leading-relaxed font-sans font-light bg-white/[0.02] border border-white/5 rounded p-3 text-justify">
              {project.description || "No full documentation compile specified for this project. Ready for customized content injection and visual deployment links."}
            </p>

            {/* Tech Languages Used List */}
            {project.tech && project.tech.length > 0 && (
              <div className="space-y-1">
                <span className="text-[7px] font-mono uppercase tracking-widest text-[#fff]/40 font-bold">Compiled Stack</span>
                <div className="flex flex-wrap gap-1">
                  {project.tech.map((t, idx) => (
                    <span 
                      key={idx} 
                      className="text-[7px] px-1.8 py-0.5 border rounded uppercase font-black tracking-wider transition-colors"
                      style={{ 
                        color: accentColor, 
                        borderColor: `${accentColor}25`, 
                        backgroundColor: `${accentColor}08` 
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Live Links & Actions */}
          <div className="space-y-3 pt-2 border-t border-white/5 flex-shrink-0">
            <div className="flex gap-2">
              {project.liveUrl ? (
                <a 
                  id="modal_live_url"
                  href={project.liveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 text-center text-black text-[9px] font-mono uppercase tracking-wider font-extrabold rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow"
                  style={{ backgroundColor: accentColor }}
                >
                  <Globe className="w-3 h-3" /> Live Endpoint
                </a>
              ) : (
                <div className="flex-1 py-1.5 text-center text-zinc-500 bg-white/5 border border-white/5 text-[9px] font-mono uppercase tracking-wider font-bold rounded cursor-not-allowed flex items-center justify-center gap-1.5">
                  <Globe className="w-3 h-3 opacity-30" /> No Deployment
                </div>
              )}

              {project.githubUrl ? (
                <a 
                  id="modal_github_url"
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 text-center bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 text-[9px] font-mono uppercase tracking-wider font-bold rounded active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Github className="w-3 h-3" /> Code Gateway
                </a>
              ) : (
                <div className="flex-1 py-1.5 text-center text-zinc-500 bg-white/5 border border-white/5 text-[9px] font-mono uppercase tracking-wider font-bold rounded cursor-not-allowed flex items-center justify-center gap-1.5">
                  <Github className="w-3 h-3 opacity-30" /> Private Source
                </div>
              )}
            </div>

            {/* QR Code toggle action and rendering panel if liveUrl exists */}
            {project.liveUrl && (
              <div className="space-y-2">
                <button
                  id="modal_qrcode_toggle"
                  onClick={() => setShowQr(!showQr)}
                  className={`w-full py-1.5 text-center text-[9px] font-mono uppercase tracking-wider font-bold rounded transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    showQr 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {showQr ? "Hide QR Code" : "Scan Mobile QR Code"}
                </button>

                <AnimatePresence>
                  {showQr && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center justify-center p-3 bg-white/[0.02] border border-white/5 rounded-lg text-center space-y-2 overflow-hidden"
                    >
                      <div className="p-2 bg-white rounded-lg shadow-lg flex items-center justify-center select-text">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=050514&data=${encodeURIComponent(project.liveUrl)}`} 
                          alt="Live Project QR Code" 
                          className="w-32 h-32 select-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-0.5 max-w-full">
                        <span className="text-[7px] font-mono text-zinc-400 block uppercase tracking-wider">Scan code with mobile camera</span>
                        <span className="text-[7px] font-mono text-zinc-500 block truncate max-w-xs">{project.liveUrl}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Dynamic Custom Clickable Buttons */}
            {project.buttons && project.buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                {project.buttons.map((btn: any) => (
                  <a
                    key={btn.id}
                    href={btn.url || "#"}
                    target={btn.target || "_blank"}
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-center text-[9px] font-mono uppercase tracking-wider font-extrabold rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 px-2 shadow"
                    style={{
                      backgroundColor: btn.bgColor || accentColor,
                      color: btn.textColor || "#000000",
                      borderColor: btn.borderColor || "transparent",
                      borderWidth: btn.borderColor ? "1px" : "0px",
                      borderStyle: btn.borderColor ? "solid" : "none",
                    }}
                  >
                    {btn.label || "Action"}
                  </a>
                ))}
              </div>
            )}

            {/* Bottom Close Button */}
            <button 
              id="modal_close_button"
              onClick={onClose}
              className="w-full py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 text-[8px] font-mono uppercase tracking-widest rounded-lg transition-all"
            >
              Close Interface
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
