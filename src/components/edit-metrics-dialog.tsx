import { useState } from "react";
import { X } from "lucide-react";
import { GOAL_META, type PrimaryGoal, type Profile } from "@/lib/gym-data";
import { toast } from "sonner";

type Draft = {
  full_name: string;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  calorie_target_kcal: number | null;
  protein_target_g: number | null;
  water_target_l: number | null;
  primary_goal: PrimaryGoal | null;
};

export function EditMetricsDialog({
  profile,
  onClose,
  onSave,
  title = "Edit Metrics",
}: {
  profile: Profile;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => Promise<void>;
  title?: string;
}) {
  const [d, setD] = useState<Draft>({
    full_name: profile.full_name ?? "",
    age: profile.age ?? null,
    height_cm: profile.height_cm ?? null,
    current_weight_kg: profile.current_weight_kg ?? null,
    calorie_target_kcal: profile.calorie_target_kcal ?? null,
    protein_target_g: profile.protein_target_g ?? null,
    water_target_l: profile.water_target_l ?? null,
    primary_goal: profile.primary_goal ?? null,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = async () => {
    setSaving(true);
    try {
      await onSave(d);
      toast.success("Metrics updated");
      onClose();
    } catch (e: any) {
      toast.error("Update failed", { description: e?.message ?? "Try again" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-hairline bg-background shadow-[var(--shadow-red)] animate-in slide-in-from-bottom-8 duration-300 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-hairline p-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Portal
            </div>
            <div className="text-lg font-bold tracking-tight">{title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <Field label="Name">
            <input
              value={d.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age (yrs)">
              <input
                type="number"
                value={d.age ?? ""}
                onChange={(e) => set("age", num(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Height (cm)">
              <input
                type="number"
                value={d.height_cm ?? ""}
                onChange={(e) => set("height_cm", num(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                value={d.current_weight_kg ?? ""}
                onChange={(e) => set("current_weight_kg", num(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Calories (kcal)">
              <input
                type="number"
                value={d.calorie_target_kcal ?? ""}
                onChange={(e) => set("calorie_target_kcal", num(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Protein (g)">
              <input
                type="number"
                value={d.protein_target_g ?? ""}
                onChange={(e) => set("protein_target_g", num(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Water (L)">
              <input
                type="number"
                step="0.1"
                value={d.water_target_l ?? ""}
                onChange={(e) => set("water_target_l", num(e.target.value))}
                className="input"
              />
            </Field>
          </div>
          <Field label="Primary goal">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(GOAL_META) as PrimaryGoal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => set("primary_goal", g)}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-semibold uppercase tracking-widest transition ${
                    d.primary_goal === g
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-hairline bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {GOAL_META[g].short}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline p-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red)] hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        <style>{`
          .input {
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid var(--color-hairline, oklch(0.25 0 0));
            background: var(--color-surface, oklch(0.15 0 0));
            padding: 0.6rem 0.85rem;
            font-size: 0.875rem;
            outline: none;
          }
          .input:focus { border-color: oklch(0.62 0.26 25 / 0.6); box-shadow: 0 0 0 1px oklch(0.62 0.26 25 / 0.4); }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}