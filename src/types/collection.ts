
export type PriceEstimate = {
  low: number;
  average: number;
  high: number;
  marketValue: number;
};

export type ConfidenceScore = {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
};

export type PrimaryObject = {
  shape: string;
  colors: {
    dominant: string;
    accents: string | string[];
  };
  texture: string;
  material: string;
  distinguishingFeatures: string | string[];
  style: string;
  timePeriod: string;
  function: string;
  condition?: string;
  possibleFunctions?: string[];
};

export type CollectionItem = {
  id: string;
  userId: string;
  dateAdded: string;
  lastUpdated: string;
  
  // Category
  category: string;
  
  // Item Identification
  name: string;
  type: string;
  manufacturer: string;
  yearProduced: string;
  edition: string;
  modelNumber: string;
  uniqueIdentifiers: string;
  
  // Collection Details
  condition: string;
  flaws: string;
  completeness: string;
  
  // Provenance/History
  acquisitionSource: string;
  previousOwners: string;
  documentation: string;
  
  // Media
  images: string[];
  videos: string[];
  
  // Physical Attributes
  dimensions: string;
  weight: string;
  
  // Rarity/Value Information
  rarity: string;
  priceEstimate: PriceEstimate;
  confidenceScore: ConfidenceScore;
  
  // AI Analysis Data
  primaryObject: PrimaryObject;
  
  // Notes
  notes: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  collections: CollectionItem[];
};
