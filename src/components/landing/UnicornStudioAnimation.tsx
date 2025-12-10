"use client";

import { useEffect, useRef } from "react";

// Extend window type for TypeScript
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

export function UnicornStudioAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // Initialize UnicornStudio script (matches original implementation)
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js";
      script.async = true;
      script.onload = function() {
        if (!window.UnicornStudio?.isInitialized) {
          if (typeof (window as any).UnicornStudio?.init === 'function') {
            (window as any).UnicornStudio.init();
            if (window.UnicornStudio) {
              window.UnicornStudio.isInitialized = true;
            }
          }
        }
      };
      (document.head || document.body).appendChild(script);
      scriptLoadedRef.current = true;
    } else if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
      // Script already loaded but not initialized
      if (typeof (window as any).UnicornStudio?.init === 'function') {
        (window as any).UnicornStudio.init();
        window.UnicornStudio.isInitialized = true;
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-us-project="50ywCAOTy0HRLvaeFtbK"
      className="absolute inset-0 w-full h-full"
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

