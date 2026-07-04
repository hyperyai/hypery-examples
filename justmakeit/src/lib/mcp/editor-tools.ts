/**
 * MCP Tools for Content Editing and Manipulation
 * These tools allow the AI to open, edit, and manipulate various content types
 * in specialized viewers/editors (images, 3D models, audio, video, etc.)
 */

import type { MCPToolHandler } from './registry';

type MCPTool = MCPToolHandler;

/**
 * Open content in a specialized viewer/editor
 */
export const editorOpenTool: MCPTool = {
  name: 'editor_open',
  description: 'Open content in a specialized viewer or editor. Supports images, 3D models, audio, video, and more. This makes the content visible and editable in the IDE.',
  inputSchema: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        description: 'Type of content to open',
        enum: ['image', '3d-model', 'audio', 'video', 'pdf', 'markdown'],
      },
      contentUrl: {
        type: 'string',
        description: 'URL or path to the content',
      },
      contentId: {
        type: 'string',
        description: 'Optional: ID of the content (for generated content)',
      },
      editorMode: {
        type: 'string',
        description: 'Mode to open in: "view" (read-only) or "edit" (editable)',
        enum: ['view', 'edit'],
        default: 'view',
      },
      metadata: {
        type: 'object',
        description: 'Optional: Additional metadata about the content (title, description, etc.)',
      },
    },
    required: ['contentType', 'contentUrl'],
  },
  handler: async (args, context) => {
    const { contentType, contentUrl, contentId, editorMode = 'view', metadata = {} } = args;
    const { addChatMessage } = context;

    // Add a message to chat with content viewer data
    addChatMessage({
      role: 'assistant',
      content: `Opening ${contentType} in ${editorMode} mode...`,
      contentViews: [{
        type: contentType,
        url: contentUrl,
        id: contentId,
        mode: editorMode,
        metadata,
      }],
    });

    return {
      content: [{
        type: 'text',
        text: `✅ ${contentType} opened in ${editorMode} mode\n\n📍 URL: ${contentUrl}\n🎨 Editor Mode: ${editorMode}\n\nThe content is now visible in the chat. ${editorMode === 'edit' ? 'You can use editor_modify to make changes.' : ''}`,
      }],
      isError: false,
      success: true,
      contentView: {
        type: contentType,
        url: contentUrl,
        id: contentId,
        mode: editorMode,
      },
    };
  },
};

/**
 * Modify content in an open editor
 */
export const editorModifyTool: MCPTool = {
  name: 'editor_modify',
  description: 'Modify content in an open editor. Apply transformations, filters, edits to images, 3D models, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'ID of the content to modify',
      },
      contentType: {
        type: 'string',
        description: 'Type of content',
        enum: ['image', '3d-model', 'audio', 'video'],
      },
      operation: {
        type: 'string',
        description: 'Operation to perform (e.g., "resize", "crop", "rotate", "filter", "adjust-lighting")',
      },
      parameters: {
        type: 'object',
        description: 'Parameters for the operation',
      },
    },
    required: ['contentId', 'contentType', 'operation'],
  },
  handler: async (args, context) => {
    const { contentId, contentType, operation, parameters = {} } = args;
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

    // This would call an API endpoint to perform the modification
    // For now, provide guidance on implementation
    return {
      content: [{
        type: 'text',
        text: `🎨 **Editor Modification Request**\n\nContent ID: ${contentId}\nType: ${contentType}\nOperation: ${operation}\nParameters: ${JSON.stringify(parameters, null, 2)}\n\n⚠️ To implement:\n1. Create /api/v1/${contentType}/modify endpoint\n2. Implement operation handlers (${operation})\n3. Return modified content URL\n\nOnce implemented, the modified content will be displayed automatically.`,
      }],
      isError: false,
      success: true,
      requiresImplementation: true,
      modificationRequest: {
        contentId,
        contentType,
        operation,
        parameters,
      },
    };
  },
};

/**
 * List available editor operations for a content type
 */
export const editorListOperationsTool: MCPTool = {
  name: 'editor_list_operations',
  description: 'List available editing operations for a specific content type (e.g., what can be done to an image or 3D model)',
  inputSchema: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        description: 'Type of content',
        enum: ['image', '3d-model', 'audio', 'video'],
      },
    },
    required: ['contentType'],
  },
  handler: async (args) => {
    const { contentType } = args;

    const operations: Record<string, string[]> = {
      'image': [
        'resize - Change image dimensions',
        'crop - Cut out a portion of the image',
        'rotate - Rotate the image',
        'flip - Flip horizontally or vertically',
        'adjust-brightness - Adjust image brightness',
        'adjust-contrast - Adjust image contrast',
        'adjust-saturation - Adjust color saturation',
        'filter-blur - Apply blur effect',
        'filter-sharpen - Sharpen the image',
        'filter-grayscale - Convert to black and white',
        'filter-sepia - Apply sepia tone',
        'add-text - Add text overlay',
        'remove-background - Remove image background (AI)',
        'upscale - Increase resolution (AI)',
        'style-transfer - Apply artistic style (AI)',
      ],
      '3d-model': [
        'rotate - Rotate the 3D model',
        'scale - Change model size',
        'translate - Move model position',
        'change-material - Change surface material/texture',
        'change-color - Change model color',
        'add-lighting - Add light sources',
        'export-format - Export to different format (OBJ, FBX, GLTF)',
        'simplify - Reduce polygon count',
        'subdivide - Increase detail',
        'apply-texture - Apply texture map',
      ],
      'audio': [
        'trim - Cut audio segment',
        'fade-in - Add fade in effect',
        'fade-out - Add fade out effect',
        'adjust-volume - Change volume level',
        'normalize - Normalize audio levels',
        'change-speed - Speed up or slow down',
        'change-pitch - Adjust pitch',
        'add-reverb - Add reverb effect',
        'add-echo - Add echo effect',
        'remove-noise - Remove background noise (AI)',
        'separate-vocals - Isolate vocals (AI)',
      ],
      'video': [
        'trim - Cut video segment',
        'crop - Crop video frame',
        'resize - Change video dimensions',
        'rotate - Rotate video',
        'adjust-brightness - Adjust video brightness',
        'adjust-speed - Speed up or slow down',
        'add-text - Add text overlay',
        'add-music - Add background music',
        'stabilize - Stabilize shaky video (AI)',
        'remove-background - Remove/replace background (AI)',
        'enhance-quality - Improve video quality (AI)',
      ],
    };

    const availableOps = operations[contentType] || [];

    return {
      content: [{
        type: 'text',
        text: `🛠️ **Available ${contentType} Operations**\n\n${availableOps.map(op => `• ${op}`).join('\n')}\n\nUse editor_modify to apply any of these operations.`,
      }],
      isError: false,
      success: true,
      operations: availableOps,
    };
  },
};

/**
 * Save modified content
 */
export const editorSaveTool: MCPTool = {
  name: 'editor_save',
  description: 'Save modified content to the workspace or export it',
  inputSchema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'ID of the content to save',
      },
      filePath: {
        type: 'string',
        description: 'Path in workspace to save to (e.g., "assets/hero-image.png")',
      },
      format: {
        type: 'string',
        description: 'Optional: Export format (if different from original)',
      },
    },
    required: ['contentId', 'filePath'],
  },
  handler: async (args, context) => {
    const { contentId, filePath, format } = args;
    const { workspace, updateFile } = context;

    // This would fetch the content and save it
    // For now, provide the interface
    return {
      content: [{
        type: 'text',
        text: `💾 **Saving Content**\n\nContent ID: ${contentId}\nDestination: ${filePath}\n${format ? `Format: ${format}\n` : ''}\n⏳ Fetching content and saving to workspace...\n\n✅ Once implemented, content will be saved to: ${filePath}`,
      }],
      isError: false,
      success: true,
      requiresImplementation: true,
      saveRequest: {
        contentId,
        filePath,
        format,
      },
    };
  },
};

/**
 * Create a new blank canvas/project in an editor
 */
export const editorCreateTool: MCPTool = {
  name: 'editor_create',
  description: 'Create a new blank canvas or project in a specialized editor (blank image, new 3D scene, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        description: 'Type of content to create',
        enum: ['image', '3d-model', 'audio', 'video'],
      },
      template: {
        type: 'string',
        description: 'Optional: Template to start from (e.g., "blank", "grid", "cube")',
      },
      dimensions: {
        type: 'object',
        description: 'Optional: Dimensions for the content (width, height for images, etc.)',
      },
    },
    required: ['contentType'],
  },
  handler: async (args, context) => {
    const { contentType, template = 'blank', dimensions = {} } = args;
    const { addChatMessage } = context;

    // Create a new blank content
    const contentId = `temp-${Date.now()}`;
    
    addChatMessage({
      role: 'assistant',
      content: `Creating new ${contentType} in editor...`,
      contentViews: [{
        type: contentType,
        url: null, // Will be populated once created
        id: contentId,
        mode: 'edit',
        metadata: {
          template,
          dimensions,
          isNew: true,
        },
      }],
    });

    return {
      content: [{
        type: 'text',
        text: `✨ **New ${contentType} Created**\n\nTemplate: ${template}\n${Object.keys(dimensions).length > 0 ? `Dimensions: ${JSON.stringify(dimensions)}\n` : ''}Content ID: ${contentId}\n\n🎨 The editor is now open and ready for modifications.`,
      }],
      isError: false,
      success: true,
      contentView: {
        type: contentType,
        id: contentId,
        mode: 'edit',
        template,
        dimensions,
      },
    };
  },
};

/**
 * Compare two pieces of content side by side
 */
export const editorCompareTool: MCPTool = {
  name: 'editor_compare',
  description: 'Compare two pieces of content side by side (e.g., original vs edited, two versions, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        description: 'Type of content',
        enum: ['image', '3d-model', 'audio', 'video'],
      },
      contentUrl1: {
        type: 'string',
        description: 'URL of first content',
      },
      contentUrl2: {
        type: 'string',
        description: 'URL of second content',
      },
      label1: {
        type: 'string',
        description: 'Label for first content (e.g., "Original")',
      },
      label2: {
        type: 'string',
        description: 'Label for second content (e.g., "Edited")',
      },
    },
    required: ['contentType', 'contentUrl1', 'contentUrl2'],
  },
  handler: async (args, context) => {
    const { contentType, contentUrl1, contentUrl2, label1 = 'Version 1', label2 = 'Version 2' } = args;
    const { addChatMessage } = context;

    addChatMessage({
      role: 'assistant',
      content: `Comparing ${contentType} side by side...`,
      contentViews: [
        {
          type: contentType,
          url: contentUrl1,
          mode: 'view',
          metadata: { label: label1, isComparison: true, comparisonPosition: 'left' },
        },
        {
          type: contentType,
          url: contentUrl2,
          mode: 'view',
          metadata: { label: label2, isComparison: true, comparisonPosition: 'right' },
        },
      ],
    });

    return {
      content: [{
        type: 'text',
        text: `🔍 **Content Comparison**\n\n${label1}: ${contentUrl1}\n${label2}: ${contentUrl2}\n\nBoth ${contentType}s are now displayed side by side for comparison.`,
      }],
      isError: false,
      success: true,
      comparison: {
        type: contentType,
        items: [
          { url: contentUrl1, label: label1 },
          { url: contentUrl2, label: label2 },
        ],
      },
    };
  },
};

/**
 * All editor tools
 */
export const editorTools: MCPTool[] = [
  editorOpenTool,
  editorModifyTool,
  editorListOperationsTool,
  editorSaveTool,
  editorCreateTool,
  editorCompareTool,
];

