import type { Prize } from "@/types/gacha";
import { supabase } from "@/lib/supabase";

type ItemRow = {
  id: string;
  name: string;
  rarity: Prize["rarity"];
  price: number | null;
  description: string | null;
  affiliateurl: string | null;
  affiliatehtml: string | null;
  type: string | null;
  recipients: string[] | null;
  moods: string[] | null;
};

function rowToPrize(row: ItemRow): Prize {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    price: row.price ?? undefined,
    description: row.description ?? undefined,
    affiliateUrl: row.affiliateurl ?? undefined,
    affiliateHtml: row.affiliatehtml ?? undefined,
    type: row.type ?? undefined,
    recipients: row.recipients ?? undefined,
    moods: row.moods ?? undefined,
  };
}

function prizeToRow(item: Omit<Prize, "id">) {
  return {
    name: item.name,
    rarity: item.rarity,
    price: item.price ?? null,
    description: item.description ?? null,
    affiliateurl: item.affiliateUrl ?? null,
    affiliatehtml: item.affiliateHtml ?? null,
    type: item.type ?? null,
    recipients: item.recipients ?? [],
    moods: item.moods ?? [],
  };
}

export async function fetchItems(): Promise<Prize[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as ItemRow[]).map(rowToPrize);
}

export async function fetchItemsByPriceRange(min: number, max: number): Promise<Prize[]> {
  let query = supabase.from("items").select("*").gte("price", min);
  if (Number.isFinite(max)) {
    query = query.lte("price", max);
  }
  const { data, error } = await query.order("price", { ascending: true });
  if (error) throw error;
  return (data as ItemRow[]).map(rowToPrize);
}

export async function fetchItemByName(name: string): Promise<Prize | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPrize(data as ItemRow) : null;
}

export async function fetchItemById(id: string): Promise<Prize | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPrize(data as ItemRow) : null;
}

export async function createItem(item: Omit<Prize, "id">): Promise<Prize> {
  const { data, error } = await supabase
    .from("items")
    .insert(prizeToRow(item))
    .select()
    .single();
  if (error) throw error;
  return rowToPrize(data as ItemRow);
}

export async function updateItem(id: string, item: Omit<Prize, "id">): Promise<Prize> {
  const { data, error } = await supabase
    .from("items")
    .update(prizeToRow(item))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToPrize(data as ItemRow);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

export async function syncItemTags(
  id: string,
  tags: { type?: string; recipients?: string[]; moods?: string[] }
): Promise<void> {
  const current = await fetchItemById(id);
  if (!current) return;
  const recipients = Array.from(
    new Set([...(current.recipients ?? []), ...(tags.recipients ?? [])])
  );
  const moods = Array.from(new Set([...(current.moods ?? []), ...(tags.moods ?? [])]));
  const { error } = await supabase
    .from("items")
    .update({
      type: tags.type ?? current.type ?? null,
      recipients,
      moods,
    })
    .eq("id", id);
  if (error) throw error;
}
