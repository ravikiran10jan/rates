import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { Fra } from '../../model/products';
import { BuySell, Currency, DayCountFraction, FloatingIndex, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusMonths } from './_stubs';

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

export function FraForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'FRA') ? initial : fraSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as Fra;

  const setProduct = (patch: Partial<Fra>) => setTrade((t) => ({
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

      <Section title="FRA Economics">
        <Row><label>Buy/Sell</label><Select value={product.buySell} onChange={(v) => setProduct({ buySell: v })} options={BuySell.options} /></Row>
        <Row><label>Notional</label><NumInput value={product.notional.amount} onChange={(v) => setProduct({ notional: { ...product.notional, amount: v } })} /></Row>
        <Row><label>Currency</label><Select value={product.notional.currency} onChange={(v) => setProduct({ notional: { ...product.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Fixed Rate (bps)</label><NumInput value={product.fixedRate * 10000} onChange={(v) => setProduct({ fixedRate: v / 10000 })} /></Row>
        <Row><label>Floating Index</label><Select value={product.floatingIndex} onChange={(v) => setProduct({ floatingIndex: v })} options={FloatingIndex.options} /></Row>
        <Row><label>Index Tenor (M)</label><NumInput value={product.indexTenor.length} onChange={(v) => setProduct({ indexTenor: { length: v, unit: 'M' } })} /></Row>
        <Row><label>Day Count</label><Select value={product.dayCountFraction} onChange={(v) => setProduct({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
        <Row><label>Discount Method</label><Select value={product.discountMethod} onChange={(v) => setProduct({ discountMethod: v })} options={['ISDA', 'AFMA', 'NONE'] as const} /></Row>
      </Section>

      <Section title="Dates">
        <Row><label>Trade Date</label><DateInput value={product.tradeDate} onChange={(v) => setProduct({ tradeDate: v })} /></Row>
        <Row><label>Effective Date</label><DateInput value={product.effectiveDate} onChange={(v) => setProduct({ effectiveDate: v })} /></Row>
        <Row><label>Termination Date</label><DateInput value={product.terminationDate} onChange={(v) => setProduct({ terminationDate: v })} /></Row>
        <Row><label>Fixing Date</label><DateInput value={product.fixingDate} onChange={(v) => setProduct({ fixingDate: v })} /></Row>
        <Row><label>Payment Date</label><DateInput value={product.paymentDate} onChange={(v) => setProduct({ paymentDate: v })} /></Row>
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'FRA',
  label: 'Forward Rate Agreement',
  group: 'SWAPS',
  description: 'Forward rate agreement (FRA).',
  Form: FraForm,
  newSample: fraSample,
});
