import { invokeLLM } from "./_core/llm";
import { createVideoAnalysis, updateVideoStatus, getAllProducts } from "./db";
import type { InsertVideoAnalysis } from "../drizzle/schema";

/**
 * Enhanced AI analysis that provides expert recommendations even without vendor products
 * Uses global interior design standards and comprehensive product knowledge
 */
export async function analyzeRoomVideo(videoId: number, userId: number, videoUrl: string, budgetTier?: string) {
  const frameUrl = videoUrl;
  try {
    if (!videoId || isNaN(videoId) || videoId <= 0) {
      console.error("[VideoAnalysis] Invalid videoId:", videoId);
      throw new Error("Invalid video ID");
    }

    await updateVideoStatus(videoId, "processing");

    // Enhanced prompt for professional interior design recommendations
    const budgetContext = budgetTier ? `The user has selected a ${budgetTier} budget tier. Tailor recommendations accordingly with specific price ranges in Kenyan Shillings (KES).` : "));
    
    const analysisPrompt = `You are a world-class interior designer with expertise in African and Kenyan home aesthetics. Analyze this room and provide professional recommendations.

${budgetContext}

Provide a comprehensive interior design analysis including:

1. Room characteristics and potential
2. Specific furniture and decor recommendations with:
   - Exact product types (e.g., "Mid-century modern 3-seater sofa", "Handwoven Kenyan basket wall art")
   - Estimated price ranges in KES
   - Why each piece would work in this space
   - Where to typically find such items in Kenya
3. Color palette recommendations
4. Lighting suggestions
5. Layout and spatial arrangement tips
6. Cultural and local design elements that would enhance the space

Be specific and actionable. Think like you're creating a shopping list for the homeowner.

Format your response as a JSON object with these fields:
- roomType: string (e.g., "living room", "bedroom", "kitchen")
- roomSize: string (e.g., "small", "medium", "large")
- currentStyle: string (e.g., "modern", "traditional", "minimalist")
- lightingCondition: string (e.g., "bright", "moderate", "dim")
- colorScheme: string (detailed color palette description)
- suggestedStyles: array of style names
- recommendations: array of objects with {category, items, reasoning, priceRange, whereToFind}
- analysisText: comprehensive professional analysis (3-4 paragraphs)`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert interior designer specializing in African and Kenyan home design. Provide detailed, culturally-aware, actionable advice with specific product recommendations." },
        { role: "user", content: analysisPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "room_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              roomType: { type: "string" },
              roomSize: { type: "string" },
              currentStyle: { type: "string" },
              lightingCondition: { type: "string" },
              colorScheme: { type: "string" },
              suggestedStyles: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" }
                    },
                    reasoning: { type: "string" },
                    priceRange: { type: "string" },
                    whereToFind: { type: "string" }
                  },
                  required: ["category", "items", "reasoning", "priceRange", "whereToFind"],
                  additionalProperties: false
                }
              },
              analysisText: { type: "string" }
            },
            required: ["roomType", "roomSize", "currentStyle", "lightingCondition", "colorScheme", "suggestedStyles", "recommendations", "analysisText"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const analysisData = JSON.parse(typeof content === "string" ? content : "{}");

    // Try to match with database products if available, otherwise use AI recommendations
    let suggestedProducts;
    try {
      const allProducts = await getAllProducts({ isActive: true });
      if (allProducts && allProducts.length > 0) {
        // We have vendor products - match them
        const filteredProducts = budgetTier 
          ? allProducts.filter(p => !p.budgetTier || p.budgetTier === budgetTier)
          : allProducts;
        suggestedProducts = matchProductsToRecommendations(analysisData.recommendations, filteredProducts);
      } else {
        // No vendor products - use AI-generated recommendations
        suggestedProducts = generateAIProductRecommendations(analysisData.recommendations, budgetTier);
      }
    } catch (error) {
      console.log("[VideoAnalysis] No products in database, using AI recommendations");
      suggestedProducts = generateAIProductRecommendations(analysisData.recommendations, budgetTier);
    }
    
    const productPlacements = generateProductPlacements(suggestedProducts, analysisData.roomType);

    const videoAnalysis: InsertVideoAnalysis = {
      videoId,
      userId,
      roomType: analysisData.roomType,
      userSelectedRoomType: undefined,
      roomSize: analysisData.roomSize,
      currentStyle: analysisData.currentStyle,
      lightingCondition: analysisData.lightingCondition,
      colorScheme: analysisData.colorScheme,
      budgetTier: budgetTier as any,
      suggestedStyles: JSON.stringify(analysisData.suggestedStyles),
      suggestedProducts: JSON.stringify(suggestedProducts),
      productPlacements: JSON.stringify(productPlacements),
      analysisText: analysisData.analysisText,
      transformedImageEconomy: undefined,
      transformedImageMidRange: undefined,
      transformedImagePremium: undefined,
      transformedImageLuxury: undefined
    };
    
    await updateVideoStatus(videoId, "completed", frameUrl);
    await createVideoAnalysis(videoAnalysis);
    await updateVideoStatus(videoId, "completed");

    return {
      success: true,
      analysis: videoAnalysis
    };

  } catch (error) {
    console.error("[VideoAnalysis] Error analyzing video:", error);
    await updateVideoStatus(videoId, "failed");
    throw error;
  }
}

/**
 * Generate AI-based product recommendations when no vendor products exist
 * This provides value to users even before vendors are onboarded
 */
function generateAIProductRecommendations(recommendations: any[], budgetTier?: string) {
  const matched: any[] = [];

  for (const rec of recommendations) {
    // Create virtual products from AI recommendations
    const virtualProducts = rec.items.slice(0, 3).map((item: string, index: number) => ({
      productId: null, // No actual product yet
      name: item,
      category: rec.category,
      priceKES: estimatePriceForItem(item, budgetTier),
      priceRange: rec.priceRange || "Contact vendors for pricing",
      whereToFind: rec.whereToFind || "Available from local Kenyan vendors",
      imageUrl: null, // Will show placeholder
      reasoning: rec.reasoning,
      isVirtual: true // Flag to indicate this is an AI recommendation, not a vendor product
    }));

    matched.push({
      category: rec.category,
      items: rec.items,
      products: virtualProducts,
      reasoning: rec.reasoning,
      priceRange: rec.priceRange,
      whereToFind: rec.whereToFind
    });
  }

  return matched;
}

/**
 * Estimate price based on item type and budget tier
 */
function estimatePriceForItem(itemName: string, budgetTier?: string): number {
  const lowerItem = itemName.toLowerCase();
  
  // Base prices for common items (in KES)
  let basePrice = 10000; // Default
  
  if (lowerItem.includes("sofa") || lowerItem.includes("couch")) basePrice = 35000;
  else if (lowerItem.includes("chair")) basePrice = 8000;
  else if (lowerItem.includes("table")) basePrice = 15000;
  else if (lowerItem.includes("bed")) basePrice = 40000;
  else if (lowerItem.includes("lamp") || lowerItem.includes("light")) basePrice = 3000;
  else if (lowerItem.includes("rug") || lowerItem.includes("carpet")) basePrice = 12000;
  else if (lowerItem.includes("art") || lowerItem.includes("painting")) basePrice = 5000;
  else if (lowerItem.includes("curtain") || lowerItem.includes("drape")) basePrice = 6000;
  else if (lowerItem.includes("shelf") || lowerItem.includes("bookcase")) basePrice = 10000;
  
  // Adjust for budget tier
  const multipliers = {
    "economy": 0.6,
    "mid-range": 1.0,
    "premium": 1.8,
    "luxury": 3.0
  };
  
  const multiplier = budgetTier ? (multipliers[budgetTier as keyof typeof multipliers] || 1.0) : 1.0;
  
  return Math.round(basePrice * multiplier);
}

/**
 * Match AI recommendations with actual vendor products
 */
function matchProductsToRecommendations(recommendations: any[], products: any[]) {
  const matched: any[] = [];

  for (const rec of recommendations) {
    const category = rec.category.toLowerCase();
    
    const matchingProducts = products.filter(p => {
      const productCategory = p.category.toLowerCase();
      const productName = p.name.toLowerCase();
      const productDescription = (p.description || "").toLowerCase();
      
      return productCategory.includes(category) || 
             productName.includes(category) ||
             productDescription.includes(category);
    });

    let productsToUse = matchingProducts;
    if (productsToUse.length === 0) {
      productsToUse = products.slice(0, 3);
    }

    const selectedProducts = productsToUse.slice(0, 3).map(p => ({
      productId: p.id,
      name: p.name,
      category: p.category,
      priceKES: p.priceKES,
      imageUrl: p.imageUrls ? JSON.parse(p.imageUrls)[0] : null,
      reasoning: rec.reasoning,
      isVirtual: false
    }));

    if (selectedProducts.length > 0) {
      matched.push({
        category: rec.category,
        items: rec.items,
        products: selectedProducts,
        reasoning: rec.reasoning
      });
    }
  }

  if (matched.length === 0 && products.length > 0) {
    matched.push({
      category: "Recommended",
      items: ["furniture", "decor"],
      products: products.slice(0, 4).map(p => ({
        productId: p.id,
        name: p.name,
        category: p.category,
        priceKES: p.priceKES,
        imageUrl: p.imageUrls ? JSON.parse(p.imageUrls)[0] : null,
        reasoning: "Curated selection for your space",
        isVirtual: false
      })),
      reasoning: "Curated selection for your space"
    });
  }

  return matched;
}

/**
 * Generate product placement coordinates for interactive hotspots
 */
function generateProductPlacements(suggestedProducts: any[], roomType: string) {
  const placements: any[] = [];
  
  const zones = {
    "living room": [
      { x: 30, y: 60 },
      { x: 70, y: 55 },
      { x: 50, y: 40 },
      { x: 20, y: 30 },
      { x: 80, y: 30 },
      { x: 50, y: 20 },
    ],
    "bedroom": [
      { x: 50, y: 60 },
      { x: 25, y: 50 },
      { x: 75, y: 50 },
      { x: 50, y: 30 },
      { x: 50, y: 20 },
    ],
    "default": [
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 50, y: 35 },
      { x: 50, y: 65 },
    ]
  };
  
  const roomZones = zones[roomType.toLowerCase() as keyof typeof zones] || zones.default;
  let zoneIndex = 0;
  
  for (const category of suggestedProducts) {
    if (category.products && category.products.length > 0) {
      for (const product of category.products.slice(0, 2)) {
        if (zoneIndex < roomZones.length) {
          placements.push({
            productId: product.productId,
            name: product.name,
            category: product.category,
            priceKES: product.priceKES,
            imageUrl: product.imageUrl,
            x: roomZones[zoneIndex].x,
            y: roomZones[zoneIndex].y,
            reasoning: product.reasoning || category.reasoning,
            isVirtual: product.isVirtual || false
          });
          zoneIndex++;
        }
      }
    }
  }
  
  return placements;
}
