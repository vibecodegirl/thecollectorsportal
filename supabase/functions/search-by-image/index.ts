
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
const googleSearchCx = Deno.env.get('GOOGLE_SEARCH_CX');
const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY') || Deno.env.get('GOOGLE_AI_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchByImageRequest {
  image: string;  // Base64 encoded image
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API keys are configured
    if (!googleSearchApiKey || !googleSearchCx || !visionApiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing API keys. Please set GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX, and GOOGLE_VISION_API_KEY or GOOGLE_AI_KEY in your Supabase secrets."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Parse request body
    const { image } = await req.json() as SearchByImageRequest;
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // First, use Google Vision API to analyze the image and get labels
    console.log("Analyzing image with Google Vision API...");
    
    // Prepare the Vision API request
    const visionRequest = {
      requests: [
        {
          image: {
            content: image
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 10
            },
            {
              type: "OBJECT_LOCALIZATION",
              maxResults: 5
            },
            {
              type: "WEB_DETECTION",
              maxResults: 5
            },
            {
              type: "LOGO_DETECTION",
              maxResults: 3
            }
          ]
        }
      ]
    };

    // Make the Vision API request
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visionRequest)
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("Vision API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Error analyzing image", details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const visionData = await visionResponse.json();
    console.log("Vision API response received");

    // Extract labels and web entities for search
    const labels = visionData.responses[0]?.labelAnnotations || [];
    const webEntities = visionData.responses[0]?.webDetection?.webEntities || [];
    const objects = visionData.responses[0]?.localizedObjectAnnotations || [];
    const logos = visionData.responses[0]?.logoAnnotations || [];
    
    // Extract best matches from the vision results
    const topLabels = labels.slice(0, 5).map(label => label.description);
    const topObjects = objects.map(obj => obj.name);
    const topEntityNames = webEntities
      .filter(entity => entity.score > 0.5)
      .map(entity => entity.description);
    const topLogos = logos.map(logo => logo.description);

    // Combine all detected elements
    let detectedElements = [
      ...topObjects,
      ...topLabels,
      ...topEntityNames,
      ...topLogos
    ].filter(Boolean);
    
    // Remove duplicates and create search query
    const uniqueElements = [...new Set(detectedElements)];
    
    // If we have no results, return an error
    if (uniqueElements.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Could not identify any objects in the image",
          matches: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Generate a concise search query from the detected elements
    // Take the first 3 unique elements to avoid too long queries
    const searchQuery = uniqueElements.slice(0, 3).join(" ");
    console.log("Generated search query:", searchQuery);
    
    // Use Google Custom Search API to search for similar items
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchCx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5`;
    
    console.log("Making request to Google Search API:", searchUrl);
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Google Search API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Error searching for similar items", 
          details: errorText,
          detectedObjects: uniqueElements
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const searchData = await searchResponse.json();
    console.log("Search API response received");
    
    // Format results
    const matches = searchData.items?.map(item => ({
      title: item.title,
      link: item.link,
      description: item.snippet,
      imageUrl: item.image?.thumbnailLink
    })) || [];
    
    // Determine the most likely item type and category based on labels and detected objects
    let title = "";
    let category = "";
    let type = "";
    
    // If we have objects detected, use the most confident one as title
    if (objects.length > 0) {
      // Sort by confidence score in descending order
      const sortedObjects = [...objects].sort((a, b) => b.score - a.score);
      title = sortedObjects[0].name;
    } else if (labels.length > 0) {
      // Fall back to labels
      title = labels[0].description;
    }
    
    // Try to determine category based on common collectible categories
    const categoryKeywords = {
      "Trading Cards": ["card", "trading card", "baseball card", "pokemon", "magic the gathering", "sports card"],
      "Coins": ["coin", "currency", "penny", "dime", "quarter", "numismatic"],
      "Stamps": ["stamp", "postage"],
      "Comics": ["comic", "graphic novel", "manga"],
      "Toys": ["toy", "action figure", "doll", "figurine"],
      "Antiques": ["antique", "vintage", "ancient", "old"],
      "Vinyl Records": ["vinyl", "record", "lp", "album"],
      "Sports Memorabilia": ["jersey", "ball", "bat", "sports", "memorabilia", "autograph"],
      "Video Games": ["game", "cartridge", "console", "nintendo", "playstation", "xbox", "sega"],
      "Books": ["book", "novel", "first edition"]
    };
    
    // Check if our detected elements match any category keywords
    const lowerCaseElements = uniqueElements.map(el => el.toLowerCase());
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => 
        lowerCaseElements.some(el => el.includes(keyword.toLowerCase()))
      )) {
        category = categoryName;
        break;
      }
    }
    
    // Determine item type based on most confident object or label
    type = title;
    
    // Generate a simple description from detected elements
    const description = `This appears to be a ${type}${category ? ` in the ${category} category` : ''}. Other detected features: ${uniqueElements.slice(1, 5).join(", ")}.`;
    
    return new Response(
      JSON.stringify({
        title,
        category,
        type,
        description,
        detectedObjects: uniqueElements,
        matches
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in search-by-image function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
