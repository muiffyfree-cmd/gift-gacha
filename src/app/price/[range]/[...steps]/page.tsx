import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes, fetchItemRecipients, fetchItemMoods } from "@/lib/tags";
import { fetchItemsByPriceRange, fetchItemByName } from "@/lib/items";
import ResultScreen from "@/components/ResultScreen";
import { parsePriceBandSlug } from "@/lib/priceBands";
import { RARITY_LABELS } from "@/lib/rarity";
import AdBanner from "@/components/AdBanner";
import { SITE_URL } from "@/lib/site";

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
  if (!band) return { title: "誕生日プレゼントを探す｜誕プレガチャ" };
  const priceLabel = `${band.min}〜${band.max}`;
  const label = `¥${band.min.toLocaleString()}〜¥${band.max.toLocaleString()}`;

  if (steps.length === 1) {
    return { title: `誕生日プレゼント 予算${priceLabel}円｜誕プレガチャ` };
  }
  if (steps.length === 2) {
    const recipient = dec(steps[1]);
    const type = dec(steps[0]);
    if (type === "all" && recipient !== "all") {
      const title = `${recipient}への誕生日プレゼント 予算${priceLabel}円｜誕プレガチャ`;
      const description = `${recipient}への誕生日プレゼントを予算${label}でお探しですか？気分や雰囲気から絞り込んで、ぴったりのプレゼントを見つけましょう。`;
      return { title, description };
    }
    return { title: `誕生日プレゼント 予算${priceLabel}円｜誕プレガチャ` };
  }
  if (steps.length === 4) {
    const itemName = dec(steps[3]);
    const prize = await fetchItemByName(itemName).catch(() => null);
    if (!prize) return { title: "結果が見つかりませんでした | 誕生日プレゼント ガチャ", robots: { index: false, follow: true } };
    const title = `${prize.name}（${RARITY_LABELS[prize.rarity]}）| 誕生日プレゼント ガチャ`;
    const description = prize.description || `誕生日プレゼントガチャで「${prize.name}」が出ました。`;
    return { title, description, openGraph: { title, description }, robots: { index: false, follow: true } };
  }
  const typeVal = dec(steps[0]) === "all" ? "" : `${dec(steps[0])}の`;
  const recipientVal = dec(steps[1]) === "all" ? "" : `${dec(steps[1])}への`;
  const moodVal = dec(steps[2]) === "all" ? "" : `${dec(steps[2])}な`;
  return {
    title: `${label} ${typeVal}${recipientVal}${moodVal}おすすめプレゼント | 誕生日プレゼント ガチャ`,
    description: `${label}でおすすめの誕生日プレゼント候補一覧です。`,
    robots: { index: false, follow: true },
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
        <AdBanner />

        <Link href={`/price/${range}`} className="text-sm text-gray-400 hover:text-white">
          ← 種類を選び直す
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
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
    const isRecipientPage = type === "all" && recipient !== "all";

    const [moodTags, allRecipients] = await Promise.all([
      fetchItemMoods().catch(() => []),
      isRecipientPage ? fetchItemRecipients().catch(() => []) : Promise.resolve([]),
    ]);

    const h1 = isRecipientPage
      ? `${recipientLabel}への誕生日プレゼント｜予算${label}のおすすめ`
      : "気分を選ぶ";
    const intro = isRecipientPage
      ? `${recipientLabel}への誕生日プレゼントを予算${label}でお探しですか？ここから気分・雰囲気で絞り込むと、ぴったりのプレゼント候補が見つかります。予算内で喜ばれるギフトをガチャで楽しく決めましょう。`
      : "どんな気分のプレゼントにしますか？";

    const otherRecipients = allRecipients.filter((r) => r.name !== recipient);

    const itemListJsonLd = isRecipientPage
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: h1,
          itemListElement: moodTags.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.name,
            url: `${SITE_URL}/price/${range}/all/${encodeURIComponent(recipient)}/${encodeURIComponent(m.name)}`,
          })),
        }
      : null;

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
        {itemListJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
        )}
        <header>
          <h1 className="text-2xl font-bold">{h1}</h1>
          <p className="mt-1 text-sm text-gray-400">{intro}</p>
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
        <AdBanner />

        {isRecipientPage && otherRecipients.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-400">他の相手への{label}プレゼント</h2>
            <ul className="flex flex-wrap gap-2">
              {otherRecipients.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/price/${range}/all/${encodeURIComponent(r.name)}`}
                    className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300 hover:border-pink-400 hover:text-pink-300"
                  >
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link href={`/price/${range}/${type}`} className="text-sm text-gray-400 hover:text-white">
          ← 送る相手を選び直す
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
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

    const itemListJsonLd = items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            url: `${SITE_URL}/price/${range}/${encodeURIComponent(type)}/${encodeURIComponent(recipient)}/${encodeURIComponent(mood)}/${encodeURIComponent(item.name)}`,
          })),
        }
      : null;

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
        {itemListJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
        )}
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
                  href={`/price/${range}/${type}/${recipient}/${mood}/${encodeURIComponent(item.name)}`}
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

        <AdBanner />

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
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← ホームに戻る
          </Link>
        </div>
      </div>
      </div>
    );
  }

  // step 4: type + recipient + mood + item name → show item detail
  if (steps.length === 4) {
    const type = dec(steps[0]);
    const recipient = dec(steps[1]);
    const mood = dec(steps[2]);
    const itemName = dec(steps[3]);

    const typeLabel = type === "all" ? "絞り込まない" : type;
    const recipientLabel = recipient === "all" ? "絞り込まない" : recipient;
    const moodLabel = mood === "all" ? "絞り込まない" : mood;

    const prize = await fetchItemByName(itemName).catch(() => null);

    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "価格帯から探す", href: "/price" },
            { label: label, href: `/price/${range}` },
            { label: typeLabel, href: `/price/${range}/${type}` },
            { label: recipientLabel, href: `/price/${range}/${type}/${recipient}` },
            { label: moodLabel, href: `/price/${range}/${type}/${recipient}/${mood}` },
            { label: itemName },
          ]}
        />
        <ResultScreen initialPrize={prize} />
      </div>
    );
  }

  notFound();
}
