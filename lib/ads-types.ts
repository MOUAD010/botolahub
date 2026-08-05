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

export const AD_PLACEMENTS: {
  id: AdPlacement;
  label: string;
  size: string;
}[] = [
  { id: "header-leaderboard", label: "Header leaderboard", size: "728×90" },
  { id: "sidebar-rectangle", label: "Sidebar rectangle", size: "300×250" },
  { id: "in-feed", label: "In-feed", size: "320×100" },
  { id: "footer-banner", label: "Footer banner", size: "320×50 / 728×90" },
];
