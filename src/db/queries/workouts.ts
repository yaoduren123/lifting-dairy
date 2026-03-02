import { db } from "@/db";
import { workouts, workoutExercises, sets } from "@/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { startOfMonth, startOfWeek, differenceInDays } from "date-fns";

/**
 * Get paginated list of workouts for a user
 */
export async function getWorkouts(userId: number, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const results = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    limit,
    offset,
    orderBy: [desc(workouts.date)],
    with: {
      workoutExercises: {
        columns: {
          id: true
        }
      }
    }
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(workouts)
    .where(eq(workouts.userId, userId));

  return {
    workouts: results,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
}

/**
 * Get a single workout with all details
 */
export async function getWorkoutById(userId: number, workoutId: number) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: {
            orderBy: [desc(sets.setNumber)]
          }
        }
      }
    }
  });
}

/**
 * Get training statistics for a user
 */
export async function getWorkoutStats(userId: number) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  // 1. Workouts this month
  const [{ count: workoutsThisMonth }] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, monthStart)
      )
    );

  // 2. Weekly volume
  const [{ volume: volumeThisWeek }] = await db
    .select({ volume: sql<number>`coalesce(sum(${sets.weight} * ${sets.reps}), 0)::integer` })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, weekStart)
      )
    );

  // 3. Streak calculation
  const recentWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.date)],
    limit: 30,
  });

  let streak = 0;
  let lastWorkoutDate = null;

  if (recentWorkouts.length > 0) {
    lastWorkoutDate = recentWorkouts[0].date;
    const uniqueDates = Array.from(new Set(recentWorkouts.map(w => w.date.toISOString().split('T')[0]))).sort().reverse();
    
    // Check if they worked out today or yesterday to start streak
    const firstWorkoutDate = new Date(uniqueDates[0]);
    const daysSinceLast = differenceInDays(now, firstWorkoutDate);
    
    if (daysSinceLast <= 1) {
      streak = 1;
      let checkDate = firstWorkoutDate;
      for (let i = 1; i < uniqueDates.length; i++) {
        const nextDate = new Date(uniqueDates[i]);
        if (differenceInDays(checkDate, nextDate) === 1) {
          streak++;
          checkDate = nextDate;
        } else {
          break;
        }
      }
    }
  }

  return {
    workoutsThisMonth,
    volumeThisWeek,
    streak,
    lastWorkoutDate
  };
}

/**
 * Get all workouts for a user, optimized for calendar view
 */
export async function getCalendarWorkouts(userId: number) {
  // We fetch a simplified view of workouts for the calendar to plot them.
  // In a massive app you'd filter by range, but for a personal diary all recent 
  // workouts (e.g. past 2 years or simply all) is usually fine.
  return db
    .select({
      id: workouts.id,
      date: workouts.date,
      type: workouts.type,
      duration: workouts.duration,
      notes: workouts.notes,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.date))
    // Capping at 1000 to prevent edge case huge payloads
    .limit(1000);
}
