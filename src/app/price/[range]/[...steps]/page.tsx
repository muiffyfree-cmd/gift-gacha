import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes, fetchItemRecipients, fetchItemMoods } from "@/lib/tags";
import { fetchItemsByPriceRange, fetchItemByName } from "@/lib/items";
import ResultScreen from "@/components/ResultScreen";
import PriceRecipientFilter from "@/components/PriceRecipientFilter";
import { parsePriceBandSlug } from "@/lib/priceBands";
import { RARITY_LABELS } from "@/lib/rarity";
import AdBanner from "@/components/AdBanner";
import { SITE_URL } from "@/lib/site";
import { filterItems } from "@/lib/searchFilters";
import { getPriceRecipientIntro } from "@/content/priceRecipientIntros";
import { getPriceRecipientDescription } from "@/content/priceRecipientDescriptions";

function dec(s: string) {
  try { return decodeURIComponent(s); } catch { return s; }
}

const RECIPIENT_INTRO_TEXT = `贈る「相手」によって、喜ばれるプレゼントの選び方はけっこう変わるんだ。それぞれの相手におすすめのポイントをまとめたから、選ぶときの参考にしてね。
先輩
気を遣わせない範囲で、仕事や私生活にちゃんと役立つものがおすすめ。実用的で「気が利くなあ」って思ってもらえる一品を選ぶと◎。
後輩
高すぎないものがおすすめ。もらったお返しなら、いただいたものと同じくらいの金額に合わせると、お互い気持ちよくやりとりできるよ。
家族
日頃の感謝を伝えるのにぴったりの相手。好みがわかってることが多いから、衣類やプチ家電みたいに「わかってる！」って喜ばれるものが選びやすいよ。
恋人
高級感があって高見えするものがおすすめ。特別感を出すと喜ばれるよ。高校生なら3〜4千円くらいが、背伸びせず気持ちも伝わるちょうどいいラインだよ。
友達
自分ではなかなか買わない珍しいものや、面白いものがおすすめ。友達の好きなものをまとめて買ってあげるのも、盛り上がって喜ばれるよ。`;

const TYPE_INTRO_TEXT = `プレゼントの「種類」は、渡すシチュエーションに大きく影響するんだ。それぞれどんな相手やシーンにおすすめかまとめたから、選ぶときの参考にしてみてね。
食べ物
食べたらなくなるから、相手に「重い」って思わせたくないときにぴったり。ちょっとしたプレゼントやお返しとして、気軽に渡せるよ。
プチ家電
実用的なものが好きな人や先輩に、気の利いた一品として贈るのにおすすめ。毎日の暮らしでちゃんと使ってもらえるよ。
衣類
どんな相手や状況でも喜んでもらいやすくて、渡しやすい定番。ただし好みに左右されやすいから、相手の雰囲気をイメージして選ぶのがコツだよ。
雑貨
友達や後輩と友情を深めたいときにぴったり。楽しさ重視で、見た目がかわいかったりクスッと笑えたりするアイテムが揃ってるよ。`;

const MOOD_INTRO_TEXT = `上のポイントに加えて、相手の性格や関係性を考えると、プレゼントはもっとぴったりのものが選べるんだ。贈りたい雰囲気からも探してみてね。
ありがたい
毎日の暮らしや仕事にちゃんと役立つものをセレクト。テキパキ動く「仕事できるな〜」って人に贈ると、その気の利きっぷりが伝わるよ。
おしゃれ
かわいさやセンスの良さで選んだアイテムをセレクト。見た目や雰囲気にこだわりのある、おしゃれさんに贈るとめちゃくちゃ喜ばれるよ。
楽しい
一緒に楽しめたり、開けた瞬間に盛り上がるものをセレクト。明るくてノリのいい性格の相手に贈ると、その場がぱっと華やぐよ。
面白い
普段はあんまり見かけない、ネタに全振りしたものをセレクト。何でも笑い合える、気の許した友達に贈るとバカウケするよ。`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string; steps: string[] }>;
}): Promise<Metadata> {
  const { range, steps } = await params;
  const band = parsePriceBandSlug(range);
  if (!band) return { title: "誕生日プレゼントを探す｜誕プレガチャ" };
  const label = band.label;

  if (steps.length === 1) {
    return {
      title: `誕生日プレゼント 予算${label}｜誕プレガチャ`,
      robots: { index: false, follow: true },
    };
  }
  if (steps.length === 2) {
    const recipient = dec(steps[1]);
    const type = dec(steps[0]);
    if (type === "all" && recipient !== "all") {
      const title = `${recipient}への誕生日プレゼント 予算${label}｜誕プレガチャ`;
      const description = getPriceRecipientDescription(range, recipient);
      return description ? { title, description } : { title };
    }
    return {
      title: `誕生日プレゼント 予算${label}｜誕プレガチャ`,
      robots: { index: false, follow: true },
    };
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

  const label = band.label;

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

        <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
          <p className="whitespace-pre-line">{RECIPIENT_INTRO_TEXT}</p>
        </section>

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

  // step 2: type=all + recipient selected → canonical 価格帯×相手 page (indexed)
  if (steps.length === 2) {
    const type = dec(steps[0]);
    const recipient = dec(steps[1]);
    const typeLabel = type === "all" ? "絞り込まない" : type;
    const recipientLabel = recipient === "all" ? "絞り込まない" : recipient;
    const isRecipientPage = type === "all" && recipient !== "all";

    if (!isRecipientPage) {
      // 非対象の組み合わせ（noindex）。旧URLの後方互換のため機能は残す。
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
          <AdBanner />

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

    const [typeTags, moodTags, allRecipients, allItems] = await Promise.all([
      fetchItemTypes().catch(() => []),
      fetchItemMoods().catch(() => []),
      fetchItemRecipients().catch(() => []),
      fetchItemsByPriceRange(band.min, band.max).catch(() => []),
    ]);

    const items = filterItems(allItems, { recipient });
    const otherRecipients = allRecipients.filter((r) => r.name !== recipient);
    const introText = getPriceRecipientIntro(range, recipient);

    const h1 = `${recipientLabel}への誕生日プレゼント｜予算${label}のおすすめ`;

    const itemListJsonLd =
      items.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: h1,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              url: `${SITE_URL}/result/${item.id}`,
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
        </header>

        {introText && (
          <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
            <p className="whitespace-pre-line">{introText}</p>
          </section>
        )}

        <PriceRecipientFilter items={items} typeTags={typeTags} moodTags={moodTags} />

        {(typeTags.length > 0 || moodTags.length > 0) && (
          <section className="flex flex-col gap-3 text-xs text-gray-400">
            {typeTags.length > 0 && (
              <p className="whitespace-pre-line">{TYPE_INTRO_TEXT}</p>
            )}
            {moodTags.length > 0 && (
              <p className="whitespace-pre-line">{MOOD_INTRO_TEXT}</p>
            )}
          </section>
        )}

        <AdBanner />

        {otherRecipients.length > 0 && (
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

        <Link href={`/price/${range}`} className="text-sm text-gray-400 hover:text-white">
          ← 送る相手を選び直す
        </Link>
        <Link href="/price" className="text-sm text-gray-400 hover:text-white">
          ← 価格帯を選び直す
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
