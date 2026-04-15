import { describe, expect, it } from 'vitest';
import { tradeToXml } from '../src/transform/jsonToXml';
import { xmlToTrade } from '../src/transform/xmlToJson';
import { Trade as TradeSchema } from '../src/model/trade';
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

const samples = {
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

describe('JSON↔XML round-trip', () => {
  for (const [name, sample] of Object.entries(samples)) {
    it(`round-trips ${name}`, () => {
      // Normalise the raw sample through TradeSchema so schema defaults
      // (e.g. lifecycleEvents: []) are populated before we diff.
      const original = TradeSchema.parse(sample());
      const xml = tradeToXml(original);
      const back = xmlToTrade(xml);
      expect(back).toEqual(original);
    });
  }
});
