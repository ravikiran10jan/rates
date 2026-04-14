import { XMLParser } from 'fast-xml-parser';
import type { Trade } from '../model/trade';
import { Trade as TradeSchema } from '../model/trade';

export function xmlToTrade(xml: string): Trade {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    preserveOrder: false,
    isArray: (name) => name === 'party' || name === 'cashflow' || name === 'item',
  });
  const doc = parser.parse(xml);
  const tx = doc?.FpML?.trade;
  if (!tx) throw new Error('Invalid FpML-subset XML: missing <FpML><trade>');

  const header = tx.tradeHeader;
  const parties = (tx.parties?.party ?? []).map((p: any) => ({
    id: p['@_id'],
    name: strOrEmpty(p.name),
    role: strOrEmpty(p.role),
    lei: strOrEmpty(p.lei) || undefined,
  }));

  const product = xmlGenericToJson(tx.product?.payload);

  const cashflows = (tx.additionalCashflows?.cashflow ?? []).map((c: any) => ({
    cashflowType: c['@_type'],
    ...xmlGenericToJson(c.payload),
  }));

  const rebuilt: Trade = {
    tradeHeader: {
      tradeId: strOrEmpty(header.tradeId),
      tradeDate: strOrEmpty(header.tradeDate),
      status: strOrEmpty(header.status) as any,
      book: strOrEmpty(header.book),
      trader: strOrEmpty(header.trader),
      portfolio: strOrEmpty(header.portfolio) || undefined,
      description: strOrEmpty(header.description) || undefined,
    },
    parties,
    product: product as Trade['product'],
    additionalCashflows: cashflows as Trade['additionalCashflows'],
  };

  // Validate to catch loss-of-fidelity fast
  return TradeSchema.parse(rebuilt);
}

function strOrEmpty(v: any): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && '#text' in v) return String(v['#text']);
  return String(v);
}

export function xmlGenericToJson(node: any): any {
  if (node === undefined || node === null) return null;
  // Primitive wrappers
  if (typeof node !== 'object') return node;
  const xtype = node['@_xsi:type'];
  if (node['@_xsi:nil'] === 'true') return null;

  // Scalar encoded form: { '#text': '...', '@_xsi:type': 'xs:decimal' | 'xs:boolean' | 'xs:string' }
  if ('#text' in node && (xtype === 'xs:decimal' || xtype === 'xs:boolean' || xtype === 'xs:string')) {
    const t = node['#text'];
    if (xtype === 'xs:decimal') return Number(t);
    if (xtype === 'xs:boolean') return t === 'true' || t === true;
    return String(t);
  }

  // Array form: either explicit (@_xsi:type="array") or detected by sole 'item' child
  if (xtype === 'array') {
    if (node['@_length'] === '0' || !('item' in node)) return [];
    const items = Array.isArray(node.item) ? node.item : [node.item];
    return items.map((i: any) => xmlGenericToJson(i));
  }
  if ('item' in node && Object.keys(node).every((k) => k === 'item' || k.startsWith('@_'))) {
    const items = Array.isArray(node.item) ? node.item : [node.item];
    return items.map((i: any) => xmlGenericToJson(i));
  }

  // Object form
  const out: any = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('@_')) continue;
    out[k] = xmlGenericToJson(v);
  }
  return out;
}
