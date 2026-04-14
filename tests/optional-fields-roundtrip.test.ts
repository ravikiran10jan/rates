import { describe, expect, it } from 'vitest';
import { tradeToXml } from '../src/transform/jsonToXml';
import { xmlToTrade } from '../src/transform/xmlToJson';
import { vanillaIrsSample } from '../src/components/forms/VanillaIrsForm';
import { capFloorSample } from '../src/components/forms/CapFloorForm';
import type { FloatingLeg } from '../src/model/common';
import type { Trade } from '../src/model/trade';
import type { CapFloor, VanillaIrs } from '../src/model/products';

describe('JSON↔XML round-trip preserves optional fields', () => {
  it('preserves leg.capRate, leg.floorRate and leg.fxFixing when present', () => {
    const base = vanillaIrsSample();
    const product = base.product as VanillaIrs;
    const originalFloat = product.legs[1] as FloatingLeg;
    const float: FloatingLeg = {
      ...originalFloat,
      capRate: 0.06,
      floorRate: 0.01,
      fxFixing: {
        fixingSource: 'USD.FED',
        fixingOffsetDays: 2,
        settlementCurrency: 'USD',
      },
    };
    const trade: Trade = {
      ...base,
      tradeHeader: { ...base.tradeHeader, portfolio: 'RATES-BOOK-01' },
      product: { productType: 'VANILLA_IRS', legs: [product.legs[0], float] },
    };

    const xml = tradeToXml(trade);
    const back = xmlToTrade(xml);

    expect(back).toEqual(trade);
    const backProduct = back.product as VanillaIrs;
    const backFloat = backProduct.legs[1] as FloatingLeg;
    expect(backFloat.capRate).toBe(0.06);
    expect(backFloat.floorRate).toBe(0.01);
    expect(backFloat.fxFixing?.fixingSource).toBe('USD.FED');
    expect(back.tradeHeader.portfolio).toBe('RATES-BOOK-01');
  });

  it('preserves CAP_FLOOR.floorStrike and premium when present (collar)', () => {
    const base = capFloorSample();
    const product = base.product as CapFloor;
    const trade: Trade = {
      ...base,
      product: {
        ...product,
        capOrFloor: 'COLLAR',
        floorStrike: 0.02,
        premium: { amount: 150_000, currency: product.notional.currency },
      },
    };
    const xml = tradeToXml(trade);
    const back = xmlToTrade(xml);
    expect(back).toEqual(trade);
  });
});
