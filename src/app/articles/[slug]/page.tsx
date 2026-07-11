import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import SnsEmbed from "@/components/SnsEmbed";
import { fetchArticleBySlug } from "@/lib/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug).catch(() => null);
  if (!article || !article.published) {
    return { title: "記事が見つかりませんでした | 誕生日プレゼント ガチャ", robots: { index: false, follow: true } };
  }
  const title = `${article.title} | 誕生日プレゼント ガチャ`;
  const description = article.description || `SNSで紹介した「${article.title}」の商品まとめです。`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug).catch(() => null);
  if (!article || !article.published) notFound();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "SNS紹介", href: "/articles" },
            { label: article.title },
          ]}
        />
        <header className="text-center">
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            商品画像をタップすると購入ページに移動します。
          </p>
        </header>

        <ul className="flex flex-col gap-6">
          {article.items.map((articleItem) => (
            <li
              key={articleItem.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-gray-800"
            >
              <p className="text-center text-2xl font-bold">{articleItem.name}</p>
              {articleItem.price && (
                <p className="text-center text-xl font-semibold text-gray-600">
                  {articleItem.price}
                </p>
              )}
              {articleItem.affiliateHtml && (
                <div
                  className="flex justify-center [&_img]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: articleItem.affiliateHtml }}
                />
              )}

              {articleItem.purchaseUrl ? (
                <a
                  href={articleItem.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block w-full rounded-full bg-amber-500 px-8 py-3 text-center text-base font-bold text-white shadow hover:bg-amber-600"
                >
                  🛒 購入する
                </a>
              ) : (
                articleItem.affiliateHtml && (
                  <p className="text-center text-sm text-gray-500">
                    写真を押すと購入ページに飛べます
                  </p>
                )
              )}

              {articleItem.snsUrl && <SnsEmbed url={articleItem.snsUrl} />}

              {articleItem.introText && (
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {articleItem.introText}
                </p>
              )}
            </li>
          ))}
        </ul>

        <Link href="/articles" className="text-sm text-gray-500 hover:text-gray-800">
          ← SNS紹介一覧に戻る
        </Link>
      </div>
    </div>
  );
}
