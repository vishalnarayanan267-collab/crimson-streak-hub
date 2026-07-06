import { createFileRoute } from "@tanstack/react-router";
import { Crown, Flame, Medal, Shield, Trophy } from "lucide-react";
import { initialsFor, useLeaderboard, useSession, type LeaderRow } from "@/lib/gym-data";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard · IRONLINE" },
      {
        name: "description",
        content: "Community rankings by total consistency points. Streaks, shields, and points across every athlete.",
      },
      { property: "og:title", content: "Leaderboard · IRONLINE" },
      { property: "og:description", content: "Where the consistent rise. Compete on points, not hype." },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { data: ranked = [], isLoading } = useLeaderboard();
  const { userId } = useSession();
  const top = ranked.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 lg:px-10 lg:pt-10">
      <div className="animate-rise">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Community · Season 01
        </div>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Leaderboard
          <Trophy className="h-6 w-6 text-primary" />
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ranked by total consistency points. Streak Shields protect athletes from full resets — the
          grind stays honest.
        </p>
      </div>

      {/* Podium */}
      {top.length > 0 && (
      <section className="mt-6 grid grid-cols-3 gap-3 animate-rise">
        {[top[1], top[0], top[2]].filter(Boolean).map((row: LeaderRow) => {
          const rank = row === top[0] ? 1 : row === top[1] ? 2 : 3;
          const heights = { 1: "h-32 sm:h-40", 2: "h-24 sm:h-32", 3: "h-20 sm:h-28" } as const;
          const isFirst = rank === 1;
          const initials = initialsFor(row.profile.full_name);
          return (
            <div key={row.profile.id} className="flex flex-col items-center">
              <div
                className={`grid h-14 w-14 place-items-center rounded-full text-sm font-extrabold ${
                  isFirst
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/60 shadow-[var(--shadow-red)]"
                    : "bg-surface-2 text-foreground ring-1 ring-hairline"
                }`}
              >
                {initials}
              </div>
              <div className="mt-2 max-w-[7rem] truncate text-xs font-semibold text-foreground">{row.profile.full_name || "Athlete"}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {row.stats.total_points.toLocaleString()} pts
              </div>
              <div
                className={`mt-2 w-full rounded-t-xl border-x border-t p-3 text-center ${
                  isFirst
                    ? "border-primary/40 bg-gradient-to-b from-primary/20 to-transparent"
                    : "border-hairline bg-surface"
                } ${heights[rank as 1 | 2 | 3]}`}
              >
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${
                  isFirst ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
                }`}>
                  {rank === 1 ? <Crown className="h-4 w-4" /> : <Medal className="h-4 w-4" />}
                </div>
                <div className="mt-1 text-2xl font-extrabold tabular-nums">#{rank}</div>
              </div>
            </div>
          );
        })}
      </section>
      )}

      {/* Table header */}
      <div className="mt-6 grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 border-b border-hairline pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <span>#</span>
        <span>Athlete</span>
        <span className="text-right">Streak</span>
        <span className="text-right">Points</span>
      </div>

      {/* Full list */}
      {isLoading && <div className="mt-6 text-sm text-muted-foreground">Loading rankings…</div>}
      {!isLoading && ranked.length === 0 && (
        <div className="mt-6 rounded-xl border border-hairline bg-surface p-6 text-center text-sm text-muted-foreground">
          No athletes yet. Log your day to open the board.
        </div>
      )}
      <ul className="mt-1 divide-y divide-hairline">
        {ranked.map((row: LeaderRow, i: number) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;
          const isMe = row.profile.id === userId;
          const initials = initialsFor(row.profile.full_name);
          return (
            <li
              key={row.profile.id}
              className={`grid grid-cols-[36px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-2 py-3 transition-colors ${
                isMe ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : "hover:bg-surface/60"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold tabular-nums ${
                  isTop3
                    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
                    : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {rank}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isTop3 ? "bg-primary/10 text-foreground ring-1 ring-primary/40" : "bg-surface-2 text-foreground"
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{row.profile.full_name || "Athlete"}</span>
                    {isMe && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
                        You
                      </span>
                    )}
                    {row.stats.has_freeze && (
                      <Shield className="h-3 w-3 text-[oklch(0.75_0.12_220)]" />
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {row.profile.role === "admin" ? "Coach" : "Athlete"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 text-right">
                <Flame className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold tabular-nums text-foreground">{row.stats.current_streak}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold tabular-nums text-foreground">
                  {row.stats.total_points.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">pts</div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 mb-6 rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-[oklch(0.75_0.12_220)]" />
          Soft-Landing Rules
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Miss a day and hold a Shield? Streak stays intact. No Shield? Streak drops by
          <span className="font-bold text-foreground"> 2 days </span>
          and score bleeds
          <span className="font-bold text-primary"> −50 pts</span>. Never a hard reset.
        </p>
      </div>
    </div>
  );
}