import React from 'react';
import type { Trade } from '../../model/trade';
import { useCurves } from '../../store/curveStore';
import { riskReport } from '../../pricing/risk';

function fmt(n: number, dp = 2): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp });
}

export function PricingView({ trade }: { trade: Trade }) {
  const valuationDate = useCurves((s) => s.valuationDate);
  const toCurveSet = useCurves((s) => s.toCurveSet);
  const curveSet = React.useMemo(() => toCurveSet(), [toCurveSet]);
  const report = React.useMemo(() => riskReport(trade, valuationDate, curveSet), [trade, valuationDate, curveSet]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-xs text-desk-mute">Valuation date</div>
        <div className="font-mono text-sm">{valuationDate}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label={`PV (${report.valuation.pvCurrency})`} value={fmt(report.valuation.pv)} />
        <MetricCard label="DV01 Total" value={fmt(report.dv01Total)} />
        <MetricCard label="DV01 Discount / Projection" value={`${fmt(report.dv01Discount)} / ${fmt(report.dv01Projection)}`} />
      </div>

      {report.valuation.warnings.length > 0 && (
        <div className="text-xs text-desk-warn mb-3">
          {report.valuation.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {report.valuation.legs.map((l, i) => (
          <div key={i} className="border border-desk-border rounded p-3">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-desk-accent">{l.label}</div>
              <div className="font-mono">PV {l.currency} {fmt(l.pv)}</div>
            </div>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="grid-head text-left">
                  <th className="p-1">Period</th>
                  <th className="p-1">Payment</th>
                  <th className="p-1">Notional</th>
                  <th className="p-1">Rate</th>
                  <th className="p-1">YF</th>
                  <th className="p-1">Amount</th>
                  <th className="p-1">DF</th>
                  <th className="p-1">PV</th>
                </tr>
              </thead>
              <tbody>
                {l.flows.map((f, j) => (
                  <tr key={j} className="border-b border-desk-border">
                    <td className="p-1 text-desk-mute">{f.periodStart}→{f.periodEnd}</td>
                    <td className="p-1">{f.paymentDate}</td>
                    <td className="p-1">{fmt(f.notional, 0)}</td>
                    <td className="p-1">{(f.rate * 100).toFixed(4)}%</td>
                    <td className="p-1">{f.yearFraction.toFixed(4)}</td>
                    <td className="p-1">{fmt(f.amount)}</td>
                    <td className="p-1">{f.discountFactor.toFixed(6)}</td>
                    <td className="p-1">{fmt(f.presentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-desk-border rounded p-3">
      <div className="text-xs text-desk-mute uppercase tracking-widest">{label}</div>
      <div className="text-xl font-mono mt-1">{value}</div>
    </div>
  );
}
