/**
 * @file seededRandom.ts
 * A simple seeded pseudo-random number generator (PRNG).
 */
export class SeededRandom {
  private seed: number;
  private spareNormal: number | null = null;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) {
      this.seed += 2147483646;
    }
  }

  /**
   * Returns a pseudo-random value between 0 (inclusive) and 1 (exclusive).
   */
  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Returns a pseudo-random value from a standard normal distribution.
   */
  public nextNormal(): number {
    if (this.spareNormal !== null) {
      const val = this.spareNormal;
      this.spareNormal = null;
      return val;
    }

    let u, v, s;
    do {
      u = this.next() * 2 - 1; // Converts [0,1) to [-1,1)
      v = this.next() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);

    const mul = Math.sqrt(-2.0 * Math.log(s) / s);
    this.spareNormal = v * mul;
    return u * mul;
  }
}