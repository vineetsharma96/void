/**
 * Deterministic PRNG using Mulberry32 algorithm.
 * Generates uniform, high-entropy pseudo-random numbers in [0, 1) from an integer seed.
 */
export function createPRNG(seed: number) {
  let state = seed | 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a random float between min and max based on an integer seed and index.
 */
export function seededRandom(seed: number, index: number = 0): number {
  const prng = createPRNG(seed + index * 1013);
  return prng();
}

/**
 * Returns a random float in [min, max).
 */
export function seededRange(seed: number, min: number, max: number, index: number = 0): number {
  return min + seededRandom(seed, index) * (max - min);
}
