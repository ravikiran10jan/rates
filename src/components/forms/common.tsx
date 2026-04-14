import React from 'react';

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[160px_1fr] gap-2 items-center py-1">{children}</div>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-desk-border rounded p-3 mb-3">
      <div className="text-xs uppercase tracking-widest text-desk-mute mb-2">{title}</div>
      {children}
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] | T[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export function NumInput({ value, onChange, step = 'any', min }: { value: number; onChange: (v: number) => void; step?: string; min?: number }) {
  return (
    <input type="number" step={step} min={min} value={value}
           onChange={(e) => onChange(parseFloat(e.target.value))} />
  );
}

export function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

export function FormFooter({ onCancel, onBook, disabled }: { onCancel: () => void; onBook: () => void; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-desk-border mt-3">
      <button className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn btn-primary" onClick={onBook} disabled={disabled}>Book Trade</button>
    </div>
  );
}
