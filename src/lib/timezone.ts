import { headers } from "next/headers";

/**
 * Detect the user's IANA timezone from the request.
 *
 * Priority:
 *   1. `x-vercel-ip-timezone` header (set by Vercel Edge)
 *   2. `x-timezone` custom header (can be set by middleware or client)
 *   3. Falls back to 'UTC'
 *
 * For client-side detection, you can set a cookie or header with
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` on first load.
 */
export async function getUserTimezone(): Promise<string> {
  const h = await headers();

  // Vercel automatically sets this header at the edge
  const vercelTz = h.get("x-vercel-ip-timezone");
  if (vercelTz) return vercelTz;

  // Custom header (set by middleware or client-side script)
  const customTz = h.get("x-timezone");
  if (customTz) return customTz;

  return "UTC";
}
