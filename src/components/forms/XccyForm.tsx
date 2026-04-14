import React from 'react';
import type { Trade } from '../../model/trade';
import type { XccySwap } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function xccySample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 5);
  const product: XccySwap = {
    productType: 'XCCY', mtmResettable: false, initialFxRate: 1.08,
    exchangeInitialNotional: true, exchangeFinalNotional: true,
    legs: [
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: { initial: 10_000_000, steps: [], currency: 'USD' },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: true, finalExchange: true, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'RECEIVE',
        notional: { initial: 9_259_259.26, steps: [], currency: 'EUR' }, // ~USD/EUR 1.08
        floatingRateIndex: 'EUR-ESTR', indexTenor: { length: 3, unit: 'M' }, spread: -0.0015,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: true, finalExchange: true, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_XCCY', trader: 'XCCYTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Global Bank', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function XccyForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={xccySample} />; }

registerProductForm({
  productType: 'XCCY',
  label: 'Cross-Currency Swap',
  group: 'XCCY',
  description: 'Vanilla cross-currency swap with optional MtM resets.',
  Form: XccyForm,
  newSample: xccySample,
});
