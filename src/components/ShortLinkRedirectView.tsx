import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Loader2 } from "lucide-react";

export default function ShortLinkRedirectView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const docRef = doc(db, "gamura_shortlinks", slug.toLowerCase());
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.url) {
            let targetUrl = data.url;
            if (!/^https?:\/\//i.test(targetUrl)) {
              targetUrl = `https://${targetUrl}`;
            }
            
            // Increment click analytics before redirecting
            try {
               await updateDoc(docRef, { clicks: increment(1) });
            } catch(e) { }

            window.location.href = targetUrl;
            return;
          }
        }
        setError("This short link does not exist or has been removed.");
      } catch (err) {
        setError("Error resolving short link.");
      }
    };
    fetchLink();
  }, [slug]);

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#03050C] text-white">
        <p className="text-xl font-bold mb-4">{error}</p>
        <button onClick={onBack} className="text-cyan-400 hover:underline">Back to Gamura</button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#03050C] text-white">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
      <p className="font-mono tracking-widest text-zinc-400">REDIRECTING...</p>
    </div>
  );
}
