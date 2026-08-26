import { useState, useEffect, useCallback } from 'react';
import type { MotionPreference } from '../features/settings/contracts/preferences.contract';

export const MOTION_STORAGE_KEY = 'nebula-motion';
export const MOTION_CHANGE_EVENT = 'nebula-motion-change';

export function getStoredMotion(): MotionPreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(MOTION_STORAGE_KEY);
    return v === 'standard' || v === 'reduced' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function applyMotionToDOM(isReduced: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-reduced-motion', isReduced ? 'true' : 'false');
  document.documentElement.classList.toggle('reduced-motion', isReduced);
}

export interface UseMotionReturn {
  isReduced: boolean;
  motion: MotionPreference;
  setMotion: (m: MotionPreference) => void;
}

export function useMotion(): UseMotionReturn {
  const [motion, setMotionState] = useState<MotionPreference>(getStoredMotion);
  const [systemReduced, setSystemReduced] = useState<boolean>(getSystemReducedMotion);

  const isReduced: boolean = motion === 'system' ? systemReduced : motion === 'reduced';

  useEffect(() => {
    applyMotionToDOM(isReduced);
  }, [isReduced]);

  const setMotion = useCallback((newMotion: MotionPreference) => {
    setMotionState(newMotion);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MOTION_STORAGE_KEY, newMotion);
      } catch {
        // Storage access may fail in restricted/sandboxed iframe contexts
      }
      const effectiveReduced = newMotion === 'system' ? getSystemReducedMotion() : newMotion === 'reduced';
      applyMotionToDOM(effectiveReduced);
      window.dispatchEvent(
        new CustomEvent(MOTION_CHANGE_EVENT, {
          detail: { motion: newMotion, isReduced: effectiveReduced },
        })
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMotionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ motion: MotionPreference }>;
      if (customEvent.detail && customEvent.detail.motion) {
        setMotionState(customEvent.detail.motion);
      } else {
        setMotionState(getStoredMotion());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === MOTION_STORAGE_KEY) {
        setMotionState(getStoredMotion());
      }
    };

    window.addEventListener(MOTION_CHANGE_EVENT, handleMotionChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, handleMotionChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemReduced(e.matches);
      if (motion === 'system') {
        applyMotionToDOM(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [motion]);

  return { isReduced, motion, setMotion };
}
