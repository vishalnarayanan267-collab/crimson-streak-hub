import { useSyncExternalStore } from "react";

export type LeaderUser = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  streak: number;
  points: number;
  hasFreeze: boolean;
};

export type DailyLog = {
  protein: number; // g
  calories: number; // kcal
  water: number; // liters (0..5, step 0.25)
  exercises: Record<string, boolean>;
};

export const EXERCISES = [
  { id: "warmup", label: "Warm-up · 10 min" },
  { id: "compound", label: "Compound lift" },
  { id: "accessory", label: "Accessory work" },
  { id: "cardio", label: "Conditioning" },
  { id: "mobility", label: "Mobility & stretch" },
] as const;

const initialUsers: LeaderUser[] = [
  { id: "u1", name: "You", handle: "@you", initials: "YO", streak: 24, points: 2480, hasFreeze: true },
  { id: "u2", name: "Marcus Vale", handle: "@mvale", initials: "MV", streak: 41, points: 3910, hasFreeze: false },
  { id: "u3", name: "Sana Reyes", handle: "@sreyes", initials: "SR", streak: 38, points: 3620, hasFreeze: true },
  { id: "u4", name: "Kenji Ito", handle: "@kito", initials: "KI", streak: 33, points: 3155, hasFreeze: false },
  { id: "u5", name: "Amara Diallo", handle: "@amara", initials: "AD", streak: 27, points: 2720, hasFreeze: true },
  { id: "u6", name: "Luca Moretti", handle: "@luca", initials: "LM", streak: 22, points: 2210, hasFreeze: false },
  { id: "u7", name: "Priya Nair", handle: "@priya", initials: "PN", streak: 19, points: 1980, hasFreeze: false },
  { id: "u8", name: "Diego Alvarez", handle: "@dalv", initials: "DA", streak: 17, points: 1745, hasFreeze: true },
  { id: "u9", name: "Freya Holm", handle: "@freya", initials: "FH", streak: 14, points: 1490, hasFreeze: false },
  { id: "u10", name: "Nate Brooks", handle: "@nate", initials: "NB", streak: 11, points: 1180, hasFreeze: false },
  { id: "u11", name: "Yuki Tanaka", handle: "@yuki", initials: "YT", streak: 9, points: 995, hasFreeze: true },
  { id: "u12", name: "Omar Faruq", handle: "@omar", initials: "OF", streak: 6, points: 720, hasFreeze: false },
];

type Store = {
  users: LeaderUser[];
  log: DailyLog;
  loggedToday: boolean;
};

let state: Store = {
  users: initialUsers,
  log: { protein: 140, calories: 2200, water: 1.75, exercises: { warmup: true, compound: true, accessory: false, cardio: false, mobility: false } },
  loggedToday: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGymStore() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function updateLog(patch: Partial<DailyLog>) {
  state = { ...state, log: { ...state.log, ...patch } };
  emit();
}

export function toggleExercise(id: string) {
  state = {
    ...state,
    log: { ...state.log, exercises: { ...state.log.exercises, [id]: !state.log.exercises[id] } },
  };
  emit();
}

/**
 * Soft-Landing Streak Logic.
 * If the user misses a day:
 *  - If they hold a Streak Shield (Freeze), consume it and preserve the streak fully.
 *  - Otherwise, drop the streak by 2 days (min 0) and deduct 50 points (min 0).
 */
export function applyMissedDay(userId: string): {
  usedFreeze: boolean;
  streakDelta: number;
  pointsDelta: number;
} {
  let result = { usedFreeze: false, streakDelta: 0, pointsDelta: 0 };
  state = {
    ...state,
    users: state.users.map((u) => {
      if (u.id !== userId) return u;
      if (u.hasFreeze) {
        result = { usedFreeze: true, streakDelta: 0, pointsDelta: 0 };
        return { ...u, hasFreeze: false };
      }
      const newStreak = Math.max(0, u.streak - 2);
      const newPoints = Math.max(0, u.points - 50);
      result = { usedFreeze: false, streakDelta: newStreak - u.streak, pointsDelta: newPoints - u.points };
      return { ...u, streak: newStreak, points: newPoints };
    }),
  };
  emit();
  return result;
}

export function commitDailyLog(userId: string) {
  // Reward: +40 points, +1 streak day
  state = {
    ...state,
    loggedToday: true,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, streak: u.streak + 1, points: u.points + 40 } : u,
    ),
  };
  emit();
}

export function getSortedLeaderboard() {
  return [...state.users].sort((a, b) => b.points - a.points);
}

export const CURRENT_USER_ID = "u1";