import React, { useMemo, useState } from 'react';
import type { Trade } from '../../model/trade';
import {
  LifecycleEvent,
  LifecycleEventType,
  summarizeEvent,
  TerminationReason,
  ExerciseKind,
  ExerciseParty,
  PaymentDirection,
} from '../../model/lifecycle';
import { Currency } from '../../model/common';
import { useBlotter } from '../../store/blotterStore';
import { Section, Row, NumInput, DateInput, Select, TextInput } from '../forms/common';

type EType = LifecycleEvent['eventType'];

function nowIso(): string {
  return new Date().toISOString();
}

function shortId(): string {
  return `EV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function blankEvent(eventType: EType): LifecycleEvent {
  const today = new Date().toISOString().slice(0, 10);
  const common = { eventId: shortId(), timestamp: nowIso(), recordedBy: '' };
  switch (eventType) {
    case 'AMENDMENT':
      return {
        ...common, eventType: 'AMENDMENT',
        effectiveDate: today, reason: 'Rate correction',
        changedFields: '{}', previousValues: '{}', approvedBy: 'OPS',
      };
    case 'NOVATION':
      return {
        ...common, eventType: 'NOVATION',
        novationDate: today, outgoingPartyId: 'CP1', incomingPartyId: 'CP2',
        incomingPartyName: 'New Counterparty', consentsObtained: true,
      };
    case 'PARTIAL_TERMINATION':
      return {
        ...common, eventType: 'PARTIAL_TERMINATION',
        terminationDate: today, terminatedNotional: 1_000_000, currency: 'USD',
      };
    case 'FULL_TERMINATION':
      return {
        ...common, eventType: 'FULL_TERMINATION',
        terminationDate: today, settlementAmount: { amount: 0, currency: 'USD' },
        reason: 'MUTUAL',
      };
    case 'EXERCISE':
      return {
        ...common, eventType: 'EXERCISE',
        exerciseDate: today, exerciseType: 'FULL', notifiedBy: 'PARTY_A',
      };
    case 'RATE_FIXING':
      return {
        ...common, eventType: 'RATE_FIXING',
        fixingDate: today, legIndex: 0, indexName: 'USD-SOFR',
        fixedRate: 0.045, periodStart: today, periodEnd: today,
      };
    case 'PAYMENT':
      return {
        ...common, eventType: 'PAYMENT',
        paymentDate: today, amount: { amount: 0, currency: 'USD' }, direction: 'PAY',
      };
    case 'ROLLOVER':
      return {
        ...common, eventType: 'ROLLOVER',
        rolloverDate: today, newMaturityDate: today, newRate: 0.05,
      };
    case 'COMPRESSION':
      return {
        ...common, eventType: 'COMPRESSION',
        compressionDate: today, compressionCycleId: 'CYCLE-1',
        netPayment: { amount: 0, currency: 'USD' }, replacedTradeIds: [],
      };
    case 'INCREASE':
      return {
        ...common, eventType: 'INCREASE',
        effectiveDate: today, addedNotional: 1_000_000, currency: 'USD',
      };
  }
}

export function LifecycleView({ trade }: { trade: Trade }) {
  const add = useBlotter((s) => s.addLifecycleEvent);
  const remove = useBlotter((s) => s.removeLifecycleEvent);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LifecycleEvent>(blankEvent('AMENDMENT'));
  const [error, setError] = useState<string | null>(null);

  const events = trade.lifecycleEvents ?? [];
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [events],
  );

  const onChangeType = (t: EType) => {
    setDraft(blankEvent(t));
    setError(null);
  };

  const save = () => {
    const parsed = LifecycleEvent.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      return;
    }
    add(trade.tradeHeader.tradeId, parsed.data);
    setDraft(blankEvent(parsed.data.eventType));
    setEditing(false);
    setError(null);
  };

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-desk-mute uppercase text-xs tracking-widest">Lifecycle Events</div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Add Event
          </button>
        )}
      </div>

      {editing && (
        <Section title="New Event">
          <Row>
            <label>Event Type</label>
            <Select
              value={draft.eventType}
              onChange={(v) => onChangeType(v as EType)}
              options={LifecycleEventType.options}
            />
          </Row>
          <Row>
            <label>Timestamp</label>
            <TextInput value={draft.timestamp} onChange={(v) => setDraft({ ...draft, timestamp: v } as LifecycleEvent)} />
          </Row>
          <Row>
            <label>Recorded By</label>
            <TextInput value={draft.recordedBy ?? ''} onChange={(v) => setDraft({ ...draft, recordedBy: v } as LifecycleEvent)} />
          </Row>

          <EventFields draft={draft} setDraft={setDraft} />

          {error && <div className="text-red-400 text-xs mt-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn" onClick={() => { setEditing(false); setError(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </Section>
      )}

      <Section title="History">
        {sorted.length === 0 && (
          <div className="text-desk-mute text-sm">No lifecycle events recorded for this trade.</div>
        )}
        {sorted.length > 0 && (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-desk-mute uppercase tracking-widest">
                <th className="text-left py-1">Timestamp</th>
                <th className="text-left py-1">Type</th>
                <th className="text-left py-1">Summary</th>
                <th className="text-right py-1"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.eventId} className="border-t border-desk-border">
                  <td className="py-1 pr-2">{e.timestamp}</td>
                  <td className="py-1 pr-2 text-desk-accent">{e.eventType}</td>
                  <td className="py-1 pr-2">{summarizeEvent(e)}</td>
                  <td className="py-1 text-right">
                    <button
                      className="btn btn-danger"
                      onClick={() => remove(trade.tradeHeader.tradeId, e.eventId)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function EventFields({
  draft,
  setDraft,
}: {
  draft: LifecycleEvent;
  setDraft: (e: LifecycleEvent) => void;
}) {
  switch (draft.eventType) {
    case 'AMENDMENT':
      return (
        <>
          <Row><label>Effective Date</label>
            <DateInput value={draft.effectiveDate} onChange={(v) => setDraft({ ...draft, effectiveDate: v })} />
          </Row>
          <Row><label>Reason</label>
            <TextInput value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} />
          </Row>
          <Row><label>Changed Fields</label>
            <TextInput
              value={typeof draft.changedFields === 'string' ? draft.changedFields : JSON.stringify(draft.changedFields)}
              onChange={(v) => setDraft({ ...draft, changedFields: v })}
            />
          </Row>
          <Row><label>Previous Values</label>
            <TextInput
              value={typeof draft.previousValues === 'string' ? draft.previousValues : JSON.stringify(draft.previousValues)}
              onChange={(v) => setDraft({ ...draft, previousValues: v })}
            />
          </Row>
          <Row><label>Approved By</label>
            <TextInput value={draft.approvedBy} onChange={(v) => setDraft({ ...draft, approvedBy: v })} />
          </Row>
        </>
      );
    case 'NOVATION':
      return (
        <>
          <Row><label>Novation Date</label>
            <DateInput value={draft.novationDate} onChange={(v) => setDraft({ ...draft, novationDate: v })} />
          </Row>
          <Row><label>Outgoing Party ID</label>
            <TextInput value={draft.outgoingPartyId} onChange={(v) => setDraft({ ...draft, outgoingPartyId: v })} />
          </Row>
          <Row><label>Incoming Party ID</label>
            <TextInput value={draft.incomingPartyId} onChange={(v) => setDraft({ ...draft, incomingPartyId: v })} />
          </Row>
          <Row><label>Incoming Party Name</label>
            <TextInput value={draft.incomingPartyName} onChange={(v) => setDraft({ ...draft, incomingPartyName: v })} />
          </Row>
          <Row><label>Consents Obtained</label>
            <Select
              value={draft.consentsObtained ? 'YES' : 'NO'}
              onChange={(v) => setDraft({ ...draft, consentsObtained: v === 'YES' })}
              options={['YES', 'NO']}
            />
          </Row>
          <Row><label>Novation Fee</label>
            <NumInput
              value={draft.novationFee?.amount ?? 0}
              onChange={(v) => setDraft({ ...draft, novationFee: { amount: v, currency: draft.novationFee?.currency ?? 'USD' } })}
            />
          </Row>
          <Row><label>Fee Currency</label>
            <Select
              value={draft.novationFee?.currency ?? 'USD'}
              onChange={(v) => setDraft({ ...draft, novationFee: { amount: draft.novationFee?.amount ?? 0, currency: v } })}
              options={Currency.options}
            />
          </Row>
        </>
      );
    case 'PARTIAL_TERMINATION':
      return (
        <>
          <Row><label>Termination Date</label>
            <DateInput value={draft.terminationDate} onChange={(v) => setDraft({ ...draft, terminationDate: v })} />
          </Row>
          <Row><label>Terminated Notional</label>
            <NumInput value={draft.terminatedNotional} onChange={(v) => setDraft({ ...draft, terminatedNotional: v })} />
          </Row>
          <Row><label>Currency</label>
            <Select value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={Currency.options} />
          </Row>
        </>
      );
    case 'FULL_TERMINATION':
      return (
        <>
          <Row><label>Termination Date</label>
            <DateInput value={draft.terminationDate} onChange={(v) => setDraft({ ...draft, terminationDate: v })} />
          </Row>
          <Row><label>Settlement Amount</label>
            <NumInput
              value={draft.settlementAmount.amount}
              onChange={(v) => setDraft({ ...draft, settlementAmount: { ...draft.settlementAmount, amount: v } })}
            />
          </Row>
          <Row><label>Settlement CCY</label>
            <Select
              value={draft.settlementAmount.currency}
              onChange={(v) => setDraft({ ...draft, settlementAmount: { ...draft.settlementAmount, currency: v } })}
              options={Currency.options}
            />
          </Row>
          <Row><label>Reason</label>
            <Select value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} options={TerminationReason.options} />
          </Row>
        </>
      );
    case 'EXERCISE':
      return (
        <>
          <Row><label>Exercise Date</label>
            <DateInput value={draft.exerciseDate} onChange={(v) => setDraft({ ...draft, exerciseDate: v })} />
          </Row>
          <Row><label>Exercise Type</label>
            <Select value={draft.exerciseType} onChange={(v) => setDraft({ ...draft, exerciseType: v })} options={ExerciseKind.options} />
          </Row>
          <Row><label>Notified By</label>
            <Select value={draft.notifiedBy} onChange={(v) => setDraft({ ...draft, notifiedBy: v })} options={ExerciseParty.options} />
          </Row>
          <Row><label>Resulting Trade ID</label>
            <TextInput
              value={draft.resultingTradeId ?? ''}
              onChange={(v) => setDraft({ ...draft, resultingTradeId: v || undefined })}
            />
          </Row>
        </>
      );
    case 'RATE_FIXING':
      return (
        <>
          <Row><label>Fixing Date</label>
            <DateInput value={draft.fixingDate} onChange={(v) => setDraft({ ...draft, fixingDate: v })} />
          </Row>
          <Row><label>Leg Index</label>
            <Select
              value={String(draft.legIndex) as '0' | '1'}
              onChange={(v) => setDraft({ ...draft, legIndex: (v === '1' ? 1 : 0) })}
              options={['0', '1']}
            />
          </Row>
          <Row><label>Index Name</label>
            <TextInput value={draft.indexName} onChange={(v) => setDraft({ ...draft, indexName: v })} />
          </Row>
          <Row><label>Fixed Rate</label>
            <NumInput value={draft.fixedRate} onChange={(v) => setDraft({ ...draft, fixedRate: v })} step="0.0001" />
          </Row>
          <Row><label>Period Start</label>
            <DateInput value={draft.periodStart} onChange={(v) => setDraft({ ...draft, periodStart: v })} />
          </Row>
          <Row><label>Period End</label>
            <DateInput value={draft.periodEnd} onChange={(v) => setDraft({ ...draft, periodEnd: v })} />
          </Row>
        </>
      );
    case 'PAYMENT':
      return (
        <>
          <Row><label>Payment Date</label>
            <DateInput value={draft.paymentDate} onChange={(v) => setDraft({ ...draft, paymentDate: v })} />
          </Row>
          <Row><label>Leg Index</label>
            <Select
              value={draft.legIndex === undefined ? 'NONE' : String(draft.legIndex)}
              onChange={(v) => setDraft({ ...draft, legIndex: v === 'NONE' ? undefined : (v === '1' ? 1 : 0) })}
              options={['NONE', '0', '1']}
            />
          </Row>
          <Row><label>Amount</label>
            <NumInput
              value={draft.amount.amount}
              onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, amount: v } })}
            />
          </Row>
          <Row><label>Currency</label>
            <Select
              value={draft.amount.currency}
              onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, currency: v } })}
              options={Currency.options}
            />
          </Row>
          <Row><label>Direction</label>
            <Select value={draft.direction} onChange={(v) => setDraft({ ...draft, direction: v })} options={PaymentDirection.options} />
          </Row>
        </>
      );
    case 'ROLLOVER':
      return (
        <>
          <Row><label>Rollover Date</label>
            <DateInput value={draft.rolloverDate} onChange={(v) => setDraft({ ...draft, rolloverDate: v })} />
          </Row>
          <Row><label>New Maturity</label>
            <DateInput value={draft.newMaturityDate} onChange={(v) => setDraft({ ...draft, newMaturityDate: v })} />
          </Row>
          <Row><label>New Rate</label>
            <NumInput value={draft.newRate} onChange={(v) => setDraft({ ...draft, newRate: v })} step="0.0001" />
          </Row>
          <Row><label>New Notional</label>
            <NumInput
              value={draft.newNotional ?? 0}
              onChange={(v) => setDraft({ ...draft, newNotional: v })}
            />
          </Row>
        </>
      );
    case 'COMPRESSION':
      return (
        <>
          <Row><label>Compression Date</label>
            <DateInput value={draft.compressionDate} onChange={(v) => setDraft({ ...draft, compressionDate: v })} />
          </Row>
          <Row><label>Cycle ID</label>
            <TextInput value={draft.compressionCycleId} onChange={(v) => setDraft({ ...draft, compressionCycleId: v })} />
          </Row>
          <Row><label>Net Payment</label>
            <NumInput
              value={draft.netPayment.amount}
              onChange={(v) => setDraft({ ...draft, netPayment: { ...draft.netPayment, amount: v } })}
            />
          </Row>
          <Row><label>Currency</label>
            <Select
              value={draft.netPayment.currency}
              onChange={(v) => setDraft({ ...draft, netPayment: { ...draft.netPayment, currency: v } })}
              options={Currency.options}
            />
          </Row>
          <Row><label>Replaced Trade IDs</label>
            <TextInput
              value={draft.replacedTradeIds.join(',')}
              onChange={(v) => setDraft({ ...draft, replacedTradeIds: v.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Row>
        </>
      );
    case 'INCREASE':
      return (
        <>
          <Row><label>Effective Date</label>
            <DateInput value={draft.effectiveDate} onChange={(v) => setDraft({ ...draft, effectiveDate: v })} />
          </Row>
          <Row><label>Added Notional</label>
            <NumInput value={draft.addedNotional} onChange={(v) => setDraft({ ...draft, addedNotional: v })} />
          </Row>
          <Row><label>Currency</label>
            <Select value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={Currency.options} />
          </Row>
        </>
      );
  }
}
