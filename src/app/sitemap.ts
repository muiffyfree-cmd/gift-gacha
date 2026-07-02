import type { MetadataRoute } from "next";
import { getPriceBands } from "@/lib/priceBands";
import { fetchItems } from "@/lib/items";

const BASE_URL = "https://presentgacha.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bands = getPriceBands();
  const items = await fetchItems().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/price`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly" },
  ];

  const priceRoutes: MetadataRoute.Sitemap = bands.map((band) => ({
    url: `${BASE_URL}/price/${band.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const itemRoutes: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${BASE_URL}/result/${item.id}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...priceRoutes, ...itemRoutes];
}
