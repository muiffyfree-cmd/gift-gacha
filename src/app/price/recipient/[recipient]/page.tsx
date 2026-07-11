import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItems } from "@/lib/items";
import { filterItems } from "@/lib/searchFilters";
import { decodeSegment } from "@/lib/decodeSegment";
import { RARITY_LABELS } from "@/lib/rarity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ recipient: string }>;
}): Promise<Metadata> {
  const { recipient } = await params;
  const recipientName = decodeSegment(recipient);
  return {
    title: `${recipientName}への誕生日プレゼント一覧｜誕プレガチャ`,
    robots: { index: false, follow: true },
  };
}

export default async function RecipientGenrePage({
  params,
}: {
  params: Promise<{ recipient: string }>;
}) {
  const { recipient } = await params;
  const recipientName = decodeSegment(recipient);

  const allItems = await fetchItems().catch(() => []);
  const items = filterItems(allItems, { recipient: recipientName });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: `相手: ${recipientName}` }]} />
        <header>
          <h1 className="text-2xl font-bold">{recipientName}への誕生日プレゼント一覧</h1>
        </header>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">この相手向けの候補はまだありません。</p>
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

        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
