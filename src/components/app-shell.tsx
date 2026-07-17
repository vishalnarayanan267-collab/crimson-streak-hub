import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Home, LogOut, ShieldCheck, Trophy, User } from "lucide-react";
import type { ReactNode } from "react";
import { AuthGate } from "./auth-gate";
import { Toaster } from "@/components/ui/sonner";
import { initialsFor, signOut, useMyProfile } from "@/lib/gym-data";

const BASE_NAV = [
  { to: "/", label: "Today", icon: Home },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
];
const ADMIN_ITEM = { to: "/admin", label: "Admin", icon: ShieldCheck };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useMyProfile();
  const displayName = profile?.full_name?.trim() || "Trainee";
  const initials = initialsFor(displayName);
  const isAdmin = profile?.role === "admin";
  const NAV = isAdmin ? [...BASE_NAV, ADMIN_ITEM] : BASE_NAV;
  const mobileNav = NAV;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient red glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, oklch(0.35 0.2 25 / 0.35), transparent 70%)",
        }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl lg:pl-64">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-hairline bg-sidebar/80 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-red)]">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-[0.24em] text-foreground">IRONLINE</div>
              <div className="text-[10px] tracking-[0.2em] text-muted-foreground">GYM · COMMUNITY</div>
            </div>
          </div>
          <nav className="mt-2 flex flex-col gap-1 px-3">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span className="tracking-wide">{label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-hairline p-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-bold text-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="text-[11px] text-muted-foreground">Rank · climbing</div>
              </div>
              {profile && (
                <button
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-primary"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-hairline bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </div>
            <div className="text-sm font-bold tracking-[0.24em]">IRONLINE</div>
          </div>
          <Link
            to="/profile"
            aria-label="Open profile"
            className={`grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-bold transition-colors ${
              pathname.startsWith("/profile") ? "ring-1 ring-inset ring-primary/50 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
          </Link>
        </header>

        <main className="w-full flex-1 pt-16 pb-28 lg:pt-0 lg:pb-0">
          <AuthGate>{children}</AuthGate>
          <Toaster position="top-center" theme="dark" />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-background/90 px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
          <div className={`mx-auto grid max-w-md gap-2 ${mobileNav.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {mobileNav.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center gap-1 rounded-xl py-2 transition-colors"
                >
                  <span
                    className={`grid h-9 w-14 place-items-center rounded-full transition-all ${
                      active ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}