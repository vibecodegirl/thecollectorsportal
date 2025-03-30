import { supabase } from '@/integrations/supabase/client';

interface PriceRange {
  low: number | null;
  average: number | null;
  high: number | null;
  count: number;
  all?: number[];
}

interface SearchResult {
  items: { title: string, link: string, price?: string }[];
  priceRanges?: PriceRange;
  marketplace?: {
    name: string;
    url: string;
    count: number;
  }[];
  error?: string;
  details?: string;
}

export const searchItemPrices = async (query: string): Promise<SearchResult> => {
  try {
    console.log("Searching for prices with query:", query);
    
    // Enhance the query with additional terms
    const enhancedQuery = enhanceSearchQuery(query);
    
    const response = await supabase.functions.invoke('search-prices', {
      body: { query: enhancedQuery }
    });

    // Handle function error responses
    if (response.error) {
      console.error("Supabase function error:", response.error);
      throw new Error(`Error calling search-prices: ${response.error.message}`);
    }
    
    const data = response.data;
    if (!data) {
      console.log("No data returned from search-prices function");
      return { items: [] };
    }
    
    // Check if the response contains an error message (API returned 200 but with error details)
    if (data.error) {
      console.error("Search API error:", data.error, data.details || '');
      return { 
        items: data.items || [],
        priceRanges: data.priceRanges,
        marketplace: data.marketplace,
        error: data.error,
        details: data.details
      };
    }
    
    console.log("Search results:", data);
    
    const items = Array.isArray(data.items) 
      ? data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          price: item.pagemap?.offer?.[0]?.price || extractPriceFromSnippet(item.snippet)
        })).filter((item: any) => item.price)
      : [];
    
    return {
      items,
      priceRanges: data.priceRanges,
      marketplace: data.marketplace
    };
  } catch (error) {
    console.error("Error searching for item prices:", error);
    return { 
      items: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// New function to enrich a search query with specific terms for better price results
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

// New function to get estimated price ranges for an item using its details
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
