import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SafeImageProps {
  srcs: string[];
  alt: string;
  className?: string;
  fallbackIcon?: any;
  fallbackText?: string;
  [key: string]: any;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  srcs, 
  alt, 
  className = "", 
  fallbackIcon: FallbackIcon = ImageIcon,
  fallbackText,
  ...props 
}) => {
  const [idx, setIdx] = useState(0);
  const isFailed = idx >= srcs.length;

  useEffect(() => {
    setIdx(0);
  }, [srcs.join(',')]);

  if (isFailed) {
    return (
      <div className={`bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center rounded-2xl p-4 transition-colors ${className}`}>
        <FallbackIcon className="text-zinc-300 dark:text-zinc-700 mb-2" size={className?.includes('w-16') ? 24 : 48} />
        {fallbackText && <p className="text-zinc-400 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-widest text-center">{fallbackText}</p>}
      </div>
    );
  }

  return (
    <img
      src={srcs[idx]}
      alt={alt}
      className={`${className} transition-opacity duration-500`}
      onError={() => setIdx(prev => prev + 1)}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      {...props}
    />
  );
};
