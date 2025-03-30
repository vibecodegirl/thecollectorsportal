
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
    
    // Extract price ranges from search results
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
  // Add eBay and other marketplace terms for better price results
  if (!query.toLowerCase().includes("ebay") && 
      !query.toLowerCase().includes("sold") &&
      !query.toLowerCase().includes("listing")) {
    query += " ebay sold listing";
  }
  
  // Add price-related terms if not present
  if (!query.toLowerCase().includes("price") && 
      !query.toLowerCase().includes("value") && 
      !query.toLowerCase().includes("worth")) {
    query += " price value worth";
  }
  
  // Add collectible context if needed
  if (!query.toLowerCase().includes("collectible") && 
      !query.toLowerCase().includes("collection")) {
    query += " collectible";
  }
  
  return query;
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
    if (!isNaN(price) && price > 0 && price < 100000) { // Add upper limit to filter out anomalies
      validPrices.push(price);
      validSources.push(sources[index]);
    }
  });
  
  validPrices.sort((a, b) => a - b);
  
  if (validPrices.length === 0) {
    return { low: null, average: null, high: null, count: 0 };
  }
  
  // Use percentiles for more robust analysis
  // For low, average, high, use 10th, 50th, and 90th percentiles
  const low = getPercentile(validPrices, 10);
  const median = getPercentile(validPrices, 50);
  const high = getPercentile(validPrices, 90);
  
  // Calculate mean (traditional average)
  const sum = validPrices.reduce((total, price) => total + price, 0);
  const mean = sum / validPrices.length;
  
  // Calculate weighted average based on source reliability
  const reputableDomains = [
    'ebay.com', 'amazon.com', 'sothebys.com', 'christies.com', 'ha.com', 
    'heritage.com', 'bonhams.com', 'rubylane.com', 'worthpoint.com',
    'catawiki.com', 'invaluable.com', 'liveauctioneers.com'
  ];
  
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
    
    weightedSum += price * weight;
    totalWeight += weight;
  });
  
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : mean;
  
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
  
  // Use the weighted average for market value, and ensure all values have consistent decimal places
  return {
    low: formatValue(low),
    average: formatValue(mean),
    median: formatValue(median),
    high: formatValue(high),
    marketValue: formatValue(weightedAverage),
    count: validPrices.length,
    all: validPrices.map(price => formatValue(price)),
    sources: validSources,
    condition: mostCommonCondition
  };
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
    { domain: "target.com", name: "Target" }
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
