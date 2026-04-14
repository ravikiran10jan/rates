import React from 'react';
import { useBlotter } from '../store/blotterStore';
import type { Trade, BlotterRow } from '../model/trade';

function rowOf(trade: Trade): BlotterRow {
  const p = trade.product;
  const cpty = trade.parties.find((x) => x.role === 'COUNTERPARTY')?.name ?? '';
  let currency = '';
  let notional: number | null = null;
  let maturity: string | null = null;
  if ('legs' in p && Array.isArray(p.legs)) {
    const leg0 = p.legs[0];
    currency = leg0.notional.currency;
    notional = leg0.notional.initial;
    maturity = leg0.calculationPeriodDates.terminationDate;
  } else if (p.productType === 'MM_DEPOSIT' || p.productType === 'MM_LOAN') {
    currency = p.notional.currency; notional = p.notional.amount; maturity = p.maturityDate;
  } else if (p.productType === 'FRA') {
    currency = p.notional.currency; notional = p.notional.amount; maturity = p.terminationDate;
  } else if (p.productType === 'SWAPTION') {
    const u = p.underlyingSwap.legs[0];
    currency = u.notional.currency; notional = u.notional.initial; maturity = u.calculationPeriodDates.terminationDate;
  } else if (p.productType === 'CAP_FLOOR') {
    currency = p.notional.currency; notional = p.notional.initial;
    maturity = p.calculationPeriodDates.terminationDate;
  }
  return {
    tradeId: trade.tradeHeader.tradeId,
    product: p.productType,
    status: trade.tradeHeader.status,
    book: trade.tradeHeader.book,
    trader: trade.tradeHeader.trader,
    tradeDate: trade.tradeHeader.tradeDate,
    currency, notional, maturity,
    counterparty: cpty,
  };
}

export function Blotter() {
  const trades = useBlotter((s) => Object.values(s.trades));
  const selectedId = useBlotter((s) => s.selectedTradeId);
  const select = useBlotter((s) => s.select);
  const remove = useBlotter((s) => s.removeTrade);

  if (trades.length === 0) {
    return <div className="text-desk-mute p-3 text-sm">No trades booked. Use the sidebar to book a new trade.</div>;
  }

  return (
    <div className="scroll-y h-full">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="grid-head text-left">
            <th className="p-2">Trade ID</th>
            <th className="p-2">Product</th>
            <th className="p-2">Status</th>
            <th className="p-2">Book</th>
            <th className="p-2">Trader</th>
            <th className="p-2">Counterparty</th>
            <th className="p-2">Ccy</th>
            <th className="p-2 text-right">Notional</th>
            <th className="p-2">Maturity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const r = rowOf(t);
            const sel = selectedId === r.tradeId;
            return (
              <tr key={r.tradeId}
                  onClick={() => select(r.tradeId)}
                  className={`cursor-pointer border-b border-desk-border ${sel ? 'bg-desk-panel' : 'hover:bg-desk-panel/50'}`}>
                <td className="p-2 text-desk-accent">{r.tradeId}</td>
                <td className="p-2">{r.product}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.book}</td>
                <td className="p-2">{r.trader}</td>
                <td className="p-2">{r.counterparty}</td>
                <td className="p-2">{r.currency}</td>
                <td className="p-2 text-right">{r.notional?.toLocaleString() ?? ''}</td>
                <td className="p-2">{r.maturity ?? ''}</td>
                <td className="p-2 text-right">
                  <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); remove(r.tradeId); }}>✕</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
