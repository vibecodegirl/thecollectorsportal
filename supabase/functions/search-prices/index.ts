
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
    const apiKey = Deno.env.get("Google_Search");
    const cx = Deno.env.get("GOOGLE_SEARCH_CX");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google Search API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Searching for prices with query: ${query}`);
    
    // Enhance the query to focus on items for sale with prices
    const enhancedQuery = `${query} for sale price value worth`;
    
    // Call the Google Custom Search JSON API
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.append("key", apiKey);
    searchUrl.searchParams.append("cx", cx || "");  // Custom Search Engine ID
    searchUrl.searchParams.append("q", enhancedQuery);
    searchUrl.searchParams.append("num", "10");  // Increase results to 10
    
    console.log(`Making request to Google Search API: ${searchUrl.toString()}`);
    
    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Search API error: ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to search for prices", details: errorText }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const data = await response.json();
    
    // Extract price ranges from search results
    const priceRanges = extractPriceRanges(data);
    
    return new Response(
      JSON.stringify({
        items: data.items || [],
        priceRanges
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in search-prices function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to extract price ranges from search results
function extractPriceRanges(data) {
  const prices = [];
  
  if (!data.items || !Array.isArray(data.items)) {
    return { low: null, average: null, high: null, count: 0 };
  }
  
  // Extract prices from snippets and titles
  data.items.forEach(item => {
    // Try to extract from snippet
    if (item.snippet) {
      const snippetPrices = extractPricesFromText(item.snippet);
      prices.push(...snippetPrices);
    }
    
    // Try to extract from title
    if (item.title) {
      const titlePrices = extractPricesFromText(item.title);
      prices.push(...titlePrices);
    }
    
    // Try to extract from metatags if available
    if (item.pagemap?.metatags) {
      item.pagemap.metatags.forEach(metatag => {
        if (metatag["og:price:amount"]) {
          const price = parseFloat(metatag["og:price:amount"]);
          if (!isNaN(price) && price > 0) {
            prices.push(price);
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
          }
        }
      });
    }
  });
  
  // Filter out any invalid prices and sort
  const validPrices = prices
    .filter(price => !isNaN(price) && price > 0)
    .sort((a, b) => a - b);
  
  if (validPrices.length === 0) {
    return { low: null, average: null, high: null, count: 0 };
  }
  
  // Calculate low, average, high
  const low = validPrices[0];
  const high = validPrices[validPrices.length - 1];
  const sum = validPrices.reduce((total, price) => total + price, 0);
  const average = sum / validPrices.length;
  
  return {
    low,
    average,
    high,
    count: validPrices.length,
    all: validPrices
  };
}

function extractPricesFromText(text) {
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
  
  return prices;
}
