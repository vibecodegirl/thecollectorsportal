
import { CollectionItem } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisRequest, VisionAnalysisResult } from '@/contexts/CollectionContext';
import { getItemPriceEstimate } from './priceService';

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
    
    // If we have images, try to analyze them with Vision AI
    let visionAnalysis: VisionAnalysisResult | null = null;
    
    if (request.images && request.images.length > 0) {
      try {
        visionAnalysis = await analyzeImageWithVision(request.images[0]);
        console.log("Vision analysis completed successfully");
      } catch (error) {
        console.error("Vision analysis error:", error);
      }
    }
    
    // Try to use Supabase function for analysis
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
    
    // If both analyses failed, use mock analysis
    if (!analysisData && !visionAnalysis) {
      return generateMockAnalysis(request);
    }
    
    // Combine data from both sources with Vision AI taking precedence for certain fields
    const combinedData = await combineAnalysisData(
      analysisData || {}, 
      visionAnalysis,
      request
    );
    
    return combinedData;
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

const combineAnalysisData = async (
  analysisData: Partial<CollectionItem>,
  visionData: VisionAnalysisResult | null,
  request: AIAnalysisRequest
): Promise<Partial<CollectionItem>> => {
  // Start with the analysis data as base
  const combined = { ...analysisData };
  
  // Fill in missing data from vision analysis
  if (visionData) {
    // Category and name
    combined.category = combined.category || visionData.suggestedCategory || request.category || "General Collectibles";
    combined.name = combined.name || visionData.suggestedType || request.name || "Unknown Item";
    
    // Type information
    combined.type = combined.type || visionData.suggestedType || "";
    
    // Manufacturer from logo detection
    if (visionData.manufacturerInfo?.suggestedBrand) {
      combined.manufacturer = combined.manufacturer || visionData.manufacturerInfo.suggestedBrand;
    }
    
    // Year produced from detected time period
    if (visionData.yearProduced) {
      combined.yearProduced = combined.yearProduced || visionData.yearProduced;
    } else if (visionData.primaryObject.timePeriod) {
      combined.yearProduced = combined.yearProduced || visionData.primaryObject.timePeriod;
    }
    
    // Fill condition if available
    combined.condition = combined.condition || visionData.condition || "Good";
    
    // Fill model number if detected
    if (visionData.identifiers?.modelNumber) {
      combined.modelNumber = combined.modelNumber || visionData.identifiers.modelNumber;
    }
    
    // Fill rarity if detected
    combined.rarity = combined.rarity || visionData.rarity || "Common";
    
    // Fill in physical attributes
    combined.dimensions = combined.dimensions || describeObjectDimensions(visionData);
    
    // If we have identifying features, add them to uniqueIdentifiers
    if (visionData.primaryObject.distinguishingFeatures && visionData.primaryObject.distinguishingFeatures.length > 0) {
      combined.uniqueIdentifiers = combined.uniqueIdentifiers || 
        visionData.primaryObject.distinguishingFeatures.join("; ");
    }
    
    // Add more detailed notes
    if (visionData.generatedDescription) {
      combined.notes = combined.notes || visionData.generatedDescription;
    } else if (visionData.additionalObservations) {
      combined.notes = combined.notes || visionData.additionalObservations;
    }
    
    // Fill in primary object data
    if (!combined.primaryObject) {
      combined.primaryObject = visionData.primaryObject;
    } else {
      // Merge primaryObject data preferring Vision AI data
      combined.primaryObject = {
        ...combined.primaryObject,
        shape: combined.primaryObject.shape || visionData.primaryObject.shape,
        colors: combined.primaryObject.colors || visionData.primaryObject.colors,
        texture: combined.primaryObject.texture || visionData.primaryObject.texture,
        material: combined.primaryObject.material || visionData.primaryObject.material,
        distinguishingFeatures: combined.primaryObject.distinguishingFeatures || 
                               visionData.primaryObject.distinguishingFeatures,
        style: combined.primaryObject.style || visionData.primaryObject.style,
        timePeriod: combined.primaryObject.timePeriod || visionData.primaryObject.timePeriod,
        function: combined.primaryObject.function || 
                 (visionData.primaryObject.possibleFunctions && visionData.primaryObject.possibleFunctions.length > 0 
                  ? visionData.primaryObject.possibleFunctions[0] : "Unknown")
      };
    }
  }
  
  // Get price estimate
  try {
    const priceData = await getItemPriceEstimate({
      name: combined.name,
      category: combined.category,
      type: combined.type,
      manufacturer: combined.manufacturer,
      yearProduced: combined.yearProduced,
      condition: combined.condition
    });
    
    if (priceData && (priceData.low || priceData.average || priceData.high)) {
      combined.priceEstimate = {
        low: priceData.low || 0,
        average: priceData.average || 0,
        high: priceData.high || 0,
        marketValue: priceData.average || 0
      };
      
      // Set confidence based on price data
      if (priceData.count >= 10) {
        combined.confidenceScore = { score: 85, level: 'high' };
      } else if (priceData.count >= 5) {
        combined.confidenceScore = { score: 65, level: 'medium' };
      } else {
        combined.confidenceScore = { score: 45, level: 'low' };
      }
    }
  } catch (error) {
    console.error("Error getting price estimate:", error);
  }
  
  // Ensure default values
  combined.status = 'active';
  combined.confidenceScore = combined.confidenceScore || { score: 50, level: 'medium' };
  combined.priceEstimate = combined.priceEstimate || { low: 10, average: 20, high: 30, marketValue: 20 };
  
  return combined;
};

const describeObjectDimensions = (visionData: VisionAnalysisResult): string => {
  if (!visionData.primaryObject) return "";
  
  // Extract shape information
  const shape = visionData.primaryObject.shape;
  
  if (shape === "Indeterminate" || !shape) return "";
  
  switch (shape.toLowerCase()) {
    case "rectangle":
    case "square":
      return "Rectangular shape";
    case "circle":
    case "oval":
      return "Circular/Oval shape";
    case "triangle":
      return "Triangular shape";
    default:
      if (shape.startsWith("Shape of ")) {
        return `Dimensions typical of ${shape.substring(9)}`;
      }
      return `${shape} shape`;
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
