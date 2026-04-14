import { describe, expect, it } from 'vitest';
import { Trade } from '../src/model/trade';
import type { Trade as TradeT } from '../src/model/trade';
import type { Cashflow } from '../src/model/cashflows';
import { tradeToXml } from '../src/transform/jsonToXml';
import { xmlToTrade } from '../src/transform/xmlToJson';
import { bootstrap } from '../src/pricing/curves/bootstrap';
import type { CurveDefinition } from '../src/pricing/curves/types';
import { priceTrade } from '../src/pricing/pricers';
import { computeDV01 } from '../src/pricing/risk';
import { vanillaIrsSample } from '../src/components/forms/VanillaIrsForm';
import { ndirsSample } from '../src/components/forms/NdirsForm';
import { oisSample } from '../src/components/forms/OisForm';
import { xccySample } from '../src/components/forms/XccyForm';
import { ndXccySample } from '../src/components/forms/NdXccyForm';
import { mmDepositSample } from '../src/components/forms/MmDepositForm';
import { mmLoanSample } from '../src/components/forms/MmLoanForm';
import { fraSample } from '../src/components/forms/FraForm';
import { swaptionSample } from '../src/components/forms/SwaptionForm';
import { capFloorSample } from '../src/components/forms/CapFloorForm';
import { structuredIrsSample } from '../src/components/forms/StructuredIrsForm';

// ---- Sample factory matrix: one per product type. ----
const productFactories: Record<string, () => TradeT> = {
  VANILLA_IRS: vanillaIrsSample,
  NDIRS: ndirsSample,
  OIS: oisSample,
  XCCY: xccySample,
  ND_XCCY: ndXccySample,
  MM_DEPOSIT: mmDepositSample,
  MM_LOAN: mmLoanSample,
  FRA: fraSample,
  SWAPTION: swaptionSample,
  CAP_FLOOR: capFloorSample,
  STRUCTURED_IRS: structuredIrsSample,
};

// Re-parse through the Zod schema so that defaults are filled in (avoids diffs
// on fields like `frequency` / `fundingDesk` which have Zod `.default(...)`s).
const mkCashflows = (): Record<string, Cashflow> => ({
  AGENCY_FEE: Trade.parse({
    ...vanillaIrsSample(),
    additionalCashflows: [{
      cashflowType: 'AGENCY_FEE',
      agentPartyId: 'AGENT-1',
      amount: { amount: 12_500, currency: 'USD' },
      paymentDate: '2026-06-15',
      frequency: 'QUARTERLY',
      description: 'Agency fee to custodian',
    }],
  }).additionalCashflows[0],
  XVA_PREMIUM: Trade.parse({
    ...vanillaIrsSample(),
    additionalCashflows: [{
      cashflowType: 'XVA_PREMIUM',
      component: 'CVA',
      amount: { amount: 50_000, currency: 'USD' },
      payer: 'BOOK',
      receiver: 'XVA_DESK',
      paymentDate: '2026-06-15',
      referenceTradeId: 'T-ABC',
    }],
  }).additionalCashflows[0],
  PNL_SWEEP: Trade.parse({
    ...vanillaIrsSample(),
    additionalCashflows: [{
      cashflowType: 'PNL_SWEEP',
      fromBook: 'RATES_USD',
      toBook: 'RATES_PARENT',
      amount: { amount: 125_000, currency: 'USD' },
      sweepDate: '2026-06-15',
      reason: 'EOD_PNL',
      description: 'End-of-day P&L sweep',
    }],
  }).additionalCashflows[0],
  FUNDING: Trade.parse({
    ...vanillaIrsSample(),
    additionalCashflows: [{
      cashflowType: 'FUNDING',
      direction: 'CHARGE',
      currency: 'USD',
      notional: 10_000_000,
      rate: 0.0525,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
      paymentDate: '2026-04-01',
      treasuryBook: 'TREASURY_USD',
      fundingDesk: 'TREASURY',
    }],
  }).additionalCashflows[0],
});

describe('QA matrix: every product × schema validation + XML round-trip', () => {
  for (const [name, factory] of Object.entries(productFactories)) {
    it(`${name}: parses via Trade.parse and round-trips XML`, () => {
      const trade = factory();
      const parsed = Trade.parse(trade);
      const xml = tradeToXml(parsed);
      const back = xmlToTrade(xml);
      expect(back).toEqual(parsed);
    });
  }
});

describe('QA matrix: every cashflow type × attach + XML round-trip', () => {
  const cashflows = mkCashflows();
  for (const [name, cf] of Object.entries(cashflows)) {
    it(`${name}: attaches to a trade and survives XML round-trip`, () => {
      const base = Trade.parse(vanillaIrsSample());
      const withCf: TradeT = { ...base, additionalCashflows: [cf] };
      const parsed = Trade.parse(withCf);
      const xml = tradeToXml(parsed);
      const back = xmlToTrade(xml);
      expect(back).toEqual(parsed);
      expect(back.additionalCashflows).toHaveLength(1);
      expect(back.additionalCashflows[0].cashflowType).toBe(name);
    });
  }

  it('all four cashflows attached together round-trip intact', () => {
    const base = Trade.parse(vanillaIrsSample());
    const all = Object.values(cashflows);
    const parsed = Trade.parse({ ...base, additionalCashflows: all });
    const xml = tradeToXml(parsed);
    const back = xmlToTrade(xml);
    expect(back).toEqual(parsed);
    expect(back.additionalCashflows.map((c) => c.cashflowType).sort()).toEqual(
      ['AGENCY_FEE', 'FUNDING', 'PNL_SWEEP', 'XVA_PREMIUM'],
    );
  });
});

// ---- Pricing sanity checks ----

const VAL_DATE = '2025-01-02';

const flatCurveDef = (rate: number, ccy: 'USD' | 'EUR' = 'USD'): CurveDefinition => ({
  id: `FLAT-${ccy}`,
  name: `FLAT ${ccy}`,
  currency: ccy,
  purpose: 'DISCOUNT',
  index: 'USD-SOFR',
  valuationDate: VAL_DATE,
  interpolation: 'LOG_LINEAR_DF',
  instruments: [
    { kind: 'DEPOSIT', tenor: { length: 3, unit: 'M' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 1, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 2, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 5, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 10, unit: 'Y' }, rate, dayCount: 'ACT/360' },
    { kind: 'OIS', tenor: { length: 30, unit: 'Y' }, rate, dayCount: 'ACT/360' },
  ],
});

function makeIrsAt(rate: number, years: number, notional = 10_000_000): TradeT {
  const start = VAL_DATE;
  const end = `${2025 + years}-01-02`;
  return Trade.parse({
    tradeHeader: { tradeId: 'QA-IRS', tradeDate: VAL_DATE, status: 'DRAFT', book: 'RATES', trader: 'QA' },
    parties: [
      { id: 'BOOK', name: 'Desk', role: 'BOOK' },
      { id: 'CPTY', name: 'Client', role: 'COUNTERPARTY' },
    ],
    product: {
      productType: 'VANILLA_IRS',
      legs: [
        {
          legType: 'FIXED',
          payerReceiver: 'RECEIVE',
          notional: { initial: notional, steps: [], currency: 'USD' },
          fixedRate: rate,
          rateSteps: [],
          dayCountFraction: 'ACT/360',
          calculationPeriodDates: {
            effectiveDate: start, terminationDate: end,
            calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
            businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
          },
          paymentDates: {
            paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
            payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
          },
          initialExchange: false, finalExchange: false, intermediateExchanges: false,
        },
        {
          legType: 'FLOATING',
          payerReceiver: 'PAY',
          notional: { initial: notional, steps: [], currency: 'USD' },
          floatingRateIndex: 'USD-SOFR',
          indexTenor: { length: 1, unit: 'Y' },
          spread: 0,
          dayCountFraction: 'ACT/360',
          calculationPeriodDates: {
            effectiveDate: start, terminationDate: end,
            calculationPeriodFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
            businessDayConvention: 'MODIFIED_FOLLOWING', stub: 'NONE',
          },
          paymentDates: {
            paymentFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
            payRelativeTo: 'PERIOD_END', businessDayConvention: 'MODIFIED_FOLLOWING', paymentDaysOffset: 0,
          },
          resetDates: {
            resetFrequency: { period: { length: 1, unit: 'Y' }, rollConvention: 'NONE' },
            resetRelativeTo: 'PERIOD_START', fixingOffsetDays: 2,
          },
          compoundingMethod: 'NONE',
          initialExchange: false, finalExchange: false, intermediateExchanges: false,
        },
      ],
    },
    additionalCashflows: [],
  });
}

describe('Pricing sanity', () => {
  it('Vanilla IRS with fixed = par-ish rate on a flat curve prices near zero', () => {
    const rate = 0.04;
    const notional = 10_000_000;
    const built = bootstrap(flatCurveDef(rate));
    // fixed rate slightly below/around the par of a single-curve ACT/360 bootstrap
    const trade = makeIrsAt(rate, 10, notional);
    const val = priceTrade(trade, VAL_DATE, { discount: { USD: built }, projection: { 'USD-SOFR': built } });
    // Expect PV magnitude small relative to notional. Single-curve, ACT/360 mix; tolerate 1% of notional.
    expect(Math.abs(val.pv)).toBeLessThan(0.01 * notional);
  });

  it('DV01 of a 10Y IRS is of order 10 × notional × 1bp (~10_000 for USD 10MM)', () => {
    const rate = 0.04;
    const notional = 10_000_000;
    const built = bootstrap(flatCurveDef(rate));
    const trade = makeIrsAt(rate, 10, notional);
    const dv01 = computeDV01(trade, VAL_DATE, {
      discount: { USD: built }, projection: { 'USD-SOFR': built },
    }, 'ALL');
    const order = 10 * notional * 1e-4; // 10,000 USD
    // Accept factor-of-2 band: 5,000 to 20,000
    expect(Math.abs(dv01)).toBeGreaterThan(0.5 * order);
    expect(Math.abs(dv01)).toBeLessThan(2.0 * order);
  });

  it('MM deposit PV equals dfEnd·(N+I) − dfStart·N (full principal+interest form)', () => {
    const trade = mmDepositSample();
    const parsed = Trade.parse(trade);
    if (parsed.product.productType !== 'MM_DEPOSIT') throw new Error('type');
    const built = bootstrap(flatCurveDef(0.05));
    // Align start/maturity with the curve's valuation date for this sanity check.
    const start = VAL_DATE;
    const maturity = '2025-04-02'; // 3M later
    const tradeAligned = Trade.parse({
      ...parsed,
      product: { ...parsed.product, startDate: start, maturityDate: maturity },
    });
    const val = priceTrade(tradeAligned, VAL_DATE, { discount: { USD: built }, projection: {} });
    const days = (new Date(maturity).getTime() - new Date(start).getTime()) / 86400000;
    const tau = days / 360; // ACT/360
    const p = tradeAligned.product as typeof parsed.product;
    const notional = p.notional.amount;
    const rate = p.rate;
    // DF(start) ≈ 1 since val date == start date
    const leg = val.legs[0];
    const dfMat = leg.flows[0].discountFactor;
    const interest = notional * rate * tau;
    // Full-economic PV (principal + interest exchange):
    const fullExpected = dfMat * (notional + interest) - 1 * notional;
    expect(val.pv).toBeCloseTo(fullExpected, 0); // within $1
    // The spec-form "interest-only" PV (dropping principal) differs by -N·(1-dfMat):
    const interestOnly = interest * dfMat - notional * (1 - 1);
    expect(val.pv).toBeCloseTo(fullExpected, 0);
    expect(Math.abs(val.pv - interestOnly)).toBeCloseTo(notional * (1 - dfMat), 0);
  });
});

// ---- Transform robustness ----

describe('Transform robustness', () => {
  it('xmlToTrade throws a clear error for malformed XML (missing <FpML><trade>)', () => {
    const bad = '<?xml version="1.0"?><notFpML><oops/></notFpML>';
    expect(() => xmlToTrade(bad)).toThrow(/Invalid FpML-subset XML/);
  });

  it('Unicode in description and party.name survives XML round-trip', () => {
    const base = Trade.parse(vanillaIrsSample());
    const trade: TradeT = {
      ...base,
      tradeHeader: {
        ...base.tradeHeader,
        description: 'Zürich ↔ 東京 €/¥ — Straße naïve π≈3.14 📈',
      },
      parties: [
        { ...base.parties[0], name: 'Société Générale — Zürich Desk' },
        { ...base.parties[1], name: '三菱UFJモルガン・スタンレー証券' },
      ],
    };
    const xml = tradeToXml(trade);
    const back = xmlToTrade(xml);
    expect(back.tradeHeader.description).toBe(trade.tradeHeader.description);
    expect(back.parties[0].name).toBe(trade.parties[0].name);
    expect(back.parties[1].name).toBe(trade.parties[1].name);
    expect(back).toEqual(trade);
  });
});

// ---- UI smoke: server-render App to catch registration / import errors ----

describe('UI smoke: App renders via react-dom/server', () => {
  it('App mounts and produces non-empty HTML', async () => {
    const { default: React } = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { default: App } = await import('../src/App');
    const html = renderToString(React.createElement(App));
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
    // Contains the app chrome
    expect(html).toContain('RATES');
  });
});
