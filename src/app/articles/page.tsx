import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import AdBanner from "@/components/AdBanner";
import { fetchArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "SNSで紹介した商品まとめ｜誕プレガチャ",
  description: "SNSで紹介したプレゼント候補を記事でまとめて紹介します。",
};

const ARTICLES_INTRO_TEXT = `このページでは、YouTube・Instagram・TikTokなど各種SNSでピックアップしたプレゼントをまとめて紹介しています。「SNSで見かけて気になっていたアレが欲しい」という方や、すでに贈りたいもののイメージがすでに決まっている方は、こちらから探すとよりぴったりな誕生日プレゼントに出会いやすくなります。実際にSNSで話題になったアイテムだからこそ、贈った相手にも喜んでもらいやすいのも魅力です。2日に1本のペースで新しい投稿を更新しているので、気になる方はぜひ随時チェックしてみてください。`;

export default async function ArticlesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const articles = await fetchArticles({ publishedOnly: true, query: q }).catch(() => []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "SNS紹介" }]} />
        <header>
          <h1 className="text-2xl font-bold">SNSで紹介した商品まとめ</h1>
        </header>

        <section className="intro-banner-text relative rounded-xl border-2 border-amber-400 bg-purple-950/40 px-[6%] py-[5%] text-xs leading-relaxed text-white shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
          <p className="whitespace-pre-line">{ARTICLES_INTRO_TEXT}</p>
        </section>

        <form action="/articles" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="記事を検索"
            className="flex-1 rounded-lg border border-gray-600 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            検索
          </button>
        </form>

        {articles.length === 0 ? (
          <p className="text-sm text-gray-400">記事が見つかりませんでした。</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/articles/${encodeURIComponent(article.slug)}`}
                  className="block rounded-lg border border-gray-200 bg-white px-4 py-4 hover:border-pink-300 hover:bg-pink-50"
                >
                  <p className="font-semibold text-gray-800">{article.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <AdBanner />

        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
