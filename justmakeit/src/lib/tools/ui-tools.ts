/**
 * UI Control MCP Tools
 * Implements ui_update for manipulating IDE components
 */

import type { MCPToolHandler } from '../mcp/registry';
import type { FileSystemContext } from './file-tools';

/**
 * Update UI component
 */
export const uiUpdate: MCPToolHandler = {
  name: 'ui_update',
  description: 'Update IDE UI component (e.g., open file in editor)',
  inputSchema: {
    type: 'object',
    properties: {
      component: {
        type: 'string',
        enum: ['editor'],
        description: 'Component to update',
      },
      action: {
        type: 'string',
        enum: ['open', 'focus'],
        description: 'Action to perform',
      },
      data: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path (without file:// prefix)',
          },
        },
        description: 'Action-specific data',
      },
    },
    required: ['component', 'action'],
  },
  handler: async ({ component, action, data }, context) => {
    if (component === 'editor') {
      if (action === 'open' && data?.path) {
        // Check if file exists
        if (!(data.path in context.files)) {
          return {
            content: [{
              type: 'error',
              code: 'FILE_NOT_FOUND',
              message: `Cannot open: file not found: ${data.path}`,
            }],
        isError: true,
        success: false,
      };
        }

        context.setActiveFile(data.path);

        return {
          success: true,
          content: [{
            type: 'text',
            text: `Opened ${data.path} in editor`,
          }],
        };
      }

      if (action === 'focus') {
        return {
          success: true,
          content: [{
            type: 'text',
            text: 'Focused editor',
          }],
        };
      }
    }

    return {
      content: [{
        type: 'error',
        code: 'INVALID_ACTION',
        message: `Unknown action: ${action} for component: ${component}`,
      }],
        isError: true,
        success: false,
      };
  },
};

export const uiTools = [uiUpdate];



