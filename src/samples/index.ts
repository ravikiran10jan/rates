// Curated starter samples for the "Load Samples" button.
// Composed from per-form sample factories; adds several structured-IRS variants
// that exercise the discriminated-union `features` schema.

import { Trade } from '../model/trade';
import type {
  StructuredIrs,
  StructuredFeature,
  ExerciseSchedule,
} from '../model/products';
import { vanillaIrsSample } from '../components/forms/VanillaIrsForm';
import { oisSample } from '../components/forms/OisForm';
import { xccySample } from '../components/forms/XccyForm';
import { ndXccySample } from '../components/forms/NdXccyForm';
import { swaptionSample } from '../components/forms/SwaptionForm';
import { structuredIrsSample } from '../components/forms/StructuredIrsForm';

function withTradeId(t: Trade, tradeId: string, description?: string): Trade {
  return {
    ...t,
    tradeHeader: {
      ...t.tradeHeader,
      tradeId,
      ...(description ? { description } : {}),
    },
  };
}

function makeStructuredVariant(args: {
  tradeId: string;
  description: string;
  flavour: StructuredIrs['flavour'];
  features?: StructuredFeature[];
  exerciseSchedule?: ExerciseSchedule;
  clearExerciseSchedule?: boolean;
}): Trade {
  const base = structuredIrsSample();
  const baseProduct = base.product as StructuredIrs;
  const product: StructuredIrs = {
    ...baseProduct,
    flavour: args.flavour,
    features: args.features ?? [],
    exerciseSchedule: args.clearExerciseSchedule
      ? undefined
      : (args.exerciseSchedule ?? baseProduct.exerciseSchedule),
  };
  return {
    ...base,
    tradeHeader: {
      ...base.tradeHeader,
      tradeId: args.tradeId,
      description: args.description,
    },
    product,
  };
}

export function buildSampleTrades(): Trade[] {
  const samples: Trade[] = [];

  // ---- Standard vanilla samples ----
  samples.push(withTradeId(vanillaIrsSample(), 'SAMPLE-IRS-001', 'USD 10MM 5Y vanilla IRS'));
  samples.push(withTradeId(oisSample(), 'SAMPLE-OIS-001', 'USD 25MM 2Y OIS vs SOFR'));
  samples.push(withTradeId(xccySample(), 'SAMPLE-XCCY-001', 'USD/EUR 5Y xccy basis'));
  samples.push(withTradeId(ndXccySample(), 'SAMPLE-NDXCCY-001', 'USD/INR 3Y ND xccy'));
  samples.push(withTradeId(swaptionSample(), 'SAMPLE-SWAPTION-001', '1Y into 5Y payer swaption'));

  // ---- Structured IRS variants (6) ----

  // 1) AMORTIZING: keep amortising notional schedule from structuredIrsSample; drop exercise.
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-AMORT-001',
      description: 'Amortizing USD IRS, 10Y, 4M/year amortisation',
      flavour: 'AMORTIZING',
      clearExerciseSchedule: true,
    }),
  );

  // 2) STEP_UP: reuse the schedule shape; step-up flavour; no optionality.
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-STEPUP-001',
      description: 'Step-up fixed-coupon USD IRS, 10Y',
      flavour: 'STEP_UP',
      clearExerciseSchedule: true,
    }),
  );

  // 3) CMS_LINKED: CMS feature on top of the fixed-vs-float base.
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-CMS-001',
      description: 'CMS-linked 10Y coupon referencing USD CMS 10Y',
      flavour: 'CMS_LINKED',
      clearExerciseSchedule: true,
      features: [
        {
          kind: 'CMS',
          swapTenor: { length: 10, unit: 'Y' },
          indexName: 'USD-ISDA-Swap-10Y',
          multiplier: 1,
          spread: 0.0025,
          cap: 0.07,
          floor: 0.01,
        },
      ],
    }),
  );

  // 4) RANGE_ACCRUAL: coupon accrues when SOFR stays inside [1.5%, 5.5%].
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-RA-001',
      description: 'Range accrual vs USD-SOFR 1.5%-5.5% daily observation',
      flavour: 'RANGE_ACCRUAL',
      clearExerciseSchedule: true,
      features: [
        {
          kind: 'RANGE_ACCRUAL',
          referenceIndex: 'USD-SOFR',
          lowerBound: 0.015,
          upperBound: 0.055,
          observation: 'DAILY',
          couponIfIn: 0.06,
          couponIfOut: 0,
        },
      ],
    }),
  );

  // 5) INVERSE_FLOATER: coupon = 8% - SOFR, floored at 0%.
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-INV-001',
      description: 'Inverse floater 8% - SOFR, floored at 0%',
      flavour: 'INVERSE_FLOATER',
      clearExerciseSchedule: true,
      features: [
        {
          kind: 'INVERSE_FLOATER',
          referenceIndex: 'USD-SOFR',
          fixedComponent: 0.08,
          multiplier: 1,
          cap: 0.08,
          floor: 0,
        },
      ],
    }),
  );

  // 6) QUANTO: USD-SOFR linked coupon paid in EUR.
  samples.push(
    makeStructuredVariant({
      tradeId: 'SAMPLE-STRUCT-QUANTO-001',
      description: 'Quanto coupon: USD-SOFR paid in EUR',
      flavour: 'QUANTO',
      clearExerciseSchedule: true,
      features: [
        {
          kind: 'QUANTO',
          payoutCurrency: 'EUR',
          referenceIndex: 'USD-SOFR',
          referenceCurrency: 'USD',
        },
      ],
    }),
  );

  return samples;
}
