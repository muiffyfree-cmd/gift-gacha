import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { getPriceBands } from "@/lib/priceBands";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "価格帯から探す | 誕生日プレゼント ガチャ",
  description: "予算別に誕生日プレゼントのおすすめ候補を一覧で紹介します。",
};

export default function PriceIndexPage() {
  const bands = getPriceBands();

  return (
    <div className="min-h-screen bg-black text-white">
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "価格帯から探す" }]} />
      <header>
        <h1 className="text-2xl font-bold">価格帯から探す</h1>
        <p className="mt-1 text-sm text-gray-400">
          予算に合わせて、誕生日プレゼントのおすすめ候補を価格帯ごとに一覧でご紹介します。
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bands.map((band) => (
          <li key={band.slug}>
            <Link
              href={`/price/${band.slug}`}
              className="block rounded-lg border border-gray-200 bg-white px-3 py-3 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
            >
              {band.label}
            </Link>
          </li>
        ))}
      </ul>
      <AdBanner />
      <Link href="/" className="text-sm text-gray-400 hover:text-white">
        ← ホームに戻る
      </Link>
    </div>
    </div>
  );
}
