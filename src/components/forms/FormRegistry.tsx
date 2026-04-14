import React from 'react';
import type { Trade } from '../../model/trade';
import type { ProductType } from '../../model/products';

export type OnBook = (trade: Trade) => void;

export interface ProductFormProps {
  onBook: OnBook;
  onCancel: () => void;
  initial?: Trade;
}

export interface ProductFormMeta {
  productType: ProductType;
  label: string;
  group: 'SWAPS' | 'XCCY' | 'MM' | 'OPTIONS' | 'STRUCTURED';
  description: string;
  Form: React.ComponentType<ProductFormProps>;
  newSample: () => Trade;
}

const registry = new Map<ProductType, ProductFormMeta>();

export function registerProductForm(meta: ProductFormMeta) {
  registry.set(meta.productType, meta);
}
export function getProductForm(pt: ProductType): ProductFormMeta | undefined {
  return registry.get(pt);
}
export function allProductForms(): ProductFormMeta[] {
  return Array.from(registry.values());
}
