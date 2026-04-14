import { describe, expect, it } from 'vitest';
import { bootstrap } from '../src/pricing/curves/bootstrap';
import { interpolateDF, zeroRate } from '../src/pricing/curves/interpolation';
import type { CurveDefinition } from '../src/pricing/curves/types';

function flatCurve(rate: number, tenors: Array<{ length: number; unit: 'Y' | 'M' }>): CurveDefinition {
  return {
    id: 'FLAT', name: 'FLAT', currency: 'USD', purpose: 'DISCOUNT', index: 'USD-SOFR',
    valuationDate: '2025-01-02',
    interpolation: 'LOG_LINEAR_DF',
    instruments: tenors.map((t) => ({
      kind: 'OIS', tenor: t, rate, dayCount: 'ACT/360',
    })),
  };
}

describe('Bootstrap — flat-rate consistency', () => {
  it('recovers a single 1Y pillar exactly for a flat par swap', () => {
    const rate = 0.04;
    const c = bootstrap(flatCurve(rate, [{ length: 1, unit: 'Y' }]));
    expect(c.pillars.length).toBe(1);
    const pillar = c.pillars[0];
    // For a 1Y par swap on annual pay: DF(1) = 1 / (1 + r)
    expect(pillar.df).toBeCloseTo(1 / (1 + rate), 6);
  });

  it('produces monotone DFs for a non-integer maturity (2.5Y)', () => {
    const c = bootstrap(flatCurve(0.04, [
      { length: 1, unit: 'Y' },
      { length: 30, unit: 'M' }, // 2.5Y
      { length: 5, unit: 'Y' },
    ]));
    for (let i = 1; i < c.pillars.length; i++) {
      expect(c.pillars[i].df).toBeLessThan(c.pillars[i - 1].df);
    }
  });

  it('recovered zero rate is consistent across tenors on a flat curve', () => {
    const rate = 0.03;
    const c = bootstrap(flatCurve(rate, [
      { length: 1, unit: 'Y' },
      { length: 2, unit: 'Y' },
      { length: 5, unit: 'Y' },
      { length: 10, unit: 'Y' },
    ]));
    const z1 = zeroRate(c, 1);
    const z2 = zeroRate(c, 2);
    const z10 = zeroRate(c, 10);
    // All should be within a few bp of each other on a truly flat par curve
    expect(Math.abs(z1 - z2)).toBeLessThan(0.0015);
    expect(Math.abs(z2 - z10)).toBeLessThan(0.0015);
  });

  it('interpolateDF is positive and < 1 for every interior time on a flat positive curve', () => {
    const c = bootstrap(flatCurve(0.05, [
      { length: 1, unit: 'Y' }, { length: 5, unit: 'Y' }, { length: 10, unit: 'Y' },
    ]));
    for (const t of [0.5, 1.5, 3, 7]) {
      const df = interpolateDF(c, t);
      expect(df).toBeGreaterThan(0);
      expect(df).toBeLessThan(1);
    }
  });
});
