import React from 'react';
import type { Trade } from '../../model/trade';
import type { Ndirs } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusYears } from './_stubs';

export function ndirsSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 3);
  const product: Ndirs = {
    productType: 'NDIRS',
    settlementCurrency: 'USD',
    fxFixing: { fixingSource: 'BRL.PTAX', fixingOffsetDays: 2, settlementCurrency: 'USD' },
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'PAY',
        notional: { initial: 50_000_000, steps: [], currency: 'BRL' },
        fixedRate: 0.115, rateSteps: [], dayCountFraction: 'BUS/252',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'RECEIVE',
        notional: { initial: 50_000_000, steps: [], currency: 'BRL' },
        floatingRateIndex: 'BRL-CDI', indexTenor: { length: 1, unit: 'D' },
        spread: 0, dayCountFraction: 'BUS/252',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 1, unit: 'D' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 0 },
        compoundingMethod: 'OIS_COMPOUNDED',
        fxFixing: { fixingSource: 'BRL.PTAX', fixingOffsetDays: 2, settlementCurrency: 'USD' },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_EM', trader: 'EMTRADER' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'EM Counterparty', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function NdirsForm(props: ProductFormProps) {
  return <JsonEditorForm {...props} newSample={ndirsSample} />;
}

registerProductForm({
  productType: 'NDIRS',
  label: 'Non-Deliverable IRS',
  group: 'SWAPS',
  description: 'NDIRS settled in hard currency (e.g. BRL/USD, INR/USD).',
  Form: NdirsForm,
  newSample: ndirsSample,
});
