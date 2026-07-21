import type { Article, ArticleItem } from "@/types/article";
import { supabase } from "@/lib/supabase";

type ArticleItemRow = {
  id: string;
  article_id: string;
  name: string;
  price: string | null;
  intro_text: string | null;
  affiliate_html: string | null;
  purchase_url: string | null;
  sns_url: string | null;
  item_id: string | null;
  type: string | null;
  recipients: string[] | null;
  gender: string | null;
  sort_order: number;
};

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  article_items: ArticleItemRow[];
};

const ARTICLE_SELECT = "*, article_items(*)";

function rowToArticleItem(row: ArticleItemRow): ArticleItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price ?? undefined,
    introText: row.intro_text ?? undefined,
    affiliateHtml: row.affiliate_html ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    snsUrl: row.sns_url ?? undefined,
    itemId: row.item_id ?? undefined,
    type: row.type ?? undefined,
    recipients: row.recipients ?? undefined,
    gender: row.gender ?? undefined,
    sortOrder: row.sort_order,
  };
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [...row.article_items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToArticleItem),
  };
}

export type ArticleItemInput = {
  name: string;
  price?: string;
  introText?: string;
  affiliateHtml?: string;
  purchaseUrl?: string;
  snsUrl?: string;
  itemId?: string;
  type?: string;
  recipients?: string[];
  gender?: string;
  sortOrder: number;
};

export type ArticleInput = {
  title: string;
  slug: string;
  description?: string;
  published: boolean;
  items: ArticleItemInput[];
};

export async function fetchArticles({
  publishedOnly = false,
  query,
}: { publishedOnly?: boolean; query?: string } = {}): Promise<Article[]> {
  let request = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("created_at", { ascending: false });
  if (publishedOnly) request = request.eq("published", true);
  if (query) {
    const escaped = query.replace(/[%,]/g, "");
    request = request.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return (data as unknown as ArticleRow[]).map(rowToArticle);
}

export async function fetchAllArticlesForAdmin(): Promise<Article[]> {
  return fetchArticles({ publishedOnly: false });
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToArticle(data as unknown as ArticleRow) : null;
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToArticle(data as unknown as ArticleRow) : null;
}

async function replaceArticleItems(articleId: string, items: ArticleItemInput[]) {
  const { error: deleteError } = await supabase
    .from("article_items")
    .delete()
    .eq("article_id", articleId);
  if (deleteError) throw deleteError;

  if (items.length === 0) return;

  const { error: insertError } = await supabase.from("article_items").insert(
    items.map((item) => ({
      article_id: articleId,
      name: item.name,
      price: item.price ?? null,
      intro_text: item.introText ?? null,
      affiliate_html: item.affiliateHtml ?? null,
      purchase_url: item.purchaseUrl ?? null,
      sns_url: item.snsUrl ?? null,
      item_id: item.itemId ?? null,
      type: item.type ?? null,
      recipients: item.recipients ?? [],
      gender: item.gender ?? null,
      sort_order: item.sortOrder,
    }))
  );
  if (insertError) throw insertError;
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      published: input.published,
    })
    .select()
    .single();
  if (error) throw error;
  const articleId = (data as { id: string }).id;
  await replaceArticleItems(articleId, input.items);
  const created = await fetchArticleById(articleId);
  if (!created) throw new Error("記事の作成に失敗しました。");
  return created;
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  const { error } = await supabase
    .from("articles")
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      published: input.published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  await replaceArticleItems(id, input.items);
  const updated = await fetchArticleById(id);
  if (!updated) throw new Error("記事の更新に失敗しました。");
  return updated;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}
