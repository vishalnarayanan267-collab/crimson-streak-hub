import type { ReactNode } from "react";
import { useSession, useMyProfile } from "@/lib/gym-data";
import { AuthScreen } from "./auth-screen";
import { OnboardingModal } from "./onboarding-modal";
import { Flame } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { userId, loading } = useSession();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  if (loading) return <Splash />;
  if (!userId) return <AuthScreen />;
  if (profileLoading) return <Splash />;

  return (
    <>
      {children}
      {profile && !profile.onboarded && (
        <OnboardingModal initialName={profile.full_name} />
      )}
    </>
  );
}

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-red)]">
          <Flame className="h-6 w-6" />
        </div>
        <div className="text-xs tracking-[0.28em] text-muted-foreground">IRONLINE</div>
      </div>
    </div>
  );
}