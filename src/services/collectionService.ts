
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
  // In a real app, this would call an AI service
  // For demo purposes, we'll return mock data that simulates AI analysis
  
  // Enhance the mock data with any description passed in the request
  const description = request.description || "";
  
  return {
    category: request.category || "Unknown",
    name: request.name || "Analyzed Item",
    type: description.includes("Art Deco") ? "Art Deco Object" : "Unknown",
    manufacturer: description.includes("professional manufacturing") ? "Professional Manufacturer" : "Unknown",
    yearProduced: description.includes("mid-20th century") ? "1950s-1960s" : "Unknown",
    edition: description.includes("commemorative") ? "Commemorative Edition" : "Standard",
    modelNumber: description.includes("serial number") ? "SN-" + Math.floor(1000 + Math.random() * 9000) : "Unknown",
    uniqueIdentifiers: description.includes("hallmark") ? "Has unique hallmark" : "",
    condition: description.includes("Good") ? "Good" : description.includes("Excellent") ? "Excellent" : "Fair",
    flaws: description.includes("minor wear") ? "Minor wear consistent with age" : "",
    completeness: "Complete",
    dimensions: description.includes("rectangular") ? "Approximately 10cm x 15cm" : "",
    weight: "",
    rarity: description.includes("unique") ? "Rare" : "Common",
    priceEstimate: {
      low: 10,
      average: 20,
      high: 30,
      marketValue: 20
    },
    confidenceScore: {
      score: description.length > 100 ? 75 : 50,
      level: description.length > 100 ? 'high' as 'low' | 'medium' | 'high' : 'medium' as 'low' | 'medium' | 'high'
    },
    notes: description || request.description || "",
  };
};
