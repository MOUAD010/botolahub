import Script from "next/script";
import { getAdNetworkSettings } from "@/lib/repositories/ads";

/** Loads the network script once when ads are enabled site-wide. */
export async function AdNetworkScript() {
  const settings = await getAdNetworkSettings().catch(() => null);
  if (!settings?.enabled || settings.provider === "none") return null;

  if (settings.provider === "adsense" && settings.publisherId) {
    return (
      <Script
        id="adsense-loader"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(settings.publisherId)}`}
        crossOrigin="anonymous"
      />
    );
  }

  if (settings.provider === "custom" && settings.scriptUrl) {
    return (
      <Script
        id="custom-ad-loader"
        async
        strategy="afterInteractive"
        src={settings.scriptUrl}
      />
    );
  }

  return null;
}
