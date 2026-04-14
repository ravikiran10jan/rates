import { describe, expect, it } from 'vitest';
import { bootstrap } from '../src/pricing/curves/bootstrap';
import { priceFixedLeg, priceFloatingLeg } from '../src/pricing/pricers';
import type { CurveDefinition } from '../src/pricing/curves/types';
import type { FixedLeg, FloatingLeg } from '../src/model/common';

const valuationDate = '2025-01-02';

const flatUSD = (): CurveDefinition => ({
  id: 'FLAT-USD', name: 'FLAT USD', currency: 'USD', purpose: 'DISCOUNT', index: 'USD-SOFR',
  valuationDate, interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'OIS', tenor: { length: 1, unit: 'Y' }, rate: 0.04, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 5, unit: 'Y' }, rate: 0.04, dayCount: 'ACT/360' },
  ],
});

function baseFixed(): FixedLeg {
  return {
    legType: 'FIXED', payerReceiver: 'RECEIVE',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    fixedRate: 0.04, rateSteps: [], dayCountFraction: '30/360',
    calculationPeriodDates: {
      effectiveDate: '2025-01-02', terminationDate: '2030-01-02',
      calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
      businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
    },
    paymentDates: {
      paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
      payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
    },
    initialExchange: false, finalExchange: false, intermediateExchanges: false,
  };
}

function baseFloat(): FloatingLeg {
  return {
    legType: 'FLOATING', payerReceiver: 'RECEIVE',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
    dayCountFraction: 'ACT/360',
    calculationPeriodDates: {
      effectiveDate: '2025-01-02', terminationDate: '2030-01-02',
      calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
    },
    paymentDates: {
      paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
    },
    resetDates: {
      resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2,
    },
    compoundingMethod: 'NONE',
    initialExchange: false, finalExchange: false, intermediateExchanges: false,
  };
}

describe('Leg notional exchange contributes to PV', () => {
  it('fixed leg with initial+final exchange has different PV than without', () => {
    const curve = bootstrap(flatUSD());
    const plain = priceFixedLeg(baseFixed(), valuationDate, curve);
    const withExch = priceFixedLeg({ ...baseFixed(), initialExchange: true, finalExchange: true }, valuationDate, curve);
    expect(withExch.pv).not.toBe(plain.pv);
    // Must include the final-notional flow
    expect(withExch.flows.length).toBe(plain.flows.length + 2);
  });

  it('floating leg with final exchange adds one flow', () => {
    const curve = bootstrap(flatUSD());
    const plain = priceFloatingLeg(baseFloat(), valuationDate, curve, curve);
    const withFinal = priceFloatingLeg({ ...baseFloat(), finalExchange: true }, valuationDate, curve, curve);
    expect(withFinal.flows.length).toBe(plain.flows.length + 1);
    expect(withFinal.pv).not.toBe(plain.pv);
  });
});
