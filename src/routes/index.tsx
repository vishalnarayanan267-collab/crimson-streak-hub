import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Beef, Check, Droplets, Flame, Minus, Plus, Shield, Snowflake, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CURRENT_USER_ID,
  EXERCISES,
  commitDailyLog,
  toggleExercise,
  updateLog,
  useGymStore,
} from "@/lib/gym-data";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const store = useGymStore();
  const me = store.users.find((u) => u.id === CURRENT_USER_ID)!;
  const { log } = store;

  const completed = useMemo(
    () => EXERCISES.filter((e) => log.exercises[e.id]).length,
    [log.exercises],
  );
  const completion = Math.round(
    ((log.protein > 0 ? 1 : 0) +
      (log.calories > 0 ? 1 : 0) +
      (log.water > 0 ? 1 : 0) +
      completed / EXERCISES.length) *
      25,
  );

  const commit = () => {
    commitDailyLog(CURRENT_USER_ID);
    toast("Day logged. Streak +1 · Points +40", {
      description: "Consistency compounds. See you tomorrow.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 lg:px-10 lg:pt-10">
      <Toaster position="top-center" theme="dark" />

      {/* Greeting */}
      <div className="animate-rise">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Thursday · Log Day
        </div>
        <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
          Show up. Log it. <span className="text-primary">Own the day.</span>
        </h1>
      </div>

      {/* Streak hero */}
      <section className="mt-5 animate-rise overflow-hidden rounded-2xl border border-hairline bg-surface p-5 shadow-[var(--shadow-elev)]">
        <div className="relative flex items-center justify-between gap-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
            style={{ background: "radial-gradient(closest-side, oklch(0.62 0.26 25 / 0.35), transparent)" }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              Consistency Streak
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-6xl font-extrabold tracking-tighter tabular-nums text-foreground">
                {me.streak}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">days</span>
              <span className="ml-1 text-3xl leading-none animate-pop-in" aria-hidden>
                🔥
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={me.hasFreeze ? "shield" : "muted"}>
                <Shield className="h-3 w-3" />
                {me.hasFreeze ? "Streak Shield Active" : "No shield"}
              </Badge>
              <Badge tone="accent">
                <Zap className="h-3 w-3" /> {me.points.toLocaleString()} pts
              </Badge>
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <RingProgress value={completion} />
          </div>
        </div>
        <div className="mt-4 sm:hidden">
          <ProgressBar value={completion} />
        </div>
      </section>

      {/* Metrics grid */}
      <div className="mt-4 grid gap-4">
        <MetricCard
          icon={<Beef className="h-4 w-4" />}
          label="Protein"
          value={`${log.protein}`}
          unit="g"
          accent
        >
          <Slider
            value={[log.protein]}
            min={0}
            max={300}
            step={5}
            onValueChange={([v]) => updateLog({ protein: v })}
            className="mt-4"
          />
          <TicksRow marks={["0", "75", "150", "225", "300"]} />
        </MetricCard>

        <MetricCard
          icon={<Flame className="h-4 w-4" />}
          label="Calories"
          value={log.calories.toLocaleString()}
          unit="kcal"
        >
          <div className="mt-4 flex items-center gap-3">
            <StepButton onClick={() => updateLog({ calories: Math.max(0, log.calories - 100) })}>
              <Minus className="h-4 w-4" />
            </StepButton>
            <div className="flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${Math.min(100, (log.calories / 3500) * 100)}%` }}
              />
            </div>
            <StepButton onClick={() => updateLog({ calories: log.calories + 100 })}>
              <Plus className="h-4 w-4" />
            </StepButton>
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>Target 2,600</span>
            <span>Ceiling 3,500</span>
          </div>
        </MetricCard>

        <MetricCard
          icon={<Droplets className="h-4 w-4" />}
          label="Water"
          value={log.water.toFixed(2)}
          unit="L"
        >
          <WaterTracker value={log.water} onChange={(v) => updateLog({ water: v })} />
        </MetricCard>

        <MetricCard
          icon={<Check className="h-4 w-4" />}
          label="Session"
          value={`${completed}/${EXERCISES.length}`}
          unit="done"
        >
          <ul className="mt-3 divide-y divide-hairline">
            {EXERCISES.map((ex) => {
              const done = !!log.exercises[ex.id];
              return (
                <li key={ex.id}>
                  <label className="group flex cursor-pointer items-center gap-3 py-3">
                    <Checkbox
                      checked={done}
                      onCheckedChange={() => toggleExercise(ex.id)}
                      className="h-5 w-5 rounded-md border-hairline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <span
                      className={`text-sm font-medium transition-all ${
                        done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {ex.label}
                    </span>
                    {done && (
                      <span className="ml-auto inline-flex animate-pop-in items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                        Done
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </MetricCard>
      </div>

      {/* Commit CTA */}
      <div className="mt-5 mb-6">
        <button
          onClick={commit}
          className="group relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-base font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[var(--shadow-red)] transition-transform active:scale-[0.98]"
        >
          <span className="relative z-10">Commit Today's Log</span>
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform duration-700 group-hover:translate-x-full"
          />
        </button>
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Miss a day? Your Shield softens the fall.
        </p>
      </div>
    </div>
  );
}

/* ---------- primitives ---------- */

function MetricCard({
  icon,
  label,
  value,
  unit,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`animate-rise rounded-2xl border bg-surface p-5 shadow-[var(--shadow-elev)] transition-colors ${
        accent ? "border-primary/30" : "border-hairline"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <span className={`grid h-6 w-6 place-items-center rounded-md ${accent ? "bg-primary/15 text-primary" : "bg-surface-2 text-foreground"}`}>
            {icon}
          </span>
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tabular-nums text-foreground">{value}</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {unit}
          </span>
        </div>
      </div>
      {children}
    </section>
  );
}

function StepButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-hairline bg-surface-2 text-foreground transition-all active:scale-90 hover:border-primary/60 hover:text-primary"
    >
      {children}
    </button>
  );
}

function TicksRow({ marks }: { marks: string[] }) {
  return (
    <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {marks.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-foreground">{value}%</span>
    </div>
  );
}

function RingProgress({ value }: { value: number }) {
  const size = 88;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-lg font-extrabold tabular-nums leading-none">{value}%</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Today</div>
        </div>
      </div>
    </div>
  );
}

function WaterTracker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const total = 8; // 8 x 0.25L cups = 2L display, but we allow more
  const filled = Math.min(total, Math.round(value / 0.25));
  const [pulseIdx, setPulseIdx] = useState<number | null>(null);
  return (
    <div className="mt-4">
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < filled;
          return (
            <button
              key={i}
              onClick={() => {
                const target = (i + 1) * 0.25;
                onChange(value === target ? i * 0.25 : target);
                setPulseIdx(i);
                setTimeout(() => setPulseIdx(null), 500);
              }}
              className={`relative h-10 overflow-hidden rounded-md border transition-all ${
                isFilled
                  ? "border-primary/60 bg-primary/20"
                  : "border-hairline bg-surface-2 hover:border-primary/40"
              }`}
              aria-label={`Cup ${i + 1}`}
            >
              <span
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 ${
                  isFilled ? "h-full" : "h-0"
                }`}
              />
              {pulseIdx === i && isFilled && (
                <span className="absolute inset-0 rounded-md animate-ripple-red" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>0.25L per cup</span>
        <button
          onClick={() => onChange(0)}
          className="font-semibold text-muted-foreground hover:text-primary"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "shield" | "muted" | "accent";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    shield:
      "bg-[oklch(0.5_0.15_220_/_0.15)] text-[oklch(0.85_0.12_220)] ring-1 ring-inset ring-[oklch(0.6_0.15_220_/_0.35)]",
    muted: "bg-surface-2 text-muted-foreground ring-1 ring-inset ring-hairline",
    accent: "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

// prevent unused import warning
void Snowflake;
