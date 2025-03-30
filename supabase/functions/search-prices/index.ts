
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

    // Enhance the query to focus on items for sale
    const enhancedQuery = `${query} for sale price`;
    
    // Call the Google Custom Search JSON API
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.append("key", apiKey);
    searchUrl.searchParams.append("cx", cx || "");  // Custom Search Engine ID
    searchUrl.searchParams.append("q", enhancedQuery);
    
    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
