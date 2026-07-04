/**
 * MCP Tools for Capability Discovery and Intelligent Routing
 * These tools allow the AI to discover available capabilities and route requests appropriately
 */

import type { MCPToolHandler } from './registry';

type MCPTool = MCPToolHandler;

/**
 * Discover all available capabilities from the Hypery
 * Returns models grouped by capability type (chat, images, audio, video, 3D, etc.)
 */
export const capabilityDiscoverTool: MCPTool = {
  name: 'capability_discover',
  description: 'Discover available AI models by what they can do. Query by capabilities (text-to-3d, text-to-image, etc.) or modalities (input/output types).',
  inputSchema: {
    type: 'object',
    properties: {
      capabilities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by capabilities (e.g., ["text-to-3d", "image-to-3d"]). Returns models with ANY of these.',
      },
      outputModality: {
        type: 'string',
        description: 'Filter by what the model produces (e.g., "3d-model", "image", "video", "audio").',
      },
      limit: {
        type: 'number',
        description: 'Max models per capability. Default: 10',
        default: 10,
      },
    },
    required: [],
  },
  handler: async (args, context) => {
    const { capabilities, outputModality, limit = 10 } = args;
    const { aiGatewayToken, aiGatewayUrl } = context;

    if (!aiGatewayToken) {
      return {
        success: false,
        content: [{ type: 'error', message: 'Not authenticated' }],
        isError: true,
      };
    }

    try {
      const params = new URLSearchParams();
      
      if (capabilities?.length > 0) {
        params.append('capabilities', capabilities.join(','));
      } else if (outputModality) {
        params.append('outputModality', outputModality);
      }
      
      params.append('limit', '200');

      const response = await fetch(`${aiGatewayUrl}/api/v1/models?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${aiGatewayToken}` },
      });

      if (!response.ok) {
        return {
          success: false,
          content: [{ type: 'error', message: `Failed: ${response.statusText}` }],
          isError: true,
        };
      }

      const data = await response.json();
      // Models endpoint now returns OpenAI format: { object: "list", data: [...] }
      const models = data.data || [];

      // Group by capability
      const grouped: Record<string, any[]> = {};
      for (const model of models) {
        // OpenAI format: model.capabilities is an object { function_calling, vision, reasoning }
        // Convert to array format for grouping
        const capsObj = model.capabilities || {};
        const caps = Object.entries(capsObj)
          .filter(([_, enabled]) => enabled)
          .map(([cap, _]) => cap);
        
        if (caps.length === 0) caps.push('other');
        
        for (const cap of caps) {
          if (!grouped[cap]) grouped[cap] = [];
          if (!grouped[cap].find(m => m.id === model.id)) {
            grouped[cap].push(model);
          }
        }
      }

      // Simple response
      let text = '🎯 Available Models\n\n';
      
      for (const [cap, capModels] of Object.entries(grouped)) {
        const icon = getCapabilityIcon(cap);
        const limited = capModels.slice(0, limit);
        
        text += `${icon} ${formatTypeName(cap)} (${capModels.length})\n`;
        
        for (const model of limited) {
          const modality = model.modalities 
            ? ` [${model.modalities.input.join('+')} → ${model.modalities.output.join('+')}]`
            : '';
          text += `  • ${model.id}${modality}\n`;
        }
        
        if (capModels.length > limit) {
          text += `  ... ${capModels.length - limit} more\n`;
        }
        text += '\n';
      }

      return {
        success: true,
        content: [{ type: 'text', text }],
        isError: false,
        models: grouped,
      };
    } catch (error) {
      return {
        success: false,
        content: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error discovering capabilities',
        }],
        isError: true,
      };
    }
  },
};

// Removed capability_plan - AI can plan on its own

// Removed content_generate - just use image_generate or model_execute directly

/**
 * Helper functions
 */
function getCapabilityIcon(type: string): string {
  const icons: Record<string, string> = {
    'chat': '💬',
    'text-generation': '💬',
    'text-to-image': '🎨',
    'image-to-image': '🖼️',
    'text-to-audio': '🎵',
    'audio': '🎵',
    'text-to-video': '🎬',
    'image-to-video': '🎬',
    'video': '🎬',
    'text-to-3d': '🧊',
    'image-to-3d': '🧊',
    'vision': '👁️',
    'inpainting': '🎨',
    'upscaling': '⬆️',
    'background-removal': '✂️',
    'depth-estimation': '📊',
    'embeddings': '🔢',
    'code-generation': '💻',
    'other': '🔧',
  };
  return icons[type] || '📦';
}

function formatTypeName(type: string): string {
  const names: Record<string, string> = {
    'chat': 'Chat & Text Generation',
    'text-generation': 'Text Generation',
    'text-to-image': 'Text to Image',
    'image-to-image': 'Image to Image',
    'text-to-audio': 'Text to Audio',
    'audio': 'Audio Generation',
    'text-to-video': 'Text to Video',
    'image-to-video': 'Image to Video',
    'video': 'Video Generation',
    'text-to-3d': 'Text to 3D Models',
    'image-to-3d': 'Image to 3D Models',
    'vision': 'Vision (Image Understanding)',
    'inpainting': 'Inpainting',
    'upscaling': 'Image Upscaling',
    'background-removal': 'Background Removal',
    'depth-estimation': 'Depth Estimation',
    'embeddings': 'Embeddings',
    'code-generation': 'Code Generation',
    'other': 'Other Capabilities',
  };
  return names[type] || type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Capability tools
 */
export const capabilityTools: MCPTool[] = [
  capabilityDiscoverTool,
];

