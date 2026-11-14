import React, { useEffect, useState } from "react";
import { ArrowUpRight, LayoutGrid, Trash2, Sparkles } from "lucide-react";
import StoreAppGlyph from "./StoreAppGlyph";
import {
  StoreAppItem,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  getUniverseInstalledApps,
  removeAppFromUniverse,
} from "../utils/gamuraStoreApps";

interface UniverseAppsViewProps {
  showToast: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}

export default function UniverseAppsView({ showToast }: UniverseAppsViewProps) {
  const [apps, setApps] = useState<StoreAppItem[]>(() =>
    getUniverseInstalledApps(),
  );

  useEffect(() => {
    const syncApps = () => {
      setApps(getUniverseInstalledApps());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === UNIVERSE_APPS_KEY) {
        syncApps();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(UNIVERSE_APPS_EVENT, syncApps);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncApps);
    };
  }, []);

  const handleUninstall = (app: StoreAppItem) => {
    const next = removeAppFromUniverse(app.id);
    setApps(next);
    showToast(
      "🗑️",
      `${app.name} Uninstalled`,
      "Removed from your Universe Apps workspace.",
      "info",
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-zinc-200/80 rounded-[22px] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-center justify-center text-zinc-800 shrink-0">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Universe Apps
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {apps.length === 0
                ? "Empty until you install apps from Gamura Launch Store."
                : `${apps.length} installed ${apps.length === 1 ? "app" : "apps"} ready to use inside Universe`}
            </p>
          </div>
        </div>

        <a
          href="/launch"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <span>Get Apps in Launch</span>
          <ArrowUpRight size={14} />
        </a>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-[26px] px-6 py-14 text-center shadow-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-4">
            <Sparkles size={24} />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
            No Apps Installed Yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
            Your Apps library is empty. Download any app in Gamura Launch Store
            and select <span className="font-semibold text-zinc-700">In Universe Page</span> to add it here.
          </p>
          <a
            href="/launch"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E2F5ED] hover:bg-[#D1EFE3] text-[#059669] text-xs font-bold tracking-tight transition-colors"
          >
            <span>Open Gamura Launch Store</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-zinc-200/80 rounded-[22px] p-4 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-shadow"
            >
              <StoreAppGlyph app={app} sizeClass="w-12 h-12" iconPx={24} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate tracking-tight">
                    {app.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {app.tag}
                </p>
                <span className="inline-block text-[10px] font-medium text-zinc-400 mt-1">
                  {app.cat} • ★ {app.rating}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#D1EFE3] text-[#059669] text-xs font-bold tracking-tight transition-colors whitespace-nowrap"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => handleUninstall(app)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={`Uninstall ${app.name}`}
                  title={`Uninstall ${app.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
