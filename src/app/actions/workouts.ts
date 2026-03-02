"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, workouts, workoutExercises, sets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { 
  createWorkoutSchema, 
  deleteWorkoutSchema, 
  updateWorkoutSchema,
  type CreateWorkoutInput,
  type UpdateWorkoutInput,
  addExerciseSchema,
  type AddExerciseInput
} from "@/lib/schemas";

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function deleteWorkout(
  id: number
): Promise<ActionResponse> {
  // 1. Authenticate (Auth Pattern)
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized: You must be signed in." };

  // 2. Validate input using Zod (Mutation Pattern)
  const parseResult = deleteWorkoutSchema.safeParse({ id });
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    // 3. Get internal database user ID (Auth Pattern)
    const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId));
    if (!dbUser) return { success: false, error: "User profile not found" };

    // 4. Perform DB mutation exclusively targeting user's resource (Mutation/Auth Pattern)
    const [deletedWorkout] = await db
      .delete(workouts)
      .where(
        and(
          eq(workouts.id, parseResult.data.id),
          eq(workouts.userId, dbUser.id)
        )
      )
      .returning({ id: workouts.id });

    // Handle case where ID doesn't exist or isn't owned by user
    if (!deletedWorkout) {
      return { success: false, error: "Workout not found or permission denied." };
    }

    // 5. Revalidate paths that show this data (Mutation Pattern)
    revalidatePath("/workouts"); // The list page
    revalidatePath("/"); // The dashboard which calculates stats

    // 6. Return standardized success response (Mutation Pattern)
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workout:", error);
    return { success: false, error: "An unexpected error occurred while deleting." };
  }
}



export async function createWorkout(
  input: CreateWorkoutInput
): Promise<ActionResponse<{ id: number }>> {
  // 1. Authenticate (Auth Pattern)
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized: You must be signed in." };

  // 2. Validate input using Zod (Mutation Pattern)
  const parseResult = createWorkoutSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    // 3. Get internal database user ID (Auth Pattern)
    const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId));
    if (!dbUser) return { success: false, error: "User profile not found" };

    // Handle duration coercion properly, because React forms might give us '' for empty inputs
    const durationVal = typeof parseResult.data.duration === 'number' && parseResult.data.duration > 0 
      ? parseResult.data.duration 
      : null;

    // 4. Perform DB mutation (Mutation Pattern)
    const [newWorkout] = await db.insert(workouts).values({
      userId: dbUser.id,
      date: parseResult.data.date,
      type: parseResult.data.type,
      notes: parseResult.data.notes || null,
      duration: durationVal,
    }).returning({ id: workouts.id });

    // 5. Revalidate paths that show this data (Mutation Pattern)
    revalidatePath("/workouts"); // The list page
    revalidatePath("/"); // The dashboard which calculates stats

    // 6. Return standardized success response (Mutation Pattern)
    return { success: true, data: { id: newWorkout.id } };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return { success: false, error: "An unexpected error occurred while creating." };
  }
}

export async function updateWorkout(
  input: UpdateWorkoutInput
): Promise<ActionResponse<{ id: number }>> {
  // 1. Authenticate (Auth Pattern)
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized: You must be signed in." };

  // 2. Validate input using Zod (Mutation Pattern)
  const parseResult = updateWorkoutSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    // 3. Get internal database user ID (Auth Pattern)
    const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId));
    if (!dbUser) return { success: false, error: "User profile not found" };

    const durationVal = typeof parseResult.data.duration === 'number' && parseResult.data.duration > 0 
      ? parseResult.data.duration 
      : null;

    // 4. Perform DB mutation exclusively targeting user's resource (Mutation/Auth Pattern)
    const [updatedWorkout] = await db
      .update(workouts)
      .set({
        date: parseResult.data.date,
        type: parseResult.data.type,
        notes: parseResult.data.notes || null,
        duration: durationVal,
      })
      .where(
        and(
          eq(workouts.id, parseResult.data.id),
          eq(workouts.userId, dbUser.id)
        )
      )
      .returning({ id: workouts.id });

    if (!updatedWorkout) {
      return { success: false, error: "Workout not found or permission denied." };
    }

    // 5. Revalidate paths that show this data (Mutation Pattern)
    revalidatePath("/workouts"); 
    revalidatePath(`/workouts/${updatedWorkout.id}`);
    revalidatePath("/"); 

    // 6. Return standardized success response (Mutation Pattern)
    return { success: true, data: { id: updatedWorkout.id } };
  } catch (error) {
    console.error("Failed to update workout:", error);
    return { success: false, error: "An unexpected error occurred while updating." };
  }
}

export async function addExerciseToWorkout(
  input: AddExerciseInput
): Promise<ActionResponse> {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  // 2. Validate input
  const parseResult = addExerciseSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId));
    if (!dbUser) return { success: false, error: "User not found" };

    const { workoutId, exerciseId, sets: newSets } = parseResult.data;

    // Verify workout belongs to user
    const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.userId, dbUser.id)));
    if (!workout) {
      return { success: false, error: "Workout not found or permission denied" };
    }
    
    // Perform insertions outside a transaction (or inside, but Neon serverless has limited nested transaction support, so doing sequentially is fine here, or use DB transaction)
    await db.transaction(async (tx) => {
      // 1. Create WorkoutExercise link
      const [we] = await tx.insert(workoutExercises).values({
        workoutId,
        exerciseId,
      }).returning({ id: workoutExercises.id });

      // 2. Insert Sets
      const setsToInsert = newSets.map((s, idx) => ({
        workoutExerciseId: we.id,
        setNumber: idx + 1,
        weight: s.weight ?? null,
        reps: s.reps ?? null,
        rpe: s.rpe ?? null,
      }));

      await tx.insert(sets).values(setsToInsert);
    });

    revalidatePath(`/workouts/${workoutId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to add exercise to workout:", error);
    return { success: false, error: "An unexpected error occurred while adding exercise." };
  }
}
