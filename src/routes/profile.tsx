import { createFileRoute } from "@tanstack/react-router";
import { Award, Beef, Calendar, Droplets, Flame, Ruler, Scale, Shield, Snowflake, Target, Trophy, User, Zap } from "lucide-react";
import { GOAL_META, initialsFor, useMyProfile, useMyStats } from "@/lib/gym-data";
import { GoalBadge } from "@/components/goal-badge";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · IRONLINE" },
      { name: "description", content: "Your trainee profile: join date, earned badges, and personal fitness metrics." },
      { property: "og:title", content: "Profile · IRONLINE" },
      { property: "og:description", content: "Your streak, your badges, your metrics — all in one place." },
    ],
  }),
  component: Profile,
});

const BADGES = [
  { id: "b1", label: "7-Day Streak Warrior", icon: Flame, earned: true, desc: "Logged 7 days straight" },
  { id: "b2", label: "Shield Bearer", icon: Shield, earned: true, desc: "Held an active Freeze" },
  { id: "b3", label: "Iron Consistency", icon: Zap, earned: true, desc: "20+ day streak" },
  { id: "b4", label: "Hydration Hero", icon: Snowflake, earned: true, desc: "Hit 3L water · 5 days" },
  { id: "b5", label: "Century Club", icon: Trophy, earned: false, desc: "Reach a 100-day streak" },
  { id: "b6", label: "Podium Finish", icon: Award, earned: false, desc: "Top 3 on the leaderboard" },
];

function Profile() {
  const { data: profile } = useMyProfile();
  const { data: stats } = useMyStats();
  const displayName = profile?.full_name?.trim() || "Trainee";
  const initials = initialsFor(displayName);
  const joined = profile
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const streak = stats?.current_streak ?? 0;
  const points = stats?.total_points ?? 0;
  const hasFreeze = !!stats?.has_freeze;

  // Dynamic badges from live stats
  const dynamicBadges = BADGES.map((b) => {
    if (b.id === "b1") return { ...b, earned: streak >= 7 };
    if (b.id === "b2") return { ...b, earned: hasFreeze };
    if (b.id === "b3") return { ...b, earned: streak >= 20 };
    if (b.id === "b5") return { ...b, earned: streak >= 100 };
    return b;
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10 lg:px-10 lg:pt-10">
      <div className="animate-rise">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Trainee
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
      </div>

      {/* Identity card */}
      <section className="animate-rise relative mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.24 25 / 0.5), transparent 70%)" }}
        />
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-lg font-bold ring-1 ring-inset ring-primary/40 shadow-[var(--shadow-red)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-tight">{displayName}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile?.role === "admin" ? "Coach" : "Trainee"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Joined {joined}
            </div>
            {profile?.primary_goal && (
              <div className="mt-2">
                <GoalBadge goal={profile.primary_goal} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={Flame} label="Streak" value={`${streak}d`} accent />
          <Stat icon={Trophy} label="Points" value={points.toLocaleString()} />
          <Stat icon={Shield} label="Shield" value={hasFreeze ? "Active" : "None"} />
        </div>
      </section>

      {/* Badges */}
      <section className="animate-rise mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Badges</h2>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {dynamicBadges.filter((b) => b.earned).length} / {dynamicBadges.length}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dynamicBadges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all ${
                  b.earned
                    ? "border-primary/40 bg-surface hover:-translate-y-0.5 hover:shadow-[var(--shadow-red)]"
                    : "border-hairline bg-surface/40 opacity-55"
                }`}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-lg ${
                    b.earned ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-semibold leading-tight">{b.label}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{b.desc}</div>
                {!b.earned && (
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Locked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal metrics — from onboarding */}
      <section className="animate-rise mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Personal metrics</h2>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            From onboarding
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricRow icon={User} label="Age" value={profile?.age ?? null} unit="yrs" />
          <MetricRow icon={Ruler} label="Height" value={profile?.height_cm ?? null} unit="cm" />
          <MetricRow icon={Scale} label="Current weight" value={profile?.current_weight_kg} unit="kg" />
          <MetricRow icon={Flame} label="Calorie target" value={profile?.calorie_target_kcal} unit="kcal" />
          <MetricRow icon={Beef} label="Protein target" value={profile?.protein_target_g} unit="g" />
          <MetricRow icon={Droplets} label="Water target" value={profile?.water_target_l} unit="L" />
          <MetricRow
            icon={Target}
            label="Primary goal"
            text={profile?.primary_goal ? GOAL_META[profile.primary_goal].label : "—"}
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : ""}`} />
        {label}
      </div>
      <div className={`mt-1 text-xl font-bold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  unit,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number | null;
  unit?: string;
  text?: string;
}) {
  const display =
    text != null
      ? text
      : value != null
        ? `${value}${unit ? ` ${unit}` : ""}`
        : "—";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface/60 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <div className="text-lg font-extrabold tracking-tight capitalize">{display}</div>
      </div>
    </div>
  );
}