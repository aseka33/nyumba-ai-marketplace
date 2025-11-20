/**
 * AI Analysis Service
 * Uses OpenAI Vision API to analyze room images and recommend products
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface UserPreferences {
  budget: 'economy' | 'mid-range' | 'premium' | 'luxury';
  roomType: string;
  favoriteColors: string[];
  stylePreference: string;
  priorities: string[];
  spaceSize: 'small' | 'medium' | 'large';
}

export interface RoomAnalysis {
  roomType: string;
  dimensions: {
    estimatedSize: string;
    ceilingHeight: string;
  };
  lighting: {
    naturalLight: string;
    artificialLight: string;
    suggestions: string[];
  };
  style: {
    current: string;
    recommended: string;
  };
  colors: {
    dominant: string[];
    accent: string[];
    recommendations: string[];
  };
  furniture: {
    existing: string[];
    needed: string[];
    layout: string;
  };
  recommendations: ProductRecommendation[];
}

export interface ProductRecommendation {
  category: string;
  productName: string;
  reason: string;
  placement: string;
  priority: 'high' | 'medium' | 'low';
  estimatedBudget: string;
  position?: {
    x: number; // percentage from left (0-100)
    y: number; // percentage from top (0-100)
  };
  size?: {
    width: number; // percentage of room width (0-100)
    height: number; // percentage of room height (0-100)
  };
}

/**
 * Analyze room image using OpenAI Vision API
 */
export async function analyzeRoom(
  imagePath: string,
  preferences: UserPreferences
): Promise<RoomAnalysis> {
  try {
    // Read image file and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // Create detailed prompt based on user preferences
    const prompt = createAnalysisPrompt(preferences);

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    // Parse AI response
    const analysisText = response.choices[0].message.content;
    const analysis = parseAnalysisResponse(analysisText, preferences);

    return analysis;
  } catch (error: any) {
    console.error('AI analysis error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw new Error(`Failed to analyze room: ${error.message}`);
  }
}

/**
 * Create detailed analysis prompt based on user preferences
 */
function createAnalysisPrompt(preferences: UserPreferences): string {
  const budgetRanges = {
    'economy': 'KES 50,000 - 150,000',
    'mid-range': 'KES 150,000 - 500,000',
    'premium': 'KES 500,000 - 1,000,000',
    'luxury': 'KES 1,000,000+'
  };

  return `You are an expert interior designer analyzing a room for a client in Kenya. 

CLIENT PREFERENCES:
- Budget: ${preferences.budget} (${budgetRanges[preferences.budget]})
- Room Type: ${preferences.roomType}
- Space Size: ${preferences.spaceSize}
- Favorite Colors: ${preferences.favoriteColors.join(', ')}
- Style Preference: ${preferences.stylePreference}
- Priorities: ${preferences.priorities.join(', ')}

Please analyze this room image and provide a detailed assessment in the following JSON format:

{
  "roomType": "detected room type",
  "dimensions": {
    "estimatedSize": "small/medium/large with approximate sqm",
    "ceilingHeight": "estimated height"
  },
  "lighting": {
    "naturalLight": "assessment of natural light",
    "artificialLight": "current artificial lighting",
    "suggestions": ["lighting improvement suggestions"]
  },
  "style": {
    "current": "current style if any furniture exists",
    "recommended": "recommended style based on preferences"
  },
  "colors": {
    "dominant": ["current dominant colors in the room"],
    "accent": ["current accent colors"],
    "recommendations": ["color recommendations based on user preferences"]
  },
  "furniture": {
    "existing": ["list of existing furniture if any"],
    "needed": ["essential furniture pieces needed"],
    "layout": "suggested layout description"
  },
  "recommendations": [
    {
      "category": "furniture/lighting/decor/plants/textiles",
      "productName": "specific product name",
      "reason": "why this product fits the space and preferences",
      "placement": "where to place it in the room",
      "priority": "high/medium/low",
      "estimatedBudget": "price range in KES",
      "position": {
        "x": 30,
        "y": 60
      },
      "size": {
        "width": 40,
        "height": 25
      }
    }
  ]
}

Focus on:
1. Matching the user's ${preferences.stylePreference} style preference
2. Staying within their ${preferences.budget} budget
3. Incorporating their favorite colors: ${preferences.favoriteColors.join(', ')}
4. Addressing their priorities: ${preferences.priorities.join(', ')}
5. Optimizing for ${preferences.spaceSize} space

For each product recommendation, provide:
- "position": {"x": N, "y": N} where x and y are percentages (0-100) from top-left corner
- "size": {"width": N, "height": N} as percentages of room dimensions
- Consider realistic furniture placement (sofas against walls, coffee tables in center, etc.)
- Ensure products don't overlap

Provide 5-8 specific product recommendations that would transform this space.`;
}

/**
 * Parse AI response into structured data
 */
function parseAnalysisResponse(
  responseText: string,
  preferences: UserPreferences
): RoomAnalysis {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as RoomAnalysis;
    }

    // Fallback: create structured response from text
    return createFallbackAnalysis(responseText, preferences);
  } catch (error) {
    console.error('Parse error:', error);
    return createFallbackAnalysis(responseText, preferences);
  }
}

/**
 * Create fallback analysis if JSON parsing fails
 */
function createFallbackAnalysis(
  responseText: string,
  preferences: UserPreferences
): RoomAnalysis {
  return {
    roomType: preferences.roomType,
    dimensions: {
      estimatedSize: preferences.spaceSize,
      ceilingHeight: 'Standard (2.7-3m)'
    },
    lighting: {
      naturalLight: 'Moderate',
      artificialLight: 'To be added',
      suggestions: ['Add ambient lighting', 'Consider task lighting']
    },
    style: {
      current: 'Empty/Minimal',
      recommended: preferences.stylePreference
    },
    colors: {
      dominant: ['White', 'Neutral'],
      accent: [],
      recommendations: preferences.favoriteColors
    },
    furniture: {
      existing: [],
      needed: ['Sofa', 'Coffee Table', 'Lighting', 'Decor'],
      layout: 'Open layout optimized for space'
    },
    recommendations: [
      {
        category: 'furniture',
        productName: 'Modern Sofa Set',
        reason: 'Essential seating for living space',
        placement: 'Against main wall',
        priority: 'high',
        estimatedBudget: 'KES 80,000 - 150,000',
        position: { x: 20, y: 55 },
        size: { width: 45, height: 25 }
      },
      {
        category: 'furniture',
        productName: 'Coffee Table',
        reason: 'Functional centerpiece',
        placement: 'Center of seating area',
        priority: 'high',
        estimatedBudget: 'KES 20,000 - 40,000',
        position: { x: 40, y: 70 },
        size: { width: 20, height: 15 }
      },
      {
        category: 'lighting',
        productName: 'Floor Lamp',
        reason: 'Ambient lighting',
        placement: 'Corner or beside sofa',
        priority: 'medium',
        estimatedBudget: 'KES 15,000 - 25,000',
        position: { x: 75, y: 60 },
        size: { width: 8, height: 20 }
      },
      {
        category: 'decor',
        productName: 'Wall Art',
        reason: 'Add personality and color',
        placement: 'Main wall',
        priority: 'medium',
        estimatedBudget: 'KES 10,000 - 30,000',
        position: { x: 30, y: 20 },
        size: { width: 25, height: 20 }
      },
      {
        category: 'plants',
        productName: 'Indoor Plants',
        reason: 'Natural element and air quality',
        placement: 'Corner or shelf',
        priority: 'low',
        estimatedBudget: 'KES 5,000 - 15,000',
        position: { x: 10, y: 65 },
        size: { width: 10, height: 15 }
      }
    ]
  };
}

/**
 * Match AI recommendations to actual products in database
 */
export async function matchProductsToRecommendations(
  recommendations: ProductRecommendation[],
  db: any // Drizzle DB instance
): Promise<any[]> {
  // This will query the database to find actual products that match the AI recommendations
  // For now, return mock data - will be implemented with actual DB queries
  return [];
}
