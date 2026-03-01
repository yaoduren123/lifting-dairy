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

## Documentation
Before generating code, check these docs:
- `docs/component-guidelines.md` — Component structure and patterns
- `docs/database-patterns.md` — Drizzle ORM query patterns
- `docs/naming-conventions.md` — File and variable naming
- `docs/error-handling.md` — Error handling patterns
- `docs/data-fetching-patterns.md` — Data fetching and mutation patterns

## Git Conventions
- Use conventional commits: feat:, fix:, refactor:, docs:, test:
- First line: imperative mood, under 72 characters
- Body: explain WHY, not WHAT (the diff shows WHAT)
- Always stage specific files, never use `git add -A` blindly

## Git Safety Rules
- NEVER force push to main or develop
- NEVER use `git reset --hard` without asking first
- NEVER amend published commits
- Always create a new branch for features
- Always create PRs, never push directly to main