// Domain validation & normalisation utilities for Guest Feature

export const DOMAIN_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Tests a pre-normalised domain string (no protocol, no path)
 */
export const isValidDomain = (v: string): boolean => DOMAIN_RE.test(v.trim());

/**
 * Strips protocol prefix, path, query, fragment, then lowercases.
 * Called before validation and submission so the machine always receives a clean, lowercase domain.
 */
export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();

  // Strip protocol (http:// or https://)
  d = d.replace(/^https?:\/\//i, "");

  // Strip everything from the first path separator onward
  const slash = d.indexOf("/");
  if (slash !== -1) d = d.slice(0, slash);

  // Strip query string
  const q = d.indexOf("?");
  if (q !== -1) d = d.slice(0, q);

  // Strip fragment
  const hash = d.indexOf("#");
  if (hash !== -1) d = d.slice(0, hash);

  // Strip trailing dot
  return d.replace(/\.$/, "");
}
