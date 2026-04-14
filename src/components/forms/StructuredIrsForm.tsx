import React from 'react';
import type { Trade } from '../../model/trade';
import type { StructuredIrs } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function structuredIrsSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 10);
  const product: StructuredIrs = {
    productType: 'STRUCTURED_IRS', flavour: 'CALLABLE_BERMUDAN',
    exerciseSchedule: {
      style: 'BERMUDAN',
      exerciseDates: Array.from({ length: 9 }, (_, i) => plusYears(eff, i + 1)),
      notificationOffsetDays: 5, partyLong: 'PARTY_B',
    },
    features: [],
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'RECEIVE',
        notional: {
          initial: 50_000_000,
          steps: Array.from({ length: 9 }, (_, i) => ({ date: plusYears(eff, i + 1), notional: 50_000_000 - (i + 1) * 4_000_000 })),
          currency: 'USD',
        },
        fixedRate: 0.045, rateSteps: [], dayCountFraction: '30/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: {
          initial: 50_000_000,
          steps: Array.from({ length: 9 }, (_, i) => ({ date: plusYears(eff, i + 1), notional: 50_000_000 - (i + 1) * 4_000_000 })),
          currency: 'USD',
        },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_EXOTICS', trader: 'EXOTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Structured Counterparty', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function StructuredIrsForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={structuredIrsSample} />; }

registerProductForm({
  productType: 'STRUCTURED_IRS',
  label: 'Structured IRS',
  group: 'STRUCTURED',
  description: 'Amortizing, step-up, callable/Bermudan, CMS, range accrual, inverse floater, quanto.',
  Form: StructuredIrsForm,
  newSample: structuredIrsSample,
});
