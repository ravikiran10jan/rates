import { XMLBuilder } from 'fast-xml-parser';
import type { Trade } from '../model/trade';

/**
 * Serialize a Trade (our logical JSON model) into an FpML-subset XML document.
 *
 * Note: This is NOT full FpML — it is a small, deterministic subset that preserves
 * the economic content of our logical model so that jsonToXml -> xmlToJson round-trips.
 * FpML tag names are used where they exist 1:1 with our fields; otherwise we use
 * namespaced local tags under the <fpml-subset:...> vendor extension space.
 */
export function tradeToXml(trade: Trade): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    attributeNamePrefix: '@_',
    suppressEmptyNode: false,
  });
  // We serialise the Trade as a single document. The JSON→XML→JSON round-trip relies
  // on the inverse parser (xmlToJson) reading the same structure.
  const doc = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    FpML: {
      '@_xmlns': 'http://www.fpml.org/FpML-5/confirmation',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_fpmlVersion': '5-10',
      '@_fpml-subset': 'true',
      trade: toTradeElement(trade),
    },
  };
  return builder.build(doc);
}

function toTradeElement(trade: Trade): any {
  return {
    tradeHeader: {
      tradeId: trade.tradeHeader.tradeId,
      tradeDate: trade.tradeHeader.tradeDate,
      status: trade.tradeHeader.status,
      book: trade.tradeHeader.book,
      trader: trade.tradeHeader.trader,
      portfolio: trade.tradeHeader.portfolio ?? '',
      description: trade.tradeHeader.description ?? '',
    },
    parties: {
      party: trade.parties.map((p) => ({
        '@_id': p.id,
        name: p.name,
        role: p.role,
        lei: p.lei ?? '',
      })),
    },
    product: productToXml(trade.product),
    additionalCashflows: {
      cashflow: trade.additionalCashflows.map((c) => ({
        '@_type': c.cashflowType,
        ...cashflowPayload(c),
      })),
    },
    lifecycleEvents: {
      event: (trade.lifecycleEvents ?? []).map((e) => ({
        '@_type': e.eventType,
        '@_eventId': e.eventId,
        ...lifecycleEventPayload(e),
      })),
    },
  };
}

function lifecycleEventPayload(e: any): any {
  // Embed as a generic payload; xmlToJson will invert. Keep eventType/eventId
  // in attributes for readability but also inside payload so round-trip is
  // symmetric with other fields.
  const { ...rest } = e;
  return { payload: jsonToXmlGeneric(rest) };
}

function cashflowPayload(c: any): any {
  // Embed as a generic payload; xmlToJson will invert
  const { cashflowType, ...rest } = c;
  return { payload: jsonToXmlGeneric(rest) };
}

function productToXml(p: any): any {
  // Preserve full JSON fidelity by embedding a generic payload keyed by productType.
  // Also emit a canonical FpML-like alias where meaningful.
  return {
    '@_type': p.productType,
    payload: jsonToXmlGeneric(p),
  };
}

/**
 * Generic JSON → XML recursion preserving types. Primitives become text nodes, arrays
 * become repeated <item> children, objects become nested elements keyed by field name.
 * Scalar type tags are encoded as attributes @_xsi:type so the parser can invert.
 */
export function jsonToXmlGeneric(v: any): any {
  if (v === null) return { '@_xsi:nil': 'true' };
  if (typeof v === 'number') return { '#text': String(v), '@_xsi:type': 'xs:decimal' };
  if (typeof v === 'boolean') return { '#text': v ? 'true' : 'false', '@_xsi:type': 'xs:boolean' };
  if (typeof v === 'string') return { '#text': v, '@_xsi:type': 'xs:string' };
  if (Array.isArray(v)) {
    if (v.length === 0) return { '@_xsi:type': 'array', '@_length': '0' };
    return { '@_xsi:type': 'array', item: v.map((x) => jsonToXmlGeneric(x)) };
  }
  if (typeof v === 'object') {
    const out: any = { '@_xsi:type': 'object' };
    for (const [k, val] of Object.entries(v)) {
      out[k] = jsonToXmlGeneric(val);
    }
    return out;
  }
  return { '#text': String(v) };
}
