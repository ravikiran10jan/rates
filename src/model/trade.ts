import { z } from 'zod';
import { Party, TradeHeader } from './common';
import { Product, ProductType } from './products';
import { Cashflow } from './cashflows';
import { LifecycleEvent } from './lifecycle';

export const Trade = z.object({
  tradeHeader: TradeHeader,
  parties: z.array(Party).min(2),
  product: Product,
  additionalCashflows: z.array(Cashflow).default([]),
  lifecycleEvents: z.array(LifecycleEvent).default([]),
});
// Derive the TS type so that `lifecycleEvents` is optional-on-input (callers
// predating this field can still produce a valid Trade literal) but
// readable-as-array by downstream code. We fall back to `[]` everywhere we
// read it, so the loosened type is safe.
type _TradeSchema = z.infer<typeof Trade>;
export type Trade = Omit<_TradeSchema, 'lifecycleEvents'> & {
  lifecycleEvents?: _TradeSchema['lifecycleEvents'];
};

export type { ProductType };

// A lightweight view used by the blotter grid (derived from a Trade).
export type BlotterRow = {
  tradeId: string;
  product: ProductType;
  status: string;
  book: string;
  trader: string;
  tradeDate: string;
  currency: string;
  notional: number | null;
  maturity: string | null;
  counterparty: string;
};
