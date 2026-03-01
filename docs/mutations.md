# LiftingDiary Server Action Patterns (Mutations)

This document standardizes how we perform all write/mutation operations (Creates, Updates, Deletes) using Next.js Server Actions.

## 1. File Naming and Location

All server actions must be placed in a dedicated `actions` folder under `src/app/`, grouped by their logical resource.

- **Location**: `src/app/actions/[resource].ts`
- **Example**: `src/app/actions/workouts.ts`, `src/app/actions/exercises.ts`
- **Rule**: Every action file must start with the `"use server";` directive at the very top.

## 2. Function Naming Conventions

Exported server actions must follow a strict CRUD naming convention to clearly indicate their purpose.

- `create{Resource}` (e.g., `createWorkout`)
- `update{Resource}` (e.g., `updateWorkout`)
- `delete{Resource}` (e.g., `deleteWorkout`)

If an action does a specific complex task:

- `start{Resource}`
- `duplicate{Resource}`

## 3. Standardized Return Type

To ensure predictable client-side error handling, all server actions must return a discriminated union standardizing success and failure states.

```typescript
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

If the action creates something, return the created data so the client can optionally use or navigate to it:
`{ success: true, data: newWorkoutId }`

## 4. Input Validation with Zod

Never trust client input. Every mutation must validate its input arguments using strict **Zod** schemas before executing any database logic.

```typescript
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { revalidatePath } from "next/cache";

// Define the schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  date: z.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkout(
  input: CreateWorkoutInput,
): Promise<ActionResponse<{ id: number }>> {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  // 2. Validate input
  const parseResult = createWorkoutSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    // 3. Get internal DB user ID
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId));
    if (!dbUser) return { success: false, error: "User profile not found" };

    // 4. Perform DB mutation
    const [newWorkout] = await db
      .insert(workouts)
      .values({
        userId: dbUser.id,
        name: parseResult.data.name,
        date: parseResult.data.date,
      })
      .returning({ id: workouts.id });

    // 5. Revalidate cache (see next section)
    revalidatePath("/workouts");

    // 6. Return success
    return { success: true, data: { id: newWorkout.id } };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return {
      success: false,
      error: "Failed to create workout. Please try again.",
    };
  }
}
```

## 5. Revalidation Pattern

Because App Router caches aggressively, you must tell Next.js to clear the cache for any data your mutation affects.

- Use `revalidatePath('/path')` immediately after the DB mutation succeeds but before returning.
- If you mutate a list (e.g., creating a workout changes the `/workouts` list), revalidate the list page.
- If you mutate a specific item, revalidate its detail page: `revalidatePath(\`/workouts/\${id}\`)`.

## 6. Optimistic Updates for Client Components

When UX requires instant feedback (e.g., toggling a favorite, finishing a set, deleting an item), use React's `useOptimistic` hook paired with Server Actions.

**Pattern for the Client Component:**

1. Maintain standard React state (or props from Server Component).
2. Wire up `useOptimistic`.
3. In your action handler: Update optimistic state first, then await the server action.
4. If the server action fails, the UI will automatically revert because your optimistic action throws or state resets.

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { deleteWorkout } from "@/app/actions/workouts";
import { toast } from "sonner"; // Assuming sonner for toasts

type Workout = { id: number; name: string };

export function WorkoutList({
  initialWorkouts,
}: {
  initialWorkouts: Workout[];
}) {
  const [isPending, startTransition] = useTransition();

  // Define optimistic state
  const [optimisticWorkouts, addOptimisticDelete] = useOptimistic(
    initialWorkouts,
    (state, idToRemove: number) => state.filter((w) => w.id !== idToRemove),
  );

  const handleDelete = async (id: number) => {
    // Wrap in transition to keep UI responsive
    startTransition(async () => {
      // 1. Optimistically update UI immediately
      addOptimisticDelete(id);

      // 2. Perform actual server mutation
      const result = await deleteWorkout(id);

      // 3. Handle errors (UI automatically reverts if state isn't revalidated correctly)
      if (!result.success) {
        toast.error(result.error);
        // Workouts will revert to initial state because Server hasn't successfully revalidated
      } else {
        toast.success("Workout deleted");
      }
    });
  };

  return (
    <ul>
      {optimisticWorkouts.map((workout) => (
        <li key={workout.id}>
          {workout.name}
          <button onClick={() => handleDelete(workout.id)} disabled={isPending}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
```
