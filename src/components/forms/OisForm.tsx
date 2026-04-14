import React from 'react';
import type { Trade } from '../../model/trade';
import type { Ois } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function oisSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 2);
  const product: Ois = {
    productType: 'OIS',
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'RECEIVE',
        notional: { initial: 25_000_000, steps: [], currency: 'USD' },
        fixedRate: 0.047, rateSteps: [], dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: { initial: 25_000_000, steps: [], currency: 'USD' },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 1, unit: 'D' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        resetDates: { resetFrequency: { period: { length: 1, unit: 'D' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 0 },
        compoundingMethod: 'OIS_COMPOUNDED',
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_USD', trader: 'JDOE' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'ACME Corp', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function OisForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={oisSample} />; }

registerProductForm({
  productType: 'OIS',
  label: 'Overnight Index Swap',
  group: 'SWAPS',
  description: 'OIS: Fixed vs compounded overnight RFR (SOFR, ESTR, SONIA, TONA, SARON).',
  Form: OisForm,
  newSample: oisSample,
});
