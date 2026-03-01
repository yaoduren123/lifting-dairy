# LiftingDiary Component Guidelines

This document outlines the patterns and best practices for creating components in the LiftingDiary project. Following these guidelines ensures consistency, maintainability, and high performance.

## 1. Component File Structure

All components should follow a standardized structure to keep the codebase predictable.

### Order of Content

1.  **Directives**: `'use client'` if necessary.
2.  **Imports**: Grouped by external libraries, internal utilities (`@/lib/utils`), UI components (`@/components/ui`), and then other local components.
3.  **TypeScript Types**: Props interfaces or types defined clearly.
4.  **Component Function**: Exported as a named export (preferred for internal components) or default export (standard for pages).
5.  **Sub-components or Constants**: Logic-specific constants like `navItems` or smaller helper components.

### Example

```tsx
"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn("p-4 transition-colors", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-sm font-medium">{label}</h3>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}
```

---

## 2. Server vs. Client Components

Next.js App Router defaults to Server Components. Use them whenever possible.

### Use Server Components for:

- **Data Fetching**: Directly querying the database using `db`.
- **Accessing Backend Resources**: Secrets, file systems, etc.
- **SEO & Speed**: Reducing the bundle size of the client.

### Use Client Components (`'use client'`) for:

- **Interactivity**: Using `onClick`, `onChange`, etc.
- **Hooks**: Using `useState`, `useEffect`, `usePathname`, or custom hooks.
- **Browser APIs**: Using `localStorage`, `window`, etc.

---

## 3. shadcn/ui Components

We use **shadcn/ui** for high-quality, accessible UI elements. These are located in `src/components/ui`.

### Installed Components

- `Badge`, `Button`, `Calendar`, `Card`, `Dialog`, `Form`, `Input`, `Label`, `Popover`, `Select`, `Separator`, `Table`, `Tabs`.

### Usage Pattern

Always import from `@/components/ui/[component-name]` and use the `cn` utility to override or extend styles.

```tsx
import { Button } from "@/components/ui/button";

// Use variants defined in the shadcn component
<Button variant="outline" size="lg" className="mt-4">
  Click Me
</Button>;
```

---

## 4. Prop Naming Conventions

- **Boolean Flags**: Use descriptive names like `isOpen`, `isLoading`, `asChild`.
- **Event Handlers**: Prefix with `on` (e.g., `onClick`, `onValueChange`).
- **Data Props**: Use plural for arrays (`items`, `workouts`) and specific names for singular objects (`workout`, `user`).
- **Style Overrides**: Use `className` to allow external styling via Tailwind.

---

## 5. Styling Guidelines

- **Tailwind Only**: Do not use inline styles or external CSS files unless absolutely necessary (like specific animation definitions in `globals.css`).
- **Class Merging**: Always use the `cn(...)` utility from `@/lib/utils` when combining base styles with conditional or prop-based classes.
- **Animations**: Utilize `animate-in`, `fade-in`, and `slide-in-*` utilities for transitions.
- **Theming**: Use the CSS variables defined in `globals.css` (e.g., `text-foreground`, `bg-card`, `text-primary`).
- **Fonts**: Use the configured Barlow fonts via CSS variables:
  - `font-[family-name:var(--font-barlow)]` (Body)
  - `font-[family-name:var(--font-barlow-condensed)]` (Headings/Stats)

### Formatting Best Practice

Keep Tailwind classes organized. For complex components, use `class-variance-authority` (CVA) to manage state-based styling as seen in `src/components/ui/button.tsx`.
