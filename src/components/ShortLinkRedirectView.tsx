import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ShortLinkRedirectView({
  slug,
  onBack,
}: {
  slug: string;
  onBack: () => void;
}) {
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
            try {
              await updateDoc(docRef, { clicks: increment(1) });
            } catch {
              // ignore analytics increment failures
            }
            window.location.href = targetUrl;
            return;
          }
        }
        setError("This short link does not exist or has been removed.");
      } catch {
        setError("Unable to resolve this short link.");
      }
    };
    fetchLink();
  }, [slug]);

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
      className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] text-[#1D1D1F] p-6"
    >
      {error ? (
        <div className="max-w-md w-full bg-white border border-zinc-200/80 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <p className="text-base font-bold text-[#1D1D1F]">{error}</p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Gamura</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
          <p className="text-xs font-medium text-[#6E6E73]">
            Redirecting to /go/{slug}...
          </p>
        </div>
      )}
    </div>
  );
}
