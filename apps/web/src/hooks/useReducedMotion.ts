import { useMotion } from './useMotion';

export function useReducedMotion(): boolean {
  const { isReduced } = useMotion();
  return isReduced;
}
