"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Prize } from "@/types/gacha";
import { loadLastResult, recordPurchase } from "@/lib/storage";
import {
  RARITY_BADGE_CLASSES,
  RARITY_CARD_CLASSES,
  RARITY_LABELS,
  RARITY_SECTION_CLASSES,
  RARITY_TEXT_CLASSES,
} from "@/lib/rarity";
import AdSlot from "@/components/AdSlot";

function SectionHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
      <span>✦</span>
      <span>
        {step}. {label}
      </span>
      <span className="h-px flex-1 bg-gray-300" />
    </div>
  );
}

export default function ResultScreen({ initialPrize }: { initialPrize?: Prize | null }) {
  const [prize, setPrize] = useState<Prize | null>(initialPrize ?? null);
  const [loaded, setLoaded] = useState(initialPrize !== undefined);
  const searchParams = useSearchParams();

  const retryParams = new URLSearchParams();
  const gender = searchParams.get("gender");
  const recipient = searchParams.get("recipient");
  const type = searchParams.get("type");
  const budget = searchParams.get("budget");
  if (gender) retryParams.set("gender", gender);
  if (recipient) retryParams.set("recipient", recipient);
  if (type) retryParams.set("type", type);
  if (budget) retryParams.set("budget", budget);
  retryParams.set("spin", "1");
  const retryHref = `/?${retryParams.toString()}`;

  useEffect(() => {
    if (initialPrize !== undefined) return;
    setPrize(loadLastResult());
    setLoaded(true);
  }, [initialPrize]);

  if (!loaded) return null;

  if (!prize) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Image
          src="/home-background.png"
          alt=""
          fill
          priority
          aria-hidden
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <p className="relative text-gray-500">結果が見つかりませんでした。</p>
        <Link
          href="/"
          className="relative rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700"
        >
          ガチャに戻る
        </Link>
      </div>
    );
  }

  const sectionClass = `rounded-2xl border-2 p-4 ${RARITY_SECTION_CLASSES[prize.rarity]}`;

  return (
    <div className="relative flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <Image
        src="/home-background.png"
        alt=""
        fill
        priority
        aria-hidden
        sizes="100vw"
        className="object-cover opacity-50"
      />

      <div
        className={`result-card relative flex w-full max-w-md flex-col gap-5 rounded-3xl border-2 p-6 shadow-xl ${RARITY_CARD_CLASSES[prize.rarity]}`}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className={`rounded-full px-4 py-1 text-sm font-bold ${RARITY_BADGE_CLASSES[prize.rarity]}`}
          >
            {RARITY_LABELS[prize.rarity]}
          </span>
        </div>

        <section className={sectionClass}>
          <SectionHeading step={1} label="商品名" />
          <p className={`text-xl font-bold ${RARITY_TEXT_CLASSES[prize.rarity]}`}>
            {prize.name}
          </p>
          {prize.price !== undefined && (
            <p className="mt-1 text-sm font-semibold text-gray-600">
              ¥{prize.price.toLocaleString()}
            </p>
          )}
        </section>

        <section className={sectionClass}>
          {prize.affiliateHtml ? (
            <div
              className="flex justify-center [&_img]:mx-auto"
              dangerouslySetInnerHTML={{ __html: prize.affiliateHtml }}
            />
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-500">
              画像なし
            </div>
          )}
        </section>

        <section className={sectionClass}>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {prize.description || "説明はありません"}
          </p>
        </section>

        {prize.affiliateUrl ? (
          <a
            href={prize.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => recordPurchase(prize.id, prize.name)}
            className="block w-full rounded-full bg-amber-500 px-8 py-3 text-center text-base font-bold text-white shadow hover:bg-amber-600"
          >
            🛒 購入する
          </a>
        ) : prize.affiliateHtml ? (
          <p className="text-center text-sm text-gray-500">
            写真を押すと購入ページに飛べます
          </p>
        ) : (
          <p className="text-center text-sm text-gray-500">
            購入リンクが設定されていません
          </p>
        )}

        <div className="mx-auto mt-2 flex flex-col items-center gap-3">
          <Link
            href={retryHref}
            className="rounded-full border border-pink-300 px-6 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50"
          >
            もう一度ガチャを回す
          </Link>
          <Link
            href="/"
            className="rounded-full border border-gray-300 px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ホームに戻る
          </Link>
        </div>
      </div>

      <div className="relative">
        <AdSlot slotId="0000000000" />
      </div>
    </div>
  );
}
