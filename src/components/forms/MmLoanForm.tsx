import React from 'react';
import type { Trade } from '../../model/trade';
import type { MmLoan } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusMonths } from './_stubs';

export function mmLoanSample(): Trade {
  const id = newTradeId();
  const start = today(0);
  const maturity = plusMonths(start, 6);
  const product: MmLoan = {
    productType: 'MM_LOAN', direction: 'PAY',
    notional: { amount: 2_500_000, currency: 'USD' },
    startDate: start, maturityDate: maturity,
    rate: 0.055, rateType: 'FIXED', spread: 0,
    dayCountFraction: 'ACT/360',
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'TREASURY', trader: 'TRSTDR' },
    parties: [{ id: 'BOOK', name: 'Treasury', role: 'BOOK' }, { id: 'CPTY', name: 'Lender Bank', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function MmLoanForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={mmLoanSample} />; }

registerProductForm({
  productType: 'MM_LOAN',
  label: 'MM Loan (borrowing)',
  group: 'MM',
  description: 'Money market loan (borrowing cash).',
  Form: MmLoanForm,
  newSample: mmLoanSample,
});
