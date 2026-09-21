import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSiteSettings } from "@/lib/site-settings";
import SettingsEditor from "@/components/SettingsEditor";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link href="/admin" className="text-sm text-yt-muted hover:text-white">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Site settings</h1>
      <p className="mt-1 text-sm text-yt-muted">
        Everything visitors see in the header, footer and homepage copy is edited here.
      </p>
      <div className="mt-6">
        <SettingsEditor initial={settings} />
      </div>
    </div>
  );
}
