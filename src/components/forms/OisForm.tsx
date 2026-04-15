import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg } from '../../model/common';
import type { Ois } from '../../model/products';
import { CompoundingMethod, Currency, DayCountFraction, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';

// RFR-only subset of FloatingIndex values allowed on an OIS.
const RFR_INDEXES = ['USD-SOFR', 'EUR-ESTR', 'GBP-SONIA', 'JPY-TONA', 'CHF-SARON'] as const;
type RfrIndex = typeof RFR_INDEXES[number];

export function oisSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 2);
  const product: Ois = {
    productType: 'OIS',
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'RECEIVE',
        notional: { initial: 25_000_000, steps: [], currency: 'USD' },
        fixedRate: 0.047, rateSteps: [], dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: { initial: 25_000_000, steps: [], currency: 'USD' },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 1, unit: 'D' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 2 },
        resetDates: { resetFrequency: { period: { length: 1, unit: 'D' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 0 },
        compoundingMethod: 'OIS_COMPOUNDED',
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_USD', trader: 'JDOE' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'ACME Corp', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

export function OisForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'OIS') ? initial : oisSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as Ois;
  const fixed = product.legs[0];
  const float = product.legs[1];

  const setFixed = (patch: Partial<FixedLeg>) => setTrade((t) => ({
    ...t,
    product: { ...product, legs: [{ ...fixed, ...patch }, float] },
  }));
  const setFloat = (patch: Partial<FloatingLeg>) => setTrade((t) => ({
    ...t,
    product: { ...product, legs: [fixed, { ...float, ...patch }] },
  }));

  const floatIndex: RfrIndex = (RFR_INDEXES as readonly string[]).includes(float.floatingRateIndex)
    ? (float.floatingRateIndex as RfrIndex)
    : 'USD-SOFR';

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
        <Row><label>Fixed Rate (bps)</label><NumInput value={fixed.fixedRate * 10000} onChange={(v) => setFixed({ fixedRate: v / 10000 })} /></Row>
        <Row><label>Day Count</label><Select value={fixed.dayCountFraction} onChange={(v) => setFixed({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
        <Row><label>Effective Date</label><DateInput value={fixed.calculationPeriodDates.effectiveDate} onChange={(v) => setFixed({ calculationPeriodDates: { ...fixed.calculationPeriodDates, effectiveDate: v } })} /></Row>
        <Row><label>Termination Date</label><DateInput value={fixed.calculationPeriodDates.terminationDate} onChange={(v) => setFixed({ calculationPeriodDates: { ...fixed.calculationPeriodDates, terminationDate: v } })} /></Row>
        <Row><label>Payment Freq (M)</label><NumInput value={fixed.paymentDates.paymentFrequency.period.length} onChange={(v) => setFixed({
          paymentDates: { ...fixed.paymentDates, paymentFrequency: { ...fixed.paymentDates.paymentFrequency, period: { length: v, unit: 'M' } } },
          calculationPeriodDates: { ...fixed.calculationPeriodDates, calculationPeriodFrequency: { ...fixed.calculationPeriodDates.calculationPeriodFrequency, period: { length: v, unit: 'M' } } },
        })} /></Row>
      </Section>

      <Section title="Floating Leg (RFR)">
        <Row><label>Payer/Receiver</label><Select value={float.payerReceiver} onChange={(v) => setFloat({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
        <Row><label>Notional</label><NumInput value={float.notional.initial} onChange={(v) => setFloat({ notional: { ...float.notional, initial: v } })} /></Row>
        <Row><label>Currency</label><Select value={float.notional.currency} onChange={(v) => setFloat({ notional: { ...float.notional, currency: v } })} options={Currency.options} /></Row>
        <Row><label>Index (RFR)</label><Select<RfrIndex> value={floatIndex} onChange={(v) => setFloat({ floatingRateIndex: v })} options={RFR_INDEXES} /></Row>
        <Row><label>Spread (bps)</label><NumInput value={float.spread * 10000} onChange={(v) => setFloat({ spread: v / 10000 })} /></Row>
        <Row><label>Compounding</label><Select value={float.compoundingMethod} onChange={(v) => setFloat({ compoundingMethod: v })} options={CompoundingMethod.options} /></Row>
        <Row><label>Reset Freq (D)</label><NumInput value={float.resetDates.resetFrequency.period.length} onChange={(v) => setFloat({ resetDates: { ...float.resetDates, resetFrequency: { ...float.resetDates.resetFrequency, period: { length: v, unit: float.resetDates.resetFrequency.period.unit } } } })} /></Row>
        <Row><label>Fixing Offset Days</label><NumInput value={float.resetDates.fixingOffsetDays} onChange={(v) => setFloat({ resetDates: { ...float.resetDates, fixingOffsetDays: v } })} /></Row>
        <Row><label>Payment Offset Days</label><NumInput value={float.paymentDates.paymentDaysOffset} onChange={(v) => setFloat({ paymentDates: { ...float.paymentDates, paymentDaysOffset: v } })} /></Row>
      </Section>

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'OIS',
  label: 'Overnight Index Swap',
  group: 'SWAPS',
  description: 'OIS: Fixed vs compounded overnight RFR (SOFR, ESTR, SONIA, TONA, SARON).',
  Form: OisForm,
  newSample: oisSample,
});
