import { supabase } from "@/lib/supabase";

export type Tag = { id: string; name: string };

export async function fetchItemTypes(): Promise<Tag[]> {
  const { data, error } = await supabase.from("item_types").select("*").order("name");
  if (error) throw error;
  return data as Tag[];
}

export async function createItemType(name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from("item_types")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function deleteItemType(id: string): Promise<void> {
  const { error } = await supabase.from("item_types").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchItemRecipients(): Promise<Tag[]> {
  const { data, error } = await supabase.from("item_recipients").select("*").order("name");
  if (error) throw error;
  return data as Tag[];
}

export async function createItemRecipient(name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from("item_recipients")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function deleteItemRecipient(id: string): Promise<void> {
  const { error } = await supabase.from("item_recipients").delete().eq("id", id);
  if (error) throw error;
}
