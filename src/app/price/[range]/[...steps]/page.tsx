import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes, fetchItemRecipients, fetchItemMoods } from "@/lib/tags";
import { fetchItemsByPriceRange } from "@/lib/items";
import { parsePriceBandSlug } from "@/lib/priceBands";
import { RARITY_LABELS } from "@/lib/rarity";

function dec(s: string) {
  try { return decodeURIComponent(s); } catch { return s; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string; steps: string[] }>;
}): Promise<Metadata> {
  const { range, steps } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "価格帯から探す | 誕生日プレゼント ガチャ" };
  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;

  if (steps.length === 1) {
    return { title: `${label} 送る相手を選ぶ | 誕生日プレゼント ガチャ` };
  }
  if (steps.length === 2) {
    return { title: `${label} 気分を選ぶ | 誕生日プレゼント ガチャ` };
  }
  const typeVal = dec(steps[0]) === "all" ? "" : `${dec(steps[0])}の`;
  const recipientVal = dec(steps[1]) === "all" ? "" : `${dec(steps[1])}への`;
  const moodVal = dec(steps[2]) === "all" ? "" : `${dec(steps[2])}な`;
  return {
    title: `${label} ${typeVal}${recipientVal}${moodVal}おすすめプレゼント | 誕生日プレゼント ガチャ`,
    description: `${label}でおすすめの誕生日プレゼント候補一覧です。`,
  };
}

const CARD_CLASS =
  "block rounded-lg border border-gray-200 bg-white px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50";

export default async function WizardStepsPage({
  params,
}: {
  params: Promise<{ range: string; steps: string[] }>;
}) {
  const { range, steps } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) notFound();

  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;

  // step 1: type selected → show recipient selection
  if (steps.length === 1) {
    const type = dec(steps[0]);
    const typeLabel = type === "all" ? "絞り込まない" : type;
    const recipientTags = await fetchItemRecipients().catch(() => []);

    return (
      <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "価格帯から探す", href: "/price" },
            { label: label, href: `/price/${range}` },
            { label: typeLabel },
          ]}
        />
        <header>
          <h1 className="text-2xl font-bold">送る相手を選ぶ</h1>
          <p className="mt-1 text-sm text-gray-400">プレゼントを贈る相手を選んでください。</p>
        </header>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li>
            <Link href={`/price/${range}/${type}/all`} className={CARD_CLASS}>
              絞り込まない
            </Link>
          </li>
          {recipientTags.map((r) => (
            <li key={r.id}>
              <Link href={`/price/${range}/${type}/${r.name}`} className={CARD_CLASS}>
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={`/price/${range}`} className="text-sm text-gray-400 hover:text-white">
          ← 種類を選び直す
        </Link>
      </div>
      </div>
    );
  }

  // step 2: type + recipient selected → show mood selection
  if (steps.length === 2) {
    const type = dec(steps[0]);
    const recipient = dec(steps[1]);
    const typeLabel = type === "all" ? "絞り込まない" : type;
    const recipientLabel = recipient === "all" ? "絞り込まない" : recipient;
    const moodTags = await fetchItemMoods().catch(() => []);

    return (
      <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "価格帯から探す", href: "/price" },
            { label: label, href: `/price/${range}` },
            { label: typeLabel, href: `/price/${range}/${type}` },
            { label: recipientLabel },
          ]}
        />
        <header>
          <h1 className="text-2xl font-bold">気分を選ぶ</h1>
          <p className="mt-1 text-sm text-gray-400">どんな気分のプレゼントにしますか？</p>
        </header>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li>
            <Link href={`/price/${range}/${type}/${recipient}/all`} className={CARD_CLASS}>
              絞り込まない
            </Link>
          </li>
          {moodTags.map((m) => (
            <li key={m.id}>
              <Link href={`/price/${range}/${type}/${recipient}/${m.name}`} className={CARD_CLASS}>
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={`/price/${range}/${type}`} className="text-sm text-gray-400 hover:text-white">
          ← 送る相手を選び直す
        </Link>
      </div>
      </div>
    );
  }

  // step 3: all selected → show filtered items
  if (steps.length === 3) {
    const type = dec(steps[0]);
    const recipient = dec(steps[1]);
    const mood = dec(steps[2]);

    const typeFilter = type === "all" ? null : type;
    const recipientFilter = recipient === "all" ? null : recipient;
    const moodFilter = mood === "all" ? null : mood;

    const typeLabel = typeFilter ?? "絞り込まない";
    const recipientLabel = recipientFilter ?? "絞り込まない";
    const moodLabel = moodFilter ?? "絞り込まない";

    const allItems = await fetchItemsByPriceRange(band.min, band.max).catch(() => []);
    const items = allItems.filter((item) => {
      const matchesType = !typeFilter || item.type === typeFilter;
      const matchesRecipient = !recipientFilter || item.recipients?.includes(recipientFilter);
      const matchesMood = !moodFilter || item.moods?.includes(moodFilter);
      return matchesType && matchesRecipient && matchesMood;
    });

    const conditionParts = [
      label,
      typeFilter,
      recipientFilter ? `${recipientFilter}へ` : null,
      moodFilter,
    ].filter(Boolean);

    return (
      <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "価格帯から探す", href: "/price" },
            { label: label, href: `/price/${range}` },
            { label: typeLabel, href: `/price/${range}/${type}` },
            { label: recipientLabel, href: `/price/${range}/${type}/${recipient}` },
            { label: moodLabel },
          ]}
        />
        <header>
          <h1 className="text-2xl font-bold">おすすめプレゼント</h1>
          <p className="mt-1 text-sm text-gray-400">
            {conditionParts.join(" ・ ")} のプレゼント候補です。
          </p>
        </header>

{items.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">この条件に合う候補はまだありません。</p>
            <Link
              href={`/price/${range}/${type}/${recipient}`}
              className="text-sm text-gray-400 hover:text-white"
            >
              ← 気分を変えてみる
            </Link>
          </div>
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

        <div className="flex flex-col gap-2">
          <Link href={`/price/${range}/${type}/${recipient}`} className="text-sm text-gray-400 hover:text-white">
            ← 気分を選び直す
          </Link>
          <Link href={`/price/${range}/${type}`} className="text-sm text-gray-400 hover:text-white">
            ← 送る相手を選び直す
          </Link>
          <Link href={`/price/${range}`} className="text-sm text-gray-400 hover:text-white">
            ← 種類を選び直す
          </Link>
          <Link href="/price" className="text-sm text-gray-400 hover:text-white">
            ← 価格帯を選び直す
          </Link>
        </div>
      </div>
      </div>
    );
  }

  notFound();
}
