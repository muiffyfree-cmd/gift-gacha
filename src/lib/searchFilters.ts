import type { Prize } from "@/types/gacha";

export function filterItems(
  items: Prize[],
  filters: { type?: string | null; recipient?: string | null; mood?: string | null }
): Prize[] {
  return items.filter((item) => {
    const matchesType = !filters.type || item.type === filters.type;
    const matchesRecipient = !filters.recipient || item.recipients?.includes(filters.recipient);
    const matchesMood = !filters.mood || item.moods?.includes(filters.mood);
    return matchesType && matchesRecipient && matchesMood;
  });
}
