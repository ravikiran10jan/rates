# Rates FO Playground

A front-office Rates booking playground. Book interest-rate derivatives, money-market
trades, structured and exotic IRS; attach XVA / funding / agency / P&L-sweep cashflows;
build yield curves; view pricing and DV01; and export/import the data as a logical JSON
model or FpML-subset XML (with round-trip).

**Scope is deliberately front-office and educational — no production-grade market data,
no ISDA-compliant vol surfaces.** It is a playground for data modelling, booking, and
curve-based pricing.

## Products

| Group | Products |
| --- | --- |
| Swaps | Vanilla IRS, Non-Deliverable IRS (NDIRS), OIS, FRA |
| XCCY | Vanilla Cross-Currency Swap, Non-Deliverable XCCY |
| MM | Money-Market Deposit (lending), MM Loan (borrowing) |
| Options | Swaption (Euro/Bermudan/American, payer/receiver), Cap / Floor / Collar |
| Structured | Amortizing, Step-Up, Forward-Starting, Zero-Coupon, Callable/Bermudan, Cancelable, CMS-Linked, Range Accrual, Inverse Floater, Quanto |

## Cashflows

- **Agency fee** — one-off / periodic fee to an agent party
- **XVA premium** — CVA / DVA / FVA / MVA / KVA / ColVA transfers
- **P&L sweep** — inter-book P&L transfer
- **Funding** — internal funding charge / credit

## Yield Curves & Pricing

- Multi-currency **discount curves** (USD-SOFR, EUR-ESTR, GBP-SONIA by default)
- **Projection curves** per floating index
- Bootstrapping from deposits, FRAs, futures, vanilla swaps, OIS and XCCY basis quotes
- Interpolation: linear on zero rates, log-linear on DF (default), linear on DF, monotone cubic
- Pricing via discounted-cashflow valuation
- **DV01** via 1-bp parallel bump of discount and/or projection curves
- Charts (zero rates, discount factors, 1Y forwards) via Recharts

## Data Model

- **Logical JSON** model validated by Zod — `src/model/`
- Structurally inspired by FpML 5 and FINOS CDM
- JSON ↔ **FpML-subset XML** deterministic round-trip serialiser (`src/transform/`)

## Getting Started

```bash
npm install
npm run dev          # start the playground
npm run typecheck    # TS typecheck
npm run test         # vitest round-trip + pricing tests
npm run build        # production build
```

Open the displayed Vite URL. Use the **Sidebar → New Trade** to book a product.
Toggle the header to **Curves** to manage the curve builder and charts.

## Project Structure

```
src/
  model/            Zod schemas — products, legs, cashflows, common types
  transform/        JSON↔XML transformer, schedule generation, day-count fractions
  pricing/          Yield curves, interpolation, bootstrap, pricers, DV01
  store/            Zustand stores for blotter + curves (persisted to localStorage)
  components/
    forms/          Product-specific booking forms + registry
    views/          Trade detail tabs: economics / schedule / cashflows / pricing / JSON / XML / diff
    curves/         Curve builder + chart
  App.tsx           Shell with sidebar, blotter, detail tabs
tests/              Vitest suite (round-trip + pricing)
```

## Design Notes

- **Playground grade pricing**: single-curve simplification, no convexity adjustment, no
  vol surfaces. The forward-starting swap underlying a swaption is priced at intrinsic.
  Caps/Floors use intrinsic payoffs on projected forwards.
- **FpML subset**: The XML emitter produces a small deterministic subset — not full FpML
  — so JSON↔XML round-trips losslessly. Tags where they align with FpML (`tradeHeader`,
  `party`, `swap`, `swapStream`) use the FpML names; everything else is embedded as a
  generic typed-payload for round-trip fidelity.
- **No backend**: data is in-memory + localStorage. Trades and curves persist across reload.
