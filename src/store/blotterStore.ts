import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Trade } from '../model/trade';
import type { Cashflow } from '../model/cashflows';
import type { LifecycleEvent } from '../model/lifecycle';

interface BlotterState {
  trades: Record<string, Trade>;
  selectedTradeId: string | null;
  addTrade: (trade: Trade) => string;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  removeTrade: (id: string) => void;
  select: (id: string | null) => void;
  addCashflow: (tradeId: string, cf: Cashflow) => void;
  removeCashflow: (tradeId: string, idx: number) => void;
  addLifecycleEvent: (tradeId: string, event: LifecycleEvent) => void;
  removeLifecycleEvent: (tradeId: string, eventId: string) => void;
  reset: () => void;
  importTrades: (trades: Trade[]) => void;
}

export const newTradeId = () => `T-${uuid().slice(0, 8).toUpperCase()}`;

// Ensure a trade read from persisted state or imported from an older payload
// has all the newer fields with safe defaults.
function migrateTrade(t: Trade): Trade {
  return {
    ...t,
    additionalCashflows: (t as any).additionalCashflows ?? [],
    lifecycleEvents: (t as any).lifecycleEvents ?? [],
  };
}

export const useBlotter = create<BlotterState>()(
  persist(
    (set) => ({
      trades: {},
      selectedTradeId: null,
      addTrade: (trade) => {
        const id = trade.tradeHeader.tradeId || newTradeId();
        const full: Trade = migrateTrade({
          ...trade,
          tradeHeader: { ...trade.tradeHeader, tradeId: id },
        });
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
      addLifecycleEvent: (tradeId, event) => set((s) => {
        const tr = s.trades[tradeId];
        if (!tr) return s;
        const existing = tr.lifecycleEvents ?? [];
        return {
          trades: {
            ...s.trades,
            [tradeId]: { ...tr, lifecycleEvents: [...existing, event] },
          },
        };
      }),
      removeLifecycleEvent: (tradeId, eventId) => set((s) => {
        const tr = s.trades[tradeId];
        if (!tr) return s;
        const next = (tr.lifecycleEvents ?? []).filter((e) => e.eventId !== eventId);
        return { trades: { ...s.trades, [tradeId]: { ...tr, lifecycleEvents: next } } };
      }),
      reset: () => set({ trades: {}, selectedTradeId: null }),
      importTrades: (trades) => set((s) => {
        const merged = { ...s.trades };
        for (const t of trades) merged[t.tradeHeader.tradeId] = migrateTrade(t);
        return { trades: merged };
      }),
    }),
    {
      name: 'rates-fo-blotter',
      // Migrate persisted state so trades saved before lifecycleEvents existed
      // don't blow up the UI or downstream schema validators.
      merge: (persistedState, currentState) => {
        const p = (persistedState as Partial<BlotterState>) ?? {};
        const rawTrades = (p.trades ?? {}) as Record<string, Trade>;
        const migrated: Record<string, Trade> = {};
        for (const [id, t] of Object.entries(rawTrades)) {
          migrated[id] = migrateTrade(t);
        }
        return {
          ...currentState,
          ...p,
          trades: migrated,
        } as BlotterState;
      },
    },
  ),
);
