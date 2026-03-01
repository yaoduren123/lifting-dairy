"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { 
  createWorkoutSchema, 
  deleteWorkoutSchema, 
  updateWorkoutSchema,
  type CreateWorkoutInput,
  type UpdateWorkoutInput
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
