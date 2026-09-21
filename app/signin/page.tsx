import { isSupabaseConfigured } from "@/lib/supabase";
import { SignInForm } from "@/components/AuthForms";
import SetupBanner from "@/components/SetupBanner";

export default function SignInPage({ searchParams }: { searchParams: { next?: string } }) {
  const demo = !isSupabaseConfigured();
  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      {demo && <SetupBanner />}
      <SignInForm next={searchParams.next} demo={demo} />
    </div>
  );
}
