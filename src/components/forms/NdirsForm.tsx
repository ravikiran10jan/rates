import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg, Leg } from '../../model/common';
import type { Ndirs } from '../../model/products';
import { Currency, DayCountFraction, FloatingIndex, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';

export function ndirsSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 3);
  const product: Ndirs = {
    productType: 'NDIRS',
    settlementCurrency: 'USD',
    fxFixing: { fixingSource: 'BRL.PTAX', fixingOffsetDays: 2, settlementCurrency: 'USD' },
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'PAY',
        notional: { initial: 50_000_000, steps: [], currency: 'BRL' },
        fixedRate: 0.115, rateSteps: [], dayCountFraction: 'BUS/252',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'RECEIVE',
        notional: { initial: 50_000_000, steps: [], currency: 'BRL' },
        floatingRateIndex: 'BRL-CDI', indexTenor: { length: 1, unit: 'D' },
        spread: 0, dayCountFraction: 'BUS/252',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 1, unit: 'D' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 0 },
        compoundingMethod: 'OIS_COMPOUNDED',
        fxFixing: { fixingSource: 'BRL.PTAX', fixingOffsetDays: 2, settlementCurrency: 'USD' },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_EM', trader: 'EMTRADER' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'EM Counterparty', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

function LegEditor({ leg, onChange, title }: { leg: Leg; onChange: (leg: Leg) => void; title: string }) {
  const setFixed = (patch: Partial<FixedLeg>) => onChange({ ...(leg as FixedLeg), ...patch });
  const setFloat = (patch: Partial<FloatingLeg>) => onChange({ ...(leg as FloatingLeg), ...patch });

  const switchType = (t: 'FIXED' | 'FLOATING') => {
    if (t === leg.legType) return;
    if (t === 'FIXED') {
      const f = leg as FloatingLeg;
      const next: FixedLeg = {
        legType: 'FIXED',
        payerReceiver: f.payerReceiver,
        notional: f.notional,
        fixedRate: 0.05,
        rateSteps: [],
        dayCountFraction: f.dayCountFraction,
        calculationPeriodDates: f.calculationPeriodDates,
        paymentDates: f.paymentDates,
        initialExchange: f.initialExchange,
        finalExchange: f.finalExchange,
        intermediateExchanges: f.intermediateExchanges,
      };
      onChange(next);
    } else {
      const fx = leg as FixedLeg;
      const next: FloatingLeg = {
        legType: 'FLOATING',
        payerReceiver: fx.payerReceiver,
        notional: fx.notional,
        floatingRateIndex: 'USD-SOFR',
        indexTenor: { length: 3, unit: 'M' },
        spread: 0,
        dayCountFraction: fx.dayCountFraction,
        calculationPeriodDates: fx.calculationPeriodDates,
        paymentDates: fx.paymentDates,
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: fx.initialExchange,
        finalExchange: fx.finalExchange,
        intermediateExchanges: fx.intermediateExchanges,
      };
      onChange(next);
    }
  };

  return (
    <Section title={title}>
      <Row><label>Leg Type</label><Select value={leg.legType} onChange={switchType} options={['FIXED', 'FLOATING'] as const} /></Row>
      <Row><label>Payer/Receiver</label><Select value={leg.payerReceiver} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ payerReceiver: v }) : setFloat({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
      <Row><label>Notional</label><NumInput value={leg.notional.initial} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ notional: { ...leg.notional, initial: v } }) : setFloat({ notional: { ...leg.notional, initial: v } })} /></Row>
      <Row><label>Currency</label><Select value={leg.notional.currency} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ notional: { ...leg.notional, currency: v } }) : setFloat({ notional: { ...leg.notional, currency: v } })} options={Currency.options} /></Row>
      {leg.legType === 'FIXED' ? (
        <Row><label>Fixed Rate (bps)</label><NumInput value={(leg as FixedLeg).fixedRate * 10000} onChange={(v) => setFixed({ fixedRate: v / 10000 })} /></Row>
      ) : (
        <>
          <Row><label>Floating Index</label><Select value={(leg as FloatingLeg).floatingRateIndex} onChange={(v) => setFloat({ floatingRateIndex: v })} options={FloatingIndex.options} /></Row>
          <Row><label>Index Tenor (M)</label><NumInput value={(leg as FloatingLeg).indexTenor.length} onChange={(v) => setFloat({ indexTenor: { length: v, unit: (leg as FloatingLeg).indexTenor.unit } })} /></Row>
          <Row><label>Spread (bps)</label><NumInput value={(leg as FloatingLeg).spread * 10000} onChange={(v) => setFloat({ spread: v / 10000 })} /></Row>
        </>
      )}
      <Row><label>Day Count</label><Select value={leg.dayCountFraction} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ dayCountFraction: v }) : setFloat({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      <Row><label>Effective Date</label><DateInput value={leg.calculationPeriodDates.effectiveDate} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ calculationPeriodDates: { ...leg.calculationPeriodDates, effectiveDate: v } }) : setFloat({ calculationPeriodDates: { ...leg.calculationPeriodDates, effectiveDate: v } })} /></Row>
      <Row><label>Termination Date</label><DateInput value={leg.calculationPeriodDates.terminationDate} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ calculationPeriodDates: { ...leg.calculationPeriodDates, terminationDate: v } }) : setFloat({ calculationPeriodDates: { ...leg.calculationPeriodDates, terminationDate: v } })} /></Row>
      <Row><label>Payment Freq (M)</label><NumInput value={leg.paymentDates.paymentFrequency.period.length} onChange={(v) => {
        const pd = { ...leg.paymentDates, paymentFrequency: { ...leg.paymentDates.paymentFrequency, period: { length: v, unit: 'M' as const } } };
        const cpd = { ...leg.calculationPeriodDates, calculationPeriodFrequency: { ...leg.calculationPeriodDates.calculationPeriodFrequency, period: { length: v, unit: 'M' as const } } };
        if (leg.legType === 'FIXED') setFixed({ paymentDates: pd, calculationPeriodDates: cpd });
        else setFloat({ paymentDates: pd, calculationPeriodDates: cpd });
      }} /></Row>
    </Section>
  );
}

export function NdirsForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'NDIRS') ? initial : ndirsSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as Ndirs;

  const setProduct = (patch: Partial<Ndirs>) => setTrade((t) => ({
    ...t,
    product: { ...product, ...patch },
  }));

  const setLeg = (idx: 0 | 1) => (leg: Leg) => {
    const legs: [Leg, Leg] = idx === 0 ? [leg, product.legs[1]] : [product.legs[0], leg];
    setProduct({ legs });
  };

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

      <Section title="Settlement & FX Fixing">
        <Row><label>Settlement Ccy</label><Select value={product.settlementCurrency} onChange={(v) => setProduct({ settlementCurrency: v, fxFixing: { ...product.fxFixing, settlementCurrency: v } })} options={Currency.options} /></Row>
        <Row><label>FX Fixing Source</label><TextInput value={product.fxFixing.fixingSource} onChange={(v) => setProduct({ fxFixing: { ...product.fxFixing, fixingSource: v } })} /></Row>
        <Row><label>Fixing Offset Days</label><NumInput value={product.fxFixing.fixingOffsetDays} onChange={(v) => setProduct({ fxFixing: { ...product.fxFixing, fixingOffsetDays: v } })} /></Row>
      </Section>

      <LegEditor title="Leg 1" leg={product.legs[0]} onChange={setLeg(0)} />
      <LegEditor title="Leg 2" leg={product.legs[1]} onChange={setLeg(1)} />

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'NDIRS',
  label: 'Non-Deliverable IRS',
  group: 'SWAPS',
  description: 'NDIRS settled in hard currency (e.g. BRL/USD, INR/USD).',
  Form: NdirsForm,
  newSample: ndirsSample,
});
