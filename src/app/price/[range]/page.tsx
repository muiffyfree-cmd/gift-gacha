import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemsByPriceRange } from "@/lib/items";
import { parsePriceBandSlug } from "@/lib/priceBands";
import { RARITY_LABELS } from "@/lib/rarity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "価格帯から探す | 誕生日プレゼント ガチャ" };
  const title = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}のおすすめ誕生日プレゼント | 誕生日プレゼント ガチャ`;
  return {
    title,
    description: `予算¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}でおすすめの誕生日プレゼント候補一覧です。`,
  };
}

export default async function PriceBandPage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) notFound();

  const items = await fetchItemsByPriceRange(band.min, band.max).catch(() => []);
  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "価格帯から探す", href: "/price" },
          { label: label },
        ]}
      />
      <header>
        <h1 className="text-2xl font-bold text-gray-800">{label}のおすすめプレゼント</h1>
        <p className="mt-1 text-sm text-gray-500">
          この価格帯でおすすめの誕生日プレゼント候補一覧です。
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">この価格帯の候補はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/result/${item.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-pink-300 hover:bg-pink-50"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="shrink-0 text-xs text-gray-500">
                  {RARITY_LABELS[item.rarity]}
                  {item.price !== undefined ? ` ・ ¥${item.price.toLocaleString()}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/price" className="text-sm text-pink-600 hover:underline">
        ← 他の価格帯を見る
      </Link>
    </div>
  );
}
