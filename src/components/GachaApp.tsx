"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Prize } from "@/types/gacha";
import { loadEffects, loadPrizes, recordVisit, saveLastResult } from "@/lib/storage";
import { RARITY_LABELS, RARITY_WEIGHTS } from "@/lib/rarity";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import IntroBanner from "@/components/IntroBanner";

const SPIN_DURATION_MS = 1200;
const PRICE_MIN = 500;
const PRICE_MAX = 30000;

function pickWeightedPrize(prizes: Prize[]): Prize {
  const totalWeight = prizes.reduce(
    (sum, p) => sum + RARITY_WEIGHTS[p.rarity],
    0,
  );
  let roll = Math.random() * totalWeight;
  for (const prize of prizes) {
    roll -= RARITY_WEIGHTS[prize.rarity];
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
  const autoSpunRef = useRef(false);

  useEffect(() => {
    setPrizes(loadPrizes());
    recordVisit();
  }, []);

  const filteredPrizes = useMemo(() => {
    if (!priceRange) return prizes;
    const [low, high] = priceRange;
    return prizes.filter((p) => p.price === undefined || (p.price >= low && p.price <= high));
  }, [prizes, priceRange]);

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
    router.push("/result");
  }

  function handleSpin() {
    if (filteredPrizes.length === 0 || isSpinning) return;
    setIsSpinning(true);
    window.setTimeout(() => {
      const picked = pickWeightedPrize(filteredPrizes);
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
            value={priceRange}
            onChange={setPriceRange}
          />
        </section>
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
