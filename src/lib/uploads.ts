import { supabase } from "@/lib/supabase";

const EFFECTS_BUCKET = "effect-gacha";

export async function uploadEffectVideo(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(EFFECTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(EFFECTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
