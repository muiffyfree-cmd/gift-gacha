"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Prize } from "@/types/gacha";
import { loadEffects, loadRarityWeights, recordVisit, saveLastResult, type RarityWeights } from "@/lib/storage";
import { fetchItems } from "@/lib/items";
import { fetchItemRecipients, fetchItemTypes, type Tag } from "@/lib/tags";
import { RARITY_LABELS, RARITY_OPTIONS } from "@/lib/rarity";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import IntroBanner from "@/components/IntroBanner";

const SPIN_DURATION_MS = 1200;
const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 1000;

function pickWeightedPrize(prizes: Prize[], weights: RarityWeights): Prize {
  const totalWeight = prizes.reduce((sum, p) => sum + weights[p.rarity], 0);
  let roll = Math.random() * totalWeight;
  for (const prize of prizes) {
    roll -= weights[prize.rarity];
    if (roll <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}

export default function GachaApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<Prize[]>([]);
  const [pendingPrize, setPendingPrize] = useState<Prize | null>(null);
  const [effectVideo, setEffectVideo] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_MIN,
    PRICE_MAX,
  ]);
  const [rarityWeights, setRarityWeights] = useState<RarityWeights>(loadRarityWeights());
  const [itemTypes, setItemTypes] = useState<Tag[]>([]);
  const [itemRecipients, setItemRecipients] = useState<Tag[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const autoSpunRef = useRef(false);

  useEffect(() => {
    fetchItems()
      .then(setPrizes)
      .catch(() => setPrizes([]));
    fetchItemTypes().then(setItemTypes).catch(() => setItemTypes([]));
    fetchItemRecipients().then(setItemRecipients).catch(() => setItemRecipients([]));
    recordVisit();
    setRarityWeights(loadRarityWeights());
  }, []);

  function toggleRecipientFilter(name: string) {
    setSelectedRecipients((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    );
  }

  const filteredPrizes = useMemo(() => {
    const [low, high] = priceRange;
    return prizes.filter((p) => {
      const matchesPrice = p.price === undefined || (p.price >= low && p.price <= high);
      const matchesType = !selectedType || p.type === selectedType;
      const matchesRecipients =
        selectedRecipients.length === 0 ||
        selectedRecipients.some((r) => p.recipients?.includes(r));
      return matchesPrice && matchesType && matchesRecipients;
    });
  }, [prizes, priceRange, selectedType, selectedRecipients]);

  useEffect(() => {
    if (autoSpunRef.current) return;
    if (filteredPrizes.length === 0) return;
    if (searchParams.get("spin") !== "1") return;
    autoSpunRef.current = true;
    router.replace("/");
    handleSpin();
  }, [filteredPrizes, searchParams, router]);

  function revealResult(picked: Prize) {
    setHistory((prev) => [picked, ...prev].slice(0, 10));
    setIsSpinning(false);
    saveLastResult(picked);
    router.push(`/result/${picked.id}`);
  }

  function handleSpin() {
    if (filteredPrizes.length === 0 || isSpinning) return;
    setIsSpinning(true);
    window.setTimeout(() => {
      const picked = pickWeightedPrize(filteredPrizes, rarityWeights);
      const videos = loadEffects()[picked.rarity];
      const video =
        videos && videos.length > 0
          ? videos[Math.floor(Math.random() * videos.length)]
          : undefined;
      if (video) {
        setPendingPrize(picked);
        setEffectVideo(video);
      } else {
        revealResult(picked);
      }
    }, SPIN_DURATION_MS);
  }

  function handleEffectEnd() {
    setEffectVideo(null);
    if (pendingPrize) {
      revealResult(pendingPrize);
      setPendingPrize(null);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <Image
        src="/home-background.png"
        alt=""
        fill
        priority
        aria-hidden
        className="object-cover opacity-50"
      />

      {effectVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <video
            key={effectVideo}
            src={effectVideo}
            autoPlay
            playsInline
            muted
            onEnded={handleEffectEnd}
            className="max-h-full max-w-full"
          />
        </div>
      )}

      <IntroBanner />

      <div className="relative mx-auto w-full max-w-xl px-4 pt-6">
        <section className="rounded-xl border border-gray-200 bg-white/80 p-4">
          <h2 className="mb-3 font-semibold text-gray-700">金額で絞り込む</h2>
          <PriceRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange}
            onChange={setPriceRange}
          />
          <Link href="/price" className="mt-2 inline-block text-xs text-pink-600 hover:underline">
            価格帯ごとのおすすめ一覧を見る →
          </Link>
        </section>
      </div>

      {(itemTypes.length > 0 || itemRecipients.length > 0) && (
        <div className="relative mx-auto w-full max-w-xl px-4 pt-4">
          <section className="rounded-xl border border-gray-200 bg-white/80 p-4">
            {itemTypes.length > 0 && (
              <div className="mb-3">
                <h2 className="mb-2 text-sm font-semibold text-gray-700">種類で絞り込む</h2>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                >
                  <option value="">すべて</option>
                  {itemTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {itemRecipients.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-700">送る相手で絞り込む</h2>
                <div className="flex flex-wrap gap-2">
                  {itemRecipients.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(r.name)}
                        onChange={() => toggleRecipientFilter(r.name)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-xl px-4 pt-4">
        <ul className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 sm:text-sm">
          {RARITY_OPTIONS.map((rarity) => {
            const total = RARITY_OPTIONS.reduce((sum, r) => sum + rarityWeights[r], 0);
            const percent = total > 0 ? (rarityWeights[rarity] / total) * 100 : 0;
            return (
              <li key={rarity} className="flex items-center gap-1">
                <span className="font-semibold">{RARITY_LABELS[rarity]}</span>
                <span>{percent.toFixed(2)}%</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className={`gacha-stage relative mx-auto aspect-[4/5] h-[85vh] max-h-[85vh] w-auto ${isSpinning ? "animate-bounce" : ""}`}
      >
        <Image
          src="/gacha-machine.png"
          alt="誕生日プレゼントガチャ"
          fill
          priority
          className="object-contain"
        />
        <button
          onClick={handleSpin}
          disabled={filteredPrizes.length === 0 || isSpinning}
          aria-label="ガチャを回す"
          className="spin-button absolute left-1/2 top-[67%] flex aspect-[2/1] w-[28%] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-amber-400 text-center text-base font-bold leading-tight text-black transition hover:scale-105 disabled:cursor-not-allowed"
        >
          {isSpinning ? "" : "回す"}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10">
        <header className="text-center">
          <p className="mt-2 text-sm text-gray-500">
            つまみを押してガチャを回そう！
          </p>
        </header>

        {history.length > 0 && (
          <section className="rounded-xl border border-gray-200 p-4">
            <h2 className="mb-3 font-semibold text-gray-700">これまでの結果</h2>
            <ol className="list-inside list-decimal text-sm text-gray-600">
              {history.map((h, i) => (
                <li key={`${h.id}-${i}`}>
                  {h.name}（{RARITY_LABELS[h.rarity]}）
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
