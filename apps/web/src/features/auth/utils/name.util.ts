/**
 * Extracts a human-friendly first name from a user's full name.
 * Used for FMX greeting ("Hi Swasthik, what are you trying to understand today?").
 *
 * @param fullName Full name of the user (e.g. "Swasthik K J")
 * @returns First name (e.g. "Swasthik") or "there" fallback
 */
export function getGreetingName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) {
    return 'there';
  }
  const trimmed = fullName.trim();
  const firstName = trimmed.split(/\s+/)[0];
  return firstName || 'there';
}
