import { db } from "@/db";
import { exercises, workoutExercises, sets, workouts } from "@/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

export async function searchExercises(query: string) {
  if (!query) {
    return await db.select().from(exercises).limit(10);
  }
  return await db.select().from(exercises).where(ilike(exercises.name, `%${query}%`)).limit(10);
}

export async function getLastExerciseHistory(userId: number, exerciseId: number) {
  // Find the most recent workout where this user performed this exercise
  const recentWorkoutExercise = await db
    .select({
      id: workoutExercises.id,
      date: workouts.date,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(workouts.date))
    .limit(1);

  if (recentWorkoutExercise.length === 0) return null;

  const targetWeId = recentWorkoutExercise[0].id;

  // Fetch the sets for that workout exercise
  const historySets = await db
    .select()
    .from(sets)
    .where(eq(sets.workoutExerciseId, targetWeId))
    .orderBy(sets.setNumber);

  if (historySets.length > 0) {
    // Determine summary, e.g., "3x8 @ 80lbs"
    const totalSets = historySets.length;
    // Let's use the first set's profile as the representative 
    const representative = historySets[0];
    const weight = representative.weight ?? 0;
    const reps = representative.reps ?? 0;

    return {
      summary: `${totalSets}x${reps} @ ${weight}lbs`,
      lastWeight: weight,
      lastReps: reps,
    };
  }

  return null;
}
