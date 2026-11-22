import React from "react";
import { ArrowLeftRight, CreditCard, RefreshCw, Wallet } from "lucide-react";
import type {
  CardWalletPairState,
  SyncPulseState,
} from "../utils/gamuraCardWalletSync";

interface CardWalletSyncIndicatorProps {
  connected: boolean;
  pulse: SyncPulseState;
  pairState?: CardWalletPairState | null;
  dark?: boolean;
  variant?: "compact" | "full";
}

export default function CardWalletSyncIndicator({
  connected,
  pulse,
  pairState = null,
  dark = false,
  variant = "full",
}: CardWalletSyncIndicatorProps) {
  const isActivelySyncing = connected && pulse.phase === "syncing";

  if (variant === "compact") {
    if (!connected) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
            dark ? "text-zinc-400" : "text-[#6E6E73]"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>Not connected</span>
        </span>
      );
    }

    return (
      <span
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
          isActivelySyncing ? "text-[#0a8f5a]" : dark ? "text-emerald-400" : "text-[#0a8f5a]"
        }`}
      >
        {isActivelySyncing ? (
          <>
            <RefreshCw size={11} className="animate-spin shrink-0" />
            <span className="animate-pulse">Syncing...</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0a8f5a]" />
            </span>
            <span>
              Synced · Live{pairState?.peerConnected ? " · QR Paired" : ""}
            </span>
          </>
        )}
      </span>
    );
  }

  const surfaceTrack = dark
    ? "bg-zinc-900/80 border-zinc-800 text-zinc-200"
    : "bg-[#F5F5F7] border-zinc-200/80 text-[#1D1D1F]";
  const mutedText = dark ? "text-zinc-400" : "text-[#6E6E73]";

  return (
    <div
      aria-live="polite"
      className={`rounded-2xl border px-3.5 py-2.5 transition-colors ${surfaceTrack}`}
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Left Node: Gcard */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
              connected
                ? "bg-[#0a8f5a] text-white"
                : dark
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-zinc-200 text-zinc-500"
            }`}
          >
            <CreditCard size={13} />
          </div>
          <span className="text-xs font-bold tracking-tight">Gcard</span>
        </div>

        {/* Center Real-Time Data Transfer Bridge */}
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 px-1">
          <div className="w-full relative flex items-center justify-center h-4">
            <div
              className={`w-full h-[2px] rounded-full overflow-hidden ${
                connected
                  ? dark
                    ? "bg-emerald-950"
                    : "bg-emerald-200/80"
                  : dark
                    ? "bg-zinc-800"
                    : "bg-zinc-300"
              }`}
            >
              {connected && (
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isActivelySyncing
                      ? "w-2/3 bg-gradient-to-r from-emerald-400 via-[#0a8f5a] to-emerald-400 animate-pulse translate-x-1/4"
                      : "w-full bg-[#0a8f5a]/75"
                  }`}
                />
              )}
            </div>

            <div
              className={`absolute px-1.5 py-0.5 rounded-full flex items-center justify-center border ${
                connected
                  ? isActivelySyncing
                    ? "bg-[#0a8f5a] border-emerald-400 text-white shadow-xs"
                    : dark
                      ? "bg-[#1C1C1E] border-emerald-700/70 text-emerald-400"
                      : "bg-white border-emerald-300 text-[#0a8f5a]"
                  : dark
                    ? "bg-[#1C1C1E] border-zinc-700 text-zinc-500"
                    : "bg-white border-zinc-300 text-zinc-400"
              }`}
            >
              {isActivelySyncing ? (
                <RefreshCw size={10} className="animate-spin" />
              ) : (
                <ArrowLeftRight size={10} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold truncate max-w-full">
            {!connected ? (
              <span className={mutedText}>Disconnected</span>
            ) : isActivelySyncing ? (
              <span className="text-[#0a8f5a] flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0a8f5a] animate-ping" />
                <span>Syncing...</span>
              </span>
            ) : (
              <span className="text-[#0a8f5a] flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0a8f5a]" />
                <span>
                  {pairState
                    ? pairState.peerConnected
                      ? `QR Paired (${pairState.pairCode}) · Live`
                      : `Synced · Pair ${pairState.pairCode}`
                    : "Synced · Live"}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Node: Gwallet */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold tracking-tight">Gwallet</span>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
              connected
                ? "bg-[#0a8f5a] text-white"
                : dark
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-zinc-200 text-zinc-500"
            }`}
          >
            <Wallet size={13} />
          </div>
        </div>
      </div>

      {connected && isActivelySyncing && pulse.label && (
        <div
          className={`mt-1 text-[10px] text-center font-medium truncate ${mutedText}`}
        >
          {pulse.label}
        </div>
      )}
    </div>
  );
}
