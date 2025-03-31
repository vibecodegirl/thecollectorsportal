
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the request body
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Google Search API key from environment variable
    const apiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const cx = Deno.env.get("GOOGLE_SEARCH_CX");

    if (!apiKey || !cx) {
      console.error("Google Search API configuration is incomplete");
      return new Response(
        JSON.stringify({ 
          error: "Google Search API configuration is incomplete",
          items: [],
          priceRanges: { low: null, average: null, high: null, count: 0 },
          marketplace: []
        }),
        {
          status: 200, // Return 200 instead of 500 to avoid client-side errors
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Searching for prices with query: ${query}`);
    
    // Enhanced search query for better price results
    const enhancedQuery = constructEnhancedQuery(query);
    
    // Call the Google Custom Search JSON API
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.append("key", apiKey);
    searchUrl.searchParams.append("cx", cx);  // Custom Search Engine ID
    searchUrl.searchParams.append("q", enhancedQuery);
    searchUrl.searchParams.append("num", "10");  // Increase results to 10
    
    console.log(`Making request to Google Search API: ${searchUrl.toString()}`);
    
    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Search API error: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to search for prices", 
          details: errorText,
          items: [],
          priceRanges: { low: null, average: null, high: null, count: 0 },
          marketplace: []
        }),
        {
          status: 200, // Return 200 instead of 500 to avoid client-side errors
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const data = await response.json();
    
    // Extract price ranges from search results with improved algorithm
    const priceRanges = extractPriceRanges(data, query);
    
    // Extract marketplace information
    const marketplace = extractMarketplaceInfo(data);
    
    return new Response(
      JSON.stringify({
        items: data.items || [],
        priceRanges,
        marketplace
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in search-prices function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        items: [],
        priceRanges: { low: null, average: null, high: null, count: 0 },
        marketplace: []
      }),
      {
        status: 200, // Return 200 instead of 500 to avoid client-side errors
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Construct enhanced search query based on original query
function constructEnhancedQuery(query) {
  const baseQuery = query.trim();
  
  // Don't modify if query is already very long
  if (baseQuery.length > 70) {
    return baseQuery;
  }
  
  let enhancedQuery = baseQuery;
  
  // Add marketplace terms if missing
  if (!enhancedQuery.toLowerCase().includes("ebay") && 
      !enhancedQuery.toLowerCase().includes("sold") &&
      !enhancedQuery.toLowerCase().includes("listing")) {
    enhancedQuery += " ebay sold listing";
  }
  
  // Add price-related terms if missing
  if (!enhancedQuery.toLowerCase().includes("price") && 
      !enhancedQuery.toLowerCase().includes("value") && 
      !enhancedQuery.toLowerCase().includes("worth")) {
    enhancedQuery += " price value worth";
  }
  
  // Add collectible context if needed
  if (!enhancedQuery.toLowerCase().includes("collectible") && 
      !enhancedQuery.toLowerCase().includes("collection")) {
    enhancedQuery += " collectible";
  }
  
  return enhancedQuery;
}

// Improved function to extract price ranges from search results
function extractPriceRanges(data, originalQuery) {
  const prices = [];
  const sources = [];
  const conditions = [];
  
  if (!data.items || !Array.isArray(data.items)) {
    return { low: null, average: null, high: null, count: 0 };
  }
  
  // Extract condition information from the original query if available
  const conditionKeywords = ["mint", "near mint", "excellent", "very good", "good", "fair", "poor"];
  let queryCondition = null;
  
  for (const condition of conditionKeywords) {
    if (originalQuery.toLowerCase().includes(condition)) {
      queryCondition = condition;
      break;
    }
  }
  
  // Extract prices from snippets, titles, and structured data
  data.items.forEach(item => {
    // Try to extract from snippet
    if (item.snippet) {
      const snippetPrices = extractPricesFromText(item.snippet);
      if (snippetPrices.length > 0) {
        snippetPrices.forEach(price => {
          prices.push(price);
          sources.push(item.displayLink || 'snippet');
        });
      }
    }
    
    // Try to extract from title
    if (item.title) {
      const titlePrices = extractPricesFromText(item.title);
      if (titlePrices.length > 0) {
        titlePrices.forEach(price => {
          prices.push(price);
          sources.push(item.displayLink || 'title');
        });
      }
    }
    
    // Try to extract from metatags if available
    if (item.pagemap?.metatags) {
      item.pagemap.metatags.forEach(metatag => {
        if (metatag["og:price:amount"]) {
          const price = parseFloat(metatag["og:price:amount"]);
          if (!isNaN(price) && price > 0) {
            prices.push(price);
            sources.push(item.displayLink || 'metatag');
          }
        }
      });
    }
    
    // Try to extract from offer if available
    if (item.pagemap?.offer) {
      item.pagemap.offer.forEach(offer => {
        if (offer.price) {
          const price = parseFloat(offer.price.replace(/[^0-9.]/g, ''));
          if (!isNaN(price) && price > 0) {
            prices.push(price);
            sources.push(item.displayLink || 'offer');
            
            // Try to extract condition information
            if (offer.itemCondition) {
              conditions.push(offer.itemCondition);
            }
          }
        }
      });
    }
    
    // Try to extract from product if available
    if (item.pagemap?.product) {
      item.pagemap.product.forEach(product => {
        if (product.price) {
          const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
          if (!isNaN(price) && price > 0) {
            prices.push(price);
            sources.push(item.displayLink || 'product');
            
            // Try to extract condition information
            if (product.condition) {
              conditions.push(product.condition);
            }
          }
        }
      });
    }
    
    // Try to extract condition information from snippet or title
    if (item.snippet) {
      conditionKeywords.forEach(condition => {
        if (item.snippet.toLowerCase().includes(condition)) {
          conditions.push(condition);
        }
      });
    }
    
    if (item.title) {
      conditionKeywords.forEach(condition => {
        if (item.title.toLowerCase().includes(condition)) {
          conditions.push(condition);
        }
      });
    }
  });
  
  // Filter out any invalid prices and sort
  const validPrices = [];
  const validSources = [];
  
  prices.forEach((price, index) => {
    // Filter out extreme values to reduce impact of outliers
    if (!isNaN(price) && price > 0 && price < 100000) { // Add upper limit to filter out anomalies
      validPrices.push(price);
      validSources.push(sources[index]);
    }
  });
  
  validPrices.sort((a, b) => a - b);
  
  if (validPrices.length === 0) {
    return { low: null, average: null, high: null, count: 0 };
  }
  
  // Use trimmed mean to reduce impact of outliers
  const trimmedMean = calculateTrimmedMean(validPrices);
  
  // Use percentiles for more robust analysis
  const percentile10 = getPercentile(validPrices, 10);
  const percentile25 = getPercentile(validPrices, 25);
  const median = getPercentile(validPrices, 50);
  const percentile75 = getPercentile(validPrices, 75);
  const percentile90 = getPercentile(validPrices, 90);
  
  // Calculate standard mean (traditional average)
  const sum = validPrices.reduce((total, price) => total + price, 0);
  const mean = sum / validPrices.length;
  
  // Calculate weighted average based on source reliability
  const reputableDomains = [
    'ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 'ha.com', 
    'heritage.com', 'bonhams.com', 'rubylane.com', 'worthpoint.com',
    'catawiki.com', 'invaluable.com', 'liveauctioneers.com'
  ];
  
  // Apply Tukey's Fences method to identify outliers
  const iqr = percentile75 - percentile25;
  const lowerFence = percentile25 - 1.5 * iqr;
  const upperFence = percentile75 + 1.5 * iqr;
  
  // Filter outliers using Tukey's method
  const filteredPrices = validPrices.filter(price => 
    price >= lowerFence && price <= upperFence
  );
  
  // Calculate a weighted average giving more importance to reputable sources
  let weightedSum = 0;
  let totalWeight = 0;
  
  validPrices.forEach((price, index) => {
    const source = validSources[index];
    let weight = 1; // Default weight
    
    // Give higher weight to reputable sources
    if (source && reputableDomains.some(domain => source.includes(domain))) {
      weight = 2;
    }
    
    // Give extra weight to eBay (likely to have real market prices)
    if (source && source.includes('ebay.com')) {
      weight = 2.5;
    }
    
    // Lower weight for values that appear to be outliers by Tukey's method
    if (price < lowerFence || price > upperFence) {
      weight *= 0.5;
    }
    
    weightedSum += price * weight;
    totalWeight += weight;
  });
  
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : mean;
  
  // Calculate the most robust market value using multiple methods
  let marketValue;
  if (filteredPrices.length >= 5) {
    // If we have enough filtered data points, use the trimmed mean
    marketValue = calculateTrimmedMean(filteredPrices);
  } else if (validPrices.length >= 3) {
    // With 3+ data points, use median for robustness
    marketValue = median;
  } else {
    // For very small samples, use weighted average
    marketValue = weightedAverage;
  }
  
  // Determine the most common condition if available
  let mostCommonCondition = null;
  if (conditions.length > 0) {
    const conditionCounts = {};
    conditions.forEach(cond => {
      conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
    });
    
    let maxCount = 0;
    for (const [cond, count] of Object.entries(conditionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCondition = cond;
      }
    }
  } else if (queryCondition) {
    // Use condition from query if no condition found in results
    mostCommonCondition = queryCondition;
  }
  
  // Format prices to have two decimal places
  const formatValue = (val) => {
    return val !== null ? parseFloat(val.toFixed(2)) : null;
  };
  
  // Return comprehensive price information
  return {
    low: formatValue(percentile10),
    average: formatValue(mean),
    trimmedMean: formatValue(trimmedMean),
    median: formatValue(median),
    high: formatValue(percentile90),
    marketValue: formatValue(marketValue),
    count: validPrices.length,
    filteredCount: filteredPrices.length,
    all: validPrices.map(price => formatValue(price)),
    sources: validSources,
    condition: mostCommonCondition,
    percentiles: {
      p10: formatValue(percentile10),
      p25: formatValue(percentile25),
      p50: formatValue(median),
      p75: formatValue(percentile75),
      p90: formatValue(percentile90)
    },
    tukeysLimits: {
      lower: formatValue(lowerFence),
      upper: formatValue(upperFence)
    }
  };
}

// Calculate trimmed mean (removing top and bottom x%)
function calculateTrimmedMean(values, trimPercent = 10) {
  if (values.length <= 2) return values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(values.length * (trimPercent / 100));
  
  const trimmedValues = sortedValues.slice(trimCount, sortedValues.length - trimCount);
  return trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length;
}

// Get percentile value from an array
function getPercentile(array, percentile) {
  if (array.length === 0) return null;
  if (array.length === 1) return array[0];
  
  const index = Math.ceil((percentile / 100) * array.length) - 1;
  return array[Math.max(0, Math.min(index, array.length - 1))];
}

// Improved price extraction from text with more supported formats
function extractPricesFromText(text) {
  if (!text) return [];
  const prices = [];
  
  // Match patterns like $123, $1,234.56, etc.
  const priceRegex = /\$\s*([0-9,]+(\.[0-9]{1,2})?)/g;
  let match;
  
  while ((match = priceRegex.exec(text)) !== null) {
    const priceStr = match[1].replace(/,/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  }
  
  // Also match X dollars or X USD format
  const dollarRegex = /(\d+(?:,\d+)*(?:\.\d{1,2})?)(?:\s+)(?:dollars|USD)/gi;
  while ((match = dollarRegex.exec(text)) !== null) {
    const priceStr = match[1].replace(/,/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  }
  
  // Match EUR format
  const euroRegex = /€\s*([0-9,]+(\.[0-9]{1,2})?)/g;
  while ((match = euroRegex.exec(text)) !== null) {
    const priceStr = match[1].replace(/,/g, '').replace(/\./g, '.');
    const price = parseFloat(priceStr);
    // Simple EUR to USD conversion (approximate)
    if (!isNaN(price) && price > 0) {
      prices.push(price * 1.1); // Approximate EUR to USD conversion
    }
  }
  
  // Match price ranges (e.g., "$100-$200")
  const rangeRegex = /\$\s*([0-9,]+(\.[0-9]{1,2})?)\s*-\s*\$\s*([0-9,]+(\.[0-9]{1,2})?)/g;
  while ((match = rangeRegex.exec(text)) !== null) {
    const lowPriceStr = match[1].replace(/,/g, '');
    const highPriceStr = match[3].replace(/,/g, '');
    const lowPrice = parseFloat(lowPriceStr);
    const highPrice = parseFloat(highPriceStr);
    
    if (!isNaN(lowPrice) && !isNaN(highPrice) && lowPrice > 0 && highPrice > 0) {
      // Use the average of the range
      const avgPrice = (lowPrice + highPrice) / 2;
      prices.push(avgPrice);
    }
  }
  
  return prices;
}

// Enhanced marketplace information extraction
function extractMarketplaceInfo(data) {
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }
  
  const marketplaceMap = new Map();
  const knownMarketplaces = [
    { domain: "ebay.com", name: "eBay" },
    { domain: "amazon.com", name: "Amazon" },
    { domain: "etsy.com", name: "Etsy" },
    { domain: "rubylane.com", name: "Ruby Lane" },
    { domain: "sothebys.com", name: "Sotheby's" },
    { domain: "christies.com", name: "Christie's" },
    { domain: "catawiki.com", name: "Catawiki" },
    { domain: "bonhams.com", name: "Bonhams" },
    { domain: "ecrater.com", name: "eCrater" },
    { domain: "mercari.com", name: "Mercari" },
    { domain: "poshmark.com", name: "Poshmark" },
    { domain: "1stdibs.com", name: "1stdibs" },
    { domain: "invaluable.com", name: "Invaluable" },
    { domain: "liveauctioneers.com", name: "LiveAuctioneers" },
    { domain: "heritage.com", name: "Heritage Auctions" },
    { domain: "ha.com", name: "Heritage Auctions" },
    { domain: "worthpoint.com", name: "WorthPoint" },
    { domain: "shopgoodwill.com", name: "ShopGoodwill" },
    { domain: "proxibid.com", name: "Proxibid" },
    { domain: "walmart.com", name: "Walmart" },
    { domain: "target.com", name: "Target" },
    { domain: "abebooks.com", name: "AbeBooks" },
    { domain: "justcollecting.com", name: "JustCollecting" },
    { domain: "hemmings.com", name: "Hemmings" },
    { domain: "philipps.com", name: "Phillips" }
  ];
  
  // Process each search result
  data.items.forEach(item => {
    if (!item.link) return;
    
    try {
      const url = new URL(item.link);
      const hostname = url.hostname.replace('www.', '');
      
      // Find matching marketplace
      let marketplaceName = null;
      
      for (const marketplace of knownMarketplaces) {
        if (hostname.includes(marketplace.domain)) {
          marketplaceName = marketplace.name;
          break;
        }
      }
      
      // If no known marketplace found, use the hostname
      if (!marketplaceName) {
        // Extract the main domain (e.g., example.com from sub.example.com)
        const domainParts = hostname.split('.');
        if (domainParts.length >= 2) {
          const mainDomain = `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
          marketplaceName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
        } else {
          marketplaceName = hostname;
        }
      }
      
      // Add to map if not already present
      if (!marketplaceMap.has(marketplaceName)) {
        marketplaceMap.set(marketplaceName, {
          name: marketplaceName,
          url: `https://${hostname}`,
          count: 1
        });
      } else {
        // Increment count if already present
        const marketplace = marketplaceMap.get(marketplaceName);
        marketplace.count += 1;
        marketplaceMap.set(marketplaceName, marketplace);
      }
      
    } catch (error) {
      // Skip invalid URLs
      console.error("Error parsing URL:", error);
    }
  });
  
  // Convert map to array and sort by count
  return Array.from(marketplaceMap.values())
    .sort((a, b) => b.count - a.count);
}
