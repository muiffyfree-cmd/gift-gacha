import type { Prize, Rarity } from "@/types/gacha";
import { DEFAULT_RARITY_EFFECTS, DEFAULT_RARITY_WEIGHTS } from "@/lib/rarity";

const LAST_RESULT_KEY = "gacha-gift-last-result";

export function saveLastResult(prize: Prize): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(prize));
}

export function loadLastResult(): Prize | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Prize;
  } catch {
    return null;
  }
}

const PURCHASE_COUNTS_KEY = "gacha-gift-purchase-counts";

export type PurchaseCount = { id: string; name: string; count: number };

export function loadPurchaseCounts(): PurchaseCount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PURCHASE_COUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordPurchase(id: string, name: string): void {
  if (typeof window === "undefined") return;
  const counts = loadPurchaseCounts();
  const existing = counts.find((c) => c.id === id);
  if (existing) {
    existing.count += 1;
    existing.name = name;
  } else {
    counts.push({ id, name, count: 1 });
  }
  window.localStorage.setItem(PURCHASE_COUNTS_KEY, JSON.stringify(counts));
}

const EFFECTS_KEY = "gacha-gift-effects";

export type RarityEffects = Partial<Record<Rarity, string[]>>;

export function loadEffects(): RarityEffects {
  if (typeof window === "undefined") return DEFAULT_RARITY_EFFECTS;
  try {
    const raw = window.localStorage.getItem(EFFECTS_KEY);
    if (!raw) return DEFAULT_RARITY_EFFECTS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as RarityEffects;
    return DEFAULT_RARITY_EFFECTS;
  } catch {
    return DEFAULT_RARITY_EFFECTS;
  }
}

export function saveEffects(effects: RarityEffects): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EFFECTS_KEY, JSON.stringify(effects));
}

const RARITY_WEIGHTS_KEY = "gacha-gift-rarity-weights";

export type RarityWeights = Record<Rarity, number>;

export function loadRarityWeights(): RarityWeights {
  if (typeof window === "undefined") return DEFAULT_RARITY_WEIGHTS;
  try {
    const raw = window.localStorage.getItem(RARITY_WEIGHTS_KEY);
    if (!raw) return DEFAULT_RARITY_WEIGHTS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...DEFAULT_RARITY_WEIGHTS, ...parsed } as RarityWeights;
    }
    return DEFAULT_RARITY_WEIGHTS;
  } catch {
    return DEFAULT_RARITY_WEIGHTS;
  }
}

export function saveRarityWeights(weights: RarityWeights): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RARITY_WEIGHTS_KEY, JSON.stringify(weights));
}

const VISITS_KEY = "gacha-gift-visits";
const VISITED_TODAY_PREFIX = "gacha-gift-visited-";

export type VisitStats = Record<string, number>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadVisitStats(): VisitStats {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VISITS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as VisitStats) : {};
  } catch {
    return {};
  }
}

export function recordVisit(): void {
  if (typeof window === "undefined") return;
  const date = todayKey();
  const sessionFlag = `${VISITED_TODAY_PREFIX}${date}`;
  if (window.sessionStorage.getItem(sessionFlag)) return;
  window.sessionStorage.setItem(sessionFlag, "1");
  const stats = loadVisitStats();
  stats[date] = (stats[date] ?? 0) + 1;
  window.localStorage.setItem(VISITS_KEY, JSON.stringify(stats));
}

export type BackupData = {
  effects: RarityEffects;
  purchaseCounts: PurchaseCount[];
  visitStats: VisitStats;
  rarityWeights?: RarityWeights;
};

export function exportAllData(): BackupData {
  return {
    effects: loadEffects(),
    purchaseCounts: loadPurchaseCounts(),
    visitStats: loadVisitStats(),
    rarityWeights: loadRarityWeights(),
  };
}

export function importAllData(data: BackupData): void {
  if (data.effects && typeof data.effects === "object") saveEffects(data.effects);
  if (Array.isArray(data.purchaseCounts)) {
    window.localStorage.setItem(PURCHASE_COUNTS_KEY, JSON.stringify(data.purchaseCounts));
  }
  if (data.visitStats && typeof data.visitStats === "object") {
    window.localStorage.setItem(VISITS_KEY, JSON.stringify(data.visitStats));
  }
  if (data.rarityWeights && typeof data.rarityWeights === "object") {
    saveRarityWeights(data.rarityWeights);
  }
}
