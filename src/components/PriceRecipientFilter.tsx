"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Prize } from "@/types/gacha";
import type { Tag } from "@/lib/tags";
import { RARITY_LABELS } from "@/lib/rarity";
import { filterItems } from "@/lib/searchFilters";

const CHIP_CLASS =
  "rounded-full border px-3 py-1 text-xs font-medium transition";
const CHIP_ACTIVE = "border-pink-500 bg-pink-500 text-white";
const CHIP_INACTIVE = "border-gray-600 bg-transparent text-gray-300 hover:border-pink-400";

export default function PriceRecipientFilter({
  items,
  typeTags,
  moodTags,
}: {
  items: Prize[];
  typeTags: Tag[];
  moodTags: Tag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get("type");
  const moodFilter = searchParams.get("mood");

  function updateParam(key: "type" | "mood", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = filterItems(items, { type: typeFilter, mood: moodFilter });

  return (
    <div className="flex flex-col gap-4">
      {typeTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400">種類で絞り込む</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateParam("type", null)}
              className={`${CHIP_CLASS} ${!typeFilter ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            >
              絞り込まない
            </button>
            {typeTags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateParam("type", t.name)}
                className={`${CHIP_CLASS} ${typeFilter === t.name ? CHIP_ACTIVE : CHIP_INACTIVE}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {moodTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400">気分で絞り込む</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateParam("mood", null)}
              className={`${CHIP_CLASS} ${!moodFilter ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            >
              絞り込まない
            </button>
            {moodTags.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateParam("mood", m.name)}
                className={`${CHIP_CLASS} ${moodFilter === m.name ? CHIP_ACTIVE : CHIP_INACTIVE}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">この条件に合う候補はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((item) => (
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
    </div>
  );
}
