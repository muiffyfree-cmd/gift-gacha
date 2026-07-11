import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { getPriceBands } from "@/lib/priceBands";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "誕生日プレゼントを予算から探す｜誕プレガチャ",
  description: "予算別に誕生日プレゼントのおすすめ候補を一覧で紹介します。",
};

const PRICE_INTRO_TEXT = `実は、プレゼントって「誰に贈るか」「どんな相手か」で、ちょうどいい金額帯が変わってくるんだ。下の価格帯ごとにおすすめのシチュエーションをまとめたから、相手との関係に合わせて選んでみてね。
¥0〜¥1,000
ちょっとした日頃の感謝を伝えたいときに。気軽に渡せて、相手にも気を遣わせないさりげないプレゼントが揃ってるよ。
¥1,000〜¥2,000
お返しや、付き合いで用意しなきゃってときに。安っぽく見えないし、相手にも重くない、ちょうどいい一品が見つかるよ。
¥2,000〜¥3,000
一緒にいる友達や気のおけない仲間に。「あなたのこと考えて選んだよ」が伝わるちょっと特別感のあるプレゼントが揃ってるよ。
¥3,000〜¥4,000
ちょっと奮発したいときや、日頃の感謝も伝えたいときに。「ありがとう」も込められる、ちょっといいプレゼントを集めたよ。
¥4,000〜¥5,000
お世話になってる先輩や、かけがえのない大親友に。特別な気持ちを形にできる、とっておきのプレゼントが揃ってるよ。`;

export default function PriceIndexPage() {
  const bands = getPriceBands();

  return (
    <div className="min-h-screen bg-black text-white">
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "価格帯から探す" }]} />
      <header>
        <h1 className="text-2xl font-bold">価格帯から探す</h1>
      </header>

      <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
        <p className="whitespace-pre-line">{PRICE_INTRO_TEXT}</p>
      </section>

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
