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
  visionAnalysis?: any;
}

export const searchItemPrices = async (query: string): Promise<SearchResult> => {
  try {
    console.log("Searching for prices with query:", query);
    
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

const calculatePriceConfidence = (
  priceRanges: PriceRange, 
  marketplace?: { name: string; url: string; count: number }[]
): ConfidenceScore => {
  let score = 30;
  
  if (priceRanges.count > 0) {
    score += Math.min(priceRanges.count * 3, 30);
    
    if (priceRanges.all && priceRanges.all.length > 1) {
      const std = calculateStandardDeviation(priceRanges.all);
      const mean = priceRanges.average || 0;
      
      if (mean > 0) {
        const cv = std / mean;
        if (cv < 0.1) score += 20;
        else if (cv < 0.2) score += 15;
        else if (cv < 0.3) score += 10;
        else if (cv < 0.5) score += 5;
      }
    }
  }
  
  if (marketplace && marketplace.length > 0) {
    score += Math.min(marketplace.length * 5, 20);
    
    const reputableSites = ['ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 'heritage.com'];
    const hasReputableSite = marketplace.some(m => 
      reputableSites.some(site => m.url.includes(site))
    );
    
    if (hasReputableSite) score += 10;
  }
  
  score = Math.min(Math.max(score, 10), 100);
  
  let level: 'low' | 'medium' | 'high';
  if (score < 40) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { score, level };
};

const calculateStandardDeviation = (values: number[]): number => {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
};

const enhanceSearchQuery = (query: string): string => {
  const baseQuery = query.trim();
  
  if (baseQuery.length > 60 || baseQuery.includes(" price ")) {
    return baseQuery;
  }
  
  let enhancedQuery = baseQuery;
  
  if (!enhancedQuery.toLowerCase().includes("price") && 
      !enhancedQuery.toLowerCase().includes("value") && 
      !enhancedQuery.toLowerCase().includes("worth")) {
    enhancedQuery += " price value worth";
  }
  
  if (!enhancedQuery.toLowerCase().includes("for sale") && 
      !enhancedQuery.toLowerCase().includes("buy") && 
      !enhancedQuery.toLowerCase().includes("marketplace")) {
    enhancedQuery += " for sale";
  }
  
  if (!enhancedQuery.toLowerCase().includes("collectible") && 
      !enhancedQuery.toLowerCase().includes("collection")) {
    enhancedQuery += " collectible";
  }
  
  console.log("Enhanced search query:", enhancedQuery);
  return enhancedQuery;
};

const extractPriceFromSnippet = (snippet?: string): string | undefined => {
  if (!snippet) return undefined;
  
  const priceMatch = snippet.match(/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD)/i);
  return priceMatch ? priceMatch[0].trim() : undefined;
};

export const getItemPriceEstimate = async (item: {
  name?: string;
  category?: string;
  type?: string;
  manufacturer?: string;
  yearProduced?: string;
  condition?: string;
}): Promise<PriceRange | null> => {
  try {
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
    
    const result = await searchItemPrices(searchQuery);
    
    return result.priceRanges || null;
  } catch (error) {
    console.error("Error estimating item price:", error);
    return null;
  }
};

export const searchByImage = async (
  imageUrl: string, 
  additionalTerms?: string
): Promise<SearchResult> => {
  try {
    console.log("Searching by image:", imageUrl);
    
    const visionAnalysis = await analyzeImageForSearch(imageUrl);
    
    if (!visionAnalysis || !visionAnalysis.description) {
      console.error("No vision analysis results");
      return { items: [] };
    }
    
    let searchQuery = visionAnalysis.description;
    
    if (additionalTerms) {
      searchQuery += " " + additionalTerms;
    }
    
    const searchResults = await searchItemPrices(searchQuery);
    
    return {
      ...searchResults,
      visionAnalysis,
    };
  } catch (error) {
    console.error("Error in image search:", error);
    return { items: [] };
  }
};

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
