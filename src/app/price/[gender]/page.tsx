import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemRecipients } from "@/lib/tags";
import { decodeSegment } from "@/lib/decodeSegment";
import { GENDER_UNRESTRICTED_TAG } from "@/lib/searchFilters";
import AdBanner from "@/components/AdBanner";

const RECIPIENT_INTRO_TEXT = `贈る「相手」によって、喜ばれるプレゼントの選び方はけっこう変わるんだ。それぞれの相手におすすめのポイントをまとめたから、選ぶときの参考にしてね。
中学生
お小遣いの範囲でも使いやすい、シンプルで実用的なものがおすすめ。友達と盛り上がれる小物や、部活・勉強で使えるアイテムも喜ばれるよ。
高校生
おしゃれ感度が上がってくる時期だから、見た目にもこだわったアイテムがおすすめ。友達とお揃いで持てるようなものも人気だよ。
大学生
一人暮らしやサークル・アルバイト先など、行動範囲が広がる時期。日常で実際に使える、少し大人っぽいアイテムを選ぶと喜ばれるよ。
家族
日頃の感謝を伝えるのにぴったりの相手。好みがわかってることが多いから、毎日の暮らしで「わかってる！」って喜ばれるものが選びやすいよ。`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gender: string }>;
}): Promise<Metadata> {
  const { gender } = await params;
  const genderName = decodeSegment(gender);
  if (genderName === GENDER_UNRESTRICTED_TAG) {
    return {
      title: "誕生日プレゼントを相手から探す｜誕プレガチャ",
      description: "性別を問わず、贈る相手から誕生日プレゼントを絞り込めます。",
    };
  }
  return {
    title: `${genderName}へ贈る誕生日プレゼント｜誕プレガチャ`,
    description: `${genderName}へ贈る誕生日プレゼントを、贈る相手から絞り込めます。`,
  };
}

export default async function RecipientSelectPage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  const genderName = decodeSegment(gender);

  const recipientTags = await fetchItemRecipients().catch(() => []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "性別から探す", href: "/price" },
            { label: genderName },
          ]}
        />
        <header>
          <h1 className="text-2xl font-bold">
            {genderName === GENDER_UNRESTRICTED_TAG ? "送る相手を選ぶ" : `${genderName}・送る相手を選ぶ`}
          </h1>
          <p className="mt-1 text-sm text-gray-400">プレゼントを贈る相手を選んでください。</p>
        </header>

        <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
          <p className="whitespace-pre-line">{RECIPIENT_INTRO_TEXT}</p>
        </section>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {recipientTags.map((r) => (
            <li key={r.id}>
              <Link
                href={`/price/${gender}/${encodeURIComponent(r.name)}`}
                className="block rounded-lg border border-gray-600 bg-white px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
              >
                {r.name}
              </Link>
            </li>
          ))}
        </ul>

        <AdBanner />

        <Link href="/price" className="text-sm text-gray-400 hover:text-white">
          ← 他の性別を見る
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
