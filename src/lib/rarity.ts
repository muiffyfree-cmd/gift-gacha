import type { Rarity } from "@/types/gacha";

export const RARITY_OPTIONS: Rarity[] = ["N", "R", "RR", "SR", "SSR", "UR"];

export const RARITY_LABELS: Record<Rarity, string> = {
  N: "N",
  R: "R",
  RR: "RR",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  N: 40,
  R: 30,
  RR: 20,
  SR: 9.4,
  SSR: 0.5,
  UR: 0.01,
};

export const DEFAULT_RARITY_EFFECTS: Partial<Record<Rarity, string[]>> = {
  N: ["/effect-n.mp4"],
  R: ["/effect-r.mp4"],
  RR: ["/effect-rr.mp4"],
  SR: ["/effect-sr.mp4"],
  SSR: ["/effect-ssr.mp4"],
  UR: ["/effect-ur.mp4"],
};

export const RARITY_BADGE_CLASSES: Record<Rarity, string> = {
  N: "bg-white text-gray-700 border border-gray-300",
  R: "bg-purple-200 text-purple-800",
  RR: "bg-red-200 text-red-800",
  SR: "bg-gradient-to-r from-slate-300 via-gray-100 to-slate-300 text-gray-700 border border-gray-300",
  SSR: "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 text-amber-900",
  UR: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400 text-white",
};

export const RARITY_CARD_CLASSES: Record<Rarity, string> = {
  N: "border-gray-500 bg-gray-300",
  R: "border-purple-600 bg-gradient-to-br from-purple-400 via-purple-300 to-purple-400",
  RR: "border-red-600 bg-gradient-to-br from-red-400 via-red-300 to-red-400",
  SR: "border-slate-600 bg-gradient-to-br from-slate-400 via-slate-300 to-slate-400",
  SSR: "border-amber-600 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-400",
  UR: "border-fuchsia-600 bg-gradient-to-br from-pink-400 via-fuchsia-400 to-cyan-400",
};

export const RARITY_TEXT_CLASSES: Record<Rarity, string> = {
  N: "text-gray-900",
  R: "text-purple-900",
  RR: "text-red-900",
  SR: "text-slate-900",
  SSR: "text-amber-900",
  UR: "text-fuchsia-900",
};

export const RARITY_SECTION_CLASSES: Record<Rarity, string> = {
  N: "border-gray-500 bg-gray-100",
  R: "border-purple-500 bg-purple-200",
  RR: "border-red-500 bg-red-200",
  SR: "border-slate-500 bg-slate-200",
  SSR: "border-amber-500 bg-amber-200",
  UR: "border-fuchsia-500 bg-fuchsia-200",
};
