import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bootstrap } from '../pricing/curves/bootstrap';
import type { BuiltCurve, CurveDefinition } from '../pricing/curves/types';
import type { CurveSet } from '../pricing/pricers';

interface CurveState {
  valuationDate: string;
  curves: Record<string, CurveDefinition>; // by id
  fxSpot: Record<string, number>;
  setValuationDate: (d: string) => void;
  upsertCurve: (def: CurveDefinition) => void;
  removeCurve: (id: string) => void;
  setFxSpot: (pair: string, rate: number) => void;
  buildAll: () => { discount: Record<string, BuiltCurve>; projection: Record<string, BuiltCurve>; byId: Record<string, BuiltCurve> };
  toCurveSet: () => CurveSet;
  seedDefaults: () => void;
}

const DEFAULT_VAL_DATE = new Date().toISOString().slice(0, 10);

const seedUSD_SOFR: CurveDefinition = {
  id: 'USD-SOFR-OIS',
  name: 'USD SOFR OIS',
  currency: 'USD',
  purpose: 'DISCOUNT',
  index: 'USD-SOFR',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 1, unit: 'M' }, rate: 0.0525, dayCount: 'ACT/360' },
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate: 0.0520, dayCount: 'ACT/360' },
    { kind: 'DEPOSIT', tenor: { length: 6, unit: 'M' }, rate: 0.0515, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 1, unit: 'Y' }, rate: 0.0490, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 2, unit: 'Y' }, rate: 0.0435, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 3, unit: 'Y' }, rate: 0.0410, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 5, unit: 'Y' }, rate: 0.0395, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 10, unit: 'Y' }, rate: 0.0405, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 30, unit: 'Y' }, rate: 0.0420, dayCount: 'ACT/360' },
  ],
};

const seedEUR_ESTR: CurveDefinition = {
  id: 'EUR-ESTR-OIS',
  name: 'EUR ESTR OIS',
  currency: 'EUR',
  purpose: 'DISCOUNT',
  index: 'EUR-ESTR',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 1, unit: 'M' }, rate: 0.0395, dayCount: 'ACT/360' },
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate: 0.0380, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 1, unit: 'Y' }, rate: 0.0335, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 2, unit: 'Y' }, rate: 0.0290, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 5, unit: 'Y' }, rate: 0.0265, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 10, unit: 'Y' }, rate: 0.0275, dayCount: 'ACT/360' },
  ],
};

const seedGBP_SONIA: CurveDefinition = {
  id: 'GBP-SONIA-OIS',
  name: 'GBP SONIA OIS',
  currency: 'GBP',
  purpose: 'DISCOUNT',
  index: 'GBP-SONIA',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'OIS', tenor: { length: 1, unit: 'Y' }, rate: 0.0475, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS', tenor: { length: 2, unit: 'Y' }, rate: 0.0415, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS', tenor: { length: 5, unit: 'Y' }, rate: 0.0395, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS', tenor: { length: 10, unit: 'Y' }, rate: 0.0410, dayCount: 'ACT/365.FIXED' },
  ],
};

const seedJPY_TONA: CurveDefinition = {
  id: 'JPY-TONA-OIS',
  name: 'JPY TONA OIS',
  currency: 'JPY',
  purpose: 'DISCOUNT',
  index: 'JPY-TONA',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 1, unit: 'M' }, rate: 0.0015, dayCount: 'ACT/365.FIXED' },
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate: 0.0025, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS',     tenor: { length: 1, unit: 'Y' }, rate: 0.0045, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS',     tenor: { length: 2, unit: 'Y' }, rate: 0.0060, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS',     tenor: { length: 5, unit: 'Y' }, rate: 0.0075, dayCount: 'ACT/365.FIXED' },
    { kind: 'OIS',     tenor: { length: 10, unit: 'Y' }, rate: 0.0095, dayCount: 'ACT/365.FIXED' },
  ],
};

const seedCHF_SARON: CurveDefinition = {
  id: 'CHF-SARON-OIS',
  name: 'CHF SARON OIS',
  currency: 'CHF',
  purpose: 'DISCOUNT',
  index: 'CHF-SARON',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 1, unit: 'M' }, rate: 0.0150, dayCount: 'ACT/360' },
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate: 0.0140, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 1, unit: 'Y' }, rate: 0.0110, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 2, unit: 'Y' }, rate: 0.0085, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 5, unit: 'Y' }, rate: 0.0075, dayCount: 'ACT/360' },
    { kind: 'OIS',     tenor: { length: 10, unit: 'Y' }, rate: 0.0085, dayCount: 'ACT/360' },
  ],
};

const seedUSD_LIBOR_3M_PROJ: CurveDefinition = {
  id: 'USD-LIBOR-3M-PROJ',
  name: 'USD LIBOR 3M Projection',
  currency: 'USD',
  purpose: 'PROJECTION',
  index: 'USD-LIBOR',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'SWAP', tenor: { length: 1, unit: 'Y' }, rate: 0.0505, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 2, unit: 'Y' }, rate: 0.0450, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 5, unit: 'Y' }, rate: 0.0410, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 10, unit: 'Y' }, rate: 0.0420, dayCount: 'ACT/360' },
  ],
};

const seedEUR_EURIBOR_3M_PROJ: CurveDefinition = {
  id: 'EUR-EURIBOR-3M-PROJ',
  name: 'EUR EURIBOR 3M Projection',
  currency: 'EUR',
  purpose: 'PROJECTION',
  index: 'EUR-EURIBOR',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'SWAP', tenor: { length: 1, unit: 'Y' }, rate: 0.0345, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 2, unit: 'Y' }, rate: 0.0305, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 5, unit: 'Y' }, rate: 0.0280, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 10, unit: 'Y' }, rate: 0.0290, dayCount: 'ACT/360' },
  ],
};

const seedEUR_EURIBOR_6M_PROJ: CurveDefinition = {
  id: 'EUR-EURIBOR-6M-PROJ',
  name: 'EUR EURIBOR 6M Projection',
  currency: 'EUR',
  purpose: 'PROJECTION',
  index: 'EUR-EURIBOR',
  valuationDate: DEFAULT_VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'SWAP', tenor: { length: 1, unit: 'Y' }, rate: 0.0355, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 2, unit: 'Y' }, rate: 0.0315, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 5, unit: 'Y' }, rate: 0.0290, dayCount: 'ACT/360' },
    { kind: 'SWAP', tenor: { length: 10, unit: 'Y' }, rate: 0.0300, dayCount: 'ACT/360' },
  ],
};

const SEEDS: CurveDefinition[] = [
  seedUSD_SOFR,
  seedEUR_ESTR,
  seedGBP_SONIA,
  seedJPY_TONA,
  seedCHF_SARON,
  seedUSD_LIBOR_3M_PROJ,
  seedEUR_EURIBOR_3M_PROJ,
  seedEUR_EURIBOR_6M_PROJ,
];

export const useCurves = create<CurveState>()(
  persist(
    (set, get) => ({
      valuationDate: DEFAULT_VAL_DATE,
      curves: Object.fromEntries(SEEDS.map((c) => [c.id, c])),
      fxSpot: { 'EUR/USD': 1.08, 'GBP/USD': 1.27, 'USD/JPY': 148.5 },
      setValuationDate: (d) => set((s) => ({
        valuationDate: d,
        curves: Object.fromEntries(Object.entries(s.curves).map(([k, v]) => [k, { ...v, valuationDate: d }])),
      })),
      upsertCurve: (def) => set((s) => ({ curves: { ...s.curves, [def.id]: def } })),
      removeCurve: (id) => set((s) => { const { [id]: _d, ...rest } = s.curves; return { curves: rest }; }),
      setFxSpot: (pair, rate) => set((s) => ({ fxSpot: { ...s.fxSpot, [pair]: rate } })),
      buildAll: () => {
        const discount: Record<string, BuiltCurve> = {};
        const projection: Record<string, BuiltCurve> = {};
        const byId: Record<string, BuiltCurve> = {};
        for (const def of Object.values(get().curves)) {
          const built = bootstrap(def);
          byId[def.id] = built;
          if (def.purpose === 'DISCOUNT') {
            // a discount curve also serves as projection for its own index unless overridden
            if (!discount[def.currency]) discount[def.currency] = built;
            if (def.index && !projection[def.index]) projection[def.index] = built;
          } else if (def.purpose === 'PROJECTION' && def.index) {
            projection[def.index] = built;
          }
        }
        return { discount, projection, byId };
      },
      toCurveSet: () => {
        const { discount, projection } = get().buildAll();
        return { discount, projection, fxSpot: get().fxSpot };
      },
      seedDefaults: () => set({ curves: Object.fromEntries(SEEDS.map((c) => [c.id, c])) }),
    }),
    { name: 'rates-fo-curves' },
  ),
);
