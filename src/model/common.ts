import { z } from 'zod';

// ---------- Enumerations ----------

export const Currency = z.enum([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK',
  // Non-deliverable & EM
  'BRL', 'INR', 'KRW', 'CNY', 'TWD', 'IDR', 'MYR', 'PHP', 'CLP', 'COP', 'RUB', 'TRY', 'ZAR',
]);
export type Currency = z.infer<typeof Currency>;

export const DayCountFraction = z.enum([
  'ACT/360',
  'ACT/365.FIXED',
  'ACT/ACT.ISDA',
  '30/360',
  '30E/360',
  '30E/360.ISDA',
  'BUS/252',
]);
export type DayCountFraction = z.infer<typeof DayCountFraction>;

export const BusinessDayConvention = z.enum([
  'FOLLOWING',
  'MODIFIED_FOLLOWING',
  'PRECEDING',
  'MODIFIED_PRECEDING',
  'NONE',
]);
export type BusinessDayConvention = z.infer<typeof BusinessDayConvention>;

export const RollConvention = z.enum([
  'EOM', 'IMM', 'NONE',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
]);
export type RollConvention = z.infer<typeof RollConvention>;

export const PeriodUnit = z.enum(['D', 'W', 'M', 'Y']);
export type PeriodUnit = z.infer<typeof PeriodUnit>;

export const Period = z.object({
  length: z.number().int(),
  unit: PeriodUnit,
});
export type Period = z.infer<typeof Period>;

export const PayerReceiver = z.enum(['PAY', 'RECEIVE']);
export type PayerReceiver = z.infer<typeof PayerReceiver>;

export const BuySell = z.enum(['BUY', 'SELL']);
export type BuySell = z.infer<typeof BuySell>;

export const TradeStatus = z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED']);
export type TradeStatus = z.infer<typeof TradeStatus>;

export const CompoundingMethod = z.enum([
  'NONE',
  'FLAT',
  'STRAIGHT',
  'SPREAD_EXCLUSIVE',
  'OIS_COMPOUNDED',
  'OIS_AVERAGED',
]);
export type CompoundingMethod = z.infer<typeof CompoundingMethod>;

export const Stub = z.enum(['SHORT_INITIAL', 'LONG_INITIAL', 'SHORT_FINAL', 'LONG_FINAL', 'NONE']);
export type Stub = z.infer<typeof Stub>;

// ---------- Floating rate indexes ----------

export const FloatingIndex = z.enum([
  // Risk-free rates
  'USD-SOFR',
  'EUR-ESTR',
  'GBP-SONIA',
  'JPY-TONA',
  'CHF-SARON',
  // IBOR / Legacy
  'USD-LIBOR',
  'EUR-EURIBOR',
  'GBP-LIBOR',
  'JPY-TIBOR',
  // EM
  'BRL-CDI',
  'INR-MIBOR',
  'KRW-CD',
  'CNY-REPO',
  'TWD-TAIBOR',
  'IDR-JIBOR',
  'MXN-TIIE',
  'ZAR-JIBAR',
]);
export type FloatingIndex = z.infer<typeof FloatingIndex>;

// ---------- Parties ----------

export const PartyRole = z.enum([
  'BOOK', 'COUNTERPARTY', 'AGENT', 'BROKER', 'CLEARER',
]);
export const Party = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: PartyRole,
  lei: z.string().optional(),
});
export type Party = z.infer<typeof Party>;

// ---------- Money & rates ----------

export const Money = z.object({
  amount: z.number(),
  currency: Currency,
});
export type Money = z.infer<typeof Money>;

export const Notional = z.object({
  amount: z.number().positive(),
  currency: Currency,
});
export type Notional = z.infer<typeof Notional>;

// ---------- Fixing / FX ----------

export const FxFixing = z.object({
  fixingSource: z.string(), // e.g. 'BRL.PTAX', 'INR.RBIB'
  fixingOffsetDays: z.number().int().default(2),
  settlementCurrency: Currency,
});
export type FxFixing = z.infer<typeof FxFixing>;

// ---------- Schedule / Payment ----------

export const PaymentFrequency = z.object({
  period: Period,
  rollConvention: RollConvention.default('NONE'),
});
export type PaymentFrequency = z.infer<typeof PaymentFrequency>;

export const CalculationPeriodDates = z.object({
  effectiveDate: z.string(), // ISO date
  terminationDate: z.string(),
  calculationPeriodFrequency: PaymentFrequency,
  businessDayConvention: BusinessDayConvention.default('MODIFIED_FOLLOWING'),
  stub: Stub.default('NONE'),
});
export type CalculationPeriodDates = z.infer<typeof CalculationPeriodDates>;

export const PaymentDates = z.object({
  paymentFrequency: PaymentFrequency,
  payRelativeTo: z.enum(['PERIOD_START', 'PERIOD_END']).default('PERIOD_END'),
  businessDayConvention: BusinessDayConvention.default('MODIFIED_FOLLOWING'),
  paymentDaysOffset: z.number().int().default(0),
});
export type PaymentDates = z.infer<typeof PaymentDates>;

export const ResetDates = z.object({
  resetFrequency: PaymentFrequency,
  resetRelativeTo: z.enum(['PERIOD_START', 'PERIOD_END']).default('PERIOD_START'),
  fixingOffsetDays: z.number().int().default(2),
});
export type ResetDates = z.infer<typeof ResetDates>;

// ---------- Notional schedule (amortizing / step-up) ----------

export const NotionalStep = z.object({
  date: z.string(),
  notional: z.number(),
});
export type NotionalStep = z.infer<typeof NotionalStep>;

export const NotionalSchedule = z.object({
  initial: z.number().positive(),
  steps: z.array(NotionalStep).default([]),
  currency: Currency,
});
export type NotionalSchedule = z.infer<typeof NotionalSchedule>;

// ---------- Rate schedule (step-up rate) ----------

export const RateStep = z.object({
  date: z.string(),
  rate: z.number(),
});
export type RateStep = z.infer<typeof RateStep>;

// ---------- Legs ----------

export const FixedLeg = z.object({
  legType: z.literal('FIXED'),
  payerReceiver: PayerReceiver,
  notional: NotionalSchedule,
  fixedRate: z.number(),
  rateSteps: z.array(RateStep).default([]),
  dayCountFraction: DayCountFraction,
  calculationPeriodDates: CalculationPeriodDates,
  paymentDates: PaymentDates,
  initialExchange: z.boolean().default(false),
  finalExchange: z.boolean().default(false),
  intermediateExchanges: z.boolean().default(false),
});
export type FixedLeg = z.infer<typeof FixedLeg>;

export const FloatingLeg = z.object({
  legType: z.literal('FLOATING'),
  payerReceiver: PayerReceiver,
  notional: NotionalSchedule,
  floatingRateIndex: FloatingIndex,
  indexTenor: Period,
  spread: z.number().default(0),
  dayCountFraction: DayCountFraction,
  calculationPeriodDates: CalculationPeriodDates,
  paymentDates: PaymentDates,
  resetDates: ResetDates,
  compoundingMethod: CompoundingMethod.default('NONE'),
  capRate: z.number().optional(),
  floorRate: z.number().optional(),
  initialExchange: z.boolean().default(false),
  finalExchange: z.boolean().default(false),
  intermediateExchanges: z.boolean().default(false),
  // For NDIRS / ND XCCY: floating side settled in non-deliverable ccy
  fxFixing: FxFixing.optional(),
});
export type FloatingLeg = z.infer<typeof FloatingLeg>;

export const Leg = z.discriminatedUnion('legType', [FixedLeg, FloatingLeg]);
export type Leg = z.infer<typeof Leg>;

// ---------- Trade header ----------

export const TradeHeader = z.object({
  tradeId: z.string().min(1),
  tradeDate: z.string(),
  status: TradeStatus.default('DRAFT'),
  book: z.string().min(1),
  trader: z.string().min(1),
  portfolio: z.string().optional(),
  description: z.string().optional(),
});
export type TradeHeader = z.infer<typeof TradeHeader>;
