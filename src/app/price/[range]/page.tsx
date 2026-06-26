import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes } from "@/lib/tags";
import { parsePriceBandSlug } from "@/lib/priceBands";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "価格帯から探す | 誕生日プレゼント ガチャ" };
  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;
  return {
    title: `${label} 種類を選ぶ | 誕生日プレゼント ガチャ`,
    description: `${label}の誕生日プレゼントを種類から絞り込めます。`,
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

  const typeTags = await fetchItemTypes().catch(() => []);
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

        <Link href="/price" className="text-sm text-gray-400 hover:text-white">
          ← 他の価格帯を見る
        </Link>
      </div>
    </div>
  );
}
