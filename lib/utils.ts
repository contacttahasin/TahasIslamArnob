import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic substitute for `Math.random()` — a pure function of `seed`,
 * so it's safe to call from render/useMemo (unlike `Math.random`, which
 * React's purity rules disallow there). Pass a distinct seed per value you
 * need (e.g. an index or `index * N + slot`) to avoid correlated output.
 */
export function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
