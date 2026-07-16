import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Beef, ChevronRight, Droplets, Flame, Plus, Scale, ShieldCheck, Users, X } from "lucide-react";
import {
  initialsFor,
  useAllClients,
  useAssignWorkout,
  useClientWorkouts,
  useMyProfile,
  type Profile,
} from "@/lib/gym-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Trainer Admin · IRONLINE" },
      { name: "description", content: "Monitor clients, assign workouts, and track completions in real time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: profile, isLoading } = useMyProfile();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile && profile.role !== "admin") {
      navigate({ to: "/", replace: true });
    }
  }, [profile, isLoading, navigate]);

  if (isLoading || !profile) {
    return <div className="p-6 text-sm text-muted-foreground">Loading workspace…</div>;
  }
  if (profile.role !== "admin") return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Trainer Console
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">Client Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor every athlete's macros, assign work, and watch completions land live.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          ADMIN
        </div>
      </header>

      <ClientGrid selectedId={selectedId} onSelect={setSelectedId} />

      {selectedId && (
        <ClientDetailDrawer clientId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function ClientGrid({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: clients, isLoading } = useAllClients();

  if (isLoading) {
    return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-hairline bg-surface" />
      ))}
    </div>;
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-10 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-semibold">No clients yet</div>
        <div className="mt-1 text-xs text-muted-foreground">
          As athletes sign up, they'll appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((c) => (
        <ClientCard
          key={c.profile.id}
          profile={c.profile}
          stats={c.stats}
          workoutsDone={c.workoutsDone}
          workoutsTotal={c.workoutsTotal}
          active={selectedId === c.profile.id}
          onClick={() => onSelect(c.profile.id)}
        />
      ))}
    </div>
  );
}

function ClientCard({
  profile,
  stats,
  workoutsDone,
  workoutsTotal,
  active,
  onClick,
}: {
  profile: Profile;
  stats: { current_streak: number; total_points: number } | null;
  workoutsDone: number;
  workoutsTotal: number;
  active: boolean;
  onClick: () => void;
}) {
  const name = profile.full_name?.trim() || "Athlete";
  const initials = initialsFor(name);
  const pct = workoutsTotal > 0 ? Math.round((workoutsDone / workoutsTotal) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-surface p-4 text-left transition-all hover:bg-surface-2 ${
        active ? "border-primary/60 ring-1 ring-primary/40" : "border-hairline"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Flame className="h-3 w-3 text-primary" />
            {stats?.current_streak ?? 0}d · {stats?.total_points ?? 0} pts
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
        <Metric icon={Scale} label="Weight" value={profile.current_weight_kg ? `${profile.current_weight_kg}kg` : "—"} />
        <Metric icon={Beef} label="Protein" value={profile.protein_target_g ? `${profile.protein_target_g}g` : "—"} />
        <Metric icon={Droplets} label="Water" value={profile.water_target_l ? `${profile.water_target_l}L` : "—"} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Today</span>
          <span className={pct === 100 ? "text-primary" : ""}>
            {workoutsDone}/{workoutsTotal || 0}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-1.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-0.5 text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ClientDetailDrawer({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const { data: clients } = useAllClients();
  const client = clients?.find((c) => c.profile.id === clientId);
  const { data: workouts } = useClientWorkouts(clientId);
  const assign = useAssignWorkout();
  const [exerciseName, setExerciseName] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = exerciseName.trim();
    if (!name) return;
    try {
      await assign.mutateAsync({ clientId, exerciseName: name });
      setExerciseName("");
      toast.success("Workout assigned", { description: name });
    } catch (err: any) {
      toast.error("Assignment failed", { description: err?.message ?? "Try again" });
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayWorkouts = (workouts ?? []).filter((w) => w.assigned_date === today);
  const earlier = (workouts ?? []).filter((w) => w.assigned_date !== today).slice(0, 8);
  const name = client?.profile.full_name?.trim() || "Athlete";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-hairline bg-background shadow-[var(--shadow-red)] animate-in slide-in-from-bottom-8 duration-300 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-hairline p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initialsFor(name)}
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">{name}</div>
              <div className="text-[11px] text-muted-foreground">
                {client?.profile.current_weight_kg ?? "—"}kg ·{" "}
                {client?.profile.calorie_target_kcal ?? "—"} kcal ·{" "}
                {client?.profile.protein_target_g ?? "—"}g protein
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <form onSubmit={submit} className="flex items-center gap-2">
            <input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Bench Press 3x10"
              className="flex-1 rounded-xl border border-hairline bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={assign.isPending || !exerciseName.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red)] transition-all hover:brightness-110 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Assign
            </button>
          </form>

          <section className="mt-6">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Today's Routine · Live
            </div>
            {todayWorkouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-hairline bg-surface p-4 text-center text-xs text-muted-foreground">
                No workouts assigned for today. Push one above.
              </div>
            ) : (
              <ul className="space-y-2">
                {todayWorkouts.map((w) => (
                  <WorkoutRow key={w.id} name={w.exercise_name} done={w.is_completed} live />
                ))}
              </ul>
            )}
          </section>

          {earlier.length > 0 && (
            <section className="mt-6">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Recent History
              </div>
              <ul className="space-y-2">
                {earlier.map((w) => (
                  <WorkoutRow
                    key={w.id}
                    name={w.exercise_name}
                    done={w.is_completed}
                    date={w.assigned_date}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkoutRow({
  name,
  done,
  date,
  live,
}: {
  name: string;
  done: boolean;
  date?: string;
  live?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 transition-all ${
        done ? "border-emerald-500/40" : "border-hairline"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-medium ${done ? "text-foreground" : "text-foreground"}`}>
          {name}
        </div>
        {date && <div className="text-[10px] text-muted-foreground">{date}</div>}
      </div>
      <div className="flex items-center gap-2">
        {live && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"}`} />
            {done ? "Done" : "Pending"}
          </span>
        )}
        <span
          aria-hidden
          className={`grid h-6 w-6 place-items-center rounded-md border transition-all ${
            done
              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
              : "border-hairline bg-surface-2 text-transparent"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    </li>
  );
}