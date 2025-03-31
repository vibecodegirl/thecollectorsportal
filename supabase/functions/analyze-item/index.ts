import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { images, category, description, name } = await req.json();
    
    console.log("Received analysis request:", { category, description, name, imageCount: images?.length || 0 });
    
    const apiKey = Deno.env.get("Google AI");
    
    if (!apiKey) {
      console.error("Google AI API key not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create search query from item details
    let searchQuery = name || "";
    if (category) {
      searchQuery += ` ${category}`;
    }
    if (description) {
      // Extract key terms from description to enhance search
      const keyTerms = extractKeyTerms(description);
      if (keyTerms) {
        searchQuery += ` ${keyTerms}`;
      }
    }
    
    // If we have a valid search query, try to get price data
    let priceEstimate = {
      low: 15,
      average: 30,
      high: 45,
      marketValue: 30
    };
    
    let confidenceScore = {
      score: 70,
      level: 'medium' as 'low' | 'medium' | 'high'
    };
    
    if (searchQuery.trim()) {
      try {
        console.log(`Searching for price data with query: ${searchQuery}`);
        
        // Call our search-prices function
        const searchResponse = await fetch(
          `${req.url.replace('/analyze-item', '/search-prices')}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            },
            body: JSON.stringify({ query: searchQuery })
          }
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log("Price search results:", searchData);
          
          if (searchData.priceRanges && searchData.priceRanges.count > 0) {
            // Use the price ranges from our search
            const { low, average, high } = searchData.priceRanges;
            const marketValue = Math.round(average);
            
            priceEstimate = {
              low: Math.round(low),
              average: Math.round(average),
              high: Math.round(high),
              marketValue
            };
            
            // Adjust confidence based on number of price points found
            if (searchData.priceRanges.count >= 5) {
              confidenceScore.score = 85;
              confidenceScore.level = 'high';
            } else if (searchData.priceRanges.count >= 2) {
              confidenceScore.score = 75;
              confidenceScore.level = 'medium';
            } else {
              confidenceScore.score = 60;
              confidenceScore.level = 'low';
            }
          }
        } else {
          console.error("Failed to get price data:", await searchResponse.text());
        }
      } catch (error) {
        console.error("Error searching for prices:", error);
      }
    }
    
    // Build analysis results based on provided information
    const analysisResult = {
      category: category || "Unknown",
      name: name || "Analyzed Item",
      type: determineItemType(description, category),
      condition: determineCondition(description),
      notes: description || "",
      priceEstimate,
      confidenceScore: {
        score: confidenceScore.score,
        level: confidenceScore.level,
        factors: [
          { factor: "Initial assessment", impact: 20 }
        ]
      },
      manufacturer: extractManufacturer(description, name),
      yearProduced: extractYearProduced(description),
      edition: description?.includes("limited") ? "Limited Edition" : 
               description?.includes("special") ? "Special Edition" : "Standard",
      modelNumber: extractModelNumber(description),
      uniqueIdentifiers: extractUniqueIdentifiers(description),
      flaws: extractFlaws(description),
      completeness: description?.includes("missing") ? "Incomplete" : "Complete",
      dimensions: extractDimensions(description),
      weight: extractWeight(description),
      rarity: determineRarity(description),
      primaryObject: {
        shape: extractShape(description),
        colors: {
          dominant: extractDominantColor(description),
          accents: extractAccentColors(description)
        },
        texture: extractTexture(description),
        material: extractMaterial(description),
        distinguishingFeatures: extractDistinguishingFeatures(description),
        style: extractStyle(description),
        timePeriod: extractTimePeriod(description),
        function: extractFunction(description)
      }
    };
    
    // Add factors based on available data
    if (description) {
      analysisResult.confidenceScore.factors.push({ factor: "Description provided", impact: 15 });
    }

    if (category) {
      analysisResult.confidenceScore.factors.push({ factor: "Category identified", impact: 10 });
    }

    if (images && images.length > 0) {
      analysisResult.confidenceScore.factors.push({ factor: "Image analysis", impact: 15 });
    }

    if (analysisResult.manufacturer !== "Unknown") {
      analysisResult.confidenceScore.factors.push({ factor: "Manufacturer identified", impact: 10 });
    }

    // Add pricing confidence factor if we found price data
    if (priceEstimate.average > 0) {
      const priceConfidenceImpact = confidenceScore.score >= 70 ? 15 : 10;
      analysisResult.confidenceScore.factors.push({ 
        factor: "Price data found", 
        impact: priceConfidenceImpact 
      });
    }

    console.log("Returning analysis:", analysisResult);
    
    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-item function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper functions to extract information from the description
function extractKeyTerms(description) {
  if (!description) return "";
  
  // Extract apparent key words related to collectibles
  const keyTermsRegex = /(vintage|antique|rare|collectible|limited edition|first edition|signed|authentic|original)/gi;
  const matches = description.match(keyTermsRegex);
  
  return matches ? matches.join(" ") : "";
}

function determineItemType(description, category) {
  if (!description) return "Unknown Item";
  
  if (description.includes("vintage") || description.includes("antique")) {
    return "Vintage Item";
  } else if (description.includes("modern") || description.includes("contemporary")) {
    return "Modern Item";
  } else if (category) {
    return `${category} Item`;
  }
  
  return "General Collectible";
}

function determineCondition(description) {
  if (!description) return "Good";
  
  const text = description.toLowerCase();
  
  if (text.includes("mint") || text.includes("perfect") || text.includes("excellent")) {
    return "Excellent";
  } else if (text.includes("good") || text.includes("fine")) {
    return "Good";
  } else if (text.includes("fair") || text.includes("average")) {
    return "Fair";
  } else if (text.includes("poor") || text.includes("damaged")) {
    return "Poor";
  }
  
  return "Good";
}

function extractManufacturer(description, name) {
  if (!description && !name) return "Unknown";
  
  const combinedText = `${description || ""} ${name || ""}`.toLowerCase();
  
  const commonManufacturers = [
    "hasbro", "mattel", "sony", "nintendo", "disney", "lego", 
    "hot wheels", "bandai", "kenner", "fisher-price", "tonka",
    "hallmark", "funko", "ty", "franklin mint"
  ];
  
  for (const manufacturer of commonManufacturers) {
    if (combinedText.includes(manufacturer.toLowerCase())) {
      return manufacturer.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }
  }
  
  return "Unknown";
}

function extractYearProduced(description) {
  if (!description) return "Unknown";
  
  // Try to find years in format like 1980s, 1990, etc.
  const yearRegex = /\b(19\d{2}|20\d{2})s?\b/;
  const match = description.match(yearRegex);
  
  if (match) {
    return match[0];
  }
  
  // Try to find decade references
  if (description.includes("80s") || description.includes("eighties")) {
    return "1980s";
  } else if (description.includes("90s") || description.includes("nineties")) {
    return "1990s";
  } else if (description.includes("70s") || description.includes("seventies")) {
    return "1970s";
  } else if (description.includes("60s") || description.includes("sixties")) {
    return "1960s";
  } else if (description.includes("50s") || description.includes("fifties")) {
    return "1950s";
  }
  
  return "Unknown";
}

function extractModelNumber(description) {
  if (!description) return "Unknown";
  
  // Look for model numbers in various formats
  const modelRegex = /\b(model|no\.|number|#):?\s*([A-Z0-9-]+)\b/i;
  const match = description.match(modelRegex);
  
  if (match) {
    return match[2];
  }
  
  return "Unknown";
}

function extractUniqueIdentifiers(description) {
  if (!description) return "";
  
  const identifiers = [];
  
  if (description.toLowerCase().includes("serial")) {
    identifiers.push("Serial number present");
  }
  
  if (description.toLowerCase().includes("signature") || description.toLowerCase().includes("signed")) {
    identifiers.push("Contains signature");
  }
  
  if (description.toLowerCase().includes("certificate") || description.toLowerCase().includes("coa")) {
    identifiers.push("Certificate of authenticity");
  }
  
  return identifiers.join(", ");
}

function extractFlaws(description) {
  if (!description) return "";
  
  const flawsRegex = /(damaged|scratched|chipped|worn|faded|stained|torn|broken|missing|cracked)/i;
  const match = description.match(flawsRegex);
  
  if (match) {
    return `Has ${match[0].toLowerCase()} areas`;
  }
  
  return "";
}

function extractDimensions(description) {
  if (!description) return "";
  
  // Look for dimension patterns like 10x5 cm, 10 inches x 5 inches, etc.
  const dimensionRegex = /\b(\d+(?:\.\d+)?)\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(?:x\s*(\d+(?:\.\d+)?))?\s*(cm|in|inch|inches|mm|m)?\b/i;
  const match = description.match(dimensionRegex);
  
  if (match) {
    const unit = match[4] || "";
    if (match[3]) {
      return `${match[1]} × ${match[2]} × ${match[3]} ${unit}`.trim();
    } else {
      return `${match[1]} × ${match[2]} ${unit}`.trim();
    }
  }
  
  return "";
}

function extractWeight(description) {
  if (!description) return "";
  
  // Look for weight patterns like 5 lbs, 10 kg, etc.
  const weightRegex = /\b(\d+(?:\.\d+)?)\s*(lbs|lb|pounds|kg|g|grams|oz|ounces)\b/i;
  const match = description.match(weightRegex);
  
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  
  return "";
}

function determineRarity(description) {
  if (!description) return "Common";
  
  const text = description.toLowerCase();
  
  if (text.includes("extremely rare") || text.includes("very rare") || text.includes("one of a kind")) {
    return "Extremely Rare";
  } else if (text.includes("rare") || text.includes("limited")) {
    return "Rare";
  } else if (text.includes("uncommon")) {
    return "Uncommon";
  }
  
  return "Common";
}

function extractShape(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  const shapes = [
    "round", "circular", "square", "rectangular", "triangular", "oval", 
    "spherical", "cylindrical", "cube", "flat", "irregular"
  ];
  
  for (const shape of shapes) {
    if (text.includes(shape)) {
      return shape.charAt(0).toUpperCase() + shape.slice(1);
    }
  }
  
  return "Unknown";
}

function extractDominantColor(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  const colors = [
    "red", "blue", "green", "yellow", "orange", "purple", "black", 
    "white", "brown", "gray", "gold", "silver", "pink", "teal"
  ];
  
  for (const color of colors) {
    if (text.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  
  return "Unknown";
}

function extractAccentColors(description) {
  if (!description) return [];
  
  const text = description.toLowerCase();
  const colors = [
    "red", "blue", "green", "yellow", "orange", "purple", "black", 
    "white", "brown", "gray", "gold", "silver", "pink", "teal"
  ];
  
  const accentColors = [];
  
  for (const color of colors) {
    if (text.includes(color)) {
      accentColors.push(color.charAt(0).toUpperCase() + color.slice(1));
    }
  }
  
  // Remove duplicates and return only accent colors (not the first/dominant one)
  return accentColors.filter((value, index, self) => self.indexOf(value) === index).slice(1);
}

function extractTexture(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  const textures = [
    "smooth", "rough", "textured", "bumpy", "glossy", "matte", "shiny", 
    "fuzzy", "soft", "hard", "polished"
  ];
  
  for (const texture of textures) {
    if (text.includes(texture)) {
      return texture.charAt(0).toUpperCase() + texture.slice(1);
    }
  }
  
  return "Unknown";
}

function extractMaterial(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  const materials = [
    "wood", "metal", "plastic", "glass", "ceramic", "porcelain", "paper", 
    "fabric", "cloth", "leather", "vinyl", "rubber", "stone", "gold", "silver"
  ];
  
  for (const material of materials) {
    if (text.includes(material)) {
      return material.charAt(0).toUpperCase() + material.slice(1);
    }
  }
  
  return "Unknown";
}

function extractDistinguishingFeatures(description) {
  if (!description) return [];
  
  const features = [];
  
  if (description.includes("signature") || description.includes("signed")) {
    features.push("Signed/Autographed");
  }
  
  if (description.includes("limited edition") || description.includes("numbered")) {
    features.push("Limited edition/Numbered");
  }
  
  if (description.includes("original box") || description.includes("original packaging")) {
    features.push("Original packaging");
  }
  
  if (description.includes("certificate") || description.includes("COA")) {
    features.push("Certificate of authenticity");
  }
  
  return features;
}

function extractStyle(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  const styles = [
    "modern", "vintage", "antique", "retro", "contemporary", "art deco", 
    "victorian", "art nouveau", "minimalist", "classic", "traditional"
  ];
  
  for (const style of styles) {
    if (text.includes(style)) {
      return style.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }
  }
  
  return "Unknown";
}

function extractTimePeriod(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  
  if (text.includes("1800s") || text.includes("19th century") || text.includes("victorian")) {
    return "19th Century";
  } else if (text.includes("1900s") || text.includes("20th century")) {
    return "20th Century";
  } else if (text.includes("2000s") || text.includes("21st century")) {
    return "21st Century";
  } else if (text.includes("1950s") || text.includes("fifties")) {
    return "1950s";
  } else if (text.includes("1960s") || text.includes("sixties")) {
    return "1960s";
  } else if (text.includes("1970s") || text.includes("seventies")) {
    return "1970s";
  } else if (text.includes("1980s") || text.includes("eighties")) {
    return "1980s";
  } else if (text.includes("1990s") || text.includes("nineties")) {
    return "1990s";
  }
  
  return "Unknown";
}

function extractFunction(description) {
  if (!description) return "Unknown";
  
  const text = description.toLowerCase();
  
  if (text.includes("decorative") || text.includes("display")) {
    return "Decorative";
  } else if (text.includes("toy") || text.includes("playable")) {
    return "Toy/Game";
  } else if (text.includes("functional") || text.includes("usable")) {
    return "Functional";
  } else if (text.includes("collectible") || text.includes("display only")) {
    return "Collectible Only";
  }
  
  return "Unknown";
}
