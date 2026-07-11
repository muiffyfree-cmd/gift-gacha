export const PRICE_BAND_STEP = 1000;
export const PRICE_BAND_MAX = 5000;

export type PriceBand = { min: number; max: number; slug: string; label: string };

export function getPriceBands(): PriceBand[] {
  const bands: PriceBand[] = [];
  for (let min = 0; min < PRICE_BAND_MAX; min += PRICE_BAND_STEP) {
    const max = min + PRICE_BAND_STEP;
    const isLast = max >= PRICE_BAND_MAX;
    bands.push({
      min,
      max: isLast ? Infinity : max,
      slug: `${min}-${max}`,
      label: isLast
        ? `¥${min.toLocaleString()}以上`
        : `¥${min.toLocaleString()}〜¥${max.toLocaleString()}`,
    });
  }
  return bands;
}

export function parsePriceBandSlug(slug: string): PriceBand | null {
  return getPriceBands().find((b) => b.slug === slug) ?? null;
}

export function getPriceBandForPrice(price: number): PriceBand | null {
  return getPriceBands().find((b) => price >= b.min && price <= b.max) ?? null;
}
