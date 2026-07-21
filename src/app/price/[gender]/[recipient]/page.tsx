import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { fetchItemTypes, fetchItemRecipients } from "@/lib/tags";
import { fetchItems } from "@/lib/items";
import PriceRecipientFilter from "@/components/PriceRecipientFilter";
import { decodeSegment } from "@/lib/decodeSegment";
import AdBanner from "@/components/AdBanner";
import { SITE_URL } from "@/lib/site";
import { filterItems, GENDER_UNRESTRICTED_TAG } from "@/lib/searchFilters";
import { getPriceRecipientIntro } from "@/content/priceRecipientIntros";
import {
  getPriceRecipientDescription,
  getPriceRecipientTitle,
  getRecipientLabel,
} from "@/content/priceRecipientDescriptions";

const TYPE_INTRO_TEXT = `プレゼントの「種類」は、渡すシチュエーションに大きく影響するんだ。それぞれどんな相手やシーンにおすすめかまとめたから、選ぶときの参考にしてみてね。
食べ物
食べたらなくなるから、相手に「重い」って思わせたくないときにぴったり。ちょっとしたプレゼントやお返しとして、気軽に渡せるよ。
プチ家電
実用的なものが好きな人に、気の利いた一品として贈るのにおすすめ。毎日の暮らしでちゃんと使ってもらえるよ。
衣類
どんな相手や状況でも喜んでもらいやすくて、渡しやすい定番。ただし好みに左右されやすいから、相手の雰囲気をイメージして選ぶのがコツだよ。
雑貨
友達と仲を深めたいときにぴったり。楽しさ重視で、見た目がかわいかったりクスッと笑えたりするアイテムが揃ってるよ。`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gender: string; recipient: string }>;
}): Promise<Metadata> {
  const { gender, recipient } = await params;
  const genderName = decodeSegment(gender);
  const recipientName = decodeSegment(recipient);

  const title =
    getPriceRecipientTitle(genderName, recipientName) ??
    (genderName === GENDER_UNRESTRICTED_TAG
      ? `${recipientName}へ贈る誕生日プレゼント｜誕プレガチャ`
      : `${genderName}の${recipientName}へ贈る誕生日プレゼント｜誕プレガチャ`);
  const description = getPriceRecipientDescription(genderName, recipientName);
  return description ? { title, description } : { title };
}

export default async function PriceRecipientResultPage({
  params,
}: {
  params: Promise<{ gender: string; recipient: string }>;
}) {
  const { gender, recipient } = await params;
  const genderName = decodeSegment(gender);
  const recipientName = decodeSegment(recipient);
  const genderFilter = genderName === GENDER_UNRESTRICTED_TAG ? null : genderName;
  const recipientFilter = recipientName === "all" ? null : recipientName;
  const genderLabel = genderName;
  const recipientLabel = recipientName === "all" ? "絞り込まない" : recipientName;

  const [typeTags, allRecipients, allItems] = await Promise.all([
    fetchItemTypes().catch(() => []),
    fetchItemRecipients().catch(() => []),
    fetchItems().catch(() => []),
  ]);

  const items = filterItems(allItems, { recipient: recipientFilter, gender: genderFilter });
  const otherRecipients = allRecipients.filter((r) => r.name !== recipientName);
  const introText = getPriceRecipientIntro(genderName, recipientName);

  const targetLabel = getRecipientLabel(genderName, recipientName);
  const h1 = targetLabel
    ? `${targetLabel}におすすめの誕生日プレゼント`
    : genderName === GENDER_UNRESTRICTED_TAG
      ? `${recipientLabel}への誕生日プレゼントのおすすめ`
      : `${recipientLabel}への誕生日プレゼント｜${genderLabel}向けのおすすめ`;

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
          { label: "性別から探す", href: "/price" },
          { label: genderLabel, href: `/price/${gender}` },
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

      <PriceRecipientFilter
        items={items}
        typeTags={typeTags}
        gender={genderFilter}
        recipient={recipientFilter}
      />

      {typeTags.length > 0 && (
        <section className="flex flex-col gap-3 text-xs text-gray-400">
          <p className="whitespace-pre-line">{TYPE_INTRO_TEXT}</p>
        </section>
      )}

      <AdBanner />

      {otherRecipients.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-400">
            他の相手への{genderName === GENDER_UNRESTRICTED_TAG ? "" : genderLabel}プレゼント
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherRecipients.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/price/${gender}/${encodeURIComponent(r.name)}`}
                  className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300 hover:border-pink-400 hover:text-pink-300"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/price/${gender}`} className="text-sm text-gray-400 hover:text-white">
        ← 送る相手を選び直す
      </Link>
      <Link href="/price" className="text-sm text-gray-400 hover:text-white">
        ← 性別を選び直す
      </Link>
      <Link href="/" className="text-sm text-gray-400 hover:text-white">
        ← ホームに戻る
      </Link>
    </div>
    </div>
  );
}
