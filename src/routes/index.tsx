import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, Beef, Check, ChevronDown, Droplets, Edit3, Flame, LineChart, Minus, Pencil, Plus, Shield, Snowflake, Trash2, X, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useAddExerciseLog,
  useAddWorkout,
  useCommitDailyLog,
  useDeleteWorkout,
  useExerciseLogs,
  useMyProfile,
  useMyStats,
  useRenameWorkout,
  useToggleWorkout,
  useTodayWorkouts,
  type ExerciseLog,
  type Workout,
} from "@/lib/gym-data";
import { toast } from "sonner";
import { GoalBadge } from "@/components/goal-badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useMyProfile();
  const { data: stats } = useMyStats();
  const { data: workouts = [] } = useTodayWorkouts();
  const toggleWorkout = useToggleWorkout();
  const commitLog = useCommitDailyLog();
  const addWorkout = useAddWorkout();
  const deleteWorkout = useDeleteWorkout();
  const renameWorkout = useRenameWorkout();
  const [editMode, setEditMode] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const proteinTarget = profile?.protein_target_g ?? 150;
  const calorieTarget = profile?.calorie_target_kcal ?? 2600;
  const waterTarget = profile?.water_target_l ?? 3;

  // Daily intake stays as local session state — spec's schema doesn't include a daily-log table.
  const [protein, setProtein] = useState(0);
  const [calories, setCalories] = useState(0);
  const [water, setWater] = useState(0);

  const safeWorkouts: Workout[] = workouts ?? [];
  const completed = useMemo(
    () => safeWorkouts.filter((w) => w.is_completed).length,
    [safeWorkouts],
  );
  const total = Math.max(1, safeWorkouts.length);
  const completion = Math.round(
    ((protein > 0 ? 1 : 0) +
      (calories > 0 ? 1 : 0) +
      (water > 0 ? 1 : 0) +
      completed / total) *
      25,
  );

  const commit = async () => {
    try {
      await commitLog.mutateAsync();
      toast("Day logged. Streak +1 · Points +40", {
        description: "Consistency compounds. See you tomorrow.",
      });
    } catch (e: any) {
      toast("Couldn't save log", { description: e.message ?? "Try again." });
    }
  };

  const streak = stats?.current_streak ?? 0;
  const points = stats?.total_points ?? 0;
  const hasFreeze = !!stats?.has_freeze;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 lg:px-10 lg:pt-10">
      {/* Greeting */}
      <div className="animate-rise">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long" })} · Log Day
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
                {streak}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">days</span>
              <span className="ml-1 text-3xl leading-none animate-pop-in" aria-hidden>
                🔥
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={hasFreeze ? "shield" : "muted"}>
                <Shield className="h-3 w-3" />
                {hasFreeze ? "Streak Shield Active" : "No shield"}
              </Badge>
              <Badge tone="accent">
                <Zap className="h-3 w-3" /> {points.toLocaleString()} pts
              </Badge>
              {profile?.primary_goal && <GoalBadge goal={profile.primary_goal} />}
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
          value={`${protein}`}
          unit={`g / ${proteinTarget}g`}
          accent
        >
          <Slider
            value={[protein]}
            min={0}
            max={Math.max(300, proteinTarget + 50)}
            step={5}
            onValueChange={([v]) => setProtein(v!)}
            className="mt-4"
          />
          <TicksRow marks={["0", `${Math.round(proteinTarget / 2)}`, `${proteinTarget}`, `${proteinTarget + 50}`]} />
        </MetricCard>

        <MetricCard
          icon={<Flame className="h-4 w-4" />}
          label="Calories"
          value={calories.toLocaleString()}
          unit={`kcal / ${calorieTarget.toLocaleString()}`}
        >
          <div className="mt-4 flex items-center gap-3">
            <StepButton onClick={() => setCalories(Math.max(0, calories - 100))}>
              <Minus className="h-4 w-4" />
            </StepButton>
            <div className="flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${Math.min(100, (calories / (calorieTarget * 1.35)) * 100)}%` }}
              />
            </div>
            <StepButton onClick={() => setCalories(calories + 100)}>
              <Plus className="h-4 w-4" />
            </StepButton>
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>Target {calorieTarget.toLocaleString()}</span>
            <span>Ceiling {Math.round(calorieTarget * 1.35).toLocaleString()}</span>
          </div>
        </MetricCard>

        <MetricCard
          icon={<Droplets className="h-4 w-4" />}
          label="Water"
          value={water.toFixed(2)}
          unit={`L / ${waterTarget}L`}
        >
          <WaterTracker value={water} onChange={setWater} target={waterTarget} />
        </MetricCard>

        <MetricCard
          icon={<Check className="h-4 w-4" />}
          label="Session"
          value={`${completed}/${safeWorkouts.length}`}
          unit="done"
        >
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-end">
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  editMode
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-hairline text-muted-foreground hover:text-foreground"
                }`}
              >
                {editMode ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                {editMode ? "Done" : "Edit"}
              </button>
            </div>

            {safeWorkouts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No exercises assigned today.</div>
            ) : (
              <ul className="divide-y divide-hairline">
                {safeWorkouts.map((ex) => (
                  <WorkoutItem
                    key={ex.id}
                    ex={ex}
                    editMode={editMode}
                    expanded={expandedId === ex.id}
                    onToggleExpand={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                    onToggleDone={() =>
                      toggleWorkout.mutate({ id: ex.id, is_completed: !ex.is_completed })
                    }
                    onDelete={() => deleteWorkout.mutate(ex.id)}
                    onRename={(name) => renameWorkout.mutate({ id: ex.id, exercise_name: name })}
                  />
                ))}
              </ul>
            )}

            {editMode && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = newExercise.trim();
                  if (!name) return;
                  addWorkout.mutate(name, {
                    onSuccess: () => setNewExercise(""),
                  });
                }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  placeholder="Add exercise (e.g. Squat 4x6)"
                  className="flex-1 rounded-xl border border-hairline bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
                <button
                  type="submit"
                  disabled={!newExercise.trim() || addWorkout.isPending}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </form>
            )}
          </div>
        </MetricCard>
      </div>

      {/* Weekly progression */}
      <WeeklyProgress />

      {/* Commit CTA */}
      <div className="mt-5 mb-6">
        <button
          onClick={commit}
          disabled={commitLog.isPending}
          className="group relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-base font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[var(--shadow-red)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <span className="relative z-10">{commitLog.isPending ? "Saving…" : "Commit Today's Log"}</span>
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

/* ---------- workout item with inline edit + set logger ---------- */

function WorkoutItem({
  ex,
  editMode,
  expanded,
  onToggleExpand,
  onToggleDone,
  onDelete,
  onRename,
}: {
  ex: Workout;
  editMode: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const done = ex.is_completed;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(ex.exercise_name);
  const commitRename = () => {
    const v = name.trim();
    if (v && v !== ex.exercise_name) onRename(v);
    setRenaming(false);
  };

  return (
    <li>
      <div className="group flex items-center gap-3 py-3">
        {!editMode && (
          <Checkbox
            checked={done}
            onCheckedChange={onToggleDone}
            className="h-5 w-5 rounded-md border-hairline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        )}

        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setName(ex.exercise_name);
                setRenaming(false);
              }
            }}
            className="flex-1 rounded-md border border-primary/40 bg-surface-2 px-2 py-1 text-sm font-medium outline-none"
          />
        ) : (
          <button
            onClick={editMode ? () => setRenaming(true) : onToggleExpand}
            className={`flex-1 truncate text-left text-sm font-medium transition-all ${
              done && !editMode ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {ex.exercise_name}
          </button>
        )}

        {editMode ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRenaming(true)}
              aria-label="Rename"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary/15 hover:text-primary"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {done && (
              <span className="inline-flex animate-pop-in items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Done
              </span>
            )}
            <button
              onClick={onToggleExpand}
              aria-label="Log sets"
              className={`grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-transform hover:text-foreground ${
                expanded ? "rotate-180 text-primary" : ""
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {expanded && !editMode && (
        <SetLogger workoutId={ex.id} exerciseName={ex.exercise_name} />
      )}
    </li>
  );
}

function SetLogger({ workoutId, exerciseName }: { workoutId: string; exerciseName: string }) {
  const addLog = useAddExerciseLog();
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);

  const submit = () => {
    addLog.mutate(
      { workout_id: workoutId, exercise_name: exerciseName, sets, reps, weight_kg: weight },
      {
        onSuccess: () =>
          toast("Logged.", { description: `${sets}×${reps} @ ${weight}kg saved to history.` }),
        onError: (e: any) => toast("Couldn't log", { description: e?.message ?? "Try again" }),
      },
    );
  };

  return (
    <div className="mb-3 rounded-xl border border-hairline bg-surface-2/60 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <BarChart3 className="h-3 w-3 text-primary" />
        Log performance
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberBox label="Sets" value={sets} onChange={setSets} step={1} min={0} />
        <NumberBox label="Reps" value={reps} onChange={setReps} step={1} min={0} />
        <NumberBox label="kg" value={weight} onChange={setWeight} step={2.5} min={0} />
      </div>
      <button
        onClick={submit}
        disabled={addLog.isPending}
        className="mt-3 w-full rounded-lg bg-primary py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
      >
        {addLog.isPending ? "Saving…" : "Save Set"}
      </button>
    </div>
  );
}

function NumberBox({
  label,
  value,
  onChange,
  step,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-2 text-center">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}
          className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-muted-foreground hover:text-primary"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="tabular-nums text-sm font-bold">{value}</span>
        <button
          onClick={() => onChange(Math.round((value + step) * 100) / 100)}
          className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-muted-foreground hover:text-primary"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function WeeklyProgress() {
  const { data: profile } = useMyProfile();
  const { data: logs = [] } = useExerciseLogs(profile?.id ?? null, 14);
  const safe: ExerciseLog[] = logs ?? [];

  // Group by exercise, keep last 7 days by day, show max weight per day
  const byExercise = useMemo(() => {
    const m = new Map<string, ExerciseLog[]>();
    for (const l of safe) {
      const arr = m.get(l.exercise_name) ?? [];
      arr.push(l);
      m.set(l.exercise_name, arr);
    }
    return Array.from(m.entries()).slice(0, 4);
  }, [safe]);

  return (
    <section className="mt-5 animate-rise rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <LineChart className="h-3.5 w-3.5 text-primary" />
          Weekly Progression
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {safe.length} logs · 14d
        </span>
      </div>

      {byExercise.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Expand any exercise above and log a set to start tracking your strength curve.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {byExercise.map(([name, entries]) => {
            const maxWeight = Math.max(1, ...entries.map((e) => e.weight_kg));
            const days = entries.slice(0, 7).reverse();
            return (
              <div key={name}>
                <div className="flex items-baseline justify-between">
                  <div className="truncate text-sm font-semibold">{name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    peak <span className="font-bold text-primary">{maxWeight}kg</span>
                  </div>
                </div>
                <div className="mt-2 flex items-end gap-1.5 h-16">
                  {days.map((e) => {
                    const h = Math.max(6, (e.weight_kg / maxWeight) * 100);
                    return (
                      <div
                        key={e.id}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/70 to-primary transition-all"
                        style={{ height: `${h}%` }}
                        title={`${e.logged_date}: ${e.sets}×${e.reps} @ ${e.weight_kg}kg`}
                      />
                    );
                  })}
                  {Array.from({ length: Math.max(0, 7 - days.length) }).map((_, i) => (
                    <div key={`e${i}`} className="flex-1 rounded-t-sm bg-surface-2" style={{ height: "6%" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
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

function WaterTracker({
  value,
  onChange,
  target,
}: {
  value: number;
  onChange: (v: number) => void;
  target: number;
}) {
  const cups = Math.max(8, Math.round(target / 0.25));
  const total = Math.min(12, cups);
  const step = target / total;
  const filled = Math.min(total, Math.round(value / step));
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
                const t = (i + 1) * step;
                onChange(value === t ? i * step : Math.round(t * 100) / 100);
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
        <span>{step.toFixed(2)}L per cup</span>
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
