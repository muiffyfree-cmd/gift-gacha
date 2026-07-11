import type { MetadataRoute } from "next";
import { getPriceBands } from "@/lib/priceBands";
import { fetchItemRecipients } from "@/lib/tags";
import { fetchArticles } from "@/lib/articles";

const BASE_URL = "https://presentgacha.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bands = getPriceBands();
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

  const priceRoutes: MetadataRoute.Sitemap = bands.map((band) => ({
    url: `${BASE_URL}/price/${band.slug}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
    lastModified: buildDate,
  }));

  const recipientRoutes: MetadataRoute.Sitemap = bands.flatMap((band) =>
    recipients.map((recipient) => ({
      url: `${BASE_URL}/price/${band.slug}/all/${encodeURIComponent(recipient.name)}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: buildDate,
    }))
  );

  return [...staticRoutes, ...priceRoutes, ...recipientRoutes, ...articleRoutes];
}
