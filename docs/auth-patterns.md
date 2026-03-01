# LiftingDiary Authentication Patterns

This document defines how we handle authentication and authorization in the LiftingDiary project using Clerk and Next.js App Router.

## 1. Clerk & Next.js App Router Integration

At the easiest level, identity is managed by Clerk. We integrate it into the Next.js App Router via middleware, which acts as the first line of defense.

### The Middleware (`src/middleware.ts`)

We use `clerkMiddleware` from `@clerk/nextjs/server` to intercept requests. Our application is structurally protected by default. We explicitly define public routes (like authentication pages) using `createRouteMatcher`.

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define explicitly which routes are public
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is not public, enforce authentication
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Custom logic (like timezone cookie passing) continues here...
});
```

`auth.protect()` automatically handles unauthorized access at the network boundary.

---

## 2. Protecting Server Components

When fetching data or rendering private pages via Server Components, we verify the user is signed in to render user-specific data using `auth()`.

### Pattern: `auth()` with Redirect

Always retrieve the user ID early, and redirect if they somehow bypass middleware or the session expires inside a Server Component:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Extract the user identity directly from Clerk
  const { userId } = await auth();

  // Handle unauthenticated requests with a redirect to sign in
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch or process data with the security guarantee that user exists
  // ...
}
```

---

## 3. Protecting Server Actions

Mutations (creates, updates, deletes) use Server Actions. Because Server Actions are publicly exposed endpoints under the hood, they **MUST** handle security explicitly on every call.

### Pattern: `auth()` with Thrown Error

Unlike page components which can redirect smoothly, Server Actions should fail firmly with an Error or a structured failure payload.

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";

export async function createWorkout(data: any) {
  // First line of defense in the action
  const { userId } = await auth();

  // Handle unauthenticated request by throwing an error or returning structured error
  if (!userId) {
    throw new Error(
      "Unauthorized: You must be signed in to perform this action.",
    );
    // Alternatively for forms: return { success: false, error: "Unauthorized" };
  }

  // Continue with DB mutation...
}
```

---

## 4. Getting the `clerkUserId` and Local Database User

Clerk provides identity (`clerkUserId`), but our database (Drizzle) maintains local relational constraints (e.g., tying workouts to a user).

When you call `const { userId } = await auth()`, `userId` **is the Clerk User ID** (string formatted like `user_2...`). We must map it to our internal database user.

### Pattern: Map `clerkUserId` to Internal DB ID

```tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserData() {
  // 1. Get Clerk User ID
  const { userId } = await auth();

  // 2. Find the local database user record matching the Clerk ID
  let [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId));

  // 3. Example handling: ensure record exists
  if (!dbUser) {
    // Optionally create it, or error
    [dbUser] = await db
      .insert(users)
      .values({ clerkUserId: userId })
      .returning();
  }

  // 4. Use `dbUser.id` (our internal auto-incrementing integer) for all foreign keys (workouts, exercises)
  return dbUser.id;
}
```

Never store Clerk's `user_xxxx` directly as a foreign key on standard transaction tables; use it exclusively on the `users` table to identify authentication, extracting your internal numerical ID for relations.

---

## 5. Handling Unauthenticated Requests (Summary)

Depending on the context where the unauthenticated request occurs, follow this strategy:

| Context               | Action / Result                           | How                                                       |
| --------------------- | ----------------------------------------- | --------------------------------------------------------- |
| **Middleware**        | Blocks access -> Redirects to Clerk       | `await auth.protect()`                                    |
| **Server Components** | Soft block -> Redirect to sign-in page    | `if (!userId) redirect('/sign-in')`                       |
| **Server Actions**    | Hard block -> Throw Error / Return struct | `if (!userId) throw new Error("Unauthorized")`            |
| **Client Components** | Hide elements / Show fallback             | `const { userId } = useAuth(); if (!userId) return null;` |
