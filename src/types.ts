import type { estypes } from '@elastic/elasticsearch';

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags?: string[];
  brand?: string;
  sku: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: Array<{
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }>;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  meta?: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images?: string[];
  thumbnail: string;
}

export interface DummyJSONResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductAggregationResult {
  categories: estypes.AggregationsFiltersAggregate;
  brands: estypes.AggregationsFiltersAggregate;
  price_ranges: estypes.AggregationsRangeAggregate;
  rating_ranges: estypes.AggregationsRangeAggregate;
}

export type EsFiltersBucket = estypes.AggregationsFiltersBucket;
export type EsRangeBucket = estypes.AggregationsRangeBucket;
export type EsStringTermsAggregate = estypes.AggregationsStringTermsAggregate;

