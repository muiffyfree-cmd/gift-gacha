import { supabase } from "@/lib/supabase";

export type Tag = { id: string; name: string };

function makeTagApi(table: string) {
  return {
    async fetch(): Promise<Tag[]> {
      const { data, error } = await supabase.from(table).select("*").order("name");
      if (error) throw error;
      return data as Tag[];
    },
    async create(name: string): Promise<Tag> {
      const { data, error } = await supabase.from(table).insert({ name }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

const typesApi = makeTagApi("item_types");
const recipientsApi = makeTagApi("item_recipients");
const gendersApi = makeTagApi("item_genders");

export const fetchItemTypes = typesApi.fetch;
export const createItemType = typesApi.create;
export const deleteItemType = typesApi.remove;

export const fetchItemRecipients = recipientsApi.fetch;
export const createItemRecipient = recipientsApi.create;
export const deleteItemRecipient = recipientsApi.remove;

export const fetchItemGenders = gendersApi.fetch;
export const createItemGender = gendersApi.create;
export const deleteItemGender = gendersApi.remove;
