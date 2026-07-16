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
  if (parts.length === 0) return "AT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

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