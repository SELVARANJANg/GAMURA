import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { OperationType, handleFirestoreError } from "../firebaseErrorHandler";
import {
  BUILTIN_STORE_APPS,
  CUSTOM_STORE_APPS_KEY,
  LEGACY_INSTALLED_KEY,
  MOBILE_APPS_KEY,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  readStoreJson,
  writeStoreJson,
  type StoreAppItem,
} from "./gamuraStoreApps";

export interface StoreReviewDoc {
  id: string;
  appId: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  comment: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface CloudInstalledState {
  uid: string;
  gamuraHandle?: string;
  universeAppIds: string[];
  mobileAppIds: string[];
  customApps: StoreAppItem[];
  lastDevice?: string;
  updatedAtMs: number;
}

export interface CombinedRatingStats {
  average: number;
  totalVotes: number;
  reviewCount: number;
  distribution: [number, number, number, number, number]; // [5★%, 4★%, 3★%, 2★%, 1★%]
  reviews: StoreReviewDoc[];
  userReview: StoreReviewDoc | null;
}

function sanitizeId(raw: string, maxLen = 80): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, maxLen);
  return cleaned || "app";
}

function tsToMs(val: unknown): number {
  if (typeof val === "number") return val;
  if (
    val &&
    typeof val === "object" &&
    "toMillis" in val &&
    typeof (val as Timestamp).toMillis === "function"
  ) {
    return (val as Timestamp).toMillis();
  }
  return Date.now();
}

export function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Web Browser";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS · Safari / Web";
  if (/Android/i.test(ua)) return "Android · Mobile Web";
  if (/Mac/i.test(ua)) return "macOS · Desktop Web";
  if (/Windows/i.test(ua)) return "Windows · Desktop Web";
  if (/Linux/i.test(ua)) return "Linux · Desktop Web";
  return "Gamura Web Device";
}

export function subscribeStoreReviews(
  onData: (reviews: StoreReviewDoc[]) => void,
): () => void {
  const path = "store_reviews";
  const q = query(collection(db, path), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const list: StoreReviewDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          appId: String(data.appId || ""),
          userId: String(data.userId || ""),
          authorName: String(data.authorName || "Gamura User"),
          authorPhoto:
            typeof data.authorPhoto === "string" ? data.authorPhoto : undefined,
          rating: Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5))),
          comment: String(data.comment || ""),
          createdAtMs: tsToMs(data.createdAt),
          updatedAtMs: tsToMs(data.updatedAt),
        };
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    },
  );
}

export async function saveAppReviewToCloud(params: {
  appId: string;
  userId: string;
  authorName: string;
  authorPhoto?: string | null;
  rating: number;
  comment: string;
}): Promise<void> {
  const cleanAppId = sanitizeId(params.appId, 80);
  const reviewId = `${cleanAppId}__${params.userId}`;
  const path = `store_reviews/${reviewId}`;
  const ref = doc(db, "store_reviews", reviewId);

  const clampedRating = Math.max(1, Math.min(5, Math.round(params.rating)));
  const cleanAuthor = (params.authorName || "Gamura User").trim().slice(0, 60) || "Gamura User";
  const cleanComment = (params.comment || "").trim().slice(0, 600);
  const cleanPhoto =
    params.authorPhoto && params.authorPhoto.length <= 500
      ? params.authorPhoto
      : undefined;

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const updatePayload: Record<string, unknown> = {
        authorName: cleanAuthor,
        rating: clampedRating,
        comment: cleanComment,
        updatedAt: serverTimestamp(),
      };
      if (cleanPhoto) updatePayload.authorPhoto = cleanPhoto;
      await updateDoc(ref, updatePayload);
    } else {
      const createPayload: Record<string, unknown> = {
        appId: cleanAppId,
        userId: params.userId,
        authorName: cleanAuthor,
        rating: clampedRating,
        comment: cleanComment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (cleanPhoto) createPayload.authorPhoto = cleanPhoto;
      await setDoc(ref, createPayload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAppReviewFromCloud(
  appId: string,
  userId: string,
): Promise<void> {
  const cleanAppId = sanitizeId(appId, 80);
  const reviewId = `${cleanAppId}__${userId}`;
  const path = `store_reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, "store_reviews", reviewId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function computeCombinedAppRatingStats(
  app: StoreAppItem,
  allReviews: StoreReviewDoc[],
  currentUid?: string | null,
  localUserStarFallback = 0,
): CombinedRatingStats {
  const cleanId = sanitizeId(app.id, 80);
  const appReviews = allReviews.filter(
    (r) => r.appId === app.id || r.appId === cleanId,
  );
  const userReview = currentUid
    ? appReviews.find((r) => r.userId === currentUid) ?? null
    : null;

  // Baseline seeded community distribution calibrated around app's baseline score
  const baseWeight = app.isBuiltin ? 18 : 3;
  const baseMean = app.rating || 4.8;
  const baseTotalScore = baseMean * baseWeight;

  const cloudScoreSum = appReviews.reduce((acc, r) => acc + r.rating, 0);
  const localOnlyScore = !userReview && localUserStarFallback > 0 ? localUserStarFallback : 0;
  const localOnlyCount = !userReview && localUserStarFallback > 0 ? 1 : 0;

  const totalVotes = baseWeight + appReviews.length + localOnlyCount;
  const average = Number(
    ((baseTotalScore + cloudScoreSum + localOnlyScore) / totalVotes).toFixed(1),
  );

  // Star histogram (counts for 5, 4, 3, 2, 1 stars)
  const counts = [
    Math.round(baseWeight * (baseMean >= 4.85 ? 0.78 : 0.68)),
    Math.round(baseWeight * 0.2),
    Math.round(baseWeight * 0.08),
    Math.round(baseWeight * 0.03),
    Math.max(0, Math.round(baseWeight * 0.01)),
  ];
  appReviews.forEach((r) => {
    const idx = 5 - r.rating;
    if (idx >= 0 && idx < 5) counts[idx] += 1;
  });
  if (localOnlyCount === 1 && localUserStarFallback >= 1 && localUserStarFallback <= 5) {
    counts[5 - localUserStarFallback] += 1;
  }
  const sumCounts = counts.reduce((a, b) => a + b, 0) || 1;
  const distribution: [number, number, number, number, number] = [
    Math.round((counts[0] / sumCounts) * 100),
    Math.round((counts[1] / sumCounts) * 100),
    Math.round((counts[2] / sumCounts) * 100),
    Math.round((counts[3] / sumCounts) * 100),
    Math.round((counts[4] / sumCounts) * 100),
  ];

  return {
    average,
    totalVotes,
    reviewCount: appReviews.filter((r) => r.comment.trim().length > 0).length,
    distribution,
    reviews: appReviews,
    userReview,
  };
}

function compactCustomAppForCloud(app: StoreAppItem): Record<string, string | number> {
  return {
    id: String(app.id).slice(0, 80),
    name: String(app.name).slice(0, 60),
    cat: String(app.cat || "Platform").slice(0, 40),
    tag: String(app.tag || "").slice(0, 100),
    desc: String(app.desc || "").slice(0, 300),
    url: String(app.url || "").slice(0, 260),
    c1: String(app.c1 || "#34d399").slice(0, 24),
    c2: String(app.c2 || "#059669").slice(0, 24),
    rating: Number(app.rating || 4.8),
  };
}

function hydrateCustomApp(raw: Record<string, unknown>): StoreAppItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  return {
    id: raw.id,
    name: raw.name,
    cat: String(raw.cat || "Platform"),
    tag: String(raw.tag || "Synced from Gamura Cloud"),
    desc: String(raw.desc || ""),
    url: String(raw.url || "/launch"),
    c1: String(raw.c1 || "#34d399"),
    c2: String(raw.c2 || "#059669"),
    iconKind: "letter",
    rating: Number(raw.rating) || 4.8,
    age: "3+",
    chart: "Synced",
    dl: "Cloud",
    size: "Web · 1 MB",
  };
}

export async function syncInstalledAppsToCloud(params: {
  uid: string;
  gamuraHandle?: string | null;
  universeAppIds: string[];
  mobileAppIds: string[];
  customApps: StoreAppItem[];
}): Promise<void> {
  const path = `user_installed_apps/${params.uid}`;
  const ref = doc(db, "user_installed_apps", params.uid);

  const universeIds = Array.from(new Set(params.universeAppIds))
    .map((id) => String(id).slice(0, 80))
    .slice(0, 100);
  const mobileIds = Array.from(new Set(params.mobileAppIds))
    .map((id) => String(id).slice(0, 80))
    .slice(0, 100);
  const compactCustom = params.customApps
    .slice(0, 30)
    .map(compactCustomAppForCloud);

  const payload: Record<string, unknown> = {
    uid: params.uid,
    universeAppIds: universeIds,
    mobileAppIds: mobileIds,
    customApps: compactCustom,
    lastDevice: detectDeviceLabel().slice(0, 64),
    updatedAt: serverTimestamp(),
  };

  if (params.gamuraHandle && params.gamuraHandle.trim()) {
    payload.gamuraHandle = params.gamuraHandle.trim().slice(0, 80);
  }

  try {
    await setDoc(ref, payload, { merge: false });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeUserInstalledApps(
  uid: string,
  gamuraHandle: string | null | undefined,
  onRemoteSync: (state: CloudInstalledState) => void,
): () => void {
  const path = `user_installed_apps/${uid}`;
  const ref = doc(db, "user_installed_apps", uid);
  let didInitialMerge = false;

  return onSnapshot(
    ref,
    (snap) => {
      const localUniverse = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      const localMobile = readStoreJson<string[]>(MOBILE_APPS_KEY, []);
      const localCustom = readStoreJson<StoreAppItem[]>(CUSTOM_STORE_APPS_KEY, []);

      if (!snap.exists()) {
        // First time signing into Cloud Sync on this Gamura ID: push local installed apps if any exist
        if (
          !didInitialMerge &&
          (localUniverse.length > 0 || localMobile.length > 0 || localCustom.length > 0)
        ) {
          didInitialMerge = true;
          void syncInstalledAppsToCloud({
            uid,
            gamuraHandle,
            universeAppIds: localUniverse.map((a) => a.id),
            mobileAppIds: localMobile,
            customApps: localCustom,
          });
        }
        onRemoteSync({
          uid,
          gamuraHandle: gamuraHandle || undefined,
          universeAppIds: localUniverse.map((a) => a.id),
          mobileAppIds: localMobile,
          customApps: localCustom,
          lastDevice: detectDeviceLabel(),
          updatedAtMs: Date.now(),
        });
        return;
      }

      const data = snap.data();
      const cloudCustom = Array.isArray(data.customApps)
        ? (data.customApps
            .map((item) =>
              item && typeof item === "object"
                ? hydrateCustomApp(item as Record<string, unknown>)
                : null,
            )
            .filter(Boolean) as StoreAppItem[])
        : [];
      const cloudUniverseIds = Array.isArray(data.universeAppIds)
        ? data.universeAppIds.map((x) => String(x))
        : [];
      const cloudMobileIds = Array.isArray(data.mobileAppIds)
        ? data.mobileAppIds.map((x) => String(x))
        : [];

      // On first connection after login on this device, union local un-synced installs with cloud if local had pre-login apps
      let nextUniverseIds = cloudUniverseIds;
      let nextMobileIds = cloudMobileIds;
      let nextCustomApps = cloudCustom;

      if (!didInitialMerge) {
        didInitialMerge = true;
        const customMap = new Map<string, StoreAppItem>();
        [...cloudCustom, ...localCustom].forEach((c) => customMap.set(c.id, c));
        const mergedCustom = Array.from(customMap.values()).slice(0, 30);

        const mergedUniverseIds = Array.from(
          new Set([...cloudUniverseIds, ...localUniverse.map((a) => a.id)]),
        ).slice(0, 100);
        const mergedMobileIds = Array.from(
          new Set([...cloudMobileIds, ...localMobile]),
        ).slice(0, 100);

        const localHadAdditions =
          mergedUniverseIds.length > cloudUniverseIds.length ||
          mergedMobileIds.length > cloudMobileIds.length ||
          mergedCustom.length > cloudCustom.length;

        nextUniverseIds = mergedUniverseIds;
        nextMobileIds = mergedMobileIds;
        nextCustomApps = mergedCustom;

        if (localHadAdditions) {
          void syncInstalledAppsToCloud({
            uid,
            gamuraHandle,
            universeAppIds: mergedUniverseIds,
            mobileAppIds: mergedMobileIds,
            customApps: mergedCustom,
          });
        }
      }

      // Apply authoritative merged/remote state locally so Universe Page & Launch Store update live
      const catalog = [...BUILTIN_STORE_APPS, ...nextCustomApps];
      const hydratedUniverseApps = nextUniverseIds
        .map((id) => catalog.find((a) => a.id === id))
        .filter((a): a is StoreAppItem => Boolean(a));

      writeStoreJson(CUSTOM_STORE_APPS_KEY, nextCustomApps);
      writeStoreJson(UNIVERSE_APPS_KEY, hydratedUniverseApps);
      writeStoreJson(MOBILE_APPS_KEY, nextMobileIds);
      writeStoreJson(
        LEGACY_INSTALLED_KEY,
        Array.from(new Set([...nextUniverseIds, ...nextMobileIds])),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UNIVERSE_APPS_EVENT));
      }

      onRemoteSync({
        uid,
        gamuraHandle:
          typeof data.gamuraHandle === "string" ? data.gamuraHandle : gamuraHandle || undefined,
        universeAppIds: nextUniverseIds,
        mobileAppIds: nextMobileIds,
        customApps: nextCustomApps,
        lastDevice: typeof data.lastDevice === "string" ? data.lastDevice : undefined,
        updatedAtMs: tsToMs(data.updatedAt),
      });
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    },
  );
}
