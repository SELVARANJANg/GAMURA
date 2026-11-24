import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

export interface FirestoreBackupSummary {
  totalChats: number;
  promptChats: number;
  neuralChats: number;
  activities: number;
  projects: number;
}

export interface FirestoreBackupResult {
  filename: string;
  exportedAt: string;
  summary: FirestoreBackupSummary;
}

interface ExportBackupOptions {
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);

  if (typeof value === "object") {
    const maybeTs = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof maybeTs.toDate === "function") {
      try {
        return maybeTs.toDate().toISOString();
      } catch {
        return null;
      }
    }
    if (
      typeof maybeTs.seconds === "number" &&
      typeof maybeTs.nanoseconds === "number" &&
      Object.keys(value).length <= 2
    ) {
      return new Date(maybeTs.seconds * 1000).toISOString();
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined && typeof v !== "function") {
        out[k] = serializeFirestoreValue(v);
      }
    }
    return out;
  }

  return value;
}

function getComparableMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    const obj = value as { toMillis?: () => number; seconds?: number };
    if (typeof obj.toMillis === "function") {
      try {
        return obj.toMillis();
      } catch {
        return 0;
      }
    }
    if (typeof obj.seconds === "number") {
      return obj.seconds * 1000;
    }
  }
  return 0;
}

export async function exportUserFirestoreBackup(
  options?: ExportBackupOptions,
): Promise<FirestoreBackupResult> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || firebaseUser.uid === "guest_explorer_uid") {
    throw new Error(
      "Please sign in with your Gamura ID to export your Firestore backup.",
    );
  }

  const uid = firebaseUser.uid;

  const fetchCollection = async (
    labelPath: string,
    targetQuery: Query<DocumentData>,
  ) => {
    try {
      return await getDocs(targetQuery);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, labelPath);
      return null;
    }
  };

  const [
    promptChatsSnap,
    neuralChatsSnap,
    personalLogsSnap,
    globalActivitiesSnap,
    projectsSnap,
  ] = await Promise.all([
    fetchCollection(
      `users/${uid}/chats`,
      collection(db, `users/${uid}/chats`),
    ),
    fetchCollection(
      "neural_chats",
      query(collection(db, "neural_chats"), where("members", "array-contains", uid)),
    ),
    fetchCollection(
      `activityLogs/${uid}/logs`,
      collection(db, `activityLogs/${uid}/logs`),
    ),
    fetchCollection(
      "activities",
      query(collection(db, "activities"), where("userId", "==", uid)),
    ),
    fetchCollection(
      "shared_projects",
      query(collection(db, "shared_projects"), where("userId", "==", uid)),
    ),
  ]);

  const promptChats = (promptChatsSnap?.docs || [])
    .map((d) => ({
      id: d.id,
      sourceCollection: `users/${uid}/chats`,
      ...(serializeFirestoreValue(d.data()) as Record<string, unknown>),
      _sortTs: getComparableMillis(d.data().timestamp),
    }))
    .sort((a, b) => b._sortTs - a._sortTs)
    .map(({ _sortTs: _ignored, ...rest }) => rest);

  const neuralChatDocs = neuralChatsSnap?.docs || [];
  const neuralChatsWithMessages = await Promise.all(
    neuralChatDocs.map(async (chatDoc) => {
      const msgSnap = await fetchCollection(
        `neural_chats/${chatDoc.id}/messages`,
        collection(db, `neural_chats/${chatDoc.id}/messages`),
      );
      const messages = (msgSnap?.docs || [])
        .map((m) => ({
          id: m.id,
          ...(serializeFirestoreValue(m.data()) as Record<string, unknown>),
          _sortTs: getComparableMillis(m.data().timestamp),
        }))
        .sort((a, b) => a._sortTs - b._sortTs)
        .map(({ _sortTs: _ignored, ...rest }) => rest);

      const rawChat = chatDoc.data();
      return {
        id: chatDoc.id,
        sourceCollection: "neural_chats",
        ...(serializeFirestoreValue(rawChat) as Record<string, unknown>),
        messages,
        _sortTs: getComparableMillis(rawChat.timestamp),
      };
    }),
  );

  const neuralChats = neuralChatsWithMessages
    .sort((a, b) => b._sortTs - a._sortTs)
    .map(({ _sortTs: _ignored, ...rest }) => rest);

  const rawActivities = [
    ...(personalLogsSnap?.docs || []).map((d) => ({
      id: d.id,
      sourceCollection: `activityLogs/${uid}/logs`,
      ...(serializeFirestoreValue(d.data()) as Record<string, unknown>),
      _sortTs: getComparableMillis(d.data().timestamp),
    })),
    ...(globalActivitiesSnap?.docs || []).map((d) => ({
      id: d.id,
      sourceCollection: "activities",
      ...(serializeFirestoreValue(d.data()) as Record<string, unknown>),
      _sortTs: getComparableMillis(d.data().timestamp),
    })),
  ];

  const activities = rawActivities
    .sort((a, b) => b._sortTs - a._sortTs)
    .map(({ _sortTs: _ignored, ...rest }) => rest);

  const projects = (projectsSnap?.docs || [])
    .map((d) => ({
      id: d.id,
      sourceCollection: "shared_projects",
      ...(serializeFirestoreValue(d.data()) as Record<string, unknown>),
      _sortTs: getComparableMillis(d.data().timestamp),
    }))
    .sort((a, b) => b._sortTs - a._sortTs)
    .map(({ _sortTs: _ignored, ...rest }) => rest);

  const exportedAt = new Date().toISOString();
  const summary: FirestoreBackupSummary = {
    totalChats: promptChats.length + neuralChats.length,
    promptChats: promptChats.length,
    neuralChats: neuralChats.length,
    activities: activities.length,
    projects: projects.length,
  };

  const payload = {
    app: "GAMURA",
    exportType: "firestore_user_backup",
    exportVersion: "1.0",
    exportedAt,
    account: {
      uid,
      email: firebaseUser.email || options?.email || null,
      displayName: options?.displayName || firebaseUser.displayName || null,
      username: options?.username || null,
    },
    summary,
    chats: {
      promptChats,
      neuralChats,
    },
    activities,
    projects,
  };

  const dateStamp = exportedAt.split("T")[0];
  const handleSlug =
    (options?.username || uid.slice(0, 8))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/(^-|-$)/g, "") || "user";
  const filename = `gamura-firestore-backup-${handleSlug}-${dateStamp}.json`;

  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

  // Best-effort audit activity entry (never blocks download)
  try {
    await setDoc(doc(collection(db, "activities")), {
      title: "Exported Firestore backup (JSON)",
      ic: "💾",
      timestamp: serverTimestamp(),
      user: options?.displayName || options?.username || firebaseUser.displayName || "Explorer",
      userId: uid,
      priority: "Low",
      dueDate: "",
    });
  } catch {
    // ignore background audit log failure
  }

  return {
    filename,
    exportedAt,
    summary,
  };
}
