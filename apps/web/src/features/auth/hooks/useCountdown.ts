import { useState, useEffect } from 'react';

export function useCountdown(expiresAt?: Date | null): string {
  const [ms, setMs] = useState<number>(() => {
    if (!expiresAt) return 24 * 60 * 60 * 1000;
    return Math.max(0, expiresAt.getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) return;
    setMs(Math.max(0, expiresAt.getTime() - Date.now()));

    const id = setInterval(() => {
      setMs(Math.max(0, expiresAt.getTime() - Date.now()));
    }, 15000);

    return () => clearInterval(id);
  }, [expiresAt]);

  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
