
import { CollectionItem, PrimaryObject, ConfidenceScore } from '@/types/collection';
import { Tables } from '@/integrations/supabase/types';

/**
 * Transforms a database item into a CollectionItem for the application
 */
export const transformDatabaseItemToCollectionItem = (
  item: Tables<'collection_items'>
): CollectionItem => {
  // Safely parse confidence score from database
  let confidenceScore: ConfidenceScore;
  
  if (item.confidence_score) {
    // Check if confidence_score has the expected structure
    const cs = item.confidence_score as any;
    if (typeof cs === 'object' && 'score' in cs && 'level' in cs) {
      confidenceScore = {
        score: Number(cs.score),
        level: cs.level as 'low' | 'medium' | 'high',
        factors: cs.factors || [] // Add factors if they exist
      };
    } else {
      // Fallback to calculating if format is incorrect
      confidenceScore = calculateConfidenceScore(item);
    }
  } else {
    // Calculate if not present
    confidenceScore = calculateConfidenceScore(item);
  }
  
  // Determine market value based on estimated_value or calculate a dynamic value
  const marketValue = item.estimated_value || 0;
  const priceVariance = 0.2; // 20% variance for price ranges
  
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
      low: marketValue ? marketValue * (1 - priceVariance) : 0,
      average: marketValue || 0,
      high: marketValue ? marketValue * (1 + priceVariance) : 0,
      marketValue: marketValue || 0
    },
    confidenceScore: confidenceScore,
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
  let score = 30; // Base score - set lower to be more conservative
  let factors: {factor: string, impact: number}[] = [];
  
  // Add points for having more detailed information
  if (item.name && item.name.length > 3) {
    score += 5;
    factors.push({factor: "Item name provided", impact: 5});
  }
  
  if (item.category) {
    score += 5;
    factors.push({factor: "Category specified", impact: 5});
  }
  
  if (item.manufacturer) {
    score += 5;
    factors.push({factor: "Manufacturer known", impact: 5});
  }
  
  if (item.year_produced) {
    score += 5;
    factors.push({factor: "Production year known", impact: 5});
  }
  
  if (item.condition) {
    score += 5;
    factors.push({factor: "Condition specified", impact: 5});
  }
  
  if (item.estimated_value && item.estimated_value > 0) {
    // Graduated scoring based on value reliability
    const valueImpact = 10;
    score += valueImpact;
    factors.push({factor: "Estimated value provided", impact: valueImpact});
  }
  
  if (item.image_url) {
    score += 5;
    factors.push({factor: "Image provided", impact: 5});
  }
  
  // Add points for detailed descriptions
  if (item.description && item.description.length > 50) {
    const descriptionImpact = 5;
    score += descriptionImpact;
    factors.push({factor: "Detailed description", impact: descriptionImpact});
  }
  
  // Add points for historical information
  if (item.previous_owners || item.acquisition_source) {
    const historyImpact = 5;
    score += historyImpact;
    factors.push({factor: "Historical information", impact: historyImpact});
  }
  
  // Add points for physical details
  if (item.dimensions || item.weight) {
    const physicalImpact = 5;
    score += physicalImpact;
    factors.push({factor: "Physical specifications", impact: physicalImpact});
  }
  
  // Add points for rarity information
  if (item.rarity) {
    const rarityImpact = 5;
    score += rarityImpact;
    factors.push({factor: "Rarity specified", impact: rarityImpact});
  }
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  // Determine level based on score
  let level: 'low' | 'medium' | 'high';
  if (score < 40) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { score, level, factors };
};

/**
 * Transforms a CollectionItem into a database item for storage
 * @param item The collection item to transform
 * @param userId Optional user ID to include (useful when creating new items)
 */
export const transformCollectionItemToDatabase = (item: Partial<CollectionItem>, userId?: string) => {
  // Calculate the estimated value as the market value from price estimates if available
  const estimatedValue = item.priceEstimate?.marketValue || 0;
  
  // Clean up properties that don't exist in the database schema
  const {
    autoSaved,
    primaryObject,
    priceEstimate,
    saleInfo,
    videos,
    images,
    status,
    dateAdded,
    lastUpdated,
    ...rest
  } = item as any;
  
  // Ensure confidenceScore is properly formatted for database storage
  const confidenceScore = item.confidenceScore ? {
    score: item.confidenceScore.score,
    level: item.confidenceScore.level,
    factors: item.confidenceScore.factors || []
  } : null;
  
  // Construct the database object with the correct field mappings
  return {
    user_id: userId || rest.userId,
    name: rest.name || '',
    description: rest.notes,
    category: rest.category,
    condition: rest.condition,
    estimated_value: estimatedValue,
    image_url: images && images.length > 0 ? images[0] : null,
    acquisition_date: null,
    type: rest.type,
    manufacturer: rest.manufacturer,
    year_produced: rest.yearProduced,
    edition: rest.edition,
    model_number: rest.modelNumber,
    unique_identifiers: rest.uniqueIdentifiers,
    flaws: rest.flaws,
    completeness: rest.completeness,
    acquisition_source: rest.acquisitionSource,
    previous_owners: rest.previousOwners,
    documentation: rest.documentation,
    dimensions: rest.dimensions,
    weight: rest.weight,
    rarity: rest.rarity,
    confidence_score: confidenceScore // Store as a properly formatted object
  };
};
