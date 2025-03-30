
import { CollectionItem, PrimaryObject, ConfidenceScore } from '@/types/collection';
import { Tables } from '@/integrations/supabase/types';

/**
 * Transforms a database item into a CollectionItem for the application
 */
export const transformDatabaseItemToCollectionItem = (
  item: Tables<'collection_items'>
): CollectionItem => {
  return {
    id: item.id,
    userId: item.user_id,
    dateAdded: item.created_at,
    lastUpdated: item.updated_at,
    status: 'active', // Default status to active
    name: item.name,
    category: item.category || '',
    type: item.type || '',
    manufacturer: item.manufacturer || '',
    yearProduced: item.year_produced || '',
    edition: item.edition || '',
    modelNumber: item.model_number || '',
    uniqueIdentifiers: item.unique_identifiers || '',
    condition: item.condition || '',
    flaws: item.flaws || '',
    completeness: item.completeness || '',
    acquisitionSource: item.acquisition_source || '',
    previousOwners: item.previous_owners || '',
    documentation: item.documentation || '',
    images: item.image_url ? [item.image_url] : [],
    videos: [], // Added empty videos array as default
    dimensions: item.dimensions || '',
    weight: item.weight || '',
    rarity: item.rarity || '',
    priceEstimate: {
      low: item.estimated_value ? item.estimated_value * 0.8 : 0,
      average: item.estimated_value || 0,
      high: item.estimated_value ? item.estimated_value * 1.2 : 0,
      marketValue: item.estimated_value || 0
    },
    confidenceScore: calculateConfidenceScore(item),
    primaryObject: {
      shape: 'Unknown',
      colors: {
        dominant: 'Unknown',
        accents: []
      },
      texture: 'Unknown',
      material: 'Unknown',
      distinguishingFeatures: [],
      style: 'Unknown',
      timePeriod: 'Unknown',
      function: 'Unknown'
    },
    notes: item.description || ''
  };
};

/**
 * Calculates a confidence score based on the available item data
 */
const calculateConfidenceScore = (item: Tables<'collection_items'>): ConfidenceScore => {
  let score = 50; // Base score
  
  // Add points for having more detailed information
  if (item.name && item.name.length > 3) score += 5;
  if (item.category) score += 5;
  if (item.manufacturer) score += 5;
  if (item.year_produced) score += 5;
  if (item.condition) score += 5;
  if (item.estimated_value && item.estimated_value > 0) score += 10;
  if (item.image_url) score += 5;
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  // Determine level based on score
  let level: 'low' | 'medium' | 'high';
  if (score < 40) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { score, level };
};

/**
 * Transforms a CollectionItem into a database item for storage
 * @param item The collection item to transform
 * @param userId Optional user ID to include (useful when creating new items)
 */
export const transformCollectionItemToDatabase = (item: Partial<CollectionItem>, userId?: string) => {
  // Calculate the estimated value as the market value from price estimates if available
  const estimatedValue = item.priceEstimate?.marketValue || 0;
  
  // Only include fields that are actually in the database table
  return {
    user_id: userId || item.userId,
    name: item.name || '',
    description: item.notes,
    category: item.category,
    condition: item.condition,
    estimated_value: estimatedValue,
    image_url: item.images && item.images.length > 0 ? item.images[0] : null,
    type: item.type,
    manufacturer: item.manufacturer,
    year_produced: item.yearProduced,
    edition: item.edition,
    model_number: item.modelNumber,
    unique_identifiers: item.uniqueIdentifiers,
    flaws: item.flaws,
    completeness: item.completeness,
    acquisition_source: item.acquisitionSource,
    previous_owners: item.previousOwners,
    documentation: item.documentation,
    dimensions: item.dimensions,
    weight: item.weight,
    rarity: item.rarity
    // Note: confidenceScore, primaryObject, and other complex objects are not stored directly
    // in the database. They are calculated when the item is retrieved.
  };
};
