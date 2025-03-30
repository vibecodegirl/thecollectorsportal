
import { CollectionItem, PrimaryObject } from '@/types/collection';
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
    videos: [],
    dimensions: item.dimensions || '',
    weight: item.weight || '',
    rarity: item.rarity || '',
    priceEstimate: {
      low: item.estimated_value || 0,
      average: item.estimated_value || 0,
      high: item.estimated_value || 0,
      marketValue: item.estimated_value || 0
    },
    confidenceScore: {
      score: 50,
      level: 'medium' as 'low' | 'medium' | 'high'
    },
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
 * Transforms a CollectionItem into a database item for storage
 * @param item The collection item to transform
 * @param userId Optional user ID to include (useful when creating new items)
 */
export const transformCollectionItemToDatabase = (item: Partial<CollectionItem>, userId?: string) => {
  return {
    user_id: userId || item.userId,
    name: item.name || '',
    description: item.notes,
    category: item.category,
    condition: item.condition,
    estimated_value: item.priceEstimate?.marketValue || 0,
    image_url: item.images && item.images.length > 0 ? item.images[0] : null,
    acquisition_date: null,
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
  };
};
