import type { MetadataRoute } from "next";
import { fetchItemGenders, fetchItemRecipients } from "@/lib/tags";
import { fetchArticles } from "@/lib/articles";

const BASE_URL = "https://www.presentgacha.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /price/{性別} と /price/{性別}/{相手} はどちらも「絞り込まない」を含めて
  // 実コンテンツ・インデックス対象なので allGenders をそのまま使う。
  const allGenders = await fetchItemGenders().catch(() => []);
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

  const genderRoutes: MetadataRoute.Sitemap = allGenders.map((g) => ({
    url: `${BASE_URL}/price/${encodeURIComponent(g.name)}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
    lastModified: buildDate,
  }));

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
