import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getWorkoutById } from "@/db/queries/workouts";
import EditWorkoutForm from "./edit-form";

interface EditWorkoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWorkoutPage(props: EditWorkoutPageProps) {
  const { id } = await props.params;
  const workoutId = parseInt(id, 10);

  if (isNaN(workoutId)) {
    notFound();
  }

  // Authenticate user
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    notFound();
  }

  // Get internal user ID
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkId));
  if (!user) {
    notFound();
  }

  // Fetch workout data
  const workout = await getWorkoutById(user.id, workoutId);

  if (!workout) {
    notFound();
  }

  return <EditWorkoutForm initialData={workout} />;
}
