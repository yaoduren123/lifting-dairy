"use server";

import { auth } from "@clerk/nextjs/server";
import { searchExercises, getLastExerciseHistory } from "@/db/queries/exercises";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function fetchExercises(query: string = "") {
  return await searchExercises(query);
}

export async function fetchExerciseHistory(exerciseId: number) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    throw new Error("User not found in database");
  }

  return await getLastExerciseHistory(dbUser.id, exerciseId);
}
