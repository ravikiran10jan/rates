import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg } from '../../model/common';
import type { Swaption, VanillaIrs } from '../../model/products';
import { BuySell, Currency, FloatingIndex, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';
import { vanillaIrsSample } from './VanillaIrsForm';

export function swaptionSample(): Trade {
  const id = newTradeId();
  const exerciseDate = plusYears(today(), 1);
  const under = vanillaIrsSample();
  const eff = exerciseDate;
  const mat = plusYears(eff, 5);
  const base = under.product as Extract<typeof under.product, { productType: 'VANILLA_IRS' }>;
  const forwardStart: VanillaIrs = {
    productType: 'VANILLA_IRS',
    legs: [
      { ...base.legs[0], calculationPeriodDates: { ...base.legs[0].calculationPeriodDates, effectiveDate: eff, terminationDate: mat } },
      { ...base.legs[1], calculationPeriodDates: { ...base.legs[1].calculationPeriodDates, effectiveDate: eff, terminationDate: mat } },
    ] as typeof base.legs,
  };
  const product: Swaption = {
    productType: 'SWAPTION', buySell: 'BUY', optionType: 'PAYER', exerciseStyle: 'EUROPEAN',
    exerciseDates: [exerciseDate], settlementType: 'PHYSICAL',
    premium: { amount: 125_000, currency: 'USD' }, premiumPaymentDate: today(2),
    underlyingSwap: forwardStart,
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_VOLS', trader: 'VOLTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Vol Fund', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function SwaptionForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'SWAPTION') ? initial : swaptionSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const [editUnderlying, setEditUnderlying] = useState(false);
  const product = trade.product as Swaption;
  const under = product.underlyingSwap;
  const fixedLeg = under.legs.find((l) => l.legType === 'FIXED') as FixedLeg | undefined;
  const floatLeg = under.legs.find((l) => l.legType === 'FLOATING') as FloatingLeg | undefined;

  const setProduct = (patch: Partial<Swaption>) => setTrade((t) => ({ ...t, product: { ...product, ...patch } }));

  const setUnderlyingLeg = (idx: 0 | 1, patch: Partial<FixedLeg> | Partial<FloatingLeg>) => {
    const legs = under.legs.map((l, i) => i === idx ? ({ ...l, ...patch } as typeof l) : l) as typeof under.legs;
    setProduct({ underlyingSwap: { ...under, legs } });
  };

  const single = product.exerciseDates[0] ?? today();
  const datesCsv = product.exerciseDates.join(', ');

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

      <Section title="Swaption Economics">
        <Row><label>Buy/Sell</label><Select value={product.buySell} onChange={(v) => setProduct({ buySell: v })} options={BuySell.options} /></Row>
        <Row><label>Option Type</label><Select value={product.optionType} onChange={(v) => setProduct({ optionType: v })} options={['PAYER', 'RECEIVER'] as const} /></Row>
        <Row><label>Exercise Style</label><Select value={product.exerciseStyle} onChange={(v) => setProduct({ exerciseStyle: v })} options={['EUROPEAN', 'BERMUDAN', 'AMERICAN'] as const} /></Row>
        {product.exerciseStyle === 'EUROPEAN' ? (
          <Row><label>Exercise Date</label><DateInput value={single} onChange={(v) => setProduct({ exerciseDates: [v] })} /></Row>
        ) : (
          <Row><label>Exercise Dates</label><TextInput value={datesCsv} placeholder="YYYY-MM-DD, YYYY-MM-DD" onChange={(v) => setProduct({ exerciseDates: v.split(',').map((s) => s.trim()).filter(Boolean) })} /></Row>
        )}
        <Row><label>Settlement Type</label><Select value={product.settlementType} onChange={(v) => setProduct({ settlementType: v })} options={['PHYSICAL', 'CASH'] as const} /></Row>
        <Row>
          <label>Premium Amount</label>
          <NumInput value={product.premium?.amount ?? 0} onChange={(v) => setProduct({ premium: { amount: v, currency: product.premium?.currency ?? 'USD' } })} />
        </Row>
        <Row>
          <label>Premium Currency</label>
          <Select value={product.premium?.currency ?? 'USD'} onChange={(v) => setProduct({ premium: { amount: product.premium?.amount ?? 0, currency: v } })} options={Currency.options} />
        </Row>
        <Row><label>Premium Payment Date</label><DateInput value={product.premiumPaymentDate ?? today()} onChange={(v) => setProduct({ premiumPaymentDate: v })} /></Row>
      </Section>

      <Section title="Underlying Swap">
        <Row><label>Effective Date</label><span>{fixedLeg?.calculationPeriodDates.effectiveDate ?? '—'}</span></Row>
        <Row><label>Termination Date</label><span>{fixedLeg?.calculationPeriodDates.terminationDate ?? '—'}</span></Row>
        <Row><label>Fixed Rate</label><span>{fixedLeg ? `${(fixedLeg.fixedRate * 10000).toFixed(2)} bps` : '—'}</span></Row>
        <Row><label>Fixed Notional</label><span>{fixedLeg ? `${fixedLeg.notional.initial.toLocaleString()} ${fixedLeg.notional.currency}` : '—'}</span></Row>
        <Row><label>Floating Index</label><span>{floatLeg?.floatingRateIndex ?? '—'}</span></Row>
        <Row><label>Floating Notional</label><span>{floatLeg ? `${floatLeg.notional.initial.toLocaleString()} ${floatLeg.notional.currency}` : '—'}</span></Row>
        <div className="pt-2">
          <button className="btn" onClick={() => setEditUnderlying((x) => !x)}>
            {editUnderlying ? 'Hide Underlying Editor' : 'Edit Underlying'}
          </button>
        </div>

        {editUnderlying && under.legs.map((leg, idx) => (
          <div key={idx} className="mt-3 border-t border-desk-border pt-2">
            <div className="text-xs uppercase tracking-widest text-desk-mute mb-2">Leg {idx + 1} ({leg.legType})</div>
            <Row><label>Notional</label><NumInput value={leg.notional.initial} onChange={(v) => setUnderlyingLeg(idx as 0 | 1, { notional: { ...leg.notional, initial: v } })} /></Row>
            {leg.legType === 'FIXED' ? (
              <Row><label>Fixed Rate (bps)</label><NumInput value={(leg as FixedLeg).fixedRate * 10000} onChange={(v) => setUnderlyingLeg(idx as 0 | 1, { fixedRate: v / 10000 })} /></Row>
            ) : (
              <Row><label>Index</label><Select value={(leg as FloatingLeg).floatingRateIndex} onChange={(v) => setUnderlyingLeg(idx as 0 | 1, { floatingRateIndex: v })} options={FloatingIndex.options} /></Row>
            )}
          </div>
        ))}
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'SWAPTION',
  label: 'Swaption',
  group: 'OPTIONS',
  description: 'European/Bermudan/American payer or receiver swaption.',
  Form: SwaptionForm,
  newSample: swaptionSample,
});
