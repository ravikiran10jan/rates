import React, { useState } from 'react';
import { useBlotter } from '../store/blotterStore';
import { JsonView } from './views/JsonView';
import { XmlView } from './views/XmlView';
import { ScheduleView } from './views/ScheduleView';
import { CashflowsView } from './views/CashflowsView';
import { PricingView } from './views/PricingView';
import { DiffView } from './views/DiffView';

type Tab = 'ECONOMICS' | 'SCHEDULE' | 'CASHFLOWS' | 'PRICING' | 'JSON' | 'XML' | 'DIFF';
const TABS: Tab[] = ['ECONOMICS', 'SCHEDULE', 'CASHFLOWS', 'PRICING', 'JSON', 'XML', 'DIFF'];

export function TradeDetail() {
  const id = useBlotter((s) => s.selectedTradeId);
  const trade = useBlotter((s) => (s.selectedTradeId ? s.trades[s.selectedTradeId] : null));
  const [tab, setTab] = useState<Tab>('ECONOMICS');

  if (!trade) return <div className="text-desk-mute text-sm p-3">Select a trade from the blotter to inspect it.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-desk-border">
        {TABS.map((t) => (
          <button key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs uppercase tracking-widest ${tab === t ? 'text-desk-accent border-b-2 border-desk-accent' : 'text-desk-mute'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {tab === 'ECONOMICS' && <EconomicsView trade={trade} />}
        {tab === 'SCHEDULE' && <ScheduleView trade={trade} />}
        {tab === 'CASHFLOWS' && <CashflowsView trade={trade} />}
        {tab === 'PRICING' && <PricingView trade={trade} />}
        {tab === 'JSON' && <JsonView trade={trade} />}
        {tab === 'XML' && <XmlView trade={trade} />}
        {tab === 'DIFF' && <DiffView trade={trade} />}
      </div>
    </div>
  );
}

function EconomicsView({ trade }: { trade: ReturnType<typeof JSON.parse> }) {
  return (
    <div className="text-sm">
      <div className="mb-3">
        <div className="text-desk-mute text-xs">Trade ID</div>
        <div className="text-desk-accent font-mono">{trade.tradeHeader.tradeId}</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <KV label="Product">{trade.product.productType}</KV>
        <KV label="Status">{trade.tradeHeader.status}</KV>
        <KV label="Trade Date">{trade.tradeHeader.tradeDate}</KV>
        <KV label="Book">{trade.tradeHeader.book}</KV>
        <KV label="Trader">{trade.tradeHeader.trader}</KV>
        <KV label="Parties">{trade.parties.map((p: any) => `${p.role}: ${p.name}`).join('  |  ')}</KV>
      </div>
      <pre className="code">{JSON.stringify(trade.product, null, 2)}</pre>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-desk-border rounded p-2">
      <div className="text-xs text-desk-mute uppercase tracking-widest">{label}</div>
      <div className="font-mono mt-1 text-sm">{children}</div>
    </div>
  );
}
