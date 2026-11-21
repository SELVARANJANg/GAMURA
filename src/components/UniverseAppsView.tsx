import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Cloud,
  Info,
  LayoutGrid,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import StoreAppGlyph from "./StoreAppGlyph";
import {
  APP_RATINGS_EVENT,
  APP_RATINGS_KEY,
  CUSTOM_STORE_APPS_KEY,
  MOBILE_APPS_KEY,
  StoreAppItem,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  getAppVersion,
  getUniverseInstalledApps,
  rateStoreApp,
  readStoreJson,
  removeAppFromUniverse,
} from "../utils/gamuraStoreApps";
import {
  type StoreReviewDoc,
  computeCombinedAppRatingStats,
  saveAppReviewToCloud,
  subscribeStoreReviews,
  subscribeUserInstalledApps,
  syncInstalledAppsToCloud,
} from "../utils/gamuraCloudSync";

interface UniverseAppsViewProps {
  showToast: (
    ic: string,
    title: string,
    content: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  accentColor?: string;
}

export default function UniverseAppsView({
  showToast,
  accentColor = "#0071E3",
}: UniverseAppsViewProps) {
  const [apps, setApps] = useState<StoreAppItem[]>(() =>
    getUniverseInstalledApps(),
  );
  const [localRatingsMap, setLocalRatingsMap] = useState<
    Record<string, number>
  >(() => readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}));
  const [storeReviews, setStoreReviews] = useState<StoreReviewDoc[]>([]);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(
    () => auth.currentUser,
  );
  const [gamuraHandle, setGamuraHandle] = useState<string>("");
  const [sortByRating, setSortByRating] = useState(true);
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [pinnedTooltipId, setPinnedTooltipId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const d = userSnap.data();
            const handle =
              (typeof d.username === "string" && d.username) ||
              (typeof d.nickname === "string" && d.nickname) ||
              user.displayName ||
              user.email ||
              "Gamura Member";
            setGamuraHandle(handle);
          } else {
            setGamuraHandle(user.displayName || user.email || "Gamura Member");
          }
        } catch {
          setGamuraHandle(user.displayName || user.email || "Gamura Member");
        }
      } else {
        setGamuraHandle("");
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const unsubCloud = subscribeUserInstalledApps(
      authUser.uid,
      gamuraHandle || authUser.displayName || authUser.email,
      () => {
        setApps(getUniverseInstalledApps());
      },
    );
    return () => unsubCloud();
  }, [authUser, gamuraHandle]);

  useEffect(() => {
    const unsubReviews = subscribeStoreReviews((reviews) => {
      setStoreReviews(reviews);
    });
    return () => unsubReviews();
  }, []);

  useEffect(() => {
    const syncApps = () => {
      setApps(getUniverseInstalledApps());
    };
    const syncRatings = () => {
      setLocalRatingsMap(
        readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}),
      );
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === UNIVERSE_APPS_KEY) {
        syncApps();
      }
      if (e.key === null || e.key === APP_RATINGS_KEY) {
        syncRatings();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(UNIVERSE_APPS_EVENT, syncApps);
    window.addEventListener(APP_RATINGS_EVENT, syncRatings);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncApps);
      window.removeEventListener(APP_RATINGS_EVENT, syncRatings);
    };
  }, []);

  const statsByAppId = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof computeCombinedAppRatingStats>
    >();
    apps.forEach((app) => {
      map.set(
        app.id,
        computeCombinedAppRatingStats(
          app,
          storeReviews,
          authUser?.uid,
          localRatingsMap[app.id] || 0,
        ),
      );
    });
    return map;
  }, [apps, storeReviews, authUser, localRatingsMap]);

  const displayedApps = useMemo(() => {
    if (!sortByRating) return apps;
    return [...apps].sort((a, b) => {
      const avgB = statsByAppId.get(b.id)?.average ?? b.rating ?? 4.8;
      const avgA = statsByAppId.get(a.id)?.average ?? a.rating ?? 4.8;
      return avgB - avgA;
    });
  }, [apps, sortByRating, statsByAppId]);

  const handleUninstall = async (app: StoreAppItem) => {
    const next = removeAppFromUniverse(app.id);
    setApps(next);
    if (hoveredAppId === app.id) setHoveredAppId(null);
    if (pinnedTooltipId === app.id) setPinnedTooltipId(null);
    if (authUser) {
      await syncInstalledAppsToCloud({
        uid: authUser.uid,
        gamuraHandle: gamuraHandle || authUser.displayName || authUser.email,
        universeAppIds: next.map((x) => x.id),
        mobileAppIds: readStoreJson<string[]>(MOBILE_APPS_KEY, []),
        customApps: readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []),
      });
    }
    showToast(
      "🗑️",
      `${app.name} Uninstalled`,
      authUser
        ? "Removed from Universe Apps and synced across your Gamura ID devices."
        : "Removed from your Universe Apps workspace.",
      "info",
    );
  };

  const handleQuickRate = async (app: StoreAppItem, stars: number) => {
    rateStoreApp(app, stars);
    setLocalRatingsMap(
      readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}),
    );
    if (authUser) {
      const existingReview = statsByAppId.get(app.id)?.userReview;
      await saveAppReviewToCloud({
        appId: app.id,
        userId: authUser.uid,
        authorName:
          gamuraHandle || authUser.displayName || authUser.email || "Gamura Member",
        authorPhoto: authUser.photoURL,
        rating: stars,
        comment: existingReview?.comment || "",
      });
    }
    showToast(
      "⭐",
      `Rated ${app.name} ${stars}/5`,
      authUser
        ? "Your star rating synced live to Gamura Cloud."
        : "Your star rating synced with Gamura Launch Store.",
      "success",
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Universe Apps
              </h2>
              {authUser && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Cloud size={12} />
                  <span>Cloud Sync Active</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {apps.length === 0
                ? "Empty until you install apps from Gamura Launch Store."
                : `${apps.length} installed ${apps.length === 1 ? "app" : "apps"} · Hover any card for version & details`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {apps.length > 1 && (
            <button
              type="button"
              onClick={() => setSortByRating((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span>{sortByRating ? "Sorted: Top Rated" : "Sorted: Recent"}</span>
            </button>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-visible">
          {displayedApps.map((app) => {
            const stats =
              statsByAppId.get(app.id) ??
              computeCombinedAppRatingStats(
                app,
                storeReviews,
                authUser?.uid,
                localRatingsMap[app.id] || 0,
              );
            const userRating =
              stats.userReview?.rating || localRatingsMap[app.id] || 0;
            const activeStarDisplay =
              userRating > 0 ? userRating : Math.round(stats.average);
            const isPopular = stats.average >= 4.8;
            const versionLabel = getAppVersion(app);
            const isPopoverOpen =
              hoveredAppId === app.id || pinnedTooltipId === app.id;

            return (
              <div
                key={app.id}
                onMouseEnter={() => setHoveredAppId(app.id)}
                onMouseLeave={() =>
                  setHoveredAppId((prev) => (prev === app.id ? null : prev))
                }
                onFocus={() => setHoveredAppId(app.id)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setHoveredAppId((prev) => (prev === app.id ? null : prev));
                    setPinnedTooltipId((prev) => (prev === app.id ? null : prev));
                  }
                }}
                tabIndex={0}
                className="relative overflow-visible bg-white border border-zinc-200/80 rounded-[22px] p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                style={
                  isPopoverOpen
                    ? { zIndex: 35, borderColor: "rgba(0,113,227,0.28)" }
                    : undefined
                }
              >
                {/* Hover-Activated Apple-Style Popover Tooltip */}
                <AnimatePresence>
                  {isPopoverOpen && (
                    <motion.div
                      role="tooltip"
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-auto absolute left-3 right-3 bottom-full mb-2.5 z-40 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-[0_18px_42px_rgba(0,0,0,0.14)] p-3.5 text-left"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1D1D1F] truncate">
                            {app.name}
                          </div>
                          <div className="text-[11px] text-[#6E6E73] mt-0.5 flex items-center gap-1.5 tabular-nums">
                            <span
                              className="font-semibold"
                              style={{ color: accentColor }}
                            >
                              Version {versionLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{app.cat}</span>
                            <span aria-hidden="true">·</span>
                            <span>{app.size}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#1D1D1F] tabular-nums shrink-0">
                          ★ {stats.average.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs text-[#424245] leading-relaxed mt-2 line-clamp-3">
                        {app.desc || app.tag}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-[#6E6E73] tabular-nums">
                        <span>
                          {app.chart || "Featured"} · Rated {app.age || "3+"}
                        </span>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:underline inline-flex items-center gap-0.5"
                          style={{ color: accentColor }}
                        >
                          <span>Launch</span>
                          <ArrowUpRight size={11} />
                        </a>
                      </div>

                      {/* Subtle Apple Popover Caret */}
                      <span
                        aria-hidden="true"
                        className="absolute left-7 -bottom-1.5 w-3 h-3 rotate-45 bg-white/95 border-r border-b border-zinc-200/90"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3.5">
                  <StoreAppGlyph app={app} sizeClass="w-12 h-12" iconPx={24} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 truncate tracking-tight">
                        {app.name}
                      </h3>
                      {isPopular && (
                        <span className="text-[10px] font-semibold text-amber-700 shrink-0">
                          Top Rated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {app.tag}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mt-0.5 tabular-nums">
                      <span>{app.cat}</span>
                      <span aria-hidden="true">·</span>
                      <span>v{versionLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{app.dl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedTooltipId((prev) =>
                          prev === app.id ? null : app.id,
                        );
                      }}
                      className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={`App info and version for ${app.name}`}
                      title={`Version ${versionLabel} details`}
                    >
                      <Info size={14} />
                    </button>
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

                {/* Apple-Style Star Rating Footer inside Card */}
                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-0.5"
                    role="group"
                    aria-label={`Rate ${app.name}`}
                  >
                    {[1, 2, 3, 4, 5].map((starNum) => {
                      const filled = starNum <= activeStarDisplay;
                      return (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => handleQuickRate(app, starNum)}
                          aria-label={`Rate ${app.name} ${starNum} stars`}
                          className="p-0.5 rounded-md hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={13}
                            className={
                              filled
                                ? "text-amber-500 fill-amber-500"
                                : "text-zinc-300"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                    <span className="font-bold text-zinc-900">
                      {stats.average.toFixed(1)}
                    </span>
                    <span className="text-zinc-400">
                      ({stats.totalVotes})
                    </span>
                    {userRating > 0 && (
                      <span className="text-[10px] font-semibold text-[#059669]">
                        · You rated {userRating}★
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
