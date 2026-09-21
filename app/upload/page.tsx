import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

/**
 * Public uploads are disabled: uploads happen only from the admin panel.
 * Signed-in admins land on the admin upload page; everyone else goes home.
 */
export default async function UploadPage() {
  await requireAdmin();
  redirect("/admin/videos");
}
