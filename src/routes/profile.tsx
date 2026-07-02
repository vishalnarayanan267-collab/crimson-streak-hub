import { createFileRoute } from "@tanstack/react-router";
import { Award, Calendar, Dumbbell, Flame, Shield, Snowflake, Target, Trophy, Zap } from "lucide-react";
import { CURRENT_USER_ID, useGymStore } from "@/lib/gym-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · IRONLINE" },
      { name: "description", content: "Your athlete profile: join date, earned badges, and personal fitness metrics." },
      { property: "og:title", content: "Profile · IRONLINE" },
      { property: "og:description", content: "Your streak, your badges, your metrics — all in one place." },
    ],
  }),
  component: Profile,
});

const JOIN_DATE = new Date("2025-11-08");

const BADGES = [
  { id: "b1", label: "7-Day Streak Warrior", icon: Flame, earned: true, desc: "Logged 7 days straight" },
  { id: "b2", label: "Shield Bearer", icon: Shield, earned: true, desc: "Held an active Freeze" },
  { id: "b3", label: "Iron Consistency", icon: Zap, earned: true, desc: "20+ day streak" },
  { id: "b4", label: "Hydration Hero", icon: Snowflake, earned: true, desc: "Hit 3L water · 5 days" },
  { id: "b5", label: "Century Club", icon: Trophy, earned: false, desc: "Reach a 100-day streak" },
  { id: "b6", label: "Podium Finish", icon: Award, earned: false, desc: "Top 3 on the leaderboard" },
];

function Profile() {
  const store = useGymStore();
  const me = store.users.find((u) => u.id === CURRENT_USER_ID)!;
  const joined = JOIN_DATE.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10 lg:px-10 lg:pt-10">
      <div className="animate-rise">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Athlete
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
            {me.initials}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-tight">{me.name}</div>
            <div className="text-xs text-muted-foreground">{me.handle}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Joined {joined}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={Flame} label="Streak" value={`${me.streak}d`} accent />
          <Stat icon={Trophy} label="Points" value={me.points.toLocaleString()} />
          <Stat icon={Shield} label="Shield" value={me.hasFreeze ? "Active" : "None"} />
        </div>
      </section>

      {/* Badges */}
      <section className="animate-rise mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Badges</h2>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {BADGES.filter((b) => b.earned).length} / {BADGES.length}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
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

      {/* Metrics placeholder */}
      <section className="animate-rise mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Personal metrics</h2>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Coming soon</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricPlaceholder icon={Dumbbell} label="Bench · 1RM" />
          <MetricPlaceholder icon={Dumbbell} label="Squat · 1RM" />
          <MetricPlaceholder icon={Target} label="Body fat %" />
          <MetricPlaceholder icon={Zap} label="VO₂ max" />
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

function MetricPlaceholder({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface/40 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">Tap to log — coming soon</div>
      </div>
      <div className="text-lg font-bold tracking-tight text-muted-foreground">—</div>
    </div>
  );
}