import { supabase } from "@/lib/supabase";

export async function checkIsAdmin(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
