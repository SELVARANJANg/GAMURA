import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2, Sparkles, User, Lock, Copy, Check, Linkedin, Code, Image as ImageIcon, Video, Calculator, BarChart3, Activity, Home, GraduationCap, Trophy, Mail, Briefcase, Phone, MapPin } from "lucide-react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: "user" | "model";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function App() {
  const logoUrl = "https://lh3.googleusercontent.com/d/1gdDmsxtjEHxq4qvmshBQL3eX3c1cOSWY";
  const mainImageUrl = "https://lh3.googleusercontent.com/d/1Y8dAHnTiq1wiTv4QdLhAhOMmpMlBieMz";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"home" | "gpg" | "login" | "history" | "signup" | "about" | "portfolio">("home");

  // Login/Signup State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<{username: string, nickname: string} | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{username: string, password: string, nickname: string}[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Multi-Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [gpgInput, setGpgInput] = useState("");
  const [isGpgLoading, setIsGpgLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [portfolioTab, setPortfolioTab] = useState<"home" | "education" | "achievement" | "contact" | "projects">("home");
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<{title: string, img: string} | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanPrompt = (text: string) => {
    // Remove markdown code blocks if present
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  };

  const currentChat = chats.find(c => c.id === currentChatId) || null;
  const gpgMessages = currentChat?.messages || [];

  const startNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      timestamp: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setCurrentPage("gpg");
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gpgMessages]);

  const handleGpgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpgInput.trim() || isGpgLoading) return;

    let activeChatId = currentChatId;
    let updatedChats = [...chats];

    // If no active chat, create one
    if (!activeChatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: gpgInput.slice(0, 30) + (gpgInput.length > 30 ? "..." : ""),
        messages: [],
        timestamp: Date.now()
      };
      updatedChats = [newChat, ...updatedChats];
      activeChatId = newChat.id;
      setCurrentChatId(activeChatId);
    }

    const userMessage: Message = { role: "user", content: gpgInput };
    
    // Update local state immediately for UI
    const chatIndex = updatedChats.findIndex(c => c.id === activeChatId);
    if (chatIndex !== -1) {
      const isFirstMessage = updatedChats[chatIndex].messages.length === 0;
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        messages: [...updatedChats[chatIndex].messages, userMessage],
        title: isFirstMessage ? (gpgInput.slice(0, 30) + (gpgInput.length > 30 ? "..." : "")) : updatedChats[chatIndex].title
      };
    }
    setChats(updatedChats);
    setGpgInput("");
    setIsGpgLoading(true);

    try {
      const toolContext = selectedTool ? `[TOOL: ${selectedTool.toUpperCase()}] ` : "";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: updatedChats[chatIndex].messages.map(m => ({
          role: m.role,
          parts: [{ text: m.role === "user" ? toolContext + m.content : m.content }]
        })),
        config: {
          systemInstruction: `You are the Gamura Prompt Generator (GPG) v3.1. Your output MUST be ONLY the generated prompt.
          
          STRICT RULES:
          1. NO conversational filler.
          2. NO markdown formatting.
          3. NO unwanted symbols.
          4. Output ONLY the raw prompt text.
          
          TOOL-SPECIFIC OPTIMIZATION:
          - CODE: Focus on logic, language-specific best practices, and architecture.
          - IMAGE: Focus on cinematic lighting, camera specs (35mm, f/1.8), and artistic style.
          - VIDEO: Focus on camera movement (pan, tilt, zoom), frame rate, and temporal consistency.
          - MATHS: Focus on step-by-step logic, precision, and mathematical notation.
          - CHART: Focus on data structure, axes labels, and visual clarity.
          - GRAPH: Focus on nodes, edges, relationships, and topological layout.
          
          SPEED:
          - Provide the absolute best version immediately.`,
          temperature: 0.4,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW
          }
        }
      });

      const modelMessage: Message = {
        role: "model",
        content: response.text || "I couldn't generate a prompt right now. Please try again.",
      };

      setChats(prev => prev.map(c => 
        c.id === activeChatId 
          ? { ...c, messages: [...c.messages, modelMessage] }
          : c
      ));
    } catch (error) {
      console.error("GPG Error:", error);
      const errorMessage: Message = { 
        role: "model", 
        content: "Error: Could not connect to the AI service. Please ensure your GEMINI_API_KEY is configured in the Secrets panel." 
      };
      setChats(prev => prev.map(c => 
        c.id === activeChatId 
          ? { ...c, messages: [...c.messages, errorMessage] }
          : c
      ));
    } finally {
      setIsGpgLoading(false);
    }
  };

  if (currentPage === "portfolio") {
    const tabs = [
      { id: "home", label: "Home", icon: <Home size={16} /> },
      { id: "education", label: "Education", icon: <GraduationCap size={16} /> },
      { id: "achievement", label: "Achievement", icon: <Trophy size={16} /> },
      { id: "projects", label: "Projects", icon: <Briefcase size={16} /> },
      { id: "contact", label: "Contact", icon: <Mail size={16} /> },
    ];

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Portfolio Header */}
        <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <button 
            onClick={() => setCurrentPage("home")}
            className="text-zinc-400 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest"
          >
            ← Exit
          </button>
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPortfolioTab(tab.id as any)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full flex items-center gap-2 ${
                  portfolioTab === tab.id 
                    ? "bg-black text-white shadow-lg shadow-black/20" 
                    : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Portfolio Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={portfolioTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {portfolioTab === "home" && (
                <div className="space-y-16">
                  <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-2 border-zinc-900 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <img 
                          src="https://lh3.googleusercontent.com/d/1X_b-gsSwt_-LDOt7t8IyFqop60mHBUCY" 
                          alt="Profile" 
                          className="w-full h-full object-cover transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div className="space-y-6 flex-1 text-center md:text-left">
                      <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-zinc-900">Portfolio</h1>
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Aspiring Developer & AI Enthusiast</p>
                      </div>
                      <p className="text-zinc-500 max-w-md leading-relaxed mx-auto md:mx-0">
                        Welcome to my professional space. I am a dedicated student and aspiring developer, currently building the future through code and AI.
                      </p>
                      <button 
                        onClick={() => setPortfolioTab("contact")}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                      >
                        Contact Me
                        <Mail size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-black transition-all duration-500">
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Current Location</h3>
                        <p className="text-xl font-bold tracking-tight text-zinc-900">MADHURAVOYAL, CHENNAI</p>
                        <p className="text-sm text-zinc-500">TAMIL NADU, INDIA</p>
                      </div>
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100 group-hover:bg-black group-hover:text-white transition-all duration-500">
                        <MapPin size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {portfolioTab === "education" && (
                <div className="space-y-16">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900">Education & Certifications</h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A journey of continuous learning, combining formal academic studies with specialized technical certifications.
                    </p>
                  </div>

                  {/* Formal Education - Tech Timeline Style */}
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border-b border-zinc-100 pb-2">Academic Path</h3>
                    <div className="grid gap-6">
                      {[
                        { 
                          year: "2026 - Present", 
                          degree: "Bachelor of Computer Applications (BCA)", 
                          school: "First Year Student",
                          status: "In Progress",
                          details: "Focusing on core computing principles, programming, and database management."
                        },
                        { 
                          year: "2024 - 2025", 
                          degree: "12th Grade (Higher Secondary)", 
                          school: "Bharathi Matriculation Higher Secondary School",
                          status: "Completed",
                          details: "Specialized in Computer Science and Mathematics."
                        }
                      ].map((edu, i) => (
                        <div key={i} className="group p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-black transition-all duration-500 relative overflow-hidden">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                  {edu.year}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {edu.status}
                                </span>
                              </div>
                              <h4 className="text-xl font-bold tracking-tight text-zinc-900">{edu.degree}</h4>
                              <p className="text-sm font-medium text-zinc-600">{edu.school}</p>
                              <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">{edu.details}</p>
                            </div>
                            <GraduationCap className="text-zinc-200 group-hover:text-black transition-colors duration-500" size={40} />
                          </div>
                          {/* Tech background element */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 rounded-full -mr-16 -mt-16 group-hover:bg-zinc-200 transition-colors duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications - Tech Card Style */}
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border-b border-zinc-100 pb-2">Technical Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 border-2 border-zinc-900 rounded-[2rem] bg-white space-y-6 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
                            <Sparkles className="text-white" size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold leading-tight">Google Gemini Certified Student</h4>
                            <p className="text-xs text-zinc-500 font-medium">Verified by Google Cloud / AI</p>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Advanced certification in Generative AI, prompt engineering, and Gemini model integration.
                          </p>
                        </div>
                        <button 
                          onClick={() => setShowCertificateModal(true)}
                          className="flex items-center justify-between w-full px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                          View Certificate
                          <ImageIcon size={14} />
                        </button>
                      </div>

                      <div className="p-8 border border-zinc-100 rounded-[2rem] bg-zinc-50 space-y-6 flex flex-col justify-center items-center text-center border-dashed">
                        <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center">
                          <Code className="text-zinc-400" size={20} />
                        </div>
                        <p className="text-xs text-zinc-400 font-medium px-4">
                          More certifications in progress...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {portfolioTab === "achievement" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900">Achievements</h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A collection of certifications and milestones achieved through dedicated learning and project development.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: "Certificate 1", img: "https://lh3.googleusercontent.com/d/1S4-Pbg4Thuhtfcre2ZzLy50V7KyVidLT" },
                      { title: "Certificate 2", img: "https://lh3.googleusercontent.com/d/1eoBSv6wF7gSiTJLGhkOP2qmYxRc90chh" },
                      { title: "Certificate 3", img: "https://lh3.googleusercontent.com/d/119SgtcAstv_4_9gD6z1dLNmgomGyIhtC" },
                      { title: "Certificate 4", img: "https://lh3.googleusercontent.com/d/1esS_LDdf7s2Jrwze0WYmjVOgFMmPQr80" },
                      { title: "Certificate 5", img: "https://lh3.googleusercontent.com/d/1LpO8rlqbvF6odUZvhvajxcplWBd8rhLV" },
                      { title: "Certificate 6", img: "https://lh3.googleusercontent.com/d/1R6I1KI_Wi3cpHLOory2jGY2nd1CVqVDb" },
                      { title: "Certificate 7", img: "https://lh3.googleusercontent.com/d/1iQg5hNZvU5AyeQy7tCwF-AYGJnuu5wY9" },
                      { title: "Certificate 8", img: "https://lh3.googleusercontent.com/d/1_yo_YItLXuBwj4d5r0GPzWQzYXzDOL-c" }
                    ].map((ach, i) => (
                      <div 
                        key={i} 
                        className="group p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-black transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
                        onClick={() => setSelectedAchievement({ title: ach.title, img: ach.img })}
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 group-hover:bg-black transition-colors duration-500">
                            <Trophy className="text-zinc-400 group-hover:text-white transition-colors duration-500" size={20} />
                          </div>
                          <h3 className="font-bold text-lg tracking-tight">{ach.title}</h3>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                          <span>View Certificate</span>
                          <ImageIcon size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolioTab === "projects" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-zinc-900">Featured Projects</h2>
                    <p className="text-zinc-500 text-sm max-w-lg">
                      A showcase of my technical work, focusing on AI integration and modern web development.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {[
                      { name: "GAMURA", type: "FIRST PROJECT" }
                    ].map((project, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-center justify-between p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 group hover:border-black transition-all duration-500 gap-8">
                        <div className="space-y-4 text-center md:text-left">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{project.type}</span>
                            <h3 className="text-3xl font-bold tracking-tight text-zinc-900">{project.name}</h3>
                          </div>
                          <button 
                            onClick={() => setShowProjectModal(true)}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
                          >
                            View Project
                            <ImageIcon size={14} />
                          </button>
                        </div>
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100 group-hover:bg-black group-hover:text-white transition-all duration-500">
                          <Briefcase size={32} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolioTab === "contact" && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="w-full md:w-1/2 space-y-8">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-serif font-medium tracking-tight text-zinc-900">Contact</h2>
                        <h3 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">Selvaranjan G</h3>
                        <p className="text-zinc-500">Interested in working together? Let's connect and build something extraordinary.</p>
                      </div>
                      
                      <div className="space-y-4">
                        <a 
                          href="mailto:selvaranjang@gmail.com"
                          className="flex items-center gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-black transition-colors"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
                            <Mail className="text-zinc-400 group-hover:text-black transition-colors" size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</p>
                            <p className="text-sm font-medium">selvaranjang@gmail.com</p>
                          </div>
                        </a>

                        <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-black transition-colors">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
                            <Phone className="text-zinc-400 group-hover:text-black transition-colors" size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mobile</p>
                            <p className="text-sm font-medium">+91 9514384345</p>
                          </div>
                        </div>

                        <a 
                          href="https://linkedin.com/in/selvaranjang"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-black transition-colors"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
                            <Linkedin className="text-zinc-400 group-hover:text-black transition-colors" size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">LinkedIn</p>
                            <p className="text-sm font-medium">linkedin.com/in/selvaranjang</p>
                          </div>
                        </a>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2">
                      <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border-2 border-zinc-900 shadow-2xl relative group">
                        <img 
                          src="https://lh3.googleusercontent.com/d/1zZfXn3YsmmOGXxzJ6zNKAmW6BFusX0NH" 
                          alt="Selvaranjan G" 
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                          <p className="text-white text-xs font-bold uppercase tracking-[0.3em]">Selvaranjan G</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Certificate Modal */}
        <AnimatePresence>
          {showCertificateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setShowCertificateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1o6tralnliWDBJcAR62QUlpFuDuOHQR1W" 
                    alt="Google Gemini Certificate" 
                    className="w-full h-auto rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Modal */}
        <AnimatePresence>
          {showProjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setShowProjectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowProjectModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x" 
                    alt="GAMURA Project" 
                    className="w-full h-auto rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12"
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-2">
                  <img 
                    src={selectedAchievement.img} 
                    alt={selectedAchievement.title} 
                    className="w-full h-auto rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (currentPage === "history") {
    return (
      <div className="min-h-screen bg-white relative flex flex-col p-6">
        <button 
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium"
        >
          ← Back
        </button>

        <div className="max-w-2xl mx-auto w-full mt-12 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">CHAT HISTORY</h2>
            <p className="text-sm text-zinc-500">Your previous prompt generations</p>
          </div>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                <p className="text-zinc-400 text-sm">No history yet. Start a new chat!</p>
              </div>
            ) : (
              chats.map((chat) => (
                <motion.button
                  key={chat.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setCurrentPage("gpg");
                  }}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all group border border-zinc-100"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-zinc-900 line-clamp-1">{chat.title}</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
                      {new Date(chat.timestamp).toLocaleDateString()} • {chat.messages.length} messages
                    </span>
                  </div>
                  <div className="text-zinc-300 group-hover:text-black transition-colors">
                    <Send size={16} />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "signup") {
    return (
      <div className="min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
        <button 
          onClick={() => {
            setAuthError(null);
            setCurrentPage("login");
          }}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium"
        >
          ← Back to Login
        </button>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 mx-auto">
              <img 
                src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x" 
                alt="GPG Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase">Create Account</h2>
              <p className="text-sm text-zinc-500">Join Gamura to save your progress</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            setAuthError(null);
            
            const userExists = registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
            if (userExists) {
              setAuthError("This username is already taken. Please choose another.");
              return;
            }

            const newUser = { username, password, nickname };
            setRegisteredUsers(prev => [...prev, newUser]);
            
            // Clear inputs for login
            setUsername("");
            setPassword("");
            setNickname("");
            
            alert("Account created successfully! Now please sign in.");
            setCurrentPage("login");
          }}>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl border border-red-100 text-center"
              >
                {authError}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Nickname</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-4"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Already have an account? <span onClick={() => {
              setAuthError(null);
              setCurrentPage("login");
            }} className="text-black font-medium cursor-pointer hover:underline">Sign in</span>
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "login") {
    if (isLoggedIn && currentUserInfo) {
      return (
        <div className="min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-8 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <Check className="text-green-600" size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">SIGN IN FINISHED</h2>
                <p className="text-zinc-500">Welcome back to Gamura</p>
              </div>
              
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nickname</span>
                  <span className="text-sm font-semibold text-zinc-900">{currentUserInfo.nickname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Username</span>
                  <span className="text-sm font-semibold text-zinc-900">@{currentUserInfo.username}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={() => setCurrentPage("home")}
                  className="w-full bg-black text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98]"
                >
                  Go to Home
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setCurrentUserInfo(null);
                      setCurrentPage("home");
                    }}
                    className="bg-zinc-100 text-zinc-600 rounded-xl py-3 font-semibold text-xs hover:bg-zinc-200 transition-all active:scale-[0.98]"
                  >
                    Sign Out
                  </button>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-50 text-red-600 rounded-xl py-3 font-semibold text-xs hover:bg-red-100 transition-all active:scale-[0.98]"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setRegisteredUsers(prev => prev.filter(u => u.username !== currentUserInfo.username));
                        setIsLoggedIn(false);
                        setCurrentUserInfo(null);
                        setShowDeleteConfirm(false);
                        setCurrentPage("home");
                      }}
                      className="bg-red-600 text-white rounded-xl py-3 font-semibold text-xs hover:bg-red-700 transition-all active:scale-[0.98] animate-pulse"
                    >
                      Confirm Delete?
                    </button>
                  )}
                </div>
                
                {showDeleteConfirm && (
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 uppercase tracking-widest font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 left-4 flex gap-2">
          <button 
            onClick={() => setCurrentPage("home")}
            className="p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium"
          >
            ← Back
          </button>
          <button 
            onClick={() => setCurrentPage("home")}
            className="p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium border border-zinc-100 rounded-lg"
          >
            Skip
          </button>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 mx-auto">
              <img 
                src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x" 
                alt="GPG Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">GAMURA LOGIN</h2>
              <p className="text-sm text-zinc-500">Sign in to save your chat history</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            setAuthError(null);

            const user = registeredUsers.find(u => 
              u.username.toLowerCase() === username.toLowerCase() && 
              u.password === password
            );

            if (user) {
              setCurrentUserInfo({
                username: user.username,
                nickname: user.nickname
              });
              setIsLoggedIn(true);
            } else {
              const usernameExists = registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
              if (usernameExists) {
                setAuthError("Incorrect password. Please try again.");
              } else {
                setAuthError("Account not found. Please sign up first.");
              }
            }
          }}>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl border border-red-100 text-center"
              >
                {authError}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-4"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Don't have an account? <span onClick={() => {
              setAuthError(null);
              setCurrentPage("signup");
            }} className="text-black font-medium cursor-pointer hover:underline">Sign up</span>
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "about") {
    return (
      <div className="min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
        <button 
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium"
        >
          ← Back
        </button>
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 uppercase tracking-[0.2em]">
              About <span className="text-red-600">GA</span><span className="text-blue-600">M</span><span className="text-green-600">UR</span><span className="text-yellow-500">A</span>
            </h2>
            <div className="h-px w-20 bg-zinc-200 mx-auto"></div>
          </div>
          {/* Founder Information Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black text-white p-8 rounded-3xl shadow-2xl text-center space-y-4"
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Legacy</p>
            <h3 className="text-xl md:text-2xl font-light tracking-tight">
              FOUNDER OF <span className="font-bold">GAMURA</span> IS <span className="text-zinc-400">SELVARANJAN GANTHI</span>
            </h3>
            <div className="pt-4">
              <a 
                href="https://www.linkedin.com/in/selvaranjang" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors border border-zinc-800 px-4 py-2 rounded-full"
              >
                <Linkedin size={14} />
                Connect on LinkedIn
              </a>
            </div>
          </motion.div>

          {/* About Section Image */}
          <div className="w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl border border-zinc-100">
            <img 
              src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x" 
              alt="Gamura About" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "portfolio") {
    return (
      <div className="min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
        <button 
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium"
        >
          ← Back
        </button>
        {/* Blank White Page */}
      </div>
    );
  }

  if (currentPage === "gpg") {
    return (
      <div className="min-h-screen bg-white relative flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="pt-4 pb-2 w-full flex justify-center px-16 border-b border-zinc-50 bg-white/80 backdrop-blur-md z-10 relative">
          <span className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase">
            <span className="text-red-600">GA</span>
            <span className="text-blue-600">M</span>
            <span className="text-green-600">UR</span>
            <span className="text-yellow-500">A</span>
            <span className="text-zinc-400 ml-1"> PROMPT GENERATOR</span>
          </span>
          <button 
            onClick={startNewChat}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-black border border-black px-3 py-1 rounded-full hover:bg-black hover:text-white transition-all uppercase tracking-tighter"
          >
            New Chat
          </button>
        </div>
        
        <button 
          onClick={() => setCurrentPage("home")}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black transition-colors text-xs font-medium z-20"
        >
          ← Back
        </button>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
        >
          {gpgMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-zinc-100">
                <img 
                  src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x" 
                  alt="GPG Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-zinc-900 font-medium">Ready to generate?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Describe what you want to create, and I'll craft the perfect prompt for you.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {gpgMessages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl relative group ${
                    m.role === "user"
                      ? "bg-black text-white rounded-tr-none shadow-lg shadow-black/5"
                      : "bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-200 selection:text-blue-900 pr-6">
                    {m.role === "model" ? cleanPrompt(m.content) : m.content}
                  </p>
                  
                  <button
                    onClick={() => copyToClipboard(m.role === "model" ? cleanPrompt(m.content) : m.content, i)}
                    className={`absolute right-2 top-2 p-1.5 transition-all rounded-lg backdrop-blur-sm ${
                      m.role === "user"
                        ? "text-zinc-500 hover:text-white bg-white/10 opacity-40 group-hover:opacity-100"
                        : "text-zinc-300 hover:text-black bg-white/50 opacity-40 md:opacity-0 group-hover:opacity-100"
                    }`}
                    title="Copy"
                  >
                    {copiedId === i ? <Check size={12} className={m.role === "user" ? "text-green-400" : "text-green-600"} /> : <Copy size={12} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGpgLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-50 p-4 rounded-2xl rounded-tl-none border border-zinc-100 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">Crafting your prompt...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Search Bar (Prompt Input) at the Bottom */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto mb-4 flex flex-col items-center">
            <button
              onClick={() => setShowTools(!showTools)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-100 hover:border-zinc-300 mb-4 bg-white shadow-sm"
            >
              <Sparkles size={14} className={showTools ? "text-yellow-500" : "text-zinc-400"} />
              {showTools ? "Hide Tools" : "Show Tools"}
            </button>

            <AnimatePresence>
              {showTools && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  className="flex flex-wrap gap-2 justify-center overflow-hidden"
                >
                  {[
                    { id: 'code', icon: <Code size={14} />, label: 'Code' },
                    { id: 'image', icon: <ImageIcon size={14} />, label: 'Image' },
                    { id: 'video', icon: <Video size={14} />, label: 'Video' },
                    { id: 'maths', icon: <Calculator size={14} />, label: 'Maths' },
                    { id: 'chart', icon: <BarChart3 size={14} />, label: 'Chart' },
                    { id: 'graph', icon: <Activity size={14} />, label: 'Graph' },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedTool === tool.id 
                          ? "bg-black text-white border-black shadow-md" 
                          : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300"
                      }`}
                    >
                      {tool.icon}
                      {tool.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <form 
            onSubmit={handleGpgSubmit}
            className="max-w-3xl mx-auto relative group"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={gpgInput}
                onChange={(e) => setGpgInput(e.target.value)}
                placeholder="Describe your vision..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black focus:bg-white transition-all text-sm shadow-sm placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={!gpgInput.trim() || isGpgLoading}
                className="absolute right-3 p-2.5 bg-black text-white rounded-xl hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-black transition-all shadow-md active:scale-95"
              >
                {isGpgLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-[9px] text-center text-zinc-300 mt-4 tracking-widest uppercase font-medium">
              Gamura Intelligence • Powered by GAMURA
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col overflow-hidden">
      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            />
            {/* Menu Bar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 md:w-80 bg-black z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex justify-end">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-zinc-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 px-6 flex flex-col items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setCurrentPage("gpg");
                    setIsMenuOpen(false);
                  }}
                  className="text-4xl font-bold tracking-widest font-sans transition-colors mb-8"
                >
                  <span className="text-red-600">G</span>
                  <span className="text-yellow-500">P</span>
                  <span className="text-green-600">G</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentPage("login");
                    setIsMenuOpen(false);
                  }}
                  className="text-white text-sm font-semibold tracking-[0.2em] uppercase hover:text-zinc-400 transition-colors mb-4"
                >
                  GAMURA LOGIN
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentPage("history");
                    setIsMenuOpen(false);
                  }}
                  className="text-white text-sm font-semibold tracking-[0.2em] uppercase hover:text-zinc-400 transition-colors mb-4"
                >
                  HISTORY
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentPage("about");
                    setIsMenuOpen(false);
                  }}
                  className="text-white text-sm font-semibold tracking-[0.2em] uppercase hover:text-zinc-400 transition-colors"
                >
                  ABOUT
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Left Logo (Clickable) */}
      <div className="p-4 absolute top-0 left-0 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5"
        >
          <img
            src={logoUrl}
            alt="Gamura Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.button>
      </div>

      {/* Top Right Portfolio Button */}
      <div className="p-4 absolute top-0 right-0 z-10">
        <button
          onClick={() => setCurrentPage("portfolio")}
          className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 transition-all border border-black"
        >
          Portfolio
        </button>
      </div>

      {/* Center Image */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl w-full"
        >
          <img
            src={mainImageUrl}
            alt="Gamura Main"
            className="w-full h-auto object-contain drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

    </div>
  );
}
