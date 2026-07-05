import type { Metadata } from "next";
import ResultScreen from "@/components/ResultScreen";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemById } from "@/lib/items";
import { getPriceBandForPrice } from "@/lib/priceBands";
import { RARITY_LABELS } from "@/lib/rarity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prize = await fetchItemById(id).catch(() => null);
  if (!prize) {
    return { title: "結果が見つかりませんでした | 誕生日プレゼント ガチャ", robots: { index: false, follow: true } };
  }
  const title = `${prize.name}（${RARITY_LABELS[prize.rarity]}）が出ました！ | 誕生日プレゼント ガチャ`;
  const description = prize.description || `誕生日プレゼントガチャで「${prize.name}」が出ました。`;
  return {
    title,
    description,
    openGraph: { title, description },
    robots: { index: false, follow: true },
  };
}

export default async function ResultByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prize = await fetchItemById(id).catch(() => null);
  const priceBand = prize?.price !== undefined ? getPriceBandForPrice(prize.price) : null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      {prize && (
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            ...(priceBand
              ? [{ label: priceBand.label, href: `/price/${priceBand.slug}` }]
              : [{ label: "価格帯から探す", href: "/price" }]),
            { label: prize.name },
          ]}
        />
      )}
      <ResultScreen initialPrize={prize} />
    </div>
  );
}
