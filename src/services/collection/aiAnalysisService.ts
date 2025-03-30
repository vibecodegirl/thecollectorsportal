
import { CollectionItem } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisRequest, VisionAnalysisResult } from '@/contexts/CollectionContext';

export const analyzeCollectionItem = async (
  request: AIAnalysisRequest
): Promise<Partial<CollectionItem>> => {
  try {
    console.log("Sending analysis request:", { 
      category: request.category, 
      description: request.description, 
      name: request.name, 
      imageCount: request.images?.length || 0 
    });
    
    const response = await supabase.functions.invoke('analyze-item', {
      body: { 
        images: request.images,
        category: request.category,
        description: request.description,
        name: request.name
      }
    });
    
    if (response.error) throw response.error;
    
    const data = response.data;
    if (!data) {
      return generateMockAnalysis(request);
    }
    
    return data;
  } catch (error) {
    console.error("Error analyzing item:", error);
    return generateMockAnalysis(request);
  }
};

export const analyzeImageWithVision = async (image: string): Promise<VisionAnalysisResult> => {
  try {
    const response = await supabase.functions.invoke('analyze-with-vision', {
      body: { 
        images: [image]
      }
    });
    
    if (response.error) throw response.error;
    
    const data = response.data;
    if (!data) {
      throw new Error("No analysis data returned");
    }
    
    return data;
  } catch (error) {
    console.error("Error analyzing image with Vision AI:", error);
    throw error;
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
