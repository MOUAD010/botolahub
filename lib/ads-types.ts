export type AdNetworkProvider = "none" | "adsense" | "custom";

export type AdPlacement =
  | "header-leaderboard"
  | "sidebar-rectangle"
  | "in-feed"
  | "footer-banner";

export type AdSlotNetworkConfig = {
  placement: AdPlacement;
  /** AdSense ad unit / slot id from the network dashboard */
  unitId: string;
  enabled: boolean;
};

export type AdNetworkSettings = {
  provider: AdNetworkProvider;
  enabled: boolean;
  /** e.g. ca-pub-XXXXXXXX for AdSense */
  publisherId: string | null;
  /** Custom script URL when provider=custom */
  scriptUrl: string | null;
  /** Per-placement network unit IDs */
  slots: AdSlotNetworkConfig[];
  updatedAt: string;
};

export type AdCreative = {
  id: string;
  name: string;
  placement: AdPlacement;
  enabled: boolean;
  imageUrl: string | null;
  clickUrl: string | null;
  htmlSnippet: string | null;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdCreativeInput = {
  name: string;
  placement: AdPlacement;
  enabled?: boolean;
  imageUrl?: string | null;
  clickUrl?: string | null;
  htmlSnippet?: string | null;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

export const AD_PLACEMENTS: {
  id: AdPlacement;
  label: string;
  size: string;
  hint: string;
}[] = [
  {
    id: "header-leaderboard",
    label: "Header leaderboard",
    size: "728×90",
    hint: "Top of wide desktop layouts",
  },
  {
    id: "sidebar-rectangle",
    label: "Sidebar rectangle",
    size: "300×250",
    hint: "Right column on competition pages",
  },
  {
    id: "in-feed",
    label: "In-feed",
    size: "320×100",
    hint: "Between content blocks",
  },
  {
    id: "footer-banner",
    label: "Footer banner",
    size: "320×50 / 728×90",
    hint: "Above the site footer",
  },
];

export function placementLabel(id: AdPlacement): string {
  return AD_PLACEMENTS.find((p) => p.id === id)?.label ?? id;
}
