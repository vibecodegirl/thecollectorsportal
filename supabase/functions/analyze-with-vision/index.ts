
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
            { type: "LABEL_DETECTION", maxResults: 15 },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            { type: "IMAGE_PROPERTIES", maxResults: 5 },
            { type: "TEXT_DETECTION", maxResults: 10 },
            { type: "LOGO_DETECTION", maxResults: 5 },
            { type: "LANDMARK_DETECTION", maxResults: 3 },
            { type: "WEB_DETECTION", maxResults: 5 }
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
  const landmarkAnnotations = results.landmarkAnnotations || [];
  const webDetection = results.webDetection || {};
  
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
    score: obj.score,
    boundingPoly: obj.boundingPoly
  }));
  
  // Extract any text
  const extractedText = textAnnotations.length > 0 ? textAnnotations[0].description : "";
  
  // Split extracted text into potential key details
  const extractedTextLines = extractedText.split('\n');
  const potentialModelNumbers = extractTextByPattern(extractedTextLines, /^[A-Z0-9\-]{3,}$/);
  const potentialSerialNumbers = extractTextByPattern(extractedTextLines, /^S\.?N\.?:?\s*([A-Z0-9\-]{5,})/i);
  const potentialDates = extractTextByPattern(extractedTextLines, /(19|20)\d{2}/);
  
  // Extract logos
  const detectedLogos = logoAnnotations.map((logo: any) => ({
    description: logo.description,
    score: logo.score
  }));
  
  // Extract landmarks
  const detectedLandmarks = landmarkAnnotations.map((landmark: any) => ({
    description: landmark.description,
    score: landmark.score
  }));
  
  // Extract web detection info
  const webEntities = webDetection.webEntities || [];
  const bestGuessLabels = webDetection.bestGuessLabels || [];
  const similarImages = webDetection.visuallySimilarImages || [];
  const pagesWithMatchingImages = webDetection.pagesWithMatchingImages || [];
  
  // Gather web entities for better identification
  const webEntityNames = webEntities
    .filter((entity: any) => entity.score > 0.5)
    .map((entity: any) => entity.description);
  
  // Best guess from web detection
  const bestGuess = bestGuessLabels.length > 0 ? bestGuessLabels[0].label : "";
  
  // Similar products from web
  const similarProducts = pagesWithMatchingImages
    .filter((page: any) => page.pageTitle)
    .map((page: any) => page.pageTitle)
    .slice(0, 5);
  
  // Determine possible category and type based on labels, objects and web data
  let suggestedCategory = "";
  let suggestedType = "";
  
  // If we have a best guess from web detection, use it as primary suggestion
  if (bestGuess) {
    suggestedType = bestGuess;
  } else if (mainLabels.length > 0) {
    // Use the highest confidence label as suggestion
    suggestedType = mainLabels[0].description;
  }
  
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
    "sports": "Sports Memorabilia",
    "game": "Games",
    "video game": "Video Games",
    "console": "Video Games",
    "film": "Film Memorabilia",
    "movie": "Film Memorabilia"
  };
  
  // Check web entities first for better category matching
  for (const entity of webEntityNames) {
    const lowerEntity = entity.toLowerCase();
    
    for (const [keyword, category] of Object.entries(collectibleCategories)) {
      if (lowerEntity.includes(keyword)) {
        suggestedCategory = category;
        break;
      }
    }
    
    if (suggestedCategory) break;
  }
  
  // If no category found from web entities, check labels
  if (!suggestedCategory) {
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
  
  // Identify manufacturer/brand from logos and text
  let manufacturer = "";
  if (detectedLogos.length > 0) {
    manufacturer = detectedLogos[0].description;
  } else {
    // Common manufacturer keywords
    const manufacturerKeywords = ["made by", "manufactured by", "brand", "company"];
    for (const line of extractedTextLines) {
      for (const keyword of manufacturerKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          const parts = line.split(keyword);
          if (parts.length > 1) {
            manufacturer = parts[1].trim().split(" ")[0];
            break;
          }
        }
      }
      if (manufacturer) break;
    }
  }
  
  // Create summary of material, style, and condition where possible
  const materialKeywords = ["metal", "plastic", "wood", "paper", "glass", "ceramic", "fabric", "leather", "stone", "gold", "silver", "bronze", "copper", "steel", "iron", "aluminum", "brass"];
  const styleKeywords = ["antique", "vintage", "modern", "contemporary", "art deco", "victorian", "retro", "classical", "minimalist", "baroque", "gothic", "renaissance", "mid-century", "industrial"];
  const periodKeywords = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "20th century", "19th century", "18th century", "medieval", "ancient", "pre-war", "post-war"];
  
  let detectedMaterial = detectKeyword(mainLabels, materialKeywords);
  let detectedStyle = detectKeyword(mainLabels, styleKeywords);
  let detectedPeriod = detectKeyword(mainLabels, periodKeywords);
  
  // If not found in labels, check web entities
  if (!detectedMaterial) {
    detectedMaterial = detectKeywordInArray(webEntityNames, materialKeywords);
  }
  
  if (!detectedStyle) {
    detectedStyle = detectKeywordInArray(webEntityNames, styleKeywords);
  }
  
  if (!detectedPeriod) {
    detectedPeriod = detectKeywordInArray(webEntityNames, periodKeywords);
  }
  
  // Also check for year in extracted text if no period detected
  if (!detectedPeriod && potentialDates.length > 0) {
    detectedPeriod = potentialDates[0];
  }
  
  // Evaluate condition based on visual cues
  let condition = estimateCondition(labels, detectedStyle);
  
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
  
  // Generate description
  const description = generateItemDescription({
    type: suggestedType,
    material: detectedMaterial,
    style: detectedStyle, 
    period: detectedPeriod,
    manufacturer: manufacturer,
    condition: condition,
    objects: detectedObjects.map(obj => obj.name),
    labels: mainLabels.map(label => label.description),
    webEntities: webEntityNames,
    text: extractedText
  });
  
  // Suggested model number
  const modelNumber = potentialModelNumbers.length > 0 ? potentialModelNumbers[0] : 
                      potentialSerialNumbers.length > 0 ? potentialSerialNumbers[0] : "";
  
  // Year produced
  const yearProduced = detectedPeriod || "";
  
  // Determine rarity based on web entity scores and search results
  const rarity = determineRarity(webEntities, similarImages ? similarImages.length : 0);
  
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
      distinguishingFeatures: extractedText ? extractedText.split('\n').filter((line: string) => line.trim().length > 0).slice(0, 3) : [],
      timePeriod: detectedPeriod || undefined,
      possibleFunctions: detectedObjects.map((obj: any) => obj.name),
      style: detectedStyle || undefined
    },
    identifiers: {
      modelNumber: modelNumber,
      extractedText: extractedTextLines
    },
    manufacturerInfo: {
      suggestedBrand: manufacturer,
      detectedLogos: detectedLogos.map((logo: any) => logo.description)
    },
    webInfo: {
      bestGuess: bestGuess,
      webEntities: webEntityNames,
      similarProducts: similarProducts
    },
    additionalObservations: description,
    suggestedCategory,
    suggestedType,
    yearProduced,
    condition,
    rarity,
    generatedDescription: description
  };
}

function detectKeyword(labels: any[], keywords: string[]) {
  for (const label of labels) {
    const lowerLabel = label.description.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerLabel.includes(keyword)) {
        return keyword;
      }
    }
  }
  return "";
}

function detectKeywordInArray(textArray: string[], keywords: string[]) {
  for (const text of textArray) {
    const lowerText = text.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return keyword;
      }
    }
  }
  return "";
}

function extractTextByPattern(lines: string[], pattern: RegExp) {
  const matches = [];
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  return matches;
}

function estimateCondition(labels: any[], style: string) {
  // Check for explicit condition words in labels
  const conditionKeywords = {
    "new": "Mint/New",
    "mint": "Mint/New",
    "sealed": "Mint/New",
    "excellent": "Excellent",
    "good": "Good",
    "used": "Good",
    "worn": "Fair",
    "damaged": "Poor",
    "broken": "Poor",
    "scratched": "Fair",
    "faded": "Fair",
    "torn": "Poor"
  };
  
  for (const label of labels) {
    const lowerLabel = label.description.toLowerCase();
    for (const [keyword, condition] of Object.entries(conditionKeywords)) {
      if (lowerLabel.includes(keyword)) {
        return condition;
      }
    }
  }
  
  // If it's vintage or antique, default to "Good" unless we detected otherwise
  if (style && (style.includes("vintage") || style.includes("antique"))) {
    return "Good";
  }
  
  // Default condition
  return "Good";
}

function determineRarity(webEntities: any[], similarImageCount: number) {
  // If we have many similar images online, likely not rare
  if (similarImageCount > 20) {
    return "Common";
  }
  
  // Check web entities for rarity indicators
  const rarityIndicators = [
    { keywords: ["rare", "limited edition", "collectible", "exclusive"], value: "Rare" },
    { keywords: ["uncommon", "hard to find", "discontinued"], value: "Uncommon" },
    { keywords: ["common", "mass produced", "popular"], value: "Common" }
  ];
  
  for (const entity of webEntities) {
    const lowerEntity = entity.description ? entity.description.toLowerCase() : "";
    
    for (const indicator of rarityIndicators) {
      for (const keyword of indicator.keywords) {
        if (lowerEntity.includes(keyword)) {
          return indicator.value;
        }
      }
    }
  }
  
  // If few similar images found, might be somewhat rare
  if (similarImageCount < 5) {
    return "Uncommon";
  }
  
  return "Common";
}

function generateItemDescription(data: any) {
  let description = "";
  
  // Start with the type and material
  if (data.type && data.material) {
    description += `This appears to be a ${data.type.toLowerCase()} made of ${data.material}. `;
  } else if (data.type) {
    description += `This appears to be a ${data.type.toLowerCase()}. `;
  }
  
  // Add manufacturer if available
  if (data.manufacturer) {
    description += `Manufactured by ${data.manufacturer}. `;
  }
  
  // Add style and period if available
  if (data.style && data.period) {
    description += `It has a ${data.style} style from the ${data.period} era. `;
  } else if (data.style) {
    description += `It has a ${data.style} style. `;
  } else if (data.period) {
    description += `It appears to be from the ${data.period} era. `;
  }
  
  // Add condition
  if (data.condition) {
    description += `The item appears to be in ${data.condition.toLowerCase()} condition. `;
  }
  
  // Add some of the most relevant web entities or labels for more detail
  let detailTerms = [];
  if (data.webEntities && data.webEntities.length > 0) {
    detailTerms = data.webEntities.slice(0, 3);
  } else if (data.labels && data.labels.length > 0) {
    detailTerms = data.labels.slice(0, 3);
  }
  
  if (detailTerms.length > 0) {
    description += `Visual analysis identifies features consistent with: ${detailTerms.join(", ")}. `;
  }
  
  // Add text if present
  if (data.text && data.text.length > 50) {
    description += `The item contains text which may provide additional details about its origin or authenticity. `;
  }
  
  return description;
}
