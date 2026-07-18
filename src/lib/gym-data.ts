import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Supabase types haven't been regenerated for the new tables yet, so we cast the client.
const sb = supabase as unknown as {
  from: (t: string) => any;
  auth: typeof supabase.auth;
};

export type Profile = {
  id: string;
  full_name: string;
  current_weight_kg: number | null;
  calorie_target_kcal: number | null;
  protein_target_g: number | null;
  water_target_l: number | null;
  role: "admin" | "client";
  onboarded: boolean;
  created_at: string;
  age: number | null;
  height_cm: number | null;
  primary_goal: PrimaryGoal | null;
};

export type PrimaryGoal = "weight_loss" | "muscle_gain" | "general_conditioning";

export const GOAL_META: Record<PrimaryGoal, { label: string; short: string; tone: "crimson" | "steel" | "amber" }> = {
  weight_loss: { label: "Weight Loss", short: "Shredding", tone: "crimson" },
  muscle_gain: { label: "Muscle Gain", short: "Bulking", tone: "steel" },
  general_conditioning: { label: "General Conditioning", short: "Conditioning", tone: "amber" },
};

export type Workout = {
  id: string;
  client_id: string;
  exercise_name: string;
  is_completed: boolean;
  assigned_date: string;
};

export type Stats = {
  id: string;
  client_id: string;
  current_streak: number;
  total_points: number;
  has_freeze: boolean;
  last_logged_date: string | null;
};

export type LeaderRow = { profile: Profile; stats: Stats };

export function initialsFor(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export type ExerciseLog = {
  id: string;
  client_id: string;
  workout_id: string | null;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  logged_date: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  client_id: string | null;
  action: string;
  summary: string;
  created_at: string;
};

/* ---------- session ---------- */

export function useSession() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user.id ?? null);
      if (event === "SIGNED_OUT") qc.clear();
      else qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);
  return { userId: userId ?? null, loading: userId === undefined };
}

/* ---------- queries ---------- */

export function useMyProfile() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useMyStats() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ["stats", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Stats | null> => {
      if (!userId) return null;
      const { data, error } = await sb
        .from("leaderboard_stats")
        .select("*")
        .eq("client_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Stats | null;
    },
  });
}

export function useTodayWorkouts() {
  const { userId } = useSession();
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["workouts", userId, today],
    enabled: !!userId,
    queryFn: async (): Promise<Workout[]> => {
      if (!userId) return [];
      const { data, error } = await sb
        .from("assigned_workouts")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Workout[];
    },
  });
}

export function useLeaderboard() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard_stats" }, () => {
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data: stats, error: e1 } = await sb
        .from("leaderboard_stats")
        .select("*")
        .order("total_points", { ascending: false });
      if (e1) throw e1;
      const ids = (stats ?? []).map((s: Stats) => s.client_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: e2 } = await sb.from("profiles").select("*").in("id", ids);
      if (e2) throw e2;
      const byId = new Map<string, Profile>((profiles ?? []).map((p: Profile) => [p.id, p]));
      return (stats as Stats[])
        .map((s) => ({ stats: s, profile: byId.get(s.client_id)! }))
        .filter((r) => r.profile);
    },
  });
}

/* ---------- mutations ---------- */

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      if (!userId) throw new Error("No session");
      const { error } = await sb.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useToggleWorkout() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await sb.from("assigned_workouts").update({ is_completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", userId] }),
  });
}

export function useCommitDailyLog() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No session");
      const { data: current, error: e1 } = await sb
        .from("leaderboard_stats")
        .select("*")
        .eq("client_id", userId)
        .maybeSingle();
      if (e1) throw e1;
      const s = current as Stats | null;
      const today = new Date().toISOString().slice(0, 10);
      const nextStreak = (s?.current_streak ?? 0) + 1;
      const nextPoints = (s?.total_points ?? 0) + 40;
      const { error } = await sb
        .from("leaderboard_stats")
        .update({
          current_streak: nextStreak,
          total_points: nextPoints,
          last_logged_date: today,
        })
        .eq("client_id", userId);
      if (error) throw error;
      return { nextStreak, nextPoints };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats", userId] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

/**
 * Soft-Landing Streak Logic.
 * Missing a day:
 *  - If Freeze is active, consume it and preserve streak/points.
 *  - Otherwise, streak drops by 2 (min 0) and points drop by 50 (min 0).
 */
export function useApplyMissedDay() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async (): Promise<{ usedFreeze: boolean; streakDelta: number; pointsDelta: number }> => {
      if (!userId) throw new Error("No session");
      const { data: current, error: e1 } = await sb
        .from("leaderboard_stats")
        .select("*")
        .eq("client_id", userId)
        .maybeSingle();
      if (e1) throw e1;
      const s = (current as Stats | null) ?? {
        current_streak: 0,
        total_points: 0,
        has_freeze: false,
      };
      if (s.has_freeze) {
        const { error } = await sb
          .from("leaderboard_stats")
          .update({ has_freeze: false })
          .eq("client_id", userId);
        if (error) throw error;
        return { usedFreeze: true, streakDelta: 0, pointsDelta: 0 };
      }
      const nextStreak = Math.max(0, s.current_streak - 2);
      const nextPoints = Math.max(0, s.total_points - 50);
      const { error } = await sb
        .from("leaderboard_stats")
        .update({ current_streak: nextStreak, total_points: nextPoints })
        .eq("client_id", userId);
      if (error) throw error;
      return {
        usedFreeze: false,
        streakDelta: nextStreak - s.current_streak,
        pointsDelta: nextPoints - s.total_points,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats", userId] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}

/* ---------- admin ---------- */

export function useAllClients() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("admin-clients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-clients"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard_stats" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-clients"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assigned_workouts" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-clients"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data: profiles, error } = await sb
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (profiles ?? []).map((p: Profile) => p.id);
      if (ids.length === 0) return [];
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: stats }, { data: workouts }] = await Promise.all([
        sb.from("leaderboard_stats").select("*").in("client_id", ids),
        sb
          .from("assigned_workouts")
          .select("*")
          .in("client_id", ids)
          .eq("assigned_date", today),
      ]);
      const statsBy = new Map<string, Stats>((stats ?? []).map((s: Stats) => [s.client_id, s]));
      const wByClient = new Map<string, Workout[]>();
      for (const w of (workouts ?? []) as Workout[]) {
        const arr = wByClient.get(w.client_id) ?? [];
        arr.push(w);
        wByClient.set(w.client_id, arr);
      }
      return (profiles as Profile[]).map((p) => {
        const ws = wByClient.get(p.id) ?? [];
        const done = ws.filter((w) => w.is_completed).length;
        return {
          profile: p,
          stats: statsBy.get(p.id) ?? null,
          workoutsDone: done,
          workoutsTotal: ws.length,
        };
      });
    },
  });
}

export function useClientWorkouts(clientId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`client-workouts-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assigned_workouts", filter: `client_id=eq.${clientId}` },
        () => qc.invalidateQueries({ queryKey: ["client-workouts", clientId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, clientId]);
  return useQuery({
    queryKey: ["client-workouts", clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Workout[]> => {
      const { data, error } = await sb
        .from("assigned_workouts")
        .select("*")
        .eq("client_id", clientId)
        .order("assigned_date", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Workout[];
    },
  });
}

export function useAssignWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, exerciseName }: { clientId: string; exerciseName: string }) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await sb
        .from("assigned_workouts")
        .insert({ client_id: clientId, exercise_name: exerciseName, assigned_date: today });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["client-workouts", vars.clientId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

/* ---------- workout CRUD (trainee-editable) ---------- */

export function useAddWorkout() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async (exerciseName: string) => {
      if (!userId) throw new Error("No session");
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await sb
        .from("assigned_workouts")
        .insert({ client_id: userId, exercise_name: exerciseName, assigned_date: today });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts", userId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("assigned_workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts", userId] });
      qc.invalidateQueries({ queryKey: ["client-workouts"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}

export function useRenameWorkout() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async ({ id, exercise_name }: { id: string; exercise_name: string }) => {
      const { error } = await sb
        .from("assigned_workouts")
        .update({ exercise_name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts", userId] });
      qc.invalidateQueries({ queryKey: ["client-workouts"] });
    },
  });
}

/* ---------- exercise logs (sets/reps/weight history) ---------- */

export function useExerciseLogs(clientId: string | null, days = 14) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`ex-logs-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercise_logs", filter: `client_id=eq.${clientId}` },
        () => qc.invalidateQueries({ queryKey: ["exercise-logs", clientId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, clientId]);
  return useQuery({
    queryKey: ["exercise-logs", clientId, days],
    enabled: !!clientId,
    queryFn: async (): Promise<ExerciseLog[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await sb
        .from("exercise_logs")
        .select("*")
        .eq("client_id", clientId)
        .gte("logged_date", since.toISOString().slice(0, 10))
        .order("logged_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExerciseLog[];
    },
  });
}

export function useAddExerciseLog() {
  const qc = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: async (input: {
      exercise_name: string;
      sets: number;
      reps: number;
      weight_kg: number;
      workout_id?: string | null;
      client_id?: string; // admin override
    }) => {
      const client_id = input.client_id ?? userId;
      if (!client_id) throw new Error("No session");
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await sb.from("exercise_logs").insert({
        client_id,
        workout_id: input.workout_id ?? null,
        exercise_name: input.exercise_name,
        sets: input.sets,
        reps: input.reps,
        weight_kg: input.weight_kg,
        logged_date: today,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      const cid = vars.client_id ?? userId;
      qc.invalidateQueries({ queryKey: ["exercise-logs", cid] });
    },
  });
}