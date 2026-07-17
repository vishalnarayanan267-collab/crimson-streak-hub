import { GOAL_META, type PrimaryGoal } from "@/lib/gym-data";

const TONE: Record<string, string> = {
  crimson:
    "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40 shadow-[0_0_16px_rgba(255,60,60,0.25)]",
  steel:
    "bg-[oklch(0.25_0.03_240)] text-[oklch(0.85_0.05_240)] ring-1 ring-inset ring-[oklch(0.4_0.05_240)]",
  amber:
    "bg-[oklch(0.28_0.08_70)] text-[oklch(0.85_0.14_80)] ring-1 ring-inset ring-[oklch(0.5_0.12_70)]",
};

export function GoalBadge({
  goal,
  size = "md",
}: {
  goal: PrimaryGoal | null | undefined;
  size?: "sm" | "md";
}) {
  if (!goal) return null;
  const meta = GOAL_META[goal];
  const s =
    size === "sm"
      ? "px-1.5 py-0.5 text-[9px]"
      : "px-2.5 py-1 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-widest ${s} ${TONE[meta.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {meta.short}
    </span>
  );
}