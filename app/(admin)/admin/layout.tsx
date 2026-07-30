import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth, signOut } from "@/lib/auth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthSessionProvider } from "@/components/admin/AuthSessionProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SITE_NAME } from "@/lib/seo/site";
import "../../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: `%s | Admin · ${SITE_NAME}`,
    default: `Admin · ${SITE_NAME}`,
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ "--font-sans": "var(--font-geist-sans)" } as React.CSSProperties}
    >
      <body className="min-h-full bg-muted/30 font-sans text-foreground">
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AdminShell>{children}</AdminShell>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    return <>{children}</>;
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <AdminSidebar email={session.user.email} signOutAction={signOutAction} />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-full p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
