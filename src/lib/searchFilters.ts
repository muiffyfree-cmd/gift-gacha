import type { Prize } from "@/types/gacha";

export const GENDER_UNRESTRICTED_TAG = "絞り込まない";

export function filterItems(
  items: Prize[],
  filters: { type?: string | null; recipient?: string | null; gender?: string | null }
): Prize[] {
  return items.filter((item) => {
    const matchesType = !filters.type || item.type === filters.type;
    const matchesRecipient = !filters.recipient || item.recipients?.includes(filters.recipient);
    const matchesGender =
      !filters.gender ||
      item.gender === filters.gender ||
      item.gender === GENDER_UNRESTRICTED_TAG;
    return matchesType && matchesRecipient && matchesGender;
  });
}
