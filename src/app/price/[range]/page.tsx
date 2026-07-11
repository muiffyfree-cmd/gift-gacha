import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemRecipients } from "@/lib/tags";
import { parsePriceBandSlug } from "@/lib/priceBands";
import AdBanner from "@/components/AdBanner";

const RECIPIENT_INTRO_TEXT = `贈る「相手」によって、喜ばれるプレゼントの選び方はけっこう変わるんだ。それぞれの相手におすすめのポイントをまとめたから、選ぶときの参考にしてね。
先輩
気を遣わせない範囲で、仕事や私生活にちゃんと役立つものがおすすめ。実用的で「気が利くなあ」って思ってもらえる一品を選ぶと◎。
後輩
高すぎないものがおすすめ。もらったお返しなら、いただいたものと同じくらいの金額に合わせると、お互い気持ちよくやりとりできるよ。
家族
日頃の感謝を伝えるのにぴったりの相手。好みがわかってることが多いから、衣類やプチ家電みたいに「わかってる！」って喜ばれるものが選びやすいよ。
恋人
高級感があって高見えするものがおすすめ。特別感を出すと喜ばれるよ。高校生なら3〜4千円くらいが、背伸びせず気持ちも伝わるちょうどいいラインだよ。
友達
自分ではなかなか買わない珍しいものや、面白いものがおすすめ。友達の好きなものをまとめて買ってあげるのも、盛り上がって喜ばれるよ。`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "誕生日プレゼントを探す｜誕プレガチャ" };
  return {
    title: `誕生日プレゼント 予算${band.label}｜誕プレガチャ`,
    description: `${band.label}の誕生日プレゼントを、贈る相手から絞り込めます。`,
  };
}

export default async function RecipientSelectPage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) notFound();

  const recipientTags = await fetchItemRecipients().catch(() => []);
  const label = band.label;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "価格帯から探す", href: "/price" },
            { label: label },
          ]}
        />
        <header>
          <h1 className="text-2xl font-bold">{label}・送る相手を選ぶ</h1>
          <p className="mt-1 text-sm text-gray-400">プレゼントを贈る相手を選んでください。</p>
        </header>

        <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
          <p className="whitespace-pre-line">{RECIPIENT_INTRO_TEXT}</p>
        </section>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {recipientTags.map((r) => (
            <li key={r.id}>
              <Link
                href={`/price/${range}/all/${encodeURIComponent(r.name)}`}
                className="block rounded-lg border border-gray-600 bg-white px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
              >
                {r.name}
              </Link>
            </li>
          ))}
        </ul>

        <AdBanner />

        <Link href="/price" className="text-sm text-gray-400 hover:text-white">
          ← 他の価格帯を見る
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
