import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
