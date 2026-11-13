import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GAMURA Root Error Caught:", error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted local session flags
    try {
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#03050a] text-white flex flex-col items-center justify-center p-6 text-center font-sans select-none relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-[#0b0f19]/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-widest text-white">
                GAMURA Core Resynchronized
              </h1>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                {this.state.error?.message || "An operational boundary anomaly occurred."}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              Resume Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
