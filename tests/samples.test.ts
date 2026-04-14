import { describe, expect, it } from 'vitest';
import { Trade } from '../src/model/trade';
import { buildSampleTrades } from '../src/samples';

describe('curated sample trades', () => {
  const samples = buildSampleTrades();

  it('produces at least 11 samples (5 standard + 6 structured variants)', () => {
    expect(samples.length).toBeGreaterThanOrEqual(11);
  });

  it('every sample has a unique tradeId', () => {
    const ids = samples.map((t) => t.tradeHeader.tradeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every sample parses successfully through the Trade schema', () => {
    for (const sample of samples) {
      const result = Trade.safeParse(sample);
      if (!result.success) {
        throw new Error(
          `Sample ${sample.tradeHeader.tradeId} failed validation: ${result.error.toString()}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });

  it('includes one of each structured flavour variant', () => {
    const structuredFlavours = samples
      .filter((t) => t.product.productType === 'STRUCTURED_IRS')
      .map((t) => (t.product as Extract<typeof t.product, { productType: 'STRUCTURED_IRS' }>).flavour);
    for (const expected of [
      'AMORTIZING',
      'STEP_UP',
      'CMS_LINKED',
      'RANGE_ACCRUAL',
      'INVERSE_FLOATER',
      'QUANTO',
    ] as const) {
      expect(structuredFlavours).toContain(expected);
    }
  });
});
