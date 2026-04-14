import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import type { BuiltCurve } from '../../pricing/curves/types';
import { zeroRate, simpleForward, interpolateDF } from '../../pricing/curves/interpolation';

type Mode = 'ZERO' | 'DF' | 'FWD_1Y';

export function CurveChart({ curve, mode = 'ZERO', compare }: { curve: BuiltCurve; mode?: Mode; compare?: BuiltCurve }) {
  const data = React.useMemo(() => {
    const points: any[] = [];
    const tMax = Math.max(30, curve.pillars[curve.pillars.length - 1]?.time ?? 30);
    const steps = 60;
    for (let i = 1; i <= steps; i++) {
      const t = (tMax * i) / steps;
      const row: any = { t: t.toFixed(2) };
      if (mode === 'ZERO') row.value = zeroRate(curve, t) * 100;
      else if (mode === 'DF') row.value = interpolateDF(curve, t);
      else row.value = simpleForward(curve, t, t + 1) * 100;
      if (compare) {
        if (mode === 'ZERO') row.compare = zeroRate(compare, t) * 100;
        else if (mode === 'DF') row.compare = interpolateDF(compare, t);
        else row.compare = simpleForward(compare, t, t + 1) * 100;
      }
      points.push(row);
    }
    return points;
  }, [curve, mode, compare]);

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#1f2a52" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fill: '#8ea0d8', fontSize: 11 }} stroke="#1f2a52" label={{ value: 'Years', fill: '#8ea0d8', position: 'insideBottom', offset: -5 }} />
          <YAxis tick={{ fill: '#8ea0d8', fontSize: 11 }} stroke="#1f2a52" />
          <Tooltip contentStyle={{ background: '#111833', border: '1px solid #1f2a52', color: '#d8e0ff' }} />
          <Legend wrapperStyle={{ color: '#8ea0d8', fontSize: 11 }} />
          <Line type="monotone" dataKey="value" stroke="#5eead4" dot={false} name={curve.definition.name} />
          {compare && <Line type="monotone" dataKey="compare" stroke="#f59e0b" dot={false} name={compare.definition.name} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
