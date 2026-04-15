import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FloatingLeg } from '../../model/common';
import type { XccySwap } from '../../model/products';
import { Currency, DayCountFraction, FloatingIndex, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';

export function xccySample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 5);
  const product: XccySwap = {
    productType: 'XCCY', mtmResettable: false, initialFxRate: 1.08,
    exchangeInitialNotional: true, exchangeFinalNotional: true,
    legs: [
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: { initial: 10_000_000, steps: [], currency: 'USD' },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: true, finalExchange: true, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'RECEIVE',
        notional: { initial: 9_259_259.26, steps: [], currency: 'EUR' },
        floatingRateIndex: 'EUR-ESTR', indexTenor: { length: 3, unit: 'M' }, spread: -0.0015,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: true, finalExchange: true, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_XCCY', trader: 'XCCYTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Global Bank', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

// Compact editor for one floating leg of an XCCY swap.
function XccyLegEditor({ leg, onChange, title }: { leg: FloatingLeg; onChange: (leg: FloatingLeg) => void; title: string }) {
  const set = (patch: Partial<FloatingLeg>) => onChange({ ...leg, ...patch });
  return (
    <Section title={title}>
      <Row><label>Payer/Receiver</label><Select value={leg.payerReceiver} onChange={(v) => set({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
      <Row><label>Currency</label><Select value={leg.notional.currency} onChange={(v) => set({ notional: { ...leg.notional, currency: v } })} options={Currency.options} /></Row>
      <Row><label>Notional</label><NumInput value={leg.notional.initial} onChange={(v) => set({ notional: { ...leg.notional, initial: v } })} /></Row>
      <Row><label>Index</label><Select value={leg.floatingRateIndex} onChange={(v) => set({ floatingRateIndex: v })} options={FloatingIndex.options} /></Row>
      <Row><label>Spread (bps)</label><NumInput value={leg.spread * 10000} onChange={(v) => set({ spread: v / 10000 })} /></Row>
      <Row><label>Day Count</label><Select value={leg.dayCountFraction} onChange={(v) => set({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      <Row><label>Effective Date</label><DateInput value={leg.calculationPeriodDates.effectiveDate} onChange={(v) => set({ calculationPeriodDates: { ...leg.calculationPeriodDates, effectiveDate: v } })} /></Row>
      <Row><label>Termination Date</label><DateInput value={leg.calculationPeriodDates.terminationDate} onChange={(v) => set({ calculationPeriodDates: { ...leg.calculationPeriodDates, terminationDate: v } })} /></Row>
      <Row><label>Calc Freq (M)</label><NumInput value={leg.calculationPeriodDates.calculationPeriodFrequency.period.length} onChange={(v) => set({
        calculationPeriodDates: { ...leg.calculationPeriodDates, calculationPeriodFrequency: { ...leg.calculationPeriodDates.calculationPeriodFrequency, period: { length: v, unit: 'M' } } },
        paymentDates: { ...leg.paymentDates, paymentFrequency: { ...leg.paymentDates.paymentFrequency, period: { length: v, unit: 'M' } } },
      })} /></Row>
    </Section>
  );
}

export function XccyForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'XCCY') ? initial : xccySample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as XccySwap;
  const leg0 = product.legs[0] as FloatingLeg;
  const leg1 = product.legs[1] as FloatingLeg;

  const setProduct = (patch: Partial<XccySwap>) => setTrade((t) => ({ ...t, product: { ...product, ...patch } }));
  const setLeg0 = (leg: FloatingLeg) => setProduct({ legs: [leg, leg1] });
  const setLeg1 = (leg: FloatingLeg) => setProduct({ legs: [leg0, leg] });

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

      <Section title="XCCY Details">
        <Row><label>Initial FX Rate</label><NumInput value={product.initialFxRate} onChange={(v) => setProduct({ initialFxRate: v })} step="0.0001" /></Row>
        <Row><label>MtM Resettable</label><input type="checkbox" checked={product.mtmResettable} onChange={(e) => setProduct({ mtmResettable: e.target.checked })} /></Row>
        {product.mtmResettable && (
          <Row><label>Resetting Leg</label><Select<'0' | '1'> value={(product.mtmResettingLegIndex ?? 0).toString() as '0' | '1'} onChange={(v) => setProduct({ mtmResettingLegIndex: parseInt(v, 10) })} options={['0', '1'] as const} /></Row>
        )}
        <Row><label>Exchange Initial</label><input type="checkbox" checked={product.exchangeInitialNotional} onChange={(e) => setProduct({ exchangeInitialNotional: e.target.checked })} /></Row>
        <Row><label>Exchange Final</label><input type="checkbox" checked={product.exchangeFinalNotional} onChange={(e) => setProduct({ exchangeFinalNotional: e.target.checked })} /></Row>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <XccyLegEditor title="Leg 1" leg={leg0} onChange={setLeg0} />
        <XccyLegEditor title="Leg 2" leg={leg1} onChange={setLeg1} />
      </div>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'XCCY',
  label: 'Cross-Currency Swap',
  group: 'XCCY',
  description: 'Vanilla cross-currency swap with optional MtM resets.',
  Form: XccyForm,
  newSample: xccySample,
});
