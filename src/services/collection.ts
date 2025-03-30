
import { supabase } from '@/integrations/supabase/client';
import { CollectionItem, ItemStatus, SaleInfo } from '@/types/collection';
import { searchItemPrices, getItemPriceEstimate } from './collection/priceService';
import { transformDatabaseItemToCollectionItem } from '@/utils/collectionTransformers';

// Get all collection items for a user
export const getCollectionItems = async (userId: string): Promise<CollectionItem[]> => {
  try {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Transform database items to CollectionItems
    return (data || []).map(item => transformDatabaseItemToCollectionItem(item));
  } catch (error: any) {
    console.error('Error fetching collection items:', error);
    throw new Error(error.message || 'Failed to fetch collection items');
  }
};

// Create a new collection item
export const createCollectionItem = async (
  item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>,
  userId: string
): Promise<CollectionItem> => {
  try {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      user_id: userId,
      dateAdded: now,
      lastUpdated: now
    };
    
    const { data, error } = await supabase
      .from('collection_items')
      .insert(newItem)
      .select('*')
      .single();
    
    if (error) throw error;
    return transformDatabaseItemToCollectionItem(data);
  } catch (error: any) {
    console.error('Error creating collection item:', error);
    throw new Error(error.message || 'Failed to create collection item');
  }
};

// Update an existing collection item
export const updateCollectionItem = async (
  id: string,
  item: Partial<CollectionItem>,
  userId: string
): Promise<CollectionItem> => {
  try {
    const now = new Date().toISOString();
    const updatedItem = {
      ...item,
      lastUpdated: now
    };
    
    const { data, error } = await supabase
      .from('collection_items')
      .update(updatedItem)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) throw error;
    return transformDatabaseItemToCollectionItem(data);
  } catch (error: any) {
    console.error('Error updating collection item:', error);
    throw new Error(error.message || 'Failed to update collection item');
  }
};

// Delete a collection item
export const deleteCollectionItem = async (id: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting collection item:', error);
    throw new Error(error.message || 'Failed to delete collection item');
  }
};

// Analyze a collection item with AI
export const analyzeCollectionItem = async (request: {
  images?: string[];
  category?: string;
  description?: string;
  name?: string;
}): Promise<Partial<CollectionItem>> => {
  try {
    console.log("Sending analysis request:", { 
      category: request.category, 
      description: request.description, 
      name: request.name, 
      imageCount: request.images?.length || 0 
    });
    
    // If we have images, first analyze with Gemini AI
    let visionAnalysis = null;
    if (request.images && request.images.length > 0) {
      try {
        visionAnalysis = await analyzeImageWithVision(request.images[0]);
        console.log("Gemini analysis received:", visionAnalysis);
      } catch (error) {
        console.error("Gemini analysis error:", error);
      }
    }
    
    // Try to use the Supabase function for enhanced analysis
    let analysisData = null;
    try {
      const response = await supabase.functions.invoke('analyze-item', {
        body: { 
          images: request.images,
          category: request.category || visionAnalysis?.suggestedCategory,
          description: request.description || visionAnalysis?.additionalObservations,
          name: request.name || visionAnalysis?.suggestedType
        }
      });
      
      if (response.error) throw response.error;
      analysisData = response.data;
    } catch (error) {
      console.error("Supabase analysis error:", error);
    }
    
    // Combine data from different sources
    const mergedData = {
      ...analysisData,
      ...visionAnalysis ? {
        category: visionAnalysis.suggestedCategory || request.category,
        name: visionAnalysis.suggestedType || request.name,
        type: visionAnalysis.suggestedType,
        condition: visionAnalysis.condition,
        notes: visionAnalysis.additionalObservations,
        yearProduced: visionAnalysis.yearProduced,
        manufacturer: visionAnalysis.manufacturerInfo?.suggestedBrand,
        rarity: visionAnalysis.rarity,
        primaryObject: visionAnalysis.primaryObject
      } : {}
    };
    
    // If we have a name or category, search for market prices
    if (mergedData.name || mergedData.category || mergedData.type) {
      try {
        const priceEstimate = await getItemPriceEstimate({
          name: mergedData.name, 
          type: mergedData.type, 
          manufacturer: mergedData.manufacturer, 
          yearProduced: mergedData.yearProduced,
          category: mergedData.category,
          condition: mergedData.condition
        });
        
        if (priceEstimate && (priceEstimate.low || priceEstimate.average)) {
          mergedData.priceEstimate = {
            low: priceEstimate.low || 0,
            average: priceEstimate.average || 0,
            high: priceEstimate.high || 0,
            marketValue: priceEstimate.average || 0
          };
        }
      } catch (error) {
        console.error("Price search error:", error);
      }
    }
    
    // Ensure we have default values for required fields
    return {
      category: mergedData.category || request.category || "Unknown",
      name: mergedData.name || request.name || "Analyzed Item",
      type: mergedData.type || "Unknown Item",
      condition: mergedData.condition || "Good",
      notes: mergedData.notes || request.description || "",
      priceEstimate: mergedData.priceEstimate || { low: 15, average: 30, high: 45, marketValue: 30 },
      confidenceScore: mergedData.confidenceScore || { score: 70, level: "medium" },
      manufacturer: mergedData.manufacturer || "Unknown",
      yearProduced: mergedData.yearProduced || "Unknown",
      edition: mergedData.edition || "Standard",
      modelNumber: mergedData.modelNumber || "Unknown",
      uniqueIdentifiers: mergedData.uniqueIdentifiers || "",
      flaws: mergedData.flaws || "",
      completeness: mergedData.completeness || "Complete",
      dimensions: mergedData.dimensions || "",
      weight: mergedData.weight || "",
      rarity: mergedData.rarity || "Common",
      primaryObject: mergedData.primaryObject || {
        shape: "Unknown",
        colors: { dominant: "Unknown", accents: [] },
        texture: "Unknown",
        material: "Unknown",
        distinguishingFeatures: [],
        style: "Unknown",
        timePeriod: "Unknown",
        function: "Unknown"
      }
    };
  } catch (error: any) {
    console.error("Error in analysis:", error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

// Analyze an image using Gemini AI
export const analyzeImageWithVision = async (imageData: string) => {
  try {
    const response = await supabase.functions.invoke('analyze-with-vision', {
      body: { 
        images: [imageData]
      }
    });
    
    if (response.error) throw response.error;
    return response.data;
  } catch (error) {
    console.error("Gemini API analysis error:", error);
    throw error;
  }
};
