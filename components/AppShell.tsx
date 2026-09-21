"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import type { SiteSettings } from "@/lib/site-settings";
import type { Category } from "@/lib/types";

export default function AppShell({
  children,
  settings,
  categories,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
  categories: Category[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-yt-bg text-yt-text">
      <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} header={settings.header} />
      <div className="flex flex-1 pt-14">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          categories={categories}
          logoText={settings.header.logoText}
        />
        <main className="min-w-0 flex-1 px-4 py-4 md:px-6">{children}</main>
      </div>
      <Footer footer={settings.footer} logoText={settings.header.logoText} />
    </div>
  );
}
