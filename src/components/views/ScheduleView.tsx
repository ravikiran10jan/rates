import React from 'react';
import type { Trade } from '../../model/trade';
import type { FixedLeg, FloatingLeg, Leg } from '../../model/common';
import { generateSchedule } from '../../transform/schedules';

function legTitle(leg: Leg): string {
  if (leg.legType === 'FIXED') return `Fixed ${leg.payerReceiver} ${leg.notional.currency} ${(leg.fixedRate * 100).toFixed(3)}%`;
  return `${leg.floatingRateIndex} ${leg.payerReceiver} ${leg.notional.currency}`;
}

function renderLegSchedule(leg: FixedLeg | FloatingLeg, key: number) {
  const periods = generateSchedule(leg.calculationPeriodDates, leg.dayCountFraction, leg.paymentDates.paymentDaysOffset);
  return (
    <div key={key} className="mb-4">
      <div className="text-sm text-desk-accent mb-1">{legTitle(leg)}</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="grid-head text-left">
            <th className="p-1">#</th>
            <th className="p-1">Period Start</th>
            <th className="p-1">Period End</th>
            <th className="p-1">Payment Date</th>
            <th className="p-1">Year Fraction</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {periods.map((p, i) => (
            <tr key={i} className="border-b border-desk-border">
              <td className="p-1 text-desk-mute">{i + 1}</td>
              <td className="p-1">{p.adjustedStartDate}</td>
              <td className="p-1">{p.adjustedEndDate}</td>
              <td className="p-1">{p.paymentDate}</td>
              <td className="p-1">{p.yearFraction.toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScheduleView({ trade }: { trade: Trade }) {
  const p = trade.product;
  if ('legs' in p) {
    return <div>{p.legs.map((l, i) => renderLegSchedule(l, i))}</div>;
  }
  if (p.productType === 'MM_DEPOSIT' || p.productType === 'MM_LOAN') {
    return (
      <div className="text-sm">
        <div className="text-desk-accent mb-1">{p.productType} {p.direction} {p.notional.currency}</div>
        <div className="text-desk-mute">Start: {p.startDate} — Maturity: {p.maturityDate} @ {(p.rate * 100).toFixed(3)}%</div>
      </div>
    );
  }
  if (p.productType === 'FRA') {
    return (
      <div className="text-sm">
        <div className="text-desk-accent mb-1">FRA {p.buySell} {p.notional.currency}</div>
        <div className="text-desk-mute">{p.effectiveDate} → {p.terminationDate} @ {(p.fixedRate * 100).toFixed(4)}% vs {p.floatingIndex}</div>
      </div>
    );
  }
  return <div className="text-desk-mute text-sm">Schedule not available for this product.</div>;
}
