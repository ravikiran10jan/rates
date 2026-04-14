import React from 'react';
import type { Trade } from '../../model/trade';
import type { Fra } from '../../model/products';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { JsonEditorForm, newTradeId, today, plusMonths } from './_stubs';

export function fraSample(): Trade {
  const id = newTradeId();
  const trade = today();
  const effective = plusMonths(today(), 3);
  const termination = plusMonths(effective, 3);
  const product: Fra = {
    productType: 'FRA', buySell: 'BUY',
    notional: { amount: 10_000_000, currency: 'USD' },
    fixedRate: 0.05, floatingIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' },
    tradeDate: trade, effectiveDate: effective, terminationDate: termination,
    fixingDate: effective, paymentDate: effective,
    dayCountFraction: 'ACT/360', discountMethod: 'ISDA',
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: trade, status: 'DRAFT', book: 'RATES_USD', trader: 'JDOE' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Hedge Fund', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function FraForm(props: ProductFormProps) { return <JsonEditorForm {...props} newSample={fraSample} />; }

registerProductForm({
  productType: 'FRA',
  label: 'Forward Rate Agreement',
  group: 'SWAPS',
  description: 'Forward rate agreement (FRA).',
  Form: FraForm,
  newSample: fraSample,
});
