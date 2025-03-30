
import { supabase } from '@/integrations/supabase/client';
import { ConfidenceScore } from '@/types/collection';

interface PriceRange {
  low: number | null;
  average: number | null;
  high: number | null;
  count: number;
  all?: number[];
  sources?: string[];
  condition?: string;
  confidenceScore?: ConfidenceScore;
}

interface SearchResult {
  items: { title: string, link: string, price?: string }[];
  priceRanges?: PriceRange;
  marketplace?: {
    name: string;
    url: string;
    count: number;
  }[];
}

export const searchItemPrices = async (query: string): Promise<SearchResult> => {
  try {
    console.log("Searching for prices with query:", query);
    
    // Enhance the query with additional terms
    const enhancedQuery = enhanceSearchQuery(query);
    
    const response = await supabase.functions.invoke('search-prices', {
      body: { query: enhancedQuery }
    });

    if (response.error) {
      console.error("Supabase function error:", response.error);
      throw new Error(`Error calling search-prices: ${response.error.message}`);
    }
    
    const data = response.data;
    if (!data) {
      console.log("No data returned from search-prices function");
      return { items: [] };
    }
    
    console.log("Search results:", data);
    
    const items = Array.isArray(data.items) 
      ? data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          price: item.pagemap?.offer?.[0]?.price || extractPriceFromSnippet(item.snippet)
        })).filter((item: any) => item.price)
      : [];
    
    // If we have price ranges, calculate confidence score
    if (data.priceRanges) {
      data.priceRanges.confidenceScore = calculatePriceConfidence(data.priceRanges, data.marketplace);
    }
    
    return {
      items,
      priceRanges: data.priceRanges,
      marketplace: data.marketplace
    };
  } catch (error) {
    console.error("Error searching for item prices:", error);
    return { items: [] };
  }
};

/**
 * Calculate a confidence score for the price estimate based on available data
 */
const calculatePriceConfidence = (
  priceRanges: PriceRange, 
  marketplace?: { name: string; url: string; count: number }[]
): ConfidenceScore => {
  let score = 30; // Base score - start low
  
  // Add points based on number of price points found
  if (priceRanges.count > 0) {
    // More price points = higher confidence, up to 30 additional points
    score += Math.min(priceRanges.count * 3, 30);
    
    // Check price consistency (lower standard deviation = higher confidence)
    if (priceRanges.all && priceRanges.all.length > 1) {
      const std = calculateStandardDeviation(priceRanges.all);
      const mean = priceRanges.average || 0;
      
      // If prices are consistent (CV < 0.3), add up to 20 points
      if (mean > 0) {
        const cv = std / mean; // Coefficient of variation
        if (cv < 0.1) score += 20;
        else if (cv < 0.2) score += 15;
        else if (cv < 0.3) score += 10;
        else if (cv < 0.5) score += 5;
      }
    }
  }
  
  // Add points for marketplace diversity (more marketplaces = higher confidence)
  if (marketplace && marketplace.length > 0) {
    score += Math.min(marketplace.length * 5, 20);
    
    // Give bonus points for reputable marketplaces
    const reputableSites = ['ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 'heritage.com'];
    const hasReputableSite = marketplace.some(m => 
      reputableSites.some(site => m.url.includes(site))
    );
    
    if (hasReputableSite) score += 10;
  }
  
  // Cap score at 100
  score = Math.min(Math.max(score, 10), 100);
  
  // Determine level based on score
  let level: 'low' | 'medium' | 'high';
  if (score < 40) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { score, level };
};

/**
 * Calculate standard deviation for an array of numbers
 */
const calculateStandardDeviation = (values: number[]): number => {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
};

// Function to enrich a search query with specific terms for better price results
const enhanceSearchQuery = (query: string): string => {
  const baseQuery = query.trim();
  
  // Don't enhance if the query is already detailed enough
  if (baseQuery.length > 60 || baseQuery.includes(" price ")) {
    return baseQuery;
  }
  
  // If query is too short or generic, enhance it
  let enhancedQuery = baseQuery;
  
  // Add price-related terms if not present
  if (!enhancedQuery.toLowerCase().includes("price") && 
      !enhancedQuery.toLowerCase().includes("value") && 
      !enhancedQuery.toLowerCase().includes("worth")) {
    enhancedQuery += " price value worth";
  }
  
  // Add "for sale" if not present and query doesn't seem to include it
  if (!enhancedQuery.toLowerCase().includes("for sale") && 
      !enhancedQuery.toLowerCase().includes("buy") && 
      !enhancedQuery.toLowerCase().includes("marketplace")) {
    enhancedQuery += " for sale";
  }
  
  // Add collectible-related terms for better price matching
  if (!enhancedQuery.toLowerCase().includes("collectible") && 
      !enhancedQuery.toLowerCase().includes("collection")) {
    enhancedQuery += " collectible";
  }
  
  console.log("Enhanced search query:", enhancedQuery);
  return enhancedQuery;
};

const extractPriceFromSnippet = (snippet?: string): string | undefined => {
  if (!snippet) return undefined;
  
  // More comprehensive price regex that handles various formats
  const priceMatch = snippet.match(/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD)/i);
  return priceMatch ? priceMatch[0].trim() : undefined;
};

/**
 * Get estimated price ranges for an item using its details
 */
export const getItemPriceEstimate = async (item: {
  name?: string;
  category?: string;
  type?: string;
  manufacturer?: string;
  yearProduced?: string;
  condition?: string;
}): Promise<PriceRange | null> => {
  try {
    // Build a detailed search query from the item details
    let searchQuery = item.name || "";
    
    if (item.type && !searchQuery.includes(item.type)) {
      searchQuery += ` ${item.type}`;
    }
    
    if (item.manufacturer) {
      searchQuery += ` ${item.manufacturer}`;
    }
    
    if (item.yearProduced) {
      searchQuery += ` ${item.yearProduced}`;
    }
    
    if (item.category && !searchQuery.includes(item.category)) {
      searchQuery += ` ${item.category}`;
    }
    
    if (item.condition) {
      searchQuery += ` ${item.condition} condition`;
    }
    
    console.log("Searching for prices with query:", searchQuery);
    
    // Conduct the search
    const result = await searchItemPrices(searchQuery);
    
    return result.priceRanges || null;
  } catch (error) {
    console.error("Error estimating item price:", error);
    return null;
  }
};

/**
 * Search for items by image using the search-prices edge function
 */
export const searchByImage = async (
  imageUrl: string, 
  additionalTerms?: string
): Promise<SearchResult> => {
  try {
    console.log("Searching by image:", imageUrl);
    
    // First analyze the image with Vision API to get description
    const visionAnalysis = await analyzeImageForSearch(imageUrl);
    
    if (!visionAnalysis || !visionAnalysis.description) {
      console.error("No vision analysis results");
      return { items: [] };
    }
    
    // Build search query from vision analysis
    let searchQuery = visionAnalysis.description;
    
    // Add additional terms if provided
    if (additionalTerms) {
      searchQuery += " " + additionalTerms;
    }
    
    // Search using the generated query
    const searchResults = await searchItemPrices(searchQuery);
    
    // Enhance results with the vision analysis
    return {
      ...searchResults,
      visionAnalysis,
    };
  } catch (error) {
    console.error("Error in image search:", error);
    return { items: [] };
  }
};

/**
 * Analyze an image to extract searchable text and objects
 */
const analyzeImageForSearch = async (imageUrl: string) => {
  try {
    const response = await supabase.functions.invoke('analyze-with-vision', {
      body: { 
        images: [imageUrl],
        mode: 'search'
      }
    });
    
    if (response.error) throw response.error;
    return response.data;
  } catch (error) {
    console.error("Vision API analysis error:", error);
    throw error;
  }
};
