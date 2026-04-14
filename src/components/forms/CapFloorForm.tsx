import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { CapFloor } from '../../model/products';
import { BuySell, Currency, DayCountFraction, FloatingIndex, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';

export function capFloorSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 3);
  const product: CapFloor = {
    productType: 'CAP_FLOOR', capOrFloor: 'CAP', buySell: 'BUY',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    strike: 0.055, floatingIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' },
    calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
    paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
    dayCountFraction: 'ACT/360',
    premium: { amount: 75_000, currency: 'USD' },
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_VOLS', trader: 'VOLTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Corp Hedger', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function CapFloorForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'CAP_FLOOR') ? initial : capFloorSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as CapFloor;
  const hasPremium = !!product.premium;

  const setProduct = (patch: Partial<CapFloor>) => setTrade((t) => ({
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

      <Section title="Option Economics">
        <Row><label>Cap/Floor/Collar</label><Select value={product.capOrFloor} onChange={(v) => setProduct({ capOrFloor: v, floorStrike: v === 'COLLAR' ? (product.floorStrike ?? product.strike - 0.01) : undefined })} options={['CAP', 'FLOOR', 'COLLAR'] as const} /></Row>
        <Row><label>Buy/Sell</label><Select value={product.buySell} onChange={(v) => setProduct({ buySell: v })} options={BuySell.options} /></Row>
        <Row><label>Notional</label><NumInput value={product.notional.initial} onChange={(v) => setProduct({ notional: { ...product.notional, initial: v } })} /></Row>
        <Row><label>Currency</label><Select value={product.notional.currency} onChange={(v) => setProduct({ notional: { ...product.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Strike (bps)</label><NumInput value={product.strike * 10000} onChange={(v) => setProduct({ strike: v / 10000 })} /></Row>
        {product.capOrFloor === 'COLLAR' && (
          <Row><label>Floor Strike (bps)</label><NumInput value={(product.floorStrike ?? 0) * 10000} onChange={(v) => setProduct({ floorStrike: v / 10000 })} /></Row>
        )}
        <Row><label>Floating Index</label><Select value={product.floatingIndex} onChange={(v) => setProduct({ floatingIndex: v })} options={FloatingIndex.options} /></Row>
        <Row><label>Index Tenor (M)</label><NumInput value={product.indexTenor.length} onChange={(v) => setProduct({ indexTenor: { length: v, unit: 'M' } })} /></Row>
        <Row><label>Day Count</label><Select value={product.dayCountFraction} onChange={(v) => setProduct({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      </Section>

      <Section title="Schedule">
        <Row><label>Effective Date</label><DateInput value={product.calculationPeriodDates.effectiveDate} onChange={(v) => setProduct({ calculationPeriodDates: { ...product.calculationPeriodDates, effectiveDate: v } })} /></Row>
        <Row><label>Termination Date</label><DateInput value={product.calculationPeriodDates.terminationDate} onChange={(v) => setProduct({ calculationPeriodDates: { ...product.calculationPeriodDates, terminationDate: v } })} /></Row>
        <Row><label>Payment Freq (M)</label><NumInput value={product.paymentDates.paymentFrequency.period.length} onChange={(v) => setProduct({ paymentDates: { ...product.paymentDates, paymentFrequency: { ...product.paymentDates.paymentFrequency, period: { length: v, unit: 'M' } } }, calculationPeriodDates: { ...product.calculationPeriodDates, calculationPeriodFrequency: { ...product.calculationPeriodDates.calculationPeriodFrequency, period: { length: v, unit: 'M' } } } })} /></Row>
      </Section>

      <Section title="Premium">
        <Row>
          <label>Premium?</label>
          <input type="checkbox" checked={hasPremium} onChange={(e) => setProduct({ premium: e.target.checked ? (product.premium ?? { amount: 0, currency: product.notional.currency }) : undefined })} />
        </Row>
        {hasPremium && product.premium && (
          <>
            <Row><label>Premium Amount</label><NumInput value={product.premium.amount} onChange={(v) => setProduct({ premium: { ...product.premium!, amount: v } })} /></Row>
            <Row><label>Premium Currency</label><Select value={product.premium.currency} onChange={(v) => setProduct({ premium: { ...product.premium!, currency: v } })} options={Currency.options} /></Row>
          </>
        )}
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'CAP_FLOOR',
  label: 'Cap / Floor / Collar',
  group: 'OPTIONS',
  description: 'Interest rate cap, floor or collar.',
  Form: CapFloorForm,
  newSample: capFloorSample,
});
