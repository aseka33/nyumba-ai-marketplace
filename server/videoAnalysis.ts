import { invokeLLM } from "./_core/llm";
import { createPhotoAnalysis, updatePhotoStatus, getAllProducts } from "./db"; // FIX: Renamed imports
import type { InsertPhotoAnalysis } from "../drizzle/schema"; // FIX: Renamed import

/**
 * Enhanced AI analysis that provides expert recommendations even without vendor products
 * Uses global interior design standards and comprehensive product knowledge
 * Now works with photo URLs directly - no video processing needed!
 */
export async function analyzeRoomPhoto(photoId: number, userId: number, photoUrl: string, budgetTier?: string) {
  try {
    if (!photoId || isNaN(photoId) || photoId <= 0) {
      console.error("[RoomAnalysis] Invalid photoId:", photoId);
      throw new Error("Invalid photo ID");
    }

    await updatePhotoStatus(photoId, "processing"); // FIX: Renamed function

    const budgetContext = budgetTier
      ? `The user has selected a ${budgetTier} budget tier. Tailor recommendations accordingly with specific price ranges in Kenyan Shillings (KES).`
      : "";

    const analysisPrompt = `You are a world-class interior designer with expertise in African and Kenyan home aesthetics. Analyze this room from the provided photo and give professional recommendations.

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
        {
          role: "system",
          content:
            "You are an expert interior designer specializing in African and Kenyan home design. Provide detailed, culturally-aware, actionable advice with specific product recommendations based on the user's photo.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            { type: "image_url", image_url: { url: photoUrl } },
          ],
        },
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
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" },
                    },
                    reasoning: { type: "string" },
                    priceRange: { type: "string" },
                    whereToFind: { type: "string" },
                  },
                  required: [
                    "category",
                    "items",
                    "reasoning",
                    "priceRange",
                    "whereToFind",
                  ],
                  additionalProperties: false,
                },
              },
              analysisText: { type: "string" },
            },
            required: [
              "roomType",
              "roomSize",
              "currentStyle",
              "lightingCondition",
              "colorScheme",
              "suggestedStyles",
              "recommendations",
              "analysisText",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const analysisData = JSON.parse(typeof content === "string" ? content : "{}");

    let suggestedProducts = generateAIProductRecommendations(
      analysisData.recommendations,
      budgetTier
    );

    const productPlacements = generateProductPlacements(
      suggestedProducts,
      analysisData.roomType
    );

    const photoAnalysis: InsertPhotoAnalysis = { // FIX: Renamed type
      photoId, // FIX: Renamed from videoId
      userId,
      roomType: analysisData.roomType,
      roomSize: analysisData.roomSize,
      currentStyle: analysisData.currentStyle,
      lightingCondition: analysisData.lightingCondition,
      colorScheme: analysisData.colorScheme,
      budgetTier: budgetTier as any,
      suggestedStyles: JSON.stringify(analysisData.suggestedStyles),
      suggestedProducts: JSON.stringify(suggestedProducts),
      productPlacements: JSON.stringify(productPlacements),
      analysisText: analysisData.analysisText,
    };

    await createPhotoAnalysis(photoAnalysis); // FIX: Renamed function
    await updatePhotoStatus(photoId, "completed"); // FIX: Renamed function

    return {
      success: true,
      analysis: photoAnalysis,
    };
  } catch (error) {
    console.error("[RoomAnalysis] Error analyzing photo:", error);
    await updatePhotoStatus(photoId, "failed"); // FIX: Renamed function
    throw error;
  }
}

function generateAIProductRecommendations(recommendations: any[], budgetTier?: string) {
  const matched: any[] = [];
  for (const rec of recommendations) {
    const virtualProducts = rec.items.slice(0, 3).map((item: string) => ({
      productId: null,
      name: item,
      category: rec.category,
      priceKES: estimatePriceForItem(item, budgetTier),
      priceRange: rec.priceRange || "Contact vendors for pricing",
      whereToFind: rec.whereToFind || "Available from local Kenyan vendors",
      imageUrl: null,
      reasoning: rec.reasoning,
      isVirtual: true,
    }));
    matched.push({
      category: rec.category,
      items: rec.items,
      products: virtualProducts,
      reasoning: rec.reasoning,
      priceRange: rec.priceRange,
      whereToFind: rec.whereToFind,
    });
  }
  return matched;
}

function estimatePriceForItem(itemName: string, budgetTier?: string): number {
  const lowerItem = itemName.toLowerCase();
  let basePrice = 10000;
  if (lowerItem.includes("sofa") || lowerItem.includes("couch")) basePrice = 35000;
  else if (lowerItem.includes("chair")) basePrice = 8000;
  else if (lowerItem.includes("table")) basePrice = 15000;
  else if (lowerItem.includes("bed")) basePrice = 40000;
  else if (lowerItem.includes("lamp") || lowerItem.includes("light")) basePrice = 3000;
  else if (lowerItem.includes("rug") || lowerItem.includes("carpet")) basePrice = 12000;
  else if (lowerItem.includes("art") || lowerItem.includes("painting")) basePrice = 5000;
  else if (lowerItem.includes("curtain") || lowerItem.includes("drape")) basePrice = 6000;
  else if (lowerItem.includes("shelf") || lowerItem.includes("bookcase")) basePrice = 10000;

  const multipliers = { economy: 0.6, "mid-range": 1.0, premium: 1.8, luxury: 3.0 };
  const multiplier = budgetTier ? (multipliers[budgetTier as keyof typeof multipliers] || 1.0) : 1.0;
  return Math.round(basePrice * multiplier);
}

function generateProductPlacements(suggestedProducts: any[], roomType: string) {
  const placements: any[] = [];
  const zones = {
    "living room": [{ x: 30, y: 60 }, { x: 70, y: 55 }, { x: 50, y: 40 }, { x: 20, y: 30 }, { x: 80, y: 30 }, { x: 50, y: 20 }],
    bedroom: [{ x: 50, y: 60 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 50, y: 30 }, { x: 50, y: 20 }],
    default: [{ x: 30, y: 50 }, { x: 70, y: 50 }, { x: 50, y: 35 }, { x: 50, y: 65 }],
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
            isVirtual: product.isVirtual || false,
          });
          zoneIndex++;
        }
      }
    }
  }
  return placements;
}
