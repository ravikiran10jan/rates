import { z } from 'zod';
import {
  BuySell, CalculationPeriodDates, Currency, DayCountFraction, FixedLeg, FloatingIndex, FloatingLeg,
  FxFixing, Leg, Money, Notional, NotionalSchedule, PaymentDates, PayerReceiver, Period,
} from './common';

// ---------- Product tags ----------
// A single discriminated union keeps all products addressable and JSON-round-trippable.

export const ProductType = z.enum([
  'VANILLA_IRS',
  'NDIRS',
  'OIS',
  'XCCY',
  'ND_XCCY',
  'MM_DEPOSIT',
  'MM_LOAN',
  'FRA',
  'SWAPTION',
  'CAP_FLOOR',
  'STRUCTURED_IRS',
]);
export type ProductType = z.infer<typeof ProductType>;

// ---------- Vanilla IRS ----------

export const VanillaIrs = z.object({
  productType: z.literal('VANILLA_IRS'),
  legs: z.tuple([Leg, Leg]), // typically one fixed + one floating; or float/float basis
});
export type VanillaIrs = z.infer<typeof VanillaIrs>;

// ---------- NDIRS (Non-deliverable IRS) ----------

export const Ndirs = z.object({
  productType: z.literal('NDIRS'),
  legs: z.tuple([Leg, Leg]),
  settlementCurrency: Currency,
  fxFixing: FxFixing,
});
export type Ndirs = z.infer<typeof Ndirs>;

// ---------- OIS ----------

export const Ois = z.object({
  productType: z.literal('OIS'),
  legs: z.tuple([FixedLeg, FloatingLeg]),
  // The floating leg must carry compoundingMethod=OIS_COMPOUNDED and a risk-free index
});
export type Ois = z.infer<typeof Ois>;

// ---------- Cross-currency swap ----------

export const XccySwap = z.object({
  productType: z.literal('XCCY'),
  legs: z.tuple([Leg, Leg]),
  mtmResettable: z.boolean().default(false),
  mtmResettingLegIndex: z.number().int().min(0).max(1).optional(),
  initialFxRate: z.number().positive(),
  exchangeInitialNotional: z.boolean().default(true),
  exchangeFinalNotional: z.boolean().default(true),
});
export type XccySwap = z.infer<typeof XccySwap>;

// ---------- Non-deliverable XCCY ----------

export const NdXccy = z.object({
  productType: z.literal('ND_XCCY'),
  legs: z.tuple([Leg, Leg]),
  nonDeliverableLegIndex: z.number().int().min(0).max(1),
  settlementCurrency: Currency,
  fxFixing: FxFixing,
  initialFxRate: z.number().positive(),
  exchangeInitialNotional: z.boolean().default(false),
  exchangeFinalNotional: z.boolean().default(false),
});
export type NdXccy = z.infer<typeof NdXccy>;

// ---------- Money market deposit / loan ----------

export const MmDeposit = z.object({
  productType: z.literal('MM_DEPOSIT'),
  direction: PayerReceiver, // RECEIVE = lending / placing a deposit
  notional: Notional,
  startDate: z.string(),
  maturityDate: z.string(),
  rate: z.number(),
  dayCountFraction: DayCountFraction,
});
export type MmDeposit = z.infer<typeof MmDeposit>;

export const MmLoan = z.object({
  productType: z.literal('MM_LOAN'),
  direction: PayerReceiver, // PAY = borrowing
  notional: Notional,
  startDate: z.string(),
  maturityDate: z.string(),
  rate: z.number(),
  rateType: z.enum(['FIXED', 'FLOATING']).default('FIXED'),
  floatingIndex: FloatingIndex.optional(),
  spread: z.number().default(0),
  dayCountFraction: DayCountFraction,
});
export type MmLoan = z.infer<typeof MmLoan>;

// ---------- FRA ----------

export const Fra = z.object({
  productType: z.literal('FRA'),
  buySell: BuySell,
  notional: Notional,
  fixedRate: z.number(),
  floatingIndex: FloatingIndex,
  indexTenor: Period,
  tradeDate: z.string(),
  effectiveDate: z.string(),    // e.g. T+2 + 3m
  terminationDate: z.string(),  // effectiveDate + tenor
  fixingDate: z.string(),
  paymentDate: z.string(),
  dayCountFraction: DayCountFraction,
  // FRA 2009 discounting convention (ISDA FRA "BBA" / "AFMA") - using standard discount
  discountMethod: z.enum(['ISDA', 'AFMA', 'NONE']).default('ISDA'),
});
export type Fra = z.infer<typeof Fra>;

// ---------- Swaption ----------

export const Swaption = z.object({
  productType: z.literal('SWAPTION'),
  buySell: BuySell,
  optionType: z.enum(['PAYER', 'RECEIVER']),
  exerciseStyle: z.enum(['EUROPEAN', 'BERMUDAN', 'AMERICAN']).default('EUROPEAN'),
  exerciseDates: z.array(z.string()).min(1),
  premium: Money.optional(),
  premiumPaymentDate: z.string().optional(),
  settlementType: z.enum(['PHYSICAL', 'CASH']).default('PHYSICAL'),
  cashSettlementMethod: z.enum(['COLLATERALIZED', 'PAR_YIELD', 'IRR']).optional(),
  underlyingSwap: VanillaIrs, // the forward-starting swap
});
export type Swaption = z.infer<typeof Swaption>;

// ---------- Cap / Floor ----------

export const CapFloor = z.object({
  productType: z.literal('CAP_FLOOR'),
  capOrFloor: z.enum(['CAP', 'FLOOR', 'COLLAR']),
  buySell: BuySell,
  notional: NotionalSchedule,
  strike: z.number(),
  floorStrike: z.number().optional(), // for collar
  floatingIndex: FloatingIndex,
  indexTenor: Period,
  calculationPeriodDates: CalculationPeriodDates,
  paymentDates: PaymentDates,
  dayCountFraction: DayCountFraction,
  premium: Money.optional(),
});
export type CapFloor = z.infer<typeof CapFloor>;

// ---------- Structured IRS ----------
// A flexible container covering: amortizing, step-up, forward-starting, zero-coupon,
// callable/Bermudan (cancelable), CMS-linked, range accrual, inverse floater, quanto.

export const ExerciseSchedule = z.object({
  style: z.enum(['BERMUDAN', 'EUROPEAN', 'CALLABLE', 'CANCELLABLE']),
  exerciseDates: z.array(z.string()),
  notificationOffsetDays: z.number().int().default(2),
  partyLong: z.enum(['PARTY_A', 'PARTY_B']),
});
export type ExerciseSchedule = z.infer<typeof ExerciseSchedule>;

export const CmsFeature = z.object({
  kind: z.literal('CMS'),
  swapTenor: Period,
  indexName: z.string(), // e.g. 'USD-ISDA-Swap-10Y'
  multiplier: z.number().default(1),
  spread: z.number().default(0),
  cap: z.number().optional(),
  floor: z.number().optional(),
});
export type CmsFeature = z.infer<typeof CmsFeature>;

export const RangeAccrualFeature = z.object({
  kind: z.literal('RANGE_ACCRUAL'),
  referenceIndex: FloatingIndex,
  lowerBound: z.number(),
  upperBound: z.number(),
  observation: z.enum(['DAILY', 'WEEKLY']).default('DAILY'),
  couponIfIn: z.number(), // coupon paid when observation in range
  couponIfOut: z.number().default(0),
});
export type RangeAccrualFeature = z.infer<typeof RangeAccrualFeature>;

export const InverseFloaterFeature = z.object({
  kind: z.literal('INVERSE_FLOATER'),
  referenceIndex: FloatingIndex,
  fixedComponent: z.number(), // e.g. 8%
  multiplier: z.number().default(1), // coupon = fixedComponent - multiplier * index
  cap: z.number().optional(),
  floor: z.number().default(0),
});
export type InverseFloaterFeature = z.infer<typeof InverseFloaterFeature>;

export const QuantoFeature = z.object({
  kind: z.literal('QUANTO'),
  payoutCurrency: Currency,
  referenceIndex: FloatingIndex,
  referenceCurrency: Currency,
});
export type QuantoFeature = z.infer<typeof QuantoFeature>;

export const StructuredFeature = z.discriminatedUnion('kind', [
  CmsFeature, RangeAccrualFeature, InverseFloaterFeature, QuantoFeature,
]);
export type StructuredFeature = z.infer<typeof StructuredFeature>;

export const StructuredIrs = z.object({
  productType: z.literal('STRUCTURED_IRS'),
  flavour: z.enum([
    'AMORTIZING', 'STEP_UP', 'FORWARD_STARTING', 'ZERO_COUPON',
    'CALLABLE_BERMUDAN', 'CANCELLABLE',
    'CMS_LINKED', 'RANGE_ACCRUAL', 'INVERSE_FLOATER', 'QUANTO',
  ]),
  legs: z.tuple([Leg, Leg]),
  exerciseSchedule: ExerciseSchedule.optional(),
  features: z.array(StructuredFeature).default([]),
});
export type StructuredIrs = z.infer<typeof StructuredIrs>;

// ---------- Product union ----------

export const Product = z.discriminatedUnion('productType', [
  VanillaIrs, Ndirs, Ois, XccySwap, NdXccy, MmDeposit, MmLoan, Fra, Swaption, CapFloor, StructuredIrs,
]);
export type Product = z.infer<typeof Product>;
