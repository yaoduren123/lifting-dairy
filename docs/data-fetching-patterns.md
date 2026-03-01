# LiftingDiary Data Fetching & Mutation Patterns

This document defines the conventions for data access and management in the LiftingDiary project. We prioritize performance, type safety, and a secure-by-default architecture.

## 1. Server Actions vs. API Routes

We leverage Next.js App Router features to simplify data flow.

### Read Operations (Server Components)

- **Pattern**: Perform direct database queries using Drizzle ORM inside Server Components.
- **Why**: Best performance (zero client-side fetch), simpler code, and automatic request memoization.

### Write Operations (Server Actions)

- **Pattern**: Use Server Actions (`'use server'`) for all mutations (Create, Update, Delete).
- **Why**: Easy to use with forms, built-in CSRF protection, and simple progressive enhancement.

### API Routes

- **Pattern**: Never use API routes (`/api/*`) for internal app logic.
- **Exception**: Only use if needed for external webhooks or third-party integrations.

---

## 2. Query Patterns with Drizzle ORM

Always use the Drizzle ORM APIs. Avoid raw SQL strings to maintain type safety and prevent injection.

### Eager Loading with Relations

Use the `with` syntax for readable and efficient joined queries.

```typescript
// Example: Fetching a workout with its exercises and sets
const workout = await db.query.workouts.findFirst({
  where: eq(workouts.id, id),
  with: {
    workoutExercises: {
      with: {
        sets: true,
        exercise: true,
      },
    },
  },
});
```

### TypeScript Return Types

Ensure that queries have predictable result types. Drizzle's `findMany` and `findFirst` are fully typed out of the box.

### Pagination

For list views (like workout history), always include limit and offset.

```typescript
const PAGE_SIZE = 10;
const page = 1;

const list = await db.query.workouts.findMany({
  limit: PAGE_SIZE,
  offset: (page - 1) * PAGE_SIZE,
  orderBy: [desc(workouts.date)],
});
```

---

## 3. Error Handling Pattern

Consistency in error reporting makes the client-side UI much easier to build.

### Server Action Response Format

All server actions should return a standardized object.

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWorkout(
  data: NewWorkout,
): Promise<ActionResponse<Workout>> {
  try {
    // DB logic...
    return { success: true, data: result };
  } catch (e) {
    console.error("Mutation Error:", e);
    return {
      success: false,
      error: "Failed to create workout. Please try again.",
    };
  }
}
```

---

## 4. Security & Auth Pattern

We use Clerk for identity but must manually ensure data isolation.

### The "Auth First" Check

Always call `auth()` at the top of every restricted action or component.

```typescript
export async function updateWorkout(id: string, data: UpdateWorkout) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Filter EVERY query by the owner's ID
  const [result] = await db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  if (!result) return { success: false, error: "Workout not found" };
  // ...
}
```

### Multitenancy

Every table that stores user data (Workouts, Exercises created by user, etc.) must have a `userId` column. **Never** trust a client-provided ID without verifying it against the authenticated session.
