import React, { useState } from 'react';
import { allProductForms, getProductForm, type ProductFormMeta } from './forms/FormRegistry';
import './forms'; // ensure forms register
import { useBlotter } from '../store/blotterStore';
import type { Trade } from '../model/trade';

export function Sidebar({ onOpenCurves }: { onOpenCurves: () => void }) {
  const [openForm, setOpenForm] = useState<ProductFormMeta | null>(null);
  const addTrade = useBlotter((s) => s.addTrade);
  const importTrades = useBlotter((s) => s.importTrades);
  const reset = useBlotter((s) => s.reset);

  const groups: Record<string, ProductFormMeta[]> = {};
  for (const f of allProductForms()) {
    (groups[f.group] ??= []).push(f);
  }

  const onBook = (trade: Trade) => {
    addTrade(trade);
    setOpenForm(null);
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const trades: Trade[] = Array.isArray(parsed) ? parsed : [parsed];
      importTrades(trades);
    } catch (err) {
      alert('Invalid JSON');
    }
    e.target.value = '';
  };

  return (
    <div className="p-3 border-r border-desk-border h-full overflow-auto text-sm flex flex-col">
      <div className="text-xs uppercase tracking-widest text-desk-mute mb-2">New Trade</div>
      {Object.entries(groups).map(([group, forms]) => (
        <div key={group} className="mb-3">
          <div className="text-[10px] text-desk-mute uppercase tracking-widest mb-1">{group}</div>
          <div className="flex flex-col gap-1">
            {forms.map((f) => (
              <button key={f.productType}
                      className="btn text-left"
                      onClick={() => setOpenForm(f)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-2 border-t border-desk-border pt-3">
        <button className="btn w-full" onClick={onOpenCurves}>Curve Builder →</button>
      </div>
      <div className="mt-auto pt-3 border-t border-desk-border">
        <label className="btn w-full block text-center cursor-pointer">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importFile} />
        </label>
        <button className="btn w-full mt-2" onClick={() => {
          const trades = Object.values(useBlotter.getState().trades);
          const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'trades.json'; a.click(); URL.revokeObjectURL(url);
        }}>Export JSON</button>
        <button className="btn btn-danger w-full mt-2" onClick={() => { if (confirm('Clear all trades?')) reset(); }}>Clear Blotter</button>
      </div>

      {openForm && (
        <FormModal title={openForm.label} onClose={() => setOpenForm(null)}>
          <openForm.Form onBook={onBook} onCancel={() => setOpenForm(null)} />
        </FormModal>
      )}
    </div>
  );
}

function FormModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-desk-panel border border-desk-border rounded w-[720px] max-h-[85vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-desk-border pb-2 mb-3">
          <div className="text-desk-accent">{title}</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
