// Shared stub utilities and starter samples for all product forms.
// Agents flesh these out into full booking screens; the stubs keep the app compilable.

import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import { newTradeId } from '../../store/blotterStore';
import { FormFooter } from './common';
import type { ProductFormProps } from './FormRegistry';

export function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
export function plusYears(base: string, years: number): string {
  const d = new Date(base); d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
export function plusMonths(base: string, months: number): string {
  const d = new Date(base); d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
export { newTradeId };

// Simple JSON-editor form. Agents should replace with proper field-by-field forms.
export function JsonEditorForm({ initial, newSample, onBook, onCancel }: ProductFormProps & { newSample: () => Trade }) {
  const [text, setText] = useState(() => JSON.stringify(initial ?? newSample(), null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <div className="text-xs text-desk-mute mb-2">Edit the logical JSON directly. A structured form will be added soon.</div>
      <textarea className="w-full h-[420px] font-mono text-xs" value={text} onChange={(e) => { setText(e.target.value); setErr(null); }} />
      {err && <div className="text-desk-danger text-xs mt-2">{err}</div>}
      <FormFooter onCancel={onCancel} onBook={() => {
        try { onBook(JSON.parse(text)); } catch (e: any) { setErr(e?.message ?? 'Invalid JSON'); }
      }} />
    </div>
  );
}
