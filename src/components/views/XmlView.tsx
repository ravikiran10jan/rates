import React from 'react';
import type { Trade } from '../../model/trade';
import { tradeToXml } from '../../transform/jsonToXml';

export function XmlView({ trade }: { trade: Trade }) {
  const text = React.useMemo(() => tradeToXml(trade), [trade]);
  return (
    <div>
      <div className="flex justify-between mb-2">
        <div className="text-xs text-desk-mute">FpML-subset XML (generated)</div>
        <button className="btn" onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
      </div>
      <pre className="code">{text}</pre>
    </div>
  );
}
