import { useState } from "react";
import { Beef, Droplets, Flame, Scale, User } from "lucide-react";
import { useUpdateProfile } from "@/lib/gym-data";
import { toast } from "sonner";

export function OnboardingModal({ initialName }: { initialName: string }) {
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [weight, setWeight] = useState<number>(75);
  const [calories, setCalories] = useState<number>(2600);
  const [protein, setProtein] = useState<number>(150);
  const [water, setWater] = useState<number>(3);

  async function finish() {
    try {
      await update.mutateAsync({
        full_name: name.trim() || "Athlete",
        current_weight_kg: weight,
        calorie_target_kcal: calories,
        protein_target_g: protein,
        water_target_l: water,
        onboarded: true,
      });
      toast("You're in.", { description: "Let's log day one." });
    } catch (e: any) {
      toast("Couldn't save", { description: e.message ?? "Try again." });
    }
  }

  const steps = [
    {
      icon: User,
      title: "What's your name?",
      hint: "Displayed on the community leaderboard.",
      body: (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Rivera"
          className="w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-lg font-semibold text-foreground outline-none focus:border-primary/60"
        />
      ),
      canNext: name.trim().length > 0,
    },
    {
      icon: Scale,
      title: "Current weight",
      hint: "We'll use this to calibrate your macro targets.",
      body: (
        <NumberStepper value={weight} onChange={setWeight} step={0.5} unit="kg" min={30} max={250} />
      ),
      canNext: weight > 0,
    },
    {
      icon: Flame,
      title: "Daily calorie target",
      hint: "Set the ceiling you aim for each day.",
      body: (
        <NumberStepper value={calories} onChange={setCalories} step={50} unit="kcal" min={1000} max={5000} />
      ),
      canNext: calories > 0,
    },
    {
      icon: Beef,
      title: "Protein target",
      hint: "Grams per day. Aim for ~1.6–2.2 g / kg.",
      body: (
        <NumberStepper value={protein} onChange={setProtein} step={5} unit="g" min={30} max={400} />
      ),
      canNext: protein > 0,
    },
    {
      icon: Droplets,
      title: "Water target",
      hint: "Liters per day. Stay hydrated, stay ranked.",
      body: (
        <NumberStepper value={water} onChange={setWater} step={0.25} unit="L" min={0.5} max={8} />
      ),
      canNext: water > 0,
    },
  ];

  const current = steps[step]!;
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/85 backdrop-blur-md px-4 py-6">
      <div className="w-full max-w-md animate-rise rounded-2xl border border-hairline bg-surface p-6 shadow-[var(--shadow-elev)]">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            Setup · Step {step + 1} of {steps.length}
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-surface-2"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
            <p className="text-xs text-muted-foreground">{current.hint}</p>
          </div>
        </div>

        <div className="mt-5">{current.body}</div>

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-xl border border-hairline bg-surface-2 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          )}
          <button
            disabled={!current.canNext || update.isPending}
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="flex-[2] rounded-xl bg-primary py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-[var(--shadow-red)] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isLast ? (update.isPending ? "Saving…" : "Enter IRONLINE") : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  step,
  unit,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  unit: string;
  min: number;
  max: number;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 100) / 100));
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-2 p-4">
      <button
        onClick={dec}
        className="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-surface text-foreground active:scale-90 hover:border-primary/60 hover:text-primary transition-all text-xl"
      >
        −
      </button>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
          {value % 1 === 0 ? value : value.toFixed(2)}
        </span>
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {unit}
        </span>
      </div>
      <button
        onClick={inc}
        className="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-surface text-foreground active:scale-90 hover:border-primary/60 hover:text-primary transition-all text-xl"
      >
        +
      </button>
    </div>
  );
}