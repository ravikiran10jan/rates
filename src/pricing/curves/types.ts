import { z } from 'zod';
import { Currency, DayCountFraction, FloatingIndex, Period } from '../../model/common';

export const Interpolation = z.enum([
  'LINEAR_ZERO',       // linear in zero rates
  'LOG_LINEAR_DF',     // linear in log(DF) (exponential DFs)
  'LINEAR_DF',         // linear in discount factors
  'MONOTONE_CUBIC',    // monotone cubic spline on zero rates
]);
export type Interpolation = z.infer<typeof Interpolation>;

export const CurvePurpose = z.enum(['DISCOUNT', 'PROJECTION', 'BASIS']);
export type CurvePurpose = z.infer<typeof CurvePurpose>;

// Instrument "pillars" used to bootstrap
export const CurveInstrumentType = z.enum([
  'DEPOSIT', 'FRA', 'FUTURE', 'SWAP', 'OIS', 'XCCY_BASIS',
]);
export type CurveInstrumentType = z.infer<typeof CurveInstrumentType>;

export const CurveInstrument = z.object({
  kind: CurveInstrumentType,
  tenor: Period,
  rate: z.number(),              // quoted par rate (decimal, e.g. 0.045 = 4.5%)
  dayCount: DayCountFraction,
  // For FRA/Future: start offset period
  startOffset: Period.optional(),
  // For XCCY basis: basis spread, applied to target leg
  baseCurrency: Currency.optional(),
});
export type CurveInstrument = z.infer<typeof CurveInstrument>;

export const CurveDefinition = z.object({
  id: z.string(),
  name: z.string(),
  currency: Currency,
  purpose: CurvePurpose,
  index: FloatingIndex.optional(), // for projection curves
  valuationDate: z.string(),       // ISO date
  interpolation: Interpolation.default('LOG_LINEAR_DF'),
  instruments: z.array(CurveInstrument).default([]),
});
export type CurveDefinition = z.infer<typeof CurveDefinition>;

// A built curve: pillars of (t, df). t is year-fraction from valuation date (ACT/365).
export interface BuiltCurve {
  definition: CurveDefinition;
  pillars: Array<{ time: number; date: string; df: number; zeroRate: number }>;
}
