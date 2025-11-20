import { invokeLLM } from "./_core/llm";
import { createVideoAnalysis, updateVideoStatus, getProductById, getAllProducts } from "./db";
import type { InsertVideoAnalysis } from "../drizzle/schema";

/**
 * Analyzes a room video and generates furniture/decor suggestions
 * This is a simplified version that uses text prompts
 * In production, you would extract frames and analyze them
 */
export async function analyzeRoomVideo(videoId: number, userId: number, videoUrl: string, budgetTier?: string) {
  // Generate a placeholder room image
  // In production, extract actual frame using FFmpeg
  const frameUrl = videoUrl; // Will be replaced with actual frame extraction
  try {
    // Validate videoId
    if (!videoId || isNaN(videoId) || videoId <= 0) {
      console.error('[VideoAnalysis] Invalid videoId:', videoId);
      throw new Error('Invalid video ID');
    }

    // Update video status to processing
    await updateVideoStatus(videoId, "processing");

    // Generate AI analysis using LLM with budget tier context
    const budgetContext = budgetTier ? `The user has selected a ${budgetTier} budget tier. Tailor recommendations accordingly.` : '';
    
    const analysisPrompt = `You are an expert interior designer analyzing a room. Based on a video of this room, provide a comprehensive analysis.

${budgetContext}

Since we cannot directly process video, please provide a general analysis framework that would apply to most rooms. Include:

1. Common room types and their typical characteristics
2. Suggested furniture categories for different room types
3. Decor recommendations based on modern interior design trends
4. Color scheme suggestions
5. Lighting recommendations

Format your response as a JSON object with these fields:
- roomType: string (e.g., "living room", "bedroom", "kitchen")
- roomSize: string (e.g., "small", "medium", "large")
- currentStyle: string (e.g., "modern", "traditional", "minimalist")
- lightingCondition: string (e.g., "bright", "moderate", "dim")
- colorScheme: string (description of recommended colors)
- suggestedStyles: array of style names
- recommendations: array of objects with {category, items, reasoning}
- analysisText: comprehensive analysis text`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert interior designer. Provide detailed, actionable advice." },
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
                    reasoning: { type: "string" }
                  },
                  required: ["category", "items", "reasoning"],
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
    const analysisData = JSON.parse(typeof content === 'string' ? content : "{}");

    // Match recommendations with actual products from the marketplace
    // Filter by budget tier if provided
    let allProducts = await getAllProducts({ isActive: true });
    if (budgetTier) {
      allProducts = allProducts.filter(p => !p.budgetTier || p.budgetTier === budgetTier);
    }
    
    const suggestedProducts = matchProductsToRecommendations(analysisData.recommendations, allProducts);
    
    // Generate product placements with coordinates for interactive view
    const productPlacements = generateProductPlacements(suggestedProducts, analysisData.roomType);

    // Save analysis to database
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
    
    // Update video with frame URL
    await updateVideoStatus(videoId, "completed", frameUrl);

    await createVideoAnalysis(videoAnalysis);

    // Update video status to completed
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
 * Generates product placement coordinates for interactive hotspots
 */
function generateProductPlacements(suggestedProducts: any[], roomType: string) {
  const placements: any[] = [];
  
  // Define placement zones based on room type
  const zones = {
    'living room': [
      { x: 30, y: 60 }, // Left seating area
      { x: 70, y: 55 }, // Right seating area  
      { x: 50, y: 40 }, // Center coffee table area
      { x: 20, y: 30 }, // Wall decor left
      { x: 80, y: 30 }, // Wall decor right
      { x: 50, y: 20 }, // Ceiling light
    ],
    'bedroom': [
      { x: 50, y: 60 }, // Bed area
      { x: 25, y: 50 }, // Left nightstand
      { x: 75, y: 50 }, // Right nightstand
      { x: 50, y: 30 }, // Wall art
      { x: 50, y: 20 }, // Ceiling light
    ],
    'default': [
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 50, y: 35 },
      { x: 50, y: 65 },
    ]
  };
  
  const roomZones = zones[roomType.toLowerCase() as keyof typeof zones] || zones.default;
  let zoneIndex = 0;
  
  // Assign products to zones
  for (const category of suggestedProducts) {
    if (category.products && category.products.length > 0) {
      for (const product of category.products.slice(0, 2)) { // Max 2 products per category
        if (zoneIndex < roomZones.length) {
          placements.push({
            productId: product.productId,
            name: product.name,
            category: product.category,
            priceKES: product.priceKES,
            imageUrl: product.imageUrl,
            x: roomZones[zoneIndex].x,
            y: roomZones[zoneIndex].y,
            reasoning: product.reasoning || category.reasoning
          });
          zoneIndex++;
        }
      }
    }
  }
  
  return placements;
}

/**
 * Matches AI recommendations with actual products in the marketplace
 */
function matchProductsToRecommendations(recommendations: any[], products: any[]) {
  const matched: any[] = [];

  for (const rec of recommendations) {
    const category = rec.category.toLowerCase();
    
    // Find products matching the category
    const matchingProducts = products.filter(p => {
      const productCategory = p.category.toLowerCase();
      const productName = p.name.toLowerCase();
      const productDescription = (p.description || "").toLowerCase();
      
      return productCategory.includes(category) || 
             productName.includes(category) ||
             productDescription.includes(category);
    });

    // If no exact matches, get any products as fallback
    let productsToUse = matchingProducts;
    if (productsToUse.length === 0) {
      productsToUse = products.slice(0, 3);
    }

    // Take up to 3 products per category
    const selectedProducts = productsToUse.slice(0, 3).map(p => ({
      productId: p.id,
      name: p.name,
      category: p.category,
      priceKES: p.priceKES,
      imageUrl: p.imageUrls ? JSON.parse(p.imageUrls)[0] : null,
      reasoning: rec.reasoning
    }));

    // Always add products, even if not perfect match
    if (selectedProducts.length > 0) {
      matched.push({
        category: rec.category,
        items: rec.items,
        products: selectedProducts,
        reasoning: rec.reasoning
      });
    }
  }

  // If no matches found at all, return some default products
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
        reasoning: "Curated selection for your space"
      })),
      reasoning: "Curated selection for your space"
    });
  }

  return matched;
}

/**
 * Enhanced analysis with actual video frame analysis
 * This would be used in production with actual video processing
 */
export async function analyzeRoomVideoAdvanced(
  videoId: number, 
  userId: number, 
  videoUrl: string,
  frameUrls: string[] // URLs of extracted video frames
) {
  try {
    await updateVideoStatus(videoId, "processing");

    // Analyze multiple frames from the video
    const frameAnalyses = await Promise.all(
      frameUrls.slice(0, 3).map(frameUrl => analyzeRoomFrame(frameUrl))
    );

    // Aggregate insights from all frames
    const aggregatedAnalysis = aggregateFrameAnalyses(frameAnalyses);

    // Match with products
    const allProducts = await getAllProducts({ isActive: true });
    const suggestedProducts = matchProductsToRecommendations(
      aggregatedAnalysis.recommendations, 
      allProducts
    );

    // Save to database
    const videoAnalysis: InsertVideoAnalysis = {
      videoId,
      userId,
      roomType: aggregatedAnalysis.roomType,
      userSelectedRoomType: undefined,
      roomSize: aggregatedAnalysis.roomSize,
      currentStyle: aggregatedAnalysis.currentStyle,
      lightingCondition: aggregatedAnalysis.lightingCondition,
      colorScheme: aggregatedAnalysis.colorScheme,
      budgetTier: undefined,
      suggestedStyles: JSON.stringify(aggregatedAnalysis.suggestedStyles),
      suggestedProducts: JSON.stringify(suggestedProducts),
      productPlacements: undefined,
      analysisText: aggregatedAnalysis.analysisText,
      transformedImageEconomy: undefined,
      transformedImageMidRange: undefined,
      transformedImagePremium: undefined,
      transformedImageLuxury: undefined
    };

    await createVideoAnalysis(videoAnalysis);
    await updateVideoStatus(videoId, "completed");

    return {
      success: true,
      analysis: videoAnalysis
    };

  } catch (error) {
    console.error("[VideoAnalysis] Error in advanced analysis:", error);
    await updateVideoStatus(videoId, "failed");
    throw error;
  }
}

/**
 * Analyzes a single video frame using vision capabilities
 */
async function analyzeRoomFrame(frameUrl: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert interior designer. Analyze this room image and provide detailed insights."
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: frameUrl,
              detail: "high"
            }
          },
          {
            type: "text",
            text: "Analyze this room image. Identify: room type, size, current furniture, style, lighting, colors, and what improvements could be made."
          }
        ] as any
      }
    ]
  });

  return response.choices[0].message.content || "";
}

/**
 * Aggregates multiple frame analyses into a single comprehensive analysis
 */
function aggregateFrameAnalyses(analyses: any[]) {
  // This is a simplified aggregation
  // In production, you'd use more sophisticated logic or another LLM call
  return {
    roomType: "living room", // Extract from analyses
    roomSize: "medium",
    currentStyle: "modern",
    lightingCondition: "bright",
    colorScheme: "neutral with accent colors",
    suggestedStyles: ["modern", "minimalist", "scandinavian"],
    recommendations: [
      {
        category: "furniture",
        items: ["sofa", "coffee table", "bookshelf"],
        reasoning: "Based on room layout and available space"
      },
      {
        category: "decor",
        items: ["wall art", "plants", "throw pillows"],
        reasoning: "To add personality and warmth to the space"
      }
    ],
    analysisText: "Comprehensive analysis based on video frames..."
  };
}
