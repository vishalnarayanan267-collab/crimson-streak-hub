import { useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast("Welcome to IRONLINE.", { description: "Let's set your targets." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast("Auth failed", { description: err.message ?? "Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-red)]">
            <Flame className="h-6 w-6" />
          </div>
          <div className="mt-3 text-lg font-bold tracking-[0.28em]">IRONLINE</div>
          <div className="text-[10px] tracking-[0.24em] text-muted-foreground">GYM · COMMUNITY</div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-[var(--shadow-elev)]">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Join the grind." : "Welcome back."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Create your athlete account."
              : "Sign in to keep your streak alive."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Alex Rivera"
                required
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@ironline.gg"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[var(--shadow-red)] transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
          >
            {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
      />
    </label>
  );
}