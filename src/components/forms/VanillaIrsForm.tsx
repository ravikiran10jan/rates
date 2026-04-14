import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg } from '../../model/common';
import type { VanillaIrs } from '../../model/products';
import { Currency, DayCountFraction, FloatingIndex, PayerReceiver, TradeStatus } from '../../model/common';
import { newTradeId } from '../../store/blotterStore';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';

function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function plusYears(base: string, years: number): string {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function vanillaIrsSample(): Trade {
  const id = newTradeId();
  const effective = today(2);
  const maturity = plusYears(effective, 5);
  const fixed: FixedLeg = {
    legType: 'FIXED',
    payerReceiver: 'PAY',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    fixedRate: 0.04,
    rateSteps: [],
    dayCountFraction: '30/360',
    calculationPeriodDates: {
      effectiveDate: effective, terminationDate: maturity,
      calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' },
      businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
    },
    paymentDates: {
      paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' },
      payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
    },
    initialExchange: false, finalExchange: false, intermediateExchanges: false,
  };
  const float: FloatingLeg = {
    legType: 'FLOATING',
    payerReceiver: 'RECEIVE',
    notional: { initial: 10_000_000, steps: [], currency: 'USD' },
    floatingRateIndex: 'USD-SOFR',
    indexTenor: { length: 3, unit: 'M' },
    spread: 0,
    dayCountFraction: 'ACT/360',
    calculationPeriodDates: {
      effectiveDate: effective, terminationDate: maturity,
      calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
    },
    paymentDates: {
      paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
    },
    resetDates: {
      resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' },
      resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2,
    },
    compoundingMethod: 'NONE',
    initialExchange: false, finalExchange: false, intermediateExchanges: false,
  };
  const product: VanillaIrs = { productType: 'VANILLA_IRS', legs: [fixed, float] };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_USD', trader: 'JDOE' },
    parties: [
      { id: 'BOOK', name: 'Rates Desk', role: 'BOOK' },
      { id: 'CPTY', name: 'ACME Corp', role: 'COUNTERPARTY' },
    ],
    product,
    additionalCashflows: [],
  };
}

export function VanillaIrsForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'VANILLA_IRS') ? initial : vanillaIrsSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as VanillaIrs;
  const fixed = product.legs[0] as FixedLeg;
  const float = product.legs[1] as FloatingLeg;

  const setFixed = (patch: Partial<FixedLeg>) => setTrade((t) => ({
    ...t,
    product: { ...product, legs: [{ ...fixed, ...patch }, float] },
  }));
  const setFloat = (patch: Partial<FloatingLeg>) => setTrade((t) => ({
    ...t,
    product: { ...product, legs: [fixed, { ...float, ...patch }] },
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

      <Section title="Fixed Leg">
        <Row><label>Payer/Receiver</label><Select value={fixed.payerReceiver} onChange={(v) => setFixed({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
        <Row><label>Notional</label><NumInput value={fixed.notional.initial} onChange={(v) => setFixed({ notional: { ...fixed.notional, initial: v } })} /></Row>
        <Row><label>Currency</label><Select value={fixed.notional.currency} onChange={(v) => setFixed({ notional: { ...fixed.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Fixed Rate</label><NumInput value={fixed.fixedRate} onChange={(v) => setFixed({ fixedRate: v })} step="0.0001" /></Row>
        <Row><label>Day Count</label><Select value={fixed.dayCountFraction} onChange={(v) => setFixed({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
        <Row><label>Effective</label><DateInput value={fixed.calculationPeriodDates.effectiveDate} onChange={(v) => setFixed({ calculationPeriodDates: { ...fixed.calculationPeriodDates, effectiveDate: v } })} /></Row>
        <Row><label>Termination</label><DateInput value={fixed.calculationPeriodDates.terminationDate} onChange={(v) => setFixed({ calculationPeriodDates: { ...fixed.calculationPeriodDates, terminationDate: v } })} /></Row>
        <Row><label>Payment Freq (M)</label><NumInput value={fixed.paymentDates.paymentFrequency.period.length} onChange={(v) => setFixed({ paymentDates: { ...fixed.paymentDates, paymentFrequency: { ...fixed.paymentDates.paymentFrequency, period: { length: v, unit: 'M' } } } })} /></Row>
      </Section>

      <Section title="Floating Leg">
        <Row><label>Payer/Receiver</label><Select value={float.payerReceiver} onChange={(v) => setFloat({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
        <Row><label>Notional</label><NumInput value={float.notional.initial} onChange={(v) => setFloat({ notional: { ...float.notional, initial: v } })} /></Row>
        <Row><label>Currency</label><Select value={float.notional.currency} onChange={(v) => setFloat({ notional: { ...float.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Index</label><Select value={float.floatingRateIndex} onChange={(v) => setFloat({ floatingRateIndex: v })} options={FloatingIndex.options} /></Row>
        <Row><label>Tenor (M)</label><NumInput value={float.indexTenor.length} onChange={(v) => setFloat({ indexTenor: { length: v, unit: 'M' } })} /></Row>
        <Row><label>Spread (bps)</label><NumInput value={float.spread * 10000} onChange={(v) => setFloat({ spread: v / 10000 })} /></Row>
        <Row><label>Day Count</label><Select value={float.dayCountFraction} onChange={(v) => setFloat({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
        <Row><label>Effective</label><DateInput value={float.calculationPeriodDates.effectiveDate} onChange={(v) => setFloat({ calculationPeriodDates: { ...float.calculationPeriodDates, effectiveDate: v } })} /></Row>
        <Row><label>Termination</label><DateInput value={float.calculationPeriodDates.terminationDate} onChange={(v) => setFloat({ calculationPeriodDates: { ...float.calculationPeriodDates, terminationDate: v } })} /></Row>
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'VANILLA_IRS',
  label: 'Vanilla IRS',
  group: 'SWAPS',
  description: 'Fixed vs Float interest rate swap.',
  Form: VanillaIrsForm,
  newSample: vanillaIrsSample,
});
