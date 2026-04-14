import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Trade } from '../model/trade';
import type { Cashflow } from '../model/cashflows';

interface BlotterState {
  trades: Record<string, Trade>;
  selectedTradeId: string | null;
  addTrade: (trade: Trade) => string;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  removeTrade: (id: string) => void;
  select: (id: string | null) => void;
  addCashflow: (tradeId: string, cf: Cashflow) => void;
  removeCashflow: (tradeId: string, idx: number) => void;
  reset: () => void;
  importTrades: (trades: Trade[]) => void;
}

export const newTradeId = () => `T-${uuid().slice(0, 8).toUpperCase()}`;

export const useBlotter = create<BlotterState>()(
  persist(
    (set) => ({
      trades: {},
      selectedTradeId: null,
      addTrade: (trade) => {
        const id = trade.tradeHeader.tradeId || newTradeId();
        const full: Trade = { ...trade, tradeHeader: { ...trade.tradeHeader, tradeId: id } };
        set((s) => ({ trades: { ...s.trades, [id]: full }, selectedTradeId: id }));
        return id;
      },
      updateTrade: (id, patch) => set((s) => {
        const existing = s.trades[id];
        if (!existing) return s;
        return { trades: { ...s.trades, [id]: { ...existing, ...patch } } };
      }),
      removeTrade: (id) => set((s) => {
        const { [id]: _drop, ...rest } = s.trades;
        return { trades: rest, selectedTradeId: s.selectedTradeId === id ? null : s.selectedTradeId };
      }),
      select: (id) => set({ selectedTradeId: id }),
      addCashflow: (tradeId, cf) => set((s) => {
        const tr = s.trades[tradeId];
        if (!tr) return s;
        return {
          trades: {
            ...s.trades,
            [tradeId]: { ...tr, additionalCashflows: [...tr.additionalCashflows, cf] },
          },
        };
      }),
      removeCashflow: (tradeId, idx) => set((s) => {
        const tr = s.trades[tradeId];
        if (!tr) return s;
        const next = tr.additionalCashflows.filter((_, i) => i !== idx);
        return { trades: { ...s.trades, [tradeId]: { ...tr, additionalCashflows: next } } };
      }),
      reset: () => set({ trades: {}, selectedTradeId: null }),
      importTrades: (trades) => set((s) => {
        const merged = { ...s.trades };
        for (const t of trades) merged[t.tradeHeader.tradeId] = t;
        return { trades: merged };
      }),
    }),
    { name: 'rates-fo-blotter' },
  ),
);
