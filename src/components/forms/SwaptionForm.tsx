import React from 'react';
import type { Trade } from '../../model/trade';
import type { Swaption } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';
import { vanillaIrsSample } from './VanillaIrsForm';

export function swaptionSample(): Trade {
  const id = newTradeId();
  const exerciseDate = plusYears(today(), 1);
  // Forward-starting underlying IRS: 5y swap starting in 1y.
  const under = vanillaIrsSample();
  // Adjust underlying dates
  const eff = exerciseDate;
  const mat = plusYears(eff, 5);
  const base = under.product as Extract<typeof under.product, { productType: 'VANILLA_IRS' }>;
  const forwardStart = {
    productType: 'VANILLA_IRS' as const,
    legs: [
      { ...base.legs[0], calculationPeriodDates: { ...base.legs[0].calculationPeriodDates, effectiveDate: eff, terminationDate: mat } },
      { ...base.legs[1], calculationPeriodDates: { ...base.legs[1].calculationPeriodDates, effectiveDate: eff, terminationDate: mat } },
    ] as typeof base.legs,
  };
  const product: Swaption = {
    productType: 'SWAPTION', buySell: 'BUY', optionType: 'PAYER', exerciseStyle: 'EUROPEAN',
    exerciseDates: [exerciseDate], settlementType: 'PHYSICAL',
    premium: { amount: 125_000, currency: 'USD' }, premiumPaymentDate: today(2),
    underlyingSwap: forwardStart,
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_VOLS', trader: 'VOLTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Vol Fund', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function SwaptionForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={swaptionSample} />; }

registerProductForm({
  productType: 'SWAPTION',
  label: 'Swaption',
  group: 'OPTIONS',
  description: 'European/Bermudan/American payer or receiver swaption.',
  Form: SwaptionForm,
  newSample: swaptionSample,
});
