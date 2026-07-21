export type Rarity = "N" | "R" | "RR" | "SR" | "SSR" | "UR";

export type Prize = {
  id: string;
  name: string;
  rarity: Rarity;
  price?: number;
  description?: string;
  affiliateUrl?: string;
  affiliateHtml?: string;
  type?: string;
  recipients?: string[];
  gender?: string;
};
