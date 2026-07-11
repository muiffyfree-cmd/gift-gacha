export type ArticleItem = {
  id: string;
  name: string;
  price?: string;
  introText?: string;
  affiliateHtml?: string;
  purchaseUrl?: string;
  snsUrl?: string;
  type?: string;
  recipients?: string[];
  moods?: string[];
  sortOrder: number;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  items: ArticleItem[];
};
