'use client';

import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-background border-b border-border z-20">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-foreground">LiftingDiary</h1>
        </div>
        <div className="ml-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
