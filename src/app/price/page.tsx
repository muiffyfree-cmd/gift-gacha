import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemGenders } from "@/lib/tags";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "誕生日プレゼントを性別から探す｜誕プレガチャ",
  description: "贈る相手の性別からおすすめの誕生日プレゼントを一覧で紹介します。",
};

const GENDER_INTRO_TEXT = `贈る相手の性別によって、喜ばれるプレゼントの傾向は変わってくるよ。まずは性別を選んで、そのあと送る相手を選べば、ぴったりのプレゼントが見つけやすくなるよ。迷ったら「絞り込まない」を選んでもOK。`;

export default async function PriceIndexPage() {
  const genders = await fetchItemGenders().catch(() => []);

  return (
    <div className="min-h-screen bg-black text-white">
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "性別から探す" }]} />
      <header>
        <h1 className="text-2xl font-bold">性別から探す</h1>
      </header>

      <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
        <p className="whitespace-pre-line">{GENDER_INTRO_TEXT}</p>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {genders.map((g) => (
          <li key={g.id}>
            <Link
              href={`/price/${encodeURIComponent(g.name)}`}
              className="block rounded-lg border border-gray-200 bg-white px-3 py-3 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
            >
              {g.name}
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
