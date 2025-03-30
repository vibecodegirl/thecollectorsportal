import { supabase } from '@/integrations/supabase/client';
import { ConfidenceScore } from '@/types/collection';

interface PriceRange {
  low: number | null;
  average: number | null;
  high: number | null;
  marketValue?: number;
  count: number;
  all?: number[];
  sources?: string[];
  condition?: string;
  confidenceScore?: ConfidenceScore;
  lastUpdated?: Date;
}

interface SearchResult {
  items: { title: string, link: string, price?: string, source?: string }[];
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
          price: item.pagemap?.offer?.[0]?.price || extractPriceFromSnippet(item.snippet),
          source: extractSourceFromLink(item.link)
        })).filter((item: any) => item.price)
      : [];
    
    if (data.priceRanges) {
      if (data.priceRanges.low) data.priceRanges.low = parseFloat(data.priceRanges.low.toFixed(2));
      if (data.priceRanges.average) data.priceRanges.average = parseFloat(data.priceRanges.average.toFixed(2));
      if (data.priceRanges.high) data.priceRanges.high = parseFloat(data.priceRanges.high.toFixed(2));
      if (data.priceRanges.marketValue) data.priceRanges.marketValue = parseFloat(data.priceRanges.marketValue.toFixed(2));
      
      data.priceRanges.lastUpdated = new Date();
      
      data.priceRanges.confidenceScore = calculateEnhancedPriceConfidence(data.priceRanges, data.marketplace, query);
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

const extractSourceFromLink = (link: string): string => {
  try {
    const url = new URL(link);
    let hostname = url.hostname.replace('www.', '');
    
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
      return `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
    }
    return hostname;
  } catch (error) {
    return "unknown";
  }
};

const calculateEnhancedPriceConfidence = (
  priceRanges: PriceRange, 
  marketplace?: { name: string; url: string; count: number }[],
  query?: string
): ConfidenceScore => {
  let score = 20;
  let factors: {factor: string, impact: number}[] = [];
  
  if (priceRanges.count > 0) {
    const dataPoints = Math.min(priceRanges.count * 3, 25);
    score += dataPoints;
    factors.push({factor: `${priceRanges.count} data points`, impact: dataPoints});
    
    if (priceRanges.all && priceRanges.all.length > 1) {
      const std = calculateStandardDeviation(priceRanges.all);
      const mean = priceRanges.average || 0;
      
      if (mean > 0) {
        const cv = std / mean;
        let consistencyScore = 0;
        
        if (cv < 0.1) consistencyScore = 20;
        else if (cv < 0.2) consistencyScore = 15;
        else if (cv < 0.3) consistencyScore = 10;
        else if (cv < 0.5) consistencyScore = 5;
        
        score += consistencyScore;
        factors.push({
          factor: `Price consistency (CV: ${cv.toFixed(2)})`, 
          impact: consistencyScore
        });
      }
      
      const sortedPrices = [...priceRanges.all].sort((a, b) => a - b);
      const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
      const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
      const iqr = q3 - q1;
      const outlierCount = sortedPrices.filter(p => p < q1 - 1.5 * iqr || p > q3 + 1.5 * iqr).length;
      const outlierRatio = outlierCount / sortedPrices.length;
      
      let outlierScore = 0;
      if (outlierRatio < 0.05) outlierScore = 10;
      else if (outlierRatio < 0.1) outlierScore = 5;
      
      score += outlierScore;
      if (outlierScore > 0) {
        factors.push({
          factor: `Low outliers (${(outlierRatio * 100).toFixed(1)}%)`,
          impact: outlierScore
        });
      }
    }
  }
  
  if (marketplace && marketplace.length > 0) {
    const diversityScore = Math.min(marketplace.length * 2.5, 15);
    score += diversityScore;
    factors.push({
      factor: `Source diversity (${marketplace.length} sites)`,
      impact: diversityScore
    });
    
    const reputableSites = [
      'ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 
      'heritage.com', 'ha.com', 'worthpoint.com', 'rubylane.com',
      'bonhams.com', 'catawiki.com', 'invaluable.com', 'liveauctioneers.com'
    ];
    
    let reputableCount = 0;
    marketplace.forEach(m => {
      if (reputableSites.some(site => m.url.includes(site))) {
        reputableCount++;
      }
    });
    
    const reputationScore = Math.min(reputableCount * 5, 15);
    if (reputationScore > 0) {
      score += reputationScore;
      factors.push({
        factor: `Reputable sources (${reputableCount})`,
        impact: reputationScore
      });
    }
    
    const hasEbay = marketplace.some(m => m.url.includes('ebay.com'));
    if (hasEbay) {
      score += 5;
      factors.push({factor: "eBay listings", impact: 5});
    }
    
    const hasAuction = marketplace.some(m => 
      ['sothebys.com', 'christies.com', 'bonhams.com', 'ha.com', 'heritage.com'].some(site => m.url.includes(site))
    );
    if (hasAuction) {
      score += 10;
      factors.push({factor: "Auction house data", impact: 10});
    }
  }
  
  if (query) {
    const specificTerms = ['model', 'serial', 'edition', 'condition', 'mint', 'sealed', 'year'];
    let specificityScore = 0;
    
    specificTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        specificityScore += 2;
      }
    });
    
    specificityScore = Math.min(specificityScore, 10);
    if (specificityScore > 0) {
      score += specificityScore;
      factors.push({
        factor: "Query specificity",
        impact: specificityScore
      });
    }
  }
  
  if (priceRanges.condition) {
    score += 5;
    factors.push({factor: "Condition specified", impact: 5});
  }
  
  score = Math.min(Math.max(score, 10), 100);
  
  let level: 'low' | 'medium' | 'high';
  if (score < 40) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { 
    score, 
    level,
    factors
  };
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
      !enhancedQuery.toLowerCase().includes("marketplace") &&
      !enhancedQuery.toLowerCase().includes("ebay") &&
      !enhancedQuery.toLowerCase().includes("sold")) {
    enhancedQuery += " for sale ebay sold listings";
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
  
  const priceRegex = /\$\s*([0-9,]+(\.[0-9]{1,2})?)/g;
  let matches = [];
  let match;
  
  while ((match = priceRegex.exec(snippet)) !== null) {
    const priceStr = match[1].replace(/,/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      matches.push({
        price,
        text: match[0],
        index: match.index
      });
    }
  }
  
  const dollarRegex = /(\d+(?:,\d+)*(?:\.\d{1,2})?)(?:\s+)(?:dollars|USD)/gi;
  while ((match = dollarRegex.exec(snippet)) !== null) {
    const priceStr = match[1].replace(/,/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      matches.push({
        price,
        text: match[0],
        index: match.index
      });
    }
  }
  
  if (matches.length > 0) {
    matches.sort((a, b) => a.index - b.index);
    return matches[0].text;
  }
  
  return undefined;
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
      searchQuery += ` ${item.condition}. Some wear is visible on the ${item.name?.toLowerCase()} and label.`;
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
