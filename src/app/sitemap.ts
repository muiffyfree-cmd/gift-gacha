import type { MetadataRoute } from "next";
import { fetchItemGenders, fetchItemRecipients } from "@/lib/tags";
import { fetchArticles } from "@/lib/articles";
import { GENDER_UNRESTRICTED_TAG } from "@/lib/searchFilters";

const BASE_URL = "https://presentgacha.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allGenders = await fetchItemGenders().catch(() => []);
  const genders = allGenders.filter((g) => g.name !== GENDER_UNRESTRICTED_TAG);
  const recipients = await fetchItemRecipients().catch(() => []);
  const articles = await fetchArticles({ publishedOnly: true }).catch(() => []);

  const buildDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly", lastModified: buildDate },
    { url: `${BASE_URL}/price`, priority: 0.8, changeFrequency: "monthly", lastModified: buildDate },
    { url: `${BASE_URL}/articles`, priority: 0.7, changeFrequency: "weekly", lastModified: buildDate },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly", lastModified: buildDate },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/articles/${encodeURIComponent(article.slug)}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
    lastModified: new Date(article.updatedAt),
  }));

  const genderRoutes: MetadataRoute.Sitemap = genders.map((g) => ({
    url: `${BASE_URL}/price/${encodeURIComponent(g.name)}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
    lastModified: buildDate,
  }));

  // 結果ページ(/price/{性別}/{相手})は「絞り込まない」もインデックス対象の実コンテンツを持つため、
  // ここは genders ではなく allGenders を使う（性別選択ステップの /price/{性別} とは扱いが異なる）。
  const recipientRoutes: MetadataRoute.Sitemap = allGenders.flatMap((g) =>
    recipients.map((recipient) => ({
      url: `${BASE_URL}/price/${encodeURIComponent(g.name)}/${encodeURIComponent(recipient.name)}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: buildDate,
    }))
  );

  return [...staticRoutes, ...genderRoutes, ...recipientRoutes, ...articleRoutes];
}
