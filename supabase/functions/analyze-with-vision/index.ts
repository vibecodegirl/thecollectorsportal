
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  images: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json() as AnalyzeRequest;
    
    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process only the first image for demo purposes
    // In production, you might want to process all images and combine results
    const imageData = images[0];
    
    // Skip the prefix if it's a data URL
    let base64Image = imageData;
    if (imageData.startsWith('data:image')) {
      base64Image = imageData.split(',')[1];
    }

    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "OBJECT_LOCALIZATION", maxResults: 5 },
            { type: "IMAGE_PROPERTIES", maxResults: 5 },
            { type: "TEXT_DETECTION", maxResults: 5 },
            { type: "LOGO_DETECTION", maxResults: 3 }
          ]
        }
      ]
    };

    console.log("Sending request to Google Vision API");
    
    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Vision API error:", errorText);
      throw new Error(`Google Vision API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Received response from Google Vision API");
    
    // Process the response to extract useful information
    const processedResults = processVisionResults(data);
    
    return new Response(
      JSON.stringify(processedResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-with-vision function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processVisionResults(data: any) {
  const results = data.responses[0];
  const labels = results.labelAnnotations || [];
  const objects = results.localizedObjectAnnotations || [];
  const imageProperties = results.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const textAnnotations = results.textAnnotations || [];
  const logoAnnotations = results.logoAnnotations || [];
  
  // Extract dominant colors
  const dominantColors = imageProperties
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((color: any) => {
      const rgb = color.color;
      return {
        color: `rgb(${rgb.red || 0}, ${rgb.green || 0}, ${rgb.blue || 0})`,
        score: color.score,
        pixelFraction: color.pixelFraction
      };
    });
  
  // Extract main category and description
  const mainLabels = labels.map((label: any) => ({
    description: label.description,
    score: label.score
  }));
  
  // Extract detected objects
  const detectedObjects = objects.map((obj: any) => ({
    name: obj.name,
    score: obj.score
  }));
  
  // Extract any text
  const extractedText = textAnnotations.length > 0 ? textAnnotations[0].description : "";
  
  // Extract logos
  const detectedLogos = logoAnnotations.map((logo: any) => ({
    description: logo.description,
    score: logo.score
  }));
  
  // Determine possible category and type based on labels and objects
  let suggestedCategory = "";
  let suggestedType = "";
  
  if (mainLabels.length > 0) {
    // Use the highest confidence label as suggestion
    suggestedType = mainLabels[0].description;
    
    // Map common collector categories
    const collectibleCategories = {
      "coin": "Coins & Currency",
      "currency": "Coins & Currency",
      "stamp": "Stamps",
      "card": "Trading Cards",
      "action figure": "Action Figures",
      "toy": "Toys & Collectibles",
      "comic": "Comics",
      "book": "Books",
      "vinyl": "Vinyl Records",
      "record": "Vinyl Records",
      "poster": "Posters & Prints",
      "print": "Posters & Prints",
      "artwork": "Art",
      "painting": "Art",
      "sculpture": "Art",
      "jewelry": "Jewelry",
      "watch": "Watches",
      "antique": "Antiques",
      "vintage": "Vintage",
      "memorabilia": "Memorabilia",
      "sports": "Sports Memorabilia"
    };
    
    // Check if any of the labels match a collectible category
    for (const label of mainLabels) {
      const lowerLabel = label.description.toLowerCase();
      
      for (const [keyword, category] of Object.entries(collectibleCategories)) {
        if (lowerLabel.includes(keyword)) {
          suggestedCategory = category;
          break;
        }
      }
      
      if (suggestedCategory) break;
    }
  }
  
  // Create summary of material, style, and condition where possible
  const materialKeywords = ["metal", "plastic", "wood", "paper", "glass", "ceramic", "fabric", "leather", "stone", "gold", "silver"];
  const styleKeywords = ["antique", "vintage", "modern", "contemporary", "art deco", "victorian", "retro", "classical"];
  
  let detectedMaterial = "";
  let detectedStyle = "";
  
  for (const label of mainLabels) {
    const lowerLabel = label.description.toLowerCase();
    
    for (const material of materialKeywords) {
      if (lowerLabel.includes(material)) {
        detectedMaterial = material;
        break;
      }
    }
    
    for (const style of styleKeywords) {
      if (lowerLabel.includes(style)) {
        detectedStyle = style;
        break;
      }
    }
  }
  
  // Evaluate shape
  let shape = "Indeterminate";
  const shapeObjects = objects.filter((obj: any) => 
    ["Rectangle", "Square", "Circle", "Oval", "Triangle"].includes(obj.name)
  );
  if (shapeObjects.length > 0) {
    shape = shapeObjects[0].name;
  } else if (objects.length > 0) {
    // Guess based on first object
    shape = `Shape of ${objects[0].name}`;
  }
  
  return {
    primaryObject: {
      shape: shape,
      colors: {
        dominant: dominantColors.length > 0 ? 
          `${mainLabels.find((l: any) => l.description.toLowerCase().includes("color"))?.description || "Unknown"} (${dominantColors[0].color})` : 
          "Unknown",
        accents: dominantColors.slice(1).map((c: any) => c.color)
      },
      texture: detectedMaterial ? `${detectedMaterial} texture` : "Unknown texture",
      material: detectedMaterial || "Unknown material",
      distinguishingFeatures: extractedText ? [`Contains text: "${extractedText.substring(0, 50)}${extractedText.length > 50 ? '...' : ''}"`] : [],
      timePeriod: detectedStyle ? detectedStyle : undefined,
      possibleFunctions: detectedObjects.map((obj: any) => obj.name),
      style: detectedStyle || undefined
    },
    additionalObservations: `Image analysis identified ${mainLabels.length} labels and ${detectedObjects.length} objects. ` +
      (detectedLogos.length > 0 ? `Detected logos: ${detectedLogos.map((l: any) => l.description).join(", ")}. ` : "") +
      (extractedText ? `Text detected in image: "${extractedText.substring(0, 100)}${extractedText.length > 100 ? '...' : ''}"` : "No text detected in image."),
    suggestedCategory,
    suggestedType
  };
}
