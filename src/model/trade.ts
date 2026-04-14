import { z } from 'zod';
import { Party, TradeHeader } from './common';
import { Product, ProductType } from './products';
import { Cashflow } from './cashflows';

export const Trade = z.object({
  tradeHeader: TradeHeader,
  parties: z.array(Party).min(2),
  product: Product,
  additionalCashflows: z.array(Cashflow).default([]),
});
export type Trade = z.infer<typeof Trade>;

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
