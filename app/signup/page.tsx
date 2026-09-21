import { isSupabaseConfigured } from "@/lib/supabase";
import { SignUpForm } from "@/components/AuthForms";
import SetupBanner from "@/components/SetupBanner";

export default function SignUpPage() {
  const demo = !isSupabaseConfigured();
  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      {demo && <SetupBanner />}
      <SignUpForm demo={demo} />
    </div>
  );
}
