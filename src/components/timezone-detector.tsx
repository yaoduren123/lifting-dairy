'use client';

import { useEffect } from 'react';

/**
 * Sets a `timezone` cookie with the user's IANA timezone on mount.
 * This runs once on the client and is picked up by middleware
 * to forward as `x-timezone` header for server components.
 *
 * Place in the root layout so it runs on every page.
 */
export function TimezoneDetector() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Only set if not already present (avoids unnecessary cookie writes)
    if (!document.cookie.includes('timezone=')) {
      document.cookie = `timezone=${tz};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    }
  }, []);

  return null;
}
