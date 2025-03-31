import { supabase } from '@/integrations/supabase/client';
import { ConfidenceScore } from '@/types/collection';

interface PriceRange {
  low: number | null;
  average: number | null;
  high: number | null;
  marketValue?: number;
  median?: number;
  count: number;
  all?: number[];
  sources?: string[];
  condition?: string;
  confidenceScore?: ConfidenceScore;
  lastUpdated?: Date;
  outliers?: number[];
  histogramData?: {buckets: {min: number, max: number, count: number}[], range: {min: number, max: number}};
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
      // Process numerical values with better precision
      const processValue = (value: any) => value !== null && value !== undefined ? parseFloat(parseFloat(value).toFixed(2)) : null;
      
      data.priceRanges.low = processValue(data.priceRanges.low);
      data.priceRanges.average = processValue(data.priceRanges.average);
      data.priceRanges.high = processValue(data.priceRanges.high);
      data.priceRanges.median = processValue(data.priceRanges.median);
      data.priceRanges.marketValue = processValue(data.priceRanges.marketValue);
      
      // Use median if available, otherwise use the calculated market value
      if (data.priceRanges.median && !data.priceRanges.marketValue) {
        data.priceRanges.marketValue = data.priceRanges.median;
      }
      
      // Timestamp the data
      data.priceRanges.lastUpdated = new Date();
      
      // Calculate enhanced confidence score
      data.priceRanges.confidenceScore = calculateEnhancedPriceConfidence(data.priceRanges, data.marketplace, query);
      
      // Generate histogram data if we have price points
      if (data.priceRanges.all && data.priceRanges.all.length > 3) {
        data.priceRanges.histogramData = generateHistogramData(data.priceRanges.all);
      }
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

const generateHistogramData = (prices: number[]) => {
  if (!prices || prices.length < 3) return undefined;
  
  // Sort prices
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Find min and max
  const min = sortedPrices[0];
  const max = sortedPrices[sortedPrices.length - 1];
  const range = max - min;
  
  // Determine number of buckets - Sturges' formula
  const bucketCount = Math.max(5, Math.min(10, Math.ceil(1 + 3.322 * Math.log10(prices.length))));
  const bucketSize = range / bucketCount;
  
  // Create buckets
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + (i * bucketSize);
    const bucketMax = min + ((i + 1) * bucketSize);
    
    const bucket = {
      min: parseFloat(bucketMin.toFixed(2)),
      max: parseFloat(bucketMax.toFixed(2)),
      count: 0
    };
    
    // Count items in this bucket
    prices.forEach(price => {
      if (price >= bucketMin && (price < bucketMax || (i === bucketCount - 1 && price <= bucketMax))) {
        bucket.count++;
      }
    });
    
    buckets.push(bucket);
  }
  
  return {
    buckets,
    range: { min, max }
  };
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
  
  // Data points factor (more data = higher confidence)
  if (priceRanges.count > 0) {
    // Logarithmic scale to prevent too many data points from dominating the score
    const dataPoints = Math.min(Math.ceil(5 * Math.log(priceRanges.count + 1)), 30);
    score += dataPoints;
    factors.push({factor: `${priceRanges.count} data points`, impact: dataPoints});
    
    // Analyze price distribution
    if (priceRanges.all && priceRanges.all.length > 1) {
      // Calculate standard deviation and coefficient of variation
      const std = calculateStandardDeviation(priceRanges.all);
      const mean = priceRanges.average || 0;
      
      if (mean > 0) {
        const cv = std / mean;
        let consistencyScore = 0;
        
        // Reward price consistency more than before
        if (cv < 0.1) consistencyScore = 25;
        else if (cv < 0.2) consistencyScore = 20;
        else if (cv < 0.3) consistencyScore = 15;
        else if (cv < 0.5) consistencyScore = 8;
        else if (cv < 0.8) consistencyScore = 4;
        
        score += consistencyScore;
        factors.push({
          factor: `Price consistency (CV: ${cv.toFixed(2)})`, 
          impact: consistencyScore
        });
      }
      
      // Check for outliers using IQR method (Tukey's fences)
      const sortedPrices = [...priceRanges.all].sort((a, b) => a - b);
      const q1Index = Math.floor(sortedPrices.length * 0.25);
      const q3Index = Math.floor(sortedPrices.length * 0.75);
      const q1 = sortedPrices[q1Index];
      const q3 = sortedPrices[q3Index];
      const iqr = q3 - q1;
      
      // Define outliers using Tukey's fences (1.5 * IQR)
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      
      const outliers = sortedPrices.filter(p => p < lowerFence || p > upperFence);
      const outlierRatio = outliers.length / sortedPrices.length;
      
      // Store outliers for reference
      if (outliers.length > 0) {
        priceRanges.outliers = outliers;
      }
      
      // Reward fewer outliers
      let outlierScore = 0;
      if (outlierRatio < 0.05) outlierScore = 15;
      else if (outlierRatio < 0.1) outlierScore = 10;
      else if (outlierRatio < 0.15) outlierScore = 5;
      
      score += outlierScore;
      if (outlierScore > 0) {
        factors.push({
          factor: `Low outliers (${(outlierRatio * 100).toFixed(1)}%)`,
          impact: outlierScore
        });
      } else if (outlierRatio > 0.15) {
        factors.push({
          factor: `High outliers (${(outlierRatio * 100).toFixed(1)}%)`,
          impact: 0
        });
      }
    }
  }
  
  // Source diversity factor (more diverse sources = higher confidence)
  if (marketplace && marketplace.length > 0) {
    const diversityScore = Math.min(marketplace.length * 3, 15);
    score += diversityScore;
    factors.push({
      factor: `Source diversity (${marketplace.length} sites)`,
      impact: diversityScore
    });
    
    // Give extra weight to reputable sources
    const reputableSites = [
      'ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 
      'heritage.com', 'ha.com', 'worthpoint.com', 'rubylane.com',
      'bonhams.com', 'catawiki.com', 'invaluable.com', 'liveauctioneers.com',
      'hemmings.com', 'phillips.com', 'abebooks.com', 'justcollecting.com'
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
    
    // Source-specific boosters
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
  
  // Query specificity factor
  if (query) {
    const specificTerms = [
      'model', 'serial', 'edition', 'condition', 'mint', 'sealed', 'year',
      'authentic', 'original', 'number', 'limited', 'size', 'brand', 'maker'
    ];
    let specificityScore = 0;
    
    // Check how specific the query is
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
  
  // Condition factor
  if (priceRanges.condition) {
    score += 5;
    factors.push({factor: "Condition specified", impact: 5});
  }
  
  // Cap score between 10-100
  score = Math.min(Math.max(score, 10), 100);
  
  // Determine confidence level
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
  
  // Don't modify if query is already very long or contains specific price instructions
  if (baseQuery.length > 70 || baseQuery.includes(" price ")) {
    return baseQuery;
  }
  
  let enhancedQuery = baseQuery;
  
  // Add price-related terms if missing
  if (!enhancedQuery.toLowerCase().includes("price") && 
      !enhancedQuery.toLowerCase().includes("value") && 
      !enhancedQuery.toLowerCase().includes("worth") &&
      !enhancedQuery.toLowerCase().includes("cost")) {
    enhancedQuery += " price value worth";
  }
  
  // Add marketplace terms if missing
  if (!enhancedQuery.toLowerCase().includes("for sale") && 
      !enhancedQuery.toLowerCase().includes("buy") && 
      !enhancedQuery.toLowerCase().includes("marketplace") &&
      !enhancedQuery.toLowerCase().includes("ebay") &&
      !enhancedQuery.toLowerCase().includes("sold")) {
    enhancedQuery += " for sale ebay sold listings";
  }
  
  // Add collectible context if relevant
  const collectibleKeywords = ["collectible", "collection", "collector", "vintage", "antique", "rare"];
  const hasCollectibleContext = collectibleKeywords.some(keyword => 
    enhancedQuery.toLowerCase().includes(keyword)
  );
  
  if (!hasCollectibleContext) {
    enhancedQuery += " collectible";
  }
  
  console.log("Enhanced search query:", enhancedQuery);
  return enhancedQuery;
};

const extractPriceFromSnippet = (snippet?: string): string | undefined => {
  if (!snippet) return undefined;
  
  // Improved dollar amount extraction regex
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
  
  // Extract prices written as words
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
  
  // Extract price ranges (e.g., "$100-$200")
  const rangeRegex = /\$\s*([0-9,]+(\.[0-9]{1,2})?)\s*-\s*\$\s*([0-9,]+(\.[0-9]{1,2})?)/g;
  while ((match = rangeRegex.exec(snippet)) !== null) {
    const lowPriceStr = match[1].replace(/,/g, '');
    const highPriceStr = match[3].replace(/,/g, '');
    const lowPrice = parseFloat(lowPriceStr);
    const highPrice = parseFloat(highPriceStr);
    
    if (!isNaN(lowPrice) && !isNaN(highPrice) && lowPrice > 0 && highPrice > 0) {
      // Use the average of the range
      const avgPrice = (lowPrice + highPrice) / 2;
      matches.push({
        price: avgPrice,
        text: match[0],
        index: match.index
      });
    }
  }
  
  if (matches.length > 0) {
    // Sort by position in text - usually first price is most relevant
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
    // Build a comprehensive search query using available item details
    const queryParts = [];
    
    if (item.name) queryParts.push(item.name);
    if (item.manufacturer) queryParts.push(item.manufacturer);
    if (item.type && !item.name?.toLowerCase().includes(item.type.toLowerCase())) {
      queryParts.push(item.type);
    }
    if (item.yearProduced) queryParts.push(item.yearProduced);
    if (item.category && !queryParts.some(part => part.toLowerCase().includes(item.category!.toLowerCase()))) {
      queryParts.push(item.category);
    }
    
    // Build search query with key details
    let searchQuery = queryParts.join(' ');
    
    // Add condition if available
    if (item.condition) {
      searchQuery += ` ${item.condition} condition`;
    }
    
    console.log("Searching for prices with query:", searchQuery);
    
    const result = await searchItemPrices(searchQuery);
    
    // If we got priceRanges, ensure all required fields are present
    if (result.priceRanges) {
      // Ensure we have default values for null or undefined fields
      result.priceRanges.low = result.priceRanges.low || 0;
      result.priceRanges.average = result.priceRanges.average || 0;
      result.priceRanges.high = result.priceRanges.high || 0;
      
      // Ensure marketValue is set (use average if not available)
      if (result.priceRanges.marketValue === null || result.priceRanges.marketValue === undefined) {
        result.priceRanges.marketValue = result.priceRanges.average || 0;
      }
      
      console.log("Returned price estimate:", result.priceRanges);
    } else {
      // Return a default price estimate if none was found
      return {
        low: 0,
        average: 0,
        high: 0,
        marketValue: 0,
        count: 0
      };
    }
    
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
