import { isSupabaseConfigured } from "@/lib/supabase";
import { SignInForm } from "@/components/AuthForms";
import SetupBanner from "@/components/SetupBanner";

export default function SignInPage({ searchParams }: { searchParams: { next?: string } }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <SetupBanner />
      </div>
    );
  }
  return <SignInForm next={searchParams.next} />;
}
