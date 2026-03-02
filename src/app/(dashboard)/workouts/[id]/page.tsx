import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { CalendarIcon, Clock, Edit } from "lucide-react";
import Link from "next/link";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getWorkoutById } from "@/db/queries/workouts";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeleteWorkoutButton } from "./delete-button";
import { AddExerciseSection } from "./add-exercise-section";

interface WorkoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkoutDetailPage(props: WorkoutPageProps) {
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

  const availableExercises = await db.query.exercises.findMany({
    orderBy: (exercises, { asc }) => [asc(exercises.name)]
  });

  if (!workout) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Workout Overview</h1>
            <Badge variant="secondary" className="capitalize">
              {workout.type}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              {format(workout.date, "EEEE, MMMM do, yyyy")}
            </div>
            {workout.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {workout.duration} min
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/workouts/${workout.id}/edit`}>
              <Edit className="w-4 h-4" />
              <span className="sr-only">Edit Workout</span>
            </Link>
          </Button>
          <DeleteWorkoutButton id={workout.id} />
        </div>
      </div>

      <Separator />

      {/* Notes Section */}
      {workout.notes && (
        <Card className="bg-muted/50">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Exercises & Sets Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Exercises</h2>

        {(!workout.workoutExercises || workout.workoutExercises.length === 0) ? (
          <>
            <Card className="border-dashed border-2 bg-transparent text-center py-12">
              <CardDescription>No exercises added to this workout yet.</CardDescription>
            </Card>
            <AddExerciseSection workoutId={workout.id} availableExercises={availableExercises} />
          </>
        ) : (
          <div className="grid gap-6">
            {workout.workoutExercises.map((we) => (
              <Card key={we.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{we.exercise?.name}</CardTitle>
                      {(we.exercise?.muscleGroup || we.exercise?.equipmentType) && (
                        <CardDescription className="flex gap-2 mt-1">
                          {we.exercise?.muscleGroup && <span>{we.exercise.muscleGroup}</span>}
                          {we.exercise?.equipmentType && <span>• {we.exercise.equipmentType}</span>}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {(!we.sets || we.sets.length === 0) ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No sets recorded.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Set</th>
                            <th className="px-4 py-3 font-medium">Weight (lbs)</th>
                            <th className="px-4 py-3 font-medium">Reps</th>
                            <th className="px-4 py-3 font-medium">RPE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {we.sets
                            // Ensure sets are ordered ascending for display
                            .sort((a, b) => a.setNumber - b.setNumber)
                            .map((set) => (
                            <tr key={set.id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium text-muted-foreground">
                                {set.setNumber}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {set.weight !== null ? set.weight : "-"}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {set.reps !== null ? set.reps : "-"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {set.rpe !== null ? `@${set.rpe}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <AddExerciseSection workoutId={workout.id} availableExercises={availableExercises} />
          </div>
        )}
      </div>
    </div>
  );
}
