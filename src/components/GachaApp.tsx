"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Prize } from "@/types/gacha";
import { loadEffects, loadRarityWeights, recordVisit, saveLastResult, type RarityWeights } from "@/lib/storage";
import { fetchItems } from "@/lib/items";
import { RARITY_LABELS, RARITY_OPTIONS } from "@/lib/rarity";
import IntroBanner from "@/components/IntroBanner";

const SPIN_DURATION_MS = 1200;

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
  const [rarityWeights, setRarityWeights] = useState<RarityWeights>(loadRarityWeights());
  const autoSpunRef = useRef(false);

  useEffect(() => {
    fetchItems()
      .then(setPrizes)
      .catch(() => setPrizes([]));
    recordVisit();
    setRarityWeights(loadRarityWeights());
  }, []);

  useEffect(() => {
    if (autoSpunRef.current) return;
    if (prizes.length === 0) return;
    if (searchParams.get("spin") !== "1") return;
    autoSpunRef.current = true;
    router.replace("/");
    handleSpin();
  }, [prizes, searchParams, router]);

  function revealResult(picked: Prize) {
    setHistory((prev) => [picked, ...prev].slice(0, 10));
    setIsSpinning(false);
    saveLastResult(picked);
    router.push(`/result/${picked.id}`);
  }

  function handleSpin() {
    if (prizes.length === 0 || isSpinning) return;
    setIsSpinning(true);
    window.setTimeout(() => {
      const picked = pickWeightedPrize(prizes, rarityWeights);
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
        sizes="100vw"
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
          sizes="85vh"
          className="object-contain"
        />
        <button
          onClick={handleSpin}
          disabled={prizes.length === 0 || isSpinning}
          aria-label="ガチャを回す"
          className="spin-button absolute left-1/2 top-[67%] flex aspect-[2/1] w-[28%] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-amber-400 text-center text-base font-bold leading-tight text-black transition hover:scale-105 disabled:cursor-not-allowed"
        >
          {isSpinning ? "" : "回す"}
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-xl px-4 pt-4">
        <section className="rounded-xl border border-gray-200 bg-white/80 p-4 text-center">
          <Link href="/price" className="inline-block text-sm font-semibold text-pink-600 hover:underline">
            価格帯・送る相手・気分からおすすめを探す →
          </Link>
        </section>
      </div>

      <div className="relative mx-auto w-full max-w-xl px-4 pt-4">
        <section className="rounded-xl border border-gray-200 bg-white/80 p-4 text-center">
          <Link href="/articles" className="inline-block text-sm font-semibold text-pink-600 hover:underline">
            SNSで紹介した商品まとめを見る →
          </Link>
        </section>
      </div>

      <div className="relative mx-auto w-full max-w-xl px-4 pt-4">
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://www.instagram.com/present_gacha_muiffy/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <Image
              src="/instagram.jpg"
              alt="Instagram"
              width={40}
              height={40}
              className="rounded-full"
            />
          </a>
          <a
            href="https://www.youtube.com/channel/UCejvlkQzBs6vTFI-wzTn57g"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <Image src="/youtube.png" alt="YouTube" width={40} height={40} className="rounded-full" />
          </a>
          <a
            href="https://www.tiktok.com/@muiffy_presentgacha"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <Image src="/tiktok.webp" alt="TikTok" width={40} height={40} className="rounded-full" />
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10">
        <header className="text-center">
          <h1 className="text-xl font-bold text-gray-800">誕生日プレゼントガチャ</h1>
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
