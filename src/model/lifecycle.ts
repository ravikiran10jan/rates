import { z } from 'zod';
import { Currency, Money } from './common';

// ---------- Enums ----------

export const LifecycleEventType = z.enum([
  'AMENDMENT',
  'NOVATION',
  'PARTIAL_TERMINATION',
  'FULL_TERMINATION',
  'EXERCISE',
  'RATE_FIXING',
  'PAYMENT',
  'ROLLOVER',
  'COMPRESSION',
  'INCREASE',
]);
export type LifecycleEventType = z.infer<typeof LifecycleEventType>;

export const TerminationReason = z.enum([
  'MUTUAL',
  'DEFAULT',
  'EARLY_UNWIND',
  'CLEARING_COMPRESSION',
]);
export type TerminationReason = z.infer<typeof TerminationReason>;

export const ExerciseKind = z.enum(['FULL', 'PARTIAL']);
export type ExerciseKind = z.infer<typeof ExerciseKind>;

export const ExerciseParty = z.enum(['PARTY_A', 'PARTY_B']);
export type ExerciseParty = z.infer<typeof ExerciseParty>;

export const PaymentDirection = z.enum(['PAY', 'RECEIVE']);
export type PaymentDirection = z.infer<typeof PaymentDirection>;

export const LegIndex = z.union([z.literal(0), z.literal(1)]);
export type LegIndex = z.infer<typeof LegIndex>;

// ---------- Common base ----------
// Common fields applied to every discriminator branch.
const base = {
  eventId: z.string().min(1),
  timestamp: z.string().datetime(),
  recordedBy: z.string().optional(),
};

// ---------- Event variants ----------

export const AmendmentEvent = z.object({
  ...base,
  eventType: z.literal('AMENDMENT'),
  effectiveDate: z.string(),
  reason: z.string(),
  changedFields: z.union([z.record(z.any()), z.string()]),
  previousValues: z.union([z.record(z.any()), z.string()]),
  approvedBy: z.string(),
});
export type AmendmentEvent = z.infer<typeof AmendmentEvent>;

export const NovationEvent = z.object({
  ...base,
  eventType: z.literal('NOVATION'),
  novationDate: z.string(),
  outgoingPartyId: z.string(),
  incomingPartyId: z.string(),
  incomingPartyName: z.string(),
  consentsObtained: z.boolean(),
  novationFee: Money.optional(),
});
export type NovationEvent = z.infer<typeof NovationEvent>;

export const PartialTerminationEvent = z.object({
  ...base,
  eventType: z.literal('PARTIAL_TERMINATION'),
  terminationDate: z.string(),
  terminatedNotional: z.number(),
  currency: Currency,
  settlementAmount: Money.optional(),
});
export type PartialTerminationEvent = z.infer<typeof PartialTerminationEvent>;

export const FullTerminationEvent = z.object({
  ...base,
  eventType: z.literal('FULL_TERMINATION'),
  terminationDate: z.string(),
  settlementAmount: Money,
  reason: TerminationReason,
});
export type FullTerminationEvent = z.infer<typeof FullTerminationEvent>;

export const ExerciseEvent = z.object({
  ...base,
  eventType: z.literal('EXERCISE'),
  exerciseDate: z.string(),
  exerciseType: ExerciseKind,
  notifiedBy: ExerciseParty,
  resultingTradeId: z.string().optional(),
});
export type ExerciseEvent = z.infer<typeof ExerciseEvent>;

export const RateFixingEvent = z.object({
  ...base,
  eventType: z.literal('RATE_FIXING'),
  fixingDate: z.string(),
  legIndex: LegIndex,
  indexName: z.string(),
  fixedRate: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
});
export type RateFixingEvent = z.infer<typeof RateFixingEvent>;

export const PaymentEvent = z.object({
  ...base,
  eventType: z.literal('PAYMENT'),
  paymentDate: z.string(),
  legIndex: LegIndex.optional(),
  amount: Money,
  direction: PaymentDirection,
});
export type PaymentEvent = z.infer<typeof PaymentEvent>;

export const RolloverEvent = z.object({
  ...base,
  eventType: z.literal('ROLLOVER'),
  rolloverDate: z.string(),
  newMaturityDate: z.string(),
  newRate: z.number(),
  newNotional: z.number().optional(),
});
export type RolloverEvent = z.infer<typeof RolloverEvent>;

export const CompressionEvent = z.object({
  ...base,
  eventType: z.literal('COMPRESSION'),
  compressionDate: z.string(),
  compressionCycleId: z.string(),
  netPayment: Money,
  replacedTradeIds: z.array(z.string()),
});
export type CompressionEvent = z.infer<typeof CompressionEvent>;

export const IncreaseEvent = z.object({
  ...base,
  eventType: z.literal('INCREASE'),
  effectiveDate: z.string(),
  addedNotional: z.number(),
  currency: Currency,
});
export type IncreaseEvent = z.infer<typeof IncreaseEvent>;

// ---------- Discriminated union ----------

export const LifecycleEvent = z.discriminatedUnion('eventType', [
  AmendmentEvent,
  NovationEvent,
  PartialTerminationEvent,
  FullTerminationEvent,
  ExerciseEvent,
  RateFixingEvent,
  PaymentEvent,
  RolloverEvent,
  CompressionEvent,
  IncreaseEvent,
]);
export type LifecycleEvent = z.infer<typeof LifecycleEvent>;

// ---------- Helpers ----------

export function summarizeEvent(e: LifecycleEvent): string {
  switch (e.eventType) {
    case 'AMENDMENT':
      return `Amendment eff ${e.effectiveDate} (${e.reason})`;
    case 'NOVATION':
      return `Novation to ${e.incomingPartyName} on ${e.novationDate}`;
    case 'PARTIAL_TERMINATION':
      return `Partial termination ${e.terminatedNotional} ${e.currency} on ${e.terminationDate}`;
    case 'FULL_TERMINATION':
      return `Full termination ${e.terminationDate} (${e.reason})`;
    case 'EXERCISE':
      return `${e.exerciseType} exercise on ${e.exerciseDate} by ${e.notifiedBy}`;
    case 'RATE_FIXING':
      return `Fixing leg#${e.legIndex} ${e.indexName} = ${e.fixedRate} on ${e.fixingDate}`;
    case 'PAYMENT':
      return `Payment ${e.direction} ${e.amount.amount} ${e.amount.currency} on ${e.paymentDate}`;
    case 'ROLLOVER':
      return `Rollover to ${e.newMaturityDate} at ${e.newRate}`;
    case 'COMPRESSION':
      return `Compression ${e.compressionCycleId} net ${e.netPayment.amount} ${e.netPayment.currency}`;
    case 'INCREASE':
      return `Increase +${e.addedNotional} ${e.currency} eff ${e.effectiveDate}`;
  }
}
