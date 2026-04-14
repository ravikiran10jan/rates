import { differenceInCalendarDays } from 'date-fns';
import { generateSchedule, parse, yearFraction } from '../transform/schedules';
import type { BuiltCurve } from './curves/types';
import { interpolateDF, simpleForward } from './curves/interpolation';
import type { Trade } from '../model/trade';
import type { FixedLeg, FloatingLeg, Leg } from '../model/common';
import type { Product } from '../model/products';

// ---- time helper ----
function t(valuationDate: string, date: string): number {
  return differenceInCalendarDays(parse(date), parse(valuationDate)) / 365;
}

// ---------- Leg cashflows ----------

export interface CashflowProjection {
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  notional: number;
  rate: number;
  yearFraction: number;
  amount: number;        // notional * rate * yearFraction (sign implied by payer/receiver)
  discountFactor: number;
  presentValue: number;
  sign: 1 | -1;          // RECEIVE = +1, PAY = -1
}

function notionalAt(leg: Leg, date: string): number {
  const steps = leg.notional.steps.slice().sort((a, b) => a.date.localeCompare(b.date));
  let n = leg.notional.initial;
  for (const s of steps) {
    if (s.date <= date) n = s.notional;
  }
  return n;
}

function rateAt(leg: FixedLeg, date: string): number {
  const steps = leg.rateSteps.slice().sort((a, b) => a.date.localeCompare(b.date));
  let r = leg.fixedRate;
  for (const s of steps) {
    if (s.date <= date) r = s.rate;
  }
  return r;
}

function sign(leg: Leg): 1 | -1 {
  return leg.payerReceiver === 'RECEIVE' ? 1 : -1;
}

export function priceFixedLeg(
  leg: FixedLeg,
  valuationDate: string,
  discountCurve: BuiltCurve,
): { flows: CashflowProjection[]; pv: number } {
  const schedule = generateSchedule(leg.calculationPeriodDates, leg.dayCountFraction, leg.paymentDates.paymentDaysOffset);
  const s = sign(leg);
  const flows: CashflowProjection[] = schedule.map((p) => {
    const notional = notionalAt(leg, p.adjustedStartDate);
    const rate = rateAt(leg, p.adjustedStartDate);
    const amount = notional * rate * p.yearFraction;
    const tt = t(valuationDate, p.paymentDate);
    const df = interpolateDF(discountCurve, tt);
    return {
      periodStart: p.adjustedStartDate,
      periodEnd: p.adjustedEndDate,
      paymentDate: p.paymentDate,
      notional,
      rate,
      yearFraction: p.yearFraction,
      amount,
      discountFactor: df,
      presentValue: s * amount * df,
      sign: s,
    };
  });
  const pv = flows.reduce((acc, f) => acc + f.presentValue, 0);
  return { flows, pv };
}

export function priceFloatingLeg(
  leg: FloatingLeg,
  valuationDate: string,
  discountCurve: BuiltCurve,
  projectionCurve: BuiltCurve,
): { flows: CashflowProjection[]; pv: number } {
  const schedule = generateSchedule(leg.calculationPeriodDates, leg.dayCountFraction, leg.paymentDates.paymentDaysOffset);
  const s = sign(leg);
  const flows: CashflowProjection[] = schedule.map((p) => {
    const notional = notionalAt(leg, p.adjustedStartDate);
    const t1 = t(valuationDate, p.adjustedStartDate);
    const t2 = t(valuationDate, p.adjustedEndDate);
    let fwd = simpleForward(projectionCurve, t1, t2) + leg.spread;
    if (typeof leg.capRate === 'number') fwd = Math.min(fwd, leg.capRate);
    if (typeof leg.floorRate === 'number') fwd = Math.max(fwd, leg.floorRate);
    const amount = notional * fwd * p.yearFraction;
    const tt = t(valuationDate, p.paymentDate);
    const df = interpolateDF(discountCurve, tt);
    return {
      periodStart: p.adjustedStartDate,
      periodEnd: p.adjustedEndDate,
      paymentDate: p.paymentDate,
      notional,
      rate: fwd,
      yearFraction: p.yearFraction,
      amount,
      discountFactor: df,
      presentValue: s * amount * df,
      sign: s,
    };
  });
  const pv = flows.reduce((acc, f) => acc + f.presentValue, 0);
  return { flows, pv };
}

// ---------- Top-level pricing ----------

export interface CurveSet {
  discount: Record<string, BuiltCurve>;   // keyed by currency
  projection: Record<string, BuiltCurve>; // keyed by floating index name
  fxSpot?: Record<string, number>;        // "USD/EUR" -> rate
}

export interface TradeValuation {
  pv: number;
  pvCurrency: string;
  legs: Array<{
    label: string;
    currency: string;
    pv: number;
    flows: CashflowProjection[];
  }>;
  warnings: string[];
}

function lookupDiscount(curves: CurveSet, ccy: string): BuiltCurve | null {
  return curves.discount[ccy] ?? null;
}
function lookupProjection(curves: CurveSet, index: string): BuiltCurve | null {
  return curves.projection[index] ?? null;
}

function fxConvert(curves: CurveSet, amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const direct = curves.fxSpot?.[`${from}/${to}`];
  if (direct) return amount * direct;
  const inverse = curves.fxSpot?.[`${to}/${from}`];
  if (inverse) return amount / inverse;
  return amount; // fall back to same amount but flag via warning upstream
}

export function priceTrade(trade: Trade, valuationDate: string, curves: CurveSet): TradeValuation {
  const warnings: string[] = [];
  const legs: TradeValuation['legs'] = [];
  const product = trade.product;

  const priceLegPair = (a: Leg, b: Leg, overrideCcy?: { a?: string; b?: string }) => {
    [a, b].forEach((leg, idx) => {
      const ccy = (idx === 0 ? overrideCcy?.a : overrideCcy?.b) ?? leg.notional.currency;
      const dc = lookupDiscount(curves, ccy);
      if (!dc) { warnings.push(`Missing discount curve for ${ccy}`); return; }
      if (leg.legType === 'FIXED') {
        const { flows, pv } = priceFixedLeg(leg, valuationDate, dc);
        legs.push({ label: `Fixed ${leg.payerReceiver} ${ccy}`, currency: ccy, pv, flows });
      } else {
        const pc = lookupProjection(curves, leg.floatingRateIndex);
        if (!pc) { warnings.push(`Missing projection curve for ${leg.floatingRateIndex}`); return; }
        const { flows, pv } = priceFloatingLeg(leg, valuationDate, dc, pc);
        legs.push({ label: `${leg.floatingRateIndex} ${leg.payerReceiver} ${ccy}`, currency: ccy, pv, flows });
      }
    });
  };

  switch (product.productType) {
    case 'VANILLA_IRS':
    case 'NDIRS':
    case 'OIS':
    case 'STRUCTURED_IRS':
      priceLegPair(product.legs[0], product.legs[1]);
      break;
    case 'XCCY':
    case 'ND_XCCY':
      priceLegPair(product.legs[0], product.legs[1]);
      break;
    case 'MM_DEPOSIT':
    case 'MM_LOAN': {
      const ccy = product.notional.currency;
      const dc = lookupDiscount(curves, ccy);
      if (!dc) { warnings.push(`Missing discount curve for ${ccy}`); break; }
      const tau = yearFraction(parse(product.startDate), parse(product.maturityDate), product.dayCountFraction);
      const tEnd = t(valuationDate, product.maturityDate);
      const tStart = t(valuationDate, product.startDate);
      const dfStart = interpolateDF(dc, tStart);
      const dfEnd = interpolateDF(dc, tEnd);
      const interest = product.notional.amount * product.rate * tau;
      const s: 1 | -1 = product.direction === 'RECEIVE' ? 1 : -1;
      const pv = s * (dfEnd * (product.notional.amount + interest) - dfStart * product.notional.amount);
      legs.push({
        label: `${product.productType} ${product.direction} ${ccy}`,
        currency: ccy,
        pv,
        flows: [
          {
            periodStart: product.startDate, periodEnd: product.maturityDate, paymentDate: product.maturityDate,
            notional: product.notional.amount, rate: product.rate, yearFraction: tau,
            amount: product.notional.amount + interest, discountFactor: dfEnd,
            presentValue: s * dfEnd * (product.notional.amount + interest), sign: s,
          },
        ],
      });
      break;
    }
    case 'FRA': {
      const ccy = product.notional.currency;
      const dc = lookupDiscount(curves, ccy);
      const pc = lookupProjection(curves, product.floatingIndex);
      if (!dc || !pc) { warnings.push(`Missing curves for FRA ${ccy}/${product.floatingIndex}`); break; }
      const t1 = t(valuationDate, product.effectiveDate);
      const t2 = t(valuationDate, product.terminationDate);
      const tau = yearFraction(parse(product.effectiveDate), parse(product.terminationDate), product.dayCountFraction);
      const fwd = simpleForward(pc, t1, t2);
      const paymentT = t(valuationDate, product.paymentDate);
      const df = interpolateDF(dc, paymentT);
      let payoff = (fwd - product.fixedRate) * tau;
      if (product.discountMethod !== 'NONE') payoff = payoff / (1 + fwd * tau);
      const s: 1 | -1 = product.buySell === 'BUY' ? 1 : -1;
      legs.push({
        label: `FRA ${product.buySell} ${ccy}`,
        currency: ccy,
        pv: s * product.notional.amount * payoff * df,
        flows: [{
          periodStart: product.effectiveDate, periodEnd: product.terminationDate, paymentDate: product.paymentDate,
          notional: product.notional.amount, rate: fwd, yearFraction: tau,
          amount: product.notional.amount * payoff, discountFactor: df,
          presentValue: s * product.notional.amount * payoff * df, sign: s,
        }],
      });
      break;
    }
    case 'SWAPTION': {
      // Playground pricing: compute forward par swap PV + Black-style premium indication based on ATM moneyness only.
      // The PV reported here is the intrinsic of the forward swap, not full option PV (no vol surface in playground).
      priceLegPair(product.underlyingSwap.legs[0], product.underlyingSwap.legs[1]);
      warnings.push('Swaption shown with forward-start underlying PV; full Black pricing requires a vol input.');
      break;
    }
    case 'CAP_FLOOR': {
      const ccy = product.notional.currency;
      const dc = lookupDiscount(curves, ccy);
      const pc = lookupProjection(curves, product.floatingIndex);
      if (!dc || !pc) { warnings.push(`Missing curves for ${product.capOrFloor} ${ccy}`); break; }
      const schedule = generateSchedule(product.calculationPeriodDates, product.dayCountFraction, product.paymentDates.paymentDaysOffset);
      const flows: CashflowProjection[] = [];
      const s: 1 | -1 = product.buySell === 'BUY' ? 1 : -1;
      for (const p of schedule) {
        const t1 = t(valuationDate, p.adjustedStartDate);
        const t2 = t(valuationDate, p.adjustedEndDate);
        const fwd = simpleForward(pc, t1, t2);
        const strike = product.strike;
        let payoff: number;
        if (product.capOrFloor === 'CAP') payoff = Math.max(fwd - strike, 0);
        else if (product.capOrFloor === 'FLOOR') payoff = Math.max(strike - fwd, 0);
        else payoff = Math.max(fwd - strike, 0) - Math.max((product.floorStrike ?? strike) - fwd, 0);
        const paymentT = t(valuationDate, p.paymentDate);
        const df = interpolateDF(dc, paymentT);
        const notional = product.notional.initial;
        flows.push({
          periodStart: p.adjustedStartDate, periodEnd: p.adjustedEndDate, paymentDate: p.paymentDate,
          notional, rate: fwd, yearFraction: p.yearFraction,
          amount: notional * payoff * p.yearFraction, discountFactor: df,
          presentValue: s * notional * payoff * p.yearFraction * df, sign: s,
        });
      }
      const pv = flows.reduce((a, f) => a + f.presentValue, 0);
      legs.push({ label: `${product.capOrFloor} ${product.buySell} ${ccy}`, currency: ccy, pv, flows });
      warnings.push('Cap/Floor uses intrinsic on forward rates (no Black volatility model in playground).');
      break;
    }
  }

  // Aggregate PV in reporting currency (USD by default)
  const reportingCcy = inferReportingCurrency(product) ?? 'USD';
  let total = 0;
  for (const l of legs) total += fxConvert(curves, l.pv, l.currency, reportingCcy);

  return { pv: total, pvCurrency: reportingCcy, legs, warnings };
}

function inferReportingCurrency(p: Product): string | null {
  switch (p.productType) {
    case 'VANILLA_IRS':
    case 'OIS':
    case 'STRUCTURED_IRS':
      return p.legs[0].notional.currency;
    case 'NDIRS':
      return p.settlementCurrency;
    case 'ND_XCCY':
      return p.settlementCurrency;
    case 'XCCY':
      return p.legs[0].notional.currency;
    case 'MM_DEPOSIT':
    case 'MM_LOAN':
      return p.notional.currency;
    case 'FRA':
      return p.notional.currency;
    case 'SWAPTION':
      return p.underlyingSwap.legs[0].notional.currency;
    case 'CAP_FLOOR':
      return p.notional.currency;
  }
  return null;
}
