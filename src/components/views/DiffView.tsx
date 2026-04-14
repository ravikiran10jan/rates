import React from 'react';
import type { Trade } from '../../model/trade';
import { tradeToXml } from '../../transform/jsonToXml';
import { xmlToTrade } from '../../transform/xmlToJson';

export function DiffView({ trade }: { trade: Trade }) {
  const { xml, roundTrippedJson, diff } = React.useMemo(() => {
    const xml = tradeToXml(trade);
    let roundTrippedJson = '';
    let diff: string[] = [];
    try {
      const back = xmlToTrade(xml);
      roundTrippedJson = JSON.stringify(back, null, 2);
      const origJson = JSON.stringify(trade, null, 2);
      diff = computeDiff(origJson, roundTrippedJson);
    } catch (e: any) {
      roundTrippedJson = `[error: ${e?.message ?? String(e)}]`;
    }
    return { xml, roundTrippedJson, diff };
  }, [trade]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-desk-mute mb-1">Original JSON</div>
          <pre className="code h-[300px] overflow-auto">{JSON.stringify(trade, null, 2)}</pre>
        </div>
        <div>
          <div className="text-xs text-desk-mute mb-1">Round-tripped JSON (XML → JSON)</div>
          <pre className="code h-[300px] overflow-auto">{roundTrippedJson}</pre>
        </div>
      </div>
      <div>
        <div className="text-xs text-desk-mute mb-1">Differences ({diff.length})</div>
        {diff.length === 0
          ? <div className="text-desk-accent text-sm">✓ Round-trip identical</div>
          : <pre className="code max-h-[200px] overflow-auto">{diff.join('\n')}</pre>}
      </div>
    </div>
  );
}

function computeDiff(a: string, b: string): string[] {
  const la = a.split('\n');
  const lb = b.split('\n');
  const max = Math.max(la.length, lb.length);
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    if (la[i] !== lb[i]) {
      if (la[i] !== undefined) out.push(`- ${la[i]}`);
      if (lb[i] !== undefined) out.push(`+ ${lb[i]}`);
    }
  }
  return out;
}
