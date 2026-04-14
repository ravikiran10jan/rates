import { addPeriod, iso, parse, yearFraction as yf } from '../../transform/schedules';
import { differenceInCalendarDays } from 'date-fns';
import type { BuiltCurve, CurveDefinition, CurveInstrument } from './types';
import { interpolateDF } from './interpolation';

/**
 * Bootstrap a yield curve from a set of instruments quoted at par.
 *
 * Methodology (pedagogical, single-curve simplification):
 *  - Convert each instrument's tenor into a maturity date relative to valuationDate.
 *  - Sort by maturity.
 *  - Derive a discount factor at each pillar so that the instrument prices at par,
 *    given the already-solved earlier pillars. We use a closed-form step where possible
 *    and a 1-D Newton step otherwise.
 *
 * This is NOT a full multi-curve bootstrapper (no OIS discounting of LIBOR swaps,
 * no FRA convexity adjustment). It is accurate enough to teach/demonstrate pricing
 * in the playground and is deliberately explicit in its formulas.
 */
export function bootstrap(def: CurveDefinition): BuiltCurve {
  const v = parse(def.valuationDate);

  // Project each instrument to (time, maturity) in ACT/365 years
  const priced = def.instruments.map((inst) => {
    const maturity = addPeriod(v, inst.tenor);
    const startOffset = inst.startOffset ? addPeriod(v, inst.startOffset) : v;
    const tEnd = differenceInCalendarDays(maturity, v) / 365;
    const tStart = differenceInCalendarDays(startOffset, v) / 365;
    return { inst, tEnd, tStart, maturity: iso(maturity), startDate: iso(startOffset) };
  }).sort((a, b) => a.tEnd - b.tEnd);

  const pillars: BuiltCurve['pillars'] = [];
  const curve: BuiltCurve = { definition: def, pillars };

  for (const p of priced) {
    const df = priceToDF(p.inst, p.tStart, p.tEnd, curve);
    const zeroRate = p.tEnd > 0 && df > 0 ? -Math.log(df) / p.tEnd : 0;
    pillars.push({ time: p.tEnd, date: p.maturity, df, zeroRate });
    pillars.sort((a, b) => a.time - b.time);
  }

  return curve;
}

function priceToDF(inst: CurveInstrument, tStart: number, tEnd: number, curve: BuiltCurve): number {
  const r = inst.rate;
  // Deposit / FRA / Future — single simple accrual: 1 = DF*(1 + r*τ) (deposit from t0)
  if (inst.kind === 'DEPOSIT') {
    const tau = dcfBetween(inst.dayCount, tEnd - tStart);
    return 1 / (1 + r * tau);
  }
  if (inst.kind === 'FRA' || inst.kind === 'FUTURE') {
    // Forward rate implied: DF(tEnd) = DF(tStart) / (1 + r*τ)
    const tau = dcfBetween(inst.dayCount, tEnd - tStart);
    const dfStart = interpolateDF(curve, tStart);
    return dfStart / (1 + r * tau);
  }
  // Par swap / OIS / XCCY basis (approximated as par swap against the same curve):
  //   fixed leg PV = r * Σ τᵢ * DF(tᵢ)
  //   float leg PV = DF(t0) - DF(tN)  (assuming float leg prices at par when discounted on same curve)
  //   par: r * Σ τᵢ DF(tᵢ) = DF(t0) - DF(tN)   =>  DF(tN) = (DF(t0) - r*Σ_{i<N} τᵢ DF(tᵢ))  / (1 + r τ_N)
  if (inst.kind === 'SWAP' || inst.kind === 'OIS' || inst.kind === 'XCCY_BASIS') {
    // Build annual fixed-leg pillars ending exactly at tEnd. Any leading short stub
    // (when tEnd - tStart is not an integer number of years) is placed at the front.
    const length = tEnd - tStart;
    const nFull = Math.max(0, Math.floor(length + 1e-9));
    const steps: number[] = [];
    const taus: number[] = [];
    let prev = tStart;
    // Leading short stub, if any
    const stub = length - nFull;
    if (stub > 1e-9) {
      steps.push(tStart + stub);
      taus.push(stub);
      prev = tStart + stub;
    }
    for (let i = 1; i <= nFull; i++) {
      const nextT = prev + 1;
      steps.push(nextT);
      taus.push(1);
      prev = nextT;
    }
    if (steps.length === 0) {
      // Degenerate: zero-length instrument, treat like DF=1
      return 1;
    }
    const dfStart = interpolateDF(curve, tStart);
    let accrSum = 0;
    for (let i = 0; i < steps.length - 1; i++) {
      accrSum += taus[i] * interpolateDF(curve, steps[i]);
    }
    const lastTau = taus[taus.length - 1];
    return (dfStart - r * accrSum) / (1 + r * lastTau);
  }
  return 1;
}

// Accrual factor for a simple deposit of length `years` ACT/365 converted into the given DCF
function dcfBetween(dcf: string, years: number): number {
  switch (dcf) {
    case 'ACT/360': return (years * 365) / 360;
    case 'ACT/365.FIXED': return years;
    case 'BUS/252': return (years * 365) / 252;
    default: return years;
  }
}

// Convenience: parallel-bump a curve's instrument rates by `bpShift` (in decimal, e.g. 0.0001 for 1bp),
// re-bootstrap, and return the new curve.
export function bumpedCurve(def: CurveDefinition, bpShift: number) {
  const bumped: CurveDefinition = {
    ...def,
    instruments: def.instruments.map((i) => ({ ...i, rate: i.rate + bpShift })),
  };
  return bootstrap(bumped);
}

// Utility to compute year fraction under a curve's ACT/365 convention (used in UI)
export function timeFromValuation(valuationDate: string, date: string): number {
  return yf(parse(valuationDate), parse(date), 'ACT/365.FIXED');
}
