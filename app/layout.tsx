import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { getSiteSettings, getCategories } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.header.logoText,
    description: `${settings.header.logoText} - watch, upload and share videos`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);

  return (
    <html lang="en">
      <body>
        <AppShell settings={settings} categories={categories}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
