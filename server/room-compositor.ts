/**
 * Room Compositor Service
 * Composites product images onto room images to create "after" visualization
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import type { ProductRecommendation } from './ai-analyzer';

export interface CompositeResult {
  afterImageBase64: string;
  productPositions: Array<{
    productName: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

/**
 * Composite products onto room image
 */
export async function compositeProductsOntoRoom(
  roomImagePath: string,
  recommendations: ProductRecommendation[],
  productImages: Map<string, string> // productName -> image URL or path
): Promise<CompositeResult> {
  try {
    // Load the room image
    const roomImage = sharp(roomImagePath);
    const roomMetadata = await roomImage.metadata();
    const roomWidth = roomMetadata.width || 1280;
    const roomHeight = roomMetadata.height || 720;

    console.log(`Room dimensions: ${roomWidth}x${roomHeight}`);

    // Prepare composite layers
    const composites: Array<{
      input: Buffer;
      top: number;
      left: number;
    }> = [];

    const productPositions: Array<{
      productName: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    // Process each recommendation
    for (const rec of recommendations) {
      if (!rec.position || !rec.size) {
        console.log(`Skipping ${rec.productName} - no position/size data`);
        continue;
      }

      // Get product image (use placeholder if not found)
      const productImagePath = productImages.get(rec.productName);
      if (!productImagePath) {
        console.log(`No image found for ${rec.productName}, using placeholder`);
        continue;
      }

      // Calculate actual pixel positions
      const left = Math.round((rec.position.x / 100) * roomWidth);
      const top = Math.round((rec.position.y / 100) * roomHeight);
      const width = Math.round((rec.size.width / 100) * roomWidth);
      const height = Math.round((rec.size.height / 100) * roomHeight);

      console.log(`Placing ${rec.productName} at (${left}, ${top}) with size ${width}x${height}`);

      try {
        // Load and resize product image
        let productBuffer: Buffer;
        
        if (productImagePath.startsWith('http')) {
          // Download from URL
          const response = await fetch(productImagePath);
          const arrayBuffer = await response.arrayBuffer();
          productBuffer = Buffer.from(arrayBuffer);
        } else {
          // Load from file
          productBuffer = await fs.readFile(productImagePath);
        }

        // Resize product image to fit the specified size
        // Add a subtle drop shadow for depth
        const processedProduct = await sharp(productBuffer)
          .resize(width, height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();

        composites.push({
          input: processedProduct,
          top,
          left
        });

        productPositions.push({
          productName: rec.productName,
          x: left,
          y: top,
          width,
          height
        });

      } catch (error) {
        console.error(`Error processing ${rec.productName}:`, error);
      }
    }

    // Composite all products onto the room image
    const resultImage = await roomImage
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert to base64
    const afterImageBase64 = `data:image/jpeg;base64,${resultImage.toString('base64')}`;

    return {
      afterImageBase64,
      productPositions
    };

  } catch (error) {
    console.error('Room composition error:', error);
    throw new Error(`Failed to composite products: ${error.message}`);
  }
}

/**
 * Match AI recommendations to actual database products and get their images
 */
export async function matchRecommendationsToProducts(
  recommendations: ProductRecommendation[],
  db: any // Drizzle DB instance
): Promise<Map<string, string>> {
  const productImages = new Map<string, string>();

  // For now, we'll use the seeded products from the database
  // In a real implementation, this would do fuzzy matching between
  // AI recommendations and actual products

  try {
    const { products } = await import('../drizzle/schema');
    const { eq, like, or } = await import('drizzle-orm');

    for (const rec of recommendations) {
      // Try to find a matching product in the database
      const matchingProducts = await db
        .select()
        .from(products)
        .where(
          or(
            like(products.name, `%${rec.productName}%`),
            like(products.name, `%${rec.category}%`),
            eq(products.category, rec.category)
          )
        )
        .limit(1);

      if (matchingProducts.length > 0) {
        const product = matchingProducts[0];
        // Use the first image from the product
        if (product.images && product.images.length > 0) {
          productImages.set(rec.productName, product.images[0]);
          console.log(`Matched "${rec.productName}" to product "${product.name}"`);
        }
      } else {
        console.log(`No database match for "${rec.productName}"`);
      }
    }

    return productImages;

  } catch (error) {
    console.error('Error matching products:', error);
    return productImages;
  }
}

/**
 * Create a placeholder product image with text
 */
export async function createPlaceholderImage(
  productName: string,
  width: number,
  height: number
): Promise<Buffer> {
  // Create a simple colored rectangle as placeholder
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#e0e0e0" />
      <text x="50%" y="50%" text-anchor="middle" font-size="16" fill="#666">
        ${productName}
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
