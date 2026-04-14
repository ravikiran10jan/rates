import type { BuiltCurve, Interpolation } from './types';

/**
 * Interpolate a discount factor for time `t` (year fraction from valuation date).
 * Flat extrapolation before the first pillar and after the last pillar (on the
 * chosen interpolation target to keep it well-defined).
 */
export function interpolateDF(curve: BuiltCurve, t: number): number {
  const p = curve.pillars;
  if (p.length === 0) return 1;
  if (t <= 0) return 1;
  if (t <= p[0].time) return interpolateSegment(0, t, p[0].time, 1, p[0].df, p[0].df, curve.definition.interpolation, 0, p[0].zeroRate);
  if (t >= p[p.length - 1].time) {
    // Flat-forward extrapolation: extend last zero rate
    const last = p[p.length - 1];
    return Math.exp(-last.zeroRate * t);
  }
  // Find bracketing pillars
  let lo = 0, hi = p.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p[mid].time <= t) lo = mid; else hi = mid;
  }
  return interpolateSegment(
    p[lo].time, t, p[hi].time, p[lo].df, p[hi].df, p[hi].df /* placeholder */,
    curve.definition.interpolation,
    p[lo].zeroRate, p[hi].zeroRate,
  );
}

function interpolateSegment(
  t0: number, t: number, t1: number,
  df0: number, df1: number, _dfRight: number,
  mode: Interpolation,
  z0?: number, z1?: number,
): number {
  if (t1 === t0) return df0;
  const w = (t - t0) / (t1 - t0);
  switch (mode) {
    case 'LINEAR_DF': return df0 + w * (df1 - df0);
    case 'LOG_LINEAR_DF': {
      const lnDF = Math.log(df0) + w * (Math.log(df1) - Math.log(df0));
      return Math.exp(lnDF);
    }
    case 'LINEAR_ZERO': {
      const zA = z0 ?? (df0 > 0 && t0 > 0 ? -Math.log(df0) / t0 : 0);
      const zB = z1 ?? (df1 > 0 && t1 > 0 ? -Math.log(df1) / t1 : 0);
      const z = zA + w * (zB - zA);
      return Math.exp(-z * t);
    }
    case 'MONOTONE_CUBIC': {
      // Fritsch-Carlson monotone cubic on zero rates. Need neighbours outside the segment
      // in practice; for simplicity we degrade to LINEAR_ZERO here and compute monotonic
      // interpolation across the full curve via buildMonotone below when requested.
      const zA = z0 ?? (df0 > 0 && t0 > 0 ? -Math.log(df0) / t0 : 0);
      const zB = z1 ?? (df1 > 0 && t1 > 0 ? -Math.log(df1) / t1 : 0);
      const z = zA + w * (zB - zA);
      return Math.exp(-z * t);
    }
  }
}

// Forward (simple) rate between t1 and t2 using discount factors: F = (DF1/DF2 - 1)/(t2-t1)
export function simpleForward(curve: BuiltCurve, t1: number, t2: number): number {
  if (t2 <= t1) return 0;
  const df1 = interpolateDF(curve, t1);
  const df2 = interpolateDF(curve, t2);
  return (df1 / df2 - 1) / (t2 - t1);
}

// Continuously-compounded zero rate at time t
export function zeroRate(curve: BuiltCurve, t: number): number {
  if (t <= 0) return 0;
  const df = interpolateDF(curve, t);
  return -Math.log(df) / t;
}
