
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
}

export const searchItemPrices = async (query: string): Promise<SearchResult> => {
  try {
    const response = await supabase.functions.invoke('search-prices', {
      body: { query }
    });

    if (response.error) throw response.error;
    
    const data = response.data;
    if (!data) {
      return { items: [] };
    }
    
    const items = Array.isArray(data.items) 
      ? data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          price: item.pagemap?.offer?.[0]?.price || extractPriceFromSnippet(item.snippet)
        })).filter((item: any) => item.price)
      : [];
    
    return {
      items,
      priceRanges: data.priceRanges
    };
  } catch (error) {
    console.error("Error searching for item prices:", error);
    return { items: [] };
  }
};

const extractPriceFromSnippet = (snippet?: string): string | undefined => {
  if (!snippet) return undefined;
  
  const priceMatch = snippet.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
  return priceMatch ? priceMatch[0] : undefined;
};
