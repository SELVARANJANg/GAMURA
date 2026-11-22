import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

export const GAMURA_LICENSE_VERSION = "2026.1";
export const GAMURA_LICENSE_KEY = "gamura_license_agreement_v1";
export const GAMURA_LICENSE_EVENT = "gamura-license-updated";
export const GAMURA_OPEN_LICENSE_EVENT = "gamura-open-license-modal";

export type GamuraLicenseStatus = "pending" | "agreed" | "declined";
export type GamuraLicenseTab = "prompt" | "license" | "terms" | "privacy";

export interface GamuraLicenseRecord {
  status: GamuraLicenseStatus;
  version: string;
  updatedAtMs: number;
  syncedUid?: string;
}

export function readLicenseRecord(): GamuraLicenseRecord {
  if (typeof window === "undefined") {
    return {
      status: "pending",
      version: GAMURA_LICENSE_VERSION,
      updatedAtMs: 0,
    };
  }
  try {
    const raw = localStorage.getItem(GAMURA_LICENSE_KEY);
    if (!raw) {
      return {
        status: "pending",
        version: GAMURA_LICENSE_VERSION,
        updatedAtMs: 0,
      };
    }
    const parsed = JSON.parse(raw) as Partial<GamuraLicenseRecord>;
    if (
      parsed &&
      parsed.version === GAMURA_LICENSE_VERSION &&
      (parsed.status === "agreed" || parsed.status === "declined" || parsed.status === "pending")
    ) {
      return {
        status: parsed.status,
        version: parsed.version,
        updatedAtMs: typeof parsed.updatedAtMs === "number" ? parsed.updatedAtMs : Date.now(),
        syncedUid: typeof parsed.syncedUid === "string" ? parsed.syncedUid : undefined,
      };
    }
  } catch {
    // Ignore storage parse failure and fall back to pending agreement
  }
  return {
    status: "pending",
    version: GAMURA_LICENSE_VERSION,
    updatedAtMs: 0,
  };
}

export function persistLicenseLocal(record: GamuraLicenseRecord): GamuraLicenseRecord {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GAMURA_LICENSE_KEY, JSON.stringify(record));
    } catch {
      // Ignore quota errors
    }
    window.dispatchEvent(new CustomEvent(GAMURA_LICENSE_EVENT, { detail: record }));
  }
  return record;
}

export async function syncLicenseToCloud(
  uid: string | null | undefined,
  status: "agreed" | "declined",
): Promise<void> {
  if (!uid || uid === "guest_explorer_uid") return;
  const activeAuthUser = auth.currentUser;
  if (!activeAuthUser || activeAuthUser.uid !== uid) return;

  const docPath = `user_licenses/${uid}`;
  try {
    await setDoc(doc(db, "user_licenses", uid), {
      uid: uid.slice(0, 128),
      status,
      version: GAMURA_LICENSE_VERSION.slice(0, 20),
      platform: "web",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Non-fatal fallback: localStorage agreement already unlocked UI reliably
    }
  }
}

export async function acceptGamuraLicense(uid?: string | null): Promise<GamuraLicenseRecord> {
  const record = persistLicenseLocal({
    status: "agreed",
    version: GAMURA_LICENSE_VERSION,
    updatedAtMs: Date.now(),
    syncedUid: uid && uid !== "guest_explorer_uid" ? uid : undefined,
  });
  await syncLicenseToCloud(uid, "agreed");
  return record;
}

export async function declineGamuraLicense(uid?: string | null): Promise<GamuraLicenseRecord> {
  const record = persistLicenseLocal({
    status: "declined",
    version: GAMURA_LICENSE_VERSION,
    updatedAtMs: Date.now(),
    syncedUid: uid && uid !== "guest_explorer_uid" ? uid : undefined,
  });
  await syncLicenseToCloud(uid, "declined");
  return record;
}

export function resetGamuraLicensePrompt(): GamuraLicenseRecord {
  const record = persistLicenseLocal({
    status: "pending",
    version: GAMURA_LICENSE_VERSION,
    updatedAtMs: Date.now(),
  });
  openGamuraLicenseModal("prompt");
  return record;
}

export function openGamuraLicenseModal(tab: GamuraLicenseTab = "prompt"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GAMURA_OPEN_LICENSE_EVENT, { detail: { tab } }));
}

export function subscribeCloudUserLicense(
  uid: string | null | undefined,
  onUpdate: (record: GamuraLicenseRecord) => void,
): () => void {
  if (!uid || uid === "guest_explorer_uid") return () => {};
  const activeAuthUser = auth.currentUser;
  if (!activeAuthUser || activeAuthUser.uid !== uid) return () => {};

  const docPath = `user_licenses/${uid}`;
  const docRef = doc(db, "user_licenses", uid);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        // If user already accepted on this device prior to sign-in, push their consent to cloud
        const local = readLicenseRecord();
        if (local.status === "agreed" && !local.syncedUid) {
          void syncLicenseToCloud(uid, "agreed").then(() => {
            persistLicenseLocal({ ...local, syncedUid: uid });
          });
        }
        return;
      }
      const data = snap.data() as {
        status?: unknown;
        version?: unknown;
        updatedAt?: { toMillis?: () => number };
      };
      if (
        data.version === GAMURA_LICENSE_VERSION &&
        (data.status === "agreed" || data.status === "declined")
      ) {
        const local = readLicenseRecord();
        const remoteMs =
          typeof data.updatedAt?.toMillis === "function" ? data.updatedAt.toMillis() : Date.now();
        // Apply cloud state if local is pending, OR if cloud agreed overrides older local state
        if (
          local.status === "pending" ||
          (data.status !== local.status && remoteMs >= local.updatedAtMs)
        ) {
          const next = persistLicenseLocal({
            status: data.status,
            version: GAMURA_LICENSE_VERSION,
            updatedAtMs: remoteMs,
            syncedUid: uid,
          });
          onUpdate(next);
        }
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch {
        // Handled cleanly without breaking UI
      }
    },
  );
}
