import React, { useState } from 'react';
import { useCurves } from '../../store/curveStore';
import { bootstrap } from '../../pricing/curves/bootstrap';
import { CurveChart } from './CurveChart';
import type { CurveDefinition, CurveInstrument, Interpolation } from '../../pricing/curves/types';
import { Currency, DayCountFraction, FloatingIndex } from '../../model/common';
import { DateInput, NumInput, Row, Section, Select, TextInput } from '../forms/common';

const INTERP_OPTIONS: Interpolation[] = ['LOG_LINEAR_DF', 'LINEAR_ZERO', 'LINEAR_DF', 'MONOTONE_CUBIC'];
const PURPOSES = ['DISCOUNT', 'PROJECTION', 'BASIS'] as const;
const INSTR_KINDS = ['DEPOSIT', 'FRA', 'FUTURE', 'SWAP', 'OIS', 'XCCY_BASIS'] as const;

export function CurveBuilder() {
  const curves = useCurves((s) => s.curves);
  const upsert = useCurves((s) => s.upsertCurve);
  const remove = useCurves((s) => s.removeCurve);
  const valuationDate = useCurves((s) => s.valuationDate);
  const setValuationDate = useCurves((s) => s.setValuationDate);
  const fxSpot = useCurves((s) => s.fxSpot);
  const setFxSpot = useCurves((s) => s.setFxSpot);

  const ids = Object.keys(curves);
  const [selectedId, setSelectedId] = useState<string>(ids[0] ?? '');
  const selected = curves[selectedId];

  React.useEffect(() => { if (!selectedId && ids.length) setSelectedId(ids[0]); }, [ids.join(','), selectedId]);

  const [draftId, setDraftId] = useState<string>('');

  const patch = (p: Partial<CurveDefinition>) => {
    if (!selected) return;
    upsert({ ...selected, ...p });
  };

  const addInstrument = () => {
    if (!selected) return;
    const next: CurveInstrument = { kind: 'DEPOSIT', tenor: { length: 1, unit: 'Y' }, rate: 0.04, dayCount: 'ACT/360' };
    upsert({ ...selected, instruments: [...selected.instruments, next] });
  };
  const updateInstrument = (idx: number, p: Partial<CurveInstrument>) => {
    if (!selected) return;
    const arr = selected.instruments.slice();
    arr[idx] = { ...arr[idx], ...p };
    upsert({ ...selected, instruments: arr });
  };
  const removeInstrument = (idx: number) => {
    if (!selected) return;
    upsert({ ...selected, instruments: selected.instruments.filter((_, i) => i !== idx) });
  };

  const built = React.useMemo(() => (selected ? bootstrap(selected) : null), [selected]);

  return (
    <div className="grid grid-cols-[320px_1fr] gap-4 h-full">
      <div className="border-r border-desk-border pr-3">
        <Section title="Valuation">
          <Row><label>Val Date</label><DateInput value={valuationDate} onChange={setValuationDate} /></Row>
        </Section>

        <Section title="FX Spot">
          {Object.entries(fxSpot).map(([pair, rate]) => (
            <Row key={pair}>
              <label>{pair}</label>
              <NumInput value={rate} onChange={(v) => setFxSpot(pair, v)} step="0.0001" />
            </Row>
          ))}
        </Section>

        <Section title="Curves">
          <div className="flex flex-col gap-1">
            {ids.map((id) => (
              <button key={id}
                      className={`btn text-left ${id === selectedId ? 'btn-primary' : ''}`}
                      onClick={() => setSelectedId(id)}>
                {curves[id].name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <TextInput value={draftId} onChange={setDraftId} placeholder="New curve id" />
            <button className="btn" onClick={() => {
              if (!draftId) return;
              upsert({
                id: draftId,
                name: draftId,
                currency: 'USD',
                purpose: 'DISCOUNT',
                valuationDate,
                interpolation: 'LOG_LINEAR_DF',
                instruments: [],
              });
              setSelectedId(draftId);
              setDraftId('');
            }}>+ Add</button>
          </div>
        </Section>
      </div>

      {selected && (
        <div className="overflow-auto pr-2">
          <Section title="Curve Definition">
            <Row><label>Name</label><TextInput value={selected.name} onChange={(v) => patch({ name: v })} /></Row>
            <Row><label>Currency</label><Select value={selected.currency} onChange={(v) => patch({ currency: v })} options={Currency.options} /></Row>
            <Row><label>Purpose</label><Select value={selected.purpose} onChange={(v) => patch({ purpose: v })} options={PURPOSES} /></Row>
            <Row><label>Index (projection)</label>
              <Select value={selected.index ?? 'USD-SOFR'} onChange={(v) => patch({ index: v })} options={FloatingIndex.options} />
            </Row>
            <Row><label>Interpolation</label>
              <Select value={selected.interpolation} onChange={(v) => patch({ interpolation: v })} options={INTERP_OPTIONS} />
            </Row>
            <div className="flex justify-end mt-2">
              <button className="btn btn-danger" onClick={() => { remove(selected.id); setSelectedId(''); }}>Delete curve</button>
            </div>
          </Section>

          <Section title="Instruments (quoted par rates)">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="grid-head text-left">
                  <th className="p-1">Kind</th>
                  <th className="p-1">Tenor</th>
                  <th className="p-1">Unit</th>
                  <th className="p-1">Rate %</th>
                  <th className="p-1">DCF</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selected.instruments.map((ins, i) => (
                  <tr key={i} className="border-b border-desk-border">
                    <td className="p-1">
                      <Select value={ins.kind} onChange={(v) => updateInstrument(i, { kind: v })} options={INSTR_KINDS} />
                    </td>
                    <td className="p-1">
                      <NumInput value={ins.tenor.length} onChange={(v) => updateInstrument(i, { tenor: { ...ins.tenor, length: v } })} />
                    </td>
                    <td className="p-1">
                      <Select value={ins.tenor.unit} onChange={(v) => updateInstrument(i, { tenor: { ...ins.tenor, unit: v } })} options={['D', 'W', 'M', 'Y']} />
                    </td>
                    <td className="p-1">
                      <NumInput value={ins.rate * 100} onChange={(v) => updateInstrument(i, { rate: v / 100 })} step="0.001" />
                    </td>
                    <td className="p-1">
                      <Select value={ins.dayCount} onChange={(v) => updateInstrument(i, { dayCount: v })} options={DayCountFraction.options} />
                    </td>
                    <td className="p-1"><button className="btn btn-danger" onClick={() => removeInstrument(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <button className="btn btn-primary" onClick={addInstrument}>+ Instrument</button>
            </div>
          </Section>

          {built && (
            <>
              <Section title="Zero Rates">
                <CurveChart curve={built} mode="ZERO" />
              </Section>
              <Section title="Discount Factors">
                <CurveChart curve={built} mode="DF" />
              </Section>
              <Section title="1Y Forwards">
                <CurveChart curve={built} mode="FWD_1Y" />
              </Section>
              <Section title="Bootstrapped Pillars">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="grid-head text-left">
                      <th className="p-1">Date</th>
                      <th className="p-1">Year</th>
                      <th className="p-1">DF</th>
                      <th className="p-1">Zero %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {built.pillars.map((p, i) => (
                      <tr key={i} className="border-b border-desk-border">
                        <td className="p-1">{p.date}</td>
                        <td className="p-1">{p.time.toFixed(3)}</td>
                        <td className="p-1">{p.df.toFixed(8)}</td>
                        <td className="p-1">{(p.zeroRate * 100).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
