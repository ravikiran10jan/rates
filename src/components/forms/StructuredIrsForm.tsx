import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg, Leg } from '../../model/common';
import type {
  CmsFeature, ExerciseSchedule, InverseFloaterFeature, QuantoFeature, RangeAccrualFeature,
  StructuredFeature, StructuredIrs,
} from '../../model/products';
import { Currency, DayCountFraction, FloatingIndex, PayerReceiver, TradeStatus } from '../../model/common';
import { registerProductForm, type ProductFormProps } from './FormRegistry';
import { DateInput, FormFooter, NumInput, Row, Section, Select, TextInput } from './common';
import { newTradeId, today, plusYears } from './_stubs';

const FLAVOURS = [
  'AMORTIZING', 'STEP_UP', 'FORWARD_STARTING', 'ZERO_COUPON',
  'CALLABLE_BERMUDAN', 'CANCELLABLE',
  'CMS_LINKED', 'RANGE_ACCRUAL', 'INVERSE_FLOATER', 'QUANTO',
] as const;
type Flavour = typeof FLAVOURS[number];

const PERIOD_UNITS_MY = ['M', 'Y'] as const;

export function structuredIrsSample(): Trade {
  const id = newTradeId();
  const eff = today(2); const mat = plusYears(eff, 10);
  const product: StructuredIrs = {
    productType: 'STRUCTURED_IRS', flavour: 'CALLABLE_BERMUDAN',
    exerciseSchedule: {
      style: 'BERMUDAN',
      exerciseDates: Array.from({ length: 9 }, (_, i) => plusYears(eff, i + 1)),
      notificationOffsetDays: 5, partyLong: 'PARTY_B',
    },
    features: [],
    legs: [
      {
        legType: 'FIXED', payerReceiver: 'RECEIVE',
        notional: {
          initial: 50_000_000,
          steps: Array.from({ length: 9 }, (_, i) => ({ date: plusYears(eff, i + 1), notional: 50_000_000 - (i + 1) * 4_000_000 })),
          currency: 'USD',
        },
        fixedRate: 0.045, rateSteps: [], dayCountFraction: '30/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 6, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
      {
        legType: 'FLOATING', payerReceiver: 'PAY',
        notional: {
          initial: 50_000_000,
          steps: Array.from({ length: 9 }, (_, i) => ({ date: plusYears(eff, i + 1), notional: 50_000_000 - (i + 1) * 4_000_000 })),
          currency: 'USD',
        },
        floatingRateIndex: 'USD-SOFR', indexTenor: { length: 3, unit: 'M' }, spread: 0,
        dayCountFraction: 'ACT/360',
        calculationPeriodDates: { effectiveDate: eff, terminationDate: mat, calculationPeriodFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE' },
        paymentDates: { paymentFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0 },
        resetDates: { resetFrequency: { period: { length: 3, unit: 'M' }, rollConvention: 'NONE' }, resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2 },
        compoundingMethod: 'NONE',
        initialExchange: false, finalExchange: false, intermediateExchanges: false,
      },
    ],
  };
  return {
    tradeHeader: { tradeId: id, tradeDate: today(), status: 'DRAFT', book: 'RATES_EXOTICS', trader: 'EXOTDR' },
    parties: [{ id: 'BOOK', name: 'Rates Desk', role: 'BOOK' }, { id: 'CPTY', name: 'Structured Counterparty', role: 'COUNTERPARTY' }],
    product, additionalCashflows: [],
  };
}

// Default feature seed for a flavour that maps to a specific feature kind.
function defaultFeatureFor(flavour: Flavour): StructuredFeature | undefined {
  switch (flavour) {
    case 'CMS_LINKED':
      return { kind: 'CMS', swapTenor: { length: 10, unit: 'Y' }, indexName: 'USD-ISDA-Swap-10Y', multiplier: 1, spread: 0 };
    case 'RANGE_ACCRUAL':
      return { kind: 'RANGE_ACCRUAL', referenceIndex: 'USD-SOFR', lowerBound: 0.02, upperBound: 0.05, observation: 'DAILY', couponIfIn: 0.05, couponIfOut: 0 };
    case 'INVERSE_FLOATER':
      return { kind: 'INVERSE_FLOATER', referenceIndex: 'USD-SOFR', fixedComponent: 0.08, multiplier: 1, floor: 0 };
    case 'QUANTO':
      return { kind: 'QUANTO', payoutCurrency: 'USD', referenceIndex: 'EUR-ESTR', referenceCurrency: 'EUR' };
    default:
      return undefined;
  }
}

function defaultExerciseScheduleFor(flavour: Flavour, eff: string): ExerciseSchedule | undefined {
  if (flavour !== 'CALLABLE_BERMUDAN' && flavour !== 'CANCELLABLE') return undefined;
  return {
    style: flavour === 'CALLABLE_BERMUDAN' ? 'BERMUDAN' : 'CANCELLABLE',
    exerciseDates: [plusYears(eff, 1), plusYears(eff, 2), plusYears(eff, 3)],
    notificationOffsetDays: 2,
    partyLong: 'PARTY_B',
  };
}

function BasicLegEditor({ leg, onChange, title }: { leg: Leg; onChange: (leg: Leg) => void; title: string }) {
  const setFixed = (patch: Partial<FixedLeg>) => onChange({ ...(leg as FixedLeg), ...patch });
  const setFloat = (patch: Partial<FloatingLeg>) => onChange({ ...(leg as FloatingLeg), ...patch });
  return (
    <Section title={title}>
      <Row><label>Leg Type</label><span>{leg.legType}</span></Row>
      <Row><label>Payer/Receiver</label><Select value={leg.payerReceiver} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ payerReceiver: v }) : setFloat({ payerReceiver: v })} options={PayerReceiver.options} /></Row>
      <Row><label>Notional</label><NumInput value={leg.notional.initial} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ notional: { ...leg.notional, initial: v } }) : setFloat({ notional: { ...leg.notional, initial: v } })} /></Row>
      <Row><label>Currency</label><Select value={leg.notional.currency} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ notional: { ...leg.notional, currency: v } }) : setFloat({ notional: { ...leg.notional, currency: v } })} options={Currency.options} /></Row>
      {leg.legType === 'FIXED' ? (
        <Row><label>Fixed Rate (bps)</label><NumInput value={(leg as FixedLeg).fixedRate * 10000} onChange={(v) => setFixed({ fixedRate: v / 10000 })} /></Row>
      ) : (
        <>
          <Row><label>Index</label><Select value={(leg as FloatingLeg).floatingRateIndex} onChange={(v) => setFloat({ floatingRateIndex: v })} options={FloatingIndex.options} /></Row>
          <Row><label>Spread (bps)</label><NumInput value={(leg as FloatingLeg).spread * 10000} onChange={(v) => setFloat({ spread: v / 10000 })} /></Row>
        </>
      )}
      <Row><label>Day Count</label><Select value={leg.dayCountFraction} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ dayCountFraction: v }) : setFloat({ dayCountFraction: v })} options={DayCountFraction.options} /></Row>
      <Row><label>Effective Date</label><DateInput value={leg.calculationPeriodDates.effectiveDate} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ calculationPeriodDates: { ...leg.calculationPeriodDates, effectiveDate: v } }) : setFloat({ calculationPeriodDates: { ...leg.calculationPeriodDates, effectiveDate: v } })} /></Row>
      <Row><label>Termination Date</label><DateInput value={leg.calculationPeriodDates.terminationDate} onChange={(v) => leg.legType === 'FIXED' ? setFixed({ calculationPeriodDates: { ...leg.calculationPeriodDates, terminationDate: v } }) : setFloat({ calculationPeriodDates: { ...leg.calculationPeriodDates, terminationDate: v } })} /></Row>
    </Section>
  );
}

export function StructuredIrsForm({ onBook, onCancel, initial }: ProductFormProps) {
  const seed = (initial && initial.product.productType === 'STRUCTURED_IRS') ? initial : structuredIrsSample();
  const [trade, setTrade] = useState<Trade>(seed);
  const product = trade.product as StructuredIrs;

  const setProduct = (patch: Partial<StructuredIrs>) => setTrade((t) => ({ ...t, product: { ...product, ...patch } }));
  const setLeg = (idx: 0 | 1) => (leg: Leg) => {
    const legs: [Leg, Leg] = idx === 0 ? [leg, product.legs[1]] : [product.legs[0], leg];
    setProduct({ legs });
  };

  const onFlavourChange = (flavour: Flavour) => {
    const eff = product.legs[0].calculationPeriodDates.effectiveDate;
    const nextFeature = defaultFeatureFor(flavour);
    const nextExercise = defaultExerciseScheduleFor(flavour, eff) ?? product.exerciseSchedule;
    setProduct({
      flavour,
      features: nextFeature ? [nextFeature] : [],
      exerciseSchedule: (flavour === 'CALLABLE_BERMUDAN' || flavour === 'CANCELLABLE') ? nextExercise : undefined,
    });
  };

  const feature = product.features[0];
  const setFeature = (f: StructuredFeature) => setProduct({ features: [f] });

  const exerciseSchedule = product.exerciseSchedule;
  const setExercise = (patch: Partial<ExerciseSchedule>) => {
    if (!exerciseSchedule) return;
    setProduct({ exerciseSchedule: { ...exerciseSchedule, ...patch } });
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

      <Section title="Structure">
        <Row><label>Flavour</label><Select<Flavour> value={product.flavour} onChange={onFlavourChange} options={FLAVOURS} /></Row>
      </Section>

      <BasicLegEditor title="Leg 1" leg={product.legs[0]} onChange={setLeg(0)} />
      <BasicLegEditor title="Leg 2" leg={product.legs[1]} onChange={setLeg(1)} />

      {(product.flavour === 'CALLABLE_BERMUDAN' || product.flavour === 'CANCELLABLE') && exerciseSchedule && (
        <Section title="Exercise Schedule">
          <Row><label>Style</label><Select value={exerciseSchedule.style} onChange={(v) => setExercise({ style: v })} options={['BERMUDAN', 'EUROPEAN', 'CALLABLE', 'CANCELLABLE'] as const} /></Row>
          <Row><label>Exercise Dates</label><TextInput value={exerciseSchedule.exerciseDates.join(', ')} placeholder="YYYY-MM-DD, ..." onChange={(v) => setExercise({ exerciseDates: v.split(',').map((s) => s.trim()).filter(Boolean) })} /></Row>
          <Row><label>Notification Offset (d)</label><NumInput value={exerciseSchedule.notificationOffsetDays} onChange={(v) => setExercise({ notificationOffsetDays: v })} /></Row>
          <Row><label>Party Long</label><Select value={exerciseSchedule.partyLong} onChange={(v) => setExercise({ partyLong: v })} options={['PARTY_A', 'PARTY_B'] as const} /></Row>
        </Section>
      )}

      {product.flavour === 'CMS_LINKED' && feature?.kind === 'CMS' && (
        <Section title="CMS Feature">
          <Row><label>Swap Tenor Length</label><NumInput value={feature.swapTenor.length} onChange={(v) => setFeature({ ...feature, swapTenor: { ...feature.swapTenor, length: v } } as CmsFeature)} /></Row>
          <Row><label>Swap Tenor Unit</label><Select value={feature.swapTenor.unit === 'Y' ? 'Y' : 'M'} onChange={(v) => setFeature({ ...feature, swapTenor: { ...feature.swapTenor, unit: v } } as CmsFeature)} options={PERIOD_UNITS_MY} /></Row>
          <Row><label>Index Name</label><TextInput value={feature.indexName} onChange={(v) => setFeature({ ...feature, indexName: v } as CmsFeature)} /></Row>
          <Row><label>Multiplier</label><NumInput value={feature.multiplier} onChange={(v) => setFeature({ ...feature, multiplier: v } as CmsFeature)} step="0.01" /></Row>
          <Row><label>Spread (bps)</label><NumInput value={feature.spread * 10000} onChange={(v) => setFeature({ ...feature, spread: v / 10000 } as CmsFeature)} /></Row>
          <Row>
            <label>Cap (bps)</label>
            <input type="number" value={feature.cap !== undefined ? feature.cap * 10000 : ''} placeholder="none"
                   onChange={(e) => setFeature({ ...feature, cap: e.target.value === '' ? undefined : parseFloat(e.target.value) / 10000 } as CmsFeature)} />
          </Row>
          <Row>
            <label>Floor (bps)</label>
            <input type="number" value={feature.floor !== undefined ? feature.floor * 10000 : ''} placeholder="none"
                   onChange={(e) => setFeature({ ...feature, floor: e.target.value === '' ? undefined : parseFloat(e.target.value) / 10000 } as CmsFeature)} />
          </Row>
        </Section>
      )}

      {product.flavour === 'RANGE_ACCRUAL' && feature?.kind === 'RANGE_ACCRUAL' && (
        <Section title="Range Accrual Feature">
          <Row><label>Reference Index</label><Select value={feature.referenceIndex} onChange={(v) => setFeature({ ...feature, referenceIndex: v } as RangeAccrualFeature)} options={FloatingIndex.options} /></Row>
          <Row><label>Lower Bound (bps)</label><NumInput value={feature.lowerBound * 10000} onChange={(v) => setFeature({ ...feature, lowerBound: v / 10000 } as RangeAccrualFeature)} /></Row>
          <Row><label>Upper Bound (bps)</label><NumInput value={feature.upperBound * 10000} onChange={(v) => setFeature({ ...feature, upperBound: v / 10000 } as RangeAccrualFeature)} /></Row>
          <Row><label>Observation</label><Select value={feature.observation} onChange={(v) => setFeature({ ...feature, observation: v } as RangeAccrualFeature)} options={['DAILY', 'WEEKLY'] as const} /></Row>
          <Row><label>Coupon If In (bps)</label><NumInput value={feature.couponIfIn * 10000} onChange={(v) => setFeature({ ...feature, couponIfIn: v / 10000 } as RangeAccrualFeature)} /></Row>
          <Row><label>Coupon If Out (bps)</label><NumInput value={feature.couponIfOut * 10000} onChange={(v) => setFeature({ ...feature, couponIfOut: v / 10000 } as RangeAccrualFeature)} /></Row>
        </Section>
      )}

      {product.flavour === 'INVERSE_FLOATER' && feature?.kind === 'INVERSE_FLOATER' && (
        <Section title="Inverse Floater Feature">
          <Row><label>Reference Index</label><Select value={feature.referenceIndex} onChange={(v) => setFeature({ ...feature, referenceIndex: v } as InverseFloaterFeature)} options={FloatingIndex.options} /></Row>
          <Row><label>Fixed Component (bps)</label><NumInput value={feature.fixedComponent * 10000} onChange={(v) => setFeature({ ...feature, fixedComponent: v / 10000 } as InverseFloaterFeature)} /></Row>
          <Row><label>Multiplier</label><NumInput value={feature.multiplier} onChange={(v) => setFeature({ ...feature, multiplier: v } as InverseFloaterFeature)} step="0.01" /></Row>
          <Row>
            <label>Cap (bps)</label>
            <input type="number" value={feature.cap !== undefined ? feature.cap * 10000 : ''} placeholder="none"
                   onChange={(e) => setFeature({ ...feature, cap: e.target.value === '' ? undefined : parseFloat(e.target.value) / 10000 } as InverseFloaterFeature)} />
          </Row>
          <Row><label>Floor (bps)</label><NumInput value={feature.floor * 10000} onChange={(v) => setFeature({ ...feature, floor: v / 10000 } as InverseFloaterFeature)} /></Row>
        </Section>
      )}

      {product.flavour === 'QUANTO' && feature?.kind === 'QUANTO' && (
        <Section title="Quanto Feature">
          <Row><label>Payout Currency</label><Select value={feature.payoutCurrency} onChange={(v) => setFeature({ ...feature, payoutCurrency: v } as QuantoFeature)} options={Currency.options} /></Row>
          <Row><label>Reference Index</label><Select value={feature.referenceIndex} onChange={(v) => setFeature({ ...feature, referenceIndex: v } as QuantoFeature)} options={FloatingIndex.options} /></Row>
          <Row><label>Reference Currency</label><Select value={feature.referenceCurrency} onChange={(v) => setFeature({ ...feature, referenceCurrency: v } as QuantoFeature)} options={Currency.options} /></Row>
        </Section>
      )}

      <FormFooter onCancel={onCancel} onBook={() => onBook(trade)} />
    </div>
  );
}

registerProductForm({
  productType: 'STRUCTURED_IRS',
  label: 'Structured IRS',
  group: 'STRUCTURED',
  description: 'Amortizing, step-up, callable/Bermudan, CMS, range accrual, inverse floater, quanto.',
  Form: StructuredIrsForm,
  newSample: structuredIrsSample,
});
