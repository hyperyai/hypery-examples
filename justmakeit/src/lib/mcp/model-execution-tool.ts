/**
 * Generic Model Execution Tool
 * Allows the AI to execute ANY model discovered through capability_discover
 * Handles Replicate, HuggingFace, and other providers dynamically
 */

import type { MCPToolHandler } from './registry';

type MCPTool = MCPToolHandler;

/**
 * Execute any AI model with custom parameters
 * This tool can call ANY model from Replicate, HuggingFace, etc.
 */
export const modelExecuteTool: MCPTool = {
  name: 'model_execute',
  description: 'Execute AI models for 3D, audio, video, or chat. NOT FOR IMAGES - use image_generate! RECOMMENDED FOR CODE: modelId="anthropic/claude-3.5-sonnet", provider="openrouter". For 3D: modelId="gfodor/text2vox", provider="replicate". Replicate=async, OpenRouter=sync.',
  inputSchema: {
    type: 'object',
    properties: {
      modelId: {
        type: 'string',
        description: 'Full model ID. RECOMMENDED: "anthropic/claude-3.5-sonnet" for code/chat, "gfodor/text2vox" for 3D. NOT for images - use image_generate!',
      },
      provider: {
        type: 'string',
        description: 'Model provider: "openrouter" (code/chat, SYNC) or "replicate" (3D/audio/video, ASYNC). For images, use image_generate!',
        enum: ['replicate', 'openrouter'],
      },
      input: {
        type: 'object',
        description: 'For Replicate: {prompt, ...model-specific params}. For OpenRouter: {prompt} or {messages: [{role, content}]}',
      },
    },
    required: ['modelId', 'provider', 'input'],
  },
  handler: async (args, context) => {
    const { modelId, provider, input, waitForCompletion = false } = args;
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
      // For Replicate models, use the predictions API
      if (provider === 'replicate') {
        // Step 1: Start the prediction
        const predictionResponse = await fetch(`${aiGatewayUrl}/api/v1/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiGatewayToken}`, // OAuth token includes app context
          },
          body: JSON.stringify({
            model: modelId, // For Replicate, this is the model ID
            provider: provider, // Provider is required
            input: input,
            wait: waitForCompletion, // Whether to wait for completion
          }),
        });

        if (!predictionResponse.ok) {
          const error = await predictionResponse.json();
          return {
            success: false,
            content: [{
              type: 'error',
              message: `Failed to execute model: ${error.error || predictionResponse.statusText}`,
            }],
            isError: true,
          };
        }

        const predictionData = await predictionResponse.json();
        // Replicate-compatible response: { id, status, output, ... }
        // No wrapper - direct format
        const predictionId = predictionData.id;

        // ALWAYS return immediately - let frontend/user handle polling
        // This prevents expensive AI token usage on repeated status checks
        return {
          success: true,
          content: [{
            type: 'text',
            text: `✅ Model execution started!\n\n🤖 Model: ${modelId}\n🆔 Prediction ID: ${predictionId}\n\n⏳ Replicate models can take several minutes to complete.\nUse model_status with this ID to check progress.`,
          }],
          isError: false,
          predictionId,
          status: 'processing',
        };
      }

      // For OpenRouter, use chat completions API
      if (provider === 'openrouter') {
        // Extract prompt from input (could be "prompt" or "messages")
        let messages: any[];
        
        if (input.messages) {
          messages = input.messages;
        } else if (input.prompt) {
          messages = [{ role: 'user', content: input.prompt }];
        } else {
          return {
            success: false,
            content: [{
              type: 'error',
              message: 'OpenRouter requires either "messages" or "prompt" in input',
            }],
            isError: true,
          };
        }

        const chatResponse = await fetch(`${aiGatewayUrl}/api/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiGatewayToken}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages: messages,
            stream: false,
            ...input, // Include any other parameters (temperature, max_tokens, etc.)
          }),
        });

        if (!chatResponse.ok) {
          const error = await chatResponse.json();
          return {
            success: false,
            content: [{
              type: 'error',
              message: `Failed to execute model: ${error.error || chatResponse.statusText}`,
            }],
            isError: true,
          };
        }

        const chatData = await chatResponse.json();
        const assistantMessage = chatData.choices?.[0]?.message?.content || '';

        return {
          success: true,
          content: [{
            type: 'text',
            text: `✅ Model execution complete!\n\n🤖 Model: ${modelId}\n\n${assistantMessage}`,
          }],
          isError: false,
          output: assistantMessage,
          response: chatData,
        };
      }

      // For other providers, return error
      return {
        content: [{
          type: 'error',
          message: `Provider ${provider} is not yet supported for generic model execution. Supported: replicate, openrouter.`,
        }],
        isError: true,
        success: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error executing model',
        }],
        isError: true,
        success: false,
      };
    }
  },
};

/**
 * Check status of a running model execution
 */
export const modelStatusTool: MCPTool = {
  name: 'model_status',
  description: 'Check the status of a model execution ONCE. If still processing, inform the user to wait - DO NOT call repeatedly. Replicate models take minutes, not seconds.',
  inputSchema: {
    type: 'object',
    properties: {
      predictionId: {
        type: 'string',
        description: 'Prediction ID returned from model_execute',
      },
    },
    required: ['predictionId'],
  },
  handler: async (args, context) => {
    const { predictionId } = args;
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
      const response = await fetch(`${aiGatewayUrl}/api/v1/predictions/${predictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${aiGatewayToken}`, // OAuth token includes app context
        },
      });

      if (!response.ok) {
        return {
          success: false,
          content: [{
            type: 'error',
            message: `Failed to get prediction status: ${response.statusText}`,
          }],
          isError: true,
        };
      }

      const responseData = await response.json();
      // Response structure: { success: true, data: { status, output, ... } }
      const data = responseData.data || responseData;
      
      if (data.status === 'succeeded' || data.status === 'completed') {
        return {
          success: true,
          content: [{
            type: 'text',
            text: `✅ Model execution complete!\n\n📊 Output: ${JSON.stringify(data.output, null, 2)}`,
          }],
          isError: false,
          output: data.output,
          status: 'succeeded',
        };
      } else if (data.status === 'failed') {
        return {
          content: [{
            type: 'error',
            message: `Model execution failed: ${data.error || 'Unknown error'}`,
          }],
        isError: true,
        success: false,
      };
      } else {
        return {
          success: true,
          content: [{
            type: 'text',
            text: `⏳ Model is still processing...\n\nStatus: ${data.status}`,
          }],
          isError: false,
          status: data.status,
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error checking status',
        }],
        isError: true,
        success: false,
      };
    }
  },
};

export const modelExecutionTools = [modelExecuteTool, modelStatusTool];

