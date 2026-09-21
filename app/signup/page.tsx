import { isSupabaseConfigured } from "@/lib/supabase";
import { SignUpForm } from "@/components/AuthForms";
import SetupBanner from "@/components/SetupBanner";

export default function SignUpPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <SetupBanner />
      </div>
    );
  }
  return <SignUpForm />;
}
