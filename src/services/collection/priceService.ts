
import { supabase } from '@/integrations/supabase/client';

export const searchItemPrices = async (query: string): Promise<{ title: string, link: string, price?: string }[]> => {
  try {
    const response = await supabase.functions.invoke('search-prices', {
      body: { query }
    });

    if (response.error) throw response.error;
    
    const data = response.data;
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
