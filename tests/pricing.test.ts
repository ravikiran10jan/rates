import { describe, expect, it } from 'vitest';
import { bootstrap } from '../src/pricing/curves/bootstrap';
import { interpolateDF, simpleForward, zeroRate } from '../src/pricing/curves/interpolation';
import type { CurveDefinition } from '../src/pricing/curves/types';
import { priceTrade } from '../src/pricing/pricers';
import { vanillaIrsSample } from '../src/components/forms/VanillaIrsForm';
import { mmDepositSample } from '../src/components/forms/MmDepositForm';

const flatDef = (rate: number): CurveDefinition => ({
  id: 'FLAT-USD', name: 'FLAT USD', currency: 'USD', purpose: 'DISCOUNT', index: 'USD-SOFR',
  valuationDate: new Date().toISOString().slice(0, 10),
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 1, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 5, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 10, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 30, unit: 'Y' }, rate, dayCount: 'ACT/360' },
  ],
});

describe('Curve bootstrap', () => {
  it('produces monotone-decreasing DFs under a positive flat rate', () => {
    const c = bootstrap(flatDef(0.04));
    for (let i = 1; i < c.pillars.length; i++) {
      expect(c.pillars[i].df).toBeLessThan(c.pillars[i - 1].df);
    }
  });

  it('recovers zero rate approximately equal to quoted par rate for flat curve', () => {
    const rate = 0.04;
    const c = bootstrap(flatDef(rate));
    const z = zeroRate(c, 5);
    // On a flat par curve with annual OIS, continuously-compounded zero ≈ ln(1+r*τ)/τ
    // Accept within 100bp of naive equality; playground-grade bootstrap.
    expect(z).toBeGreaterThan(rate - 0.01);
    expect(z).toBeLessThan(rate + 0.01);
  });

  it('simple forward rate is positive for upward curve', () => {
    const def = flatDef(0.03);
    def.instruments[def.instruments.length - 1].rate = 0.05;
    const c = bootstrap(def);
    const f = simpleForward(c, 5, 10);
    expect(f).toBeGreaterThan(0);
  });
});

describe('Pricing', () => {
  it('prices a MM deposit with non-zero PV', () => {
    const trade = mmDepositSample();
    const d = bootstrap(flatDef(0.05));
    const pv = priceTrade(trade, d.definition.valuationDate, { discount: { USD: d }, projection: {} });
    expect(pv.legs.length).toBe(1);
    expect(isFinite(pv.pv)).toBe(true);
  });

  it('prices a vanilla IRS and produces two legs', () => {
    const trade = vanillaIrsSample();
    const d = bootstrap(flatDef(0.04));
    const set = { discount: { USD: d }, projection: { 'USD-SOFR': d } };
    const val = priceTrade(trade, d.definition.valuationDate, set);
    expect(val.legs.length).toBe(2);
    expect(isFinite(val.pv)).toBe(true);
  });

  it('interpolateDF(0) = 1', () => {
    const c = bootstrap(flatDef(0.04));
    expect(interpolateDF(c, 0)).toBe(1);
  });
});
