import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Blotter } from './components/Blotter';
import { TradeDetail } from './components/TradeDetail';
import { CurveBuilder } from './components/curves/CurveBuilder';
import './components/forms'; // side-effect: register forms

type View = 'TRADING' | 'CURVES';

export default function App() {
  const [view, setView] = useState<View>('TRADING');

  return (
    <div className="h-full w-full flex flex-col">
      <header className="flex items-center justify-between border-b border-desk-border px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="text-desk-accent font-semibold tracking-widest">RATES · FO · PLAYGROUND</div>
          <div className="flex gap-1 ml-4">
            <button className={`btn ${view === 'TRADING' ? 'btn-primary' : ''}`} onClick={() => setView('TRADING')}>Trading</button>
            <button className={`btn ${view === 'CURVES' ? 'btn-primary' : ''}`} onClick={() => setView('CURVES')}>Curves</button>
          </div>
        </div>
        <div className="text-desk-mute text-xs">Client-side · FpML-subset · CDM-inspired</div>
      </header>
      <main className="flex-1 grid grid-cols-[240px_1fr] overflow-hidden">
        <Sidebar onOpenCurves={() => setView('CURVES')} />
        {view === 'TRADING' ? (
          <div className="grid grid-rows-[40%_1fr] overflow-hidden">
            <div className="border-b border-desk-border overflow-hidden"><Blotter /></div>
            <div className="overflow-hidden"><TradeDetail /></div>
          </div>
        ) : (
          <div className="overflow-hidden p-3"><CurveBuilder /></div>
        )}
      </main>
    </div>
  );
}
