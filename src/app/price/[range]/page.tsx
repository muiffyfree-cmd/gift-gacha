import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes, fetchItemRecipients } from "@/lib/tags";
import { parsePriceBandSlug } from "@/lib/priceBands";
import AdBanner from "@/components/AdBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "誕生日プレゼントを探す｜誕プレガチャ" };
  const priceLabel = `${band.min}〜${band.max}`;
  const displayLabel = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;
  return {
    title: `誕生日プレゼント 予算${priceLabel}円｜誕プレガチャ`,
    description: `${displayLabel}の誕生日プレゼントを種類から絞り込めます。`,
  };
}

export default async function TypeSelectPage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) notFound();

  const [typeTags, recipientTags] = await Promise.all([
    fetchItemTypes().catch(() => []),
    fetchItemRecipients().catch(() => []),
  ]);
  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;

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
          <h1 className="text-2xl font-bold">{label}・種類を選ぶ</h1>
          <p className="mt-1 text-sm text-gray-400">プレゼントの種類を選んでください。</p>
        </header>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li>
            <Link
              href={`/price/${range}/all`}
              className="block rounded-lg border border-gray-600 bg-white px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
            >
              絞り込まない
            </Link>
          </li>
          {typeTags.map((t) => (
            <li key={t.id}>
              <Link
                href={`/price/${range}/${t.name}`}
                className="block rounded-lg border border-gray-600 bg-white px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>

        <AdBanner />

        {recipientTags.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-400">誰へのプレゼントをお探しですか？</h2>
            <ul className="flex flex-wrap gap-2">
              {recipientTags.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/price/${range}/all/${encodeURIComponent(r.name)}`}
                    className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300 hover:border-pink-400 hover:text-pink-300"
                  >
                    {r.name}への{label}プレゼント
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

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
