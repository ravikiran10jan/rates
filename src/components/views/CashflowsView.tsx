import React, { useState } from 'react';
import type { Trade } from '../../model/trade';
import type { Cashflow } from '../../model/cashflows';
import { useBlotter } from '../../store/blotterStore';
import { Section, Row, NumInput, DateInput, Select, TextInput } from '../forms/common';
import { Currency } from '../../model/common';

type Kind = 'AGENCY_FEE' | 'XVA_PREMIUM' | 'PNL_SWEEP' | 'FUNDING';

function blankCashflow(kind: Kind): Cashflow {
  const today = new Date().toISOString().slice(0, 10);
  switch (kind) {
    case 'AGENCY_FEE':
      return { cashflowType: 'AGENCY_FEE', agentPartyId: 'AGENT', amount: { amount: 1000, currency: 'USD' }, paymentDate: today, frequency: 'ONE_OFF' };
    case 'XVA_PREMIUM':
      return { cashflowType: 'XVA_PREMIUM', component: 'CVA', amount: { amount: 5000, currency: 'USD' }, payer: 'BOOK', receiver: 'XVA_DESK', paymentDate: today };
    case 'PNL_SWEEP':
      return { cashflowType: 'PNL_SWEEP', fromBook: 'RATES_USD', toBook: 'CENTRAL_PNL', amount: { amount: 10000, currency: 'USD' }, sweepDate: today, reason: 'EOD_PNL' };
    case 'FUNDING':
      return { cashflowType: 'FUNDING', direction: 'CHARGE', currency: 'USD', notional: 1_000_000, rate: 0.05, startDate: today, endDate: today, paymentDate: today, treasuryBook: 'TREASURY', fundingDesk: 'TREASURY' };
  }
}

export function CashflowsView({ trade }: { trade: Trade }) {
  const add = useBlotter((s) => s.addCashflow);
  const remove = useBlotter((s) => s.removeCashflow);
  const [kind, setKind] = useState<Kind>('AGENCY_FEE');
  const [draft, setDraft] = useState<Cashflow>(blankCashflow('AGENCY_FEE'));

  const onKind = (k: Kind) => { setKind(k); setDraft(blankCashflow(k)); };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Section title="Add Cashflow">
          <Row><label>Type</label>
            <Select value={kind} onChange={(v) => onKind(v as Kind)}
                    options={['AGENCY_FEE', 'XVA_PREMIUM', 'PNL_SWEEP', 'FUNDING']} />
          </Row>
          {draft.cashflowType === 'AGENCY_FEE' && (
            <>
              <Row><label>Agent Party ID</label><TextInput value={draft.agentPartyId} onChange={(v) => setDraft({ ...draft, agentPartyId: v })} /></Row>
              <Row><label>Amount</label><NumInput value={draft.amount.amount} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, amount: v } })} /></Row>
              <Row><label>Currency</label><Select value={draft.amount.currency} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, currency: v } })} options={Currency.options} /></Row>
              <Row><label>Payment Date</label><DateInput value={draft.paymentDate} onChange={(v) => setDraft({ ...draft, paymentDate: v })} /></Row>
              <Row><label>Frequency</label><Select value={draft.frequency} onChange={(v) => setDraft({ ...draft, frequency: v })} options={['ONE_OFF', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']} /></Row>
            </>
          )}
          {draft.cashflowType === 'XVA_PREMIUM' && (
            <>
              <Row><label>Component</label><Select value={draft.component} onChange={(v) => setDraft({ ...draft, component: v })} options={['CVA', 'DVA', 'FVA', 'MVA', 'KVA', 'COLVA']} /></Row>
              <Row><label>Amount</label><NumInput value={draft.amount.amount} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, amount: v } })} /></Row>
              <Row><label>Currency</label><Select value={draft.amount.currency} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, currency: v } })} options={Currency.options} /></Row>
              <Row><label>Payer</label><Select value={draft.payer} onChange={(v) => setDraft({ ...draft, payer: v })} options={['BOOK', 'COUNTERPARTY', 'XVA_DESK']} /></Row>
              <Row><label>Receiver</label><Select value={draft.receiver} onChange={(v) => setDraft({ ...draft, receiver: v })} options={['BOOK', 'COUNTERPARTY', 'XVA_DESK']} /></Row>
              <Row><label>Payment Date</label><DateInput value={draft.paymentDate} onChange={(v) => setDraft({ ...draft, paymentDate: v })} /></Row>
            </>
          )}
          {draft.cashflowType === 'PNL_SWEEP' && (
            <>
              <Row><label>From Book</label><TextInput value={draft.fromBook} onChange={(v) => setDraft({ ...draft, fromBook: v })} /></Row>
              <Row><label>To Book</label><TextInput value={draft.toBook} onChange={(v) => setDraft({ ...draft, toBook: v })} /></Row>
              <Row><label>Amount</label><NumInput value={draft.amount.amount} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, amount: v } })} /></Row>
              <Row><label>Currency</label><Select value={draft.amount.currency} onChange={(v) => setDraft({ ...draft, amount: { ...draft.amount, currency: v } })} options={Currency.options} /></Row>
              <Row><label>Sweep Date</label><DateInput value={draft.sweepDate} onChange={(v) => setDraft({ ...draft, sweepDate: v })} /></Row>
              <Row><label>Reason</label><Select value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} options={['EOD_PNL', 'RESERVE_RELEASE', 'BOOK_CLOSURE', 'OTHER']} /></Row>
            </>
          )}
          {draft.cashflowType === 'FUNDING' && (
            <>
              <Row><label>Direction</label><Select value={draft.direction} onChange={(v) => setDraft({ ...draft, direction: v })} options={['CHARGE', 'CREDIT']} /></Row>
              <Row><label>Currency</label><Select value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={Currency.options} /></Row>
              <Row><label>Notional</label><NumInput value={draft.notional} onChange={(v) => setDraft({ ...draft, notional: v })} /></Row>
              <Row><label>Rate</label><NumInput value={draft.rate} onChange={(v) => setDraft({ ...draft, rate: v })} step="0.0001" /></Row>
              <Row><label>Start</label><DateInput value={draft.startDate} onChange={(v) => setDraft({ ...draft, startDate: v })} /></Row>
              <Row><label>End</label><DateInput value={draft.endDate} onChange={(v) => setDraft({ ...draft, endDate: v })} /></Row>
              <Row><label>Payment</label><DateInput value={draft.paymentDate} onChange={(v) => setDraft({ ...draft, paymentDate: v })} /></Row>
              <Row><label>Treasury Book</label><TextInput value={draft.treasuryBook} onChange={(v) => setDraft({ ...draft, treasuryBook: v })} /></Row>
            </>
          )}
          <div className="flex justify-end pt-2">
            <button className="btn btn-primary" onClick={() => { add(trade.tradeHeader.tradeId, draft); setDraft(blankCashflow(kind)); }}>Add</button>
          </div>
        </Section>
      </div>

      <div>
        <Section title="Existing Cashflows">
          {trade.additionalCashflows.length === 0 && <div className="text-desk-mute text-sm">No cashflows on this trade.</div>}
          {trade.additionalCashflows.map((cf, i) => (
            <div key={i} className="flex items-center justify-between border-b border-desk-border py-1 text-xs font-mono">
              <div>
                <span className="text-desk-accent mr-2">{cf.cashflowType}</span>
                <span className="text-desk-mute">{JSON.stringify(cf)}</span>
              </div>
              <button className="btn btn-danger" onClick={() => remove(trade.tradeHeader.tradeId, i)}>✕</button>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
