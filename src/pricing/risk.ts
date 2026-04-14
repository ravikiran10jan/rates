import { bumpedCurve } from './curves/bootstrap';
import type { BuiltCurve } from './curves/types';
import { priceTrade, type CurveSet, type TradeValuation } from './pricers';
import type { Trade } from '../model/trade';

const BP = 0.0001;

/**
 * DV01 = -ΔPV for a 1bp parallel up-shift. Returned in the trade's reporting currency.
 * The user can pick which curve to bump (discount or projection) via `target`.
 */
export function computeDV01(trade: Trade, valuationDate: string, curves: CurveSet, target: 'DISCOUNT' | 'PROJECTION' | 'ALL' = 'ALL'): number {
  const base = priceTrade(trade, valuationDate, curves);
  const shifted = shiftCurves(curves, target, BP);
  const shiftedPV = priceTrade(trade, valuationDate, shifted);
  return -(shiftedPV.pv - base.pv); // per 1bp (report as positive for a long-rates receiver, etc.)
}

export function shiftCurves(curves: CurveSet, target: 'DISCOUNT' | 'PROJECTION' | 'ALL', shift: number): CurveSet {
  const mapAll = (obj: Record<string, BuiltCurve>): Record<string, BuiltCurve> => {
    const out: Record<string, BuiltCurve> = {};
    for (const [k, c] of Object.entries(obj)) out[k] = bumpedCurve(c.definition, shift);
    return out;
  };
  return {
    discount: target === 'PROJECTION' ? curves.discount : mapAll(curves.discount),
    projection: target === 'DISCOUNT' ? curves.projection : mapAll(curves.projection),
    fxSpot: curves.fxSpot,
  };
}

export interface RiskReport {
  valuation: TradeValuation;
  dv01Total: number;
  dv01Discount: number;
  dv01Projection: number;
}

export function riskReport(trade: Trade, valuationDate: string, curves: CurveSet): RiskReport {
  return {
    valuation: priceTrade(trade, valuationDate, curves),
    dv01Total: computeDV01(trade, valuationDate, curves, 'ALL'),
    dv01Discount: computeDV01(trade, valuationDate, curves, 'DISCOUNT'),
    dv01Projection: computeDV01(trade, valuationDate, curves, 'PROJECTION'),
  };
}
