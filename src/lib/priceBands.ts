export const PRICE_BAND_STEP = 1000;
export const PRICE_BAND_MAX = 5000;

export type PriceBand = { min: number; max: number; slug: string; label: string };

export function getPriceBands(): PriceBand[] {
  const bands: PriceBand[] = [];
  for (let min = 0; min < PRICE_BAND_MAX; min += PRICE_BAND_STEP) {
    const max = min + PRICE_BAND_STEP;
    bands.push({
      min,
      max,
      slug: `${min}-${max}`,
      label: `¥${min.toLocaleString()}〜¥${max.toLocaleString()}`,
    });
  }
  return bands;
}

export function parsePriceBandSlug(slug: string): { min: number; max: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(slug);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}

export function getPriceBandForPrice(price: number): PriceBand | null {
  return getPriceBands().find((b) => price >= b.min && price <= b.max) ?? null;
}
