import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ImageData {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export class ImageProcessor {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async processImages(imageUrls: Record<string, string>): Promise<ImageData[]> {
    console.log(`🖼️ Processing ${Object.keys(imageUrls).length} images`);

    const imagePromises = Object.entries(imageUrls).map(async ([key, url]) => {
      try {
        console.log(`📥 Fetching image: ${key} from ${url.substring(0, 50)}...`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${url}. Status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error(`Downloaded 0-byte file from URL: ${url}`);
        }

        const base64Data = this.arrayBufferToBase64(arrayBuffer);
        
        console.log(`✅ Successfully processed ${key} (${arrayBuffer.byteLength} bytes)`);

        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        };
      } catch (error) {
        console.error(`❌ Failed to process image ${key}:`, error);
        throw new Error(`Failed to process image ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    try {
      const results = await Promise.all(imagePromises);
      console.log(`✅ All ${results.length} images processed successfully`);
      return results;
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      throw error;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Alternative method to process images from Supabase Storage paths
   * This could be useful if we want to process images by storage path instead of public URLs
   */
  async processImagesFromStorage(imagePaths: Record<string, string>, bucketName: string = 'cataloging-uploads'): Promise<ImageData[]> {
    console.log(`🗂️ Processing ${Object.keys(imagePaths).length} images from storage bucket: ${bucketName}`);

    const imagePromises = Object.entries(imagePaths).map(async ([key, path]) => {
      try {
        console.log(`📥 Downloading from storage: ${key} at ${path}`);
        
        const { data, error } = await this.supabase.storage
          .from(bucketName)
          .download(path);

        if (error) {
          throw new Error(`Failed to download from storage: ${error.message}`);
        }

        if (!data) {
          throw new Error(`No data received from storage for path: ${path}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error(`Downloaded 0-byte file from storage path: ${path}`);
        }

        const base64Data = this.arrayBufferToBase64(arrayBuffer);
        
        console.log(`✅ Successfully processed ${key} from storage (${arrayBuffer.byteLength} bytes)`);

        return {
          inlineData: {
            mimeType: data.type || "image/jpeg",
            data: base64Data
          }
        };
      } catch (error) {
        console.error(`❌ Failed to process storage image ${key}:`, error);
        throw new Error(`Failed to process storage image ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    try {
      const results = await Promise.all(imagePromises);
      console.log(`✅ All ${results.length} storage images processed successfully`);
      return results;
    } catch (error) {
      console.error('❌ Storage image processing failed:', error);
      throw error;
    }
  }
}