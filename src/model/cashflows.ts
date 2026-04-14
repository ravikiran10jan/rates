import { z } from 'zod';
import { Currency, Money } from './common';

// Additional cashflows attached to a trade (or standalone between books).
// Modelled per FpML/CDM-ish non-trade payment structure.

export const AgencyFee = z.object({
  cashflowType: z.literal('AGENCY_FEE'),
  agentPartyId: z.string(),
  amount: Money,
  paymentDate: z.string(),
  frequency: z.enum(['ONE_OFF', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).default('ONE_OFF'),
  description: z.string().optional(),
});
export type AgencyFee = z.infer<typeof AgencyFee>;

export const XvaComponent = z.enum(['CVA', 'DVA', 'FVA', 'MVA', 'KVA', 'COLVA']);
export type XvaComponent = z.infer<typeof XvaComponent>;

export const XvaPremium = z.object({
  cashflowType: z.literal('XVA_PREMIUM'),
  component: XvaComponent,
  amount: Money,
  payer: z.enum(['BOOK', 'COUNTERPARTY', 'XVA_DESK']),
  receiver: z.enum(['BOOK', 'COUNTERPARTY', 'XVA_DESK']),
  paymentDate: z.string(),
  referenceTradeId: z.string().optional(),
});
export type XvaPremium = z.infer<typeof XvaPremium>;

export const PnlSweep = z.object({
  cashflowType: z.literal('PNL_SWEEP'),
  fromBook: z.string(),
  toBook: z.string(),
  amount: Money,
  sweepDate: z.string(),
  reason: z.enum(['EOD_PNL', 'RESERVE_RELEASE', 'BOOK_CLOSURE', 'OTHER']).default('EOD_PNL'),
  description: z.string().optional(),
});
export type PnlSweep = z.infer<typeof PnlSweep>;

export const FundingCashflow = z.object({
  cashflowType: z.literal('FUNDING'),
  direction: z.enum(['CHARGE', 'CREDIT']),
  currency: Currency,
  notional: z.number(),
  rate: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  paymentDate: z.string(),
  treasuryBook: z.string(),
  fundingDesk: z.string().default('TREASURY'),
});
export type FundingCashflow = z.infer<typeof FundingCashflow>;

export const Cashflow = z.discriminatedUnion('cashflowType', [
  AgencyFee, XvaPremium, PnlSweep, FundingCashflow,
]);
export type Cashflow = z.infer<typeof Cashflow>;
