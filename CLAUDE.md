# LiftingDiary - Development Guidelines

Workout logging app. Next.js 14 (App Router), TypeScript, Tailwind + shadcn/ui, Clerk auth, Drizzle ORM + Neon Postgres.

## Key Patterns

### Server Components (Default)
- Fetch data in server components
- Use `'use client'` only for interactivity (forms, state, events)
- Pass data to client components via props

### File Structure
```
app/(dashboard)/       # Protected routes
  workouts/
    page.tsx          # List workouts
    [id]/page.tsx     # Workout detail
components/
  forms/              # Client components with 'use client'
  ui/                 # shadcn/ui components
lib/db/               # Drizzle schema & queries
```

### Database
- Drizzle ORM in `lib/db/`
- Queries in server components or co-located with logic
- Parameterized queries (Drizzle handles this)

### Forms
- Client components with `'use client'`
- shadcn/ui form components
- Server actions for mutations
- Validate on both client and server

### Components
- Follow shadcn/ui patterns
- Use `cn()` for conditional classes
- Single responsibility

## Before Making Changes
- Read existing code first
- Keep changes minimal and focused
- No unnecessary abstractions or utilities
- No verbose implementations
- Only add comments where logic isn't obvious
- Don't add error handling for impossible scenarios

