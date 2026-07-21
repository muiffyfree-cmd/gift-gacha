import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/muiffybase/",
    },
    sitemap: "https://www.presentgacha.com/sitemap.xml",
  };
}
