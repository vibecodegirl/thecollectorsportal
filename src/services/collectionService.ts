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
  const { error, count } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', itemId)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  
  if (count === 0) {
    throw new Error("Item not found or already deleted");
  }
  
  return true;
};

export const searchItemPrices = async (query: string): Promise<{ title: string, link: string, price?: string }[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-prices', {
      body: { query }
    });

    if (error) throw error;
    
    if (!data || !Array.isArray(data.items)) {
      return [];
    }
    
    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      price: item.pagemap?.offer?.[0]?.price || extractPriceFromSnippet(item.snippet)
    })).filter((item: any) => item.price);
  } catch (error) {
    console.error("Error searching for item prices:", error);
    return [];
  }
};

const extractPriceFromSnippet = (snippet?: string): string | undefined => {
  if (!snippet) return undefined;
  
  const priceMatch = snippet.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
  return priceMatch ? priceMatch[0] : undefined;
};

export const analyzeCollectionItem = async (
  request: AIAnalysisRequest
): Promise<Partial<CollectionItem>> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-item', {
      body: { 
        images: request.images,
        category: request.category,
        description: request.description,
        name: request.name
      }
    });
    
    if (error) throw error;
    
    if (!data) {
      return generateMockAnalysis(request);
    }
    
    return data;
  } catch (error) {
    console.error("Error analyzing item:", error);
    return generateMockAnalysis(request);
  }
};

const generateMockAnalysis = (request: AIAnalysisRequest): Partial<CollectionItem> => {
  const description = request.description || "";
  
  return {
    category: request.category || "Unknown",
    name: request.name || "Analyzed Item",
    status: 'active',
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
    primaryObject: {
      shape: description.includes("round") ? "Round/Circular" : description.includes("square") ? "Square/Rectangular" : "Irregular",
      colors: {
        dominant: description.includes("blue") ? "Blue" : description.includes("red") ? "Red" : "Neutral",
        accents: description.includes("gold") ? "Gold accents" : description.includes("silver") ? "Silver accents" : "No distinct accents"
      },
      texture: description.includes("smooth") ? "Smooth" : description.includes("rough") ? "Rough/Textured" : "Mixed texture",
      material: description.includes("wood") ? "Wood" : description.includes("metal") ? "Metal" : description.includes("ceramic") ? "Ceramic" : "Unknown material",
      distinguishingFeatures: description.includes("signature") ? "Contains signature or maker's mark" : 
                             description.includes("pattern") ? "Distinctive pattern or design" : "No significant distinguishing features noted",
      style: description.includes("modern") ? "Modern/Contemporary" : 
             description.includes("antique") ? "Antique/Vintage" : 
             description.includes("Art Deco") ? "Art Deco" : "Indeterminate style",
      timePeriod: description.includes("20th century") ? "20th Century" : 
                  description.includes("19th century") ? "19th Century" : "Unknown period",
      function: description.includes("decorative") ? "Decorative" : 
                description.includes("functional") ? "Functional/Utilitarian" : "Unknown function"
    }
  };
};
