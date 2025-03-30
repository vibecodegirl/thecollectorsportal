
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GOOGLE_AI_KEY');

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

    // Process only the first image for now
    const imageData = images[0];
    
    console.log("Sending request to Gemini API");
    
    // Use Gemini 2.5 Pro Experimental API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`;
    
    // Custom prompt for collectible item analysis
    const analyzePrompt = `
      Analyze this image of a collectible item in detail. 
      I need structured information about the item for a collector's database.
      
      Focus on:
      1. Object identification (type, category, name)
      2. Physical attributes (shape, color, material, texture, dimensions if estimable)
      3. Condition assessment (look for wear, damage, patina)
      4. Distinguishing features (maker's marks, signatures, serial numbers) 
      5. Time period and style
      6. Manufacturer or brand information
      7. Rarity assessment
      8. Any text visible in the image that might help identify it

      Return the analysis as a JSON object with these fields:
      - primaryObject: {
          shape: string,
          colors: { dominant: string, accents: string[] },
          texture: string,
          material: string,
          distinguishingFeatures: string[],
          style: string,
          timePeriod: string,
          function: string,
          possibleFunctions: string[]
        }
      - suggestedCategory: string
      - suggestedType: string
      - manufacturer: string
      - yearProduced: string
      - condition: string
      - modelNumber: string
      - rarity: string
      - generatedDescription: string
    `;

    // Skip the prefix if it's a data URL
    let base64Image = imageData;
    if (imageData.startsWith('data:image')) {
      base64Image = imageData.split(',')[1];
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: analyzePrompt },
          { inline_data: { 
              mime_type: "image/jpeg", 
              data: base64Image 
            }
          }
        ]
      }],
      generation_config: {
        temperature: 0.2,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 2048,
      },
    };

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API");
    
    // Process the text response
    try {
      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("Raw text response:", textResponse);
      
      // Extract the JSON part from the text response
      let jsonObject = {};
      
      // Try to find JSON object in the response
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textResponse.match(/{[\s\S]*}/) ||
                         textResponse.match(/\[\s*{[\s\S]*}\s*\]/);
      
      if (jsonMatch) {
        try {
          jsonObject = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
          console.log("Extracted JSON:", jsonObject);
        } catch (e) {
          console.error("Error parsing extracted JSON:", e);
          // Try to clean the JSON string further if parsing failed
          const cleanedJson = jsonMatch[0]
            .replace(/```json|```/g, '')
            .replace(/'/g, '"')
            .trim();
          try {
            jsonObject = JSON.parse(cleanedJson);
          } catch (e2) {
            console.error("Error parsing cleaned JSON:", e2);
          }
        }
      }
      
      if (!jsonObject || Object.keys(jsonObject).length === 0) {
        // Fallback: manually extract values
        console.log("Using fallback extraction method");
        const propertyMap = {
          'shape': /shape:\s*["']([^"']+)["']/i,
          'dominant color': /dominant(?:\s*color)?:\s*["']([^"']+)["']/i,
          'texture': /texture:\s*["']([^"']+)["']/i,
          'material': /material:\s*["']([^"']+)["']/i,
          'style': /style:\s*["']([^"']+)["']/i,
          'time period': /(?:time\s*period|era|period):\s*["']([^"']+)["']/i,
          'function': /function:\s*["']([^"']+)["']/i,
          'category': /category:\s*["']([^"']+)["']/i,
          'type': /(?:type|item\s*type):\s*["']([^"']+)["']/i,
          'manufacturer': /(?:manufacturer|brand|maker):\s*["']([^"']+)["']/i,
          'year': /(?:year\s*produced|production\s*year|date):\s*["']([^"']+)["']/i,
          'condition': /condition:\s*["']([^"']+)["']/i,
          'model number': /(?:model\s*number|serial):\s*["']([^"']+)["']/i,
          'rarity': /rarity:\s*["']([^"']+)["']/i
        };
        
        const extractedValues = {};
        for (const [key, regex] of Object.entries(propertyMap)) {
          const match = textResponse.match(regex);
          if (match) {
            extractedValues[key] = match[1];
          }
        }
        
        // Build structured object from extracted values
        jsonObject = {
          primaryObject: {
            shape: extractedValues['shape'] || "Unknown",
            colors: { 
              dominant: extractedValues['dominant color'] || "Unknown", 
              accents: [] 
            },
            texture: extractedValues['texture'] || "Unknown",
            material: extractedValues['material'] || "Unknown",
            distinguishingFeatures: [],
            style: extractedValues['style'] || "Unknown",
            timePeriod: extractedValues['time period'] || "Unknown",
            function: extractedValues['function'] || "Unknown",
            possibleFunctions: []
          },
          suggestedCategory: extractedValues['category'] || "Unknown",
          suggestedType: extractedValues['type'] || "Unknown",
          manufacturer: extractedValues['manufacturer'] || "Unknown",
          yearProduced: extractedValues['year'] || "Unknown",
          condition: extractedValues['condition'] || "Good",
          modelNumber: extractedValues['model number'] || "",
          rarity: extractedValues['rarity'] || "Common",
          generatedDescription: textResponse
        };
      }
      
      // Ensure all required fields are present with default values
      const processedResults = {
        primaryObject: {
          shape: jsonObject.primaryObject?.shape || "Unknown",
          colors: {
            dominant: jsonObject.primaryObject?.colors?.dominant || "Unknown",
            accents: Array.isArray(jsonObject.primaryObject?.colors?.accents) ? 
                    jsonObject.primaryObject.colors.accents : []
          },
          texture: jsonObject.primaryObject?.texture || "Unknown",
          material: jsonObject.primaryObject?.material || "Unknown",
          distinguishingFeatures: Array.isArray(jsonObject.primaryObject?.distinguishingFeatures) ? 
                                 jsonObject.primaryObject.distinguishingFeatures : [],
          style: jsonObject.primaryObject?.style || "Unknown",
          timePeriod: jsonObject.primaryObject?.timePeriod || "Unknown",
          function: jsonObject.primaryObject?.function || "Unknown",
          possibleFunctions: Array.isArray(jsonObject.primaryObject?.possibleFunctions) ? 
                            jsonObject.primaryObject.possibleFunctions : []
        },
        identifiers: {
          modelNumber: jsonObject.modelNumber || "",
          extractedText: Array.isArray(jsonObject.extractedText) ? 
                         jsonObject.extractedText : 
                         (jsonObject.extractedText ? [jsonObject.extractedText] : [])
        },
        manufacturerInfo: {
          suggestedBrand: jsonObject.manufacturer || "Unknown",
          detectedLogos: Array.isArray(jsonObject.detectedLogos) ? 
                        jsonObject.detectedLogos : []
        },
        additionalObservations: jsonObject.generatedDescription || "",
        suggestedCategory: jsonObject.suggestedCategory || "General Collectibles",
        suggestedType: jsonObject.suggestedType || "Unknown Item",
        yearProduced: jsonObject.yearProduced || "",
        condition: jsonObject.condition || "Good",
        rarity: jsonObject.rarity || "Common",
        generatedDescription: jsonObject.generatedDescription || ""
      };
      
      return new Response(
        JSON.stringify(processedResults),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error("Error processing Gemini response:", parseError);
      throw new Error(`Error processing Gemini response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in analyze-with-vision function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
