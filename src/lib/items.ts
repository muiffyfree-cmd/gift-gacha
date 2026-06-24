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
