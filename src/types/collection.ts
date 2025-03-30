
export type ItemStatus = 'active' | 'archived' | 'sold';

export interface PriceEstimate {
  low: number;
  average: number;
  high: number;
  marketValue: number;
}

export interface ConfidenceScore {
  score: number;
  level: 'low' | 'medium' | 'high';
}

export interface SaleInfo {
  saleDate: string;
  salePrice: number;
  saleCurrency?: string;
  salePlatform?: string;
  saleFees?: number;
  saleNotes?: string;
  buyerInfo?: string;
}

export interface PrimaryObject {
  shape: string;
  colors: {
    dominant: string;
    accents: string[];
  };
  texture: string;
  material: string;
  distinguishingFeatures: string[];
  style: string;
  timePeriod: string;
  function: string;
  possibleFunctions?: string[];
}

export interface CollectionItem {
  id: string;
  userId: string;
  name: string;
  category?: string;
  type?: string;
  manufacturer?: string;
  yearProduced?: string;
  edition?: string;
  modelNumber?: string;
  uniqueIdentifiers?: string;
  condition?: string;
  flaws?: string;
  completeness?: string;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  acquisitionCurrency?: string;
  acquisitionSource?: string;
  previousOwners?: string;
  documentation?: string;
  dimensions?: string;
  weight?: string;
  rarity?: string;
  notes?: string;
  images?: string[];
  status: ItemStatus;
  dateAdded: string;
  lastUpdated: string;
  priceEstimate?: PriceEstimate;
  confidenceScore?: ConfidenceScore;
  saleInfo?: SaleInfo;
  primaryObject?: PrimaryObject;
}
