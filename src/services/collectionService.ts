
import { CollectionItem } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';
import { 
  transformDatabaseItemToCollectionItem, 
  transformCollectionItemToDatabase 
} from '@/utils/collectionTransformers';
import { AIAnalysisRequest } from '@/contexts/CollectionContext';

export const fetchCollectionItems = async (userId: string): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
  
  return data.map(transformDatabaseItemToCollectionItem);
};

export const addCollectionItem = async (
  item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>, 
  userId: string
): Promise<CollectionItem> => {
  const supabaseItem = transformCollectionItemToDatabase(item, userId);

  const { data, error } = await supabase
    .from('collection_items')
    .insert(supabaseItem)
    .select()
    .single();

  if (error) throw error;

  return transformDatabaseItemToCollectionItem(data);
};

export const updateCollectionItem = async (
  item: CollectionItem
): Promise<CollectionItem> => {
  const supabaseItem = transformCollectionItemToDatabase(item);

  const { data, error } = await supabase
    .from('collection_items')
    .update(supabaseItem)
    .eq('id', item.id)
    .select()
    .single();

  if (error) throw error;

  return transformDatabaseItemToCollectionItem(data);
};

export const deleteCollectionItem = async (itemId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
  
  return true;
};

export const analyzeCollectionItem = async (
  request: AIAnalysisRequest
): Promise<Partial<CollectionItem>> => {
  // This is a mock implementation that would be replaced with a real AI service
  return {
    category: request.category || "Unknown",
    name: request.name || "Analyzed Item",
    type: "Unknown",
    manufacturer: "Unknown",
    yearProduced: "Unknown",
    edition: "Standard",
    modelNumber: "Unknown",
    uniqueIdentifiers: "",
    condition: "Good",
    flaws: "",
    completeness: "Complete",
    dimensions: "",
    weight: "",
    rarity: "Common",
    priceEstimate: {
      low: 10,
      average: 20,
      high: 30,
      marketValue: 20
    },
    confidenceScore: {
      score: 50,
      level: 'medium' as 'low' | 'medium' | 'high'
    },
    notes: request.description || "",
  };
};
