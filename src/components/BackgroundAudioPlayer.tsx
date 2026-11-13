import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Music } from "lucide-react";

interface BackgroundAudioPlayerProps {
  showToast: (icon: string, title: string, desc: string) => void;
}

export const BackgroundAudioPlayer: React.FC<BackgroundAudioPlayerProps> = ({ showToast }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string>("Deep Space Station");
  const [volume, setVolume] = useState<number>(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const tracks = [
    { name: "Deep Space Station", desc: "Soft low-frequency ambient drone" },
    { name: "Quantum Rain", desc: "Filtered spatial rain soundscape" },
    { name: "Cosmic Drift", desc: "Harmonic binaural synth loop" }
  ];

  const startAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      stopAudioInternal();

      const ctx = audioCtxRef.current;
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      if (currentTrack === "Deep Space Station") {
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(55, ctx.currentTime);
        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(82.41, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start();
        osc2.start();
        oscillatorsRef.current = [osc1, osc2];
      } else if (currentTrack === "Quantum Rain") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();
        (oscillatorsRef.current as any) = [noise];
      } else {
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(110, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(220, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start();
        osc2.start();
        oscillatorsRef.current = [osc1, osc2];
      }

      setIsPlaying(true);
      showToast("🎵", "Audio Playing", `Now playing: ${currentTrack}`);
    } catch (err) {
      console.error("Web Audio API error:", err);
      showToast("⚠️", "Audio Error", "Could not start audio context.");
    }
  };

  const stopAudioInternal = () => {
    oscillatorsRef.current.forEach((osc: any) => {
      try {
        if (osc.stop) osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudioInternal();
      setIsPlaying(false);
      showToast("🔇", "Audio Paused", "Ambient loop stopped.");
    } else {
      startAudio();
    }
  };

  useEffect(() => {
    if (isPlaying && gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current?.currentTime || 0);
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      startAudio();
    }
  }, [currentTrack]);

  useEffect(() => {
    return () => {
      stopAudioInternal();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 font-sans text-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/70 text-zinc-900 flex items-center justify-center shrink-0">
            <Music size={14} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 tracking-tight leading-tight">Ambient Sound</h3>
            <p className="text-[10px] text-zinc-500 leading-tight">Focus Audio Synthesizer</p>
          </div>
        </div>
        <button
          onClick={togglePlay}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isPlaying
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-200"
          }`}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} className="translate-x-0.5" />}
        </button>
      </div>

      {/* Compact Track Selector */}
      <div className="grid grid-cols-1 gap-1.5">
        {tracks.map((t) => (
          <button
            key={t.name}
            onClick={() => setCurrentTrack(t.name)}
            className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              currentTrack === t.name
                ? "bg-zinc-900 text-white border-zinc-900 font-medium shadow-xs"
                : "bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100"
            }`}
          >
            <div>
              <span className="text-[11px] block font-semibold leading-tight">{t.name}</span>
              <span className={`text-[10px] leading-tight ${currentTrack === t.name ? "text-zinc-300" : "text-zinc-500"}`}>{t.desc}</span>
            </div>
            {currentTrack === t.name && isPlaying && (
              <span className="flex gap-0.5 items-end h-2.5">
                <span className="w-0.5 bg-white animate-pulse h-full rounded-full" />
                <span className="w-0.5 bg-white animate-pulse h-1.5 rounded-full" />
                <span className="w-0.5 bg-white animate-pulse h-2 rounded-full" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Volume Slider */}
      <div className="space-y-1 pt-1.5 border-t border-zinc-100">
        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
          <span>Volume</span>
          <span className="text-zinc-900 font-semibold">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-zinc-900 cursor-pointer h-1.5"
        />
      </div>
    </div>
  );
};
