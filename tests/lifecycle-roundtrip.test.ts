import { describe, expect, it } from 'vitest';
import { tradeToXml } from '../src/transform/jsonToXml';
import { xmlToTrade } from '../src/transform/xmlToJson';
import { vanillaIrsSample } from '../src/components/forms/VanillaIrsForm';
import type { LifecycleEvent } from '../src/model/lifecycle';
import { LifecycleEvent as LifecycleEventSchema } from '../src/model/lifecycle';
import type { Trade } from '../src/model/trade';
import { Trade as TradeSchema } from '../src/model/trade';

function buildAllEvents(): LifecycleEvent[] {
  const iso = (d: string) => `${d}T10:00:00.000Z`;
  return [
    {
      eventId: 'EV-AMD-1',
      eventType: 'AMENDMENT',
      timestamp: iso('2025-02-01'),
      recordedBy: 'trader1',
      effectiveDate: '2025-02-01',
      reason: 'Correction to fixed rate',
      changedFields: { 'leg[0].fixedRate': 0.05 },
      previousValues: { 'leg[0].fixedRate': 0.045 },
      approvedBy: 'HEAD_OF_DESK',
    },
    {
      eventId: 'EV-NOV-1',
      eventType: 'NOVATION',
      timestamp: iso('2025-02-10'),
      recordedBy: 'mo',
      novationDate: '2025-02-10',
      outgoingPartyId: 'CP1',
      incomingPartyId: 'CP2',
      incomingPartyName: 'Acme Corp',
      consentsObtained: true,
      novationFee: { amount: 1500, currency: 'USD' },
    },
    {
      eventId: 'EV-PT-1',
      eventType: 'PARTIAL_TERMINATION',
      timestamp: iso('2025-03-01'),
      recordedBy: 'trader2',
      terminationDate: '2025-03-01',
      terminatedNotional: 5_000_000,
      currency: 'USD',
      settlementAmount: { amount: -12000, currency: 'USD' },
    },
    {
      eventId: 'EV-FT-1',
      eventType: 'FULL_TERMINATION',
      timestamp: iso('2025-04-01'),
      recordedBy: 'trader3',
      terminationDate: '2025-04-01',
      settlementAmount: { amount: -50000, currency: 'USD' },
      reason: 'EARLY_UNWIND',
    },
    {
      eventId: 'EV-EX-1',
      eventType: 'EXERCISE',
      timestamp: iso('2025-05-01'),
      recordedBy: 'trader4',
      exerciseDate: '2025-05-01',
      exerciseType: 'FULL',
      notifiedBy: 'PARTY_A',
      resultingTradeId: 'T-RESULT-01',
    },
    {
      eventId: 'EV-RF-1',
      eventType: 'RATE_FIXING',
      timestamp: iso('2025-06-01'),
      recordedBy: 'ops-bot',
      fixingDate: '2025-06-01',
      legIndex: 1,
      indexName: 'USD-SOFR',
      fixedRate: 0.0435,
      periodStart: '2025-06-01',
      periodEnd: '2025-09-01',
    },
    {
      eventId: 'EV-PAY-1',
      eventType: 'PAYMENT',
      timestamp: iso('2025-07-01'),
      recordedBy: 'settle-bot',
      paymentDate: '2025-07-01',
      legIndex: 0,
      amount: { amount: 125000, currency: 'USD' },
      direction: 'PAY',
    },
    {
      eventId: 'EV-ROLL-1',
      eventType: 'ROLLOVER',
      timestamp: iso('2025-08-01'),
      recordedBy: 'mm-desk',
      rolloverDate: '2025-08-01',
      newMaturityDate: '2025-11-01',
      newRate: 0.047,
      newNotional: 10_000_000,
    },
    {
      eventId: 'EV-COMP-1',
      eventType: 'COMPRESSION',
      timestamp: iso('2025-09-01'),
      recordedBy: 'clearing',
      compressionDate: '2025-09-01',
      compressionCycleId: 'LCH-CYC-42',
      netPayment: { amount: -2500, currency: 'USD' },
      replacedTradeIds: ['T-AAAA1111', 'T-BBBB2222', 'T-CCCC3333'],
    },
    {
      eventId: 'EV-INC-1',
      eventType: 'INCREASE',
      timestamp: iso('2025-10-01'),
      recordedBy: 'trader5',
      effectiveDate: '2025-10-01',
      addedNotional: 3_000_000,
      currency: 'USD',
    },
  ];
}

describe('Lifecycle events JSON↔XML round-trip', () => {
  it('round-trips a trade with all 10 event variants', () => {
    const base = vanillaIrsSample();
    const events = buildAllEvents();
    // Sanity: every event must be valid on its own.
    for (const e of events) {
      LifecycleEventSchema.parse(e);
    }
    const trade: Trade = TradeSchema.parse({ ...base, lifecycleEvents: events });

    const xml = tradeToXml(trade);
    const back = xmlToTrade(xml);

    expect(back).toEqual(trade);
    expect(back.lifecycleEvents).toHaveLength(events.length);
  });

  it('preserves empty lifecycleEvents array through round-trip', () => {
    const trade = TradeSchema.parse(vanillaIrsSample());
    const xml = tradeToXml(trade);
    const back = xmlToTrade(xml);
    expect(back.lifecycleEvents).toEqual([]);
  });
});
