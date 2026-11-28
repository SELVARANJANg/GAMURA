import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Home,
  LayoutGrid,
  Plus,
  Star,
  ShieldCheck,
  ExternalLink,
  X,
  Trash2,
  Check,
  Share,
  Globe,
  Smartphone,
  Layers,
  ChevronDown,
  QrCode,
  Copy,
  Download,
  ImagePlus,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  Eye,
  MessageSquarePlus,
  SlidersHorizontal,
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import StoreAppGlyph from "./StoreAppGlyph";
import LaunchLivePreviewModal from "./LaunchLivePreviewModal";
import {
  type StoreAppItem,
  APP_RATINGS_EVENT,
  APP_RATINGS_KEY,
  BUILTIN_STORE_APPS,
  CUSTOM_STORE_APPS_KEY,
  LEGACY_INSTALLED_KEY,
  UNIVERSE_APPS_KEY,
  MOBILE_APPS_KEY,
  readStoreJson,
  writeStoreJson,
  addAppToUniverse,
  removeAppFromUniverse,
  addMobileInstalledId,
  removeMobileInstalledId,
  downloadStandaloneAppPackage,
  rateStoreApp,
} from "../utils/gamuraStoreApps";
import {
  type CloudInstalledState,
  type StoreReviewDoc,
  computeCombinedAppRatingStats,
  deleteAppReviewFromCloud,
  saveAppReviewToCloud,
  subscribeStoreReviews,
  subscribeUserInstalledApps,
  syncInstalledAppsToCloud,
} from "../utils/gamuraCloudSync";

export const LAUNCH_LOGO_SRC = "/assets/aistudio/1794679627931_b0492bbb.png";
export const LAUNCH_LOGO_FALLBACK =
  "https://lh3.googleusercontent.com/d/1FqBAdXuyDDSSuYtd3iZzf9x5PM8orKrd";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

type StorePage = "home" | "search" | "lib" | "dev";
type HomeTab = "foryou" | "games" | "top" | "cats" | "new";
type InstallDestination = "universe" | "mobile" | "both";

export default function GamuraStoreLaunch({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [logoFallback, setLogoFallback] = useState(false);
  const [page, setPage] = useState<StorePage>("home");
  const [tab, setTab] = useState<HomeTab>("foryou");
  const [queryText, setQueryText] = useState("");

  const [customApps, setCustomApps] = useState<StoreAppItem[]>(() =>
    readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []),
  );
  const [universeApps, setUniverseApps] = useState<StoreAppItem[]>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []),
  );
  const [mobileIds, setMobileIds] = useState<string[]>(() =>
    readStoreJson<string[]>(MOBILE_APPS_KEY, []),
  );

  const [selectedApp, setSelectedApp] = useState<StoreAppItem | null>(null);
  const [promptApp, setPromptApp] = useState<StoreAppItem | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installPct, setInstallPct] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // QR Code Generator Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrSelectedAppId, setQrSelectedAppId] = useState<string>("__store__");
  const [qrUrlInput, setQrUrlInput] = useState<string>("");
  const [qrLabel, setQrLabel] = useState<string>("Gamura Launch Store");
  const [qrColor, setQrColor] = useState<string>("#1D1D1F");
  const [qrBgColor, setQrBgColor] = useState<string>("#FFFFFF");
  const [qrLogoMode, setQrLogoMode] = useState<
    "none" | "gamura" | "app" | "store" | "custom"
  >("gamura");
  const [qrCustomLogoUrl, setQrCustomLogoUrl] = useState<string>("");

  // Developer publish form state
  const [fName, setFName] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fTag, setFTag] = useState("");
  const [fCat, setFCat] = useState("Platform");
  const [fDesc, setFDesc] = useState("");
  const [fC1, setFC1] = useState("#34d399");
  const [fC2, setFC2] = useState("#059669");

  // Real-time Firebase Auth & Cloud Sync State
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(
    () => auth.currentUser,
  );
  const [gamuraHandle, setGamuraHandle] = useState<string>("");
  const [cloudState, setCloudState] = useState<CloudInstalledState | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Real-time Community Reviews & Star Ratings State
  const [storeReviews, setStoreReviews] = useState<StoreReviewDoc[]>([]);
  const [localRatingsMap, setLocalRatingsMap] = useState<Record<string, number>>(
    () => readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}),
  );
  const [draftRating, setDraftRating] = useState<number>(5);
  const [draftComment, setDraftComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [cardHoverStars, setCardHoverStars] = useState<Record<string, number>>({});

  // Quality Filtering & Sorting State
  const [minRatingFilter, setMinRatingFilter] = useState<
    "all" | "4.9" | "4.5" | "reviewed"
  >("all");
  const [sortOrder, setSortOrder] = useState<
    "recommended" | "rating" | "reviews"
  >("recommended");

  // Live Preview Simulator Modal State
  const [livePreviewApp, setLivePreviewApp] = useState<StoreAppItem | null>(
    null,
  );

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Launch Store";
    return () => {
      document.title = prev;
    };
  }, []);

  // Real-time Auth listener + profile lookup for Gamura ID handle
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
        setCloudState(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore Cloud Sync listener for installed apps when signed into Gamura ID
  useEffect(() => {
    if (!authUser) return;
    setIsSyncingCloud(true);
    const unsubCloud = subscribeUserInstalledApps(
      authUser.uid,
      gamuraHandle || authUser.displayName || authUser.email,
      (remote) => {
        setCloudState(remote);
        setUniverseApps(readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []));
        setMobileIds(readStoreJson<string[]>(MOBILE_APPS_KEY, []));
        setCustomApps(readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []));
        setIsSyncingCloud(false);
      },
    );
    return () => unsubCloud();
  }, [authUser, gamuraHandle]);

  // Real-time Firestore listener for Launch Store community star ratings & reviews
  useEffect(() => {
    const unsubReviews = subscribeStoreReviews((reviews) => {
      setStoreReviews(reviews);
    });
    return () => unsubReviews();
  }, []);

  // Keep synced with storage changes across tabs (e.g. uninstall or rate from Universe tab)
  useEffect(() => {
    const syncState = () => {
      setUniverseApps(readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []));
      setMobileIds(readStoreJson<string[]>(MOBILE_APPS_KEY, []));
      setCustomApps(readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []));
      setLocalRatingsMap(readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}));
    };
    window.addEventListener("storage", syncState);
    window.addEventListener(APP_RATINGS_EVENT, syncState);
    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(APP_RATINGS_EVENT, syncState);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  };

  const allApps = useMemo(
    () => [...BUILTIN_STORE_APPS, ...customApps],
    [customApps],
  );

  const ratingStatsByAppId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCombinedAppRatingStats>>();
    allApps.forEach((app) => {
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
  }, [allApps, storeReviews, authUser?.uid, localRatingsMap]);

  const getLiveStats = (app: StoreAppItem) =>
    ratingStatsByAppId.get(app.id) ||
    computeCombinedAppRatingStats(
      app,
      storeReviews,
      authUser?.uid,
      localRatingsMap[app.id] || 0,
    );

  // Sync draft rating & review input whenever user opens an app detail sheet
  useEffect(() => {
    if (!selectedApp) return;
    const stats = getLiveStats(selectedApp);
    if (stats.userReview) {
      setDraftRating(stats.userReview.rating);
      setDraftComment(stats.userReview.comment);
    } else {
      setDraftRating(localRatingsMap[selectedApp.id] || 5);
      setDraftComment("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  const installedIdSet = useMemo(() => {
    const ids = new Set<string>(mobileIds);
    universeApps.forEach((a) => ids.add(a.id));
    return ids;
  }, [mobileIds, universeApps]);

  const isInUniverse = (id: string) => universeApps.some((a) => a.id === id);
  const isInMobile = (id: string) => mobileIds.includes(id);

  const applyQualityFilterAndSort = (list: StoreAppItem[]) => {
    const filtered = list.filter((a) => {
      const stats = getLiveStats(a);
      if (minRatingFilter === "4.9") return stats.average >= 4.9;
      if (minRatingFilter === "4.5") return stats.average >= 4.5;
      if (minRatingFilter === "reviewed") return stats.reviewCount > 0;
      return true;
    });
    if (sortOrder === "rating") {
      return [...filtered].sort(
        (a, b) => getLiveStats(b).average - getLiveStats(a).average,
      );
    }
    if (sortOrder === "reviews") {
      return [...filtered].sort(
        (a, b) =>
          getLiveStats(b).reviewCount - getLiveStats(a).reviewCount ||
          getLiveStats(b).average - getLiveStats(a).average,
      );
    }
    return filtered;
  };

  const filteredApps = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const searched = q
      ? allApps.filter((a) =>
          `${a.name} ${a.cat} ${a.tag} ${a.desc}`.toLowerCase().includes(q),
        )
      : allApps;
    return applyQualityFilterAndSort(searched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allApps, queryText, minRatingFilter, sortOrder, ratingStatsByAppId]);

  const categories = useMemo(
    () => Array.from(new Set(allApps.map((a) => a.cat))),
    [allApps],
  );

  const pushInstalledAppsToCloud = async (
    nextUniverseApps: StoreAppItem[],
    nextMobileIds: string[],
    nextCustomApps: StoreAppItem[],
  ) => {
    if (!authUser) return;
    setIsSyncingCloud(true);
    try {
      await syncInstalledAppsToCloud({
        uid: authUser.uid,
        gamuraHandle: gamuraHandle || authUser.displayName || authUser.email,
        universeAppIds: nextUniverseApps.map((a) => a.id),
        mobileAppIds: nextMobileIds,
        customApps: nextCustomApps,
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleStoreGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
      showToast("Signed in · Cloud Sync active ✓");
    } catch {
      showToast("Use your Gamura ID sign-in page if popup is blocked");
    }
  };

  const handleStoreSignOut = async () => {
    try {
      await signOut(auth);
      showToast("Signed out of Cloud Sync");
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async (app: StoreAppItem) => {
    // Always record quick local rating first
    rateStoreApp(app, draftRating);
    setLocalRatingsMap(readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}));

    if (!authUser) {
      showToast("Rating saved locally · Sign in to publish review");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await saveAppReviewToCloud({
        appId: app.id,
        userId: authUser.uid,
        authorName: gamuraHandle || authUser.displayName || "Gamura Member",
        authorPhoto: authUser.photoURL,
        rating: draftRating,
        comment: draftComment.trim(),
      });
      showToast(`Review published for ${app.name} ✓`);
    } catch {
      showToast("Could not publish review right now");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (app: StoreAppItem) => {
    if (!authUser) return;
    setIsSubmittingReview(true);
    try {
      await deleteAppReviewFromCloud(app.id, authUser.uid);
      setDraftComment("");
      showToast("Your review was removed");
    } catch {
      showToast("Could not remove review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleQuickRate = async (app: StoreAppItem, stars: number) => {
    const clamped = Math.max(1, Math.min(5, Math.round(stars)));
    rateStoreApp(app, clamped);
    setLocalRatingsMap(readStoreJson<Record<string, number>>(APP_RATINGS_KEY, {}));

    if (!authUser) {
      showToast(`Rated ${app.name} ${clamped}★ ✓`);
      return;
    }

    try {
      const existingReview = storeReviews.find(
        (r) => r.appId === app.id && r.userId === authUser.uid,
      );
      await saveAppReviewToCloud({
        appId: app.id,
        userId: authUser.uid,
        authorName: gamuraHandle || authUser.displayName || "Gamura Member",
        authorPhoto: authUser.photoURL,
        rating: clamped,
        comment: existingReview?.comment || "",
      });
      showToast(`Rated ${app.name} ${clamped}★ ✓`);
    } catch {
      showToast(`Rated ${app.name} ${clamped}★ locally ✓`);
    }
  };

  // Clicking GET or Download opens the destination prompt question
  const handleGetClick = (
    app: StoreAppItem,
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    if (e) e.stopPropagation();
    if (installingId === app.id) return;
    if (installedIdSet.has(app.id)) {
      setSelectedApp(app);
      return;
    }
    setPromptApp(app);
  };

  // Run animated install after user answers where they want to use the app
  const executeInstallWithDestination = (
    app: StoreAppItem,
    destination: InstallDestination,
  ) => {
    setPromptApp(null);
    setInstallingId(app.id);
    setInstallPct(12);

    let progress = 12;
    const timer = window.setInterval(() => {
      progress += 18 + Math.random() * 14;
      if (progress >= 100) {
        window.clearInterval(timer);
        setInstallingId(null);
        setInstallPct(0);

        let nextUniverse = universeApps;
        let nextMobile = mobileIds;

        if (destination === "universe" || destination === "both") {
          nextUniverse = addAppToUniverse(app);
          setUniverseApps(nextUniverse);
        }
        if (destination === "mobile" || destination === "both") {
          nextMobile = addMobileInstalledId(app.id);
          setMobileIds(nextMobile);
          downloadStandaloneAppPackage(app);
        }

        void pushInstalledAppsToCloud(nextUniverse, nextMobile, customApps);

        // Sync legacy installed key for full compatibility
        const legacy = readStoreJson<string[]>(LEGACY_INSTALLED_KEY, []);
        if (!legacy.includes(app.id)) {
          writeStoreJson(LEGACY_INSTALLED_KEY, [...legacy, app.id]);
        }

        if (destination === "universe") {
          showToast(`${app.name} added to Universe Apps ✓`);
        } else if (destination === "mobile") {
          showToast(`${app.name} downloaded for Mobile App ✓`);
        } else {
          showToast(`${app.name} installed in Universe & Mobile ✓`);
        }
      } else {
        setInstallPct(Math.min(95, Math.round(progress)));
      }
    }, 95);
  };

  const handleUninstallAll = (app: StoreAppItem) => {
    const nextU = removeAppFromUniverse(app.id);
    const nextM = removeMobileInstalledId(app.id);
    setUniverseApps(nextU);
    setMobileIds(nextM);
    void pushInstalledAppsToCloud(nextU, nextM, customApps);
    const legacy = readStoreJson<string[]>(LEGACY_INSTALLED_KEY, []).filter(
      (id) => id !== app.id,
    );
    writeStoreJson(LEGACY_INSTALLED_KEY, legacy);
    showToast(`${app.name} uninstalled`);
  };

  const handleToggleUniverse = (app: StoreAppItem) => {
    if (isInUniverse(app.id)) {
      const nextU = removeAppFromUniverse(app.id);
      setUniverseApps(nextU);
      void pushInstalledAppsToCloud(nextU, mobileIds, customApps);
      showToast(`Removed ${app.name} from Universe Apps`);
    } else {
      const nextU = addAppToUniverse(app);
      setUniverseApps(nextU);
      void pushInstalledAppsToCloud(nextU, mobileIds, customApps);
      showToast(`Added ${app.name} to Universe Apps ✓`);
    }
  };

  const resolveFullUrl = (rawUrl: string) => {
    if (typeof window === "undefined") return rawUrl;
    if (!rawUrl.trim()) return `${window.location.origin}/launch`;
    if (rawUrl.startsWith("/")) return `${window.location.origin}${rawUrl}`;
    return rawUrl;
  };

  const openQrForStore = () => {
    setQrSelectedAppId("__store__");
    setQrLabel("Gamura Launch Store");
    setQrUrlInput(resolveFullUrl("/launch"));
    setQrModalOpen(true);
  };

  const openQrForApp = (
    app: StoreAppItem,
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    if (e) e.stopPropagation();
    setQrSelectedAppId(app.id);
    setQrLabel(app.name);
    setQrUrlInput(resolveFullUrl(app.url));
    setQrModalOpen(true);
  };

  const handleQrPresetChange = (id: string) => {
    setQrSelectedAppId(id);
    if (id === "__store__") {
      setQrLabel("Gamura Launch Store");
      setQrUrlInput(resolveFullUrl("/launch"));
      return;
    }
    const found = allApps.find((a) => a.id === id);
    if (found) {
      setQrLabel(found.name);
      setQrUrlInput(resolveFullUrl(found.url));
    }
  };

  const qrCenterLogoSrc = useMemo(() => {
    if (qrLogoMode === "none") return undefined;
    if (qrLogoMode === "custom") return qrCustomLogoUrl || undefined;

    const svgToDataUrl = (svg: string) =>
      `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    if (qrLogoMode === "app") {
      const appObj = allApps.find((a) => a.id === qrSelectedAppId);
      if (appObj?.logoUrl && appObj.logoUrl.startsWith("/")) {
        return appObj.logoUrl;
      }
      const c1 = appObj?.c1 || "#059669";
      const c2 = appObj?.c2 || "#047857";
      const letter = (appObj?.name || qrLabel || "G")
        .trim()
        .charAt(0)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "G");
      return svgToDataUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="42" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="30" font-weight="800" fill="#ffffff">${letter}</text></svg>`,
      );
    }

    if (qrLogoMode === "store") {
      return svgToDataUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#059669"/><path d="M22 25v-3a10 10 0 0 1 20 0v3h5a2 2 0 0 1 2 2l-2 22a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3l-2-22a2 2 0 0 1 2-2h5zm4 0h12v-3a6 6 0 0 0-12 0v3z" fill="#ffffff"/></svg>`,
      );
    }

    // Default "gamura" emblem
    return svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${qrColor}"/><circle cx="32" cy="32" r="20" fill="none" stroke="#ffffff" stroke-width="3.5"/><text x="32" y="41" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="26" font-weight="800" fill="#ffffff">G</text></svg>`,
    );
  }, [qrLogoMode, qrCustomLogoUrl, allApps, qrSelectedAppId, qrLabel, qrColor]);

  const handleQrCustomLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQrCustomLogoUrl(reader.result);
        setQrLogoMode("custom");
        showToast("Center logo added ✓");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadQrPng = () => {
    const canvas = document.getElementById(
      "gamura-store-qr-canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const pad = 44;
    const footerH = 72;
    const out = document.createElement("canvas");
    out.width = canvas.width + pad * 2;
    out.height = canvas.height + pad * 2 + footerH;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = qrBgColor || "#FFFFFF";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);

    const isDarkBg = (() => {
      const hex = (qrBgColor || "#FFFFFF").replace("#", "");
      if (hex.length !== 6) return false;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b < 130;
    })();

    ctx.fillStyle = isDarkBg ? "#FFFFFF" : "#1D1D1F";
    ctx.font =
      '700 22px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(qrLabel || "Gamura Store", out.width / 2, canvas.height + pad + 34);

    ctx.fillStyle = isDarkBg ? "rgba(255,255,255,0.72)" : "#6E6E73";
    ctx.font =
      '500 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    const shortUrl =
      qrUrlInput.length > 48 ? `${qrUrlInput.slice(0, 45)}…` : qrUrlInput;
    ctx.fillText(shortUrl, out.width / 2, canvas.height + pad + 58);

    const safeSlug =
      (qrLabel || "gamura-store")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "gamura-store";
    const dataUrl = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${safeSlug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("QR code PNG downloaded ✓");
  };

  const handleShareApp = async (app: StoreAppItem) => {
    const fullUrl = resolveFullUrl(app.url);
    try {
      if (navigator.share) {
        await navigator.share({
          title: app.name,
          text: app.tag,
          url: fullUrl,
        });
        return;
      }
    } catch {
      // fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast("App link copied ✓");
    } catch {
      showToast(fullUrl);
    }
  };

  const handlePublishApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fName.trim();
    if (!cleanName || !fUrl.trim()) return;
    let normalizedUrl = fUrl.trim();
    if (
      !normalizedUrl.startsWith("/") &&
      !/^https?:\/\//i.test(normalizedUrl)
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const created: StoreAppItem = {
      id: `c_${Date.now()}`,
      name: cleanName,
      cat: fCat,
      tag: fTag.trim() || "New on Gamura Store",
      desc: fDesc.trim() || `${cleanName} is now available on Gamura Store.`,
      url: normalizedUrl,
      c1: fC1,
      c2: fC2,
      iconKind: "letter",
      rating: 4.8,
      age: "3+",
      chart: "New",
      dl: "New",
      size: "Web · 1 MB",
    };

    const next = [...customApps, created];
    setCustomApps(next);
    writeStoreJson(CUSTOM_STORE_APPS_KEY, next);
    void pushInstalledAppsToCloud(universeApps, mobileIds, next);
    setFName("");
    setFUrl("");
    setFTag("");
    setFDesc("");
    showToast(`${cleanName} added to Gamura Store`);
    setPage("home");
    setTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCustom = (id: string) => {
    const nextCustom = customApps.filter((a) => a.id !== id);
    setCustomApps(nextCustom);
    writeStoreJson(CUSTOM_STORE_APPS_KEY, nextCustom);
    const nextU = removeAppFromUniverse(id);
    const nextM = removeMobileInstalledId(id);
    setUniverseApps(nextU);
    setMobileIds(nextM);
    void pushInstalledAppsToCloud(nextU, nextM, nextCustom);
    if (selectedApp?.id === id) setSelectedApp(null);
    showToast("App removed from Store");
  };

  const renderAppRow = (app: StoreAppItem, rank?: number) => {
    const isInstalled = installedIdSet.has(app.id);
    const isInstalling = installingId === app.id;
    const isExternalDirectLaunch = app.id === "gamura-redesign";
    const isDirectLaunchApp =
      app.id === "gamura-camera" ||
      app.id === "gamura-for-business" ||
      app.id === "gamura-greetings" ||
      app.id === "gamura-operator" ||
      app.id === "gamura-virus" ||
      isExternalDirectLaunch;
    const stats = getLiveStats(app);
    const currentUserStars =
      stats.userReview?.rating || localRatingsMap[app.id] || 0;
    const hoveredStars = cardHoverStars[app.id] || 0;
    const displayStars = hoveredStars || currentUserStars;

    const handleRowActivate = () => {
      if (
        app.id === "gamura-camera" ||
        app.id === "gamura-for-business" ||
        app.id === "gamura-greetings" ||
        app.id === "gamura-operator" ||
        app.id === "gamura-virus"
      ) {
        window.location.assign(app.url);
      } else if (!isExternalDirectLaunch) {
        setSelectedApp(app);
      }
    };

    const rowMainContent = (
      <>
        {rank !== undefined && (
          <span className="w-5 text-xs font-bold text-[#6E6E73] tabular-nums shrink-0 text-center">
            {rank}
          </span>
        )}
        <StoreAppGlyph app={app} sizeClass="w-14 h-14 text-2xl" iconPx={26} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-[#1D1D1F] truncate">
            {app.name}
          </div>
          <div className="text-xs sm:text-[13px] text-[#6E6E73] truncate">
            {app.tag}
          </div>
          <div className="text-[11px] text-[#6E6E73] mt-0.5 tabular-nums flex items-center gap-1.5">
            <span>{app.cat}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#1D1D1F]">
              {stats.average.toFixed(1)} ★
            </span>
            {stats.reviewCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{stats.reviewCount} reviews</span>
              </>
            )}
            {isInUniverse(app.id) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#059669] font-semibold">Universe</span>
              </>
            )}
          </div>
        </div>
      </>
    );

    const rowActionButtons = (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLivePreviewApp(app);
          }}
          aria-label={`Live preview ${app.name}`}
          title={`Try ${app.name} Live Preview before installing`}
          className="hidden md:inline-flex min-h-[32px] px-2.5 py-1 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-[11px] font-semibold items-center gap-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Eye size={13} className="text-[#059669]" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={(e) => openQrForApp(app, e)}
          aria-label={`Generate QR code for ${app.name}`}
          title={`Share ${app.name} QR Code`}
          className="hidden sm:inline-flex w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <QrCode size={15} />
        </button>

        {isInstalling ? (
          <div className="px-4 py-1.5 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums shrink-0">
            {installPct}%
          </div>
        ) : isInstalled ? (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide shrink-0 whitespace-nowrap transition-colors"
          >
            OPEN
          </a>
        ) : isDirectLaunchApp ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => handleGetClick(app, e)}
              className="px-4 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide whitespace-nowrap cursor-pointer transition-colors"
            >
              GET
            </button>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide whitespace-nowrap transition-colors"
            >
              OPEN
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => handleGetClick(app, e)}
            className="px-5 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide shrink-0 whitespace-nowrap cursor-pointer transition-colors"
          >
            GET
          </button>
        )}
      </div>
    );

    if (isExternalDirectLaunch) {
      return (
        <div
          key={app.id}
          className="w-full py-3.5 px-2.5 sm:px-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors text-left space-y-2"
        >
          <div className="flex items-center gap-3.5">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
            >
              {rowMainContent}
            </a>
            {rowActionButtons}
          </div>

          <div
            onMouseLeave={() =>
              setCardHoverStars((prev) => ({ ...prev, [app.id]: 0 }))
            }
            className="flex flex-wrap items-center justify-between gap-2 pl-[68px] pr-1 pt-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#6E6E73]">
                {currentUserStars > 0 ? "Your rating:" : "Rate app:"}
              </span>
              <div
                className="inline-flex items-center gap-0.5"
                role="group"
                aria-label={`Rate ${app.name}`}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= displayStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() =>
                        setCardHoverStars((prev) => ({ ...prev, [app.id]: star }))
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleQuickRate(app, star);
                      }}
                      aria-label={`Rate ${app.name} ${star} out of 5 stars`}
                      className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#059669]"
                    >
                      <Star
                        size={14}
                        className={
                          filled
                            ? "text-amber-500 fill-amber-500"
                            : "text-zinc-300 hover:text-amber-400"
                        }
                      />
                    </button>
                  );
                })}
              </div>
              {currentUserStars > 0 && (
                <span className="text-[11px] font-semibold text-[#059669] tabular-nums">
                  {currentUserStars}/5
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6E6E73] tabular-nums">
              {stats.average.toFixed(1)} avg · {stats.totalVotes} ratings
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={app.id}
        onClick={handleRowActivate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowActivate();
          }
        }}
        className="w-full flex items-center gap-3.5 py-3.5 px-2.5 sm:px-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors text-left cursor-pointer"
      >
        {rowMainContent}
        {rowActionButtons}
      </div>
    );
  };

  const renderAppTile = (app: StoreAppItem) => {
    const stats = getLiveStats(app);
    if (app.id === "gamura-redesign") {
      const currentUserStars =
        stats.userReview?.rating || localRatingsMap[app.id] || 0;
      const hoveredStars = cardHoverStars[app.id] || 0;
      const displayStars = hoveredStars || currentUserStars;
      return (
        <div
          key={app.id}
          className="w-[126px] sm:w-[134px] shrink-0 text-left space-y-1.5"
        >
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group cursor-pointer space-y-2"
          >
            <div className="group-hover:scale-[1.03] transition-transform">
              <StoreAppGlyph
                app={app}
                sizeClass="w-[116px] h-[116px] sm:w-[126px] sm:h-[126px] text-4xl"
                iconPx={46}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                {app.name}
              </div>
              <div className="text-[11px] text-[#6E6E73] tabular-nums">
                {stats.average.toFixed(1)} ★ · {app.dl}
              </div>
            </div>
          </a>
          <div
            onMouseLeave={() =>
              setCardHoverStars((prev) => ({ ...prev, [app.id]: 0 }))
            }
            className="flex items-center gap-0.5 pt-0.5"
            role="group"
            aria-label={`Rate ${app.name}`}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= displayStars;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() =>
                    setCardHoverStars((prev) => ({ ...prev, [app.id]: star }))
                  }
                  onClick={() => void handleQuickRate(app, star)}
                  aria-label={`Rate ${app.name} ${star} out of 5 stars`}
                  className="p-0.5 rounded hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    size={12}
                    className={
                      filled
                        ? "text-amber-500 fill-amber-500"
                        : "text-zinc-300 hover:text-amber-400"
                    }
                  />
                </button>
              );
            })}
            {currentUserStars > 0 && (
              <span className="ml-1 text-[10px] font-semibold text-[#059669] tabular-nums">
                {currentUserStars}★
              </span>
            )}
          </div>
        </div>
      );
    }

    return app.id === "gamura-camera" ||
      app.id === "gamura-for-business" ||
      app.id === "gamura-greetings" ||
      app.id === "gamura-operator" ||
      app.id === "gamura-virus" ? (
      <a
        key={app.id}
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-[116px] sm:w-[126px] shrink-0 text-left group cursor-pointer space-y-2 block"
      >
        <div className="group-hover:scale-[1.03] transition-transform">
          <StoreAppGlyph
            app={app}
            sizeClass="w-[116px] h-[116px] sm:w-[126px] sm:h-[126px] text-4xl"
            iconPx={46}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#1D1D1F] truncate">
            {app.name}
          </div>
          <div className="text-[11px] text-[#6E6E73] tabular-nums">
            {stats.average.toFixed(1)} ★ · {app.dl}
          </div>
        </div>
      </a>
    ) : (
      <button
        key={app.id}
        type="button"
        onClick={() => setSelectedApp(app)}
        className="w-[116px] sm:w-[126px] shrink-0 text-left group cursor-pointer space-y-2"
      >
        <div className="group-hover:scale-[1.03] transition-transform">
          <StoreAppGlyph
            app={app}
            sizeClass="w-[116px] h-[116px] sm:w-[126px] sm:h-[126px] text-4xl"
            iconPx={46}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#1D1D1F] truncate">
            {app.name}
          </div>
          <div className="text-[11px] text-[#6E6E73] tabular-nums">
            {stats.average.toFixed(1)} ★ · {app.dl}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col pb-24"
    >
      {/* Top Apple Header Bar with Launch Logo Top-Left */}
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            title="Back to Gamura Home"
            className="min-h-[40px] flex items-center gap-2 pr-3 pl-1.5 py-1 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/70 border border-zinc-200/80 transition-colors cursor-pointer shrink-0"
          >
            <img
              src={logoFallback ? LAUNCH_LOGO_FALLBACK : LAUNCH_LOGO_SRC}
              alt="Gamura Launch"
              referrerPolicy="no-referrer"
              onError={() => setLogoFallback(true)}
              className="w-7 h-7 rounded-full object-contain scale-[1.12] mix-blend-multiply bg-white"
            />
            <span className="text-xs font-semibold text-[#1D1D1F] whitespace-nowrap">
              Home
            </span>
          </button>

          <div className="flex-1 flex items-center gap-2.5 bg-[#F5F5F7] border border-zinc-200/80 focus-within:bg-white focus-within:border-[#059669] rounded-full px-3.5 py-2 transition-all min-w-0">
            <Search size={15} className="text-[#6E6E73] shrink-0" />
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search Gamura Store"
              aria-label="Search Gamura Store"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] min-w-0"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => setQueryText("")}
                aria-label="Clear search"
                className="text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {authUser ? (
            <button
              type="button"
              onClick={() => setPage("lib")}
              title={`Cloud Sync Active · ${gamuraHandle || authUser.email || "Gamura ID"}`}
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Cloud size={14} />
              <span>{isSyncingCloud ? "Syncing…" : "Synced"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStoreGoogleSignIn}
              title="Sign in with Gamura ID to enable Cloud Sync"
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-[#1D1D1F] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn size={13} className="text-[#059669]" />
              <span>Cloud Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={openQrForStore}
            title="Generate QR Code for Store Links"
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 border border-zinc-200/80 text-[#1D1D1F] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <QrCode size={14} className="text-[#059669]" />
            <span className="hidden sm:inline">QR Share</span>
          </button>

          <a
            href="/gpdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>G PDF Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Filter Tabs */}
        {page === "home" && !queryText.trim() && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-black/[0.04]">
            {[
              { id: "foryou" as const, label: "For you" },
              { id: "games" as const, label: "Games" },
              { id: "top" as const, label: "Top charts" },
              { id: "cats" as const, label: "Categories" },
              { id: "new" as const, label: "New" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  tab === t.id
                    ? "text-[#059669] border-[#059669]"
                    : "text-[#6E6E73] border-transparent hover:text-[#1D1D1F]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Centered Launch Hero Branding Banner */}
        {page === "home" && !queryText.trim() && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl px-5 py-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <img
                src={logoFallback ? LAUNCH_LOGO_FALLBACK : LAUNCH_LOGO_SRC}
                alt="Gamura Launch Logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoFallback(true)}
                className="w-full h-full object-contain scale-[1.08] mix-blend-multiply"
              />
            </div>
            <div className="space-y-1 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Gamura Launch Store
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6E73]">
                Try live device previews, read verified reviews, sync installed
                apps via Gamura ID Cloud Sync, or share via scannable QR code.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const defaultApp =
                    allApps.find((a) => a.id === "gamura-ppt-cred") ||
                    allApps[0];
                  if (defaultApp) setLivePreviewApp(defaultApp);
                }}
                className="min-h-[38px] px-4 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye size={14} />
                <span>Try Live Simulator</span>
              </button>
              <button
                type="button"
                onClick={openQrForStore}
                className="min-h-[38px] px-4 py-2 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <QrCode size={14} />
                <span>Generate QR Code</span>
              </button>
              {authUser ? (
                <button
                  type="button"
                  onClick={() => setPage("lib")}
                  className="min-h-[38px] px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Cloud size={14} className="text-[#059669]" />
                  <span>Cloud Sync: {gamuraHandle || "Connected"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStoreGoogleSignIn}
                  className="min-h-[38px] px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CloudOff size={14} className="text-[#6E6E73]" />
                  <span>Sign in for Cloud Sync</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {queryText.trim() ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-[#1D1D1F] px-2 pb-1">
              Discover ({filteredApps.length})
            </h2>
            {filteredApps.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {filteredApps.map((app) => renderAppRow(app))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[#6E6E73]">
                No results for “{queryText}”
              </div>
            )}
          </div>
        ) : page === "home" ? (
          <>
            {tab === "foryou" && (
              <div className="space-y-6">
                {/* Featured Studio Spotlights: Gamura Veo & GAMURA CAMERA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(() => {
                    const veoApp = allApps.find((a) => a.id === "veo");
                    if (!veoApp) return null;
                    const veoInstalled = installedIdSet.has(veoApp.id);
                    const veoInstalling = installingId === veoApp.id;
                    return (
                      <div
                        onClick={() => setSelectedApp(veoApp)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedApp(veoApp);
                          }
                        }}
                        className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <StoreAppGlyph
                            app={veoApp}
                            sizeClass="w-16 h-16"
                            iconPx={32}
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                              Spotlight · Video Studio
                            </span>
                            <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight truncate">
                              {veoApp.name}
                            </h2>
                            <p className="text-xs text-[#6E6E73] truncate">
                              {veoApp.tag}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {veoInstalling ? (
                            <span className="px-4 py-2 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums">
                              {installPct}%
                            </span>
                          ) : veoInstalled ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUninstallAll(veoApp);
                              }}
                              className="px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#6E6E73] cursor-pointer transition-colors"
                            >
                              Uninstall
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleGetClick(veoApp, e)}
                              className="px-4 py-2 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide cursor-pointer transition-colors"
                            >
                              GET
                            </button>
                          )}
                          <a
                            href={veoApp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <span>OPEN</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const camApp = allApps.find((a) => a.id === "gamura-camera");
                    if (!camApp) return null;
                    const camInstalled = installedIdSet.has(camApp.id);
                    const camInstalling = installingId === camApp.id;
                    return (
                      <a
                        href={camApp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <StoreAppGlyph
                            app={camApp}
                            sizeClass="w-16 h-16"
                            iconPx={32}
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                              Spotlight · Camera &amp; Editor
                            </span>
                            <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight truncate">
                              {camApp.name}
                            </h2>
                            <p className="text-xs text-[#6E6E73] truncate">
                              {camApp.tag}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {camInstalling ? (
                            <span
                              onClick={(e) => e.preventDefault()}
                              className="px-4 py-2 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums"
                            >
                              {installPct}%
                            </span>
                          ) : camInstalled ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUninstallAll(camApp);
                              }}
                              className="px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#6E6E73] cursor-pointer transition-colors"
                            >
                              Uninstall
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleGetClick(camApp, e);
                              }}
                              className="px-4 py-2 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide cursor-pointer transition-colors"
                            >
                              GET
                            </button>
                          )}
                          <span className="px-4 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide inline-flex items-center gap-1.5 transition-colors whitespace-nowrap">
                            <span>OPEN</span>
                            <ExternalLink size={12} />
                          </span>
                        </div>
                      </a>
                    );
                  })()}
                </div>

                {/* Featured Carousel */}
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                  {allApps.map((app) => {
                    if (app.id === "gamura-redesign") {
                      const stats = getLiveStats(app);
                      const currentUserStars =
                        stats.userReview?.rating || localRatingsMap[app.id] || 0;
                      const hoveredStars = cardHoverStars[`carousel_${app.id}`] || 0;
                      const displayStars = hoveredStars || currentUserStars;
                      return (
                        <div
                          key={app.id}
                          style={{
                            background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
                          }}
                          className="min-w-[260px] sm:min-w-[300px] flex-1 snap-center rounded-[22px] p-5 min-h-[172px] text-white text-left relative overflow-hidden flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-transform"
                        >
                          <span className="absolute -right-2 -top-4 text-[120px] font-black opacity-15 pointer-events-none select-none leading-none">
                            {app.name.charAt(0)}
                          </span>
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 block cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <StoreAppGlyph
                                app={app}
                                sizeClass="w-12 h-12 text-lg"
                                iconPx={22}
                              />
                              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase">
                                {app.cat}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
                                {app.name}
                              </div>
                              <div className="text-xs opacity-90 line-clamp-1 mt-0.5">
                                {app.tag}
                              </div>
                            </div>
                          </a>

                          <div
                            onMouseLeave={() =>
                              setCardHoverStars((prev) => ({
                                ...prev,
                                [`carousel_${app.id}`]: 0,
                              }))
                            }
                            className="relative z-10 mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between gap-2"
                          >
                            <div
                              className="inline-flex items-center gap-0.5"
                              role="group"
                              aria-label={`Rate ${app.name}`}
                            >
                              {[1, 2, 3, 4, 5].map((star) => {
                                const filled = star <= displayStars;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() =>
                                      setCardHoverStars((prev) => ({
                                        ...prev,
                                        [`carousel_${app.id}`]: star,
                                      }))
                                    }
                                    onClick={() => void handleQuickRate(app, star)}
                                    aria-label={`Rate ${app.name} ${star} out of 5 stars`}
                                    className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                                  >
                                    <Star
                                      size={14}
                                      className={
                                        filled
                                          ? "text-amber-300 fill-amber-300"
                                          : "text-white/55 hover:text-amber-200"
                                      }
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-[11px] font-semibold text-white/90 tabular-nums whitespace-nowrap">
                              {currentUserStars > 0
                                ? `Rated ${currentUserStars}/5 · ${stats.average.toFixed(1)}★`
                                : `Rate · ${stats.average.toFixed(1)}★`}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return app.id === "gamura-camera" ||
                      app.id === "gamura-for-business" ||
                      app.id === "gamura-greetings" ||
                      app.id === "gamura-operator" ||
                      app.id === "gamura-virus" ? (
                      <a
                        key={app.id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
                        }}
                        className="min-w-[260px] sm:min-w-[300px] flex-1 snap-center rounded-[22px] p-5 min-h-[172px] text-white text-left relative overflow-hidden flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                      >
                        <span className="absolute -right-2 -top-4 text-[120px] font-black opacity-15 pointer-events-none select-none leading-none">
                          {app.name.charAt(0)}
                        </span>
                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <StoreAppGlyph
                            app={app}
                            sizeClass="w-12 h-12 text-lg"
                            iconPx={22}
                          />
                          <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase">
                            {app.cat}
                          </span>
                        </div>
                        <div className="relative z-10 mt-3">
                          <div className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
                            {app.name}
                          </div>
                          <div className="text-xs opacity-90 line-clamp-1 mt-0.5">
                            {app.tag}
                          </div>
                        </div>
                      </a>
                    ) : (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        style={{
                          background: `linear-gradient(135deg, ${app.c1}, ${app.c2})`,
                        }}
                        className="min-w-[260px] sm:min-w-[300px] flex-1 snap-center rounded-[22px] p-5 min-h-[172px] text-white text-left relative overflow-hidden flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                      >
                        <span className="absolute -right-2 -top-4 text-[120px] font-black opacity-15 pointer-events-none select-none leading-none">
                          {app.name.charAt(0)}
                        </span>
                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <StoreAppGlyph
                            app={app}
                            sizeClass="w-12 h-12 text-lg"
                            iconPx={22}
                          />
                          <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase">
                            {app.cat}
                          </span>
                        </div>
                        <div className="relative z-10 mt-3">
                          <div className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
                            {app.name}
                          </div>
                          <div className="text-xs opacity-90 line-clamp-1 mt-0.5">
                            {app.tag}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Games on Launch (GAINOSOR, GIGOR, Gamura Galaxy) */}
                {(() => {
                  const gameApps = allApps.filter((a) => a.cat === "Games");
                  if (gameApps.length === 0) return null;
                  return (
                    <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                            Games on Launch
                          </h2>
                          <p className="text-xs text-[#6E6E73]">
                            Play instantly or install GAINOSOR &amp; GIGOR to Universe Apps
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab("games")}
                          className="text-xs font-semibold text-[#059669] hover:underline cursor-pointer shrink-0"
                        >
                          See all ({gameApps.length})
                        </button>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {gameApps.map((app) => renderAppRow(app))}
                      </div>
                    </div>
                  );
                })()}

                {/* Gamura Originals */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                      Gamura originals
                    </h2>
                    <span className="text-xs font-semibold text-[#059669]">
                      {allApps.length} apps
                    </span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {allApps.map(renderAppTile)}
                  </div>
                </div>

                {/* Interactive Live Preview Simulator Shelf */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                        Live Interactive Previews
                      </h2>
                      <p className="text-xs text-[#6E6E73]">
                        Test PPT Cred, Cover Gened &amp; apps inside a simulated phone or desktop frame before installing
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      "gamura-virus",
                      "gamura-operator",
                      "gamura-greetings",
                      "gamura-redesign",
                      "gamura-gcard",
                      "gamura-gwallet",
                      "gamura-ppt-cred",
                      "gamura-cover-gened",
                      "gamura-pb1",
                      "gamura-pb2",
                      "gamura-lifeline",
                      "gamura-shield",
                      "gamura-fresh",
                    ]
                      .map((id) => allApps.find((a) => a.id === id))
                      .filter((a): a is StoreAppItem => Boolean(a))
                      .map((previewApp) => (
                        <button
                          key={previewApp.id}
                          type="button"
                          onClick={() => setLivePreviewApp(previewApp)}
                          className="min-w-[205px] shrink-0 p-3 rounded-2xl bg-[#F5F5F7] hover:bg-[#E2F5ED]/60 border border-zinc-200/80 hover:border-[#059669]/40 flex items-center gap-3 text-left transition-all cursor-pointer"
                        >
                          <StoreAppGlyph
                            app={previewApp}
                            sizeClass="w-11 h-11"
                            iconPx={20}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#1D1D1F] truncate">
                              {previewApp.name}
                            </div>
                            <div className="text-[11px] text-[#059669] font-semibold inline-flex items-center gap-1 mt-0.5">
                              <Eye size={11} />
                              <span>Launch Preview</span>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Quality Filter & Sort Bar + Apple App Store Style Discover List */}
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                        Discover
                      </h2>
                      <span className="text-xs text-[#6E6E73] tabular-nums">
                        · {applyQualityFilterAndSort(allApps).length} apps
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F5F5F7]">
                        {(
                          [
                            { id: "all", label: "All" },
                            { id: "4.9", label: "4.9★+" },
                            { id: "4.5", label: "4.5★+" },
                            { id: "reviewed", label: "Reviewed" },
                          ] as const
                        ).map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setMinRatingFilter(q.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                              minRatingFilter === q.id
                                ? "bg-white text-[#1D1D1F] shadow-xs"
                                : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>

                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F5F5F7] text-[11px] font-semibold text-[#1D1D1F]">
                        <SlidersHorizontal size={12} className="text-[#059669]" />
                        <select
                          aria-label="Sort store apps"
                          value={sortOrder}
                          onChange={(e) =>
                            setSortOrder(
                              e.target.value as "recommended" | "rating" | "reviews",
                            )
                          }
                          className="bg-transparent outline-none cursor-pointer pr-1"
                        >
                          <option value="recommended">Recommended</option>
                          <option value="rating">Highest Rated</option>
                          <option value="reviews">Most Reviewed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {applyQualityFilterAndSort(allApps).length > 0 ? (
                      applyQualityFilterAndSort(allApps).map((app) =>
                        renderAppRow(app),
                      )
                    ) : (
                      <div className="py-10 text-center text-xs text-[#6E6E73]">
                        No apps match the selected quality filter yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "games" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                <div className="px-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                    Games on Gamura Launch
                  </h2>
                  <p className="text-xs text-[#6E6E73]">
                    Featured arcade &amp; action web games including GAINOSOR and GIGOR.
                  </p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {allApps
                    .filter((a) => a.cat === "Games")
                    .map((app, i) => renderAppRow(app, i + 1))}
                </div>
              </div>
            )}

            {tab === "top" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F] px-2 pb-1">
                  Top rated &amp; reviewed apps
                </h2>
                <div className="divide-y divide-zinc-100">
                  {[...allApps]
                    .sort(
                      (a, b) =>
                        getLiveStats(b).average - getLiveStats(a).average ||
                        getLiveStats(b).reviewCount - getLiveStats(a).reviewCount,
                    )
                    .map((app, i) => renderAppRow(app, i + 1))}
                </div>
              </div>
            )}

            {tab === "cats" && (
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                      {cat}
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                      {allApps
                        .filter((a) => a.cat === cat)
                        .map(renderAppTile)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "new" && (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F] px-2 pb-1">
                  New &amp; updated
                </h2>
                <div className="divide-y divide-zinc-100">
                  {[...allApps].reverse().map((app) => renderAppRow(app))}
                </div>
              </div>
            )}
          </>
        ) : page === "search" ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
              Popular searches
            </h2>
            <div className="divide-y divide-zinc-100">
              {allApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setQueryText(app.name)}
                  className="w-full flex items-center gap-3 py-3 px-2 hover:bg-[#F5F5F7] rounded-xl text-left text-sm font-medium text-[#1D1D1F] cursor-pointer"
                >
                  <Search size={14} className="text-[#6E6E73]" />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : page === "lib" ? (
          <div className="space-y-4">
            {/* Real-Time Gamura ID Cloud Sync Panel */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    authUser
                      ? "bg-[#E2F5ED] text-[#059669]"
                      : "bg-[#F5F5F7] text-[#6E6E73]"
                  }`}
                >
                  {authUser ? <Cloud size={20} /> : <CloudOff size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F] truncate">
                    {authUser
                      ? `Gamura Cloud Sync · ${gamuraHandle || authUser.email || "Signed in"}`
                      : "Cloud Sync Disabled (Local Only)"}
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">
                    {authUser
                      ? `Your installed apps sync in real time across devices via Firestore${
                          cloudState?.lastDevice
                            ? ` · Last device: ${cloudState.lastDevice}`
                            : ""
                        }`
                      : "Sign in with your Gamura ID to access your installed apps across phones, tablets, and desktops."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {authUser ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        void pushInstalledAppsToCloud(
                          universeApps,
                          mobileIds,
                          customApps,
                        );
                        showToast("Synced installed apps to cloud ✓");
                      }}
                      className="min-h-[38px] px-3.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <RefreshCw
                        size={13}
                        className={isSyncingCloud ? "animate-spin" : ""}
                      />
                      <span>{isSyncingCloud ? "Syncing…" : "Sync Now"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStoreSignOut}
                      className="min-h-[38px] px-3.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#6E6E73] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStoreGoogleSignIn}
                    className="min-h-[40px] px-4 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <LogIn size={14} />
                    <span>Sign In with Gamura ID</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                  Installed apps
                </h2>
                <span className="text-xs text-[#6E6E73] tabular-nums">
                  {installedIdSet.size} installed
                </span>
              </div>

              {allApps.filter((a) => installedIdSet.has(a.id)).length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {allApps
                    .filter((a) => installedIdSet.has(a.id))
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                      >
                        {app.id === "gamura-redesign" ? (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3.5 text-left min-w-0 flex-1 cursor-pointer"
                          >
                            <StoreAppGlyph
                              app={app}
                              sizeClass="w-14 h-14 text-2xl"
                              iconPx={26}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#1D1D1F] truncate">
                                {app.name}
                              </div>
                              <div className="text-xs text-[#6E6E73] truncate">
                                {[
                                  isInUniverse(app.id) ? "In Universe Apps" : "",
                                  isInMobile(app.id) ? "In Mobile App" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="flex items-center gap-3.5 text-left min-w-0 flex-1 cursor-pointer"
                          >
                            <StoreAppGlyph
                              app={app}
                              sizeClass="w-14 h-14 text-2xl"
                              iconPx={26}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#1D1D1F] truncate">
                                {app.name}
                              </div>
                              <div className="text-xs text-[#6E6E73] truncate">
                                {[
                                  isInUniverse(app.id) ? "In Universe Apps" : "",
                                  isInMobile(app.id) ? "In Mobile App" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                          </button>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors"
                          >
                            OPEN
                          </a>
                          <button
                            type="button"
                            onClick={() => handleUninstallAll(app)}
                            className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Uninstall
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-medium text-[#1D1D1F]">
                    Nothing installed yet.
                  </p>
                  <p className="text-xs text-[#6E6E73]">
                    Tap GET on any app to install it in Universe Page or your
                    mobile app.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Developer Tab */
          <div className="space-y-5">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                  Publish an app
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Add a web application to the Gamura Launch Store catalog.
                </p>
              </div>

              <form onSubmit={handlePublishApp} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    maxLength={40}
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="App name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                  <input
                    required
                    type="text"
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                    placeholder="App link (https://…)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    maxLength={60}
                    value={fTag}
                    onChange={(e) => setFTag(e.target.value)}
                    placeholder="Short tagline"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                  />
                  <div className="relative">
                    <select
                      value={fCat}
                      onChange={(e) => setFCat(e.target.value)}
                      aria-label="App Category"
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669] cursor-pointer"
                    >
                      {[
                        "Platform",
                        "Marketplace",
                        "Communication",
                        "AI",
                        "Games",
                        "Developer tools",
                        "Music & Audio",
                        "Finance",
                        "Portfolio",
                        "Productivity",
                        "Creative",
                        "Education",
                        "Utilities",
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                    />
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
                />

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6E6E73]">
                  <span>Icon Colors:</span>
                  <input
                    type="color"
                    value={fC1}
                    onChange={(e) => setFC1(e.target.value)}
                    aria-label="Primary gradient color"
                    className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={fC2}
                    onChange={(e) => setFC2(e.target.value)}
                    aria-label="Secondary gradient color"
                    className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Add to Gamura Store
                </button>
              </form>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Your added apps
              </h2>
              {customApps.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {customApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3.5 py-3"
                    >
                      <StoreAppGlyph
                        app={app}
                        sizeClass="w-12 h-12 text-lg"
                        iconPx={22}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1D1D1F] truncate">
                          {app.name}
                        </div>
                        <div className="text-xs text-[#6E6E73]">{app.cat}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => openQrForApp(app, e)}
                          className="px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200 text-[#1D1D1F] text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <QrCode size={12} />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(app.id)}
                          className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6E6E73] py-4 text-center">
                  No custom apps published yet.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Apple Store Dock */}
      <nav
        aria-label="Gamura Store Navigation"
        className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[calc(100vw-20px)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center p-1.5 gap-1 rounded-[28px] bg-white/92 backdrop-blur-2xl border border-zinc-200/80 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.14)]">
          {[
            { id: "home" as const, label: "Home", icon: Home },
            { id: "search" as const, label: "Search", icon: Search },
            { id: "lib" as const, label: "My apps", icon: LayoutGrid },
            { id: "dev" as const, label: "Developer", icon: Plus },
          ].map((navItem) => {
            const Icon = navItem.icon;
            const active = page === navItem.id;
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => {
                  setPage(navItem.id);
                  setQueryText("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`min-h-[46px] min-w-[68px] sm:min-w-[84px] px-3 py-1.5 rounded-[22px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#E2F5ED] text-[#059669] font-semibold"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] font-medium"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                <span className="text-[10px] tracking-tight leading-none">
                  {navItem.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Apple App Store Style App Detail Sheet (Exact Uploaded Screenshot Design) */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] overflow-y-auto shadow-2xl border border-zinc-200/80 pb-8"
          >
            {/* Top Sheet Header */}
            <div className="sticky top-0 z-10 bg-white/92 backdrop-blur-xl px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                Discover
              </span>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                aria-label="Close app details"
                className="w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300/80 flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 sm:px-7 pt-1 space-y-6">
              {/* App Header Lockup matching Screenshot */}
              <div className="flex items-start gap-4">
                <StoreAppGlyph
                  app={selectedApp}
                  sizeClass="w-24 h-24 sm:w-28 sm:h-28 text-4xl"
                  iconPx={44}
                />
                <div className="flex-1 min-w-0 pt-0.5 space-y-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                      {selectedApp.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] mt-0.5">
                      {selectedApp.tag}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {installingId === selectedApp.id ? (
                        <span className="px-5 py-1.5 rounded-full bg-[#E2F5ED] text-[#059669] text-xs font-bold tabular-nums">
                          {installPct}%
                        </span>
                      ) : installedIdSet.has(selectedApp.id) ? (
                        <>
                          <a
                            href={selectedApp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold tracking-wide transition-colors inline-flex items-center gap-1"
                          >
                            <span>OPEN</span>
                            <ExternalLink size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setLivePreviewApp(selectedApp)}
                            className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye size={13} className="text-[#059669]" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUninstallAll(selectedApp)}
                            className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#6E6E73] cursor-pointer transition-colors"
                          >
                            Uninstall
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPromptApp(selectedApp)}
                            className="px-6 py-1.5 rounded-full bg-[#E2F5ED] hover:bg-[#CEEFE0] text-[#059669] text-xs font-bold tracking-wide cursor-pointer transition-colors"
                          >
                            GET
                          </button>
                          <button
                            type="button"
                            onClick={() => setLivePreviewApp(selectedApp)}
                            className="px-4 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Eye size={13} />
                            <span>Live Preview</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openQrForApp(selectedApp)}
                        aria-label="Show QR code"
                        title="Generate QR Code for this app"
                        className="w-9 h-9 rounded-full hover:bg-zinc-100 text-[#059669] flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareApp(selectedApp)}
                        aria-label="Share app"
                        title="Share app link"
                        className="w-9 h-9 rounded-full hover:bg-zinc-100 text-[#059669] flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Share size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Metrics Strip Matching Apple App Store Screenshot */}
              {(() => {
                const activeStats = getLiveStats(selectedApp);
                return (
                  <div className="grid grid-cols-3 divide-x divide-zinc-200/80 py-3.5 border-y border-zinc-200/70 text-center">
                    <div className="px-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                        Rating ({activeStats.totalVotes})
                      </div>
                      <div className="text-xl font-bold text-[#1D1D1F] tabular-nums mt-0.5">
                        {activeStats.average.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-[#059669] tracking-tight">
                        {"★".repeat(Math.round(activeStats.average))}
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                        Age
                      </div>
                      <div className="text-xl font-bold text-[#1D1D1F] tabular-nums mt-0.5">
                        {selectedApp.age || "3+"}
                      </div>
                      <div className="text-[11px] text-[#6E6E73]">Years Old</div>
                    </div>
                    <div className="px-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                        Chart
                      </div>
                      <div className="text-xl font-bold text-[#1D1D1F] mt-0.5">
                        {selectedApp.chart || "Top"}
                      </div>
                      <div className="text-[11px] text-[#6E6E73] truncate">
                        {selectedApp.cat}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Destination Quick Controls */}
              {installedIdSet.has(selectedApp.id) && (
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-2.5">
                  <div className="text-xs font-bold text-[#1D1D1F]">
                    Where this app is installed
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUniverse(selectedApp)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 border transition-colors ${
                        isInUniverse(selectedApp.id)
                          ? "bg-[#E2F5ED] border-[#059669]/30 text-[#059669]"
                          : "bg-white border-zinc-200 text-[#6E6E73]"
                      }`}
                    >
                      <Globe size={13} />
                      <span>
                        {isInUniverse(selectedApp.id)
                          ? "Added to Universe Apps ✓"
                          : "Add to Universe Apps"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextM = addMobileInstalledId(selectedApp.id);
                        setMobileIds(nextM);
                        void pushInstalledAppsToCloud(
                          universeApps,
                          nextM,
                          customApps,
                        );
                        downloadStandaloneAppPackage(selectedApp);
                        showToast(`Downloaded ${selectedApp.name} for mobile ✓`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Smartphone size={13} />
                      <span>Download Mobile File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Showcase Cards (Clickable to launch Live Preview) */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {["Discover", "Play", "Create"].map((word, idx) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setLivePreviewApp(selectedApp)}
                    style={{
                      background: `linear-gradient(${150 + idx * 40}deg, ${selectedApp.c1}, ${selectedApp.c2})`,
                    }}
                    className="w-40 h-56 shrink-0 rounded-2xl p-4 text-white flex flex-col justify-between shadow-xs text-left cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <span className="text-3xl font-black opacity-35">
                      {selectedApp.name.charAt(0)}
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold leading-snug">
                        {word} with
                        <br />
                        {selectedApp.name.split(" ")[0]}
                      </div>
                      <div className="text-[11px] opacity-85 mt-1 inline-flex items-center gap-1">
                        <Eye size={11} />
                        <span>Live Preview</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* About */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  About this app
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  {selectedApp.desc}
                </p>
              </div>

              {/* Data Safety */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="text-[#059669] shrink-0 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1D1D1F]">
                    Data safety &amp; Cloud Sync
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    No data is shared with third parties. Gamura apps run in
                    your browser and optionally sync your library and reviews
                    with your Gamura ID via Firestore.
                  </p>
                </div>
              </div>

              {/* Real-Time Star Ratings & Community Reviews */}
              {(() => {
                const stats = getLiveStats(selectedApp);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1D1D1F]">
                        Ratings &amp; reviews
                      </h3>
                      <span className="text-xs text-[#6E6E73] tabular-nums">
                        {stats.totalVotes} ratings · {stats.reviewCount} reviews
                      </span>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-center shrink-0">
                        <div className="text-4xl font-light text-[#1D1D1F] tabular-nums">
                          {stats.average.toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 text-[#059669] mt-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              fill={
                                n <= Math.round(stats.average)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {stats.distribution.map((pct, i) => (
                          <div
                            key={5 - i}
                            className="flex items-center gap-2 text-[11px] text-[#6E6E73]"
                          >
                            <span className="w-2.5 tabular-nums">{5 - i}</span>
                            <div className="flex-1 h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-[#059669] rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Write / Edit Review Card */}
                    <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-zinc-200/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D1D1F]">
                          <MessageSquarePlus
                            size={14}
                            className="text-[#059669]"
                          />
                          <span>
                            {stats.userReview
                              ? "Update your review"
                              : "Tap to rate & review"}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1"
                          role="group"
                          aria-label={`Rate ${selectedApp.name}`}
                        >
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setDraftRating(starVal)}
                              aria-label={`${starVal} stars`}
                              className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                size={18}
                                className={
                                  starVal <= draftRating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-zinc-300"
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        maxLength={600}
                        value={draftComment}
                        onChange={(e) => setDraftComment(e.target.value)}
                        placeholder={
                          authUser
                            ? `Share what you like about ${selectedApp.name}…`
                            : "Write a review (sign in with Gamura ID to publish to the community)…"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200/80 text-xs sm:text-sm text-[#1D1D1F] outline-none focus:border-[#059669] resize-y"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-[#6E6E73] tabular-nums">
                          {draftComment.length}/600 ·{" "}
                          {authUser
                            ? `Posting as ${gamuraHandle || authUser.displayName || "Member"}`
                            : "Guest mode"}
                        </span>

                        <div className="flex items-center gap-2">
                          {stats.userReview && authUser && (
                            <button
                              type="button"
                              disabled={isSubmittingReview}
                              onClick={() => handleDeleteReview(selectedApp)}
                              className="px-3 py-1.5 rounded-full bg-white hover:bg-red-50 text-red-600 border border-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          {!authUser && (
                            <button
                              type="button"
                              onClick={handleStoreGoogleSignIn}
                              className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <LogIn size={12} className="text-[#059669]" />
                              <span>Sign in</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleSubmitReview(selectedApp)}
                            className="px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-60"
                          >
                            {isSubmittingReview
                              ? "Saving…"
                              : authUser
                                ? stats.userReview
                                  ? "Update Review"
                                  : "Publish Review"
                                : "Save Star Rating"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Community Reviews Feed */}
                    {stats.reviews.length > 0 ? (
                      <div className="space-y-2.5">
                        {stats.reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {rev.authorPhoto ? (
                                  <img
                                    src={rev.authorPhoto}
                                    alt={rev.authorName}
                                    referrerPolicy="no-referrer"
                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#E2F5ED] text-[#059669] text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {rev.authorName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-[#1D1D1F] truncate">
                                  {rev.authorName}
                                </span>
                                {rev.userId === authUser?.uid && (
                                  <span className="text-[10px] font-semibold text-[#059669]">
                                    · You
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 text-[11px] text-[#6E6E73]">
                                <span className="text-amber-500">
                                  {"★".repeat(rev.rating)}
                                  <span className="text-zinc-300">
                                    {"★".repeat(5 - rev.rating)}
                                  </span>
                                </span>
                                <span>
                                  {new Date(rev.updatedAtMs).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {rev.comment && (
                              <p className="text-xs text-[#424245] leading-relaxed">
                                {rev.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6E6E73] text-center py-2">
                        No written reviews yet — be the first to review {selectedApp.name}!
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Ask User Where To Install/Use App Modal */}
      {promptApp && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPromptApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl border border-zinc-200/80 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <StoreAppGlyph
                  app={promptApp}
                  sizeClass="w-12 h-12 text-xl"
                  iconPx={22}
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1D1D1F] truncate">
                    Where do you want to use {promptApp.name}?
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Choose an install location. You can uninstall anytime.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromptApp(null)}
                aria-label="Cancel install"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-[#6E6E73] cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  executeInstallWithDestination(promptApp, "universe")
                }
                className="w-full p-4 rounded-2xl bg-[#F5F5F7] hover:bg-[#E2F5ED]/60 border border-zinc-200/80 hover:border-[#059669]/40 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    In Universe Page
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Add directly inside the Apps section of Gamura Universe.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  executeInstallWithDestination(promptApp, "mobile")
                }
                className="w-full p-4 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/70 border border-zinc-200/80 hover:border-[#0071E3]/40 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shrink-0">
                  <Smartphone size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    In Your Mobile App / Device
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Download standalone web app launcher &amp; add to My apps.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => executeInstallWithDestination(promptApp, "both")}
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1D1D1F]">
                    Both (Universe Page &amp; Mobile App)
                  </div>
                  <div className="text-xs text-[#6E6E73]">
                    Install in Universe Apps and download for your device.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generator Modal for Gamura Store & App Links */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl border border-zinc-200/80 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#E2F5ED] text-[#059669] flex items-center justify-center shrink-0">
                  <QrCode size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1D1D1F] truncate">
                    Scan &amp; Share QR Code
                  </h3>
                  <p className="text-xs text-[#6E6E73] truncate">
                    Instant scannable QR for any Gamura Store link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                aria-label="Close QR Generator"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-[#6E6E73] cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Select Store Page or App */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Store App or Link Preset
              </label>
              <div className="relative">
                <select
                  aria-label="Select Store Link for QR Code"
                  value={qrSelectedAppId}
                  onChange={(e) => handleQrPresetChange(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669] cursor-pointer"
                >
                  <option value="__store__">
                    Gamura Launch Store (/launch)
                  </option>
                  {qrSelectedAppId === "__custom__" && (
                    <option value="__custom__">Custom Store Link</option>
                  )}
                  {allApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                />
              </div>

              <input
                type="url"
                value={qrUrlInput}
                onChange={(e) => {
                  setQrUrlInput(e.target.value);
                  setQrSelectedAppId("__custom__");
                  setQrLabel("Custom Store Link");
                }}
                placeholder="https://…"
                aria-label="Custom URL for QR Code"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-zinc-200/80 text-xs font-mono text-[#1D1D1F] outline-none focus:bg-white focus:border-[#059669]"
              />
            </div>

            {/* Scannable QR Preview Card */}
            <div className="rounded-3xl bg-[#F5F5F7] border border-zinc-200/80 p-4 sm:p-5 flex flex-col items-center gap-3">
              <div
                style={{ backgroundColor: qrBgColor }}
                className="p-4 rounded-2xl shadow-sm border border-black/[0.06] transition-colors"
              >
                <QRCodeSVG
                  value={qrUrlInput.trim() || resolveFullUrl("/launch")}
                  size={196}
                  bgColor={qrBgColor}
                  fgColor={qrColor}
                  level={qrCenterLogoSrc ? "H" : "M"}
                  includeMargin={false}
                  imageSettings={
                    qrCenterLogoSrc
                      ? {
                          src: qrCenterLogoSrc,
                          height: 44,
                          width: 44,
                          excavate: true,
                        }
                      : undefined
                  }
                />
                <div className="hidden" aria-hidden="true">
                  <QRCodeCanvas
                    id="gamura-store-qr-canvas"
                    value={qrUrlInput.trim() || resolveFullUrl("/launch")}
                    size={512}
                    bgColor={qrBgColor}
                    fgColor={qrColor}
                    level={qrCenterLogoSrc ? "H" : "M"}
                    imageSettings={
                      qrCenterLogoSrc
                        ? {
                            src: qrCenterLogoSrc,
                            height: 112,
                            width: 112,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="text-center space-y-0.5 max-w-full">
                <div className="text-sm font-bold text-[#1D1D1F] truncate">
                  {qrLabel || "Gamura Store Link"}
                </div>
                <div className="text-[11px] text-[#6E6E73] break-all line-clamp-2">
                  {qrUrlInput.trim() || resolveFullUrl("/launch")}
                </div>
              </div>

              {/* QR Customization Controls: QR Color, Background Color, and Central Logo/Icon */}
              <div className="w-full space-y-3 pt-2 border-t border-zinc-200/80 text-left">
                {/* 1. QR Foreground Color */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    QR Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: "Obsidian", color: "#1D1D1F" },
                      { label: "Emerald", color: "#059669" },
                      { label: "Cobalt", color: "#0071E3" },
                      { label: "Violet", color: "#7C3AED" },
                      { label: "Crimson", color: "#E11D48" },
                    ].map((sw) => (
                      <button
                        key={sw.color}
                        type="button"
                        onClick={() => setQrColor(sw.color)}
                        title={sw.label}
                        aria-label={`${sw.label} QR color`}
                        style={{ backgroundColor: sw.color }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                          qrColor.toLowerCase() === sw.color.toLowerCase()
                            ? "ring-2 ring-offset-2 ring-[#059669] scale-110"
                            : "opacity-85 hover:opacity-100"
                        }`}
                      />
                    ))}
                    <label
                      title="Pick custom QR color"
                      className="relative w-6 h-6 rounded-full border border-zinc-300 overflow-hidden cursor-pointer bg-white flex items-center justify-center"
                    >
                      <input
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        aria-label="Custom QR foreground color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span
                        style={{ backgroundColor: qrColor }}
                        className="w-4 h-4 rounded-full border border-black/10"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Background Color */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Background
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: "White", color: "#FFFFFF" },
                      { label: "Silver", color: "#F5F5F7" },
                      { label: "Mint", color: "#E2F5ED" },
                      { label: "Ice Blue", color: "#EFF6FF" },
                      { label: "Charcoal", color: "#111827" },
                    ].map((bg) => (
                      <button
                        key={bg.color}
                        type="button"
                        onClick={() => setQrBgColor(bg.color)}
                        title={bg.label}
                        aria-label={`${bg.label} QR background color`}
                        style={{ backgroundColor: bg.color }}
                        className={`w-6 h-6 rounded-full border border-zinc-300 cursor-pointer transition-transform ${
                          qrBgColor.toLowerCase() === bg.color.toLowerCase()
                            ? "ring-2 ring-offset-2 ring-[#059669] scale-110"
                            : "opacity-90 hover:opacity-100"
                        }`}
                      />
                    ))}
                    <label
                      title="Pick custom QR background color"
                      className="relative w-6 h-6 rounded-full border border-zinc-300 overflow-hidden cursor-pointer bg-white flex items-center justify-center"
                    >
                      <input
                        type="color"
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        aria-label="Custom QR background color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span
                        style={{ backgroundColor: qrBgColor }}
                        className="w-4 h-4 rounded-full border border-black/15"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Central Logo / Icon */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                      Center Logo / Icon
                    </span>
                    <label className="text-[11px] font-semibold text-[#059669] hover:underline cursor-pointer inline-flex items-center gap-1">
                      <ImagePlus size={12} />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCustomLogoFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: "none", label: "None" },
                        { id: "gamura", label: "Gamura G" },
                        { id: "app", label: "App Icon" },
                        { id: "store", label: "Store" },
                      ] as const
                    ).map((opt) => {
                      const active = qrLogoMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQrLogoMode(opt.id)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                            active
                              ? "bg-[#059669] text-white border-[#059669]"
                              : "bg-white text-[#1D1D1F] border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {qrLogoMode === "custom" && qrCustomLogoUrl && (
                    <div className="flex items-center justify-between text-[11px] text-[#059669] font-medium pt-0.5">
                      <span>Using custom center image ✓</span>
                      <button
                        type="button"
                        onClick={() => setQrLogoMode("gamura")}
                        className="text-[#6E6E73] hover:text-[#1D1D1F] underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Copy / Download / Open Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const target = qrUrlInput.trim() || resolveFullUrl("/launch");
                  try {
                    await navigator.clipboard.writeText(target);
                    showToast("Store link copied ✓");
                  } catch {
                    showToast(target);
                  }
                }}
                className="py-2.5 px-3 rounded-2xl bg-[#F5F5F7] hover:bg-zinc-200/80 text-[#1D1D1F] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Copy size={14} />
                <span>Copy Link</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-2.5 px-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Download size={14} />
                <span>Save PNG</span>
              </button>

              <a
                href={qrUrlInput.trim() || resolveFullUrl("/launch")}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span>Open</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Simulated-Device Live Preview Modal */}
      {livePreviewApp && (
        <LaunchLivePreviewModal
          app={livePreviewApp}
          allApps={allApps}
          averageRating={getLiveStats(livePreviewApp).average}
          reviewCount={getLiveStats(livePreviewApp).reviewCount}
          isInstalled={installedIdSet.has(livePreviewApp.id)}
          onSelectApp={(nextApp) => setLivePreviewApp(nextApp)}
          onInstallClick={(targetApp) => setPromptApp(targetApp)}
          onClose={() => setLivePreviewApp(null)}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-lg flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
