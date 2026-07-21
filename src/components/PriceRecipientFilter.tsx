"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Prize } from "@/types/gacha";
import type { Tag } from "@/lib/tags";
import { RARITY_LABELS } from "@/lib/rarity";
import { filterItems } from "@/lib/searchFilters";
import { getPriceBands } from "@/lib/priceBands";

const CHIP_CLASS =
  "rounded-full border px-3 py-1 text-xs font-medium transition";
const CHIP_ACTIVE = "border-pink-500 bg-pink-500 text-white";
const CHIP_INACTIVE = "border-gray-600 bg-transparent text-gray-300 hover:border-pink-400";

export default function PriceRecipientFilter({
  items,
  typeTags,
  gender,
  recipient,
}: {
  items: Prize[];
  typeTags: Tag[];
  gender?: string | null;
  recipient?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get("type");
  const budgetFilter = searchParams.get("budget");
  const bands = getPriceBands();
  const budgetBand = budgetFilter ? bands.find((b) => b.slug === budgetFilter) ?? null : null;

  function updateParam(key: "type" | "budget", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const typeFiltered = filterItems(items, { type: typeFilter });
  const filtered = budgetBand
    ? typeFiltered.filter(
        (item) => item.price !== undefined && item.price >= budgetBand.min && item.price <= budgetBand.max
      )
    : typeFiltered;

  const spinParams = new URLSearchParams();
  if (gender) spinParams.set("gender", gender);
  if (recipient) spinParams.set("recipient", recipient);
  if (typeFilter) spinParams.set("type", typeFilter);
  if (budgetFilter) spinParams.set("budget", budgetFilter);
  const spinQuery = spinParams.toString();
  const spinHref = spinQuery ? `/?${spinQuery}` : "/";

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

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-400">予算で絞り込む</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParam("budget", null)}
            className={`${CHIP_CLASS} ${!budgetFilter ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          >
            絞り込まない
          </button>
          {bands.map((band) => (
            <button
              key={band.slug}
              type="button"
              onClick={() => updateParam("budget", band.slug)}
              className={`${CHIP_CLASS} ${budgetFilter === band.slug ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            >
              {band.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <Link
          href={spinHref}
          className="block w-full rounded-full bg-pink-600 px-6 py-3 text-center text-sm font-bold text-white shadow hover:bg-pink-700"
        >
          🎰 この条件でガチャを引く（{filtered.length}件から）
        </Link>
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
