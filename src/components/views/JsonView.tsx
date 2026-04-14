import React from 'react';
import type { Trade } from '../../model/trade';

export function JsonView({ trade }: { trade: Trade }) {
  const text = JSON.stringify(trade, null, 2);
  return (
    <div>
      <div className="flex justify-between mb-2">
        <div className="text-xs text-desk-mute">Logical JSON model</div>
        <button className="btn" onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
      </div>
      <pre className="code">{text}</pre>
    </div>
  );
}
