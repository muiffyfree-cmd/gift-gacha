"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    twttr?: { widgets?: { load?: () => void } };
    instgrm?: { Embeds?: { process?: () => void } };
  }
}

type Platform = "twitter" | "instagram" | "unknown";

function detectPlatform(url: string): Platform {
  if (/(?:twitter\.com|x\.com)/i.test(url)) return "twitter";
  if (/instagram\.com/i.test(url)) return "instagram";
  return "unknown";
}

export default function SnsEmbed({ url }: { url: string }) {
  const platform = detectPlatform(url);

  useEffect(() => {
    if (platform === "twitter") {
      window.twttr?.widgets?.load?.();
    } else if (platform === "instagram") {
      window.instgrm?.Embeds?.process?.();
    }
  }, [platform, url]);

  return (
    <div className="flex flex-col items-center gap-2">
      {platform === "twitter" && (
        <>
          <blockquote className="twitter-tweet">
            <a href={url}>{url}</a>
          </blockquote>
          <Script
            src="https://platform.twitter.com/widgets.js"
            strategy="lazyOnload"
            onLoad={() => window.twttr?.widgets?.load?.()}
          />
        </>
      )}
      {platform === "instagram" && (
        <>
          <blockquote className="instagram-media" data-instgrm-permalink={url} />
          <Script
            src="https://www.instagram.com/embed.js"
            strategy="lazyOnload"
            onLoad={() => window.instgrm?.Embeds?.process?.()}
          />
        </>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-pink-600 hover:underline"
      >
        SNSで投稿を見る →
      </a>
    </div>
  );
}
