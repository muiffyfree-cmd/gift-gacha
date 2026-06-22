"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function AdSlot({ slotId }: { slotId: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not ready yet; skip.
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div className="flex h-24 w-full max-w-md items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
        広告枠（AdSenseクライアントID未設定）
      </div>
    );
  }

  return (
    <ins
      ref={insRef}
      className="adsbygoogle block w-full max-w-md"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
