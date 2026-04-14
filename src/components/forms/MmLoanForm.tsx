import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { MmLoan } from '../../model/products';
import { Currency, DayCountFraction, FloatingIndex, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusMonths } from './_stubs';

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

export function MmLoanForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'MM_LOAN') ? initial : mmLoanSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as MmLoan;

  const setProduct = (patch: Partial<MmLoan>) => setTrade((t) => ({
    ...t,
    product: { ...product, ...patch },
  }));

  return (
    <div className="text-sm">
      <Section title="Trade Header">
        <Row><label>Trade ID</label><TextInput value={trade.tradeHeader.tradeId} onChange={(v) => setTrade((t) => ({ ...t, tradeHeader: { ...t.tradeHeader, tradeId: v } }))} /></Row>
        <Row><label>Trade Date</label><DateInput value={trade.tradeHeader.tradeDate} onChange={(v) => setTrade((t) => ({ ...t, tradeHeader: { ...t.tradeHeader, tradeDate: v } }))} /></Row>
        <Row><label>Book</label><TextInput value={trade.tradeHeader.book} onChange={(v) => setTrade((t) => ({ ...t, tradeHeader: { ...t.tradeHeader, book: v } }))} /></Row>
        <Row><label>Trader</label><TextInput value={trade.tradeHeader.trader} onChange={(v) => setTrade((t) => ({ ...t, tradeHeader: { ...t.tradeHeader, trader: v } }))} /></Row>
        <Row><label>Counterparty</label><TextInput value={trade.parties[1]?.name ?? ''} onChange={(v) => setTrade((t) => ({ ...t, parties: [t.parties[0], { ...t.parties[1], name: v }, ...t.parties.slice(2)] }))} /></Row>
        <Row><label>Status</label><Select value={trade.tradeHeader.status} onChange={(v) => setTrade((t) => ({ ...t, tradeHeader: { ...t.tradeHeader, status: v } }))} options={TradeStatus.options} /></Row>
      </Section>

      <Section title="Loan Economics">
        <Row><label>Direction</label><Select value={product.direction} onChange={(v) => setProduct({ direction: v })} options={PayerReceiver.options} /></Row>
        <Row><label>Notional</label><NumInput value={product.notional.amount} onChange={(v) => setProduct({ notional: { ...product.notional, amount: v } })} /></Row>
        <Row><label>Currency</label><Select value={product.notional.currency} onChange={(v) => setProduct({ notional: { ...product.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Start Date</label><DateInput value={product.startDate} onChange={(v) => setProduct({ startDate: v })} /></Row>
        <Row><label>Maturity Date</label><DateInput value={product.maturityDate} onChange={(v) => setProduct({ maturityDate: v })} /></Row>
        <Row><label>Rate Type</label><Select value={product.rateType} onChange={(v) => setProduct({ rateType: v, floatingIndex: v === 'FLOATING' ? (product.floatingIndex ?? 'USD-SOFR') : undefined })} options={['FIXED', 'FLOATING'] as const} /></Row>
        <Row><label>Rate (bps)</label><NumInput value={product.rate * 10000} onChange={(v) => setProduct({ rate: v / 10000 })} /></Row>
        {product.rateType === 'FLOATING' && (
          <Row><label>Floating Index</label><Select value={product.floatingIndex ?? 'USD-SOFR'} onChange={(v) => setProduct({ floatingIndex: v })} options={FloatingIndex.options} /></Row>
        )}
        <Row><label>Spread (bps)</label><NumInput value={product.spread * 10000} onChange={(v) => setProduct({ spread: v / 10000 })} /></Row>
        <Row><label>Day Count</label><Select value={product.dayCountFraction} onChange={(v) => setProduct({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'MM_LOAN',
  label: 'MM Loan (borrowing)',
  group: 'MM',
  description: 'Money market loan (borrowing cash).',
  Form: MmLoanForm,
  newSample: mmLoanSample,
});
