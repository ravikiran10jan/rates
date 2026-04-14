import React from 'react';
import type { Trade } from '../../model/trade';
import type { NdXccy } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function ndXccySample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 3);
  const product: NdXccy = {
    productType: 'ND_XCCY', nonDeliverableLegIndex: 1,
    settlementCurrency: 'USD', initialFxRate: 83.25,
    fxFixing: { fixingSource: 'INR.RBIB', fixingOffsetDays: 2, settlementCurrency: 'USD' },
    exchangeInitialNotional: false, exchangeFinalNotional: false,
    legs: [
      {
        legType: 'FLOATING', payerReceiver: 'RECEIVE',
        notional: { initial: 10_000_000, steps: [], currency: 'USD' },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FIXED', payerReceiver: 'PAY',
        notional: { initial: 832_500_000, steps: [], currency: 'INR' },
        fixedRate: 0.0725, rateSteps: [], dayCountFraction: 'ACT/365.FIXED',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_EM', trader: 'EMTRADER' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'India Co', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function NdXccyForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={ndXccySample} />; }

registerProductForm({
  productType: 'ND_XCCY',
  label: 'Non-Deliverable XCCY',
  group: 'XCCY',
  description: 'Cross-currency swap settled in a hard currency (e.g. INR/USD).',
  Form: NdXccyForm,
  newSample: ndXccySample,
});
