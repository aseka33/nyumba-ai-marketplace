/**
 * Video Processing Utilities
 * Extracts frames from uploaded videos using FFmpeg
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface VideoFrame {
  framePath: string;
  timestamp: number;
}

/**
 * Extract a single frame from video at specified timestamp
 */
export async function extractFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number = 3 // seconds
): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Extract frame using FFmpeg
    const command = `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}" -y`;
    
    await execAsync(command);

    return outputPath;
  } catch (error) {
    console.error('Frame extraction error:', error);
    throw new Error(`Failed to extract frame: ${error.message}`);
  }
}

/**
 * Extract multiple frames from video at different timestamps
 */
export async function extractMultipleFrames(
  videoPath: string,
  outputDir: string,
  timestamps: number[] = [1, 3, 5, 7, 10]
): Promise<VideoFrame[]> {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const frames: VideoFrame[] = [];

    for (const timestamp of timestamps) {
      const framePath = path.join(outputDir, `frame_${timestamp}s.jpg`);
      await extractFrame(videoPath, framePath, timestamp);
      frames.push({ framePath, timestamp });
    }

    return frames;
  } catch (error) {
    console.error('Multiple frame extraction error:', error);
    throw new Error(`Failed to extract frames: ${error.message}`);
  }
}

/**
 * Get video metadata (duration, dimensions, etc.)
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
}> {
  try {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of json "${videoPath}"`;
    
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const stream = data.streams[0];
    const [fpsNum, fpsDen] = stream.r_frame_rate.split('/').map(Number);
    
    return {
      duration: parseFloat(stream.duration),
      width: stream.width,
      height: stream.height,
      fps: fpsNum / fpsDen
    };
  } catch (error) {
    console.error('Video metadata error:', error);
    throw new Error(`Failed to get video metadata: ${error.message}`);
  }
}

/**
 * Extract the best frame from video (middle frame with good lighting)
 */
export async function extractBestFrame(
  videoPath: string,
  outputPath: string
): Promise<string> {
  try {
    // Get video duration
    const metadata = await getVideoMetadata(videoPath);
    
    // Extract frame from middle of video (usually has best lighting)
    const timestamp = Math.min(metadata.duration / 2, 5); // Max 5 seconds in
    
    return await extractFrame(videoPath, outputPath, timestamp);
  } catch (error) {
    console.error('Best frame extraction error:', error);
    // Fallback to 3 seconds if metadata fails
    return await extractFrame(videoPath, outputPath, 3);
  }
}

/**
 * Create thumbnail from video
 */
export async function createThumbnail(
  videoPath: string,
  thumbnailPath: string,
  width: number = 400
): Promise<string> {
  try {
    const outputDir = path.dirname(thumbnailPath);
    await fs.mkdir(outputDir, { recursive: true });

    const command = `ffmpeg -i "${videoPath}" -ss 3 -vframes 1 -vf scale=${width}:-1 -q:v 2 "${thumbnailPath}" -y`;
    
    await execAsync(command);

    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw new Error(`Failed to create thumbnail: ${error.message}`);
  }
}
