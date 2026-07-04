/**
 * MCP Tools for AI Image Generation
 * These tools allow the AI to generate images using the Hypery
 */

import type { MCPToolHandler } from './registry';
type MCPTool = MCPToolHandler;

/**
 * Generate an image from a text prompt
 * This tool internally polls until completion, then auto-saves to workspace
 */
export const imageGenerateTool: MCPTool = {
  name: 'image_generate',
  description: 'Generate an image from a text description. RECOMMENDED: Use provider="openrouter" and model="google/gemini-2.5-flash-image-preview" for best results. Automatically waits for completion and saves to workspace. ALWAYS use this for images (NOT model_execute).',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'A detailed description of the image to generate',
      },
      filename: {
        type: 'string',
        description: 'Filename to save the image as (without extension, .png will be added). Optional, defaults to generated name.',
      },
      provider: {
        type: 'string',
        description: 'Image provider: "openrouter" (RECOMMENDED, faster/cheaper: Gemini, DALL-E) or "replicate" (Flux, SDXL). Optional, defaults to openrouter.',
        enum: ['replicate', 'openrouter'],
      },
      model: {
        type: 'string',
        description: 'Model to use. For openrouter: "google/gemini-2.5-flash-image-preview" (recommended), "openai/dall-e-3". For replicate: "black-forest-labs/flux-schnell". Optional.',
      },
      // Replicate-specific parameters
      width: {
        type: 'number',
        description: 'Image width in pixels (Replicate only). Optional.',
      },
      height: {
        type: 'number',
        description: 'Image height in pixels (Replicate only). Optional.',
      },
      steps: {
        type: 'number',
        description: 'Number of inference steps (Replicate only). Optional.',
      },
      // OpenRouter-specific parameters (Gemini models only)
      aspect_ratio: {
        type: 'string',
        description: 'Aspect ratio for OpenRouter Gemini models: "1:1", "16:9", "9:16", etc. Ignored for Replicate. Optional.',
        enum: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
      },
      // Legacy parameters (ignored by OpenRouter, kept for compatibility)
      size: {
        type: 'string',
        description: 'DEPRECATED: Not used by OpenRouter. Use aspect_ratio instead. Optional.',
      },
      quality: {
        type: 'string',
        description: 'DEPRECATED: Not used by OpenRouter. Optional.',
        enum: ['standard', 'hd'],
      },
      style: {
        type: 'string',
        description: 'DEPRECATED: Not used by OpenRouter. Optional.',
        enum: ['vivid', 'natural'],
      },
    },
    required: ['prompt'],
  },
  handler: async (args, context) => {
    const { prompt, filename, provider = 'openrouter', model, width, height, steps, size, quality, style, aspect_ratio } = args;
    const { aiGatewayToken, aiGatewayUrl } = context;

    if (!aiGatewayToken) {
      return {
        content: [{
          type: 'error',
          message: 'Not authenticated with Hypery',
        }],
        isError: true,
        success: false,
      };
    }

    try {
      // Step 1: Start generation
      const requestBody: any = {
        prompt,
        provider,
      };

      // Set default model based on provider if not specified
      if (model) {
        requestBody.model = model;
      } else {
        // Use recommended defaults
        requestBody.model = provider === 'openrouter' 
          ? 'google/gemini-2.5-flash-image-preview'  // Fast, cheap, high quality
          : 'black-forest-labs/flux-schnell';         // Fast Replicate model
      }
      
      // Replicate-specific parameters
      if (width) requestBody.width = width;
      if (height) requestBody.height = height;
      if (steps) requestBody.steps = steps;
      
      // OpenRouter-specific parameters
      if (size) requestBody.size = size;
      if (quality) requestBody.quality = quality;
      if (style) requestBody.style = style;
      if (aspect_ratio) requestBody.aspect_ratio = aspect_ratio;

      console.log('🎨 [IMAGE] Starting generation...');
      const response = await fetch(`${aiGatewayUrl}/api/v1/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiGatewayToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 [IMAGE] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [IMAGE] Error response:', JSON.stringify(errorData, null, 2));
        
        // Return error as tool result - don't throw
        // Chat.tsx will handle the initial request errors, not tool errors
        return {
          success: false,
          content: [{
            type: 'error',
            message: `Image generation failed: ${errorData.error?.message || errorData.detail || errorData.message || response.statusText}`,
          }],
          isError: true,
        };
      }

      const prediction = await response.json();
      console.log('✅ [IMAGE] Successful response:', JSON.stringify(prediction, null, 2).substring(0, 200));
      
      // Replicate format (no wrapper)
      if (prediction.status === 'failed' || prediction.error) {
        return {
          success: false,
          content: [{
            type: 'error',
            message: `Image generation failed: ${prediction.error || 'Unknown error'}`,
          }],
          isError: true,
        };
      }

      const predictionId = prediction.id;
      const initialStatus = prediction.status;
      const initialOutput = prediction.output;
      
      console.log(`✅ [IMAGE] Started prediction: ${predictionId}, status: ${initialStatus}`);

      // Step 2: Check if already completed (OpenRouter is synchronous)
      let imageUrl: string | null = null;
      
      if ((initialStatus === 'succeeded' || initialStatus === 'completed') && initialOutput) {
        // OpenRouter: images returned immediately!
        imageUrl = Array.isArray(initialOutput) ? initialOutput[0] : initialOutput;
        console.log(`✅ [IMAGE] OpenRouter generation complete (synchronous): ${imageUrl}`);
      } else {
        // Replicate: poll until completion (async)
        console.log(`⏳ [IMAGE] Replicate generation started, polling for completion...`);
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max

        while (attempts < maxAttempts && !imageUrl) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        console.log(`⏳ [IMAGE] Checking status (attempt ${attempts + 1}/${maxAttempts})...`);
        
        const statusResponse = await fetch(`${aiGatewayUrl}/api/v1/predictions/${predictionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${aiGatewayToken}`,
          },
        });

        if (statusResponse.ok) {
          const predData = await statusResponse.json();
          // Replicate-compatible response: { id, status, output, ... }
          
          if (predData.status === 'succeeded' || predData.status === 'completed') {
            // Extract image URL
            if (Array.isArray(predData.output)) {
              imageUrl = predData.output[0];
            } else if (typeof predData.output === 'string') {
              imageUrl = predData.output;
            }
            
            if (imageUrl) {
              console.log(`✅ [IMAGE] Generation complete: ${imageUrl}`);
              break;
            }
          } else if (predData.status === 'failed') {
            return {
              success: false,
              content: [{
                type: 'error',
                message: `Image generation failed: ${predData.error || 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
        
        attempts++;
      }

        if (!imageUrl) {
          return {
            success: false,
            content: [{
              type: 'error',
              message: 'Image generation timed out after 2 minutes',
            }],
            isError: true,
          };
        }
      }

      // Step 3: Auto-save to workspace
      if (!imageUrl) {
        throw new Error('No image URL available');
      }
      
      console.log('💾 [IMAGE] Downloading and saving to workspace...');
      
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      const finalFilename = filename || `generated-${Date.now()}`;
      const filepath = `${finalFilename}.png`;
      
      // Save to workspace using context.updateFile
      // Format: data URL for images
      const dataUrl = `data:image/png;base64,${base64Image}`;
      context.updateFile(filepath, dataUrl);
      
      console.log(`✅ [IMAGE] Saved to workspace: ${filepath}`);
      
      return {
        success: true,
        content: [{
          type: 'text',
          text: `✅ Image generated and saved!\n\n🖼️ File: ${filepath}\n📝 Prompt: ${prompt}${model ? `\n🤖 Model: ${model}` : ''}\n🔗 URL: ${imageUrl}\n\nThe image has been saved to your workspace!`,
        }],
        isError: false,
        imageUrl,
        filepath,
      };
    } catch (error) {
      console.error('❌ [IMAGE] Error:', error);
      
      // Always return as tool error - don't throw
      return {
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error generating image',
        }],
        isError: true,
        success: false,
      };
    }
  },
};

/**
 * List available image generation models
 */
export const imageListModelsTool: MCPTool = {
  name: 'image_list_models',
  description: 'List available AI models for image generation with their capabilities',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (args, context) => {
    const { aiGatewayToken, aiGatewayUrl } = context;

    if (!aiGatewayToken) {
      return {
        content: [{
          type: 'error',
          message: 'Not authenticated with Hypery',
        }],
        isError: true,
        success: false,
      };
    }

    try {
      const response = await fetch(`${aiGatewayUrl}/api/models?type=image`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${aiGatewayToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          content: [{
            type: 'error',
            message: `Failed to fetch models: ${response.statusText}`,
          }],
          isError: true,
        };
      }

      const data = await response.json();
      const models = data.models || [];

      const modelList = models
        .filter((m: any) => m.type === 'image')
        .slice(0, 10) // Show top 10
        .map((m: any) => `- ${m.modelId} (${m.provider})${m.description ? ': ' + m.description : ''}`)
        .join('\n');

      return {
        success: true,
        content: [{
          type: 'text',
          text: `Available Image Generation Models:\n\n${modelList}\n\nTotal: ${models.length} models available`,
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error fetching models',
        }],
        isError: true,
        success: false,
      };
    }
  },
};

/**
 * Check the status of an image generation
 */
export const imageStatusTool: MCPTool = {
  name: 'image_status',
  description: 'Check the status of an image generation by its ID. Use this to see if an image is ready.',
  inputSchema: {
    type: 'object',
    properties: {
      imageId: {
        type: 'string',
        description: 'The ID of the image to check',
      },
    },
    required: ['imageId'],
  },
  handler: async (args, context) => {
    const { imageId } = args;
    const { aiGatewayToken, aiGatewayUrl } = context;

    if (!aiGatewayToken) {
      return {
        content: [{
          type: 'error',
          message: 'Not authenticated with Hypery',
        }],
        isError: true,
        success: false,
      };
    }

    try {
      const response = await fetch(`${aiGatewayUrl}/api/v1/images/${imageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${aiGatewayToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          content: [{
            type: 'error',
            message: `Failed to get image status: ${response.statusText}`,
          }],
          isError: true,
        };
      }

      const data = await response.json();
      const image = data.image;
      
      if (!image) {
        return {
          success: false,
          content: [{
            type: 'error',
            message: 'Image not found',
          }],
          isError: true,
        };
      }

      const status = image.status;
      const images = image.images || [];

      if (status === 'succeeded' && images.length > 0) {
        const imageUrl = images[0].url || images[0];
        return {
          success: true,
          status: 'succeeded',
          imageUrl: imageUrl, // Direct access for template variables
          images: images, // Array for compatibility
          content: [{
            type: 'text',
            text: `✅ Image is ready!\n\n🖼️ URL: ${imageUrl}\n📝 Prompt: ${image.prompt}\n🤖 Model: ${image.model}\n\nYou can view the image at the URL above!`,
          }],
          isError: false,
        };
      } else if (status === 'failed') {
        return {
          success: false,
          status: 'failed',
          imageUrl: null,
          images: [],
          content: [{
            type: 'error',
            message: `Image generation failed: ${image.error || 'Unknown error'}`,
          }],
          isError: true,
        };
      } else {
        return {
          success: false,
          status: status,
          imageUrl: null,
          images: [],
          content: [{
            type: 'text',
            text: `⏳ Image is still processing...\n\nStatus: ${status}\nPrompt: ${image.prompt}\n\nPlease wait a moment and check again.`,
          }],
          isError: false,
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error checking image status',
        }],
        isError: true,
        success: false,
      };
    }
  },
};

/**
 * All image generation tools
 */
export const imageTools: MCPTool[] = [
  imageGenerateTool,
  imageStatusTool,
  imageListModelsTool,
];

