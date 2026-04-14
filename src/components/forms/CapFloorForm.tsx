import React from 'react';
import type { Trade } from '../../model/trade';
import type { CapFloor } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function capFloorSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 3);
  const product: CapFloor = {
    productType: 'CAP_FLOOR', capOrFloor: 'CAP', buySell: 'BUY',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    strike: 0.055, floatingIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' },
    calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
    paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
    dayCountFraction: 'ACT/360',
    premium: { amount: 75_000, currency: 'USD' },
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_VOLS', trader: 'VOLTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Corp Hedger', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function CapFloorForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={capFloorSample} />; }

registerProductForm({
  productType: 'CAP_FLOOR',
  label: 'Cap / Floor / Collar',
  group: 'OPTIONS',
  description: 'Interest rate cap, floor or collar.',
  Form: CapFloorForm,
  newSample: capFloorSample,
});
