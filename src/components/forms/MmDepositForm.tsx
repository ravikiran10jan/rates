import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { MmDeposit } from '../../model/products';
import { Currency, DayCountFraction, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusMonths } from './_stubs';

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

export function MmDepositForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'MM_DEPOSIT') ? initial : mmDepositSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as MmDeposit;

  const setProduct = (patch: Partial<MmDeposit>) => setTrade((t) => ({
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

      <Section title="Deposit Economics">
        <Row><label>Direction</label><Select value={product.direction} onChange={(v) => setProduct({ direction: v })} options={PayerReceiver.options} /></Row>
        <Row><label>Notional</label><NumInput value={product.notional.amount} onChange={(v) => setProduct({ notional: { ...product.notional, amount: v } })} /></Row>
        <Row><label>Currency</label><Select value={product.notional.currency} onChange={(v) => setProduct({ notional: { ...product.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Start Date</label><DateInput value={product.startDate} onChange={(v) => setProduct({ startDate: v })} /></Row>
        <Row><label>Maturity Date</label><DateInput value={product.maturityDate} onChange={(v) => setProduct({ maturityDate: v })} /></Row>
        <Row><label>Rate (bps)</label><NumInput value={product.rate * 10000} onChange={(v) => setProduct({ rate: v / 10000 })} /></Row>
        <Row><label>Day Count</label><Select value={product.dayCountFraction} onChange={(v) => setProduct({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'MM_DEPOSIT',
  label: 'MM Deposit (lending)',
  group: 'MM',
  description: 'Money market deposit (placing cash at fixed rate).',
  Form: MmDepositForm,
  newSample: mmDepositSample,
});
