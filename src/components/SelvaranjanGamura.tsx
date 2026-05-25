import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

export default function SelvaranjanGamura({ onBack, viewingUsername }: { onBack: () => void, viewingUsername?: string }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Read whole gamura_developers directory in real-time
  useEffect(() => {
    const q = collection(db, "gamura_developers");
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      setTotalUsers(list.length);

      // Determine active users (last changes or active developers list count)
      const now = Date.now();
      const activeCount = list.filter((u: any) => {
        if (!u.updatedAt) return false;
        let t = 0;
        if (u.updatedAt.toDate) t = u.updatedAt.toDate().getTime();
        else if (u.updatedAt instanceof Date) t = u.updatedAt.getTime();
        else t = new Date(u.updatedAt).getTime();
        // Updated within 24 hours gets marked as active developer
        return now - t < 24 * 60 * 60 * 1000;
      }).length;

      setActiveUsers(Math.max(1, activeCount));

      // Sum clicks across all real developer claims
      const clicksSum = list.reduce((acc, curr) => acc + (Number(curr.clicks) || 0), 0);
      setTotalClicks(clicksSum);

      // Post the sync updates to the loaded iframe
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: "gamura-directory-sync",
          developers: list
        }, "*");
      }
    }, (err) => {
      console.warn("Firestore statistics check bypassed:", err);
      handleFirestoreError(err, OperationType.LIST, "gamura_developers");
    });

    return () => unsub();
  }, []);

  // Handle bidirectional communication between iframe & Firestore
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data === "exit-gamura-workspace") {
        onBack();
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe) return;

      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        // Triggered when iframe loads completely
        case "gamura-iframe-ready": {
          // Send current statistics & full list of claims to the ready iframe
          const q = collection(db, "gamura_developers");
          try {
            onSnapshot(q, (snap) => {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
              iframe.contentWindow?.postMessage({
                type: "gamura-directory-sync",
                developers: list
              }, "*");
            }, (err) => {
              handleFirestoreError(err, OperationType.LIST, "gamura_developers");
            });

            // If we have a direct viewingUsername, fetch and load it on the iframe right now!
            if (viewingUsername) {
              const docRef = doc(db, "gamura_developers", viewingUsername.toLowerCase());
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                iframe.contentWindow?.postMessage({
                  type: "gamura-load-viewer-profile",
                  username: viewingUsername,
                  profile: docSnap.data()
                }, "*");
              }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "gamura_developers");
          }
          break;
        }

        // Triggered when any developer modifies, claims, or updates their hub
        case "gamura-save-profile": {
          const { username, state } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              await setDoc(docRef, {
                username: username,
                email: state.email || "",
                blocks: state.blocks || [],
                published: state.published || false,
                plan: state.plan || "Starter",
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Fetch a full profile dynamically in real-time for viewing live links hubs
        case "gamura-get-profile": {
          const { username } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                iframe.contentWindow?.postMessage({
                  type: "gamura-load-viewer-profile",
                  username: username,
                  profile: docSnap.data()
                }, "*");
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Increment link click count on Firestore in Real-Time
        case "gamura-increment-clicks": {
          const { username } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const currentData = docSnap.data();
                await setDoc(docRef, {
                  clicks: (Number(currentData.clicks) || 0) + 1,
                  engagements: (Number(currentData.engagements) || 0) + 1,
                  updatedAt: serverTimestamp()
                }, { merge: true });
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Increment visitor/view count on Firestore in Real-Time
        case "gamura-record-view": {
          const { username } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const currentData = docSnap.data();
                await setDoc(docRef, {
                  views: (Number(currentData.views) || 0) + 1,
                  visitors: (Number(currentData.visitors) || 0) + 1,
                  engagements: (Number(currentData.engagements) || 0) + 1,
                  updatedAt: serverTimestamp()
                }, { merge: true });
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        case "exit-viewer-mode": {
          onBack();
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onBack]);

  // Continuously pipe live aggregated statistics (Clicks, Users, Active) to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendStats = () => {
      iframe.contentWindow?.postMessage({
        type: "gamura-realtime-stats",
        totalUsers,
        activeUsers,
        totalClicks
      }, "*");
    };

    sendStats();

    const handleLoad = () => {
      sendStats();
    };

    iframe.addEventListener("load", handleLoad);
    const timer = setInterval(sendStats, 1500);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearInterval(timer);
    };
  }, [totalUsers, activeUsers, totalClicks]);

  return (
    <div className="w-full h-screen relative bg-[#03050A] overflow-hidden">
      {/* Absolute Overlaid Home Back Button */}
      <div className="absolute top-4 left-4 z-[9999]">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2.5 rounded-full border border-white/10 hover:border-white/20 bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white backdrop-blur-xl transition-all active:scale-95 shadow-[0_4px_24px_rgba(0,0,0,0.6)] cursor-pointer"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft size={16} className="text-[#0EA5E9]" />
        </button>
      </div>
      <iframe
        ref={iframeRef}
        title="Join Selvaranjan on Gamura"
        src="/selvaranjan_gamura.html"
        className="w-full h-full border-none"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}
