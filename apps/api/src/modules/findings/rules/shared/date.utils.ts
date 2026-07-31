export function daysUntil(date: Date): number {
  const now = new Date();

  const diff = date.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
