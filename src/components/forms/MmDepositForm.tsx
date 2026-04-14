import React from 'react';
import type { Trade } from '../../model/trade';
import type { MmDeposit } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusMonths } from './_stubs';

export function mmDepositSample(): Trade {
  const id = newTradeId();
  const start = today(0);
  const maturity = plusMonths(start, 3);
  const product: MmDeposit = {
    productType: 'MM_DEPOSIT', direction: 'RECEIVE',
    notional: { amount: 5_000_000, currency: 'USD' },
    startDate: start, maturityDate: maturity,
    rate: 0.053, dayCountFraction: 'ACT/360',
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'TREASURY', trader: 'TRSTDR' },
    parties: [{ id: 'BOOK', name: 'Treasury', role: 'BOOK' }, { id: 'CPTY', name: 'Money Market Counterparty', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function MmDepositForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={mmDepositSample} />; }

registerProductForm({
  productType: 'MM_DEPOSIT',
  label: 'MM Deposit (lending)',
  group: 'MM',
  description: 'Money market deposit (placing cash at fixed rate).',
  Form: MmDepositForm,
  newSample: mmDepositSample,
});
