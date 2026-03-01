import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  startOfMonth,
  startOfWeek,
  subMonths,
  subDays,
  format,
  addDays,
  startOfDay,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyFrequency {
  month: string;       // "2026-02", "2026-01"
  label: string;       // "Feb", "Jan"
  count: number;
  totalDuration: number;
}

export interface DailyFrequency {
  date: string;        // "2026-03-01"
  day: string;         // "1"
  weekday: string;     // "Sat"
  count: number;
}

export interface PersonalRecord {
  exerciseName: string;
  muscleGroup: string | null;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: Date;
  workoutId: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastWorkoutDate: Date | null;
}

export interface DashboardStats {
  workoutsThisMonth: number;
  volumeThisWeek: number;
  streak: StreakInfo;
  monthlyFrequency: MonthlyFrequency[];
  dailyFrequency: DailyFrequency[];
  personalRecords: PersonalRecord[];
}

// ─── Monthly Workout Frequency ────────────────────────────────────────────────

/**
 * Returns per-month workout count + total duration for the last N months.
 * Useful for bar/line charts on the dashboard.
 */
export async function getMonthlyFrequency(
  userId: number,
  months: number = 6
): Promise<MonthlyFrequency[]> {
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, months - 1));

  const rows = await db
    .select({
      month: sql<string>`to_char(${workouts.date}, 'YYYY-MM')`,
      count: sql<number>`count(*)::integer`,
      totalDuration: sql<number>`coalesce(sum(${workouts.duration}), 0)::integer`,
    })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.date, rangeStart)))
    .groupBy(sql`to_char(${workouts.date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${workouts.date}, 'YYYY-MM')`);

  // Fill gaps so every month in the range has an entry (even if 0)
  const result: MonthlyFrequency[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM");
    const existing = rows.find((r) => r.month === key);
    result.push({
      month: key,
      label,
      count: existing?.count ?? 0,
      totalDuration: existing?.totalDuration ?? 0,
    });
  }

  return result;
}

// ─── Personal Records ─────────────────────────────────────────────────────────

// Epley formula: e1RM = weight × (1 + reps / 30)
const E1RM_EXPR = sql`${sets.weight} * (1.0 + ${sets.reps}::real / 30.0)`;

/**
 * Returns estimated 1RM personal records per exercise.
 * Uses Epley formula: weight × (1 + reps / 30).
 * Ranked by highest e1RM, not raw weight.
 */
export async function getPersonalRecords(
  userId: number,
  limit: number = 5
): Promise<PersonalRecord[]> {
  const rows = await db
    .select({
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      // The highest e1RM value for this exercise
      estimated1RM: sql<number>`round(max(${E1RM_EXPR})::numeric, 1)::real`,
      // Grab weight and reps from the set that achieved the best e1RM
      weight: sql<number>`(
        array_agg(${sets.weight} ORDER BY ${E1RM_EXPR} DESC)
      )[1]::real`,
      reps: sql<number>`(
        array_agg(${sets.reps} ORDER BY ${E1RM_EXPR} DESC)
      )[1]::integer`,
      date: sql<Date>`(
        array_agg(${workouts.date} ORDER BY ${E1RM_EXPR} DESC)
      )[1]`,
      workoutId: sql<number>`(
        array_agg(${workouts.id} ORDER BY ${E1RM_EXPR} DESC)
      )[1]::integer`,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(
      eq(workouts.userId, userId),
      sql`${sets.weight} > 0`,
      sql`${sets.reps} > 0`
    ))
    .groupBy(exercises.id, exercises.name, exercises.muscleGroup)
    .orderBy(sql`max(${E1RM_EXPR}) DESC`)
    .limit(limit);

  return rows;
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

/**
 * Computes both the current active streak AND the all-time longest streak.
 *
 * A streak is consecutive calendar days (in the user's local timezone) that
 * each have at least one workout. The streak is considered active if the most
 * recent workout day is today or yesterday in the user's timezone.
 *
 * Timezone handling:
 *   - workouts.date is stored as `timestamp` (no tz), assumed UTC.
 *   - We use PostgreSQL `AT TIME ZONE` to convert to the user's local
 *     calendar day before deduplicating. This ensures a workout logged at
 *     2026-03-01 23:00 UTC is counted as March 2 for a UTC+8 user.
 *   - "Today" is also computed in PostgreSQL for consistency (no JS Date drift).
 *
 * @param userId   Internal user ID
 * @param timezone IANA timezone string, e.g. 'Asia/Shanghai', 'America/New_York'.
 *                 Defaults to 'UTC'.
 */
export async function getStreakInfo(
  userId: number,
  timezone: string = "UTC"
): Promise<StreakInfo> {
  // Validate timezone to prevent SQL injection since we use sql.raw()
  // IANA timezone names: letters, digits, underscores, hyphens, slashes, plus signs
  if (!/^[A-Za-z0-9_+\-/]+$/.test(timezone)) {
    timezone = "UTC";
  }

  // Use sql.raw() for timezone to avoid parameter duplication issues
  // when the same expression appears in SELECT, GROUP BY, and ORDER BY.
  const tzLiteral = sql.raw(`'${timezone}'`);

  // 1. Fetch unique workout days in the user's local timezone, DESC sorted.
  const rows = await db
    .select({
      localDay: sql<string>`(${workouts.date} AT TIME ZONE 'UTC' AT TIME ZONE ${tzLiteral})::date`,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .groupBy(sql`(${workouts.date} AT TIME ZONE 'UTC' AT TIME ZONE ${tzLiteral})::date`)
    .orderBy(sql`(${workouts.date} AT TIME ZONE 'UTC' AT TIME ZONE ${tzLiteral})::date DESC`);

  if (rows.length === 0) {
    return { current: 0, longest: 0, lastWorkoutDate: null };
  }

  // 2. Get "today" in the user's timezone from the database (not JS)
  const [{ today }] = await db
    .select({
      today: sql<string>`(now() AT TIME ZONE ${tzLiteral})::date`,
    })
    .from(sql`(SELECT 1) AS _`);

  // 3. Convert date strings to integer day numbers for reliable arithmetic.
  //    Using Julian Day Number avoids any JS Date timezone reinterpretation.
  const toDayNum = (dateStr: string): number => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const a = Math.floor((14 - m) / 12);
    const yr = y + 4800 - a;
    const mo = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * mo + 2) / 5) +
      365 * yr +
      Math.floor(yr / 4) -
      Math.floor(yr / 100) +
      Math.floor(yr / 400) -
      32045
    );
  };

  const todayNum = toDayNum(today);
  const dayNums = rows.map((r) => toDayNum(r.localDay));
  const lastWorkoutDate = new Date(rows[0].localDay + "T00:00:00");

  // 4. Current streak — must start from today or yesterday
  let current = 0;
  const daysSinceLast = todayNum - dayNums[0];

  if (daysSinceLast <= 1) {
    current = 1;
    for (let i = 1; i < dayNums.length; i++) {
      if (dayNums[i - 1] - dayNums[i] === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // 5. Longest streak (all-time)
  let longest = 1;
  let running = 1;
  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i - 1] - dayNums[i] === 1) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 1;
    }
  }

  return { current, longest, lastWorkoutDate };
}

// ─── Volume Helpers ───────────────────────────────────────────────────────────

/**
 * Total volume (weight × reps) for a given date range.
 */
export async function getVolumeForRange(
  userId: number,
  from: Date,
  to: Date
): Promise<number> {
  const [{ volume }] = await db
    .select({
      volume: sql<number>`coalesce(sum(${sets.weight} * ${sets.reps}), 0)::integer`,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, from),
        lte(workouts.date, to)
      )
    );

  return volume;
}

// ─── Daily Workout Frequency ──────────────────────────────────────────────────

/**
 * Returns workout count per day for the last N days.
 * Single query + app-level gap-fill for days with 0 workouts.
 */
export async function getDailyFrequency(
  userId: number,
  days: number = 30
): Promise<DailyFrequency[]> {
  const now = new Date();
  const rangeStart = startOfDay(subDays(now, days - 1));

  // Single efficient query: GROUP BY date truncated to day
  const rows = await db
    .select({
      day: sql<string>`${workouts.date}::date`,
      count: sql<number>`count(*)::integer`,
    })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.date, rangeStart)))
    .groupBy(sql`${workouts.date}::date`)
    .orderBy(sql`${workouts.date}::date`);

  // Build a lookup map from the query results
  const countMap = new Map(rows.map((r) => [r.day, r.count]));

  // Fill all days in range, including zeros
  const result: DailyFrequency[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(rangeStart, i);
    const dateKey = format(d, "yyyy-MM-dd");
    result.push({
      date: dateKey,
      day: format(d, "d"),
      weekday: format(d, "EEE"),
      count: countMap.get(dateKey) ?? 0,
    });
  }

  return result;
}

// ─── Unified Dashboard Fetch ──────────────────────────────────────────────────

/**
 * Single function to hydrate the entire dashboard.
 * @param userId   Internal user ID
 * @param timezone IANA timezone string for streak calculation.
 *                 Defaults to 'UTC'.
 */
export async function getDashboardStats(
  userId: number,
  timezone: string = "UTC"
): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const [
    [{ count: workoutsThisMonth }],
    volumeThisWeek,
    streak,
    monthlyFrequency,
    dailyFrequency,
    personalRecords,
  ] = await Promise.all([
    // 1. Workouts this month
    db
      .select({ count: sql<number>`count(*)::integer` })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), gte(workouts.date, monthStart))),
    // 2. Weekly volume
    getVolumeForRange(userId, weekStart, now),
    // 3. Streak (timezone-aware)
    getStreakInfo(userId, timezone),
    // 4. Monthly frequency (last 6 months)
    getMonthlyFrequency(userId, 6),
    // 5. Daily frequency (last 30 days)
    getDailyFrequency(userId, 30),
    // 6. Personal records (top 5)
    getPersonalRecords(userId, 5),
  ]);

  return {
    workoutsThisMonth,
    volumeThisWeek,
    streak,
    monthlyFrequency,
    dailyFrequency,
    personalRecords,
  };
}
