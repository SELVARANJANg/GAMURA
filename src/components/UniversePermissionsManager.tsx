import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Camera,
  Clipboard,
  FileDown,
  HardDrive,
  Image as ImageIcon,
  Info,
  MapPin,
  MessageSquare,
  Mic,
  Monitor,
  Music,
  RefreshCw,
  Users,
  Video,
  X,
} from "lucide-react";

export interface AllowAccessPermissions {
  camera: boolean;
  messages: boolean;
  video: boolean;
  microphone: boolean;
  storage: boolean;
  notifications: boolean;
  photosMedia: boolean;
  screenCapture: boolean;
  clipboard: boolean;
  location: boolean;
  filesDownloads: boolean;
  contactsProfile: boolean;
  audioPlayback: boolean;
  backgroundSync: boolean;
}

export const DEFAULT_ALLOW_ACCESS: AllowAccessPermissions = {
  camera: true,
  messages: true,
  video: true,
  microphone: true,
  storage: true,
  notifications: true,
  photosMedia: true,
  screenCapture: true,
  clipboard: true,
  location: false,
  filesDownloads: true,
  contactsProfile: true,
  audioPlayback: true,
  backgroundSync: true,
};

type BrowserPermState = "granted" | "denied" | "prompt" | "checking" | "workspace";
type PermCategory = "all" | "hardware" | "communication" | "storage";

interface PermissionDescriptorItem {
  key: keyof AllowAccessPermissions;
  toggleLabel: string;
  shortName: string;
  category: Exclude<PermCategory, "all">;
  explainWhy: string;
  detailedWhy: string;
  usedInApps: string;
  icon: React.ReactNode;
  iconBg: string;
  browserApiNames?: string[];
  supportsBrowserRequest?: boolean;
}

const PERMISSION_CATALOG: PermissionDescriptorItem[] = [
  {
    key: "camera",
    toggleLabel: "Allow Camera Access",
    shortName: "Camera",
    category: "hardware",
    explainWhy:
      "Explain why: Used by Gamura Camera (/camera) for live viewfinding & capture, and Universe Settings / Join Selvaranjan for profile avatars.",
    detailedWhy:
      "Enables your device camera strictly when you open the viewfinder in Gamura Camera or snap a photo for your Gamura profile. Video frames stay locally in your browser until you save or upload them.",
    usedInApps: "Gamura Camera · Profile Settings · Join Selvaranjan",
    icon: <Camera size={15} />,
    iconBg: "bg-sky-500 text-white",
    browserApiNames: ["camera"],
    supportsBrowserRequest: true,
  },
  {
    key: "video",
    toggleLabel: "Allow Video Access",
    shortName: "Video",
    category: "hardware",
    explainWhy:
      "Explain why: Used by Gamura Camera video recording and Gamura Veo (/veo) for clip playback, trimming, and MP4/WebM studio rendering.",
    detailedWhy:
      "Allows live video frame streaming, canvas recording in Gamura Camera Video mode, and local MediaRecorder encoding inside Gamura Veo without uploading unedited clips.",
    usedInApps: "Gamura Veo · Gamura Camera Video Mode",
    icon: <Video size={15} />,
    iconBg: "bg-indigo-500 text-white",
    browserApiNames: ["camera"],
    supportsBrowserRequest: true,
  },
  {
    key: "microphone",
    toggleLabel: "Allow Microphone Access",
    shortName: "Microphone",
    category: "hardware",
    explainWhy:
      "Explain why: Used to record audio tracks in Gamura Camera Video mode and spoken voiceovers inside Gamura Veo Studio.",
    detailedWhy:
      "Activates your microphone only while actively recording video with audio or recording a voiceover clip inside Gamura Veo. Never listens in the background.",
    usedInApps: "Gamura Camera Video · Gamura Veo Voiceover",
    icon: <Mic size={15} />,
    iconBg: "bg-orange-500 text-white",
    browserApiNames: ["microphone"],
    supportsBrowserRequest: true,
  },
  {
    key: "notifications",
    toggleLabel: "Allow Notification Access",
    shortName: "Notifications",
    category: "communication",
    explainWhy:
      "Explain why: Used for live Universe broadcast banners, Daily Streak check-in reminders, and real-time sync alerts.",
    detailedWhy:
      "Lets Gamura show timely in-app Apple alert banners and optional browser push notices when team members send broadcasts or your daily streak is ready.",
    usedInApps: "Universe Broadcasts · Daily Streak · Workspace Alerts",
    icon: <Bell size={15} />,
    iconBg: "bg-rose-500 text-white",
    browserApiNames: ["notifications"],
    supportsBrowserRequest: true,
  },
  {
    key: "storage",
    toggleLabel: "Allow Storage Access",
    shortName: "Storage",
    category: "storage",
    explainWhy:
      "Explain why: Used to save installed Universe Apps, workspace preferences, Gamura Calculator history, and offline page drafts.",
    detailedWhy:
      "Grants persistent local storage in your browser so apps pinned from Gamura Launch Store, settings preferences, and editor drafts remain intact across refreshes.",
    usedInApps: "Universe Apps · Settings · Gamura Calc · Page Builder",
    icon: <HardDrive size={15} />,
    iconBg: "bg-slate-700 text-white",
    browserApiNames: ["persistent-storage"],
    supportsBrowserRequest: true,
  },
  {
    key: "messages",
    toggleLabel: "Allow Messages Access",
    shortName: "Messages",
    category: "communication",
    explainWhy:
      "Explain why: Used by Neutral Link 1:1 & group chats and Universe Overview quick signal notes.",
    detailedWhy:
      "Enables real-time message delivery and instant workspace signal sharing with your verified Gamura contacts inside Universe.",
    usedInApps: "Neutral Link · Overview Quick Signals",
    icon: <MessageSquare size={15} />,
    iconBg: "bg-green-500 text-white",
  },
  {
    key: "photosMedia",
    toggleLabel: "Allow Photos & Media Access",
    shortName: "Photos & Media",
    category: "hardware",
    explainWhy:
      "Explain why: Used to import gallery photos into Gamura Camera Editor, Gamura Veo timelines, and Portfolio image blocks.",
    detailedWhy:
      "Permits selecting existing PNG/JPEG/WebP images from your device picker for filter editing, collage assembly, or page headers.",
    usedInApps: "Gamura Camera · Gamura Veo · Gamura PDF Studio",
    icon: <ImageIcon size={15} />,
    iconBg: "bg-emerald-500 text-white",
  },
  {
    key: "screenCapture",
    toggleLabel: "Allow Screen Capture Access",
    shortName: "Screen Capture",
    category: "hardware",
    explainWhy:
      "Explain why: Used to capture high-resolution canvas renders inside Gamura Veo and Gamura Camera Editor.",
    detailedWhy:
      "Allows studio HTML5 canvases to capture composited frames at up to 30fps for clean video export and high-DPI snapshots.",
    usedInApps: "Gamura Veo · Gamura Camera",
    icon: <Monitor size={15} />,
    iconBg: "bg-violet-500 text-white",
  },
  {
    key: "audioPlayback",
    toggleLabel: "Allow Audio Playback Access",
    shortName: "Audio Playback",
    category: "hardware",
    explainWhy:
      "Explain why: Used by the Universe Ambient Focus Synthesizer, Gamura Veo audio tracks, and subtle UI tap chimes.",
    detailedWhy:
      "Allows WebAudio synthesis for deep focus soundscapes, shutter acoustics, and timeline audio previews inside studio tools.",
    usedInApps: "Audio Module · Settings Chimes · Gamura Veo",
    icon: <Music size={15} />,
    iconBg: "bg-pink-500 text-white",
  },
  {
    key: "contactsProfile",
    toggleLabel: "Allow Contacts & Directory Access",
    shortName: "Contacts & Directory",
    category: "communication",
    explainWhy:
      "Explain why: Used by Users Directory and Join Selvaranjan to look up member @handles and share developer hubs.",
    detailedWhy:
      "Lets Universe resolve @usernames for connecting in Neutral Link and surfacing public creator portfolios.",
    usedInApps: "Join Selvaranjan · Users Directory · Network Graph",
    icon: <Users size={15} />,
    iconBg: "bg-blue-500 text-white",
  },
  {
    key: "filesDownloads",
    toggleLabel: "Allow Files & Downloads Access",
    shortName: "Files & Downloads",
    category: "storage",
    explainWhy:
      "Explain why: Used to export edited photos, MP4/WebM videos, PDFs, JSON backups, and activity CSV logs to your device.",
    detailedWhy:
      "Authorizes generated Blob downloads across Gamura Camera, Gamura PDF Studio, Gamura Veo, and Universe Settings.",
    usedInApps: "Gamura Camera · Gamura PDF · Gamura Veo · Settings Export",
    icon: <FileDown size={15} />,
    iconBg: "bg-teal-600 text-white",
  },
  {
    key: "clipboard",
    toggleLabel: "Allow Clipboard Access",
    shortName: "Clipboard",
    category: "storage",
    explainWhy:
      "Explain why: Used by Gamura Clip (/clip) cross-device paste sync and one-tap URL/UID copy buttons across Universe.",
    detailedWhy:
      "Lets Gamura copy short /go/ links, room codes, and @profile URLs or read pasted snippets when you tap Paste in Gamura Clip.",
    usedInApps: "Gamura Clip · Gamura /go/ Links · Settings",
    icon: <Clipboard size={15} />,
    iconBg: "bg-amber-500 text-white",
    browserApiNames: ["clipboard-read", "clipboard-write"],
    supportsBrowserRequest: true,
  },
  {
    key: "location",
    toggleLabel: "Allow Location Access",
    shortName: "Location",
    category: "storage",
    explainWhy:
      "Explain why: Used optionally for regional time-zone formatting and nearby cloud relay node selection.",
    detailedWhy:
      "Only checked if turned on and verified. Coordinates are never broadcast publicly on your Gamura profile.",
    usedInApps: "Universe Timezone · Edge Relay Diagnostics",
    icon: <MapPin size={15} />,
    iconBg: "bg-cyan-600 text-white",
    browserApiNames: ["geolocation"],
    supportsBrowserRequest: true,
  },
  {
    key: "backgroundSync",
    toggleLabel: "Allow Background Cloud Sync",
    shortName: "Background Sync",
    category: "storage",
    explainWhy:
      "Explain why: Used to keep your Universe preferences, online presence, and Daily Streak synced with Firebase.",
    detailedWhy:
      "Automatically mirrors your theme, access toggles, and streak check-ins to Firestore when signed in so every device stays aligned.",
    usedInApps: "Firebase Cloud Sync · Daily Streak · Multi-Device Settings",
    icon: <RefreshCw size={15} />,
    iconBg: "bg-zinc-800 text-white",
  },
];

function AppleSwitchInline({
  checked,
  onChange,
  accentColor = "#0071E3",
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  accentColor?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-[46px] h-[27px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      style={{
        backgroundColor: checked ? accentColor : "#D1D1D6",
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className="w-[23px] h-[23px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] block"
        style={{
          marginLeft: checked ? "auto" : "0px",
          marginRight: checked ? "0px" : "auto",
        }}
      />
    </button>
  );
}

interface UniversePermissionsManagerProps {
  allowAccess: AllowAccessPermissions;
  accentColor?: string;
  onTogglePermission: (
    key: keyof AllowAccessPermissions,
    enabled: boolean,
    label: string,
  ) => void;
  onSetAllPermissions: (enabled: boolean) => void;
  showToast: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}

export default function UniversePermissionsManager({
  allowAccess,
  accentColor = "#0071E3",
  onTogglePermission,
  onSetAllPermissions,
  showToast,
}: UniversePermissionsManagerProps) {
  const [browserStates, setBrowserStates] = useState<Record<string, BrowserPermState>>({});
  const [checkingKey, setCheckingKey] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [openInfoKey, setOpenInfoKey] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<PermCategory>("all");

  const queryAllBrowserPermissions = useCallback(async () => {
    setRefreshingAll(true);
    const nextStates: Record<string, BrowserPermState> = {};

    const queryOne = async (names: string[]): Promise<BrowserPermState> => {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        for (const name of names) {
          try {
            const status = await navigator.permissions.query({
              name: name as PermissionName,
            });
            if (
              status.state === "granted" ||
              status.state === "denied" ||
              status.state === "prompt"
            ) {
              return status.state;
            }
          } catch {
            // Browser may not support querying this descriptor directly
          }
        }
      }
      return "workspace";
    };

    try {
      await Promise.all(
        PERMISSION_CATALOG.map(async (item) => {
          if (!item.browserApiNames || item.browserApiNames.length === 0) {
            nextStates[item.key] = "workspace";
            return;
          }

          let resolved = await queryOne(item.browserApiNames);

          if (item.key === "notifications" && typeof Notification !== "undefined") {
            if (Notification.permission === "granted") resolved = "granted";
            else if (Notification.permission === "denied") resolved = "denied";
            else if (resolved === "workspace") resolved = "prompt";
          }

          if (
            item.key === "storage" &&
            resolved === "workspace" &&
            typeof navigator !== "undefined" &&
            navigator.storage?.persisted
          ) {
            try {
              const persisted = await navigator.storage.persisted();
              resolved = persisted ? "granted" : "prompt";
            } catch {
              resolved = "prompt";
            }
          }

          nextStates[item.key] = resolved;
        }),
      );
      setBrowserStates(nextStates);
    } finally {
      setRefreshingAll(false);
    }
  }, []);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    queryAllBrowserPermissions();

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      const watchedNames: { key: keyof AllowAccessPermissions; name: string }[] = [
        { key: "camera", name: "camera" },
        { key: "video", name: "camera" },
        { key: "microphone", name: "microphone" },
        { key: "notifications", name: "notifications" },
        { key: "location", name: "geolocation" },
        { key: "storage", name: "persistent-storage" },
        { key: "clipboard", name: "clipboard-read" },
      ];

      watchedNames.forEach(({ key, name }) => {
        navigator.permissions
          .query({ name: name as PermissionName })
          .then((permStatus) => {
            const onChange = () => {
              setBrowserStates((prev) => ({
                ...prev,
                [key]: permStatus.state as BrowserPermState,
              }));
            };
            permStatus.addEventListener?.("change", onChange);
            cleanups.push(() => permStatus.removeEventListener?.("change", onChange));
          })
          .catch(() => null);
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [queryAllBrowserPermissions]);

  const requestOrTestBrowserAccess = async (item: PermissionDescriptorItem) => {
    setCheckingKey(item.key);
    try {
      if (item.key === "notifications") {
        if (typeof Notification === "undefined") {
          showToast("🔔", "Browser API Unavailable", "In-app Universe notifications remain active.", "info");
        } else {
          const res = await Notification.requestPermission();
          setBrowserStates((prev) => ({
            ...prev,
            notifications: res === "granted" ? "granted" : res === "denied" ? "denied" : "prompt",
          }));
          if (res === "granted") {
            onTogglePermission("notifications", true, item.shortName);
          } else {
            showToast("🔔", "Notification Permission", `Browser reported "${res}".`, "warning");
          }
        }
      } else if (item.key === "camera" || item.key === "video") {
        if (!navigator.mediaDevices?.getUserMedia) {
          showToast("📷", "Camera Unavailable", "No mediaDevices API in this browser context.", "warning");
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          setBrowserStates((prev) => ({ ...prev, camera: "granted", video: "granted" }));
          onTogglePermission(item.key, true, item.shortName);
        }
      } else if (item.key === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) {
          showToast("🎙️", "Microphone Unavailable", "No mediaDevices API in this browser context.", "warning");
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setBrowserStates((prev) => ({ ...prev, microphone: "granted" }));
          onTogglePermission("microphone", true, item.shortName);
        }
      } else if (item.key === "storage") {
        if (navigator.storage?.persist) {
          const persisted = await navigator.storage.persist();
          setBrowserStates((prev) => ({
            ...prev,
            storage: persisted ? "granted" : "prompt",
          }));
          onTogglePermission("storage", true, item.shortName);
        } else {
          onTogglePermission("storage", true, item.shortName);
        }
      } else if (item.key === "location") {
        if (!navigator.geolocation) {
          setBrowserStates((prev) => ({ ...prev, location: "denied" }));
        } else {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setBrowserStates((prev) => ({ ...prev, location: "granted" }));
                onTogglePermission("location", true, item.shortName);
                resolve();
              },
              () => {
                setBrowserStates((prev) => ({ ...prev, location: "denied" }));
                showToast("📍", "Location Denied", "Browser blocked location access.", "warning");
                resolve();
              },
              { timeout: 6000 },
            );
          });
        }
      } else if (item.key === "clipboard") {
        try {
          await navigator.clipboard.readText();
          setBrowserStates((prev) => ({ ...prev, clipboard: "granted" }));
        } catch {
          setBrowserStates((prev) => ({ ...prev, clipboard: "prompt" }));
        }
        onTogglePermission("clipboard", true, item.shortName);
      }
    } catch {
      setBrowserStates((prev) => ({ ...prev, [item.key]: "denied" }));
      showToast(
        "⚠️",
        `${item.shortName} Blocked by Browser`,
        "Browser site settings currently block this hardware device.",
        "warning",
      );
    } finally {
      setCheckingKey(null);
    }
  };

  const renderBrowserStatusBadge = (
    item: PermissionDescriptorItem,
    isAllowed: boolean,
  ) => {
    const state = browserStates[item.key] || "checking";
    if (item.browserApiNames?.length) {
      if (state === "granted") {
        return (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700"
            title="Actual browser permission reported via navigator.permissions API"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Browser: Granted</span>
          </span>
        );
      }
      if (state === "denied") {
        return (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600"
            title="Actual browser permission reported via navigator.permissions API"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>Browser: Denied</span>
          </span>
        );
      }
      if (state === "prompt") {
        return (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700"
            title="Browser will prompt when requested"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Browser: Prompt</span>
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6E6E73]">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isAllowed ? "bg-emerald-500" : "bg-zinc-400"
          }`}
        />
        <span>{isAllowed ? "Active in Universe" : "Turned Off"}</span>
      </span>
    );
  };

  const enabledCount = PERMISSION_CATALOG.filter((p) => allowAccess[p.key]).length;
  const visibleItems =
    filterCat === "all"
      ? PERMISSION_CATALOG
      : PERMISSION_CATALOG.filter((p) => p.category === filterCat);

  return (
    <div className="space-y-4">
      {/* Header Summary Card */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F] tabular-nums">
              {enabledCount} of {PERMISSION_CATALOG.length} Permissions Turned On
            </div>
            <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">
              Manage granular hardware and workspace permissions individually. Changes persist in localStorage and sync to your Firebase profile.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={queryAllBrowserPermissions}
              disabled={refreshingAll}
              className="px-3 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={refreshingAll ? "animate-spin" : ""} />
              <span>{refreshingAll ? "Checking..." : "Refresh Status"}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetAllPermissions(false)}
              className="px-3 py-2 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
            >
              Turn All Off
            </button>
            <button
              type="button"
              onClick={() => onSetAllPermissions(true)}
              style={{ backgroundColor: accentColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              Allow All
            </button>
          </div>
        </div>

        {/* Filter Segmented Control + Live Telemetry Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F5F7] border border-zinc-200/70 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "all", label: "All Access" },
                { id: "hardware", label: "Hardware & Media" },
                { id: "communication", label: "Messages & Alerts" },
                { id: "storage", label: "Storage & System" },
              ] as const
            ).map((tab) => {
              const active = filterCat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCat(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#6E6E73] shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Granted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Prompt
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Denied
            </span>
          </div>
        </div>
      </div>

      {/* Grouped Apple System Settings Permission Rows */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-visible divide-y divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {visibleItems.map((item) => {
          const isAllowed = allowAccess[item.key];
          const isChecking = checkingKey === item.key;
          const isInfoOpen = openInfoKey === item.key;

          return (
            <div
              key={item.key}
              className="relative p-4 sm:px-5 sm:py-4 space-y-2.5 transition-colors hover:bg-[#FAFAFC]/60"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Icon + Title + Browser Status Indicator */}
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${item.iconBg}`}
                  >
                    {item.icon}
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-[#1D1D1F]">
                        {item.toggleLabel}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isAllowed ? "text-emerald-600" : "text-[#86868B]"
                        }`}
                      >
                        {isAllowed ? "On" : "Off"}
                      </span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      {renderBrowserStatusBadge(item, isAllowed)}
                    </div>

                    {/* Explain Why Helper Text directly beneath permission toggle */}
                    <p className="text-xs text-[#6E6E73] leading-relaxed">
                      {item.explainWhy}
                    </p>
                  </div>
                </div>

                {/* Right Controls: Info Popover Trigger + Test Access + Apple Switch */}
                <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenInfoKey((prev) => (prev === item.key ? null : item.key))
                    }
                    aria-expanded={isInfoOpen}
                    aria-label={`Explain why ${item.shortName} access is used`}
                    className={`min-h-[34px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                      isInfoOpen
                        ? "bg-zinc-900 text-white"
                        : "bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F]"
                    }`}
                  >
                    <Info size={12} />
                    <span>Why?</span>
                  </button>

                  {item.supportsBrowserRequest && (
                    <button
                      type="button"
                      disabled={isChecking}
                      onClick={() => requestOrTestBrowserAccess(item)}
                      className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[11px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      {isChecking ? "Checking..." : "Test"}
                    </button>
                  )}

                  <AppleSwitchInline
                    checked={isAllowed}
                    onChange={(val) => onTogglePermission(item.key, val, item.shortName)}
                    accentColor={accentColor}
                    label={item.toggleLabel}
                  />
                </div>
              </div>

              {/* Interactive Apple-Style Expandable Info Popover / Detail Card */}
              <AnimatePresence>
                {isInfoOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="ml-0 sm:ml-12 p-3.5 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#1D1D1F]">
                        How Gamura uses {item.shortName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenInfoKey(null)}
                        aria-label="Close explanation"
                        className="w-6 h-6 rounded-full hover:bg-zinc-200/70 flex items-center justify-center text-[#6E6E73] cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[#424245] leading-relaxed">{item.detailedWhy}</p>
                    <div className="text-[11px] text-[#6E6E73] pt-0.5">
                      <span className="font-semibold text-[#1D1D1F]">Used in: </span>
                      {item.usedInApps}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
